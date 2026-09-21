import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 개발 서버를 휴대폰 등 LAN의 다른 기기에서 열어볼 때 필요 — Next.js는 기본적으로 localhost가
  // 아닌 origin에서 오는 개발용 요청(정적 청크·RSC 등)을 막는다. 이게 없으면 최초 서버 렌더링
  // 화면(배경색만 있는 스플래시 로딩 상태)만 보이고 그 뒤로 앱이 그려지지 않는다.
  // 와이파이가 바뀌면 이 IP도 바뀐다(예: 192.168.0.15 → 10.200.10.235) — 휴대폰에서 접속이
  // 안 되면 먼저 현재 PC의 Wi-Fi IPv4 주소를 확인해서 여기에 추가해야 한다.
  // 개인 PC의 LAN 주소라 커밋에 남기지 않으려고 꺼둔다 — 휴대폰 테스트가 필요하면 다시 채워서 쓸 것.
  allowedDevOrigins: [],
};

export default nextConfig;
