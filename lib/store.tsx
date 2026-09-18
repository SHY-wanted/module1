"use client";
// lib/store.tsx — 목업 데이터를 React 상태로 들고 있는 전역 스토어(Context).
// 2026-09-18: 로그인/회원가입/로그아웃·내 정보 변경(profiles.name 포함)에 이어, 그룹·그룹원·지출·저금도
// 실제 Supabase 쿼리로 옮겼다 — supabase/schema.sql이 그 계약이다. 로그인하면 이 4개 테이블을 한 번에
// 읽어와 아래 React 상태를 "캐시"로 채우고, 이후 각 액션이 실제로 Supabase에 쓴 다음 그 결과로 캐시를 갱신한다.
// 카테고리(개인·그룹, DB 테이블 없음)만 아직 목업 상태로 남아있다.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "./supabase/client";
import {
  CURRENT_USER_ID,
  INITIAL_EXPENSES,
  INITIAL_GROUPS,
  INITIAL_GROUP_MEMBERS,
  INITIAL_INCOMES,
  INITIAL_PROFILES,
  INITIAL_SAVINGS,
  TODAY_DATE,
  generateInviteCode,
  type AttendanceCheckin,
  type CategoryGoal,
  type Expense,
  type ExpenseReaction,
  type GoalReward,
  type Group,
  type GroupMember,
  type GroupType,
  type MockIncome,
  type Pet,
  type Profile,
  type Saving,
} from "./mock";
import { PERSONAL_CATS, groupToCats, makeCategory, type CategoryDef, type CategoryScope } from "./categories";
import { sortPersonalRanking, type PersonalRankingEntry } from "./ranking";
import {
  CHECKIN_REWARD_COINS,
  CHECKIN_STREAK_BONUS_MULTIPLIER,
  CHECKIN_STREAK_LENGTH,
  DEFAULT_PET_COLORS,
  FEED_COIN_COST,
  FEED_XP_DEFAULT,
  GOAL_ACHIEVED_REWARD_COINS,
  GOAL_ACHIEVED_REWARD_XP,
  GROUP_PARTICIPATION_WINDOW_DAYS,
  GROUP_XP_HALF_RATE_DIVISOR,
  GROUP_XP_PER_SHARED_EXPENSE,
  applyXpGain,
  currentMonthString,
  shiftDateKST,
  type PetColorPart,
} from "./pets";

// signUp/signIn/updateUser 실패 시 화면에 그대로 보여줄 결과 — Supabase 에러 메시지(영어)를 흔한 경우만
// 한국어로 바꾸고, 나머지는 그대로 보여준다(계정 잠김 등 팀이 문구를 아직 안 정한 경우들 [?]).
export interface AuthResult {
  ok: boolean;
  error?: string;
}

// app/reset-password(SPA 밖 라우트)도 같은 번역을 쓰기 위해 export한다.
export function translateAuthError(message: string): string {
  if (message.includes("Invalid login credentials")) return "이메일 또는 비밀번호가 맞지 않아요";
  if (message.includes("Email not confirmed")) return "이메일 인증 후 로그인할 수 있어요. 받으신 메일함을 확인해주세요";
  if (message.includes("User already registered")) return "이미 가입된 이메일이에요";
  if (message.includes("Password should be at least")) return "비밀번호는 6자 이상이어야 해요";
  if (message.includes("missing email") || message.includes("missing password") || message.includes("Missing")) return "이메일과 비밀번호를 입력해주세요";
  // 위에서 못 잡은 나머지(대부분 영어 원문) — 원문을 그대로 보여주지 않는다.
  return "요청을 처리하지 못했어요. 잠시 후 다시 시도해주세요";
}

interface StoreState {
  profiles: Profile[];
  // 06-data.md E1: profiles 테이블엔 email 컬럼이 없다(auth.users.email을 그대로 참조) — 이메일은
  // profiles/Profile에 넣지 않고, 실제 Supabase Auth 세션(session.user.email)에서 그대로 읽는다.
  currentUserEmail: string;
  // 2026-09-18 팀 요청: 실제 Supabase Auth 세션 — null이면 로그인 안 된 상태. isLoggedIn은 이제
  // 이 값에서 파생된다(session !== null). authReady=false인 동안은 앱 시작 시 세션 확인이 끝나지
  // 않은 상태라 0(스플래시)에서 로그인 여부 판정을 미룬다.
  session: Session | null;
  authReady: boolean;
  // 2026-09-17 팀 요청(10b "내 정보 변경") — supabase/schema.sql의 profiles엔 이 컬럼이 없다(id, name뿐).
  // 프로필 사진은 06-data.md에 정의된 적 없는 신규 항목이라, email·password와 같은 방식으로 세션 흉내용
  // 상태로만 둔다(파일을 실제로 어디 업로드하지 않고, 브라우저에서 읽은 data URL을 그대로 들고 있는다).
  currentUserAvatarUrl: string | null;
  groups: Group[];
  groupMembers: GroupMember[];
  expenses: Expense[];
  savings: Saving[];
  incomes: MockIncome[];
  // 2c "카테고리" — 2026-09-17 팀 결정(개인·그룹 차별화): "개인"(그룹 미공유)과 "그룹마다" 카테고리
  // 목록이 서로 다르다. personalCategories는 개인 스코프, groupCategoriesById는 groupId별 스코프다.
  // 그룹은 처음 편집·추가되기 전까지는 이 맵에 없다 — 그때까진 groupToCats(group_type) 프리셋을 그대로 쓴다
  // (store.getCategoriesForScope가 그 폴백을 처리한다).
  personalCategories: CategoryDef[];
  groupCategoriesById: Record<string, CategoryDef[]>;
  // 2026-09-17 팀 결정: "지출 기록 시 확인 알림"(P·"OO원, 식비가 저장됐어요")을 실제로 띄우기 위한
  // 화면 전체 공용 토스트 상태. null이면 안 뜬 상태다.
  toastMessage: string | null;
  isLoggedIn: boolean;
  notificationSettings: NotificationSettings;
  darkMode: boolean;
  // 저금통 펫 키우기 v2(2026-09-15, mg·hybranch·shooTbranch 통합) — 내 개인 펫 + 내가 속한 그룹들의
  // 그룹 펫이 함께 들어있다(RLS가 이미 "내가 볼 수 있는 펫"만 걸러준다). 그룹 펫은 hybranch F22(반려
  // 캐릭터)와 합쳐져 참여도 기반으로 자동 성장한다(수동 밥주기는 개인 펫만).
  pets: Pet[];
  // 목표(예산) — shooTbranch식 월별·카테고리별 목표로 mg의 주간 예산을 대체(2026-09-15 사용자 확인).
  categoryGoals: CategoryGoal[];
  goalRewards: GoalReward[];
  // F23 그룹 피드 이모지 반응(hybranch, 2026-09-15 추가) — 내가 볼 수 있는 지출의 반응만 들어있다.
  expenseReactions: ExpenseReaction[];
  // P3 "데일리 먹이주기 팝업" — 지출을 기록한 직후, 오늘 아직 개인 펫에게 밥을 안 줬으면 연다.
  feedPopupPetId: string | null;
  // 8a→8b "영수증 촬영/갤러리 선택" 임시 이미지(2026-09-17 실제 OCR 연동 신규) — window.history.pushState
  // 로 넘어가는 StackScreen 파라미터엔 절대 넣지 않는다(사진 base64는 커서 브라우저 history state
  // 용량 제한에 걸릴 수 있다) — 대신 이 store 쪽 React 상태로만 화면 전환 중에도 들고 있는다.
  pendingReceiptImage: File | null;
  // 출석체크(2026-09-20 추가) — 접속률을 올리기 위한 신규 기능. 내 출석 기록만 들어있다(RLS).
  attendanceCheckins: AttendanceCheckin[];
}

interface JoinResult {
  ok: boolean;
  group?: Group;
  reason?: "not_found" | "already_member";
}

interface LeaveGroupResult {
  ok: boolean;
  reason?: "must_delegate";
}

