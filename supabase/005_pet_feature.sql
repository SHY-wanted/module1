-- supabase/005_pet_feature.sql
-- 2026-09-15 — 저금통 펫 키우기(docs/08-pet-feature-spec.md, §9 종민 확인 반영). 이미 schema.sql을
-- 실행해 둔 프로젝트의 SQL Editor에 이 파일만 추가로 실행할 것.
--
-- 범위: P1(펫 선택)·P2(펫 상세)·P3(먹이주기)·P5(배지)·P7(예산 설정)·P4(주간 절약 리포트, 배치 대신
-- 화면을 열 때마다 그 자리에서 계산해 저장하는 방식으로 구현 — 아래 6) 참고).
-- 뺀 것: P6(그룹 저금통 랭킹) — "그룹 펫이 정확히 어떻게 XP를 얻는지"가 팀이 아직 안 정한 진짜 정책
-- 공백(08-pet-feature-spec.md §9 "여전히 [?]로 남은 것" 2번)이라, 지어내지 않고 통째로 미룬다.
-- 그룹 펫 자체(만들기·보기·먹이주기)는 만들었다 — 개인 펫과 똑같이 "수동으로 밥 주기"만 하고,
-- 그룹 펫에 자동으로 XP를 주는 로직(예: 그룹 지출 기록 시 자동 급여)은 만들지 않았다.

-- ============================================================
-- 1) enum
-- ============================================================
create type pet_species as enum ('TIGER','DOG','CAT','DRAGON'); -- 08-pet-feature-spec.md §0

-- ============================================================
-- 2) 테이블
-- ============================================================

-- E9. Pet — user_id 또는 group_id 중 하나만 채운다(배타적, 06-data.md E9 · 08-pet-feature-spec.md §9).
-- 개인 펫: 한 사람당 1마리. 그룹 펫: 한 그룹당 1마리(그룹원이 함께 키움).
create table pets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id) on delete cascade,
  group_id      uuid references groups(id) on delete cascade,
  species       pet_species not null,
  pet_name      text,
  stage_index   int not null default 1 check (stage_index between 1 and 5),
  xp_progress   numeric not null default 0 check (xp_progress >= 0),
  total_coins   int not null default 0 check (total_coins >= 0),
  last_fed_date date,
  created_at    timestamptz not null default now(),
  constraint pets_owner_exclusive check (
    (user_id is not null and group_id is null) or (user_id is null and group_id is not null)
  )
);
-- 한 사용자당 개인 펫 1마리, 한 그룹당 그룹 펫 1마리로 제한(08-pet-feature-spec.md §1 "1마리만 존재").
create unique index pets_one_personal_per_user on pets (user_id) where user_id is not null;
create unique index pets_one_per_group on pets (group_id) where group_id is not null;

-- E11. Budget(예산) — 08-pet-feature-spec.md §4-1(BudgetSetting). 개인 단위 주간 예산만 가정(§9 참고,
-- 그룹 예산 필요 여부는 그룹 펫 XP 방식이 정해지지 않아 함께 미정).
create table budgets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null unique references profiles(id) on delete cascade,
  weekly_amount integer not null check (weekly_amount >= 0),
  auto_repeat  boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- E10. WeeklySettlement(주간 정산) — 08-pet-feature-spec.md §4, §8.
-- [?] "정확한 기준 요일·시각·타임존"·"배치 실패·중복 실행 처리"는 팀이 안 정했다(§9) — 그래서 별도
-- cron/Edge Function 배치를 만들지 않고, 사용자가 P4(주간 절약 리포트) 화면을 열 때 그 자리에서
-- "이번 주(월요일 시작, 기기 로컬 날짜 기준)" 지출 합계를 계산해 upsert하는 방식으로 대신했다 —
-- 팀이 정확한 배치 정책을 정하면 그때 Edge Function/cron으로 옮기면 된다.
create table weekly_settlements (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  week_start    date not null,
  budget_amount integer not null,
  spent_amount  integer not null,
  coins_earned  integer not null default 0,
  xp_gained     integer not null default 0,
  created_at    timestamptz not null default now(),
  unique (user_id, week_start)
);

-- ============================================================
-- 3) RLS 활성화
-- ============================================================
alter table pets enable row level security;
alter table budgets enable row level security;
alter table weekly_settlements enable row level security;

-- ============================================================
-- 4) 정책
-- ============================================================

-- --- pets ---
-- 개인 펫은 본인만, 그룹 펫은 그 그룹 멤버만 볼 수 있다.
create policy pets_select_own_or_group_member on pets for select
  using (
    user_id = auth.uid()
    or (group_id is not null and public.is_group_member(group_id, auth.uid()))
  );

-- 개인 펫은 본인 명의로만 만들 수 있고, 그룹 펫은 그 그룹 멤버라면 누구나 만들 수 있다
-- ([?] "그룹 펫을 누가·언제 만드는지"가 안 정해져 있어, 08-pet-feature-spec.md §1 취지대로
-- "그룹원이 함께 키운다"는 걸 반영해 특정 역할로 제한하지 않았다 — 팀 확인 필요하면 좁힐 것).
create policy pets_insert_own_or_group_member on pets for insert
  with check (
    (user_id = auth.uid() and group_id is null)
    or (user_id is null and group_id is not null and public.is_group_member(group_id, auth.uid()))
  );

-- 먹이주기(XP·단계·last_fed_date 갱신)는 개인 펫은 본인만, 그룹 펫은 그 그룹 멤버 누구나 할 수 있다.
create policy pets_update_own_or_group_member on pets for update
  using (
    user_id = auth.uid()
    or (group_id is not null and public.is_group_member(group_id, auth.uid()))
  )
  with check (
    user_id = auth.uid()
    or (group_id is not null and public.is_group_member(group_id, auth.uid()))
  );

-- --- budgets ---
create policy budgets_select_own on budgets for select
  using (user_id = auth.uid());
create policy budgets_insert_own on budgets for insert
  with check (user_id = auth.uid());
create policy budgets_update_own on budgets for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- --- weekly_settlements ---
create policy weekly_settlements_select_own on weekly_settlements for select
  using (user_id = auth.uid());
create policy weekly_settlements_insert_own on weekly_settlements for insert
  with check (user_id = auth.uid());
create policy weekly_settlements_update_own on weekly_settlements for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
