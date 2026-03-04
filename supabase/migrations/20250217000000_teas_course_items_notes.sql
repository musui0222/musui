-- Tea Course: 4 teas per run
-- teas: master tea data
-- course_items: (course_id, step_index, tea_id) step_index 1..4
-- notes: run notes, step_index 1..4, unique(run_id, step_index)

-- 1) teas: master tea catalog
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

-- 2) course_items: course composition (change teas without code changes)
create table if not exists public.course_items (
  course_id text not null,
  step_index smallint not null check (step_index between 1 and 4),
  tea_id text not null references public.teas(id) on delete cascade,
  primary key (course_id, step_index)
);

create index if not exists idx_course_items_course on public.course_items(course_id);

-- 3) notes: run notes, 4 steps per run
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

create index if not exists idx_notes_run on public.notes(run_id);

alter table public.notes enable row level security;

create policy "notes_select_own"
  on public.notes for select
  using (
    exists (
      select 1 from public.course_runs r
      where r.id = run_id and r.user_id = auth.uid()
    )
  );

create policy "notes_insert_own"
  on public.notes for insert
  with check (
    exists (
      select 1 from public.course_runs r
      where r.id = run_id and r.user_id = auth.uid()
    )
  );

create policy "notes_update_own"
  on public.notes for update
  using (
    exists (
      select 1 from public.course_runs r
      where r.id = run_id and r.user_id = auth.uid()
    )
  );

-- 4) Seed teas (session-1: 4 teas from 고도; sessions 2–4: placeholders)
insert into public.teas (id, name, origin, tasting_note, meaning_in_course, recommended_temp, recommended_time, steeping_guide, altitude_range, zone_name, image_src, musui_tip) values
  ('tea-01', '하동 중작', '한국 (경남 하동)', '풍부한 일조량과 남해의 해풍을 머금고 자란 하동 중작은, 잎이 충분히 성숙한 상태에서 수확되어 묵직한 바디감을 형성합니다. 전통 덖음 공정을 거치며 형성된 구수한 곡물 향과 은은한 견과류 뉘앙스, 그리고 토양에서 기인한 미네랄리티가 안정적으로 받쳐주는 구조감이 특징입니다.', '[해안 평지]', '90℃', '30초', '1~3회', '0m ~ 300m', '지리산 자락의 저지대', '/posters/hadong-jungjak.png', '■ 유리 다구를 권합니다.
녹차의 맑은 초록빛이 우러나는 과정을 눈으로 함께 경험해보세요.
■ 녹차는 세차(찻잎을 먼저 씻는 과정)를 권하지 않습니다.
연한 잎의 섬세한 향과 아미노산의 단맛이 씻겨 나갈 수 있기 때문입니다.
■ 물을 붓기 전, 마른 찻잎을 가볍게 흔들어 향을 먼저 맡아보세요.
따뜻해지기 전 잎이 지닌 풋향이 먼저 열립니다.
■ 한 모금 머금고,
한국 녹차 특유의 포근함과 부드러운 질감을 천천히 느껴보세요.'),
  ('tea-02', '다즐링 퍼스트 플러쉬', '인도 (다즐링)', '고산으로 향하는 길목에서 만나는 화사한 머스캣 향과 섬세한 산미의 균형', '[완만한 구릉]', '88℃', '1분 20초', '1~3회', '500m ~ 800m', '완만한 구릉', null, null),
  ('tea-03', '아리산 고산 오롱', '대만 (가이현)', '기압이 낮아지며 향기가 응축되는 단계. 부드러운 유향(Milk note)이 특징', '[고산의 시작]', '90℃', '1분 40초', '1~3회', '1,000m ~ 1,200m', '고산의 시작', null, null),
  ('tea-04', '리산 고산 오롱', '대만 (태중시)', '짙은 안개 속에서 자라난 날카로운 난꽃향. 향기의 밀도가 한층 더 조밀해지는 구간', '[운무의 정점]', '92℃', '1분 50초', '1~3회', '1,500m ~ 1,800m', '운무의 정점', null, null),
  ('tea-s2-1', '1st Tea', '예시', '예시 노트', '예시', '85℃', '1분 30초', '1~3회', null, null, null, null),
  ('tea-s2-2', '2nd Tea', '예시', '예시 노트', '예시', '85℃', '1분 30초', '1~3회', null, null, null, null),
  ('tea-s2-3', '3rd Tea', '예시', '예시 노트', '예시', '85℃', '1분 30초', '1~3회', null, null, null, null),
  ('tea-s2-4', '4th Tea', '예시', '예시 노트', '예시', '85℃', '1분 30초', '1~3회', null, null, null, null),
  ('tea-s3-1', '1st Tea', '예시', '예시 노트', '예시', '85℃', '1분 30초', '1~3회', null, null, null, null),
  ('tea-s3-2', '2nd Tea', '예시', '예시 노트', '예시', '85℃', '1분 30초', '1~3회', null, null, null, null),
  ('tea-s3-3', '3rd Tea', '예시', '예시 노트', '예시', '85℃', '1분 30초', '1~3회', null, null, null, null),
  ('tea-s3-4', '4th Tea', '예시', '예시 노트', '예시', '85℃', '1분 30초', '1~3회', null, null, null, null),
  ('tea-s4-1', '1st Tea', '예시', '예시 노트', '예시', '85℃', '1분 30초', '1~3회', null, null, null, null),
  ('tea-s4-2', '2nd Tea', '예시', '예시 노트', '예시', '85℃', '1분 30초', '1~3회', null, null, null, null),
  ('tea-s4-3', '3rd Tea', '예시', '예시 노트', '예시', '85℃', '1분 30초', '1~3회', null, null, null, null),
  ('tea-s4-4', '4th Tea', '예시', '예시 노트', '예시', '85℃', '1분 30초', '1~3회', null, null, null, null)
on conflict (id) do nothing;

-- 5) Seed course_items (4 steps per course)
insert into public.course_items (course_id, step_index, tea_id) values
  ('session-1', 1, 'tea-01'),
  ('session-1', 2, 'tea-02'),
  ('session-1', 3, 'tea-03'),
  ('session-1', 4, 'tea-04'),
  ('session-2', 1, 'tea-s2-1'),
  ('session-2', 2, 'tea-s2-2'),
  ('session-2', 3, 'tea-s2-3'),
  ('session-2', 4, 'tea-s2-4'),
  ('session-3', 1, 'tea-s3-1'),
  ('session-3', 2, 'tea-s3-2'),
  ('session-3', 3, 'tea-s3-3'),
  ('session-3', 4, 'tea-s3-4'),
  ('session-4', 1, 'tea-s4-1'),
  ('session-4', 2, 'tea-s4-2'),
  ('session-4', 3, 'tea-s4-3'),
  ('session-4', 4, 'tea-s4-4')
on conflict (course_id, step_index) do nothing;
