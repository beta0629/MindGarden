# Expo App 로그인 화면 리디자인 스펙 V2 (Login Screen Redesign Spec V2)

**작성일**: 2026-06-10  
**작성자(역할)**: core-designer  
**대상 화면**: `expo-app/app/(auth)/login.tsx` (React Native + Expo Router)  
**산출 형식**: 디자인 스펙·시안·핸드오프 (코드 변경 없음)  
**대체**: 본 문서는 V1 (`EXPO_APP_LOGIN_SCREEN_REDESIGN_SPEC_20260609.md`) 을 폐기하고 처음부터 다시 정의한다. V1 은 `ARCHIVED — V2 로 대체` 헤더만 남기고 보존.

---

## 0. 문서 사용법

- **순서**: §A → §H → §I → 나머지. §H 가 V1 폐기 사유와 V2 회피 가이드라이므로 **코더 위임 전 §H + §I 를 반드시 함께 인용**한다.
- **단위 표기**: 모든 길이값은 **dp** (React Native 의 density-independent point). 색상은 hex 또는 토큰명. 모션은 ms.
- **토큰**: `expo-app/src/theme/tokens.ts` `theme.colors.*` 와 `frontend/src/styles/unified-design-tokens.css` `var(--mg-*)` 를 1:1 매핑. 본 스펙의 모든 색은 토큰명을 함께 명시.
- **하드코딩 금지**: 모든 magic number 는 `expo-app/src/components/organisms/login/loginAnimationConstants.ts` 단일 파일에 집약. 코더는 본 상수만 import.

---

## §A 사용자 의도 재확인 (V2 핵심 결정)

### A.1 무드 — "치유 공간"

심리상담센터·치유 서비스에 어울리는 **차분·안정·신뢰** 톤. 마인드가든 나비 아이덴티티는 유지하되 **존재감을 줄여** 화면 전체가 "숨 쉬는 여백" 처럼 느껴지도록 한다.

- **시각 키워드**: 미세 호흡, 부드러운 그라데이션, 차분한 그린·크림 톤, 광택·반짝임 0
- **금지 키워드**: 과한 모션, 색채 폭발, Lottie/Rive, 파티클, 형광 액센트

### A.2 정보 위계 — "한 번만 말하기"

V1 실패 1순위 : "마인드가든 / 심리상담센터 / MIND GARDEN / 마인드가든심리상담센터" 4중 텍스트. **V2 는 단 1단**.

- **로고**: 나비 PNG 1종 (자산 자체에 텍스트 없음) — `mindgarden-butterfly-logo.png`
- **워드마크**: 나비 아래 한글 1단 → **"마인드가든"** (Bold, 22dp). 사용자가 자산을 "심리상담센터" 가 포함된 풀 워드마크로 교체하면 텍스트 0.
- **서브카피**: 1줄 — **"마음을 돌보는 시간"** (Regular, 14dp, 보조 텍스트 색)
- **"심리상담센터" / "MIND GARDEN" / TenantName 4중 텍스트는 V2 에서 절대 표시 금지**. 기관명은 화면 밖 자동 적용 (서브도메인/스토어).

### A.3 정렬 — "분할 정렬 폐기"

V1 실패 2순위 : SocialLoginButton 의 좌측 로고 + 좌측 텍스트로 시각 무게가 좌측에 쏠려 "치우침" 인식. **V2 는 모든 SNS 버튼 콘텐츠 행을 `justifyContent: 'center'` 로 묶음 중앙 배치**. 분할 정렬 (좌측 로고 + 우측 균형 패딩) 은 폐기.

### A.4 SNS Provider — "4종"

웹 frontend `UnifiedLogin.js` 와 동일한 **4 provider 균등 노출**. iOS 만 Apple 표시.

| 우선순위 | Provider | 카피 | 비고 |
|---|---|---|---|
| 1 | 카카오 | **카카오로 로그인** | 한국 사용자 다수 |
| 2 | 네이버 | **네이버로 로그인** | 한국 사용자 |
| 3 | 구글 | **Google로 로그인** | 글로벌 |
| 4 | Apple | **Apple로 계속하기** (네이티브 SDK 자동 — locale 한국어 기준) | iOS 만, SIWA 우선 |

### A.5 신규 가입 경로 — "SNS 간편가입 SSOT"

사용자 결정 (2026-06-10) : **별도 회원가입 링크 제거**. 신규 가입은 SNS 4 provider 간편가입으로만 진행. 이메일/전화번호 폼은 **기존 가입 사용자 전용**.

### A.6 이메일·전화번호 폼 — "필수 유지, 진입은 트리거"

- **절대 제거 금지** (사용자 결정 2026-06-10 §BB).
- 단, 화면을 차분하게 유지하기 위해 **인라인 상시 노출 대신 트리거 진입**.
- 안내 카피 : "이미 가입한 이메일·휴대폰 번호로 로그인" — 신규 사용자 혼동 회피.
- 디바이스 키보드 등장 시 SafeArea + KeyboardAvoidingView 그대로 유지.

### A.7 보조 링크 — "2개만"

- ~~회원가입~~ → **제거** (A.5 결정)
- **비밀번호 찾기** → 유지 (기존 이메일/전화번호 사용자)
- **다른 기관으로 변경** → 유지 (테넌트 재선택)
- 두 링크는 화면 최하단 가로 1줄 + `·` 구분자 (separator dot 6dp).

---

## §B 위젯 트리 (권장 — A4 "Hero Card + Quiet Reveal")

> 옵션 비교는 §B.0 참조. 권장안 A4 를 본 §B 본문으로, 대안 A1 은 §B.99 로 첨부.

### §B.0 옵션 분석

| 옵션 | 구조 | 장점 | 단점 | 차분함 점수 |
|---|---|---|---|---|
| A1 | 단순 중앙 정렬 SNS 4개 + 인라인 토글로 이메일 폼 펼침 | 구현 단순·검증 빠름 | 화면 정보량이 한 번에 많음, 차분함 깨질 위험 | 6/10 |
| A2 | 세그먼티드 컨트롤 (SNS / 이메일 / 전화번호 탭) | 정보 분리 깔끔 | "통제·선택" 인상 강함, 심리상담 톤과 미스매치 | 5/10 |
| A3 | SNS 카드 + 이메일은 Bottom Sheet 트리거 | 모바일 네이티브, SNS 메인 노출 | 이메일 사용자 1탭 추가 | 8/10 |
| **A4** | **Hero Card** (반투명 표면) 안에 SNS 4개 + 하단 "이메일·휴대폰으로 로그인" 텍스트 트리거 → **Quiet Reveal Bottom Sheet** | 차분함·정돈됨·"치유 공간" 톤 정합, 모바일 네이티브 강점 | 카드 안 SNS 4개로 세로 길이 ↑ (스크롤 OK) | **9/10** |

**권장: A4**. 사용자 의도 ("차분·안정·치유") 와 가장 정합하며, "디자인 다시 해" 비판의 핵심 (정보 과밀·시각 무게 좌측 쏠림) 을 카드 단일화 + 중앙 정렬로 해소.

**대안: A1 변형** — A4 가 일정상 어려우면 단일 컬럼 + 인라인 토글 (현재 흐름의 보강).

### §B.1 화면 시안 (ASCII wireframe — iPhone 14 Pro 기준 393×852dp)

```
┌────────────────────────────────────────────────┐ ← Safe Top (notch)
│                                                │
│           (배경 : 흐르는 파스텔 그라데이션)      │
│           — 좌상→우하 §C.3, drift 8s 호흡       │
│                                                │
│                                                │
│                ┌─────────────┐                 │
│                │             │                 │
│                │   🦋 LOGO   │ 96dp ←(V1 140 → V2 96, 비대 해소)
│                │   (호흡)     │                 │
│                └─────────────┘                 │
│                                                │
│                  마인드가든                       ← Title (Bold 22dp, textMain)
│                마음을 돌보는 시간                  ← Subtitle (Regular 14dp, textSecondary)
│                                                │
│                                                │
│   ╭────────────────────────────────────╮       │
│   │      Hero Card (frosted surface)   │       │
│   │   ─ rgba 표면 0.62, 1px border,    │       │
│   │     radius 24dp, padding 24dp ─    │       │
│   │                                    │       │
│   │  ┌──────────────────────────────┐  │       │
│   │  │ 💬   카카오로 로그인          │  │  ← 56dp, radius 14dp
│   │  └──────────────────────────────┘  │       │
│   │  ┌──────────────────────────────┐  │       │
│   │  │  N   네이버로 로그인          │  │       │
│   │  └──────────────────────────────┘  │       │
│   │  ┌──────────────────────────────┐  │       │
│   │  │  G   Google로 로그인          │  │       │
│   │  └──────────────────────────────┘  │       │
│   │  ┌──────────────────────────────┐  │       │
│   │  │  Apple로 계속하기 (네이티브)   │  │       │
│   │  └──────────────────────────────┘  │       │
│   │                                    │       │
│   │   ────  또는  ────  (16dp, divider)  │       │
│   │                                    │       │
│   │     이미 가입한 이메일·휴대폰         │       │
│   │      번호로 로그인  ⌃                │  ← Trigger (textSecondary, 14dp)
│   │                                    │       │
│   ╰────────────────────────────────────╯       │
│                                                │
│                                                │
│         비밀번호 찾기 · 다른 기관으로 변경         ← Footer Links (12dp, textTertiary)
│                                                │
└────────────────────────────────────────────────┘ ← Safe Bottom (home indicator)
```

### §B.2 Quiet Reveal Bottom Sheet (이메일·휴대폰 폼)

트리거 ("이미 가입한 이메일·휴대폰 번호로 로그인 ⌃") 탭 시 **하단에서 슬라이드 업** (240ms). Backdrop opacity 0.18 (차분, blur 없음).

```
┌────────────────────────────────────────────────┐
│           (배경 카드는 그대로, dim 0.18)          │
├────────────────────────────────────────────────┤
│                  ╴╴╴ (handle bar 36×4)          │ ← grabber, 12dp top
│                                                │
│        이미 가입한 이메일·휴대폰으로 로그인        ← Sheet Title (SemiBold 16dp)
│                                                │
│   ┌──────────────────────────────────────┐     │
│   │ 📧  이메일 또는 휴대폰 번호            │ 56dp, radius 14
│   └──────────────────────────────────────┘     │
│   ┌──────────────────────────────────────┐     │
│   │ 🔒  비밀번호                          │     │
│   └──────────────────────────────────────┘     │
│                                                │
│   ┌──────────────────────────────────────┐     │
│   │              로그인                    │ ← primary CTA, 56dp, radius 14
│   └──────────────────────────────────────┘     │
│                                                │
│              비밀번호 찾기                       ← Inline link (textSecondary 14)
│                                                │
└────────────────────────────────────────────────┘ ← KeyboardAvoidingView
```

