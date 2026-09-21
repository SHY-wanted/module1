-- supabase/015_pet_display_stage.sql
-- 사용자 확인(2026-09-21): "캐릭터 커스텀"(꾸미기)에서 성장 단계를 눌러도(예: 알) 다른 화면(펫 상세·
-- 마이페이지 등)엔 항상 실제 stage_index(성장 진행 단계)만 그려져서 "적용해도 안 바뀐다"는 버그.
-- 성장 진행(stage_index·xp_progress)은 그대로 두고, "지금 화면에 보여줄 단계"만 따로 저장한다.
-- null이면 실제 stage_index를 그대로 보여준다(기존과 동일한 동작) — 이미 있는 펫들은 전부 null로
-- 시작해서 지금까지 보던 모습 그대로 유지된다.
alter table pets add column display_stage_index int check (display_stage_index between 1 and 4);
