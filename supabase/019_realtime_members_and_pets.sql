-- supabase/019_realtime_members_and_pets.sql
-- 2026-09-21 — 이미 schema.sql을 실행해 둔 프로젝트의 SQL Editor에 이 파일을 붙여넣어 실행할 것.
--
-- 왜 필요한가: group_members·pets는 로그인 직후 한 번만 읽어왔다. 그래서
--   - 그룹 상세를 "보고 있는 중"에 누가 새로 들어오면 나갔다 들어와야 보였고,
--   - 다른 그룹원이 그룹 펫 색을 바꾸면 내 화면은 새로고침해야 바뀌었다.
-- 두 테이블을 Realtime(Postgres Changes)이 감시하는 publication에 넣으면, 004에서 expenses에
-- 해준 것과 똑같이 INSERT/UPDATE/DELETE가 실시간으로 클라이언트에 온다.
--
-- RLS는 그대로 적용된다 — 내가 select 할 수 있는 행(내가 속한 그룹의 멤버, 내 펫과 내 그룹 펫)만
-- 이벤트로 오므로 새 정책은 필요 없다.
--
-- 이 파일을 실행하지 않아도 앱은 그대로 동작한다(화면에 들어갈 때 다시 읽는 방식이 남아 있다).
-- 다만 "보고 있는 중 실시간 반영"은 이 SQL을 실행해야 켜진다.

-- 두 번 실행해도 에러가 나지 않도록, 이미 publication에 들어있으면 건너뛴다
-- (alter publication ... add table은 중복이면 42710 에러를 낸다).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'group_members'
  ) then
    alter publication supabase_realtime add table public.group_members;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pets'
  ) then
    alter publication supabase_realtime add table public.pets;
  end if;
end $$;

-- 확인용 — 아래 select 결과에 expenses·group_members·pets 세 줄이 나오면 제대로 들어간 것이다.
-- select tablename from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public';
