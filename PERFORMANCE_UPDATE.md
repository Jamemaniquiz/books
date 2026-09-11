# BookNest Performance Update

This build keeps Supabase automatic synchronization but removes the biggest startup costs:

- Each page now requests only the Supabase datasets it actually needs instead of downloading inventory, receipts, sales, orders, and payment data on every page.
- Supabase Realtime refreshes only the dataset that changed when possible.
- Buyer/seller pages continue to use shared Supabase data.
- Images are decoded asynchronously and below-the-fold images are lazy-loaded, including dynamically rendered cards.
- Long lists use browser content-visibility to reduce initial rendering work.
- Same-site navigation is lightly prefetched on hover to make switching pages feel faster without reloading continuously.
- The site does not use aggressive 1–2 second full-page refresh loops.

No database reset is required for this performance update.
