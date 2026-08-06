/* =========================================================================
   Disha Consultancy — site behaviour
   Vanilla JS, no dependencies. Everything degrades gracefully without it.
   ========================================================================= */
(function () {
  'use strict';

  /* ---- Mobile navigation ------------------------------------------------ */
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('primary-nav');

  if (toggle && nav) {
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      nav.classList.toggle('is-open', open);
      document.body.classList.toggle('nav-open', open);
    };

    toggle.addEventListener('click', () => {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });

    document.addEventListener('click', (e) => {
      if (
        nav.classList.contains('is-open') &&
        !nav.contains(e.target) &&
        !toggle.contains(e.target)
      ) {
        setOpen(false);
      }
    });
  }

  /* ---- Highlight the current section in the nav -------------------------
     Each page declares an id like "services-neet" or "blog-post"; a nav item
     lights up when the page id starts with its match key. */
  const pageId = document.body.dataset.page || '';
  document.querySelectorAll('.nav__link').forEach((link) => {
    const key = link.dataset.nav;
    if (!key) return;
    const isMatch = key === 'home' ? pageId === 'home' : pageId === key || pageId.startsWith(key + '-');
    if (isMatch) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    }
  });

  /* ---- Shadow under the header once you scroll -------------------------- */
  const header = document.getElementById('site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-stuck', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---- Reveal-on-scroll -------------------------------------------------- */
  const revealables = document.querySelectorAll('.reveal');
  if (revealables.length) {
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              io.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
      );
      revealables.forEach((el) => io.observe(el));
    } else {
      revealables.forEach((el) => el.classList.add('is-visible'));
    }
  }

  /* ---- Count-up numbers -------------------------------------------------- */
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    if (Number.isNaN(target) || !('IntersectionObserver' in window)) {
      el.textContent = `${target || el.textContent}${suffix}`;
      return;
    }
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      const duration = 1100;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString('en-IN') + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    io.observe(el);
  });

  /* ---- Lead form --------------------------------------------------------- */
  const form = document.getElementById('lead-form');
  if (form) {
    const status = form.querySelector('.lead-form__status');
    const button = form.querySelector('button[type="submit"]');

    const showError = (name, message) => {
      const slot = form.querySelector(`[data-error-for="${name}"]`);
      const input = form.elements[name];
      if (slot) slot.textContent = message;
      if (input && input.setAttribute) input.setAttribute('aria-invalid', 'true');
    };

    const clearErrors = () => {
      form.querySelectorAll('[data-error-for]').forEach((el) => (el.textContent = ''));
      form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
      if (status) {
        status.textContent = '';
        status.className = 'lead-form__status';
      }
    };

    const validate = () => {
      clearErrors();
      let firstBad = null;
      const fail = (name, msg) => {
        showError(name, msg);
        if (!firstBad) firstBad = form.elements[name];
      };

      const name = form.elements.name.value.trim();
      const phoneDigits = form.elements.phone.value.replace(/\D/g, '');

      if (name.length < 2) fail('name', 'Please enter your name.');
      if (phoneDigits.length < 10 || phoneDigits.length > 13) {
        fail('phone', 'Please enter a valid mobile number.');
      }
      const email = form.elements.email.value.trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        fail('email', 'That email address does not look right.');
      }
      if (!form.elements.role.value) fail('role', 'Please tell us who you are.');
      if (!form.elements.service.value) fail('service', 'Please pick a topic.');
      if (!form.elements.consent.checked) fail('consent', 'We need your consent to contact you.');

      if (firstBad && firstBad.focus) firstBad.focus();
      return !firstBad;
    };

    const collect = () => {
      const data = {};
      new FormData(form).forEach((value, key) => {
        data[key] = typeof value === 'string' ? value.trim() : value;
      });
      data.consent = form.elements.consent.checked ? 'yes' : 'no';
      data.guardian_consent = form.elements.guardian_consent.checked ? 'yes' : 'no';
      data.page = location.pathname;
      data.submitted_at = new Date().toISOString();
      return data;
    };

    // No backend configured? Hand the enquiry to WhatsApp so no lead is ever lost.
    const whatsappFallback = (data) => {
      const lines = [
        `New enquiry from the website`,
        `Name: ${data.name}`,
        `Phone: ${data.phone}`,
        data.email ? `Email: ${data.email}` : '',
        data.city ? `City: ${data.city}` : '',
        `I am a: ${data.role}`,
        `Need help with: ${data.service}`,
        data.message ? `Details: ${data.message}` : '',
      ].filter(Boolean);
      const number = form.dataset.whatsapp;
      window.open(
        `https://wa.me/${number}?text=${encodeURIComponent(lines.join('\n'))}`,
        '_blank',
        'noopener'
      );
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validate()) return;

      // Honeypot: bots fill every field they can see in the HTML.
      if (form.elements.website && form.elements.website.value) return;

      const data = collect();
      const endpoint = form.dataset.endpoint;
      const original = button.dataset.submitLabel || button.textContent;

      button.disabled = true;
      button.textContent = 'Sending…';

      if (!endpoint) {
        whatsappFallback(data);
        button.disabled = false;
        button.textContent = original;
        status.textContent = 'Opening WhatsApp with your details — press send there.';
        status.className = 'lead-form__status is-ok';
        return;
      }

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        form.reset();
        const success = form.dataset.success;
        if (success) {
          location.href = success;
          return;
        }
        status.textContent = 'Thank you! We will call you within one working day.';
        status.className = 'lead-form__status is-ok';
      } catch (err) {
        status.innerHTML =
          'We could not submit the form. Please <a href="tel:' +
          (document.querySelector('a[href^="tel:"]')?.getAttribute('href') || '').replace('tel:', '') +
          '">call us</a> or try WhatsApp.';
        status.className = 'lead-form__status is-err';
        whatsappFallback(data);
      } finally {
        button.disabled = false;
        button.textContent = original;
      }
    });

    // Clear a field's error as soon as the visitor fixes it.
    form.addEventListener('input', (e) => {
      const slot = form.querySelector(`[data-error-for="${e.target.name}"]`);
      if (slot && slot.textContent) {
        slot.textContent = '';
        e.target.removeAttribute('aria-invalid');
      }
    });
  }

  /* ---- Keep only one FAQ answer open at a time -------------------------- */
  const faqGroups = document.querySelectorAll('.faq');
  faqGroups.forEach((group) => {
    const items = group.querySelectorAll('details');
    items.forEach((item) => {
      item.addEventListener('toggle', () => {
        if (!item.open) return;
        items.forEach((other) => {
          if (other !== item) other.open = false;
        });
      });
    });
  });

  /* ---- Current year in any [data-year] element -------------------------- */
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
})();
