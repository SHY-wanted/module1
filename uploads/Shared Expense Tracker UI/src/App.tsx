import React, { useState } from "react";

// ── Design tokens ───────────────────────────────────────────────────
const C = {
  mint: "#6FC5BA",
  mintLight: "#E8F9F7",
  mintMid: "#A8DDD9",
  lavender: "#B8ADEC",
  lavenderLight: "#F0EEFF",
  peach: "#F5A882",
  peachLight: "#FFF2EC",
  pink: "#F0A8C0",
  pinkLight: "#FFF0F6",
  sky: "#89C4F4",
  skyLight: "#EBF5FF",
  yellow: "#F5D485",
  yellowLight: "#FFFBE8",
  green: "#84C9A4",
  greenLight: "#EDFAF3",
  bg: "#F6F5FC",
  card: "#FFFFFF",
  text: "#2D2A3E",
  sub: "#8C8AA0",
  border: "#E8E4F4",
};

const F: React.CSSProperties = { fontFamily: "Nunito, sans-serif" };

// ── Shared components ───────────────────────────────────────────────

function StatusBar({ light = false }: { light?: boolean }) {
  const col = light ? "rgba(255,255,255,0.92)" : C.text;
  return (
    <div
      style={{
        height: "44px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        flexShrink: 0,
        position: "relative",
        zIndex: 20,
      }}
    >
      <span style={{ fontSize: "15px", fontWeight: 700, color: col, letterSpacing: "-0.3px" }}>
        9:41
      </span>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "6px",
          transform: "translateX(-50%)",
          width: "124px",
          height: "34px",
          background: "#1C1C1E",
          borderRadius: "20px",
        }}
      />
      <div style={{ display: "flex", gap: "5px", alignItems: "center", color: col }}>
        <svg width="16" height="11" viewBox="0 0 16 11" fill={col}>
          <rect x="0" y="4" width="2.5" height="7" rx="0.8" />
          <rect x="4" y="2.5" width="2.5" height="8.5" rx="0.8" />
          <rect x="8" y="1" width="2.5" height="10" rx="0.8" />
          <rect x="12" y="0" width="2.5" height="11" rx="0.8" />
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <path d="M8 2.5C10.5 2.5 12.7 3.6 14.2 5.4L15.5 4C13.7 1.9 11 0.5 8 0.5C5 0.5 2.3 1.9 0.5 4L1.8 5.4C3.3 3.6 5.5 2.5 8 2.5Z" fill={col} opacity="0.4" />
          <path d="M8 5.5C9.8 5.5 11.3 6.3 12.4 7.5L13.7 6.1C12.2 4.5 10.2 3.5 8 3.5C5.8 3.5 3.8 4.5 2.3 6.1L3.6 7.5C4.7 6.3 6.2 5.5 8 5.5Z" fill={col} opacity="0.7" />
          <circle cx="8" cy="10" r="2" fill={col} />
        </svg>
        <div style={{ width: "25px", height: "12px", border: `1.5px solid ${col}`, borderRadius: "3px", position: "relative", opacity: 0.9 }}>
          <div style={{ position: "absolute", right: "-4px", top: "2.5px", width: "3px", height: "7px", background: col, borderRadius: "0 2px 2px 0" }} />
          <div style={{ margin: "1.5px", width: "17px", height: "7px", background: col, borderRadius: "2px" }} />
        </div>
      </div>
    </div>
  );
}

function BottomNav({ active }: { active: "home" | "groups" | "feed" | "profile" }) {
  const items = [
    { id: "home", icon: "🏠", label: "홈" },
    { id: "groups", icon: "👥", label: "그룹" },
    { id: "add", icon: "➕", label: "" },
    { id: "feed", icon: "📋", label: "피드" },
    { id: "profile", icon: "👤", label: "설정" },
  ];
  return (
    <div
      style={{
        height: "80px",
        background: "white",
        borderTop: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "flex-start",
        paddingTop: "10px",
        flexShrink: 0,
      }}
    >
      {items.map((item) => (
        <button
          key={item.id}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "3px",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            ...F,
          }}
        >
          {item.id === "add" ? (
            <div
              style={{
                width: "48px",
                height: "48px",
                background: `linear-gradient(135deg, ${C.mint}, ${C.sky})`,
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: "-20px",
                boxShadow: `0 6px 18px rgba(111,197,186,0.5)`,
                fontSize: "22px",
              }}
            >
              ➕
            </div>
          ) : (
            <>
              <span style={{ fontSize: "22px", lineHeight: 1 }}>{item.icon}</span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: active === item.id ? C.mint : C.sub,
                }}
              >
                {item.label}
              </span>
            </>
          )}
        </button>
      ))}
    </div>
  );
}

function PrimaryBtn({
  children,
  onClick,
  gradient,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  gradient?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "16px",
        background: gradient ?? `linear-gradient(135deg, ${C.mint}, ${C.sky})`,
        color: "white",
        borderRadius: "16px",
        border: "none",
        fontSize: "16px",
        fontWeight: 700,
        cursor: "pointer",
        boxShadow: "0 8px 22px rgba(111,197,186,0.35)",
        ...F,
        letterSpacing: "-0.2px",
      }}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: "13px",
          fontWeight: 700,
          color: C.text,
          marginBottom: "8px",
          ...F,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function TInput({
  placeholder,
  type = "text",
  icon,
  value,
  onChange,
  maxLength,
}: {
  placeholder: string;
  type?: string;
  icon?: string;
  value?: string;
  onChange?: (v: string) => void;
  maxLength?: number;
}) {
  return (
    <div style={{ position: "relative" }}>
      {icon && (
        <span
          style={{
            position: "absolute",
            left: "14px",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "17px",
            lineHeight: 1,
            zIndex: 1,
          }}
        >
          {icon}
        </span>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        maxLength={maxLength}
        style={{
          width: "100%",
          padding: "14px 16px",
          paddingLeft: icon ? "44px" : "16px",
          background: "white",
          border: `2px solid ${C.border}`,
          borderRadius: "14px",
          fontSize: "15px",
          color: C.text,
          fontWeight: 500,
          boxSizing: "border-box",
          transition: "border-color 0.2s, box-shadow 0.2s",
          ...F,
        }}
      />
    </div>
  );
}

// ── Screen 1: Sign Up ───────────────────────────────────────────────

function SignUpScreen() {
  const [agreed, setAgreed] = useState(false);
  return (
    <div style={{ ...F, background: C.bg, minHeight: "100%" }}>
      <div
        style={{
          background: `linear-gradient(160deg, ${C.mintLight} 0%, ${C.lavenderLight} 100%)`,
          padding: "32px 24px 36px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "72px",
            height: "72px",
            background: `linear-gradient(135deg, ${C.mint}, ${C.sky})`,
            borderRadius: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            fontSize: "34px",
            boxShadow: `0 10px 28px rgba(111,197,186,0.4)`,
          }}
        >
          💰
        </div>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 800,
            color: C.text,
            margin: "0 0 6px",
            letterSpacing: "-0.5px",
          }}
        >
          우리끼리 가계부
        </h1>
        <p style={{ fontSize: "14px", color: C.sub, margin: 0, fontWeight: 500 }}>
          함께 쓰고, 함께 확인해요
        </p>
      </div>

      <div
        style={{
          padding: "28px 24px 36px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <Field label="이메일">
          <TInput placeholder="hello@example.com" type="email" icon="✉️" />
        </Field>
        <Field label="비밀번호">
          <TInput placeholder="8자 이상 입력해주세요" type="password" icon="🔒" />
        </Field>
        <Field label="비밀번호 확인">
          <TInput placeholder="비밀번호를 다시 입력해주세요" type="password" icon="🔒" />
        </Field>

        <label
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "flex-start",
            cursor: "pointer",
            marginTop: "4px",
          }}
        >
          <div
            onClick={() => setAgreed(!agreed)}
            style={{
              width: "22px",
              height: "22px",
              flexShrink: 0,
              borderRadius: "7px",
              border: agreed ? "none" : `2px solid ${C.border}`,
              background: agreed ? C.mint : "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "1px",
              transition: "all 0.2s",
              cursor: "pointer",
            }}
          >
            {agreed && (
              <span style={{ color: "white", fontSize: "13px", fontWeight: 900 }}>✓</span>
            )}
          </div>
          <span style={{ fontSize: "13px", color: C.sub, lineHeight: "1.6" }}>
            <span style={{ color: C.mint, fontWeight: 700 }}>이용약관</span>
            {" "}및{" "}
            <span style={{ color: C.mint, fontWeight: 700 }}>개인정보 처리방침</span>
            에 동의합니다
          </span>
        </label>

        <div style={{ marginTop: "8px" }}>
          <PrimaryBtn>가입하기</PrimaryBtn>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            margin: "4px 0",
          }}
        >
          <div style={{ flex: 1, height: "1px", background: C.border }} />
          <span style={{ fontSize: "12px", color: C.sub, fontWeight: 600 }}>또는</span>
          <div style={{ flex: 1, height: "1px", background: C.border }} />
        </div>

        <button
          style={{
            width: "100%",
            padding: "14px",
            background: "#FEE500",
            borderRadius: "14px",
            border: "none",
            fontSize: "15px",
            fontWeight: 700,
            color: "#3C1E1E",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            ...F,
          }}
        >
          <span style={{ fontSize: "20px" }}>💬</span>
          카카오로 시작하기
        </button>

        <p style={{ textAlign: "center", fontSize: "14px", color: C.sub, margin: 0 }}>
          이미 계정이 있어요?{" "}
          <span style={{ color: C.mint, fontWeight: 700 }}>로그인</span>
        </p>
      </div>
    </div>
  );
}

