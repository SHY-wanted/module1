@AGENTS.md
# PROJECT AGENT / HARNESS INSTRUCTION
# CLAUDE.md

이 문서는 이 프로젝트에서 Claude Code가 수행하는 모든 작업의 최상위 프로젝트 지침이다.

작업 시작 전 관련 SKILL.md, DESIGN_SYSTEM.md, ASSET_PIPELINE.md를 확인하고 반드시 해당 규칙을 준수한다.
이 프로젝트는 단순한 웹앱 구현 프로젝트가 아니라
캐릭터 기반 인터랙티브 서비스의 UI, Character Asset, Color Customization,
Animation, Growth System을 통합적으로 개발하는 프로젝트입니다.

이 문서는 AI Agent가 프로젝트를 수정할 때 따라야 하는
최상위 작업 규칙(Harness Rule)입니다.

AI는 단순히 사용자의 요청을 실행하는 것이 아니라
프로젝트에 이미 존재하는 규칙과 Asset을 보존하면서
필요한 범위만 정확하게 수정해야 합니다.

============================================================
0. CORE PRINCIPLE
============================================================

가장 중요한 원칙:

"기존에 정상적으로 작동하는 것을 절대 함부로 건드리지 않는다."

"원인을 모르는 상태에서 대규모 수정하지 않는다."

"원본 Asset을 훼손하지 않는다."

"SKILL.md와 Design Document를 먼저 읽고 작업한다."

"작업 결과를 반드시 검증한다."

"문제가 해결되지 않았으면 완료했다고 말하지 않는다."

"시각적 문제가 발생했을 때 임의로 이미지를 다시 만들지 않는다."

"수정 범위는 사용자가 요청한 문제에 필요한 최소 범위로 제한한다."


============================================================
1. MANDATORY DOCUMENTS
============================================================

모든 작업 시작 전에 프로젝트 내 다음 문서를 확인해야 합니다.

필수:

.claude/skills/ui/SKILL.md
.claude/skills/character/SKILL.md
.claude/skills/animation/SKILL.md

docs/DESIGN_SYSTEM.md
docs/ASSET_PIPELINE.md

프로젝트에 실제 경로가 다르면
먼저 실제 파일 위치를 탐색하여 확인합니다.

작업 내용에 따라 필요한 Skill을 선택합니다.

UI 관련
→ UI/SKILL.md
→ DESIGN_SYSTEM.md

Character / PNG / Mask / Color 관련
→ CHARACTER/SKILL.md
→ ASSET_PIPELINE.md

Animation 관련
→ ANIMATION/SKILL.md
→ CHARACTER/SKILL.md
→ ASSET_PIPELINE.md

복합 작업
→ 관련 Skill을 모두 읽고 상충 여부를 확인한 뒤 작업


============================================================
2. SKILL IS AUTHORITY
============================================================

SKILL.md는 단순 참고자료가 아닙니다.

프로젝트 작업 규칙으로 취급합니다.

사용자가 새로운 작업을 요청했을 때
SKILL과 충돌하는 방식으로 구현하지 않습니다.

필요한 경우:

USER REQUEST
+
SKILL
+
DESIGN SYSTEM
+
ASSET PIPELINE

을 함께 판단합니다.

기존 구현보다 더 좋은 방법을 생각했다는 이유만으로
현재 구조를 임의로 갈아엎지 않습니다.


============================================================
3. WORKFLOW
============================================================

모든 작업은 반드시 다음 단계로 진행합니다.

ANALYZE
→ LOCATE
→ UNDERSTAND
→ PLAN
→ MODIFY
→ TEST
→ VISUAL QA
→ REGRESSION CHECK
→ REPORT


============================================================
4. STEP 1 — ANALYZE
============================================================

작업 시작 즉시 코드를 수정하지 않습니다.

먼저 다음을 확인합니다.

- 프로젝트 구조
- 관련 파일
- 관련 Component
- 관련 Asset
- 관련 Mask
- 관련 CSS
- 관련 Animation
- State
- localStorage
- 이미 존재하는 구현
- 현재 정상적으로 작동하는 부분

"어떤 파일을 수정해야 하는가?"
를 먼저 판단합니다.


============================================================
5. STEP 2 — LOCATE
============================================================

