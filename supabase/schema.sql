-- ShooT — Supabase 스키마
-- 출처: docs/06-data.md 「엔티티별 필드」(E1~E6) · docs/05-policy.md 「정책」(P1~P12) · docs/PRD.md
-- E7(Income)은 06-data.md에 [?]로 표시돼 있어 만들지 않는다.
-- E8(CategoryPreset)은 DB 테이블이 아니라 정적 상수다 — lib/categories.ts(별도 작업)로 뺀다.
--
-- 이 파일은 새 Supabase 프로젝트의 SQL Editor에 한 번에 붙여넣는 것을 가정한 초기 스키마다.
-- (idempotent 하지 않음 — 이미 만들어진 스키마에 다시 실행하면 "already exists" 에러가 난다.)

-- ============================================================
-- 1) enum 타입 (06-data.md 「엔티티별 필드」에 적힌 값 그대로)
-- ============================================================

create type group_type as enum ('FAMILY','SIBLING','ROOMMATE','COUPLE','MARRIED_COUPLE','CLUB','OTHER'); -- 06-data.md E2 group_type
create type member_role as enum ('OWNER','MEMBER'); -- 06-data.md E3 role
create type source_type as enum ('MANUAL','RECEIPT','PAYMENT_CAPTURE'); -- 06-data.md E4 source_type
create type saving_type as enum ('PERSONAL','GROUP'); -- 06-data.md E6 type

-- ============================================================
-- 2) 테이블 (E1~E6)
-- ============================================================

-- E1. Profile — auth.users(Supabase Auth)를 그대로 쓰고, 표시용 이름만 별도 public 테이블에 미러링한다.
-- 06-data.md는 email을 "별도 컬럼이 아니라 auth.users.email을 그대로 참조"라고 명시했으므로 email 컬럼은 만들지 않는다.
create table profiles (
  id    uuid primary key references auth.users(id) on delete cascade,
  name  text not null
);

-- E2. Group
create table groups (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  group_type   group_type not null default 'OTHER',
  invite_code  text not null unique,
  created_at   timestamptz not null default now()
);

-- E3. GroupMember
create table group_members (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id),
  group_id   uuid not null references groups(id) on delete cascade, -- 06-data.md E3: "그룹 삭제 시 같이 삭제"
  role       member_role not null default 'MEMBER',
  nickname   text,
  joined_at  timestamptz not null default now(),
  unique (user_id, group_id) -- P3: 같은 그룹에 중복 참여 불가 — RLS가 아니라 이 유니크 제약으로 구현
);

-- E4. Expense
create table expenses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id),
  group_id     uuid references groups(id) on delete set null, -- 06-data.md E4: "그룹 삭제 시에도 지출은 남고 개인 지출로 전환"
  amount       integer not null,
  category     text not null,
  memo         text,
  date         date not null,
  source_type  source_type not null default 'MANUAL',
  image_url    text,
  is_shared    boolean not null default false,
  created_at   timestamptz not null default now()
);

-- E5. ExpenseOcrRaw — 지출 1건에 종속(1:1)
create table expense_ocr_raw (
  id           uuid primary key default gen_random_uuid(),
  expense_id   uuid not null unique references expenses(id) on delete cascade, -- 06-data.md E5: "지출 1건에 종속" — 지출 삭제 시 함께 삭제
  raw_text     text,
  parsed_json  jsonb,
  ocr_provider text,
  confidence   real
);

-- E6. Saving(저금) — SHY 스펙엔 없는 신규 엔티티(03-requirements.md R19~R21 · 04-features.md F19~F21 · 05-policy.md P11·P12 근거)
create table savings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id),
  type         saving_type not null,
  group_id     uuid references groups(id),
  amount       integer not null,
  title        text,
  date         date not null,
  created_at   timestamptz not null default now(),
  constraint savings_group_id_matches_type check (
    (type = 'PERSONAL' and group_id is null) or
    (type = 'GROUP' and group_id is not null)
  ) -- 06-data.md E6: "group_id ... type=GROUP일 때만 필수"
);

-- ============================================================
-- 3) RLS 활성화 (테이블 6개 전부)
-- ============================================================

alter table profiles enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table expenses enable row level security;
alter table expense_ocr_raw enable row level security;
alter table savings enable row level security;

