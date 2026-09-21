> 문서: 06-data.md · 상태: 초안 · 열린 질문 [?] 19개 · 채택한 [제안] 3개 · 마지막 갱신: 화
> 이 문서를 읽는 에이전트에게: 여기 없는 것은 지어내지 말고 질문으로 돌려라. [?] 는 팀이 아직 모르는 것이다.
> 종합 메모: 03-requirements.md(유형 "데이터"인 R) · 04-features.md(입력·결과 열) · 05-policy.md(규칙·상태값)과 `모듈 1 SHY프로젝트 주제 세분화.md`(SHY 스펙, "3. DB 스키마" Supabase/Postgres SQL)를 기본 근거로 삼고, `ShooT 하윤.dc.html`(디자인) 화면에 실제로 쓰인 필드·목록을 대조해 채웠다. SHY 스펙 DB 스키마에 없는 저금(Saving)은 03-05의 R19~R21·F19~F21·P11·P12를 근거로 새로 추가했고, 수입(Income)은 03~05 어디에도 없이 디자인에만 있어 전부 [?]로 표시했다. 이 문서를 만들기 전 팀 인터뷰는 진행하지 않았다 — 기존 문서·디자인만으로 채운 초안이라, [?] 항목은 반드시 팀 확인이 필요하다.
> **2026-09-15 추가**: docs/08-pet-feature-spec.md(저금통 펫 키우기 — 클로드 디자인 프로토타입 기반 신규 제안)를 E9 Pet·E10 WeeklySettlement로 병합했다. 이 두 엔티티는 01~05 어디에도 근거가 없고, 특히 E10은 이 앱에 아직 없는 "예산" 개념에 의존하고 있어 **정책이 정해지기 전엔 구현 착수 금지**(기획 문서 반영만 완료된 상태) — 사용자 요청으로 문서 병합 범위만 진행함.
> **2026-09-15 갱신(종민 확인)**: 아래 E9 `user_id 또는 group_id` 항목과 E10 `budget_amount`·배치 실행 방식 항목 중 일부가 정해졌다 — docs/08-pet-feature-spec.md §9 참고. 나머지 [?]는 그대로 남아 있다.
> **2026-09-15 구현(v1)**: E9·E10·E11을 `supabase/005_pet_feature.sql`(schema.sql에도 반영)로 실제로 만들었다 — P6(그룹 랭킹)만 빼고 P1~P5·P7 화면까지 전부 실제 코드로 연결했다(07-screens.md 「저금통 펫 키우기」 절 참고). E10의 배치 실행은 종민이 정한 Edge Function+cron 대신, 화면을 열 때 그 자리에서 계산하는 방식으로 구현했다 — 이유·상세는 07-screens.md 6번 항목 참고.
> **2026-09-15 통합(v2, 같은 날)**: 사용자가 hybranch·shooTbranch·mg 세 브랜치를 통합 요청 — 참고 이미지("캐릭터 커스텀" 화면)·hybranch의 다마고치형 그룹 공통 반려 캐릭터(F22)·shooTbranch의 목표(예산 대체) 퀘스트 개념·F23(그룹 피드 이모지 반응)을 이번 문서에 반영한다. 충돌 지점은 AskUserQuestion으로 사용자에게 직접 확인했다(아래 각주 참고). 이 통합으로 v1의 `species`(동물 종)·E11 Budget·E10 WeeklySettlement 개념은 폐기됐다 — `supabase/006_pet_v2_and_goals_and_reactions.sql`로 실제 스키마 변경까지 반영, schema.sql도 갱신했다.
> - **개인 펫 vs 그룹 펫 병합 여부**: 사용자 확인 — "하나로 합침(추천)". v1처럼 개인 펫 1마리(user_id)·그룹 펫 1마리(group_id)가 같은 `pets` 테이블 한 행 형태를 그대로 유지하되, 그룹 펫은 hybranch의 F22 반려 캐릭터 개념으로 대체(자동 성장, 수동 밥주기 없음).
> - **성장 단계 수**: 사용자 확인 — "이미지대로 4단계(추천)". v1의 5단계(알→유년기→청소년기→성체→전설)에서 "전설" 단계를 없애고 참고 이미지의 4단계(알→유년기→청소년기→성체)로 축소. 이미지의 "2-Sulking(특별한 상태)"는 5번째 단계가 아니라 청소년기의 "시무룩" 시각 변형이라, DB 컬럼이 아니라 화면에서 계산하는 파생 상태로 구현했다(아래 E9 참고).
> - **마스코트 종류**: 사용자 확인 — "마스코트 하나로 통일(추천)". v1의 종(species: 백호/강아지/고양이/흑룡) 선택 개념을 없애고, 참고 이미지처럼 마스코트 모양은 고정한 채 몸/가계부/가방/눈/잎사귀 5개 부위 색상만 고른다.
> - **목표(예산) 시스템**: 사용자 확인 — "목표 설정으로 대체". shooTbranch의 월별·카테고리별 목표(퀘스트) 개념으로 v1의 E11 Budget(주간 예산)·E10 WeeklySettlement(주간 정산, 절약 비율 비례 보상)를 완전히 대체했다. 목표는 "달성/미달성"만 판정하고 보상은 절약액 비례가 아니라 고정값(퀘스트 클리어 보상)이다.