사용자가 설명한 문제가
실제로 어떤 파일 / 함수 / Asset에서 발생하는지 확인합니다.

예:

가방 색상 오류
→ BAG MASK / COLOR PROCESSING 확인

눈 경계선
→ EYE MASK / BODY MASK / EDGE PROCESSING 확인

캐릭터 잘림
→ Animation Container / Overflow / Transform 확인

성장 오류
→ Growth State / Stage Logic 확인

절대 문제 설명만 보고
임의의 파일을 수정하지 않습니다.


============================================================
6. STEP 3 — ROOT CAUSE ANALYSIS
============================================================

문제가 발생했을 때
현상만 보고 바로 수정하지 않습니다.

먼저 원인을 분류합니다.

가능한 원인:

- Original Asset
- Alpha
- Mask
- Mask Overlap
- Mask Gap
- Fixed Area
- Color Processing
- Blend
- Layer Order
- Bounding Box
- Anchor
- Transform
- Overflow
- CSS
- State
- localStorage
- Animation Conflict

가능하면 가장 직접적인 원인을 먼저 수정합니다.


============================================================
7. STEP 4 — PLAN
============================================================

수정 전에 작업 범위를 명확히 합니다.

PLAN에는 다음을 포함합니다.

- 수정 대상 파일
- 수정 대상 함수 / Component
- 수정 이유
- 예상 영향 범위
- 건드리지 않을 영역
- 검증 방법

계획이 지나치게 큰 경우
더 작은 변경으로 분리합니다.


============================================================
8. MINIMAL CHANGE RULE
============================================================

문제를 해결하기 위해
가장 작은 범위의 변경을 우선합니다.

예:

BAG 문제
→ BAG 관련 로직만 수정

EYE 문제
→ EYE 관련 로직만 수정

Animation 문제
→ Animation 관련 로직만 수정

Growth 문제
→ Growth 관련 로직만 수정

전체 시스템을 재작성하는 방식은
명확한 필요성이 있을 때만 허용합니다.


============================================================
9. GOLDEN ASSET RULE
============================================================

다음 파일은 GOLDEN ASSET으로 취급합니다.

public/stage_0_egg.png
public/stage_1_child.png
public/stage_2_teen.png
public/stage_3_adult.png

원본 PNG를 직접 수정하지 않습니다.

다음 작업은 금지합니다.

- overwrite
- crop
- 재생성
- 재압축
- 색상 영구 변경
- 배경 추가
- 투명 영역 제거
- 다른 이미지로 대체


============================================================
10. MASK SAFETY
============================================================

Mask를 수정할 때 반드시 확인합니다.

- Shape
- Pixel Membership
- Alpha
- Overlap
- Gap
- Edge
- Anti-Aliasing

무작정 Mask를 크게 만들지 않습니다.

문제를 해결하기 위해
다른 객체 영역을 침범하는 Mask를 만들면 안 됩니다.


============================================================
11. CHARACTER COLOR RULE
============================================================

현재 Character Color Customization 구조를 유지합니다.

Stage별 허용 영역:

Stage 0
- BODY
- LEAF

Stage 1
- BODY
- EYES
- LEAF

Stage 2
- BODY
- EYES
- LEAF
- WALLET

Stage 3
- BODY
- EYES
- LEAF
- BAG

COIN
→ 항상 원본 Gold 유지

MOUTH
→ Fixed

기타 Fixed 영역
→ Color Customization에서 제외


============================================================
12. FIXED AREA RULE
============================================================

Fixed 영역은 다른 색상 처리의 영향을 받으면 안 됩니다.

예:

- Mouth
- Coin
- 특정 Black 영역
- 특정 White 영역
- Eye Highlight
- 기타 디자인상 보호 영역

BODY recolor가 Fixed Pixel에 영향을 주면 오류입니다.


============================================================
13. FIXED COLOR RULE
============================================================

현재 프로젝트에서 지정된 Fixed Color를 정확히 유지합니다.

Black
→ #18191A

White
→ #FFFFFF

일반적인 Color Processing 때문에
Fixed Color의 Hue가 변하면 안 됩니다.


============================================================
14. COLOR PROCESSING
============================================================

색상 변경 시 원본의:

