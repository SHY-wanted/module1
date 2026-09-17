# CHARACTER ANIMATION SKILL
## After Effects / Motion Design 기반 자연스러운 캐릭터 애니메이션

이 문서는 캐릭터 애니메이션을
After Effects / Adobe Animate / Motion Design의 원칙을 기반으로
구현하기 위한 규칙입니다.

목표:

"PNG가 움직이는 것"이 아니라
"캐릭터가 살아있는 것처럼 느껴지는 것"

---

# 1. MOTION PHILOSOPHY

애니메이션은 다음 원칙을 따릅니다.

- Timing
- Easing
- Anticipation
- Follow Through
- Overlap
- Squash & Stretch
- Secondary Motion
- Rhythm
- Weight
- Personality

모든 움직임을 동일한 easing으로 처리하지 않습니다.

---

# 2. CHARACTER AS ONE OBJECT

캐릭터 전체 행동은
하나의 Character Root를 기준으로 움직입니다.

CharacterRoot
├── Character Visual
├── Expression
├── Accessories
├── Coin
└── Shadow

Character Root를 움직일 때
캐릭터가 하나의 생명체처럼 함께 이동해야 합니다.

---

# 3. ANCHOR POINT

모든 애니메이션 요소는 Anchor Point를 명확하게 정의합니다.

Character
→ Body Center

Head
→ Neck / Upper Body

Bag
→ Attachment Point

Wallet
→ Hand / Grip Point

Coin
→ Center

Anchor가 잘못되면
파츠가 떠다니거나 분리되어 보일 수 있습니다.

---

# 4. TRANSFORM HIERARCHY

가능하면 parent-child hierarchy를 사용합니다.

예:

CharacterRoot
└── Body
    ├── Eye
    ├── Mouth
    ├── Leaf
    └── Accessory

Accessory를 독립적으로 움직여야 하는 경우에는
명확한 parent와 anchor를 정의합니다.

---

# 5. NO IMAGE CROPPING

Animation을 위해
원본 PNG를 Crop하지 않습니다.

특히 움직임을 만들기 위해
매 프레임 이미지 영역을 잘라내거나
새 PNG를 생성하지 않습니다.

---

# 6. NO ARTIFACTS

애니메이션 중 다음 문제가 발생하면 실패입니다.

- 검은 선
- 흰 선
- 보라색 선
- 청록색 선
- Halo
- Jagged Edge
- Clipping
- Pixel tearing
- Unexpected background
- Detached part

---

# 7. ROOT MOTION

전체 캐릭터의 움직임은
가능하면 CharacterRoot transform으로 처리합니다.

예:

Floating
Shake
Jump
Idle

등은 root motion을 우선합니다.

---

# 8. FLOATING

Floating은 매우 작은 움직임으로 표현합니다.

예:

Y
0
→ +4
→ 0
→ -4
→ 0

실제 값은 화면 크기와 캐릭터 크기에 따라 조정합니다.

목표:

"공중에 떠 있는 생명체"

이지

"위아래로 움직이는 이미지"

가 아닙니다.

---

# 9. BREATHING

가능하면 아주 작은 Scale 변화로
호흡감을 표현할 수 있습니다.

예:

Scale
1
→ 1.01
→ 1

단, 과도한 squash는 금지합니다.

---

# 10. EASING

모든 animation은 linear를 기본값으로 사용하지 않습니다.

예:

Enter
→ ease-out

Return
→ ease-in-out

Floating
→ sine / smooth

Attention
→ slight overshoot

등을 목적에 따라 사용합니다.

---

# 11. BLINK

눈 깜박임은 빠르고 자연스러워야 합니다.

예:

Open
→ Half
→ Closed
→ Open

Blink는 짧게 수행합니다.

매우 일정한 주기로 깜박이지 않도록
약간의 랜덤성을 사용할 수 있습니다.

---

# 12. EXPRESSION

표정은 눈과 입의 관계를 이용합니다.

Expression:

- Happy
- Sad
- Sulky
- Surprise
- Cute

등을 만들 수 있습니다.

표정의 변화가 갑자기 발생하지 않도록
transition을 사용합니다.

---

# 13. EMOTION TIMING

표정은 충분히 유지한 뒤
Idle로 돌아옵니다.

예:

Idle
→ Expression Start
→ Hold
→ Return
→ Idle

표정이 100ms 만에 사라지는 방식은 피합니다.

---

# 14. ANTICIPATION

큰 움직임 전에
작은 준비 동작을 사용할 수 있습니다.

예:

Jump
→ slightly down
→ jump

Coin Throw
→ arm preparation
→ throw

Wallet Action
→ preparation
→ lift
→ hold
→ return

---

# 15. FOLLOW THROUGH

동작 종료 후
작은 잔동작을 사용합니다.

예:

Coin catch
→ body settles

Jump
→ tiny bounce

Wallet
→ settle

이러한 secondary motion이
생명감을 만듭니다.

---

# 16. SQUASH & STRETCH

작은 값으로만 사용합니다.

Normal
→ 1.0

Squash
→ 1.02 x 0.98

