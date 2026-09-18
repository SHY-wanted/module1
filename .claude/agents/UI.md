# UI DESIGN SKILL
## Adobe / Photoshop / Figma 기반 프리미엄 UI 디자인 시스템

이 문서는 프로젝트의 모든 UI 디자인과 시각적 인터페이스를
일관되고 완성도 높게 제작하기 위한 절대적인 디자인 규칙입니다.

이 프로젝트의 UI는 단순한 HTML/CSS 구현물이 아니라
Adobe Photoshop, Illustrator, Figma에서 제작하는 수준의
정교한 시각 디자인 시스템으로 취급합니다.

목표:

"기능적으로 동작하는 UI"가 아니라
"실제 서비스로 출시해도 어색하지 않은 완성도 높은 UI"를 제작합니다.

---

# 1. DESIGN PHILOSOPHY

모든 UI는 다음 원칙을 우선합니다.

1. Visual Hierarchy
2. Consistency
3. Balance
4. Rhythm
5. Contrast
6. Alignment
7. Whitespace
8. Accessibility
9. Interaction Feedback
10. Brand Identity

예쁘게 보이는 것보다
"정보가 정확하게 읽히고, 시각적 우선순위가 명확하며,
전체 서비스가 하나의 브랜드처럼 보이는 것"을 중요하게 생각합니다.

---

# 2. DESIGN TOOL MENTAL MODEL

UI를 다음과 같은 디자인 프로그램의 구조로 생각합니다.

Canvas
├── Background
├── Navigation
├── Header
├── Content
│   ├── Section
│   ├── Card
│   ├── Component
│   └── Content
├── Floating UI
├── Feedback
└── Overlay

각 요소는 독립적인 Layer처럼 취급합니다.

하나의 요소를 수정할 때
다른 요소의 위치, 크기, 간격, 색상이 불필요하게 변경되면 안 됩니다.

---

# 3. DESIGN SYSTEM FIRST

UI를 만들기 전에 디자인 토큰을 확인합니다.

다음 요소는 프로젝트 전체에서 일관되게 사용합니다.

- Colors
- Typography
- Spacing
- Border Radius
- Shadows
- Borders
- Icons
- Button Styles
- Input Styles
- Card Styles
- Modal Styles
- Navigation
- Animation

같은 역할을 하는 UI가 페이지마다 서로 다른 스타일을 가지면 안 됩니다.

---

# 4. COLOR SYSTEM

색상은 임의로 생성하지 않습니다.

Primary
Secondary
Accent
Background
Surface
Border
Text Primary
Text Secondary
Text Disabled
Success
Warning
Error

등의 의미 기반 토큰으로 관리합니다.

색상은 HEX / RGB 기준으로 명확하게 정의합니다.

가능하면 색상값을 컴포넌트에 직접 반복해서 작성하지 않고
Design Token을 사용합니다.

---

# 5. COLOR RELATIONSHIP

색상을 선택할 때 단일 HEX 값만 보는 것이 아니라
다음 관계를 확인합니다.

- Hue
- Saturation
- Lightness
- Contrast
- Temperature
- Visual Weight

같은 화면에서 사용되는 색상들은 서로 조화를 이루어야 합니다.

특히 캐릭터가 중심인 화면에서는
UI가 캐릭터보다 더 강한 시각적 존재감을 가지면 안 됩니다.

---

# 6. TYPOGRAPHY

Typography는 다음을 체계적으로 관리합니다.

- Font Family
- Font Weight
- Font Size
- Line Height
- Letter Spacing
- Text Color

Heading
Title
Subtitle
Body
Caption
Label
Button

등의 계층을 명확하게 구분합니다.

폰트 크기를 임의로 페이지마다 조정하지 않습니다.

---

# 7. SPACING SYSTEM

Spacing은 임의의 숫자를 반복 사용하지 않습니다.

가능하면 일정한 spacing scale을 사용합니다.

예:

4
8
12
16
20
24
32
40
48
64

등의 규칙적인 간격 체계를 사용합니다.

요소 사이의 간격이 일관되지 않으면
디자인 완성도가 크게 떨어지는 것으로 판단합니다.

---

# 8. GRID AND ALIGNMENT

모든 UI 요소는 명확한 정렬 기준을 가집니다.

- Container
- Grid
- Columns
- Rows
- Baseline
- Edge Alignment
- Center Alignment

텍스트와 아이콘을 감으로 배치하지 않습니다.

같은 그룹에 속한 요소는
동일한 alignment system을 사용합니다.

---

# 9. VISUAL HIERARCHY

화면에서 사용자가 가장 먼저 봐야 하는 요소와
나중에 봐도 되는 요소를 명확히 구분합니다.

예:

Primary Action
>
Main Information
>
Secondary Information
>
Decorative Information

모든 요소가 동일한 강조 수준을 가지면 안 됩니다.

---

# 10. CARD DESIGN

카드는 단순히 배경색 + border-radius를 적용하는 방식으로 만들지 않습니다.

다음을 종합적으로 고려합니다.

- Surface color
- Contrast
- Border
- Shadow
- Internal padding
- Content hierarchy
- Hover state
- Pressed state
- Disabled state

카드가 많아질수록 동일한 디자인 언어를 유지합니다.

---

# 11. BUTTON DESIGN

모든 버튼은 상태를 가집니다.

Default
Hover
Active
Pressed
Focus
Disabled
Loading

각 상태의 변화가 명확해야 합니다.

버튼은 단순히 색상만 변경하는 것이 아니라
가능하면

