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

-- 2026-09-18 추가: 07-screens.md 10b "내 정보 변경"(닉네임 수정)이 실제로 동작하려면 본인 이름 정도는
-- 스스로 바꿀 수 있어야 한다 — 01~05엔 이름 변경 규칙이 없었지만(원래 [?]였던 자리), 이미 만들어진
-- 화면이 걸어야 할 최소 정책이라 본인 행만 수정 가능하도록 추가했다. 팀 확인 필요하면 되돌릴 것.
create policy profiles_update_own_only on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

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

-- 2026-09-18 추가(버그 수정): group_members의 SELECT/UPDATE 정책이 "그룹원인지"를 확인하려고
-- group_members 자기 자신을 다시 서브쿼리하면, 그 서브쿼리에도 RLS가 다시 적용되면서
-- 정책이 자기 자신을 무한히 호출한다 — Postgres가 "infinite recursion detected in policy for
-- relation group_members"(42P17)로 막아버린다(테이블을 만든 시점엔 안 보이다가, 실제로 로그인해서
-- 조회해보면 터진다). 아래 두 security definer 함수는 테이블 소유자 권한으로 실행되어 RLS를
-- 다시 타지 않으므로, 이 함수를 거치면 재귀 없이 같은 검사를 할 수 있다(Supabase 공식 권장 패턴).
create function public.is_group_member(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from group_members where group_id = p_group_id and user_id = p_user_id
  );
$$;

create function public.is_group_owner(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from group_members where group_id = p_group_id and user_id = p_user_id and role = 'OWNER'
  );
$$;

-- 05-policy.md에 group_members 조회 자체에 대응하는 P는 없다 — 같은 그룹 멤버끼리만 멤버 목록을 볼 수 있음(SHY 스펙 원안 준용, 5b 멤버 목록 패널에 필요)
create policy members_select_same_group on group_members for select
  using (public.is_group_member(group_members.group_id, auth.uid()));

-- P3(중복 참여 방지)는 위 2)번의 unique(user_id, group_id) 제약으로 구현된다 — RLS는 "본인 명의로만 참여 신청 가능"만 강제한다.
create policy members_insert_self on group_members for insert
  with check (user_id = auth.uid());

-- P10(그룹장 위임)의 "role을 OWNER로 바꾸는 것은 기존 OWNER만 할 수 있다" 부분
create policy members_update_owner_transfers_role on group_members for update
  using (public.is_group_owner(group_members.group_id, auth.uid()))
  with check (public.is_group_owner(group_members.group_id, auth.uid()));
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

-- 2026-09-18 추가: 05-policy.md P11·P12·04-features.md F19~F21엔 저금 삭제 규칙이 없어 원래
-- [?]로 비워뒀지만, 10a "그룹 나가기"(그룹원이 혼자뿐이면 그룹·지출을 함께 삭제)를 실제로 구현하려면
-- 최소한 본인 저금은 스스로 지울 수 있어야 한다 — savings.group_id → groups(id) FK에 ON DELETE가
-- 지정 안 돼 있어(기본 RESTRICT) 저금 행이 남아있으면 그룹 삭제 자체가 막히기 때문. 팀 확인 필요하면 되돌릴 것.
create policy savings_delete_own_only on savings for delete
  using (user_id = auth.uid());

-- ============================================================
-- 4-1) 그룹 참여(4번 화면, 초대 코드) 전용 RPC
--    groups_select_member_only(위 "groups" 절)는 "이미 그 그룹 멤버인 사람만" 그룹 행을 볼 수 있게
--    막아뒀다 — 그런데 초대 코드로 처음 참여하려는 사람은 아직 멤버가 아니므로, 일반 select로는
--    참여하려는 그룹을 찾을 수조차 없다(모든 그룹을 공개로 열면 초대 코드 없이도 그룹명이 다 보여버려
--    "멤버만 볼 수 있다"는 원래 의도가 깨진다). security definer 함수로 "이 초대 코드에 해당하는
--    그룹 하나만" 우회 조회해서 멤버로 등록시키는 방식으로 우회한다.
-- ============================================================
create function public.join_group_by_invite_code(p_invite_code text)
returns groups
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group groups;
begin
  select * into v_group from groups where invite_code = p_invite_code;
  if not found then
    raise exception 'NOT_FOUND';
  end if;
  if exists (select 1 from group_members where group_id = v_group.id and user_id = auth.uid()) then
    raise exception 'ALREADY_MEMBER';
  end if;
  insert into group_members (user_id, group_id, role) values (auth.uid(), v_group.id, 'MEMBER');
  return v_group;
end;
$$;

