"use client";
// components/screens/RecurringExpenseManage.tsx — 정기 지출 관리(신규 화면, 디자인 파일 없음).
// 진입 경로: Settings(2c) "정기 지출 관리" 행. ExpenseInput(6)의 "매달 반복 등록" 체크박스로 만든
// 템플릿을 여기서 목록으로 보고, 켜고 끄고(active), 지울 수 있다. 실제 지출 생성은 store.tsx가
// 로그인 시 한 번 처리한다(이 화면은 CRUD만 담당).
import { useState } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import { getCategoryVisual } from "@/lib/categories";
import { formatWon } from "@/lib/format";
import { ChevronLeftIcon, CategoryIcon, TrashIcon, RepeatIcon } from "../icons";
import type { CategoryIconKey } from "../icons";

export default function RecurringExpenseManage() {
  const nav = useNav();
  const store = useStore();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  async function handleDeleteConfirmed() {
    if (!confirmingId) return;
    await store.deleteRecurringExpense(confirmingId);
    setConfirmingId(null);
  }

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "var(--shoot-bg)", display: "flex", flexDirection: "column", position: "relative" }}>
      <div style={{ padding: "20px 20px 12px", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
        <div onClick={() => nav.back()} style={{ cursor: "pointer", display: "flex" }}>
          <ChevronLeftIcon size={18} color="var(--shoot-text)" />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--shoot-text)" }}>정기 지출 관리</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 20px" }}>
        {store.recurringExpenses.length === 0 ? (
          // 버그 수정(2026-09-21 사용자 신고): 아이콘이 배경 없이 혼자 떠 있어서 "따로 노는" 느낌이
          // 났다 — 이 앱의 다른 빈 상태(예: ExpenseListEmpty.tsx)와 같은 패턴으로, 원형 배경 안에
          // 아이콘을 넣고 flex column으로 정렬해 텍스트와 한 덩어리로 보이게 맞췄다.
          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--shoot-surface-alt)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <RepeatIcon size={26} color="var(--shoot-accent)" />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--shoot-text-muted)", marginTop: 16 }}>등록된 정기 지출이 없어요</div>
            <div style={{ fontSize: 12, color: "var(--shoot-text-muted)", marginTop: 4 }}>지출을 새로 기록할 때 &quot;매달 반복 등록&quot;을 켜면 여기에 나타나요</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
            {store.recurringExpenses.map((r) => {
              const visual = getCategoryVisual(r.category);
              const group = store.groups.find((g) => g.id === r.group_id);
              const groupLabel = r.group_id ? group?.name ?? "" : "개인";
              return (
                <div
                  key={r.id}
                  style={{
                    background: "var(--shoot-surface)",
                    borderRadius: 16,
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    border: "1px solid var(--shoot-border)",
                    opacity: r.active ? 1 : 0.55,
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: visual.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <CategoryIcon icon={visual.icon as CategoryIconKey} size={17} color="#fff" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "var(--shoot-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.memo || r.category}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--shoot-text-muted)", marginTop: 2, fontWeight: 600 }}>
                      {r.category} · {groupLabel} · 매달 {r.day_of_month}일
                    </div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "var(--shoot-text)", whiteSpace: "nowrap" }}>{formatWon(r.amount)}</div>
                  <div
                    onClick={() => store.toggleRecurringExpenseActive(r.id)}
                    style={{ width: 38, height: 22, borderRadius: 11, background: r.active ? "var(--shoot-accent)" : "#D8D3C8", position: "relative", flexShrink: 0, cursor: "pointer", transition: "background 0.15s" }}
                  >
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: "var(--shoot-surface)", position: "absolute", top: 3, left: r.active ? 19 : 3, boxShadow: "0 2px 5px rgba(0,0,0,0.2)", transition: "left 0.15s" }} />
                  </div>
                  <div
                    onClick={() => setConfirmingId(r.id)}
                    style={{ flexShrink: 0, width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                  >
                    <TrashIcon size={15} color="#A9A2B8" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {confirmingId && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(45,42,62,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 32, zIndex: 20 }}>
          <div style={{ background: "var(--shoot-surface)", borderRadius: 20, padding: 22, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--shoot-text)" }}>이 정기 지출을 삭제할까요?</div>
            <div style={{ fontSize: 12, color: "var(--shoot-text-muted)", marginTop: 8, fontWeight: 600 }}>이미 만들어진 지출 기록은 그대로 남아요</div>
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
