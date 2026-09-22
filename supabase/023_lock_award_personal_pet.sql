-- supabase/023_lock_award_personal_pet.sql
-- 2026-09-22 — 021에서 출석체크·목표 정산을 각자 전용 RPC(check_in_today·settle_goal_rewards)로
-- 옮기면서, award_personal_pet()의 남은 합법적인 용도는 "지출 기록 시 하루 한 번 코인"(lib/store.tsx
-- awardPetCoins) 하나뿐이다. 그런데 이 함수는 p_coins·p_xp를 호출자가 보내는 그대로 믿고, p_check_
-- expense_date=false를 보내면 하루 제한도 우회할 수 있었다 — 로그인한 클라이언트가
--   supabase.rpc('award_personal_pet', {p_pet_id, p_coins: 999999999, p_xp: 999999999, p_check_expense_date: false})
-- 를 직접(앱 UI를 거치지 않고) 반복 호출하면 무제한으로 코인·XP를 채울 수 있었다. 남은 용도가 고정
-- 상수 하나뿐이므로, 파라미터는 함수 시그니처 호환을 위해 남겨두되(store.tsx 변경 불필요) 값 자체는
-- 서버에서 무시하고 상수·하루 제한을 항상 강제한다.
create or replace function award_personal_pet(
  p_pet_id uuid,
  p_coins int,
  p_xp numeric,
  p_check_expense_date boolean
)
returns table(total_coins int, xp_progress numeric, stage_index int, coins_awarded int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pet pets;
  v_coins_awarded int;
  v_amount constant int := 3; -- lib/pets.ts PERSONAL_EXPENSE_COIN_REWARD
begin
  select * into v_pet from pets where id = p_pet_id for update;
  if v_pet.id is null then
    raise exception 'pet_not_found';
  end if;
  if v_pet.user_id is distinct from auth.uid() then
    raise exception 'not_authorized';
  end if;

  if v_pet.last_expense_coin_date is not distinct from current_date then
    v_coins_awarded := 0;
  else
    v_coins_awarded := v_amount;
  end if;

  update pets set
    total_coins = v_pet.total_coins + v_coins_awarded,
    last_expense_coin_date = case when v_coins_awarded > 0 then current_date else v_pet.last_expense_coin_date end
  where id = v_pet.id
  returning pets.total_coins, pets.xp_progress, pets.stage_index into total_coins, xp_progress, stage_index;

  coins_awarded := v_coins_awarded;
  return next;
end;
$$;
