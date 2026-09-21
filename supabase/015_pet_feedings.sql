-- supabase/015_pet_feedings.sql
-- 2026-09-21 — 밥주기 경제 개편(사용자 요청): 개인 펫은 여전히 하루 한 번만 먹일 수 있어야 하고,
-- 그룹 펫은 "그룹원 각자 하루 한 번씩"(그룹원 수만큼) 먹일 수 있어야 한다. 기존엔 pets.last_fed_date
-- 딱 한 칸으로 "이 펫 오늘 먹었는지"만 표시해서 그룹원별로 따로 셀 수가 없었다 — 그래서 "누가·어느
-- 펫에·언제 먹였는지"를 행 단위로 남기는 테이블을 새로 만든다. unique 제약이 "그 사람이 그 날 그
-- 펫에 벌써 먹였는지"를 그대로 막아준다(개인 펫은 항상 user_id 하나뿐이니 자동으로 하루 1회가 되고,
-- 그룹 펫은 user_id가 그룹원마다 다르므로 각자 한 번씩 허용된다).
create table pet_feedings (
  id         uuid primary key default gen_random_uuid(),
  pet_id     uuid not null references pets(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  fed_date   date not null,
  created_at timestamptz not null default now(),
  unique (pet_id, user_id, fed_date)
);

alter table pet_feedings enable row level security;

-- 실제로 그 펫에 코인·XP를 써도 되는지는 pets_update_own_or_group_member(005_pet_feature.sql,
-- "본인 개인 펫 또는 내가 속한 그룹의 그룹 펫만 수정 가능")가 이미 막아준다 — 여기는 "내가 먹인
-- 기록만 내가 볼 수 있다"만 추가로 확인한다.
create policy pet_feedings_select_own on pet_feedings for select using (user_id = auth.uid());
create policy pet_feedings_insert_own on pet_feedings for insert with check (user_id = auth.uid());
