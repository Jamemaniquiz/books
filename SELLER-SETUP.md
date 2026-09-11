# BookNest — seller access

The whole seller/admin side (Home, Inventory & Sales, Receipts, Shop
Orders, Buyers) is behind **one passcode**, handled by `admin-gate.js`.

## Changing the passcode

1. Open `admin.html` (or any seller page) in your browser.
2. Unlock it with the current passcode (default: `booknest2026`, unless
   you've already changed it).
3. Click the **🔑 Change Password** tab on the same lock screen.

That's it — no Firebase, no separate accounts. The same passcode
unlocks every seller page, including the Buyers tracking page.

## Buyer accounts

Buyers sign up/log in themselves with just a name + password, over on
`buyer-login.html`. That runs on Supabase and needs a small one-time
SQL setup — see `BUYER_ACCOUNTS_SETUP.md`.