## 엔티티 목록
| E | 엔티티 | 설명 | 출처 |
|---|---|---|---|
| E1 | Profile (User) | 로그인 계정의 표시용 정보(이름·이메일) | SHY 스펙 "3. DB 스키마" `profiles`(auth.users 미러링) |
| E2 | Group | 그룹(가족·부부·커플·친구·모임 등) | SHY 스펙 `groups` · 01-problem.md 4요소 "대상" · 03-requirements.md R1 |
| E3 | GroupMember | 그룹과 유저를 잇는 소속·역할 관계 | SHY 스펙 `group_members` · 03-requirements.md R1~R3, R18 |
| E4 | Expense | 지출 1건 | SHY 스펙 `expenses` · 03-requirements.md R5~R14 |
| E5 | ExpenseOcrRaw | 영수증·결제캡쳐 OCR 원문·파싱 결과(지출 1건에 종속) | SHY 스펙 `expense_ocr_raw` · 03-requirements.md R8~R11 |
| E6 | Saving (저금) | 개인 또는 그룹 단위 저금 1건 | 03-requirements.md R19~R21 · 04-features.md F19~F21 · 05-policy.md P11·P12 — SHY 스펙 DB 스키마엔 없어 이번에 새로 추가 |
| E7 | Income (수입) | 월별 수입 금액·항목 | `ShooT 하윤.dc.html` 화면 "2b-1·2b-1a" — **[?] 01~05 어디에도 이 개념이 없다. 팀이 새로 정한 요구인지, 디자이너가 임의로 넣은 화면인지 확인 필요** |
| E8 | CategoryPreset | 그룹 유형별 기본 카테고리 목록(정적 상수, DB 테이블 아님) | SHY 스펙 "Task 2-3" · 03-requirements.md R16 · 디자인 `FAMILY_CATS`/`COUPLE_CATS`/`DEFAULT_CATS` |
| E9 | Pet (저금통 펫) | 개인 펫(색상 커스텀 가능) 또는 그룹 공통 반려 캐릭터(F22, 자동 성장) 1마리 | docs/08-pet-feature-spec.md + hybranch F22 + 참고 이미지 — **2026-09-15 v2로 재구현**(supabase/006_pet_v2_and_goals_and_reactions.sql), v1의 species는 폐기 |
| E12 | CategoryGoal (월별 목표) | 사용자가 카테고리별로 직접 설정하는 이번 달 지출 목표 금액 | shooTbranch 통합, 04-features.md F19류 지출 카테고리 개념 재사용 — **2026-09-15 신규(E11 Budget 대체)** |
| E13 | GoalReward (목표 달성 보상) | 월이 끝난 뒤(또는 화면을 열 때) 카테고리별 목표 달성 여부를 계산해 고정 코인·XP를 지급한 기록 | shooTbranch 통합("퀘스트 달성" 개념) — **2026-09-15 신규(E10 WeeklySettlement 대체)**, 절약 비율 비례가 아니라 달성 시 고정 보상 |
| E14 | ExpenseReaction (그룹 피드 이모지 반응) | 그룹 피드의 지출 카드에 그룹원이 남기는 이모지 반응(F23) | hybranch 통합 — **2026-09-15 신규** |
| E15 | AttendanceCheckin (출석체크) | 하루 1번 출석하면 코인 지급, 7일 연속 출석하면 7일째 코인 2배 | 접속률을 올리기 위한 신규 요청(사용자, 2026-09-20) — **2026-09-20 신규** |
| E16 | RecurringExpense (정기 지출) | 월세·구독료처럼 매달 반복되는 지출의 템플릿 — 실제 Expense는 로그인 시 store가 자동 생성 | 사용자 요청(2026-09-21) — 01~05엔 없는 신규 |
| E17 | GroupCategoryGoal (그룹 예산) | 그룹장이 정하는 그룹 전체의 월별·카테고리별 예산(E12 CategoryGoal의 그룹판) | 사용자 요청(2026-09-21) — 01~05엔 없는 신규 |
| E18 | PetFeeding (그룹 밥주기 기록) | 그룹원 각자 하루 1번씩 그룹 펫에게 밥을 준 기록(형평성 있는 그룹 밥주기 추적용) | 사용자 요청(2026-09-21) — 01~05엔 없는 신규 |

## 엔티티별 필드

### E1. Profile
| 필드 | 타입 | 필수 | 설명 | 출처 |
|---|---|---|---|---|
| id | uuid (FK → auth.users.id) | 필수 | Supabase Auth가 발급하는 유저 id를 그대로 씀 | SHY 스펙 `profiles` |
| name | text | 필수 | 그룹 피드(F13)에서 작성자 이름으로 노출 | SHY 스펙 `profiles`, "회원가입 시 signUp options.data.name" |
| email | text | 필수 | 로그인 식별자. 별도 컬럼이 아니라 auth.users.email을 그대로 참조 | 디자인 화면 "1. 회원가입", "2. 로그인" 입력 필드 |

### E2. Group
| 필드 | 타입 | 필수 | 설명 | 출처 |
|---|---|---|---|---|
| id | uuid | 필수 | | SHY 스펙 `groups` |
| name | text | 필수 | 자유 텍스트, 그룹장이 직접 정함(R1) | SHY 스펙 `groups.name` · 03-requirements.md R1 |
| group_type | enum | 필수, 기본 OTHER | FAMILY·SIBLING·FRIEND·COUPLE·MARRIED_COUPLE·CLUB·OTHER — 표시(아이콘·색상·카테고리 프리셋)용, 권한·로직에 관여 안 함(05-policy.md SP2) | SHY 스펙 `group_type` enum · 05-policy.md SP2 |
| invite_code | text (unique) | 필수 | 8자리, 그룹 생성 시 자동 발급 | SHY 스펙 `groups.invite_code` · 03-requirements.md R2 |
| created_at | timestamptz | 필수(자동) | | SHY 스펙 `groups.created_at` |

**[?] 디자인 3a 화면에는 "형제자매(SIBLING)" 선택 카드가 없다** — 디자인 스크립트의 `TYPE_ACCENTS`엔 `siblings` 값이 정의돼 있지만, 실제 화면(3a. 그룹 생성 — 모임 선택)에는 가족·부부·커플·친구·모임·동아리·기타 6개 카드만 있고 형제자매 카드가 빠져 있다. SHY 스펙 enum(7종)과 03-requirements.md 어디에도 "형제자매를 뺀다"는 결정은 없다 — 팀 확인 필요.

