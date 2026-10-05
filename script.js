/* I keep the site behavior here. */
'use strict';

// My querySelector shortcuts.
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

// My shared page elements.
const pages = $$('.custom-page');
const menu = $('#navigation-menu');
const detail = $('#detail-dialog');
const contactModal = $('#contact-modal');
const menuButton = $('.custom-menu-toggle');
const propertyCarousel = $('[data-property-carousel]');
const testimonialCarousel = $('[data-testimonial-carousel]');

// My contact modal image pool.
const contactModalImages = [
  'images/losangeles-1.jpg',
  'images/beverlyhills-1.jpg',
  'images/santamonica-1.jpg',
  'images/westhollywood-1.jpg',
  'images/losangeles-2.jpg',
  'images/beverlyhills-2.jpg',
  'images/santamonica-2.jpg',
  'images/westhollywood-2.jpg',
];

let statusFilter = 'all';
let propertyCarouselIndex = 1;
let testimonialCarouselIndex = 0;
let lastContactModalImage = -1;

// I only customize mouse dragging; touch and trackpad stay native.
let propertyCarouselScrollTimer = 0;
let testimonialCarouselScrollFrame = 0;


/* My Featured Properties carousel. */

// I keep the active property centered and mark the two cards beside it.
function applyPropertyCarouselState(index) {
  if (!propertyCarousel) {
    return;
  }

  const slides = $$('.custom-featured-property', propertyCarousel);

  if (!slides.length) {
    return;
  }

  propertyCarouselIndex = Math.max(0, Math.min(slides.length - 1, index));

  slides.forEach((slide, slideIndex) => {
    const isActive = slideIndex === propertyCarouselIndex;
    const isPrev = slideIndex === propertyCarouselIndex - 1;
    const isNext = slideIndex === propertyCarouselIndex + 1;

    slide.classList.toggle('is-active', isActive);
    slide.classList.toggle('is-prev', isPrev);
    slide.classList.toggle('is-next', isNext);
    slide.setAttribute('aria-current', String(isActive));
  });
}

function getPropertySlideLeft(viewport, slide) {
  const maxLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
  const left =
    slide.offsetLeft -
    (viewport.clientWidth - slide.offsetWidth) / 2;

  return Math.min(maxLeft, Math.max(0, left));
}

function centerPropertySlide(behavior = 'smooth') {
  if (!propertyCarousel) {
    return;
  }

  const viewport = $('.custom-featured-properties__viewport', propertyCarousel);
  const slides = $$('.custom-featured-property', propertyCarousel);
  const slide = slides[propertyCarouselIndex];

  if (!viewport || !slide) {
    return;
  }

  applyPropertyCarouselState(propertyCarouselIndex);
  viewport.scrollTo({
    left: getPropertySlideLeft(viewport, slide),
    behavior,
  });
}

// I loop the property carousel at both ends.
function movePropertyCarousel(direction) {
  if (!propertyCarousel) {
    return;
  }

  const slides = $$('.custom-featured-property', propertyCarousel);

  if (!slides.length) {
    return;
  }

  propertyCarouselIndex =
    (propertyCarouselIndex + direction + slides.length) % slides.length;

  centerPropertySlide('smooth');
}


