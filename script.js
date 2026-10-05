/*
 * Site behavior only.
 * I keep the page structure in index.html and the visual styling in the CSS files.
 */
'use strict';

// Small shortcuts so I do not have to repeat querySelector everywhere.
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

// Main elements I reuse throughout the site.
const pages = $$('.custom-page');
const menu = $('#navigation-menu');
const detail = $('#detail-dialog');
const contactModal = $('#contact-modal');
const menuButton = $('.custom-menu-toggle');
const propertyCarousel = $('[data-property-carousel]');
const testimonialCarousel = $('[data-testimonial-carousel]');

// The contact modal picks one of these home images each time it opens.
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

// Mouse drag state for the Featured Properties carousel.
let propertyCarouselDragStartX = 0;
let propertyCarouselDragStartScroll = 0;
let propertyCarouselDidDrag = false;
let propertyCarouselScrollFrame = 0;
let testimonialCarouselScrollFrame = 0;


/* ------------------------------
   FEATURED PROPERTY CAROUSEL
   ------------------------------ */

// Keep the active property centered inside the horizontal gallery.
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

  const slideRect = slide.getBoundingClientRect();
  const viewportRect = viewport.getBoundingClientRect();
  const left =
    viewport.scrollLeft +
    (slideRect.left - viewportRect.left) -
    (viewport.clientWidth - slide.clientWidth) / 2;

  viewport.scrollTo({ left, behavior });

  slides.forEach((item, index) => {
    item.setAttribute(
      'aria-current',
      String(index === propertyCarouselIndex),
    );
  });
}

// Move one property left or right and loop when I reach either end.
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


// After manual scrolling, mark whichever card is closest to the center
// as current so the overlap/blur styling stays in sync.
function syncPropertyCarouselFromScroll() {
  if (!propertyCarousel) {
    return;
  }

  const viewport = $('.custom-featured-properties__viewport', propertyCarousel);
  const slides = $$('.custom-featured-property', propertyCarousel);

  if (!viewport || !slides.length) {
    return;
  }

  const viewportRect = viewport.getBoundingClientRect();
  const viewportCenter = viewportRect.left + viewportRect.width / 2;

  let nearestIndex = 0;
  let nearestDistance = Infinity;

  slides.forEach((slide, index) => {
    const rect = slide.getBoundingClientRect();
    const slideCenter = rect.left + rect.width / 2;
    const distance = Math.abs(slideCenter - viewportCenter);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  propertyCarouselIndex = nearestIndex;

  slides.forEach((slide, index) => {
    slide.setAttribute('aria-current', String(index === nearestIndex));
  });
}

// CSS handles native touch/trackpad scrolling. This small handler only
// adds the missing desktop-mouse click-drag behavior.
function setupPropertyCarouselMouseDrag() {
  if (!propertyCarousel) {
    return;
  }

  const viewport = $('.custom-featured-properties__viewport', propertyCarousel);

  if (!viewport) {
    return;
  }

  viewport.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) {
      return;
    }

    propertyCarouselDragStartX = event.clientX;
    propertyCarouselDragStartScroll = viewport.scrollLeft;
    propertyCarouselDidDrag = false;
    viewport.classList.add('is-dragging');
  });

  viewport.addEventListener('pointermove', (event) => {
    if (
      event.pointerType !== 'mouse' ||
      !viewport.classList.contains('is-dragging')
    ) {
      return;
    }

    const distance = event.clientX - propertyCarouselDragStartX;

    if (Math.abs(distance) > 4 && !propertyCarouselDidDrag) {
      propertyCarouselDidDrag = true;
      viewport.setPointerCapture(event.pointerId);
    }

    if (propertyCarouselDidDrag) {
      viewport.scrollLeft = propertyCarouselDragStartScroll - distance;
    }
  });

  const finishDrag = (event) => {
    if (!viewport.classList.contains('is-dragging')) {
      return;
    }

    viewport.classList.remove('is-dragging');

    if (viewport.hasPointerCapture?.(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }

    syncPropertyCarouselFromScroll();
    centerPropertySlide('smooth');
  };

  viewport.addEventListener('pointerup', finishDrag);
  viewport.addEventListener('pointercancel', finishDrag);

  // Prevent a drag-release from accidentally opening a property dialog.
  viewport.addEventListener(
    'click',
    (event) => {
      if (!propertyCarouselDidDrag) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      propertyCarouselDidDrag = false;
    },
    true,
  );

  viewport.addEventListener(
    'scroll',
    () => {
      if (propertyCarouselScrollFrame) {
        cancelAnimationFrame(propertyCarouselScrollFrame);
      }

      propertyCarouselScrollFrame = requestAnimationFrame(() => {
        syncPropertyCarouselFromScroll();
        propertyCarouselScrollFrame = 0;
      });
    },
    { passive: true },
  );
}