-- ============================================================
-- 4) RLS 정책 — docs/05-policy.md P1~P12를 옮긴 것.
--    P3·P7·P8·P9는 RLS 정책 한 줄로 표현되는 규칙이 아니라서(아래 각 자리에 이유를 남김),
--    05-policy.md에 없지만 테이블이 최소한으로 동작하려면 필요한 정책도 별도로 표시해 뒀다.
-- ============================================================

-- --- profiles ---

-- 05-policy.md에 profiles 자체에 대응하는 P는 없다.
-- 그룹 피드(F13·P5)에서 작성자 이름을 보여주려면 로그인한 사람은 누구나 다른 사람의 이름을 읽을 수 있어야 한다.
-- (모듈 1 SHY프로젝트 주제 세분화.md "3. DB 스키마" profiles 정책 원안 그대로 준용)
create policy profiles_select_any_authenticated on profiles for select
  using (auth.uid() is not null);

-- profiles의 INSERT는 아래 5)번 트리거(handle_new_user, security definer)가 담당하므로 클라이언트용 INSERT 정책을 두지 않는다.
-- profiles의 UPDATE(이름 변경) 정책도 없다 — [?] 이름 변경 기능 자체가 03~05 문서에 없어 만들지 않았다. 필요하면 팀 확인.
-- profiles의 DELETE 정책 없음 — 계정 탈퇴 규칙이 01~05 어디에도 없어 만들지 않았다. [?] 팀 확인 필요.

-- --- groups ---

-- P1: 그룹 이름(name)이 비어 있으면 그룹을 만들 수 없다
create policy groups_insert_any_authenticated on groups for insert
  with check (auth.uid() is not null and length(trim(name)) > 0);

-- 05-policy.md에 groups 조회 자체에 대응하는 P는 없다 — 그룹 멤버만 그 그룹 행을 볼 수 있음(SHY 스펙 원안 준용, 5a·5b 화면에 필요)
create policy groups_select_member_only on groups for select
  using (exists (select 1 from group_members gm where gm.group_id = groups.id and gm.user_id = auth.uid()));

-- P2: OWNER가 아니면 그룹 이름을 바꿀 수 없다
create policy groups_update_owner_only on groups for update
  using (exists (select 1 from group_members gm where gm.group_id = groups.id and gm.user_id = auth.uid() and gm.role = 'OWNER'))
  with check (exists (select 1 from group_members gm where gm.group_id = groups.id and gm.user_id = auth.uid() and gm.role = 'OWNER'));

-- 05-policy.md에 groups 삭제 자체에 대응하는 P는 없다 — 상태값1(그룹원이 혼자뿐이면 위임 없이 나가며 그룹 삭제)의 전제로 OWNER만 그룹을 지울 수 있게 함
create policy groups_delete_owner_only on groups for delete
  using (exists (select 1 from group_members gm where gm.group_id = groups.id and gm.user_id = auth.uid() and gm.role = 'OWNER'));

-- --- group_members ---

-- 05-policy.md에 group_members 조회 자체에 대응하는 P는 없다 — 같은 그룹 멤버끼리만 멤버 목록을 볼 수 있음(SHY 스펙 원안 준용, 5b 멤버 목록 패널에 필요)
create policy members_select_same_group on group_members for select
  using (exists (select 1 from group_members gm2 where gm2.group_id = group_members.group_id and gm2.user_id = auth.uid()));

-- P3(중복 참여 방지)는 위 2)번의 unique(user_id, group_id) 제약으로 구현된다 — RLS는 "본인 명의로만 참여 신청 가능"만 강제한다.
create policy members_insert_self on group_members for insert
  with check (user_id = auth.uid());

-- P10(그룹장 위임)의 "role을 OWNER로 바꾸는 것은 기존 OWNER만 할 수 있다" 부분
create policy members_update_owner_transfers_role on group_members for update
  using (exists (select 1 from group_members gm where gm.group_id = group_members.group_id and gm.user_id = auth.uid() and gm.role = 'OWNER'))
  with check (exists (select 1 from group_members gm where gm.group_id = group_members.group_id and gm.user_id = auth.uid() and gm.role = 'OWNER'));
