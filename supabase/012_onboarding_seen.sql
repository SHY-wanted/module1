-- supabase/012_onboarding_seen.sql
-- 2026-09-21 — 신규 기능: 처음 가입한 유저에게만 온보딩 투어를 보여준다. 기존 계정들은 이미 앱을
-- 써봤으니 true로 미리 채워서, 이 마이그레이션 이후 새로 가입하는 계정만 실제로 false로 시작해 투어를
-- 보게 한다. 로그아웃 후 다시 로그인해도(profiles에 저장돼 있으니) 다시 뜨지 않는다.
alter table profiles add column onboarding_seen boolean not null default false;
update profiles set onboarding_seen = true;
