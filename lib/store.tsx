"use client";
// lib/store.tsx — 목업 데이터를 React 상태로 들고 있는 전역 스토어(Context).
// 2026-09-18 팀 요청으로 로그인/회원가입/로그아웃·내 이름·이메일·비밀번호(profiles.name 포함)는
// 실제 Supabase Auth + profiles 테이블로 바꿨다 — supabase/schema.sql이 그 계약이다.
// 그 외(그룹·지출·수입·저금·카테고리)는 아직 이 파일의 React 상태가 그대로 "DB" 역할을 한다
// (다음 단계에서 테이블별로 하나씩 Supabase 쿼리로 갈아끼울 것).

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

export type FontSize = "small" | "medium" | "large";
export interface NotificationSettings {
  expenseConfirm: boolean;
  // 2026-09-17 팀 결정: "예산 초과 시 알림"은 삭제(예산 자체가 없는 기능이라). "알림음"은
  // "그룹원 기록 확인 알림"으로 대체 — 내가 속한 그룹에 다른 그룹원이 지출을 기록하면 알려준다.
  groupMemberRecord: boolean;
}

interface StoreValue extends StoreState {
  currentUserId: string;
  createGroup: (name: string, groupType: GroupType) => Group;
  joinGroupByInviteCode: (code: string) => JoinResult;
  addExpense: (input: Omit<Expense, "id" | "created_at">) => Expense;
  // P6 · F14: 본인 지출만 수정 가능 — 그룹장도 예외 없음(05-policy.md).
  updateExpense: (id: string, patch: Omit<Expense, "id" | "created_at" | "user_id">) => boolean;
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
  // 10a "그룹장 위임"(F18) — 현재 OWNER인 나 대신 선택한 멤버를 새 OWNER로 바꾼다.
  delegateOwner: (groupId: string, newOwnerUserId: string) => void;
  // 10a "그룹 나가기" — P10: OWNER는 위임 없이 나갈 수 없다(단, 혼자뿐이면 예외로 그룹·지출 함께 삭제).
  leaveGroup: (groupId: string) => LeaveGroupResult;
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
  const [savings] = useState<Saving[]>(INITIAL_SAVINGS);
  const [incomes, setIncomes] = useState<MockIncome[]>(INITIAL_INCOMES);
  const [personalCategories, setPersonalCategories] = useState<CategoryDef[]>(PERSONAL_CATS);
  const [groupCategoriesById, setGroupCategoriesById] = useState<Record<string, CategoryDef[]>>({});
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSizeState] = useState<FontSize>("medium");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  // 그룹·지출 등은 아직 목업 상태라 CURRENT_USER_ID(가짜 데모 계정)를 그대로 쓰지만, 실제 로그인한
  // 사람이 있으면 그 사람의 실제 id를 우선한다 — 새로 만드는 그룹·지출은 실제 계정 명의로 남는다.
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
      createGroup(name: string, groupType: GroupType): Group {
        const trimmed = name.trim();
        const newGroup: Group = {
          id: generateId("g"),
          name: trimmed.length > 0 ? trimmed : "이름 없는 그룹",
          group_type: groupType,
          invite_code: generateInviteCode(),
          created_at: new Date().toISOString(),
        };
        setGroups((prev) => [...prev, newGroup]);
        setGroupMembers((prev) => [
          ...prev,
          {
            id: generateId("gm"),
            user_id: currentUserId,
            group_id: newGroup.id,
            role: "OWNER",
            nickname: null,
            joined_at: new Date().toISOString(),
          },
        ]);
        return newGroup;
      },

      // P3: 같은 그룹에 중복 참여 불가
      joinGroupByInviteCode(code: string): JoinResult {
        const normalized = code.trim().toUpperCase();
        const group = groups.find((g) => g.invite_code === normalized);
        if (!group) return { ok: false, reason: "not_found" };
        const already = groupMembers.some(
          (m) => m.group_id === group.id && m.user_id === currentUserId
        );
        if (already) return { ok: false, reason: "already_member", group };
        setGroupMembers((prev) => [
          ...prev,
          {
            id: generateId("gm"),
            user_id: currentUserId,
            group_id: group.id,
            role: "MEMBER",
            nickname: null,
            joined_at: new Date().toISOString(),
          },
        ]);
        return { ok: true, group };
      },

      addExpense(input: Omit<Expense, "id" | "created_at">): Expense {
        const newExpense: Expense = {
          ...input,
          id: generateId("e"),
          created_at: new Date().toISOString(),
        };
        setExpenses((prev) => [newExpense, ...prev]);
        return newExpense;
      },

      // P6 · F14: 본인이 등록한 지출이 아니면 수정할 수 없다 — 그룹장이라도 예외 없다.
      updateExpense(id: string, patch: Omit<Expense, "id" | "created_at" | "user_id">): boolean {
        const target = expenses.find((e) => e.id === id);
        if (!target || target.user_id !== currentUserId) return false;
        setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
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

      // F18 · P10 상태값1: 현재 OWNER(나)를 지정한 멤버로 교체한다.
      delegateOwner(groupId: string, newOwnerUserId: string) {
        setGroupMembers((prev) =>
          prev.map((m) => {
            if (m.group_id !== groupId) return m;
            if (m.user_id === currentUserId) return { ...m, role: "MEMBER" };
            if (m.user_id === newOwnerUserId) return { ...m, role: "OWNER" };
            return m;
          })
        );
      },

      // P10: 그룹장은 새 그룹장을 지정하지 않으면 나갈 수 없다(그룹원이 혼자면 예외 — 그룹·지출 함께 삭제).
      leaveGroup(groupId: string): LeaveGroupResult {
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
          // on delete set null이지만, 06-data.md 상태값1은 "그룹·지출 함께 삭제"라고 명시적으로 정해서 그대로 따른다).
          setGroups((prev) => prev.filter((g) => g.id !== groupId));
          setGroupMembers((prev) => prev.filter((m) => m.group_id !== groupId));
          setExpenses((prev) => prev.filter((e) => e.group_id !== groupId));
          return { ok: true };
        }

        // 일반 멤버는 바로 나갈 수 있다.
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