- Shadow
- Highlight
- Gradient
- Luminance
- Volume
- Material

을 최대한 유지합니다.

단순 flat replacement로
캐릭터의 3D 느낌을 제거하지 않습니다.


============================================================
15. EDGE RULE
============================================================

커스텀 색상 때문에 새로운 Outline이 생성되면 안 됩니다.

다음과 같은 현상은 오류입니다.

BODY
→ 보라색 선
→ BAG

BODY
→ 청록색 선
→ EYES

이런 선이 원본에 존재하지 않았다면
Mask / Alpha / Blend / Processing 문제로 취급합니다.

Original Outline
→ 유지

Runtime Artifact
→ 제거


============================================================
16. ANIMATION SAFETY
============================================================

Animation 때문에 원본 Character Asset이 깨지면 안 됩니다.

다음은 항상 검사합니다.

- Crop
- Overflow
- Clip
- Alpha
- Transform
- Transform Origin
- Anchor
- Parent
- Child Relationship
- Bounding Box


============================================================
17. CHARACTER ANIMATION GOALS
============================================================

최종 Character는
단순히 PNG가 움직이는 것이 아니라
살아있는 다마고치처럼 느껴져야 합니다.

공통:

- Floating
- Idle
- Blink
- Expression

Stage 0:

- Egg Shake

Stage 1:

- Cute / Playful Action

Stage 2:

- Wallet / Account Book Action

Stage 3:

- Coin Throw / Catch


============================================================
18. ANIMATION HIERARCHY
============================================================

전체 캐릭터의 움직임은
Character Root를 기준으로 처리합니다.

가능하면:

CharacterRoot
├── Character
├── Expression
├── Accessory
├── Coin
└── Shadow

구조를 유지합니다.

서로 다른 Animation이 동일 Transform 값을 동시에 수정하여
충돌하지 않도록 합니다.


============================================================
19. NO CROPPING ANIMATION
============================================================

Animation 구현을 위해
원본 PNG를 Crop하지 않습니다.

캐릭터의 움직임 때문에
이미지가 잘리지 않도록
Container와 Viewport를 충분히 확보합니다.


============================================================
20. STAGE SYSTEM PROTECTION
============================================================

Growth State와 Selected Character State를
절대로 혼동하지 않습니다.

maxStage
→ 사용자가 도달한 최고 Stage

selectedStage
→ 현재 표시하고 있는 Stage

stageProgress
→ 각 Stage의 성장 진행도

maxStage는
캐릭터 선택 변경 때문에 내려가면 안 됩니다.

selectedStage는
도달한 Stage 범위 안에서 자유롭게 변경할 수 있습니다.


============================================================
21. GROWTH RULE
============================================================

성장은 Stage별 개별 Progress를 사용합니다.

예:

Stage 0
0 → 100%

100% 도달
→ Stage 1

Stage 1 Progress
→ 0%

다시 100%
→ Stage 2

Stage 2
→ 100%

Stage 3
→ Growth Complete

Stage 3에서는
추가 성장 버튼을 비활성화합니다.


============================================================
22. STATE PERSISTENCE
============================================================

다음 값은 LocalStorage에 저장될 수 있습니다.

- characterMaxStage
- characterSelectedStage
- characterStageProgress
- characterColors

Stage를 변경하거나
캐릭터를 다시 선택해도
기존 Growth Progress와 Color State를 임의로 초기화하지 않습니다.


============================================================
23. NO UNREQUESTED RESET
============================================================

사용자가 요청하지 않았다면:

- Growth Reset
- Color Reset
- Stage Reset
- Character Reset
- localStorage Reset

을 만들거나 실행하지 않습니다.


============================================================
24. UI PROTECTION
============================================================

UI 수정 시 Character 영역과
기존 Growth 기능을 손상시키지 않습니다.

특히:

- Progress
- Stage Selection
- Customization
- Character Display

간의 관계를 유지합니다.


============================================================
25. VISUAL FIRST PRINCIPLE
============================================================

기능이 작동하더라도
시각적으로 부자연스럽다면 완료로 판단하지 않습니다.

특히 다음을 확인합니다.

- 색상 경계
- 누끼
- 그림자
- 하이라이트
- Mask Artifact
- Pixel Edge
- Character Proportion
- Alignment
- Animation Smoothness


