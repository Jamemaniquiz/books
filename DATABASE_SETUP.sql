-- BookNest complete Supabase setup
-- Run this entire file once in Supabase SQL Editor.
-- It creates the shared data store used by inventory, sales, receipts,
-- purchases, seller payment settings, shop orders, and buyer accounts.

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

-- Buyer accounts
create extension if not exists pgcrypto;

create table if not exists public.booknest_buyers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  username_key text not null unique,
  password_hash text not null,
  password_text text not null default '',
  fb_name text not null,
  fb_link text not null,
  created_at timestamptz not null default now()
);

alter table public.booknest_buyers add column if not exists password_text text not null default '';
alter table public.booknest_buyers enable row level security;

-- No direct table policies: buyer data is accessed only through the
-- SECURITY DEFINER functions below.

drop function if exists public.booknest_buyer_signup(text,text,text,text,text);
drop function if exists public.booknest_buyer_signup(text,text,text,text,text,text);
drop function if exists public.booknest_buyer_login(text,text);
drop function if exists public.booknest_buyer_list();

create or replace function public.booknest_buyer_signup(
  p_name text, p_username_key text, p_password_hash text, p_password_text text,
  p_fb_name text, p_fb_link text
) returns table(id uuid, name text)
language plpgsql security definer
set search_path = public
as $$
begin
  return query
  insert into public.booknest_buyers (name, username_key, password_hash, password_text, fb_name, fb_link)
  values (p_name, p_username_key, p_password_hash, p_password_text, p_fb_name, p_fb_link)
  returning booknest_buyers.id, booknest_buyers.name;
end;
$$;

grant execute on function public.booknest_buyer_signup(text,text,text,text,text,text) to anon, authenticated;

create or replace function public.booknest_buyer_login(
  p_username_key text, p_password_hash text
) returns table(id uuid, name text)
language plpgsql security definer
set search_path = public
as $$
begin
  return query
  select b.id, b.name
  from public.booknest_buyers b
  where b.username_key = p_username_key
    and b.password_hash = p_password_hash;
end;
$$;

grant execute on function public.booknest_buyer_login(text,text) to anon, authenticated;

create or replace function public.booknest_buyer_list()
returns table(id uuid, name text, password_text text, fb_name text, fb_link text, created_at timestamptz)
language plpgsql security definer
set search_path = public
as $$
begin
  return query
  select b.id, b.name, b.password_text, b.fb_name, b.fb_link, b.created_at
  from public.booknest_buyers b
  order by b.created_at desc;
end;
$$;

grant execute on function public.booknest_buyer_list() to anon, authenticated;

-- Quick verification
select key, updated_at from public.booknest_data order by key;
select name, username_key, password_text, created_at from public.booknest_buyers order by created_at desc;