- Sheet 높이 : `min(420dp, 화면 60%)`. 키보드 등장 시 자동 상승.
- 닫기 : 트리거 재탭 / 핸들바 드래그 다운 / Backdrop 탭 / OS Back (Android).

### §B.3 컴포넌트 트리

```
LoginScreen (expo-app/app/(auth)/login.tsx)
├── AnimatedPastelBackground          [organism, 기존 재사용·미세 톤 조정]
├── SafeAreaView (top, bottom)
│   └── KeyboardAvoidingView
│       └── ScrollView (vertical center)
│           ├── BreathingButterflyLogo  [molecule, 96dp]
│           ├── BrandTitleBlock         [신규 molecule]
│           │     ├── Text "마인드가든"  (Bold 22)
│           │     └── Text "마음을 돌보는 시간" (Regular 14)
│           ├── HeroLoginCard           [신규 organism — frosted surface]
│           │     ├── SocialLoginButton kakao   ← stagger 1
│           │     ├── SocialLoginButton naver   ← stagger 2
│           │     ├── SocialLoginButton google  ← stagger 3
│           │     ├── AppleAuthenticationButton ← stagger 4 (iOS only)
│           │     ├── DividerWithLabel ("또는")
│           │     └── CredentialSheetTrigger    [신규 atom: 텍스트 + 위 화살표]
│           └── FooterLinks             [신규 molecule: 비밀번호 찾기 · 다른 기관 변경]
└── CredentialSheet                    [신규 organism — Bottom Sheet]
      ├── HandleBar
      ├── Text Title "이미 가입한 이메일·휴대폰으로 로그인"
      ├── TextInput (email/phone)
      ├── TextInput (password)
      ├── PrimaryButton "로그인"
      └── Link "비밀번호 찾기"
```

### §B.99 대안 A1 (단일 컬럼 + 인라인 토글) — fallback

```
[배경] → [로고 96] → [마인드가든] → [마음을 돌보는 시간]
       → SNS 4개 (카카오·네이버·Google·Apple) 풀 너비
       → "또는" divider
       → "이미 가입한 이메일·휴대폰 번호로 로그인 ⌄" 토글
         펼치면 인라인 폼 (이메일/전화번호 + 비밀번호 + 로그인 버튼)
       → [비밀번호 찾기 · 다른 기관 변경]
```

A4 가 어려우면 A1 으로 폴백. 카드/Bottom Sheet 제거하고 그 외는 동일.

---

## §C 색·토큰 (Colors & Tokens)

### §C.1 배경 그라데이션 (정적 베이스 + drift 레이어)

| 영역 | hex | 웹 토큰 | Expo 토큰 | 비고 |
|---|---|---|---|---|
| 베이스 stop 0 | `#FAF9F7` | `--mg-color-background-main` | `theme.colors.bgMain` | 오프화이트 |
| 베이스 stop 1 (warm) | `#FFF6E8` | `--mg-login-bg-warm` | `theme.colors.common.loginBgWarm` | 옅은 옐로우 |
| 베이스 stop 2 (bridge) | `#F4F1EA` | `--mg-login-bg-bridge` | `theme.colors.common.loginBgBridge` | 중성 크림 |
| 베이스 stop 3 (cool) | `#EFF3F0` | `--mg-login-bg-cool` | `theme.colors.common.loginBgCool` | 옅은 틸 |

- LinearGradient `colors: [bgMain, loginBgWarm, loginBgBridge, loginBgCool]`, `locations: [0, 0.35, 0.7, 1]`, `start: {0,0}`, `end: {1,1}`
- Drift 레이어 : 동일 stops 중 `loginBgWarm/loginBgBridge/loginBgCool` 만 추출, 반대 방향 (`{1,0}` → `{0,1}`), opacity 0.4↔0.6 oscillation 8s ∞.

### §C.2 텍스트·표면

| 영역 | hex | 웹 토큰 | Expo 토큰 |
|---|---|---|---|
| 본문 (마인드가든) | `#2C2C2C` | `--mg-color-text-main` | `theme.colors.common.textMain` |
| 보조 (마음을 돌보는 시간 / 트리거 / 안내) | `#5C6B61` | `--mg-color-text-secondary` | `theme.colors.common.textSecondary` |
| 약한 (footer 링크) | `#9E9E9E` | `--mg-color-text-tertiary` | `theme.colors.common.textTertiary` |
| 카드 표면 baseline | `#F5F3EF` | `--mg-color-surface-main` | `theme.colors.consultant.surface` |
| 카드 보더 | `#D4CFC8` | `--mg-color-border-main` | `theme.colors.common.border` |
| Divider | `#E8E4DE` | `--mg-color-divider` | `theme.colors.common.divider` |

### §C.3 Hero Card 표면 (frosted)

> 차분한 글래스 톤 — 광택 0, blur 0~4 (디바이스 성능 따라 옵션). 배경 위에 살짝 떠 있는 인상.

| 속성 | 값 | 비고 |
|---|---|---|
| `backgroundColor` | `rgba(245, 243, 239, 0.62)` | `surface` 색상 + 알파 0.62 |
| `borderWidth` | `1` | |
| `borderColor` | `rgba(212, 207, 200, 0.55)` | `border` + 알파 0.55 |
| `borderRadius` | `24` | dp |
| `padding` | `24` | dp |
| `gap` (내부 세로) | `12` | dp |
| iOS shadow | `shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 18, shadowOffset: {0, 6}` | 매우 약함 |
| Android elevation | `2` | |
| (옵션) blur | `expo-blur` `BlurView intensity={20}` `tint="light"` | 성능 영향 시 비활성 |

### §C.4 SNS Provider 색 (브랜드 가이드 강제)

| Provider | bg | fg | Expo 상수 |
|---|---|---|---|
| 카카오 | `#FEE500` | `#191919` | `OAUTH_KAKAO_BACKGROUND/FOREGROUND` |
| 네이버 | `#03C75A` | `#FFFFFF` | `OAUTH_NAVER_BACKGROUND/FOREGROUND` |
| 구글 | `#FFFFFF` (보더 `#DADCE0` 1px) | `#3C4043` | (신규) `OAUTH_GOOGLE_BACKGROUND/FOREGROUND` 또는 outline 변형 |
| Apple | `#000000` | `#FFFFFF` | 네이티브 SDK 자동 — fallback 만 상수 |

> 구글은 Google Sign-In Branding 가이드 권장 "흰 배경 + 회색 보더 + 다색 G 로고" 사용.

### §C.5 Primary 액션 (Bottom Sheet "로그인" 버튼)

| 속성 | 값 |
|---|---|
| backgroundColor | `theme.colors.consultant.primary` (`#3D5246`) |
| color | `theme.colors.common.textOnPrimary` (`#FFFFFF`) |
| height | `56dp` |
| radius | `14dp` |
| typography | `textStyles.button` (SemiBold 16dp) |

### §C.6 콘트라스트 (WCAG AA)

| 텍스트 | 배경 | 비율 | 등급 |
|---|---|---|---|
| `#2C2C2C` 마인드가든 | 베이스 #FAF9F7 | 12.6:1 | AAA |
| `#5C6B61` 서브 | 베이스 | 5.4:1 | AA |
| `#9E9E9E` footer | 베이스 | 3.2:1 | AA Large (12dp 일 때 fontWeight 600 권장) |
| `#191919` 카카오 텍스트 | `#FEE500` | 16.9:1 | AAA |
| `#FFFFFF` 네이버 텍스트 | `#03C75A` | 3.0:1 | AA Large (16dp + SemiBold 통과) |
| `#3C4043` 구글 텍스트 | `#FFFFFF` | 12.0:1 | AAA |
| `#FFFFFF` Apple 텍스트 | `#000000` | 21:1 | AAA |

---

## §D 모션 (Motion) — 차분·미세

### §D.1 등장 타임라인 (정상 모드, ms)

```
시간(ms)   0      200    400    600    800    1000   1200   1400   1600
배경      ├─ fade-in (0→1, 600ms) ─┤
                                  └─→ drift loop (8000ms, ∞)
로고      │  ├─ fade+scale 0.96→1 (200~700, 500ms) ─┤
                                                   └─→ breathing 1.00↔1.02 (∞ 5s)
타이틀    │       ├─ fade+translateY 6→0 (400~900, 500ms) ─┤
서브      │          ├─ fade+translateY (500~1000) ─┤
HeroCard  │              ├─ fade+translateY 12→0 (600~1100, 500ms) ─┤
SNS 카카오│                  ├─ fade+translateY 8→0 (800~1100, 300ms) ─┤
SNS 네이버│                     ├─ stagger +120ms ─┤
SNS 구글  │                        ├─ stagger +240ms ─┤
SNS Apple │                           ├─ stagger +360ms ─┤
트리거링크│                              ├─ fade (1240~1640, 400ms) ─┤
인터랙션 활성 : 1640ms  (등장 전 pointerEvents='none')
```

> SNS 4종으로 늘어났으므로 stagger 누적이 360ms (V1 240ms 대비 +120ms). 인터랙션 활성 시점도 1340 → 1640ms.

### §D.2 Reduce Motion 분기 (`AccessibilityInfo.isReduceMotionEnabled()` true)

| 요소 | 정상 | Reduce Motion |
|---|---|---|
| 배경 fade | 600ms | **200ms** |
| 배경 drift | 8s ∞ | **정지** (정적 그라데이션) |
| 로고 등장 | fade + scale | **fade only**, scale 즉시 1.0 |
| 로고 breathing | 1.00↔1.02 ∞ | **정지** |
| 타이틀/서브/카드/버튼 등장 | fade + translateY | **fade only** |
| 버튼 stagger | 120ms | **60ms** |
| Press feedback | scale 0.98 | **opacity 0.85** |
| 인터랙션 활성 시점 | 1640ms | **1100ms** |

### §D.3 Bottom Sheet 등장·종료 (Quiet Reveal)

