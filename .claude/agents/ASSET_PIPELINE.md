# ASSET PIPELINE
## Adobe / Photoshop / Illustrator 기반 Character Asset Production Pipeline

이 문서는 프로젝트의 모든 이미지와 캐릭터 Asset이
Original Asset에서 Runtime Animation까지
어떤 절차를 거쳐 사용되는지 정의합니다.

목표:

Original Asset
→ Inspect
→ Preserve
→ Logical Layer
→ Mask
→ Fixed Area
→ Color Processing
→ Composite
→ Runtime
→ Animation
→ QA

AI가 작업하더라도 동일한 Asset 관리 방식을 따라야 합니다.


------------------------------------------------------------
1. MASTER ASSET
------------------------------------------------------------

모든 캐릭터 Asset에는 Master Asset이 존재해야 합니다.

예:

public/
├── stage_0_egg.png
├── stage_1_child.png
├── stage_2_teen.png
└── stage_3_adult.png

Master Asset은 Source of Truth입니다.


------------------------------------------------------------
2. SOURCE OF TRUTH
------------------------------------------------------------

항상 Original PNG를 최종 시각적 기준으로 사용합니다.

Runtime 결과가 Original과 다르게 보인다면
먼저 Runtime Processing을 조사합니다.

원본을 수정해서 Runtime 문제를 해결하지 않습니다.


------------------------------------------------------------
3. ORIGINAL IMMUTABILITY
------------------------------------------------------------

Original PNG는 기본적으로 수정 불가 Asset입니다.

금지:

- overwrite
- crop
- resize 후 저장
- 재압축
- 색상 영구 변경
- 배경 추가
- 재렌더링
- 투명 영역 채우기
- 원본 파일에 직접 Drawing

수정이 필요하면 Derived Asset 또는 Runtime Processing을 사용합니다.


------------------------------------------------------------
4. ASSET INSPECTION
------------------------------------------------------------

새 Asset을 사용할 때 먼저 다음을 확인합니다.

- Width
- Height
- Resolution
- Color Mode
- Alpha Channel
- Transparent Area
- Bounding Box
- Visual Center
- Silhouette
- Edge Quality


------------------------------------------------------------
5. ALPHA CHANNEL
------------------------------------------------------------

PNG의 Alpha Channel을 최우선으로 존중합니다.

구분:

0
→ Fully Transparent

0 < Alpha < 255
→ Semi Transparent

255
→ Opaque

투명 픽셀을 임의로 채우지 않습니다.


------------------------------------------------------------
6. BOUNDING BOX
------------------------------------------------------------

Image Canvas와 Character Bounding Box를 구분합니다.

Canvas
→ 전체 이미지 영역

Bounding Box
→ 실제 캐릭터의 비투명 영역

Animation이나 Layout 계산 시
두 개를 혼동하지 않습니다.


------------------------------------------------------------
7. VISUAL CENTER
------------------------------------------------------------

Canvas의 중심과
Character의 시각적 중심은 다를 수 있습니다.

필요한 경우 Animation Anchor는
Visual Center를 기준으로 설정합니다.


------------------------------------------------------------
8. LOGICAL LAYER MODEL
------------------------------------------------------------

하나의 PNG라도 논리적으로는 다음과 같은 Layer로 관리합니다.

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

실제 파일이 하나의 PNG라 하더라도
작업 방식은 Photoshop의 Layer 구조를 따릅니다.


------------------------------------------------------------
9. LAYER OWNERSHIP
------------------------------------------------------------

각 Layer는 자신에게 해당하는 픽셀만 책임집니다.

BODY
→ Body pixels

EYES
→ Eye pixels

LEAF
→ Leaf pixels

WALLET
→ Wallet pixels

BAG
→ Bag pixels

COIN
→ Coin pixels

MOUTH
→ Mouth pixels

BLUSH
→ Blush pixels

FIXED
→ Non-customizable pixels


------------------------------------------------------------
10. LAYER ISOLATION
------------------------------------------------------------

Layer를 수정할 때
다른 Layer가 영향을 받으면 안 됩니다.

예:

BODY recolor
→ BAG 변경 금지

BODY recolor
→ WALLET 변경 금지

BODY recolor
→ EYE 변경 금지

