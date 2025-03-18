/* eslint-disable */
export const hideAlert = () => {
  const alertEl = document.querySelector('.alert');
  if (alertEl) alertEl.parentElement.removeChild(alertEl);
};

export const showAlert = (status, message) => {
  hideAlert();

  const markup = `<div class="alert alert--${status}">${message}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);

  window.setTimeout(() => {
    hideAlert();
  }, 5000);
};
