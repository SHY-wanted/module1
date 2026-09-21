-- supabase/020_realtime_remaining_tables.sql
-- 2026-09-21 팀 요청("다 실시간으로") — 019에 이어, 화면이 읽는 나머지 테이블도 Realtime
-- publication에 넣는다. 019를 먼저 실행한 프로젝트에 이어서 실행하면 된다.
--
-- 이미 들어가 있는 것: expenses(004), group_members·pets(019).
-- 이번에 넣는 것과 그래서 뭐가 달라지는가:
--   savings              그룹 피드의 저금 카드가 바로 뜬다(피드는 지출+저금을 같이 보여준다)
--   expense_reactions    그룹원이 누른 이모지 반응이 바로 보인다
--   group_category_goals 그룹장이 바꾼 그룹 예산이 그룹원 화면에 바로 반영된다
--   groups               그룹 이름 변경·그룹장 위임이 바로 반영된다
--   profiles             그룹원이 닉네임을 바꾸면 피드·멤버 목록의 이름이 바로 바뀐다
--   incomes              내 수입 — 같은 계정을 다른 기기·탭에서 볼 때 서로 따라간다
--   category_goals       내 월별 목표 — 위와 같은 이유
--   goal_rewards         목표 달성 보상 — 위와 같은 이유
--   recurring_expenses   정기 지출 템플릿 — 위와 같은 이유
--   attendance_checkins  출석체크 — 위와 같은 이유
--
-- RLS는 그대로 적용된다 — 내가 select 할 수 있는 행만 이벤트로 온다. 새 정책은 필요 없다.
--
-- 한 가지 알아둘 것: profiles의 select 정책은 "로그인한 사람은 누구나"(profiles_select_any_authenticated)라,
-- 다른 사람의 프로필 변경 이벤트도 내게 전달된다. 클라이언트는 이미 알고 있는 사람의 이름만
-- 갱신하고 모르는 사람은 무시하도록 해 뒀다(lib/store.tsx live-sync 채널 참고).
--
-- 이 파일을 실행하지 않아도 앱은 그대로 동작한다 — 해당 테이블만 예전처럼 로그인 시 한 번 읽는다.

-- 두 번 실행해도 에러가 나지 않도록, 이미 publication에 들어있으면 건너뛴다
-- (alter publication ... add table은 중복이면 42710 에러를 낸다).
do $$
declare
  t text;
begin
  foreach t in array array[
    'savings',
    'expense_reactions',
    'group_category_goals',
    'groups',
    'profiles',
    'incomes',
    'category_goals',
    'goal_rewards',
    'recurring_expenses',
    'attendance_checkins'
  ]
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- 확인용 — 아래를 돌리면 13개 테이블이 나와야 한다
-- (expenses, group_members, pets + 위 10개).
-- select tablename from pg_publication_tables
-- where pubname = 'supabase_realtime' and schemaname = 'public' order by tablename;