// ── Screen 2: Login ─────────────────────────────────────────────────

function LoginScreen() {
  const [remember, setRemember] = useState(true);
  return (
    <div style={{ ...F, background: C.bg, minHeight: "100%" }}>
      <div
        style={{
          background: `linear-gradient(160deg, ${C.lavenderLight} 0%, ${C.mintLight} 100%)`,
          padding: "36px 24px 40px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "68px",
            height: "68px",
            background: `linear-gradient(135deg, ${C.lavender}, ${C.mint})`,
            borderRadius: "22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            fontSize: "32px",
            boxShadow: `0 8px 22px rgba(184,173,236,0.4)`,
          }}
        >
          👋
        </div>
        <h2
          style={{
            fontSize: "22px",
            fontWeight: 800,
            color: C.text,
            margin: "0 0 6px",
            letterSpacing: "-0.4px",
          }}
        >
          다시 만나서 반가워요!
        </h2>
        <p style={{ fontSize: "14px", color: C.sub, margin: 0, fontWeight: 500 }}>
          로그인하고 가계부를 확인해보세요
        </p>
      </div>

      <div
        style={{
          padding: "28px 24px 36px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <Field label="이메일">
          <TInput placeholder="hello@example.com" type="email" icon="✉️" />
        </Field>
        <Field label="비밀번호">
          <TInput placeholder="비밀번호를 입력해주세요" type="password" icon="🔒" />
        </Field>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <label
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <div
              onClick={() => setRemember(!remember)}
              style={{
                width: "44px",
                height: "26px",
                borderRadius: "13px",
                background: remember ? C.mint : C.border,
                position: "relative",
                transition: "background 0.2s",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "3px",
                  left: remember ? "21px" : "3px",
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: "white",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                  transition: "left 0.2s",
                }}
              />
            </div>
            <span style={{ fontSize: "13px", fontWeight: 600, color: C.text }}>
              로그인 상태 유지
            </span>
          </label>
          <span style={{ fontSize: "13px", color: C.lavender, fontWeight: 700 }}>
            비밀번호 찾기
          </span>
        </div>

        <div style={{ marginTop: "8px" }}>
          <PrimaryBtn>로그인</PrimaryBtn>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ flex: 1, height: "1px", background: C.border }} />
          <span style={{ fontSize: "12px", color: C.sub, fontWeight: 600 }}>또는</span>
          <div style={{ flex: 1, height: "1px", background: C.border }} />
        </div>

        <button
          style={{
            width: "100%",
            padding: "14px",
            background: "#FEE500",
            borderRadius: "14px",
            border: "none",
            fontSize: "15px",
            fontWeight: 700,
            color: "#3C1E1E",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            ...F,
          }}
        >
          <span style={{ fontSize: "20px" }}>💬</span>
          카카오로 로그인
        </button>

        <p style={{ textAlign: "center", fontSize: "14px", color: C.sub, margin: 0 }}>
          계정이 없으신가요?{" "}
          <span style={{ color: C.mint, fontWeight: 700 }}>회원가입</span>
        </p>
      </div>
    </div>
  );
}

// ── Screen 3: Group Onboarding ──────────────────────────────────────

const GROUP_TYPES = [
  { emoji: "👨‍👩‍👧‍👦", label: "가족", bg: C.mintLight, accent: C.mint },
  { emoji: "💑", label: "부부", bg: C.pinkLight, accent: C.pink },
  { emoji: "💕", label: "커플", bg: C.lavenderLight, accent: C.lavender },
  { emoji: "🏠", label: "룸메이트", bg: C.skyLight, accent: C.sky },
  { emoji: "👯", label: "형제자매", bg: C.peachLight, accent: C.peach },
  { emoji: "🎭", label: "모임·동아리", bg: C.yellowLight, accent: C.yellow },
  { emoji: "✨", label: "기타", bg: C.greenLight, accent: C.green },
];

