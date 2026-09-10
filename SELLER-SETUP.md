# BookNest — one-time Firebase setup

Do these once, in the Firebase console, after you've pasted your config
into `firebase-config.js`.

## 1. Paste the security rules
Firestore console → **Rules** tab → replace everything with the contents
of `firestore.rules` (in this folder) → **Publish**.
Without this step, Firestore will block every read/write (Production
mode denies everything by default).

## 2. Create your seller account
1. Firestore console → **Authentication** → **Users** tab → **Add user**.
2. Enter the email and password *you* (the seller) will log in with.
3. Copy the **User UID** it shows you after creating it.
4. Go to **Firestore Database** → **Start collection** → collection ID
   `sellers` → document ID = paste that UID → add any field, e.g.
   `role: "seller"` → **Save**.

This is what makes that one login count as a *seller* login instead of
a buyer — the app checks for a matching document in `sellers/{uid}`.

## 3. Set the Buyers page's second password
Firestore console → **Firestore Database** → **Start collection** →
collection ID `settings` → document ID `buyersLock` → add a field
named `password` (type: string) with whatever second password you want
→ **Save**.

## 4. You're set
- Seller login: `seller-login.html`
- Buyer sign-up/login: `buyer-login.html`
- Buyers admin page (double-locked): `buyers.html`

If you ever want to change the Buyers page password, just edit that
same `settings/buyersLock` → `password` field in Firestore — no code
changes needed.