### E3. GroupMember
| 필드 | 타입 | 필수 | 설명 | 출처 |
|---|---|---|---|---|
| id | uuid | 필수 | | SHY 스펙 `group_members` |
| user_id | uuid (FK → Profile) | 필수 | | SHY 스펙 `group_members.user_id` |
| group_id | uuid (FK → Group) | 필수 | 그룹 삭제 시 같이 삭제(on delete cascade) | SHY 스펙 `group_members.group_id` |
| role | enum(OWNER, MEMBER) | 필수, 기본 MEMBER | 그룹 생성자는 OWNER(R1), 위임 시(F18) 값이 바뀜 | SHY 스펙 `group_members.role` · 03-requirements.md R18 |
| nickname | text | 선택 | 그룹 안에서 쓰는 별명 — 피드(F13)에서 이름 대신 우선 표시 | SHY 스펙 `group_members.nickname` |
| joined_at | timestamptz | 필수(자동) | | SHY 스펙 `group_members.joined_at` |

유니크 제약: (user_id, group_id) — 같은 그룹에 중복 참여 불가(P3).

### E4. Expense (지출)
| 필드 | 타입 | 필수 | 설명 | 출처 |
|---|---|---|---|---|
| id | uuid | 필수 | | SHY 스펙 `expenses` |
| user_id | uuid (FK → Profile) | 필수 | 작성자 = 소유자, 수정·삭제 권한 판단 기준(P6) | SHY 스펙 `expenses.user_id` · 03-requirements.md R14 |
| group_id | uuid (FK → Group, nullable) | 선택 | 그룹 삭제 시에도 지출은 남고 개인 지출로 전환(on delete set null) | SHY 스펙 `expenses.group_id` · 05-policy.md 상태값1 |
| amount | integer | 필수 | 원 단위 | SHY 스펙 `expenses.amount` · 03-requirements.md R6 |
| category | text | 필수 | 그룹 유형별 프리셋(E8) 값 또는 직접 입력, 인식 실패 시 "확인 필요" | SHY 스펙 `expenses.category` · 03-requirements.md R6, R11 |
| memo | text | 선택 | | SHY 스펙 `expenses.memo` · 03-requirements.md R7 |
| date | date | 필수 | | SHY 스펙 `expenses.date` · 03-requirements.md R6 |
| source_type | enum(MANUAL, RECEIPT, PAYMENT_CAPTURE) | 필수, 기본 MANUAL | 수기 · 영수증 촬영 · 간편결제 캡쳐 | SHY 스펙 `expenses.source_type` · 03-requirements.md R5, R8, R9 |
| image_url | text | 선택 | 영수증·캡쳐 이미지(Supabase Storage) | SHY 스펙 `expenses.image_url` |
| is_shared | boolean | 필수, 기본 false | 그룹 피드 노출 여부(R12) | SHY 스펙 `expenses.is_shared` · 03-requirements.md R12 |
| created_at | timestamptz | 필수(자동) | | SHY 스펙 `expenses.created_at` |

**[?] "확인 필요" 표시 방식이 문서마다 다르다** — 05-policy.md P7·SHY 스펙은 인식 실패 시 `category="확인 필요"` 자체로 표시한다고 정하는데, 디자인(`ShooT 하윤.dc.html` EXPENSE_MONTHS_BASE)은 `category`엔 "식비"처럼 정상 값이 그대로 있고 `needsReview: true`라는 **별도 boolean 필드**로 배지를 띄운다. 스키마에 `needsReview` 컬럼을 추가할지, 아니면 원래 방침대로 `category==="확인 필요"` 하나로 판정할지 팀이 정해야 한다.

### E5. ExpenseOcrRaw
| 필드 | 타입 | 필수 | 설명 | 출처 |
|---|---|---|---|---|
| id | uuid | 필수 | | SHY 스펙 `expense_ocr_raw` |
| expense_id | uuid (FK → Expense, unique) | 필수 | 지출 1건당 1행 | SHY 스펙 `expense_ocr_raw.expense_id` |
| raw_text | text | 선택 | OCR 원문(디버깅·재파싱용) | SHY 스펙 `expense_ocr_raw.raw_text` |
| parsed_json | jsonb | 선택 | 가맹점명·금액·날짜 등 파싱 결과 | SHY 스펙 `expense_ocr_raw.parsed_json` |
| ocr_provider | text | 선택 | 'clova' \| 'google-vision' | SHY 스펙 `expense_ocr_raw.ocr_provider` |
| confidence | real | 선택 | | SHY 스펙 `expense_ocr_raw.confidence` |

### E6. Saving (저금) — SHY 스펙엔 없는 신규 엔티티
| 필드 | 타입 | 필수 | 설명 | 출처 |
|---|---|---|---|---|
| id | uuid | 필수 | | [제안] Expense(E4)와 같은 키 규칙을 따름 — 근거: SHY 스펙 다른 테이블 전부 uuid PK |
| user_id | uuid (FK → Profile) | 필수 | 등록한 사람 = 수정 권한 판단 기준(P12) | 04-features.md F19 · 05-policy.md P11·P12 |
| type | enum(PERSONAL, GROUP) | 필수 | 개인 또는 그룹 저금 구분 | 03-requirements.md R19 · 02-workflow.md S10(팀 요청 "개인과 그룹으로 나누어야 해") |
| group_id | uuid (FK → Group, nullable) | type=GROUP일 때만 필수 | | 04-features.md F19 입력 "groupId(그룹인 경우)" |
| amount | integer | 필수 | 원 단위 | 04-features.md F19 |
| title | text | 선택 | 수기로 정함, 비우면 기본값("저금 · 9월 10일" 형식) 자동 채움 | 03-requirements.md R20 · 04-features.md F20 |
| date | date | 필수 | 캘린더(R21)에 표시하는 기준 날짜 | 04-features.md F19, F21 |
| created_at | timestamptz | 필수(자동) | | [제안] 다른 엔티티와 동일한 감사 필드 관례 — 근거: SHY 스펙 전 테이블에 created_at 존재 |

