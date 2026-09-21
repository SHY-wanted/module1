/**
 * <shoot-pet> — ShooT 반려 캐릭터 (레이어드 SVG + CSS 모션 + 파트별 색상)
 *
 * PNG로는 불가능한 3가지를 코드로 제어:
 *   1) 모션   — 띠용띠용 스쿼시&스트레치, 눈 깜빡임
 *   2) 커스텀 — 몸 / 가계부 / 가방 / 눈 / 잎사귀 색을 각각 독립 지정
 *   3) 상태   — 성장 단계(알→성체)와 감정(happy/sulking/sleepy)
 *
 * 셰이딩 원칙 (레퍼런스 아트와 동일)
 *   · 광원은 좌상단 하나. 몸통 그라디언트 방향과 하이라이트 위치가 모두 이 광원을 따른다.
 *   · 하이라이트는 몸통에 작은 스펙큘러 2개뿐. 광택(gloss)을 여러 곳에 흩뿌리지 않는다.
 *   · 대신 매트한 확산광 + 하단 접지 오클루전으로 볼륨을 만든다. 3D 클레이 렌더 톤.
 *
 * 색은 hex 하나만 주면 됩니다. 내부에서 HSL로 밝은면·어두운면을 파생시켜
 * 그라디언트를 만들기 때문에 어떤 색을 넣어도 입체감이 유지됩니다.
 *
 * 사용법
 *   <shoot-pet mood="happy" stage="3"></shoot-pet>
 *   <shoot-pet body="#7FC4F0" book="#F587B8" bag="#7DDCB8" eye="#2F3A6B" leaf="#8FE0A8"></shoot-pet>
 *   <shoot-pet part="book" book="#F587B8"></shoot-pet>   <!-- 파트 단독 미리보기 -->
 *
 * 속성 (모두 실시간 반영)
 *   mood     happy | sulking | sleepy
 *   stage    0 | 1 | 2 | 3            0 = 알
 *   body / book / bag / eye / leaf / cheek    hex. 파트별 색상
 *   hue      -180~180 deg             그룹별 일괄 색조
 *   part     body | book | bag | eye | leaf   해당 파트만 단독 렌더
 *   holding  book | none
 *   carrying bag | none
 *   animate  on | off                모션 정지 (스냅샷/프린트용)
 *
 * 확장 포인트: STAGE(단계) · FACES(표정) · MOTION/SECONDARY(키프레임) 테이블만 고치면 됩니다.
 * 좌표계: viewBox 0 0 230 240. 몸통 x 24~176, y 64~214. 눈 중심 y=136.
 */
