"use client";
// components/screens/ExpenseList.tsx — 7. 지출 목록(design/shoot/ExpenseList.dc.html)
// "확인 필요"는 별도 boolean이 아니라 category==='확인 필요'로 판정한다(05-policy.md P7 방식, 06-data.md E4 [?] 채택).
import { useMemo, useState } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import { getOwnExpenses, groupExpensesByMonth } from "@/lib/selectors";
import { getCategoryVisual } from "@/lib/categories";
import { formatRelativeTime, formatWon } from "@/lib/format";
import { CategoryIcon, PlusIcon } from "../icons";
import type { CategoryIconKey } from "../icons";

export default function ExpenseList() {
  const nav = useNav();
  const store = useStore();

  // 7 "카테고리·기간 필터 UI"(신규, 2026-09-11 팀 결정 — 04-features.md F6 입력 "category, startDate, endDate" 참고).
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const ownExpenses = getOwnExpenses(store.expenses, store.currentUserId);
  const categoryOptions = useMemo(() => {
    const set = new Set(ownExpenses.map((e) => e.category));
    return Array.from(set);
  }, [ownExpenses]);

  const filtered = useMemo(() => {
    return ownExpenses.filter((e) => {
      if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
      if (startDate && e.date < startDate) return false;
      if (endDate && e.date > endDate) return false;
      return true;
    });
  }, [ownExpenses, categoryFilter, startDate, endDate]);

  const months = groupExpensesByMonth(filtered);

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "#F6F5FC", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#2D2A3E" }}>지출 내역</div>
          {/* 07-screens.md "7 우상단 새 '+' 버튼(신규) → 6(신규 입력)" — 2026-09-11 팀 결정. */}
          <div
            onClick={() => nav.push({ id: "expenseInput" })}
            style={{ width: 36, height: 36, borderRadius: "50%", background: "#6A5ECF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}
          >
            <PlusIcon size={17} color="#fff" strokeWidth={2.4} />
          </div>
        </div>

        {/* 카테고리·기간 필터(신규, 2026-09-11 팀 결정) — lib/mock.ts의 expenses를 클라이언트 사이드에서 거른다. */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", height: 42, borderRadius: 12, border: "1.5px solid #E8E4F4", background: "#fff", padding: "0 12px", fontSize: 13, fontWeight: 700, color: "#2D2A3E" }}
          >
            <option value="all">전체 카테고리</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ flex: 1, boxSizing: "border-box", height: 42, borderRadius: 12, border: "1.5px solid #E8E4F4", background: "#fff", padding: "0 10px", fontSize: 12, fontWeight: 600, color: "#2D2A3E" }}
            />
            <span style={{ fontSize: 12, color: "#A9A2B8", fontWeight: 700 }}>~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ flex: 1, boxSizing: "border-box", height: 42, borderRadius: 12, border: "1.5px solid #E8E4F4", background: "#fff", padding: "0 10px", fontSize: 12, fontWeight: 600, color: "#2D2A3E" }}
            />
            {(categoryFilter !== "all" || startDate || endDate) && (
              <div
                onClick={() => {
                  setCategoryFilter("all");
                  setStartDate("");
                  setEndDate("");
                }}
                style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, color: "#B23B3B", cursor: "pointer", padding: "0 4px" }}
              >
                초기화
              </div>
            )}
          </div>
        </div>

        {months.map((mo) => (
          <div key={mo.month} style={{ marginTop: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#6B6980", marginBottom: 8 }}>{mo.month}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {mo.items.map((it) => {
                const needsReview = it.category === "확인 필요";
                const visual = getCategoryVisual(it.category);
                const group = store.groups.find((g) => g.id === it.group_id);
                const groupLabel = it.group_id ? group?.name ?? "" : "공유 안 함";
                return (
                  <div
                    key={it.id}
                    // 07-screens.md "7 항목 탭 → 6을 수정 모드로 재사용" — 2026-09-11 팀 결정.
                    // P6·F14: 여기 보이는 항목은 전부 본인 지출(getOwnExpenses)이라 수정 권한 문제가 없다.
                    onClick={() => nav.push({ id: "expenseInput", expenseId: it.id })}
                    style={{
                      background: "#fff",
                      borderRadius: 16,
                      padding: "12px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      border: needsReview ? "2px solid rgba(245,168,130,0.6)" : "1px solid #E8E4F4",
                      boxShadow: needsReview ? "0 4px 14px rgba(245,168,130,0.2)" : "0 2px 8px rgba(45,42,62,0.05)",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 12, background: visual.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <CategoryIcon icon={visual.icon as CategoryIconKey} size={17} color="#fff" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#2D2A3E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{it.memo}</div>
                        {needsReview && (
                          <div style={{ fontSize: 10, fontWeight: 800, color: "#A15A1E", background: "#FFF2EC", padding: "2px 7px", borderRadius: 8, border: "1px solid rgba(245,168,130,0.5)", whiteSpace: "nowrap", flexShrink: 0 }}>
                            확인 필요
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "#6B6980", marginTop: 2, fontWeight: 600 }}>
                        {it.category} · {groupLabel} · {formatRelativeTime(it.created_at)}
                      </div>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#2D2A3E", whiteSpace: "nowrap" }}>{formatWon(it.amount)}</div>
                  </div>
                );
              })}
              {mo.items.length === 0 && (
                <div style={{ textAlign: "center", color: "#6B6980", fontSize: 13, fontWeight: 600, padding: "12px 0" }}>이 필터에 맞는 지출이 없어요</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
