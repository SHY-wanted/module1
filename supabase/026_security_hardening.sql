-- supabase/026_security_hardening.sql
-- 2026-09-22 — 보안 감사(REST/RPC 직접 호출 시나리오)에서 발견한 두 구멍을 막는다. 둘 다 "정상 UI로는
-- 절대 안 보이지만, 로그인한 채로 Supabase REST/RPC를 직접 호출하면 그대로 통과하는" 유형이다.

-- 1) group_members_insert_self가 role 값을 전혀 검사하지 않아서, 초대 코드 없이도
--    POST /rest/v1/group_members { user_id: 나, group_id: 아는-그룹-uuid, role: 'OWNER' }
--    로 아무 그룹의 OWNER를 자가 임명할 수 있었다. 실제 클라이언트가 이 테이블에 직접 INSERT하는
--    유일한 경로는 "그룹 만들기" 직후 만든 사람을 OWNER로 넣는 한 줄뿐이다(store.tsx의 join-by-code는
--    SECURITY DEFINER 함수를 거쳐 RLS를 우회하므로 이 정책의 영향을 받지 않는다) — 그러니 "그 그룹에
--    아직 멤버가 아무도 없을 때, role='OWNER'로만" 직접 INSERT를 허용하도록 좁힌다.
drop policy if exists members_insert_self on group_members;
create policy members_insert_self on group_members for insert
  with check (
    user_id = auth.uid()
    and role = 'OWNER'
    and not exists (select 1 from group_members gm where gm.group_id = group_members.group_id)
  );

-- 2) pets_update_own_or_group_member가 소유권만 확인하고 어떤 컬럼을 얼마로 바꾸는지는 보지 않아서,
--    PATCH /rest/v1/pets?id=eq.내펫id { total_coins: 999999999, stage_index: 4 } 처럼 feed_pet·
--    award_personal_pet·grow_group_pet RPC를 완전히 건너뛰고 economy 컬럼을 직접 조작할 수 있었다.
--    RLS는 행 단위 검사라 "바꾸기 전 값과 바꾼 후 값을 비교"하는 방식으로는 막기 어려우므로, 컬럼별
--    권한(GRANT)으로 economy 컬럼(total_coins·xp_progress·stage_index·last_fed_date·
--    last_expense_coin_date)은 아예 authenticated 롤의 UPDATE 대상에서 빼고, 커스터마이즈 컬럼만
--    허용한다 — economy 값 변경은 이제 SECURITY DEFINER RPC(018·025·027)를 통해서만 가능하다.
--    INSERT는 새 행 전체를 한 번에 넣어야 하므로 컬럼 단위로 못 좁히니 그대로 두되, economy 시작값을
--    실제로 신뢰하지 않도록 028에서 별도로 고친다(생성 직후 0/1/0으로 강제하고 RPC로 백필).
revoke update on pets from authenticated;
grant update (body_color, ledger_color, bag_color, eye_color, leaf_color, display_stage_index) on pets to authenticated;
