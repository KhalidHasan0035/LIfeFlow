// frontend/js/auth.js

document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, redirect to app
  if (localStorage.getItem('lf_token')) {
    window.location.href = '/app';
    return;
  }

  const loginForm    = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const showRegister = document.getElementById('showRegister');
  const showLogin    = document.getElementById('showLogin');
  const loginBox     = document.getElementById('loginBox');
  const registerBox  = document.getElementById('registerBox');

  // Toggle forms
  showRegister?.addEventListener('click', () => {
    loginBox.style.display = 'none';
    registerBox.style.display = 'block';
  });
  showLogin?.addEventListener('click', () => {
    registerBox.style.display = 'none';
    loginBox.style.display = 'block';
  });

  // LOGIN
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = loginForm.querySelector('.btn-submit');
    const errEl = document.getElementById('loginError');
    errEl.textContent = '';
    btn.textContent = 'Signing in…';
    btn.disabled = true;

    try {
      const data = await api.login({
        email:    document.getElementById('loginEmail').value.trim(),
        password: document.getElementById('loginPassword').value,
      });
      localStorage.setItem('lf_token', data.token);
      localStorage.setItem('lf_user',  JSON.stringify(data.user));
      window.location.href = '/app';
    } catch (err) {
      errEl.textContent = err.message;
      btn.textContent = 'Sign In';
      btn.disabled = false;
    }
  });

  // REGISTER
  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn   = registerForm.querySelector('.btn-submit');
    const errEl = document.getElementById('registerError');
    errEl.textContent = '';
    btn.textContent = 'Creating account…';
    btn.disabled = true;

    const pass  = document.getElementById('regPassword').value;
    const pass2 = document.getElementById('regPassword2').value;
    if (pass !== pass2) {
      errEl.textContent = 'Passwords do not match.';
      btn.textContent = 'Create Account';
      btn.disabled = false;
      return;
    }

    try {
      const data = await api.register({
        name:     document.getElementById('regName').value.trim(),
        email:    document.getElementById('regEmail').value.trim(),
        password: pass,
      });
      localStorage.setItem('lf_token', data.token);
      localStorage.setItem('lf_user',  JSON.stringify(data.user));
      window.location.href = '/app';
    } catch (err) {
      errEl.textContent = err.message;
      btn.textContent = 'Create Account';
      btn.disabled = false;
    }
  });
});