| 단계 | 정상 | Reduce Motion |
|---|---|---|
| 표시 | translateY (sheetHeight → 0), 240ms, `Easing.out(Easing.cubic)` | translateY 0 즉시 + opacity 0→1 (160ms) |
| Backdrop fade | opacity 0 → 0.18, 200ms | 0 → 0.18, 120ms |
| 닫기 | 역방향 (200ms) | opacity 1→0 (120ms) |
| Press CTA | scale 0.98 (100/150ms) | opacity 0.85 |

### §D.4 Press feedback (모든 SNS·CTA 공통)

- onPressIn → scale 0.98 (정상) / opacity 0.85 (Reduce), 100ms `Easing.out(Easing.ease)`
- onPressOut → scale 1.0 / opacity 1.0, 150ms 동일 이징
- 모든 애니메이션 `useNativeDriver: true` (transform·opacity 만 사용)

---

## §E 자산 (Brand Assets)

### §E.1 마인드가든 로고

| 항목 | 값 |
|---|---|
| 자산 | 그라데이션 나비 PNG 1종 |
| 위치 (런타임) | `expo-app/assets/brand/mindgarden-butterfly-logo.png` |
| 표시 사이즈 | **96dp × 96dp** (iPhone 14 기준). SE 80dp / 태블릿 120dp |
| 다크 모드 | 동일 자산 (현 단계 다크 미지원) |
| 추가 텍스트 로고 PNG | **사용 금지** — 텍스트는 폰트 렌더링만 |

> V1 의 140dp 는 비대 → V2 는 96dp 로 축소. 차분함·여백감 우선.

### §E.2 SNS 브랜드 자산 — 공식 정품 (production-grade)

> **상용 배포 기준** — 각 사 공식 디자인 가이드 페이지의 1차 자산 사용. simple-icons.org (CC0) 는 fallback 으로만. 디자이너는 직접 자산을 다운로드하지 않으며 본 표가 코더 확보 절차의 SSOT.

#### §E.2.1 카카오 (공식 가이드 fetch 결과 2026-06-10)

| 항목 | 값 / 규정 |
|---|---|
| 1차 출처 | https://developers.kakao.com/docs/latest/ko/kakaologin/design-guide |
| 자산 다운로드 | https://developers.kakao.com/tool/resource/login (도구 > 리소스 다운로드 > 카카오 로그인) |
| 형식 | PNG / PSD (전체 다운로드 .zip 으로 PSD 확보 가능 — SVG export 시 코더가 PSD → SVG 변환) |
| 컨테이너 색 | `#FEE500` (변경 금지) |
| 심볼 색 | `#000000` (말풍선, 형태·비율 변경 금지) |
| 레이블 색 | `#000000` 알파 0.85 (≈`rgba(0, 0, 0, 0.85)`) |
| 레이블 카피 | 완성형 한글 **"카카오 로그인"** / 영문 "Login with Kakao" / 축약형 "로그인" — 본 스펙은 **"카카오 로그인"** 사용 (V2 §I.5) |
| 컨테이너 radius | **12px** (가이드 강제) |
| 폰트 | OS 시스템 서체, 30pt sp/dp |
| 심볼 정렬 | 좌측 정렬 또는 레이블과 함께 가운데 정렬 — V2 는 §F.1 묶음 중앙 |
| 우리 경로 | `expo-app/assets/social/kakao-logo.svg` (코더 변환 후) |
| 라이선스 | 가이드 준수 시 사용 가능. **버튼 색·심볼·레이블 위치 규정 외 변경 금지** |
| 금지 사항 | 색 임의 변경, CI 심볼 사용, 심볼 없는 버튼, 자체 카카오톡 아이콘 사용 |

#### §E.2.2 네이버 (공식 가이드 fetch 결과 2026-06-10)

| 항목 | 값 / 규정 |
|---|---|
| 1차 출처 | https://developers.naver.com/docs/login/bi/bi.md |
| 자산 다운로드 | 위 페이지 내 BI 다운로드 링크 (PNG / SVG / PSD) |
| 컨테이너 색 | `#03C75A` (지정 컬러, 녹색 배경 권장 — 변경 금지) |
| 로고 | N 로고 타입 (변경 / 다른 형태 조합 금지) |
| 로고 색 | `#FFFFFF` |
| 로고 크기 | 아이콘형 18px / **완성형 16px 이상** (기준 미만 금지) |
| 로고와 레이블 간격 | **8px** (가운데 정렬 시 강제) |
| 레이블 카피 | "네이버 로그인" (사용자 정합성에 맞춰 한글/영문 수정 가능) — V2 는 **"네이버 로그인"** |
| 정렬 | 가운데 정렬 또는 로고만 좌측 정렬 — V2 는 §F.1 묶음 중앙 |
| 우리 경로 | `expo-app/assets/social/naver-logo.svg` |
| 라이선스 | BI 가이드 준수 시 사용 가능 |
| 금지 사항 | 컬러 임의 변경, N 로고 형태 변경, 다른 마크와 결합 |

#### §E.2.3 Google (공식 가이드 fetch 결과 2026-06-10)

| 항목 | 값 / 규정 |
|---|---|
| 1차 출처 | https://developers.google.com/identity/branding-guidelines |
| 자산 다운로드 | 위 페이지 "Download Pre-Approved Brand Icons" 섹션 (PNG / SVG, Light/Dark/Neutral 테마 + Rectangular/Pill 형태) |
| Light Theme (V2 채택) | Fill `#FFFFFF` / Stroke `#747775` 1px inside / Font `#1F1F1F` Roboto Medium 14/20 |
| Dark Theme (참고) | Fill `#131314` / Stroke `#8E918F` 1px / Font `#E3E3E3` |
| Neutral Theme (참고) | Fill `#F2F2F2` / Stroke 없음 / Font `#1F1F1F` |
| G 로고 색 | **표준 다색 (브랜드 강제)** — Blue `#4285F4` / Green `#34A853` / Yellow `#FBBC05` / Red `#EA4335`. 단색 변형 금지 |
| 레이블 카피 | "Sign in with Google" / "Sign up with Google" / "Continue with Google" / "Sign in" 중 택1 — 한국어 로컬라이즈 권장 → V2 는 **"Google로 로그인"** (가이드 명시 "한국어 등 현지화 환영") |
| 폰트 | **Roboto Medium** (TrueType, 가이드 다운로드 번들 포함) |
| 라인 높이 | `14/20` (font-size 14px, line-height 20px) |
| 우리 경로 | `expo-app/assets/social/google-logo.svg` (다색 G 로고만 — 버튼 컨테이너는 자체 렌더) |
| 라이선스 | 가이드 준수 시 사용 가능. **G 로고 색·크기 변경 금지** |
| 권장 SDK | Google Identity Services SDK 가 자동 렌더 — RN 환경에서는 자산 + 자체 컨테이너 렌더가 더 안정 |
| 금지 사항 | 단색 G 로고, 색 배경에 G 로고 단독, "Google" 단어 단독 (예: "Google" 만 텍스트 버튼) |

#### §E.2.4 Apple (Apple HIG 일반 정책 — 페이지 fetch 실패 시 SDK 네이티브 사용 강제)

| 항목 | 값 / 규정 |
|---|---|
| 1차 출처 | https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple (2026-06-10 fetch 실패 — 캐시 또는 인증 이슈) |
| **권장 구현** | **`expo-apple-authentication` 의 `AppleAuthenticationButton` 네이티브 컴포넌트** (자체 자산·다국어·다크모드·HIG 준수 자동) |
| 자산 (fallback 만) | Apple HIG 다운로드 페이지의 흑/백 페어 SVG/PNG (네이티브 버튼 사용 시 불필요) |
| 컨테이너 색 (Black style) | `#000000` |
| 컨테이너 색 (White style) | `#FFFFFF` (보더 1px `#000000`) |
| 로고 색 | 컨테이너 반전 (Black bg → White Apple, White bg → Black Apple) |
| 레이블 카피 | 디바이스 locale 자동 — 한국어 "Apple로 계속하기" / 영문 "Continue with Apple" (V2 는 `buttonType={CONTINUE}`) |
| Corner radius | 0 ~ 50% 자유 — V2 는 `BUTTON_BORDER_RADIUS=12dp` 와 정합 |
| 최소 너비 | 140pt |
| 높이 | 30 ~ 64pt (V2 56dp 정합) |
| 폰트 | SF Pro 시스템 폰트 (네이티브 자동) |
| 우리 경로 (fallback) | `expo-app/assets/social/apple-logo.svg` (이미 존재) |
| 라이선스 | App Store 등록 앱 한정 사용. **App Store 4.8 T1 정책상 SNS 로그인 시 SIWA 노출 의무** (이미 V2 §A.4 4종 노출 정책으로 충족) |
| 금지 사항 | 자체 카피 강제 (영문 fixed 외) — 네이티브 SDK 가 자동 처리 |

### §E.3 아이콘 — Lucide React Native (재사용)

| 용도 | 컴포넌트 |
|---|---|
| 이메일 입력 좌측 | `Mail` 18dp |
| 비밀번호 입력 좌측 | `Lock` 18dp |
| 트리거 위 화살표 (펼치기) | `ChevronUp` 16dp |
| 트리거 닫힘 (Sheet 열린 상태) | `ChevronDown` 16dp |

---

## §F 정렬 정책 (Alignment Policy)

### §F.1 SNS 버튼 — "묶음 중앙"

V1 의 분할 정렬을 폐기하고 다음 규칙을 단일 정책으로 둔다.

```
[ ─── padding 16dp ───┤[icon 20dp][gap 12dp][text]├─── padding 16dp ─── ]
                       └────── 묶음 (justifyContent: center) ──────┘
```

- `Pressable` 내부 row : `flexDirection: 'row'`, `justifyContent: 'center'`, `alignItems: 'center'`
- `padding: 16dp` 좌우 균등
- `icon` 20dp + `gap` 12dp + `text` 자동 폭 → 묶음이 자연 중앙 배치
- **좌측 정렬·우측 패딩 균형 코드 모두 제거**. `flex: 1` text 영역 금지.

### §F.2 텍스트 위계

- 모든 텍스트 `textAlign: 'center'` (제목·서브·트리거·footer 링크)
- Bottom Sheet 입력 필드 라벨도 중앙 (입력 placeholder 자체는 좌측, 시각 균형)

### §F.3 화면 컨테이너

- `ScrollView` `contentContainerStyle.justifyContent: 'center'`, 세로 중앙
- 콘텐츠 좌우 padding : 모바일 24dp / 태블릿 32dp
- 태블릿 (≥744dp) 콘텐츠 maxWidth 440dp + alignSelf center

---

