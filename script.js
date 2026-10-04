/* Essential behavior only. All page markup is in index.html.
   Hero animation, hover states, responsive layouts, and transitions live in CSS. */
'use strict';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const pages = $$('.custom-page');
const menu = $('#navigation-menu');
const detail = $('#detail-dialog');
const contactModal = $('#contact-modal');
const menuButton = $('.custom-menu-toggle');
const propertyCarousel = $('[data-property-carousel]');
const contactModalImages = ['images/losangeles-1.jpg','images/beverlyhills-1.jpg','images/santamonica-1.jpg','images/westhollywood-1.jpg','images/losangeles-2.jpg','images/beverlyhills-2.jpg','images/santamonica-2.jpg','images/westhollywood-2.jpg'];
let statusFilter = 'all';
let propertyCarouselIndex = 1;
let lastContactModalImage = -1;

function centerPropertySlide(behavior = 'smooth') {
  if (!propertyCarousel) return;
  const viewport = $('.custom-featured-properties__viewport', propertyCarousel);
  const slides = $$('.custom-featured-property', propertyCarousel);
  const slide = slides[propertyCarouselIndex];
  if (!viewport || !slide) return;
  const slideRect = slide.getBoundingClientRect();
  const viewportRect = viewport.getBoundingClientRect();
  const left = viewport.scrollLeft + (slideRect.left - viewportRect.left) - ((viewport.clientWidth - slide.clientWidth) / 2);
  viewport.scrollTo({ left, behavior });
  slides.forEach((item,index) => item.setAttribute('aria-current', String(index === propertyCarouselIndex)));
}
function movePropertyCarousel(direction) {
  if (!propertyCarousel) return;
  const slides = $$('.custom-featured-property', propertyCarousel);
  if (!slides.length) return;
  propertyCarouselIndex = (propertyCarouselIndex + direction + slides.length) % slides.length;
  centerPropertySlide('smooth');
}
function startTeamHero() {
  const images = $$('[data-team-hero-image]');
  if (images.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let activeIndex = images.findIndex(image => image.classList.contains('is-active'));
  if (activeIndex < 0) activeIndex = 0;
  window.setInterval(() => {
    images[activeIndex].classList.remove('is-active');
    activeIndex = (activeIndex + 1) % images.length;
    images[activeIndex].classList.add('is-active');
  }, 4000);
}
function chooseContactModalImage() {
  let next = Math.floor(Math.random() * contactModalImages.length);
  if (contactModalImages.length > 1 && next === lastContactModalImage) next = (next + 1) % contactModalImages.length;
  lastContactModalImage = next;
  contactModal.style.setProperty('--custom-contact-modal-image', `url("${contactModalImages[next]}")`);
}

function syncDialogState() {
  document.body.classList.toggle('custom-locked', menu.open || detail.open || contactModal.open);
  menuButton.setAttribute('aria-expanded', String(menu.open));
}
function closeDialogs() {
  if (menu.open) menu.close();
  if (detail.open) detail.close();
  if (contactModal.open) contactModal.close();
  syncDialogState();
}
function filterPortfolio() {
  const area = $('#area-filter').value;
  let count = 0;
  $$('#portfolio-grid .custom-property-card').forEach(card => {
    card.hidden = !((area === 'all' || card.dataset.area === area) &&
      (statusFilter === 'all' || card.dataset.status === statusFilter));
    if (!card.hidden) count++;
  });
  $('#portfolio-count').textContent = count ? `${count} ${count === 1 ? 'home' : 'homes'} · Illustrative collection` : 'No sample homes match these filters. Try another neighborhood or status.';
  $$('[data-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === statusFilter)));
}
function route(focus = true) {
  const [slug, query = ''] = location.hash.replace(/^#\/?/, '').split('?');
  const page = pages.find(item => item.dataset.page === (slug || 'home'));
  if (!page) return; // Section anchors should not replace the current page.
  closeDialogs();
  pages.forEach(item => { item.hidden = item !== page; });
  document.body.dataset.page = page.dataset.page;
  const title = page.dataset.page === 'home' ? 'Los Angeles Real Estate' : page.dataset.page.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(' ');
  document.title = `${title} | Roger + Rochelle`;
  const href = page.dataset.page === 'home' ? '#/' : '#/' + page.dataset.page;
  $$('.custom-header a, .custom-menu a').forEach(link => {
    if (link.getAttribute('href') === href) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  const params = new URLSearchParams(query);
  if (slug === 'portfolio') {
    statusFilter = 'all';
    const area = params.get('area');
    $('#area-filter').value = [...$('#area-filter').options].some(option => option.value === area) ? area : 'all';
    filterPortfolio();
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
  if (focus) $('#main').focus({ preventScroll: true });
  if ((slug || 'home') === 'home') requestAnimationFrame(() => centerPropertySlide('auto'));
  if (slug === 'neighborhoods') {
    const target = document.getElementById('area-' + params.get('area'));
    if (target) target.scrollIntoView({ behavior: 'instant' });
  }
}
function openProperty(card) {
  if (!card) return;
  const content = $('#detail-content');
  content.replaceChildren();
  const imageSource = $('img', card);
  if (!imageSource) return;
  const image = imageSource.cloneNode();
  image.className = 'custom-detail__image';
  const body = document.createElement('div');
  body.className = 'custom-detail__body';
  const title = document.createElement('h2');
  title.textContent = card.dataset.title || $('h3', card)?.textContent?.trim() || 'Property';
  const location = document.createElement('p');
  location.className = 'custom-eyebrow';
  location.textContent = card.dataset.location || $('.custom-eyebrow', card)?.textContent?.trim() || '';
  const details = document.createElement('p');
  details.textContent = card.dataset.details || $('.custom-property-card__info > p:last-child', card)?.textContent?.trim() || '';
  const note = document.createElement('p');
  note.textContent = 'Illustrative listing only. Images are generated; property names, status, and dimensions are sample content.';
  const link = document.createElement('a');
  link.className = 'custom-button';
  link.href = '#contact-modal';
  link.dataset.openContactModal = '';
  link.textContent = 'Discuss Your Search ↗';
  body.append(location,title,details,note,link);
  content.append(image,body);
  detail.showModal();
  syncDialogState();
}
function openContactModal() {
  chooseContactModalImage();
  if (menu.open) menu.close();
  if (detail.open) detail.close();
  if (!contactModal.open) contactModal.showModal();
  syncDialogState();
  requestAnimationFrame(() => $('#modal-first-name')?.focus());
}

function syncHeader() {
  $('.custom-header').classList.toggle('custom-header--scrolled', window.scrollY > 24);
}

function valuationStep(next) {
  const first = $('#valuation-step-1');
  const second = $('#valuation-step-2');
  if (next && !$$('input, select', first).every(input => input.reportValidity())) return;
  first.hidden = next;
  second.hidden = !next;
  second.disabled = !next;
  $(next ? '#valuation-name' : '#address').focus();
}

document.addEventListener('click', event => {
  const target = event.target.closest('button, a');
  if (!target) return;
  if (target.matches('.custom-skip-link')) {
    event.preventDefault();
    $('#main').focus();
  }
  if (target.matches('.custom-menu-toggle')) { menu.showModal(); syncDialogState(); }
  if (target.hasAttribute('data-open-contact-modal')) { event.preventDefault(); openContactModal(); }
  if (target.hasAttribute('data-close-contact-modal')) { contactModal.close(); syncDialogState(); }
  if (target.hasAttribute('data-close-menu')) { menu.close(); syncDialogState(); }
  if (target.hasAttribute('data-close-detail')) { detail.close(); syncDialogState(); }
  if (target.hasAttribute('data-property-carousel-prev')) movePropertyCarousel(-1);
  if (target.hasAttribute('data-property-carousel-next')) movePropertyCarousel(1);
  if (target.hasAttribute('data-property')) openProperty(target.closest('.custom-property-card, .custom-featured-property'));
  if (target.hasAttribute('data-filter')) { statusFilter = target.dataset.filter; filterPortfolio(); }
  if (target.id === 'valuation-next') valuationStep(true);
  if (target.id === 'valuation-back') valuationStep(false);
  if (target.dataset.scroll) {
    event.preventDefault();
    document.getElementById(target.dataset.scroll)?.scrollIntoView();
  }
  if (target.matches('a[href^="#/"]')) {
    closeDialogs();
    if (target.getAttribute('href') === location.hash) window.scrollTo({ top: 0 });
  }
});
document.addEventListener('change', event => {
  if (event.target.id === 'area-filter') filterPortfolio();
});
document.addEventListener('submit', event => {
  if (!event.target.matches('#contact-form, #valuation-form, #contact-modal-form')) return;
  event.preventDefault();
  const results = { 'contact-form': '#contact-result', 'valuation-form': '#valuation-result', 'contact-modal-form': '#contact-modal-result' };
  const result = $(results[event.target.id]);
  result.hidden = false;
  result.textContent = 'Form complete. This is a practice preview: your details have not been sent or saved. A real inquiry service can be connected later.';
  result.setAttribute('tabindex', '-1');
  result.focus();
});
[menu, detail, contactModal].forEach(dialog => {
  dialog.addEventListener('close', syncDialogState);
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
});
window.addEventListener('hashchange', () => route());
window.addEventListener('scroll', syncHeader, { passive: true });
window.addEventListener('resize', () => centerPropertySlide('auto'), { passive: true });
$('#copyright-year').textContent = new Date().getFullYear();
route(false);
syncHeader();
requestAnimationFrame(() => centerPropertySlide('auto'));
startTeamHero();