BODY recolor
→ MOUTH 변경 금지

BODY recolor
→ COIN 변경 금지


------------------------------------------------------------
11. MASK PRINCIPLE
------------------------------------------------------------

Mask는 실제 객체의 Pixel Membership을 표현합니다.

Mask는 Bounding Box가 아닙니다.

금지:

- Rectangle Mask
- Rough Polygon
- 대략적인 영역 선택
- 다른 객체까지 포함한 Mask
- 단순 Color Threshold만으로 전체 객체 선택
- Dark Pixel = Outline
- Bright Pixel = Object

객체의 실제 Shape, Position, Alpha, Context를 종합해서 만듭니다.


------------------------------------------------------------
12. MASK AUTHORITY
------------------------------------------------------------

각 Mask는 하나의 명확한 객체를 담당합니다.

BODY MASK
→ Body

EYE MASK
→ Eye

LEAF MASK
→ Leaf

WALLET MASK
→ Wallet

BAG MASK
→ Bag


------------------------------------------------------------
13. MASK EXCLUSION
------------------------------------------------------------

BODY Mask에는 필요한 경우 다음 영역을 제외합니다.

BODY
− EYE
− MOUTH
− BLUSH
− BAG
− WALLET
− LEAF
− COIN
− FIXED

이 규칙은 실제 캐릭터 구조에 맞게 조정할 수 있습니다.


------------------------------------------------------------
14. MASK OVERLAP CHECK
------------------------------------------------------------

모든 Mask 생성 후 Overlap을 확인합니다.

예:

BODY ∩ BAG
BODY ∩ WALLET
BODY ∩ EYE
BODY ∩ LEAF
BODY ∩ COIN

의도하지 않은 Overlap은 오류입니다.


------------------------------------------------------------
15. MASK GAP CHECK
------------------------------------------------------------

Overlap뿐 아니라 Gap도 확인합니다.

객체의 일부가 Mask에 포함되지 않으면
다음 문제가 발생할 수 있습니다.

- 원본 색상 노출
- Halo
- Broken Edge
- Unwanted Outline
- Transparent Leakage


------------------------------------------------------------
16. EDGE PROCESSING
------------------------------------------------------------

Mask Edge는 Hard Cut보다
가능한 경우 Soft / Alpha Weighted 방식으로 처리합니다.

예:

100%
90%
75%
50%
25%
0%

처럼 자연스러운 전환을 유지할 수 있습니다.


------------------------------------------------------------
17. ANTI-ALIASING
------------------------------------------------------------

Original Anti-Aliasing 정보를 최대한 보존합니다.

단순 Threshold로
경계 픽셀을 제거하지 않습니다.

특히 다음 문제가 발생하지 않도록 합니다.

- Jagged Edge
- Pixel Staircase
- White Halo
- Black Halo
- Purple Halo
- Cyan Halo


------------------------------------------------------------
18. OUTLINE POLICY
------------------------------------------------------------

Original Asset에 실제로 존재하는 Outline은 유지합니다.

그러나 Runtime 색상 변경 때문에
새로 생성된 Mask Boundary Artifact는 제거합니다.

Original Outline
→ KEEP

Mask Artifact
→ REMOVE


------------------------------------------------------------
19. COLOR PROCESSING
------------------------------------------------------------

색상 커스터마이징은 Layer 단위로 처리합니다.

예:

BODY
→ Selected Body Color

EYES
→ Selected Eye Color

LEAF
→ Selected Leaf Color

WALLET
→ Selected Wallet Color

BAG
→ Selected Bag Color


------------------------------------------------------------
20. SHADING PRESERVATION
------------------------------------------------------------

Recoloring 후에도 Original의 시각 정보를 유지합니다.

보존:

- Highlight
- Shadow
- Gradient
- Gloss
- Volume
- Reflection
- Material Feel

단순 Flat Color로 덮어버리지 않습니다.


------------------------------------------------------------
21. LUMINANCE PRESERVATION
------------------------------------------------------------

가능한 경우 다음 구조를 우선합니다.

Selected Base Color
+
Original Luminance
+
Original Shading

따라서 캐릭터가 어떤 색이 되더라도
3D 볼륨감이 유지되어야 합니다.


------------------------------------------------------------
22. COLOR REPLACEMENT
------------------------------------------------------------