**[?] 디자인엔 "저금 추가" 입력 화면이 없다** — `ShooT 하윤.dc.html`은 저금을 그룹 피드(5b)의 한 항목("9월 저금", 100,000원, isSaving:true)으로만 보여줄 뿐, F19/F20이 요구하는 "저금 추가" 버튼·타이틀 입력 폼 자체가 화면에 없다. 07-screens.md에도 같은 내용으로 표시해 둔다.

### E7. Income (수입) — 01~05엔 없고 디자인에만 있는 개념 · 전부 [?]
> ~~아래 [?] 전부 팀 확인 전엔 구현 보류~~ **2026-09-18 해결**: `supabase/011_incomes_avatar_account_deletion.sql`로 실제 `incomes` 테이블·RLS(본인만 select/insert/delete)를 만들어 오래전부터 안정적으로 운영 중이다(`store.addIncome`/`store.deleteIncome`). 아래 필드는 실제 구현과 일치하고, 그룹 연결은 없다(개인 전용으로 확정) — [?] 표시는 "이 문서를 처음 쓸 당시엔 몰랐다"는 역사 기록으로 남겨둔다.
| 필드 | 타입 | 필수(추정) | 설명 | 출처 |
|---|---|---|---|---|
| user_id | uuid (FK → Profile) | [?] | 개인 소유로 보이나 그룹 수입인지 여부 확정 안 됨 | 디자인 화면 "2b-1. 이번 달 수입 입력"(홈 화면 homeGroup 선택 값에 연동되는 것으로 보임) |
| amount | integer | [?] | | 디자인 `incomeAmount` state |
| category | enum(급여, 용돈, 부수입, 기타) | [?] | select 옵션만 확인됨 | 디자인 "수입 항목" select |
| memo | text | [?] | | 디자인 "메모" 입력란 |
| is_recurring | boolean | [?] | "매달 자동으로 반복" 토글 — 반복 시 매월 어떻게 재생성되는지 규칙 없음 | 디자인 "2b-1" 화면 토글 |
| month | text 또는 date | [?] | "2026년 9월 수입"처럼 월 단위로 관리되는 것으로 보임 | 디자인 "2b-1a. 수입 내역" 화면 |

**[?] 수입(Income) 기능 자체가 01-problem.md·02-workflow.md·03-requirements.md·04-features.md·05-policy.md 어디에도 없다.** 이 앱의 목적(투명성·신뢰성·정산 편의, 01-problem.md "목적")과 수입 기능이 어떻게 연결되는지도 문서상 근거가 없다. 팀에게 반드시 확인해야 할 것:
1. 수입 추적을 이번 범위(MVP)에 포함할 것인지
2. 포함한다면 03-requirements.md에 R(요구)로, 04-features.md에 F(기능)로 먼저 채워야 하는지
3. 개인 전용인지 그룹도 가능한지, 그룹이라면 어떤 정책(P)이 필요한지(예: "본인 수입만 본다" 같은 규칙)

### E8. CategoryPreset (정적 상수, DB 테이블 아님)
| group_type | 카테고리 목록 | 출처 |
|---|---|---|
| FAMILY | 식비, 생활용품, 교육비, 의료비, 관리비, 통신비, 여가·문화, 기타 | SHY 스펙 Task 2-3 · 디자인 `FAMILY_CATS`(동일) |
| COUPLE | 데이트, 선물, 기념일, 여행, 카페·식사, 기타 | SHY 스펙 Task 2-3 · 디자인 `COUPLE_CATS`(동일) |
| SIBLING | 식비, 경조사, 선물, 여행, 기타 | SHY 스펙 Task 2-3 — 디자인엔 이 프리셋을 쓰는 화면이 없음(아래 표 참고) |
| FRIEND | 관리비, 식비·장보기, 생활용품, 공과금, 기타 | SHY 스펙 Task 2-3 — 디자인엔 이 프리셋을 쓰는 화면이 없음 |
| MARRIED_COUPLE | 관리비, 보험, 식비, 자녀 양육비, 교육비, 의료비, 경조사, 기타 | SHY 스펙 Task 2-3 — 디자인엔 이 프리셋을 쓰는 화면이 없음 |
| CLUB | 회비, 행사비, 식비, 기타 | SHY 스펙 Task 2-3 — 디자인엔 이 프리셋을 쓰는 화면이 없음 |
| OTHER | 식비, 교통, 생활용품, 기타 | SHY 스펙 Task 2-3 · 디자인 `DEFAULT_CATS`(동일) |

**[제안] 디자인(`ShooT 하윤.dc.html`)의 지출 입력 화면(6번)은 그룹 유형이 FAMILY·COUPLE일 때만 각각 다른 프리셋을 쓰고, 그 외(SIBLING·FRIEND·MARRIED_COUPLE·CLUB·OTHER)는 전부 DEFAULT_CATS로 통일해 보여준다(`Component.GROUP_TO_CATS` 함수가 'couple'·'family'만 분기).** SHY 스펙 Task 2-3은 7개 유형 모두 다른 프리셋을 쓰라고 정했으므로, 이 부분은 디자인이 데모 편의상 3종류로 줄인 것으로 보인다 — 근거: 디자인 스크립트에 SIBLING·FRIEND·MARRIED_COUPLE·CLUB용 카테고리 배열 자체가 없음. 실제 구현 범위를 SHY 스펙 7종 그대로 할지, 디자인처럼 3종(가족·커플·기타)으로 줄일지는 팀이 정해야 한다.

