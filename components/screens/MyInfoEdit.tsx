"use client";
// components/screens/MyInfoEdit.tsx — 10b. 내 정보 변경(디자인 파일 없음, 2026-09-17 팀 요청으로 신규 추가).
// 마이페이지(10)의 프로필 카드를 누르면 열린다 — 프로필 사진·닉네임(profiles.name)·이메일·비밀번호를 바꾼다.
//
// 06-data.md E1: profiles 테이블엔 name만 있고 사진(avatar)·이메일 컬럼이 없다 — 이 화면의 프로필 사진·
// 이메일·비밀번호는 전부 email·password와 같은 방식으로 세션 흉내용 상태일 뿐이고, 사진은 실제로
// Supabase Storage에 올리지 않는다(파일을 브라우저에서 읽은 data URL을 그대로 들고 있는다).
import { useRef, useState } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import { initialOf } from "@/lib/format";
import { CameraIcon, ChevronLeftIcon } from "../icons";

// 1(회원가입)의 이메일 형식 검증과 동일한 패턴 — "무언가@무언가.무언가" 정도의 단순 형식 체크다.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function MyInfoEdit() {
  const nav = useNav();
  const store = useStore();
  const me = store.profiles.find((p) => p.id === store.currentUserId);
  const [nickname, setNickname] = useState(me?.name ?? "");
  const [email, setEmail] = useState(store.currentUserEmail);
  // 비밀번호는 비워두면 그대로 유지된다 — 바꾸고 싶을 때만 새로 입력하면 된다.
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  // 2026-09-18 추가: 실제 supabase.auth.updateUser 호출이 실패할 수 있어(비밀번호 6자 미만 등) 저장
  // 버튼 자체의 오류도 따로 보여준다.
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function handlePickPhoto() {
    fileInputRef.current?.click();
  }

  function handlePhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") store.updateCurrentUserAvatar(reader.result);
    };
    reader.readAsDataURL(file);
    // 같은 파일을 다시 골라도 onChange가 또 발생하도록 값을 비워둔다.
    e.target.value = "";
  }

  async function handleSave() {
    if (saving) return;
    if (!EMAIL_PATTERN.test(email.trim())) {
      setEmailError("이메일 형식이 올바르지 않아요");
      return;
    }
    setSaveError(null);
    setSaving(true);
    await store.updateCurrentUserName(nickname);
    // 이메일·비밀번호는 실제 supabase.auth.updateUser 호출이라 실패할 수 있다(예: 비밀번호 6자 미만,
    // 이미 쓰이는 이메일). 하나라도 실패하면 저장을 멈추고 오류를 보여준다 — 닉네임은 이미 반영됐다.
    const emailResult = await store.updateCurrentUserEmail(email);
    if (!emailResult.ok) {
      setSaving(false);
      setSaveError(emailResult.error ?? "이메일 변경에 실패했어요");
      return;
    }
    // 빈 값이면 store.updateCurrentUserPassword가 그대로 무시한다(기존 비밀번호 유지).
    const passwordResult = await store.updateCurrentUserPassword(password);
    setSaving(false);
    if (!passwordResult.ok) {
      setSaveError(passwordResult.error ?? "비밀번호 변경에 실패했어요");
      return;
    }
    // 2c "지출 기록 시 확인 알림"에서 만든 전역 토스트를 그대로 재사용한다.
    store.showToast("내 정보가 저장됐어요");
    nav.back();
  }

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", background: "var(--shoot-bg)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 20px 12px", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
        <div onClick={() => nav.back()} style={{ cursor: "pointer", display: "flex" }}>
          <ChevronLeftIcon size={18} color="var(--shoot-text)" />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--shoot-text)" }}>내 정보 변경</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px 20px 24px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 10 }}>
          <div style={{ position: "relative", width: 84, height: 84 }}>
            {store.currentUserAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- data URL은 next/image의 원격 최적화 대상이 아니다.
              <img
                src={store.currentUserAvatarUrl}
                alt="프로필 사진"
                style={{ width: 84, height: 84, borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <div style={{ width: 84, height: 84, borderRadius: "50%", background: "var(--shoot-surface-alt)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: "var(--shoot-accent)" }}>
                {initialOf(me?.name ?? "")}
              </div>
            )}
            <div
              onClick={handlePickPhoto}
              style={{ position: "absolute", bottom: 0, right: 0, width: 30, height: 30, borderRadius: "50%", background: "var(--shoot-accent)", border: "2px solid var(--shoot-bg)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <CameraIcon size={14} color="#fff" />
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelected} style={{ display: "none" }} />
          </div>
          {store.currentUserAvatarUrl && (
            <div onClick={() => store.updateCurrentUserAvatar(null)} style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: "#B23B3B", cursor: "pointer" }}>
              사진 삭제
            </div>
          )}
        </div>

        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--shoot-text)", marginBottom: 8 }}>닉네임</div>
          <input
            type="text"
            placeholder="닉네임을 입력해주세요"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", height: 48, borderRadius: 14, border: "2px solid var(--shoot-border)", background: "var(--shoot-surface)", padding: "0 16px", fontSize: 14, fontWeight: 600, color: "var(--shoot-text)" }}
          />
        </div>

        {/* 2026-09-17 팀 요청: "개인정보변경"(이메일·비밀번호 변경)도 필요 — 같은 화면에 이어서 둔다. */}
        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--shoot-text-muted)", margin: "22px 0 8px" }}>계정 정보</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--shoot-text)", marginBottom: 8 }}>이메일</div>
          <input
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(null);
            }}
            style={{ width: "100%", boxSizing: "border-box", height: 48, borderRadius: 14, border: `2px solid ${emailError ? "#E8B4B4" : "var(--shoot-border)"}`, background: "var(--shoot-surface)", padding: "0 16px", fontSize: 14, fontWeight: 600, color: "var(--shoot-text)" }}
          />
          {emailError && <div style={{ fontSize: 12, fontWeight: 700, color: "#B23B3B", marginTop: 6 }}>{emailError}</div>}
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--shoot-text)", marginBottom: 8 }}>비밀번호</div>
          <input
            type="password"
            placeholder="바꾸려면 새 비밀번호 입력(안 바꾸면 비워두세요)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", height: 48, borderRadius: 14, border: "2px solid var(--shoot-border)", background: "var(--shoot-surface)", padding: "0 16px", fontSize: 14, fontWeight: 600, color: "var(--shoot-text)" }}
          />
        </div>

        {saveError && <div style={{ fontSize: 12, fontWeight: 700, color: "#B23B3B", marginTop: 14, textAlign: "center" }}>{saveError}</div>}
        <div style={{ flex: 1 }} />
        <div
          onClick={handleSave}
          style={{ height: 50, borderRadius: 16, background: "linear-gradient(135deg,#E3DFFB 0%,#BDB2F2 100%)", color: "#3F3480", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, boxShadow: "0 8px 18px rgba(106,94,207,0.3)", cursor: "pointer", opacity: saving ? 0.6 : 1 }}
        >
          저장하기
        </div>
      </div>
    </div>
  );
}
