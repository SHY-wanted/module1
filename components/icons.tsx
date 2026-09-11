// components/icons.tsx — design/shoot/*.dc.html에서 반복되는 SVG를 그대로 옮긴 아이콘 모음.
// 모두 stroke 기반(fill none, strokeWidth 2, round cap/join) — 디자인 그대로.
import type { CSSProperties } from "react";

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: CSSProperties;
}

function base(size = 17, color = "#2D2A3E", strokeWidth = 2) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

export function HeartIcon({ size, color, strokeWidth, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)} style={style}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

export function UsersIcon({ size, color, strokeWidth, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)} style={style}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function RingIcon({ size, color, strokeWidth, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)} style={style}>
      <path d="M6 3h12l4 6-10 12L2 9Z" />
      <path d="M11 3 8 9l4 12 4-12-3-6" />
      <path d="M2 9h20" />
    </svg>
  );
}

export function HomeIcon({ size, color, strokeWidth, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)} style={style}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

export function FlagIcon({ size, color, strokeWidth, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)} style={style}>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" x2="4" y1="22" y2="15" />
    </svg>
  );
}

export function SparkleIcon({ size, color, strokeWidth, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)} style={style}>
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z" />
    </svg>
  );
}

export function MailPlusIcon({ size, color, strokeWidth, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)} style={style}>
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}

export function LogInIcon({ size, color, strokeWidth, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)} style={style}>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" x2="3" y1="12" y2="12" />
    </svg>
  );
}

// design/shoot/MyGroupsManage.dc.html "그룹 나가기" 아이콘 그대로.
export function LogOutIcon({ size, color, strokeWidth, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)} style={style}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}

export function CheckIcon({ size, color, strokeWidth, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)} style={style}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function ChevronRightIcon({ size, color, strokeWidth, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)} style={style}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

// design/shoot/*.dc.html 상단 뒤로가기 화살표("m15 18-6-6 6-6") — IncomeList·IncomeEdit·Settings·
// MyGroupsManage·ReceiptCapture·ReceiptProcessing 헤더에서 공통으로 쓴다.
export function ChevronLeftIcon({ size, color, strokeWidth, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)} style={style}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function ChevronDownIcon({ size, color, strokeWidth, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)} style={style}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function CameraIcon({ size, color, strokeWidth, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)} style={style}>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

export function ListIcon({ size, color, strokeWidth, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)} style={style}>
      <line x1="8" x2="21" y1="6" y2="6" />
      <line x1="8" x2="21" y1="12" y2="12" />
      <line x1="8" x2="21" y1="18" y2="18" />
      <line x1="3" x2="3.01" y1="6" y2="6" />
      <line x1="3" x2="3.01" y1="12" y2="12" />
      <line x1="3" x2="3.01" y1="18" y2="18" />
    </svg>
  );
}

export function UserCircleIcon({ size, color, strokeWidth, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)} style={style}>
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
  );
}

export function GearIcon({ size, color, strokeWidth, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)} style={style}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export function ShareIcon({ size, color, strokeWidth, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)} style={style}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
      <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
    </svg>
  );
}

export function PlusIcon({ size, color, strokeWidth, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)} style={style}>
      <line x1="12" x2="12" y1="5" y2="19" />
      <line x1="5" x2="19" y1="12" y2="12" />
    </svg>
  );
}

export function ArrowUpIcon({ size, color, strokeWidth, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)} style={style}>
      <line x1="12" x2="12" y1="19" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

// design/shoot/IncomeEdit.dc.html "매달 자동으로 반복" 토글 아이콘 그대로.
export function RefreshIcon({ size, color, strokeWidth, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)} style={style}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

// 아래 5개는 design/shoot/Settings.dc.html 아이콘을 그대로 옮김.
export function BellIcon({ size, color, strokeWidth, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)} style={style}>
      <path d="M10.268 21a2 2 0 0 0 3.464 0" />
      <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
    </svg>
  );
}

export function AlertCircleIcon({ size, color, strokeWidth, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)} style={style}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}

export function VolumeIcon({ size, color, strokeWidth, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)} style={style}>
      <path d="M11 5 6 9H2v6h4l5 4z" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

export function MoonIcon({ size, color, strokeWidth, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)} style={style}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

export function TypeSizeIcon({ size, color, strokeWidth, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)} style={style}>
      <path d="M4 7V4h16v3" />
      <path d="M9 20h6" />
      <path d="M12 4v16" />
    </svg>
  );
}

