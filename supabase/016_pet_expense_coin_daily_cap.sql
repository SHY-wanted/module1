-- supabase/016_pet_expense_coin_daily_cap.sql
-- 2026-09-21 — 지출 기록 코인 보상 개편(사용자 요청): "기록할 때마다 1코인"은 하루에 지출을 여러 번
-- 기록하면 그만큼 코인을 무제한으로 벌 수 있어서 문제였다 — 하루에 딱 한 번, 3코인만 받게 바꾼다.
-- last_fed_date와 같은 방식으로 "오늘 이미 받았는지"를 pets 테이블에 날짜 하나로 남긴다.
alter table pets add column last_expense_coin_date date;
