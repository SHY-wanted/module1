// app/character-demo/page.tsx — 성장형 캐릭터 데모 라우트(/character-demo).
// 스펙 원문의 main.tsx(마운트 지점) 자리. 기존 ShooT 앱(app/page.tsx의 StoreProvider + AppShell)과는
// 완전히 분리된 독립 페이지라, 실제 저금통 펫 시스템(XP·Supabase·그룹 펫)에는 아무 영향이 없다.
import type { Metadata } from "next";
import CharacterDemoClient from "@/components/character-demo/CharacterDemoClient";

export const metadata: Metadata = {
  title: "성장형 캐릭터 데모",
};

export default function CharacterDemoPage() {
  return <CharacterDemoClient />;
}
