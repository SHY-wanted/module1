"use client";
// components/MonthlyGoalSetting.tsx — 월별 목표(예산) 설정 화면. 디자인 파일 없음(2026-09-20 팀 요청으로
// 신규) — 2b(홈) 목표 카드 · 10(마이페이지) "월별 목표 설정" 행에서 push로 들어온다(lib/nav.ts
// monthlyGoalSetting). 2026-09-17 "예산 기능 자체가 없다"던 결정(store.tsx NotificationSettings 주석)과
// 별개로 이번에 새로 추가하기로 한 기능이라, 저장은 아직 store에 얹지 않고 화면 안에서만 확인만 준다.
// 카테고리 정의(라벨·색·아이콘)는 lib/categories.ts의 PERSONAL_CATS를 그대로 재사용해 앱과 톤을 맞췄다.
import { useMemo, useState } from "react";
import { useNav } from "./NavContext";
import { PERSONAL_CATS, type CategoryDef } from "@/lib/categories";
import { formatWon } from "@/lib/format";
import { ChevronLeftIcon, CategoryIcon } from "./icons";
import type { CategoryIconKey } from "./icons";

// 지난 3개월 지출(샘플) — 실제 지출 이력이 없는 독립 컴포넌트라, 카테고리별로 그럴듯한 샘플값을 붙였다.
// 나중에 실제 데이터에 연결하려면 이 맵 대신 history prop을 넘기면 된다.
const SAMPLE_LAST_3_MONTHS: Record<string, [number, number, number]> = {
  food: [420000, 385000, 460000],
  living: [95000, 110000, 88000],
  transport: [72000, 68000, 75000],
  hobby: [150000, 90000, 210000],
  clothing: [130000, 40000, 95000],
  etc: [60000, 55000, 70000],
};

// Home(2b) "이번 달 총 수입"·"이번 달 총 지출" 카드와 같은 샘플 숫자 — 목표 금액은
// 카테고리와 무관하게 0원 ~ 지금 갖고 있는 돈(수입 - 지출)까지만 잡을 수 있다.
const SAMPLE_INCOME_TOTAL = 2400000;
const SAMPLE_EXPENSE_TOTAL = 1024300;
const AVAILABLE_MONEY = Math.max(SAMPLE_INCOME_TOTAL - SAMPLE_EXPENSE_TOTAL, 0);

function average(nums: number[]): number {
  return Math.round(nums.reduce((sum, n) => sum + n, 0) / nums.length);
}

// 슬라이더·추천 금액이 너무 들쭉날쭉하지 않도록 1,000원 단위로 반올림.
function roundTo1000(n: number): number {
  return Math.round(n / 1000) * 1000;
}

function encouragementMessage(category: CategoryDef, amount: number, recommended: number, avg3: number): string {
  if (amount <= 0) return `${category.label} 목표 금액을 정해볼까요?`;
  if (amount <= recommended * 0.8) {
    return `와, ${category.label}에 정말 짠 목표를 세우셨네요! 도전적이지만 해내면 그만큼 뿌듯할 거예요 💪`;
  }
  if (amount <= recommended * 1.05) {
    return `지난 3개월 평균보다 아낀 알찬 목표예요. 이 페이스라면 ${category.label} 지출을 확실히 줄일 수 있어요!`;
  }
  if (amount <= avg3 * 1.05) {
    return `평소와 비슷한 수준이에요. 무리하지 않고 꾸준히 기록하는 것부터 시작해봐요.`;
  }
  return `여유 있게 시작하는 것도 좋은 전략이에요. 다음 달엔 조금 더 줄여보는 건 어떨까요?`;
}

