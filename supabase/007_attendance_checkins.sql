-- supabase/007_attendance_checkins.sql
-- 2026-09-20 — 접속률을 올리기 위한 신규 기능: 매일 출석체크하면 코인을 주고, 7일 연속 출석해서
-- 그 주기를 꽉 채우면 7일째 코인을 두 배로 지급한다(사용자 요청). 이미 supabase/006_pet_v2_and_goals_and_reactions.sql
-- 을 실행해 둔 프로젝트의 SQL Editor에 이 파일만 추가로 실행할 것.

create table attendance_checkins (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  checkin_date  date not null,
  streak_day    integer not null default 1 check (streak_day between 1 and 7),
  coins_earned  integer not null default 0 check (coins_earned >= 0),
  created_at    timestamptz not null default now(),
  unique (user_id, checkin_date)
);

alter table attendance_checkins enable row level security;

create policy attendance_checkins_select_own on attendance_checkins for select using (user_id = auth.uid());
create policy attendance_checkins_insert_own on attendance_checkins for insert with check (user_id = auth.uid());