- 색상
- 그림자
- 밝기
- scale
- position

등을 미세하게 조합합니다.

단, 과도한 효과는 사용하지 않습니다.

---

# 12. INPUT DESIGN

Input은 다음 상태를 명확하게 표현합니다.

Default
Hover
Focus
Filled
Error
Success
Disabled

Focus 상태를 명확하게 표시합니다.

---

# 13. ICONOGRAPHY

아이콘은 서로 다른 스타일을 섞지 않습니다.

가능하면 하나의 icon family를 사용합니다.

Stroke Width
Corner Style
Visual Weight

을 통일합니다.

아이콘을 임의로 서로 다른 두께로 제작하지 않습니다.

---

# 14. SHADOW

그림자는 장식이 아니라 depth를 표현하는 수단입니다.

Shadow는 다음 값을 체계적으로 관리합니다.

- X
- Y
- Blur
- Spread
- Opacity

모든 요소에 그림자를 넣지 않습니다.

높은 elevation을 나타내는 요소에만 사용합니다.

---

# 15. BORDER / RADIUS

Border와 Radius는 디자인 시스템에 포함합니다.

예:

sm
md
lg
xl
pill

등으로 관리합니다.

페이지마다 서로 다른 radius를 즉흥적으로 생성하지 않습니다.

---

# 16. RESPONSIVE DESIGN

Desktop
Tablet
Mobile

환경에서 동일한 디자인 언어를 유지합니다.

단순히 width만 줄이는 방식으로 Responsive를 구현하지 않습니다.

필요한 경우:

- Layout 변경
- Grid 변경
- Typography 조정
- Navigation 변경
- Component stacking

을 수행합니다.

---

# 17. CHARACTER-FIRST UI

캐릭터 중심 화면에서는
캐릭터가 시각적 주인공이어야 합니다.

UI가 캐릭터를 가리지 않습니다.

특히:

- Character
- Growth
- Emotion
- Action

요소는 명확히 구분합니다.

캐릭터 주변에는 충분한 whitespace를 둡니다.

---

# 18. UI DEPTH

평면적인 UI보다는
필요한 영역에서 적절한 depth를 사용합니다.

Layer:
Background
→ Surface
→ Card
→ Floating Element
→ Modal
→ Tooltip

각 elevation 단계는 시각적으로 구별되어야 합니다.

---

# 19. MICRO INTERACTION

사용자의 행동에는 즉각적인 시각적 피드백을 제공합니다.

예:

Button 클릭
→ press
→ feedback

Card hover
→ subtle elevation

Character action
→ state change

Progress 증가
→ animated transition

단, 모든 UI를 움직이게 하지 않습니다.

---

# 20. ANIMATION RELATIONSHIP

UI animation은 캐릭터 animation과 충돌하지 않아야 합니다.

UI는 캐릭터보다 느리고 안정적인 motion을 사용합니다.

예:

UI:
ease-out
200~300ms

Character:
organic motion
300~1200ms

상황에 따라 달라질 수 있지만
전체 화면의 motion language는 일관되어야 합니다.

---

# 21. MODAL / OVERLAY

Modal은 화면 위에 별도의 시각 계층을 형성합니다.

Backdrop
→ Modal
→ Content
→ Action

순서를 유지합니다.

Backdrop이 너무 강해서 캐릭터나 중요한 콘텐츠를 완전히 죽이지 않도록 합니다.

---

# 22. EMPTY / LOADING / ERROR STATES

완성된 UI에는 정상 상태만 존재하지 않습니다.

다음 상태도 디자인합니다.

- Loading
- Empty
- Error
- Success
- Disabled
- Offline

기능이 없는 것처럼 보이는 빈 화면을 만들지 않습니다.

---

# 23. ACCESSIBILITY

최소한 다음을 유지합니다.

- 충분한 contrast
- 읽을 수 있는 font size
- 명확한 interactive target
- focus visibility
- 상태의 시각적 구분

색상만으로 상태를 전달하지 않습니다.

---

# 24. DO NOT

다음 행동은 기본적으로 금지합니다.

- 임의의 색상 추가
- 임의의 폰트 추가
- 랜덤 spacing
- 랜덤 radius
- 지나치게 많은 shadow
- 지나치게 많은 gradient
- UI마다 다른 button style
- UI마다 다른 card style
- 이유 없는 animation
- 이유 없는 decoration
- 과도한 glassmorphism
- 과도한 neon effect

---

# 25. COMPONENT REUSE

동일한 역할의 UI는 재사용합니다.

Button
Card
Modal
Input
Badge
Progress
Tooltip
Tabs
Navigation

등을 각각 독립적인 Component로 관리합니다.

페이지마다 비슷한 UI를 복사해서 새로 만들지 않습니다.

---

# 26. DESIGN QA

모든 UI 작업 후 다음을 검사합니다.

- Alignment
- Spacing
- Typography
- Contrast
- Component consistency
- Responsive
- Hover
- Active
- Disabled
- Focus
- Animation
- Character visibility

그리고 반드시 전체 화면에서 확인합니다.

---

# 27. FINAL STANDARD

최종 UI는 다음 질문에 YES여야 합니다.

"한눈에 무엇이 중요한지 알 수 있는가?"

"모든 요소가 같은 브랜드처럼 보이는가?"

"간격이 의도적으로 설계되어 있는가?"

"캐릭터와 UI가 서로 경쟁하지 않는가?"

"누가 봐도 임시 구현물이 아니라 완성된 제품처럼 보이는가?"

디자인 구현보다 시각적 완성도를 우선합니다.