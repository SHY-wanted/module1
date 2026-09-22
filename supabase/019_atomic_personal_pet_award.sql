-- supabase/019_atomic_personal_pet_award.sql
-- 2026-09-22 — 버그 수정(최종 점검 감사에서 발견): 018에서 그룹 펫만 원자적으로 고쳤고, 개인 펫은
-- "혼자만 건드리는 펫이라 레이스가 안 난다"고 판단해 그대로 뒀다. 하지만 같은 사람이 지출 기록
-- (awardPetCoins), 출석체크(checkInToday), 목표 정산(getOrCreateGoalRewardsForMonth)을 거의 동시에
-- 트리거할 수 있어(예: 지출 기록 직후 바로 출석체크) 세 경로가 서로 다른 시점에 읽은 total_coins로
-- 덮어쓰면서 한쪽 지급이 사라질 수 있었다(잃어버린 갱신). 018과 같은 패턴으로 행을 잠그고 그 안에서
-- 최신값에 더하는 방식으로 통일한다.
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
  v_growth record;
begin
  select * into v_pet from pets where id = p_pet_id for update;
  if v_pet.id is null then
    raise exception 'pet_not_found';
  end if;
  if v_pet.user_id is distinct from auth.uid() then
    raise exception 'not_authorized';
  end if;

  if p_check_expense_date and v_pet.last_expense_coin_date is not distinct from current_date then
    v_coins_awarded := 0;
  else
    v_coins_awarded := p_coins;
  end if;

  select * into v_growth from compute_pet_growth(v_pet.stage_index, v_pet.xp_progress, p_xp);

  update pets set
    total_coins = v_pet.total_coins + v_coins_awarded,
    xp_progress = v_growth.new_xp,
    stage_index = v_growth.new_stage,
    last_expense_coin_date = case when p_check_expense_date and v_coins_awarded > 0 then current_date else v_pet.last_expense_coin_date end
  where id = v_pet.id
  returning pets.total_coins, pets.xp_progress, pets.stage_index into total_coins, xp_progress, stage_index;

  coins_awarded := v_coins_awarded;
  return next;
end;
$$;

grant execute on function award_personal_pet(uuid, int, numeric, boolean) to authenticated;
