# Auto-refresh fix

Fixed the unwanted continuous refresh behavior.

- Removed seller 10-second cloud polling.
- Removed buyer shop 3-second cloud polling.
- Removed buyer-site-status 1.2-second polling.
- Supabase Realtime remains the event-driven updater when cloud data actually changes.
- Manual refresh controls remain available.
- Cart countdown remains a 1-second local timer and does not reload the page.

After deploying, do a hard refresh once. The page should remain stable until you or a real shared-data event changes something.
