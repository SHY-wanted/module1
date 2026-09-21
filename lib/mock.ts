// lib/mock.ts
// 더미 데이터 — 필드명은 supabase/schema.sql의 컬럼명과 정확히 같게 맞춘다.
// (다음 단계에서 Supabase 응답으로 통째로 갈아끼울 것이기 때문 — docs/06-data.md, supabase/schema.sql 참고)

export type GroupType =
  | "FAMILY"
  | "SIBLING"
  | "FRIEND"
  | "COUPLE"
  | "MARRIED_COUPLE"
  | "CLUB"
  | "OTHER";

export type MemberRole = "OWNER" | "MEMBER";

export type SourceType = "MANUAL" | "RECEIPT" | "PAYMENT_CAPTURE";

export type SavingType = "PERSONAL" | "GROUP";

// E1. Profile — schema.sql: id, name (email 컬럼 없음 — auth.users.email 참조, 06-data.md)
export interface Profile {
  id: string;
  name: string;
}

// E2. Group — schema.sql: id, name, group_type, invite_code, created_at
export interface Group {
  id: string;
  name: string;
  group_type: GroupType;
  invite_code: string;
  created_at: string;
}

// E3. GroupMember — schema.sql: id, user_id, group_id, role, nickname, joined_at
export interface GroupMember {
  id: string;
  user_id: string;
  group_id: string;
  role: MemberRole;
  nickname: string | null;
  joined_at: string;
}

// E4. Expense — schema.sql: id, user_id, group_id, amount, category, memo, date, source_type, image_url, is_shared, created_at, recurring_expense_id
// 스키마에 없는 merchant·needsReview 필드는 만들지 않는다.
// - "가맹점명"은 memo에 넣는다.
// - "확인 필요" 배지는 category === '확인 필요'로 판정한다(05-policy.md P7 방식).
// - recurring_expense_id(신규, supabase/013_recurring_expenses.sql): 이 지출이 어느 정기 지출
//   템플릿에서 자동 생성됐는지. 수동으로 만든 지출은 null.
export interface Expense {
  id: string;
  user_id: string;
  group_id: string | null;
  amount: number;
  category: string;
  memo: string | null;
  date: string; // YYYY-MM-DD
  source_type: SourceType;
  image_url: string | null;
  is_shared: boolean;
  created_at: string; // timestamptz — 시각 표시(오늘 08:32 등)·정렬 기준
  recurring_expense_id: string | null;
}

// E6. Saving — schema.sql: id, user_id, type, group_id, amount, title, date, created_at
export interface Saving {
  id: string;
  user_id: string;
  type: SavingType;
  group_id: string | null;
  amount: number;
  title: string | null;
  date: string;
  created_at: string;
}

// E7. Income (수입) — supabase/schema.sql엔 없음. 06-data.md E7 참고: 01~05엔 근거가 없던 기능이고
// 팀이 R/F 번호를 아직 안 정했다(07-screens.md 2b-1a·2b-1, 2026-09-11 팀 결정으로 이번 범위에 포함).
// schema.sql 테이블(Expense 등)과 헷갈리지 않도록 "MockIncome"이라는 이름을 따로 쓴다.
export type IncomeCategory = "급여" | "용돈" | "부수입" | "기타";
export interface MockIncome {
  id: string;
  user_id: string;
  amount: number;
  category: IncomeCategory;
  memo: string | null;
  is_recurring: boolean;
  month: string; // YYYY-MM — 2b-1a "2026년 9월 총 수입"의 기준
  date: string; // YYYY-MM-DD — 목록 표시용("9월 1일")
  created_at: string;
}

// ------------------------------------------------------------------
// 현재 로그인한 사용자(목업) — 그룹 상세(5b) "나"·마이페이지(10) 기본값과 일치시킴
// ------------------------------------------------------------------
export const CURRENT_USER_ID = "u-seoyeon";