### E9. Pet (저금통 펫) — v2, 2026-09-15 브랜치 통합으로 재구현
| 필드 | 타입 | 필수(추정) | 설명 | 출처 |
|---|---|---|---|---|
| id | uuid | 필수 | | [제안] 다른 엔티티와 동일한 PK 관례 |
| user_id 또는 group_id | uuid (FK) | 필수(배타적, DB CHECK `pets_owner_exclusive`) | 개인 펫 1행(`user_id`만 채움) 또는 그룹 펫 1행(`group_id`만 채움) — v1과 동일 구조 유지(사용자 확인: "하나로 합침") | docs/08-pet-feature-spec.md §1, §9 + hybranch F22 |
| pet_name | text | 선택 | 비우면 기본 이름("저금이") | docs/08-pet-feature-spec.md §1 |
| stage_index | int(1~4) | 필수, 기본 1 | **v2로 4단계 축소**(사용자 확인: "이미지대로 4단계") — 1=알, 2=유년기, 3=청소년기, 4=성체. v1의 "전설"(5단계) 폐기 | 참고 이미지("캐릭터 커스텀" 화면 성장 단계 미리보기) |
| xp_progress | numeric(0~100) | 필수, 기본 0 | 현재 단계 내 진행률(%) — 100 넘으면 stage_index+1(3에서 캡), 초과분 이월 | docs/08-pet-feature-spec.md §2, §8 |
| total_coins | int | 필수, 기본 0 | 누적 저금통 코인(개인 펫만 의미 있음, 그룹 펫은 코인 없이 XP만) | docs/08-pet-feature-spec.md §4, §7 |
| last_fed_date | date | 선택 | 개인 펫 전용 — 데일리 밥주기 하루 1회 제한. 그룹 펫은 수동 밥주기가 없어 이 컬럼을 안 씀 | docs/08-pet-feature-spec.md §3, §8 |
| body_color / ledger_color / bag_color / eye_color / leaf_color | text (hex) | 필수, 기본값 있음 | **v2 신규** — 참고 이미지의 "캐릭터 커스텀" 화면(몸/가계부/가방/눈/잎사귀 5개 부위 색상). 개인 펫만 변경 가능(PetCustomize 화면), 그룹 펫은 기본값 고정(사용자 확인: "마스코트 하나로 통일"이라 종 선택 대신 색상만 개인화) | 참고 이미지 + 사용자 요청 |
| created_at | timestamptz | 필수(자동) | | [제안] 다른 엔티티와 동일한 감사 필드 관례 |

**"시무룩(sulking)" 상태는 DB 컬럼이 아니라 화면에서 계산하는 파생 상태다** — 참고 이미지의 "2-Sulking"은 별도 성장 단계가 아니라 청소년기(stage_index=2) 그림의 시각 변형이라, 최근 활동(개인 펫: `last_fed_date`, 그룹 펫: 그룹 공유 지출 최근 날짜)과 오늘 날짜의 차이가 기준일(개인 2일/그룹 3일, `lib/pets.ts` 상수)을 넘으면 그 자리에서 `sulking=true`로 렌더링만 다르게 한다. 방치해도 stage_index는 내려가지 않는다(성장 역행 없음) — 이 부분은 스펙에 명시가 없어 "가장 덜 침습적인 해석"으로 구현, 사용자에게 별도 확인은 안 받음.

**그룹 펫(F22) XP 획득 방식 — hybranch 스펙("그룹원 참여도에 따라 성장")이 알고리즘까지 정하진 않아 아래처럼 구현, [?] 표시로 남김**: 공유 지출(`is_shared=true`)이 그룹에 새로 기록될 때마다, 그 지출 날짜 기준 최근 7일 내에 그 그룹에서 공유 지출을 기록한 사람이 몇 명인지 센다(방금 지출도 포함). 2명 이상이면 정상 XP(`GROUP_XP_PER_SHARED_EXPENSE`=15), 1명뿐이면 절반(반올림)만 준다 — "여럿이 골고루 기록하면 정상 성장, 한 명만 계속 기록하면 절반 성장"이라는 hybranch 취지를 그대로 코드화한 것이며, 정확한 창(window) 길이(7일)·정상/절반 경계(2명)는 팀이 재확인 전까지는 잠정값이다. 출처: `lib/store.tsx`의 `growGroupPetFromSharedExpense`, `lib/pets.ts`.

**[?] xpGained(밥주기 1회당 XP) 기본값 15는 스펙 문서 자체가 "실제 값은 서버 정책으로 결정"이라고 못박아 뒀다** — 팀이 정해야 확정값이다. 출처: docs/08-pet-feature-spec.md §3

**2026-09-21 사용자 요청으로 펫 경제 개편**(`lib/pets.ts`): 밥값이 코인 1개 → **5개**로 인상됐다. 단계별로 다음 단계까지 필요한 XP가 늘어나도록 `STAGE_XP_REQUIREMENTS=[100,150,200]`(등차수열, 이전엔 단계 무관 고정값)로 바뀌었다. 개인·그룹 지출을 하루 중 처음 기록할 때마다 코인 3개를 추가로 준다(`PERSONAL_EXPENSE_COIN_REWARD`/`GROUP_EXPENSE_COIN_REWARD`). **그룹 펫도 이제 수동 밥주기가 가능하다** — 그룹원 각자 하루 1번씩(형평성을 위해 XP를 그룹원 수로 나눠 받음, `groupFeedXp()`, E18 PetFeeding 참고) — 기존엔 참여도 기반 자동 성장만 있었다.

**2026-09-21 신규 컬럼 `display_stage_index`**(`supabase/015_pet_display_stage.sql`): 꾸미기(PetCustomize)에서 미리보기로 고른 성장 단계를 실제 저장하기 시작했다 — 예전엔 화면 안에서만 바뀌고 "적용하기"를 눌러도 저장이 안 돼서 다른 화면엔 항상 실제 성장 단계(`stage_index`)만 보이던 버그가 있었다. 이제 `display_stage_index`가 표시용, `stage_index`는 성장 진행용으로 분리됐고, 꾸미기에서는 이미 도달한 단계까지만 고를 수 있다.

