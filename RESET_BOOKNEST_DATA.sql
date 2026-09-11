-- BookNest clean start
-- Run this ONCE in Supabase SQL Editor if you want to remove the old
-- BookNest business/store snapshots before deploying the rebuilt site.
-- This does NOT delete Supabase Auth buyer accounts.

BEGIN;
DELETE FROM public.booknest_data;
COMMIT;

-- The site status/lock is also stored in this same table; after reset the buyer site defaults to OPEN.

-- Enable near-real-time updates for the storefront.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'booknest_data'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.booknest_data;
  END IF;
END $$;