============================================================
26. VISUAL QA
============================================================

시각 작업 후 다음 단계로 확인합니다.

100%
→ 실제 화면

200%
→ Pixel / Edge / Mask

Full Screen
→ 전체 Composition

Animation
→ 시작 / 중간 / 종료 Frame

가능하면 모든 Stage를 확인합니다.


============================================================
27. REGRESSION TEST
============================================================

작업 후 최소 다음을 확인합니다.

- Character Selection
- Stage Switching
- Growth Progress
- Color Customization
- LocalStorage
- Animation
- UI Rendering

기존 기능이 깨졌다면 작업을 완료 처리하지 않습니다.


============================================================
28. GIT SAFETY
============================================================

중요한 변경 전에는
현재 Git 상태를 먼저 확인합니다.

필요한 경우:

git status
git log --oneline

을 확인합니다.

대규모 수정 전에는
가능하면 현재 정상 상태를 Commit으로 보존합니다.

권장:

git add .
git commit -m "checkpoint before visual revision"


============================================================
29. GIT ROLLBACK RULE
============================================================

수정 결과가 기존보다 나빠지면
계속 덧붙여 수정하지 않습니다.

먼저:

git status
git log --oneline

으로 상태를 확인합니다.

마지막 정상 Commit으로 돌아갈 수 있는지 판단합니다.

Rollback이 필요한 경우
사용자의 기존 정상 상태를 우선 보존합니다.


============================================================
30. DO NOT OVERWRITE WORKING SYSTEMS
============================================================

이미 정상 작동하는 시스템을
다른 문제를 해결하기 위해 수정하지 않습니다.

예:

BAG 문제
→ Growth 수정 금지

EYE 문제
→ localStorage 수정 금지

Animation 문제
→ Color State 수정 금지

UI 문제
→ Character Asset 수정 금지


============================================================
31. IMAGE GENERATION RESTRICTION
============================================================

기존 Character Asset이 이미 존재한다면
문제 해결을 위해 새로운 AI 이미지 생성으로
캐릭터를 대체하지 않습니다.

Original Asset을 최우선으로 사용합니다.

새로운 이미지를 생성해야 하는 경우에도
기존 Asset의 디자인 언어와 Silhouette를 유지해야 합니다.


============================================================
32. TOOL / CODE RESTRICTION
============================================================

문제를 해결하기 위해
필요하지 않은 라이브러리를 새로 추가하지 않습니다.

현재 구조로 해결 가능한 문제라면
새로운 dependency를 추가하지 않습니다.

새 dependency가 필요한 경우
왜 필요한지 먼저 판단합니다.


============================================================
33. NO BLIND REFACTORING
============================================================

사용자가 기능 하나를 수정해달라고 했을 때
코드 전체를 리팩터링하지 않습니다.

예:

"가방 경계 수정"
→ 가방 경계 수정

"눈 깜박임 수정"
→ 눈 깜박임 수정

"성장 Progress 수정"
→ 성장 Progress 수정

관련 없는 코드의 구조 개선은
현재 작업과 분리합니다.


============================================================
34. ERROR HANDLING
============================================================

문제가 해결되지 않았다면
임의로 성공했다고 판단하지 않습니다.

다음 내용을 명확하게 보고합니다.

- 발견한 문제
- 원인
- 수정한 파일
- 아직 남은 문제
- 추가로 필요한 확인


============================================================
35. USER-PROVIDED SCREENSHOT
============================================================

사용자가 스크린샷을 제공하면
그 이미지를 실제 문제의 Reference로 사용합니다.

스크린샷과 현재 구현이 다르다면
파일을 추측하지 말고
프로젝트에서 실제 Asset / Component를 찾아 연결합니다.

이미지의 특정 위치가 문제로 지정되면
전체 디자인을 다시 만드는 것이 아니라
해당 위치를 기준으로 원인을 추적합니다.


============================================================
36. SCREENSHOT-BASED QA
============================================================

사용자가 제공한 이미지와
현재 구현 결과를 비교할 때 다음을 확인합니다.

- Silhouette
- Position
- Scale
- Color
- Edge
- Shadow
- Highlight
- Object Connection
- Pixel Artifact
- Clipping