(() => {
  /* ---------- 색상 파생 ---------- */
  const toRgb = (hex) => {
    let h = String(hex || '').replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) || 0);
  };
  const toHsl = (col) => {
    // 이미 파생된 hsl(h s% l%) 문자열도 그대로 받는다 (mod 중첩 적용 대응)
    const m = String(col).match(/^hsl\(\s*([-\d.]+)\s+([\d.]+)%\s+([\d.]+)%/i);
    if (m) return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])];
    let [r, g, b] = toRgb(col).map((v) => v / 255);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0, s = 0, l = (mx + mn) / 2;
    if (d) {
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60;
    }
    return [h, s * 100, l * 100];
  };
  const cl = (v) => Math.max(0, Math.min(100, v));
  /** 밝기(dl)·채도(ds)를 더해 같은 색조의 밝은면/어두운면을 만든다 */
  const mod = (col, dl, ds = 0) => {
    const [h, s, l] = toHsl(col);
    return `hsl(${h.toFixed(1)} ${cl(s + ds).toFixed(1)}% ${cl(l + dl).toFixed(1)}%)`;
  };

  const DEFAULTS = { body: '#C4B5EF', book: '#7B63C8', bag: '#9B87DC', eye: '#463571', leaf: '#A38EE4', cheek: '#F3B8D4' };
  // 입·눈꺼풀 잉크. 눈동자 색과 독립 — 눈 색을 바꿔도 입은 그대로 유지된다.
  const INK = '#3E3159';
  const TONGUE = '#EE93B6';

  /* ---------- 단계 / 모션 테이블 ---------- */
  const STAGE = {
    0: { scale: 0.8, sprout: 0.5, leaves: 1, egg: true },
    1: { scale: 0.74, sprout: 0.68, leaves: 2 },
    2: { scale: 0.88, sprout: 0.88, leaves: 2 },
    3: { scale: 1, sprout: 1.06, leaves: 2 },
  };

  const EASE = 'cubic-bezier(.33,0,.24,1)';
  const MOTION = {
    happy: { body: `pet-boing 2.45s ${EASE} infinite`, blink: 'pet-blink 4.8s steps(1,end) infinite' },
    sulking: { body: 'pet-slump 3.6s ease-in-out infinite', blink: 'pet-blink-slow 6.4s steps(1,end) infinite' },
    sleepy: { body: 'pet-breathe 4.2s ease-in-out infinite', blink: 'none' },
  };
  const SECONDARY = {
    happy: {
      sprout: `pet-sprout-wobble 2.45s ${EASE} infinite`,
      arms: `pet-arms-swing 2.45s ${EASE} infinite`,
      prop: `pet-prop-bob 2.45s ${EASE} infinite`,
      shadow: `pet-shadow 2.45s ${EASE} infinite`,
      decor: 'pet-sparkle 1.6s ease-in-out infinite',
    },
    sulking: { sprout: 'pet-sprout-droop 3.6s ease-in-out infinite', arms: 'none', prop: 'none', shadow: 'none', decor: 'pet-squiggle 2.8s ease-in-out infinite' },
    sleepy: { sprout: 'pet-sprout-droop 4.2s ease-in-out infinite', arms: 'none', prop: 'none', shadow: 'none', decor: 'pet-squiggle 3.4s ease-in-out infinite' },
  };

  const CSS = `
:host{display:inline-block;line-height:0}
svg{display:block;overflow:visible}
.tint{filter:hue-rotate(var(--pet-hue,0deg))}
#body,#sprout,#arms,#shadow,#prop{transform-box:fill-box}
#body{transform-origin:50% 100%;animation:var(--anim-body)}
#sprout{transform-origin:50% 92%;animation:var(--anim-sprout)}
#arms{transform-origin:50% 25%;animation:var(--anim-arms)}
#prop{transform-origin:50% 35%;animation:var(--anim-prop)}
#shadow{transform-origin:50% 50%;animation:var(--anim-shadow)}
#eyes{transform-box:view-box;transform-origin:100px 136px;animation:var(--anim-blink)}
#decor{animation:var(--anim-decor)}
:host([animate="off"]) *{animation:none!important}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}

/* 띠용띠용 — 예비동작(눌림) → 점프 stretch → 착지 squash → 잔진동 */
@keyframes pet-boing{
  0%,74%,100%{transform:translateY(0) scale(1,1)}
  9%{transform:translateY(1px) scale(1.07,.93)}
  24%{transform:translateY(-16px) scale(.92,1.09)}
  40%{transform:translateY(0) scale(1.1,.89)}
  52%{transform:translateY(-6px) scale(.97,1.05)}
  63%{transform:translateY(0) scale(1.04,.97)}
  69%{transform:translateY(-1px) scale(.99,1.01)}
}
@keyframes pet-sprout-wobble{
  0%,74%,100%{transform:rotate(0) scaleY(1)}
  16%{transform:rotate(-8deg) scaleY(1.07)}
  34%{transform:rotate(9deg) scaleY(.95)}
  50%{transform:rotate(-6deg) scaleY(1.04)}
  63%{transform:rotate(3deg) scaleY(1)}
}
@keyframes pet-arms-swing{
  0%,74%,100%{transform:rotate(0) translateY(0)}
  24%{transform:rotate(-7deg) translateY(-4px)}
  42%{transform:rotate(6deg) translateY(2px)}
  58%{transform:rotate(-2deg) translateY(0)}
}
@keyframes pet-prop-bob{
  0%,74%,100%{transform:translateY(0) rotate(0)}
  26%{transform:translateY(-5px) rotate(-3deg)}
  44%{transform:translateY(2px) rotate(3deg)}
}
@keyframes pet-shadow{
  0%,74%,100%{transform:scale(1);opacity:.15}
  24%{transform:scale(.8);opacity:.07}
  40%{transform:scale(1.07);opacity:.17}
}
@keyframes pet-slump{
  0%,100%{transform:translateY(0) scale(1,1) rotate(0)}
  45%{transform:translateY(2px) scale(1.018,.982) rotate(-1.2deg)}
  72%{transform:translateY(1px) scale(1.006,.994) rotate(.5deg)}
}
@keyframes pet-sprout-droop{
  0%,100%{transform:rotate(0) scaleY(1)}
  45%{transform:rotate(-4deg) scaleY(.96)}
  75%{transform:rotate(2deg) scaleY(.99)}
}
@keyframes pet-breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.022,.978)}}
@keyframes pet-blink{
  0%,90%,100%{transform:scaleY(1)}
  92.5%{transform:scaleY(.06)}
  95%{transform:scaleY(1)}
  96.5%{transform:scaleY(.06)}
  98.5%{transform:scaleY(1)}
}
@keyframes pet-blink-slow{0%,84%,100%{transform:scaleY(1)}89%{transform:scaleY(.12)}95%{transform:scaleY(1)}}
@keyframes pet-sparkle{0%,100%{opacity:.5;transform:scale(.9)}50%{opacity:1;transform:scale(1.08)}}
@keyframes pet-squiggle{0%,100%{opacity:.55;transform:translateY(0)}50%{opacity:.95;transform:translateY(-3px)}}`;

  // 거의 완전한 구체. 레퍼런스처럼 하단이 살짝 넓고 바닥에 눌린 느낌.
  const BODY_PATH = 'M100 64C142 64 176 98 176 140C176 182 142 214 100 214C58 214 24 182 24 140C24 98 58 64 100 64Z';
  const EGG_PATH = 'M100 50C127 50 148 92 148 142C148 187 126 214 100 214C74 214 52 187 52 142C52 92 73 50 100 50Z';
  const EYE_Y = 136;

  /* ---------- 그라디언트 정의 (파트 색에서 파생) ---------- */
  const defs = (c) => `
<defs>
  <!-- 몸통: 좌상단 광원 하나. 매트한 확산광 램프 -->
  <linearGradient id="g-body" x1=".26" y1=".04" x2=".7" y2="1">
    <stop offset="0" stop-color="${mod(c.body, 14, -10)}"/>
    <stop offset="44%" stop-color="${mod(c.body, 3, -2)}"/>
    <stop offset="100%" stop-color="${mod(c.body, -12, 2)}"/>
  </linearGradient>
  <!-- 팔: 몸통보다 살짝 밝게 (앞쪽에 있으므로) -->
  <linearGradient id="g-arm" x1=".3" y1="0" x2=".6" y2="1">
    <stop offset="0" stop-color="${mod(c.body, 10, -6)}"/>
    <stop offset="100%" stop-color="${mod(c.body, -5, 1)}"/>
  </linearGradient>
  <!-- 발: 그림자 안이므로 어둡게 -->
  <linearGradient id="g-foot" x1=".3" y1="0" x2=".6" y2="1">
    <stop offset="0" stop-color="${mod(c.body, -9, 6)}"/>
    <stop offset="100%" stop-color="${mod(c.body, -19, 9)}"/>
  </linearGradient>
  <linearGradient id="g-leaf" x1=".2" y1="0" x2=".75" y2="1">
    <stop offset="0" stop-color="${mod(c.leaf, 7, -4)}"/>
    <stop offset="100%" stop-color="${mod(c.leaf, -13, 5)}"/>
  </linearGradient>
  <linearGradient id="g-stem" gradientUnits="userSpaceOnUse" x1="94" y1="0" x2="108" y2="0">
    <stop offset="0" stop-color="${mod(c.leaf, -2, 2)}"/>
    <stop offset="100%" stop-color="${mod(c.leaf, -16, 6)}"/>
  </linearGradient>
  <linearGradient id="g-book" x1=".2" y1="0" x2=".75" y2="1">
    <stop offset="0" stop-color="${mod(c.book, 8, -3)}"/>
    <stop offset="100%" stop-color="${mod(c.book, -11, 3)}"/>
  </linearGradient>
  <linearGradient id="g-book-spine" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${mod(c.book, -14, 4)}"/>
    <stop offset="100%" stop-color="${mod(c.book, -2, 1)}"/>
  </linearGradient>
  <linearGradient id="g-pages" x1="0" y1="0" x2=".2" y2="1">
    <stop offset="0" stop-color="#fff"/>
    <stop offset="100%" stop-color="${mod(c.book, 40, -26)}"/>
  </linearGradient>
  <linearGradient id="g-bag" x1=".2" y1="0" x2=".75" y2="1">
    <stop offset="0" stop-color="${mod(c.bag, 8, -4)}"/>
    <stop offset="100%" stop-color="${mod(c.bag, -12, 3)}"/>
  </linearGradient>
  <linearGradient id="g-bag-flap" x1=".1" y1="0" x2=".5" y2="1">
    <stop offset="0" stop-color="${mod(c.bag, 15, -8)}"/>
    <stop offset="100%" stop-color="${mod(c.bag, 1, -1)}"/>
  </linearGradient>
  <radialGradient id="g-iris" cx="44%" cy="30%" r="80%">
    <stop offset="0" stop-color="${mod(c.eye, 13, -3)}"/>
    <stop offset="58%" stop-color="${c.eye}"/>
    <stop offset="100%" stop-color="${mod(c.eye, -8, 6)}"/>
  </radialGradient>
  <radialGradient id="g-cheek" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="${c.cheek}" stop-opacity=".95"/>
    <stop offset="55%" stop-color="${c.cheek}" stop-opacity=".55"/>
    <stop offset="100%" stop-color="${c.cheek}" stop-opacity="0"/>
  </radialGradient>
  <!-- 유일한 스펙큘러 그라디언트. 경거한 타원이 아니라 부드럽게 프라데임아웃 -->
  <radialGradient id="g-spec" cx="50%" cy="46%" r="50%">
    <stop offset="0" stop-color="#fff" stop-opacity=".4"/>
    <stop offset="45%" stop-color="#fff" stop-opacity=".2"/>
    <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
  </radialGradient>
  <!-- 바닥 접지 오클루전. 볼륨의 대부분은 여기서 나온다 -->
  <radialGradient id="g-occl" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="${mod(c.body, -22, 10)}" stop-opacity=".55"/>
    <stop offset="70%" stop-color="${mod(c.body, -22, 10)}" stop-opacity=".16"/>
    <stop offset="100%" stop-color="${mod(c.body, -22, 10)}" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="g-coin" x1=".2" y1="0" x2=".8" y2="1">
    <stop offset="0" stop-color="#F8D26A"/>
    <stop offset="100%" stop-color="#E0A02E"/>
  </linearGradient>
  <clipPath id="clip-body"><path d="${BODY_PATH}"/></clipPath>
  <clipPath id="clip-egg"><path d="${EGG_PATH}"/></clipPath>
  <clipPath id="clip-eye-l"><ellipse cx="70" cy="${EYE_Y}" rx="22" ry="26"/></clipPath>
  <clipPath id="clip-eye-r"><ellipse cx="130" cy="${EYE_Y}" rx="22" ry="26"/></clipPath>
  <clipPath id="clip-mouth"><path d="M86 152Q100 182 114 152Q100 161 86 152Z"/></clipPath>
</defs>`;

  /**
   * 눈 — 레퍼런스처럼 큰 아이리스가 흰자를 거의 채우고, 바깥쪽에 흰자 초승달이 남는다.
   * 하이라이트는 좌상단 큰 것 하나 + 우하단 작은 것 하나. (광원 하나 규칙)
   */
  const eyePair = ({ rx = 22, ry = 26, lid = 0, c = DEFAULTS } = {}) =>
    [['l', 70, 1], ['r', 130, -1]].map(([side, cx, dir]) => {
      const ix = cx + dir * rx * 0.2, iy = EYE_Y - ry * 0.05;
      const irx = rx * 0.84, iry = ry * 0.8;
      return `
    <g clip-path="url(#clip-eye-${side})">
      <ellipse cx="${cx}" cy="${EYE_Y}" rx="${rx}" ry="${ry}" fill="#fff"/>
      <ellipse cx="${ix}" cy="${iy}" rx="${irx}" ry="${iry}" fill="url(#g-iris)"/>
      <ellipse cx="${ix - dir * irx * 0.3}" cy="${iy - iry * 0.46}" rx="${irx * 0.36}" ry="${iry * 0.29}" fill="#fff"/>
      <ellipse cx="${ix + dir * irx * 0.38}" cy="${iy + iry * 0.4}" rx="${irx * 0.15}" ry="${iry * 0.12}" fill="#fff" opacity=".62"/>
      ${lid ? `<rect x="${cx - 32}" y="${EYE_Y - ry - 26}" width="64" height="${26 + ry * 0.34}" fill="${mod(c.body, -2, 1)}"
        transform="rotate(${dir * lid} ${cx} ${EYE_Y - ry * 0.5})"/>` : ''}
    </g>`;
    }).join('');

  const cheeks = (y, op) => `
    <ellipse cx="46" cy="${y}" rx="19" ry="13" fill="url(#g-cheek)" opacity="${op}"/>
    <ellipse cx="154" cy="${y}" rx="19" ry="13" fill="url(#g-cheek)" opacity="${op}"/>`;

  const FACES = {
    happy: (c) => `
      <g id="eyes">${eyePair({ c })}</g>
      <path d="M86 152Q100 182 114 152Q100 161 86 152Z" fill="${INK}"/>
      <ellipse cx="100" cy="174" rx="8" ry="6" fill="${TONGUE}" clip-path="url(#clip-mouth)"/>
      ${cheeks(160, 1)}`,
    sulking: (c) => `
      <g id="eyes">${eyePair({ ry: 24, lid: 10, c })}</g>
      <path d="M47 108q19-12 35 1" stroke="${mod(c.body, -20, 4)}" stroke-width="4.4" stroke-linecap="round" fill="none" opacity=".85"/>
      <path d="M153 108q-19-12-35 1" stroke="${mod(c.body, -20, 4)}" stroke-width="4.4" stroke-linecap="round" fill="none" opacity=".85"/>
      <path d="M89 170q11-9 22 0" stroke="${INK}" stroke-width="4.4" stroke-linecap="round" fill="none"/>
      ${cheeks(162, 0.8)}`,
    sleepy: (c) => `
      <g id="eyes">
        <path d="M52 ${EYE_Y}q18 15 36 0" stroke="${mod(c.eye, 8)}" stroke-width="4.8" stroke-linecap="round" fill="none"/>
        <path d="M112 ${EYE_Y}q18 15 36 0" stroke="${mod(c.eye, 8)}" stroke-width="4.8" stroke-linecap="round" fill="none"/>
      </g>
      <ellipse cx="100" cy="164" rx="7" ry="9" fill="${INK}" opacity=".92"/>
      ${cheeks(160, 1)}`,
    egg: (c) => `
      <g id="eyes">
        <path d="M74 152q12 11 24 0" stroke="${mod(c.eye, 10)}" stroke-width="4.6" stroke-linecap="round" fill="none"/>
        <path d="M102 152q12 11 24 0" stroke="${mod(c.eye, 10)}" stroke-width="4.6" stroke-linecap="round" fill="none"/>
      </g>
      <path d="M94 172q6 6 12 0" stroke="${INK}" stroke-width="3.6" stroke-linecap="round" fill="none" opacity=".8"/>
      <ellipse cx="70" cy="170" rx="14" ry="9" fill="url(#g-cheek)"/>
      <ellipse cx="130" cy="170" rx="14" ry="9" fill="url(#g-cheek)"/>`,
  };

  /* ---------- 장식 ---------- */
  const DECOR = {
    happy: () => `<g id="decor">
      <path d="M190 78l3.6 9.4 9.4 3.6-9.4 3.6L190 104l-3.6-9.4L177 91l9.4-3.6Z" fill="#F8D26A"/>
      <path d="M208 126l2.3 5.8 5.8 2.3-5.8 2.3-2.3 5.8-2.3-5.8-5.8-2.3 5.8-2.3Z" fill="#F8D26A" opacity=".8"/>
      <path d="M26 74l2.6 6.6 6.6 2.6-6.6 2.6L26 92.4l-2.6-6.6L16.8 83.2l6.6-2.6Z" fill="#F8D26A" opacity=".6"/>
    </g>`,
    sulking: (c) => `<g id="decor" opacity=".6">
      <path d="M186 84c17-12 31 2 17 12s-21-6-7-13 26 2 17 14" stroke="${mod(c.body, -22, 4)}" stroke-width="3.8" fill="none" stroke-linecap="round"/>
      <path d="M203 118v12" stroke="${mod(c.body, -22, 4)}" stroke-width="3.8" stroke-linecap="round"/>
    </g>`,
    sleepy: (c) => `<g id="decor" opacity=".75">
      <text x="190" y="104" font-family="Nunito,system-ui,sans-serif" font-size="29" font-weight="900" fill="${mod(c.book, 4)}">z</text>
      <text x="212" y="78" font-family="Nunito,system-ui,sans-serif" font-size="18" font-weight="900" fill="${mod(c.book, 4)}" opacity=".6">z</text>
    </g>`,
    egg: (c) => `<g id="decor" opacity=".8">
      <path d="M80 36l-4 13" stroke="${mod(c.leaf, -8, 4)}" stroke-width="4.6" stroke-linecap="round"/>
      <path d="M100 28v13" stroke="${mod(c.leaf, -8, 4)}" stroke-width="4.6" stroke-linecap="round"/>
      <path d="M120 36l4 13" stroke="${mod(c.leaf, -8, 4)}" stroke-width="4.6" stroke-linecap="round"/>
    </g>`,
  };

  /**
   * 새싹 — 잎 하나를 그려 좌우로 미러링하므로 항상 대칭.
   * 둥근 수구(水球) 모양 + 약한 끝점. 잎 로컬 좌표: 밑동 (0,0), 끝 (0,-57).
   * rot을 키우면 더 눕고, s는 크기.
   */
  const LEAF = 'M0 0C-19-2-29-13-30-30C-31-47-21-59-8-60C4-61 23-46 26-27C28-10 18-2 0 0Z';
  const leafAt = (rot, s, dx = 0) =>
    `<g transform="translate(${dx} 0) rotate(${rot}) scale(${s})">
       <path d="${LEAF}" fill="url(#g-leaf)"/>
       <path d="M-4-8C-16-19-23-36-13-52" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".18"/>
     </g>`;

  const sprout = (n) => {
    // 줄기를 잎보다 나중에 그려 밑동이 가려지지 않게 한다 (연결감)
    const stem = (w) => `<path d="M0 6C0-4 -1-14 0-26" stroke="url(#g-stem)" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
    if (n < 2) return leafAt(30, 0.58, 2) + stem(8);
    // 밑동을 살짝 벌려 두 잎이 한 덩어리로 붙지 않게 한다.
    return `<g transform="translate(200 0) scale(-1 1)">${leafAt(50, 0.88, 5)}</g>`
      + leafAt(50, 0.96, 5)
      + stem(10);
  };

  /** ₩ 심볼 — 폰트 의존 없이 벡터로. (x,y)=중심, s=크기 */
  const won = (x, y, s, fill = '#fff', op = 1) => {
    const u = s / 100;
    return `<g transform="translate(${x} ${y}) scale(${u})" opacity="${op}">
      <path d="M-42-26 -21 20 0-26 21 20 42-26" fill="none" stroke="${fill}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="-40" y="-8" width="80" height="8" rx="4" fill="${fill}"/>
      <rect x="-34" y="6" width="68" height="8" rx="4" fill="${fill}"/>
    </g>`;
  };

  /** 가계부 — 표지 + 어두운 책등 + 흰 책배(page block) + 리본 책갈피 */
  const book = `<g id="prop">
    <rect x="66" y="170" width="68" height="48" rx="7" fill="url(#g-pages)"/>
    <rect x="69" y="168" width="66" height="48" rx="7" fill="url(#g-book)"/>
    <path d="M69 175a7 7 0 0 1 7-7h4v48h-4a7 7 0 0 1-7-7Z" fill="url(#g-book-spine)"/>
    <rect x="87" y="175" width="41" height="34" rx="4" fill="#fff" opacity=".1"/>
    ${won(107, 191, 30, '#fff', 0.96)}
    <path d="M120 168h9v21l-4.5-5-4.5 5Z" fill="#F8D26A"/>
  </g>`;

  /** 가방 — 본체 + 플랩 + 손잡이 + 잠금장치 + 잎사귀 엠블럼 */
  const bag = `<g id="bagpack" transform="translate(-6 8)">
    <path d="M14 157h42a10 10 0 0 1 10 10v28a14 14 0 0 1-14 14H18a14 14 0 0 1-14-14v-28a10 10 0 0 1 10-10Z" fill="url(#g-bag)"/>
    <path d="M4 167a10 10 0 0 1 10-10h42a10 10 0 0 1 10 10v11a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Z" fill="url(#g-bag-flap)"/>
    <rect x="29" y="176" width="12" height="14" rx="4.5" fill="#000" opacity=".16"/>
    <path d="M22 157c0-15 26-15 26 0" stroke="url(#g-bag)" stroke-width="7.5" fill="none" stroke-linecap="round"/>
    <g>
      <path d="M34 186c-9-8-21-2-14 7 6 7 16 2 14-7Z" fill="#fff" opacity=".72"/>
      <path d="M37 186c9-8 21-2 14 7-6 7-16 2-14-7Z" fill="#fff" opacity=".48"/>
      <path d="M35.5 193v14" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".66"/>
    </g>
  </g>`;

  /* ---------- 파트 단독 미리보기 ---------- */
  const PARTS = {
    book: { view: '54 162 96 70', svg: () => book },
    bag: { view: '-2 143 72 72', svg: () => bag },
    leaf: { view: '-68 -66 136 92', svg: () => sprout(2) },
    eye: { view: '46 108 48 56', svg: (c) => eyePair({ c }).split('</g>')[0] + '</g>' },
    body: null,
  };

  class ShootPet extends HTMLElement {
    static get observedAttributes() {
      return ['mood', 'stage', 'hue', 'body', 'book', 'bag', 'eye', 'leaf', 'cheek', 'part', 'holding', 'carrying', 'size', 'animate'];
    }
    connectedCallback() {
      if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
      this.render();
    }
    attributeChangedCallback() { if (this.shadowRoot) this.render(); }

    render() {
      const raw = {};
      for (const k in DEFAULTS) raw[k] = this.getAttribute(k) || DEFAULTS[k];

      const part = this.getAttribute('part');
      const hue = `--pet-hue:${this.getAttribute('hue') || 0}deg`;

      if (part && PARTS[part]) {
        const p = PARTS[part];
        this.shadowRoot.innerHTML = `<style>${CSS}</style>
<svg class="tint" viewBox="${p.view}" width="100%" height="100%" style="${hue}" aria-hidden="true">${defs(raw)}${p.svg(raw)}</svg>`;
        return;
      }

      const st = STAGE[this.getAttribute('stage')] || STAGE[2];
      const mood = st.egg ? 'egg' : (FACES[this.getAttribute('mood')] ? this.getAttribute('mood') : 'happy');
      const animKey = st.egg ? 'sleepy' : (MOTION[mood] ? mood : 'happy');
      const m = MOTION[animKey], sec = SECONDARY[animKey];
      const size = parseFloat(this.getAttribute('size') || 0);

      // 시무룩 상태는 채도를 떨어뜨려 생기 없는 색으로
      const c = mood === 'sulking'
        ? Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, mod(v, k === 'body' ? -2 : 0, -40)]))
        : raw;

      const holding = !st.egg && mood === 'happy' && this.getAttribute('holding') !== 'none';
      const carrying = !st.egg && st.scale >= 0.74 && this.getAttribute('carrying') !== 'none';
      const bodyPath = st.egg ? EGG_PATH : BODY_PATH;
      const clip = st.egg ? 'clip-egg' : 'clip-body';
      // 팔: 가계부를 안으면 앞으로 모으고, 시무룩하면 몸 앞에 내려놓음
      const arm = holding ? { x: 64, y: 194, r: 17, tilt: 28 }
        : mood === 'sulking' ? { x: 68, y: 202, r: 21, tilt: 6 }
        : { x: 34, y: 176, r: 18, tilt: 14 };

      this.shadowRoot.innerHTML = `<style>${CSS}</style>
<svg class="tint" viewBox="0 0 230 240" ${size ? `width="${size}" height="${size * 240 / 230}"` : 'width="100%" height="100%"'}
  style="${hue};--anim-body:${m.body};--anim-sprout:${sec.sprout};--anim-arms:${sec.arms};
  --anim-prop:${sec.prop};--anim-shadow:${sec.shadow};--anim-blink:${m.blink};--anim-decor:${sec.decor}"
  role="img" aria-label="ShooT 반려 캐릭터 — ${mood}">
  ${defs(c)}
  ${(DECOR[mood] || DECOR.happy)(c)}
  <ellipse id="shadow" cx="100" cy="226" rx="62" ry="11" fill="#2D2A3E" opacity=".15"/>
  <g id="body-scale" transform="translate(100 214) scale(${st.scale}) translate(-100 -214)">
  <g id="body">
    <g id="sprout-scale" transform="translate(100 ${st.egg ? 58 : 54}) scale(${st.sprout})">
      <g id="sprout">${sprout(st.leaves)}</g>
    </g>
    ${carrying ? bag : ''}
    ${st.egg ? '' : `<ellipse cx="62" cy="213" rx="22" ry="13" fill="url(#g-foot)"/>
    <ellipse cx="138" cy="213" rx="22" ry="13" fill="url(#g-foot)"/>`}
    <path d="${bodyPath}" fill="url(#g-body)"/>
    <g clip-path="url(#${clip})">
      <ellipse cx="100" cy="228" rx="78" ry="30" fill="url(#g-occl)"/>
      <!-- 스펙큘러: 좌상단 광원에서 온 것 2개. 이것이 전부. -->
      <ellipse cx="62" cy="104" rx="20" ry="30" fill="url(#g-spec)" transform="rotate(-36 62 104)"/>
      <ellipse cx="82" cy="86" rx="8" ry="11" fill="url(#g-spec)" transform="rotate(-36 82 86)"/>
    </g>
    <g id="face">${(FACES[mood] || FACES.happy)(c)}</g>
    ${holding ? book : ''}
    ${st.egg ? '' : `<g id="arms">
      <ellipse cx="${arm.x}" cy="${arm.y}" rx="${arm.r}" ry="${arm.r * 0.88}" fill="url(#g-arm)" transform="rotate(${-arm.tilt} ${arm.x} ${arm.y})"/>
      <ellipse cx="${200 - arm.x}" cy="${arm.y}" rx="${arm.r}" ry="${arm.r * 0.88}" fill="url(#g-arm)" transform="rotate(${arm.tilt} ${200 - arm.x} ${arm.y})"/>
    </g>`}
  </g>
  </g>
</svg>`;
    }
  }
  if (!customElements.get('shoot-pet')) customElements.define('shoot-pet', ShootPet);
})();
