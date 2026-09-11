# BookNest launch QA

Static checks performed before launch:
- JavaScript syntax checked with Node.
- Inline JavaScript blocks checked after patching.
- Broken seller logo path `Assets/Booknest.png` replaced with `logo.png`.
- Duplicate TikTok constant removed; authentic checkout URL retained.
- Seller Orders render runtime error fixed (`activeOrders` / `archivedOrders`).
- Archived orders are read-only and archiving no longer restores stock.
- Buyer email is no longer displayed/required.
- Payment proof remains visible to seller and opens in a viewer.

Supabase prerequisite: `public.booknest_data` must be in the `supabase_realtime` publication for cross-device realtime updates.
