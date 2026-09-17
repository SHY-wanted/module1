# CHARACTER DESIGN SKILL
## Photoshop / Illustrator / Adobe 기반 캐릭터 Asset 관리 규칙

이 문서는 프로젝트의 모든 캐릭터 이미지와
캐릭터 시각 요소를 관리하기 위한 핵심 규칙입니다.

캐릭터 PNG는 단순 이미지가 아니라
Photoshop의 Layer / Mask / Alpha / Group으로 구성된
하나의 디자인 Asset으로 취급합니다.

목표:

"원본 캐릭터의 품질을 절대 훼손하지 않으면서
Runtime에서 색상, 표정, 성장, 행동을 자연스럽게 변경한다."

---

# 1. ORIGINAL ASSET IS SACRED

원본 PNG는 절대로 직접 수정하지 않습니다.

Original PNG
→ Source Asset

Runtime Processing
→ Separate Layer / Mask

구조로 관리합니다.

금지:

- 원본 PNG overwrite
- 원본 PNG crop
- 원본 PNG 재생성
- 원본 PNG 재압축
- 원본 PNG 색상 변경 후 저장
- 원본 PNG 배경 변경
- 원본 PNG resize 후 저장

---

# 2. CHARACTER LAYER MODEL

캐릭터는 논리적으로 다음 Layer 구조로 간주합니다.

Character
├── Body
├── Eyes
│   ├── Iris
│   └── Highlight
├── Mouth
├── Blush
├── Leaf
├── Wallet
├── Bag
├── Coin
├── Shadow
└── Fixed

실제 PNG가 하나이더라도
논리적인 Layer 구조를 유지합니다.

---

# 3. LAYER OWNERSHIP

각 Layer는 자신에게 해당하는 픽셀만 책임집니다.

BODY
→ 몸

EYES
→ 눈

LEAF
→ 잎사귀

WALLET
→ 가계부

BAG
→ 가방

COIN
→ 코인

MOUTH
→ 입

BLUSH
→ 볼터치

FIXED
→ 사용자 수정이 금지된 영역

한 Layer의 색상을 변경했을 때
다른 Layer가 영향을 받아서는 안 됩니다.

---

# 4. MASK PRINCIPLE

Mask는 실제 객체의 Pixel membership을 표현합니다.

Bounding Box를 Mask로 사용하지 않습니다.

금지:

- 사각형 Mask
- 대충 자른 Mask
- 주변 객체 포함
- threshold만으로 객체 판별
- dark pixel = outline이라는 단순 규칙

Mask는 실제 캐릭터 구조를 기준으로 제작합니다.

---

# 5. MASK EXCLUSIVITY

Layer간 Mask는 기본적으로 서로 겹치지 않습니다.

예:

BODY ∩ BAG = 0
BODY ∩ WALLET = 0
BODY ∩ EYES = 0
BODY ∩ LEAF = 0

단, 디자인상 실제로 겹쳐야 하는 경우는
명확한 Layer hierarchy를 정의합니다.

---

# 6. ALPHA

PNG의 Alpha Channel을 최우선으로 존중합니다.

Transparent
Semi-transparent
Opaque

영역을 구분합니다.

투명 픽셀을 임의로 채우지 않습니다.

---

# 7. ANTI-ALIASING

캐릭터 외곽의 Anti-Aliasing 픽셀은 중요합니다.

다음과 같은 현상을 만들면 안 됩니다.

- 흰색 halo
- 검은색 halo
- 보라색 halo
- 청록색 halo
- jagged edge
- pixel staircase

Mask 경계는 가능한 경우
alpha-weighted 방식으로 처리합니다.

---

# 8. OUTLINE POLICY

캐릭터의 원본 Outline은 유지합니다.

하지만 색상 변경 때문에 새롭게 발생한
Mask Boundary Artifact는 제거합니다.

Original Outline
= KEEP

Mask Artifact
= REMOVE

---

# 9. COLOR CUSTOMIZATION

캐릭터 색상은 Layer 단위로 처리합니다.

예:

BODY
→ selected body color

EYES
→ selected eye color

LEAF
→ selected leaf color

BAG
→ selected bag color

WALLET
→ selected wallet color

---

# 10. SHADING PRESERVATION

색상을 변경할 때
원본의 입체감을 제거하면 안 됩니다.

원본의:

- Highlight
- Shadow
- Gradient
- Gloss
- Volume

을 유지해야 합니다.

단순 색상 교체보다는
Base Color + Original Luminance 방식의
recoloring을 우선합니다.

---

# 11. FIXED AREA

Fixed Area는 절대로 BODY 색상 변경의 영향을 받으면 안 됩니다.

대표:

