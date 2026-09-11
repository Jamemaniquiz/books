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
        <div class="bn-gate-logo">📚 BookNest</div>
        <h2>Seller Access</h2>
        
        <div class="bn-gate-content active" id="login-tab">
          <div class="bn-gate-shield">🔐</div>
          <p>Enter your seller access password to continue to the BookNest workspace.</p>
          <input type="password" id="bn-gate-password" placeholder="Seller access password" autocomplete="off" />
          <button id="bn-gate-login-btn" class="bn-gate-primary">Open Seller Workspace →</button>
          <div id="bn-gate-error" class="bn-gate-error"></div>
          <a href="index.html" class="bn-gate-link">← Back to customer shop</a>
        </div>
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
        background: linear-gradient(180deg,#fffefb,#f7f1e3);
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
        font-weight: 800;
        font-size: 18px;
        margin-bottom: 8px;
        color: #0f766e;
        letter-spacing: 0.5px;
      }

      .bn-gate-shield {
        width: 58px; height: 58px; margin: 4px auto 16px; display: grid; place-items: center;
        border-radius: 18px; background: rgba(15,118,110,.10); font-size: 24px;
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

      @media (max-width: 480px) {
        .bn-gate-card {
          padding: 28px 20px;
        }

        .bn-gate-logo {
          font-size: 16px;
        }

        .bn-gate-shield {
        width: 58px; height: 58px; margin: 4px auto 16px; display: grid; place-items: center;
        border-radius: 18px; background: rgba(15,118,110,.10); font-size: 24px;
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
    // Login
    const passwordInput = document.getElementById("bn-gate-password");
    const loginBtn = document.getElementById("bn-gate-login-btn");
    const errorDiv = document.getElementById("bn-gate-error");

    function attemptLogin() {
      const password = passwordInput.value;
      if (!password) {
        showError(errorDiv, "Enter your password");
        return;
      }
      if (validatePassword(password)) {
        sessionStorage.setItem(SESSION_FLAG, "1");
        document.getElementById("bn-admin-gate").remove();
        const hideStyle = document.getElementById("bn-admin-gate-style");
        if (hideStyle) hideStyle.remove();
        setTimeout(() => location.reload(), 100);
      } else {
        showError(errorDiv, "Incorrect password");
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