grant execute on function public.join_group_by_invite_code(text) to authenticated;

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
-- 6) Realtime 활성화 — 2c "그룹원 기록 확인 알림"(2026-09-19 추가)이 다른 그룹원의 새 지출 INSERT를
--    실시간으로 받으려면 expenses 테이블이 supabase_realtime publication에 있어야 한다. RLS는 그대로
--    적용되므로(Postgres Changes가 RLS를 존중한다) 클라이언트는 자기가 원래 select할 수 있는 행의
--    이벤트만 받는다 — 새 정책을 따로 만들 필요는 없다.
-- ============================================================
alter publication supabase_realtime add table public.expenses;

-- ============================================================
-- 7) 저금통 펫 키우기 v2 (docs/08-pet-feature-spec.md 근거, 2026-09-15 mg·hybranch·shooTbranch
--    3개 브랜치 통합 — 사용자 확인 4가지 반영)
--    - 그룹 펫 = hybranch F22(반려 캐릭터)와 통합. 자동 성장 로직은 store.tsx가 담당(스키마는
--      개인 펫과 동일한 pets 테이블·정책을 그대로 공유)
--    - 성장 4단계로 통일(lib/pets.ts 상수, DB는 그냥 int라 스키마 변경 없음)
--    - 종(species) 선택 대신 마스코트 + 색상 커스텀(개인 펫만)
--    - 예산은 shooTbranch식 월별·카테고리별 목표(category_goals·goal_rewards)로 교체
--    - F23(그룹 피드 이모지 반응, hybranch) 추가
-- ============================================================

-- E9. Pet — user_id 또는 group_id 중 하나만 채운다(배타적). 색상 5종은 개인 펫만 커스텀 대상이다
-- (그룹 펫은 기본값 그대로 — "개인용 펫만 색상 변경 가능"이라는 사용자 확인 그대로 반영, 앱 쪽에서 막는다).
create table pets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id) on delete cascade,
  group_id      uuid references groups(id) on delete cascade,
  pet_name      text,
  stage_index   int not null default 1 check (stage_index between 1 and 4),
  xp_progress   numeric not null default 0 check (xp_progress >= 0),
  total_coins   int not null default 0 check (total_coins >= 0),
  last_fed_date date,
  body_color    text not null default '#8C81E0',
  ledger_color  text not null default '#6A5ECF',
  bag_color     text not null default '#BDB2F2',
  eye_color     text not null default '#2D2A3E',
  leaf_color    text not null default '#6FC5BA',
  created_at    timestamptz not null default now(),
  constraint pets_owner_exclusive check (
    (user_id is not null and group_id is null) or (user_id is null and group_id is not null)
  )
);
create unique index pets_one_personal_per_user on pets (user_id) where user_id is not null;
create unique index pets_one_per_group on pets (group_id) where group_id is not null;

-- E12. CategoryGoal — shooTbranch "월별 목표 설정"을 실제 저장소에 연결. mg의 주간 예산을 대체한다.
create table category_goals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  category     text not null,
  month        text not null, -- "YYYY-MM"
  goal_amount  integer not null check (goal_amount >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, category, month)
);

-- E13. GoalReward — "퀘스트 달성" 개념이라 절약 비율이 아니라 달성 여부(achieved)에 따른 고정 보상.
-- P4 화면을 열 때 그 자리에서 계산해 upsert하는 방식(배치 없음 — supabase/005_pet_feature.sql 헤더 참고).
create table goal_rewards (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  category      text not null,
  month         text not null,
  spent_amount  integer not null,
  goal_amount   integer not null,
  achieved      boolean not null,
  coins_earned  integer not null default 0,
  xp_gained     integer not null default 0,
  created_at    timestamptz not null default now(),
  unique (user_id, category, month)
);

alter table pets enable row level security;
alter table category_goals enable row level security;
alter table goal_rewards enable row level security;

create policy pets_select_own_or_group_member on pets for select
  using (user_id = auth.uid() or (group_id is not null and public.is_group_member(group_id, auth.uid())));
create policy pets_insert_own_or_group_member on pets for insert
  with check (
    (user_id = auth.uid() and group_id is null)
    or (user_id is null and group_id is not null and public.is_group_member(group_id, auth.uid()))
  );
create policy pets_update_own_or_group_member on pets for update
  using (user_id = auth.uid() or (group_id is not null and public.is_group_member(group_id, auth.uid())))
  with check (user_id = auth.uid() or (group_id is not null and public.is_group_member(group_id, auth.uid())));

