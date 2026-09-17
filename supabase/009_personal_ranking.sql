-- supabase/009_personal_ranking.sql
-- 개인 랭킹(§ "개인 = 경쟁/랭킹", 그룹과는 절대 섞지 않음) — 다른 사용자의 개인 펫 성장치를 비교하려면
-- pets 테이블 RLS(pets_select_own_or_group_member, 005_pet_feature.sql)가 본인/같은 그룹 멤버 펫만
-- 보이게 막아둔 걸 그대로 둔 채로, 랭킹에 필요한 최소 컬럼(닉네임 + 성장 지표)만 노출하는 별도 함수를
-- 추가한다. pets 테이블 자체의 RLS 정책은 건드리지 않는다(기존 그룹 펫 보호 그대로 유지).
--
-- security definer로 RLS를 우회하되, 함수가 SELECT * 대신 정확히 필요한 컬럼만 반환하므로 이메일 등
-- 민감 정보는 노출되지 않는다. 그룹 펫(user_id is null)은 랭킹에서 완전히 제외한다 — 개인 랭킹과
-- 그룹 데이터를 섞지 않는다는 원칙(CLAUDE.md 이번 작업 지침) 그대로.

create or replace function public.get_personal_ranking()
returns table (
  user_id      uuid,
  nickname     text,
  stage_index  int,
  xp_progress  numeric,
  total_coins  int
)
language sql
security definer
set search_path = public
stable
as $$
  select p.user_id, coalesce(pr.name, '탈퇴한 사용자'), p.stage_index, p.xp_progress, p.total_coins
  from pets p
  join profiles pr on pr.id = p.user_id
  where p.user_id is not null
  order by p.stage_index desc, p.xp_progress desc, p.total_coins desc
$$;

revoke all on function public.get_personal_ranking() from public;
grant execute on function public.get_personal_ranking() to authenticated;
