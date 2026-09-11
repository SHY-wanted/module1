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

// created_at(timestamptz)을 "오늘 08:32" / "어제" / "9월 6일" 형태로 — 데모 기준 오늘은 TODAY_DATE 고정.
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
// design/shoot/Home.dc.html·MyPage.dc.html의 stripSurname()을 그대로 옮김.
const COMPOUND_SURNAMES = ["남궁", "황보", "제갈", "사공", "선우", "서문", "독고", "동방"];
export function stripSurname(fullName: string): string {
  const twoChar = COMPOUND_SURNAMES.find((s) => fullName.startsWith(s));
  if (twoChar && fullName.length > twoChar.length) return fullName.slice(twoChar.length);
  return fullName.length > 1 ? fullName.slice(1) : fullName;
}

export function initialOf(fullName: string): string {
  const given = stripSurname(fullName);
  return given.charAt(0) || fullName.charAt(0) || "?";
}
