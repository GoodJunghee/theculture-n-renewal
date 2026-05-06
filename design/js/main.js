/* ========================================================
   The Culture N — Editorial Renewal
   Main Interactions
   ======================================================== */

(function() {
  'use strict';

  // ===== Header scroll behavior =====
  const header = document.querySelector('.header');
  const isHomePage = document.body.classList.contains('home');
  let lastScroll = 0;

  function onScroll() {
    const y = window.scrollY;

    if (header) {
      if (isHomePage && y < 80) {
        header.classList.add('transparent');
      } else {
        header.classList.remove('transparent');
      }

      // hide on scroll down
      if (y > 200 && y > lastScroll + 4) {
        header.style.transform = 'translateY(-100%)';
      } else {
        header.style.transform = 'translateY(0)';
      }
      lastScroll = y;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  if (isHomePage) header?.classList.add('transparent');

  // ===== Mobile menu =====
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');

  function setMenuState(open) {
    if (!navMenu || !navToggle) return;
    navMenu.classList.toggle('open', open);
    navToggle.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }

  navToggle?.addEventListener('click', () => {
    const isOpen = navMenu.classList.contains('open');
    setMenuState(!isOpen);
  });

  // Close menu on link click (smooth UX on mobile)
  navMenu?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => setMenuState(false));
  });

  // Close on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu?.classList.contains('open')) {
      setMenuState(false);
    }
  });

  // Close on resize to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900 && navMenu?.classList.contains('open')) {
      setMenuState(false);
    }
  });

  // ===== Reveal on scroll =====
  const reveals = document.querySelectorAll('.reveal, .reveal-stagger');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  reveals.forEach((el) => observer.observe(el));

  // ===== Smooth anchor scroll =====
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length <= 1) return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // ===== Number counter =====
  const counters = document.querySelectorAll('.count-up');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseFloat(el.dataset.target);
        const duration = parseInt(el.dataset.duration || '1800');
        const decimals = parseInt(el.dataset.decimals || '0');
        const start = performance.now();

        function tick(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = (target * eased).toFixed(decimals);
          if (progress < 1) requestAnimationFrame(tick);
          else el.textContent = target.toFixed(decimals);
        }

        requestAnimationFrame(tick);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach((el) => counterObserver.observe(el));

  // ===== Tab switching (generic) =====
  document.querySelectorAll('[data-tabs]').forEach((tabs) => {
    const buttons = tabs.querySelectorAll('[data-tab]');
    const panels = document.querySelectorAll('[data-panel]');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.tab;
        buttons.forEach((b) => b.classList.toggle('active', b === btn));
        panels.forEach((p) => p.classList.toggle('active', p.dataset.panel === id));
      });
    });
  });

  // ===== Tilt effect on cards (subtle) =====
  document.querySelectorAll('[data-tilt]').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `perspective(1000px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });
})();