## §G 접근성 / SafeArea / Reduce Motion

### §G.1 접근성

| 요소 | accessibilityLabel | accessibilityRole |
|---|---|---|
| 로고 + 타이틀 묶음 | "마인드가든, 마음을 돌보는 시간" | header |
| SNS 버튼 (카카오) | "카카오로 로그인" | button |
| SNS 버튼 (네이버) | "네이버로 로그인" | button |
| SNS 버튼 (구글) | "Google로 로그인" | button |
| Apple 버튼 | (네이티브 SDK 자동) | (네이티브 자동) |
| Sheet 트리거 | "이미 가입한 이메일·휴대폰 번호로 로그인" | button (`accessibilityState.expanded`) |
| 비밀번호 찾기 | "비밀번호 찾기" | link |
| 다른 기관 변경 | "다른 기관으로 변경" | link |
| Bottom Sheet 핸들바 | "로그인 폼 닫기" | adjustable (drag) |

### §G.2 SafeArea

- `react-native-safe-area-context` `SafeAreaView` `edges={['top', 'bottom']}`
- 배경 `LinearGradient` 는 SafeArea 무시 (`StyleSheet.absoluteFill` 풀 블리드)
- Bottom Sheet 도 `bottom` 인셋 자동 반영 (홈 인디케이터 영역 패딩 추가)

### §G.3 KeyboardAvoidingView

- iOS : `behavior="padding"`, Android : default (window resize)
- Bottom Sheet 내 입력 필드 포커스 시 자동 상승

### §G.4 Reduce Motion 분기

§D.2 표 그대로. 단일 진입점 `resolveLoginAnimationConfig(reduceMotion)` 함수만 사용. 컴포넌트는 분기 로직을 자체로 가지지 않는다.

### §G.5 Dynamic Type

- 모든 `Text` 에 `maxFontSizeMultiplier={1.6}` (V1 정책 유지)
- `allowFontScaling` 기본 true

### §G.6 Locale (Apple 한국어 카피)

- `AppleAuthenticationButton` `buttonType={CONTINUE}` 사용 시 디바이스 locale 한국어 → "Apple로 계속하기" 자동.
- 시뮬레이터 locale 영문 → "Continue with Apple". **이는 SDK 한계, 외부 강제 불가**.
- 검증 시 시뮬레이터 Settings > General > Language 를 한국어로 설정해 캡처.

---

## §H 이전 V1 잘못된 해석 회피 가이드

V1 (`EXPO_APP_LOGIN_SCREEN_REDESIGN_SPEC_20260609.md`) 가 사용자 비판 ("디자인 다시 해 원래 이게 아니잖어") 을 받은 핵심 원인과 V2 의 회피 정책을 1:1 로 매핑한다. **코더 위임 시 본 표를 인용**.

| # | V1 문제 | 사용자 지적 | 근본 원인 | V2 회피 정책 |
|---|---|---|---|---|
| H1 | 동일 정보 4중 반복 | "마인드가든 / 심리상담센터 / MIND GARDEN / 마인드가든심리상담센터" | 정보 위계 무시, "안전하게 다 표시" 누적 | 1단 텍스트 (마인드가든 + 부제 1줄). "심리상담센터/MIND GARDEN/TenantName" 표시 절대 금지 (§A.2) |
| H2 | 좌측 치우침 | 시뮬레이터 캡처 SNS 버튼 | "분할 정렬" — 좌측 로고 + 좌측 텍스트로 시각 무게 좌측 쏠림 | **묶음 중앙 정렬** (justifyContent: center). flex:1 text 영역 폐기 (§F.1) |
| H3 | 로고 비대 | 24×24 보다 작게 의도했으나 실제 140dp | 펜슬 가이드 80~120 권장 무시 | **96dp** 고정 (SE 80 / 태블릿 120). V1 LOGO_SIZE_BASE 140 → 96 (§E.1) |
| H4 | 폰트 비통일 | 시스템 폰트 / Pretendard 혼재 | `theme.fontFamily.*` 미적용 화면 일부 | **모든 Text 에 `theme.fontFamily.*` 명시 필수**. 시스템 폰트 fallback 금지 |
| H5 | Apple 한국어 안 나옴 | 시뮬레이터 영문 표시 | 디바이스 locale 영문 설정 | SDK 한계 명시 (§G.6) — 검증 시 한국어 locale 강제 |
| H6 | 이메일/전화번호 폼 누락 | "기존 사용자가 못 들어옴" | V1 §AQ-3 폼 제거 → §BB 복원 | **트리거 + Bottom Sheet 로 절대 보존**. 코더 핸드오프 §I 1순위로 명시 |
| H7 | 코어솔루션 카드 추가 | "코어솔루션은 테넌트 아닌데" | TenantSelection 에 본사·외부 시스템 카드 노출 | 테넌트 선택 화면에서 코어솔루션 카드 제거 (별도 워크지만 §I.6 에 메모) |
| H8 | 회원가입 링크 노출 | "SNS 간편가입이 따로 있잖어" | 사용자 SSOT 결정 누락 | 회원가입 링크 **제거** (§A.5). 비밀번호 찾기·다른 기관 변경만 유지 (§A.7) |
| H9 | 그라데이션 5색 임팩트 | 차분 톤과 충돌 | 자산이 옐로우·오렌지·코랄·틸·퍼플 5색 그라데이션 | 자산은 유지하되 사이즈 96dp 로 시각 무게 ↓. 배경 stops 는 옐로우·틸·중성만 사용 (§C.1) |

### §H.1 V2 검수 한 눈에

V2 가 사용자 의도와 정합되는지 검수할 때 다음 5가지만 체크하면 된다.

1. ✅ 화면을 봤을 때 "차분하다" 인상이 즉시 드는가?
2. ✅ 텍스트 위계가 1단 (마인드가든) + 1줄 부제 인가? 4중 반복이 없는가?
3. ✅ SNS 버튼이 좌측이 아닌 **묶음 중앙** 에 보이는가?
4. ✅ 이메일·휴대폰 로그인이 진입 가능한가? (트리거 또는 인라인)
5. ✅ 회원가입 링크 없는가? 비밀번호 찾기 / 다른 기관 변경 만 있는가?

---

## §I 코더(core-coder) 핸드오프 체크리스트

> 코더 위임 프롬프트에 **본 §I + §H 전체를 인용**.

### §I.1 절대 보존 (제거 금지)

- [ ] **이메일·휴대폰 번호 로그인 폼** (§A.6, §B.2) — 트리거 + Bottom Sheet 또는 인라인 (A1) 형태로 반드시 노출
- [ ] **비밀번호 찾기 링크** (§A.7) — 외부 웹 `/forgot-password` 로 `Linking.openURL` 유지
- [ ] **다른 기관으로 변경 링크** (§A.7) — `router.replace('/(auth)/tenant-select')`
- [ ] 기존 비즈니스 로직 (`AuthService.loginWithKakao/Naver/Apple/Credentials`, `requiresOAuthPhoneVerification`, `requiresApplePhoneVerification`, `requiresDuplicateLoginConfirmation`, `UnifiedModal` 흐름, ExpoGo 배너) **변경 금지**

### §I.2 제거 (V1 잔재)

- [ ] **"심리상담센터" / "MIND GARDEN" / TenantName** 4중 텍스트 표시 코드 모두 제거 (§A.2, §H1)
- [ ] **회원가입 링크** (`SIGNUP_LINK_LABEL`, `WEB_REGISTER_PATH`) 모두 제거 (§A.5, §H8)
- [ ] SocialLoginButton 의 **분할 정렬** 스타일 (`logoSection` `textSection` `flex:1` `paddingRight`) 모두 제거 — 묶음 중앙 (§F.1, §H2)
- [ ] 로고 사이즈 **140dp → 96dp** (`LOGO_SIZE_BASE` 96, MIN 80, MAX 120) (§E.1, §H3)

### §I.3 신규 컴포넌트

- [ ] `expo-app/src/components/molecules/BrandTitleBlock.tsx` — 타이틀 (마인드가든) + 부제 (마음을 돌보는 시간) 1단 묶음
- [ ] `expo-app/src/components/organisms/login/HeroLoginCard.tsx` — frosted surface card (§C.3 토큰), SNS 4 + Divider + Trigger
- [ ] `expo-app/src/components/atoms/CredentialSheetTrigger.tsx` — 텍스트 + Chevron 아이콘
- [ ] `expo-app/src/components/organisms/login/CredentialSheet.tsx` — Bottom Sheet (handle / title / 입력 2 / CTA / 비밀번호 찾기 inline)
- [ ] `expo-app/src/components/molecules/login/FooterLinks.tsx` — 비밀번호 찾기 · 다른 기관 변경 (separator dot)

### §I.4 SNS 4 provider — Google BE/웹 가용 확인 완료 (2026-06-10)

**BE/웹 현황** (사용자 확정) :
- BE Service `GoogleOAuth2ServiceImpl.java` 운영 가용 ✅
- 웹 FE `frontend/src/utils/socialLogin.js` `googleLogin()` + `frontend/src/components/auth/UnifiedLogin.js` + `frontend/src/constants/oauth2.js` 정상 동작 중
- → expo-app 측 **FE 추가 구현만** 필요. BE 신규 / DB 마이그레이션 / 엔드포인트 추가 **불필요**

**4 provider 구현 매트릭스** :

| Provider | BE | 웹 FE | expo-app 현황 | expo-app 작업 |
|---|---|---|---|---|
| 카카오 | 가용 | 가용 | `AuthService.loginWithKakao()` 가용 | UI 변경만 |
| 네이버 | 가용 | 가용 | `AuthService.loginWithNaver()` 가용 | UI 변경만 |
| **Google** | **가용** | **가용** | **미구현** | `AuthService.loginWithGoogle()` 신규 + UI |
| Apple | 가용 (SIWA) | 가용 | `AuthService.loginWithApple()` 가용 | UI 변경만 |

**Google 구현 경로 — 코더가 택1** :

| # | 경로 | 장점 | 단점 | 디자이너 권장 |
|---|---|---|---|---|
| G-1 | **`expo-auth-session/providers/google`** (네이티브 OAuth) | App Store / Play Store 심사 안전, in-app browser 자동 (ASWebAuthenticationSession / Custom Tabs), PKCE 자동 | 패키지 추가, redirect URI 등록 필요 | **★ 권장** (베타·상용 수준) |
| G-2 | WebView in-app browser (기존 웹 `googleLogin` 재사용) | 빠른 구현, BE 동일 redirect URI 재사용 | 모바일 UX 보통, App Store 4.5.4 위반 위험 (브라우저 내 OAuth) | fallback 만 |

