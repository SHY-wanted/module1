-- supabase/017_recurring_expense_unique.sql
-- 2026-09-21 — 버그 수정(감사에서 발견): 로그인 시 "이번 달 정기 지출 생성"이 이미 생성됐는지를
-- 클라이언트가 읽어온 목록으로만 판단해서, 탭 두 개를 열어두거나 로그아웃/로그인을 빠르게 반복하면
-- 둘 다 "아직 안 만들어졌다"고 보고 같은 템플릿의 지출을 이번 달에 두 번 만들 수 있었다(예산이
-- 그만큼 부풀어 보임). day_of_month가 템플릿마다 고정이라 "이번 달에 생성되는 날짜"는 항상 하나로
-- 정해지므로, 같은 템플릿·같은 날짜 조합에 유니크 제약을 걸면 두 번째 시도는 DB가 그대로 막아준다.
create unique index expenses_recurring_once_per_date
  on expenses (recurring_expense_id, date)
  where recurring_expense_id is not null;
