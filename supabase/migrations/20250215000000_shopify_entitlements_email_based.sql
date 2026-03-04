-- Shopify entitlements: email-based, user_id nullable (webhook may arrive before signup)
-- Profiles table not required for matching

drop table if exists public.shopify_entitlements;

create table public.shopify_entitlements (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  user_id uuid references auth.users(id) on delete cascade,
  course_id text not null,
  shopify_order_id text,
  shopify_customer_id text,
  created_at timestamptz not null default now(),
  unique(email, course_id)
);

create index idx_shopify_entitlements_email on public.shopify_entitlements(email);
create index idx_shopify_entitlements_user_id on public.shopify_entitlements(user_id) where user_id is not null;

alter table public.shopify_entitlements enable row level security;

-- Helper: current user's email (for RLS)
create or replace function public.current_user_email()
returns text language sql security definer stable
as $$ select email from auth.users where id = auth.uid() $$;

-- SELECT: own rows by user_id, or unlinked rows matching current user email
drop policy if exists "shopify_entitlements_select_own" on public.shopify_entitlements;
create policy "shopify_entitlements_select_own"
  on public.shopify_entitlements for select
  using (
    user_id = auth.uid()
    or (user_id is null and lower(email) = lower(public.current_user_email()))
  );

-- UPDATE: allow linking (set user_id) on unlinked rows matching current user email
drop policy if exists "shopify_entitlements_update_link" on public.shopify_entitlements;
create policy "shopify_entitlements_update_link"
  on public.shopify_entitlements for update
  using (user_id is null and lower(email) = lower(public.current_user_email()))
  with check (user_id = auth.uid());
