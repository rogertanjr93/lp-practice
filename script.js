/* Header */

const siteHeader = document.querySelector(".site-header");

function updateHeader() {
    if (!siteHeader) return;
    siteHeader.classList.toggle("scrolled", window.scrollY > 50);
}

window.addEventListener("scroll", updateHeader, { passive: true });


/* Menu */

const menuDropdownToggle = document.querySelector(".menu-dropdown-toggle");
const headerDropdown = document.querySelector(".header-dropdown");

function closeDropdown() {
    if (!menuDropdownToggle || !headerDropdown) return;

    headerDropdown.classList.remove("active");
    menuDropdownToggle.classList.remove("active");
    menuDropdownToggle.setAttribute("aria-expanded", "false");
}

if (menuDropdownToggle && headerDropdown) {
    menuDropdownToggle.addEventListener("click", event => {
        event.stopPropagation();

        const isOpen = headerDropdown.classList.toggle("active");
        menuDropdownToggle.classList.toggle("active", isOpen);
        menuDropdownToggle.setAttribute("aria-expanded", String(isOpen));
    });

    headerDropdown.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", closeDropdown);
    });

    document.addEventListener("click", event => {
        if (
            !headerDropdown.contains(event.target) &&
            !menuDropdownToggle.contains(event.target)
        ) {
            closeDropdown();
        }
    });
}


/* Hero slideshow */

const heroSlides = Array.from(document.querySelectorAll(".hero-slide"));
let currentHeroSlide = 0;

function showHeroSlide(index) {
    if (!heroSlides.length) return;

    heroSlides.forEach(slide => {
        slide.classList.remove("active");
        slide.style.animation = "none";
    });

    const activeSlide = heroSlides[index];

    /* Restart the animation each time the slide returns. */
    void activeSlide.offsetWidth;
    activeSlide.style.animation = "";
    activeSlide.classList.add("active");
}

if (heroSlides.length) {
    showHeroSlide(0);

    window.setInterval(() => {
        currentHeroSlide = (currentHeroSlide + 1) % heroSlides.length;
        showHeroSlide(currentHeroSlide);
    }, 5000);
}


/* Site backdrop */

const siteBackdrop = document.querySelector("#siteBackdrop");
const heroSection = document.querySelector("#home");

const backdropSlides = Array.from(
    document.querySelectorAll("[data-backdrop-slide]")
);

const backdropSections = Array.from(
    document.querySelectorAll("[data-backdrop]")
);

let currentBackdropIndex = 0;
let backdropTicking = false;

function setBackdrop(index) {
    if (!backdropSlides.length) return;

    const safeIndex = Math.max(
        0,
        Math.min(index, backdropSlides.length - 1)
    );

    if (safeIndex !== currentBackdropIndex) {
        currentBackdropIndex = safeIndex;
    }

    backdropSlides.forEach((slide, slideIndex) => {
        slide.classList.toggle("active", slideIndex === safeIndex);
    });
}

function updateBackdropFromScroll() {
    if (!backdropSections.length || !backdropSlides.length) return;

    if (siteBackdrop && heroSection) {
        const heroBottom = heroSection.getBoundingClientRect().bottom;
        siteBackdrop.classList.toggle(
            "is-visible",
            heroBottom <= window.innerHeight * 0.62
        );
    }

    const triggerLine = window.innerHeight * 0.46;
    let nextIndex = 0;

    backdropSections.forEach(section => {
        const rect = section.getBoundingClientRect();

        if (rect.top <= triggerLine) {
            const requestedIndex = Number(section.dataset.backdrop);

            if (Number.isFinite(requestedIndex)) {
                nextIndex = requestedIndex;
            }
        }
    });

    setBackdrop(nextIndex);
}

function requestBackdropUpdate() {
    if (backdropTicking) return;

    backdropTicking = true;

    window.requestAnimationFrame(() => {
        updateBackdropFromScroll();
        backdropTicking = false;
    });
}

window.addEventListener("scroll", requestBackdropUpdate, { passive: true });
window.addEventListener("resize", requestBackdropUpdate);


/* Section reveal */

const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;

                entry.target.classList.add("visible");
                revealObserver.unobserve(entry.target);
            });
        },
        { threshold: 0.1 }
    );

    revealElements.forEach(element => revealObserver.observe(element));
} else {
    revealElements.forEach(element => element.classList.add("visible"));
}


/* Local links */