function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [name, setName] = useState("");
  const inviteCode = "WR-7K2P";

  if (step === 0) {
    return (
      <div style={{ ...F, background: C.bg, minHeight: "100%", padding: "24px 20px 36px" }}>
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  height: "4px",
                  flex: 1,
                  borderRadius: "2px",
                  background: i === 0 ? C.mint : C.border,
                }}
              />
            ))}
          </div>
          <h2
            style={{
              fontSize: "22px",
              fontWeight: 800,
              color: C.text,
              margin: "16px 0 6px",
              letterSpacing: "-0.4px",
            }}
          >
            어떤 모임인가요?
          </h2>
          <p style={{ fontSize: "14px", color: C.sub, margin: 0 }}>
            모임 성격에 맞는 유형을 선택해주세요
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
            marginBottom: "10px",
          }}
        >
          {GROUP_TYPES.slice(0, 6).map((t, i) => (
            <button
              key={i}
              onClick={() => setSel(i)}
              style={{
                padding: "16px 8px",
                background: sel === i ? t.accent : t.bg,
                borderRadius: "16px",
                border: `2px solid ${sel === i ? t.accent : "transparent"}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                transition: "all 0.18s",
                boxShadow:
                  sel === i ? `0 6px 18px ${t.accent}55` : "0 2px 6px rgba(45,42,62,0.06)",
                ...F,
              }}
            >
              <span style={{ fontSize: "28px", lineHeight: 1 }}>{t.emoji}</span>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: sel === i ? "white" : C.text,
                }}
              >
                {t.label}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setSel(6)}
          style={{
            width: "100%",
            padding: "14px 16px",
            background: sel === 6 ? C.green : C.greenLight,
            borderRadius: "14px",
            border: `2px solid ${sel === 6 ? C.green : "transparent"}`,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            cursor: "pointer",
            marginBottom: "28px",
            ...F,
          }}
        >
          <span style={{ fontSize: "22px" }}>✨</span>
          <span
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: sel === 6 ? "white" : C.text,
            }}
          >
            기타 (직접 입력)
          </span>
        </button>

        <PrimaryBtn onClick={() => sel !== null && setStep(1)}>다음으로 →</PrimaryBtn>
      </div>
    );
  }

  if (step === 1) {
    const t = GROUP_TYPES[sel!];
    return (
      <div style={{ ...F, background: C.bg, minHeight: "100%", padding: "24px 24px 36px" }}>
        <button
          onClick={() => setStep(0)}
          style={{
            background: "white",
            border: `2px solid ${C.border}`,
            borderRadius: "12px",
            padding: "8px 14px",
            fontSize: "13px",
            fontWeight: 700,
            color: C.sub,
            cursor: "pointer",
            marginBottom: "20px",
            ...F,
          }}
        >
          ← 뒤로
        </button>

        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  height: "4px",
                  flex: 1,
                  borderRadius: "2px",
                  background: i <= 1 ? C.mint : C.border,
                }}
              />
            ))}
          </div>
          <h2
            style={{
              fontSize: "22px",
              fontWeight: 800,
              color: C.text,
              margin: "16px 0 8px",
              letterSpacing: "-0.4px",
            }}
          >
            그룹 이름을 정해주세요
          </h2>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: t.bg,
              borderRadius: "20px",
              padding: "5px 12px",
            }}
          >
            <span style={{ fontSize: "16px" }}>{t.emoji}</span>
            <span style={{ fontSize: "13px", fontWeight: 700, color: C.text }}>{t.label}</span>
          </div>
        </div>

        <Field label="그룹 이름">
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder={`예) 우리 ${t.label}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              style={{
                width: "100%",
                padding: "14px 52px 14px 16px",
                background: "white",
                border: `2px solid ${C.border}`,
                borderRadius: "14px",
                fontSize: "15px",
                color: C.text,
                fontWeight: 500,
                boxSizing: "border-box",
                ...F,
              }}
            />
            <span
              style={{
                position: "absolute",
                right: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "12px",
                color: C.sub,
                fontWeight: 600,
              }}
            >
              {name.length}/20
            </span>
          </div>
        </Field>

        <div style={{ marginTop: "20px", marginBottom: "28px" }}>
          <p
            style={{
              fontSize: "12px",
              color: C.sub,
              fontWeight: 600,
              marginBottom: "10px",
            }}
          >
            이런 이름 어때요? 💡
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {[`우리 ${t.label}`, `행복한 ${t.label}`, "함께 가계부", `${t.emoji} 모임`].map(
              (n) => (
                <button
                  key={n}
                  onClick={() => setName(n)}
                  style={{
                    padding: "7px 14px",
                    background: t.bg,
                    borderRadius: "20px",
                    border: "none",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: C.text,
                    cursor: "pointer",
                    ...F,
                  }}
                >
                  {n}
                </button>
              )
            )}
          </div>
        </div>

        <PrimaryBtn onClick={() => name.trim() && setStep(2)}>그룹 만들기 🎉</PrimaryBtn>
      </div>
    );
  }

  // Step 2: Success
  return (
    <div style={{ ...F, background: C.bg, minHeight: "100%", padding: "36px 24px 40px" }}>
      <div style={{ marginBottom: "8px" }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              display: "inline-block",
              height: "4px",
              width: "calc(33.33% - 6px)",
              marginRight: "8px",
              borderRadius: "2px",
              background: C.mint,
            }}
          />
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: "20px", marginBottom: "32px" }}>
        <div
          style={{
            width: "100px",
            height: "100px",
            background: `linear-gradient(135deg, ${C.mintLight}, ${C.lavenderLight})`,
            borderRadius: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            fontSize: "50px",
            boxShadow: `0 12px 32px rgba(111,197,186,0.25)`,
          }}
        >
          🎉
        </div>
        <h2
          style={{
            fontSize: "24px",
            fontWeight: 800,
            color: C.text,
            margin: "0 0 8px",
            letterSpacing: "-0.5px",
          }}
        >
          그룹이 만들어졌어요!
        </h2>
        <p style={{ fontSize: "14px", color: C.sub, margin: 0, fontWeight: 500 }}>
          "{name || "우리 그룹"}" 을(를) 시작해볼까요?
        </p>
      </div>

      <div
        style={{
          background: `linear-gradient(135deg, ${C.mint}18, ${C.lavender}12)`,
          border: `2px dashed ${C.mint}70`,
          borderRadius: "20px",
          padding: "24px",
          marginBottom: "16px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: "13px",
            color: C.sub,
            fontWeight: 600,
            margin: "0 0 12px",
          }}
        >
          초대 코드
        </p>
        <div
          style={{
            fontSize: "38px",
            fontWeight: 800,
            color: C.text,
            letterSpacing: "8px",
            marginBottom: "12px",
            fontFamily: "'Courier New', Courier, monospace",
          }}
        >
          {inviteCode}
        </div>
        <p style={{ fontSize: "12px", color: C.sub, margin: 0, lineHeight: "1.5" }}>
          이 코드를 공유해서 멤버를 초대하세요
          <br />
          코드는 언제든지 그룹 설정에서 확인 가능해요
        </p>
      </div>

      <button
        style={{
          width: "100%",
          padding: "15px",
          background: C.lavenderLight,
          borderRadius: "16px",
          border: `2px solid ${C.lavender}60`,
          fontSize: "15px",
          fontWeight: 700,
          color: C.lavender,
          cursor: "pointer",
          marginBottom: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          ...F,
        }}
      >
        🔗 초대 코드 공유하기
      </button>

      <PrimaryBtn onClick={() => setStep(0)}>홈으로 가기</PrimaryBtn>
    </div>
  );
}

// ── Screen 4: Join Group ────────────────────────────────────────────

