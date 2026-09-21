-- supabase/013_recurring_expenses.sql
-- 2026-09-21 — 신규 기능: 정기 지출(월세·구독료처럼 매달 반복되는 지출). 실제 Expense 행을 매달
-- 자동으로 만드는 "템플릿" 테이블만 여기서 추가한다 — 생성 로직 자체는 배치가 아니라 store.tsx가
-- 로그인 시 한 번 계산하는 방식(category_goals의 goal_rewards와 같은 패턴, supabase/006 참고).
-- 2026-09-22 번호 수정: 원래 012였는데, main에 먼저 병합된 012_onboarding_seen.sql과 번호가
-- 겹쳐서 013으로 밀었다 — 내용은 그대로다.
-- 이미 supabase/012_onboarding_seen.sql까지 실행해 둔 프로젝트의 SQL Editor에 이 파일만 추가로 실행할 것.

create table recurring_expenses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  group_id     uuid references groups(id) on delete set null,
  amount       integer not null check (amount > 0),
  category     text not null,
  memo         text,
  day_of_month integer not null check (day_of_month between 1 and 28), -- 29~31일은 월마다 없을 수 있어 제외
  is_shared    boolean not null default false,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- 이 템플릿에서 자동 생성된 지출인지 추적 — "이번 달에 이미 만들었는지" 판정에 쓴다(앱 쪽에서 확인).
alter table expenses add column recurring_expense_id uuid references recurring_expenses(id) on delete set null;

alter table recurring_expenses enable row level security;

-- category_goals(schema.sql)와 동일 패턴: 본인 것만 조회·수정·삭제.
create policy recurring_expenses_select_own on recurring_expenses for select
  using (user_id = auth.uid());

-- expenses_insert_own_group_member_check(schema.sql)와 동일 패턴: 본인 명의로만, 그룹이면 그 그룹 멤버여야.
create policy recurring_expenses_insert_own_group_member_check on recurring_expenses for insert
  with check (user_id = auth.uid() and (group_id is null or exists (
    select 1 from group_members gm where gm.group_id = recurring_expenses.group_id and gm.user_id = auth.uid()
  )));

create policy recurring_expenses_update_own on recurring_expenses for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy recurring_expenses_delete_own on recurring_expenses for delete
  using (user_id = auth.uid());
