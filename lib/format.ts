// lib/format.ts — 화면 여러 곳에서 반복되는 표시용 포맷 헬퍼
import { TODAY_DATE } from "./mock";

export function formatWon(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원";
}

export function formatSignedWon(amount: number, isPositive: boolean): string {
  return (isPositive ? "+" : "-") + amount.toLocaleString("ko-KR") + "원";
}

// "date"(YYYY-MM-DD) 하나만 있을 때 월별 그룹 라벨("2026년 9월")
export function monthLabel(dateStr: string): string {
  const [y, m] = dateStr.split("-");
  return `${y}년 ${parseInt(m, 10)}월`;
}

// created_at(timestamptz)을 "오늘 08:32" / "어제" / "9월 6일" 형태로 — TODAY_DATE는 실제 오늘 날짜(KST, lib/mock.ts 참고).
export function formatRelativeTime(createdAt: string): string {
  const d = new Date(createdAt);
  const day = createdAt.slice(0, 10);
  const today = new Date(TODAY_DATE + "T00:00:00+09:00");
  const target = new Date(day + "T00:00:00+09:00");
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86400000);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  if (diffDays === 0) return `오늘 ${hh}:${mm}`;
  if (diffDays === 1) return `어제 ${hh}:${mm}`;
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export function formatFullDateKorean(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map((v) => parseInt(v, 10));
  return `${y}년 ${m}월 ${d}일`;
}

// Home(2b)·MyPage(10)·GroupDetail(5b)에서 공통으로 쓰는 "성 뗀 이름" 로직.
// 2026-09-19: 이 필드는 실제 "성+이름"이 아니라 자유 형식 닉네임이다(profiles.name — 마이페이지
// "10b 내 정보 변경"에서 사용자가 직접 정한다, docs/07-screens.md:127). 예전엔 design/shoot의
// Home.dc.html·MyPage.dc.html을 그대로 옮긴 stripSurname()으로 첫 글자를 "성"으로 보고 뗐는데,
// "포도"처럼 성이 없는 닉네임을 넣으면 "포"가 성인 줄 알고 떼어내 "도"만 남았다(사용자 신고).
// docs/07-screens.md:43의 팀 결정도 "1(회원가입)에서 받은 이름이... 그대로 표시된다"라고 못박고
// 있어서, 애초에 성을 떼면 안 됐다. 그래서 이 함수를 지우고 부르던 자리는 원본 이름을 그대로 쓴다.
export function initialOf(fullName: string): string {
  return fullName.charAt(0) || "?";
}
