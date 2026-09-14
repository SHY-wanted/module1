-- supabase/migrations/002_group_data_wiring.sql
-- 2026-09-18 — 이미 schema.sql(+fix_group_members_recursion.sql)을 실행해 둔 프로젝트의 SQL Editor에
-- 이 파일만 붙여넣어 실행할 것. 그룹/그룹원/지출/저금을 실제 Supabase 쿼리로 옮기면서 필요해진
-- 두 가지 변경 — supabase/schema.sql 원본에는 이미 반영해 뒀다.

-- 1) savings DELETE 정책 — 10a "그룹 나가기"(혼자뿐이면 그룹·지출 함께 삭제)에서 그룹의 저금 행도
--    같이 지워야 savings.group_id → groups(id) FK(기본 RESTRICT)에 안 걸린다.
create policy savings_delete_own_only on savings for delete
  using (user_id = auth.uid());

-- 2) 초대 코드로 그룹 참여(4번 화면) 전용 RPC — groups_select_member_only가 "이미 멤버인 사람만"
--    그룹을 보게 막아뒀어서, 아직 멤버가 아닌 사람이 초대 코드로 그룹을 찾을 방법이 없었다.
create function public.join_group_by_invite_code(p_invite_code text)
returns groups
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group groups;
begin
  select * into v_group from groups where invite_code = p_invite_code;
  if not found then
    raise exception 'NOT_FOUND';
  end if;
  if exists (select 1 from group_members where group_id = v_group.id and user_id = auth.uid()) then
    raise exception 'ALREADY_MEMBER';
  end if;
  insert into group_members (user_id, group_id, role) values (auth.uid(), v_group.id, 'MEMBER');
  return v_group;
end;
$$;

grant execute on function public.join_group_by_invite_code(text) to authenticated;
