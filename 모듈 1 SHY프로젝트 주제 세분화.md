# 공유 가계부 앱 - 프로젝트 기획서 (Agent 개발용)

> 이 문서는 Claude Code 등 AI 코딩 에이전트에게 최소한의 프롬프트로 작업을 위임할 수 있도록,
> 기능을 독립적으로 완결되는 Task 단위로 쪼갠 스펙 문서입니다.
> 각 Task는 순서대로 진행하며, Task 하나 = Agent 세션 하나로 완료 가능하도록 설계했습니다.

---

## 0. 프로젝트 개요

**이름(가칭):** 우리끼리 가계부 (Our Ledger)

**한 줄 정의:** 원하는 단위(가족, 형제, 룸메이트, 소모임 등)로 그룹을 만들어 지출을 공유하고,
영수증·간편결제 캡쳐를 사진 한 장으로 기록하는 가계부 앱

**핵심 설계 원칙: 그룹은 "가족"으로 고정하지 않는다**
- 그룹의 성격(가족/형제/룸메이트/커플/부부/동아리 등)은 앱이 미리 정해주지 않고, **사용자가 그룹을 만들 때 이름과 성격을 직접 설정**합니다.
- 데이터 모델도 `Family`가 아니라 범용 `Group`으로 설계해서, "가족 가계부"는 이 앱이 지원하는 여러 사용 사례 중 하나가 되도록 합니다.
- 대신 UX 상에서 그룹 생성 시 "어떤 모임인가요?" 라는 선택지(가족 / 형제자매 / 룸메이트 / 커플 / 부부 / 모임·동아리 / 기타)를 프리셋으로 제공해서, 이름 짓기 부담은 줄이되 구조는 자유롭게 둡니다.
  - **커플과 부부를 분리한 이유:** 커플은 "사귀는 사이"로 지출이 대체로 데이트/이벤트성이고, 부부는 "생활 공동체"로 고정비(관리비, 보험, 자녀 관련 등)와 장기 지출 패턴이 섞여 있어 카테고리 기본값이나 온보딩 문구를 다르게 보여주면 체감 완성도가 높아집니다. 다만 로직/스키마 상 둘의 차이는 `groupType` 값 하나뿐이며, 권한·공유 구조는 완전히 동일합니다.

**핵심 차별화 3가지**
1. 영수증 실물 촬영 → AI가 자동으로 정보 입력 (OCR)
2. 간편결제(카카오페이/토스/네이버페이) 결제완료 캡쳐 → AI가 자동으로 정보 입력 (OCR)
3. **사용자가 정의하는 그룹 단위 공유 피드** (본인 지출만 수정, 그룹 내 전체 조회 가능)

**제작 기간: 1~2주 (7~14일)**

이 기간에 Phase 1~6을 전부 욕심내면 완성도가 떨어질 위험이 큽니다. 아래처럼 **필수(Must)**와
**스트레치(시간 남으면)**를 나눠서, 필수만 끝내도 데모가 되는 구조로 잡았습니다.

| 구분 | Phase / Task | 이유 |
|---|---|---|
| **필수 (Must)** | Phase 1 (셋업/인증/그룹), Phase 2 Task 2-1·2-2 (수기 CRUD), Phase 3 (영수증 OCR 자동 입력), Phase 5 (그룹 피드) | 이 4개만 있어도 "찍으면 자동 기록되고, 그룹과 공유된다"는 핵심 스토리가 완성됨 |
| **스트레치 (시간 되면)** | Phase 2 Task 2-3·2-4 (그룹 유형별 카테고리 프리셋), Phase 4 (간편결제 캡쳐 OCR), Phase 6 (월별 리포트) | 있으면 좋지만 없어도 핵심 데모 스토리에 지장 없음 |

**MVP 범위 (이번 팀프로젝트 목표)**
- 포함(필수): 인증, 그룹 생성/초대(그룹명·유형 자유 설정), 수기 지출 입력, 영수증 촬영 시 AI 자동 입력, 공유 토글, 그룹 피드
- 포함(스트레치): 간편결제 캡쳐 OCR, 그룹 유형별 카테고리 프리셋, 월별 리포트
- 제외(향후 확장): 정산/더치페이 자동계산, 은행 자동연동, 예산 알림 푸시, 다국어, 한 유저의 다중 그룹 동시 표시 대시보드

---

## 1. 기술 스택 (2026-09-08 팀 결정: 프론트+Supabase로 변경)

> 원래 이 문서는 Node/Express 커스텀 백엔드를 전제로 쓰였으나, 팀이 1주 일정에 맞춰 **백엔드 서버를 직접 짜지 않고 Supabase(BaaS)로 대체**하기로 결정했다. 아래 표가 최종 기준이며, 이 문서 뒤쪽의 "2. 전체 아키텍처"·"Agent 프롬프트 예시"들은 여전히 Express+Prisma 기준으로 적혀 있어 Supabase 클라이언트 SDK 호출로 바꿔 읽어야 한다(추후 갱신 필요).

