/* eslint-disable */
import '@babel/polyfill';
import L from 'leaflet';

import { displayMap } from './map.js';
import { login, logout } from './login.js';
import { updateData } from './updateSettings.js';

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
const form = document.querySelector('.form--login');
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

// handle logout
const logoutBtn = document.querySelector('.nav__el--logout');
logoutBtn.addEventListener('click', logout);

// handle update-user-data => /updateMe endpoint ....
const updateForm = document.querySelector('.form-user-data');
if (updateForm) {
  updateForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;

    updateData(name, email);
  });
}
