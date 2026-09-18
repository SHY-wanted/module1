-- supabase/007_category_goals_delete_policy.sql
-- 2026-09-23 — 006에서 category_goals에 select·insert·update 정책만 만들고 delete 정책을 빠뜨렸다.
-- RLS가 켜진 테이블은 정책이 없으면 기본적으로 막히므로, 지금까지는 목표를 지울 수 없었다
-- (월별 목표 설정 화면에 삭제 버튼을 추가하면서 발견 — store.deleteCategoryGoal이 항상 count 0으로 실패했을 것).
-- 이미 005·006을 실행해 둔 프로젝트의 SQL Editor에 이 파일만 추가로 실행할 것.

create policy category_goals_delete_own on category_goals for delete
  using (user_id = auth.uid());
