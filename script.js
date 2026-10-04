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


/* 3. Previous / Next buttons for ordinary scroll-snap sliders */

document.querySelectorAll("[data-slider]:not(.testimonials)").forEach(slider => {
    const track = slider.querySelector("[data-track]");
    const previous = slider.querySelector("[data-prev]");
    const next = slider.querySelector("[data-next]");

    if (!track) return;

    function move(direction) {
        track.scrollBy({
            left: track.clientWidth * 0.82 * direction,
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

/* 6. Testimonials: centered overlapping carousel */

const testimonialCarousel = document.querySelector("[data-testimonial-carousel]");

if (testimonialCarousel) {
    const testimonialCards = [
        ...testimonialCarousel.querySelectorAll("[data-testimonial-card]")
    ];

    const testimonialPrev = document.querySelector("[data-testimonial-prev]");
    const testimonialNext = document.querySelector("[data-testimonial-next]");

    let activeTestimonial = 0;

    function wrapTestimonialIndex(index) {
        return (index + testimonialCards.length) % testimonialCards.length;
    }

    function renderTestimonials() {
        const previousIndex = wrapTestimonialIndex(activeTestimonial - 1);
        const nextIndex = wrapTestimonialIndex(activeTestimonial + 1);

        testimonialCards.forEach((card, index) => {
            card.classList.remove(
                "is-active",
                "is-prev",
                "is-next",
                "is-hidden"
            );

            if (index === activeTestimonial) {
                card.classList.add("is-active");
            } else if (index === previousIndex) {
                card.classList.add("is-prev");
            } else if (index === nextIndex) {
                card.classList.add("is-next");
            } else {
                card.classList.add("is-hidden");
            }
        });
    }

    function showPreviousTestimonial() {
        activeTestimonial =
            wrapTestimonialIndex(activeTestimonial - 1);

        renderTestimonials();
    }

    function showNextTestimonial() {
        activeTestimonial =
            wrapTestimonialIndex(activeTestimonial + 1);

        renderTestimonials();
    }

    testimonialPrev?.addEventListener(
        "click",
        showPreviousTestimonial
    );

    testimonialNext?.addEventListener(
        "click",
        showNextTestimonial
    );

    testimonialCards.forEach((card, index) => {
        card.addEventListener("click", event => {
            if (card.classList.contains("is-prev")) {
                activeTestimonial = index;
                renderTestimonials();
                return;
            }

            if (card.classList.contains("is-next")) {
                activeTestimonial = index;
                renderTestimonials();
                return;
            }

            if (
                card.classList.contains("is-active") &&
                event.target.closest(".testimonial-read-more")
            ) {
                openTestimonialDialog(card);
            }
        });
    });

    renderTestimonials();
}


/* 7. Full testimonial dialog */

const testimonialDialog =
    document.querySelector("#testimonialDialog");

const testimonialDialogName =
    document.querySelector("#testimonialDialogName");

const testimonialDialogCopy =
    document.querySelector("#testimonialDialogCopy");

const testimonialDialogClose =
    document.querySelector(".testimonial-dialog-close");

function openTestimonialDialog(card) {
    if (
        !testimonialDialog ||
        !testimonialDialogName ||
        !testimonialDialogCopy
    ) {
        return;
    }

    const name =
        card.querySelector("h3")?.textContent.trim() || "";

    const copy =
        card.querySelector(".testimonial-full-copy")
            ?.textContent
            .trim() || "";

    testimonialDialogName.textContent = name;
    testimonialDialogCopy.textContent = copy;
    testimonialDialog.showModal();
}

testimonialDialogClose?.addEventListener("click", () => {
    testimonialDialog?.close();
});

testimonialDialog?.addEventListener("click", event => {
    if (event.target === testimonialDialog) {
        testimonialDialog.close();
    }
});