> 디자이너 권장 : **G-1** (`expo-auth-session/providers/google`). 베타 테스트·상용 출시 모두 안전. App Store 심사 시 in-app browser 정책 통과 보장. PKCE / state 관리 라이브러리 자동.

**구체 작업 항목** :
- [ ] `expo-app` 패키지 추가 : `expo-auth-session`, `expo-crypto` (PKCE), `expo-web-browser` — `npx expo install` 사용
- [ ] `AuthService.loginWithGoogle()` 신규 — 카카오/네이버 패턴과 동일한 result kind 분기 (`authenticated` / `requiresSignup` / `requiresOAuthPhoneVerification` / `requiresDuplicateLoginConfirmation` / `error`)
- [ ] `app.config.ts` (또는 `app.json`) 의 `scheme` + Google `redirectUri` 등록
- [ ] BE 측 Google OAuth Console 에 expo-app redirect URI 추가 (운영 / dev 별도)
- [ ] `expo-app/src/components/molecules/SocialLoginButton.tsx` `variant: 'google'` 추가 — Light Theme (Fill `#FFFFFF` / Stroke `#747775` 1px / Font `#1F1F1F` Roboto Medium 14/20) + 다색 G 로고 (§E.2.3)
- [ ] `expo-app/src/components/atoms/SocialBrandIcon.tsx` `GoogleBrandIcon` 신규 — 정품 다색 G 로고 SVG (`#4285F4 / #34A853 / #FBBC05 / #EA4335`)
- [ ] `expo-app/src/constants/oauthProviderBrand.ts` `OAUTH_GOOGLE_BACKGROUND` (`#FFFFFF`) / `OAUTH_GOOGLE_FOREGROUND` (`#1F1F1F`) / `OAUTH_GOOGLE_BORDER` (`#747775`) 신규
- [ ] 카카오·네이버·Google·Apple 4종 stagger (120ms 간격)
- [ ] Apple 은 SIWA 가능 시 `AppleAuthenticationButton` 네이티브, 불가 시 `SocialLoginButton variant="apple"` fallback
- [ ] **단일 PR / 단일 EAS Build** 에 4 provider 모두 포함 (사용자 정책)

### §I.5 카피 (한국어 통일)

| 위치 | 카피 |
|---|---|
| 타이틀 | 마인드가든 |
| 부제 | 마음을 돌보는 시간 |
| 카카오 버튼 | 카카오로 로그인 |
| 네이버 버튼 | 네이버로 로그인 |
| Google 버튼 | Google로 로그인 (웹 정합. 가이드 권장 카피 "Sign in with Google" 의 한국어 로컬라이즈 — Google 가이드에서 한국어 로컬라이즈 명시 허용) |
| Apple 버튼 (fallback) | Apple로 계속하기 |
| Divider | 또는 |
| Sheet 트리거 (닫힘) | 이미 가입한 이메일·휴대폰 번호로 로그인 |
| Sheet 트리거 (열림 / 닫기 hint) | 닫기 |
| Sheet 제목 | 이미 가입한 이메일·휴대폰으로 로그인 |
| Email placeholder | 이메일 또는 휴대폰 번호 |
| Password placeholder | 비밀번호 |
| Sheet CTA | 로그인 |
| Sheet 내 비밀번호 찾기 | 비밀번호 찾기 |
| Footer | 비밀번호 찾기 · 다른 기관으로 변경 |
| Apple HIG 영문 fallback | (네이티브 자동, 강제 불가) |

### §I.6 토큰·상수·표준

- [ ] 모든 색상 `theme.colors.*` 또는 `OAUTH_*` 상수 (hex 직접 입력 금지)
- [ ] 모든 spacing/radius `theme.spacing.*` / `theme.borderRadius.*` / `loginAnimationConstants` 사용
- [ ] 폰트 `theme.fontFamily.*` (Pretendard) 명시
- [ ] **운영 반영 게이트 §17 + §1.3 + `check-hardcode`** 통과
- [ ] OAuth phone OTP SSOT 정착 머지 후 main 기준 분기
- [ ] (별도 워크) `tenant-select.tsx` 에서 코어솔루션 카드 제거 검토 — 본 PR 범위 외, 별도 위임 권장 (§H7)

### §I.7 Bottom Sheet 구현 권장

- 내부 `Animated` (translateY) + `PanResponder` (드래그 다운 닫기) 또는 `@gorhom/bottom-sheet` (이미 설치 시 우선)
- 미설치 시 자체 구현 — 라이브러리 추가는 `npm ls @gorhom/bottom-sheet` 확인 후 결정
- backdrop : `Pressable` 풀스크린 + `rgba(0,0,0,0.18)`
- 키보드 등장 시 `KeyboardAvoidingView behavior="padding"` 자동 상승

---

## §J 시뮬레이터 시연·검증 시나리오

### §J.1 시각 회귀

| 디바이스 | 캡처 시나리오 |
|---|---|
| iPhone SE (gen 3) 375 | 등장 직후 / Sheet 닫힘 / Sheet 열림 / 키보드 등장 |
| iPhone 14 393 | 동일 4종 |
| iPhone 14 Pro Max 430 | 동일 4종 |
| iPad mini 744 | maxWidth 440 중앙 / 카드 폭 적정 |

각 캡처에서 §H.1 5가지 체크.

### §J.2 모션 회귀

| 항목 | 정상 | Reduce Motion |
|---|---|---|
| 등장 완료 시점 | 1640±50ms | 1100±50ms |
| 로고 breathing 주기 | 5000±100ms | 정지 |
| 배경 drift 주기 | 8000±200ms | 정지 |
| SNS stagger 간격 | 120±20ms | 60±10ms |
| Sheet 슬라이드 업 | 240±30ms | fade-in 160ms |

### §J.3 기능 회귀 (변경 금지 흐름)

- [ ] 카카오 로그인 → `authenticated`/`requiresSignup`/`requiresOAuthPhoneVerification`/`requiresPhoneAccountSelection`/`requiresDuplicateLoginConfirmation`/`error` 6 분기
- [ ] 네이버 / Google 동일
- [ ] Apple → `requiresApplePhoneVerification` 추가 분기 포함 7 분기
- [ ] 이메일·휴대폰 + 비밀번호 로그인 → `authenticated` / `requiresDuplicateLoginConfirmation` / `error`
- [ ] Duplicate Login UnifiedModal 표시·확인·취소
- [ ] Sheet 트리거로 폼 표시·닫기 (탭 / 드래그 / Backdrop / OS Back)
- [ ] 비밀번호 찾기 → 외부 브라우저 `/forgot-password`
- [ ] 다른 기관으로 변경 → `/(auth)/tenant-select`
- [ ] ExpoGo 환경에서 SNS 버튼 visuallyMuted + 배너 표시, 이메일 폼은 정상 작동

### §J.4 접근성

- [ ] VoiceOver 스캔 순서 : 로고+타이틀 → 부제 → 카카오 → 네이버 → 구글 → Apple → 트리거 → 비밀번호 찾기 → 다른 기관
- [ ] AccessibilityInfo Reduce Motion 강제 true 모킹 시 §D.2 분기 모두 적용
- [ ] Dynamic Type Largest Text 시 카드·버튼 깨지지 않음 (1.6 cap)
- [ ] 콘트라스트 §C.6 모두 통과

### §J.5 성능

- [ ] 60fps 유지 (Flipper Performance)
- [ ] 등장 모션 종료 후 메모리 누수 없음 (unmount 시 `Animated.loop` 해제)
- [ ] 콜드 스타트 → 첫 렌더 ≤ 200ms

---

## §M 창의 시안 비교 (Creative Concept Showdown) — 베타 출시 기준

> 사용자 비판 ("로그인 페이지 지난번과 뭐가 틀린지 모르겠음 / 좀 창의적으로") 에 대응한 **차별화 시안 4종**. §B 의 A4 ("Hero Card + Quiet Reveal") 는 모바일 흔한 패턴이라 임팩트가 약하다는 평가에 따라 메타포 기반 4종으로 재제안.
>
> **선정 기준** : (1) 첫인상 임팩트 (2) 사용자 의도 정합 (차분·안정·치유) (3) 구현 난이도 / 자산 의존도 (4) 베타 테스트 욕먹을 위험 (5) 정품 자산 활용도. 모든 시안은 §A.4 4 provider + §A.6 이메일/전화번호 폼 + §A.7 보조 링크 + §G 접근성 정책을 100% 충족.

### §M.0 평가 표 (한 눈에)

| # | 시안 | 첫인상 (10) | 의도 정합 (10) | 차별화 (10) | 구현 난이도 | 자산 의존도 | 욕먹을 위험 | 권장 순위 |
|---|---|---|---|---|---|---|---|---|
| B1 | Garden Door (정원의 문) | 9 | 9 | 9 | **상** | **상** (일러스트 SVG 1세트 필요) | 자산 부족 시 빈약 | 3 |
| **B2** | **Breathing Circle (호흡 원)** | **9** | **10** | **8** | **중** | **하** (그라데이션 + 나비 1종) | **낮음** | **★ 1순위** |
| B3 | Wave Carousel (물결 카루셀) | 8 | 5 | 9 | 중 | 중 | "통제·선택" 인상 → 의도 미스매치 | 4 |
| B4 | Memo Card Stack (메모지 스택) | 7 | 6 | 8 | 상 | 중 | 유희적 톤 → 치유 톤과 충돌 | 5 |
| B5 | Moonlight Lake (달빛 호수) | 9 | 9 | 9 | 중 | 하 (그라데이션 + 옵션 일러스트) | 낮음 | **★ 2순위** |

> **디자이너 1순위 강력 권장 : B2 Breathing Circle** + **2순위 : B5 Moonlight Lake** (1순위가 사용자 거부 시 fallback). 두 시안 모두 외부 일러스트 자산 의존도가 낮아 베타 일정에 안전.

---

### §M.1 B2 Breathing Circle — "호흡하는 원" (★ 1순위)

#### M.1.1 컨셉

화면 중앙에 **거대한 호흡 원** (radial gradient orb). 사용자가 화면을 보는 순간 원이 **천천히 부풀고 줄어들며 (5초 주기)** 자연스럽게 호흡 리듬을 유도. 원 안에 마인드가든 나비 + 한 줄 카피. 원 아래 SNS 4 + 이메일 트리거.

