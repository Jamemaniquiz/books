# BookNest — buyer accounts, one-time setup

Buyer sign up/login (`buyer-login.html`) and the seller's Buyers tracking
page (`buyers.html`) run on the same Supabase project the rest of the
site already uses — the URL/key are already in `supabase-config.js`,
nothing to paste there.

The only thing left is creating the table + functions that store buyer
accounts. Do this **once**:

## 1. Run this SQL

**If buyer signup currently does not work, this is the part that is missing.** Run the complete `DATABASE_SETUP.sql` file included with this project, or paste the SQL below into Supabase → SQL Editor → New query.

Supabase → **SQL Editor → New query** → paste the block below → **Run**.

```sql
create extension if not exists pgcrypto;

-- Buyer accounts table. Not readable or writable directly by the
-- public — only through the three functions below, so a password hash
-- can never be bulk-downloaded from the browser.
create table if not exists public.booknest_buyers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  username_key text not null unique,
  password_hash text not null,
  fb_name text not null,
  fb_link text not null,
  created_at timestamptz not null default now()
);

alter table public.booknest_buyers enable row level security;
-- (No policies are added on purpose — this blocks all direct
-- select/insert/update/delete from the browser. Everything goes
-- through the SECURITY DEFINER functions below instead.)

-- Sign up: inserts a new buyer. Fails with a "duplicate key" error if
-- the name is already taken (there's a UNIQUE constraint on username_key).
create or replace function public.booknest_buyer_signup(
  p_name text, p_username_key text, p_password_hash text,
  p_fb_name text, p_fb_link text
) returns table(id uuid, name text)
language plpgsql security definer as $$
begin
  return query
  insert into public.booknest_buyers (name, username_key, password_hash, fb_name, fb_link)
  values (p_name, p_username_key, p_password_hash, p_fb_name, p_fb_link)
  returning booknest_buyers.id, booknest_buyers.name;
end;
$$;
grant execute on function public.booknest_buyer_signup to anon, authenticated;

-- Log in: compares the hash INSIDE Postgres and only ever returns
-- id + name if it matches — the stored hash itself never leaves the database.
create or replace function public.booknest_buyer_login(
  p_username_key text, p_password_hash text
) returns table(id uuid, name text)
language plpgsql security definer as $$
begin
  return query
  select b.id, b.name from public.booknest_buyers b
  where b.username_key = p_username_key and b.password_hash = p_password_hash;
end;
$$;
grant execute on function public.booknest_buyer_login to anon, authenticated;

-- Seller directory: every buyer's public profile info, no password hash.
create or replace function public.booknest_buyer_list()
returns table(id uuid, name text, fb_name text, fb_link text, created_at timestamptz)
language plpgsql security definer as $$
begin
  return query
  select b.id, b.name, b.fb_name, b.fb_link, b.created_at
  from public.booknest_buyers b
  order by b.created_at desc;
end;
$$;
grant execute on function public.booknest_buyer_list to anon, authenticated;
```

## 2. That's it

No config files to edit, no API keys to copy — `supabase-config.js` is
already wired up for the rest of the site, and these functions use the
exact same project.

- Buyer sign-up/login: `buyer-login.html`
- Seller's Buyers tracking page: `buyers.html` — unlocked with the
  same seller passcode as the rest of the admin pages (the one from
  `admin-gate.js`, default `booknest2026` unless you've changed it).

## Forgotten passwords

There's no email on these accounts, so there's no automatic reset
link. If a buyer forgets their password, they message you on the
Facebook link they signed up with — verify it's really them, then run
this in the SQL Editor to set a new one (replace the bracketed parts):

```sql
update public.booknest_buyers
set password_hash = encode(digest('[new-password]:[their-username-key]', 'sha256'), 'hex')
where username_key = '[their-username-key]';
```

`username_key` is their name, lowercased, with spaces/punctuation
turned into dots (e.g. "Juan Dela Cruz" → `juan.dela.cruz`) — you can
find it by running `select name, username_key from public.booknest_buyers;`.
Just tell the buyer the new password you set — there's no in-app way to
change it themselves, so re-run this any time they need another reset.
