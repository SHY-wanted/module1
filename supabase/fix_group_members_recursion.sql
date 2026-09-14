-- supabase/fix_group_members_recursion.sql
-- 2026-09-18 버그 수정 — 이미 schema.sql을 한 번 실행해 둔 프로젝트의 SQL Editor에 이 파일만 붙여넣어 실행할 것.
-- (schema.sql 전체를 다시 실행하면 "already exists" 에러가 난다 — 이 파일은 바뀐 부분만 담았다.)
--
-- 증상: groups/group_members/expenses/expense_ocr_raw/savings 중 아무 테이블이나 select 하면
-- "infinite recursion detected in policy for relation \"group_members\"" (42P17) 에러가 난다.
-- 원인: group_members의 select/update 정책이 "내가 이 그룹 멤버인지"를 확인하려고 group_members
-- 자기 자신을 서브쿼리했는데, 그 서브쿼리에도 RLS가 다시 적용되면서 정책이 스스로를 무한 호출한다.
-- 해결: security definer 함수(테이블 소유자 권한으로 실행 — RLS를 다시 안 탄다)로 바꿔치기한다.

create or replace function public.is_group_member(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from group_members where group_id = p_group_id and user_id = p_user_id
  );
$$;

create or replace function public.is_group_owner(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from group_members where group_id = p_group_id and user_id = p_user_id and role = 'OWNER'
  );
$$;

drop policy if exists members_select_same_group on group_members;
create policy members_select_same_group on group_members for select
  using (public.is_group_member(group_members.group_id, auth.uid()));

drop policy if exists members_update_owner_transfers_role on group_members;
create policy members_update_owner_transfers_role on group_members for update
  using (public.is_group_owner(group_members.group_id, auth.uid()))
  with check (public.is_group_owner(group_members.group_id, auth.uid()));

-- 2026-09-18 추가: 10b "내 정보 변경" 닉네임 수정이 동작하려면 본인 profiles 행을 스스로 수정할 수 있어야 한다.
-- (schema.sql을 처음 실행했을 때는 없던 정책 — 이미 실행한 프로젝트라면 이것도 같이 붙여넣을 것.)
drop policy if exists profiles_update_own_only on profiles;
create policy profiles_update_own_only on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());
