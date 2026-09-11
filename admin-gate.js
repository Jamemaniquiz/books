// admin-gate.js — Enhanced security for BookNest seller/admin pages.
//
// SECURITY:
// - Client-side protection against casual/buyer access
// - Separates buyer & seller access completely
// - Uses sessionStorage (clears when browser closes)
// - Password stored with simple hashing in localStorage
// - Buyers cannot access admin pages without correct password
// - Password can be changed by seller anytime
//

(function () {
  // ── Configuration ──────────────────────────────────────────────────
  const STORAGE_KEY = "bn_admin_password_hash";
  const SESSION_FLAG = "bn_admin_ok";
  const DEFAULT_PASSWORD = "booknest2026";
  
  // Simple hash function (NOT cryptographic - client-side deterrent only)
  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  // Check if already unlocked this session
  function isUnlocked() {
    return sessionStorage.getItem(SESSION_FLAG) === "1";
  }

  // Get stored password hash (or set default)
  function getPasswordHash() {
    let hash = localStorage.getItem(STORAGE_KEY);
    if (!hash) {
      hash = simpleHash(DEFAULT_PASSWORD);
      localStorage.setItem(STORAGE_KEY, hash);
    }
    return hash;
  }

  // Validate password attempt
  function validatePassword(attempt) {
    const storedHash = getPasswordHash();
    const attemptHash = simpleHash(attempt);
    return attemptHash === storedHash;
  }

  // Hide page until gate is resolved
  if (!isUnlocked()) {
    const hideStyle = document.createElement("style");
    hideStyle.id = "bn-admin-gate-style";
    hideStyle.textContent = "body{visibility:hidden !important;} html{background:#1f2733;}";
    document.documentElement.appendChild(hideStyle);
  }

  document.addEventListener("DOMContentLoaded", function() {
    if (isUnlocked()) return;
    showSecurityGate();
  });

  // Main security gate UI
  function showSecurityGate() {
    const overlay = document.createElement("div");
    overlay.id = "bn-admin-gate";
    overlay.innerHTML = `
      <div class="bn-gate-card">
        <div class="bn-gate-brand">
          <div class="bn-gate-logo-wrap"><img src="Assets/Booknest.png" alt="BookNest"></div>
          <div>
            <div class="bn-gate-brand-name">BOOKNEST</div>
            <div class="bn-gate-brand-sub">Seller workspace</div>
          </div>
        </div>
        <div class="bn-gate-lock">🔐</div>
        <h2>Welcome back, Seller</h2>
        <p>Sign in to manage your books, orders, sales, and receipts.</p>
        <div class="bn-gate-field">
          <span>Seller password</span>
          <input type="password" id="bn-gate-password" placeholder="Enter your password" autocomplete="off" />
        </div>
        <button id="bn-gate-login-btn" class="bn-gate-primary">Unlock Seller Dashboard →</button>
        <div id="bn-gate-error" class="bn-gate-error"></div>
        <a href="shop.html" class="bn-gate-link">← Back to customer shop</a>
      </div>
    `;
    
    document.body.appendChild(overlay);
    attachGateStyles();
    attachGateHandlers();
  }

  // Add styles
  function attachGateStyles() {
    const css = document.createElement("style");
    css.textContent = `
      #bn-admin-gate {
        position: fixed;
        inset: 0;
        background: linear-gradient(135deg, #1f2733 0%, #263138 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        visibility: visible;
        font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
        padding: 20px;
      }

      .bn-gate-card {
        background: #fff;
        border-radius: 12px;
        padding: 40px 32px;
        max-width: 380px;
        width: 100%;
        text-align: center;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.4);
        animation: slideUp 0.3s ease;
      }

      @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .bn-gate-logo {
        font-weight: 700;
        font-size: 18px;
        margin-bottom: 8px;
        color: #0f766e;
        letter-spacing: 0.5px;
      }

      .bn-gate-card h2 {
        margin: 4px 0 16px;
        font-size: 22px;
        color: #1f2733;
        font-weight: 700;
      }

      .bn-gate-tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 20px;
        border-bottom: 2px solid #e0e0e0;
      }

      .bn-gate-tab {
        flex: 1;
        padding: 10px 12px;
        border: none;
        background: transparent;
        color: #999;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        border-bottom: 3px solid transparent;
        margin-bottom: -2px;
        transition: all 0.2s ease;
      }

      .bn-gate-tab:hover {
        color: #0f766e;
      }

      .bn-gate-tab.active {
        color: #0f766e;
        border-bottom-color: #0f766e;
      }

      .bn-gate-content {
        display: none;
      }

      .bn-gate-content.active {
        display: block;
      }

      .bn-gate-card p {
        color: #666;
        font-size: 13px;
        line-height: 1.6;
        margin: 0 0 16px;
      }

      .bn-gate-small {
        font-size: 12px !important;
      }

      #bn-gate-password,
      #bn-gate-current,
      #bn-gate-new-pass,
      #bn-gate-confirm {
        width: 100%;
        box-sizing: border-box;
        padding: 11px 12px;
        font-size: 15px;
        border: 1.5px solid #ddd;
        border-radius: 8px;
        margin-bottom: 10px;
        transition: all 0.2s ease;
      }

      #bn-gate-password:focus,
      #bn-gate-current:focus,
      #bn-gate-new-pass:focus,
      #bn-gate-confirm:focus {
        outline: none;
        border-color: #0f766e;
        box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1);
        background: #f9fffe;
      }

      .bn-gate-primary {
        width: 100%;
        padding: 11px 14px;
        font-size: 15px;
        font-weight: 600;
        border: none;
        border-radius: 8px;
        background: #0f766e;
        color: #fff;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-top: 4px;
      }

      .bn-gate-primary:hover {
        background: #0b5a52;
        box-shadow: 0 6px 18px rgba(15, 118, 110, 0.3);
      }

      .bn-gate-error,
      .bn-gate-success {
        font-size: 13px;
        margin-top: 12px;
        padding: 8px 10px;
        border-radius: 6px;
        display: none;
      }

      .bn-gate-error {
        color: #b3261e;
        background: rgba(179, 38, 30, 0.08);
      }

      .bn-gate-error.show {
        display: block;
      }

      .bn-gate-success {
        color: #2f7a4f;
        background: rgba(47, 122, 79, 0.08);
      }

      .bn-gate-success.show {
        display: block;
      }

      .bn-gate-link {
        display: inline-block;
        margin-top: 16px;
        font-size: 13px;
        color: #0f766e;
        text-decoration: none;
        font-weight: 600;
      }

      .bn-gate-link:hover {
        text-decoration: underline;
      }

      .bn-gate-card {
        max-width: 430px;
        border-radius: 24px;
        padding: 34px;
        position: relative;
        overflow: hidden;
      }
      .bn-gate-card::before {
        content: "";
        position: absolute; inset: 0 0 auto 0; height: 7px;
        background: linear-gradient(90deg,#f59e0b,#0f766e,#f59e0b);
      }
      .bn-gate-brand { display:flex; align-items:center; gap:12px; text-align:left; margin-bottom:18px; }
      .bn-gate-logo-wrap { width:48px; height:48px; border-radius:14px; overflow:hidden; background:#fff7e6; display:grid; place-items:center; box-shadow:0 5px 18px rgba(15,118,110,.12); }
      .bn-gate-logo-wrap img { width:100%; height:100%; object-fit:cover; }
      .bn-gate-brand-name { font-weight:900; letter-spacing:1.4px; color:#0f5c52; font-size:14px; }
      .bn-gate-brand-sub { color:#7a8790; font-size:11px; margin-top:2px; }
      .bn-gate-lock { width:54px; height:54px; margin:4px auto 10px; border-radius:50%; display:grid; place-items:center; background:#fff6df; font-size:25px; }
      .bn-gate-card h2 { margin-bottom:8px; font-size:24px; }
      .bn-gate-card p { margin-bottom:20px; }
      .bn-gate-field { text-align:left; }
      .bn-gate-field span { display:block; font-size:11px; font-weight:800; color:#53616b; margin:0 0 7px 2px; text-transform:uppercase; letter-spacing:.08em; }
      .bn-gate-primary { border-radius:12px; padding:13px 16px; box-shadow:0 8px 20px rgba(15,118,110,.2); }
      .bn-gate-link { color:#0f766e; }
      @media (max-width: 480px) {
        .bn-gate-card {
          padding: 28px 20px;
        }

        .bn-gate-logo {
          font-size: 16px;
        }

        .bn-gate-card h2 {
          font-size: 18px;
        }

        .bn-gate-tabs {
          flex-direction: column;
          margin-bottom: 16px;
        }

        .bn-gate-tab {
          width: 100%;
          border-bottom: none;
          border-right: 3px solid transparent;
          text-align: left;
          padding: 8px 10px;
        }

        .bn-gate-tab.active {
          border-right-color: #0f766e;
        }
      }
    `;
    document.head.appendChild(css);
  }

  // Attach handlers
  function attachGateHandlers() {
    const passwordInput = document.getElementById("bn-gate-password");
    const loginBtn = document.getElementById("bn-gate-login-btn");
    const errorDiv = document.getElementById("bn-gate-error");

    function attemptLogin() {
      const password = passwordInput.value;
      if (!password) {
        showError(errorDiv, "Please enter your seller password.");
        return;
      }
      if (validatePassword(password)) {
        sessionStorage.setItem(SESSION_FLAG, "1");
        document.getElementById("bn-admin-gate").remove();
        const hideStyle = document.getElementById("bn-admin-gate-style");
        if (hideStyle) hideStyle.remove();
        setTimeout(() => location.reload(), 100);
      } else {
        showError(errorDiv, "Incorrect password. Please try again.");
        passwordInput.value = "";
        passwordInput.focus();
      }
    }

    loginBtn.addEventListener("click", attemptLogin);
    passwordInput.addEventListener("keydown", (e) => { if (e.key === "Enter") attemptLogin(); });
    passwordInput.focus();
  }

  function showError(element, message) {
    element.textContent = message;
    element.classList.add("show");
  }

  function showSuccess(element, message) {
    element.textContent = message;
    element.classList.add("show");
  }

  // Global API for testing
  window.BN_Security = {
    changePassword: function(current, newPass, confirm) {
      if (!validatePassword(current)) return "Current password incorrect";
      if (newPass.length < 6) return "Password too short";
      if (newPass !== confirm) return "Passwords don't match";
      const newHash = simpleHash(newPass);
      localStorage.setItem(STORAGE_KEY, newHash);
      return "Password changed";
    },
    logout: function() {
      sessionStorage.removeItem(SESSION_FLAG);
      location.reload();
    }
  };
})();
