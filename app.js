/* ============================================================
   app.js — Артур Грунвальд portfolio
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     1. SMOOTH SCROLL on anchor nav clicks
     ---------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      closeMobileMenu();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });

  /* ----------------------------------------------------------
     2. MOBILE MENU TOGGLE
     ---------------------------------------------------------- */
  var hamburger = document.querySelector('.hamburger');
  var mobileMenu = document.getElementById('mobile-menu');

  function closeMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    if (hamburger) {
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.classList.remove('open');
    }
  }

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
      var isOpen = mobileMenu.classList.toggle('open');
      mobileMenu.setAttribute('aria-hidden', String(!isOpen));
      hamburger.setAttribute('aria-expanded', String(isOpen));
      hamburger.classList.toggle('open', isOpen);
    });

    document.addEventListener('click', function (e) {
      if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
        closeMobileMenu();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMobileMenu();
    });
  }

  /* ----------------------------------------------------------
     3. FADE-UP IntersectionObserver (scroll reveals)
     ---------------------------------------------------------- */
  var fadeEls = document.querySelectorAll('.fade-up');

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
    );

    fadeEls.forEach(function (el) { observer.observe(el); });
  } else {
    fadeEls.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ----------------------------------------------------------
     4. HERO — fade-up line reveals on page load
     ---------------------------------------------------------- */
  function revealLine(lineId, delaySeconds) {
    var el = document.getElementById(lineId);
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(18px)';
    el.style.transition = 'opacity 0.65s cubic-bezier(0.22,1,0.36,1), transform 0.65s cubic-bezier(0.22,1,0.36,1)';
    el.style.transitionDelay = delaySeconds + 's';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
    });
  }

  revealLine('hero-line-1', 0.1);
  revealLine('hero-line-2', 0.28);
  revealLine('hero-line-3', 0.46);

  /* ----------------------------------------------------------
     5. HERO — typewriter effect
     ---------------------------------------------------------- */
  var typewriterEl = document.getElementById('hero-typewriter');
  var typewriterWords = [
    'Telegram\u2011боты',
    'AI\u2011интеграции',
    'веб\u2011приложения',
    'чат\u2011боты с памятью',
    'SaaS\u2011MVP под ключ',
    'RAG и векторный поиск'
  ];
  var twIndex = 0;
  var twDeleting = false;
  var TW_TYPE_SPEED = 72;
  var TW_DELETE_SPEED = 38;
  var TW_PAUSE_SHOW = 2400;
  var TW_PAUSE_BETWEEN = 300;

  function getChar() {
    if (!typewriterEl) return 0;
    return typewriterEl.textContent.length;
  }

  function typewriterTick() {
    if (!typewriterEl) return;
    var word = typewriterWords[twIndex];
    var cur  = getChar();

    if (!twDeleting) {
      // Typing forward
      typewriterEl.textContent = word.slice(0, cur + 1);
      if (cur + 1 === word.length) {
        // Finished typing — pause then delete
        twDeleting = true;
        setTimeout(typewriterTick, TW_PAUSE_SHOW);
      } else {
        setTimeout(typewriterTick, TW_TYPE_SPEED);
      }
    } else {
      // Deleting
      typewriterEl.textContent = word.slice(0, cur - 1);
      if (cur - 1 === 0) {
        // Finished deleting — move to next word
        twDeleting = false;
        twIndex = (twIndex + 1) % typewriterWords.length;
        setTimeout(typewriterTick, TW_PAUSE_BETWEEN);
      } else {
        setTimeout(typewriterTick, TW_DELETE_SPEED);
      }
    }
  }

  // First word is already pre-rendered in HTML; start by pausing then deleting it
  if (typewriterEl) {
    twDeleting = true;
    setTimeout(typewriterTick, TW_PAUSE_SHOW);
  }

  /* ----------------------------------------------------------
     6. ANIMATED COUNTERS (stats strip)
     ---------------------------------------------------------- */
  var counterEls = document.querySelectorAll('.stat-number[data-target]');

  function animateCounter(el) {
    var target = parseInt(el.getAttribute('data-target'), 10);
    var duration = 1400;
    var startTime = null;

    function easeOutExpo(t) {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = easeOutExpo(progress);
      el.textContent = Math.floor(eased * target);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target;
      }
    }

    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window && counterEls.length) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counterEls.forEach(function (el) { counterObserver.observe(el); });
  }

  /* ----------------------------------------------------------
     7. TILT ON HOVER for case cards
     ---------------------------------------------------------- */
  var tiltCards = document.querySelectorAll('.tilt-card');

  tiltCards.forEach(function (card) {
    var MAX_TILT = 8; // degrees
    var isHovering = false;

    card.addEventListener('mouseenter', function () {
      isHovering = true;
      card.style.transition = 'border-color 0.22s ease, box-shadow 0.22s ease, transform 0.12s ease';
    });

    card.addEventListener('mouseleave', function () {
      isHovering = false;
      card.style.transition = 'border-color 0.22s ease, box-shadow 0.22s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1)';
      card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)';
    });

    card.addEventListener('mousemove', function (e) {
      if (!isHovering) return;
      var rect = card.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var dx = (e.clientX - cx) / (rect.width / 2);
      var dy = (e.clientY - cy) / (rect.height / 2);
      var rotateY = dx * MAX_TILT;
      var rotateX = -dy * MAX_TILT;
      card.style.transform = 'perspective(800px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) scale(1.025)';
    });
  });

  /* ----------------------------------------------------------
     8. MAGNETIC CURSOR EFFECT on CTAs
     ---------------------------------------------------------- */
  var magneticBtns = document.querySelectorAll('.magnetic-btn');

  magneticBtns.forEach(function (btn) {
    var STRENGTH = 0.35;

    btn.addEventListener('mousemove', function (e) {
      var rect = btn.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var dx = (e.clientX - cx) * STRENGTH;
      var dy = (e.clientY - cy) * STRENGTH;
      btn.style.transform = 'translate(' + dx + 'px, ' + dy + 'px) scale(1.03)';
      btn.style.transition = 'transform 0.18s cubic-bezier(0.22,1,0.36,1)';
    });

    btn.addEventListener('mouseleave', function () {
      btn.style.transform = 'translate(0, 0) scale(1)';
      btn.style.transition = 'transform 0.45s cubic-bezier(0.22,1,0.36,1)';
    });
  });

  /* ----------------------------------------------------------
     9. CUSTOM CURSOR DOT (desktop only)
     ---------------------------------------------------------- */
  var cursorDot = document.getElementById('cursor-dot');

  if (cursorDot && window.matchMedia('(pointer: fine)').matches) {
    var mouseX = 0, mouseY = 0;
    var dotX = 0, dotY = 0;
    var dotVisible = false;

    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!dotVisible) {
        cursorDot.style.opacity = '1';
        dotVisible = true;
      }
    });

    document.addEventListener('mouseleave', function () {
      cursorDot.style.opacity = '0';
      dotVisible = false;
    });

    // Hover on interactive elements — scale up
    var interactives = document.querySelectorAll('a, button, .case-card, .faq-question, .tilt-card');
    interactives.forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        cursorDot.style.transform = 'translate(-50%, -50%) scale(4)';
        cursorDot.style.opacity = '0.4';
      });
      el.addEventListener('mouseleave', function () {
        cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
        cursorDot.style.opacity = dotVisible ? '1' : '0';
      });
    });

    function animateCursor() {
      // Smooth follow with lerp
      dotX += (mouseX - dotX) * 0.18;
      dotY += (mouseY - dotY) * 0.18;
      cursorDot.style.left = dotX + 'px';
      cursorDot.style.top  = dotY + 'px';
      requestAnimationFrame(animateCursor);
    }
    animateCursor();
  }

  /* ----------------------------------------------------------
     10. HEADER hide/show on scroll
     ---------------------------------------------------------- */
  var header = document.querySelector('.site-header');
  var lastY = 0;
  var ticking = false;

  if (header) {
    header.style.transition = 'transform 0.32s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease';

    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          var y = window.scrollY;
          if (y > lastY && y > 100) {
            header.style.transform = 'translateY(-100%)';
          } else {
            header.style.transform = 'translateY(0)';
          }
          lastY = y;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ----------------------------------------------------------
     11. CONTACT FORM SUBMISSION
     ---------------------------------------------------------- */
  var form      = document.getElementById('contact-form');
  var submitBtn = document.getElementById('submit-btn');
  var statusEl  = document.getElementById('form-status');

  function setStatus(type, message) {
    statusEl.textContent = message;
    statusEl.className = 'form-status ' + type;
    statusEl.hidden = false;
    statusEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function clearStatus() {
    statusEl.hidden = true;
    statusEl.textContent = '';
    statusEl.className = 'form-status';
  }

  function setLoading(loading) {
    var btnText    = submitBtn.querySelector('.btn-text');
    var btnLoading = submitBtn.querySelector('.btn-loading');
    submitBtn.disabled = loading;
    if (btnText)    btnText.hidden    = loading;
    if (btnLoading) btnLoading.hidden = !loading;
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearStatus();

      var name    = (form.elements['name'].value    || '').trim();
      var contact = (form.elements['contact'].value || '').trim();
      var message = (form.elements['message'].value || '').trim();

      if (!name || !contact || !message) {
        setStatus('error', 'Пожалуйста, заполните все поля.');
        return;
      }

      setLoading(true);

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, contact: contact, message: message })
      })
        .then(function (res) {
          if (res.ok) {
            setStatus('success', 'Спасибо! Отвечу в Telegram.');
            form.reset();
          } else {
            return res.json().catch(function () { return null; }).then(function (data) {
              throw new Error((data && data.detail) || 'server_error');
            });
          }
        })
        .catch(function () {
          setStatus('error', 'Не удалось отправить — напишите в Telegram напрямую.');
        })
        .finally(function () {
          setLoading(false);
        });
    });
  }

  /* ----------------------------------------------------------
     12. FAQ — smooth accordion animation
     ---------------------------------------------------------- */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    item.addEventListener('toggle', function () {
      // CSS handles the chevron rotation via [open] selector
      // Add a subtle flash on open
      if (item.open) {
        item.style.transition = 'border-color 0.22s ease, box-shadow 0.22s ease';
      }
    });
  });

})();