-- [?] P10의 "새 그룹장을 지정하지 않으면 나갈 수 없다"는 순서 규칙(위임 먼저 → 탈퇴는 그다음) 자체는
--     이 UPDATE 정책 하나로 강제되지 않는다 — 애플리케이션이 "role 변경 → 본인 멤버십 삭제" 순서로 두 쿼리를
--     실행해야 한다(모듈 1 SHY프로젝트 주제 세분화.md "설계 포인트" 참고). DB 트리거로 순서까지 강제할지는 팀 확인 필요.

-- 05-policy.md에 group_members 탈퇴 자체에 대응하는 P는 없다 — 본인 멤버십만 스스로 나갈 수 있음(F18 흐름에 필요)
create policy members_delete_self on group_members for delete
  using (user_id = auth.uid());

-- --- expenses ---

-- 05-policy.md에 명시된 P는 아니지만, 본인 지출은 공유 여부와 무관하게 항상 조회 가능해야 한다(04-features.md F6·F14의 전제)
create policy expenses_select_own on expenses for select
  using (user_id = auth.uid());

-- P5: 그룹 멤버가 아니면 그 그룹의 피드(공유된 지출)를 볼 수 없다
create policy expenses_select_shared_group_feed on expenses for select
  using (is_shared = true and group_id is not null and exists (
    select 1 from group_members gm where gm.group_id = expenses.group_id and gm.user_id = auth.uid()
  ));

-- P4: 자신이 속하지 않은 그룹으로는 지출을 등록할 수 없다
create policy expenses_insert_own_group_member_check on expenses for insert
  with check (user_id = auth.uid() and (group_id is null or exists (
    select 1 from group_members gm where gm.group_id = expenses.group_id and gm.user_id = auth.uid()
  )));

-- P6: 본인이 등록한 지출이 아니면 수정할 수 없다 — 그룹장이라도 예외 없다
create policy expenses_update_own_only on expenses for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- P6: 본인이 등록한 지출이 아니면 삭제할 수 없다 — 그룹장이라도 예외 없다
create policy expenses_delete_own_only on expenses for delete
  using (user_id = auth.uid());

-- P7 메모: "인식에 실패했다고 해서 지출 저장 자체를 실패시킬 수 없다"는 행 접근 권한 규칙이 아니라,
--   OCR·캡쳐 파싱 실패 시에도 amount=0·category='확인 필요'로 채워 insert 자체가 성공하도록 만드는
--   애플리케이션(Edge Function) 쪽의 책임이다 — RLS 정책으로 표현할 대상이 아니라 별도 정책을 두지 않았다.
--   (expenses_insert_own_group_member_check가 그대로 적용된다.)

-- P8 메모: "그룹에 속하지 않으면 공유 여부를 선택할 수 없다"는 클라이언트가 select 자체를 안 그리는 UI 동작이라
--   DB 접근 정책이 필요 없다.

-- P9 메모: 정산(F15)은 06-data.md "검토했으나 제외"에 따라 별도 Settlement 테이블을 만들지 않았다.
--   정산 계산에 필요한 데이터 접근은 위 expenses_select_shared_group_feed(P5)가 이미 제공한다.

-- --- expense_ocr_raw ---

-- 05-policy.md에 대응하는 P 없음 — 본인 지출에 딸린 OCR 원문만 조회 가능(SHY 스펙 원안 준용)
create policy ocr_raw_select_own on expense_ocr_raw for select
  using (exists (select 1 from expenses e where e.id = expense_ocr_raw.expense_id and e.user_id = auth.uid()));

-- INSERT/UPDATE/DELETE 정책 없음: 이 테이블은 클라이언트가 직접 쓰지 않고 OCR Edge Function이
-- service_role 키로 기록한다(service_role은 RLS를 우회한다) — 06-data.md에도 클라이언트 작성 경로가 없다.

-- --- savings ---

-- P11: 본인이 아니면 개인 저금을 조회할 수 없다
create policy savings_select_own on savings for select
  using (user_id = auth.uid());

-- P12: 그룹 멤버가 아니면 그룹 저금을 조회할 수 없다
create policy savings_select_group_members on savings for select
  using (type = 'GROUP' and group_id is not null and exists (
    select 1 from group_members gm where gm.group_id = savings.group_id and gm.user_id = auth.uid()
  ));

