"use client";
// components/screens/ExpenseListTab.tsx — 지출내역 탭 슬롯: 데이터 유무에 따라 7 또는 7b를 보여준다.
// (07-screens.md: "7b는 데이터 없을 때 7 대신 표시" — 별도 전환이 아니라 같은 탭 안의 조건부 표시)
import { useStore } from "@/lib/store";
import { getOwnExpenses } from "@/lib/selectors";
import ExpenseList from "./ExpenseList";
import ExpenseListEmpty from "./ExpenseListEmpty";

export default function ExpenseListTab() {
  const store = useStore();
  const hasExpenses = getOwnExpenses(store.expenses, store.currentUserId).length > 0;
  return hasExpenses ? <ExpenseList /> : <ExpenseListEmpty />;
}
