/**
 * config.js - the only thing the front end needs to know about the back end.
 * Replace the URL below with YOUR Apps Script web app URL after you deploy it.
 * It is not a secret: anyone can see it. The PIN and session secret never
 * appear in this file or anywhere else in the front end.
 */
window.GYM_CONFIG = {
  // Example: https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxx/exec
  API_URL: 'https://script.google.com/macros/s/AKfycbwRewpJQNhPS9ta485s7T01QIGJebwJDXhsaLDt7LdIcw_dNvPCgRvOBAqt8eK5t9Jt/exec',

  // Placeholder fallbacks only. Real values are loaded from the Settings sheet
  // and replace these as soon as the page loads.
  FALLBACK: {
    gym_name: 'Your Gym Name',
    currency_symbol: '$',
    contact_phone: '',
    contact_email: '',
    contact_address: '',
    opening_hours: '',
    logo_url: '',
    facebook_url: ''
  }
};