-- [?] savings INSERT: 05-policy.md P11·P12는 조회·수정 규칙만 정하고 등록(insert) 규칙은 없다.
--   04-features.md F19(R19)가 성립하려면 등록은 가능해야 하므로, expenses의 P4와 같은 패턴
--   (본인 명의로만, 그룹이면 그룹 멤버여야)을 그대로 적용했다 — 팀 확인 필요.
create policy savings_insert_own_group_member_check on savings for insert
  with check (user_id = auth.uid() and (group_id is null or exists (
    select 1 from group_members gm where gm.group_id = savings.group_id and gm.user_id = auth.uid()
  )));

-- P11·P12: 개인 저금은 본인만, 그룹 저금은 등록한 사람만 수정할 수 있다(그룹장도 예외 없음)
create policy savings_update_own_only on savings for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- savings DELETE 정책 없음: 05-policy.md P11·P12, 04-features.md F19~F21 어디에도 저금 삭제 규칙이 없어
-- 만들지 않았다 — [?] 필요하면 팀 확인 후 추가.

-- ============================================================
-- 5) auth.users에 새 행이 생기면 profiles(E1)에 자동으로 넣는 트리거
--    (모듈 1 SHY프로젝트 주제 세분화.md "3. DB 스키마" 트리거 그대로 준용 — 06-data.md E1엔 name만 필수라
--    signUp 시 name을 안 넘긴 경우를 위해 email로 대체하는 fallback도 원안 그대로 유지)
-- ============================================================

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 6) RLS 체크리스트 — 테이블마다 select/insert/update/delete 정책이 있는지
--    (⚠️ 없는 칸은 "그 동작을 아무도 할 수 없다"는 뜻이다 — 의도된 것인지 아래 비고를 확인할 것)
-- ============================================================
--
-- | 테이블             | select | insert | update | delete | 비고 |
-- |--------------------|--------|--------|--------|--------|------|
-- | profiles           |   O    |  (트리거) |  없음  |  없음  | INSERT는 handle_new_user 트리거(security definer)가 담당. UPDATE·DELETE는 01~05에 이름 변경·탈퇴 규칙이 없어 미구현 [?] |
-- | groups             |   O    |   O    |   O    |   O    | P1(insert 조건) · P2(update=OWNER만) · delete는 상태값1 전제로 OWNER만 |
-- | group_members      |   O    |   O    |   O    |   O    | insert=본인만(P3은 unique 제약), update=OWNER만(P10 위임), delete=본인만(탈퇴) |
-- | expenses           |   O    |   O    |   O    |   O    | select 2개(본인 전체 + P5 공유피드), insert=P4, update/delete=P6 |
-- | expense_ocr_raw    |   O    |  없음  |  없음  |  없음  | 클라이언트는 읽기만 함 — 쓰기는 Edge Function이 service_role로 수행(RLS 우회), 의도된 설계 |
-- | savings            |   O    |   O    |   O    |  없음  | select 2개(P11 본인 + P12 그룹멤버), insert=[?](P4 패턴 차용), update=P11·P12, delete는 05-policy.md에 규칙이 없어 미구현 [?] |
--
-- P1~P12 대응표
-- P1  → groups_insert_any_authenticated (WITH CHECK의 이름 비어있음 검사)
-- P2  → groups_update_owner_only
-- P3  → group_members의 UNIQUE(user_id, group_id) 제약 (RLS 아님)
-- P4  → expenses_insert_own_group_member_check
-- P5  → expenses_select_shared_group_feed
-- P6  → expenses_update_own_only, expenses_delete_own_only
-- P7  → RLS로 표현 안 함(애플리케이션/Edge Function의 보장) — 위 "expenses" 절 메모 참고
-- P8  → RLS로 표현 안 함(클라이언트 UI 동작) — 위 "expenses" 절 메모 참고
-- P9  → 별도 정책 없음 — 정산 전용 테이블이 없어 P5로 이미 커버됨
-- P10 → members_update_owner_transfers_role (순서 강제는 애플리케이션 책임, [?] 참고)
-- P11 → savings_select_own, savings_update_own_only
-- P12 → savings_select_group_members, savings_update_own_only