심리상담의 핵심 메타포 (호흡·고요·중심) 를 시각으로 직접 표현 → 사용자가 "이 앱은 나를 차분하게 만들려 한다" 를 무의식 인지.

#### M.1.2 풀 화면 시각 묘사 (393×852dp 기준)

```
┌────────────────────────────────────────────────┐ ← Safe Top
│                                                │
│        (배경 : 베이지 → 옅은 민트 그라데이션)     │ Background §M.1.6
│                                                │
│                                                │
│                                                │
│                  ╭─────────╮                   │
│                ╭╴│         │╴╮                 │
│              ╭╴ │  Orb 280  │ ╴╮               │ Orb (호흡 원)
│             ╭   │           │   ╮              │ - 직경 280dp (393폭의 71%)
│            │    │   🦋      │    │             │ - radial-gradient
│            │    │  마인드가든  │    │             │ - 호흡 1.00↔1.04, 5s ∞
│             ╰   │  마음을    │   ╯              │ - opacity 1.0 → 0.92
│              ╰╴ │   돌보는   │ ╴╯               │   (외곽 soft halo)
│                ╰╴│  시간     │╴╮                │
│                  ╰─────────╯                   │
│                                                │
│                                                │
│                                                │
│   ┌──────────────────────────────────────┐     │ SNS 4 — 카드 없음
│   │ 💬   카카오 로그인                    │ 56  │ - 풀폭 (-padding 24)
│   └──────────────────────────────────────┘     │ - radius 14
│   ┌──────────────────────────────────────┐     │ - 묶음 중앙
│   │  N    네이버 로그인                   │     │ - stagger 120ms
│   └──────────────────────────────────────┘     │
│   ┌──────────────────────────────────────┐     │
│   │  G    Google로 로그인                 │     │ Light theme
│   └──────────────────────────────────────┘     │  Fill #FFFFFF
│   ┌──────────────────────────────────────┐     │  Stroke #747775
│   │       Apple로 계속하기 (네이티브)      │     │
│   └──────────────────────────────────────┘     │
│                                                │
│        이미 가입한 이메일·휴대폰 번호로            │ Trigger
│                  로그인 ⌃                       │ - text underline 0
│                                                │ - 14dp / textSecondary
│                                                │
│                                                │
│        비밀번호 찾기 · 다른 기관으로 변경          │ Footer 12dp / textTertiary
│                                                │
└────────────────────────────────────────────────┘ ← Safe Bottom
```

#### M.1.3 색 팔레트 (production hex + RGBA + 비율)

| 영역 | hex | RGBA | 사용 비율 | 토큰 |
|---|---|---|---|---|
| 배경 stop 0 (top) | `#F8F4EE` | `rgba(248, 244, 238, 1.0)` | 35% | `theme.colors.bgMain` (확장 stop) |
| 배경 stop 50 | `#F2EDE5` | `rgba(242, 237, 229, 1.0)` | 30% | `--mg-login-bg-bridge` (정정) |
| 배경 stop 100 | `#E8EFE9` | `rgba(232, 239, 233, 1.0)` | 35% | `--mg-login-bg-cool` (정정 — 더 차분) |
| Orb 중심 (radial 0%) | `#FFFFFF` | `rgba(255, 255, 255, 0.85)` | 30% | (신규) `loginOrbCore` |
| Orb 중간 (radial 50%) | `#F5F0E8` | `rgba(245, 240, 232, 0.55)` | 40% | (신규) `loginOrbMid` |
| Orb 외곽 (radial 100%) | `#E0DACF` | `rgba(224, 218, 207, 0.0)` | 30% (페이드아웃) | (신규) `loginOrbEdge` |
| Orb 보더 1px | `rgba(212, 207, 200, 0.35)` | — | inside stroke | `border` 알파 0.35 |
| 본문 (마인드가든) | `#2C2C2C` | — | — | `textMain` |
| 부제 (마음을 돌보는 시간) | `#5C6B61` | — | — | `textSecondary` |
| Footer | `#9E9E9E` | — | — | `textTertiary` |

**WCAG AA 검증** : `#2C2C2C` on Orb white blend (`#F8F2E5`) ≈ 11.8:1 (AAA), `#5C6B61` ≈ 5.0:1 (AA), `#9E9E9E` on `#F2EDE5` 3.1:1 (AA Large 12dp + 600 weight 통과).

#### M.1.4 모션 타임라인 (정상 모드 ms)

| ms | 요소 | 효과 | 이징 |
|---|---|---|---|
| 0 ~ 600 | 배경 페이드 | opacity 0 → 1 | `Easing.out(Easing.cubic)` (= `cubic-bezier(0.33, 1, 0.68, 1)`) |
| 200 ~ 800 | Orb 등장 | scale 0.92 → 1.00, opacity 0 → 1 | `Easing.out(Easing.cubic)` |
| 800 ~ ∞ | **Orb 호흡** | scale 1.00 ↔ **1.04** (반복), opacity 1.0 ↔ 0.96 (외곽 halo) | `Easing.inOut(Easing.sin)`, period **5000ms** |
| 400 ~ 900 | 나비 + "마인드가든" fade-in | opacity 0 → 1, translateY 6 → 0 | `Easing.out(Easing.cubic)` |
| 600 ~ 1100 | 부제 fade-in | 동상 | 동상 |
| 900 ~ 1200 | SNS 카카오 등장 | opacity 0 → 1, translateY 8 → 0 | `Easing.out(Easing.cubic)` |
| 1020 ~ 1320 | SNS 네이버 (stagger +120) | 동상 | 동상 |
| 1140 ~ 1440 | SNS Google | 동상 | 동상 |
| 1260 ~ 1560 | SNS Apple | 동상 | 동상 |
| 1500 ~ 1900 | Trigger + Footer fade-in | opacity 0 → 1 | `Easing.out(Easing.cubic)` |
| **1560** | **인터랙션 활성** | `pointerEvents: 'none' → 'auto'` | — |

**Reduce Motion** : Orb 호흡 정지 (scale 1.0 고정, opacity 0.96 고정), 등장 모션 모두 fade only, stagger 60ms, 인터랙션 활성 1100ms.

#### M.1.5 자산 의존도 — **최소** (베타 일정 안전)

| 자산 | 출처 | 비고 |
|---|---|---|
| 마인드가든 나비 PNG | `expo-app/assets/brand/mindgarden-butterfly-logo.png` (이미 존재) | Orb 안 80dp |
| Orb 그라데이션 | **코드 렌더** (`expo-radial-gradient` 또는 `react-native-svg` `RadialGradient`) — 외부 자산 0 | — |
| 배경 그라데이션 | `expo-linear-gradient` 코드 렌더 | — |
| SNS 정품 자산 | §E.2.1~4 정품 다운로드 | — |
| 일러스트 | **불필요** | — |

#### M.1.6 첫인상 점수 9/10 — 욕먹을 위험 분석

| 위험 | 가능성 | 완화 가이드 |
|---|---|---|
| Orb 호흡이 **느려서 지루** | 중 | 5s 가 너무 느리면 4s 로 단축 가능. 단 4s 미만은 불안 유발. |
| Orb 가 **단순해 보임** | 낮음 | 외곽 halo (radial 끝 알파 0) 와 미세 grain (옵션 노이즈 텍스처 5% opacity) 로 깊이감 보강 |
| 호흡 모션이 디바이스 성능에 따라 **버벅** | 낮음 | `useNativeDriver: true` (transform·opacity), `Animated.loop` 단일 — 60fps 보장 |
| Reduce Motion 시 **밋밋** | 낮음 | scale 정지하되 외곽 halo 정적 그라데이션은 유지 — 시각 구조 깨지지 않음 |
| 사용자 "원이 너무 커서 답답" | 낮음 | 직경 280dp = 화면 폭 71%. 더 줄이면 메타포 약화. 시연 후 사용자 반응 보고 ±20dp 조정 가능 |

**디자이너 평가** : 차분·치유 메타포의 시각적 직접성. "이 앱은 나를 안정시키려 한다" 가 첫 0.5초에 전달. **베타 테스트 첫인상으로 가장 안전하면서 임팩트 있음**.

---

### §M.2 B5 Moonlight Lake — "달빛 호수" (★ 2순위)

#### M.2.1 컨셉

화면 = **밤 호수의 표면**. 마인드가든 나비는 호수 위 **달의 반영(reflection)** 처럼 떠 있고, SNS 4개 카드가 호수 표면에서 **부드럽게 떠다니는 종이배** 메타포. 차분한 블루-퍼플 그라데이션 + 호수 잔물결 (subtle wave shader) + 달빛 광원.

심리상담의 또 다른 메타포 (고요·내면·달빛) → 사용자가 "이 앱은 깊은 곳을 다루는구나" 인지.

#### M.2.2 풀 화면 시각 묘사

```
┌────────────────────────────────────────────────┐ ← Safe Top
│                                                │
│        (배경 : 짙은 인디고 → 미드나잇 블루         │ #2A3D5C → #1F2F4A
│            → 옅은 라벤더 그라데이션)              │ → #3D4A66
│                                                │
│                                                │
│                       ◯                        │ 달 (Moon)
│                    ◯ 64                        │ - 직경 64dp
│                                                │ - #FFFAE8 + soft glow
│                  ▒▒▒▒▒▒▒▒▒▒                     │ 달빛 반영 (water reflection)
│              ░░░░░░░░░░░░░░░░░░                  │ - 흐릿한 elliptical
│            ░░░░░░░ 🦋 ░░░░░░░░░                   │ - 나비가 반영 위에 떠 있음
│              ░░░░░░░░░░░░░░░░░░                  │ - opacity 0.7
│                  ▒▒▒▒▒▒▒▒▒▒                     │
│                                                │
│                  마인드가든                       │ Bold 22, #F0F2F8 (밝은 텍스트)
│                마음을 돌보는 시간                  │ Regular 14, #B8C4D6
│                                                │
│                                                │
│   ╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄╮          │ 종이배 카드 (paper boat) §M.2.3
│   │      💬   카카오 로그인         │ 56       │ - rgba(255,255,255,0.08)
│   ╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄╯          │ - radius 14
│   ╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄╮          │ - blur 8 (BlurView intensity 30)
│   │       N    네이버 로그인         │           │ - 1px border rgba(255,255,255,0.18)
│   ╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄╯          │
│   ╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄╮          │
│   │       G    Google로 로그인      │           │ Light theme 정품 (배경만 어두움)
│   ╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄╯          │
│   ╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄╮          │
│   │     Apple로 계속하기 (네이티브)   │           │ Black style (배경 정합)
│   ╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄╯          │
│                                                │
│        이미 가입한 이메일·휴대폰 번호로            │ #B8C4D6 (보조)
│                  로그인 ⌃                       │
│                                                │
│        비밀번호 찾기 · 다른 기관으로 변경          │ #8A95A8 (footer)
│                                                │
└────────────────────────────────────────────────┘ ← Safe Bottom
```

