-- supabase/004_enable_realtime_expenses.sql
-- 2026-09-19 — 이미 schema.sql을 실행해 둔 프로젝트(지금 쓰고 있는 새 프로젝트 포함)의 SQL Editor에
-- 이 한 줄만 추가로 실행할 것. 2c "그룹원 기록 확인 알림"이 실시간으로 동작하려면 필요하다.
--
-- expenses 테이블을 Realtime(Postgres Changes)이 감시하는 publication에 추가한다. RLS는 그대로
-- 적용되니(내가 select 할 수 있는 행만 이벤트로 옴) 새 정책은 필요 없다.

alter publication supabase_realtime add table public.expenses;
