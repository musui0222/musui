-- Course runs + purchase tracking + entitlement purchase_count
-- 1) Add purchase_count, last_purchase_at to shopify_entitlements
-- 2) Create shopify_purchases for webhook deduplication
-- 3) Create course_runs for Start/Restart sessions
-- 4) Add course_run_id to archives

-- 1) shopify_entitlements: purchase tracking
alter table public.shopify_entitlements
  add column if not exists purchase_count int not null default 1,
  add column if not exists last_purchase_at timestamptz;

-- Backfill existing rows
update public.shopify_entitlements
set purchase_count = 1, last_purchase_at = created_at
where last_purchase_at is null;

-- 2) shopify_purchases: dedupe webhook events
create table if not exists public.shopify_purchases (
  id uuid primary key default gen_random_uuid(),
  shopify_order_id text not null,
  shopify_line_item_id text not null,
  email text not null,
  course_id text not null,
  purchased_at timestamptz not null default now(),
  unique(shopify_order_id, shopify_line_item_id)
);

create index if not exists idx_shopify_purchases_order on public.shopify_purchases(shopify_order_id);
create index if not exists idx_shopify_purchases_email on public.shopify_purchases(email);

-- RLS: service role only (webhook writes); no user access
alter table public.shopify_purchases enable row level security;
-- No policies: only service role can access

-- 3) course_runs: one row per Start/Restart
create table if not exists public.course_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_course_runs_user on public.course_runs(user_id);
create index if not exists idx_course_runs_user_course on public.course_runs(user_id, course_id);

alter table public.course_runs enable row level security;

create policy "course_runs_select_own"
  on public.course_runs for select using (auth.uid() = user_id);

create policy "course_runs_insert_own"
  on public.course_runs for insert with check (auth.uid() = user_id);

-- 4) archives: link to course_run when from Tea Course session
alter table public.archives
  add column if not exists course_run_id uuid references public.course_runs(id) on delete set null;

create index if not exists idx_archives_course_run on public.archives(course_run_id) where course_run_id is not null;
