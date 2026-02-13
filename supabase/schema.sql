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

-- 새 가입 시 프로필 자동 생성
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
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

-- profiles: 본인만 읽기/수정
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
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
-- 5) 스토리지 버킷 (찻자리 사진, 선택)
-- Dashboard → Storage에서 버킷 생성 후 아래 정책 적용 가능
-- 버킷 이름 예: tea-photos (public 또는 private)
-- ============================================================
-- insert: 로그인 사용자만
-- select: 공개 아카이브의 사진은 모두, 비공개는 본인만
-- (스토리지 정책은 Dashboard에서 설정하는 것이 편함)