- Mouth
- Coin
- Highlight
- 특정 Black 영역
- 특정 White 영역
- Decoration

Fixed 영역은 별도의 보호 영역으로 관리합니다.

---

# 12. PURE COLOR

정확한 색상이 필요한 Fixed 영역은
명시적인 Color Token을 사용합니다.

예:

BLACK
#18191A

WHITE
#FFFFFF

Color processing이 해당 색상을
다른 Hue로 변경하면 안 됩니다.

---

# 13. BLUSH

Blush는 캐릭터 감정 표현 요소입니다.

- 위치 유지
- 크기 유지
- 색상 유지
- 자연스러운 Anti-Aliasing
- stray pixel 제거

를 원칙으로 합니다.

---

# 14. EYE

눈은 캐릭터의 가장 중요한 감정 전달 요소입니다.

눈 Layer는 다음을 구분할 수 있어야 합니다.

- Eye Base
- Iris
- Highlight
- Fixed Elements

Highlight가 Iris recoloring에 포함되면 안 됩니다.

---

# 15. MOUTH

Mouth는 Fixed Area로 처리할 수 있습니다.

Body color 변경에 따라
입의 원본 픽셀이 변색되면 안 됩니다.

Mouth의:

- shape
- shadow
- highlight
- anti-aliasing

을 유지합니다.

---

# 16. ACCESSORIES

Wallet
Bag
Coin

등은 독립적인 Asset처럼 취급합니다.

특히 Body Mask가 Accessory를 침범하면 안 됩니다.

---

# 17. COIN

Coin은 원본 디자인을 유지합니다.

- Gold color 유지
- shape 유지
- highlight 유지
- size 유지
- position 유지

Animation을 위해 움직일 수 있지만
디자인 자체는 수정하지 않습니다.

---

# 18. CHARACTER SILHOUETTE

Character silhouette는 항상 일정해야 합니다.

색상만 변경했는데
캐릭터 외곽 형태가 달라 보이면 실패입니다.

---

# 19. CROP PROTECTION

Runtime animation 때문에
캐릭터 이미지가 잘려서는 안 됩니다.

특히:

- top
- bottom
- left
- right

를 모두 검사합니다.

Character Canvas는
Animation 범위를 충분히 포함해야 합니다.

---

# 20. SCALE

캐릭터 Scale을 변경하더라도
원본 비율을 유지합니다.

비정상적인:

scaleX ≠ scaleY

는 사용하지 않습니다.

단, 의도적인 squash/stretch animation은
Animation Skill 규칙을 따릅니다.

---

# 21. POSITION

캐릭터의 Position 변경은
기준 Anchor를 중심으로 처리합니다.

이미지를 매번 Crop하거나
새로운 좌표계로 재생성하지 않습니다.

---

# 22. STAGE CONSISTENCY

Stage 0
Stage 1
Stage 2
Stage 3

모두 동일한 Visual Language를 유지합니다.

성장에 따라:

- 크기
- 형태
- accessory
- 행동

등이 바뀔 수 있지만
Material / Rendering Style은 일관되어야 합니다.

---

# 23. CHARACTER QUALITY CHECK

모든 수정 후 반드시 확인:

100% 확대
→ Pixel / Edge

200% 확대
→ Mask / Anti-aliasing

전체 화면
→ Visual balance

모든 단계에서 자연스러운지 확인합니다.

---

# 24. BEFORE EDITING

수정 전에 반드시:

1. Original Asset 확인
2. Mask 확인
3. Alpha 확인
4. Fixed Area 확인
5. Layer 관계 확인
6. 현재 정상 영역 확인
7. 문제 영역 확인

후에만 수정합니다.

---

# 25. MINIMAL CHANGE

문제가 Body라면 Body만 수정합니다.

Bag 문제면 Bag만 수정합니다.

Eye 문제면 Eye만 수정합니다.

Character 전체를 재생성하거나
전체 Mask를 다시 만드는 것은
마지막 수단입니다.

---

# 26. NEVER DESTROY WORKING ASSETS

이미 정상 작동하는 부분을
다른 문제를 해결한다는 이유로 변경하지 않습니다.

특히:

- Growth
- Stage
- Selection
- localStorage
- Color System

을 이미지 문제 때문에 수정하지 않습니다.

---

# 27. FINAL QUALITY

좋은 캐릭터 Asset은

"색상을 바꿔도 원본처럼 자연스러워야 하고"

"애니메이션을 적용해도 누끼가 깨지지 않아야 하며"

"어떤 Stage에서든 같은 세계관처럼 보여야 하고"

"Mask와 시스템의 존재가 시각적으로 느껴지지 않아야 합니다."

사용자는 Mask가 존재한다는 사실을
눈치채면 안 됩니다.