| 영역 | 선택 | 비고 |
|---|---|---|
| 프론트엔드 | React + TypeScript + Vite | 팀원 다수가 익숙한 스택 우선 |
| 스타일 | Tailwind CSS | 빠른 개발 속도 |
| 백엔드 | **(없음) Supabase가 대체** | Express/NestJS 서버를 직접 짜지 않음 |
| DB | **Supabase (PostgreSQL)** | 기존 Prisma 스키마(Group/GroupMember/Expense/ExpenseOcrRaw)를 그대로 SQL 테이블로 이관 |
| 권한 | **Supabase RLS (Row Level Security)** | "본인 지출만 수정·삭제", "그룹 멤버만 피드 조회" 등 04-features.md·05-policy.md의 정책을 DB 레벨 정책으로 구현 |
| 이미지 스토리지 | **Supabase Storage** | 영수증/캡쳐 이미지 저장 (AWS S3 대체) |
| OCR 엔진 | Naver Clova OCR 또는 Google Cloud Vision API | 직접 OCR 모델 구현 X, API 호출로 대체. **키 노출 방지를 위해 Supabase Edge Function을 통해 호출**(프론트에서 직접 호출 금지) |
| 인증 | **Supabase Auth (이메일/비밀번호)** | 자체 JWT 구현 대신 Supabase Auth 세션 토큰 사용 |
| 배포 | Vercel(프론트) + Supabase(DB·Auth·Storage·Edge Function) | 별도 백엔드 서버 배포 불필요 |

> 이 변경은 04-features.md·05-policy.md의 요구·정책 자체는 그대로 두고, "어떻게 구현하는지"만 바꾼 것이다 — 예를 들어 05-policy.md의 P4·P5·P6·P9(그룹 멤버·본인 소유 검증)는 백엔드 미들웨어 대신 Supabase RLS 정책으로 구현한다.

---

## 2. 전체 아키텍처 (Supabase 기준, 2026-09-08 갱신)

```
[React SPA]
    │  supabase-js SDK (Supabase Auth 세션)
    ├──────────────▶ [Supabase Auth]  (회원가입/로그인)
    ├──────────────▶ [Supabase Postgres DB]  (groups / group_members / expenses / expense_ocr_raw, RLS로 권한 강제)
    ├──────────────▶ [Supabase Storage]  (영수증/캡쳐 이미지 저장)
    └── 영수증 촬영 시 ──▶ [Supabase Edge Function: parse-receipt]
                              │  (OCR 키를 여기 안에서만 사용 — 프론트에 노출 안 함)
                              ▼
                    [Clova/Vision OCR API 호출]
                              │
                              ▼
                    파싱 결과를 Edge Function이 그대로 DB에 insert
                    (expenses + expense_ocr_raw, sourceType=RECEIPT)
```
별도 백엔드 서버(Express/Nest)는 두지 않는다. 프론트가 Supabase를 직접 호출하고, OCR처럼 비밀키가 필요한 부분만 Edge Function 하나로 처리한다.

---

## 3. DB 스키마 (Supabase/PostgreSQL SQL, 2026-09-08 갱신 — 그대로 SQL Editor에 붙여넣기 가능)

`User`는 별도 테이블을 만들지 않는다 — Supabase Auth가 제공하는 `auth.users`를 그대로 쓴다.

```sql
-- 1) enum 타입
create type group_type as enum ('FAMILY','SIBLING','ROOMMATE','COUPLE','MARRIED_COUPLE','CLUB','OTHER');
create type member_role as enum ('OWNER','MEMBER');
create type source_type as enum ('MANUAL','RECEIPT','PAYMENT_CAPTURE');

-- 2) 테이블
create table groups (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,                          -- 자유 텍스트 (예: "우리집", "204호 자취팀")
  group_type   group_type not null default 'OTHER',     -- 표시용, 권한/로직에 관여 안 함
  invite_code  text not null unique,
  created_at   timestamptz not null default now()
);

create table group_members (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id),
  group_id   uuid not null references groups(id) on delete cascade,
  role       member_role not null default 'MEMBER',      -- OWNER | MEMBER (04 F18 그룹장 위임 시 이 값을 바꿔치기)
  nickname   text,
  joined_at  timestamptz not null default now(),
  unique (user_id, group_id)
);

create table expenses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id),  -- 작성자 = 소유자, 수정 권한 판단 기준
  group_id     uuid references groups(id) on delete set null,
  amount       integer not null,
  category     text not null,
  memo         text,
  date         date not null,
  source_type  source_type not null default 'MANUAL',
  image_url    text,
  is_shared    boolean not null default false,           -- 그룹과 공유 토글 (R12)
  created_at   timestamptz not null default now()
);

create table expense_ocr_raw (
  id           uuid primary key default gen_random_uuid(),
  expense_id   uuid not null unique references expenses(id) on delete cascade,
  raw_text     text,                                     -- OCR 원문 (디버깅/재파싱용)
  parsed_json  jsonb,                                    -- 가맹점명·금액·날짜 등 파싱 결과
  ocr_provider text,                                      -- 'clova' | 'google-vision'
  confidence   real,
  created_at   timestamptz not null default now()
);

-- 3) RLS 활성화 + 정책 (05-policy.md P1~P10을 DB 레벨로 구현)
alter table groups enable row level security;
alter table group_members enable row level security;
alter table expenses enable row level security;
alter table expense_ocr_raw enable row level security;

-- groups: 멤버만 조회, 로그인 유저는 누구나 생성, 그룹명 변경은 OWNER만 (P2)
create policy groups_select_member_only on groups for select
  using (exists (select 1 from group_members gm where gm.group_id = groups.id and gm.user_id = auth.uid()));
create policy groups_insert_any_authenticated on groups for insert
  with check (auth.uid() is not null);
create policy groups_update_owner_only on groups for update
  using (exists (select 1 from group_members gm where gm.group_id = groups.id and gm.user_id = auth.uid() and gm.role = 'OWNER'));

-- group_members: 같은 그룹 멤버끼리만 목록 조회, 참여(insert)는 본인 것만, role 변경(위임)은 OWNER만 (P10)
create policy members_select_same_group on group_members for select
  using (exists (select 1 from group_members gm2 where gm2.group_id = group_members.group_id and gm2.user_id = auth.uid()));
create policy members_insert_self on group_members for insert
  with check (user_id = auth.uid());
create policy members_update_owner_transfers_role on group_members for update
  using (exists (select 1 from group_members gm where gm.group_id = group_members.group_id and gm.user_id = auth.uid() and gm.role = 'OWNER'));

-- expenses: 본인 지출 전체 CRUD (P4·P6), 그룹 멤버는 공유된 지출만 조회 (P5)
create policy expenses_select_own on expenses for select
  using (user_id = auth.uid());
create policy expenses_select_shared_group_feed on expenses for select
  using (is_shared = true and group_id is not null and exists (
    select 1 from group_members gm where gm.group_id = expenses.group_id and gm.user_id = auth.uid()
  ));
create policy expenses_insert_own_group_member_check on expenses for insert
  with check (user_id = auth.uid() and (group_id is null or exists (
    select 1 from group_members gm where gm.group_id = expenses.group_id and gm.user_id = auth.uid()
  )));
create policy expenses_update_own_only on expenses for update using (user_id = auth.uid());
create policy expenses_delete_own_only on expenses for delete using (user_id = auth.uid());

-- expense_ocr_raw: 본인 지출에 딸린 것만 조회
create policy ocr_raw_select_own on expense_ocr_raw for select
  using (exists (select 1 from expenses e where e.id = expense_ocr_raw.expense_id and e.user_id = auth.uid()));
```