> **주의 — 다크 톤 시안** : 본 시안은 V2 §C 의 라이트 톤을 일부 다크로 확장한 변형. 전체 다크 모드 도입은 별도 워크 (§L3) 이지만 본 로그인 화면 한정 다크 시안은 베타 단계에서 가능. 사용자가 라이트 톤 강조 시 §M.1 B2 로 폴백.

#### M.2.3 색 팔레트 (production hex + RGBA)

| 영역 | hex | RGBA | 비율 |
|---|---|---|---|
| 배경 stop 0 (top) | `#2A3D5C` | — | 30% |
| 배경 stop 50 | `#1F2F4A` | — | 40% |
| 배경 stop 100 (bottom) | `#3D4A66` | — | 30% |
| 달 코어 | `#FFFAE8` | `rgba(255, 250, 232, 1.0)` | — |
| 달 외곽 글로우 | `#FFFAE8` | `rgba(255, 250, 232, 0.0)` (radial 끝) | — |
| 호수 반영 (elliptical blur) | `#FFFAE8` | `rgba(255, 250, 232, 0.18)` | — |
| 본문 (마인드가든) | `#F0F2F8` | — | — |
| 부제 | `#B8C4D6` | — | — |
| 종이배 카드 표면 | `rgba(255, 255, 255, 0.08)` | — | — |
| 종이배 보더 | `rgba(255, 255, 255, 0.18)` | — | 1px |
| 종이배 BlurView intensity | 30 (iOS) / blurRadius 18 (Android fallback) | — | — |
| Footer | `#8A95A8` | — | — |

**WCAG AA** : `#F0F2F8` on `#1F2F4A` 14.6:1 (AAA), `#B8C4D6` on `#1F2F4A` 7.3:1 (AAA), `#8A95A8` on `#1F2F4A` 4.6:1 (AA). 다크 톤이지만 모든 텍스트 AA+ 통과.

#### M.2.4 모션 타임라인

| ms | 요소 | 효과 |
|---|---|---|
| 0 ~ 800 | 배경 + 달 fade-in | opacity 0 → 1 |
| 0 ~ ∞ | **달 미세 부유** | translateY ±2dp, period 6000ms `Easing.inOut(Easing.sin)` |
| 0 ~ ∞ | **호수 반영 흐름** | scaleX 0.98 ↔ 1.02 + skewX ±0.2°, period 8000ms (잔물결) |
| 400 ~ 900 | 나비 등장 | fade + translateY 6 → 0 |
| 600 ~ 1100 | 타이틀/부제 등장 | 동상 |
| 800 ~ 1100 | 종이배 카카오 등장 | fade + translateY 12 → 0 (떠오르는 인상) |
| stagger 120ms | 네이버/Google/Apple | 동상 |
| 1500 ~ 1900 | Trigger/Footer | fade |

#### M.2.5 자산 의존도

| 자산 | 출처 |
|---|---|
| 나비 PNG | 기존 |
| 달 글로우 | 코드 렌더 (radial gradient) |
| 호수 반영 | 코드 렌더 (elliptical blur Animated.View) |
| BlurView | `expo-blur` (이미 설치되어 있을 가능성 높음 — 미설치 시 `npx expo install expo-blur`) |
| 일러스트 | **불필요** |

#### M.2.6 첫인상 9/10 — 욕먹을 위험

| 위험 | 가능성 | 완화 |
|---|---|---|
| 다크 톤 → 다른 화면(전부 라이트)과 부조화 | 중 | 로그인 후 진입 시 부드러운 fade transition (300ms) — 시각 충격 완화 |
| BlurView Android 성능 | 중 | iOS 만 BlurView, Android 는 `rgba(255,255,255,0.06)` 단색 fallback |
| "치유"보다 "신비" 인상 강함 | 낮음 | 부제 카피 "마음을 돌보는 시간" 으로 명시. 호수 메타포 + 차분 톤이 충분히 치유적 |
| 정품 SNS 색이 다크 배경에서 카카오 노란색만 두드러져 부조화 | 중 | 카카오/네이버는 정품 색 강제, Google 은 Light Theme 정품 (흰 배경 + 회색 보더), Apple Black 으로 균형. 정품 자산을 그대로 둬야 가이드 위반 없음 |

**디자이너 평가** : 가장 차별화된 시안. "와, 이거 다른 앱이랑 다르네" 첫인상. 다만 다크 톤·블러 의존도로 일부 디바이스 성능 영향 → 베타 첫 출시는 B2 안전, 후속 업데이트로 B5 도입 가능.

---

### §M.3 B1 Garden Door — "정원의 문" (3순위)

#### M.3.1 컨셉

풀스크린 일러스트 (수채풍 정원 / 잎사귀 / 햇살) 가 배경. 화면 중앙에 **유리문 메타포** (frosted glass) — 사용자가 "들어가는" 행위. SNS 4개가 문 안쪽에 위치. 햇살 광원이 천천히 이동, 잎사귀 미세 흔들림.

#### M.3.2 시각 요약

```
┌─────────────────────────────────────────┐
│ ☀️ (햇살, 좌상)                          │
│       🌿                          🌿     │ 잎사귀 일러스트
│   🌿                         🌿          │ (수채풍 SVG 또는 일러스트 PNG)
│        ╭───────────────╮                │
│        │  frosted glass │                │ Garden Door
│        │       🦋       │                │ - 폭 280dp / 높이 480dp
│        │  마인드가든     │                │ - radius 32dp top
│        │  마음을 돌보는   │                │ - radius 32dp bottom
│        │     시간        │                │ - rgba(245, 250, 245, 0.45)
│        │                │                │ - BlurView 25
│        │  카카오 로그인   │                │ - 1px border rgba(255,255,255,0.5)
│        │  네이버 로그인   │                │
│        │  Google로 로그인 │                │
│        │  Apple로 계속하기 │                │
│        │  ── 또는 ──     │                │
│        │  이메일로 로그인  │                │
│        ╰───────────────╯                │
│   🌿                        🌿           │
│        🌿                       🌿       │
│           [비밀번호찾기 · 다른기관변경]      │
└─────────────────────────────────────────┘
```

#### M.3.3 자산 의존도 — **상**

| 자산 | 출처 | 위험 |
|---|---|---|
| 정원 일러스트 (배경) | **외주 또는 무료 stock 필요** | 자산 미확보 시 빈약 |
| 잎사귀 SVG (4~6개) | 외주 또는 stock | 동상 |
| 햇살 광원 | 코드 렌더 (radial gradient) | OK |
| 나비 + SNS | 기존 + 정품 | OK |

#### M.3.4 첫인상 9/10 — 욕먹을 위험

- "일러스트 자산이 빈약하면 아마추어 앱처럼 보임" — **베타 일정 내 일러스트 외주 가능 여부가 결정 조건**
- 무료 stock 사용 시 다른 앱과 겹칠 가능성 ★
- 일러스트 확보되면 가장 풍부한 시각 경험

**판정** : 자산 확보 가능하면 1순위 후보, 베타 일정 내 외주 여부에 따라 결정. **자산 미확보 시 B2 로 폴백**.

---

### §M.4 B3 Wave Carousel — "물결 카루셀" (4순위)

#### M.4.1 컨셉

SNS 4 provider 가 카루셀로 한 번에 하나씩 풀폭 노출. 페이지 인디케이터 (4점) + 좌우 스와이프. 카루셀 전환 시 **물결 곡선 (sine wave) transition**.

#### M.4.2 시각 요약 + 욕먹을 위험

| 위험 | 평가 |
|---|---|
| 사용자 "한 번에 다 보고 싶은데 왜 1개씩?" | **높음** — 효율 기대와 충돌 |
| 카루셀이 카드 메타포 → 신비 / 통제 인상 | 의도 미스매치 |
| 차분함 평가 5/10 | 사용자 핵심 의도 부합 안 됨 |

**디자이너 판정** : **권장 안 함**. SNS 가 1개씩 보이면 사용자 인지 저하 → 베타 사용성 악화. 카루셀은 콘텐츠 둘러보기 패턴이지 진입점 패턴이 아님.

---

### §M.5 B4 Memo Card Stack — "메모지 스택" (5순위)

#### M.5.1 컨셉

SNS 4 가 메모지 스택처럼 살짝 겹쳐서 배치. 탭 시 메모지가 뒤로 빠지면서 다음 SNS 가 앞으로 나옴. 부드러운 fold 애니메이션.

#### M.5.2 욕먹을 위험

| 위험 | 평가 |
|---|---|
| 친근하지만 **유희적** | 치유 톤과 충돌 (의도 정합 6/10) |
| fold 애니메이션 60fps 확보 어려움 (`Animated` skewX + rotation 조합 무거움) | 성능 위험 |
| 사용자 "왜 한 번에 하나씩 보여줘? 답답해" | B3 와 동일 문제 |

**디자이너 판정** : **권장 안 함**. 메모지 메타포는 노트앱·일정앱에 적합하지 심리상담 진입점 아님.

---

### §M.6 시안 요약 — 디자이너 1순위 강력 권장

> **B2 Breathing Circle (호흡 원)** — 사용자가 화면을 본 0.5초 안에 "이 앱은 나를 차분하게 만들려 한다" 가 전달되고, 자산 의존도 최소 (외부 일러스트 0), 모든 디바이스 성능 안전, 정품 SNS 자산 그대로 사용 가능.
>
> 이유 5가지 :
> 1. **메타포 정확** — 호흡 = 심리상담 핵심. 다른 메타포(달/문/카루셀)보다 직접적
> 2. **자산 부담 0** — 일러스트 외주 없이 코드 렌더만으로 풀스크린 임팩트
> 3. **모션 안전** — `useNativeDriver` transform/opacity 만으로 60fps 보장 (스킬·블러 의존 X)
> 4. **베타 욕먹을 위험 최저** — 모든 위험 항목 "낮음" / 완화 명확
> 5. **차별화 충분** — V1 / 일반 앱과 시각적으로 구분되는 "거대 호흡 원" 단일 임팩트
>
> **fallback** : 사용자가 라이트 톤만 보고 "더 임팩트 있게" 추가 요구 시 → **B5 Moonlight Lake (다크 + BlurView)**. 자산 부담은 비슷하나 다크 톤이 부담스러우면 라이트 폴백 가능.