// I switch the layered state only after scrolling settles.
function syncPropertyCarouselFromScroll() {
  if (!propertyCarousel) {
    return;
  }

  const viewport = $('.custom-featured-properties__viewport', propertyCarousel);
  const slides = $$('.custom-featured-property', propertyCarousel);

  if (!viewport || !slides.length) {
    return;
  }

  const viewportCenter = viewport.scrollLeft + viewport.clientWidth / 2;
  let nearestIndex = 0;
  let nearestDistance = Infinity;

  slides.forEach((slide, index) => {
    const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
    const distance = Math.abs(slideCenter - viewportCenter);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  applyPropertyCarouselState(nearestIndex);
}

// I add mouse drag + a soft release without changing native touch scrolling.
const carouselSettleFrames = new WeakMap();

function cancelCarouselSettle(viewport) {
  const frame = carouselSettleFrames.get(viewport);

  if (frame) {
    cancelAnimationFrame(frame);
  }

  carouselSettleFrames.delete(viewport);
  viewport?.classList.remove('is-settling');
}

function getCenteredSlideTarget(viewport, slides, projectedLeft) {
  if (!viewport || !slides.length) {
    return null;
  }

  const maxLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
  let nearest = null;

  slides.forEach((slide, index) => {
    const rawLeft =
      slide.offsetLeft -
      (viewport.clientWidth - slide.offsetWidth) / 2;
    const left = Math.min(maxLeft, Math.max(0, rawLeft));
    const distance = Math.abs(left - projectedLeft);

    if (!nearest || distance < nearest.distance) {
      nearest = { index, left, distance };
    }
  });

  return nearest;
}

function animateCarouselSettle(viewport, targetLeft, onComplete) {
  if (!viewport) {
    return;
  }

  const existingFrame = carouselSettleFrames.get(viewport);

  if (existingFrame) {
    cancelAnimationFrame(existingFrame);
  }

  const maxLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
  const startLeft = viewport.scrollLeft;
  const endLeft = Math.min(maxLeft, Math.max(0, targetLeft));
  const distance = endLeft - startLeft;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  viewport.classList.add('is-settling');

  if (reducedMotion || Math.abs(distance) < 0.5) {
    viewport.scrollLeft = endLeft;
    viewport.classList.remove('is-settling');
    carouselSettleFrames.delete(viewport);
    onComplete?.();
    return;
  }

  const duration = Math.min(720, Math.max(420, 420 + Math.abs(distance) * 0.18));
  const startedAt = performance.now();

  const step = (now) => {
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - Math.pow(1 - progress, 5);

    viewport.scrollLeft = startLeft + distance * eased;

    if (progress < 1) {
      carouselSettleFrames.set(viewport, requestAnimationFrame(step));
      return;
    }

    viewport.scrollLeft = endLeft;
    carouselSettleFrames.delete(viewport);
    viewport.classList.remove('is-settling');
    onComplete?.();
  };

  carouselSettleFrames.set(viewport, requestAnimationFrame(step));
}

function settleCarouselAfterMouseDrag(
  viewport,
  slides,
  velocity,
  setCurrentIndex,
  onComplete,
) {
  if (!viewport || !slides.length) {
    viewport?.classList.remove('is-settling');
    return;
  }

  const maxLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
  const maxMomentum = viewport.clientWidth * 0.85;
  const momentum = Math.max(
    -maxMomentum,
    Math.min(maxMomentum, velocity * 220),
  );
  const projectedLeft = Math.min(
    maxLeft,
    Math.max(0, viewport.scrollLeft + momentum),
  );
  const target = getCenteredSlideTarget(viewport, slides, projectedLeft);

  if (!target) {
    viewport.classList.remove('is-settling');
    return;
  }

  animateCarouselSettle(viewport, target.left, () => {
    setCurrentIndex?.(target.index);
    onComplete?.();
  });
}

function setupDesktopMouseDrag(viewport, {
  onDragStateChange,
  onRelease,
  onScroll,
}) {
  if (!viewport) {
    return;
  }

  let isDragging = false;
  let didDrag = false;
  let startX = 0;
  let startScrollLeft = 0;
  let pointerId = null;
  let lastPointerX = 0;
  let lastPointerTime = 0;
  let scrollVelocity = 0;

  viewport.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) {
      return;
    }

    cancelCarouselSettle(viewport);

    isDragging = true;
    didDrag = false;
    pointerId = event.pointerId;
    startX = event.clientX;
    startScrollLeft = viewport.scrollLeft;
    lastPointerX = event.clientX;
    lastPointerTime = performance.now();
    scrollVelocity = 0;

    viewport.classList.add('is-dragging');
    viewport.setPointerCapture?.(event.pointerId);
    onDragStateChange?.(true, false);
  });

  viewport.addEventListener('pointermove', (event) => {
    if (!isDragging || event.pointerId !== pointerId) {
      return;
    }

    const distance = event.clientX - startX;

    if (!didDrag && Math.abs(distance) > 4) {
      didDrag = true;
      onDragStateChange?.(true, true);
    }

    if (!didDrag) {
      return;
    }

    const now = performance.now();
    const elapsed = Math.max(1, now - lastPointerTime);
    const pointerDelta = event.clientX - lastPointerX;
    const instantScrollVelocity = -pointerDelta / elapsed;

    // I smooth the mouse velocity before release.
    scrollVelocity = scrollVelocity * 0.68 + instantScrollVelocity * 0.32;
    lastPointerX = event.clientX;
    lastPointerTime = now;

    event.preventDefault();
    viewport.scrollLeft = startScrollLeft - distance;
  });

  const finishDrag = (event) => {
    if (!isDragging || event.pointerId !== pointerId) {
      return;
    }

    const releaseDelay = performance.now() - lastPointerTime;

    if (releaseDelay > 80) {
      const decay = Math.max(0, 1 - (releaseDelay - 80) / 220);
      scrollVelocity *= decay;
    }

    scrollVelocity = Math.max(-2.4, Math.min(2.4, scrollVelocity));

    // I keep snapping off until the release animation takes over.
    if (didDrag) {
      viewport.classList.add('is-settling');
    }

    isDragging = false;
    viewport.classList.remove('is-dragging');

    if (viewport.hasPointerCapture?.(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }

    onDragStateChange?.(false, didDrag);
    onRelease?.(didDrag, { velocity: scrollVelocity });

    if (!didDrag) {
      viewport.classList.remove('is-settling');
    }

    // I keep the drag flag through the click that follows pointerup.
    window.setTimeout(() => {
      didDrag = false;
      onDragStateChange?.(false, false);
    }, 0);

    pointerId = null;
  };

  viewport.addEventListener('pointerup', finishDrag);
  viewport.addEventListener('pointercancel', finishDrag);

  viewport.addEventListener(
    'click',
    (event) => {
      if (!didDrag) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    },
    true,
  );

  viewport.addEventListener(
    'scroll',
    () => {
      if (isDragging || viewport.classList.contains('is-settling')) {
        return;
      }

      onScroll?.();
    },
    { passive: true },
  );
}