Stretch
→ 0.98 x 1.02

캐릭터가 플라스틱처럼 변형되지 않도록 합니다.

---

# 17. STAGE 0

Egg:

- idle floating
- small shake
- anticipation
- subtle bounce

Shake는 작은 amplitude로 구현합니다.

너무 크게 흔들어서는 안 됩니다.

---

# 18. STAGE 1

Child:

- cute idle
- little bounce
- slight side tilt
- playful movement
- attention motion

전체적으로 "애교"가 느껴져야 합니다.

---

# 19. STAGE 2

Teen:

Wallet interaction:

Idle
→ anticipation
→ wallet lift
→ inspect
→ hold
→ return
→ settle

Wallet은 Character와 자연스럽게 연결되어야 합니다.

---

# 20. STAGE 3

Adult:

Coin interaction:

Idle
→ preparation
→ coin lift
→ throw
→ coin up
→ pause
→ return
→ catch
→ settle

Coin은 정확한 Anchor를 사용합니다.

Coin이 지나치게 멀리 날아가지 않도록 합니다.

---

# 21. LOOPING

Idle animation은
눈에 띄는 반복 패턴을 피합니다.

같은 동작을 반복하더라도

- timing variation
- phase variation
- blink variation

등을 사용할 수 있습니다.

---

# 22. RANDOMNESS

Randomness는 제한적으로 사용합니다.

예:

Blink delay
Idle variation
Expression timing

너무 강한 randomness는
예측 불가능한 이상 행동을 만들 수 있습니다.

---

# 23. UI + CHARACTER MOTION

Character motion과 UI motion은
서로 경쟁하지 않아야 합니다.

Character:
Organic

UI:
Precise

로 motion language를 구분합니다.

---

# 24. SHADOW

캐릭터의 floating animation에서
Shadow도 고려합니다.

캐릭터가 올라가면:

Character ↑
Shadow ↓ / smaller / softer

캐릭터가 내려오면:

Character ↓
Shadow ↑ / larger / darker

등의 subtle relationship을 사용합니다.

단순히 캐릭터와 그림자를 동일하게 움직이지 않습니다.

---

# 25. CLIPPING PROTECTION

Animation Container는
캐릭터가 모든 방향으로 움직일 수 있는 충분한 영역을 가져야 합니다.

다음 설정을 반드시 확인합니다.

- overflow
- clip-path
- object-fit
- object-position
- transform-origin
- container bounds

캐릭터의 움직임 때문에
이미지가 잘려서는 안 됩니다.

---

# 26. FRAME QUALITY

Animation 중 다음을 검사합니다.

- edges
- alpha
- silhouette
- accessories
- masks
- shadows
- highlights

움직이는 도중 특정 프레임에서만
검은 선이나 깨진 픽셀이 생기면 수정합니다.

---

# 27. ANIMATION STATE MACHINE

가능하면 animation state를 명확하게 관리합니다.

IDLE
BLINK
HAPPY
SAD
CUTE
ACTION
RETURN

등을 분리합니다.

서로 다른 animation이 동시에 transform을 덮어쓰지 않게 합니다.

---

# 28. PRIORITY

Action animation이 재생될 때
Idle animation이 동시에 같은 transform을 변경하면 안 됩니다.

예:

Idle Floating
+
Coin Throw

두 개가 동시에 Y position을 직접 변경하면 충돌할 수 있습니다.

따라서:

Root Motion
+
Local Action Motion

과 같이 계층을 분리합니다.

---

# 29. PERFORMANCE

Animation은 가능한 한 GPU-friendly한 방식으로 구현합니다.

불필요한:

- Canvas recreation
- ImageData recreation
- Per-frame asset generation
- DOM explosion

을 피합니다.

가능하면 CSS transform과 GPU compositing을 우선 사용합니다.

---

# 30. ACCESSIBILITY / REDUCED MOTION

가능하면 사용자가 motion을 줄이도록 설정했을 때
과도한 animation을 줄일 수 있도록 구조를 고려합니다.

---

# 31. DEBUG MODE

애니메이션 문제를 디버깅할 수 있도록
필요한 경우 다음을 확인할 수 있어야 합니다.

- Bounding Box
- Anchor
- Parent
- Transform
- Current Animation
- Current Stage

단, Debug UI는 일반 사용자에게 표시하지 않습니다.

---

# 32. ANIMATION QA

모든 animation은 다음 환경에서 테스트합니다.

Stage 0
Stage 1
Stage 2
Stage 3

각 Stage에서:

- Idle
- Blink
- Expression
- Action
- Return

을 확인합니다.

---

# 33. FINAL STANDARD

최종 애니메이션은

"이미지가 움직인다"

가 아니라

"캐릭터가 행동한다"

고 느껴져야 합니다.

움직임이 크다고 좋은 animation이 아닙니다.

작은 움직임,
정확한 timing,
natural easing,
secondary motion,
일관된 anchor

가 더 중요합니다.

가장 중요한 기준:

"Animation 때문에 원본 캐릭터가 망가져 보이면
애니메이션이 아무리 재미있어도 실패입니다."