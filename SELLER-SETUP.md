# BookNest — seller password (no Firebase, no Vercel functions)

- Seller login: open `seller-login.html` and type the password. Default: `booknest2026`.
- Change it: log in → `admin.html` → **Seller Password** card → Change Password.
- The password is saved in the browser you change it in (each phone/computer has its own).
- Forgot it? Open the site in that browser, press F12 → Console, run
  `localStorage.removeItem('bn_admin_password_hash')` and reload — it goes back to `booknest2026`.
