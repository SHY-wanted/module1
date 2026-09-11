"use client";
// components/screens/ExpenseInput.tsx — 6. 지출 입력(design/shoot/ExpenseInput.dc.html)
//
// 진입 경로(2026-09-11 팀 결정, 07-screens.md): 7(지출 목록) 우상단 새 "+" 버튼(신규 입력) ·
// 7의 항목 탭(수정 모드 — expenseId prop이 있으면 기존 지출을 불러와 채운다).
import { useState } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import { groupToCats } from "@/lib/categories";
import { formatFullDateKorean } from "@/lib/format";
import { TODAY_DATE } from "@/lib/mock";
import { getGroupsForUser } from "@/lib/selectors";
import { CategoryIcon } from "../icons";
import type { CategoryIconKey } from "../icons";

export default function ExpenseInput({ expenseId }: { expenseId?: string }) {
  const nav = useNav();
  const store = useStore();
  const myGroups = getGroupsForUser(store.groups, store.groupMembers, store.currentUserId);

  // P6·F14: 본인 지출만 수정 가능 — 7(지출 목록)은 본인 지출만 보여주므로 여기 도달하는 건 항상 본인 것이지만,
  // 방어적으로 한 번 더 확인한다.
  const existing = expenseId ? store.expenses.find((e) => e.id === expenseId && e.user_id === store.currentUserId) : undefined;
  const isEdit = !!existing;

  const initialGroup = existing ? myGroups.find((g) => g.id === existing.group_id) ?? null : null;
  const initialCats = groupToCats(initialGroup ? initialGroup.group_type : null);
  const initialAllCats = [...initialCats, { id: "custom", label: "직접 입력", accent: "#A9A2B8", light: "#F1EFEC", ink: "#5B5568", icon: "custom" as const }];
  const initialCatMatch = existing ? initialAllCats.find((c) => c.label === existing.category) : undefined;

  // 07-screens.md "6 ... 금액 입력 방식" — 2026-09-11 팀 결정: 고정 텍스트가 아니라 직접 타이핑.
  // 신규 입력은 빈 값(0원)에서 시작하고, 수정 모드는 기존 금액을 채운다.
  const [amountText, setAmountText] = useState(existing ? existing.amount.toLocaleString("ko-KR") : "");
  const amount = parseInt(amountText.replace(/[^0-9]/g, ""), 10) || 0;

  const [shareGroupId, setShareGroupId] = useState<string>(existing?.group_id ?? "none");
  const shareGroup = shareGroupId === "none" ? null : myGroups.find((g) => g.id === shareGroupId) ?? null;
  const cats = groupToCats(shareGroup ? shareGroup.group_type : null);
  const allCats = [...cats, { id: "custom", label: "직접 입력", accent: "#A9A2B8", light: "#F1EFEC", ink: "#5B5568", icon: "custom" as const }];

  const [selectedCategoryId, setSelectedCategoryId] = useState(
    initialCatMatch ? initialCatMatch.id : existing ? "custom" : cats[0]?.id ?? "etc"
  );
  const [customCategory, setCustomCategory] = useState(existing && !initialCatMatch ? existing.category : "");
  const [memo, setMemo] = useState(existing?.memo ?? "");

  function handleShareGroupChange(value: string) {
    setShareGroupId(value);
    const nextGroup = value === "none" ? null : myGroups.find((g) => g.id === value) ?? null;
    const nextCats = groupToCats(nextGroup ? nextGroup.group_type : null);
    setSelectedCategoryId(nextCats[0]?.id ?? "etc");
  }

  function handleSave() {
    const category = selectedCategoryId === "custom" ? customCategory.trim() || "기타" : allCats.find((c) => c.id === selectedCategoryId)?.label ?? "기타";
    if (isEdit && existing) {
      store.updateExpense(existing.id, {
        group_id: shareGroup?.id ?? null,
        amount,
        category,
        memo: memo.trim() || null,
        date: existing.date,
        source_type: existing.source_type,
        image_url: existing.image_url,
        is_shared: !!shareGroup,
      });
    } else {
      store.addExpense({
        user_id: store.currentUserId,
        group_id: shareGroup?.id ?? null,
        amount,
        category,
        memo: memo.trim() || null,
        date: TODAY_DATE,
        source_type: "MANUAL",
        image_url: null,
        is_shared: !!shareGroup,
      });
    }
    // 07-screens.md "6 '저장하기' → 7(지출 목록)로 복귀" — 2026-09-11 팀 결정.
    nav.back();
  }

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "#F6F5FC", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 20px 20px", textAlign: "center", background: "#F0EEFF", flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#6B6980" }}>{isEdit ? "지출 금액 수정" : "지출 금액"}</div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4, marginTop: 6 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#6B6980" }}>₩</span>
          <input
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            placeholder="0"
            inputMode="numeric"
            style={{ fontSize: 36, fontWeight: 800, color: "#2D2A3E", letterSpacing: "-1px", border: "none", background: "transparent", width: 160, textAlign: "center" }}
          />
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px 28px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#6B6980", marginBottom: 8 }}>선택한 그룹에 맞는 카테고리예요</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#2D2A3E", marginBottom: 8 }}>카테고리</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {allCats.map((cat) => {
            const sel = selectedCategoryId === cat.id;
            return (
              <div
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                style={{
                  padding: "9px 13px",
                  borderRadius: 14,
                  fontSize: 13,
                  fontWeight: 800,
                  background: sel ? cat.light : "#FFFFFF",
                  color: cat.ink,
                  border: `2px solid ${sel ? cat.accent : "#E8E4F4"}`,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: sel ? `0 4px 12px ${cat.accent}55` : "none",
                }}
              >
                <CategoryIcon icon={cat.icon as CategoryIconKey} size={15} color={cat.ink} />
                {cat.label}
              </div>
            );
          })}
        </div>

        {selectedCategoryId === "custom" && (
          <input
            type="text"
            placeholder="카테고리 이름을 입력하세요"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", height: 44, borderRadius: 14, border: "2px solid #6A5ECF", background: "#fff", padding: "0 14px", fontSize: 14, fontWeight: 600, color: "#2D2A3E", marginTop: 10 }}
          />
        )}

        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#2D2A3E", marginBottom: 8 }}>메모</div>
          <input
            type="text"
            placeholder="예) 스타벅스 카페라떼"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", height: 46, borderRadius: 14, border: "2px solid #E8E4F4", background: "#fff", padding: "0 16px", fontSize: 14, color: "#2D2A3E", fontWeight: 600 }}
          />
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#2D2A3E", marginBottom: 8 }}>날짜</div>
          <div style={{ height: 46, borderRadius: 14, border: "2px solid #E8E4F4", background: "#fff", display: "flex", alignItems: "center", padding: "0 16px", fontSize: 14, fontWeight: 600, color: "#2D2A3E" }}>
            {formatFullDateKorean(existing?.date ?? TODAY_DATE)}
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#2D2A3E", marginBottom: 8 }}>어느 그룹과 공유할까요?</div>
          <select
            value={shareGroupId}
            onChange={(e) => handleShareGroupChange(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", height: 46, borderRadius: 14, border: "2px solid #E8E4F4", background: "#fff", padding: "0 14px", fontSize: 14, fontWeight: 600, color: "#2D2A3E" }}
          >
            <option value="none">공유 안 함</option>
            {myGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div
          onClick={handleSave}
          style={{ marginTop: 22, height: 50, borderRadius: 16, background: "linear-gradient(135deg,#E3DFFB 0%,#BDB2F2 100%)", color: "#3F3480", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, boxShadow: "0 8px 18px rgba(106,94,207,0.3)", cursor: "pointer" }}
        >
          저장하기
        </div>
      </div>
    </div>
  );
}