**2026-09-21 버그 수정**: 목표 달성 보상(E13 GoalReward)·출석체크(E15) 코인이 "펫을 아직 안 만든 상태"에서 지급되면 코인을 넣을 펫 자체가 없어 조용히 사라졌다 — `createPet`이 이제 그동안 쌓인 출석체크·지출기록·목표보상 코인/XP를 합쳐 시작값으로 넣어준다(개인 펫은 유저당 하나뿐이라 이중 지급 걱정 없음).

참고: "나의 배지"(MyBadges)는 별도 테이블이 필요 없다 — stage_index 하나로 4단계 배지 획득 여부를 계산만 하면 된다. 출처: docs/08-pet-feature-spec.md §5 (v2에서 5단계→4단계로 조정)

### E12. CategoryGoal (월별 목표) — v2 신규, E11 Budget 대체(shooTbranch 통합)
| 필드 | 타입 | 필수 | 설명 | 출처 |
|---|---|---|---|---|
| id | uuid | 필수 | | [제안] 다른 엔티티와 동일한 PK 관례 |
| user_id | uuid (FK → Profile) | 필수 | 개인 단위만 있음 — 그룹 목표는 없음(그룹 펫은 목표가 아니라 참여도로 자란다) | shooTbranch 통합 |
| category | text | 필수 | E8 카테고리 프리셋 값 또는 직접 입력 카테고리 — 카테고리별로 목표를 따로 설정 | shooTbranch 통합, 사용자 요청("퀘스트 형식으로 달성하면...") |
| month | text(YYYY-MM) | 필수 | 이 목표가 적용되는 달 | shooTbranch 통합 |
| goal_amount | integer | 필수 | 그 달 그 카테고리 지출 목표 금액(이 금액 이하로 쓰면 달성) | shooTbranch 통합 |
| created_at | timestamptz | 필수(자동) | | [제안] 다른 엔티티와 동일한 감사 필드 관례 |

유니크 제약: (user_id, category, month) — 같은 달·같은 카테고리에 목표 중복 불가.

### E13. GoalReward (목표 달성 보상) — v2 신규, E10 WeeklySettlement 대체(shooTbranch 통합)
| 필드 | 타입 | 필수 | 설명 | 출처 |
|---|---|---|---|---|
| id | uuid | 필수 | | [제안] 다른 엔티티와 동일한 PK 관례 |
| user_id | uuid (FK → Profile) | 필수 | | shooTbranch 통합 |
| category | text | 필수 | E12와 동일 카테고리 | shooTbranch 통합 |
| month | text(YYYY-MM) | 필수 | | shooTbranch 통합 |
| goal_amount | integer | 필수 | 계산 시점의 E12 goal_amount 스냅샷 | shooTbranch 통합 |
| spent_amount | integer | 필수 | 계산 시점까지의 그 카테고리·그 달 실제 지출 합계 | shooTbranch 통합 |
| achieved | boolean | 필수 | `spent_amount <= goal_amount` | shooTbranch 통합, 사용자 요청("퀘스트 형식으로 달성하면") |
| coins_earned | integer | 필수, 기본 0 | **v1과 다르게 절약 비율 비례가 아니라 고정값**(`GOAL_ACHIEVED_REWARD_COINS`=10) — 달성 못 하면 0 | 사용자 요청("먹이를 더 주는 형식이나 경험치를 더 주는 형식" — 절약액 비례가 아니라 퀘스트 클리어형 보상으로 해석) |
| xp_gained | integer | 필수, 기본 0 | 고정값(`GOAL_ACHIEVED_REWARD_XP`=30), 미달성 시 0 — 개인 펫에 즉시 반영 | 상동 |
| created_at | timestamptz | 필수(자동) | | [제안] 다른 엔티티와 동일한 감사 필드 관례 |

유니크 제약: (user_id, category, month) — 한 달·한 카테고리당 보상 1번만(중복 지급 방지, v1과 동일한 "화면 열 때 그 자리에서 계산 + DB 유니크 제약으로 멱등성 확보" 패턴).

**배치 실행 방식은 v1과 동일하게 cron 대신 화면(MonthlyGoalReport)을 열 때 그 자리에서 계산한다** — v1에서 이미 "정확한 배치 요일·시각·타임존 미정"이라 화면 계산으로 대체했던 결정을 그대로 이어받음(07-screens.md 참고).

### E14. ExpenseReaction (그룹 피드 이모지 반응, F23) — v2 신규(hybranch 통합)
| 필드 | 타입 | 필수 | 설명 | 출처 |
|---|---|---|---|---|
| id | uuid | 필수 | | [제안] 다른 엔티티와 동일한 PK 관례 |
| expense_id | uuid (FK → Expense) | 필수 | 그룹 피드에 보이는 지출(공유 지출)에만 반응 가능 | hybranch 통합, 사용자 요청("그룹 피드 이모지 반응(F23) 추가") |
| user_id | uuid (FK → Profile) | 필수 | 반응을 남긴 그룹원 | hybranch 통합 |
| emoji | text | 필수 | 이모지 1개(고정 팔레트에서 선택, `lib/pets.ts` REACTION_EMOJI_PALETTE) | hybranch 통합 |
| created_at | timestamptz | 필수(자동) | | [제안] 다른 엔티티와 동일한 감사 필드 관례 |

유니크 제약: (expense_id, user_id, emoji) — 같은 사람이 같은 지출에 같은 이모지를 중복으로 남길 수 없음(토글 방식: 이미 남겼으면 취소).

**[?] 반응 가능한 이모지 종류·개수 제한은 문서 근거가 없어 임의로 24종 팔레트를 만들었다** — 정확한 목록은 팀이 정해야 확정이다.

