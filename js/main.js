/* ============================================================
   VEERAMREDDY SESHAVENI PORTFOLIO - main.js
   ============================================================ */
(function () {
  'use strict';

  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const finePointer = window.matchMedia?.('(pointer: fine)')?.matches;
  const directContactEmail = 'veeramreddyseshaveni6661@gmail.com';
  const supportsServerRequests = ['http:', 'https:'].includes(window.location.protocol);
  const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const apiBaseUrl = isLocalHost && window.location.port !== '3000' ? 'http://localhost:3000' : '';
  const apiUrl = (path) => `${apiBaseUrl}${path}`;

  /* ---- PRELOADER ---- */
  const initPreloader = () => {
    const preloader = qs('#preloader');
    const plBar = qs('#plBar');
    const plPct = qs('#plPct');
    const plProgress = qs('.pl-progress');

    if (!preloader || !plBar || !plPct || !plProgress) return;

    let pct = 0;
    const duration = 1800; // ms
    const start = performance.now();

    const animateLoader = (time) => {
      const elapsed = time - start;
      const rawProgress = Math.min(elapsed / duration, 1);
      
      // easeOutQuart curve
      const progress = 1 - Math.pow(1 - rawProgress, 4);
      pct = Math.floor(progress * 100);

      plBar.style.width = Math.max(pct, 2) + '%';
      
      const offset = 290 - (progress * 290);
      plProgress.style.strokeDashoffset = offset;
      
      plPct.textContent = pct + '%';

      if (rawProgress < 1) {
        requestAnimationFrame(animateLoader);
      } else {
        setTimeout(() => {
          preloader.style.opacity = '0';
          preloader.style.visibility = 'hidden';
          setTimeout(() => preloader.remove(), 800);
        }, 150);
      }
    };
    
    requestAnimationFrame(animateLoader);
  };

  initPreloader();

  let lenisInstance = null;

  const initSmoothScroll = () => {
    if (typeof Lenis === 'undefined' || reducedMotion) return;

    lenisInstance = new Lenis({ duration: 1.2, smoothWheel: true });

    const raf = (time) => {
      lenisInstance.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      lenisInstance.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenisInstance.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  };

  const initHeroParticles = () => {
    if (typeof THREE === 'undefined' || reducedMotion) return;

    const canvas = qs('#hero-canvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, canvas.offsetWidth / canvas.offsetHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

    const count = 2000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 1) positions[i] = (Math.random() - 0.5) * 5;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({ size: 0.005, color: '#ff8a00' });
    const points = new THREE.Points(geometry, material);
    scene.add(points);
    camera.position.z = 2;

    let mouseX = 0;
    let mouseY = 0;
    window.addEventListener('mousemove', (event) => {
      mouseX = (event.clientX / window.innerWidth) - 0.5;
      mouseY = (event.clientY / window.innerHeight) - 0.5;
    });

    const tick = () => {
      requestAnimationFrame(tick);
      points.rotation.y += 0.001;
      points.rotation.x += 0.0005;

      if (finePointer) {
        points.rotation.y += mouseX * 0.05;
        points.rotation.x -= mouseY * 0.05;
      }

      renderer.render(scene, camera);
    };
    tick();

    window.addEventListener('resize', () => {
      const width = canvas.offsetWidth || 1;
      const height = canvas.offsetHeight || 1;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
  };

  const initScrollAnimations = () => {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      qsa('.reveal-up, .reveal-left, .reveal-right').forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // ---- SKILLS SECTION: all 3 groups animate simultaneously ----
    const skillsSection = qs('#skills');
    if (skillsSection) {
      const langCard   = skillsSection.querySelector('.reveal-left');
      const mlCard     = skillsSection.querySelector('.reveal-right');
      const toolsCard  = skillsSection.querySelector('.skill-group--center');

      const skillsTl = gsap.timeline({
        scrollTrigger: {
          trigger: skillsSection,
          start: 'top 72%',
          onEnter: self => self.animation && self.animation.timeScale(1).play(),
          onLeaveBack: self => self.animation && self.animation.timeScale(4).reverse()
        },
      });

      if (langCard)  skillsTl.fromTo(langCard,  { opacity: 0, x: -80 }, { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out' }, 0);
      if (mlCard)    skillsTl.fromTo(mlCard,    { opacity: 0, x:  80 }, { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out' }, 0);
      if (toolsCard) skillsTl.fromTo(toolsCard, { opacity: 0, y:  60 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 0);
    }

    // ---- GENERIC reveal-up (skip hero + skill cards already handled) ----
    qsa('.reveal-up').forEach((el) => {
      if (el.closest('.hero')) return;
      if (el.classList.contains('skill-group--center')) return; // handled above
      if (el.classList.contains('work-item')) return; // handled separately

      gsap.fromTo(el, { opacity: 0, y: 40 }, {
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' },
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out'
      });
    });

    // ---- GENERIC reveal-left (skip skills section, already handled) ----
    qsa('.reveal-left').forEach((el) => {
      if (el.closest('#skills')) return;
      gsap.fromTo(el, { opacity: 0, x: -60 }, {
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' },
        opacity: 1,
        x: 0,
        duration: 0.9,
        ease: 'power3.out'
      });
    });

    // ---- GENERIC reveal-right (skip skills section, already handled) ----
    qsa('.reveal-right').forEach((el) => {
      if (el.closest('#skills')) return;
      gsap.fromTo(el, { opacity: 0, x: 60 }, {
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' },
        opacity: 1,
        x: 0,
        duration: 0.9,
        ease: 'power3.out'
      });
    });


    qsa('.work-item').forEach((item, index) => {
      const dataDelay = parseFloat(item.dataset.delay || 0) / 1000;
      gsap.fromTo(item, 
        {
          opacity: 0,
          x: index % 2 === 0 ? -70 : 70,
        },
        {
          scrollTrigger: { trigger: item, start: 'top 88%', toggleActions: 'play none none reverse' },
          opacity: 1,
          x: 0,
          duration: 0.85,
          ease: 'power3.out',
          delay: dataDelay || index * 0.1
        }
      );
    });

    qsa('.cert-card').forEach((card, index) => {
      const dataDelay = parseFloat(card.dataset.delay || 0) / 1000;
      gsap.fromTo(card, 
        {
          opacity: 0,
          x: index % 2 === 0 ? -70 : 70,
        },
        {
          scrollTrigger: { trigger: card, start: 'top 90%', toggleActions: 'play none none reverse' },
          opacity: 1,
          x: 0,
          duration: 0.85,
          ease: 'power3.out',
          delay: dataDelay || index * 0.1
        }
      );
    });

    qsa('.skill-bar-fill').forEach((bar) => {
      const targetVal = parseFloat(bar.dataset.w || '0');
      const pctEl = bar.closest('.skill-bar')?.querySelector('.skill-bar-pct');
      gsap.fromTo(
        bar,
        { width: '0%' },
        {
          width: `${targetVal}%`,
          duration: 1.4,
          ease: 'power2.out',
          scrollTrigger: { trigger: bar, start: 'top 90%', toggleActions: 'play none none reverse' },
          onUpdate: function() {
            if (pctEl) {
              pctEl.textContent = Math.round(targetVal * this.progress()) + '%';
            }
          }
        }
      );
    });

    qsa('.soft-arc').forEach((arc) => {
      const ring = arc.closest('.soft-ring');
      const targetVal = parseFloat(ring?.dataset.val || '0');
      const spanEl = ring?.querySelector('span');
      gsap.fromTo(
        arc,
        { strokeDasharray: '0 100' },
        {
          strokeDasharray: `${targetVal} 100`,
          duration: 1.5,
          ease: 'power2.out',
          scrollTrigger: { trigger: arc, start: 'top 90%', toggleActions: 'play none none reverse' },
          onUpdate: function() {
            if (spanEl) {
              spanEl.textContent = Math.round(targetVal * this.progress());
            }
          }
        }
      );
    });

    ScrollTrigger.create({
      start: 'top -80',
      onEnter: () => qs('.site-header')?.classList.add('scrolled'),
      onLeaveBack: () => qs('.site-header')?.classList.remove('scrolled'),
    });
  };

  const initProjectFilters = () => {
    const chips = qsa('.filter-chip');
    const items = qsa('.work-item');
    const searchInput = qs('#projectSearch');
    const emptyState = qs('#workEmpty');

    if (!chips.length || !items.length) return;

    let currentFilter = 'all';

    const applyFilters = () => {
      const term = (searchInput?.value || '').trim().toLowerCase();
      let visibleCount = 0;

      items.forEach((item) => {
        const category = item.dataset.category || '';
        const indexedText = `${item.dataset.search || ''} ${item.textContent || ''}`.toLowerCase();

        const matchesFilter = currentFilter === 'all' || category === currentFilter;
        const matchesSearch = !term || indexedText.includes(term);
        const isVisible = matchesFilter && matchesSearch;

        item.hidden = !isVisible;
        if (isVisible) visibleCount += 1;
      });

      if (emptyState) emptyState.hidden = visibleCount !== 0;
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    };

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        currentFilter = chip.dataset.filter || 'all';
        chips.forEach((btn) => btn.classList.toggle('is-active', btn === chip));
        applyFilters();
      });
    });

    searchInput?.addEventListener('input', applyFilters);
    applyFilters();
  };

  const initMobileNav = () => {
    const navToggle = qs('.nav-toggle');
    const navLinks = qs('[data-nav]');
    if (!navToggle || !navLinks) return;

    const closeMenu = () => {
      navToggle.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('open');
    };

    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      navLinks.classList.toggle('open', !expanded);
    });

    qsa('.nav-link', navLinks).forEach((link) => link.addEventListener('click', closeMenu));

    document.addEventListener('click', (event) => {
      if (!navLinks.classList.contains('open')) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest('.site-header')) closeMenu();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) closeMenu();
    });
  };

  const initBackToTop = () => {
    const backTop = qs('#backTop');
    if (!backTop) return;

    const toggleVisibility = () => {
      backTop.classList.toggle('is-visible', window.scrollY > 550);
    };

    backTop.addEventListener('click', () => {
      if (lenisInstance) {
        lenisInstance.scrollTo(0, { duration: 1 });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    toggleVisibility();
  };

  const initMessageCounter = () => {
    const messageInput = qs('#message');
    const counter = qs('#messageCount');
    if (!messageInput || !counter) return;

    const update = () => {
      const current = messageInput.value.length;
      const max = Number(messageInput.getAttribute('maxlength')) || 1200;
      counter.textContent = `${current} / ${max}`;
    };

    messageInput.addEventListener('input', update);
    update();
  };

  const initContactForm = () => {
    const contactForm = qs('#contactForm');
    const formStatus = qs('#formStatus');
    const submitBtn = qs('.btn-submit');
    if (!contactForm || !formStatus || !submitBtn) return;

    const buildMailtoLink = (data) => {
      const subjectLabel = String(data.subject || '').trim() || 'Portfolio contact';
      const body = [
        `Name: ${String(data.name || '').trim()}`,
        `Email: ${String(data.email || '').trim()}`,
        '',
        String(data.message || '').trim(),
      ].join('\n');

      return `mailto:${directContactEmail}?subject=${encodeURIComponent(subjectLabel)}&body=${encodeURIComponent(body)}`;
    };

    const fallbackToMailClient = (data, reason) => {
      formStatus.textContent = reason;
      formStatus.className = 'form-status warning';
      window.location.href = buildMailtoLink(data);
    };

    contactForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }

      const data = Object.fromEntries(new FormData(contactForm).entries());

      if (!supportsServerRequests) {
        fallbackToMailClient(
          data,
          'This page needs the local server for direct sending. Opening your mail app instead.'
        );
        return;
      }

      submitBtn.classList.add('is-busy');
      submitBtn.disabled = true;
      formStatus.textContent = 'Sending message...';
      formStatus.className = 'form-status';
      let timeoutId;

      try {
        const controller = new AbortController();
        timeoutId = window.setTimeout(() => controller.abort(), 10000);
        const response = await fetch(apiUrl('/send-email'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify(data),
        });
        let result = {};
        try {
          result = await response.json();
        } catch {
          result = {};
        }

        if (response.ok) {
          formStatus.textContent = "Message sent successfully! I'll be in touch soon.";
          formStatus.className = 'form-status success';
          contactForm.reset();
          initMessageCounter();
        } else if (response.status === 429) {
          formStatus.textContent = result.error || 'Too many messages sent. Please try again later.';
          formStatus.className = 'form-status error';
        } else if (
          result.error === 'Email service is not configured.' ||
          response.status >= 500
        ) {
          fallbackToMailClient(
            data,
            result.error || 'Email could not be sent from the server. Opening your mail app instead.'
          );
        } else {
          formStatus.textContent = result.error || 'Failed to send. Please try again.';
          formStatus.className = 'form-status error';
        }
      } catch {
        fallbackToMailClient(
          data,
          'The server could not be reached. Opening your mail app so you can still send the message.'
        );
      } finally {
        if (timeoutId) window.clearTimeout(timeoutId);
        submitBtn.classList.remove('is-busy');
        submitBtn.disabled = false;
      }
    });
  };

  const initCopyButtons = () => {
    qsa('[data-copy]').forEach((btn) => {
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        navigator.clipboard?.writeText(btn.dataset.copy || '').then(() => {
          const original = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(() => {
            btn.textContent = original || 'Copy';
          }, 1800);
        });
      });
    });
  };

  const initThemeToggle = () => {
    const btn = qs('#themeToggle');
    if (!btn) return;

    // Apply saved or system preference immediately
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : 'dark');

    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      btn.setAttribute('aria-label', next === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
    });
  };

  const init = () => {
    initThemeToggle();
    initSmoothScroll();
    initHeroParticles();
    initScrollAnimations();
    initProjectFilters();
    initMobileNav();
    initBackToTop();
    initMessageCounter();
    initContactForm();
    initCopyButtons();

    const year = qs('#currentYear');
    if (year) year.textContent = String(new Date().getFullYear());
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
