-- supabase/024_grow_group_pet_from_expense.sql
-- 2026-09-22 — grow_group_pet(group_id, xp_delta, award_coins)도 award_personal_pet과 같은 구멍이
-- 있었다: xp_delta·award_coins를 호출자가 보내는 그대로 믿어서,
--   supabase.rpc('grow_group_pet', {p_group_id: 내그룹, p_xp_delta: 999999, p_award_coins: true})
-- 를 반복 호출하면(그룹 멤버이기만 하면 됨) 그룹 펫을 무제한으로 키울 수 있었다. 참여도(최근 7일 몇
-- 명이 공유 지출을 기록했는지)도 클라이언트가 계산해서 보냈으므로 그 값도 조작 가능했다.
--
-- p_group_id·p_xp_delta·p_award_coins를 직접 받는 대신, 이미 저장된 공유 지출 한 건의 id만 받아서
-- 그 지출의 그룹·날짜·작성자를 서버가 직접 조회해 참여도를 계산하고, expenses.pet_growth_applied로
-- "이 지출 한 건당 성장은 딱 한 번만" 적용되게 막는다 — 클라이언트가 값을 보낼 자리 자체를 없앴다.
alter table expenses add column if not exists pet_growth_applied boolean not null default false;

-- create or replace는 인자 타입이 같은 함수만 바꿔치기한다 — grow_group_pet(uuid, numeric, boolean)과
-- grow_group_pet(uuid)는 오버로드로 취급돼 둘 다 남아있게 되므로, 예전(취약한) 3-인자 버전을 명시적으로
-- 지워야 한다(안 지우면 018에서 이미 grant해둔 실행 권한이 그대로 남아 봇이 여전히 호출할 수 있다).
drop function if exists grow_group_pet(uuid, numeric, boolean);

create or replace function grow_group_pet(p_expense_id uuid)
returns table(total_coins int, xp_progress numeric, stage_index int, coins_awarded int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expense expenses;
  v_pet pets;
  v_growth record;
  v_contributor_count int;
  v_xp_gained numeric;
  v_coins_awarded int := 0;
begin
  select * into v_expense from expenses where id = p_expense_id for update;
  if v_expense.id is null then
    raise exception 'expense_not_found';
  end if;
  if not v_expense.is_shared or v_expense.group_id is null then
    raise exception 'not_a_shared_expense';
  end if;
  if v_expense.pet_growth_applied then
    raise exception 'already_applied';
  end if;
  if not exists (select 1 from group_members where group_id = v_expense.group_id and user_id = auth.uid()) then
    raise exception 'not_a_group_member';
  end if;

  select * into v_pet from pets where group_id = v_expense.group_id for update;
  if v_pet.id is null then
    raise exception 'pet_not_found';
  end if;

  -- lib/pets.ts GROUP_PARTICIPATION_WINDOW_DAYS(7) — 그 지출 날짜를 포함해 최근 7일.
  select count(distinct user_id) into v_contributor_count
  from expenses
  where group_id = v_expense.group_id and is_shared = true
    and date >= v_expense.date - 6 and date <= v_expense.date;

  -- lib/pets.ts GROUP_XP_PER_SHARED_EXPENSE(15) · GROUP_XP_HALF_RATE_DIVISOR(2)
  v_xp_gained := case when v_contributor_count >= 2 then 15 else round(15.0 / 2) end;

  if v_pet.last_expense_coin_date is distinct from current_date then
    v_coins_awarded := 3; -- lib/pets.ts GROUP_EXPENSE_COIN_REWARD
  end if;

  select * into v_growth from compute_pet_growth(v_pet.stage_index, v_pet.xp_progress, v_xp_gained);

  update pets set
    total_coins = v_pet.total_coins + v_coins_awarded,
    xp_progress = v_growth.new_xp,
    stage_index = v_growth.new_stage,
    last_expense_coin_date = case when v_coins_awarded > 0 then current_date else v_pet.last_expense_coin_date end
  where id = v_pet.id
  returning pets.total_coins, pets.xp_progress, pets.stage_index into total_coins, xp_progress, stage_index;

  update expenses set pet_growth_applied = true where id = p_expense_id;

  coins_awarded := v_coins_awarded;
  return next;
end;
$$;

grant execute on function grow_group_pet(uuid) to authenticated;