create policy category_goals_select_own on category_goals for select using (user_id = auth.uid());
create policy category_goals_insert_own on category_goals for insert with check (user_id = auth.uid());
create policy category_goals_update_own on category_goals for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy goal_rewards_select_own on goal_rewards for select using (user_id = auth.uid());
create policy goal_rewards_insert_own on goal_rewards for insert with check (user_id = auth.uid());
create policy goal_rewards_update_own on goal_rewards for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- E14. ExpenseReaction(이모지 반응, hybranch F23) — 지출을 볼 수 있는 사람만 반응도 볼 수 있고
-- (expenses 자신의 select 정책과 같은 원칙), 그룹 멤버만 반응을 남길 수 있다(F23 예외 그대로).
create table expense_reactions (
  id          uuid primary key default gen_random_uuid(),
  expense_id  uuid not null references expenses(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  emoji       text not null,
  created_at  timestamptz not null default now(),
  unique (expense_id, user_id, emoji)
);

alter table expense_reactions enable row level security;

create policy expense_reactions_select_visible on expense_reactions for select
  using (
    exists (
      select 1 from expenses e
      where e.id = expense_reactions.expense_id
        and (e.user_id = auth.uid() or (e.is_shared and e.group_id is not null and public.is_group_member(e.group_id, auth.uid())))
    )
  );
create policy expense_reactions_insert_group_member on expense_reactions for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from expenses e
      where e.id = expense_reactions.expense_id
        and e.is_shared and e.group_id is not null and public.is_group_member(e.group_id, auth.uid())
    )
  );
create policy expense_reactions_delete_own on expense_reactions for delete using (user_id = auth.uid());

-- ============================================================
-- 8) RLS 체크리스트 — 테이블마다 select/insert/update/delete 정책이 있는지
--    (⚠️ 없는 칸은 "그 동작을 아무도 할 수 없다"는 뜻이다 — 의도된 것인지 아래 비고를 확인할 것)
-- ============================================================
--
-- | 테이블             | select | insert | update | delete | 비고 |
-- |--------------------|--------|--------|--------|--------|------|
-- | profiles           |   O    |  (트리거) |   O    |  없음  | INSERT는 handle_new_user 트리거(security definer)가 담당. UPDATE=본인만(2026-09-18 추가, 10b 내 정보 변경용). DELETE는 01~05에 탈퇴 규칙이 없어 미구현 [?] |
-- | groups             |   O    |   O    |   O    |   O    | P1(insert 조건) · P2(update=OWNER만) · delete는 상태값1 전제로 OWNER만 |
-- | group_members      |   O    |   O    |   O    |   O    | select/update는 재귀 방지용 security definer 함수(is_group_member·is_group_owner, 2026-09-18) 경유. insert=본인만(P3은 unique 제약), update=OWNER만(P10 위임), delete=본인만(탈퇴) |
-- | expenses           |   O    |   O    |   O    |   O    | select 2개(본인 전체 + P5 공유피드), insert=P4, update/delete=P6 |
-- | expense_ocr_raw    |   O    |  없음  |  없음  |  없음  | 클라이언트는 읽기만 함 — 쓰기는 Edge Function이 service_role로 수행(RLS 우회), 의도된 설계 |
-- | savings            |   O    |   O    |   O    |   O    | select 2개(P11 본인 + P12 그룹멤버), insert=[?](P4 패턴 차용), update=P11·P12, delete=본인만(2026-09-18 추가, 그룹 나가기용) |
-- | pets               |   O    |   O    |   O    |  없음  | 2026-09-15 추가(v2). select/insert/update=본인 개인 펫 또는 그 그룹 멤버(그룹 펫). delete는 스펙에 삭제 규칙이 없어 미구현 |
-- | category_goals     |   O    |   O    |   O    |  없음  | 2026-09-15 추가(shooTbranch 통합). 본인만. delete는 규칙 없어 미구현(재설정은 update로) |
-- | goal_rewards       |   O    |   O    |   O    |  없음  | 2026-09-15 추가. 본인만. 배치가 아니라 화면을 열 때 upsert하는 방식(위 7절 참고) |
-- | expense_reactions  |   O    |   O    |  없음  |   O    | 2026-09-15 추가(hybranch F23). select=지출을 볼 수 있는 사람과 동일, insert=그 지출이 속한 그룹 멤버만, delete=본인 반응만(취소용). update는 필요 없어 미구현(지우고 다시 남기면 됨) |
--
-- 그 외 RPC: join_group_by_invite_code(text) — 4번(그룹 참여) 전용. groups가 멤버만 select 가능해서
-- 초대 코드로 아직 멤버 아닌 그룹을 찾을 방법이 없어, security definer 함수로 조회+가입을 한 번에 처리한다.
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
