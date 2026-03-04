-- Redeem codes: reusable QR/code printed in package
-- MVP: 1 Tea Course, user redeems code to unlock

-- 1) redeem_codes
create table if not exists public.redeem_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  course_id text not null,
  status text not null default 'active' check (status in ('active', 'disabled', 'expired')),
  expires_at timestamptz,
  max_uses int,
  used_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_redeem_codes_code on public.redeem_codes(code);
create index if not exists idx_redeem_codes_course on public.redeem_codes(course_id);

-- 2) redeem_redemptions (one row per user redemption)
create table if not exists public.redeem_redemptions (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  ip_hash text
);

create unique index if not exists idx_redeem_redemptions_code_user
  on public.redeem_redemptions(code, user_id);
create index if not exists idx_redeem_redemptions_code on public.redeem_redemptions(code);
create index if not exists idx_redeem_redemptions_user on public.redeem_redemptions(user_id);

-- 3) redeem_attempts (rate limit / abuse protection)
create table if not exists public.redeem_attempts (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  attempted_at timestamptz not null default now()
);

create index if not exists idx_redeem_attempts_ip_hash on public.redeem_attempts(ip_hash);
create index if not exists idx_redeem_attempts_at on public.redeem_attempts(attempted_at);

-- RLS: redeem_codes readable by service role only (API uses service role for validation)
alter table public.redeem_codes enable row level security;
-- No policies: API uses service role

alter table public.redeem_redemptions enable row level security;
-- No policies: API uses service role

alter table public.redeem_attempts enable row level security;
-- No policies: API uses service role

-- 4) shopify_entitlements: allow INSERT for redeem (user creating own entitlement)
-- Policy: user can insert when email matches and user_id = auth.uid()
drop policy if exists "shopify_entitlements_insert_redeem" on public.shopify_entitlements;
create policy "shopify_entitlements_insert_redeem"
  on public.shopify_entitlements for insert
  with check (
    user_id = auth.uid()
    and lower(email) = lower(public.current_user_email())
  );

-- 5) Seed sample code for testing (remove in production or set expires_at)
-- insert into public.redeem_codes (code, course_id, status) values ('MUSUI-TEST-2025', 'session-1', 'active');