// 2026-09-18 추가: createGroup·addExpense는 실패할 수 있는 실제 네트워크 호출이 됐다 — 화면에서
// 실패를 구분해서 보여줄 수 있도록 값 대신 이 결과 타입을 던진다(throw)는 대신 반환하게 한다.
export interface MutationResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface NotificationSettings {
  expenseConfirm: boolean;
  // 2026-09-17 팀 결정: "예산 초과 시 알림"은 삭제(예산 자체가 없는 기능이라). "알림음"은
  // "그룹원 기록 확인 알림"으로 대체 — 내가 속한 그룹에 다른 그룹원이 지출을 기록하면 알려준다.
  groupMemberRecord: boolean;
  // 2026-09-18 추가(신규 기능): 매일 저녁 8시, 오늘 지출을 하나도 안 기록했으면 리마인더를 띄운다.
  // 새로 추가하는 "귀찮게 하는" 알림이라 기본은 꺼둔다(위 둘은 원래 켜져 있던 것과 다르다).
  dailyReminder: boolean;
}

interface StoreValue extends StoreState {
  currentUserId: string;
  // 3b "그룹 만들기" — 실제 groups·group_members INSERT 2번(성공하면 로컬 캐시에도 반영).
  createGroup: (name: string, groupType: GroupType) => Promise<MutationResult<Group>>;
  // 4 "참여하기" — 실제 join_group_by_invite_code RPC(schema.sql 참고, 초대 코드로 아직 멤버가
  // 아닌 그룹을 찾으려면 일반 select로는 안 되기 때문).
  joinGroupByInviteCode: (code: string) => Promise<JoinResult>;
  addExpense: (input: Omit<Expense, "id" | "created_at">) => Promise<MutationResult<Expense>>;
  // P6 · F14: 본인 지출만 수정 가능 — 그룹장도 예외 없음(05-policy.md).
  updateExpense: (id: string, patch: Omit<Expense, "id" | "created_at" | "user_id">) => Promise<boolean>;
  // 7 "지출 목록" 삭제(2026-09-19 팀 요청) — P6과 같은 이유로 본인 지출만 지울 수 있다
  // (RLS expenses_delete_own_only가 실제로 막는다).
  deleteExpense: (id: string) => Promise<boolean>;
  // 2026-09-18 수정: incomes 테이블(011 마이그레이션)에 실제로 저장한다 — addExpense와 같은 패턴.
  addIncome: (input: Omit<MockIncome, "id" | "created_at">) => Promise<MutationResult<MockIncome>>;
  // 2b-1a "수입 내역" 삭제(2026-09-19 팀 요청) — addExpense·deleteExpense와 같은 패턴으로 실제 삭제.
  deleteIncome: (id: string) => Promise<boolean>;
  // 2c/6 카테고리 — scope(개인 또는 특정 그룹)의 카테고리 목록을 읽는다(없으면 그룹 프리셋으로 폴백).
  getCategoriesForScope: (scope: CategoryScope) => CategoryDef[];
  // 2c "카테고리 편집" — "..." 버튼으로 고른 카테고리의 이름만 바꾼다(그 scope 안에서만).
  renameCategoryInScope: (scope: CategoryScope, id: string, newLabel: string) => void;
  // 2c "카테고리 추가"(편집 모드에서만 보임) · 6 "직접 입력"으로 저장 시 — 그 scope에 새 카테고리를 더한다.
  // 이미 같은 이름이 있으면 새로 안 만들고 그대로 둔다.
  addCategoryInScope: (scope: CategoryScope, label: string) => void;
  // 1(회원가입) — 실제 supabase.auth.signUp 호출. 이메일 인증(Confirm email)이 프로젝트에서 켜져
  // 있으면 세션 없이 성공만 반환할 수 있다(로그인은 인증 후에나 가능) — Supabase 대시보드
  // Authentication > Providers > Email 설정에 따라 달라진다.
  signUp: (name: string, email: string, password: string) => Promise<AuthResult>;
  // 2(로그인) — 실제 supabase.auth.signInWithPassword 호출.
  signIn: (email: string, password: string) => Promise<AuthResult>;
  // 카카오 계정으로 로그인/가입(2026-09-18 신규) — 카카오 로그인 화면으로 리다이렉트한다.
  signInWithKakao: () => Promise<AuthResult>;
  // "비밀번호를 잊으셨나요?" — 실제 supabase.auth.resetPasswordForEmail 호출. 좋아하는 색·취미 같은
  // 지식 기반 질문은 추측·주변인 유출에 취약해 쓰지 않기로 했다(2026-09-22 대화 중 결정) — 이메일 재설정
  // 링크가 실제 인증 수단이다. 링크는 app/reset-password(SPA 밖 라우트)로 보낸다.
  sendPasswordResetEmail: (email: string) => Promise<AuthResult>;
  // 10(마이페이지) 로그아웃 — 실제 supabase.auth.signOut 호출.
  signOut: () => Promise<void>;
  // 10 "회원 탈퇴" — app/api/account(서버, Service Role Key)를 거쳐 auth.users를 실제로 지운다.
  // 011 마이그레이션으로 profiles와 그 아래 데이터(그룹 멤버십·지출·저금·수입 등)가 cascade로 함께 지워진다.
  deleteAccount: () => Promise<AuthResult>;
  // 10b "내 정보 변경" 닉네임 — profiles.name을 실제로 갱신한다(schema.sql profiles_update_own_only 필요).
  updateCurrentUserName: (name: string) => Promise<void>;
  // 10b "내 정보 변경" 이메일 — 실제 supabase.auth.updateUser({email}). 프로젝트 설정에 따라 새·이전
  // 이메일로 확인 메일이 발송되고, 확인 전까지는 auth.users.email이 안 바뀔 수 있다.
  updateCurrentUserEmail: (email: string) => Promise<AuthResult>;
  // 10b "내 정보 변경" 비밀번호 — 실제 supabase.auth.updateUser({password}). 빈 값이면 호출하지 않는다.
  updateCurrentUserPassword: (password: string) => Promise<AuthResult>;
  // 10b "내 정보 변경" — 프로필 사진을 바꾼다. null이면 사진을 지우고 이니셜로 되돌린다.
  // profiles.avatar_url(011 마이그레이션)에 실제로 저장된다.
  updateCurrentUserAvatar: (url: string | null) => Promise<void>;
  // 토글을 켜는 순간 브라우저 알림 권한을 요청한다(꺼져 있으면 notify()가 인앱 토스트만 띄운다).
  toggleNotification: (key: keyof NotificationSettings) => void;
  // 2.2초 동안 화면 위에 알림 문구를 띄운다 — 알림 설정과 무관한 일반 토스트용(내 정보 저장 등).
  showToast: (message: string) => void;
  // "지출 기록 시 확인 알림" 토글이 꺼져 있으면 아무것도 안 띄운다. 켜져 있으면 인앱 토스트 +
  // (권한 허용 시) 실제 브라우저 알림까지 띄운다.
  notifyExpenseSaved: (message: string) => void;
  toggleDarkMode: () => void;
  // 10a "그룹장 위임"(F18) — 현재 OWNER인 나 대신 선택한 멤버를 새 OWNER로 바꾼다. 새 그룹장을
  // 먼저 OWNER로 올리고 나서 내 role을 MEMBER로 내리는 순서로 실제 UPDATE 2번을 보낸다(순서를
  // 바꾸면 RLS members_update_owner_transfers_role이 두 번째 요청을 막는다 — schema.sql 참고).
  delegateOwner: (groupId: string, newOwnerUserId: string) => Promise<void>;
  // 10a "그룹 나가기" — P10: OWNER는 위임 없이 나갈 수 없다(단, 혼자뿐이면 예외로 그룹·지출·저금 함께 삭제).
  leaveGroup: (groupId: string) => Promise<LeaveGroupResult>;