// 2026-09-19 버그 수정: 원래는 데모용으로 "2026-09-09"에 고정해뒀었다 — 그런데 실제 Supabase 연동 후
// 6(지출 입력)·2b-1(수입 입력) 등 "신규 입력"이 이 값을 기본 날짜로 채우다 보니, 실제 오늘(예: 9/14)
// 지출을 입력해도 저장된 date는 항상 "2026-09-09"가 돼서 7(지출 목록)의 오늘 날짜 필터에 안 걸리는
// 문제가 있었다. 이제 진짜 오늘 날짜(한국시간 기준)로 계산한다 — 목업 시드 데이터(INITIAL_EXPENSES 등)의
// 고정 날짜와는 무관하다(그것들은 자기 날짜를 그대로 갖고 있고, 실제 로그인하면 Supabase 데이터로 대체된다).
// computeTodayDateKST를 export하는 이유(2026-09-18 추가): TODAY_DATE는 모듈이 로드될 때 딱 한 번만
// 계산돼서 고정된다 — 대부분의 화면은 짧게 열고 닫으니 문제없지만, 저녁 리마인더(store.tsx)처럼 시계를
// 계속 들여다보며 "지금이 오후 8시 넘었는지"를 매번 새로 확인하는 로직은 날짜도 그때그때 다시 재야
// 한다(자정을 넘겨 앱을 계속 켜둔 경우 TODAY_DATE만 어제로 멈춰 있으면 안 되니까).
export function computeTodayDateKST(): string {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}
export const TODAY_DATE = computeTodayDateKST();