// design/shoot/ReceiptCapture.dc.html "갤러리에서 선택" 아이콘 그대로.
export function ImageIcon({ size, color, strokeWidth, style }: IconProps) {
  return (
    <svg {...base(size, color, strokeWidth)} style={style}>
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

// ExpenseInput(6)·ExpenseList(7)의 카테고리 아이콘 — lib/categories.ts의 icon 키와 1:1 대응.
export type CategoryIconKey =
  | "food"
  | "transport"
  | "living"
  | "culture"
  | "medical"
  | "date"
  | "gift"
  | "anniversary"
  | "trip"
  | "cafe"
  | "education"
  | "management"
  | "telecom"
  | "custom"
  | "hobby"
  | "clothing"
  | "etc";

export function CategoryIcon({ icon, size, color, strokeWidth, style }: IconProps & { icon: CategoryIconKey }) {
  const props = base(size, color, strokeWidth);
  switch (icon) {
    case "food":
      return (
        <svg {...props} style={style}>
          <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
          <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
        </svg>
      );
    case "cafe":
      return (
        <svg {...props} style={style}>
          <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
          <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
          <line x1="6" x2="6" y1="2" y2="4" />
          <line x1="10" x2="10" y1="2" y2="4" />
          <line x1="14" x2="14" y1="2" y2="4" />
        </svg>
      );
    case "transport":
      return (
        <svg {...props} style={style}>
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <path d="M9 17h6" />
          <circle cx="17" cy="17" r="2" />
        </svg>
      );
    case "living":
      return (
        <svg {...props} style={style}>
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      );
    case "culture":
      return (
        <svg {...props} style={style}>
          <path d="M2 9a3 3 0 1 0 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 1 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
          <path d="M13 5v2" />
          <path d="M13 17v2" />
          <path d="M13 11v2" />
        </svg>
      );
    case "medical":
      return (
        <svg {...props} style={style}>
          <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
          <path d="m8.5 8.5 7 7" />
        </svg>
      );
    case "date":
      return (
        <svg {...props} style={style}>
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      );
    case "gift":
      return (
        <svg {...props} style={style}>
          <rect x="3" y="8" width="18" height="4" rx="1" />
          <path d="M12 8v13" />
          <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
          <path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" />
        </svg>
      );
    case "anniversary":
      return (
        <svg {...props} style={style}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case "trip":
      return (
        <svg {...props} style={style}>
          <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-1 .1-1.3.5l-.7.9c-.3.4-.2.9.2 1.2L9 12l-2 3H4l-1.5 1.5c-.3.3-.3.7 0 1l1.5 1.5h.9v-2l1.5-1.5 3 6.5c.3.4.8.5 1.2.2l.9-.7c.4-.3.6-.8.5-1.3z" />
        </svg>
      );
    case "education":
      return (
        <svg {...props} style={style}>
          <path d="M12 7v14" />
          <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
        </svg>
      );
    case "management":
      return (
        <svg {...props} style={style}>
          <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
          <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
          <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
          <path d="M10 6h4" />
          <path d="M10 10h4" />
          <path d="M10 14h4" />
          <path d="M10 18h4" />
        </svg>
      );
    case "telecom":
      return (
        <svg {...props} style={style}>
          <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.732 1.598l-.464.355a1 1 0 0 0-.302 1.214 14.11 14.11 0 0 0 6.331 6.33z" />
        </svg>
      );
    case "custom":
      return (
        <svg {...props} style={style}>
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        </svg>
      );
    case "hobby":
      // design/shoot/Settings.dc.html "취미" 아이콘(게임 컨트롤러) 그대로.
      return (
        <svg {...props} style={style}>
          <line x1="6" x2="10" y1="11" y2="11" />
          <line x1="8" x2="8" y1="9" y2="13" />
          <line x1="15" x2="15.01" y1="12" y2="12" />
          <line x1="18" x2="18.01" y1="10" y2="10" />
          <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.15C2.67 8.905 2 15.402 2 16.5c0 1.7 1.3 3 3 3 .95 0 1.5-.5 2-1l1.6-1.6a2.4 2.4 0 0 1 1.8-.9h3.2c.7 0 1.3.3 1.8.9l1.6 1.6c.5.5 1.05 1 2 1 1.7 0 3-1.3 3-3 0-1.098-.67-7.595-.685-7.76a1.174 1.174 0 0 0-.017-.15A4 4 0 0 0 17.32 5z" />
        </svg>
      );
    case "clothing":
      // design/shoot/Settings.dc.html "의류" 아이콘(티셔츠) 그대로.
      return (
        <svg {...props} style={style}>
          <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23" />
        </svg>
      );
    case "etc":
    default:
      return (
        <svg {...props} style={style}>
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </svg>
      );
  }
}
