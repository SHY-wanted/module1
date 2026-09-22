-- supabase/031_backfill_and_expense_columns.sql
-- 2026-09-22 — 026~030을 다시 점검하다 그 안에 남아있던 구멍 두 개를 막는다. 둘 다 "앞선 수정이
-- 의도한 잠금을 다른 경로로 그냥 우회할 수 있다"는 종류라, 앞 파일들을 적용했어도 이게 없으면 반쯤
-- 열려 있는 상태다.
--
-- 1) backfill_new_pet(p_pet_id, p_coins, p_xp)이 코인·XP 금액을 호출자가 보내는 그대로 믿었다.
--    028이 pets INSERT를 0/1단계/0xp로 강제해도, 펫을 만든 직후
--      supabase.rpc('backfill_new_pet', {p_pet_id: 내펫, p_coins: 999999999, p_xp: 999999999})
--    를 한 번 호출하면 그대로 들어갔다(펫당 한 번뿐이지만 한 번으로 충분하다). 금액 파라미터를
--    아예 없애고, 과거 이력을 이 함수가 DB에서 직접 집계한다.
--
-- 2) expenses에 INSERT/UPDATE 컬럼 제한이 없어서 created_at·pet_growth_applied를 클라이언트가
--    직접 넣고 고칠 수 있었다. 특히 pet_growth_applied는 030이 "이 지출 한 건당 그룹 펫 성장은
--    딱 한 번"을 보장하는 근거인데, 성장이 적용된 뒤 그 값을 false로 PATCH하고 grow_group_pet을
--    다시 부르면 무한히 반복할 수 있었다 — 030의 잠금이 사실상 무의미했다.

-- --- 2) expenses 컬럼 권한 ---
-- 클라이언트가 실제로 넣고 고치는 컬럼만 남긴다(lib/store.tsx addExpense·updateExpense·정기 지출
-- 생성 기준). created_at은 DB default now()가 채우고, pet_growth_applied는 grow_group_pet()만
-- 건드린다(SECURITY DEFINER라 이 권한 제한을 받지 않는다).
revoke insert, update on expenses from authenticated;
grant insert (id, user_id, group_id, amount, category, memo, date, source_type, image_url, is_shared, recurring_expense_id)
  on expenses to authenticated;
grant update (group_id, amount, category, memo, date, source_type, image_url, is_shared, recurring_expense_id)
  on expenses to authenticated;

-- --- 1) 백필을 서버가 직접 계산 ---
-- create or replace는 인자 타입이 다르면 오버로드로 남으므로(030에서 겪은 것과 같은 함정), 금액을
-- 받던 예전 버전을 명시적으로 지운다 — 안 지우면 028에서 grant한 실행 권한이 그대로 남는다.
drop function if exists backfill_new_pet(uuid, int, numeric);

create or replace function backfill_new_pet(p_pet_id uuid)
returns table(total_coins int, xp_progress numeric, stage_index int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pet pets;
  v_growth record;
  v_coins int := 0;
  v_xp numeric := 0;
  v_days int := 0;
  v_sum_coins int := 0;
  v_sum_xp int := 0;
begin
  select * into v_pet from pets where id = p_pet_id for update;
  if v_pet.id is null then
    raise exception 'pet_not_found';
  end if;

  -- 갓 만든(아직 아무것도 안 쌓인) 펫에만 적용한다 — INSERT가 0/1/0으로 강제돼 있으므로(028)
  -- 이 조건이 "생성 직후"와 정확히 일치하고, 두 번째 호출도 이걸로 막힌다.
  if v_pet.total_coins <> 0 or v_pet.stage_index <> 1 or v_pet.xp_progress <> 0 then
    raise exception 'already_backfilled';
  end if;

  if v_pet.user_id is not null then
    if v_pet.user_id is distinct from auth.uid() then
      raise exception 'not_authorized';
    end if;

    -- 펫을 만들기 전에 이미 받았어야 할 출석체크 코인(check_in_today가 펫이 없으면 코인만 못 주고
    -- attendance_checkins 행은 남겨둔다 — 그 행들을 여기서 합산한다).
    select coalesce(sum(coins_earned), 0) into v_coins from attendance_checkins where user_id = auth.uid();

    -- 지출 기록 코인은 "기록한 날마다 하루 한 번"(award_personal_pet, 029)이므로, 개인 지출을 실제로
    -- 기록한 서로 다른 날 수를 센다. expenses.date(사용자가 고르는 지출 날짜)가 아니라 created_at
    -- (DB가 넣는 기록 시각)을 쓰는 이유: date는 과거로 마음대로 적을 수 있어서, 날짜만 바꿔 넣은
    -- 지출 수백 건으로 시작 코인을 부풀릴 수 있었다. created_at은 위 컬럼 권한으로 클라이언트가
    -- 넣지 못하게 막아뒀고, "며칠에 걸쳐 기록했는지"라는 원래 의미에도 이쪽이 맞다.
    select count(distinct created_at::date) into v_days
      from expenses
      where user_id = auth.uid() and not (is_shared and group_id is not null);
    v_coins := v_coins + v_days * 3; -- lib/pets.ts PERSONAL_EXPENSE_COIN_REWARD

    -- 펫이 없던 동안 정산된 목표 보상(settle_goal_rewards가 펫이 없으면 goal_rewards 행만 남긴다).
    select coalesce(sum(coins_earned), 0), coalesce(sum(xp_gained), 0)
      into v_sum_coins, v_sum_xp
      from goal_rewards where user_id = auth.uid();
    v_coins := v_coins + v_sum_coins;
    v_xp := v_sum_xp;

  elsif v_pet.group_id is not null then
    if not exists (select 1 from group_members where group_id = v_pet.group_id and user_id = auth.uid()) then
      raise exception 'not_authorized';
    end if;
    select count(distinct created_at::date) into v_days
      from expenses
      where group_id = v_pet.group_id and is_shared = true;
    v_coins := v_days * 3; -- lib/pets.ts GROUP_EXPENSE_COIN_REWARD
  else
    raise exception 'pet_not_found';
  end if;

  select * into v_growth from compute_pet_growth(1, 0, v_xp);
  update pets set total_coins = v_coins, xp_progress = v_growth.new_xp, stage_index = v_growth.new_stage
    where id = p_pet_id
    returning pets.total_coins, pets.xp_progress, pets.stage_index into total_coins, xp_progress, stage_index;
end;
$$;

grant execute on function backfill_new_pet(uuid) to authenticated;
