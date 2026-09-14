"use client";
// components/screens/IncomeList.tsx — 2b-1a. 수입 내역(design/shoot/IncomeList.dc.html)
// 06-data.md E7 참고 — supabase/schema.sql엔 없는 신규 기능(2026-09-11 팀 결정으로 이번 범위에 포함).
import { useState } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import { getIncomeTotalForUser, getIncomesForUser } from "@/lib/selectors";
import { formatWon, formatFullDateKorean } from "@/lib/format";
import { ArrowUpIcon, ChevronLeftIcon, PlusIcon, TrashIcon } from "../icons";

const CURRENT_MONTH = "2026-09";

export default function IncomeList() {
  const nav = useNav();
  const store = useStore();
  const total = getIncomeTotalForUser(store.incomes, store.currentUserId, CURRENT_MONTH);
  const incomes = getIncomesForUser(store.incomes, store.currentUserId, CURRENT_MONTH);
  // 2026-09-19 팀 요청: 삭제 버튼 — 바로 지우지 않고 확인 팝업을 한 번 띄운다(10a "그룹 나가기"와 같은 패턴).
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "var(--shoot-bg)", display: "flex", flexDirection: "column", position: "relative" }}>
      <div style={{ padding: "20px 20px 12px", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
        <div onClick={() => nav.back()} style={{ cursor: "pointer", display: "flex" }}>
          <ChevronLeftIcon size={18} color="var(--shoot-text)" />
        </div>
        <div style={{ flex: 1, fontSize: 18, fontWeight: 800, color: "var(--shoot-text)" }}>수입 내역</div>
        {/* 07-screens.md "2b-1a '+' → 2b-1" — 2026-09-11 팀 결정. */}
        <div
          onClick={() => nav.push({ id: "incomeEdit" })}
          style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--shoot-accent)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <PlusIcon size={16} color="#fff" strokeWidth={2.4} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px 20px 24px" }}>
        <div style={{ background: "var(--shoot-surface)", border: "1.5px solid var(--shoot-border)", borderRadius: 20, padding: 20, textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--shoot-text-muted)" }}>2026년 9월 총 수입</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#1D7A69", marginTop: 6, letterSpacing: "-0.5px" }}>{formatWon(total)}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {incomes.map((inc) => (
            <div key={inc.id} style={{ background: "var(--shoot-surface)", borderRadius: 16, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, border: "1px solid var(--shoot-border)" }}>
              <div style={{ width: 34, height: 34, borderRadius: 12, background: "#E8F9F7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ArrowUpIcon size={16} color="#1D7A69" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--shoot-text)" }}>{inc.memo || inc.category}</div>
                <div style={{ fontSize: 11, color: "var(--shoot-text-muted)", fontWeight: 600 }}>
                  {inc.category} · {formatFullDateKorean(inc.date)}
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1D7A69" }}>{formatWon(inc.amount)}</div>
              {/* 2026-09-19 팀 요청: 삭제 버튼. */}
              <div
                onClick={() => setConfirmingId(inc.id)}
                style={{ flexShrink: 0, width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <TrashIcon size={14} color="#A9A2B8" />
              </div>
            </div>
          ))}
          {incomes.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--shoot-text-muted)", fontSize: 13, fontWeight: 600, padding: "20px 0" }}>이번 달 수입이 아직 없어요</div>
          )}
        </div>
      </div>

      {confirmingId && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(45,42,62,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 32, zIndex: 20 }}>
          <div style={{ background: "var(--shoot-surface)", borderRadius: 20, padding: 22, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--shoot-text)" }}>이 수입을 삭제할까요?</div>
            <div style={{ fontSize: 12, color: "var(--shoot-text-muted)", marginTop: 8, fontWeight: 600 }}>삭제하면 되돌릴 수 없어요</div>
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <div
                onClick={() => setConfirmingId(null)}
                style={{ flex: 1, height: 44, borderRadius: 14, border: "1.5px solid var(--shoot-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "var(--shoot-text)", cursor: "pointer" }}
              >
                취소
              </div>
              <div
                onClick={() => {
                  if (confirmingId) store.deleteIncome(confirmingId);
                  setConfirmingId(null);
                }}
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
