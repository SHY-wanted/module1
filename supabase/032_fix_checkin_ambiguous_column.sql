-- supabase/032_fix_checkin_ambiguous_column.sql
-- 2026-09-22 버그 수정 — 027을 실행한 프로젝트에 이어서 이 파일을 실행할 것.
--
-- 증상: 홈에서 "출석하기"를 누르면 코인이 안 들어오고 실패한다.
--   supabase.rpc('check_in_today') 호출이
--   'column reference "checkin_date" is ambiguous' (42702) 로 떨어진다.
--
-- 원인: 027의 check_in_today()는 returns table(... checkin_date date, streak_day int ...)로
-- 선언돼 있어서, 이 이름들이 함수 안에서 OUT 파라미터(변수)가 된다. 그런데 함수 본문에서
--   ... from attendance_checkins where user_id = auth.uid() and checkin_date = v_today
-- 처럼 테이블 컬럼을 이름만으로 참조하는 바람에, Postgres가 "이 checkin_date가 테이블 컬럼인지
-- 방금 선언한 OUT 파라미터인지" 판단할 수 없어 실행 시점에 에러를 낸다. 컬럼 목록(insert ... (checkin_date, ...))
-- 자리는 모호하지 않아서 통과하고, SELECT/WHERE 자리에서만 터진다 — 그래서 마이그레이션 실행은
-- 성공했는데 호출할 때만 실패했다.
--
-- 해결: 함수 로직은 그대로 두고, 테이블을 참조하는 자리마다 별칭(ac.)을 붙여 모호함을 없앤다.
-- 반환값·보상 계산·연속 일수 규칙은 027과 완전히 동일하다.

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
begin
  -- 별칭 ac를 붙여 OUT 파라미터(checkin_date)와 구분한다.
  if exists (select 1 from attendance_checkins ac where ac.user_id = auth.uid() and ac.checkin_date = v_today) then
    raise exception 'already_checked_in';
  end if;

  -- streak_day도 OUT 파라미터와 이름이 같으므로 여기서도 별칭이 필요하다.
  select ac.streak_day into v_prev_streak
    from attendance_checkins ac
    where ac.user_id = auth.uid() and ac.checkin_date = v_today - 1;

  if v_prev_streak is not null and v_prev_streak < 7 then -- lib/pets.ts CHECKIN_STREAK_LENGTH
    v_streak := v_prev_streak + 1;
  else
    v_streak := 1;
  end if;
  v_coins := case when v_streak >= 7 then 5 * 2 else 5 end; -- CHECKIN_REWARD_COINS(5) · CHECKIN_STREAK_BONUS_MULTIPLIER(2)

  insert into attendance_checkins (user_id, checkin_date, streak_day, coins_earned)
    values (auth.uid(), v_today, v_streak, v_coins)
    returning id into v_id;

  -- 개인 펫이 있으면 코인만 더한다(출석체크는 XP를 주지 않는다 — 027과 동일).
  select * into v_pet from pets where user_id = auth.uid() and group_id is null for update;
  if v_pet.id is not null then
    update pets set total_coins = v_pet.total_coins + v_coins
      where id = v_pet.id
      returning pets.total_coins, pets.xp_progress, pets.stage_index
      into total_coins, xp_progress, stage_index;
  end if;

  checkin_id := v_id;
  checkin_date := v_today;
  streak_day := v_streak;
  coins_earned := v_coins;
  return next;
end;
$$;

grant execute on function check_in_today() to authenticated;
