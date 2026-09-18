"use client";
// components/screens/MonthlyGoalSetting.tsx — P7(자리 대체). 월별·카테고리별 목표 설정
// (shooTbranch의 MonthlyGoalSetting.tsx를 기반으로, 2026-09-15 사용자 확인에 따라 mg의 주간
// 예산(BudgetSetting)을 대체하고 실제 store/DB에 연결했다 — shooTbranch 원본은 화면 안에서만
// "저장했어요"라고 표시할 뿐 실제로 어디에도 저장하지 않았었다).
import { useMemo, useState } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import type { CategoryDef } from "@/lib/categories";
import { formatWon } from "@/lib/format";
import { TODAY_DATE } from "@/lib/mock";
import { currentMonthString } from "@/lib/pets";
import { ChevronLeftIcon, CategoryIcon } from "../icons";
import type { CategoryIconKey } from "../icons";

function roundTo1000(n: number): number {
  return Math.round(n / 1000) * 1000;
}

// 지난 90일치 실제 지출 합계를 3으로 나눠 "최근 3개월 평균"을 구한다. 달력상 딱 떨어지는
// 3개 달(저번 달·저저번 달·저저저번 달)로 나누면, 그중 한두 달에 기록이 아예 없을 때(앱을 최근에야
// 쓰기 시작했거나 특정 달에 그 카테고리 지출이 없었을 때) 평균이 실제 소비와 상관없이 0에 가깝게
// 깎여서 추천 금액이 항상 0원 근처로 나오는 문제가 있었다(2026-09-24 버그 수정, 사용자 확인).
function daysAgoDateString(days: number): string {
  const d = new Date(TODAY_DATE + "T00:00:00+09:00");
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function encouragementMessage(category: CategoryDef, amount: number, recommended: number, avg3: number): string {
  if (amount <= 0) return `${category.label} 목표 금액을 정해볼까요?`;
  if (amount <= recommended * 0.8) return `와, ${category.label}에 정말 짠 목표를 세우셨네요! 도전적이지만 해내면 그만큼 뿌듯할 거예요 💪`;
  if (amount <= recommended * 1.05) return `지난 3개월 평균보다 아낀 알찬 목표예요. 달성하면 저금통 펫에게 보상을 줄게요!`;
  if (amount <= avg3 * 1.05) return `평소와 비슷한 수준이에요. 무리하지 않고 꾸준히 기록하는 것부터 시작해봐요.`;
  return `여유 있게 시작하는 것도 좋은 전략이에요. 다음 달엔 조금 더 줄여보는 건 어떨까요?`;
}

export default function MonthlyGoalSetting() {
  const nav = useNav();
  const store = useStore();
  // 2026-09-18 버그 수정: 고정된 기본 카테고리 목록(PERSONAL_CATS)을 직접 썼었다 — 설정(2c)에서
  // 카테고리 이름을 바꾸거나 새로 추가해도 이 화면엔 반영이 안 됐고, category.label로 저장하다 보니
  // 실제 지출 기록의 카테고리명과 어긋나 "목표를 설정해도 지출에 안 잡히는"(평균·달성 계산이 항상 0)
  // 문제로 이어질 수 있었다. store.getCategoriesForScope로 실제 사용 중인 개인 카테고리를 쓴다.
  // useMemo로 감싸는 이유: store.getCategoriesForScope()는 매 렌더 호출되는 메서드라, 아래
  // avg3 useMemo가 category.label에 의존하면 리액트 컴파일러가 그 메모이제이션을 신뢰하지 못한다
  // (호출 결과가 렌더마다 같다는 걸 정적으로 증명할 수 없어서 "Compilation Skipped" 경고가 났다).
  const categories = useMemo(() => store.getCategoriesForScope({ kind: "personal" }), [store]);
  const month = currentMonthString(TODAY_DATE);
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0].id);
  const category = useMemo(() => categories.find((c) => c.id === selectedCategoryId) ?? categories[0], [categories, selectedCategoryId]);

  // 실제 지난 3개월 지출(shooTbranch 원본은 하드코딩 샘플이었다 — 이제 진짜 store.expenses로 계산).
  // 함수로 뽑아둔 이유: handleSelectCategory에서 "새로 고른 카테고리"의 평균을 바로 계산해야 하는데,
  // 렌더 스코프의 avg3/recommended는 그 시점엔 아직 이전(방금까지 선택돼 있던) 카테고리 값이라
  // 그대로 읽으면 한 박자 늦은 값이 들어간다(2026-09-24 버그 수정 — 카테고리를 바꿔도 목표 금액 칸이
  // 새 카테고리의 추천 금액이 아니라 이전 카테고리의 추천 금액으로 채워지고 있었다).
  function computeAvg3(categoryLabel: string): number {
    const since = daysAgoDateString(90);
    const total = store.expenses
      .filter((e) => e.user_id === store.currentUserId && e.category === categoryLabel && e.date >= since && e.date <= TODAY_DATE)
      .reduce((sum, e) => sum + e.amount, 0);
    return Math.round(total / 3);
  }
  function computeRecommended(categoryLabel: string): number {
    return roundTo1000(computeAvg3(categoryLabel) * 0.9);
  }

  const avg3 = computeAvg3(category.label);
  const recommended = roundTo1000(avg3 * 0.9);
  const sliderMax = Math.max(recommended * 3, 300000);

  const existingGoal = store.categoryGoals.find((g) => g.category === category.label && g.month === month);
  const [amount, setAmount] = useState(existingGoal?.goal_amount ?? recommended);
  const [amountText, setAmountText] = useState(String(existingGoal?.goal_amount ?? recommended));
  const [saved, setSaved] = useState<{ categoryId: string; amount: number } | null>(null);
  const [saving, setSaving] = useState(false);

  function handleSelectCategory(next: CategoryDef) {
    setSelectedCategoryId(next.id);
    const nextExisting = store.categoryGoals.find((g) => g.category === next.label && g.month === month);
    const nextAmount = nextExisting?.goal_amount ?? computeRecommended(next.label);
    setAmount(nextAmount);
    setAmountText(String(nextAmount));
    setSaved(null);
  }

  function handleAmountText(text: string) {
    const digitsOnly = text.replace(/[^0-9]/g, "");
    const next = Math.min(parseInt(digitsOnly, 10) || 0, sliderMax);
    setAmountText(String(next));
    setAmount(next);
  }

  function handleSlider(value: number) {
    setAmount(value);
    setAmountText(String(value));
  }

  function handleApplyRecommended() {
    setAmount(recommended);
    setAmountText(String(recommended));
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    const result = await store.setCategoryGoal(category.label, month, amount);
    setSaving(false);
    if (result.ok) setSaved({ categoryId: selectedCategoryId, amount });
  }

  const message = encouragementMessage(category, amount, recommended, avg3);

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "var(--shoot-bg)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 20px 16px", textAlign: "center", background: "var(--shoot-surface-alt)", flexShrink: 0, position: "relative" }}>
        <div onClick={() => nav.back()} style={{ position: "absolute", top: 20, left: 20, cursor: "pointer", display: "flex" }}>
          <ChevronLeftIcon size={18} color="var(--shoot-text)" />
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--shoot-text-muted)" }}>이번 달 목표</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--shoot-text)", marginTop: 4 }}>월별 목표 설정</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px 28px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--shoot-text)", marginBottom: 8 }}>카테고리</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {categories.map((cat) => {
            const sel = selectedCategoryId === cat.id;
            const hasGoal = store.categoryGoals.some((g) => g.category === cat.label && g.month === month);
            return (
              <div
                key={cat.id}
                onClick={() => handleSelectCategory(cat)}
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
                  position: "relative",
                }}
              >
                <CategoryIcon icon={cat.icon as CategoryIconKey} size={15} color={cat.ink} />
                {cat.label}
                {hasGoal && <span style={{ position: "absolute", top: -3, right: -3, fontSize: 10 }}>✓</span>}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 18, padding: "14px 16px", borderRadius: 16, background: category.light, border: `1px solid ${category.accent}55` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: category.ink }}>지난 3개월 {category.label} 평균 지출</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: category.ink, marginTop: 4 }}>{formatWon(avg3)}</div>
          <div style={{ fontSize: 12, color: category.ink, opacity: 0.8, marginTop: 6 }}>
            평균의 90% · 추천 목표 <strong>{formatWon(recommended)}</strong>
          </div>
          <div
            onClick={handleApplyRecommended}
            style={{ marginTop: 10, display: "inline-flex", alignItems: "center", padding: "7px 12px", borderRadius: 10, background: "var(--shoot-surface)", color: category.ink, fontSize: 12, fontWeight: 800, border: `1.5px solid ${category.accent}`, cursor: "pointer" }}
          >
            추천 금액 적용하기
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--shoot-text)", marginBottom: 8 }}>목표 금액</div>
          {/* 2026-09-24 팀 요청(신규): 입력 칸이 테두리·배경 없이 텍스트만 있어서 입력 가능한 칸인지
              티가 안 났다 — 다른 화면 입력칸(로그인 이메일·비밀번호 등)과 같은 방식으로 카드 테두리를 줘서
              눈에 띄게 했다. */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 16px", borderRadius: 14, border: `2px solid ${category.accent}`, background: "var(--shoot-surface)" }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: "var(--shoot-text-muted)" }}>₩</span>
            <input
              value={amountText}
              onChange={(e) => handleAmountText(e.target.value)}
              inputMode="numeric"
              placeholder="0"
              style={{ fontSize: 30, fontWeight: 800, color: "var(--shoot-text)", letterSpacing: "-1px", border: "none", background: "transparent", width: "100%" }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={sliderMax}
            step={1000}
            value={Math.min(amount, sliderMax)}
            onChange={(e) => handleSlider(parseInt(e.target.value, 10))}
            style={{ width: "100%", marginTop: 10, accentColor: category.accent }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--shoot-text-muted)", fontWeight: 600, marginTop: 2 }}>
            <span>0원</span>
            <span>{formatWon(sliderMax)}</span>
          </div>
        </div>

        <div style={{ marginTop: 18, padding: "14px 16px", borderRadius: 16, background: "var(--shoot-surface)", border: "1px solid var(--shoot-border)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--shoot-text)" }}>{message}</div>
        </div>

        {saved && saved.categoryId === selectedCategoryId && (
          <div style={{ fontSize: 12, fontWeight: 700, color: category.ink, textAlign: "center", marginTop: 10 }}>
            {category.label} 목표 {formatWon(saved.amount)}(으)로 저장했어요
          </div>
        )}

        <div
          onClick={handleSave}
          style={{ marginTop: 14, height: 50, borderRadius: 16, background: "linear-gradient(135deg,#E3DFFB 0%,#BDB2F2 100%)", color: "#3F3480", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, boxShadow: "0 8px 18px rgba(106,94,207,0.3)", cursor: "pointer", opacity: saving ? 0.6 : 1 }}
        >
          목표 저장하기
        </div>
      </div>
    </div>
  );
}
