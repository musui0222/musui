-- Shopify Tea Course entitlements (populated by orders/paid webhook)
create table if not exists public.shopify_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null,
  shopify_order_id text,
  created_at timestamptz not null default now(),
  unique(user_id, course_id)
);

-- Recommended indexes
create index if not exists idx_shopify_entitlements_user_id on public.shopify_entitlements(user_id);
create index if not exists idx_shopify_entitlements_user_course on public.shopify_entitlements(user_id, course_id);

alter table public.shopify_entitlements enable row level security;

drop policy if exists "shopify_entitlements_select_own" on public.shopify_entitlements;
create policy "shopify_entitlements_select_own"
  on public.shopify_entitlements for select
  using (auth.uid() = user_id);