function setupPropertyCarouselMouseDrag() {
  if (!propertyCarousel) {
    return;
  }

  const viewport = $('.custom-featured-properties__viewport', propertyCarousel);

  setupDesktopMouseDrag(viewport, {
    onRelease: (didDrag, { velocity }) => {
      if (!didDrag) {
        return;
      }

      const slides = $$('.custom-featured-property', propertyCarousel);

      settleCarouselAfterMouseDrag(
        viewport,
        slides,
        velocity,
        (index) => {
          applyPropertyCarouselState(index);
        },
        syncPropertyCarouselFromScroll,
      );
    },
    onScroll: () => {
      if (propertyCarouselScrollTimer) {
        window.clearTimeout(propertyCarouselScrollTimer);
      }

      propertyCarouselScrollTimer = window.setTimeout(() => {
        syncPropertyCarouselFromScroll();
        propertyCarouselScrollTimer = 0;
      }, 140);
    },
  });
}


/* My homepage testimonial carousel. */

// I use JavaScript here only for testimonial controls and desktop mouse drag.
function centerTestimonialSlide(behavior = 'smooth') {
  if (!testimonialCarousel) {
    return;
  }

  const slides = $$('.custom-testimonial__slide', testimonialCarousel);
  const slide = slides[testimonialCarouselIndex];

  if (!slide) {
    return;
  }

  testimonialCarousel.scrollTo({
    left: slide.offsetLeft,
    behavior,
  });

  slides.forEach((item, index) => {
    item.setAttribute(
      'aria-current',
      String(index === testimonialCarouselIndex),
    );
  });
}

