"use client";
// components/screens/BudgetSetting.tsx — P7. 예산 설정(BudgetSetting, 디자인 파일 없음,
// docs/08-pet-feature-spec.md §4-1 근거, 2026-09-15 신규 구현). 종민 확인으로 새로 추가된 화면 —
// 이 앱에 없던 "예산" 개념을 이걸로 해결한다(개인 단위 주간 예산만, §9 참고).
import { useState } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import { RefreshIcon, ChevronLeftIcon } from "../icons";

export default function BudgetSetting() {
  const nav = useNav();
  const store = useStore();
  const [amount, setAmount] = useState(store.budget?.weekly_amount ?? 0);
  const [autoRepeat, setAutoRepeat] = useState(store.budget?.auto_repeat ?? true);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    await store.setBudget(amount, autoRepeat);
    setSaving(false);
    store.showToast("주간 예산이 저장됐어요");
    nav.back();
  }

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "var(--shoot-bg)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 20px 12px", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
        <div onClick={() => nav.back()} style={{ cursor: "pointer", display: "flex" }}>
          <ChevronLeftIcon size={18} color="var(--shoot-text)" />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--shoot-text)" }}>주간 예산 설정</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px 20px 24px", display: "flex", flexDirection: "column" }}>
        <div style={{ background: "var(--shoot-surface)", border: "1.5px solid var(--shoot-border)", borderRadius: 20, padding: "22px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--shoot-text-muted)" }}>이번 주 예산</div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4, marginTop: 8 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: "var(--shoot-text-muted)" }}>₩</span>
            <span style={{ fontSize: 34, fontWeight: 800, color: "var(--shoot-text)", letterSpacing: "-1px" }}>{amount.toLocaleString("ko-KR")}</span>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <input
            type="number"
            placeholder="직접 입력"
            value={amount || ""}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            style={{ width: "100%", boxSizing: "border-box", height: 46, borderRadius: 14, border: "2px solid var(--shoot-border)", background: "var(--shoot-surface)", padding: "0 16px", fontSize: 14, color: "var(--shoot-text)", fontWeight: 600, textAlign: "center" }}
          />
        </div>

        {/* §4-1: "+1만/+10만/+50만 빠른 증가 버튼, 초기화" */}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <div onClick={() => setAmount((v) => v + 10000)} style={{ flex: 1, height: 38, borderRadius: 12, background: "var(--shoot-surface)", border: "1.5px solid var(--shoot-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--shoot-text-muted)", cursor: "pointer" }}>
            +1만
          </div>
          <div onClick={() => setAmount((v) => v + 100000)} style={{ flex: 1, height: 38, borderRadius: 12, background: "var(--shoot-surface)", border: "1.5px solid var(--shoot-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--shoot-text-muted)", cursor: "pointer" }}>
            +10만
          </div>
          <div onClick={() => setAmount((v) => v + 500000)} style={{ flex: 1, height: 38, borderRadius: 12, background: "var(--shoot-surface)", border: "1.5px solid var(--shoot-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--shoot-text-muted)", cursor: "pointer" }}>
            +50만
          </div>
          <div onClick={() => setAmount(0)} style={{ flex: 1, height: 38, borderRadius: 12, background: "var(--shoot-surface)", border: "1.5px solid var(--shoot-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#B23B3B", cursor: "pointer" }}>
            초기화
          </div>
        </div>

        <div
          onClick={() => setAutoRepeat((v) => !v)}
          style={{ marginTop: 20, background: "var(--shoot-surface)", border: "1.5px solid var(--shoot-border)", borderRadius: 14, padding: 14, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
        >
          <RefreshIcon size={17} color="var(--shoot-text-muted)" />
          <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "var(--shoot-text)" }}>매주 같은 금액으로 자동 반복</div>
          <div style={{ width: 42, height: 24, borderRadius: 12, background: autoRepeat ? "var(--shoot-accent)" : "#D8D3C8", position: "relative", flexShrink: 0, transition: "background 0.15s" }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--shoot-surface)", position: "absolute", top: 3, left: autoRepeat ? 21 : 3, boxShadow: "0 2px 5px rgba(0,0,0,0.2)", transition: "left 0.15s" }} />
          </div>
        </div>

        <div style={{ fontSize: 11, color: "var(--shoot-text-muted)", marginTop: 12, lineHeight: 1.5 }}>
          이 예산은 저금통 펫의 &quot;이번 주 리포트&quot;에서 지출과 비교돼요. 예산보다 덜 썼으면 절약한 만큼 코인·XP를 받아요.
        </div>

        <div style={{ flex: 1 }} />
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