**설계 포인트**
- `groups.name`은 자유 텍스트라 "가족", "삼형제", "204호 자취팀" 등 뭐든 가능
- `group_type`은 순전히 표시(아이콘/색상)나 온보딩 문구 분기용이며, 권한이나 핵심 로직에는 전혀 관여하지 않음 → 나중에 유형이 늘어나도 스키마 변경 없이 enum 값만 추가하면 됨
- 한 유저가 여러 그룹에 동시에 속할 수 있음(`group_members`가 다대다) → 이번 MVP에서는 "현재 활성 그룹" 하나를 프론트 상태로 선택해서 쓰는 방식으로 단순화 추천
- **F18(그룹장 위임)**: 나가려는 OWNER가 다른 멤버의 `group_members.role`을 `'OWNER'`로 먼저 바꾼 뒤 본인 멤버십 행을 삭제하는 순서로 프론트에서 구현(트랜잭션처럼 두 쿼리를 순서대로 실행)
- **그룹원이 OWNER 혼자뿐인 경우(05-policy.md 확정 규칙)**: 위임 없이 나가면서 `groups` 행 자체를 삭제 — `expenses.group_id`는 `on delete set null`이라 그 그룹 지출은 개인 지출로 남고, `group_members`는 `on delete cascade`라 자동으로 같이 삭제됨

**권한 체크 핵심 로직 (위 RLS 정책과 1:1로 대응)**
- 본인 지출 수정/삭제: `expenses.user_id = auth.uid()` 인 경우만 허용
- 그룹 피드 조회: `expenses.group_id = 조회하려는 groupId` AND `is_shared = true` AND `auth.uid()가 해당 group의 멤버`
- 그룹 전체 조회 권한: `group_members`에 속해있으면 role 무관하게 조회 가능(수정은 OWNER만)

---

## 4. 기능 모듈 & Task Breakdown

> 각 Task는 "완료 조건(DoD)"을 만족해야 다음 Task로 넘어갑니다.
> "Agent 프롬프트 예시"는 그대로 복사해서 쓸 수 있도록 작성했습니다. 프로젝트 경로/스택명만 실제 값으로 바꿔 쓰세요.

### Phase 1. 프로젝트 셋업 & 인증/그룹

#### Task 1-1. 프로젝트 초기 세팅 (Supabase 기준, 2026-09-08 갱신)
- **목표:** 프론트 전용 프로젝트 뼈대 생성 + Supabase 프로젝트 연결 (백엔드 폴더 없음)
- **DoD:** `npm run dev`로 프론트 로컬 구동, `supabase.auth.getSession()` 호출이 에러 없이 응답 (연결 확인). Supabase 프로젝트의 SQL Editor에 위 "3. DB 스키마" SQL을 실행해 테이블·RLS까지 만들어둔 상태
- **지금 바로 할 일 (코드 짜기 전에)**
  1. supabase.com에서 새 프로젝트 생성
  2. SQL Editor에 위 3번 섹션의 SQL 전체(테이블+enum+RLS 정책)를 붙여넣고 실행
  3. Project Settings → API 에서 Project URL과 anon public key 복사해둠
- **Agent 프롬프트 예시:**
  ```
  React + TypeScript + Vite + Tailwind 프론트엔드 프로젝트 뼈대를 만들어줘.
  백엔드 폴더는 만들지 않는다 — Supabase를 BaaS로 바로 쓸 것이다.
  @supabase/supabase-js를 설치하고, src/lib/supabaseClient.ts에서
  import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY로
  createClient()해서 export하는 코드를 만들어줘.
  .env.example 파일도 만들어줘 (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
  ```

