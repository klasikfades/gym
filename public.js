/* public.js - landing page logic for gym-tracker.
   All data is loaded from the Apps Script web app (the Settings sheet is the
   only source of gym name, address, phone, email and prices). No personal data
   is cached in the browser here. */
(function () {
  'use strict';

  var API = (window.GYM_CONFIG && window.GYM_CONFIG.API_URL) || '';
  var FALLBACK = (window.GYM_CONFIG && window.GYM_CONFIG.FALLBACK) || {};
  var configured = API && API.indexOf('PASTE_') !== 0;

  function el(id) { return document.getElementById(id); }

  function text(node, value) {
    if (node) node.textContent = value == null ? '' : String(value);
  }

  function setHidden(node, hidden) {
    if (node) node.hidden = !!hidden;
  }

  async function api(action, payload) {
    if (!configured) throw new Error('not-configured');
    var res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: action, payload: payload || {} }),
      redirect: 'follow'
    });
    if (!res.ok) throw new Error('network');
    var data = await res.json();
    if (!data || !data.ok) throw new Error((data && data.error && data.error.message) || 'Request failed');
    return data.data;
  }

  function applyTheme(mode) {
    var theme = mode === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
  }

  function fillGym(gym) {
    var g = Object.assign({}, FALLBACK, gym || {});
    text(el('brand-name'), g.gym_name);
    text(el('footer-name'), g.gym_name);
    text(el('hero-hours'), g.opening_hours ? 'Open ' + g.opening_hours : 'Welcome');
    text(el('c-address'), g.contact_address || 'Ask at the front desk');
    text(el('c-hours'), g.opening_hours || 'Ask at the front desk');

    var phone = el('c-phone');
    if (g.contact_phone) {
      phone.href = 'tel:' + String(g.contact_phone).replace(/[^\d+]/g, '');
      phone.textContent = g.contact_phone;
    } else {
      phone.textContent = 'Not published yet';
      phone.removeAttribute('href');
    }

    var email = el('c-email');
    if (g.contact_email) {
      email.href = 'mailto:' + g.contact_email;
      email.textContent = g.contact_email;
    } else {
      email.textContent = 'Not published yet';
      email.removeAttribute('href');
    }

    var phoneLink = el('join-phone');
    if (phoneLink && g.contact_phone) {
      phoneLink.href = 'tel:' + String(g.contact_phone).replace(/[^\d+]/g, '');
      phoneLink.textContent = 'Call ' + g.contact_phone;
    }

    var social = el('c-social');
    if (social) {
      social.textContent = '';
      if (g.facebook_url) {
        var a = document.createElement('a');
        a.href = g.facebook_url;
        a.rel = 'noopener noreferrer';
        a.target = '_blank';
        a.textContent = 'Find us on Facebook';
        social.appendChild(a);
      }
    }

    var logo = el('brand-logo');
    if (logo && g.logo_url) logo.src = g.logo_url;

    text(el('hero-contact'), g.contact_address || '');

    // Per-page title and description now that we know the gym name.
    document.title = 'Memberships & Plans | ' + g.gym_name;
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', 'Memberships & Plans | ' + g.gym_name);
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'Membership plans, opening hours and contact details for ' + g.gym_name + '. Join online or ask a question.');

    applyTheme(g.theme_default || localStorage.getItem('gym_theme') || 'light');
    addSchema(g);
  }

  function addSchema(g) {
    var data = {
      '@context': 'https://schema.org',
      '@type': 'HealthAndBeautyBusiness',
      name: g.gym_name,
      image: location.origin + '/og-image.png',
      url: location.origin + '/',
      telephone: g.contact_phone || undefined,
      email: g.contact_email || undefined,
      address: g.contact_address ? { '@type': 'PostalAddress', streetAddress: g.contact_address } : undefined,
      openingHours: g.opening_hours || undefined,
      sameAs: g.facebook_url ? [g.facebook_url] : undefined
    };
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  function renderPlans(data) {
    var grid = el('plans-grid');
    if (!grid) return;
    grid.textContent = '';
    var gym = data.gym || {};
    var sym = gym.currency_symbol || '$';
    var plans = (data.plans || []).filter(function (p) { return p && p.name; });

    if (!plans.length) {
      var empty = document.createElement('p');
      empty.className = 'muted';
      empty.textContent = 'Plans are being updated. Call us for current pricing.';
      grid.appendChild(empty);
      return;
    }

    plans.forEach(function (p) {
      var card = document.createElement('article');
      card.className = 'plan';

      var name = document.createElement('h3');
      name.className = 'plan-name';
      name.textContent = p.name;

      var price = document.createElement('p');
      price.className = 'plan-price';
      price.textContent = sym + (Math.round(Number(p.price) * 100) / 100).toFixed(2).replace(/\.00$/, '');

      var duration = document.createElement('p');
      duration.className = 'plan-duration';
      var v = Number(p.duration_value) || 1;
      duration.textContent = v + ' ' + (p.duration_unit === 'days' ? (v === 1 ? 'day' : 'days') : (v === 1 ? 'month' : 'months'));

      var desc = document.createElement('p');
      desc.className = 'plan-desc';
      desc.textContent = p.description || 'Full access during opening hours.';

      var cta = document.createElement('a');
      cta.className = 'btn btn-primary';
      cta.href = '#join';
      cta.textContent = 'Choose ' + p.name;

      card.appendChild(name);
      card.appendChild(price);
      card.appendChild(duration);
      card.appendChild(desc);
      card.appendChild(cta);
      grid.appendChild(card);
    });
  }

  function renderPlansError() {
    var grid = el('plans-grid');
    if (grid) grid.textContent = '';
    setHidden(el('plans-error'), false);
    if (grid) {
      var p = document.createElement('p');
      p.className = 'muted';
      p.textContent = 'Plans cannot be shown right now.';
      grid.appendChild(p);
    }
  }

  async function loadConfig() {
    if (!configured) {
      fillGym(FALLBACK);
      renderPlansError();
      setHidden(el('plans-error'), true);
      var grid = el('plans-grid');
      if (grid) {
        grid.textContent = '';
        var note = document.createElement('p');
        note.className = 'muted';
        note.textContent = 'This site is not connected to its back end yet. Add your Apps Script URL to config.js.';
        grid.appendChild(note);
      }
      return;
    }
    try {
      var data = await api('public_config', {});
      fillGym(data.gym || {});
      renderPlans(data);
    } catch (err) {
      fillGym(FALLBACK);
      renderPlansError();
    }
  }

  /* ---------------- join form ---------------- */

  function fieldError(name, message) {
    var node = document.querySelector('[data-error-for="' + name + '"]');
    var input = el(name);
    if (node) {
      node.textContent = message || '';
      node.hidden = !message;
    }
    if (input) {
      if (message) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }
  }

  function readForm() {
    return {
      full_name: (el('full_name') || {}).value || '',
      phone: (el('phone') || {}).value || '',
      email: (el('email') || {}).value || '',
      message: (el('message') || {}).value || ''
    };
  }

  function validate(values) {
    var errors = {};
    var name = values.full_name.trim();
    var phone = values.phone.trim();
    var email = values.email.trim();
    if (name.length < 2) errors.full_name = 'Please enter your full name.';
    else if (name.length > 80) errors.full_name = 'That name is too long (80 characters max).';
    if (!phone && !email) {
      errors.phone = 'Give a phone number or an email so we can reply.';
      errors.email = 'Give a phone number or an email so we can reply.';
    }
    if (phone && !/^[0-9+()\-\s.]{5,32}$/.test(phone)) errors.phone = 'That phone number does not look right.';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = 'That email address does not look right.';
    if (values.message.length > 500) errors.message = 'Keep it under 500 characters.';
    return errors;
  }

  function bindForm() {
    var form = el('join-form');
    if (!form) return;

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      var values = readForm();
      var errors = validate(values);
      ['full_name', 'phone', 'email', 'message'].forEach(function (k) {
        fieldError(k, errors[k] || '');
      });
      setHidden(el('join-status'), true);

      if (Object.keys(errors).length) {
        var first = Object.keys(errors)[0];
        var input = el(first);
        if (input) input.focus();
        return;
      }

      var button = el('join-submit');
      var status = el('join-status');
      button.disabled = true;
      var original = button.textContent;
      button.textContent = 'Sending…';

      try {
        if (!configured) throw new Error('not-configured');
        await api('public_join', {
          full_name: values.full_name.trim(),
          phone: values.phone.trim(),
          email: values.email.trim(),
          message: values.message.trim()
        });
        window.location.href = '/thank-you.html';
      } catch (err) {
        button.disabled = false;
        button.textContent = original;
        var message = err && err.message && err.message !== 'not-configured'
          ? err.message
          : 'We could not reach the gym right now. Please try again, or call us.';
        if (status) {
          status.textContent = message;
          status.hidden = false;
        }
      }
    });
  }

  /* ---------------- boot ---------------- */

  var year = el('year');
  if (year) year.textContent = String(new Date().getFullYear());

  var retry = el('retry-plans');
  if (retry) retry.addEventListener('click', function () { loadConfig(); });

  bindForm();
  loadConfig();
})();
