-- supabase/008_rename_roommate_to_friend.sql
-- 2026-09-20 — 사용자 요청: 그룹 유형 "룸메이트" → "친구"로 변경. 이미 만들어진 그룹의 group_type이
-- 'ROOMMATE'로 저장돼 있어도 값 자체를 바꾸는 것이라 기존 데이터가 깨지지 않는다(enum 값 이름만 바뀜).
-- 이미 supabase/007_attendance_checkins.sql을 실행해 둔 프로젝트의 SQL Editor에 이 파일만 추가로 실행할 것.

alter type group_type rename value 'ROOMMATE' to 'FRIEND';