export default function MonthlyGoalSetting() {
  const nav = useNav();
  const categories = PERSONAL_CATS;
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0].id);
  const category = categories.find((c) => c.id === selectedCategoryId) ?? categories[0];

  const avg3 = useMemo(() => average(SAMPLE_LAST_3_MONTHS[selectedCategoryId] ?? [0, 0, 0]), [selectedCategoryId]);
  const recommended = useMemo(() => roundTo1000(avg3 * 0.9), [avg3]);
  const maxAmount = AVAILABLE_MONEY;

  const [amount, setAmount] = useState(recommended);
  const [amountText, setAmountText] = useState(String(recommended));
  const [saved, setSaved] = useState<{ categoryId: string; amount: number } | null>(null);

  function handleSelectCategory(next: CategoryDef) {
    setSelectedCategoryId(next.id);
    const nextAvg = average(SAMPLE_LAST_3_MONTHS[next.id] ?? [0, 0, 0]);
    const nextRecommended = roundTo1000(nextAvg * 0.9);
    setAmount(nextRecommended);
    setAmountText(String(nextRecommended));
    setSaved(null);
  }

  function handleAmountText(text: string) {
    const digitsOnly = text.replace(/[^0-9]/g, "");
    const next = Math.min(parseInt(digitsOnly, 10) || 0, maxAmount);
    setAmountText(String(next));
    setAmount(next);
  }

  function handleApplyRecommended() {
    setAmount(recommended);
    setAmountText(String(recommended));
  }

  function handleSave() {
    setSaved({ categoryId: selectedCategoryId, amount });
  }

  const message = encouragementMessage(category, amount, recommended, avg3);

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        boxSizing: "border-box",
        background: "var(--shoot-bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
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
                }}
              >
                <CategoryIcon icon={cat.icon as CategoryIconKey} size={15} color={cat.ink} />
                {cat.label}
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 18,
            padding: "14px 16px",
            borderRadius: 16,
            background: category.light,
            border: `1px solid ${category.accent}55`,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: category.ink }}>
            지난 3개월 {category.label} 평균 지출
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: category.ink, marginTop: 4 }}>{formatWon(avg3)}</div>
          <div style={{ fontSize: 12, color: category.ink, opacity: 0.8, marginTop: 6 }}>
            평균의 90% · 추천 목표 <strong>{formatWon(recommended)}</strong>
          </div>
          <div
            onClick={handleApplyRecommended}
            style={{
              marginTop: 10,
              display: "inline-flex",
              alignItems: "center",
              padding: "7px 12px",
              borderRadius: 10,
              background: "var(--shoot-surface)",
              color: category.ink,
              fontSize: 12,
              fontWeight: 800,
              border: `1.5px solid ${category.accent}`,
              cursor: "pointer",
            }}
          >
            추천 금액 적용하기
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--shoot-text)", marginBottom: 8 }}>목표 금액</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: "var(--shoot-text-muted)" }}>₩</span>
            <input
              value={amountText}
              onChange={(e) => handleAmountText(e.target.value)}
              inputMode="numeric"
              placeholder="0"
              style={{
                fontSize: 30,
                fontWeight: 800,
                color: "var(--shoot-text)",
                letterSpacing: "-1px",
                border: "none",
                background: "transparent",
                width: "100%",
              }}
            />
          </div>
          <div style={{ height: 1.5, background: "var(--shoot-border)", marginTop: 8 }} />
          <div style={{ fontSize: 11, color: "var(--shoot-text-muted)", fontWeight: 600, marginTop: 6 }}>
            최대 {formatWon(maxAmount)}까지 설정할 수 있어요(이번 달 남은 돈 기준)
          </div>
        </div>

        <div
          style={{
            marginTop: 18,
            padding: "14px 16px",
            borderRadius: 16,
            background: "var(--shoot-surface)",
            border: "1px solid var(--shoot-border)",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--shoot-text)" }}>{message}</div>
        </div>

        {saved && (
          <div style={{ fontSize: 12, fontWeight: 700, color: category.ink, textAlign: "center", marginTop: 10 }}>
            {category.label} 목표 {formatWon(saved.amount)}(으)로 저장했어요
          </div>
        )}

        <div
          onClick={handleSave}
          style={{
            marginTop: 14,
            height: 50,
            borderRadius: 16,
            background: "linear-gradient(135deg,#E3DFFB 0%,#BDB2F2 100%)",
            color: "#3F3480",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15,
            fontWeight: 800,
            boxShadow: "0 8px 18px rgba(106,94,207,0.3)",
            cursor: "pointer",
          }}
        >
          목표 저장하기
        </div>
      </div>
    </div>
  );
}
