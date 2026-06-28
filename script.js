'use strict';

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
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  }
);

document.querySelectorAll('.reveal').forEach(el => {
  revealObserver.observe(el);
});

function setHeroLeftHeight() {
  const heroLeft = document.querySelector('.hero-left');
  if (!heroLeft) return;

  if (window.innerWidth > 900) {
    heroLeft.style.height = `${window.innerHeight}px`;
  } else {
    heroLeft.style.height = 'auto';
  }
}

setHeroLeftHeight();

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(setHeroLeftHeight, 120);
});

(function () {
  const STORAGE_KEY = 'au-theme';
  const html        = document.documentElement;
  const btn         = document.getElementById('themeToggle');

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'dark') html.setAttribute('data-theme', 'dark');

  if (btn) {
    btn.addEventListener('click', () => {
      const isDark = html.getAttribute('data-theme') === 'dark';

      if (isDark) {
        html.removeAttribute('data-theme');
        localStorage.setItem(STORAGE_KEY, 'light');
        btn.setAttribute('aria-label', 'Switch to dark mode');
      } else {
        html.setAttribute('data-theme', 'dark');
        localStorage.setItem(STORAGE_KEY, 'dark');
        btn.setAttribute('aria-label', 'Switch to light mode');
      }
    });
  }
})();