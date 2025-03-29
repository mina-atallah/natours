/* eslint-disable */
import '@babel/polyfill';
import L from 'leaflet';

import { displayMap } from './map.js';
import { login, logout } from './login.js';
import { updateSettings } from './updateSettings.js';

/* DOM ELEMENTS */
const mapEl = document.getElementById('map');
const form = document.querySelector('.form--login');
const logoutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data'); // handle update-user-data => /updateMe endpoint...
const userPasswordForm = document.querySelector('.form-user-password'); // handle update-user-password => /updateMyPassword endpoint...

// initialize map
if (mapEl) {
  try {
    const locations = JSON.parse(mapEl.dataset.locations);
    displayMap(locations, mapEl, L);
  } catch (error) {
    console.error('Error parsing map data:', error);
  }
}

// handle login-form
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
if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}

if (userDataForm) {
  userDataForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    updateSettings({ name, email }, 'data');
  });
}

if (userPasswordForm) {
  userPasswordForm.addEventListener('submit', async e => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating...';
    const currentPassword = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings(
      { currentPassword, password, passwordConfirm },
      'password'
    );
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
    document.querySelector('.btn--save-password').textContent = 'Save Password';
  });
}
