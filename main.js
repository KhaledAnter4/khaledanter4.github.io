(function () {
  'use strict';

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
    root.style.backgroundColor = themeColor;
    root.style.colorScheme = theme;

    var metaThemes = document.querySelectorAll('meta[name="theme-color"]');
    if (metaThemes.length > 0) {
      metaThemes.forEach(function (meta) {
        if (!meta.getAttribute('media')) {
          meta.setAttribute('content', themeColor);
        }
      });
    }
  }

  // Ensure theme state is aligned with root
  applyTheme(root.getAttribute('data-theme') || getPreferredTheme());

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

    // Theme Switcher with smooth transition during explicit toggle
    if (themeToggle) {
      function updateToggleLabel(theme) {
        themeToggle.setAttribute(
          'aria-label',
          theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
        );
      }
      updateToggleLabel(root.getAttribute('data-theme') || 'light');

      themeToggle.addEventListener('click', function () {
        var currentTheme = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        var nextTheme = currentTheme === 'dark' ? 'light' : 'dark';

        root.classList.add('is-theme-toggling');
        applyTheme(nextTheme);
        updateToggleLabel(nextTheme);

        try {
          localStorage.setItem(storageKey, nextTheme);
        } catch (error) {
          // noop
        }

        setTimeout(function () {
          root.classList.remove('is-theme-toggling');
        }, 300);
      });
    }

    // System theme preference listener
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
          if (themeToggle) {
            themeToggle.setAttribute(
              'aria-label',
              event.matches ? 'Switch to light theme' : 'Switch to dark theme'
            );
          }
        }
      });
    }

    // Dynamic Navbar (Smooth hide on scroll down, show on scroll up)
    if (header && !prefersReducedMotion) {
      var lastScrollY = window.scrollY || document.documentElement.scrollTop;
      var scrollTicking = false;
      var scrollThreshold = 60;

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

      window.addEventListener(
        'scroll',
        function () {
          if (!scrollTicking) {
            requestAnimationFrame(updateHeaderScroll);
            scrollTicking = true;
          }
        },
        { passive: true }
      );
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

    // Ambient Mouse Light (Hardware accelerated, idles cleanly)
    if (!prefersReducedMotion && !isTouchDevice) {
      var light = document.createElement('div');
      light.className = 'ambient-light';
      document.body.appendChild(light);

      var mouseX = window.innerWidth / 2;
      var mouseY = window.innerHeight / 2;
      var currentX = mouseX;
      var currentY = mouseY;
      var isTracking = false;
      var fadeTimer = null;

      function updateLight() {
        currentX += (mouseX - currentX) * 0.12;
        currentY += (mouseY - currentY) * 0.12;

        light.style.transform = 'translate3d(' + (currentX - 275) + 'px, ' + (currentY - 275) + 'px, 0)';

        if (Math.abs(mouseX - currentX) > 0.5 || Math.abs(mouseY - currentY) > 0.5) {
          requestAnimationFrame(updateLight);
        } else {
          isTracking = false;
        }
      }

      window.addEventListener(
        'mousemove',
        function (e) {
          mouseX = e.clientX;
          mouseY = e.clientY;

          light.style.opacity = '0.85';
          clearTimeout(fadeTimer);
          fadeTimer = setTimeout(function () {
            light.style.opacity = '0';
          }, 600);

          if (!isTracking) {
            requestAnimationFrame(updateLight);
            isTracking = true;
          }
        },
        { passive: true }
      );

      // Pointer Tracking for Glass Hover Glow (Cached getBoundingClientRect to prevent layout reflows)
      var glassElements = document.querySelectorAll(
        '.contact-tile, .project-card, .editorial-card, .cv-card, .featured-project-card'
      );
      glassElements.forEach(function (el) {
        var rect = null;

        el.addEventListener(
          'mouseenter',
          function () {
            rect = el.getBoundingClientRect();
          },
          { passive: true }
        );

        el.addEventListener(
          'mousemove',
          function (e) {
            if (!rect) {
              rect = el.getBoundingClientRect();
            }
            var x = e.clientX - rect.left;
            var y = e.clientY - rect.top;
            el.style.setProperty('--pointer-x', x + 'px');
            el.style.setProperty('--pointer-y', y + 'px');
          },
          { passive: true }
        );

        el.addEventListener(
          'mouseleave',
          function () {
            rect = null;
          },
          { passive: true }
        );
      });
    }

    // Scroll Reveal Observer
    if (!revealItems.length || prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealItems.forEach(function (item) {
        item.classList.add('is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.1
      }
    );

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
