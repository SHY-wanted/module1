// lib/image.ts — 영수증 사진을 DB(expenses.image_url, text 컬럼)에 data URL로 직접 저장하기 전에
// 축소·압축한다. 아바타(lib/store.tsx updateCurrentUserAvatar)는 Storage 버킷 없이 원본 data URL을
// 그대로 저장하는 패턴을 쓰지만, 휴대폰 카메라로 찍은 영수증 사진은 수 MB까지 커질 수 있어 같은 방식을
// 그대로 쓰면 행 하나가 지나치게 커진다 — 그래서 이 경로에서만 canvas로 한 번 줄인다.
export async function fileToCompressedDataUrl(file: File, maxDim = 1280, quality = 0.72): Promise<string> {
  const original = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("이미지를 읽지 못했어요"));
    img.src = URL.createObjectURL(file);
  });

  const scale = Math.min(1, maxDim / Math.max(original.width, original.height));
  const width = Math.round(original.width * scale);
  const height = Math.round(original.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("캔버스를 만들지 못했어요");
  ctx.drawImage(original, 0, 0, width, height);
  URL.revokeObjectURL(original.src);

  return canvas.toDataURL("image/jpeg", quality);
}