단순 RGB 치환은 신중하게 사용합니다.

다음 문제가 발생할 수 있습니다.

Original Purple
→ Selected Green

에서 Original Purple의 Hue가 결과에 남으면 안 됩니다.

선택한 색상이 명확하게 기준 색상으로 적용되어야 합니다.


------------------------------------------------------------
23. PURE COLOR / FIXED COLOR
------------------------------------------------------------

정확한 색상이 필요한 영역은 명시적인 색상 Token을 사용합니다.

예:

BLACK
#18191A

WHITE
#FFFFFF

Fixed Color가 존재하는 영역은
일반적인 Hue Shift나 Color Processing으로 변형하지 않습니다.


------------------------------------------------------------
24. FIXED AREA PROTECTION
------------------------------------------------------------

Fixed Area는 Customization으로부터 보호합니다.

예:

- Mouth
- Coin
- Eye Highlight
- Specific Black Area
- Specific White Area
- Decorative Element

BODY recoloring에 의해 Fixed Area가 변색되면 안 됩니다.


------------------------------------------------------------
25. EYE PROTECTION
------------------------------------------------------------

눈은 다음 요소를 논리적으로 구분합니다.

- Eye Base
- Iris
- Highlight
- Outline / Edge
- Fixed Detail

Iris Customization이 Highlight까지 영향을 주면 안 됩니다.


------------------------------------------------------------
26. MOUTH PROTECTION
------------------------------------------------------------

Mouth는 필요한 경우 Fixed Area로 관리합니다.

Body Color 변경으로
Mouth가 변색되면 안 됩니다.

Mouth의 다음 정보를 유지합니다.

- Shape
- Color
- Shading
- Highlight
- Anti-Aliasing


------------------------------------------------------------
27. BLUSH PROTECTION
------------------------------------------------------------

Blush는 감정 표현 요소입니다.

다음 값을 유지합니다.

- Position
- Size
- Shape
- Color
- Softness

Stray Pixel이 발생하면 정리합니다.

원형/타원형의 자연스러운 형태를 유지합니다.


------------------------------------------------------------
28. ACCESSORY ISOLATION
------------------------------------------------------------

Wallet
Bag
Coin

등의 Accessory는 Body와 독립적으로 관리합니다.

BODY Mask가 Accessory 영역에 침범하면 안 됩니다.


------------------------------------------------------------
29. COIN PRESERVATION
------------------------------------------------------------

Coin은 Original Design을 유지합니다.

- Gold Color
- Shape
- Highlight
- Shading
- Size
- Proportion

Animation을 위해 이동할 수 있지만
Asset 디자인 자체를 변경하지 않습니다.


------------------------------------------------------------
30. CHARACTER SILHOUETTE
------------------------------------------------------------

Color Customization이 발생해도
Character Silhouette가 바뀌면 안 됩니다.

색상만 변경되었는데
캐릭터의 형태가 달라 보이면 실패로 판단합니다.


------------------------------------------------------------
31. CROP PROTECTION
------------------------------------------------------------

Runtime과 Animation 중
Character가 잘리면 안 됩니다.

확인:

- Top
- Bottom
- Left
- Right

특히 Animation Container의 Overflow 때문에
캐릭터가 잘리는지 확인합니다.


------------------------------------------------------------
32. SCALE PROTECTION
------------------------------------------------------------

기본적으로:

scaleX = scaleY

비율을 유지합니다.

Stretch / Squash는
Animation 단계에서만 의도적으로 사용합니다.


------------------------------------------------------------
33. ANCHOR POINT
------------------------------------------------------------

각 객체에는 명확한 Anchor Point를 정의합니다.

Character
→ Body Center

Coin
→ Coin Center

Wallet
→ Grip Point

Bag
→ Attachment Point

Anchor 오류는 파츠 분리나
비정상적인 움직임을 만들 수 있습니다.


------------------------------------------------------------
34. ASSET VERSIONING
------------------------------------------------------------

중요한 Asset 변경 전에는
Git Commit을 권장합니다.

예:

git add .
git commit -m "before mask revision"

실험적인 수정은 기존 정상 버전을 보존한 상태에서 수행합니다.


------------------------------------------------------------
35. SMALL CHANGE PRINCIPLE
------------------------------------------------------------

