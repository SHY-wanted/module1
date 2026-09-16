"use client";
// components/character-demo/StageImage.tsx — 단계별 원본 PNG를 "캐릭터 부분만" 잘라서 보여주는
// 공통 컴포넌트. 원본 PNG 파일은 전혀 수정하지 않고, CSS로 프레임을 씌워 보이는 영역만 제한한다
// (파일에 박혀 있는 "Stage N" 라벨 배지와 오른쪽 가장자리의 옆 캐릭터 자국을 가리기 위함).
//
// 크롭 좌표는 lib/characterStages.ts의 stageImageCrop에 있다. 나중에 Pixel Mask + Canvas로 색상
// 커스터마이징을 붙일 때도 같은 좌표계를 쓰면 되므로, 크롭 로직을 이 한 곳에만 둔다.
import Image from "next/image";
import {
  stageImageCrop,
  stageImageSizes,
  stageImages,
  type CharacterStage,
} from "@/lib/characterStages";
import styles from "./characterDemo.module.css";

export default function StageImage({
  stage,
  height,
  alt,
  priority = false,
  imageClassName,
}: {
  stage: CharacterStage;
  /** 프레임 높이(px). 크롭 영역 비율에 맞춰 너비는 자동으로 정해진다. */
  height: number;
  alt: string;
  priority?: boolean;
  imageClassName?: string;
}) {
  const size = stageImageSizes[stage];
  const crop = stageImageCrop[stage];

  return (
    <div
      className={styles.cropFrame}
      style={{ height, width: height * (crop.width / crop.height) }}
    >
      <Image
        src={stageImages[stage]}
        alt={alt}
        width={size.width}
        height={size.height}
        priority={priority}
        className={[styles.cropImage, imageClassName].filter(Boolean).join(" ")}
        // 크롭 영역이 프레임을 정확히 채우도록 원본을 확대·이동시킨다.
        style={{
          width: `${(size.width / crop.width) * 100}%`,
          height: `${(size.height / crop.height) * 100}%`,
          left: `${-(crop.x / crop.width) * 100}%`,
          top: `${-(crop.y / crop.height) * 100}%`,
        }}
      />
    </div>
  );
}