  // ------- 저금통 펫 키우기 v2(2026-09-15, mg·hybranch·shooTbranch 통합) -------
  // scope는 카테고리(lib/categories.ts CategoryScope)와 같은 모양을 그대로 재사용한다 —
  // { kind: "personal" }(개인 펫) | { kind: "group", groupId }(그룹 펫).
  createPet: (scope: CategoryScope, name: string) => Promise<MutationResult<Pet>>;
  // P3 "밥 주기" — 개인 펫 전용(그룹 펫은 참여도로 자동 성장, 수동 밥주기 없음). 오늘 이미 줬으면
  // ok:false를 돌려준다.
  feedPet: (petId: string) => Promise<MutationResult<{ xpGained: number; leveledUp: boolean }>>;
  // 지출 기록 성공 직후 호출 — 개인 펫이 있고 오늘 아직 안 먹였으면 팝업을 연다(§3 노출 조건).
  openFeedPopupIfEligible: () => void;
  closeFeedPopup: () => void;
  // 개인 펫 색상 커스텀 — 그룹 펫엔 안 쓴다(사용자 확인: "개인용 펫만" 색상 변경 가능).
  setPetColors: (petId: string, colors: Partial<Record<PetColorPart, string>>) => Promise<MutationResult<Pet>>;
  // 월별·카테고리별 목표(shooTbranch 통합, mg의 주간 예산 대체) — 없으면 새로 만들고 있으면 갱신(upsert).
  setCategoryGoal: (category: string, month: string, amount: number) => Promise<MutationResult<CategoryGoal>>;
  // 2026-09-23 팀 요청(신규): 설정한 목표를 지울 수 있게 — deleteExpense와 같은 패턴(RLS로 본인 것만 지워짐).
  deleteCategoryGoal: (id: string) => Promise<boolean>;
  // 이번 달 설정된 목표들을 각각 달성했는지 계산해서 저장한다(배치 대신 화면을 열 때, 카테고리별로
  // 이미 보상을 줬으면 다시 안 준다). "퀘스트 달성" 개념이라 고정 보상(coins·xp)을 준다.
  getOrCreateGoalRewardsForMonth: () => Promise<MutationResult<GoalReward[]>>;
  // F23 그룹 피드 이모지 반응(hybranch) — 그룹 멤버만 남길 수 있다.
  addReaction: (expenseId: string, emoji: string) => Promise<MutationResult<ExpenseReaction>>;
  removeReaction: (expenseId: string, emoji: string) => Promise<boolean>;

  // 출석체크(2026-09-20 추가) — 오늘 이미 했으면 ok:false. 전날까지 연속 출석 중이었으면 streak_day가
  // 이어지고, 7일째(CHECKIN_STREAK_LENGTH)를 채우면 그날 코인이 2배 지급된 뒤 다음 날 1일째로 리셋된다.
  checkInToday: () => Promise<MutationResult<AttendanceCheckin>>;

  // 개인 랭킹(2026-09-17 신규) — "개인 = 경쟁/랭킹". supabase/009_personal_ranking.sql의
  // get_personal_ranking()을 호출한다 — pets 테이블 RLS(본인/그룹 멤버 펫만 조회 가능)를 그대로 둔 채,
  // 랭킹에 필요한 최소 컬럼(닉네임+성장 지표)만 노출하는 별도 함수라 그룹 펫 데이터는 애초에 섞이지
  // 않는다. 전역 상태로 캐시하지 않고 화면(PersonalRanking)이 열릴 때마다 최신값을 받아온다.
  fetchPersonalRanking: () => Promise<MutationResult<PersonalRankingEntry[]>>;

  // 8a "영수증 촬영/갤러리 선택" → 8b로 넘길 임시 이미지(2026-09-17 실제 OCR 연동 신규).
  setPendingReceiptImage: (file: File | null) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

// 2c "알림" 두 토글(지출 기록 확인·그룹원 기록 확인) 전용 — 권한을 이미 받아뒀으면 진짜 브라우저(OS)
// 알림을 띄운다. 탭이 백그라운드여도 뜨지만, 탭·브라우저가 완전히 닫히면 못 받는다(그러려면 서버가
// 보내는 진짜 Web Push가 필요한데, 이번엔 그 범위는 빼기로 했다 — 사용자 확인). 컴포넌트 상태에 의존하지
// 않는 모듈 스코프 함수라 useEffect/useMemo 의존성 배열에 넣을 필요가 없다.
const DAILY_REMINDER_HOUR_KST = 20;
const DAILY_REMINDER_CHECK_INTERVAL_MS = 5 * 60 * 1000;
const DAILY_REMINDER_STORAGE_KEY = "shoot-daily-reminder-last-date";

function notifyBrowser(message: string) {
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    new Notification("ShooT", { body: message });
  }
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  // design/shoot/Settings.dc.html 초기값 그대로 켜짐으로 시작한다(이전 "알림음"도 켜짐이었다).
  expenseConfirm: true,
  groupMemberRecord: true,
  dailyReminder: false,
};

