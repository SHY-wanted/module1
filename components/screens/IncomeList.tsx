"use client";
// components/screens/IncomeList.tsx — 2b-1a. 수입 내역(design/shoot/IncomeList.dc.html)
// 06-data.md E7 참고 — supabase/schema.sql엔 없는 신규 기능(2026-09-11 팀 결정으로 이번 범위에 포함).
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import { getIncomeTotalForUser, getIncomesForUser } from "@/lib/selectors";
import { formatWon, formatFullDateKorean } from "@/lib/format";
import { ArrowUpIcon, ChevronLeftIcon, PlusIcon } from "../icons";

const CURRENT_MONTH = "2026-09";

export default function IncomeList() {
  const nav = useNav();
  const store = useStore();
  const total = getIncomeTotalForUser(store.incomes, store.currentUserId, CURRENT_MONTH);
  const incomes = getIncomesForUser(store.incomes, store.currentUserId, CURRENT_MONTH);

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "#F6F5FC", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 20px 12px", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
        <div onClick={() => nav.back()} style={{ cursor: "pointer", display: "flex" }}>
          <ChevronLeftIcon size={18} color="#2D2A3E" />
        </div>
        <div style={{ flex: 1, fontSize: 18, fontWeight: 800, color: "#2D2A3E" }}>수입 내역</div>
        {/* 07-screens.md "2b-1a '+' → 2b-1" — 2026-09-11 팀 결정. */}
        <div
          onClick={() => nav.push({ id: "incomeEdit" })}
          style={{ width: 32, height: 32, borderRadius: "50%", background: "#6A5ECF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <PlusIcon size={16} color="#fff" strokeWidth={2.4} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px 20px 24px" }}>
        <div style={{ background: "#fff", border: "1.5px solid #E8E4F4", borderRadius: 20, padding: 20, textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#6B6980" }}>2026년 9월 총 수입</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#1D7A69", marginTop: 6, letterSpacing: "-0.5px" }}>{formatWon(total)}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {incomes.map((inc) => (
            <div key={inc.id} style={{ background: "#fff", borderRadius: 16, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, border: "1px solid #E8E4F4" }}>
              <div style={{ width: 34, height: 34, borderRadius: 12, background: "#E8F9F7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ArrowUpIcon size={16} color="#1D7A69" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#2D2A3E" }}>{inc.memo || inc.category}</div>
                <div style={{ fontSize: 11, color: "#6B6980", fontWeight: 600 }}>
                  {inc.category} · {formatFullDateKorean(inc.date)}
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1D7A69" }}>{formatWon(inc.amount)}</div>
            </div>
          ))}
          {incomes.length === 0 && (
            <div style={{ textAlign: "center", color: "#6B6980", fontSize: 13, fontWeight: 600, padding: "20px 0" }}>이번 달 수입이 아직 없어요</div>
          )}
        </div>
      </div>
    </div>
  );
}
