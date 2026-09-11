// lib/mock.ts
// 더미 데이터 — 필드명은 supabase/schema.sql의 컬럼명과 정확히 같게 맞춘다.
// (다음 단계에서 Supabase 응답으로 통째로 갈아끼울 것이기 때문 — docs/06-data.md, supabase/schema.sql 참고)

export type GroupType =
  | "FAMILY"
  | "SIBLING"
  | "ROOMMATE"
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

// E4. Expense — schema.sql: id, user_id, group_id, amount, category, memo, date, source_type, image_url, is_shared, created_at
// 스키마에 없는 merchant·needsReview 필드는 만들지 않는다.
// - "가맹점명"은 memo에 넣는다.
// - "확인 필요" 배지는 category === '확인 필요'로 판정한다(05-policy.md P7 방식).
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

// 데모 기준 "오늘" — Home 캘린더(9월, today=9)·아래 목업 시각과 맞춘 고정 날짜.
// 실제 Date.now()를 쓰면 화면 문구("오늘 08:32" 등)가 날짜가 바뀔 때마다 어긋나므로 고정한다.
export const TODAY_DATE = "2026-09-09";

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
export const GROUP_ID_ROOMMATE = "g-roommate";

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
    id: GROUP_ID_ROOMMATE,
    name: "전세 405호",
    group_type: "ROOMMATE",
    invite_code: "RM-9T3L",
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
  // 룸메이트 (3명)
  { id: generateId("gm"), user_id: "u-seoyeon", group_id: GROUP_ID_ROOMMATE, role: "MEMBER", nickname: null, joined_at: "2026-08-01T09:00:00+09:00" },
  { id: generateId("gm"), user_id: "u-jihoon", group_id: GROUP_ID_ROOMMATE, role: "OWNER", nickname: null, joined_at: "2026-08-01T09:00:00+09:00" },
  { id: generateId("gm"), user_id: "u-yuna", group_id: GROUP_ID_ROOMMATE, role: "MEMBER", nickname: null, joined_at: "2026-08-01T09:00:00+09:00" },
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
  },
  {
    id: "e-2",
    user_id: "u-seoyeon",
    group_id: GROUP_ID_ROOMMATE,
    amount: 12300,
    category: "생활",
    memo: "GS25",
    date: "2026-09-08",
    source_type: "MANUAL",
    image_url: null,
    is_shared: true,
    created_at: "2026-09-08T19:00:00+09:00",
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