document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", event => {
        const href = link.getAttribute("href");

        if (!href || href === "#") return;

        const target = document.querySelector(href);
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
});


/* About switch */

const aboutStage = document.querySelector("#aboutStage");
const aboutStories = Array.from(
    document.querySelectorAll(".about-story")
);
const aboutPageTriggers = Array.from(
    document.querySelectorAll("[data-about-page]")
);

let aboutHoverTimer = null;

function setAboutPage(pageName) {
    if (!aboutStage || !aboutStories.length) return;

    const activePage = pageName === "ridge" ? "ridge" : "marci";

    aboutStage.dataset.aboutActive = activePage;

    aboutStories.forEach(story => {
        const isActive = story.classList.contains(`about-story-${activePage}`);

        story.classList.toggle("is-active", isActive);
        story.setAttribute("aria-hidden", String(!isActive));
    });

    aboutPageTriggers.forEach(trigger => {
        const isActive = trigger.dataset.aboutPage === activePage;
        trigger.classList.toggle("is-active", isActive);
        trigger.setAttribute("aria-pressed", String(isActive));
    });
}

function scheduleAboutPage(pageName, delay = 95) {
    window.clearTimeout(aboutHoverTimer);

    aboutHoverTimer = window.setTimeout(() => {
        setAboutPage(pageName);
    }, delay);
}

aboutPageTriggers.forEach(trigger => {
    const pageName = trigger.dataset.aboutPage;

    trigger.addEventListener("click", () => {
        setAboutPage(pageName);
    });

    trigger.addEventListener("pointerenter", () => {
        const hoverCapable = window.matchMedia(
            "(hover: hover) and (pointer: fine)"
        ).matches;

        if (
            hoverCapable &&
            aboutStage?.dataset.aboutActive !== pageName
        ) {
            scheduleAboutPage(pageName);
        }
    });

    trigger.addEventListener("pointerleave", () => {
        window.clearTimeout(aboutHoverTimer);
    });
});


/* Mobile affiliation hold */

const affiliationDock = document.querySelector("#affiliationDock");
const affiliationHandle = document.querySelector("#affiliationHandle");

function showAffiliations() {
    if (!affiliationDock || !affiliationHandle) return;

    affiliationDock.classList.add("is-peeking");
    affiliationHandle.setAttribute("aria-expanded", "true");
}

function hideAffiliations() {
    if (!affiliationDock || !affiliationHandle) return;

    affiliationDock.classList.remove("is-peeking");
    affiliationHandle.setAttribute("aria-expanded", "false");
}

if (affiliationHandle) {
    affiliationHandle.addEventListener("pointerdown", event => {
        showAffiliations();

        try {
            affiliationHandle.setPointerCapture(event.pointerId);
        } catch (_) {

        }
    });

    ["pointerup", "pointercancel", "lostpointercapture"].forEach(eventName => {
        affiliationHandle.addEventListener(eventName, hideAffiliations);
    });

    affiliationHandle.addEventListener("keydown", event => {
        if (event.key === " " || event.key === "Enter") {
            event.preventDefault();
            showAffiliations();
        }
    });

    affiliationHandle.addEventListener("keyup", event => {
        if (event.key === " " || event.key === "Enter") {
            hideAffiliations();
        }
    });

    affiliationHandle.addEventListener("blur", hideAffiliations);
}


/* Listings gallery */

/* Gallery data: keep the local fallback until the live listing feed is connected. */

const DEFAULT_LISTINGS = Array.from({ length: 9 }, (_, index) => ({
    id: index + 1,
    image: `images/gallery-${index + 1}.jpg`,
    url: "unavailable.html",
    alt: `Marci Metzger property listing ${index + 1}`,
    visible: true,
    showOnHomepage: true
}));

const listingsGalleryViewport = document.querySelector("#listingsGalleryViewport");
const listingsGalleryTrack = document.querySelector("#listingsGalleryTrack");
const listingsGalleryPrev = document.querySelector("#listingsGalleryPrev");
const listingsGalleryNext = document.querySelector("#listingsGalleryNext");

let listingsGallerySlides = [];
let listingsGalleryIndex = 1;
let listingsGalleryTranslate = 0;
let listingsGalleryAnimating = false;
let listingsGalleryDragging = false;
let listingsGalleryPointerId = null;
let listingsGalleryPointerType = "mouse";
let listingsGalleryStartX = 0;
let listingsGalleryStartY = 0;
let listingsGalleryStartTranslate = 0;
let listingsGalleryStartTime = 0;
let listingsGallerySuppressClickUntil = 0;
let listingsGalleryTransitionTimer = null;
let listingsGalleryWheelLocked = false;

