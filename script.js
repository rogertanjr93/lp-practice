/*
===========================================================
PRODUCER PRACTICE JAVASCRIPT
===========================================================

Deliberately small.

CSS handles:
- hero slideshow
- image animation
- hover effects
- layout
- responsive styling
- modal animation
- scroll snapping

JavaScript only handles interactions that actually need state.
===========================================================
*/


/* Navbar scroll state */

const globalNavbar = document.querySelector("#global-navbar");

function updateNavbarState() {
    globalNavbar?.classList.toggle("scroll", window.scrollY > 40);
}

updateNavbarState();
window.addEventListener("scroll", updateNavbarState, { passive: true });


/* Mobile navigation */

const hamburger = document.querySelector(".hamburger");
const navigation = document.querySelector(".navigation");

hamburger?.addEventListener("click", () => {
    const isOpen = navigation?.classList.toggle("is-open") ?? false;
    hamburger.setAttribute("aria-expanded", String(isOpen));
});

navigation?.querySelectorAll("a, button").forEach(item => {
    item.addEventListener("click", () => {
        navigation.classList.remove("is-open");
        hamburger?.setAttribute("aria-expanded", "false");
    });
});


/* Previous / Next controls for scroll-snap sliders */

document.querySelectorAll("[data-slider]").forEach(slider => {
    const track = slider.querySelector("[data-track]");
    const previous = slider.querySelector("[data-prev]");
    const next = slider.querySelector("[data-next]");

    if (!track) return;

    const move = direction => {
        track.scrollBy({
            left: track.clientWidth * 0.82 * direction,
            behavior: "smooth"
        });
    };

    previous?.addEventListener("click", () => move(-1));
    next?.addEventListener("click", () => move(1));
});


/* Contact overlay */

const contactModal = document.querySelector("#modal-global-contact-us");
const contactTriggers = document.querySelectorAll(".contact-trigger");
const contactClosers = document.querySelectorAll("[data-contact-close]");

function setContactModal(open) {
    if (!contactModal) return;

    contactModal.classList.toggle("is-open", open);
    contactModal.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("modal-open", open);
}

contactTriggers.forEach(trigger => {
    trigger.addEventListener("click", () => setContactModal(true));
});

contactClosers.forEach(closer => {
    closer.addEventListener("click", () => setContactModal(false));
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        setContactModal(false);
    }
});


/* Practice forms: prevent reload and show a demo message */

document.querySelectorAll("[data-demo-form]").forEach(form => {
    form.addEventListener("submit", event => {
        event.preventDefault();

        const status = form.querySelector(".form-status");

        if (status) {
            status.textContent = "Practice form submitted — no live backend is connected.";
        }
    });
});
