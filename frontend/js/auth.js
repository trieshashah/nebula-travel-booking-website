/* ================================================================
   NEBULA TRAVEL — auth.js
   Drop-in auth system. Include BEFORE cosmic.js on every page.

   • Injects auth modal HTML into the DOM
   • Manages session token via sessionStorage (NOT localStorage)
   • Updates nav: "Sign In" ↔ "username" pill
   • Exposes window.Auth for cosmic.js to consume
   ================================================================ */

(function () {
  'use strict';

  // ── Token storage — sessionStorage survives page navigation
  //    within the same browser tab, clears when tab is closed.
  //    This satisfies "no localStorage" while keeping users logged in
  //    as they browse pages. ──────────────────────────────────────
  const TOKEN_KEY = 'nebula_session';

  const Store = {
    getToken:  ()    => sessionStorage.getItem(TOKEN_KEY),
    setToken:  (t)   => sessionStorage.setItem(TOKEN_KEY, t),
    clearToken:()    => sessionStorage.removeItem(TOKEN_KEY),
    getUser:   ()    => { try { return JSON.parse(sessionStorage.getItem('nebula_user')); } catch { return null; } },
    setUser:   (u)   => sessionStorage.setItem('nebula_user', JSON.stringify(u)),
    clearUser: ()    => sessionStorage.removeItem('nebula_user'),
  };

  // ── API helper ─────────────────────────────────────────────────
  const API = {
    async req(method, path, body) {
      const opts = { method, headers: { 'Content-Type': 'application/json' } };
      const token = Store.getToken();
      if (token) opts.headers['token'] = token;
      if (body)  opts.body = JSON.stringify(body);
      try {
        const r    = await fetch('/api' + path, opts);
        const json = await r.json();
        return json;
      } catch {
        return { success: false, message: 'Network error — server unreachable' };
      }
    },
    post: (p, b) => API.req('POST', p, b),
    get:  (p)    => API.req('GET',  p),
  };

  // ── Modal HTML template ────────────────────────────────────────
  const MODAL_HTML = `
<div id="authOverlay" class="auth-overlay" role="dialog" aria-modal="true" aria-labelledby="authModalTitle">
  <div class="auth-modal">

    <!-- Close button -->
    <button class="auth-close" id="authClose" aria-label="Close">✕</button>

    <!-- Nebula brand -->
    <div class="auth-brand">
      <div class="auth-brand-orb">🌌</div>
      <span class="auth-brand-text">NEBULA</span>
    </div>

    <!-- Tab switcher -->
    <div class="auth-tabs">
      <button class="auth-tab active" data-tab="login">Sign In</button>
      <button class="auth-tab" data-tab="register">Create Account</button>
    </div>

    <!-- ── LOGIN PANEL ─────────────────────────────────────────── -->
    <div class="auth-panel active" id="authPanelLogin">
      <p class="auth-subtitle">Welcome back, cosmic traveler ✦</p>

      <div class="auth-field">
        <label class="auth-label">Email Address</label>
        <div class="auth-input-wrap">
          <span class="auth-input-icon">📧</span>
          <input type="email" id="loginEmail" class="auth-input"
            placeholder="you@nebula.in" autocomplete="email">
        </div>
      </div>

      <div class="auth-field">
        <label class="auth-label">Password</label>
        <div class="auth-input-wrap">
          <span class="auth-input-icon">🔑</span>
          <input type="password" id="loginPassword" class="auth-input"
            placeholder="••••••••" autocomplete="current-password">
          <button class="auth-eye" data-target="loginPassword" tabindex="-1">👁</button>
        </div>
      </div>

      <div class="auth-row-between">
        <label class="auth-remember">
          <input type="checkbox" id="rememberMe">
          <span>Remember me</span>
        </label>
        <button class="auth-link" id="forgotPwdBtn">Forgot password?</button>
      </div>

      <button class="auth-submit" id="loginSubmitBtn">
        <span class="auth-submit-text">Sign In</span>
        <span class="auth-submit-loader" style="display:none;">⏳</span>
      </button>

      <div class="auth-divider"><span>or sign in with</span></div>

      <div class="auth-social-row">
        <button class="auth-social-btn" data-provider="google">
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115z"/><path fill="#34A853" d="M16.04 18.013C14.956 18.649 13.549 19.09 12 19.09c-3.101 0-5.738-1.97-6.756-4.72l-4.022 3.084C3.196 21.294 7.27 24 12 24c3.050 0 5.773-1.103 7.908-2.906l-3.868-3.081z"/><path fill="#4A90D9" d="M19.908 21.094C22.119 18.923 23.5 15.73 23.5 12c0-.81-.084-1.597-.24-2.356H12v4.71h6.444c-.279 1.493-1.114 2.762-2.412 3.626l3.876 3.114z"/><path fill="#FBBC05" d="M5.244 14.37A7.228 7.228 0 0 1 4.91 12c0-.826.142-1.624.394-2.37L1.238 6.519A11.977 11.977 0 0 0 0 12c0 1.938.462 3.768 1.282 5.388l3.962-3.018z"/></svg>
          Google
        </button>
        <button class="auth-social-btn" data-provider="phone">
          📱 Mobile OTP
        </button>
      </div>

      <div class="auth-error" id="loginError"></div>
    </div>

    <!-- ── REGISTER PANEL ───────────────────────────────────────── -->
    <div class="auth-panel" id="authPanelRegister">
      <p class="auth-subtitle">Join the cosmic journey today ✦</p>

      <div class="auth-grid-2">
        <div class="auth-field">
          <label class="auth-label">First Name</label>
          <div class="auth-input-wrap">
            <span class="auth-input-icon">👤</span>
            <input type="text" id="regFirstName" class="auth-input"
              placeholder="Arjun" autocomplete="given-name">
          </div>
        </div>
        <div class="auth-field">
          <label class="auth-label">Last Name</label>
          <div class="auth-input-wrap">
            <span class="auth-input-icon">👤</span>
            <input type="text" id="regLastName" class="auth-input"
              placeholder="Kumar" autocomplete="family-name">
          </div>
        </div>
      </div>

      <div class="auth-field">
        <label class="auth-label">Email Address</label>
        <div class="auth-input-wrap">
          <span class="auth-input-icon">📧</span>
          <input type="email" id="regEmail" class="auth-input"
            placeholder="you@nebula.in" autocomplete="email">
        </div>
      </div>

      <div class="auth-field">
        <label class="auth-label">Mobile Number</label>
        <div class="auth-input-wrap">
          <span class="auth-input-icon">📱</span>
          <span class="auth-phone-prefix">+91</span>
          <input type="tel" id="regPhone" class="auth-input auth-input-phone"
            placeholder="98765 43210" autocomplete="tel" maxlength="10">
        </div>
      </div>

      <div class="auth-field">
        <label class="auth-label">Password</label>
        <div class="auth-input-wrap">
          <span class="auth-input-icon">🔑</span>
          <input type="password" id="regPassword" class="auth-input"
            placeholder="Min 6 characters" autocomplete="new-password">
          <button class="auth-eye" data-target="regPassword" tabindex="-1">👁</button>
        </div>
        <div class="auth-strength" id="pwdStrength">
          <div class="auth-strength-bar"><div class="auth-strength-fill" id="strengthFill"></div></div>
          <span class="auth-strength-label" id="strengthLabel"></span>
        </div>
      </div>

      <div class="auth-field">
        <label class="auth-checkbox-row">
          <input type="checkbox" id="regTerms">
          <span>I agree to <a href="#" class="auth-link">Terms</a> &amp; <a href="#" class="auth-link">Privacy Policy</a></span>
        </label>
      </div>

      <button class="auth-submit" id="registerSubmitBtn">
        <span class="auth-submit-text">Create Account</span>
        <span class="auth-submit-loader" style="display:none;">⏳</span>
      </button>

      <div class="auth-error" id="registerError"></div>
    </div>

    <!-- ── SUCCESS STATE ────────────────────────────────────────── -->
    <div class="auth-panel auth-success-panel" id="authPanelSuccess">
      <div class="auth-success-rocket">🚀</div>
      <div class="auth-success-title">Welcome aboard!</div>
      <div class="auth-success-sub" id="authSuccessMsg">You're now logged in.</div>
      <div class="auth-success-pnr" id="authSuccessPill"></div>
    </div>

  </div>
</div>`;

  // ── CSS ────────────────────────────────────────────────────────
  const CSS = `
/* ── Auth overlay & modal ─────────────────────────────── */
.auth-overlay {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(2, 1, 10, 0.85);
  backdrop-filter: blur(18px) saturate(1.4);
  -webkit-backdrop-filter: blur(18px) saturate(1.4);
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
  opacity: 0; visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}
.auth-overlay.open {
  opacity: 1; visibility: visible;
}
.auth-modal {
  position: relative;
  width: 100%; max-width: 480px;
  background: linear-gradient(135deg,
    rgba(20, 10, 40, 0.95) 0%,
    rgba(10, 5, 25, 0.98) 100%);
  border: 1px solid rgba(139, 92, 246, 0.25);
  border-radius: 24px;
  padding: 2.2rem 2rem 2rem;
  box-shadow:
    0 0 0 1px rgba(139,92,246,0.08),
    0 40px 80px rgba(0,0,0,0.6),
    0 0 120px rgba(139,92,246,0.08) inset;
  transform: translateY(20px) scale(0.97);
  transition: transform 0.35s cubic-bezier(0.16,1,0.3,1);
  max-height: 92vh;
  overflow-y: auto;
  scrollbar-width: none;
}
.auth-overlay.open .auth-modal {
  transform: translateY(0) scale(1);
}

/* ── Close button ─────────────────────────────────────── */
.auth-close {
  position: absolute; top: 1.1rem; right: 1.2rem;
  width: 32px; height: 32px;
  border: 1px solid rgba(139,92,246,0.25);
  border-radius: 50%;
  background: rgba(139,92,246,0.08);
  color: rgba(240,230,255,0.5);
  font-size: 0.7rem; cursor: pointer;
  transition: all 0.2s ease;
  display: flex; align-items: center; justify-content: center;
}
.auth-close:hover {
  background: rgba(139,92,246,0.2);
  color: rgba(240,230,255,0.9);
  border-color: rgba(139,92,246,0.5);
}

/* ── Brand ────────────────────────────────────────────── */
.auth-brand {
  display: flex; align-items: center; gap: 10px;
  justify-content: center; margin-bottom: 1.6rem;
}
.auth-brand-orb {
  width: 38px; height: 38px;
  background: linear-gradient(135deg, #8B5CF6, #EC4899);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem;
  box-shadow: 0 4px 20px rgba(139,92,246,0.4);
}
.auth-brand-text {
  font-family: 'Orbitron', monospace;
  font-size: 1.25rem; font-weight: 800;
  letter-spacing: 4px;
  background: linear-gradient(135deg, #f0e6ff, #8B5CF6);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ── Tabs ─────────────────────────────────────────────── */
.auth-tabs {
  display: flex; gap: 6px;
  background: rgba(139,92,246,0.06);
  border: 1px solid rgba(139,92,246,0.15);
  border-radius: 14px; padding: 5px;
  margin-bottom: 1.6rem;
}
.auth-tab {
  flex: 1; padding: 9px 0;
  border: none; background: transparent;
  border-radius: 10px;
  color: rgba(240,230,255,0.45);
  font-family: 'Exo 2', sans-serif;
  font-size: 0.88rem; font-weight: 500;
  cursor: pointer; transition: all 0.25s ease;
  letter-spacing: 0.3px;
}
.auth-tab.active {
  background: linear-gradient(135deg, #8B5CF6, #7C3AED);
  color: #fff;
  box-shadow: 0 4px 16px rgba(139,92,246,0.35);
}

/* ── Panels ───────────────────────────────────────────── */
.auth-panel { display: none; }
.auth-panel.active { display: block; }

/* ── Subtitle ─────────────────────────────────────────── */
.auth-subtitle {
  text-align: center;
  color: rgba(240,230,255,0.45);
  font-size: 0.82rem;
  margin: 0 0 1.4rem;
  letter-spacing: 0.2px;
}

/* ── Fields ───────────────────────────────────────────── */
.auth-field { margin-bottom: 1rem; }
.auth-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.auth-label {
  display: block;
  font-size: 0.72rem;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: rgba(240,230,255,0.4);
  margin-bottom: 7px;
}
.auth-input-wrap {
  position: relative;
  display: flex; align-items: center;
  background: rgba(139,92,246,0.07);
  border: 1px solid rgba(139,92,246,0.2);
  border-radius: 12px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.auth-input-wrap:focus-within {
  border-color: rgba(139,92,246,0.55);
  box-shadow: 0 0 0 3px rgba(139,92,246,0.1), 0 0 20px rgba(139,92,246,0.08) inset;
}
.auth-input-icon {
  padding: 0 0 0 12px;
  font-size: 0.9rem;
  flex-shrink: 0;
}
.auth-phone-prefix {
  padding: 0 0 0 12px;
  font-size: 0.85rem;
  color: rgba(240,230,255,0.5);
  flex-shrink: 0;
  border-right: 1px solid rgba(139,92,246,0.2);
  margin-right: 8px;
  padding-right: 10px;
  line-height: 1;
}
.auth-input {
  flex: 1;
  background: transparent; border: none; outline: none;
  color: rgba(240,230,255,0.92);
  font-family: 'Exo 2', sans-serif;
  font-size: 0.9rem;
  padding: 12px 12px 12px 8px;
}
.auth-input::placeholder { color: rgba(240,230,255,0.22); }
.auth-input.auth-input-phone { padding-left: 0; }
.auth-eye {
  background: none; border: none; cursor: pointer;
  padding: 0 12px; font-size: 0.85rem;
  color: rgba(240,230,255,0.3);
  transition: color 0.2s;
}
.auth-eye:hover { color: rgba(240,230,255,0.7); }

/* ── Input validation states ──────────────────────────── */
.auth-input-wrap.valid   { border-color: rgba(16,185,129,0.5); }
.auth-input-wrap.invalid { border-color: rgba(239,68,68,0.5); }
.auth-input-wrap.valid::after {
  content: '✓'; position: absolute; right: 12px;
  color: #10B981; font-size: 0.75rem;
}

/* ── Password strength ────────────────────────────────── */
.auth-strength { display: flex; align-items: center; gap: 8px; margin-top: 7px; }
.auth-strength-bar {
  flex: 1; height: 3px;
  background: rgba(139,92,246,0.15); border-radius: 2px;
}
.auth-strength-fill {
  height: 100%; border-radius: 2px;
  transition: width 0.4s ease, background 0.4s ease;
  width: 0;
}
.auth-strength-label { font-size: 0.68rem; color: rgba(240,230,255,0.4); white-space: nowrap; }

/* ── Remember / forgot row ────────────────────────────── */
.auth-row-between {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 1.2rem;
}
.auth-remember {
  display: flex; align-items: center; gap: 7px;
  font-size: 0.78rem; color: rgba(240,230,255,0.45);
  cursor: pointer;
}
.auth-remember input { accent-color: #8B5CF6; }
.auth-checkbox-row {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: 0.78rem; color: rgba(240,230,255,0.45);
  cursor: pointer; line-height: 1.5;
}
.auth-checkbox-row input { margin-top: 3px; accent-color: #8B5CF6; }
.auth-link {
  background: none; border: none; cursor: pointer;
  color: rgba(139,92,246,0.9);
  font-size: 0.78rem;
  font-family: 'Exo 2', sans-serif;
  text-decoration: none;
  transition: color 0.2s;
}
.auth-link:hover { color: #a78bfa; }
a.auth-link { color: rgba(139,92,246,0.9); }

/* ── Submit button ────────────────────────────────────── */
.auth-submit {
  width: 100%; padding: 13px;
  background: linear-gradient(135deg, #8B5CF6, #EC4899);
  border: none; border-radius: 14px;
  color: #fff;
  font-family: 'Exo 2', sans-serif;
  font-size: 0.95rem; font-weight: 700;
  letter-spacing: 1.5px;
  cursor: pointer; margin-top: 0.2rem;
  position: relative; overflow: hidden;
  transition: opacity 0.2s, transform 0.15s;
  box-shadow: 0 8px 28px rgba(139,92,246,0.35);
}
.auth-submit:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 12px 32px rgba(139,92,246,0.45); }
.auth-submit:active { transform: translateY(0); }
.auth-submit:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
.auth-submit::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.08));
}

/* ── Divider ──────────────────────────────────────────── */
.auth-divider {
  display: flex; align-items: center; gap: 12px;
  margin: 1.1rem 0;
  color: rgba(240,230,255,0.2); font-size: 0.72rem;
}
.auth-divider::before, .auth-divider::after {
  content: ''; flex: 1;
  height: 1px; background: rgba(139,92,246,0.15);
}

/* ── Social buttons ───────────────────────────────────── */
.auth-social-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.auth-social-btn {
  padding: 10px; border-radius: 12px;
  background: rgba(139,92,246,0.07);
  border: 1px solid rgba(139,92,246,0.2);
  color: rgba(240,230,255,0.65);
  font-family: 'Exo 2', sans-serif; font-size: 0.82rem;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 7px;
  transition: all 0.2s ease;
}
.auth-social-btn:hover {
  background: rgba(139,92,246,0.14);
  border-color: rgba(139,92,246,0.4);
  color: rgba(240,230,255,0.9);
}

/* ── Error box ────────────────────────────────────────── */
.auth-error {
  margin-top: 0.8rem;
  padding: 0; border-radius: 10px;
  font-size: 0.8rem; color: rgba(239,68,68,0.9);
  text-align: center; min-height: 0;
  transition: all 0.3s ease;
}
.auth-error.show {
  padding: 10px 14px;
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.25);
}

/* ── Success panel ────────────────────────────────────── */
.auth-success-panel {
  text-align: center; padding: 1rem 0 0.5rem;
}
.auth-success-rocket {
  font-size: 3.5rem;
  animation: authRocketFloat 2s ease-in-out infinite;
  display: block; margin-bottom: 1rem;
}
@keyframes authRocketFloat {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-10px); }
}
.auth-success-title {
  font-family: 'Orbitron', monospace;
  font-size: 1.35rem; font-weight: 700;
  background: linear-gradient(135deg, #8B5CF6, #EC4899);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}
.auth-success-sub {
  color: rgba(240,230,255,0.5); font-size: 0.88rem; margin-bottom: 1.2rem;
}
.auth-success-pnr {
  display: inline-block;
  padding: 8px 20px;
  background: rgba(139,92,246,0.1);
  border: 1px solid rgba(139,92,246,0.3);
  border-radius: 30px;
  font-family: 'Orbitron', monospace;
  font-size: 0.9rem; color: #a78bfa;
  letter-spacing: 2px;
}

/* ── Nav pill (logged-in user) ───────────────────────── */
.nav-user-pill {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 14px 7px 8px;
  background: rgba(139,92,246,0.12);
  border: 1px solid rgba(139,92,246,0.3);
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}
.nav-user-pill:hover {
  background: rgba(139,92,246,0.22);
  border-color: rgba(139,92,246,0.5);
}
.nav-user-avatar {
  width: 26px; height: 26px; border-radius: 50%;
  background: linear-gradient(135deg, #8B5CF6, #EC4899);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.68rem; font-weight: 700; color: #fff;
  flex-shrink: 0;
}
.nav-user-name {
  font-family: 'Exo 2', sans-serif;
  font-size: 0.85rem; font-weight: 600;
  color: rgba(240,230,255,0.9);
  max-width: 90px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.nav-user-caret { font-size: 0.6rem; color: rgba(240,230,255,0.4); }

/* User dropdown */
.nav-user-dropdown {
  position: absolute; top: calc(100% + 8px); right: 0;
  background: linear-gradient(135deg, rgba(20,10,40,0.98), rgba(10,5,25,0.99));
  border: 1px solid rgba(139,92,246,0.25);
  border-radius: 14px; padding: 6px;
  min-width: 170px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.06);
  display: none; z-index: 999;
}
.nav-user-pill.dd-open .nav-user-dropdown { display: block; }
.nav-dd-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 10px;
  font-size: 0.82rem; color: rgba(240,230,255,0.65);
  cursor: pointer; transition: all 0.15s;
  border: none; background: none; width: 100%;
  text-align: left; font-family: 'Exo 2', sans-serif;
  text-decoration: none;
}
.nav-dd-item:hover {
  background: rgba(139,92,246,0.12);
  color: rgba(240,230,255,0.95);
}
.nav-dd-item.danger { color: rgba(239,68,68,0.8); }
.nav-dd-item.danger:hover { background: rgba(239,68,68,0.08); color: rgba(239,68,68,1); }
.nav-dd-sep { height: 1px; background: rgba(139,92,246,0.12); margin: 5px 0; }

/* ── Responsive ───────────────────────────────────────── */
@media (max-width: 520px) {
  .auth-modal { padding: 1.8rem 1.4rem 1.6rem; border-radius: 20px; }
  .auth-grid-2 { grid-template-columns: 1fr; }
  .auth-social-row { grid-template-columns: 1fr; }
  .auth-brand-text { font-size: 1rem; }
}
`;

  // ── Inject CSS + HTML ──────────────────────────────────────────
  function inject() {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    const div = document.createElement('div');
    div.innerHTML = MODAL_HTML;
    document.body.appendChild(div.firstElementChild);
  }

  // ── Password strength ──────────────────────────────────────────
  function getStrength(pwd) {
    let score = 0;
    if (pwd.length >= 6)  score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd))  score++;
    if (/[0-9]/.test(pwd))  score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  }

  function updateStrength(pwd) {
    const fill  = document.getElementById('strengthFill');
    const label = document.getElementById('strengthLabel');
    if (!fill || !label) return;
    const score = getStrength(pwd);
    const levels = [
      { w: '20%',  c: '#EF4444', t: 'Weak' },
      { w: '40%',  c: '#F59E0B', t: 'Fair' },
      { w: '60%',  c: '#F59E0B', t: 'Good' },
      { w: '80%',  c: '#10B981', t: 'Strong' },
      { w: '100%', c: '#06B6D4', t: 'Stellar ✦' },
    ];
    const lvl = levels[Math.min(score, 4)];
    fill.style.width      = pwd ? lvl.w : '0';
    fill.style.background = lvl.c;
    label.textContent     = pwd ? lvl.t : '';
  }

  // ── Error helpers ──────────────────────────────────────────────
  function setError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle('show', !!msg);
  }

  function clearErrors() {
    ['loginError', 'registerError'].forEach(id => setError(id, ''));
  }

  // ── Loader on submit btn ───────────────────────────────────────
  function setBtnLoading(btnId, loading) {
    const btn  = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    btn.querySelector('.auth-submit-text').style.display  = loading ? 'none'  : '';
    btn.querySelector('.auth-submit-loader').style.display = loading ? 'inline' : 'none';
  }

  // ── Nav update ─────────────────────────────────────────────────
  function updateNav(user) {
    // Find all Sign In buttons in nav-actions
    document.querySelectorAll('.nav-actions .btn-primary, .nav-actions [data-auth="signin"]').forEach(btn => {
      if (!user) {
        // Restore original Sign In button
        btn.style.display = '';
        btn.textContent   = 'Sign In';
        btn.onclick       = (e) => { e.preventDefault(); Auth.openModal(); };
        return;
      }
      // Replace with user pill (only once)
      if (btn.dataset.replaced) return;
      btn.style.display = 'none';
      btn.dataset.replaced = '1';

      const pill = buildUserPill(user);
      btn.insertAdjacentElement('beforebegin', pill);
    });

    // If already have a pill, update it
    document.querySelectorAll('.nav-user-pill').forEach(p => {
      if (!user) { p.remove(); return; }
      const av   = p.querySelector('.nav-user-avatar');
      const nm   = p.querySelector('.nav-user-name');
      if (av) av.textContent = initials(user.name);
      if (nm) nm.textContent = firstName(user.name);
    });
  }

  function initials(name) {
    return (name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }
  function firstName(name) {
    return (name || 'Traveler').split(' ')[0];
  }

  function buildUserPill(user) {
    const pill = document.createElement('div');
    pill.className = 'nav-user-pill';
    pill.innerHTML = `
      <div class="nav-user-avatar">${initials(user.name)}</div>
      <span class="nav-user-name">${firstName(user.name)}</span>
      <span class="nav-user-caret">▾</span>
      <div class="nav-user-dropdown">
        <a href="profile.html" class="nav-dd-item">👤 My Profile</a>
        <a href="my-bookings.html" class="nav-dd-item">🎫 My Bookings</a>
        <div class="nav-dd-sep"></div>
        <button class="nav-dd-item danger" id="navLogoutBtn">⏏ Sign Out</button>
      </div>`;

    pill.addEventListener('click', (e) => {
      if (e.target.closest('.nav-user-dropdown')) return; // let links work
      pill.classList.toggle('dd-open');
    });
    document.addEventListener('click', (e) => {
      if (!pill.contains(e.target)) pill.classList.remove('dd-open');
    });

    // Logout handler (set after insert)
    setTimeout(() => {
      const logoutBtn = pill.querySelector('#navLogoutBtn');
      if (logoutBtn) logoutBtn.addEventListener('click', () => Auth.logout());
    }, 0);

    return pill;
  }

  // ── Show success & close ───────────────────────────────────────
  function showSuccess(name) {
    document.querySelectorAll('.auth-tab, .auth-panel').forEach(el => {
      el.classList.remove('active');
    });
    document.getElementById('authPanelSuccess').classList.add('active');

    const msgEl  = document.getElementById('authSuccessMsg');
    const pillEl = document.getElementById('authSuccessPill');
    if (msgEl)  msgEl.textContent  = `Welcome, ${firstName(name)}! Ready to explore?`;
    if (pillEl) pillEl.textContent = '✦ READY FOR LAUNCH ✦';

    setTimeout(() => Auth.closeModal(), 2200);
  }

  // ── Login handler ──────────────────────────────────────────────
  async function handleLogin() {
    clearErrors();
    const email    = document.getElementById('loginEmail')?.value?.trim();
    const password = document.getElementById('loginPassword')?.value;
    if (!email)    { setError('loginError', 'Please enter your email address'); return; }
    if (!password) { setError('loginError', 'Please enter your password'); return; }

    setBtnLoading('loginSubmitBtn', true);
    const resp = await API.post('/login', { email, password });
    setBtnLoading('loginSubmitBtn', false);

    if (resp.success) {
      const { token, name, email: userEmail, userId } = resp.data;
      Store.setToken(token);
      Store.setUser({ name, email: userEmail, userId });
      updateNav({ name, email: userEmail });
      showSuccess(name);
    } else {
      setError('loginError', resp.message || 'Invalid email or password');
    }
  }

  // ── Register handler ───────────────────────────────────────────
  async function handleRegister() {
    clearErrors();
    const first    = document.getElementById('regFirstName')?.value?.trim();
    const last     = document.getElementById('regLastName')?.value?.trim();
    const email    = document.getElementById('regEmail')?.value?.trim();
    const rawPhone = document.getElementById('regPhone')?.value?.replace(/\D/g, '');
    const password = document.getElementById('regPassword')?.value;
    const terms    = document.getElementById('regTerms')?.checked;

    const name = [first, last].filter(Boolean).join(' ');
    if (!first)    { setError('registerError', 'Please enter your first name'); return; }
    if (!email || !email.includes('@')) { setError('registerError', 'Please enter a valid email address'); return; }
    if (!password || password.length < 6) { setError('registerError', 'Password must be at least 6 characters'); return; }
    if (!terms)    { setError('registerError', 'Please accept the terms and privacy policy'); return; }
    if (rawPhone && rawPhone.length !== 10) { setError('registerError', 'Please enter a valid 10-digit mobile number'); return; }

    setBtnLoading('registerSubmitBtn', true);
    const resp = await API.post('/register', {
      name, email,
      phone: rawPhone ? '+91' + rawPhone : undefined,
      password
    });
    setBtnLoading('registerSubmitBtn', false);

    if (resp.success) {
      const { token, name: rName, email: rEmail, userId } = resp.data;
      Store.setToken(token);
      Store.setUser({ name: rName, email: rEmail, userId });
      updateNav({ name: rName, email: rEmail });
      showSuccess(rName);
    } else {
      setError('registerError', resp.message || 'Registration failed. Please try again.');
    }
  }

  // ── Wire up modal interactions ─────────────────────────────────
  function wireModal() {
    // Tab switching
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        clearErrors();
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = 'authPanel' + tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1);
        document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
        document.getElementById(target)?.classList.add('active');
      });
    });

    // Close modal
    document.getElementById('authClose')?.addEventListener('click', () => Auth.closeModal());
    document.getElementById('authOverlay')?.addEventListener('click', e => {
      if (e.target === e.currentTarget) Auth.closeModal();
    });

    // Submit buttons
    document.getElementById('loginSubmitBtn')?.addEventListener('click', handleLogin);
    document.getElementById('registerSubmitBtn')?.addEventListener('click', handleRegister);

    // Enter key submits
    document.getElementById('loginPassword')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleLogin();
    });
    document.getElementById('regPassword')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') handleRegister();
    });

    // Password toggle (eye icon)
    document.querySelectorAll('.auth-eye').forEach(btn => {
      btn.addEventListener('click', () => {
        const inp = document.getElementById(btn.dataset.target);
        if (!inp) return;
        inp.type = inp.type === 'password' ? 'text' : 'password';
        btn.textContent = inp.type === 'password' ? '👁' : '🙈';
      });
    });

    // Password strength
    document.getElementById('regPassword')?.addEventListener('input', e => {
      updateStrength(e.target.value);
    });

    // Forgot password
    document.getElementById('forgotPwdBtn')?.addEventListener('click', () => {
      const email = document.getElementById('loginEmail')?.value?.trim();
      if (!email) {
        setError('loginError', 'Enter your email above, then click Forgot password');
        return;
      }
      setError('loginError', '');
      alert(`Password reset link would be sent to:\n${email}\n\n(Backend email integration coming soon)`);
    });

    // Social buttons (demo)
    document.querySelectorAll('.auth-social-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const provider = btn.dataset.provider;
        if (provider === 'google') alert('Google OAuth integration — connect via /api/auth/google');
        if (provider === 'phone')  alert('OTP via SMS — connect /api/auth/otp');
      });
    });
  }

  // ── Wire existing Sign In buttons on the page ──────────────────
  function wireSignInButtons() {
    document.querySelectorAll('.btn-primary, [data-auth="signin"]').forEach(btn => {
      const text = (btn.textContent || '').trim();
      if (text === 'Sign In' || btn.dataset.auth === 'signin') {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          Auth.openModal();
        });
      }
    });
  }

  // ── Public API ─────────────────────────────────────────────────
  const Auth = {
    openModal(tab) {
      const overlay = document.getElementById('authOverlay');
      if (!overlay) return;
      clearErrors();
      if (tab) {
        document.querySelectorAll('.auth-tab').forEach(t => {
          const match = t.dataset.tab === tab;
          t.classList.toggle('active', match);
        });
        document.querySelectorAll('.auth-panel').forEach(p => {
          const show = p.id === 'authPanel' + tab.charAt(0).toUpperCase() + tab.slice(1);
          p.classList.toggle('active', show);
        });
      }
      overlay.classList.add('open');
      setTimeout(() => document.getElementById(tab === 'register' ? 'regFirstName' : 'loginEmail')?.focus(), 300);
    },

    closeModal() {
      document.getElementById('authOverlay')?.classList.remove('open');
    },

    async logout() {
      const token = Store.getToken();
      if (token) {
        try { await API.post('/logout'); } catch {}
      }
      Store.clearToken();
      Store.clearUser();

      // Remove pill, restore Sign In buttons
      document.querySelectorAll('.nav-user-pill').forEach(p => p.remove());
      document.querySelectorAll('.nav-actions .btn-primary').forEach(btn => {
        btn.style.display     = '';
        btn.textContent       = 'Sign In';
        btn.dataset.replaced  = '';
      });
      wireSignInButtons();

      // Show toast if available
      if (window.showToast) window.showToast('Signed out successfully', 'info');
      else alert('Signed out successfully');
    },

    getToken:   () => Store.getToken(),
    getUser:    () => Store.getUser(),
    isLoggedIn: () => !!Store.getToken(),

    // Re-validate token against server
    async checkSession() {
      const token = Store.getToken();
      if (!token) return false;
      const resp = await API.get('/profile');
      if (resp.success) {
        Store.setUser(resp.data);
        return true;
      }
      Store.clearToken();
      Store.clearUser();
      return false;
    }
  };

  // ── Init on DOM ready ──────────────────────────────────────────
  function init() {
    inject();
    wireModal();
    wireSignInButtons();

    // If already logged in this session, update nav immediately
    const user = Store.getUser();
    if (user && Store.getToken()) {
      updateNav(user);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose globally
  window.Auth = Auth;

})();
