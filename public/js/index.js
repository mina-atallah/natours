/* eslint-disable */
import '@babel/polyfill';
import L from 'leaflet';

import { displayMap } from './map.js';
import { login } from './login.js';

// initialize map
const mapEl = document.getElementById('map');
if (mapEl) {
  try {
    const locations = JSON.parse(mapEl.dataset.locations);
    displayMap(locations, mapEl, L);
  } catch (error) {
    console.error('Error parsing map data:', error);
  }
}

// handle login-form
const form = document.querySelector('.form');
if (form) {
  form.addEventListener('submit', async e => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (email && password) {
      await login(email, password);
    }
  });
}