특정 문제가 발생하면
가장 작은 범위부터 수정합니다.

예:

BAG 문제
→ BAG 관련 Mask / Processing만 수정

EYE 문제
→ EYE 관련 Mask / Processing만 수정

BODY 문제
→ BODY 관련 Mask / Processing만 수정

한 문제를 해결하기 위해
전체 Asset을 재생성하지 않습니다.


------------------------------------------------------------
36. NO REGENERATION
------------------------------------------------------------

이미 잘 만들어진 Character Asset을
문제 해결을 위해 AI Image Generation으로 다시 만들지 않습니다.

기존 Original Asset을 보존합니다.


------------------------------------------------------------
37. NO UNNECESSARY FORMAT CONVERSION
------------------------------------------------------------

다음 변환은 명확한 이유가 없으면 수행하지 않습니다.

PNG
→ SVG

PNG
→ JPEG

PNG
→ WebP

특히 Transparency가 필요한 캐릭터는
Alpha Channel을 보존할 수 있는 형식을 사용합니다.


------------------------------------------------------------
38. COMPOSITE TEST
------------------------------------------------------------

다음 순서로 최종 합성을 테스트합니다.

Body
+
Face
+
Leaf
+
Accessory
+
Decoration
+
Shadow

최종 결과의 Silhouette가
Original과 일치해야 합니다.


------------------------------------------------------------
39. OBJECT ISOLATION TEST
------------------------------------------------------------

가능하면 각 Layer를 독립적으로 확인합니다.

Body Only
Eye Only
Leaf Only
Wallet Only
Bag Only
Coin Only

이를 통해 Mask 오류를 조기에 찾습니다.


------------------------------------------------------------
40. RECOLOR REGRESSION TEST
------------------------------------------------------------

커스텀 색상은 최소한 다음을 확인합니다.

Original
→ Purple
→ Blue
→ Green
→ Orange
→ Black

각 색상에서 다음을 검사합니다.

- Leakage
- Halo
- Wrong Hue
- Mask overlap
- Mask gap
- Fixed Area contamination


------------------------------------------------------------
41. EDGE ARTIFACT TEST
------------------------------------------------------------

다음 Artifact를 검사합니다.

- Purple Edge
- Blue Edge
- Cyan Edge
- Green Edge
- Black Edge
- White Halo
- Dark Halo
- Transparent Hole
- Broken Anti-Aliasing
- Pixel Staircase


------------------------------------------------------------
42. ROOT CAUSE ANALYSIS
------------------------------------------------------------

시각적 오류가 발생하면
다음 순서로 원인을 조사합니다.

1. Original Asset
2. Alpha
3. Mask
4. Mask Overlap
5. Mask Gap
6. Blend
7. Color Processing
8. Layer Order
9. Bounding Box
10. Transform
11. Clipping


------------------------------------------------------------
43. RUNTIME PIPELINE
------------------------------------------------------------

권장 전체 구조:

Original PNG
↓
Alpha Inspection
↓
Logical Layer
↓
Mask
↓
Fixed Area
↓
Color Processing
↓
Composite
↓
Runtime Render
↓
Animation
↓
Visual QA


------------------------------------------------------------
44. ANIMATION PREPARATION
------------------------------------------------------------

Animation에 들어가기 전에 반드시 확인합니다.

- Alpha
- Bounding Box
- Anchor
- Silhouette
- Layer Relationship
- Clipping Area

Asset 자체가 정상인지 먼저 확인한 후
Animation을 적용합니다.


------------------------------------------------------------
45. ANIMATION SAFE ASSET
------------------------------------------------------------

Animation 중 다음 문제가 없어야 합니다.

- Crop
- Clipping
- Stretch Artifact
- Tearing
- Halo
- Detached Parts
- Background Leakage


------------------------------------------------------------
46. RUNTIME INTEGRITY
------------------------------------------------------------

Runtime 결과가 Original과 다르면
먼저 다음을 확인합니다.

1. Crop
2. Alpha
3. Mask
4. Blend
5. Color Processing
6. Layer Order
7. Transform
8. Clipping


------------------------------------------------------------
47. VISUAL QA LEVELS
------------------------------------------------------------

각 수정 후 최소 3단계로 확인합니다.