#### Task 1-2. 회원가입/로그인 (Supabase Auth, 2026-09-08 갱신)
- **목표:** 이메일/비밀번호 회원가입·로그인 화면, Supabase Auth 세션으로 로그인 상태 유지
- **DoD:** 회원가입→로그인→새로고침해도 로그인 상태 유지→로그아웃까지 화면에서 테스트 통과
- **Agent 프롬프트 예시:**
  ```
  Task 1-1에서 만든 supabaseClient를 사용해서 로그인/회원가입 화면을 만들어줘.
  - 회원가입: supabase.auth.signUp({ email, password })
  - 로그인: supabase.auth.signInWithPassword({ email, password })
  - 로그아웃: supabase.auth.signOut()
  - 로그인 상태는 supabase.auth.onAuthStateChange로 구독해서 전역 상태(Context 또는 zustand)에 반영
  - JWT나 자체 미들웨어는 필요 없다 — Supabase 세션이 이미 그 역할을 한다
  - 로그인 안 한 상태에서는 보호된 화면(그룹·지출) 대신 로그인 화면으로 리다이렉트
  ```

#### Task 1-3. 그룹 생성 & 초대 코드 (Supabase 클라이언트 직접 호출, 2026-09-08 갱신)
- **목표:** 그룹 생성 시 이름과 유형을 사용자가 직접 지정, OWNER로 등록, 랜덤 초대 코드 발급, 초대 코드로 그룹 참여
- **DoD:** "가족"이 아닌 임의의 이름("자취팀" 등)과 유형으로 그룹 생성 → 초대코드 확인 → 다른 계정으로 로그인해서 코드 입력 → 멤버 목록에 추가 확인 (백엔드 API 없이 프론트에서 supabase-js로 직접 확인)
- **Agent 프롬프트 예시:**
  ```
  supabaseClient를 사용해서 다음을 구현하는 함수들을 만들어줘(src/api/groups.ts):
  - createGroup(name, groupType): 8자리 랜덤 영숫자 inviteCode를 만들어
    groups 테이블에 insert한 뒤, 반환된 group.id로 group_members에
    { user_id: 현재 로그인 유저, role: 'OWNER' } 행을 insert
  - joinGroup(inviteCode): invite_code로 groups를 조회해 group.id를 찾고,
    group_members에 { user_id: 현재 유저, role: 'MEMBER' } insert
    (이미 멤버면 unique 제약 위반 에러가 나므로 그 에러를 잡아서
    "이미 참여한 그룹입니다" 메시지로 바꿔줘)
  - getMyGroups(): 현재 유저가 속한 group_members를 groups와 join해서
    (name, group_type, role) 목록으로 반환
  - getGroupMembers(groupId): 해당 그룹의 group_members 목록 반환
    (RLS가 이미 "같은 그룹 멤버만 조회 가능"을 강제하니 별도 권한 체크 코드는 필요 없음)
  - renameGroup(groupId, newName): groups.update — RLS가 OWNER만 허용하므로
    OWNER가 아니면 자동으로 실패함(그 에러를 화면에서 안내만 해주면 됨)
  ```

#### Task 1-4. 프론트 - 그룹 생성/참여 화면 (온보딩)
- **목표:** "가족"을 강요하지 않고 사용자가 그룹 성격과 이름을 직접 고르는 온보딩 플로우
- **DoD:** 유형 프리셋 선택 → 이름 직접 입력 → 그룹 생성 완료까지 3단계 이내
- **Agent 프롬프트 예시:**
  ```
  React + Tailwind로 그룹 생성 온보딩 화면(GroupCreateFlow)을 만들어줘.
  1단계: "어떤 모임인가요?" 카드형 선택지 (가족 / 형제자매 / 룸메이트 / 커플 / 부부 / 모임·동아리 / 기타)
        → 각 카드 선택 시 groupType 값으로 매핑 (부부는 MARRIED_COUPLE, 커플은 COUPLE)
  2단계: "그룹 이름을 지어주세요" 텍스트 입력 (플레이스홀더는 선택한 유형에 따라 예시를 다르게 보여줌,
        예: 가족 선택 시 "우리집", 룸메이트 선택 시 "204호 자취팀", 커플 선택 시 "우리 둘",
        부부 선택 시 "OO네 살림")
  3단계: 생성 완료 화면 + 초대 코드/링크 공유 버튼(클립보드 복사)
  Task 1-3에서 만든 createGroup() 함수를 호출해줘. 그룹 참여(코드 입력) 화면도
  별도로 만들어서 joinGroup()을 호출해줘.
  ```

> **Phase 2·3·5의 "Agent 프롬프트 예시"는 아직 Express API(`POST /expenses` 등) 기준으로 적혀 있다.** 실제로 쓸 때는 "이 API를 만들어줘" 대신 "Task 1-3처럼 supabaseClient로 이 기능을 하는 함수를 만들어줘"로 바꿔 읽으면 된다 — 테이블 이름과 필드명은 위 3번 섹션 SQL과 그대로 대응된다(예: `POST /expenses`→`expenses` 테이블 insert, `PATCH /expenses/:id`→`expenses` update, 권한 체크는 이미 RLS가 강제하므로 별도 코드 불필요).

---

### Phase 2. 지출 CRUD (수기 입력) — [필수: Task 2-1, 2-2] / [스트레치: Task 2-3, 2-4]

#### Task 2-1. 지출 등록/조회/수정/삭제 API
- **목표:** 기본 CRUD, 권한 체크 로직 포함
- **DoD:** 본인 지출만 수정/삭제 가능하고 타인 지출 수정 시 403 반환되는 것까지 테스트
- **Agent 프롬프트 예시:**
  ```
  Expense 모델 기준으로 다음 API를 구현해줘:
  - POST /expenses : amount, category, memo, date, groupId(선택), isShared(선택, 기본 false)를
    받아 sourceType=MANUAL로 등록. groupId가 있으면 요청자가 해당 그룹 멤버인지 검증 후 등록.
  - GET /expenses : 로그인한 유저 본인의 지출 목록 조회 (date 내림차순, 페이지네이션 적용,
    query: page, limit, category, startDate, endDate 필터 지원)
  - PATCH /expenses/:id : 본인 소유 지출만 수정 가능, 아니면 403 반환
  - DELETE /expenses/:id : 본인 소유 지출만 삭제 가능, 아니면 403 반환
  ```

