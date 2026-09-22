-- supabase/022_pets_insert_lockdown.sql
-- 2026-09-22 — 020에서 pets UPDATE는 컬럼 권한으로 막았지만, INSERT는 새 행을 한 번에 통째로 넣어야
-- 해서 그때는 손대지 않았다. 하지만 pets_insert_own_or_group_member도 소유권만 확인하고 값은 안 보므로
--   POST /rest/v1/pets { user_id: 나, group_id: null, total_coins: 999999999, stage_index: 4, xp_progress: 0 }
-- 를 직접 호출하면(아직 펫을 안 만든 사용자 기준) 그대로 통과했다 — UPDATE 구멍(020)과 같은 종류다.
-- INSERT는 항상 0/1단계/0xp로만 들어가게 강제하고, lib/store.tsx createPet이 실제로 계산한 과거 이력
-- 백필(출석·지출·목표 보상)은 별도 RPC로 그 직후에 한 번만 적용한다(total_coins=0인 동안만 호출
-- 가능하게 해서 두 번 부르는 것도 막는다).
drop policy if exists pets_insert_own_or_group_member on pets;
create policy pets_insert_own_or_group_member on pets for insert
  with check (
    (
      (user_id = auth.uid() and group_id is null)
      or (user_id is null and group_id is not null and public.is_group_member(group_id, auth.uid()))
    )
    and total_coins = 0
    and stage_index = 1
    and xp_progress = 0
    and last_fed_date is null
    and last_expense_coin_date is null
  );

create or replace function backfill_new_pet(p_pet_id uuid, p_coins int, p_xp numeric)
returns table(total_coins int, xp_progress numeric, stage_index int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pet pets;
  v_growth record;
begin
  if p_coins < 0 or p_xp < 0 then
    raise exception 'invalid_amount';
  end if;

  select * into v_pet from pets where id = p_pet_id for update;
  if v_pet.id is null then
    raise exception 'pet_not_found';
  end if;
  if v_pet.user_id is not null then
    if v_pet.user_id is distinct from auth.uid() then
      raise exception 'not_authorized';
    end if;
  elsif v_pet.group_id is not null then
    if not exists (select 1 from group_members where group_id = v_pet.group_id and user_id = auth.uid()) then
      raise exception 'not_authorized';
    end if;
  else
    raise exception 'pet_not_found';
  end if;

  -- total_coins가 이미 0이 아니면(생성 직후 이 함수를 이미 한 번 불렀거나 그 사이 밥을 줬거나 등)
  -- 두 번째 백필을 막는다 — INSERT가 항상 0으로 시작하도록 강제돼 있어(이 파일 위쪽 정책) 이 조건이
  -- "아직 한 번도 안 건드린 갓 생성된 펫"과 정확히 일치한다.
  if v_pet.total_coins <> 0 or v_pet.stage_index <> 1 or v_pet.xp_progress <> 0 then
    raise exception 'already_backfilled';
  end if;

  select * into v_growth from compute_pet_growth(1, 0, p_xp);
  update pets set total_coins = p_coins, xp_progress = v_growth.new_xp, stage_index = v_growth.new_stage
    where id = p_pet_id
    returning pets.total_coins, pets.xp_progress, pets.stage_index into total_coins, xp_progress, stage_index;
end;
$$;

grant execute on function backfill_new_pet(uuid, int, numeric) to authenticated;
