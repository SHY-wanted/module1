"use client";
// components/screens/GroupGoalSetting.tsx — 그룹 예산 설정(신규 화면, 디자인 파일 없음).
// MonthlyGoalSetting.tsx(개인 목표)와 같은 카테고리·금액 구조를 그룹 스코프로 옮긴 것 — 다만
// 사용자 확인에 따라 그룹장(OWNER)만 정하고 고칠 수 있다(RLS group_category_goals_insert/update_owner가
// 실제로 강제하지만, 화면에서도 비OWNER는 아예 입력을 막고 읽기 전용으로만 보여준다).
import { useMemo, useState } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import { getGroupCategorySpent } from "@/lib/selectors";
import { formatWon } from "@/lib/format";
import { TODAY_DATE } from "@/lib/mock";
import { currentMonthString } from "@/lib/pets";
import { ChevronLeftIcon, CategoryIcon } from "../icons";
import type { CategoryIconKey } from "../icons";

export default function GroupGoalSetting({ groupId }: { groupId: string }) {
  const nav = useNav();
  const store = useStore();
  const group = store.groups.find((g) => g.id === groupId);
  const isOwner = store.groupMembers.some((m) => m.group_id === groupId && m.user_id === store.currentUserId && m.role === "OWNER");
  const categories = useMemo(() => store.getCategoriesForScope({ kind: "group", groupId }), [store, groupId]);
  const month = currentMonthString(TODAY_DATE);

  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id ?? "etc");
  const category = categories.find((c) => c.id === selectedCategoryId) ?? categories[0];

  const existingGoal = category ? store.groupCategoryGoals.find((g) => g.group_id === groupId && g.category === category.label && g.month === month) : undefined;
  const [amountText, setAmountText] = useState(String(existingGoal?.goal_amount ?? 0));
  const amount = parseInt(amountText.replace(/[^0-9]/g, ""), 10) || 0;
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const spent = category ? getGroupCategorySpent(store.expenses, groupId, category.label, month) : 0;

  function handleSelectCategory(id: string) {
    setSelectedCategoryId(id);
    const next = categories.find((c) => c.id === id);
    const nextGoal = next ? store.groupCategoryGoals.find((g) => g.group_id === groupId && g.category === next.label && g.month === month) : undefined;
    setAmountText(String(nextGoal?.goal_amount ?? 0));
    setSaved(false);
    setSaveError(null);
  }

  async function handleSave() {
    if (saving || !category) return;
    setSaving(true);
    setSaveError(null);
    const result = await store.setGroupCategoryGoal(groupId, category.label, month, amount);
    setSaving(false);
    if (!result.ok) {
      setSaveError(result.error ?? "예산을 저장하지 못했어요");
      return;
    }
    setSaved(true);
  }

  if (!group || !category) {
    return (
      <div style={{ height: "100%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--shoot-text-muted)" }}>
        그룹을 찾을 수 없어요.
      </div>
    );
  }

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "var(--shoot-bg)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 20px 16px", textAlign: "center", background: "var(--shoot-surface-alt)", flexShrink: 0, position: "relative" }}>
        <div onClick={() => nav.back()} style={{ position: "absolute", top: 20, left: 20, cursor: "pointer", display: "flex" }}>
          <ChevronLeftIcon size={18} color="var(--shoot-text)" />
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--shoot-text-muted)" }}>{group.name}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--shoot-text)", marginTop: 4 }}>그룹 예산 설정</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px 28px" }}>
        {!isOwner && (
          <div style={{ marginBottom: 16, padding: "12px 14px", borderRadius: 14, background: "var(--shoot-surface-alt)", fontSize: 12, fontWeight: 700, color: "var(--shoot-text-muted)" }}>
            그룹장만 예산을 정하고 고칠 수 있어요. 지금은 확인만 할 수 있어요.
          </div>
        )}

        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--shoot-text)", marginBottom: 8 }}>카테고리</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {categories.map((cat) => {
            const sel = selectedCategoryId === cat.id;
            return (
              <div
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id)}
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

        <div style={{ marginTop: 18, padding: "14px 16px", borderRadius: 16, background: category.light, border: `1px solid ${category.accent}55` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: category.ink }}>이번 달 {category.label} 그룹 지출</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: category.ink, marginTop: 4 }}>{formatWon(spent)}</div>
          {existingGoal && (
            <div style={{ fontSize: 12, color: category.ink, opacity: 0.8, marginTop: 6 }}>
              목표 {formatWon(existingGoal.goal_amount)} 중 {Math.min(100, Math.round((spent / Math.max(existingGoal.goal_amount, 1)) * 100))}% 사용
            </div>
          )}
        </div>

        {isOwner && (
          <>
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--shoot-text)", marginBottom: 8 }}>목표 금액</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 16px", borderRadius: 14, border: `2px solid ${category.accent}`, background: "var(--shoot-surface)" }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: "var(--shoot-text-muted)" }}>₩</span>
                <input
                  value={amountText}
                  onChange={(e) => setAmountText(e.target.value)}
                  inputMode="numeric"
                  placeholder="0"
                  style={{ fontSize: 30, fontWeight: 800, color: "var(--shoot-text)", letterSpacing: "-1px", border: "none", outline: "none", background: "transparent", width: "100%" }}
                />
              </div>
            </div>

            {saveError && <div style={{ fontSize: 12, fontWeight: 700, color: "#B23B3B", textAlign: "center", marginTop: 10 }}>{saveError}</div>}
            {saved && <div style={{ fontSize: 12, fontWeight: 700, color: category.ink, textAlign: "center", marginTop: 10 }}>{category.label} 예산 {formatWon(amount)}(으)로 저장했어요</div>}

            <div
              onClick={handleSave}
              style={{ marginTop: 14, height: 50, borderRadius: 16, background: "linear-gradient(135deg,#E3DFFB 0%,#BDB2F2 100%)", color: "#3F3480", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, boxShadow: "0 8px 18px rgba(106,94,207,0.3)", cursor: "pointer", opacity: saving ? 0.6 : 1 }}
            >
              예산 저장하기
            </div>
          </>
        )}
      </div>
    </div>
  );
}