function moveTestimonialCarousel(direction) {
  if (!testimonialCarousel) {
    return;
  }

  const slides = $$('.custom-testimonial__slide', testimonialCarousel);

  if (!slides.length) {
    return;
  }

  testimonialCarouselIndex =
    (testimonialCarouselIndex + direction + slides.length) % slides.length;

  centerTestimonialSlide('smooth');
}

function syncTestimonialCarouselFromScroll() {
  if (!testimonialCarousel) {
    return;
  }

  const slides = $$('.custom-testimonial__slide', testimonialCarousel);
  const viewportRect = testimonialCarousel.getBoundingClientRect();
  const viewportCenter = viewportRect.left + viewportRect.width / 2;

  let nearestIndex = 0;
  let nearestDistance = Infinity;

  slides.forEach((slide, index) => {
    const rect = slide.getBoundingClientRect();
    const distance = Math.abs((rect.left + rect.width / 2) - viewportCenter);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  testimonialCarouselIndex = nearestIndex;

  slides.forEach((slide, index) => {
    slide.setAttribute('aria-current', String(index === nearestIndex));
  });
}

function setupTestimonialCarousel() {
  if (!testimonialCarousel) {
    return;
  }

  setupDesktopMouseDrag(testimonialCarousel, {
    onRelease: (didDrag, { velocity }) => {
      if (!didDrag) {
        return;
      }

      const slides = $$('.custom-testimonial__slide', testimonialCarousel);

      settleCarouselAfterMouseDrag(
        testimonialCarousel,
        slides,
        velocity,
        (index) => {
          testimonialCarouselIndex = index;
          slides.forEach((slide, slideIndex) => {
            slide.setAttribute('aria-current', String(slideIndex === index));
          });
        },
        syncTestimonialCarouselFromScroll,
      );
    },
    onScroll: () => {
      if (testimonialCarouselScrollFrame) {
        cancelAnimationFrame(testimonialCarouselScrollFrame);
      }

      testimonialCarouselScrollFrame = requestAnimationFrame(() => {
        syncTestimonialCarouselFromScroll();
        testimonialCarouselScrollFrame = 0;
      });
    },
  });
}


/* My Meet the Team hero. */

// I keep both hero image rotations in CSS.


/* My contact modal. */

// I avoid repeating the same contact-modal photo twice.
function chooseContactModalImage() {
  let next = Math.floor(Math.random() * contactModalImages.length);

  if (
    contactModalImages.length > 1 &&
    next === lastContactModalImage
  ) {
    next = (next + 1) % contactModalImages.length;
  }

  lastContactModalImage = next;

  contactModal.style.setProperty(
    '--custom-contact-modal-image',
    `url("${contactModalImages[next]}")`,
  );
}

// I lock page scrolling while a dialog is open.
function syncDialogState() {
  document.body.classList.toggle(
    'custom-locked',
    menu.open || detail.open || contactModal.open,
  );

  menuButton.setAttribute('aria-expanded', String(menu.open));
}

// I close open dialogs before routing.
function closeDialogs() {
  if (menu.open) {
    menu.close();
  }

  if (detail.open) {
    detail.close();
  }

  if (contactModal.open) {
    contactModal.close();
  }

  syncDialogState();
}

// I open the contact form over a random house image.
function openContactModal() {
  chooseContactModalImage();

  if (menu.open) {
    menu.close();
  }

  if (detail.open) {
    detail.close();
  }

  if (!contactModal.open) {
    contactModal.showModal();
  }

  syncDialogState();

  requestAnimationFrame(() => {
    $('#modal-first-name')?.focus();
  });
}


/* My portfolio filters and hash routing. */

// I apply both Portfolio filters together.
function filterPortfolio() {
  const area = $('#area-filter').value;
  let count = 0;

  $$('#portfolio-grid .custom-property-card').forEach((card) => {
    const areaMatches = area === 'all' || card.dataset.area === area;
    const statusMatches =
      statusFilter === 'all' || card.dataset.status === statusFilter;

    card.hidden = !(areaMatches && statusMatches);

    if (!card.hidden) {
      count += 1;
    }
  });

  $('#portfolio-count').textContent = count
    ? `${count} ${count === 1 ? 'home' : 'homes'}`
    : 'No homes match these filters. Try another neighborhood or status.';

  $$('[data-filter]').forEach((button) => {
    button.setAttribute(
      'aria-pressed',
      String(button.dataset.filter === statusFilter),
    );
  });
}

// I use the hash to switch between page sections.
function route(focus = true) {
  // I leave normal #section anchors alone.
  if (location.hash && !location.hash.startsWith('#/')) {
    return;
  }

  const [slug, query = ''] = location.hash.replace(/^#\/?/, '').split('?');
  const requestedPage = slug || 'home';
  const matchedPage = pages.find((item) => item.dataset.page === requestedPage);
  const page = matchedPage || pages.find((item) => item.dataset.page === '404');

  if (!page) {
    return;
  }

  closeDialogs();

  pages.forEach((item) => {
    item.hidden = item !== page;
  });

  document.body.dataset.page = page.dataset.page;

  const title =
    page.dataset.page === 'home'
      ? 'Los Angeles Real Estate'
      : page.dataset.page === '404'
        ? '404 Page Not Found'
        : page.dataset.page
            .split('-')
            .map((word) => word[0].toUpperCase() + word.slice(1))
            .join(' ');

  document.title = `${title} | Rochelle + Roger`;

  const href =
    matchedPage && page.dataset.page === 'home'
      ? '#/'
      : matchedPage
        ? '#/' + page.dataset.page
        : '';

  $$('.custom-header a, .custom-menu a').forEach((link) => {
    if (link.getAttribute('href') === href) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });

  const params = new URLSearchParams(query);

  if (matchedPage && slug === 'portfolio') {
    statusFilter = 'all';

    const area = params.get('area');
    const hasArea = [...$('#area-filter').options].some(
      (option) => option.value === area,
    );

    $('#area-filter').value = hasArea ? area : 'all';
    filterPortfolio();
  }

  window.scrollTo({ top: 0, behavior: 'instant' });

  if (focus) {
    $('#main').focus({ preventScroll: true });
  }

  if (matchedPage && (slug || 'home') === 'home') {
    requestAnimationFrame(() => centerPropertySlide('auto'));
  }

  if (matchedPage && slug === 'neighborhoods') {
    const target = document.getElementById('area-' + params.get('area'));

    if (target) {
      target.scrollIntoView({ behavior: 'instant' });
    }
  }
}


/* My property detail dialog. */

// I build the property dialog from the clicked card.
function openProperty(card) {
  if (!card) {
    return;
  }

  const content = $('#detail-content');
  const imageSource = $('img', card);

  content.replaceChildren();

  if (!imageSource) {
    return;
  }

  const image = imageSource.cloneNode();
  image.className = 'custom-detail__image';

  const body = document.createElement('div');
  body.className = 'custom-detail__body';

  const title = document.createElement('h2');
  title.textContent =
    card.dataset.title ||
    $('h3', card)?.textContent?.trim() ||
    'Property';

  const location = document.createElement('p');
  location.className = 'custom-eyebrow';
  location.textContent =
    card.dataset.location ||
    $('.custom-eyebrow', card)?.textContent?.trim() ||
    '';

  const details = document.createElement('p');
  details.textContent =
    card.dataset.details ||
    $('.custom-property-card__info > p:last-child', card)
      ?.textContent?.trim() ||
    '';

  const link = document.createElement('a');
  link.className = 'custom-button';
  link.href = '#contact-modal';
  link.dataset.openContactModal = '';
  link.textContent = 'Discuss Your Search';

  body.append(location, title, details, link);
  content.append(image, body);

  detail.showModal();
  syncDialogState();
}


/* My header and Home Valuation behavior. */

// I switch the header style after leaving the top.
function syncHeader() {
  $('.custom-header').classList.toggle(
    'custom-header--scrolled',
    window.scrollY > 24,
  );
}

// I switch between the two valuation steps here.
function valuationStep(next) {
  const first = $('#valuation-step-1');
  const second = $('#valuation-step-2');

  if (
    next &&
    !$$('input, select', first).every((input) => input.reportValidity())
  ) {
    return;
  }

  first.hidden = next;
  second.hidden = !next;
  second.disabled = !next;

  $(next ? '#valuation-name' : '#address').focus();
}


/* My shared site events. */

// I handle repeated buttons and links from one click listener.
document.addEventListener('click', (event) => {
  const target = event.target.closest('button, a');

  if (!target) {
    return;
  }

  if (target.matches('.custom-skip-link')) {
    event.preventDefault();
    $('#main').focus();
  }

  if (target.matches('.custom-menu-toggle')) {
    menu.showModal();
    syncDialogState();
  }

  if (target.hasAttribute('data-open-contact-modal')) {
    event.preventDefault();
    openContactModal();
  }

  if (target.hasAttribute('data-close-contact-modal')) {
    contactModal.close();
    syncDialogState();
  }

  if (target.hasAttribute('data-close-menu')) {
    menu.close();
    syncDialogState();
  }

  if (target.hasAttribute('data-close-detail')) {
    detail.close();
    syncDialogState();
  }

  if (target.hasAttribute('data-property-carousel-prev')) {
    movePropertyCarousel(-1);
  }

  if (target.hasAttribute('data-property-carousel-next')) {
    movePropertyCarousel(1);
  }

  if (target.hasAttribute('data-testimonial-prev')) {
    moveTestimonialCarousel(-1);
  }

  if (target.hasAttribute('data-testimonial-next')) {
    moveTestimonialCarousel(1);
  }

  if (target.hasAttribute('data-property')) {
    openProperty(
      target.closest('.custom-property-card, .custom-featured-property'),
    );
  }

  if (target.hasAttribute('data-filter')) {
    statusFilter = target.dataset.filter;
    filterPortfolio();
  }

  if (target.id === 'valuation-next') {
    valuationStep(true);
  }

  if (target.id === 'valuation-back') {
    valuationStep(false);
  }

  if (target.dataset.scroll) {
    event.preventDefault();
    document.getElementById(target.dataset.scroll)?.scrollIntoView();
  }

  if (target.matches('a[href^="#/"]')) {
    closeDialogs();

    if (target.getAttribute('href') === location.hash) {
      window.scrollTo({ top: 0 });
    }
  }
});

// I only wire this dropdown when the Portfolio page has it.
document.addEventListener('change', (event) => {
  if (event.target.id === 'area-filter') {
    filterPortfolio();
  }
});

// I keep the demo form confirmation in one place.
document.addEventListener('submit', (event) => {
  if (
    !event.target.matches(
      '#contact-form, #valuation-form, #contact-modal-form',
    )
  ) {
    return;
  }

  event.preventDefault();

  const results = {
    'contact-form': '#contact-result',
    'valuation-form': '#valuation-result',
    'contact-modal-form': '#contact-modal-result',
  };

  const result = $(results[event.target.id]);

  result.hidden = false;
  result.textContent =
    'Thank you. Your form is complete.';
  result.setAttribute('tabindex', '-1');
  result.focus();
});

// I keep dialog state synced and close on outside clicks.
[menu, detail, contactModal].forEach((dialog) => {
  dialog.addEventListener('close', syncDialogState);

  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) {
      return;
    }

    const bounds = dialog.getBoundingClientRect();
    const clickedOutside =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom;

    if (clickedOutside) {
      dialog.close();
    }
  });
});

window.addEventListener('hashchange', () => route());
window.addEventListener('scroll', syncHeader, { passive: true });
window.addEventListener(
  'resize',
  () => {
    centerPropertySlide('auto');
    centerTestimonialSlide('auto');
  },
  { passive: true },
);


/* My startup calls. */

$('#copyright-year').textContent = new Date().getFullYear();

route(false);
syncHeader();
setupPropertyCarouselMouseDrag();
setupTestimonialCarousel();
requestAnimationFrame(() => {
  centerPropertySlide('auto');
  centerTestimonialSlide('auto');
});
