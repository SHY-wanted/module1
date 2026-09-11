"use client";
// lib/store.tsx — 목업 데이터를 React 상태로 들고 있는 전역 스토어(Context).
// Supabase 연결 전까지는 이 파일이 "DB" 역할을 한다 — 그룹 생성·참여·지출 등록이 여기 상태를 바꾼다.

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
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
import { makeCustomCategory, type CategoryDef } from "./categories";

interface StoreState {
  profiles: Profile[];
  groups: Group[];
  groupMembers: GroupMember[];
  expenses: Expense[];
  savings: Saving[];
  incomes: MockIncome[];
  customCategories: CategoryDef[];
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
  budgetExceeded: boolean;
  sound: boolean;
}

interface StoreValue extends StoreState {
  currentUserId: string;
  createGroup: (name: string, groupType: GroupType) => Group;
  joinGroupByInviteCode: (code: string) => JoinResult;
  addExpense: (input: Omit<Expense, "id" | "created_at">) => Expense;
  // P6 · F14: 본인 지출만 수정 가능 — 그룹장도 예외 없음(05-policy.md).
  updateExpense: (id: string, patch: Omit<Expense, "id" | "created_at" | "user_id">) => boolean;
  addIncome: (input: Omit<MockIncome, "id" | "created_at">) => MockIncome;
  addCustomCategory: (label: string) => CategoryDef;
  setLoggedIn: (value: boolean) => void;
  toggleNotification: (key: keyof NotificationSettings) => void;
  toggleDarkMode: () => void;
  setFontSize: (size: FontSize) => void;
  // 10a "그룹장 위임"(F18) — 현재 OWNER인 나 대신 선택한 멤버를 새 OWNER로 바꾼다.
  delegateOwner: (groupId: string, newOwnerUserId: string) => void;
  // 10a "그룹 나가기" — P10: OWNER는 위임 없이 나갈 수 없다(단, 혼자뿐이면 예외로 그룹·지출 함께 삭제).
  leaveGroup: (groupId: string) => LeaveGroupResult;
}

const StoreContext = createContext<StoreValue | null>(null);

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  // design/shoot/Settings.dc.html 초기값 그대로(지출 기록 확인·알림음은 켜짐, 예산 초과는 꺼짐).
  expenseConfirm: true,
  budgetExceeded: false,
  sound: true,
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [profiles] = useState<Profile[]>(INITIAL_PROFILES);
  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>(INITIAL_GROUP_MEMBERS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [savings] = useState<Saving[]>(INITIAL_SAVINGS);
  const [incomes, setIncomes] = useState<MockIncome[]>(INITIAL_INCOMES);
  const [customCategories, setCustomCategories] = useState<CategoryDef[]>([]);
  // 0. 스플래시 분기(07-screens.md 2026-09-11 팀 결정) — 로그인 세션이 있으면 2b(홈)로, 없으면 1(회원가입)로.
  // 목업 단계라 처음엔 세션이 없다고 가정(false)하고, 1b·2a에서 로그인 성공 시 true로 바꾼다.
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSizeState] = useState<FontSize>("medium");

  const value = useMemo<StoreValue>(
    () => ({
      profiles,
      groups,
      groupMembers,
      expenses,
      savings,
      incomes,
      customCategories,
      isLoggedIn,
      notificationSettings,
      darkMode,
      fontSize,
      currentUserId: CURRENT_USER_ID,

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
            user_id: CURRENT_USER_ID,
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
          (m) => m.group_id === group.id && m.user_id === CURRENT_USER_ID
        );
        if (already) return { ok: false, reason: "already_member", group };
        setGroupMembers((prev) => [
          ...prev,
          {
            id: generateId("gm"),
            user_id: CURRENT_USER_ID,
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
        if (!target || target.user_id !== CURRENT_USER_ID) return false;
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

      // 2c 설정 "새 카테고리 추가" — 그룹별이 아니라 전역 배열로 단순화(2026-09-11 팀 결정).
      addCustomCategory(label: string): CategoryDef {
        const trimmed = label.trim();
        const newCat = makeCustomCategory(trimmed.length > 0 ? trimmed : "새 카테고리");
        setCustomCategories((prev) => [...prev, newCat]);
        return newCat;
      },

      setLoggedIn(value: boolean) {
        setIsLoggedIn(value);
      },

      toggleNotification(key: keyof NotificationSettings) {
        setNotificationSettings((prev) => ({ ...prev, [key]: !prev[key] }));
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
            if (m.user_id === CURRENT_USER_ID) return { ...m, role: "MEMBER" };
            if (m.user_id === newOwnerUserId) return { ...m, role: "OWNER" };
            return m;
          })
        );
      },

      // P10: 그룹장은 새 그룹장을 지정하지 않으면 나갈 수 없다(그룹원이 혼자면 예외 — 그룹·지출 함께 삭제).
      leaveGroup(groupId: string): LeaveGroupResult {
        const membersOfGroup = groupMembers.filter((m) => m.group_id === groupId);
        const me = membersOfGroup.find((m) => m.user_id === CURRENT_USER_ID);
        if (!me) return { ok: true };
        const isOwner = me.role === "OWNER";
        const others = membersOfGroup.filter((m) => m.user_id !== CURRENT_USER_ID);

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
        setGroupMembers((prev) => prev.filter((m) => !(m.group_id === groupId && m.user_id === CURRENT_USER_ID)));
        return { ok: true };
      },
    }),
    [profiles, groups, groupMembers, expenses, savings, incomes, customCategories, isLoggedIn, notificationSettings, darkMode, fontSize]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore는 StoreProvider 안에서만 쓸 수 있다");
  return ctx;
}