#### Task 2-2. 프론트 - 지출 입력/목록 화면
- **목표:** 수기 입력 폼 + 지출 리스트 화면
- **DoD:** 입력→목록 반영→수정→삭제 플로우가 화면에서 끊김 없이 동작
- **Agent 프롬프트 예시:**
  ```
  React + Tailwind로 다음 화면 두 개를 만들어줘:
  1. 지출 입력 폼 (ExpenseForm) : 금액, 카테고리(select), 메모(textarea), 날짜(date picker),
     사용자가 속한 그룹이 있으면 "어느 그룹과 공유할까요?" select(속한 그룹 목록 중 선택, "공유 안 함" 옵션 포함)
  2. 지출 목록 (ExpenseList) : 월별 그룹핑된 리스트, 항목 클릭 시 수정 폼으로 전환,
     스와이프 또는 버튼으로 삭제
  API는 앞서 만든 /expenses, /groups/mine 엔드포인트를 axios로 호출해줘. 상태관리는 React Query를 사용해줘.
  ```

#### Task 2-3. 그룹 유형별 카테고리 프리셋 (백엔드)
- **목표:** `groupType`에 따라 다른 기본 카테고리 목록을 제공해서, 부부는 "관리비/보험/자녀 양육비" 같은 고정비 위주로, 커플은 "데이트/기념일/여행" 같은 이벤트성 위주로 첫 화면부터 카테고리가 다르게 보이게 함
- **DoD:** `groupType`별로 API가 서로 다른 카테고리 배열을 반환하고, 커스텀 카테고리 입력도 항상 가능함을 확인
- **설계 메모:** 이 프리셋은 사용자별 데이터가 아니라 정적 매핑이므로 DB 테이블을 새로 만들 필요 없이 코드 상수(`CATEGORY_PRESETS`)로 관리하고, API는 이 상수를 groupType으로 조회해 반환하는 얇은 레이어로 충분함
- **기본 프리셋 예시(그대로 구현에 사용 가능):**
  ```
  FAMILY(가족): 식비, 생활용품, 교육비, 의료비, 관리비, 통신비, 여가/문화, 기타
  SIBLING(형제자매): 식비, 경조사, 선물, 여행, 기타
  ROOMMATE(룸메이트): 관리비, 식비/장보기, 생활용품, 공과금, 기타
  COUPLE(커플): 데이트, 선물, 기념일, 여행, 카페/식사, 기타
  MARRIED_COUPLE(부부): 관리비, 보험, 식비, 자녀 양육비, 교육비, 의료비, 경조사, 기타
  CLUB(모임/동아리): 회비, 행사비, 식비, 기타
  OTHER(기타): 식비, 교통, 생활용품, 기타
  ```
- **Agent 프롬프트 예시:**
  ```
  groupType별 기본 카테고리 프리셋을 다음과 같이 상수로 정의해줘 (constants/categoryPresets.ts):
  FAMILY: ["식비","생활용품","교육비","의료비","관리비","통신비","여가/문화","기타"]
  SIBLING: ["식비","경조사","선물","여행","기타"]
  ROOMMATE: ["관리비","식비/장보기","생활용품","공과금","기타"]
  COUPLE: ["데이트","선물","기념일","여행","카페/식사","기타"]
  MARRIED_COUPLE: ["관리비","보험","식비","자녀 양육비","교육비","의료비","경조사","기타"]
  CLUB: ["회비","행사비","식비","기타"]
  OTHER: ["식비","교통","생활용품","기타"]

  이 상수를 사용하는 GET /category-presets?groupType=FAMILY API를 만들어줘.
  - query로 groupType을 받아 해당 배열을 반환 (없거나 잘못된 값이면 OTHER 배열로 폴백)
  - 응답 형식: { groupType, categories: string[] }
  - groupId를 대신 받아서(query: groupId) 해당 그룹의 groupType을 DB에서 조회한 뒤 프리셋을 반환하는 방식도 함께 지원해줘
    (groupType과 groupId 둘 중 하나만 있으면 됨)
  ```

#### Task 2-4. 프론트 - 카테고리 select에 그룹 유형별 프리셋 반영
- **목표:** 지출 입력 폼에서 선택된 그룹의 유형에 맞는 카테고리가 자동으로 채워지고, 직접 입력도 가능하게 함
- **DoD:** 부부 그룹 선택 시 카테고리 select에 "관리비/보험/자녀 양육비" 등이 뜨고, 개인 지출(그룹 미선택)일 때는 OTHER 프리셋이 기본으로 뜸
- **Agent 프롬프트 예시:**
  ```
  Task 2-2에서 만든 ExpenseForm을 수정해줘.
  - "어느 그룹과 공유할까요?" select에서 그룹을 선택하면, 해당 그룹의 groupId로
    GET /category-presets?groupId=... 를 호출해서 카테고리 select 옵션을 그 결과로 교체
  - 그룹을 선택하지 않은 경우(개인 지출)에는 groupType=OTHER 기준 프리셋을 기본으로 사용
  - 카테고리 select 맨 아래에 "직접 입력" 옵션을 추가해서, 선택 시 텍스트 입력 필드로 전환되게 해줘
    (프리셋에 없는 카테고리도 자유롭게 쓸 수 있어야 함)
  ```

