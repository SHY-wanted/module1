-- supabase/003_repair_policies.sql
-- 2026-09-19 — "new row violates row-level security policy for table groups" 같은 오류가 날 때 쓰는
-- 복구용 스크립트. schema.sql을 맨 처음 실행했을 때 중간 어딘가에서 조용히 실패해 일부 정책이 실제로는
-- 안 만들어졌을 가능성이 있다(select는 정책이 없어도 그냥 빈 배열이 와서 지금까지는 못 알아챈 것으로 보임).
--
-- 이 파일은 모든 테이블의 정책을 "지우고 다시 만드는" 방식이라, 지금 상태가 어떻든 몇 번을 다시 실행해도
-- 안전하다(각 정책 앞에 drop policy if exists를 붙여뒀다). SQL Editor에 그대로 붙여넣고 실행할 것.

-- ============================================================
-- 1) security definer 함수 먼저(정책이 이걸 참조하므로) — create or replace라 원래도 안전하다.
-- ============================================================

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

create or replace function public.join_group_by_invite_code(p_invite_code text)
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

-- ============================================================
-- 2) RLS 활성화(이미 켜져 있어도 다시 실행해서 에러 안 남)
-- ============================================================
alter table profiles enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table expenses enable row level security;
alter table expense_ocr_raw enable row level security;
alter table savings enable row level security;

-- ============================================================
-- 3) 정책 전부 drop 후 재생성
-- ============================================================

-- profiles
drop policy if exists profiles_select_any_authenticated on profiles;
create policy profiles_select_any_authenticated on profiles for select
  using (auth.uid() is not null);

drop policy if exists profiles_update_own_only on profiles;
create policy profiles_update_own_only on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- groups
drop policy if exists groups_insert_any_authenticated on groups;
create policy groups_insert_any_authenticated on groups for insert
  with check (auth.uid() is not null and length(trim(name)) > 0);

drop policy if exists groups_select_member_only on groups;
create policy groups_select_member_only on groups for select
  using (exists (select 1 from group_members gm where gm.group_id = groups.id and gm.user_id = auth.uid()));

drop policy if exists groups_update_owner_only on groups;
create policy groups_update_owner_only on groups for update
  using (exists (select 1 from group_members gm where gm.group_id = groups.id and gm.user_id = auth.uid() and gm.role = 'OWNER'))
  with check (exists (select 1 from group_members gm where gm.group_id = groups.id and gm.user_id = auth.uid() and gm.role = 'OWNER'));

drop policy if exists groups_delete_owner_only on groups;
create policy groups_delete_owner_only on groups for delete
  using (exists (select 1 from group_members gm where gm.group_id = groups.id and gm.user_id = auth.uid() and gm.role = 'OWNER'));

-- group_members (select/update는 재귀 방지용 함수 경유)
drop policy if exists members_select_same_group on group_members;
create policy members_select_same_group on group_members for select
  using (public.is_group_member(group_members.group_id, auth.uid()));

drop policy if exists members_insert_self on group_members;
create policy members_insert_self on group_members for insert
  with check (user_id = auth.uid());

drop policy if exists members_update_owner_transfers_role on group_members;
create policy members_update_owner_transfers_role on group_members for update
  using (public.is_group_owner(group_members.group_id, auth.uid()))
  with check (public.is_group_owner(group_members.group_id, auth.uid()));

drop policy if exists members_delete_self on group_members;
create policy members_delete_self on group_members for delete
  using (user_id = auth.uid());

-- expenses
drop policy if exists expenses_select_own on expenses;
create policy expenses_select_own on expenses for select
  using (user_id = auth.uid());

drop policy if exists expenses_select_shared_group_feed on expenses;
create policy expenses_select_shared_group_feed on expenses for select
  using (is_shared = true and group_id is not null and exists (
    select 1 from group_members gm where gm.group_id = expenses.group_id and gm.user_id = auth.uid()
  ));

drop policy if exists expenses_insert_own_group_member_check on expenses;
create policy expenses_insert_own_group_member_check on expenses for insert
  with check (user_id = auth.uid() and (group_id is null or exists (
    select 1 from group_members gm where gm.group_id = expenses.group_id and gm.user_id = auth.uid()
  )));

drop policy if exists expenses_update_own_only on expenses;
create policy expenses_update_own_only on expenses for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists expenses_delete_own_only on expenses;
create policy expenses_delete_own_only on expenses for delete
  using (user_id = auth.uid());

-- expense_ocr_raw
drop policy if exists ocr_raw_select_own on expense_ocr_raw;
create policy ocr_raw_select_own on expense_ocr_raw for select
  using (exists (select 1 from expenses e where e.id = expense_ocr_raw.expense_id and e.user_id = auth.uid()));

-- savings
drop policy if exists savings_select_own on savings;
create policy savings_select_own on savings for select
  using (user_id = auth.uid());

drop policy if exists savings_select_group_members on savings;
create policy savings_select_group_members on savings for select
  using (type = 'GROUP' and group_id is not null and exists (
    select 1 from group_members gm where gm.group_id = savings.group_id and gm.user_id = auth.uid()
  ));

drop policy if exists savings_insert_own_group_member_check on savings;
create policy savings_insert_own_group_member_check on savings for insert
  with check (user_id = auth.uid() and (group_id is null or exists (
    select 1 from group_members gm where gm.group_id = savings.group_id and gm.user_id = auth.uid()
  )));

drop policy if exists savings_update_own_only on savings;
create policy savings_update_own_only on savings for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists savings_delete_own_only on savings;
create policy savings_delete_own_only on savings for delete
  using (user_id = auth.uid());

-- ============================================================
-- 4) auth.users → profiles 자동 생성 트리거 (함수는 create or replace로 안전, 트리거는 drop 후 재생성)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
