-- supabase/018_atomic_group_pet_growth.sql
-- 2026-09-21 — 버그 수정(감사에서 발견, 그룹 펫 관련 3건을 한 함수로 같이 고친다):
--
-- 1) 코인/XP를 "현재값 - 클라이언트가 계산한 최종값"으로 덮어써서, 그룹원 두 명이 거의 동시에
--    지출을 기록하거나 밥을 주면 한쪽 갱신이 사라졌다(잃어버린 갱신, lost update).
-- 2) pet_feedings의 INSERT 정책이 "로그인한 사람인지"만 확인하고 "그 그룹 멤버인지"는 확인하지
--    않아서, 그룹을 나간 사람이 밥주기를 시도하면 "먹였다는 기록"만 남고(오늘 다시 못 먹임) 실제
--    코인·XP 반영은 pets_update_own_or_group_member RLS에 조용히 막혀서 사라질 수 있었다.
-- 3) 그룹원 수로 XP를 나누는 형평성 계산이 클라이언트가 들고 있는(로그인 시점에 캐시된) 인원수를
--    써서, 그 사이 누가 들어오거나 나가면 틀린 값으로 나뉘었다.
--
-- 전부 "그룹 펫을 여러 사람이 동시에 건드릴 수 있다"는 같은 근본 원인이라, DB 함수 안에서 행을
-- 잠그고(FOR UPDATE) 그 트랜잭션 안에서 인원수를 다시 세고 권한도 다시 확인하는 걸로 한 번에
-- 해결한다. 개인 펫은 원래부터 그 사람 한 명만 건드리니 이 문제가 없어서(레이스가 안 난다)
-- 그대로 클라이언트에서 처리한다 — 여기 대상은 그룹 펫뿐이다.

-- lib/pets.ts의 STAGE_XP_REQUIREMENTS·MAX_STAGE_INDEX·FEED_XP_DEFAULT·FEED_COIN_COST와 반드시
-- 같은 값으로 맞춘다(한쪽만 바꾸면 클라이언트가 보여주는 예상치와 실제 서버 결과가 어긋난다).
create or replace function compute_pet_growth(p_stage_index int, p_xp_progress numeric, p_xp_delta numeric)
returns table(new_stage int, new_xp numeric)
language plpgsql
as $$
declare
  requirements int[] := array[100, 150, 200];
  max_stage int := 4;
  stage int := p_stage_index;
  xp numeric := p_xp_progress + p_xp_delta;
begin
  if stage >= max_stage then
    return query select stage, xp;
    return;
  end if;
  while stage < max_stage and xp >= requirements[stage] loop
    xp := xp - requirements[stage];
    stage := stage + 1;
  end loop;
  return query select stage, xp;
end;
$$;

-- 그룹 펫 전용 — 밥주기(feed_pet)와 지출 기록 성장(공유 지출 참여도 + 코인)을 한 트랜잭션 안에서
-- 처리한다. group_id로 행을 잠그고, 호출한 사람이 실제로 그 그룹 멤버인지 매번 다시 확인하며,
-- p_award_coins가 true일 때만 "오늘 이미 지출 코인을 받았는지"(last_expense_coin_date)를 그 자리에서
-- 재확인한다 — 전부 클라이언트가 아니라 이 함수 안에서 최신값으로 판단하므로 동시 호출에도 안전하다.
create or replace function grow_group_pet(p_group_id uuid, p_xp_delta numeric, p_award_coins boolean)
returns table(total_coins int, xp_progress numeric, stage_index int, coins_awarded int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pet pets;
  v_growth record;
  v_coins_awarded int := 0;
begin
  select * into v_pet from pets where group_id = p_group_id for update;
  if v_pet.id is null then
    raise exception 'pet_not_found';
  end if;
  if not exists (select 1 from group_members where group_id = p_group_id and user_id = auth.uid()) then
    raise exception 'not_a_group_member';
  end if;

  if p_award_coins and v_pet.last_expense_coin_date is distinct from current_date then
    v_coins_awarded := 3; -- lib/pets.ts GROUP_EXPENSE_COIN_REWARD과 맞춤
  end if;

  select * into v_growth from compute_pet_growth(v_pet.stage_index, v_pet.xp_progress, p_xp_delta);

  update pets set
    total_coins = v_pet.total_coins + v_coins_awarded,
    xp_progress = v_growth.new_xp,
    stage_index = v_growth.new_stage,
    last_expense_coin_date = case when v_coins_awarded > 0 then current_date else v_pet.last_expense_coin_date end
  where id = v_pet.id
  returning pets.total_coins, pets.xp_progress, pets.stage_index into total_coins, xp_progress, stage_index;

  coins_awarded := v_coins_awarded;
  return next;
end;
$$;

-- 밥주기 — 개인·그룹 펫 둘 다 처리한다(개인은 원래도 레이스가 안 나지만, 매번 두 갈래로 나눠 쓰지
-- 않고 이 함수 하나로 통일해서 pet_feedings 유니크 제약과 권한 확인을 같은 자리에서 보장한다).
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

-- pet_feedings의 기존 "user_id = auth.uid()"만 확인하던 정책은 이제 feed_pet()이 SECURITY DEFINER로
-- 대신 INSERT하므로(RLS를 그 함수 안 명시적 권한 확인으로 대체) 클라이언트가 직접 이 테이블에 쓸
-- 일이 없다 — 정책은 그대로 둬도 되지만(다른 경로로 직접 INSERT를 시도하는 걸 막는 효과는 여전히
-- 있음), 실제 밥주기는 이제 이 함수를 거쳐야 그룹 멤버 확인을 받는다.

-- RPC로 호출하려면 로그인한 사용자(authenticated 롤)에게 실행 권한을 명시적으로 줘야 한다 — SECURITY
-- DEFINER 함수라도 기본 권한만으로는 PostgREST가 호출을 막는다.
grant execute on function feed_pet(uuid) to authenticated;
grant execute on function grow_group_pet(uuid, numeric, boolean) to authenticated;