특정 부분의 위치가 명확하게 지정된 경우
그 부분을 최우선으로 확인합니다.


============================================================
37. WHEN UNCERTAIN
============================================================

문제의 위치나 의도가 불명확하면
대규모 수정을 하지 않습니다.

다음 중 하나를 우선합니다.

1. 파일 구조 조사
2. Asset 확인
3. 관련 코드 확인
4. 사용자에게 정확한 위치 질문

추측으로 이미지를 수정하지 않습니다.


============================================================
38. CHANGE BOUNDARY
============================================================

모든 작업은 명확한 변경 범위를 가져야 합니다.

예:

TARGET:
stage_3_adult_bag_mask.png

DO:
bag edge correction

DO NOT:
eye mask
body mask
growth
localStorage
UI

이 원칙을 모든 작업에 적용합니다.


============================================================
39. TASK EXECUTION TEMPLATE
============================================================

사용자가 새로운 작업을 요청하면
내부적으로 다음 구조를 따릅니다.

TASK
→ 사용자의 요청

APPLICABLE SKILLS
→ 어떤 SKILL을 적용하는가

TARGET FILES
→ 어떤 파일을 수정하는가

ROOT CAUSE
→ 문제가 왜 발생했는가

SCOPE
→ 무엇을 수정하는가

NON-GOALS
→ 무엇을 수정하지 않는가

IMPLEMENTATION
→ 실제 수정

VALIDATION
→ 결과 확인

REGRESSION
→ 기존 기능 확인

FINAL REPORT
→ 변경사항 요약


============================================================
40. TASK START GATE
============================================================

작업 시작 전에 반드시 다음 질문에 답할 수 있어야 합니다.

1. 무엇을 수정하는가?
2. 왜 수정하는가?
3. 어떤 Skill을 사용하는가?
4. 어떤 파일을 수정하는가?
5. 어떤 파일은 수정하지 않는가?
6. 어떻게 성공 여부를 확인하는가?

하나라도 불명확하면
추가 분석부터 수행합니다.


============================================================
41. TASK COMPLETION GATE
============================================================

작업 완료라고 판단하기 전에 반드시 확인합니다.

[ ] 요청한 문제가 해결되었는가?
[ ] Original Asset이 변경되지 않았는가?
[ ] 다른 Mask가 침범되지 않았는가?
[ ] 기존 기능이 유지되는가?
[ ] Console Error가 없는가?
[ ] Animation 문제가 없는가?
[ ] UI가 깨지지 않았는가?
[ ] Stage별 문제가 없는가?
[ ] LocalStorage가 유지되는가?
[ ] 시각적으로 자연스러운가?

모든 항목을 가능한 범위에서 검증한 뒤 완료합니다.


============================================================
42. VISUAL QUALITY BAR
============================================================

최종 결과는 다음 수준을 목표로 합니다.

Photoshop
→ Clean Edge

Illustrator
→ Clean Shape

Figma
→ Consistent UI System

After Effects
→ Natural Motion

Production
→ Stable Runtime

즉,

"코드상으로 작동한다"

만으로는 충분하지 않습니다.

"실제 제품처럼 자연스럽다"

까지 만족해야 합니다.


============================================================
43. HARNESS PRIORITY
============================================================

우선순위는 다음과 같습니다.

1. Original Asset 보호
2. User Request
3. SKILL.md
4. Design System
5. Asset Pipeline
6. Existing Working Behavior
7. Minimal Change
8. Visual Quality
9. Performance
10. Refactoring

단, User Request가 Original Asset 파괴를 요구하는 경우
기존 Asset을 직접 덮어쓰지 않고
안전한 Derived / Runtime 방식으로 해결합니다.


============================================================
44. FINAL RULE
============================================================

절대로 다음 방식으로 작업하지 않습니다.

"일단 크게 고쳐보고 보자."

대신:

"현재 상태를 이해한다."
↓
"문제의 원인을 찾는다."
↓
"필요한 범위를 정한다."
↓
"최소한만 수정한다."
↓
"결과를 검증한다."
↓
"기존 기능의 회귀를 확인한다."

이 프로젝트의 모든 AI 작업은
이 원칙을 따릅니다.