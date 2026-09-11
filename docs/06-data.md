> 문서: 06-data.md · 상태: 초안 · 열린 질문 [?] 11개 · 채택한 [제안] 3개 · 마지막 갱신: 금
> 이 문서를 읽는 에이전트에게: 여기 없는 것은 지어내지 말고 질문으로 돌려라. [?] 는 팀이 아직 모르는 것이다.
> 종합 메모: 03-requirements.md(유형 "데이터"인 R) · 04-features.md(입력·결과 열) · 05-policy.md(규칙·상태값)과 `모듈 1 SHY프로젝트 주제 세분화.md`(SHY 스펙, "3. DB 스키마" Supabase/Postgres SQL)를 기본 근거로 삼고, `ShooT 하윤.dc.html`(디자인) 화면에 실제로 쓰인 필드·목록을 대조해 채웠다. SHY 스펙 DB 스키마에 없는 저금(Saving)은 03-05의 R19~R21·F19~F21·P11·P12를 근거로 새로 추가했고, 수입(Income)은 03~05 어디에도 없이 디자인에만 있어 전부 [?]로 표시했다. 이 문서를 만들기 전 팀 인터뷰는 진행하지 않았다 — 기존 문서·디자인만으로 채운 초안이라, [?] 항목은 반드시 팀 확인이 필요하다.

## 엔티티 목록
| E | 엔티티 | 설명 | 출처 |
|---|---|---|---|
| E1 | Profile (User) | 로그인 계정의 표시용 정보(이름·이메일) | SHY 스펙 "3. DB 스키마" `profiles`(auth.users 미러링) |
| E2 | Group | 그룹(가족·부부·커플·룸메이트·모임 등) | SHY 스펙 `groups` · 01-problem.md 4요소 "대상" · 03-requirements.md R1 |
| E3 | GroupMember | 그룹과 유저를 잇는 소속·역할 관계 | SHY 스펙 `group_members` · 03-requirements.md R1~R3, R18 |
| E4 | Expense | 지출 1건 | SHY 스펙 `expenses` · 03-requirements.md R5~R14 |
| E5 | ExpenseOcrRaw | 영수증·결제캡쳐 OCR 원문·파싱 결과(지출 1건에 종속) | SHY 스펙 `expense_ocr_raw` · 03-requirements.md R8~R11 |
| E6 | Saving (저금) | 개인 또는 그룹 단위 저금 1건 | 03-requirements.md R19~R21 · 04-features.md F19~F21 · 05-policy.md P11·P12 — SHY 스펙 DB 스키마엔 없어 이번에 새로 추가 |
| E7 | Income (수입) | 월별 수입 금액·항목 | `ShooT 하윤.dc.html` 화면 "2b-1·2b-1a" — **[?] 01~05 어디에도 이 개념이 없다. 팀이 새로 정한 요구인지, 디자이너가 임의로 넣은 화면인지 확인 필요** |
| E8 | CategoryPreset | 그룹 유형별 기본 카테고리 목록(정적 상수, DB 테이블 아님) | SHY 스펙 "Task 2-3" · 03-requirements.md R16 · 디자인 `FAMILY_CATS`/`COUPLE_CATS`/`DEFAULT_CATS` |

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
| group_type | enum | 필수, 기본 OTHER | FAMILY·SIBLING·ROOMMATE·COUPLE·MARRIED_COUPLE·CLUB·OTHER — 표시(아이콘·색상·카테고리 프리셋)용, 권한·로직에 관여 안 함(05-policy.md SP2) | SHY 스펙 `group_type` enum · 05-policy.md SP2 |
| invite_code | text (unique) | 필수 | 8자리, 그룹 생성 시 자동 발급 | SHY 스펙 `groups.invite_code` · 03-requirements.md R2 |
| created_at | timestamptz | 필수(자동) | | SHY 스펙 `groups.created_at` |

