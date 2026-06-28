/**
 * Aditya Upadhyay — Portfolio
 * script.js
 *
 * Responsibilities:
 *  1. Smooth scroll for anchor links
 *  2. Scroll-reveal animation for .reveal elements
 *  3. Sticky left panel height correction on resize
 */

'use strict';

/* ======================================================
   1. SMOOTH SCROLL
   Intercepts clicks on .scroll-link anchors and scrolls
   smoothly to the target section, accounting for any
   fixed headers if added later.
====================================================== */

document.querySelectorAll('a.scroll-link, a[href^="#"]').forEach(link => {
  link.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (!href || href === '#') return;

    const target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});


/* ======================================================
   2. SCROLL REVEAL
   Uses IntersectionObserver to add .visible to .reveal
   elements when they enter the viewport.
====================================================== */

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Stop watching once revealed — animate in only once
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.12,     // trigger when 12% of element is visible
    rootMargin: '0px 0px -40px 0px'
  }
);

document.querySelectorAll('.reveal').forEach(el => {
  revealObserver.observe(el);
});


/* ======================================================
   3. STICKY LEFT PANEL HEIGHT CORRECTION
   Ensures the sticky hero-left panel fills exactly the
   viewport height on all screen sizes.
====================================================== */

function setHeroLeftHeight() {
  const heroLeft = document.querySelector('.hero-left');
  if (!heroLeft) return;

  // Only apply sticky height on wide screens (matching CSS breakpoint)
  if (window.innerWidth > 900) {
    heroLeft.style.height = `${window.innerHeight}px`;
  } else {
    heroLeft.style.height = 'auto';
  }
}

// Run on load and on resize (debounced for performance)
setHeroLeftHeight();

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(setHeroLeftHeight, 120);
});