### E15. AttendanceCheckin (출석체크) — 신규(사용자 요청, 2026-09-20)
| 필드 | 타입 | 필수 | 설명 | 출처 |
|---|---|---|---|---|
| id | uuid | 필수 | | [제안] 다른 엔티티와 동일한 PK 관례 |
| user_id | uuid (FK → Profile) | 필수 | | 사용자 요청 |
| checkin_date | date | 필수 | 출석한 날짜(하루 1건) | 사용자 요청("매일매일 들어오면 출석체크하면 코인") |
| streak_day | integer | 필수, 기본 1 | 이번 연속 출석 주기에서 며칠째인지(1~7) — 전날 기록이 없거나 이미 7일을 채웠으면 1로 리셋 | 사용자 요청("일주일 꼬박 출석해서 일주일 주기로") |
| coins_earned | integer | 필수, 기본 0 | 평소엔 고정값(`CHECKIN_REWARD_COINS`=5), streak_day가 7이면 2배(`CHECKIN_STREAK_BONUS_MULTIPLIER`) — **[?] 팀 확인 전 placeholder** | 사용자 요청("코인 두배씩 얻도록") |
| created_at | timestamptz | 필수(자동) | | [제안] 다른 엔티티와 동일한 감사 필드 관례 |

유니크 제약: (user_id, checkin_date) — 하루 중복 지급 방지(E13 GoalReward와 같은 "화면에서 계산 + DB 유니크 제약으로 멱등성 확보" 패턴).

**[?] 하루 기본 코인(5)·보너스 배율(2배)·주기 길이(7일)는 스펙에 정확한 수치가 없어 팀 확인 전 placeholder다.** 자정 기준을 KST로 고정했는지, 앱을 끄고 자정을 넘긴 세션에서 날짜가 언제 갱신되는지는 `lib/mock.ts`의 `TODAY_DATE`(모듈 로드 시 1회 계산되는 KST 오늘 날짜) 그대로를 따른다 — 다른 "오늘" 판정(P3 밥 주기 등)과 동일한 한계를 그대로 물려받는다.

### E16. RecurringExpense (정기 지출) — 신규(사용자 요청, 2026-09-21)
| 필드 | 타입 | 필수 | 설명 | 출처 |
|---|---|---|---|---|
| id | uuid | 필수 | | [제안] 다른 엔티티와 동일한 PK 관례 |
| user_id | uuid (FK → Profile) | 필수 | 본인 명의로만 등록 | 사용자 요청 |
| group_id | uuid (FK → Group, nullable) | 선택 | 그룹 공유 지출로 반복 등록하는 경우 | 사용자 요청 |
| amount | integer | 필수 | | 사용자 요청 |
| category | text | 필수 | | 사용자 요청 |
| memo | text | 선택 | | 사용자 요청 |
| day_of_month | integer(1~28) | 필수 | 매달 이 날짜에 지출이 자동 생성됨 — 29~31일은 월마다 없을 수 있어 1~28로 제한 | 사용자 요청 |
| is_shared | boolean | 필수, 기본 false | | 사용자 요청 |
| active | boolean | 필수, 기본 true | 꺼두면 더 이상 자동 생성 안 됨(삭제와 별개로 켜고 끌 수 있음) | 사용자 요청 |
| created_at | timestamptz | 필수(자동) | | [제안] 다른 엔티티와 동일한 감사 필드 관례 |

E4 Expense에 `recurring_expense_id`(FK, nullable) 컬럼이 추가됐다 — 이 템플릿에서 자동 생성된 지출인지 추적하는 용도. 실제 생성은 배치가 아니라 로그인(세션 로드) 시 store가 "이번 달에 아직 생성 안 된 활성 템플릿"을 확인해 처리한다(E13 GoalReward와 같은 "세션을 열 때 계산" 패턴). **2026-09-21 버그 수정**: 탭 두 개를 열어두거나 빠르게 재로그인하면 같은 템플릿이 이번 달에 두 번 생성될 수 있었다 — `expenses(recurring_expense_id, date)` 유니크 인덱스(`017_recurring_expense_unique.sql`)로 막았다.

### E17. GroupCategoryGoal (그룹 예산) — 신규(사용자 요청, 2026-09-21), E12 CategoryGoal의 그룹판
| 필드 | 타입 | 필수 | 설명 | 출처 |
|---|---|---|---|---|
| id | uuid | 필수 | | [제안] 다른 엔티티와 동일한 PK 관례 |
| group_id | uuid (FK → Group) | 필수 | 개인 목표(E12)와 달리 그룹 단위 | 사용자 요청 |
| category | text | 필수 | | 사용자 요청 |
| month | text(YYYY-MM) | 필수 | | 사용자 요청 |
| goal_amount | integer | 필수 | | 사용자 요청 |
| created_by | uuid (FK → Profile) | 필수 | 정한 사람(그룹장) 기록용 | 사용자 요청 |
| created_at / updated_at | timestamptz | 필수(자동) | | [제안] 다른 엔티티와 동일한 감사 필드 관례 |

유니크 제약: (group_id, category, month). **정책**: 사용자 확인 — 그룹장(OWNER)만 정하고 고칠 수 있고, RLS로 강제한다(05-policy.md 새 항목 참고). 그룹원은 조회만 가능(진행률 카드를 다 같이 볼 수 있어야 해서).

### E18. PetFeeding (그룹 밥주기 기록) — 신규(사용자 요청, 2026-09-21)
| 필드 | 타입 | 필수 | 설명 | 출처 |
|---|---|---|---|---|
| id | uuid | 필수 | | [제안] 다른 엔티티와 동일한 PK 관례 |
| pet_id | uuid (FK → Pet) | 필수 | 그룹 펫만 대상(개인 펫은 Pet.last_fed_date로 충분) | 사용자 요청 |
| user_id | uuid (FK → Profile) | 필수 | 밥을 준 그룹원 | 사용자 요청 |
| fed_date | date | 필수 | | 사용자 요청 |
| created_at | timestamptz | 필수(자동) | | [제안] 다른 엔티티와 동일한 감사 필드 관례 |

