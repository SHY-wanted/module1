-- supabase/021_server_side_rewards.sql
-- 2026-09-22 — 보안 감사에서 발견한 세 번째 구멍: goal_rewards_insert_own·attendance_checkins_insert_own
-- 정책이 user_id만 확인하고 coins_earned·xp_gained·streak_day·achieved 같은 값은 전혀 검사하지 않는다.
-- 즉 로그인한 클라이언트가 REST로 직접
--   POST /rest/v1/goal_rewards { user_id: 나, category: "식비", month: "2020-01", coins_earned: 999999, ... }
-- 를 호출하면(카테고리·월을 바꿔가며 반복하면 무한정) 그대로 통과했다 — 심지어 이 값은 나중에 새 펫을
-- 만들 때 백필(lib/store.tsx createPet)에서 그대로 더해지므로 pets 테이블 자체를 잠가도(020) 소용없다.
-- 근본 원인은 "보상 계산을 클라이언트가 하고 결과값만 믿고 저장한다"이므로, 계산과 저장을 전부 이
-- SECURITY DEFINER 함수 안으로 옮기고 클라이언트의 직접 INSERT 권한을 없앤다.

create or replace function check_in_today()
returns table(checkin_id uuid, checkin_date date, streak_day int, coins_earned int, total_coins int, xp_progress numeric, stage_index int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := current_date;
  v_prev_streak int;
  v_streak int;
  v_coins int;
  v_id uuid;
  v_pet pets;
  v_growth record;
begin
  if exists (select 1 from attendance_checkins where user_id = auth.uid() and checkin_date = v_today) then
    raise exception 'already_checked_in';
  end if;

  select streak_day into v_prev_streak from attendance_checkins where user_id = auth.uid() and checkin_date = v_today - 1;
  if v_prev_streak is not null and v_prev_streak < 7 then -- lib/pets.ts CHECKIN_STREAK_LENGTH
    v_streak := v_prev_streak + 1;
  else
    v_streak := 1;
  end if;
  v_coins := case when v_streak >= 7 then 5 * 2 else 5 end; -- CHECKIN_REWARD_COINS(5) · CHECKIN_STREAK_BONUS_MULTIPLIER(2)

  insert into attendance_checkins (user_id, checkin_date, streak_day, coins_earned)
    values (auth.uid(), v_today, v_streak, v_coins)
    returning id into v_id;

  select * into v_pet from pets where user_id = auth.uid() and group_id is null for update;
  if v_pet.id is not null then
    select * into v_growth from compute_pet_growth(v_pet.stage_index, v_pet.xp_progress, 0);
    update pets set total_coins = v_pet.total_coins + v_coins
      where id = v_pet.id
      returning pets.total_coins, pets.xp_progress, pets.stage_index into total_coins, xp_progress, stage_index;
  end if;

  checkin_id := v_id;
  checkin_date := v_today;
  streak_day := v_streak;
  coins_earned := v_coins;
  return next;
end;
$$;

-- 지난 달 이전 목표 중 아직 정산 안 된 것만, 실제 지출(expenses, RLS로 본인 것만 조회됨)로 달성 여부와
-- 보상을 서버에서 직접 계산해 넣는다 — 클라이언트는 결과만 받는다(값을 보낼 수 없으니 조작 불가).
create or replace function settle_goal_rewards()
returns table(reward_id uuid, category text, month text, spent_amount int, goal_amount int, achieved boolean, coins_earned int, xp_gained int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_month text := to_char(current_date, 'YYYY-MM');
  v_pet pets;
  v_growth record;
  v_total_coins int := 0;
  v_total_xp int := 0;
  r record;
  v_spent int;
  v_achieved boolean;
  v_coins int;
  v_xp int;
  v_id uuid;
begin
  for r in
    select cg.category as cat, cg.month as mo, cg.goal_amount as amt
    from category_goals cg
    where cg.user_id = auth.uid()
      and cg.month < v_current_month
      and not exists (select 1 from goal_rewards gr where gr.user_id = auth.uid() and gr.category = cg.category and gr.month = cg.month)
  loop
    select coalesce(sum(e.amount), 0) into v_spent
      from expenses e
      where e.user_id = auth.uid() and e.category = r.cat
        and e.date >= (r.mo || '-01')::date and e.date < ((r.mo || '-01')::date + interval '1 month');
    v_achieved := v_spent <= r.amt;
    v_coins := case when v_achieved then 10 else 0 end; -- lib/pets.ts GOAL_ACHIEVED_REWARD_COINS
    v_xp := case when v_achieved then 30 else 0 end; -- lib/pets.ts GOAL_ACHIEVED_REWARD_XP

    insert into goal_rewards (user_id, category, month, spent_amount, goal_amount, achieved, coins_earned, xp_gained)
      values (auth.uid(), r.cat, r.mo, v_spent, r.amt, v_achieved, v_coins, v_xp)
      returning id into v_id;

    reward_id := v_id;
    category := r.cat;
    month := r.mo;
    spent_amount := v_spent;
    goal_amount := r.amt;
    achieved := v_achieved;
    coins_earned := v_coins;
    xp_gained := v_xp;
    return next;

    v_total_coins := v_total_coins + v_coins;
    v_total_xp := v_total_xp + v_xp;
  end loop;

  if v_total_coins > 0 or v_total_xp > 0 then
    select * into v_pet from pets where user_id = auth.uid() and group_id is null for update;
    if v_pet.id is not null then
      select * into v_growth from compute_pet_growth(v_pet.stage_index, v_pet.xp_progress, v_total_xp);
      update pets set total_coins = v_pet.total_coins + v_total_coins, xp_progress = v_growth.new_xp, stage_index = v_growth.new_stage
        where id = v_pet.id;
    end if;
  end if;
  return;
end;
$$;

grant execute on function check_in_today() to authenticated;
grant execute on function settle_goal_rewards() to authenticated;

-- 이제 클라이언트가 직접 이 두 테이블에 값을 써 넣을 길을 없앤다 — 위 두 함수(SECURITY DEFINER)만
-- 이 테이블에 쓸 수 있다.
drop policy if exists attendance_checkins_insert_own on attendance_checkins;
drop policy if exists goal_rewards_insert_own on goal_rewards;
drop policy if exists goal_rewards_update_own on goal_rewards;
