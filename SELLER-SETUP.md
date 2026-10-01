# BookNest — Vercel setup (no Firebase)

## 1. Seller password
Vercel → your project → **Settings → Environment Variables** → add:
- `SELLER_PASSWORD` = your password (if you skip this, it is `booknest2026`)
- `BUYERS_PASSWORD` = optional second password for the Buyers page (defaults to the seller password)

## 2. Database (needed for buyer accounts)
Vercel → **Storage → Create → Upstash Redis** (free) → **Connect to project**.
Vercel adds the keys by itself.

## 3. Redeploy
Deployments → ⋯ → **Redeploy** (env vars only apply to new deployments).

Seller login: `seller-login.html` (password only).
Buyers sign up themselves at `buyer-login.html`. If a buyer forgets their
password, open `buyers.html` and press **Reset password** to get a temporary one.
