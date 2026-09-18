"use client";
// components/screens/ReceiptCapture.tsx — 8a. 영수증 촬영(design/shoot/ReceiptCapture.dc.html)
// 2026-09-17: 기기 카메라 앱을 대신 여는 방식(<input capture>)에서, 디자인의 뷰파인더 프레임 안에
// 실시간 카메라 영상을 직접 띄우는 방식(getUserMedia)으로 바꿨다(사용자 재확인 — 일반 카메라 앱이
// 뜨는 게 아니라 이 틀 안에서 카메라가 보여야 한다고 요청). 셔터를 누르면 현재 영상 프레임을 캔버스로
// 캡처해 파일로 만들고, store.pendingReceiptImage에 담아 8b(OCR 인식)로 넘긴다. 전/후면 카메라 전환
// 버튼(Lucide "switch-camera" 아이콘)도 추가했다. 갤러리는 기존처럼 일반 파일 선택기를 그대로 쓴다.
import { useEffect, useRef, useState } from "react";
import { useNav } from "../NavContext";
import { useStore } from "@/lib/store";
import { CameraIcon, ChevronLeftIcon, ImageIcon, SwitchCameraIcon } from "../icons";

type FacingMode = "environment" | "user";

export default function ReceiptCapture() {
  const nav = useNav();
  const store = useStore();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);

  // facingMode가 바뀔 때마다(전/후면 전환) 이전 스트림을 끄고 새로 연다.
  useEffect(() => {
    let active = true;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: false });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraError(null);
      } catch {
        if (active) setCameraError("카메라를 사용할 수 없어요. 갤러리에서 사진을 선택해주세요");
      }
    }

    startCamera();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [facingMode]);

  function handleGalleryPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // 같은 파일을 다시 골랐을 때도 onChange가 또 뜨도록 초기화.
    if (!file) return;
    store.setPendingReceiptImage(file);
    nav.push({ id: "receiptProcessing" });
  }

  function handleCapture() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return; // 아직 스트림이 준비 안 됐으면 무시.
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        store.setPendingReceiptImage(new File([blob], "receipt.jpg", { type: "image/jpeg" }));
        nav.push({ id: "receiptProcessing" });
      },
      "image/jpeg",
      0.92
    );
  }

  function toggleFacingMode() {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }

  return (
    <div style={{ height: "100%", width: "100%", boxSizing: "border-box", padding: "20px 18px 24px", background: "#0D0D1A", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: "100%", display: "flex", alignItems: "center", marginBottom: 14 }}>
        <div
          onClick={() => nav.back()}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <ChevronLeftIcon size={18} color="#fff" />
        </div>
      </div>
      <div style={{ width: "100%", flex: 1, borderRadius: 20, border: "2px dashed #8574EB80", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", background: "#000" }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            // 전면 카메라는 좌우 반전해 실제로 보는 것처럼(셀피 거울 모드) — 후면은 그대로.
            transform: facingMode === "user" ? "scaleX(-1)" : "none",
          }}
        />
        {!cameraError && (
          <div style={{ position: "absolute", bottom: 12, fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: 600, textAlign: "center", pointerEvents: "none" }}>
            영수증을 네모 안에 맞춰주세요
          </div>
        )}
        {cameraError && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 600, background: "rgba(0,0,0,0.55)" }}>
            {cameraError}
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 28, marginTop: 20 }}>
        {/* 갤러리에서 이미 찍어둔 영수증 사진을 고른다(capture 속성 없음 — 일반 사진 선택기). */}
        <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleGalleryPicked} style={{ display: "none" }} />
        <div
          onClick={() => galleryInputRef.current?.click()}
          style={{ width: 46, height: 46, borderRadius: 14, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <ImageIcon size={20} color="rgba(255,255,255,0.85)" />
        </div>
        <div
          onClick={handleCapture}
          style={{ width: 66, height: 66, borderRadius: "50%", background: "var(--shoot-surface)", border: "4px solid rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <div style={{ width: 52, height: 52, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#3F3480" }}>
            <CameraIcon size={22} color="#fff" />
          </div>
        </div>
        {/* 전/후면 카메라 전환(신규) — 셔터 버튼 바로 옆. */}
        <div
          onClick={toggleFacingMode}
          style={{ width: 46, height: 46, borderRadius: 14, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <SwitchCameraIcon size={20} color="rgba(255,255,255,0.85)" />
        </div>
      </div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 14, fontWeight: 600 }}>촬영하거나 갤러리에서 선택하세요</div>
    </div>
  );
}
