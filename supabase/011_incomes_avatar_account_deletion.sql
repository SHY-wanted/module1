-- supabase/011_incomes_avatar_account_deletion.sql
-- 2026-09-18 — "완성본" 점검에서 나온 3가지 구멍을 메운다: 수입(E7)이 DB 없이 목업으로만 존재해서
-- 새로고침하면 사라지던 문제, 프로필 사진(avatar_url)이 DB 컬럼이 없어 로컬 상태로만 남던 문제,
-- 회원 탈퇴 기능 자체가 없던 문제. 이미 006~010을 실행해 둔 프로젝트의 SQL Editor에 이 파일만 추가로 실행할 것.

-- ============================================================
-- 1) incomes (E7) — lib/mock.ts MockIncome과 필드를 맞춘다.
-- ============================================================
create table incomes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  amount       integer not null,
  category     text not null,
  memo         text,
  is_recurring boolean not null default false,
  month        text not null, -- YYYY-MM
  date         date not null,
  created_at   timestamptz not null default now()
);

alter table incomes enable row level security;

create policy incomes_select_own on incomes for select using (user_id = auth.uid());
create policy incomes_insert_own on incomes for insert with check (user_id = auth.uid());
create policy incomes_delete_own on incomes for delete using (user_id = auth.uid());

-- ============================================================
-- 2) profiles.avatar_url — 10b "내 정보 변경"이 실제로 영구 저장되게 한다.
--    profiles_update_own_only 정책이 이미 있어(본인 행만 수정 가능) 별도 정책 불필요.
-- ============================================================
alter table profiles add column avatar_url text;

-- ============================================================
-- 3) 회원 탈퇴 — auth.users 행을 지웠을 때 남은 데이터가 안 지워지고 FK 위반으로 막히지 않게 한다.
--    schema.sql 원안(024·052·077행)은 group_members·expenses·savings의 user_id에 on delete cascade가
--    없었다(계정 삭제 자체가 없던 시절 설계라 그렇다) — 나머지 테이블(pets 등, 005~007)은 이미 cascade가
--    붙어 있다. 이 3개만 cascade로 바꾸면 auth.users 삭제 한 번으로 profiles→이 테이블들까지 전부
--    정리된다(제약 이름은 Postgres 기본 명명 규칙 <table>_<column>_fkey 그대로).
-- ============================================================
alter table group_members drop constraint group_members_user_id_fkey;
alter table group_members add constraint group_members_user_id_fkey
  foreign key (user_id) references profiles(id) on delete cascade;

alter table expenses drop constraint expenses_user_id_fkey;
alter table expenses add constraint expenses_user_id_fkey
  foreign key (user_id) references profiles(id) on delete cascade;

alter table savings drop constraint savings_user_id_fkey;
alter table savings add constraint savings_user_id_fkey
  foreign key (user_id) references profiles(id) on delete cascade;

-- [?] 팀 확인 필요: 혼자뿐인 그룹의 OWNER가 탈퇴하면 groups 행 자체는 안 지워지고 멤버 0명으로 남는다
-- (leaveGroup의 "혼자면 그룹째로 삭제" 규칙을 계정 탈퇴까지 그대로 적용하려면 앱 코드에서 먼저
-- leaveGroup 로직을 돌리거나, groups에도 별도 정리 로직이 필요하다 — 이번 범위에서는 건드리지 않음).
