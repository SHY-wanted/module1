// lib/selectors.ts — 화면에서 그대로 쓰는 "표시용" 파생 데이터를 스토어 원본 배열에서 계산한다.
// 그룹명·작성자 이름처럼 표시용 텍스트는 mock.ts에 중복 저장하지 않고 여기서 id로 조인해서 만든다.

import type { Expense, Group, GroupMember, MockIncome, Profile, Saving } from "./mock";
import { monthLabel } from "./format";

export function getProfile(profiles: Profile[], userId: string): Profile | undefined {
  return profiles.find((p) => p.id === userId);
}

export function getGroup(groups: Group[], groupId: string | null): Group | undefined {
  if (!groupId) return undefined;
  return groups.find((g) => g.id === groupId);
}

export function getGroupsForUser(groups: Group[], groupMembers: GroupMember[], userId: string): Group[] {
  const groupIds = new Set(groupMembers.filter((m) => m.user_id === userId).map((m) => m.group_id));
  return groups.filter((g) => groupIds.has(g.id));
}

export function getMemberCount(groupMembers: GroupMember[], groupId: string): number {
  return groupMembers.filter((m) => m.group_id === groupId).length;
}

export interface MemberWithProfile extends GroupMember {
  profile: Profile | undefined;
}
export function getGroupMembersWithProfile(
  groupMembers: GroupMember[],
  profiles: Profile[],
  groupId: string
): MemberWithProfile[] {
  return groupMembers
    .filter((m) => m.group_id === groupId)
    .map((m) => ({ ...m, profile: getProfile(profiles, m.user_id) }));
}

// 본인 소유(작성자)인 지출만 — ExpenseList(7)·Home(2b) "최근 지출"은 본인 지출 기준(P6과 일관되게 단순화).
export function getOwnExpenses(expenses: Expense[], userId: string): Expense[] {
  return expenses.filter((e) => e.user_id === userId);
}

export function getRecentOwnExpenses(expenses: Expense[], userId: string, limit: number): Expense[] {
  return getOwnExpenses(expenses, userId)
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
}

export interface ExpenseMonthGroup {
  month: string;
  items: Expense[];
}

// ExpenseList(7) 필터 UI(카테고리·기간, 2026-09-11 팀 결정으로 신규)가 걸러낸 목록을 월별로 묶는다.
// getExpenseMonthsForUser는 이 함수 위에 "본인 지출만" 필터를 얹은 얇은 래퍼다.
export function groupExpensesByMonth(expenses: Expense[]): ExpenseMonthGroup[] {
  const sorted = expenses.slice().sort((a, b) => b.created_at.localeCompare(a.created_at));
  const map = new Map<string, Expense[]>();
  for (const e of sorted) {
    const label = monthLabel(e.date);
    const arr = map.get(label) ?? [];
    arr.push(e);
    map.set(label, arr);
  }
  return Array.from(map.entries()).map(([month, items]) => ({ month, items }));
}

export function getExpenseMonthsForUser(expenses: Expense[], userId: string): ExpenseMonthGroup[] {
  return groupExpensesByMonth(getOwnExpenses(expenses, userId));
}

// 그룹 총지출(해당 그룹으로 공유된 모든 멤버의 지출 합) — 개인(그룹 미선택) 총지출과 구분.
export function getGroupExpenseTotal(expenses: Expense[], groupId: string, yearMonth: string): number {
  return expenses
    .filter((e) => e.group_id === groupId && e.is_shared && e.date.startsWith(yearMonth))
    .reduce((sum, e) => sum + e.amount, 0);
}

export function getPersonalExpenseTotal(expenses: Expense[], userId: string, yearMonth: string): number {
  return expenses
    .filter((e) => e.user_id === userId && !e.group_id && e.date.startsWith(yearMonth))
    .reduce((sum, e) => sum + e.amount, 0);
}

// 5b 그룹 상세 "지출·저금 피드" — expenses·savings 두 배열을 합쳐 시간순(최신순)으로.
export type FeedItem =
  | { kind: "expense"; data: Expense }
  | { kind: "saving"; data: Saving };

export function getGroupFeed(expenses: Expense[], savings: Saving[], groupId: string): FeedItem[] {
  const expenseItems: FeedItem[] = expenses
    .filter((e) => e.group_id === groupId && e.is_shared)
    .map((data) => ({ kind: "expense" as const, data }));
  const savingItems: FeedItem[] = savings
    .filter((s) => s.type === "GROUP" && s.group_id === groupId)
    .map((data) => ({ kind: "saving" as const, data }));
  return [...expenseItems, ...savingItems].sort((a, b) => b.data.created_at.localeCompare(a.data.created_at));
}

// 2b-1a 수입 내역 "2026년 9월 총 수입" · 2b 홈 "이번 달 총 수입" 카드가 공통으로 쓰는 합계.
// mock.ts MockIncome 참고 — schema.sql엔 없는 신규 데이터(06-data.md E7).
export function getIncomeTotalForUser(incomes: MockIncome[], userId: string, yearMonth: string): number {
  return incomes
    .filter((i) => i.user_id === userId && i.month === yearMonth)
    .reduce((sum, i) => sum + i.amount, 0);
}

export function getIncomesForUser(incomes: MockIncome[], userId: string, yearMonth: string): MockIncome[] {
  return incomes
    .filter((i) => i.user_id === userId && i.month === yearMonth)
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}
