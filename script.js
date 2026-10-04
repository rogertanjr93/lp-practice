/*
===========================================================
ROCHELLE PRODUCER PRACTICE — JAVASCRIPT
===========================================================

Intentionally tiny.

CSS handles:
- hero slideshow / Ken Burns motion
- transitions
- hover effects
- responsive layout
- image zoom
- modal appearance
- scroll-snap carousel layout

JavaScript only handles interactions that genuinely need state.
===========================================================
*/


/* 1. Navbar state after scrolling */

const globalNavbar = document.querySelector("#global-navbar");

function updateNavbarState() {
    globalNavbar?.classList.toggle("scroll", window.scrollY > 40);
}

updateNavbarState();
window.addEventListener("scroll", updateNavbarState, { passive: true });


/* 2. Mobile menu */

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


/* 3. Previous / Next buttons for scroll-snap sliders */

document.querySelectorAll("[data-slider]").forEach(slider => {
    const track = slider.querySelector("[data-track]");
    const previous = slider.querySelector("[data-prev]");
    const next = slider.querySelector("[data-next]");

    if (!track) return;

    function getScrollAmount() {
        const card = track.querySelector("[data-card]");

        if (card) {
            const styles = getComputedStyle(track);
            const gap = parseFloat(styles.columnGap || styles.gap || 0);

            return card.getBoundingClientRect().width + gap;
        }

        return track.clientWidth * 0.82;
    }

    function move(direction) {
        track.scrollBy({
            left: getScrollAmount() * direction,
            behavior: "smooth"
        });
    }

    previous?.addEventListener("click", () => move(-1));
    next?.addEventListener("click", () => move(1));
});


/* 4. Contact modal */

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


/* 5. Practice forms: prevent page reload */

document.querySelectorAll("[data-demo-form]").forEach(form => {
    form.addEventListener("submit", event => {
        event.preventDefault();

        const status = form.querySelector(".form-status");

        if (status) {
            status.textContent =
                "Practice submission received — no live CRM or backend is connected.";
        }
    });
});
