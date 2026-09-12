# BookNest data preservation fix

This release removes automatic clean-slate localStorage resets. Deploying a new version will no longer erase cached books, receipts, orders, or buyer accounts.

If receipts were already deleted from both the browser and Supabase before this release, the app cannot recreate their original records without a backup/export.