---

### Phase 3. 실물 영수증 촬영 OCR — [필수] "촬영하면 AI가 알아서 입력"

#### Task 3-1. 이미지 업로드 & S3 저장
- **목표:** 프론트에서 촬영/선택한 이미지를 백엔드 거쳐 S3에 저장, URL 반환
- **DoD:** 이미지 업로드 후 S3 URL로 브라우저에서 직접 접근 가능
- **Agent 프롬프트 예시:**
  ```
  multer + AWS SDK(S3)를 사용해서 POST /uploads/receipt API를 만들어줘.
  - multipart/form-data로 이미지 하나를 받음
  - 업로드 전 sharp로 리사이징(최대 1600px) 및 압축
  - S3에 "receipts/{userId}/{uuid}.jpg" 경로로 저장
  - 저장된 이미지의 public URL을 응답으로 반환
  ```

#### Task 3-2. 영수증 OCR 파싱 & 자동 등록
- **목표:** 업로드된 영수증 이미지를 OCR API에 넘겨 가맹점명/금액/날짜를 추출하고, **사용자 입력 없이 바로 지출로 자동 등록**
- **DoD:** 실제 영수증 사진 3~5장으로 테스트 시 금액 필드 90% 이상 정확 추출되고, 별도 확인 화면 없이 목록에 자동으로 지출 항목이 생성됨
- **자동화 원칙:** OCR이 실패하거나 금액을 못 찾은 필드는 `0`이나 빈 값으로 두지 말고, 사용자가 나중에 목록에서 눈치채고 고칠 수 있도록 카테고리를 "확인 필요"로, 메모에 "자동 인식 실패 - 확인해주세요"를 자동으로 채워서 저장 (저장은 항상 성공시키고, 품질 문제는 사후 수정으로 처리)
- **Agent 프롬프트 예시:**
  ```
  Naver Clova OCR API를 호출하는 서비스 함수(ocrService.parseReceipt)를 만들어줘.
  - 입력: S3 이미지 URL
  - Clova OCR General API를 호출해서 텍스트 블록 배열을 받음
  - 정규식/휴리스틱으로 다음 필드를 추출: merchantName(가맹점명), totalAmount(합계금액),
    purchaseDate(구매일시), category(가맹점명 키워드 기반 간단 추정: "마트/편의점"→식비,
    "약국"→의료비, 매칭 안되면 "확인 필요"). "합계", "총액", "결제금액" 등의 키워드 근처
    숫자를 금액으로 우선 매칭
  - 추출 실패 시 해당 필드는 null로 두되, totalAmount가 null이면 amount=0,
    category="확인 필요", memo="자동 인식 실패 - 확인해주세요"로 채워서 절대 저장 자체가
    실패하지 않게 해줘
  - POST /expenses/from-receipt API를 만들어줘: imageUrl을 받아서
    1) OCR 실행 → 2) 파싱 결과를 ExpenseOcrRaw에 저장 → 3) 파싱 결과로 Expense를
    sourceType=RECEIPT, isShared=false 기본값으로 즉시 생성(DB insert)까지 한 번에 처리하고
    생성된 Expense를 응답으로 반환 (사용자의 추가 확인/저장 액션 없이 완료되는 구조)
  ```

#### Task 3-3. 프론트 - 영수증 촬영 화면 (자동 등록, 후수정 가능)
- **목표:** 카메라로 찍기만 하면 끝 — 별도 확인 화면 없이 자동으로 지출 목록에 추가되고, 필요하면 나중에 목록에서 수정
- **DoD:** 촬영 1탭 → 로딩 → "등록 완료" 토스트까지, 사용자의 추가 입력 없이 완료
- **Agent 프롬프트 예시:**
  ```
  React에서 <input type="file" accept="image/*" capture="environment"> 를 이용한
  영수증 촬영 화면을 만들어줘.
  - 촬영/선택 즉시 업로드 API(Task 3-1) 호출 → 반환된 imageUrl로 곧바로
    POST /expenses/from-receipt 호출 (중간에 사용자 확인 폼을 보여주지 않음)
  - 처리 중에는 "영수증을 읽고 있어요..." 로딩 스피너 표시
  - 성공 시 "OO원, XX마트 지출이 자동으로 등록됐어요" 형태의 토스트/스낵바를 보여주고
    바로 지출 목록 화면으로 이동해서 방금 등록된 항목이 맨 위에 보이게 함
  - category가 "확인 필요"로 등록된 항목은 목록에서 배지(뱃지)로 눈에 띄게 표시해서
    사용자가 나중에 탭해서 쉽게 수정할 수 있게 해줘 (Task 2-2의 수정 폼 재사용)
  ```

---

### Phase 4. 간편결제 캡쳐 이미지 OCR — [스트레치] 시간 남으면 진행

