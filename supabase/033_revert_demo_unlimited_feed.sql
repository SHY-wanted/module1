-- supabase/033_revert_demo_unlimited_feed.sql
-- 033_demo_unlimited_feed.sql로 열어둔 시연 전용 예외를 닫는다 — 평가가 끝나면 이 파일을 실행할 것.
-- feed_pet()을 018(원본) 그대로 되돌린다. 실행 후에는 모든 계정이 다시 "하루 1회"로 동작한다.

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
