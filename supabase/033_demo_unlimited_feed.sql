-- supabase/033_demo_unlimited_feed.sql
-- 2026-09-22 — **시연 전용 예외**. 평가가 끝나면 033_revert_demo_unlimited_feed.sql로 반드시 되돌릴 것.
--
-- 목적: 강사 평가용 팀장 계정(test123@test.com)만 밥주기 "하루 1회" 제한 없이 계속 먹일 수 있게 한다.
-- 발표에서 성장 4단계(알 → 유년기 → 청소년기 → 성체)를 그 자리에서 보여주려면 연속으로 먹여야 하는데,
-- 정상 규칙으로는 하루에 한 번뿐이라 며칠을 기다려야 한다.
--
-- 방식: 유니크 제약(pet_feedings_pet_id_user_id_fed_date_key)은 그대로 둔다. 제약을 없애면 모든
-- 사용자에게 구멍이 생기기 때문이다. 대신 이 한 계정에 한해 "오늘 먹인 기록"을 지우고 다시 넣는다
-- — 코인 차감(5코인)·XP 획득·단계 승급은 정상 경로와 100% 동일하게 동작한다. 즉 시연에서 보이는
-- 성장은 가짜가 아니라 실제 로직을 그대로 탄 결과다.
--
-- 범위: 아래 uuid 하나에만 적용된다. 다른 어떤 계정도 영향을 받지 않는다.
--   test123@test.com = e310f320-3dd0-42d8-b3ea-193ede1db361
--
-- 주의: 이 파일은 2026-09-22 보안 강화(026~031)가 막아둔 "경제 조작"의 예외를 일부러 하나 여는 것이다.
-- 평가가 끝나면 되돌려서 저장소에 예외가 남지 않게 하는 것을 권한다.

create or replace function feed_pet(p_pet_id uuid)
returns table(total_coins int, xp_progress numeric, stage_index int, xp_gained numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pet pets;
  v_member_count int;
  v_xp_gained numeric;
  v_growth record;
  -- 시연 전용 예외 대상(강사 평가용 팀장 계정). 되돌릴 때 이 줄과 아래 if 블록만 빠진다.
  c_demo_user constant uuid := 'e310f320-3dd0-42d8-b3ea-193ede1db361';
begin
  select * into v_pet from pets where id = p_pet_id for update;
  if v_pet.id is null then
    raise exception 'pet_not_found';
  end if;

  if v_pet.group_id is null then
    if v_pet.user_id is distinct from auth.uid() then
      raise exception 'not_authorized';
    end if;
    v_xp_gained := 15; -- lib/pets.ts FEED_XP_DEFAULT
  else
    if not exists (select 1 from group_members where group_id = v_pet.group_id and user_id = auth.uid()) then
      raise exception 'not_authorized';
    end if;
    select count(*) into v_member_count from group_members where group_id = v_pet.group_id;
    v_xp_gained := greatest(1, round(15.0 / greatest(v_member_count, 1))); -- lib/pets.ts groupFeedXp
  end if;

  if v_pet.total_coins < 5 then -- lib/pets.ts FEED_COIN_COST
    raise exception 'insufficient_coins';
  end if;

  -- ===== 시연 전용 예외 시작 =====
  -- 이 계정만 오늘 기록을 지우고 다시 넣어 "하루 1회" 제한을 통과한다. 코인·XP·단계는 그대로 계산된다.
  if auth.uid() = c_demo_user then
    delete from pet_feedings where pet_id = p_pet_id and user_id = auth.uid() and fed_date = current_date;
  end if;
  -- ===== 시연 전용 예외 끝 =====

  -- 유니크 제약(pet_id, user_id, fed_date)이 "이 사람이 이 펫에 오늘 벌써 먹였는지"를 그대로 막아준다
  -- — 개인 펫은 사람이 하나뿐이라 자동으로 하루 1회, 그룹 펫은 사람마다 하루 1회.
  insert into pet_feedings (pet_id, user_id, fed_date) values (p_pet_id, auth.uid(), current_date);

  select * into v_growth from compute_pet_growth(v_pet.stage_index, v_pet.xp_progress, v_xp_gained);

  update pets set
    total_coins = v_pet.total_coins - 5,
    xp_progress = v_growth.new_xp,
    stage_index = v_growth.new_stage,
    last_fed_date = current_date
  where id = p_pet_id
  returning pets.total_coins, pets.xp_progress, pets.stage_index into total_coins, xp_progress, stage_index;

  xp_gained := v_xp_gained;
  return next;
end;
$$;