function JoinGroupScreen() {
  const [code, setCode] = useState("WR-7K");
  const segments = code.replace("-", "").toUpperCase().slice(0, 6);

  return (
    <div style={{ ...F, background: C.bg, minHeight: "100%" }}>
      <div
        style={{
          background: `linear-gradient(160deg, ${C.skyLight} 0%, ${C.mintLight} 100%)`,
          padding: "36px 24px 48px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            background: `linear-gradient(135deg, ${C.sky}, ${C.mint})`,
            borderRadius: "26px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            fontSize: "38px",
            boxShadow: `0 10px 28px rgba(137,196,244,0.4)`,
          }}
        >
          🤝
        </div>
        <h2
          style={{
            fontSize: "22px",
            fontWeight: 800,
            color: C.text,
            margin: "0 0 8px",
            letterSpacing: "-0.4px",
          }}
        >
          그룹에 참여하기
        </h2>
        <p style={{ fontSize: "14px", color: C.sub, margin: 0, fontWeight: 500 }}>
          초대 코드를 입력하면 바로 참여할 수 있어요
        </p>
      </div>

      <div
        style={{
          padding: "32px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <Field label="초대 코드">
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: "56px",
                  background: "white",
                  border: `2px solid ${i < segments.length ? C.mint : C.border}`,
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  fontWeight: 800,
                  color: C.text,
                  fontFamily: "'Courier New', monospace",
                  transition: "border-color 0.2s",
                  boxShadow:
                    i < segments.length ? `0 4px 12px ${C.mint}25` : "none",
                }}
              >
                {segments[i] || ""}
              </div>
            ))}
          </div>
          <input
            type="text"
            placeholder="코드 입력 (예: WR-7K2P)"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={8}
            style={{
              width: "100%",
              padding: "14px 16px",
              background: "white",
              border: `2px solid ${C.border}`,
              borderRadius: "14px",
              fontSize: "18px",
              color: C.text,
              fontWeight: 800,
              textAlign: "center",
              letterSpacing: "3px",
              boxSizing: "border-box",
              fontFamily: "'Courier New', monospace",
            }}
          />
        </Field>

        <PrimaryBtn>참여하기</PrimaryBtn>

        <div
          style={{
            background: C.yellowLight,
            border: `2px solid ${C.yellow}70`,
            borderRadius: "16px",
            padding: "16px",
            display: "flex",
            gap: "12px",
            alignItems: "flex-start",
          }}
        >
          <span style={{ fontSize: "20px" }}>💡</span>
          <div>
            <p
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: C.text,
                margin: "0 0 4px",
              }}
            >
              초대 코드를 모르시나요?
            </p>
            <p style={{ fontSize: "12px", color: C.sub, margin: 0, lineHeight: "1.5" }}>
              그룹 관리자에게 코드를 요청하거나,
              <br />
              카카오톡으로 공유받은 링크를 클릭하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Screen 5: Groups ────────────────────────────────────────────────

const GROUPS = [
  {
    name: "우리 가족",
    type: "가족",
    emoji: "👨‍👩‍👧‍👦",
    bg: C.mintLight,
    accent: C.mint,
    members: 4,
    spend: "₩482,500",
    code: "FA-2K9X",
  },
  {
    name: "지은 & 도현",
    type: "커플",
    emoji: "💕",
    bg: C.lavenderLight,
    accent: C.lavender,
    members: 2,
    spend: "₩156,300",
    code: "WR-7K2P",
  },
  {
    name: "홍대 하우스",
    type: "룸메이트",
    emoji: "🏠",
    bg: C.skyLight,
    accent: C.sky,
    members: 3,
    spend: "₩234,100",
    code: "RM-4M8V",
  },
];

const MEMBERS = [
  { name: "김도현", role: "관리자", avatar: "🐻", color: C.mintLight },
  { name: "박지은", role: "멤버", avatar: "🦊", color: C.lavenderLight },
  { name: "김서연", role: "멤버", avatar: "🐱", color: C.peachLight },
  { name: "박민준", role: "멤버", avatar: "🐼", color: C.skyLight },
];

function GroupsScreen() {
  const [sel, setSel] = useState<number | null>(null);

  if (sel !== null) {
    const g = GROUPS[sel];
    return (
      <div
        style={{
          ...F,
          background: C.bg,
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ background: g.bg, padding: "16px 20px 24px" }}>
          <button
            onClick={() => setSel(null)}
            style={{
              background: "white",
              border: "none",
              borderRadius: "12px",
              padding: "8px 14px",
              fontSize: "13px",
              fontWeight: 700,
              color: C.sub,
              cursor: "pointer",
              marginBottom: "16px",
              ...F,
            }}
          >
            ← 목록으로
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                background: g.accent + "30",
                borderRadius: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                border: `2px solid ${g.accent}40`,
              }}
            >
              {g.emoji}
            </div>
            <div>
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 800,
                  color: C.text,
                  margin: "0 0 6px",
                }}
              >
                {g.name}
              </h2>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: g.accent,
                  background: "white",
                  padding: "3px 10px",
                  borderRadius: "10px",
                }}
              >
                {g.type}
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {[
              { label: "이번 달 지출", value: g.spend, icon: "💸" },
              { label: "멤버", value: `${g.members}명`, icon: "👥" },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: "white",
                  borderRadius: "16px",
                  padding: "16px",
                  border: `1px solid ${C.border}`,
                }}
              >
                <p
                  style={{
                    fontSize: "12px",
                    color: C.sub,
                    fontWeight: 600,
                    margin: "0 0 6px",
                  }}
                >
                  {s.icon} {s.label}
                </p>
                <p
                  style={{ fontSize: "20px", fontWeight: 800, color: C.text, margin: 0 }}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          <div
            style={{
              background: "white",
              borderRadius: "18px",
              padding: "16px 18px",
              border: `1px solid ${C.border}`,
            }}
          >
            <p
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: C.text,
                margin: "0 0 14px",
              }}
            >
              👥 멤버 목록
            </p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {MEMBERS.slice(0, g.members).map((m) => (
                <div
                  key={m.name}
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      background: m.color,
                      borderRadius: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                    }}
                  >
                    {m.avatar}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: C.text,
                        margin: 0,
                      }}
                    >
                      {m.name}
                    </p>
                    <p style={{ fontSize: "12px", color: C.sub, margin: 0 }}>
                      {m.role}
                    </p>
                  </div>
                  {m.role === "관리자" && (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: C.mint,
                        background: C.mintLight,
                        padding: "3px 8px",
                        borderRadius: "8px",
                      }}
                    >
                      관리자
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              background: `linear-gradient(135deg, ${g.accent}12, ${g.accent}06)`,
              border: `2px dashed ${g.accent}55`,
              borderRadius: "18px",
              padding: "18px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}
            >
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: C.sub,
                  margin: 0,
                }}
              >
                초대 코드
              </p>
              <button
                style={{
                  background: g.accent + "20",
                  border: "none",
                  borderRadius: "8px",
                  padding: "5px 12px",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: g.accent,
                  cursor: "pointer",
                  ...F,
                }}
              >
                공유 🔗
              </button>
            </div>
            <p
              style={{
                fontSize: "28px",
                fontWeight: 800,
                color: C.text,
                margin: 0,
                letterSpacing: "5px",
                fontFamily: "'Courier New', monospace",
              }}
            >
              {g.code}
            </p>
          </div>
        </div>

        <BottomNav active="groups" />
      </div>
    );
  }

  return (
    <div
      style={{
        ...F,
        background: C.bg,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "18px 20px 14px",
          background: "white",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2
            style={{ fontSize: "20px", fontWeight: 800, color: C.text, margin: 0 }}
          >
            내 그룹
          </h2>
          <button
            style={{
              background: `linear-gradient(135deg, ${C.mint}, ${C.sky})`,
              border: "none",
              borderRadius: "12px",
              padding: "8px 14px",
              fontSize: "13px",
              fontWeight: 700,
              color: "white",
              cursor: "pointer",
              ...F,
            }}
          >
            + 새 그룹
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {GROUPS.map((g, i) => (
          <button
            key={g.name}
            onClick={() => setSel(i)}
            style={{
              width: "100%",
              background: "white",
              borderRadius: "20px",
              border: `1px solid ${C.border}`,
              padding: "16px",
              cursor: "pointer",
              textAlign: "left",
              boxShadow: "0 2px 10px rgba(45,42,62,0.06)",
              ...F,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  background: g.bg,
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "26px",
                  flexShrink: 0,
                }}
              >
                {g.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "5px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: C.text,
                      margin: 0,
                    }}
                  >
                    {g.name}
                  </p>
                  <p
                    style={{
                      fontSize: "15px",
                      fontWeight: 800,
                      color: C.text,
                      margin: 0,
                    }}
                  >
                    {g.spend}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: g.accent,
                      background: g.bg,
                      padding: "2px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    {g.type}
                  </span>
                  <span style={{ fontSize: "12px", color: C.sub }}>
                    멤버 {g.members}명
                  </span>
                </div>
              </div>
              <span style={{ color: C.sub, fontSize: "20px", fontWeight: 300 }}>›</span>
            </div>
          </button>
        ))}

        <button
          style={{
            width: "100%",
            background: `linear-gradient(135deg, ${C.lavenderLight}, ${C.mintLight})`,
            borderRadius: "20px",
            border: `2px dashed ${C.lavender}60`,
            padding: "16px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            ...F,
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              background: "white",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
            }}
          >
            🔗
          </div>
          <div style={{ textAlign: "left" }}>
            <p
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: C.text,
                margin: "0 0 2px",
              }}
            >
              초대 코드로 참여하기
            </p>
            <p style={{ fontSize: "12px", color: C.sub, margin: 0 }}>
              코드를 입력해서 기존 그룹에 참여하세요
            </p>
          </div>
        </button>
      </div>

      <BottomNav active="groups" />
    </div>
  );
}

