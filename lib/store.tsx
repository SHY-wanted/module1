"use client";
// lib/store.tsx — 목업 데이터를 React 상태로 들고 있는 전역 스토어(Context).
// 2026-09-18: 로그인/회원가입/로그아웃·내 정보 변경(profiles.name 포함)에 이어, 그룹·그룹원·지출·저금도
// 실제 Supabase 쿼리로 옮겼다 — supabase/schema.sql이 그 계약이다. 로그인하면 이 4개 테이블을 한 번에
// 읽어와 아래 React 상태를 "캐시"로 채우고, 이후 각 액션이 실제로 Supabase에 쓴 다음 그 결과로 캐시를 갱신한다.
// 카테고리(개인·그룹, DB 테이블 없음)·수입(schema.sql에 없는 E7)만 아직 목업 상태로 남아있다.

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
  generateId,
  generateInviteCode,
  type Expense,
  type Group,
  type GroupMember,
  type GroupType,
  type MockIncome,
  type Profile,
  type Saving,
} from "./mock";
import { PERSONAL_CATS, groupToCats, makeCategory, type CategoryDef, type CategoryScope } from "./categories";

// signUp/signIn/updateUser 실패 시 화면에 그대로 보여줄 결과 — Supabase 에러 메시지(영어)를 흔한 경우만
// 한국어로 바꾸고, 나머지는 그대로 보여준다(계정 잠김 등 팀이 문구를 아직 안 정한 경우들 [?]).
export interface AuthResult {
  ok: boolean;
  error?: string;
}