export function StoreProvider({ children }: { children: ReactNode }) {
  // 브라우저 Supabase 클라이언트 — 세션(쿠키)이 바뀌지 않는 한 매 렌더 새로 만들 필요가 없어 한 번만 생성한다.
  const [supabase] = useState(() => createClient());
  const [profiles, setProfiles] = useState<Profile[]>(INITIAL_PROFILES);
  // 2026-09-18 팀 요청: 실제 Supabase Auth 세션으로 교체 — null이면 로그인 안 된 상태다.
  const [session, setSession] = useState<Session | null>(null);
  // getSession()이 아직 응답하기 전엔 로그인 여부를 함부로 "false"로 단정하지 않는다(0 스플래시가
  // 잠깐 회원가입 화면을 보여줬다가 홈으로 튀는 깜빡임을 막기 위함).
  const [authReady, setAuthReady] = useState(false);
  // 아직 사진을 안 바꿨으면 null — 이때 화면들은 이니셜(글자) 아바타로 대신 보여준다.
  // [?] schema.sql profiles엔 avatar_url 컬럼이 없어 로컬 상태로만 남아있다(위 StoreValue 주석 참고).
  const [currentUserAvatarUrl, setCurrentUserAvatarUrl] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>(INITIAL_GROUP_MEMBERS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [savings, setSavings] = useState<Saving[]>(INITIAL_SAVINGS);
  const [incomes, setIncomes] = useState<MockIncome[]>(INITIAL_INCOMES);
  const [personalCategories, setPersonalCategories] = useState<CategoryDef[]>(PERSONAL_CATS);
  const [groupCategoriesById, setGroupCategoriesById] = useState<Record<string, CategoryDef[]>>({});
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [darkMode, setDarkMode] = useState(false);
  // 저금통 펫 키우기 — 완전히 새 기능이라 목업 시드가 없다(빈 배열로 시작, 로그인 후 실제로 채워짐).
  const [pets, setPets] = useState<Pet[]>([]);
  const [categoryGoals, setCategoryGoals] = useState<CategoryGoal[]>([]);
  const [goalRewards, setGoalRewards] = useState<GoalReward[]>([]);
  const [expenseReactions, setExpenseReactions] = useState<ExpenseReaction[]>([]);
  const [feedPopupPetId, setFeedPopupPetId] = useState<string | null>(null);
  const [pendingReceiptImage, setPendingReceiptImage] = useState<File | null>(null);
  // 출석체크 — 완전히 새 기능이라 목업 시드가 없다(다른 pets v2 테이블들과 같은 이유).
  const [attendanceCheckins, setAttendanceCheckins] = useState<AttendanceCheckin[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  // showToast 본체를 밖으로 빼서, value 안의 showToast 액션과 아래 그룹원 기록 알림 effect가 같이 쓴다.
  function showToastMessage(message: string) {
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 2200);
  }

  // hybranch F22(반려 캐릭터) 통합 — 그룹에 공유 지출이 새로 기록될 때마다 그 그룹의 그룹 펫을
  // 참여도 기반으로 자동 성장시킨다(수동 밥주기 없음, addExpense가 공유 지출일 때만 호출한다).
  // "최근 며칠 안에 몇 명이 기록했는지"로 정상/절반 성장을 가른다 — 기준은 lib/pets.ts 참고([?] placeholder).
  const growGroupPetFromSharedExpense = useCallback(
    async (groupId: string, expenseUserId: string, expenseDate: string) => {
      const pet = pets.find((p) => p.group_id === groupId);
      if (!pet) return;
      const windowStartStr = shiftDateKST(expenseDate, -(GROUP_PARTICIPATION_WINDOW_DAYS - 1));
      const recentContributors = new Set(
        expenses.filter((e) => e.group_id === groupId && e.is_shared && e.date >= windowStartStr && e.date <= expenseDate).map((e) => e.user_id)
      );
      recentContributors.add(expenseUserId); // setExpenses가 아직 반영 전일 수 있어 방금 넣은 사람도 명시적으로 포함.
      const xpGained = recentContributors.size >= 2 ? GROUP_XP_PER_SHARED_EXPENSE : Math.round(GROUP_XP_PER_SHARED_EXPENSE / GROUP_XP_HALF_RATE_DIVISOR);
      const { stageIndex, xpProgress } = applyXpGain(pet.stage_index, pet.xp_progress, xpGained);
      const { error } = await supabase.from("pets").update({ stage_index: stageIndex, xp_progress: xpProgress }).eq("id", pet.id);
      if (!error) {
        setPets((prev) => prev.map((p) => (p.id === pet.id ? { ...p, stage_index: stageIndex, xp_progress: xpProgress } : p)));
      }
    },
    [pets, expenses, supabase]
  );

  // 로그인 전(세션 확인 전 포함)엔 CURRENT_USER_ID(가짜 데모 계정, INITIAL_* 목업 데이터가 이 id로
  // 채워져 있다)를 그대로 쓰지만, 실제 로그인한 사람이 있으면 그 사람의 실제 id를 우선한다.
  const currentUserId = session?.user.id ?? CURRENT_USER_ID;
  const isLoggedIn = session !== null;

  // 앱이 처음 뜰 때 기존 세션이 있는지 확인하고, 이후 로그인/로그아웃/토큰 갱신을 계속 구독한다.
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [supabase]);

  // 로그인 상태가 되면(회원가입 트리거가 만들어 둔) 실제 profiles 행을 읽어와 이름을 반영한다 —
  // 데모용 가짜 프로필 배열에 실제 계정 하나를 얹는 방식이라, 그룹원으로 뜨는 가짜 계정들은 그대로 남는다.
  useEffect(() => {
    if (!session) return;
    let active = true;
    supabase
      .from("profiles")
      .select("id,name,avatar_url")
      .eq("id", session.user.id)
      .single()
      .then(({ data, error }) => {
        if (!active || error || !data) return;
        setProfiles((prev) =>
          prev.some((p) => p.id === data.id) ? prev.map((p) => (p.id === data.id ? { ...p, name: data.name } : p)) : [...prev, { id: data.id, name: data.name }]
        );
        setCurrentUserAvatarUrl(data.avatar_url);
      });
    return () => {
      active = false;
    };
  }, [session, supabase]);

  // 2026-09-18 추가: 로그인되면 그룹·그룹원·지출·저금 4개 테이블을 한 번에 읽어와 로컬 상태를 채운다.
  // RLS가 이미 "내가 볼 수 있는 행"만 걸러주므로 전부 select("*")로 충분하다 — 로그인 전 보이던
  // INITIAL_* 데모 데이터(가짜 계정 id)는 실제 계정으로 교체되면서 사라진다(새 계정은 빈 상태로 시작).
  useEffect(() => {
    if (!session) return;
    let active = true;
    Promise.all([
      supabase.from("groups").select("*"),
      supabase.from("group_members").select("*"),
      supabase.from("expenses").select("*").order("created_at", { ascending: false }),
      supabase.from("savings").select("*").order("created_at", { ascending: false }),
      supabase.from("incomes").select("*").order("created_at", { ascending: false }),
      // 저금통 펫(내 개인 펫 + 내가 속한 그룹의 그룹 펫) — pets_select_own_or_group_member 정책이
      // 이미 "내가 볼 수 있는 펫"만 걸러준다.
      supabase.from("pets").select("*"),
      // 목표(예산 대체)·목표 보상 — 본인 것만(RLS).
      supabase.from("category_goals").select("*"),
      supabase.from("goal_rewards").select("*"),
      // F23 이모지 반응 — 내가 볼 수 있는 지출의 반응만(RLS).
      supabase.from("expense_reactions").select("*"),
      // 출석체크 — 본인 것만(RLS). 연속 출석 계산에 최근 기록이 필요하므로 전부 읽어온다.
      supabase.from("attendance_checkins").select("*"),
    ]).then(([groupsRes, membersRes, expensesRes, savingsRes, incomesRes, petsRes, goalsRes, rewardsRes, reactionsRes, checkinsRes]) => {
      if (!active) return;
      if (!groupsRes.error && groupsRes.data) setGroups(groupsRes.data);
      if (!membersRes.error && membersRes.data) setGroupMembers(membersRes.data);
      if (!expensesRes.error && expensesRes.data) setExpenses(expensesRes.data);
      if (!savingsRes.error && savingsRes.data) setSavings(savingsRes.data);
      if (!incomesRes.error && incomesRes.data) setIncomes(incomesRes.data);
      if (!petsRes.error && petsRes.data) setPets(petsRes.data);
      if (!goalsRes.error && goalsRes.data) setCategoryGoals(goalsRes.data);
      if (!rewardsRes.error && rewardsRes.data) setGoalRewards(rewardsRes.data);
      if (!reactionsRes.error && reactionsRes.data) setExpenseReactions(reactionsRes.data);
      if (!checkinsRes.error && checkinsRes.data) setAttendanceCheckins(checkinsRes.data);
    });
    return () => {
      active = false;
    };
  }, [session, supabase]);

  // 2026-09-19 추가: 2c "그룹원 기록 확인 알림" — 예전엔 mock이 단일 사용자 기준이라 "다른 그룹원이
  // 방금 기록했다"는 상황 자체를 재현할 수 없어 토글만 있고 기능이 없었다. 이제 실제 Supabase라
  // Realtime(Postgres Changes)으로 expenses INSERT를 구독해서 실제로 띄운다. expenses에도 RLS가
  // 그대로 적용돼(내 것 + 내가 멤버인 그룹의 공유 지출만) 이벤트가 오므로, 그중 "본인이 아닌" 것만
  // 알린다(본인 기록은 "지출 기록 시 확인 알림"이 따로 처리). Realtime을 받으려면 Supabase 프로젝트의
  // supabase_realtime publication에 expenses 테이블이 추가돼 있어야 한다(schema.sql 맨 끝 참고).
  useEffect(() => {
    if (!session) return;
    const channel = supabase
      .channel("expenses-inserts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "expenses" }, (payload) => {
        const row = payload.new as Expense;
        if (row.user_id === session.user.id) return;
        if (!row.is_shared || !row.group_id) return;
        if (!notificationSettings.groupMemberRecord) return;
        const group = groups.find((g) => g.id === row.group_id);
        if (!group) return; // RLS를 통과해 왔다면 이론상 내 그룹이지만, 방어적으로 한 번 더 확인.
        const author = profiles.find((p) => p.id === row.user_id);
        const message = `${group.name} · ${author?.name ?? "그룹원"}님이 ${row.category} 비용을 저장하였어요`;
        showToastMessage(message);
        notifyBrowser(message);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, supabase, groups, profiles, notificationSettings]);

  // 2026-09-18 추가(신규 기능): "저녁 리마인더" — 오후 8시(KST) 이후인데 오늘 지출을 하나도 안
  // 기록했으면 한 번 알려준다. 서버 스케줄러 없이 앱이 열려 있는 동안만 5분마다 확인한다(탭을 닫으면
  // 못 받는 건 알림 토글 전체와 같은 한계). 하루에 한 번만 뜨도록 localStorage에 오늘 날짜를 남긴다.
  useEffect(() => {
    if (!notificationSettings.dailyReminder || !session) return;
    function checkAndRemind() {
      const kstHour = Number(
        new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Seoul", hour: "2-digit", hour12: false }).format(new Date())
      );
      if (kstHour < DAILY_REMINDER_HOUR_KST) return;
      if (window.localStorage.getItem(DAILY_REMINDER_STORAGE_KEY) === TODAY_DATE) return;
      const recordedToday = expenses.some((e) => e.user_id === currentUserId && e.date === TODAY_DATE);
      if (recordedToday) return;
      window.localStorage.setItem(DAILY_REMINDER_STORAGE_KEY, TODAY_DATE);
      const message = "오늘 지출을 아직 기록하지 않았어요. 잊기 전에 남겨볼까요?";
      showToastMessage(message);
      notifyBrowser(message);
    }
    checkAndRemind();
    const timer = window.setInterval(checkAndRemind, DAILY_REMINDER_CHECK_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [notificationSettings.dailyReminder, session, expenses, currentUserId]);

  // 2026-09-19 버그 수정: profiles는 "내 프로필"만 읽어왔어서, 같은 그룹의 다른 사람 이름은
  // store.profiles에 없어 화면들이 전부 "알 수 없음"으로 표시했다(10a-1 위임 대상 선택, 5b 그룹
  // 피드 작성자 이름 등). group_members가 새로 채워지거나 바뀔 때마다, 아직 profiles에 없는
  // user_id들의 이름을 한 번에 읽어와 채운다(profiles_select_any_authenticated 정책 — 로그인한
  // 사람은 누구나 다른 사람 이름을 읽을 수 있게 돼 있어 이 조회 자체는 원래도 허용돼 있었다).
  useEffect(() => {
    if (!session) return;
    const known = new Set(profiles.map((p) => p.id));
    const missing = Array.from(new Set(groupMembers.map((m) => m.user_id))).filter((id) => !known.has(id));
    if (missing.length === 0) return;
    let active = true;
    supabase
      .from("profiles")
      .select("id,name")
      .in("id", missing)
      .then(({ data, error }) => {
        if (!active || error || !data || data.length === 0) return;
        setProfiles((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const toAdd = data.filter((p) => !existingIds.has(p.id));
          return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
        });
      });
    return () => {
      active = false;
    };
  }, [session, supabase, groupMembers, profiles]);

  const value = useMemo<StoreValue>(
    () => ({
      profiles,
      currentUserEmail: session?.user.email ?? "",
      session,
      authReady,
      currentUserAvatarUrl,
      groups,
      groupMembers,
      expenses,
      savings,
      incomes,
      personalCategories,
      groupCategoriesById,
      toastMessage,
      isLoggedIn,
      notificationSettings,
      darkMode,
      pets,
      categoryGoals,
      goalRewards,
      expenseReactions,
      feedPopupPetId,
      pendingReceiptImage,
      attendanceCheckins,
      currentUserId,

      // P1: 그룹 이름이 비어 있으면 호출하는 쪽(화면)에서 막아야 한다 — 여기서도 방어적으로 한 번 더 막는다.
      // 실제 groups INSERT → 성공하면 이어서 group_members INSERT(OWNER)까지 해야 그룹이 완성된다.
      // 두 요청 사이에 실패하면(드묾) 그룹만 만들어지고 멤버가 없는 상태로 남을 수 있다 — 별도 트랜잭션
      // 처리는 하지 않는다(schema.sql이 stored procedure를 쓰지 않는 지금 범위에선 과한 대응이라 판단).
      //
      // 2026-09-19 버그 수정: .insert().select()로 방금 넣은 행을 돌려받으려 하면 PostgREST가
      // INSERT ... RETURNING *로 실행하는데, Postgres RLS는 이 RETURNING 결과도 SELECT 정책을
      // 통과해야 돌려준다 — 그런데 groups_select_member_only는 "이미 그 그룹 멤버여야" 통과되고,
      // 막 만든 그룹은 아직 group_members에 OWNER 행이 없다(바로 다음 줄에서 넣음). 그래서 insert
      // 자체(WITH CHECK)는 문제없는데도 "new row violates row-level security policy"가 났던 거다
      // — 정책이 잘못된 게 아니라 RETURNING이 요구하는 select 쪽 문제였다. id·시각을 브라우저에서
      // 미리 만들어 넣고 .select()를 아예 안 써서 이 문제 자체를 피한다.
      async createGroup(name: string, groupType: GroupType): Promise<MutationResult<Group>> {
        if (!session) return { ok: false, error: "로그인이 필요해요" };
        const trimmed = name.trim();
        const newGroup: Group = {
          id: crypto.randomUUID(),
          name: trimmed.length > 0 ? trimmed : "이름 없는 그룹",
          group_type: groupType,
          invite_code: generateInviteCode(),
          created_at: new Date().toISOString(),
        };
        const { error: groupError } = await supabase.from("groups").insert(newGroup);
        if (groupError) return { ok: false, error: groupError.message };
        const newMember: GroupMember = {
          id: crypto.randomUUID(),
          user_id: session.user.id,
          group_id: newGroup.id,
          role: "OWNER",
          nickname: null,
          joined_at: new Date().toISOString(),
        };
        const { error: memberError } = await supabase.from("group_members").insert(newMember);
        if (memberError) return { ok: false, error: memberError.message };
        setGroups((prev) => [...prev, newGroup]);
        setGroupMembers((prev) => [...prev, newMember]);
        return { ok: true, data: newGroup };
      },

      // P3(중복 참여 방지)는 join_group_by_invite_code RPC 안(schema.sql)에서 확인한다 — groups는
      // 멤버만 select 가능한 RLS라 클라이언트가 직접 invite_code로 조회할 수 없기 때문에 RPC를 거친다.
      async joinGroupByInviteCode(code: string): Promise<JoinResult> {
        const normalized = code.trim().toUpperCase();
        if (!session || normalized.length === 0) return { ok: false, reason: "not_found" };
        const { data, error } = await supabase.rpc("join_group_by_invite_code", { p_invite_code: normalized });
        if (error) {
          if (error.message.includes("ALREADY_MEMBER")) return { ok: false, reason: "already_member" };
          return { ok: false, reason: "not_found" };
        }
        const newGroup = data as Group;
        const { data: newMember } = await supabase
          .from("group_members")
          .select("*")
          .eq("group_id", newGroup.id)
          .eq("user_id", session.user.id)
          .maybeSingle();
        setGroups((prev) => (prev.some((g) => g.id === newGroup.id) ? prev : [...prev, newGroup]));
        if (newMember) setGroupMembers((prev) => [...prev, newMember]);
        return { ok: true, group: newGroup };
      },

      async addExpense(input: Omit<Expense, "id" | "created_at">): Promise<MutationResult<Expense>> {
        const { data, error } = await supabase.from("expenses").insert(input).select().single();
        if (error || !data) return { ok: false, error: error?.message ?? "지출을 저장하지 못했어요" };
        setExpenses((prev) => [data, ...prev]);
        // hybranch F22 통합 — 공유 지출이면 그 그룹의 그룹 펫을 참여도 기반으로 자동 성장시킨다.
        if (data.is_shared && data.group_id) {
          await growGroupPetFromSharedExpense(data.group_id, data.user_id, data.date);
        }
        return { ok: true, data };
      },

      // P6 · F14: 본인이 등록한 지출이 아니면 수정할 수 없다 — 그룹장이라도 예외 없다.
      // (RLS expenses_update_own_only가 실제로 막는다 — 남의 지출이면 0행 갱신되고 data가 null로 온다.)
      async updateExpense(id: string, patch: Omit<Expense, "id" | "created_at" | "user_id">): Promise<boolean> {
        const { data, error } = await supabase.from("expenses").update(patch).eq("id", id).select().maybeSingle();
        if (error || !data) return false;
        setExpenses((prev) => prev.map((e) => (e.id === id ? data : e)));
        return true;
      },

      // P6과 같은 이유로 본인 지출만 지울 수 있다(expenses_delete_own_only) — 남의 지출이면
      // 0행 삭제되고 error 없이 data가 빈 배열로 온다(count로 실제 삭제 여부를 확인한다).
      async deleteExpense(id: string): Promise<boolean> {
        const { error, count } = await supabase.from("expenses").delete({ count: "exact" }).eq("id", id);
        if (error || !count) return false;
        setExpenses((prev) => prev.filter((e) => e.id !== id));
        return true;
      },

      async addIncome(input: Omit<MockIncome, "id" | "created_at">): Promise<MutationResult<MockIncome>> {
        const { data, error } = await supabase.from("incomes").insert(input).select().single();
        if (error || !data) return { ok: false, error: error?.message ?? "수입을 저장하지 못했어요" };
        setIncomes((prev) => [data, ...prev]);
        return { ok: true, data };
      },

      // incomes_delete_own on(user_id = auth.uid())이 실제로 막는다 — 남의 수입이면 0행 삭제되고
      // error 없이 count가 0으로 온다(deleteExpense와 같은 패턴).
      async deleteIncome(id: string): Promise<boolean> {
        const { error, count } = await supabase.from("incomes").delete({ count: "exact" }).eq("id", id);
        if (error || !count) return false;
        setIncomes((prev) => prev.filter((i) => i.id !== id));
        return true;
      },

      // 2026-09-17 팀 결정(개인·그룹 카테고리 차별화) — scope의 카테고리 목록을 읽는다. 그룹이 아직 한
      // 번도 편집·추가된 적 없으면 groupCategoriesById에 없다 — 그때는 그 그룹의 유형별 프리셋(groupToCats)을
      // 그대로 보여준다(6번 화면이 원래 쓰던 것과 동일한 기본값).
      getCategoriesForScope(scope: CategoryScope): CategoryDef[] {
        if (scope.kind === "personal") return personalCategories;
        return groupCategoriesById[scope.groupId] ?? groupToCats(groups.find((g) => g.id === scope.groupId)?.group_type ?? null);
      },

      // 2c "카테고리 편집" — 이름만 바꾼다(scope 안에서만). 빈 값이면 무시.
      renameCategoryInScope(scope: CategoryScope, id: string, newLabel: string) {
        const trimmed = newLabel.trim();
        if (trimmed.length === 0) return;
        if (scope.kind === "personal") {
          setPersonalCategories((prev) => prev.map((c) => (c.id === id ? { ...c, label: trimmed } : c)));
          return;
        }
        const { groupId } = scope;
        setGroupCategoriesById((prev) => {
          const current = prev[groupId] ?? groupToCats(groups.find((g) => g.id === groupId)?.group_type ?? null);
          return { ...prev, [groupId]: current.map((c) => (c.id === id ? { ...c, label: trimmed } : c)) };
        });
      },

      // 2c "카테고리 추가"(편집 모드에서만) · 6 "직접 입력" 저장 시 — scope에 새 카테고리를 더한다.
      // 이미 같은 이름(label)이 있으면 중복으로 새로 안 만든다.
      addCategoryInScope(scope: CategoryScope, label: string) {
        const trimmed = label.trim();
        if (trimmed.length === 0) return;
        if (scope.kind === "personal") {
          setPersonalCategories((prev) => (prev.some((c) => c.label === trimmed) ? prev : [...prev, makeCategory(trimmed, prev.length)]));
          return;
        }
        const { groupId } = scope;
        setGroupCategoriesById((prev) => {
          const current = prev[groupId] ?? groupToCats(groups.find((g) => g.id === groupId)?.group_type ?? null);
          if (current.some((c) => c.label === trimmed)) return prev;
          return { ...prev, [groupId]: [...current, makeCategory(trimmed, current.length)] };
        });
      },

      // 1(회원가입) — 실제 supabase.auth.signUp. name은 raw_user_meta_data로 넘겨서
      // schema.sql의 handle_new_user() 트리거가 profiles.name에 그대로 넣게 한다.
      async signUp(name: string, email: string, password: string): Promise<AuthResult> {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { name: name.trim() } },
        });
        if (error) return { ok: false, error: translateAuthError(error.message) };
        // Confirm email이 꺼져 있으면 signUp이 바로 세션을 준다 — 켜져 있으면 세션 없이 성공만 온다
        // (그 경우 2에서 로그인해야 세션이 생긴다. Supabase 대시보드 Authentication > Providers > Email 참고).
        if (data.session) setSession(data.session);
        return { ok: true };
      },

      // 2(로그인) — 실제 supabase.auth.signInWithPassword.
      async signIn(email: string, password: string): Promise<AuthResult> {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) return { ok: false, error: translateAuthError(error.message) };
        setSession(data.session);
        return { ok: true };
      },

      // 카카오 계정 연동(2026-09-18 신규) — supabase.auth.signInWithOAuth은 카카오 로그인 화면으로
      // 브라우저를 통째로 이동시킨다(팝업 아님). 로그인/동의 후 Supabase가 이 앱 주소(redirectTo)로
      // 다시 돌려보내면, Supabase 클라이언트가 URL의 토큰을 자동으로 읽어 세션을 만든다 — 그러면
      // 이미 있는 onAuthStateChange 구독이 session을 갱신하고, Main 화면의 effect가 자동으로
      // enterApp()을 불러 홈으로 들어간다(신규 사용자면 Supabase가 profiles 행도 트리거로 만든다).
      // 그래서 이 함수는 성공/실패를 굳이 안 돌려준다 — 리다이렉트 자체가 안 되는 드문 경우만 에러로 본다.
      async signInWithKakao(): Promise<AuthResult> {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "kakao",
          options: { redirectTo: window.location.origin },
        });
        if (error) return { ok: false, error: translateAuthError(error.message) };
        return { ok: true };
      },

      // "비밀번호를 잊으셨나요?" — 실제 supabase.auth.resetPasswordForEmail. 성공 여부와 무관하게(가입
      // 안 된 이메일이어도) 같은 안내를 보여주는 게 보통이지만, Supabase가 실제로 반환한 에러는 그대로
      // 옮겨서 화면에 보여준다(다른 signXxx 액션들과 일관되게).
      async sendPasswordResetEmail(email: string): Promise<AuthResult> {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) return { ok: false, error: translateAuthError(error.message) };
        return { ok: true };
      },

      // 10(마이페이지) 로그아웃 — 실제 supabase.auth.signOut.
      async signOut(): Promise<void> {
        await supabase.auth.signOut();
        setSession(null);
      },

      async deleteAccount(): Promise<AuthResult> {
        if (!session) return { ok: false, error: "로그인이 필요해요" };
        let res: Response;
        try {
          res = await fetch("/api/account", {
            method: "DELETE",
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
        } catch {
          return { ok: false, error: "요청을 보내지 못했어요. 잠시 후 다시 시도해주세요" };
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          return { ok: false, error: body.error ?? "탈퇴 처리에 실패했어요" };
        }
        await supabase.auth.signOut();
        setSession(null);
        return { ok: true };
      },

      // 10b "내 정보 변경" 닉네임 — profiles.name을 실제로 갱신한다. 로그인 전(목업 데모 계정)이면
      // 화면에 즉시 보이도록 로컬 상태만 바꾸고 서버 호출은 건너뛴다.
      async updateCurrentUserName(name: string): Promise<void> {
        const trimmed = name.trim();
        if (trimmed.length === 0) return;
        setProfiles((prev) => prev.map((p) => (p.id === currentUserId ? { ...p, name: trimmed } : p)));
        if (!session) return;
        // schema.sql profiles_update_own_only 정책이 있어야 이 UPDATE가 통과한다(2026-09-18에 함께 추가).
        await supabase.from("profiles").update({ name: trimmed }).eq("id", session.user.id);
      },

      // 10b "내 정보 변경" 이메일 — 실제 supabase.auth.updateUser({email}). 프로젝트 설정에 따라
      // 확인 메일 발송 후에나 실제로 바뀔 수 있다 — 그동안은 이전 이메일이 그대로 보인다.
      async updateCurrentUserEmail(email: string): Promise<AuthResult> {
        const trimmed = email.trim();
        if (trimmed.length === 0 || !session) return { ok: true };
        const { error } = await supabase.auth.updateUser({ email: trimmed });
        if (error) return { ok: false, error: translateAuthError(error.message) };
        return { ok: true };
      },

      // 10b "내 정보 변경" 비밀번호 — 빈 값이면 그대로 유지(바꾸지 않음).
      async updateCurrentUserPassword(password: string): Promise<AuthResult> {
        if (password.length === 0 || !session) return { ok: true };
        const { error } = await supabase.auth.updateUser({ password });
        if (error) return { ok: false, error: translateAuthError(error.message) };
        return { ok: true };
      },

      // 2026-09-18 수정: profiles.avatar_url에 실제로 저장한다(011 마이그레이션) — data URL을 그대로
      // 저장한다(Storage 버킷 없이 가장 짧게 가는 길, 다른 화면들도 이미지를 로컬 상태로만 다뤄왔다).
      async updateCurrentUserAvatar(url: string | null) {
        setCurrentUserAvatarUrl(url);
        if (!session) return;
        await supabase.from("profiles").update({ avatar_url: url }).eq("id", session.user.id);
      },

      toggleNotification(key: keyof NotificationSettings) {
        setNotificationSettings((prev) => {
          const next = !prev[key];
          if (next && typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
          }
          return { ...prev, [key]: next };
        });
      },

      showToast(message: string) {
        showToastMessage(message);
      },

      notifyExpenseSaved(message: string) {
        if (!notificationSettings.expenseConfirm) return;
        showToastMessage(message);
        notifyBrowser(message);
      },

      toggleDarkMode() {
        setDarkMode((prev) => !prev);
      },

      // F18 · P10 상태값1: 현재 OWNER(나)를 지정한 멤버로 교체한다. 새 그룹장을 먼저 OWNER로 올리고
      // 나서 내 role을 MEMBER로 내린다 — 순서를 바꾸면 두 번째 UPDATE 시점엔 내가 이미 MEMBER라
      // RLS(members_update_owner_transfers_role, "호출자가 OWNER인지"를 확인)가 막아버린다.
      async delegateOwner(groupId: string, newOwnerUserId: string): Promise<void> {
        if (!session) return;
        await supabase.from("group_members").update({ role: "OWNER" }).eq("group_id", groupId).eq("user_id", newOwnerUserId);
        await supabase.from("group_members").update({ role: "MEMBER" }).eq("group_id", groupId).eq("user_id", session.user.id);
        setGroupMembers((prev) =>
          prev.map((m) => {
            if (m.group_id !== groupId) return m;
            if (m.user_id === currentUserId) return { ...m, role: "MEMBER" };
            if (m.user_id === newOwnerUserId) return { ...m, role: "OWNER" };
            return m;
          })
        );
      },

      // P10: 그룹장은 새 그룹장을 지정하지 않으면 나갈 수 없다(그룹원이 혼자면 예외 — 그룹·지출·저금 함께 삭제).
      async leaveGroup(groupId: string): Promise<LeaveGroupResult> {
        if (!session) return { ok: true };
        const membersOfGroup = groupMembers.filter((m) => m.group_id === groupId);
        const me = membersOfGroup.find((m) => m.user_id === currentUserId);
        if (!me) return { ok: true };
        const isOwner = me.role === "OWNER";
        const others = membersOfGroup.filter((m) => m.user_id !== currentUserId);

        if (isOwner && others.length > 0) {
          // 05-policy.md P10 — "새 그룹장을 먼저 지정해주세요" 오류. 10a에서 먼저 위임을 시켜야 한다.
          return { ok: false, reason: "must_delegate" };
        }

        if (isOwner && others.length === 0) {
          // 05-policy.md 상태값1 — 혼자뿐이면 그룹·지출을 함께 삭제(schema.sql: expenses.group_id는
          // on delete set null이지만, 06-data.md 상태값1은 "그룹·지출 함께 삭제"라고 명시적으로 정해서
          // 그대로 따른다). savings.group_id → groups(id) FK는 ON DELETE 지정이 없어(RESTRICT) 저금
          // 행이 남아있으면 그룹 삭제 자체가 실패하므로, 지출·저금을 먼저 지운 다음 그룹을 지운다
          // (group_members는 on delete cascade라 그룹만 지우면 같이 정리된다).
          await supabase.from("expenses").delete().eq("group_id", groupId);
          await supabase.from("savings").delete().eq("group_id", groupId);
          await supabase.from("groups").delete().eq("id", groupId);
          setGroups((prev) => prev.filter((g) => g.id !== groupId));
          setGroupMembers((prev) => prev.filter((m) => m.group_id !== groupId));
          setExpenses((prev) => prev.filter((e) => e.group_id !== groupId));
          setSavings((prev) => prev.filter((s) => s.group_id !== groupId));
          return { ok: true };
        }

        // 일반 멤버는 바로 나갈 수 있다.
        await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", session.user.id);
        setGroupMembers((prev) => prev.filter((m) => !(m.group_id === groupId && m.user_id === currentUserId)));
        return { ok: true };
      },

      // P1(펫 선택) — 개인 펫은 본인 명의로, 그룹 펫은 group_id로 만든다(schema.sql pets_owner_exclusive
      // 제약 — 배타적). 종(species) 선택은 없앴다 — 마스코트 하나 + 기본 색상으로 시작하고, 개인 펫은
      // 나중에 setPetColors로 꾸민다. .select() 없이 id·시각을 미리 만들어 넣는다(createGroup과 같은
      // 이유 — 막 만든 그룹 펫은 아직 RETURNING이 요구하는 select 정책을 못 만족할 수 있어서).
      async createPet(scope: CategoryScope, name: string): Promise<MutationResult<Pet>> {
        if (!session) return { ok: false, error: "로그인이 필요해요" };
        const trimmed = name.trim();
        const newPet: Pet = {
          id: crypto.randomUUID(),
          user_id: scope.kind === "personal" ? session.user.id : null,
          group_id: scope.kind === "group" ? scope.groupId : null,
          pet_name: trimmed.length > 0 ? trimmed : null,
          stage_index: 1,
          xp_progress: 0,
          total_coins: 0,
          last_fed_date: null,
          body_color: DEFAULT_PET_COLORS.body,
          ledger_color: DEFAULT_PET_COLORS.ledger,
          bag_color: DEFAULT_PET_COLORS.bag,
          eye_color: DEFAULT_PET_COLORS.eyes,
          leaf_color: DEFAULT_PET_COLORS.leaf,
          created_at: new Date().toISOString(),
        };
        const { error } = await supabase.from("pets").insert(newPet);
        if (error) return { ok: false, error: error.message };
        setPets((prev) => [...prev, newPet]);
        return { ok: true, data: newPet };
      },

      // P3 "밥 주기" — 개인 펫 전용, 하루 1회 제한(§3). XP 지급·단계 승급은 lib/pets.ts applyXpGain 참고.
      // 2026-09-18 사용자 요청: "하루 한 번" 제한을 없애고, 코인이 있는 만큼 계속 먹일 수 있게
      // 바꿨다(먹일 때마다 FEED_COIN_COST만큼 코인을 쓴다 — 코인이 부족하면 못 먹인다).
      // last_fed_date는 여전히 갱신한다 — "며칠째 안 먹였는지"로 시무룩 여부를 판단하는 데 쓰인다.
      async feedPet(petId: string): Promise<MutationResult<{ xpGained: number; leveledUp: boolean }>> {
        const pet = pets.find((p) => p.id === petId);
        if (!pet) return { ok: false, error: "펫을 찾을 수 없어요" };
        if (pet.total_coins < FEED_COIN_COST) return { ok: false, error: "코인이 부족해요" };
        const { stageIndex, xpProgress } = applyXpGain(pet.stage_index, pet.xp_progress, FEED_XP_DEFAULT);
        const newTotalCoins = pet.total_coins - FEED_COIN_COST;
        const { error } = await supabase
          .from("pets")
          .update({ stage_index: stageIndex, xp_progress: xpProgress, last_fed_date: TODAY_DATE, total_coins: newTotalCoins })
          .eq("id", petId);
        if (error) return { ok: false, error: error.message };
        setPets((prev) =>
          prev.map((p) => (p.id === petId ? { ...p, stage_index: stageIndex, xp_progress: xpProgress, last_fed_date: TODAY_DATE, total_coins: newTotalCoins } : p))
        );
        return { ok: true, data: { xpGained: FEED_XP_DEFAULT, leveledUp: stageIndex > pet.stage_index } };
      },

      // 지출 기록(신규) 성공 직후 호출 — 개인 펫이 있고 오늘 아직 안 먹였을 때만 P3 팝업을 연다.
      openFeedPopupIfEligible() {
        const personalPet = pets.find((p) => p.user_id === currentUserId);
        if (personalPet && personalPet.last_fed_date !== TODAY_DATE) {
          setFeedPopupPetId(personalPet.id);
        }
      },

      closeFeedPopup() {
        setFeedPopupPetId(null);
      },

      // 개인 펫 색상 커스텀(그룹 펫엔 안 씀 — "개인용 펫만" 색상 변경 가능이라는 사용자 확인 그대로).
      async setPetColors(petId: string, colors: Partial<Record<PetColorPart, string>>): Promise<MutationResult<Pet>> {
        const pet = pets.find((p) => p.id === petId);
        if (!pet) return { ok: false, error: "펫을 찾을 수 없어요" };
        const patch = {
          ...(colors.body !== undefined ? { body_color: colors.body } : {}),
          ...(colors.ledger !== undefined ? { ledger_color: colors.ledger } : {}),
          ...(colors.bag !== undefined ? { bag_color: colors.bag } : {}),
          ...(colors.eyes !== undefined ? { eye_color: colors.eyes } : {}),
          ...(colors.leaf !== undefined ? { leaf_color: colors.leaf } : {}),
        };
        const { error } = await supabase.from("pets").update(patch).eq("id", petId);
        if (error) return { ok: false, error: error.message };
        const updated: Pet = { ...pet, ...patch };
        setPets((prev) => prev.map((p) => (p.id === petId ? updated : p)));
        return { ok: true, data: updated };
      },

      // shooTbranch 통합 — 월별·카테고리별 목표. 있으면 갱신, 없으면 새로 만든다(upsert, unique(user_id,category,month)).
      async setCategoryGoal(category: string, month: string, amount: number): Promise<MutationResult<CategoryGoal>> {
        if (!session) return { ok: false, error: "로그인이 필요해요" };
        const nowIso = new Date().toISOString();
        const existing = categoryGoals.find((g) => g.category === category && g.month === month);
        if (existing) {
          const { error } = await supabase.from("category_goals").update({ goal_amount: amount, updated_at: nowIso }).eq("id", existing.id);
          if (error) return { ok: false, error: error.message };
          const updated: CategoryGoal = { ...existing, goal_amount: amount, updated_at: nowIso };
          setCategoryGoals((prev) => prev.map((g) => (g.id === existing.id ? updated : g)));
          return { ok: true, data: updated };
        }
        const newGoal: CategoryGoal = {
          id: crypto.randomUUID(),
          user_id: session.user.id,
          category,
          month,
          goal_amount: amount,
          created_at: nowIso,
          updated_at: nowIso,
        };
        const { error } = await supabase.from("category_goals").insert(newGoal);
        if (error) return { ok: false, error: error.message };
        setCategoryGoals((prev) => [...prev, newGoal]);
        return { ok: true, data: newGoal };
      },

      // 2026-09-23 팀 요청(신규): 목표 삭제 — deleteExpense와 같은 패턴.
      async deleteCategoryGoal(id: string): Promise<boolean> {
        const { error, count } = await supabase.from("category_goals").delete({ count: "exact" }).eq("id", id);
        if (error || !count) return false;
        setCategoryGoals((prev) => prev.filter((g) => g.id !== id));
        return true;
      },

      // "퀘스트 달성하면 보상"(shooTbranch 통합, 2026-09-15 사용자 확인) — 배치 없이 화면을 열 때
      // 이번 달 설정된 목표들을 전부 계산한다. 카테고리·달마다 한 번만 보상(unique 제약 + 로컬 캐시로 방지).
      async getOrCreateGoalRewardsForMonth(): Promise<MutationResult<GoalReward[]>> {
        if (!session) return { ok: false, error: "로그인이 필요해요" };
        const month = currentMonthString(TODAY_DATE);
        const thisMonthGoals = categoryGoals.filter((g) => g.month === month);
        const results: GoalReward[] = [];
        let totalCoins = 0;
        let totalXp = 0;
        for (const goal of thisMonthGoals) {
          const existing = goalRewards.find((r) => r.category === goal.category && r.month === month);
          if (existing) {
            results.push(existing);
            continue;
          }
          const spentAmount = expenses
            .filter((e) => e.user_id === currentUserId && e.category === goal.category && e.date.startsWith(month))
            .reduce((sum, e) => sum + e.amount, 0);
          const achieved = spentAmount <= goal.goal_amount;
          const coinsEarned = achieved ? GOAL_ACHIEVED_REWARD_COINS : 0;
          const xpGained = achieved ? GOAL_ACHIEVED_REWARD_XP : 0;
          const newReward: GoalReward = {
            id: crypto.randomUUID(),
            user_id: session.user.id,
            category: goal.category,
            month,
            spent_amount: spentAmount,
            goal_amount: goal.goal_amount,
            achieved,
            coins_earned: coinsEarned,
            xp_gained: xpGained,
            created_at: new Date().toISOString(),
          };
          const { error } = await supabase.from("goal_rewards").insert(newReward);
          if (error) continue; // 이 카테고리만 건너뛰고 나머지는 계속 계산한다.
          results.push(newReward);
          totalCoins += coinsEarned;
          totalXp += xpGained;
        }
        setGoalRewards((prev) => {
          const existingIds = new Set(prev.map((r) => r.id));
          const toAdd = results.filter((r) => !existingIds.has(r.id));
          return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
        });

        // 보상 대상은 개인 펫이다(§4 "코인 지급과 동시에 펫 XP도 함께 지급"과 같은 원칙).
        const personalPet = pets.find((p) => p.user_id === currentUserId);
        if (personalPet && (totalCoins > 0 || totalXp > 0)) {
          const { stageIndex, xpProgress } = applyXpGain(personalPet.stage_index, personalPet.xp_progress, totalXp);
          const newTotalCoins = personalPet.total_coins + totalCoins;
          await supabase.from("pets").update({ stage_index: stageIndex, xp_progress: xpProgress, total_coins: newTotalCoins }).eq("id", personalPet.id);
          setPets((prev) =>
            prev.map((p) => (p.id === personalPet.id ? { ...p, stage_index: stageIndex, xp_progress: xpProgress, total_coins: newTotalCoins } : p))
          );
        }
        return { ok: true, data: results };
      },

      // F23 그룹 피드 이모지 반응(hybranch) — RLS가 그룹 멤버인지 확인해준다.
      async addReaction(expenseId: string, emoji: string): Promise<MutationResult<ExpenseReaction>> {
        if (!session) return { ok: false, error: "로그인이 필요해요" };
        const newReaction: ExpenseReaction = {
          id: crypto.randomUUID(),
          expense_id: expenseId,
          user_id: session.user.id,
          emoji,
          created_at: new Date().toISOString(),
        };
        const { error } = await supabase.from("expense_reactions").insert(newReaction);
        if (error) return { ok: false, error: error.message };
        setExpenseReactions((prev) => [...prev, newReaction]);
        return { ok: true, data: newReaction };
      },

      async removeReaction(expenseId: string, emoji: string): Promise<boolean> {
        if (!session) return false;
        const { error } = await supabase
          .from("expense_reactions")
          .delete()
          .eq("expense_id", expenseId)
          .eq("user_id", session.user.id)
          .eq("emoji", emoji);
        if (error) return false;
        setExpenseReactions((prev) => prev.filter((r) => !(r.expense_id === expenseId && r.user_id === session.user.id && r.emoji === emoji)));
        return true;
      },

      // 출석체크 — 접속률을 올리기 위한 신규 기능(2026-09-20 사용자 요청). 하루 한 번, 전날도 출석했으면
      // streak_day가 이어지고 7일째면 코인이 2배(CHECKIN_STREAK_BONUS_MULTIPLIER) 지급된 뒤 리셋된다.
      async checkInToday(): Promise<MutationResult<AttendanceCheckin>> {
        if (!session) return { ok: false, error: "로그인이 필요해요" };
        const already = attendanceCheckins.find((c) => c.user_id === session.user.id && c.checkin_date === TODAY_DATE);
        if (already) return { ok: false, error: "오늘은 이미 출석체크했어요" };

        const yesterdayStr = shiftDateKST(TODAY_DATE, -1);
        const prevCheckin = attendanceCheckins.find((c) => c.user_id === session.user.id && c.checkin_date === yesterdayStr);
        // 전날 기록이 있고 아직 주기(7일)를 다 안 채웠으면 이어가고, 없거나 이미 꽉 찼으면 1일째부터 새로 시작한다.
        const streakDay = prevCheckin && prevCheckin.streak_day < CHECKIN_STREAK_LENGTH ? prevCheckin.streak_day + 1 : 1;
        const coinsEarned = streakDay >= CHECKIN_STREAK_LENGTH ? CHECKIN_REWARD_COINS * CHECKIN_STREAK_BONUS_MULTIPLIER : CHECKIN_REWARD_COINS;

        const newCheckin: AttendanceCheckin = {
          id: crypto.randomUUID(),
          user_id: session.user.id,
          checkin_date: TODAY_DATE,
          streak_day: streakDay,
          coins_earned: coinsEarned,
          created_at: new Date().toISOString(),
        };
        const { error } = await supabase.from("attendance_checkins").insert(newCheckin);
        if (error) return { ok: false, error: error.message };
        setAttendanceCheckins((prev) => [...prev, newCheckin]);

        const personalPet = pets.find((p) => p.user_id === currentUserId);
        if (personalPet) {
          const newTotalCoins = personalPet.total_coins + coinsEarned;
          await supabase.from("pets").update({ total_coins: newTotalCoins }).eq("id", personalPet.id);
          setPets((prev) => prev.map((p) => (p.id === personalPet.id ? { ...p, total_coins: newTotalCoins } : p)));
        }
        return { ok: true, data: newCheckin };
      },

      // 개인 랭킹 — 로그인 전(목업 데모 계정)엔 RPC를 부를 세션이 없으니 빈 목록을 돌려준다.
      async fetchPersonalRanking(): Promise<MutationResult<PersonalRankingEntry[]>> {
        if (!session) return { ok: true, data: [] };
        const { data, error } = await supabase.rpc("get_personal_ranking");
        if (error) return { ok: false, error: error.message };
        return { ok: true, data: sortPersonalRanking((data ?? []) as PersonalRankingEntry[]) };
      },

      setPendingReceiptImage(file: File | null) {
        setPendingReceiptImage(file);
      },
    }),
    [profiles, session, authReady, currentUserId, currentUserAvatarUrl, groups, groupMembers, expenses, savings, incomes, personalCategories, groupCategoriesById, toastMessage, isLoggedIn, notificationSettings, darkMode, pets, categoryGoals, goalRewards, expenseReactions, feedPopupPetId, pendingReceiptImage, attendanceCheckins, supabase, growGroupPetFromSharedExpense]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore는 StoreProvider 안에서만 쓸 수 있다");
  return ctx;
}
