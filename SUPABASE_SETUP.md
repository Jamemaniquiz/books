# BookNest — Supabase setup

**Recommended:** run the included `DATABASE_SETUP.sql` once in Supabase SQL Editor. It creates the main BookNest data table plus buyer accounts.


This version keeps your existing HTML/CSS/JavaScript website. It does NOT require React, Angular, Next.js, or Prisma.

## 1. Create the database table

In Supabase, open **SQL Editor → New query** and run the SQL below:

```sql
create table if not exists public.booknest_data (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.booknest_data enable row level security;

drop policy if exists "BookNest public read" on public.booknest_data;
drop policy if exists "BookNest public insert" on public.booknest_data;
drop policy if exists "BookNest public update" on public.booknest_data;

create policy "BookNest public read"
on public.booknest_data
for select
to anon, authenticated
using (true);

create policy "BookNest public insert"
on public.booknest_data
for insert
to anon, authenticated
with check (true);

create policy "BookNest public update"
on public.booknest_data
for update
to anon, authenticated
using (true)
with check (true);
```

## 2. Get the two public API values

Supabase → **Project Settings → API**.

Copy:

- Project URL
- `anon` / `public` key

Open `supabase-config.js` and paste them into:

```js
window.BOOKNEST_SUPABASE_URL = "...";
window.BOOKNEST_SUPABASE_ANON_KEY = "...";
```

Do NOT paste the `service_role` / secret key.

## 3. Upload all files to Vercel

Replace the old files with this folder, then deploy again.

## What this does

The existing BookNest records remain in the same format. The cloud table stores the existing arrays under these keys:

- `.books`
- `.sales`
- `.receipts`
- `.purchases`
- `.sellerPayment`
- `.shop_orders`

When the site opens, it downloads the cloud copy into the browser cache. When inventory, receipts, sales, payment settings, or shop orders are saved, the new data is also uploaded to Supabase.

If the cloud table is empty on the first setup, the first browser that already has BookNest data uploads that data instead of replacing it.

## Important security note

This first version uses public Supabase policies so your existing static HTML/JavaScript site can work without requiring you to rebuild your login system. That means a technically knowledgeable visitor could potentially modify cloud data.

For a production store, the next step should be to move the seller/buyer authentication to Supabase Auth and change the policies so only the seller can modify inventory, receipts, payment settings, and order status. Do that before relying on the database for sensitive business records.
