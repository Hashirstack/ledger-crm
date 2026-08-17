let mode = 'login';

function switchTab(target) {
  mode = target;
  document.getElementById('tabLogin').classList.toggle('active', target === 'login');
  document.getElementById('tabSignup').classList.toggle('active', target === 'signup');
  document.getElementById('formTitle').textContent = target === 'login' ? 'Welcome back' : 'Create your account';
  document.getElementById('formSub').textContent = target === 'login'
    ? 'Sign in to pick up where you left off.'
    : 'Set up your workspace in seconds.';
  document.getElementById('btnLabel').textContent = target === 'login' ? 'Sign In' : 'Create Account';
  document.getElementById('switchHint').innerHTML = target === 'login'
    ? `New here? <button type="button" onclick="switchTab('signup')">Create an account</button>`
    : `Already have an account? <button type="button" onclick="switchTab('login')">Sign in</button>`;
  document.getElementById('msg').textContent = '';

  const nameFieldEl = document.getElementById('nameField');
  const nameInputEl = document.getElementById('fullName');
  nameFieldEl.style.display = target === 'signup' ? 'block' : 'none';
  if (target === 'login') nameInputEl.value = '';

  const strengthBarEl = document.getElementById('strengthBar');
  const passHintEl = document.getElementById('passHint');
  const pwdEl = document.getElementById('password');
  if (target === 'login') {
    strengthBarEl.style.display = 'none';
    passHintEl.textContent = '';
    passHintEl.className = 'field-hint';
    pwdEl.classList.remove('invalid', 'valid');
  }
}

window.switchTab = switchTab;

const eyeOpen = `<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path><circle cx="12" cy="12" r="3"></circle>`;
const eyeClosed = `<path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.77 20.77 0 0 1 5.06-6.06M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a20.77 20.77 0 0 1-4.24 5.68"></path><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`;

const togglePassBtn = document.getElementById('togglePass');
const pwdInput = document.getElementById('password');
const eyeIcon = document.getElementById('eyeIcon');

togglePassBtn.addEventListener('click', function () {
  const isHidden = pwdInput.getAttribute('type') === 'password';
  pwdInput.setAttribute('type', isHidden ? 'text' : 'password');
  eyeIcon.innerHTML = isHidden ? eyeClosed : eyeOpen;
});

const btn = document.getElementById('submitBtn');
const fill = document.getElementById('btnFill');
const label = document.getElementById('btnLabel');
const EASE = 'transform 0.45s cubic-bezier(0.65,0,0.35,1)';

btn.addEventListener('mouseenter', () => {
  fill.style.transition = EASE;
  fill.style.transform = 'translateX(0%)';
  label.style.color = 'var(--obsidian-deep)';
});

btn.addEventListener('mouseleave', () => {
  fill.style.transition = EASE;
  fill.style.transform = 'translateX(100%)';
  label.style.color = 'var(--pearl)';
});

fill.addEventListener('transitionend', (e) => {
  if (e.propertyName !== 'transform') return;
  if (!btn.matches(':hover')) {
    fill.style.transition = 'none';
    fill.style.transform = 'translateX(-100%)';
    void fill.offsetWidth;
  }
});

// Real-time email validation
const emailInput = document.getElementById('email');
const emailHint = document.getElementById('emailHint');
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
window.emailRegexCheck = (val) => emailRegex.test(val.trim());

emailInput.addEventListener('input', () => {
  const val = emailInput.value.trim();
  if (val.length === 0) {
    emailInput.classList.remove('invalid', 'valid');
    emailHint.textContent = '';
    emailHint.className = 'field-hint';
    return;
  }
  if (emailRegex.test(val)) {
    emailInput.classList.remove('invalid');
    emailInput.classList.add('valid');
    emailHint.textContent = '';
    emailHint.className = 'field-hint';
  } else {
    emailInput.classList.remove('valid');
    emailInput.classList.add('invalid');
    emailHint.textContent = 'That email doesn\'t look right.';
    emailHint.className = 'field-hint error';
  }
});

// Password strength (only enforced/shown during signup)
const strengthBar = document.getElementById('strengthBar');
const strengthSpans = strengthBar.querySelectorAll('span');
const passHint = document.getElementById('passHint');

function scorePassword(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

pwdInput.addEventListener('input', () => {
  if (mode !== 'signup') return;
  const val = pwdInput.value;

  if (val.length === 0) {
    strengthBar.style.display = 'none';
    passHint.textContent = '';
    passHint.className = 'field-hint';
    pwdInput.classList.remove('invalid', 'valid');
    return;
  }

  strengthBar.style.display = 'flex';
  const score = scorePassword(val);
  strengthSpans.forEach(s => s.className = '');

  if (val.length < 6) {
    strengthSpans[0].className = 'on-weak';
    passHint.textContent = 'At least 6 characters.';
    passHint.className = 'field-hint error';
    pwdInput.classList.add('invalid');
    pwdInput.classList.remove('valid');
  } else if (score <= 1) {
    strengthSpans[0].className = 'on-weak';
    passHint.textContent = 'Weak — try adding a number or symbol.';
    passHint.className = 'field-hint error';
    pwdInput.classList.remove('invalid', 'valid');
  } else if (score <= 2) {
    strengthSpans[0].className = 'on-fair';
    strengthSpans[1].className = 'on-fair';
    passHint.textContent = 'Fair — a mix of cases and numbers helps.';
    passHint.className = 'field-hint';
    pwdInput.classList.remove('invalid', 'valid');
  } else {
    strengthSpans[0].className = 'on-strong';
    strengthSpans[1].className = 'on-strong';
    strengthSpans[2].className = 'on-strong';
    passHint.textContent = 'Strong password.';
    passHint.className = 'field-hint ok';
    pwdInput.classList.add('valid');
    pwdInput.classList.remove('invalid');
  }
});

// Supabase auth
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://fdhzdsqqtlaxjnuvohzs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ZtPoum30151tCVKD7pOPpg_PK1SBOmt';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// If already signed in, skip straight to dashboard
const { data: { session } } = await supabase.auth.getSession();
if (session) {
  window.location.href = 'dashboard.html';
}

document.getElementById('authForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const fullName = document.getElementById('fullName').value.trim();
  const msg = document.getElementById('msg');
  const submitBtn = document.getElementById('submitBtn');

  if (!window.emailRegexCheck(email)) {
    msg.className = 'msg error';
    msg.textContent = 'Enter a valid email address.';
    return;
  }
  if (mode === 'signup' && password.length < 6) {
    msg.className = 'msg error';
    msg.textContent = 'Password must be at least 6 characters.';
    return;
  }
  if (mode === 'signup' && !fullName) {
    msg.className = 'msg error';
    msg.textContent = 'Enter your name.';
    return;
  }

  submitBtn.disabled = true;
  msg.className = 'msg';
  msg.textContent = mode === 'login' ? 'Signing in…' : 'Creating account…';

  try {
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      msg.className = 'msg success';
      msg.textContent = 'Signed in — redirecting…';
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 500);
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: fullName } }
      });
      if (error) throw error;
      msg.className = 'msg success';
      msg.textContent = 'Account created — check your email to confirm, then sign in.';
    }
  } catch (err) {
    msg.className = 'msg error';
    msg.textContent = err.message || 'Something went wrong. Try again.';
  } finally {
    submitBtn.disabled = false;
  }
});

// Google sign-in
document.getElementById('googleBtn').addEventListener('click', async () => {
  const msg = document.getElementById('msg');
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/dashboard.html` }
  });
  if (error) {
    msg.className = 'msg error';
    msg.textContent = error.message;
  }
});