-- ============================================================
-- Musui Supabase 스키마
-- Supabase Dashboard → SQL Editor에서 이 파일 내용 실행
-- ============================================================

-- 1) 프로필 (선택) — auth.users 확장, 작성자 표시용
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 새 가입 시 프로필 자동 생성 (닉네임은 raw_user_meta_data.display_name)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    nullif(trim(new.raw_user_meta_data->>'display_name'), '')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2) 아카이브 (차 기록 세션)
-- ============================================================
create table if not exists public.archives (
  id text primary key default ('manual-' || extract(epoch from now())::bigint::text),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  is_public boolean not null default false
);
-- course_run_id: added by migration 20250216000000 (references course_runs)

create index if not exists idx_archives_user_id on public.archives(user_id);
create index if not exists idx_archives_created_at on public.archives(created_at desc);
create index if not exists idx_archives_is_public on public.archives(is_public) where is_public = true;

-- ============================================================
-- 3) 아카이브 항목 (BrewNote — 기록 1건당 찻잎 1종)
-- ============================================================
create table if not exists public.archive_items (
  id uuid primary key default gen_random_uuid(),
  archive_id text not null references public.archives(id) on delete cascade,
  item_index smallint not null default 0,

  course_id text not null default 'manual',
  laps smallint[] not null default array[0, 0, 0],
  mood text not null default '',
  memo text not null default '',

  tea_name text,
  tea_type text,
  origin text,
  brand_or_purchase text,
  photo_url text,

  infusion_notes jsonb default '[]'::jsonb,
  -- infusion_notes 예: [{"aroma":"","body":3,"aftertaste":"맑음"}, ...] 최대 3개

  created_at timestamptz default now(),
  unique(archive_id, item_index)
);

create index if not exists idx_archive_items_archive_id on public.archive_items(archive_id);

comment on column public.archive_items.laps is '우림별 시간(초), [1차, 2차, 3차]';
comment on column public.archive_items.infusion_notes is '[{aroma?, body?(1-7), aftertaste?}, ...]';

-- ============================================================
-- 4) RLS (Row Level Security)
-- ============================================================
alter table public.profiles enable row level security;
alter table public.archives enable row level security;
alter table public.archive_items enable row level security;

-- profiles: 본인만 읽기/수정, 공개 아카이브 보유자는 누구나 읽기(Magazine 작성자 표시)
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_select_public_owners" on public.profiles for select
  using (id in (select user_id from public.archives where is_public = true));
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- archives: 본인 것만 insert/update/delete, select는 본인 + 공개
create policy "archives_insert_own" on public.archives for insert with check (auth.uid() = user_id);
create policy "archives_select_own_or_public" on public.archives for select
  using (auth.uid() = user_id or is_public = true);
create policy "archives_update_own" on public.archives for update using (auth.uid() = user_id);
create policy "archives_delete_own" on public.archives for delete using (auth.uid() = user_id);

-- archive_items: archive 접근 권한과 동일 (archive가 본인 것이거나 공개일 때만)
create policy "archive_items_insert_own_archive" on public.archive_items for insert
  with check (
    exists (select 1 from public.archives a where a.id = archive_id and a.user_id = auth.uid())
  );
create policy "archive_items_select_public_or_own" on public.archive_items for select
  using (
    exists (
      select 1 from public.archives a
      where a.id = archive_id and (a.user_id = auth.uid() or a.is_public = true)
    )
  );
create policy "archive_items_update_own_archive" on public.archive_items for update
  using (
    exists (select 1 from public.archives a where a.id = archive_id and a.user_id = auth.uid())
  );
create policy "archive_items_delete_own_archive" on public.archive_items for delete
  using (
    exists (select 1 from public.archives a where a.id = archive_id and a.user_id = auth.uid())
  );

-- ============================================================
-- 5) Shopify Tea Course entitlements (webhook-populated)
-- Unique per (email, course_id) for gating; user_id nullable until linked
-- purchase_count, last_purchase_at track multiple purchases
-- ============================================================
create table if not exists public.shopify_entitlements (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  user_id uuid references auth.users(id) on delete cascade,
  course_id text not null,
  shopify_order_id text,
  shopify_customer_id text,
  purchase_count int not null default 1,
  last_purchase_at timestamptz,
  created_at timestamptz not null default now(),
  unique(email, course_id)
);
create index if not exists idx_shopify_entitlements_email on public.shopify_entitlements(email);
create index if not exists idx_shopify_entitlements_user_id on public.shopify_entitlements(user_id) where user_id is not null;
alter table public.shopify_entitlements enable row level security;

-- ============================================================
-- 6) shopify_purchases (webhook deduplication)
-- One row per line item; prevents duplicate processing
-- ============================================================
create table if not exists public.shopify_purchases (
  id uuid primary key default gen_random_uuid(),
  shopify_order_id text not null,
  shopify_line_item_id text not null,
  email text not null,
  course_id text not null,
  purchased_at timestamptz not null default now(),
  unique(shopify_order_id, shopify_line_item_id)
);

-- ============================================================
-- 7) course_runs (Start/Restart sessions)
-- One row per "Start/Restart" click; records stored under run_id
-- archives.course_run_id links Tea Course archives to a run
-- ============================================================
create table if not exists public.course_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 8) teas (master tea catalog)
-- ============================================================
create table if not exists public.teas (
  id text primary key,
  name text not null,
  origin text not null default '',
  tasting_note text not null default '',
  meaning_in_course text default '',
  recommended_temp text default '',
  recommended_time text default '',
  steeping_guide text default '',
  altitude_range text,
  zone_name text,
  image_src text,
  musui_tip text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 9) course_items (course composition, 4 steps)
-- (course_id, step_index, tea_id) step_index 1..4
-- Change teas without code changes
-- ============================================================
create table if not exists public.course_items (
  course_id text not null,
  step_index smallint not null check (step_index between 1 and 4),
  tea_id text not null references public.teas(id) on delete cascade,
  primary key (course_id, step_index)
);

-- ============================================================
-- 10) redeem_codes (QR/code in package)
-- ============================================================
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

create table if not exists public.redeem_redemptions (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  ip_hash text
);

create table if not exists public.redeem_attempts (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  attempted_at timestamptz not null default now()
);

-- ============================================================
-- 11) notes (run notes, 4 steps per run)
-- unique(run_id, step_index), step_index 1..4
-- ============================================================
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.course_runs(id) on delete cascade,
  step_index smallint not null check (step_index between 1 and 4),
  laps smallint[] not null default array[0, 0, 0],
  memo text not null default '',
  tea_name text,
  altitude_range text,
  infusion_notes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique(run_id, step_index)
);

-- ============================================================
-- 6) 스토리지 버킷 (찻자리 사진, 선택)
-- Dashboard → Storage에서 버킷 생성 후 아래 정책 적용 가능
-- 버킷 이름 예: tea-photos (public 또는 private)
-- ============================================================
-- insert: 로그인 사용자만
-- select: 공개 아카이브의 사진은 모두, 비공개는 본인만
-- (스토리지 정책은 Dashboard에서 설정하는 것이 편함)