let idCounter = 0;
export function generateId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 혼동되는 0/O, 1/I 제외
export function generateInviteCode(): string {
  const pick = (n: number) =>
    Array.from({ length: n }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
  return `${pick(2)}-${pick(4)}`;
}

// ------------------------------------------------------------------
// 초기 프로필
// ------------------------------------------------------------------
export const INITIAL_PROFILES: Profile[] = [
  { id: "u-seoyeon", name: "김서연" }, // 현재 로그인한 사용자
  { id: "u-minjun", name: "이민준" }, // 커플 그룹 파트너
  { id: "u-jihoon", name: "박지훈" },
  { id: "u-doyoon", name: "김도윤" },
  { id: "u-sujin", name: "이수진" },
  { id: "u-haeun", name: "김하은" },
  { id: "u-yuna", name: "최유나" },
];

// ------------------------------------------------------------------
// 초기 그룹 — GroupList(5a) 디자인의 그룹 3개와 이름·유형·멤버 수 일치
// ------------------------------------------------------------------
export const GROUP_ID_COUPLE = "g-couple";
export const GROUP_ID_FAMILY = "g-family";
export const GROUP_ID_FRIEND = "g-friend"; // 2026-09-20: 유형이 "룸메이트"→"친구"로 바뀌면서 id·이름도 같이 갱신

export const INITIAL_GROUPS: Group[] = [
  {
    id: GROUP_ID_COUPLE,
    name: "민준 & 서연",
    group_type: "COUPLE",
    invite_code: "CP-4K9X",
    created_at: "2026-06-01T09:00:00+09:00",
  },
  {
    id: GROUP_ID_FAMILY,
    name: "행복한 우리집",
    group_type: "FAMILY",
    invite_code: "FM-7Q2R",
    created_at: "2026-03-15T09:00:00+09:00",
  },
  {
    id: GROUP_ID_FRIEND,
    name: "대학 동기들",
    group_type: "FRIEND",
    invite_code: "FR-9T3L",
    created_at: "2026-08-01T09:00:00+09:00",
  },
];

// ------------------------------------------------------------------
// 초기 그룹 멤버
// ------------------------------------------------------------------
export const INITIAL_GROUP_MEMBERS: GroupMember[] = [
  // 커플 (2명)
  { id: generateId("gm"), user_id: "u-seoyeon", group_id: GROUP_ID_COUPLE, role: "OWNER", nickname: null, joined_at: "2026-06-01T09:00:00+09:00" },
  { id: generateId("gm"), user_id: "u-minjun", group_id: GROUP_ID_COUPLE, role: "MEMBER", nickname: "파트너", joined_at: "2026-06-01T09:05:00+09:00" },
  // 가족 (4명)
  { id: generateId("gm"), user_id: "u-seoyeon", group_id: GROUP_ID_FAMILY, role: "MEMBER", nickname: null, joined_at: "2026-03-15T09:00:00+09:00" },
  { id: generateId("gm"), user_id: "u-doyoon", group_id: GROUP_ID_FAMILY, role: "OWNER", nickname: "아빠", joined_at: "2026-03-15T09:00:00+09:00" },
  { id: generateId("gm"), user_id: "u-sujin", group_id: GROUP_ID_FAMILY, role: "MEMBER", nickname: "엄마", joined_at: "2026-03-15T09:00:00+09:00" },
  { id: generateId("gm"), user_id: "u-haeun", group_id: GROUP_ID_FAMILY, role: "MEMBER", nickname: "동생", joined_at: "2026-03-15T09:00:00+09:00" },
  // 친구 (3명)
  { id: generateId("gm"), user_id: "u-seoyeon", group_id: GROUP_ID_FRIEND, role: "MEMBER", nickname: null, joined_at: "2026-08-01T09:00:00+09:00" },
  { id: generateId("gm"), user_id: "u-jihoon", group_id: GROUP_ID_FRIEND, role: "OWNER", nickname: null, joined_at: "2026-08-01T09:00:00+09:00" },
  { id: generateId("gm"), user_id: "u-yuna", group_id: GROUP_ID_FRIEND, role: "MEMBER", nickname: null, joined_at: "2026-08-01T09:00:00+09:00" },
];

// ------------------------------------------------------------------
// 초기 지출 — ExpenseList(7) 디자인 EXPENSE_MONTHS_BASE를 단일 소스로 재구성.
// "확인 필요"는 needsReview 필드가 아니라 category==='확인 필요'로 판정(05-policy.md P7 방식).
// 전부 김서연(현재 사용자) 명의 + 파스타집 1건은 이민준 명의(그룹 피드에서만 보임 — GroupDetail 5b 참고).
// ------------------------------------------------------------------
export const INITIAL_EXPENSES: Expense[] = [
  {
    id: "e-1",
    user_id: "u-seoyeon",
    group_id: GROUP_ID_COUPLE,
    amount: 5800,
    category: "확인 필요",
    memo: "스타벅스 강남점",
    date: "2026-09-09",
    source_type: "RECEIPT",
    image_url: null,
    is_shared: true,
    created_at: "2026-09-09T08:32:00+09:00",
    recurring_expense_id: null,
  },
  {
    id: "e-2",
    user_id: "u-seoyeon",
    group_id: GROUP_ID_FRIEND,
    amount: 12300,
    category: "생활",
    memo: "GS25",
    date: "2026-09-08",
    source_type: "MANUAL",
    image_url: null,
    is_shared: true,
    created_at: "2026-09-08T19:00:00+09:00",
    recurring_expense_id: null,
  },
  {
    id: "e-3",
    user_id: "u-seoyeon",
    group_id: GROUP_ID_COUPLE,
    amount: 28000,
    category: "문화",
    memo: "CGV 왕십리",
    date: "2026-09-06",
    source_type: "MANUAL",
    image_url: null,
    is_shared: true,
    created_at: "2026-09-06T20:10:00+09:00",
    recurring_expense_id: null,
  },
  {
    id: "e-4",
    user_id: "u-seoyeon",
    group_id: null,
    amount: 34500,
    category: "확인 필요",
    memo: "올리브영",
    date: "2026-09-05",
    source_type: "RECEIPT",
    image_url: null,
    is_shared: false,
    created_at: "2026-09-05T17:40:00+09:00",
    recurring_expense_id: null,
  },
  {
    id: "e-5",
    user_id: "u-seoyeon",
    group_id: GROUP_ID_FAMILY,
    amount: 87200,
    category: "생활",
    memo: "이마트",
    date: "2026-08-29",
    source_type: "MANUAL",
    image_url: null,
    is_shared: true,
    created_at: "2026-08-29T11:00:00+09:00",
    recurring_expense_id: null,
  },
  {
    id: "e-6",
    user_id: "u-seoyeon",
    group_id: null,
    amount: 9600,
    category: "교통",
    memo: "택시",
    date: "2026-08-27",
    source_type: "MANUAL",
    image_url: null,
    is_shared: false,
    created_at: "2026-08-27T22:15:00+09:00",
    recurring_expense_id: null,
  },
  // 그룹 피드(5b)에서만 보이는, 파트너(이민준) 명의 공유 지출 — 06-data.md E4 "본인 지출만" 원칙상
  // 김서연의 지출내역(7)에는 나타나지 않고, 커플 그룹 피드(5b)에는 나타난다.
  {
    id: "e-7",
    user_id: "u-minjun",
    group_id: GROUP_ID_COUPLE,
    amount: 32000,
    category: "문화",
    memo: "파스타집",
    date: "2026-09-09",
    source_type: "MANUAL",
    image_url: null,
    is_shared: true,
    created_at: "2026-09-09T19:04:00+09:00",
    recurring_expense_id: null,
  },
];

// ------------------------------------------------------------------
// 초기 저금 — GroupDetail(5b) 피드의 "9월 저금" 항목
// ------------------------------------------------------------------
export const INITIAL_SAVINGS: Saving[] = [
  {
    id: "s-1",
    user_id: "u-seoyeon",
    type: "GROUP",
    group_id: GROUP_ID_COUPLE,
    amount: 100000,
    title: "9월 저금",
    date: "2026-09-09",
    created_at: "2026-09-09T10:00:00+09:00",
  },
];

// ------------------------------------------------------------------
// 초기 수입 — IncomeList(2b-1a) 디자인의 "9월 월급" 항목(design/shoot/IncomeList.dc.html)
// ------------------------------------------------------------------
export const INITIAL_INCOMES: MockIncome[] = [
  {
    id: "in-1",
    user_id: "u-seoyeon",
    amount: 2400000,
    category: "급여",
    memo: "9월 월급",
    is_recurring: true,
    month: "2026-09",
    date: "2026-09-01",
    created_at: "2026-09-01T09:00:00+09:00",
  },
];

// ------------------------------------------------------------------
// 저금통 펫 키우기 — docs/08-pet-feature-spec.md 기반, 2026-09-15 같은 날 mg·hybranch·shooTbranch
// 3개 브랜치 통합(사용자 확인)으로 v2 반영: 종(species) 선택 대신 마스코트+색상 커스텀(개인 펫만),
// 그룹 펫은 hybranch F22(반려 캐릭터)와 합쳐 참여도 기반 자동 성장, 예산은 shooTbranch식 월별·
// 카테고리별 목표로 교체. 완전히 새로운 실제 기능이라 INITIAL_* 배열이 없다 — 로그인 후 store가
// Supabase에서 실제로 읽어온 값으로만 채워진다.
// ------------------------------------------------------------------

// E9. Pet — schema.sql: id, user_id, group_id, pet_name, stage_index, xp_progress, total_coins,
// last_fed_date, body_color, ledger_color, bag_color, eye_color, leaf_color, created_at.
// user_id·group_id는 배타적(개인 펫 또는 그룹 펫). 색상 5종은 개인 펫만 커스텀 가능(그룹 펫은
// 기본값 그대로 — "개인용 펫... 색상 변경 가능"이라는 사용자 발화 그대로).
export interface Pet {
  id: string;
  user_id: string | null;
  group_id: string | null;
  pet_name: string | null;
  stage_index: number;
  xp_progress: number;
  total_coins: number;
  last_fed_date: string | null;
  body_color: string;
  ledger_color: string;
  bag_color: string;
  eye_color: string;
  leaf_color: string;
  created_at: string;
}

// E12. CategoryGoal(목표) — schema.sql: id, user_id, category, month, goal_amount, created_at,
// updated_at. shooTbranch의 "월별 목표 설정"을 실제 저장소에 연결한 것 — mg의 주간 예산(E11 Budget)을
// 대체한다(2026-09-15 사용자 확인). category는 expenses.category와 같은 자유 텍스트 라벨.
export interface CategoryGoal {
  id: string;
  user_id: string;
  category: string;
  month: string; // "YYYY-MM"
  goal_amount: number;
  created_at: string;
  updated_at: string;
}

// E16. RecurringExpense(정기 지출) — schema.sql(supabase/013_recurring_expenses.sql): id, user_id,
// group_id, amount, category, memo, day_of_month, is_shared, active, created_at. 월세·구독료처럼
// 매달 반복되는 지출의 "템플릿"만 들고 있고, 실제 Expense 행은 store.tsx가 매달 이 템플릿을 보고
// 자동 생성한다(day_of_month는 그 달의 지출이 생기는 날짜 — 29~31일 월 길이 문제를 피하려고 1~28로 제한).
export interface RecurringExpense {
  id: string;
  user_id: string;
  group_id: string | null;
  amount: number;
  category: string;
  memo: string | null;
  day_of_month: number; // 1~28
  is_shared: boolean;
  active: boolean;
  created_at: string;
}

// E17. GroupCategoryGoal(그룹 예산) — schema.sql(supabase/014_group_category_goals.sql): id, group_id,
// category, month, goal_amount, created_by, created_at, updated_at. CategoryGoal(개인 목표)과 같은
// 모양이지만 user_id 대신 group_id를 쓰고, 그룹장(OWNER)만 정하고 고칠 수 있다(RLS로 강제).
export interface GroupCategoryGoal {
  id: string;
  group_id: string;
  category: string;
  month: string; // "YYYY-MM"
  goal_amount: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// E13. GoalReward(목표 보상) — schema.sql: id, user_id, category, month, spent_amount, goal_amount,
// achieved, coins_earned, xp_gained, created_at. mg의 WeeklySettlement(E10)를 대체 — "퀘스트 달성"
// 개념이라 절약 비율이 아니라 달성 여부(achieved)에 따른 고정 보상을 준다.
export interface GoalReward {
  id: string;
  user_id: string;
  category: string;
  month: string;
  spent_amount: number;
  goal_amount: number;
  achieved: boolean;
  coins_earned: number;
  xp_gained: number;
  created_at: string;
}

// E14. ExpenseReaction(이모지 반응) — schema.sql: id, expense_id, user_id, emoji, created_at.
// hybranch F23 — 그룹 피드 지출 카드에 이모지로 반응.
export interface ExpenseReaction {
  id: string;
  expense_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

// E15. AttendanceCheckin(출석체크) — schema.sql: id, user_id, checkin_date, streak_day, coins_earned,
// created_at. 접속률을 올리기 위한 신규 기능(2026-09-20 사용자 요청) — 매일 출석하면 코인을 받고,
// 7일 연속 출석해서 그 주기를 꽉 채우면 7일째 코인이 두 배로 지급된다(lib/pets.ts CHECKIN_* 참고).
// GoalReward와 마찬가지로 완전히 새 기능이라 INITIAL_* 시드가 없다.
export interface AttendanceCheckin {
  id: string;
  user_id: string;
  checkin_date: string; // "YYYY-MM-DD"
  streak_day: number; // 이번 연속 출석 주기에서 며칠째인지(1~7)
  coins_earned: number;
  created_at: string;
}
