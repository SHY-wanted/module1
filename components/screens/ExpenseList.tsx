"use client";
// components/screens/ExpenseList.tsx — 7. 지출 목록(design/shoot/ExpenseList.dc.html)
// "확인 필요"는 별도 boolean이 아니라 category==='확인 필요'로 판정한다(05-policy.md P7 방식, 06-data.md E4 [?] 채택).
import { useMemo, useState } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import { getOwnExpenses, groupExpensesByMonth } from "@/lib/selectors";
import { getCategoryVisual } from "@/lib/categories";
import { formatRelativeTime, formatWon } from "@/lib/format";
import { CategoryIcon, ChevronLeftIcon, PlusIcon, TrashIcon } from "../icons";
import type { CategoryIconKey } from "../icons";

// 2026-09-19 팀 요청: 2c(설정) "카테고리" 항목을 누르면 그 카테고리로 미리 필터링된 이 화면을
// 스택에 쌓아 보여준다 — 지출내역 탭(7)과 완전히 같은 화면을 재사용하되, initialCategoryFilter로
// 시작 필터를 지정하고 pushed일 땐 뒤로가기가 탭 전환이 아니라 스택 pop(nav.back())이 되게 한다.
export default function ExpenseList({ initialCategoryFilter, pushed }: { initialCategoryFilter?: string; pushed?: boolean } = {}) {
  const nav = useNav();
  const store = useStore();

  // 7 "카테고리·기간 필터 UI"(신규, 2026-09-11 팀 결정 — 04-features.md F6 입력 "category, startDate, endDate" 참고).
  const [categoryFilter, setCategoryFilter] = useState<string>(initialCategoryFilter ?? "all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  // 2026-09-19 팀 요청: 삭제 버튼 — 바로 지우지 않고 확인 팝업을 한 번 띄운다(10a "그룹 나가기"와 같은 패턴).
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  async function handleDeleteConfirmed() {
    if (!confirmingId) return;
    await store.deleteExpense(confirmingId);
    setConfirmingId(null);
  }

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
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "var(--shoot-bg)", display: "flex", flexDirection: "column", position: "relative" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* 2026-09-14 팀 결정: 탭 루트지만 뒤로가기 버튼을 두고, 누르면 홈(2b) 탭으로 전환한다.
              2026-09-19: 2c에서 카테고리별로 눌러서 스택에 쌓인 경우(pushed)는 탭 전환이 아니라
              그냥 스택 pop(nav.back())으로 2c에 돌아간다. */}
          <div onClick={() => (pushed ? nav.back() : nav.switchTab("home"))} style={{ cursor: "pointer", display: "flex", flexShrink: 0 }}>
            <ChevronLeftIcon size={18} color="var(--shoot-text)" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--shoot-text)", flex: 1 }}>지출 내역</div>
          {/* 07-screens.md "7 우상단 새 '+' 버튼(신규) → 6(신규 입력)" — 2026-09-11 팀 결정. */}
          <div
            onClick={() => nav.push({ id: "expenseInput" })}
            style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--shoot-accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}
          >
            <PlusIcon size={17} color="#fff" strokeWidth={2.4} />
          </div>
        </div>

        {/* 카테고리·기간 필터(신규, 2026-09-11 팀 결정) — lib/mock.ts의 expenses를 클라이언트 사이드에서 거른다. */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", height: 42, borderRadius: 12, border: "1.5px solid var(--shoot-border)", background: "var(--shoot-surface)", padding: "0 12px", fontSize: 13, fontWeight: 700, color: "var(--shoot-text)" }}
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
              style={{ flex: 1, boxSizing: "border-box", height: 42, borderRadius: 12, border: "1.5px solid var(--shoot-border)", background: "var(--shoot-surface)", padding: "0 10px", fontSize: 12, fontWeight: 600, color: "var(--shoot-text)" }}
            />
            <span style={{ fontSize: 12, color: "#A9A2B8", fontWeight: 700 }}>~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ flex: 1, boxSizing: "border-box", height: 42, borderRadius: 12, border: "1.5px solid var(--shoot-border)", background: "var(--shoot-surface)", padding: "0 10px", fontSize: 12, fontWeight: 600, color: "var(--shoot-text)" }}
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
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--shoot-text-muted)", marginBottom: 8 }}>{mo.month}</div>
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
                      background: "var(--shoot-surface)",
                      borderRadius: 16,
                      padding: "12px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      border: needsReview ? "2px solid rgba(245,168,130,0.6)" : "1px solid var(--shoot-border)",
                      boxShadow: needsReview ? "0 4px 14px rgba(245,168,130,0.2)" : "0 2px 8px rgba(45,42,62,0.05)",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 12, background: visual.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <CategoryIcon icon={visual.icon as CategoryIconKey} size={17} color="#fff" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "var(--shoot-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{it.memo}</div>
                        {needsReview && (
                          <div style={{ fontSize: 10, fontWeight: 800, color: "#A15A1E", background: "#FFF2EC", padding: "2px 7px", borderRadius: 8, border: "1px solid rgba(245,168,130,0.5)", whiteSpace: "nowrap", flexShrink: 0 }}>
                            확인 필요
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--shoot-text-muted)", marginTop: 2, fontWeight: 600 }}>
                        {it.category} · {groupLabel} · {formatRelativeTime(it.created_at)}
                      </div>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "var(--shoot-text)", whiteSpace: "nowrap" }}>{formatWon(it.amount)}</div>
                    {/* 2026-09-19 팀 요청: 삭제 버튼 — 행 클릭(수정 모드 진입)과 안 겹치게 stopPropagation. */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmingId(it.id);
                      }}
                      style={{ flexShrink: 0, width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                    >
                      <TrashIcon size={15} color="#A9A2B8" />
                    </div>
                  </div>
                );
              })}
              {mo.items.length === 0 && (
                <div style={{ textAlign: "center", color: "var(--shoot-text-muted)", fontSize: 13, fontWeight: 600, padding: "12px 0" }}>이 필터에 맞는 지출이 없어요</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 2026-09-19 팀 요청: 바로 지우지 않고 확인 팝업을 한 번 띄운다(10a "그룹 나가기"와 같은 패턴). */}
      {confirmingId && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(45,42,62,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 32, zIndex: 20 }}>
          <div style={{ background: "var(--shoot-surface)", borderRadius: 20, padding: 22, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--shoot-text)" }}>이 지출을 삭제할까요?</div>
            <div style={{ fontSize: 12, color: "var(--shoot-text-muted)", marginTop: 8, fontWeight: 600 }}>삭제하면 되돌릴 수 없어요</div>
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <div
                onClick={() => setConfirmingId(null)}
                style={{ flex: 1, height: 44, borderRadius: 14, border: "1.5px solid var(--shoot-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "var(--shoot-text)", cursor: "pointer" }}
              >
                취소
              </div>
              <div
                onClick={handleDeleteConfirmed}
                style={{ flex: 1, height: 44, borderRadius: 14, background: "#B23B3B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", cursor: "pointer" }}
              >
                삭제
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
