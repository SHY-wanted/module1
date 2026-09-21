"use client";
// components/ImageLightbox.tsx — 영수증 원본 이미지를 확대해서 다시 볼 수 있는 전체화면 오버레이.
// PetFeedPopup.tsx와 같은 오버레이 패턴(position: absolute, inset: 0)을 그대로 따른다.
export default function ImageLightbox({ url, onClose }: { url: string | null; onClose: () => void }) {
  if (!url) return null;
  return (
    <div
      onClick={onClose}
      style={{ position: "absolute", inset: 0, background: "rgba(13,13,26,0.92)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, zIndex: 40 }}
    >
      <div
        onClick={onClose}
        style={{ position: "absolute", top: 20, right: 20, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.12)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, cursor: "pointer" }}
      >
        ✕
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- data URL은 next/image의 원격 최적화 대상이 아니다. */}
      <img
        src={url}
        alt="영수증 원본"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 12, objectFit: "contain" }}
      />
    </div>
  );
}