// ── Screen 6: Expense Form ──────────────────────────────────────────

const CATS = [
  { emoji: "🍽️", label: "식비", color: C.peach, bg: C.peachLight },
  { emoji: "🚇", label: "교통", color: C.sky, bg: C.skyLight },
  { emoji: "☕", label: "카페", color: "#A8805A", bg: "#FFF4EC" },
  { emoji: "🛍️", label: "쇼핑", color: C.lavender, bg: C.lavenderLight },
  { emoji: "🏠", label: "생활", color: C.mint, bg: C.mintLight },
  { emoji: "🎮", label: "오락", color: C.green, bg: C.greenLight },
  { emoji: "💊", label: "의료", color: C.pink, bg: C.pinkLight },
  { emoji: "💰", label: "기타", color: C.yellow, bg: C.yellowLight },
];

function ExpenseFormScreen() {
  const [amount, setAmount] = useState("87,400");
  const [cat, setCat] = useState(0);
  const [memo, setMemo] = useState("이마트 장보기");
  const [shareGroup, setShareGroup] = useState(1);

  return (
    <div style={{ ...F, background: C.bg, minHeight: "100%" }}>
      <div
        style={{
          background: `linear-gradient(160deg, ${C.mintLight} 0%, white 100%)`,
          padding: "20px 24px 28px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: C.sub,
            margin: "0 0 8px",
          }}
        >
          지출 금액
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "center",
            gap: "4px",
          }}
        >
          <span style={{ fontSize: "26px", fontWeight: 700, color: C.sub }}>₩</span>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{
              fontSize: "46px",
              fontWeight: 800,
              color: C.text,
              border: "none",
              background: "transparent",
              width: "220px",
              textAlign: "center",
              outline: "none",
              letterSpacing: "-1px",
              ...F,
            }}
          />
        </div>
        <p style={{ fontSize: "12px", color: C.sub, margin: "6px 0 0", fontWeight: 500 }}>
          탭하여 금액을 수정하세요
        </p>
      </div>

      <div
        style={{
          padding: "20px 20px 36px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <Field label="카테고리">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
            {CATS.map((c, i) => (
              <button
                key={i}
                onClick={() => setCat(i)}
                style={{
                  padding: "11px 6px",
                  background: cat === i ? c.color : c.bg,
                  borderRadius: "14px",
                  border: `2px solid ${cat === i ? c.color : "transparent"}`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "5px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  boxShadow: cat === i ? `0 4px 12px ${c.color}55` : "none",
                  ...F,
                }}
              >
                <span style={{ fontSize: "22px", lineHeight: 1 }}>{c.emoji}</span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: cat === i ? "white" : C.text,
                  }}
                >
                  {c.label}
                </span>
              </button>
            ))}
          </div>
        </Field>

        <Field label="메모">
          <input
            type="text"
            placeholder="어디서 뭘 샀나요?"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 16px",
              background: "white",
              border: `2px solid ${C.border}`,
              borderRadius: "14px",
              fontSize: "15px",
              color: C.text,
              fontWeight: 500,
              boxSizing: "border-box",
              ...F,
            }}
          />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Field label="날짜">
            <div
              style={{
                padding: "12px 14px",
                background: "white",
                border: `2px solid ${C.border}`,
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: "16px" }}>📅</span>
              <span style={{ fontSize: "14px", fontWeight: 600, color: C.text }}>
                9월 7일
              </span>
            </div>
          </Field>
          <Field label="시간">
            <div
              style={{
                padding: "12px 14px",
                background: "white",
                border: `2px solid ${C.border}`,
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: "16px" }}>🕐</span>
              <span style={{ fontSize: "14px", fontWeight: 600, color: C.text }}>
                오후 3:24
              </span>
            </div>
          </Field>
        </div>

        <Field label="어느 그룹과 공유할까요?">
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              { label: "공유 안 함", sub: "나만 볼 수 있어요", icon: "🔒" },
              { label: "우리 가족 👨‍👩‍👧‍👦", sub: "멤버 4명이 볼 수 있어요", icon: "" },
              { label: "지은 & 도현 💕", sub: "멤버 2명이 볼 수 있어요", icon: "" },
            ].map((opt, i) => (
              <div
                key={i}
                onClick={() => setShareGroup(i)}
                style={{
                  padding: "14px 16px",
                  background: shareGroup === i ? C.mintLight : "white",
                  border: `2px solid ${shareGroup === i ? C.mint : C.border}`,
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    border: `2.5px solid ${shareGroup === i ? C.mint : C.border}`,
                    background: shareGroup === i ? C.mint : "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.15s",
                  }}
                >
                  {shareGroup === i && (
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "white",
                      }}
                    />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: C.text,
                      margin: "0 0 2px",
                    }}
                  >
                    {opt.label}
                  </p>
                  <p style={{ fontSize: "12px", color: C.sub, margin: 0 }}>{opt.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </Field>

        <PrimaryBtn>저장하기</PrimaryBtn>
      </div>
    </div>
  );
}

// ── Screen 7: Expense List ──────────────────────────────────────────

const EXPENSES = [
  {
    date: "9월 7일 (일)",
    items: [
      {
        name: "이마트 장보기",
        amount: "87,400",
        cat: "🍽️",
        catLabel: "식비",
        catBg: C.peachLight,
        badge: true,
      },
      {
        name: "카페 투썸플레이스",
        amount: "8,500",
        cat: "☕",
        catLabel: "카페",
        catBg: "#FFF4EC",
        badge: false,
      },
    ],
  },
  {
    date: "9월 6일 (토)",
    items: [
      {
        name: "배달의민족 저녁",
        amount: "34,000",
        cat: "🍽️",
        catLabel: "식비",
        catBg: C.peachLight,
        badge: false,
      },
    ],
  },
  {
    date: "9월 5일 (금)",
    items: [
      {
        name: "GS25 편의점",
        amount: "12,300",
        cat: "🛍️",
        catLabel: "쇼핑",
        catBg: C.lavenderLight,
        badge: true,
      },
      {
        name: "지하철 교통카드",
        amount: "50,000",
        cat: "🚇",
        catLabel: "교통",
        catBg: C.skyLight,
        badge: false,
      },
    ],
  },
  {
    date: "9월 3일 (수)",
    items: [
      {
        name: "CGV 영화 2인",
        amount: "22,000",
        cat: "🎮",
        catLabel: "오락",
        catBg: C.greenLight,
        badge: false,
      },
    ],
  },
];

