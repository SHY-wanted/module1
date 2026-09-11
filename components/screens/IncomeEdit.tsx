"use client";
// components/screens/IncomeEdit.tsx — 2b-1. 이번 달 수입 입력(design/shoot/IncomeEdit.dc.html)
// 06-data.md E7 참고 — supabase/schema.sql엔 없는 신규 기능(2026-09-11 팀 결정으로 이번 범위에 포함).
import { useState } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import { TODAY_DATE } from "@/lib/mock";
import type { IncomeCategory } from "@/lib/mock";
import { ChevronLeftIcon, RefreshIcon } from "../icons";

const CURRENT_MONTH = "2026-09";
const INCOME_CATEGORIES: IncomeCategory[] = ["급여", "용돈", "부수입", "기타"];

export default function IncomeEdit() {
  const nav = useNav();
  const store = useStore();
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState<IncomeCategory>("급여");
  const [memo, setMemo] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);

  function handleSave() {
    store.addIncome({
      user_id: store.currentUserId,
      amount,
      category,
      memo: memo.trim() || null,
      is_recurring: isRecurring,
      month: CURRENT_MONTH,
      date: TODAY_DATE,
    });
    // 07-screens.md "2b-1 '추가하기' → 2b-1a로 복귀(다른 입력 폼과 같은 패턴)" — 2026-09-11 팀 결정.
    nav.back();
  }

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "#F6F5FC", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 20px 12px", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
        <div onClick={() => nav.back()} style={{ cursor: "pointer", display: "flex" }}>
          <ChevronLeftIcon size={18} color="#2D2A3E" />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#2D2A3E" }}>이번 달 수입</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px 20px 24px", display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#fff", border: "1.5px solid #E8E4F4", borderRadius: 20, padding: "22px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#6B6980" }}>2026년 9월 수입</div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4, marginTop: 8 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#8B8378" }}>₩</span>
            <span style={{ fontSize: 34, fontWeight: 800, color: "#1D7A69", letterSpacing: "-1px" }}>{amount.toLocaleString("ko-KR")}</span>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <input
            type="number"
            placeholder="직접 입력"
            value={amount || ""}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            style={{ width: "100%", boxSizing: "border-box", height: 46, borderRadius: 14, border: "2px solid #E8E4F4", background: "#fff", padding: "0 16px", fontSize: 14, color: "#2D2A3E", fontWeight: 600, textAlign: "center" }}
          />
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <div onClick={() => setAmount((v) => v + 10000)} style={{ flex: 1, height: 38, borderRadius: 12, background: "#fff", border: "1.5px solid #E8E4F4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#6B6980", cursor: "pointer" }}>
            +1만
          </div>
          <div onClick={() => setAmount((v) => v + 100000)} style={{ flex: 1, height: 38, borderRadius: 12, background: "#fff", border: "1.5px solid #E8E4F4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#6B6980", cursor: "pointer" }}>
            +10만
          </div>
          <div onClick={() => setAmount((v) => v + 1000000)} style={{ flex: 1, height: 38, borderRadius: 12, background: "#fff", border: "1.5px solid #E8E4F4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#6B6980", cursor: "pointer" }}>
            +100만
          </div>
          <div onClick={() => setAmount(0)} style={{ flex: 1, height: 38, borderRadius: 12, background: "#fff", border: "1.5px solid #E8E4F4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#B23B3B", cursor: "pointer" }}>
            초기화
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#2D2A3E", marginBottom: 8 }}>수입 항목</div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as IncomeCategory)}
            style={{ width: "100%", boxSizing: "border-box", height: 46, borderRadius: 14, border: "2px solid #E8E4F4", background: "#fff", padding: "0 14px", fontSize: 14, fontWeight: 600, color: "#2D2A3E" }}
          >
            {INCOME_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#2D2A3E", marginBottom: 8 }}>메모</div>
          <input
            type="text"
            placeholder="예) 9월 월급"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", height: 46, borderRadius: 14, border: "2px solid #E8E4F4", background: "#fff", padding: "0 16px", fontSize: 14, color: "#2D2A3E", fontWeight: 600 }}
          />
        </div>

        <div
          onClick={() => setIsRecurring((v) => !v)}
          style={{ marginTop: 14, background: "#fff", border: "1.5px solid #E8E4F4", borderRadius: 14, padding: 14, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
        >
          <RefreshIcon size={17} color="#6B6980" />
          <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#2D2A3E" }}>매달 자동으로 반복</div>
          <div style={{ width: 42, height: 24, borderRadius: 12, background: isRecurring ? "#6A5ECF" : "#D8D3C8", position: "relative", flexShrink: 0, transition: "background 0.15s" }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: isRecurring ? 21 : 3, boxShadow: "0 2px 5px rgba(0,0,0,0.2)", transition: "left 0.15s" }} />
          </div>
        </div>

        <div style={{ flex: 1 }} />
        <div
          onClick={handleSave}
          style={{ marginTop: 22, height: 50, borderRadius: 16, background: "linear-gradient(135deg,#E3DFFB 0%,#BDB2F2 100%)", color: "#3F3480", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, boxShadow: "0 8px 18px rgba(106,94,207,0.3)", cursor: "pointer" }}
        >
          추가하기
        </div>
      </div>
    </div>
  );
}
