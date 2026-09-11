# BookNest clean-start instructions

1. Open Supabase → SQL Editor → New query.
2. Copy everything from `RESET_BOOKNEST_DATA.sql`.
3. Run it once. It clears the old BookNest inventory/shop/order snapshots but does not delete Auth accounts.
4. Deploy this build to Vercel.
5. Open the Seller Add Books page and create your real books again.
6. Use Add to Shop to publish only the exact copies you want.

After this reset, the website treats `.shop_listings` as the storefront source and `.books` as the inventory source. The buyer shop no longer decides what is online from an unrelated `shopVisible` flag.
