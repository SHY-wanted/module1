"use client";
// components/screens/ExpenseInput.tsx — 6. 지출 입력(design/shoot/ExpenseInput.dc.html)
//
// 진입 경로(2026-09-11 팀 결정, 07-screens.md): 7(지출 목록) 우상단 새 "+" 버튼(신규 입력) ·
// 7의 항목 탭(수정 모드 — expenseId prop이 있으면 기존 지출을 불러와 채운다).
import { useState } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import type { CategoryScope } from "@/lib/categories";
import { formatFullDateKorean, formatWon } from "@/lib/format";
import { TODAY_DATE } from "@/lib/mock";
import { getGroupsForUser } from "@/lib/selectors";
import { ChevronLeftIcon, CategoryIcon } from "../icons";
import type { CategoryIconKey } from "../icons";

// "직접 입력" 칩은 실제 카테고리가 아니라 커스텀 입력칸을 여는 스위치라 스코프별 목록에는 안 들어있다.
const CUSTOM_CHIP = { id: "custom", label: "직접 입력", accent: "#A9A2B8", light: "#F1EFEC", ink: "#5B5568", icon: "custom" as const };

export default function ExpenseInput({ expenseId }: { expenseId?: string }) {
  const nav = useNav();
  const store = useStore();
  const myGroups = getGroupsForUser(store.groups, store.groupMembers, store.currentUserId);

  // P6·F14: 본인 지출만 수정 가능 — 7(지출 목록)은 본인 지출만 보여주므로 여기 도달하는 건 항상 본인 것이지만,
  // 방어적으로 한 번 더 확인한다.
  const existing = expenseId ? store.expenses.find((e) => e.id === expenseId && e.user_id === store.currentUserId) : undefined;
  const isEdit = !!existing;

  const initialGroup = existing ? myGroups.find((g) => g.id === existing.group_id) ?? null : null;
  // 2026-09-17 팀 결정(개인·그룹 카테고리 차별화): 개인이면 personal scope, 그룹 지출이면 그 그룹의 scope.
  const initialScope: CategoryScope = initialGroup ? { kind: "group", groupId: initialGroup.id } : { kind: "personal" };
  const initialCats = store.getCategoriesForScope(initialScope);
  const initialAllCats = [...initialCats, CUSTOM_CHIP];
  const initialCatMatch = existing ? initialAllCats.find((c) => c.label === existing.category) : undefined;

  // 07-screens.md "6 ... 금액 입력 방식" — 2026-09-11 팀 결정: 고정 텍스트가 아니라 직접 타이핑.
  // 신규 입력은 빈 값(0원)에서 시작하고, 수정 모드는 기존 금액을 채운다.
  const [amountText, setAmountText] = useState(existing ? existing.amount.toLocaleString("ko-KR") : "");
  const amount = parseInt(amountText.replace(/[^0-9]/g, ""), 10) || 0;

  const [shareGroupId, setShareGroupId] = useState<string>(existing?.group_id ?? "none");
  const shareGroup = shareGroupId === "none" ? null : myGroups.find((g) => g.id === shareGroupId) ?? null;
  const scope: CategoryScope = shareGroup ? { kind: "group", groupId: shareGroup.id } : { kind: "personal" };
  const cats = store.getCategoriesForScope(scope);
  const allCats = [...cats, CUSTOM_CHIP];

  const [selectedCategoryId, setSelectedCategoryId] = useState(
    initialCatMatch ? initialCatMatch.id : existing ? "custom" : cats[0]?.id ?? "etc"
  );
  const [customCategory, setCustomCategory] = useState(existing && !initialCatMatch ? existing.category : "");
  const [memo, setMemo] = useState(existing?.memo ?? "");
  // 2026-09-17 팀 결정: 날짜는 고정 텍스트가 아니라 직접 고를 수 있어야 한다 — 신규는 오늘, 수정은 기존 날짜로 시작.
  const [date, setDate] = useState(existing?.date ?? TODAY_DATE);

  function handleShareGroupChange(value: string) {
    setShareGroupId(value);
    const nextGroup = value === "none" ? null : myGroups.find((g) => g.id === value) ?? null;
    const nextScope: CategoryScope = nextGroup ? { kind: "group", groupId: nextGroup.id } : { kind: "personal" };
    const nextCats = store.getCategoriesForScope(nextScope);
    setSelectedCategoryId(nextCats[0]?.id ?? "etc");
  }

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    const category = selectedCategoryId === "custom" ? customCategory.trim() || "기타" : allCats.find((c) => c.id === selectedCategoryId)?.label ?? "기타";
    if (selectedCategoryId === "custom") {
      // 2026-09-17 팀 결정: 직접 입력으로 쓴 카테고리는 지금 scope(개인 또는 고른 그룹)에 저장돼서
      // 설정(2c)에도 나타나고, 다음에 같은 scope에서 칩으로 바로 고를 수 있다.
      store.addCategoryInScope(scope, category);
    }
    if (isEdit && existing) {
      const ok = await store.updateExpense(existing.id, {
        group_id: shareGroup?.id ?? null,
        amount,
        category,
        memo: memo.trim() || null,
        date,
        source_type: existing.source_type,
        image_url: existing.image_url,
        is_shared: !!shareGroup,
      });
      setSaving(false);
      if (!ok) {
        setSaveError("지출을 수정하지 못했어요");
        return;
      }
    } else {
      const result = await store.addExpense({
        user_id: store.currentUserId,
        group_id: shareGroup?.id ?? null,
        amount,
        category,
        memo: memo.trim() || null,
        date,
        source_type: "MANUAL",
        image_url: null,
        is_shared: !!shareGroup,
      });
      setSaving(false);
      if (!result.ok) {
        setSaveError(result.error ?? "지출을 저장하지 못했어요");
        return;
      }
      // 2c "지출 기록 시 확인 알림"(2026-09-17 팀 결정 — 실제로 토스트를 띄우도록 구현) — 새로 기록할 때만,
      // 수정할 때는 안 띄운다.
      if (store.notificationSettings.expenseConfirm) {
        store.showToast(`${formatWon(amount)}, ${category}가 저장됐어요`);
      }
      // P3 "데일리 먹이주기 팝업"(docs/08-pet-feature-spec.md §3) — "지출을 하나라도 기록한 직후"만
      // 해당(수정 제외), 개인 펫이 있고 오늘 아직 안 먹였으면 store가 알아서 연다.
      store.openFeedPopupIfEligible();
    }
    // 07-screens.md "6 '저장하기' → 7(지출 목록)로 복귀" — 2026-09-11 팀 결정.
    nav.back();
  }

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "var(--shoot-bg)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 20px 20px", textAlign: "center", background: "var(--shoot-surface-alt)", flexShrink: 0, position: "relative" }}>
        {/* 2026-09-14 팀 결정: 뒤로가기 버튼 추가 — 7(지출 목록)의 "+"·항목 탭에서만 열리므로 7로 pop. */}
        <div onClick={() => nav.back()} style={{ position: "absolute", top: 20, left: 20, cursor: "pointer", display: "flex" }}>
          <ChevronLeftIcon size={18} color="var(--shoot-text)" />
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--shoot-text-muted)" }}>{isEdit ? "지출 금액 수정" : "지출 금액"}</div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4, marginTop: 6 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: "var(--shoot-text-muted)" }}>₩</span>
          <input
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            placeholder="0"
            inputMode="numeric"
            style={{ fontSize: 36, fontWeight: 800, color: "var(--shoot-text)", letterSpacing: "-1px", border: "none", background: "transparent", width: 160, textAlign: "center" }}
          />
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px 28px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--shoot-text-muted)", marginBottom: 8 }}>선택한 그룹에 맞는 카테고리예요</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--shoot-text)", marginBottom: 8 }}>카테고리</div>
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
                  background: sel ? cat.light : "var(--shoot-surface)",
                  color: cat.ink,
                  border: `2px solid ${sel ? cat.accent : "var(--shoot-border)"}`,
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
            style={{ width: "100%", boxSizing: "border-box", height: 44, borderRadius: 14, border: "2px solid #6A5ECF", background: "var(--shoot-surface)", padding: "0 14px", fontSize: 14, fontWeight: 600, color: "var(--shoot-text)", marginTop: 10 }}
          />
        )}

        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--shoot-text)", marginBottom: 8 }}>메모</div>
          <input
            type="text"
            placeholder="예) 스타벅스 카페라떼"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", height: 46, borderRadius: 14, border: "2px solid var(--shoot-border)", background: "var(--shoot-surface)", padding: "0 16px", fontSize: 14, color: "var(--shoot-text)", fontWeight: 600 }}
          />
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--shoot-text)", marginBottom: 8 }}>날짜</div>
          {/* 2026-09-17 팀 결정: 고정 텍스트가 아니라 직접 골라 바꿀 수 있어야 한다 — 네이티브 날짜 입력으로. */}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", height: 46, borderRadius: 14, border: "2px solid var(--shoot-border)", background: "var(--shoot-surface)", padding: "0 16px", fontSize: 14, fontWeight: 600, color: "var(--shoot-text)" }}
          />
          <div style={{ fontSize: 12, color: "var(--shoot-text-muted)", fontWeight: 600, marginTop: 6 }}>{formatFullDateKorean(date)}</div>
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--shoot-text)", marginBottom: 8 }}>어느 그룹과 공유할까요?</div>
          <select
            value={shareGroupId}
            onChange={(e) => handleShareGroupChange(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", height: 46, borderRadius: 14, border: "2px solid var(--shoot-border)", background: "var(--shoot-surface)", padding: "0 14px", fontSize: 14, fontWeight: 600, color: "var(--shoot-text)" }}
          >
            <option value="none">공유 안 함</option>
            {myGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        {saveError && <div style={{ fontSize: 12, fontWeight: 700, color: "#B23B3B", textAlign: "center", marginTop: 10 }}>{saveError}</div>}
        <div
          onClick={handleSave}
          style={{ marginTop: 22, height: 50, borderRadius: 16, background: "linear-gradient(135deg,#E3DFFB 0%,#BDB2F2 100%)", color: "#3F3480", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, boxShadow: "0 8px 18px rgba(106,94,207,0.3)", cursor: "pointer", opacity: saving ? 0.6 : 1 }}
        >
          저장하기
        </div>
      </div>
    </div>
  );
}