function normalizeListings(payload) {
    const rawListings = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.listings)
            ? payload.listings
            : [];

    return rawListings
        .filter(listing => listing && typeof listing === "object")
        .filter(listing => listing.visible !== false)
        .filter(listing => listing.showOnHomepage !== false)
        .filter(listing => String(listing.status || "").toLowerCase() !== "hidden")
        .map((listing, index) => ({
            id: listing.id ?? index + 1,
            image:
                listing.image ||
                listing.imageUrl ||
                listing.coverImage ||
                "",
            url:
                listing.url ||
                listing.listingUrl ||
                "unavailable.html",
            alt:
                listing.alt ||
                listing.title ||
                `Marci Metzger property listing ${index + 1}`
        }))
        .filter(listing => Boolean(listing.image));
}

async function loadListings() {
    const endpoint = document.body.dataset.listingsEndpoint?.trim();

    if (!endpoint) {
        return DEFAULT_LISTINGS;
    }

    try {
        const response = await fetch(endpoint, {
            headers: { Accept: "application/json" }
        });

        if (!response.ok) {
            throw new Error(`Listings request failed with ${response.status}`);
        }

        const payload = await response.json();
        const listings = normalizeListings(payload);

        return listings.length ? listings : DEFAULT_LISTINGS;
    } catch (error) {
        console.warn("Using local listing gallery data:", error);
        return DEFAULT_LISTINGS;
    }
}

function createListingSlide(listing, index) {
    const article = document.createElement("article");
    article.className = "listings-gallery-slide";

    const link = document.createElement("a");
    link.className = "listings-gallery-card";
    link.href = listing.url || "unavailable.html";
    link.setAttribute("aria-label", `View listing ${index + 1}`);
    link.draggable = false;

    const image = document.createElement("img");
    image.src = listing.image;
    image.alt = listing.alt || `Marci Metzger property listing ${index + 1}`;
    image.draggable = false;
    image.loading = index === 0 ? "eager" : "lazy";
    image.decoding = "async";

    link.appendChild(image);
    article.appendChild(link);

    return article;
}

function renderListingsGallery(listings) {
    if (!listingsGalleryTrack) return;

    listingsGalleryTrack.replaceChildren();

    listings.forEach((listing, index) => {
        listingsGalleryTrack.appendChild(createListingSlide(listing, index));
    });
}

function buildListingsGalleryLoop() {
    if (!listingsGalleryTrack) return;

    listingsGalleryTrack.querySelectorAll(".is-clone").forEach(clone => clone.remove());

    const realSlides = Array.from(
        listingsGalleryTrack.querySelectorAll(".listings-gallery-slide")
    );

    if (!realSlides.length) {
        listingsGallerySlides = [];
        return;
    }

    if (realSlides.length > 1) {
        const firstClone = realSlides[0].cloneNode(true);
        const lastClone = realSlides[realSlides.length - 1].cloneNode(true);

        firstClone.classList.add("is-clone");
        lastClone.classList.add("is-clone");
        firstClone.setAttribute("aria-hidden", "true");
        lastClone.setAttribute("aria-hidden", "true");

        const firstCloneLink = firstClone.querySelector("a");
        const lastCloneLink = lastClone.querySelector("a");

        if (firstCloneLink) firstCloneLink.tabIndex = -1;
        if (lastCloneLink) lastCloneLink.tabIndex = -1;

        listingsGalleryTrack.prepend(lastClone);
        listingsGalleryTrack.append(firstClone);
        listingsGalleryIndex = 1;
    } else {
        listingsGalleryIndex = 0;
    }

    listingsGallerySlides = Array.from(
        listingsGalleryTrack.querySelectorAll(".listings-gallery-slide")
    );
}

function getListingsGalleryTarget() {
    if (!listingsGalleryViewport || !listingsGallerySlides.length) return 0;

    const slide = listingsGallerySlides[listingsGalleryIndex];
    if (!slide) return 0;

    const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;

    return listingsGalleryViewport.clientWidth / 2 - slideCenter;
}