100%
→ 일반적인 시각 상태

200%
→ Edge / Mask / Pixel

Full Screen
→ 전체 Character / Composition / Balance


------------------------------------------------------------
48. ANIMATION QA
------------------------------------------------------------

Animation까지 적용한 뒤 확인합니다.

- Idle
- Blink
- Expression
- Action
- Return

그리고 모든 Stage를 확인합니다.

Stage 0
Stage 1
Stage 2
Stage 3


------------------------------------------------------------
49. REGRESSION CHECK
------------------------------------------------------------

Asset 변경 후 다음 기능도 확인합니다.

- Character Selection
- Growth
- Stage Switching
- Color Customization
- localStorage
- Animation
- UI Rendering


------------------------------------------------------------
50. DO NOT MODIFY WORKING SYSTEMS
------------------------------------------------------------

시각적인 Asset 문제가 발생했다고 해서
정상적으로 작동하는 시스템을 수정하지 않습니다.

예:

BAG 문제
→ Growth 수정 금지

EYE 문제
→ localStorage 수정 금지

Animation 문제
→ Color State 수정 금지

특정 문제와 관련된 범위만 수정합니다.


------------------------------------------------------------
51. BEFORE EDITING RULE
------------------------------------------------------------

AI는 수정 전에 반드시 다음을 분석해야 합니다.

- 문제 Asset
- Original PNG
- 관련 Mask
- Alpha
- Fixed Area
- Layer Relationship
- Runtime Processing
- 현재 정상적으로 작동하는 부분

분석 없이 바로 대규모 수정하지 않습니다.


------------------------------------------------------------
52. GIT SAFETY
------------------------------------------------------------

큰 시각적 변경 전에는
가능하면 Git Commit을 먼저 생성합니다.

예:

git add .
git commit -m "before character asset revision"

여러 문제를 하나의 Commit에 무작정 포함시키지 않습니다.


------------------------------------------------------------
53. COMMIT GRANULARITY
------------------------------------------------------------

가능하면 작은 단위로 Commit합니다.

예:

fix body mask
fix eye mask
fix bag edge
fix wallet mask
fix fixed mouth area
fix color rendering
fix animation clipping

각 Commit은 하나의 변경 목적을 명확하게 가져야 합니다.


------------------------------------------------------------
54. ROLLBACK PRINCIPLE
------------------------------------------------------------

수정 결과가 기존보다 나빠진 경우
추가 수정으로 덮어쓰지 않습니다.

먼저 Git history를 확인하고
마지막 정상 상태로 돌아간 후
문제를 분리해서 다시 수정합니다.


------------------------------------------------------------
55. AI WORKFLOW
------------------------------------------------------------

AI가 Asset 작업을 수행할 때 반드시 다음 순서를 따릅니다.

ANALYZE
→ IDENTIFY
→ PLAN
→ MODIFY
→ TEST
→ VERIFY
→ COMMIT

각 단계에서 변경 범위를 최소화합니다.


------------------------------------------------------------
56. FINAL ACCEPTANCE CRITERIA
------------------------------------------------------------

Asset은 다음 조건을 만족해야 합니다.

- Original Silhouette 유지
- Alpha 정상
- Mask 정확
- Mask overlap 없음
- Mask gap 없음
- 자연스러운 Anti-Aliasing
- 불필요한 Outline 없음
- Halo 없음
- Color Leakage 없음
- Highlight 유지
- Shadow 유지
- Fixed Area 보호
- Accessory 분리 정상
- Animation Clipping 없음
- Runtime에서 Original과 동일한 형태 유지

최종 결과를 보았을 때

"이것이 Mask를 이용해 만들어진 결과"

라는 느낌이 들어서는 안 됩니다.

사용자는 시스템의 내부 구현을 눈치채지 못해야 합니다.


------------------------------------------------------------
57. GOLDEN RULE
------------------------------------------------------------

가장 중요한 규칙:

"원본 Asset을 보호하고,
필요한 부분만 수정하며,
Mask와 Layer의 존재가 최종 이미지에서 느껴지지 않게 한다."

"문제를 고치기 위해 이미 정상인 부분까지
다시 만드는 행동을 하지 않는다."

"시각적 품질이 기능 구현보다 우선한다."