function ExpenseListScreen() {
  return (
    <div
      style={{
        ...F,
        background: C.bg,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          background: "white",
          borderBottom: `1px solid ${C.border}`,
          padding: "16px 20px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "14px",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: 800,
                color: C.text,
                margin: "0 0 2px",
              }}
            >
              9월 지출
            </h2>
            <p style={{ fontSize: "12px", color: C.sub, margin: 0 }}>2026년</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px", color: C.sub, cursor: "pointer" }}>‹</span>
            <div
              style={{
                background: C.mintLight,
                borderRadius: "12px",
                padding: "6px 14px",
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: 700, color: C.mint }}>
                9월
              </span>
            </div>
            <span style={{ fontSize: "20px", color: C.sub, cursor: "pointer" }}>›</span>
          </div>
        </div>

        <div
          style={{
            background: `linear-gradient(135deg, ${C.mint}18, ${C.lavender}12)`,
            borderRadius: "16px",
            padding: "14px 16px",
            marginBottom: "14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: C.sub,
                margin: "0 0 4px",
              }}
            >
              이번 달 총 지출
            </p>
            <p
              style={{
                fontSize: "26px",
                fontWeight: 800,
                color: C.text,
                margin: 0,
                letterSpacing: "-0.5px",
              }}
            >
              ₩482,500
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: C.sub,
                margin: "0 0 4px",
              }}
            >
              항목 수
            </p>
            <p
              style={{ fontSize: "22px", fontWeight: 800, color: C.text, margin: 0 }}
            >
              14건
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            paddingBottom: "14px",
            overflowX: "auto",
          }}
        >
          {["전체", "식비", "교통", "카페", "쇼핑", "오락"].map((f, i) => (
            <button
              key={f}
              style={{
                padding: "6px 14px",
                background: i === 0 ? C.mint : "white",
                border: `2px solid ${i === 0 ? C.mint : C.border}`,
                borderRadius: "20px",
                flexShrink: 0,
                fontSize: "12px",
                fontWeight: 700,
                color: i === 0 ? "white" : C.sub,
                cursor: "pointer",
                ...F,
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        {EXPENSES.map((group) => (
          <div key={group.date}>
            <p
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: C.sub,
                margin: "0 0 8px",
                paddingLeft: "4px",
              }}
            >
              {group.date}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {group.items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    background: "white",
                    borderRadius: "16px",
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    border: item.badge
                      ? `2px solid ${C.peach}70`
                      : `1px solid ${C.border}`,
                    boxShadow: item.badge
                      ? `0 4px 14px ${C.peach}22`
                      : "0 2px 8px rgba(45,42,62,0.05)",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      background: item.catBg,
                      borderRadius: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "22px",
                      flexShrink: 0,
                    }}
                  >
                    {item.cat}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                        marginBottom: "3px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: C.text,
                          margin: 0,
                        }}
                      >
                        {item.name}
                      </p>
                      {item.badge && (
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            color: C.peach,
                            background: C.peachLight,
                            padding: "2px 7px",
                            borderRadius: "6px",
                            border: `1px solid ${C.peach}50`,
                            flexShrink: 0,
                          }}
                        >
                          확인 필요
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: "12px", color: C.sub, margin: 0 }}>
                      {item.catLabel}
                    </p>
                  </div>
                  <p
                    style={{
                      fontSize: "16px",
                      fontWeight: 800,
                      color: C.text,
                      margin: 0,
                      whiteSpace: "nowrap",
                    }}
                  >
                    ₩{item.amount}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <BottomNav active="home" />
    </div>
  );
}

// ── Screen 8: Receipt Camera ────────────────────────────────────────

type ReceiptState = "idle" | "scanning" | "done";