function updateListingsGallery(animate = false) {
    if (
        !listingsGalleryTrack ||
        !listingsGalleryViewport ||
        !listingsGallerySlides.length
    ) {
        return;
    }

    listingsGalleryTranslate = getListingsGalleryTarget();

    listingsGalleryTrack.style.transition = animate
        ? "transform 820ms cubic-bezier(0.22, 1, 0.36, 1)"
        : "none";

    listingsGalleryTrack.style.transform =
        `translate3d(${listingsGalleryTranslate}px, 0, 0)`;
}

function finishListingsGalleryTransition() {
    if (!listingsGallerySlides.length) return;

    window.clearTimeout(listingsGalleryTransitionTimer);

    if (listingsGallerySlides.length <= 1) {
        listingsGalleryAnimating = false;
        return;
    }

    const realSlideCount = listingsGallerySlides.length - 2;

    if (listingsGalleryIndex === 0) {
        listingsGalleryIndex = realSlideCount;
        updateListingsGallery(false);
    } else if (listingsGalleryIndex === listingsGallerySlides.length - 1) {
        listingsGalleryIndex = 1;
        updateListingsGallery(false);
    }

    listingsGalleryAnimating = false;
}

function moveListingsGallery(direction) {
    if (
        listingsGallerySlides.length <= 1 ||
        listingsGalleryAnimating ||
        listingsGalleryDragging
    ) {
        return;
    }

    listingsGalleryIndex += direction;
    listingsGalleryAnimating = true;
    updateListingsGallery(true);

    listingsGalleryTransitionTimer = window.setTimeout(
        finishListingsGalleryTransition,
        920
    );
}

function startListingsGalleryPointer(event) {
    if (
        !event.isPrimary ||
        listingsGalleryAnimating ||
        !listingsGalleryViewport
    ) {
        return;
    }

    listingsGalleryPointerId = event.pointerId;
    listingsGalleryPointerType = event.pointerType || "mouse";
    listingsGalleryStartX = event.clientX;
    listingsGalleryStartY = event.clientY;
    listingsGalleryStartTranslate = listingsGalleryTranslate;
    listingsGalleryStartTime = performance.now();
    listingsGalleryDragging = false;
}

function moveListingsGalleryPointer(event) {
    if (
        listingsGalleryPointerId !== event.pointerId ||
        !listingsGalleryViewport ||
        !listingsGalleryTrack
    ) {
        return;
    }

    const differenceX = event.clientX - listingsGalleryStartX;
    const differenceY = event.clientY - listingsGalleryStartY;
    const horizontalDistance = Math.abs(differenceX);
    const verticalDistance = Math.abs(differenceY);

    /* Small horizontal movement counts as a drag. */
    if (Math.hypot(differenceX, differenceY) > 2) {
        listingsGallerySuppressClickUntil = performance.now() + 700;
    }

    if (!listingsGalleryDragging) {
        const dragStartThreshold = listingsGalleryPointerType === "mouse" ? 4 : 7;

        if (
            horizontalDistance >= dragStartThreshold &&
            horizontalDistance > verticalDistance
        ) {
            listingsGalleryDragging = true;
            listingsGalleryViewport.classList.add("is-dragging");
            listingsGalleryTrack.style.transition = "none";

            try {
                listingsGalleryViewport.setPointerCapture(event.pointerId);
            } catch (_) {
    
            }
        } else {
            return;
        }
    }

    event.preventDefault();

    listingsGalleryTrack.style.transform =
        `translate3d(${listingsGalleryStartTranslate + differenceX}px, 0, 0)`;
}

function endListingsGalleryPointer(event) {
    if (
        listingsGalleryPointerId !== event.pointerId ||
        !listingsGalleryViewport
    ) {
        return;
    }

    const differenceX = event.clientX - listingsGalleryStartX;
    const differenceY = event.clientY - listingsGalleryStartY;
    const movement = Math.hypot(differenceX, differenceY);
    const elapsed = performance.now() - listingsGalleryStartTime;
    const wasDragging = listingsGalleryDragging;

    /* Only open a listing on a clean click or tap. */
    const deliberateClick = movement <= 2 && elapsed < 350 && !wasDragging;

    if (!deliberateClick) {
        listingsGallerySuppressClickUntil = performance.now() + 700;
    }

    listingsGalleryPointerId = null;
    listingsGalleryDragging = false;
    listingsGalleryViewport.classList.remove("is-dragging");

    if (wasDragging) {
        const velocity = differenceX / Math.max(elapsed, 1);
        const threshold = Math.min(
            120,
            listingsGalleryViewport.clientWidth * 0.075
        );

        if (differenceX < -threshold || velocity < -0.42) {
            moveListingsGallery(1);
        } else if (differenceX > threshold || velocity > 0.42) {
            moveListingsGallery(-1);
        } else {
            updateListingsGallery(true);
        }
    }

    try {
        listingsGalleryViewport.releasePointerCapture(event.pointerId);
    } catch (_) {

    }
}

