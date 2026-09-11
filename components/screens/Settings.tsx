"use client";
// components/screens/Settings.tsx — 2c. 설정(design/shoot/Settings.dc.html)
// 2026-09-11 팀 결정으로 카테고리 관리·알림 3종·다크모드·글자크기 전부 이번 범위에 포함(예산 임계값 실제 기능 제외 — 토글만).
import { useState } from "react";
import { useNav } from "../NavContext";
import { useStore, type FontSize } from "@/lib/store";
import { SETTINGS_BASE_CATS } from "@/lib/categories";
import { CategoryIcon, type CategoryIconKey } from "../icons";
import { AlertCircleIcon, BellIcon, ChevronLeftIcon, MoonIcon, PlusIcon, TypeSizeIcon, VolumeIcon } from "../icons";

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{ width: 42, height: 24, borderRadius: 12, background: on ? "#6A5ECF" : "#D8D3C8", position: "relative", flexShrink: 0, cursor: "pointer", transition: "background 0.15s" }}
    >
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: on ? 21 : 3, boxShadow: "0 2px 5px rgba(0,0,0,0.2)", transition: "left 0.15s" }} />
    </div>
  );
}

const FONT_SIZE_OPTIONS: { value: FontSize; label: string }[] = [
  { value: "medium", label: "중간" },
  { value: "small", label: "작게" },
  { value: "large", label: "크게" },
];

export default function Settings() {
  const nav = useNav();
  const store = useStore();
  const [showAddInput, setShowAddInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const categories = [...SETTINGS_BASE_CATS, ...store.customCategories];

  function handleAddCategory() {
    if (newCategoryName.trim().length === 0) return;
    store.addCustomCategory(newCategoryName);
    setNewCategoryName("");
    setShowAddInput(false);
  }

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "#F6F5FC", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 20px 12px", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
        <div onClick={() => nav.back()} style={{ cursor: "pointer", display: "flex" }}>
          <ChevronLeftIcon size={18} color="#2D2A3E" />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#2D2A3E" }}>설정</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 20px" }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#8B8378", margin: "14px 0 8px" }}>카테고리</div>
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E8E4F4", overflow: "hidden" }}>
          {categories.map((cat, idx) => (
            <div
              key={cat.id}
              style={{ padding: "13px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: idx < categories.length - 1 ? "1px solid #F1EEEE" : "none" }}
            >
              <div style={{ width: 30, height: 30, borderRadius: 9, background: cat.light, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <CategoryIcon icon={cat.icon as CategoryIconKey} size={15} color={cat.ink} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#2D2A3E" }}>{cat.label}</div>
            </div>
          ))}
        </div>

        {showAddInput ? (
          <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
            <input
              type="text"
              autoFocus
              placeholder="카테고리 이름"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              style={{ flex: 1, boxSizing: "border-box", height: 44, borderRadius: 14, border: "2px solid #6A5ECF", background: "#fff", padding: "0 14px", fontSize: 13, fontWeight: 600, color: "#2D2A3E" }}
            />
            <div
              onClick={handleAddCategory}
              style={{ height: 44, padding: "0 16px", borderRadius: 14, background: "#6A5ECF", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
            >
              추가
            </div>
          </div>
        ) : (
          <div
            onClick={() => setShowAddInput(true)}
            style={{ marginTop: 10, height: 44, borderRadius: 14, border: "1.5px dashed #C7BFB2", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}
          >
            <PlusIcon size={15} color="#8B8378" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#8B8378" }}>새 카테고리 추가</span>
          </div>
        )}

        <div style={{ fontSize: 12, fontWeight: 800, color: "#8B8378", margin: "22px 0 8px" }}>알림</div>
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E8E4F4", overflow: "hidden" }}>
          <div style={{ padding: 14, display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #F1EEEE" }}>
            <BellIcon size={17} color="#6B6980" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#2D2A3E" }}>지출 기록 시 확인 알림</div>
              <div style={{ fontSize: 11, color: "#8B8378", marginTop: 2 }}>예: &quot;3,000원, 식비가 저장됐어요&quot;</div>
            </div>
            <Toggle on={store.notificationSettings.expenseConfirm} onClick={() => store.toggleNotification("expenseConfirm")} />
          </div>
          <div style={{ padding: 14, display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #F1EEEE" }}>
            <AlertCircleIcon size={17} color="#6B6980" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#2D2A3E" }}>예산 초과 시 알림</div>
            </div>
            <Toggle on={store.notificationSettings.budgetExceeded} onClick={() => store.toggleNotification("budgetExceeded")} />
          </div>
          <div style={{ padding: 14, display: "flex", alignItems: "center", gap: 10 }}>
            <VolumeIcon size={17} color="#6B6980" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#2D2A3E" }}>알림음</div>
            </div>
            <Toggle on={store.notificationSettings.sound} onClick={() => store.toggleNotification("sound")} />
          </div>
        </div>

        <div style={{ fontSize: 12, fontWeight: 800, color: "#8B8378", margin: "22px 0 8px" }}>앱 외형</div>
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E8E4F4", padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <MoonIcon size={17} color="#6B6980" />
            <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "#2D2A3E" }}>다크 모드</div>
            <Toggle on={store.darkMode} onClick={() => store.toggleDarkMode()} />
          </div>
          <div style={{ height: 1, background: "#F1EEEE", margin: "14px 0" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <TypeSizeIcon size={17} color="#6B6980" />
            <div style={{ fontSize: 14, fontWeight: 700, color: "#2D2A3E" }}>글자 크기</div>
          </div>
          <select
            value={store.fontSize}
            onChange={(e) => store.setFontSize(e.target.value as FontSize)}
            style={{ width: "100%", boxSizing: "border-box", height: 42, borderRadius: 10, border: "1.5px solid #E8E4F4", background: "#fff", padding: "0 12px", fontSize: 13, fontWeight: 600, color: "#2D2A3E" }}
          >
            {FONT_SIZE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