function translateAuthError(message: string): string {
  if (message.includes("Invalid login credentials")) return "이메일 또는 비밀번호가 맞지 않아요";
  if (message.includes("Email not confirmed")) return "이메일 인증 후 로그인할 수 있어요. 받으신 메일함을 확인해주세요";
  if (message.includes("User already registered")) return "이미 가입된 이메일이에요";
  if (message.includes("Password should be at least")) return "비밀번호는 6자 이상이어야 해요";
  return message;
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
  fontSize: FontSize;
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

export type FontSize = "small" | "medium" | "large";
export interface NotificationSettings {
  expenseConfirm: boolean;
  // 2026-09-17 팀 결정: "예산 초과 시 알림"은 삭제(예산 자체가 없는 기능이라). "알림음"은
  // "그룹원 기록 확인 알림"으로 대체 — 내가 속한 그룹에 다른 그룹원이 지출을 기록하면 알려준다.
  groupMemberRecord: boolean;
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
  addIncome: (input: Omit<MockIncome, "id" | "created_at">) => MockIncome;
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
  // 10(마이페이지) 로그아웃 — 실제 supabase.auth.signOut 호출.
  signOut: () => Promise<void>;
  // 10b "내 정보 변경" 닉네임 — profiles.name을 실제로 갱신한다(schema.sql profiles_update_own_only 필요).
  updateCurrentUserName: (name: string) => Promise<void>;
  // 10b "내 정보 변경" 이메일 — 실제 supabase.auth.updateUser({email}). 프로젝트 설정에 따라 새·이전
  // 이메일로 확인 메일이 발송되고, 확인 전까지는 auth.users.email이 안 바뀔 수 있다.
  updateCurrentUserEmail: (email: string) => Promise<AuthResult>;
  // 10b "내 정보 변경" 비밀번호 — 실제 supabase.auth.updateUser({password}). 빈 값이면 호출하지 않는다.
  updateCurrentUserPassword: (password: string) => Promise<AuthResult>;
  // 10b "내 정보 변경" — 프로필 사진을 바꾼다. null이면 사진을 지우고 이니셜로 되돌린다.
  // [?] supabase/schema.sql의 profiles엔 avatar_url 컬럼이 없다 — 팀 확인 전까지는 세션 흉내용
  // 로컬 상태로만 남아있고(새로고침하면 사라짐), 실제로 Storage에 올리지 않는다.
  updateCurrentUserAvatar: (url: string | null) => void;
  toggleNotification: (key: keyof NotificationSettings) => void;
  // 2.2초 동안 화면 위에 알림 문구를 띄운다(지출 기록 확인 알림 · 그룹원 기록 확인 알림이 이걸 쓴다).
  showToast: (message: string) => void;
  toggleDarkMode: () => void;
  setFontSize: (size: FontSize) => void;
  // 10a "그룹장 위임"(F18) — 현재 OWNER인 나 대신 선택한 멤버를 새 OWNER로 바꾼다. 새 그룹장을
  // 먼저 OWNER로 올리고 나서 내 role을 MEMBER로 내리는 순서로 실제 UPDATE 2번을 보낸다(순서를
  // 바꾸면 RLS members_update_owner_transfers_role이 두 번째 요청을 막는다 — schema.sql 참고).
  delegateOwner: (groupId: string, newOwnerUserId: string) => Promise<void>;
  // 10a "그룹 나가기" — P10: OWNER는 위임 없이 나갈 수 없다(단, 혼자뿐이면 예외로 그룹·지출·저금 함께 삭제).
  leaveGroup: (groupId: string) => Promise<LeaveGroupResult>;
}

const StoreContext = createContext<StoreValue | null>(null);

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  // design/shoot/Settings.dc.html 초기값 그대로 켜짐으로 시작한다(이전 "알림음"도 켜짐이었다).
  expenseConfirm: true,
  groupMemberRecord: true,
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
  const [fontSize, setFontSizeState] = useState<FontSize>("medium");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

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
      .select("id,name")
      .eq("id", session.user.id)
      .single()
      .then(({ data, error }) => {
        if (!active || error || !data) return;
        setProfiles((prev) =>
          prev.some((p) => p.id === data.id) ? prev.map((p) => (p.id === data.id ? { ...p, name: data.name } : p)) : [...prev, data]
        );
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
    ]).then(([groupsRes, membersRes, expensesRes, savingsRes]) => {
      if (!active) return;
      if (!groupsRes.error && groupsRes.data) setGroups(groupsRes.data);
      if (!membersRes.error && membersRes.data) setGroupMembers(membersRes.data);
      if (!expensesRes.error && expensesRes.data) setExpenses(expensesRes.data);
      if (!savingsRes.error && savingsRes.data) setSavings(savingsRes.data);
    });
    return () => {
      active = false;
    };
  }, [session, supabase]);

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
      fontSize,
      currentUserId,

      // P1: 그룹 이름이 비어 있으면 호출하는 쪽(화면)에서 막아야 한다 — 여기서도 방어적으로 한 번 더 막는다.
      // 실제 groups INSERT → 성공하면 이어서 group_members INSERT(OWNER)까지 해야 그룹이 완성된다.
      // 두 요청 사이에 실패하면(드묾) 그룹만 만들어지고 멤버가 없는 상태로 남을 수 있다 — 별도 트랜잭션
      // 처리는 하지 않는다(schema.sql이 stored procedure를 쓰지 않는 지금 범위에선 과한 대응이라 판단).
      async createGroup(name: string, groupType: GroupType): Promise<MutationResult<Group>> {
        if (!session) return { ok: false, error: "로그인이 필요해요" };
        const trimmed = name.trim();
        const { data: newGroup, error: groupError } = await supabase
          .from("groups")
          .insert({ name: trimmed.length > 0 ? trimmed : "이름 없는 그룹", group_type: groupType, invite_code: generateInviteCode() })
          .select()
          .single();
        if (groupError || !newGroup) return { ok: false, error: groupError?.message ?? "그룹을 만들지 못했어요" };
        const { data: newMember, error: memberError } = await supabase
          .from("group_members")
          .insert({ user_id: session.user.id, group_id: newGroup.id, role: "OWNER" })
          .select()
          .single();
        if (memberError || !newMember) return { ok: false, error: memberError?.message ?? "그룹을 만들지 못했어요" };
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

      addIncome(input: Omit<MockIncome, "id" | "created_at">): MockIncome {
        const newIncome: MockIncome = {
          ...input,
          id: generateId("in"),
          created_at: new Date().toISOString(),
        };
        setIncomes((prev) => [newIncome, ...prev]);
        return newIncome;
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

      // 10(마이페이지) 로그아웃 — 실제 supabase.auth.signOut.
      async signOut(): Promise<void> {
        await supabase.auth.signOut();
        setSession(null);
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

      updateCurrentUserAvatar(url: string | null) {
        setCurrentUserAvatarUrl(url);
      },

      toggleNotification(key: keyof NotificationSettings) {
        setNotificationSettings((prev) => ({ ...prev, [key]: !prev[key] }));
      },

      showToast(message: string) {
        if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
        setToastMessage(message);
        toastTimerRef.current = window.setTimeout(() => {
          setToastMessage(null);
          toastTimerRef.current = null;
        }, 2200);
      },

      toggleDarkMode() {
        setDarkMode((prev) => !prev);
      },

      setFontSize(size: FontSize) {
        setFontSizeState(size);
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
    }),
    [profiles, session, authReady, currentUserId, currentUserAvatarUrl, groups, groupMembers, expenses, savings, incomes, personalCategories, groupCategoriesById, toastMessage, isLoggedIn, notificationSettings, darkMode, fontSize, supabase]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore는 StoreProvider 안에서만 쓸 수 있다");
  return ctx;
}