function ReceiptScreen() {
  const [state, setState] = useState<ReceiptState>("idle");

  const handleCapture = () => {
    setState("scanning");
    setTimeout(() => setState("done"), 2500);
  };

  return (
    <div
      style={{
        ...F,
        minHeight: "100%",
        background: "#0D0D1A",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              state === "scanning"
                ? "linear-gradient(160deg, #0A1810 0%, #0D1117 100%)"
                : "linear-gradient(160deg, #1A1A2E 0%, #0D0D1A 100%)",
            transition: "background 0.5s",
          }}
        />

        {/* Grid lines decoration */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.04 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: `${i * 11}%`,
                left: 0,
                right: 0,
                height: "1px",
                background: C.mint,
              }}
            />
          ))}
        </div>

        {/* Top bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            padding: "12px 18px",
            background:
              "linear-gradient(to bottom, rgba(13,13,26,0.85) 0%, transparent 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 10,
          }}
        >
          <button
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "none",
              borderRadius: "12px",
              padding: "8px 14px",
              color: "white",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              ...F,
            }}
          >
            닫기
          </button>
          <p
            style={{
              color: "white",
              fontSize: "15px",
              fontWeight: 700,
              margin: 0,
            }}
          >
            영수증 촬영
          </p>
          <button
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "none",
              borderRadius: "12px",
              padding: "8px 14px",
              color: "white",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              ...F,
            }}
          >
            ⚡
          </button>
        </div>

        {/* Corner guides */}
        {state !== "scanning" && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -55%)",
              width: "240px",
              height: "310px",
            }}
          >
            {/* top-left */}
            <div style={{ position: "absolute", top: 0, left: 0, width: "28px", height: "28px", borderTop: `3px solid ${C.mint}`, borderLeft: `3px solid ${C.mint}`, borderRadius: "4px 0 0 0" }} />
            {/* top-right */}
            <div style={{ position: "absolute", top: 0, right: 0, width: "28px", height: "28px", borderTop: `3px solid ${C.mint}`, borderRight: `3px solid ${C.mint}`, borderRadius: "0 4px 0 0" }} />
            {/* bottom-left */}
            <div style={{ position: "absolute", bottom: 0, left: 0, width: "28px", height: "28px", borderBottom: `3px solid ${C.mint}`, borderLeft: `3px solid ${C.mint}`, borderRadius: "0 0 0 4px" }} />
            {/* bottom-right */}
            <div style={{ position: "absolute", bottom: 0, right: 0, width: "28px", height: "28px", borderBottom: `3px solid ${C.mint}`, borderRight: `3px solid ${C.mint}`, borderRadius: "0 0 4px 0" }} />
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                color: "rgba(255,255,255,0.45)",
                fontSize: "13px",
                fontWeight: 600,
                lineHeight: "1.7",
              }}
            >
              영수증을 네모 안에
              <br />
              맞춰주세요
            </div>
          </div>
        )}

        {/* Scanning overlay */}
        {state === "scanning" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `${C.mint}12`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "20px",
              animation: "slide-up 0.3s ease",
            }}
          >
            <div
              style={{
                width: "68px",
                height: "68px",
                border: `4px solid ${C.mint}`,
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 0.9s linear infinite",
              }}
            />
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  color: "white",
                  fontSize: "18px",
                  fontWeight: 800,
                  margin: "0 0 8px",
                }}
              >
                영수증을 읽고 있어요...
              </p>
              <p
                style={{
                  color: "rgba(255,255,255,0.55)",
                  fontSize: "13px",
                  margin: 0,
                  lineHeight: "1.5",
                }}
              >
                AI가 금액과 항목을 분석 중이에요
              </p>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: "8px",
                    height: "8px",
                    background: C.mint,
                    borderRadius: "50%",
                    animation: `pulse-dot 1.4s ease ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Done toast */}
        {state === "done" && (
          <div
            style={{
              position: "absolute",
              bottom: "20px",
              left: "18px",
              right: "18px",
              background: `linear-gradient(135deg, ${C.mint}, ${C.sky})`,
              borderRadius: "18px",
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              boxShadow: `0 10px 28px rgba(111,197,186,0.5)`,
              animation: "slide-up 0.35s ease",
            }}
          >
            <span style={{ fontSize: "26px" }}>✅</span>
            <div>
              <p
                style={{
                  color: "white",
                  fontSize: "15px",
                  fontWeight: 800,
                  margin: "0 0 3px",
                }}
              >
                인식 완료!
              </p>
              <p
                style={{ color: "rgba(255,255,255,0.82)", fontSize: "13px", margin: 0 }}
              >
                ₩87,400 · 식비 · 이마트 장보기
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div
        style={{
          background: "#12121F",
          padding: "22px 24px 28px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {state === "idle" && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "36px",
              }}
            >
              <button
                style={{
                  width: "54px",
                  height: "54px",
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  cursor: "pointer",
                }}
              >
                🖼️
              </button>
              <button
                onClick={handleCapture}
                style={{
                  width: "72px",
                  height: "72px",
                  background: "white",
                  border: "4px solid rgba(255,255,255,0.25)",
                  borderRadius: "50%",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                }}
              >
                <div
                  style={{
                    width: "58px",
                    height: "58px",
                    background: `linear-gradient(135deg, ${C.mint}, ${C.sky})`,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "26px",
                  }}
                >
                  📷
                </div>
              </button>
              <button
                style={{
                  width: "54px",
                  height: "54px",
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  cursor: "pointer",
                }}
              >
                🔄
              </button>
            </div>
            <p
              style={{
                textAlign: "center",
                color: "rgba(255,255,255,0.4)",
                fontSize: "12px",
                margin: 0,
                fontWeight: 500,
              }}
            >
              📷 촬영하거나 🖼️ 갤러리에서 선택하세요
            </p>
          </>
        )}

        {state === "scanning" && (
          <p
            style={{
              textAlign: "center",
              color: "rgba(255,255,255,0.45)",
              fontSize: "13px",
              margin: "8px 0",
            }}
          >
            잠시만 기다려주세요...
          </p>
        )}

        {state === "done" && (
          <>
            <button
              onClick={() => setState("idle")}
              style={{
                width: "100%",
                padding: "16px",
                background: `linear-gradient(135deg, ${C.mint}, ${C.sky})`,
                border: "none",
                borderRadius: "16px",
                fontSize: "16px",
                fontWeight: 700,
                color: "white",
                cursor: "pointer",
                boxShadow: "0 8px 22px rgba(111,197,186,0.4)",
                ...F,
              }}
            >
              지출로 저장하기
            </button>
            <button
              onClick={() => setState("idle")}
              style={{
                width: "100%",
                padding: "13px",
                background: "rgba(255,255,255,0.08)",
                border: "2px solid rgba(255,255,255,0.15)",
                borderRadius: "16px",
                fontSize: "14px",
                fontWeight: 700,
                color: "rgba(255,255,255,0.65)",
                cursor: "pointer",
                ...F,
              }}
            >
              다시 촬영하기
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Screen 9: Group Feed ────────────────────────────────────────────

const FEED = [
  {
    avatar: "🐻",
    name: "김도현",
    time: "오늘 오후 3:24",
    amount: "87,400",
    cat: "🍽️",
    catLabel: "식비",
    catBg: C.peachLight,
    memo: "이마트 장보기",
    reacts: ["👍 2", "❤️ 1"],
  },
  {
    avatar: "🦊",
    name: "박지은",
    time: "오늘 오후 1:10",
    amount: "8,500",
    cat: "☕",
    catLabel: "카페",
    catBg: "#FFF4EC",
    memo: "투썸플레이스 아메리카노 2잔",
    reacts: ["☕ 3"],
  },
  {
    avatar: "🐻",
    name: "김도현",
    time: "어제 오후 7:45",
    amount: "34,000",
    cat: "🍽️",
    catLabel: "식비",
    catBg: C.peachLight,
    memo: "배달의민족 저녁 (치킨)",
    reacts: ["👍 1", "🍗 2"],
  },
  {
    avatar: "🦊",
    name: "박지은",
    time: "어제 오전 11:20",
    amount: "12,300",
    cat: "🛍️",
    catLabel: "쇼핑",
    catBg: C.lavenderLight,
    memo: "GS25 생활용품",
    reacts: [],
  },
  {
    avatar: "🐱",
    name: "김서연",
    time: "2일 전 오후 5:30",
    amount: "50,000",
    cat: "🚇",
    catLabel: "교통",
    catBg: C.skyLight,
    memo: "지하철 교통카드 충전",
    reacts: ["👍 1"],
  },
];

function FeedScreen() {
  const [group, setGroup] = useState(0);
  const [dropdown, setDropdown] = useState(false);
  const groupOptions = ["우리 가족 👨‍👩‍👧‍👦", "지은 & 도현 💕", "홍대 하우스 🏠"];

  return (
    <div
      style={{
        ...F,
        background: C.bg,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "16px 20px",
          borderBottom: `1px solid ${C.border}`,
          zIndex: 10,
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          <h2
            style={{ fontSize: "20px", fontWeight: 800, color: C.text, margin: 0 }}
          >
            그룹 피드
          </h2>
          <span
            style={{
              fontSize: "20px",
              cursor: "pointer",
              position: "relative",
            }}
          >
            🔔
            <span
              style={{
                position: "absolute",
                top: "-2px",
                right: "-2px",
                width: "8px",
                height: "8px",
                background: C.peach,
                borderRadius: "50%",
                border: "2px solid white",
              }}
            />
          </span>
        </div>

        <div style={{ position: "relative" }}>
          <button
            onClick={() => setDropdown(!dropdown)}
            style={{
              width: "100%",
              padding: "11px 16px",
              background: C.mintLight,
              border: `2px solid ${C.mint}60`,
              borderRadius: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              ...F,
            }}
          >
            <span style={{ fontSize: "14px", fontWeight: 700, color: C.text }}>
              {groupOptions[group]}
            </span>
            <span style={{ fontSize: "13px", color: C.sub }}>
              {dropdown ? "▲" : "▼"}
            </span>
          </button>

          {dropdown && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                right: 0,
                background: "white",
                borderRadius: "14px",
                border: `2px solid ${C.border}`,
                boxShadow: "0 10px 28px rgba(45,42,62,0.15)",
                overflow: "hidden",
                zIndex: 100,
              }}
            >
              {groupOptions.map((g, i) => (
                <button
                  key={g}
                  onClick={() => {
                    setGroup(i);
                    setDropdown(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "13px 16px",
                    background: i === group ? C.mintLight : "transparent",
                    border: "none",
                    borderBottom:
                      i < groupOptions.length - 1 ? `1px solid ${C.border}` : "none",
                    textAlign: "left",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: i === group ? 700 : 500,
                    color: i === group ? C.mint : C.text,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    ...F,
                  }}
                >
                  {i === group && (
                    <span style={{ fontSize: "12px", color: C.mint }}>✓</span>
                  )}
                  {g}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {FEED.map((item, i) => (
          <div
            key={i}
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "16px",
              border: `1px solid ${C.border}`,
              boxShadow: "0 2px 10px rgba(45,42,62,0.06)",
            }}
          >
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  background: item.catBg,
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  flexShrink: 0,
                }}
              >
                {item.avatar}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: "5px",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: C.text,
                      }}
                    >
                      {item.name}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: C.sub,
                        marginLeft: "6px",
                      }}
                    >
                      {item.time}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: 800,
                      color: C.text,
                      flexShrink: 0,
                    }}
                  >
                    ₩{item.amount}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      background: item.catBg,
                      borderRadius: "8px",
                      padding: "3px 9px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: C.text,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {item.cat} {item.catLabel}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "13px",
                    color: C.sub,
                    margin: "6px 0 0",
                    lineHeight: "1.5",
                  }}
                >
                  {item.memo}
                </p>
              </div>
            </div>

            <div
              style={{
                marginTop: "12px",
                paddingTop: "10px",
                borderTop: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {item.reacts.map((r) => (
                <button
                  key={r}
                  style={{
                    background: C.bg,
                    border: "none",
                    borderRadius: "10px",
                    padding: "4px 10px",
                    fontSize: "13px",
                    cursor: "pointer",
                    color: C.sub,
                    fontWeight: 600,
                    ...F,
                  }}
                >
                  {r}
                </button>
              ))}
              {["👍", "❤️", "😲"].map((e) => (
                <button
                  key={e}
                  style={{
                    background: "none",
                    border: `1px solid ${C.border}`,
                    borderRadius: "8px",
                    padding: "3px 8px",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  {e}
                </button>
              ))}
              <button
                style={{
                  marginLeft: "auto",
                  background: "none",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: C.sub,
                  cursor: "pointer",
                  ...F,
                }}
              >
                댓글 달기
              </button>
            </div>
          </div>
        ))}
      </div>

      <BottomNav active="feed" />
    </div>
  );
}

// ── Phone Frame ─────────────────────────────────────────────────────

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "390px",
        height: "812px",
        background: C.bg,
        borderRadius: "52px",
        boxShadow:
          "0 36px 80px rgba(45,42,62,0.22), 0 8px 24px rgba(45,42,62,0.12), inset 0 0 0 1px rgba(255,255,255,0.12)",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        border: "10px solid #1C1C1E",
        flexShrink: 0,
      }}
    >
      {/* Side buttons */}
      <div
        style={{
          position: "absolute",
          right: "-12px",
          top: "140px",
          width: "4px",
          height: "72px",
          background: "#2C2C2E",
          borderRadius: "0 2px 2px 0",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "-12px",
          top: "108px",
          width: "4px",
          height: "32px",
          background: "#2C2C2E",
          borderRadius: "2px 0 0 2px",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "-12px",
          top: "152px",
          width: "4px",
          height: "64px",
          background: "#2C2C2E",
          borderRadius: "2px 0 0 2px",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "-12px",
          top: "228px",
          width: "4px",
          height: "64px",
          background: "#2C2C2E",
          borderRadius: "2px 0 0 2px",
        }}
      />

      <StatusBar />
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {children}
      </div>
      <div
        style={{
          height: "26px",
          background: C.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "134px",
            height: "5px",
            background: "#2D2A3E",
            borderRadius: "3px",
            opacity: 0.18,
          }}
        />
      </div>
    </div>
  );
}

// ── App ─────────────────────────────────────────────────────────────

const SCREENS = [
  { id: "signup", label: "회원가입", num: "1" },
  { id: "login", label: "로그인", num: "2" },
  { id: "onboarding", label: "그룹 생성", num: "3" },
  { id: "join", label: "그룹 참여", num: "4" },
  { id: "groups", label: "그룹 목록", num: "5" },
  { id: "expense-form", label: "지출 입력", num: "6" },
  { id: "expense-list", label: "지출 목록", num: "7" },
  { id: "receipt", label: "영수증", num: "8" },
  { id: "feed", label: "그룹 피드", num: "9" },
];

function renderScreen(id: string) {
  switch (id) {
    case "signup": return <SignUpScreen />;
    case "login": return <LoginScreen />;
    case "onboarding": return <OnboardingScreen />;
    case "join": return <JoinGroupScreen />;
    case "groups": return <GroupsScreen />;
    case "expense-form": return <ExpenseFormScreen />;
    case "expense-list": return <ExpenseListScreen />;
    case "receipt": return <ReceiptScreen />;
    case "feed": return <FeedScreen />;
    default: return null;
  }
}

export default function App() {
  const [current, setCurrent] = useState(0);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #EEF0FF 0%, #E8F9F7 45%, #FFF2EC 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "28px 16px 48px",
        gap: "22px",
        ...F,
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "6px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              background: `linear-gradient(135deg, ${C.mint}, ${C.sky})`,
              borderRadius: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              boxShadow: `0 6px 16px rgba(111,197,186,0.35)`,
            }}
          >
            💰
          </div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 800,
              color: C.text,
              margin: 0,
              letterSpacing: "-0.5px",
            }}
          >
            우리끼리 가계부
          </h1>
        </div>
        <p style={{ fontSize: "13px", color: C.sub, margin: 0, fontWeight: 500 }}>
          9개 화면 UI 프로토타입 · 화면을 선택해 탐색하세요
        </p>
      </div>

      {/* Screen tabs */}
      <div
        style={{
          display: "flex",
          gap: "7px",
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: "480px",
        }}
      >
        {SCREENS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setCurrent(i)}
            style={{
              padding: "8px 14px",
              background: i === current ? C.mint : "white",
              border: `2px solid ${i === current ? C.mint : C.border}`,
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: 700,
              color: i === current ? "white" : C.sub,
              cursor: "pointer",
              transition: "all 0.18s",
              boxShadow:
                i === current
                  ? `0 4px 14px rgba(111,197,186,0.45)`
                  : "0 2px 6px rgba(45,42,62,0.06)",
              ...F,
            }}
          >
            {s.num} {s.label}
          </button>
        ))}
      </div>

      {/* Phone + nav */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "18px",
        }}
      >
        <button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          style={{
            width: "44px",
            height: "44px",
            background: current === 0 ? "#F0EFF8" : "white",
            border: `2px solid ${current === 0 ? C.border : C.mint}`,
            borderRadius: "50%",
            fontSize: "20px",
            cursor: current === 0 ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: current === 0 ? "#C4C0D4" : C.mint,
            boxShadow:
              current === 0 ? "none" : "0 4px 12px rgba(111,197,186,0.3)",
            transition: "all 0.18s",
            flexShrink: 0,
          }}
        >
          ‹
        </button>

        <PhoneFrame key={current}>
          {renderScreen(SCREENS[current].id)}
        </PhoneFrame>

        <button
          onClick={() =>
            setCurrent((c) => Math.min(SCREENS.length - 1, c + 1))
          }
          disabled={current === SCREENS.length - 1}
          style={{
            width: "44px",
            height: "44px",
            background: current === SCREENS.length - 1 ? "#F0EFF8" : "white",
            border: `2px solid ${
              current === SCREENS.length - 1 ? C.border : C.mint
            }`,
            borderRadius: "50%",
            fontSize: "20px",
            cursor: current === SCREENS.length - 1 ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: current === SCREENS.length - 1 ? "#C4C0D4" : C.mint,
            boxShadow:
              current === SCREENS.length - 1
                ? "none"
                : "0 4px 12px rgba(111,197,186,0.3)",
            transition: "all 0.18s",
            flexShrink: 0,
          }}
        >
          ›
        </button>
      </div>

      {/* Dot indicator */}
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        {SCREENS.map((_, i) => (
          <div
            key={i}
            onClick={() => setCurrent(i)}
            style={{
              width: i === current ? "22px" : "7px",
              height: "7px",
              background: i === current ? C.mint : "#C4C0D4",
              borderRadius: "4px",
              transition: "all 0.3s",
              cursor: "pointer",
            }}
          />
        ))}
      </div>
    </div>
  );
}