function cancelListingsGalleryPointer(event) {
    if (listingsGalleryPointerId !== event.pointerId) return;

    listingsGalleryPointerId = null;
    listingsGalleryDragging = false;
    listingsGallerySuppressClickUntil = performance.now() + 650;

    listingsGalleryViewport?.classList.remove("is-dragging");
    updateListingsGallery(true);
}

function initListingsGalleryEvents() {
    if (!listingsGalleryViewport || !listingsGalleryTrack) return;

    listingsGalleryTrack.addEventListener("transitionend", event => {
        if (event.propertyName === "transform") {
            finishListingsGalleryTransition();
        }
    });

    listingsGalleryPrev?.addEventListener("click", () => {
        moveListingsGallery(-1);
    });

    listingsGalleryNext?.addEventListener("click", () => {
        moveListingsGallery(1);
    });

    listingsGalleryViewport.addEventListener(
        "pointerdown",
        startListingsGalleryPointer
    );

    listingsGalleryViewport.addEventListener(
        "pointermove",
        moveListingsGalleryPointer,
        { passive: false }
    );

    listingsGalleryViewport.addEventListener(
        "pointerup",
        endListingsGalleryPointer
    );

    listingsGalleryViewport.addEventListener(
        "pointercancel",
        cancelListingsGalleryPointer
    );

    listingsGalleryViewport.addEventListener(
        "click",
        event => {
            if (performance.now() < listingsGallerySuppressClickUntil) {
                event.preventDefault();
                event.stopPropagation();
            }
        },
        true
    );

    listingsGalleryViewport.addEventListener("dragstart", event => {
        event.preventDefault();
    });

    listingsGalleryViewport.addEventListener("keydown", event => {
        if (event.key === "ArrowLeft") {
            event.preventDefault();
            moveListingsGallery(-1);
        } else if (event.key === "ArrowRight") {
            event.preventDefault();
            moveListingsGallery(1);
        }
    });

    listingsGalleryViewport.addEventListener(
        "wheel",
        event => {
            if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;

            event.preventDefault();

            if (listingsGalleryWheelLocked) return;

            listingsGalleryWheelLocked = true;
            moveListingsGallery(event.deltaX > 0 ? 1 : -1);

            window.setTimeout(() => {
                listingsGalleryWheelLocked = false;
            }, 680);
        },
        { passive: false }
    );

    window.addEventListener("resize", () => {
        updateListingsGallery(false);
    });

    if ("ResizeObserver" in window) {
        const galleryResizeObserver = new ResizeObserver(() => {
            updateListingsGallery(false);
        });

        galleryResizeObserver.observe(listingsGalleryViewport);
    }
}

async function initListingsGallery() {
    if (!listingsGalleryTrack || !listingsGalleryViewport) return;

    const listings = await loadListings();

    renderListingsGallery(listings);
    buildListingsGalleryLoop();
    initListingsGalleryEvents();

    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
            updateListingsGallery(false);
        });
    });
}


/* Search form placeholder */

const searchForm = document.querySelector("#searchForm");
const searchMessage = document.querySelector("#searchMessage");

if (searchForm) {
    searchForm.addEventListener("submit", event => {
        event.preventDefault();

        if (searchMessage) {
            searchMessage.textContent =
                "Listing search would connect to the live MLS / IDX service in production.";
        }
    });
}


/* Contact form placeholder */

const contactForm = document.querySelector("#contactForm");
const formMessage = document.querySelector("#formMessage");

if (contactForm) {
    contactForm.addEventListener("submit", event => {
        event.preventDefault();

        if (formMessage) {
            formMessage.textContent =
                "Thank you. This assessment form is currently a front-end demonstration.";
        }
    });
}


/* Escape key */

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeDropdown();
        hideAffiliations();
    }
});


/* Initial state */

updateHeader();
updateBackdropFromScroll();
initListingsGallery();