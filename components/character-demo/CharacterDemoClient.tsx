"use client";
// components/character-demo/CharacterDemoClient.tsx — CharacterDemo를 브라우저에서만 렌더링하기
// 위한 얇은 래퍼. localStorage에 저장된 성장 상태를 "첫 렌더부터" 그대로 보여주려면 서버 렌더링을
// 꺼야 한다(서버엔 localStorage가 없어서 항상 Stage 0으로 그려지고, 그 HTML과 브라우저 상태가
// 어긋나면 하이드레이션 불일치가 난다). ssr:false는 Client Component에서만 쓸 수 있어 파일을 나눴다.
import dynamic from "next/dynamic";
import styles from "./characterDemo.module.css";

const CharacterDemo = dynamic(() => import("./CharacterDemo"), {
  ssr: false,
  loading: () => <div className={styles.page} aria-hidden="true" />,
});

export default function CharacterDemoClient() {
  return <CharacterDemo />;
}
