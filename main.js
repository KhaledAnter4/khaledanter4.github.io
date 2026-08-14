(function () {
  var storageKey = 'site-theme';
  var root = document.documentElement;
  var mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function getPreferredTheme() {
    var stored = null;
    try {
      stored = localStorage.getItem(storageKey);
    } catch (error) {
      stored = null;
    }

    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    return mediaQuery.matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    var themeColor = theme === 'dark' ? '#080c14' : '#f8fafc';
    var metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', themeColor);
    }
  }

  applyTheme(getPreferredTheme());

  document.addEventListener('DOMContentLoaded', function () {
    if (document.body && document.body.getAttribute('data-page')) {
      root.setAttribute('data-page', document.body.getAttribute('data-page'));
    }

    var header = document.querySelector('.site-header');
    var nav = document.querySelector('.site-nav');
    var navToggle = document.querySelector('.nav-toggle');
    var themeToggle = document.querySelector('[data-theme-toggle]');
    var revealItems = document.querySelectorAll('.reveal');
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

    // Smooth Page Exit & Entry Transitions
    if (!prefersReducedMotion) {
      document.body.classList.add('page-entering');

      window.addEventListener('pageshow', function () {
        document.body.classList.remove('page-exiting');
      });

      document.addEventListener('click', function (e) {
        var anchor = e.target.closest('a[href]');
        if (!anchor) return;

        var href = anchor.getAttribute('href');
        if (
          !href ||
          href.startsWith('#') ||
          href.startsWith('mailto:') ||
          href.startsWith('tel:') ||
          anchor.target === '_blank' ||
          href.startsWith('http://') ||
          href.startsWith('https://') ||
          href.endsWith('.pdf')
        ) {
          return;
        }

        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
          return;
        }

        e.preventDefault();
        document.body.classList.add('page-exiting');
        setTimeout(function () {
          window.location.href = href;
        }, 260);
      });
    }

    // Dynamic Navbar (Smooth hide on scroll down, show on scroll up)
    if (header && !prefersReducedMotion) {
      var lastScrollY = window.scrollY || document.documentElement.scrollTop;
      var scrollTicking = false;
      var scrollThreshold = 60;

      window.addEventListener('scroll', function () {
        if (!scrollTicking) {
          requestAnimationFrame(updateHeaderScroll);
          scrollTicking = true;
        }
      }, { passive: true });

      function updateHeaderScroll() {
        var currentScrollY = window.scrollY || document.documentElement.scrollTop;

        if (currentScrollY <= scrollThreshold) {
          header.classList.remove('is-hidden');
        } else if (currentScrollY > lastScrollY + 5) {
          header.classList.add('is-hidden');
        } else if (currentScrollY < lastScrollY - 5) {
          header.classList.remove('is-hidden');
        }

        lastScrollY = Math.max(0, currentScrollY);
        scrollTicking = false;
      }
    }

    // Theme Switcher
    if (themeToggle) {
      themeToggle.addEventListener('click', function () {
        var nextTheme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme);
        try {
          localStorage.setItem(storageKey, nextTheme);
        } catch (error) {
          // noop
        }
      });
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', function (event) {
        var stored = null;
        try {
          stored = localStorage.getItem(storageKey);
        } catch (error) {
          stored = null;
        }
        if (!stored) {
          applyTheme(event.matches ? 'dark' : 'light');
        }
      });
    }

    // Mobile Navigation Toggle
    if (nav && navToggle) {
      navToggle.addEventListener('click', function () {
        var isOpen = nav.classList.toggle('is-open');
        navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        navToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
      });

      nav.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          nav.classList.remove('is-open');
          navToggle.setAttribute('aria-expanded', 'false');
          navToggle.setAttribute('aria-label', 'Open navigation');
        });
      });
    }

    // Ambient Mouse Light (Smooth fade on motion, fade out when idle)
    if (!prefersReducedMotion && !isTouchDevice) {
      var light = document.createElement('div');
      light.className = 'ambient-light';
      document.body.appendChild(light);

      var mouseX = window.innerWidth / 2;
      var mouseY = window.innerHeight / 2;
      var currentX = mouseX;
      var currentY = mouseY;
      var ticking = false;
      var fadeTimer = null;

      window.addEventListener('mousemove', function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;

        light.style.opacity = '0.85';
        clearTimeout(fadeTimer);
        fadeTimer = setTimeout(function () {
          light.style.opacity = '0';
        }, 600);

        if (!ticking) {
          requestAnimationFrame(updateLight);
          ticking = true;
        }
      });

      function updateLight() {
        currentX += (mouseX - currentX) * 0.12;
        currentY += (mouseY - currentY) * 0.12;
        light.style.transform = 'translate(' + currentX + 'px, ' + currentY + 'px) translate(-50%, -50%)';
        ticking = false;
        if (Math.abs(mouseX - currentX) > 0.5 || Math.abs(mouseY - currentY) > 0.5) {
          requestAnimationFrame(updateLight);
          ticking = true;
        }
      }

      // Pointer Tracking for Glass Hover Glow
      var glassElements = document.querySelectorAll('.contact-tile, .project-card, .editorial-card, .cv-card');
      glassElements.forEach(function (el) {
        el.addEventListener('mousemove', function (e) {
          var rect = el.getBoundingClientRect();
          var x = e.clientX - rect.left;
          var y = e.clientY - rect.top;
          el.style.setProperty('--pointer-x', x + 'px');
          el.style.setProperty('--pointer-y', y + 'px');
        });
      });
    }

    // Scroll Reveal Observer
    if (!revealItems.length || prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealItems.forEach(function (item) {
        item.classList.add('is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.1
    });

    revealItems.forEach(function (item) {
      observer.observe(item);
    });
  });

  // Dynamic Browser Tab Title (Page Visibility API)
  (function () {
    var originalTitle = document.title;
    var hiddenTitle = "I'm watching you 👁️";

    document.addEventListener('visibilitychange', function () {
      if (document.hidden || document.visibilityState === 'hidden') {
        if (document.title !== hiddenTitle) {
          originalTitle = document.title;
        }
        document.title = hiddenTitle;
      } else {
        document.title = originalTitle;
      }
    });
  })();
})();
