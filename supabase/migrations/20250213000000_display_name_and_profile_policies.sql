-- 가입 시 닉네임(display_name) 저장 + 공개 아카이브 작성자 프로필 읽기
-- Supabase Dashboard → SQL Editor에서 실행 (이미 schema.sql 전체를 실행했다면 트리거/정책만 반영할 때 사용)

-- 1) 트리거: 가입 시 raw_user_meta_data.display_name → profiles.display_name
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

-- 2) RLS: 공개 아카이브가 있는 사용자의 프로필은 누구나 읽기 (커뮤니티 작성자 표시)
drop policy if exists "profiles_select_public_owners" on public.profiles;
create policy "profiles_select_public_owners" on public.profiles for select
  using (id in (select user_id from public.archives where is_public = true));