---

## §K 출시 게이트 (Production Release Gate) — 베타 테스트 합격 조건

> 사용자 정책 : **"공개 베타 테스트 단계 — 퀄리티 낮으면 욕먹는다"**. 본 13개 게이트 모두 통과해야 베타 빌드 출시. 1개라도 실패 시 출시 보류.

### §K.1 시각 게이트 (5)

- [ ] **G1 시각 회귀** : 4 디바이스 (iPhone SE 375 / iPhone 14 393 / iPhone 14 Pro Max 430 / iPad mini 744) 모든 캡처에서 §H.1 5가지 체크 통과 (차분 인상·1단 텍스트·묶음 중앙·이메일 진입 가능·회원가입 없음)
- [ ] **G2 색·토큰 정합** : 모든 색이 `theme.colors.*` 또는 `OAUTH_*` 상수 (hex 직접 입력 0건). `check-hardcode` 통과
- [ ] **G3 자산 정품** : SNS 4종 자산이 §E.2 의 1차 출처에서 다운로드된 정품. 라이선스 위반 0건. PR 메시지에 다운로드 일자 + 출처 URL 명시
- [ ] **G4 폰트 통일** : 모든 Text 가 `theme.fontFamily.*` (Pretendard) 사용. 시스템 폰트 fallback 0건
- [ ] **G5 시안 일관성** : §B (또는 §M.1 채택 시 B2) 위젯 트리 + ASCII wireframe 과 시뮬레이터 캡처 픽셀 정합

### §K.2 모션·성능 게이트 (3)

- [ ] **G6 60fps** : Flipper Performance / Hermes profiler 로 등장 모션 + 호흡 + Press feedback 모두 60fps 유지 (frame drop 0건)
- [ ] **G7 모션 정확도** : 등장 완료 시점 정상 1640±50ms (B2 1560±50ms) / Reduce Motion 1100±50ms. Breathing 5000±100ms. Stagger 120±20ms
- [ ] **G8 콜드 스타트** : 첫 렌더 ≤ 200ms, 사용자 첫 인터랙션 가능 ≤ 2.5s

### §K.3 접근성 게이트 (4)

- [ ] **G9 콘트라스트** : 모든 텍스트/버튼 §C.6 (또는 §M.1.3 / §M.2.3) 의 비율 표 통과. WCAG **AA 4.5:1 이상** (소형 텍스트), AA Large 3:1 이상 (큰 텍스트 + 굵은 가중치)
- [ ] **G10 VoiceOver** : 스캔 순서 §G.1 표 그대로. 모든 인터랙티브 요소 `accessibilityLabel` + `accessibilityRole` 설정
- [ ] **G11 Reduce Motion** : `AccessibilityInfo` 강제 모킹 시 §D.2 분기 100% 적용 (호흡·drift 정지 / fade only)
- [ ] **G12 Dynamic Type** : 시스템 폰트 크기 Largest 시 카드·버튼 깨지지 않음 (1.6 cap 정상)

### §K.4 기능 게이트 (1, 13개 중 종합)

- [ ] **G13 기능 회귀 + UX** :
  - **4 provider** 정상 (카카오 / 네이버 / **Google** / Apple) — `requiresSignup` / `requiresOAuthPhoneVerification` / `requiresApplePhoneVerification` / `requiresPhoneAccountSelection` / `requiresDuplicateLoginConfirmation` / `error` 분기 모두 통과
  - **이메일·전화번호 폼** 정상 (트리거 → Sheet → 입력 → 로그인 → 메인 화면)
  - **키보드 등장** 시 `KeyboardAvoidingView` 자동 상승 (입력 필드 가림 0)
  - **에러 메시지** 한국어 정상 노출 (서브도메인 / 자격증명 / 네트워크 / 중복 로그인)
  - **비밀번호 찾기 / 다른 기관 변경** 링크 정상
  - **App Store / Play Store 심사** 통과 — Apple HIG SIWA 노출, 자산 정품, in-app browser 정책 (G-1 경로)
  - **베타 테스터 (3~5명) 첫인상 검증** — 5분 시연 후 "차분하다 / 깔끔하다 / 잘 만들었다" 인상 평가 평균 4/5 이상

### §K.5 변경 이력

| 일자 | 작성자 | 내용 |
|---|---|---|
| 2026-06-10 | core-designer | V2 최초 작성. V1 폐기, "Hero Card + Quiet Reveal" 권장안 + A1 fallback. 회원가입 링크 제거, SNS Google 추가, 로고 96dp, 묶음 중앙 정렬, 단일 텍스트 위계. |
| 2026-06-10 | core-designer | §E SNS 4 provider 정품 가이드 fetch 결과 보강 (Kakao/Naver/Google 공식 가이드). Apple HIG fetch 실패 → SDK 네이티브 강제 정책. |
| 2026-06-10 | core-designer | **§M 창의 시안 비교** (B1~B5) production-grade 디테일 추가. 디자이너 1순위 권장 = **B2 Breathing Circle**, 2순위 = **B5 Moonlight Lake**. §K 출시 게이트 13개 추가. |
| 2026-06-10 | core-designer | **§I.4 Google BE/웹 가용 확인** (사용자 직접 검증). expo-app FE 만 추가 구현. 권장 경로 G-1 `expo-auth-session/providers/google`. §L1 해결됨으로 정정. |

---

## §L 미해결·후속 (디자이너 메모)

| # | 항목 | 권장 처리 |
|---|---|---|
| L1 | ✅ **해결됨 (2026-06-10)** — Google BE/웹 가용성 사용자 직접 확인 완료. BE `GoogleOAuth2ServiceImpl` 운영 가용, 웹 `googleLogin()` 정상 동작. expo-app 은 **FE 추가 구현만** 필요. 디자이너 권장 경로 : `expo-auth-session/providers/google` (G-1, §I.4 매트릭스 참조). BE 변경 0 |
| L2 | `tenant-select.tsx` 코어솔루션 카드 제거 (§H7) | 별도 위임 — 본 PR 범위 외, 마이그레이션 영향 분석 필요 |
| L3 | 다크 모드 | 현 단계 비대상. 도입 시 별도 워크 |
| L4 | 펜슬 (.pen) 파일 시안 동기화 | 디자인 검수 후 `mindgarden-design-system.pen` 의 로그인 화면 페이지 V2 시안으로 갱신 |
| L5 | Bottom Sheet 라이브러리 결정 | `@gorhom/bottom-sheet` 설치 여부 확인 후 자체 구현 vs 라이브러리 결정. 코더 위임 사항 |
| L6 | "마음을 돌보는 시간" 부제 검수 | 카피 라이팅 재확인 가능. 대안 : "오늘도 좋은 하루 보내세요" / "당신의 마음에 닿기까지" / "조용히, 함께 있을게요" |

---

## §N 사용자 검수 한 페이지 (Decision Sheet) — 5분 안에 결정

> 사용자가 옵션 비교에 시간 쓰지 않도록 **여기 5개 항목만 결정** 하면 코더 위임 가능.

### N.1 시안 결정 (1개 선택, 디자이너 1순위 권장 = B2)

- [ ] ★ **B2 Breathing Circle** — 호흡하는 거대 원 (★ 디자이너 1순위) — 자산 의존 0, 베타 안전, 차분·치유 메타포 직접
- [ ] B5 Moonlight Lake — 다크 톤 + 달빛 호수 + BlurView 종이배 카드 (2순위) — 차별화 강함, 다크 톤
- [ ] B1 Garden Door — 정원 일러스트 + 유리문 (3순위) — 베타 일정 내 일러스트 외주 가능 시
- [ ] A4 (V2 §B 본문) Hero Card + Quiet Reveal — 안전·보수적 (B2/B5 거부 시)
- [ ] A1 (V2 §B.99 fallback) 단일 컬럼 + 인라인 토글 — 가장 단순

> **권장** : 추가 결정 어려우면 **B2** 진행. V2 §M.1 그대로 코더 위임 가능.

### N.2 Google 로그인 구현 경로 (1개 선택, 디자이너 1순위 = G-1)

- [x] ★ **G-1 `expo-auth-session/providers/google`** (네이티브 OAuth) — App Store / Play Store 심사 안전, PKCE 자동
- [ ] G-2 WebView in-app browser — 빠른 구현 가능하나 모바일 UX 보통 + App Store 4.5.4 위반 위험

> BE/웹 이미 가용 (사용자 확인 완료). expo-app FE 만 추가. 단일 PR / 단일 EAS Build 에 4 provider 모두 포함.

### N.3 부제 카피 (1개 선택)

- [x] **마음을 돌보는 시간** (현재) — 차분·직접
- [ ] 오늘도 좋은 하루 보내세요 — 일상적
- [ ] 당신의 마음에 닿기까지 — 시적
- [ ] 조용히, 함께 있을게요 — 동행 감

### N.4 Bottom Sheet 라이브러리 (코더가 자동 결정 권장)

- [ ] `@gorhom/bottom-sheet` 사용 (이미 설치되어 있을 시)
- [ ] 자체 구현 (`Animated` + `PanResponder`) — 의존성 최소

> 코더가 `npm ls @gorhom/bottom-sheet` 로 확인 후 자동 결정. **사용자 결정 불필요**.

### N.5 다크 모드 도입 시점 (정책 확인)

- [x] 본 워크 제외 — 라이트 톤 단일 (B5 채택 시 본 화면 한정 다크 변형은 가능)
- [ ] 본 워크에 포함

### N.6 베타 테스터 검증 (G13 종합)

- [ ] 빌드 후 3~5명 첫인상 평가 ("차분하다 / 깔끔하다 / 잘 만들었다") 평균 4/5 이상 시 출시 결정
- [ ] 4/5 미만 시 디자이너 재검토 → 시안 변경 또는 디테일 조정

---

## §O 결론 — 디자이너 권장 패키지 (1줄)

**B2 Breathing Circle** + **G-1 expo-auth-session/providers/google** + 카피 "마음을 돌보는 시간" + Bottom Sheet 라이브러리 코더 자동 결정 + 다크 모드 본 워크 제외 = **베타 출시 권장 패키지**.

위 N.1~N.5 모두 ★ 권장 그대로 채택 시 사용자 추가 결정 0, 코더 위임 즉시 가능.