#### Task 4-1. 결제 캡쳐 포맷 분류 & 파싱
- **목표:** 카카오페이/토스/네이버페이 등 결제완료 화면 캡쳐에서 가맹점/금액/시각 추출
- **DoD:** 3개 앱 캡쳐 샘플 각 3장씩(총 9장) 기준 파싱 정확도 확인
- **Agent 프롬프트 예시:**
  ```
  Task 3-2에서 만든 ocrService에 parsePaymentCapture 함수를 추가해줘.
  - 입력: S3 이미지 URL
  - OCR로 텍스트 블록을 받은 후, 다음 키워드로 포맷을 분류:
    "카카오페이" 포함 → KAKAO_PAY, "toss" 또는 "토스" 포함 → TOSS,
    "네이버페이" 포함 → NAVER_PAY, 매칭 안되면 UNKNOWN
  - 포맷별로 별도의 파싱 룰(각 앱의 "결제금액", "가맹점명", "결제일시" 위치/키워드가 다르므로
    분기 처리)을 적용해서 merchantName, totalAmount, paidAt을 추출
  - UNKNOWN인 경우 일반 키워드 매칭(Task 3-2 로직)으로 폴백
  - POST /expenses/from-payment-capture API로 노출 (Task 3-2와 동일하게, 확인 화면 없이
    바로 Expense를 자동 등록하고 생성된 결과를 응답으로 반환. 추출 실패 필드는 동일하게
    category="확인 필요", memo="자동 인식 실패 - 확인해주세요"로 채워서 저장)
  ```

#### Task 4-2. 프론트 - 결제 캡쳐 업로드 화면
- **목표:** 갤러리에서 캡쳐 이미지 선택 → 자동 등록 (Task 3-3과 동일한 UX)
- **DoD:** Task 3-3과 동일하게 선택 1탭으로 등록 완료
- **Agent 프롬프트 예시:**
  ```
  Task 3-3에서 만든 영수증 촬영 화면을 참고해서, 갤러리에서 이미지를 선택하는
  "간편결제 캡쳐 등록" 화면을 만들어줘. API만 /expenses/from-payment-capture로 바꾸고
  UI 흐름(선택→자동 등록→완료 토스트)은 동일하게 가져가줘.
  ```

---

### Phase 5. 그룹 공유 피드 — [필수]

#### Task 5-1. 그룹 피드 API
- **목표:** 그룹 내 isShared=true인 지출만 모아 조회
- **DoD:** 멤버 A가 공유한 지출이 멤버 B 화면에 노출, 비공유 지출은 노출 안 됨. 그룹 유형과 무관하게 동일 로직 동작.
- **Agent 프롬프트 예시:**
  ```
  GET /groups/:groupId/feed API를 만들어줘.
  - 로그인한 유저가 해당 groupId의 멤버인지 확인 (아니면 403)
  - groupId가 일치하고 isShared=true인 Expense를 date 내림차순으로 조회
  - 응답에 작성자 이름(user.name) 또는 GroupMember.nickname(있으면 우선)을 함께 포함
  - 페이지네이션(page, limit) 지원
  ```

#### Task 5-2. 프론트 - 그룹 피드 화면
- **목표:** 누가 언제 얼마를 썼는지 타임라인 형태로 표시, 여러 그룹에 속한 경우 그룹 전환 가능
- **DoD:** 작성자 아바타/이름, 금액, 카테고리, 메모가 카드 형태로 표시. 상단에서 그룹 전환 가능.
- **Agent 프롬프트 예시:**
  ```
  React로 GroupFeed 화면을 만들어줘.
  - 상단에 소속 그룹 선택 드롭다운 (GET /groups/mine 결과 사용, 그룹명 그대로 표시)
  - 선택된 groupId로 GET /groups/:groupId/feed를 호출해서 카드 리스트로 렌더링
  - 각 카드에는 작성자 이름(또는 닉네임), 금액, 카테고리 아이콘, 메모, 날짜를 표시
  - 무한 스크롤(react-query의 useInfiniteQuery)로 페이지네이션 처리해줘
  ```

---

### Phase 6. 리포트/통계 — [스트레치] 시간 남으면 진행

#### Task 6-1. 월별 리포트 API
- **목표:** 개인/그룹 단위 월별 총지출, 카테고리별 비중 계산
- **DoD:** 특정 월 파라미터로 요청 시 카테고리별 합계와 전체 합계가 정확히 일치
- **Agent 프롬프트 예시:**
  ```
  GET /reports/monthly API를 만들어줘.
  - query: yearMonth(예: "2026-09"), groupId(선택, 없으면 본인 개인 지출 기준)
  - groupId가 있으면 요청자가 해당 그룹 멤버인지 검증 후, 해당 그룹의 isShared=true 지출 전체를 대상으로,
    없으면 요청자 본인의 전체 지출을 대상으로 집계
  - 응답: { totalAmount, byCategory: [{ category, amount, percentage }], memberCount(있으면) }
  - Prisma의 groupBy를 사용해서 category별 합계를 계산해줘
  ```

#### Task 6-2. 프론트 - 리포트 화면
- **목표:** 카테고리별 비중을 파이차트/바차트로 시각화
- **DoD:** 월 선택 시 차트가 즉시 갱신됨
- **Agent 프롬프트 예시:**
  ```
  React + recharts로 MonthlyReport 화면을 만들어줘.
  - 상단에 월 선택 드롭다운(YYYY-MM)
  - GET /reports/monthly 호출 결과로 도넛 차트(카테고리별 비중) + 카테고리별 리스트 표시
  - 소속 그룹이 있으면 "개인" / 소속 그룹명(들) 토글 버튼으로 groupId 유무를 전환
  ```

---

## 5. API 명세 요약