**[?] 디자인 3a 화면에는 "형제자매(SIBLING)" 선택 카드가 없다** — 디자인 스크립트의 `TYPE_ACCENTS`엔 `siblings` 값이 정의돼 있지만, 실제 화면(3a. 그룹 생성 — 모임 선택)에는 가족·부부·커플·룸메이트·모임·동아리·기타 6개 카드만 있고 형제자매 카드가 빠져 있다. SHY 스펙 enum(7종)과 03-requirements.md 어디에도 "형제자매를 뺀다"는 결정은 없다 — 팀 확인 필요.

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
| ROOMMATE | 관리비, 식비·장보기, 생활용품, 공과금, 기타 | SHY 스펙 Task 2-3 — 디자인엔 이 프리셋을 쓰는 화면이 없음 |
| MARRIED_COUPLE | 관리비, 보험, 식비, 자녀 양육비, 교육비, 의료비, 경조사, 기타 | SHY 스펙 Task 2-3 — 디자인엔 이 프리셋을 쓰는 화면이 없음 |
| CLUB | 회비, 행사비, 식비, 기타 | SHY 스펙 Task 2-3 — 디자인엔 이 프리셋을 쓰는 화면이 없음 |
| OTHER | 식비, 교통, 생활용품, 기타 | SHY 스펙 Task 2-3 · 디자인 `DEFAULT_CATS`(동일) |

**[제안] 디자인(`ShooT 하윤.dc.html`)의 지출 입력 화면(6번)은 그룹 유형이 FAMILY·COUPLE일 때만 각각 다른 프리셋을 쓰고, 그 외(SIBLING·ROOMMATE·MARRIED_COUPLE·CLUB·OTHER)는 전부 DEFAULT_CATS로 통일해 보여준다(`Component.GROUP_TO_CATS` 함수가 'couple'·'family'만 분기).** SHY 스펙 Task 2-3은 7개 유형 모두 다른 프리셋을 쓰라고 정했으므로, 이 부분은 디자인이 데모 편의상 3종류로 줄인 것으로 보인다 — 근거: 디자인 스크립트에 SIBLING·ROOMMATE·MARRIED_COUPLE·CLUB용 카테고리 배열 자체가 없음. 실제 구현 범위를 SHY 스펙 7종 그대로 할지, 디자인처럼 3종(가족·커플·기타)으로 줄일지는 팀이 정해야 한다.

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
| Profile 1 — N Income | [?] 그룹 연결 여부 확정 안 됨 | 디자인 화면 2b-1 |

## 상태값과 데이터 연동
- 그룹장(Role) 상태(05-policy.md 상태값1): `group_members.role`이 OWNER↔MEMBER로 전환됨. 그룹원이 OWNER 혼자뿐이면 위임 없이 `groups` 행 자체를 삭제 — 이때 `expenses.group_id`는 null로, `group_members`는 cascade로 함께 삭제(SHY 스펙 "설계 포인트").
- 지출 인식 상태(05-policy.md 상태값2): 정상 등록 ↔ "확인 필요"(F10에서 수정 시 정상 복귀) — 위 E4 표의 "[?] 확인 필요 표시 방식" 항목 참고.

## 검토했으나 제외
| 후보 | 출처(누구·[제안]) | 제외 이유 |
|---|---|---|
| 은행·카드 계좌 자동 연동 데이터(거래내역 테이블) | 종합 시 [제안] | 05-policy.md SP4("은행 자동연동은 이번 범위에서 제외")와 모순 |
| 정산(더치페이) 결과를 저장하는 별도 테이블(Settlement) | 종합 시 [제안] | 04-features.md F15 근거 자체가 "SHY 스펙엔 API가 없어 전부 [제안]"이라 표기돼 있고, 04의 발산 질문 답에서도 "자동 계산 없이 비교 표만 보여주는 절충안"이 검토됐을 뿐 확정된 저장 구조가 없음 — 07-screens.md에 [?]로 남기고 여기서는 테이블을 만들지 않음
