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
import { ChevronLeftIcon, CategoryIcon, RefreshIcon } from "../icons";
import type { CategoryIconKey } from "../icons";
import ImageLightbox from "../ImageLightbox";

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

  // 신규 기능: 저장 전에 미리 "이 카테고리 이번 달 목표 넘을 것 같아요" 경고. 목표는 개인 스코프에만
  // 있어서(category_goals엔 group_id가 없다) 개인 지출·신규 입력일 때만 계산한다(수정은 기존 금액이
  // 이미 합계에 들어가 있어 이중으로 세게 돼 범위에서 뺐다).
  // 버그 수정(2026-09-18): TODAY_DATE(오늘) 기준으로 고정돼 있어서, 날짜를 다른 달로 바꿔 입력하면
  // 엉뚱한 달의 목표·지출과 비교하고 있었다 — 지금 고른 date의 달을 기준으로 계산해야 한다.
  const categoryLabel = selectedCategoryId === "custom" ? customCategory.trim() : allCats.find((c) => c.id === selectedCategoryId)?.label ?? "";
  const entryMonth = date.slice(0, 7);
  const categoryGoal =
    !isEdit && !shareGroup && categoryLabel
      ? store.categoryGoals.find((g) => g.category === categoryLabel && g.month === entryMonth)
      : undefined;
  const spentSoFar = categoryGoal
    ? store.expenses
        .filter((e) => e.user_id === store.currentUserId && e.category === categoryLabel && e.date.startsWith(entryMonth))
        .reduce((sum, e) => sum + e.amount, 0)
    : 0;
  const overGoalAfterSave = categoryGoal && amount > 0 && spentSoFar + amount > categoryGoal.goal_amount;

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // 신규 기능: 영수증 촬영으로 등록된 지출을 수정할 때 원본 사진을 다시 볼 수 있다(재확인만, 교체는 아님).
  const [lightboxOpen, setLightboxOpen] = useState(false);
  // 신규 기능: 정기 지출 — 신규 입력일 때만 등록 가능(수정 모드에선 안 보임). day_of_month는 고른 date의 일(day)로 정해진다.
  const [registerRecurring, setRegisterRecurring] = useState(false);

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
        recurring_expense_id: existing.recurring_expense_id,
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
        recurring_expense_id: null,
      });
      setSaving(false);
      if (!result.ok) {
        setSaveError(result.error ?? "지출을 저장하지 못했어요");
        return;
      }
      // 2c "지출 기록 시 확인 알림"(2026-09-17 팀 결정 — 실제로 토스트를 띄우도록 구현) — 새로 기록할 때만,
      // 수정할 때는 안 띄운다. notifyExpenseSaved가 토글 여부를 직접 확인한다.
      store.notifyExpenseSaved(`${formatWon(amount)}, ${category}가 저장됐어요`);
      // P3 "데일리 먹이주기 팝업"(docs/08-pet-feature-spec.md §3) — "지출을 하나라도 기록한 직후"만
      // 해당(수정 제외), 개인 펫이 있고 오늘 아직 안 먹였으면 store가 알아서 연다.
      store.openFeedPopupIfEligible();
      // 신규 기능: "매달 반복 등록"을 체크했으면 정기 지출 템플릿도 함께 만든다(다음 달부터는
      // 로그인 시 store가 자동으로 지출을 만들어준다 — 이번 달 것은 방금 위에서 이미 저장됨).
      if (registerRecurring) {
        await store.addRecurringExpense({
          user_id: store.currentUserId,
          group_id: shareGroup?.id ?? null,
          amount,
          category,
          memo: memo.trim() || null,
          day_of_month: Math.min(Number(date.slice(8, 10)), 28),
          is_shared: !!shareGroup,
        });
      }
    }
    // 07-screens.md "6 '저장하기' → 7(지출 목록)로 복귀" — 2026-09-11 팀 결정.
    nav.back();
  }

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "var(--shoot-bg)", display: "flex", flexDirection: "column", position: "relative" }}>
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
        {/* 신규 기능: OCR로 촬영한 영수증 지출이면 원본 사진을 다시 확인할 수 있다(재확인만, 교체는 안 됨). */}
        {existing?.source_type === "RECEIPT" && existing.image_url && (
          <div
            onClick={() => setLightboxOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, padding: 10, borderRadius: 14, border: "1px solid var(--shoot-border)", background: "var(--shoot-surface)", cursor: "pointer" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL은 next/image의 원격 최적화 대상이 아니다. */}
            <img src={existing.image_url} alt="영수증 원본" style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--shoot-text)" }}>영수증 원본 보기</div>
          </div>
        )}
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

        {overGoalAfterSave && categoryGoal && (
          <div style={{ fontSize: 12, fontWeight: 700, color: "#B23B3B", marginTop: 8 }}>
            ⚠ 저장하면 이번 달 {categoryLabel} 목표({formatWon(categoryGoal.goal_amount)})를 넘어요
          </div>
        )}

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

        {/* 신규 기능: 정기 지출 — 신규 입력일 때만 보인다(수정 모드에선 이미 지난 지출이라 의미가 없음). */}
        {!isEdit && (
          <div
            onClick={() => setRegisterRecurring((v) => !v)}
            style={{ marginTop: 14, background: "var(--shoot-surface)", border: "1.5px solid var(--shoot-border)", borderRadius: 14, padding: 14, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
          >
            <RefreshIcon size={17} color="var(--shoot-text-muted)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--shoot-text)" }}>매달 반복 등록</div>
              <div style={{ fontSize: 11, color: "var(--shoot-text-muted)", marginTop: 2 }}>매달 {date.slice(8, 10)}일에 같은 지출을 자동으로 기록해요</div>
            </div>
            <div style={{ width: 42, height: 24, borderRadius: 12, background: registerRecurring ? "var(--shoot-accent)" : "#D8D3C8", position: "relative", flexShrink: 0, transition: "background 0.15s" }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--shoot-surface)", position: "absolute", top: 3, left: registerRecurring ? 21 : 3, boxShadow: "0 2px 5px rgba(0,0,0,0.2)", transition: "left 0.15s" }} />
            </div>
          </div>
        )}
        {saveError && <div style={{ fontSize: 12, fontWeight: 700, color: "#B23B3B", textAlign: "center", marginTop: 10 }}>{saveError}</div>}
        <div
          onClick={handleSave}
          style={{ marginTop: 22, height: 50, borderRadius: 16, background: "linear-gradient(135deg,#E3DFFB 0%,#BDB2F2 100%)", color: "#3F3480", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, boxShadow: "0 8px 18px rgba(106,94,207,0.3)", cursor: "pointer", opacity: saving ? 0.6 : 1 }}
        >
          저장하기
        </div>
      </div>

      {existing?.image_url && <ImageLightbox url={lightboxOpen ? existing.image_url : null} onClose={() => setLightboxOpen(false)} />}
    </div>
  );
}