| Method | Endpoint | 설명 | 인증 |
|---|---|---|---|
| POST | /auth/signup | 회원가입 | X |
| POST | /auth/login | 로그인 | X |
| POST | /groups | 그룹 생성 (이름/유형 사용자 지정) | O |
| POST | /groups/join | 초대코드로 그룹 참여 | O |
| GET | /groups/mine | 내가 속한 그룹 목록 조회 | O |
| GET | /groups/:id/members | 그룹 멤버 조회 | O |
| PATCH | /groups/:id | 그룹명 변경 (OWNER만) | O |
| GET | /category-presets | 그룹 유형별 기본 카테고리 프리셋 조회 | O |
| POST | /expenses | 지출 등록 (수기) | O |
| GET | /expenses | 본인 지출 목록 조회 | O |
| PATCH | /expenses/:id | 지출 수정 (본인만) | O |
| DELETE | /expenses/:id | 지출 삭제 (본인만) | O |
| POST | /uploads/receipt | 이미지 업로드 (S3) | O |
| POST | /expenses/from-receipt | 영수증 OCR 파싱 + 자동 등록 (확인 화면 없음) | O |
| POST | /expenses/from-payment-capture | 결제캡쳐 OCR 파싱 + 자동 등록 (확인 화면 없음) | O |
| GET | /groups/:groupId/feed | 그룹 공유 피드 조회 | O |
| GET | /reports/monthly | 월별 리포트 | O |

---

## 6. 팀 분담 제안 (4인 기준 예시)

| 역할 | 담당 Task | 비고 |
|---|---|---|
| 백엔드 A | 1-1, 1-2, 1-3, 5-1, 6-1 | 인증/그룹/피드/리포트 |
| 백엔드 B | 2-1, 2-3, 3-1, 3-2, 4-1 | CRUD + 카테고리 프리셋 + OCR 파싱 |
| 프론트 A | 1-4, 5-2, 6-2 | 온보딩/피드/리포트 화면 |
| 프론트 B | 2-2, 2-4, 3-3, 4-2 | 입력/카테고리 프리셋/촬영/캡쳐 업로드 화면 |

> 인원이 다르면 Phase 단위로 나누는 것을 추천합니다 (Phase 1~2 / Phase 3~4 / Phase 5~6).

---

## 7. 마일스톤 (1~2주 기준, 일 단위)

**팀 인원 2~3명 기준 예시 — 백엔드/프론트를 겸하며 Task 단위로 병렬 진행 가정**

| 일차 | 목표 | 비고 |
|---|---|---|
| 1일차 | Task 1-1 (프로젝트 셋업) | 가장 먼저 끝내야 이후 작업이 병렬로 굴러감 |
| 2일차 | Task 1-2 (인증), Task 1-3 (그룹 생성/초대) | 병렬 가능 (백엔드 1명이 순서대로 진행해도 하루면 충분) |
| 3일차 | Task 1-4 (온보딩 화면), Task 2-1 (지출 CRUD API) | 프론트/백엔드 병렬 |
| 4일차 | Task 2-2 (지출 입력/목록 화면) | 여기까지 끝나면 "수기 입력 가능한 가계부"는 완성 |
| 5일차 | Task 3-1 (이미지 업로드), Task 3-2 (영수증 OCR 자동 등록) | OCR API 키 발급은 미리(1일차부터) 신청해두는 것을 추천 |
| 6~7일차 | Task 3-3 (영수증 촬영 화면) + OCR 정확도 튜닝 | 실제 영수증 5장 이상으로 반복 테스트 |
| 7일차 | Task 5-1 (그룹 피드 API), Task 5-2 (그룹 피드 화면) | **여기까지가 1주 핵심 MVP 완료 지점** |
| 8~10일차 | (2주 진행 시) Phase 4 간편결제 캡쳐 OCR (Task 4-1, 4-2) | 스트레치 1순위 |
| 11~12일차 | (2주 진행 시) Phase 2 Task 2-3·2-4 카테고리 프리셋 | 스트레치 2순위 |
| 13일차 | (2주 진행 시) Phase 6 월별 리포트 (Task 6-1, 6-2) | 스트레치 3순위, 시간 없으면 생략 |
| 14일차 | 통합 테스트, 버그 수정, 배포, 발표 자료 준비 | 마지막 하루는 반드시 버퍼로 비워둘 것 |

**1주 안에 끝내야 한다면:** 1~7일차만 진행하고 8일차부터는 통합 테스트/버그 수정/배포 버퍼로 사용하세요. "촬영하면 자동으로 기록되고 그룹과 공유된다"는 핵심 스토리는 7일차 시점에 이미 완성됩니다.

---

## 사용 팁

- 각 Task 프롬프트는 **이전 Task의 결과물(파일 경로, 함수명)을 참고하라고 명시**하면 Agent가 기존 코드 스타일을 유지합니다. 예: "Task 1-2에서 만든 authMiddleware를 재사용해서"
- Task 하나가 너무 크게 느껴지면 프롬프트를 더 쪼개도 됩니다 (예: 3-2를 "OCR 호출 함수"와 "파싱 로직"으로 분리)
- OCR 정확도 이슈는 자동 등록 시 실패 필드를 "확인 필요" 배지로 표시해서 사후 수정으로 처리하는 안전장치가 있으므로, 초반엔 파싱 완벽도에 너무 시간 쓰지 않는 것을 추천합니다
- 1~2주 일정에서는 OCR API 키 발급(Clova/Vision) 승인 대기 시간이 변수가 될 수 있으니 1일차에 바로 신청해두세요
- 스트레치 항목(간편결제 캡쳐 OCR, 카테고리 프리셋, 리포트)은 발표 직전에 몰아서 넣으려 하지 말고, 필수 항목(Phase 1·2·3·5)이 실제로 안정적으로 동작하는 것을 먼저 확인한 뒤 순서대로 추가하세요
- "가족"이라는 단어는 코드/스키마 어디에도 하드코딩하지 않았습니다. 발표 자료나 마케팅 문구에서 "가족 가계부"를 강조하고 싶다면, `GroupType.FAMILY`를 기본 선택값으로만 두는 정도로 충분합니다