유니크 제약: (pet_id, user_id, fed_date) — 그룹원 각자 하루 1번씩만 그룹 펫에게 밥을 줄 수 있다(예전엔 그룹 펫에 수동 밥주기 자체가 없었음). **동시성 버그 수정(2026-09-21)**: 여러 그룹원이 거의 동시에 밥을 주거나 지출을 기록하면 코인·XP 갱신이 서로 덮어써 유실되거나, 그룹을 나간 사람이 밥주기 슬롯을 날려먹을 수 있었다 — `feed_pet()`/`grow_group_pet()` DB 함수(RPC, `018_atomic_group_pet_growth.sql`)가 행을 잠그고 그 트랜잭션 안에서 권한·인원수·코인을 다시 검증해 원자적으로 처리하도록 고쳤다.

## 관계
| 관계 | 설명 | 출처 |
|---|---|---|
| Group 1 — N GroupMember | 그룹 하나에 여러 멤버 | SHY 스펙 |
| Profile 1 — N GroupMember | 한 유저가 여러 그룹에 동시 소속 가능(다대다의 한 축) — 이번 MVP는 "현재 활성 그룹" 하나만 화면에서 선택해 쓰는 방식으로 단순화(05-policy.md SP3) | SHY 스펙 "설계 포인트" · 05-policy.md SP3 |
| Profile 1 — N Expense | 작성자 기준, 삭제 시 지출도 함께 삭제할지는 SHY 스펙에 명시 안 됨 [?] | SHY 스펙 `expenses.user_id` |
| Group 1 — N Expense | 그룹 삭제(또는 탈퇴로 인한 그룹 삭제, 05-policy.md 상태값1) 시 지출은 삭제되지 않고 개인 지출로 남음(on delete set null) | SHY 스펙 `expenses.group_id` · 05-policy.md 상태값1 |
| Expense 1 — 1 ExpenseOcrRaw | source_type이 RECEIPT·PAYMENT_CAPTURE일 때만 생성, MANUAL엔 없음 | SHY 스펙 `expense_ocr_raw` |
| Profile 1 — N Saving | | 04-features.md F19 |
| Group 1 — N Saving | type=GROUP인 경우만 | 04-features.md F19 |
| Profile 1 — N Income | ~~[?] 그룹 연결 여부 확정 안 됨~~ **2026-09-18 해결**: 개인 전용으로 구현됨(E7 참고) | 디자인 화면 2b-1 |
| Profile 1 — 1 Pet(개인용) | 개인 펫 1인당 1마리 — 그룹 펫과 별개(E9 참고) | docs/08-pet-feature-spec.md §1, §9 |
| Group 1 — 1 Pet(그룹 공유용, F22) | 그룹당 1마리, 그룹원이 함께 키움 — XP 획득 방식은 공유 지출 참여도 기반(E9 참고, [?] 잠정값) | docs/08-pet-feature-spec.md §1, §6, §9 + hybranch F22 |
| Profile 1 — N CategoryGoal | 카테고리·달마다 하나씩(E12) | shooTbranch 통합 |
| Profile 1 — N GoalReward | 카테고리·달마다 하나씩(E13) | shooTbranch 통합 |
| Expense 1 — N ExpenseReaction | 지출 하나에 그룹원 여럿이 각자 이모지 반응(E14) | hybranch 통합 |
| Profile 1 — N AttendanceCheckin | 하루에 한 건씩(E15) | 사용자 요청, 2026-09-20 |
| Profile 1 — N RecurringExpense | 본인 명의 템플릿만(E16) | 사용자 요청, 2026-09-21 |
| RecurringExpense 1 — N Expense | 템플릿 하나가 매달 지출 1건씩 생성(E16, `recurring_expense_id`) | 사용자 요청, 2026-09-21 |
| Group 1 — N GroupCategoryGoal | 그룹·카테고리·달마다 하나씩(E17), 그룹장만 쓰기 가능 | 사용자 요청, 2026-09-21 |
| Pet(그룹) 1 — N PetFeeding | 그룹원마다 하루 1건씩(E18) | 사용자 요청, 2026-09-21 |

## 상태값과 데이터 연동
- 그룹장(Role) 상태(05-policy.md 상태값1): `group_members.role`이 OWNER↔MEMBER로 전환됨. 그룹원이 OWNER 혼자뿐이면 위임 없이 `groups` 행 자체를 삭제 — 이때 `expenses.group_id`는 null로, `group_members`는 cascade로 함께 삭제(SHY 스펙 "설계 포인트").
- 지출 인식 상태(05-policy.md 상태값2): 정상 등록 ↔ "확인 필요"(F10에서 수정 시 정상 복귀) — 위 E4 표의 "[?] 확인 필요 표시 방식" 항목 참고.

## 검토했으나 제외
| 후보 | 출처(누구·[제안]) | 제외 이유 |
|---|---|---|
| 은행·카드 계좌 자동 연동 데이터(거래내역 테이블) | 종합 시 [제안] | 05-policy.md SP4("은행 자동연동은 이번 범위에서 제외")와 모순 |
| 정산(더치페이) 결과를 저장하는 별도 테이블(Settlement) | 종합 시 [제안] | 04-features.md F15 근거 자체가 "SHY 스펙엔 API가 없어 전부 [제안]"이라 표기돼 있고, 04의 발산 질문 답에서도 "자동 계산 없이 비교 표만 보여주는 절충안"이 검토됐을 뿐 확정된 저장 구조가 없음 — 07-screens.md에 [?]로 남기고 여기서는 테이블을 만들지 않음