/* ------------------------------
   HOMEPAGE TESTIMONIAL CAROUSEL
   ------------------------------ */

// CSS owns the layout and scroll snapping. JavaScript only gives the
// previous/next buttons a one-story-at-a-time action.
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

  testimonialCarousel.addEventListener(
    'scroll',
    () => {
      if (testimonialCarouselScrollFrame) {
        cancelAnimationFrame(testimonialCarouselScrollFrame);
      }

      testimonialCarouselScrollFrame = requestAnimationFrame(() => {
        syncTestimonialCarouselFromScroll();
        testimonialCarouselScrollFrame = 0;
      });
    },
    { passive: true },
  );
}


/* ------------------------------
   MEET THE TEAM HERO
   ------------------------------ */

// No JavaScript slideshow here.
// page-advanced.css handles the image timing and visual treatment.
// Homepage = CSS hard-cuts + desktop pan/zoom; mobile = CSS hard-cuts only.
// Meet the Team = CSS hard image swap every 4 seconds.


/* ------------------------------
   CONTACT MODAL
   ------------------------------ */

// Pick a random home photo, but avoid showing the exact same one twice in a row.
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

// Lock page scrolling whenever one of my dialogs is open.
function syncDialogState() {
  document.body.classList.toggle(
    'custom-locked',
    menu.open || detail.open || contactModal.open,
  );

  menuButton.setAttribute('aria-expanded', String(menu.open));
}

// Close any open dialog before moving somewhere else in the site.
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

// Open the centered inquiry form over a random full-screen house image.
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


/* ------------------------------
   PORTFOLIO FILTERS + ROUTING
   ------------------------------ */

// Apply both the neighborhood filter and the For Sale / Sold filter.
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

// This is a single-file site, so the hash decides which page block is visible.
function route(focus = true) {
  // Plain #section anchors (Skip to content, modal anchors, etc.) are not page routes.
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


/* ------------------------------
   PROPERTY DETAIL DIALOG
   ------------------------------ */

// Build the property dialog from whichever property card was clicked.
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


/* ------------------------------
   HEADER + HOME VALUATION
   ------------------------------ */

// Add the solid/scrolled header treatment once I move away from the top.
function syncHeader() {
  $('.custom-header').classList.toggle(
    'custom-header--scrolled',
    window.scrollY > 24,
  );
}

// Switch between the two steps of the home valuation form.
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


/* ------------------------------
   SITE EVENTS
   ------------------------------ */

// One click listener handles buttons and links that are repeated across pages.
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

// The neighborhood dropdown only exists on the Portfolio page.
document.addEventListener('change', (event) => {
  if (event.target.id === 'area-filter') {
    filterPortfolio();
  }
});

// Keep the current front-end form confirmation in one place.
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

// Keep dialog state in sync and allow clicking outside a dialog to close it.
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


/* ------------------------------
   INITIAL SETUP
   ------------------------------ */

$('#copyright-year').textContent = new Date().getFullYear();

route(false);
syncHeader();
setupPropertyCarouselMouseDrag();
setupTestimonialCarousel();
requestAnimationFrame(() => {
  centerPropertySlide('auto');
  centerTestimonialSlide('auto');
});
