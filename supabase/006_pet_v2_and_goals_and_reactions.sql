-- supabase/006_pet_v2_and_goals_and_reactions.sql
-- 2026-09-15 — mg·hybranch·shooTbranch 3개 브랜치를 사용자 확인 하에 통합. 이미 supabase/005_pet_feature.sql
-- 을 실행해 둔 프로젝트의 SQL Editor에 이 파일만 추가로 실행할 것.
--
-- 변경 요약(사용자 확인 4가지):
-- 1) 그룹 펫 = hybranch F22(반려 캐릭터)와 통합 — 그룹 펫의 자동 성장은 코드(store.tsx)에서 처리하고
--    여기서는 스키마만 손대지 않는다(기존 pets_update_own_or_group_member 정책 그대로 재사용).
-- 2) 성장 단계 4단계로 통일 — DB엔 stage_index(int) 그대로라 스키마 변경 없음(애플리케이션 상수만 변경).
-- 3) 펫 외형 = species 선택 대신 마스코트+색상 커스텀 — pets.species 컬럼 제거, 색상 컬럼 5개 추가.
-- 4) 예산 = shooTbranch식 월별·카테고리별 목표로 교체 — budgets·weekly_settlements 삭제,
--    category_goals·goal_rewards 신설.
-- + F23(그룹 피드 이모지 반응, hybranch) — expense_reactions 신설.

-- ============================================================
-- 1) pets: species 제거, 색상 5종 추가
-- ============================================================
alter table pets drop column species;
drop type if exists pet_species;

alter table pets
  add column body_color   text not null default '#8C81E0',
  add column ledger_color text not null default '#6A5ECF',
  add column bag_color    text not null default '#BDB2F2',
  add column eye_color    text not null default '#2D2A3E',
  add column leaf_color   text not null default '#6FC5BA';

-- ============================================================
-- 2) 주간 예산 → 월별·카테고리별 목표로 교체
-- ============================================================
drop table if exists weekly_settlements;
drop table if exists budgets;

-- E12. CategoryGoal — 사용자가 카테고리별로 정하는 월간 목표 금액.
create table category_goals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  category     text not null,
  month        text not null, -- "YYYY-MM"
  goal_amount  integer not null check (goal_amount >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, category, month)
);

-- E13. GoalReward — 그 달 목표 달성 여부에 따른 "퀘스트 보상"(고정 코인·XP, 절약 비율 아님).
create table goal_rewards (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  category      text not null,
  month         text not null,
  spent_amount  integer not null,
  goal_amount   integer not null,
  achieved      boolean not null,
  coins_earned  integer not null default 0,
  xp_gained     integer not null default 0,
  created_at    timestamptz not null default now(),
  unique (user_id, category, month)
);

alter table category_goals enable row level security;
alter table goal_rewards enable row level security;

create policy category_goals_select_own on category_goals for select using (user_id = auth.uid());
create policy category_goals_insert_own on category_goals for insert with check (user_id = auth.uid());
create policy category_goals_update_own on category_goals for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy goal_rewards_select_own on goal_rewards for select using (user_id = auth.uid());
create policy goal_rewards_insert_own on goal_rewards for insert with check (user_id = auth.uid());
create policy goal_rewards_update_own on goal_rewards for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================
-- 3) F23 그룹 피드 이모지 반응(hybranch) — 지출 카드에만 남길 수 있고, 그 지출을 볼 수 있는
--    사람(본인 또는 같은 그룹 멤버 — expenses의 select 정책과 동일 원칙)만 반응도 볼 수 있다.
--    "그룹 멤버가 아니면 반응을 남길 수 없다"(04-features.md F23 예외)는 insert에서 강제한다.
-- ============================================================
create table expense_reactions (
  id          uuid primary key default gen_random_uuid(),
  expense_id  uuid not null references expenses(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  emoji       text not null,
  created_at  timestamptz not null default now(),
  unique (expense_id, user_id, emoji)
);

alter table expense_reactions enable row level security;

create policy expense_reactions_select_visible on expense_reactions for select
  using (
    exists (
      select 1 from expenses e
      where e.id = expense_reactions.expense_id
        and (
          e.user_id = auth.uid()
          or (e.is_shared and e.group_id is not null and public.is_group_member(e.group_id, auth.uid()))
        )
    )
  );

create policy expense_reactions_insert_group_member on expense_reactions for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from expenses e
      where e.id = expense_reactions.expense_id
        and e.is_shared and e.group_id is not null
        and public.is_group_member(e.group_id, auth.uid())
    )
  );

create policy expense_reactions_delete_own on expense_reactions for delete
  using (user_id = auth.uid());
