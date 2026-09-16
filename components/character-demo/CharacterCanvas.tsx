"use client";
// components/character-demo/CharacterCanvas.tsx — 원본 PNG + 부위별 Pixel Mask + 사용자 색상을
// 합쳐 캔버스에 그린다. 원본 PNG 파일은 읽기만 하고 수정하지 않는다.
//
// 그리는 순서:
//   1) 원본 PNG를 그대로 캔버스에 올린다.
//   2) 이 Stage에 존재하는 부위(stageCustomization)의 마스크를 하나씩 읽어, 마스크가 가리키는
//      픽셀만 사용자 색으로 바꾼다(밝기는 원본 유지 → 그림자·하이라이트가 살아있다).
//   3) 캐릭터 영역(stageImageCrop)만 잘라서 화면에 보여준다 — 원본에 박혀 있는 "Stage N" 라벨과
//      옆 캐릭터가 잘려 들어온 자국을 가리기 위해서다.
// 코인은 어떤 마스크에도 없으므로 어떤 색을 골라도 금색 그대로 남는다.
import { useEffect, useRef, useState } from "react";
import {
  cheekMaskPath,
  grooveMaskPath,
  maskPath,
  stageCustomization,
  stageHasCheek,
  stageHasGroove,
  stageImageCrop,
  stageImageSizes,
  stageImages,
  type CharacterStage,
  type ColorPart,
} from "@/lib/characterStages";
import { applyMaskColor, intensifyCheek, paintPureWhite } from "@/lib/recolor";
import styles from "./characterDemo.module.css";

/** 이미지를 ImageData로 한 번만 읽어두고 재사용한다(색을 바꿀 때마다 다시 디코딩하지 않도록). */
const imageDataCache = new Map<string, ImageData>();

async function loadImageData(src: string, width: number, height: number): Promise<ImageData> {
  const cached = imageDataCache.get(src);
  if (cached) return cached;

  const img = new Image();
  img.src = src;
  await img.decode();

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2D 캔버스를 만들 수 없습니다");
  ctx.drawImage(img, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height);
  imageDataCache.set(src, data);
  return data;
}

export default function CharacterCanvas({
  stage,
  colors,
  height,
  className,
}: {
  stage: CharacterStage;
  colors: Record<ColorPart, string>;
  /** 화면에 보여줄 높이(px). 너비는 크롭 영역 비율에 맞춰 자동. */
  height: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  const size = stageImageSizes[stage];
  const crop = stageImageCrop[stage];
  const displayWidth = Math.round(height * (crop.width / crop.height));

  // colors를 문자열로 만들어 의존성으로 쓴다(객체 참조가 매번 바뀌어도 값이 같으면 다시 안 그리게).
  const parts = stageCustomization[stage];
  const colorKey = parts.map((p) => `${p}:${colors[p]}`).join(",");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const base = await loadImageData(stageImages[stage], size.width, size.height);
        // 캐시본을 직접 고치면 안 되므로 복사본에 색을 입힌다.
        const working = new ImageData(new Uint8ClampedArray(base.data), size.width, size.height);

        for (const part of parts) {
          const mask = await loadImageData(maskPath(stage, part), size.width, size.height);
          applyMaskColor(working.data, mask.data, colors[part]);
        }

        // 볼터치는 색을 바꾸지 않고 진하기만 올린다 — 원본에서 눈 쪽으로 갈수록 흰색에 묻혀
        // 반투명하게 비쳐 보이기 때문이다. 부위 색을 다 입힌 뒤에 적용해야 몸 색 위로 또렷하게 얹힌다.
        if (stageHasCheek[stage]) {
          const cheek = await loadImageData(cheekMaskPath(stage), size.width, size.height);
          intensifyCheek(working.data, cheek.data);
        }

        // 가계부 안쪽 밝은 홈은 어떤 색을 골라도 순백색으로 고정한다.
        if (stageHasGroove[stage]) {
          const groove = await loadImageData(grooveMaskPath(stage), size.width, size.height);
          paintPureWhite(working.data, groove.data);
        }
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = crop.width;
        canvas.height = crop.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // 완성된 이미지를 임시 캔버스에 올린 뒤, 캐릭터 영역만 잘라 옮긴다.
        const full = document.createElement("canvas");
        full.width = size.width;
        full.height = size.height;
        full.getContext("2d")?.putImageData(working, 0, 0);

        ctx.clearRect(0, 0, crop.width, crop.height);
        ctx.drawImage(full, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [stage, colorKey, parts, colors, size.width, size.height, crop.x, crop.y, crop.width, crop.height]);

  if (failed) {
    return (
      <div className={styles.canvasError} style={{ width: displayWidth, height }}>
        캐릭터 이미지를 불러오지 못했어요
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={[styles.characterCanvas, className].filter(Boolean).join(" ")}
      style={{ width: displayWidth, height }}
      role="img"
      aria-label="내 캐릭터"
    />
  );
}
