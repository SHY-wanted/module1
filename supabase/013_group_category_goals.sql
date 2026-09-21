-- supabase/013_group_category_goals.sql
-- 2026-09-21 — 신규 기능: 그룹 단위 예산(월별·카테고리별). 기존 category_goals는 개인 전용이라
-- (lib/store.tsx "예산 자체가 없는 기능" 주석 참고) 그룹 전체 지출 한도를 정할 방법이 없었다.
-- 사용자 확인: 그룹 예산은 그룹장(OWNER)만 정하고 수정할 수 있다 — is_group_owner(schema.sql,
-- members_update_owner_transfers_role과 같은 함수)를 그대로 재사용해 RLS로 강제한다.
-- 이미 supabase/012_recurring_expenses.sql을 실행해 둔 프로젝트의 SQL Editor에 이 파일만 추가로 실행할 것.

create table group_category_goals (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references groups(id) on delete cascade,
  category     text not null,
  month        text not null, -- "YYYY-MM"
  goal_amount  integer not null check (goal_amount >= 0),
  created_by   uuid not null references profiles(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (group_id, category, month)
);

alter table group_category_goals enable row level security;

-- 그룹 멤버는 누구나 예산을 볼 수 있다(진행률 카드는 멤버 전원에게 보여야 함).
create policy group_category_goals_select_member on group_category_goals for select
  using (public.is_group_member(group_id, auth.uid()));

-- 정하고 고치고 지우는 것은 그룹장만 — 04-features.md 원안엔 없던 신규 정책이라 팀 확인 필요하면 되돌릴 것.
create policy group_category_goals_insert_owner on group_category_goals for insert
  with check (public.is_group_owner(group_id, auth.uid()) and created_by = auth.uid());

create policy group_category_goals_update_owner on group_category_goals for update
  using (public.is_group_owner(group_id, auth.uid()))
  with check (public.is_group_owner(group_id, auth.uid()));

create policy group_category_goals_delete_owner on group_category_goals for delete
  using (public.is_group_owner(group_id, auth.uid()));
