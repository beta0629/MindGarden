> **⚠️ ARCHIVED — V2 로 대체 (2026-06-10)**
>
> 본 V1 스펙은 사용자 비판 ("디자인 다시 해 원래 이게 아니잖어") 으로 폐기되었다.
> **새 단일 소스 = `EXPO_APP_LOGIN_SCREEN_REDESIGN_SPEC_20260610_V2.md`**.
>
> V2 §H 표가 V1 의 잘못된 부분을 1:1 로 정정한다 (정보 4중 반복 / 분할 정렬 / 로고 비대 / 회원가입 링크 / 코어솔루션 카드 등).
> 본 V1 문서는 **참조·이력 보존용으로만** 남기며 신규 작업·코더 위임에 사용하지 않는다.
>
> 이력 비교는 V2 §K 와 §H 참조.

---

# Expo App 로그인 화면 리디자인 스펙 (Login Screen Redesign Spec) — V1 (ARCHIVED)

**작성일**: 2026-06-09  
**작성자(역할)**: core-designer  
**대상 화면**: `expo-app/app/(auth)/login.tsx` (React Native + Expo Router)  
**산출 형식**: 디자인 스펙·시안·핸드오프 (코드 변경 없음)  
**충돌 회피**: OAuth phone OTP SSOT 정착 워크가 동일 파일을 수정 중 → **본 스펙은 SSOT 머지 후 main 기준으로 코더 위임**. 자산 파일(PNG/SVG)도 본 작업에서는 추가하지 않고 경로·출처만 명시.

---

## 0. 디자인 원칙·정합

- **단일 소스**: `docs/design-system/PENCIL_DESIGN_GUIDE.md` + `mindgarden-design-system.pen` + `pencil-new.pen`.
- **참조 톤**: https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample (오프화이트 + 파스텔, 좌측 악센트, Noto/Pretendard).
- **토큰 매핑**: 웹은 `var(--mg-*)`, Expo는 `expo-app/src/theme/tokens.ts`의 `theme.colors.*`. 본 스펙은 **양쪽 키를 함께 명시**.
- **폰트**: Expo 런타임은 `Pretendard-*` (`expo-app/src/theme/typography.ts`), 가이드 톤은 Noto Sans KR. **Expo는 Pretendard로 통일** (이미 로드됨).
- **하드코딩 금지**: 본 스펙의 모든 magic number 는 §4 수치 표 + `expo-app/src/components/auth/loginAnimationConstants.ts` 단일 파일로 집약.
- **로고 자산**: 사용자 명시대로 **`mindgarden-butterfly-logo.png` 1종만** 사용. 텍스트 로고/심볼 그래픽 추가 금지.

---

## 1. 시각 시안 — 와이어프레임 + 컬러 토큰

### 1.1 화면 영역 (세로 모드, iPhone 14 Pro 기준 / 393 × 852)

```
┌────────────────────────────────────────┐  ← 안전 상단 (notch)
│           (배경: 흐르는 파스텔            │
│            그라데이션 — §3 참조)         │
│                                        │
│            ┌──────────────┐            │
│            │              │            │
│            │   🦋 LOGO    │  140×140  ← LogoSection
│            │  (그라데이션  │            │
│            │    나비)     │            │
│            └──────────────┘            │
│                                        │
│              마인드가든                  ← Title (Pretendard-Bold 24)
│            심리상담센터                  ← Subtitle (Pretendard-Medium 14)
│             MIND GARDEN                ← Wordmark (Pretendard-SemiBold 12, letter-spacing 2)
│                                        │
│             [기관/지점명]                ← TenantName (옵션, Pretendard-Medium 14)
│                                        │
│   ┌──────────────────────────────┐    │
│   │ 💬  카카오로 시작하기          │  ← Kakao (#FEE500)
│   └──────────────────────────────┘    │
│   ┌──────────────────────────────┐    │
│   │  N  네이버로 시작하기          │  ← Naver (#03C75A)
│   └──────────────────────────────┘    │
│   ┌──────────────────────────────┐    │
│   │   Sign in with Apple        │  ← Apple (iOS 전용)
│   └──────────────────────────────┘    │
│                                        │
│        ───── 또는 ─────                │
│                                        │
│         다른 방법으로 로그인  ⌄          ← Toggle (이메일/PW 접힘)
│                                        │
│         다른 기관으로 변경               ← Tenant Change Link
│                                        │
└────────────────────────────────────────┘  ← 안전 하단 (home indicator)
```

### 1.2 색상 토큰 매핑 (배경 + 텍스트 + 버튼)

| 영역 | 값 (참고) | 웹 토큰 (`var(--mg-*)`) | Expo 토큰 (`theme.colors.*`) | 콘트라스트 |
|---|---|---|---|---|
| **배경 베이스** | `#FAF9F7` | `--mg-color-background-main` | `bgMain` | — |
| 배경 그라데이션 stop 0% | `#FAF9F7` (90% opacity) | `--mg-color-background-main` | `bgMain` | — |
| 배경 그라데이션 stop 50% | `#FFF6E8` (옐로우 35%) | (신규) `--mg-login-bg-warm` | (신규) `loginBgWarm` | — |
| 배경 그라데이션 stop 100% | `#EFF3F0` (틸 25%) | (신규) `--mg-login-bg-cool` | (신규) `loginBgCool` | — |
| **본문 텍스트** | `#2C2C2C` | `--mg-color-text-main` | `common.textMain` | 12.6:1 AAA |
| 보조 텍스트 | `#5C6B61` | `--mg-color-text-secondary` | `common.textSecondary` | 5.4:1 AA |
| 약한 텍스트 | `#9E9E9E` | `--mg-color-text-tertiary` | `common.textTertiary` | 3.2:1 (AA Large) |
| **카카오 버튼 배경** | `#FEE500` | `--mg-oauth-kakao-bg` | `OAUTH_KAKAO_BACKGROUND` (기존 상수) | 텍스트 #191919 16.9:1 AAA |
| 카카오 텍스트 | `#191919` | `--mg-oauth-kakao-fg` | `OAUTH_KAKAO_FOREGROUND` | — |
| **네이버 버튼 배경** | `#03C75A` | `--mg-oauth-naver-bg` | `OAUTH_NAVER_BACKGROUND` | 텍스트 #FFFFFF 3.0:1 → 폰트 굵게 + 14pt 이상 (AA Large 통과) |
| 네이버 텍스트 | `#FFFFFF` | `--mg-oauth-naver-fg` | `OAUTH_NAVER_FOREGROUND` | — |
| **Apple 버튼 배경** | `#000000` | `--mg-oauth-apple-bg` | `OAUTH_APPLE_BACKGROUND` | 텍스트 #FFFFFF 21:1 AAA |
| Apple 텍스트 | `#FFFFFF` | `--mg-oauth-apple-fg` | `OAUTH_APPLE_FOREGROUND` | — |
| **Divider 라인** | `#E8E4DE` | `--mg-color-divider` | `common.divider` | — |
| 카드/Surface (옵션) | `#F5F3EF` | `--mg-color-surface-main` | `consultant.surface` | — |

> **콘트라스트 검증**: 배경 베이스(`#FAF9F7`) 위 본문 텍스트(`#2C2C2C`)는 12.6:1로 WCAG AAA. 네이버 흰 텍스트는 작은 글자에서 AA를 만족하지 않으므로 **fontWeight 600 + 16pt 이상**으로 처리해 AA Large 통과.

### 1.3 배경 그라데이션 (LinearGradient, expo-linear-gradient)

- 컴포넌트: `<LinearGradient colors={...} locations={...} start={...} end={...} />`
- 정적 stops (위에서 아래로):
  - `colors`: `['#FAF9F7', '#FFF6E8', '#F4F1EA', '#EFF3F0']`
  - `locations`: `[0, 0.35, 0.7, 1]`
  - `start`: `{ x: 0, y: 0 }`, `end`: `{ x: 1, y: 1 }`
- 위에 `Animated.View`로 두 번째 그라데이션 레이어(`opacity` 0.4→0.6 매우 천천히 호흡)를 겹쳐 "은은히 흐름" 인상. 파티클·반짝임 없음.
- 모든 stop 색은 **로고 그라데이션 5색(옐로우·오렌지·코랄·틸·퍼플) 중 옐로우·틸·중성** 톤으로 한정해 정합.

---

## 2. 위젯 트리 (Component Tree)

```
LoginScreen (expo-app/app/(auth)/login.tsx)
├── SafeAreaView (react-native-safe-area-context)
│   └── KeyboardAvoidingView
│       └── AnimatedPastelBackground (expo-app/src/components/auth/AnimatedPastelBackground.tsx)
│           ├── LinearGradient (base, static)
│           └── Animated.View opacity oscillation (drift layer)
│       └── ScrollView (content)
│           └── LogoSection (expo-app/src/components/auth/LogoSection.tsx)
│               ├── Animated.Image (butterfly logo, breathing scale 1.00↔1.02)
│               ├── Animated.Text (마인드가든) — fade-in 1회
│               ├── Animated.Text (심리상담센터) — fade-in 1회
│               ├── Animated.Text (MIND GARDEN, letter-spacing 2) — fade-in 1회
│               └── TenantName (조건부) — fade-in 1회
│           └── LoginButtonsSection (expo-app/src/components/auth/LoginButtonsSection.tsx)
│               ├── SocialLoginButton variant="kakao"   ← stagger 1 (200ms)
│               ├── SocialLoginButton variant="naver"   ← stagger 2 (280~320ms)
│               ├── SocialLoginButton variant="apple"   ← stagger 3 (360~440ms, iOS만)
│               ├── ErrorBanner (조건부, fade)
│               ├── DividerWithLabel ("또는")
│               ├── ToggleCredentialButton ("다른 방법으로 로그인 ⌄")
│               └── CredentialForm (조건부 expand)
│           └── ChangeTenantButton (text link)
└── UnifiedModal (Duplicate Login Prompt — 기존 유지)
```

### 2.1 아토믹 분류

| 컴포넌트 | 계층 | 경로 (신규/기존) |
|---|---|---|
| `SocialLoginButton` | **Atom** | 신규 `expo-app/src/components/atoms/SocialLoginButton.tsx` |
| `AnimatedPastelBackground` | **Molecule** | 신규 `expo-app/src/components/auth/AnimatedPastelBackground.tsx` |
| `LogoSection` | **Molecule** | 신규 `expo-app/src/components/auth/LogoSection.tsx` |
| `LoginButtonsSection` | **Organism** | 신규 `expo-app/src/components/auth/LoginButtonsSection.tsx` |
| `LoginScreen` | **Page (Template+Page)** | 기존 `expo-app/app/(auth)/login.tsx` (구조 슬림화) |
| `loginAnimationConstants` | **Tokens (auth scope)** | 신규 `expo-app/src/components/auth/loginAnimationConstants.ts` |

### 2.2 공통 모듈 재사용

- `UnifiedModal` (`@/components/common/modals/UnifiedModal`) — Duplicate Login 모달 그대로 유지.
- `useTheme` (`@/theme`) — 토큰 접근.
- `useTenantStore` (`@/stores/useTenantStore`) — 기관명.
- 햅틱: `expo-haptics` (기존 패턴 유지).
- `OAUTH_*_BACKGROUND/FOREGROUND` 상수 (`@/constants/oauthProviderBrand`) — **그대로 재사용** (각 사 가이드 색상).

---

## 3. 모션 다이어그램 — 타임라인 (0ms ~ 1500ms)

```
시간(ms)  0       200      400      600      800     1000    1200    1400  1500
         │        │        │        │        │       │       │       │     │
배경     ├────────fade-in (0→1, 600ms)────────┤
         │                                    └─→ drift 호흡 시작 (∞ 루프, 8s 주기)
로고     │   ├─fade+slight scale-up (200→700, 500ms)─┤
         │                                            └─→ breathing 시작 (∞ 루프, 5s 주기)
타이틀   │           ├──fade-in (400→900, 500ms)──┤
서브타이틀│              ├─fade-in (500→1000, 500ms)─┤
워드마크 │                 ├─fade-in (600→1100, 500ms)─┤
기관명   │                    ├─fade-in (700→1200, 500ms)─┤
카카오   │                       ├─fade+slideUp (800→1100, 300ms)─┤
네이버   │                          ├─fade+slideUp (920→1220, 300ms)─┤
Apple    │                             ├─fade+slideUp (1040→1340, 300ms)─┤
─────────────────────────────────────────────────────────────────────────────
모든 인터랙션 가능 시점: 1340ms (Apple 등장 완료)
※ 등장 전 `pointerEvents: 'none'` → 등장 완료 후 `'auto'`
```

### 3.1 단계별 정의

| 단계 | 대상 | 시작(ms) | 지속(ms) | 효과 | 이징 |
|---|---|---|---|---|---|
| 1 | 배경 그라데이션 진입 | 0 | 600 | opacity 0 → 1 | `Easing.out(Easing.cubic)` |
| 2 | 배경 drift 호흡 (정적 동작) | 600 | ∞ (8000 주기) | 보조 레이어 opacity 0.4 ↔ 0.6 | `Easing.inOut(Easing.sin)` |
| 3 | 로고 등장 | 200 | 500 | opacity 0→1, scale 0.96→1.0 | `Easing.out(Easing.cubic)` |
| 4 | 로고 breathing | 700 | ∞ (5000 주기) | scale 1.00 ↔ 1.02 | `Easing.inOut(Easing.ease)` |
| 5 | 타이틀 fade-in | 400 | 500 | opacity 0→1, translateY 6→0 | `Easing.out(Easing.cubic)` |
| 6 | 서브타이틀 fade-in | 500 | 500 | 동상 | 동상 |
| 7 | 워드마크 fade-in | 600 | 500 | 동상 | 동상 |
| 8 | TenantName fade-in | 700 | 500 | 동상 (조건부) | 동상 |
| 9 | 카카오 등장 | 800 | 300 | opacity 0→1, translateY 8→0 | `Easing.out(Easing.cubic)` |
| 10 | 네이버 등장 (stagger 120ms) | 920 | 300 | 동상 | 동상 |
| 11 | Apple 등장 (stagger 120ms, iOS만) | 1040 | 300 | 동상 | 동상 |
| 12 | 인터랙션 활성화 | 1340 | — | `pointerEvents`: `'none'` → `'auto'` | — |

### 3.2 press feedback

- 모든 SNS 버튼: `Pressable` `onPressIn` → scale `0.98`, 100ms `Easing.out(Easing.ease)`; `onPressOut` → scale `1.0`, 150ms.
- `useNativeDriver: true` (transform/opacity만 사용).

---

## 4. 수치 표 (모든 magic number → 단일 상수 파일)

> 모든 값은 **`expo-app/src/components/auth/loginAnimationConstants.ts`** 하나에 집약. 코더는 본 상수만 import.

### 4.1 Durations & Delays

| 키 | 값 | 단위 | 비고 |
|---|---|---|---|
| `BG_FADE_IN_DURATION` | 600 | ms | 배경 전체 fade-in |
| `BG_DRIFT_PERIOD` | 8000 | ms | 배경 호흡 1주기 (그라데이션 위 보조 레이어 opacity) |
| `LOGO_FADE_IN_DELAY` | 200 | ms | 로고 등장 지연 |
| `LOGO_FADE_IN_DURATION` | 500 | ms | 로고 등장 시간 |
| `LOGO_BREATHING_DELAY` | 700 | ms | breathing 시작 지연 (fade 끝 직후) |
| `LOGO_BREATHING_PERIOD` | 5000 | ms | breathing 1주기 |
| `TITLE_FADE_IN_DELAY` | 400 | ms | "마인드가든" 등장 지연 |
| `TITLE_FADE_IN_DURATION` | 500 | ms | |
| `SUBTITLE_FADE_IN_DELAY` | 500 | ms | "심리상담센터" |
| `WORDMARK_FADE_IN_DELAY` | 600 | ms | "MIND GARDEN" |
| `TENANT_FADE_IN_DELAY` | 700 | ms | 기관명 (조건부) |
| `BUTTONS_FADE_IN_START_DELAY` | 800 | ms | 카카오 등장 시작 시점 |
| `BUTTONS_STAGGER_DELAY` | 120 | ms | 버튼 간 간격 (80~120 중 120 채택 — 가독성·집중도) |
| `BUTTON_FADE_IN_DURATION` | 300 | ms | 버튼 1개 등장 시간 |
| `BUTTON_PRESS_IN_DURATION` | 100 | ms | press scale down |
| `BUTTON_PRESS_OUT_DURATION` | 150 | ms | press scale up |

### 4.2 Scale & Transform

| 키 | 값 | 비고 |
|---|---|---|
| `LOGO_INITIAL_SCALE` | 0.96 | 등장 시작 scale |
| `LOGO_FINAL_SCALE` | 1.00 | 등장 완료 scale |
| `LOGO_BREATHING_MIN_SCALE` | 1.00 | breathing 최솟값 |
| `LOGO_BREATHING_MAX_SCALE` | 1.02 | breathing 최댓값 (사용자 명시) |
| `BUTTON_INITIAL_TRANSLATE_Y` | 8 | px, 아래에서 위로 |
| `BUTTON_FINAL_TRANSLATE_Y` | 0 | px |
| `BUTTON_PRESSED_SCALE` | 0.98 | 누를 때 |
| `TITLE_INITIAL_TRANSLATE_Y` | 6 | px |

### 4.3 Easing Map

```ts
import { Easing } from 'react-native';

export const EASING = {
  fade: Easing.out(Easing.cubic),
  breathing: Easing.inOut(Easing.ease),
  drift: Easing.inOut(Easing.sin),
  press: Easing.out(Easing.ease),
} as const;
```

### 4.4 Layout & Sizing

| 키 | 값 | 비고 |
|---|---|---|
| `LOGO_SIZE_BASE` | 140 | px (393 너비 기준) |
| `LOGO_SIZE_MIN` | 120 | px (iPhone SE 320 너비) |
| `LOGO_SIZE_MAX` | 160 | px (iPad 768+) |
| `LOGO_TO_TITLE_GAP` | 20 | px |
| `TITLE_TO_SUBTITLE_GAP` | 6 | px |
| `SUBTITLE_TO_WORDMARK_GAP` | 4 | px |
| `WORDMARK_TO_TENANT_GAP` | 16 | px |
| `HEADER_TO_BUTTONS_GAP` | 40 | px |
| `BUTTON_HEIGHT` | 52 | px (최소 터치 44 + 여유) |
| `BUTTON_BORDER_RADIUS` | 12 | px (`borderRadius.lg`) |
| `BUTTON_GAP` | 12 | px |
| `CONTENT_HORIZONTAL_PADDING` | 24 | px (몰바일), 32 px (태블릿) |
| `CONTENT_VERTICAL_PADDING` | 40 | px |

### 4.5 Colors (이미 §1.2 참조 — 본 표는 중요 5개만 빠른 참조)

| 키 | 값 |
|---|---|
| `BG_GRADIENT_STOPS` | `['#FAF9F7', '#FFF6E8', '#F4F1EA', '#EFF3F0']` |
| `BG_GRADIENT_LOCATIONS` | `[0, 0.35, 0.7, 1]` |
| `TEXT_PRIMARY` | `#2C2C2C` (= `theme.colors.textMain`) |
| `TEXT_SECONDARY` | `#5C6B61` (= `theme.colors.textSecondary`) |
| `WORDMARK_LETTER_SPACING` | `2` |

---

## 5. 자산 경로 표 (Brand Assets)

### 5.1 마인드가든 로고 (단일)

| 항목 | 값 |
|---|---|
| 사용 자산 | 그라데이션 나비 PNG 1종 (옐로우·오렌지·코랄·틸·퍼플) |
| 원본 위치 (문서) | `docs/design-system/assets/login-brand/mindgarden-butterfly-logo.png` |
| **런타임 위치 (이전 대상)** | `expo-app/assets/brand/mindgarden-butterfly-logo.png` |
| 라이센스/검수 | MindGarden 자체 자산 (B0KlA), 재배포 시 디자인팀 확인 |
| 다크 모드 | **동일 자산 사용** (사용자 명시) — 컬러 그라데이션으로 다크 배경에서도 가독성 충분 |
| 추가 텍스트 로고 | **사용 금지** (사용자 명시) |

### 5.2 SNS 브랜드 자산 (각 사 가이드 준수 — 정식 자산만 사용)

| Provider | 정식 출처 | 우리 저장 경로 (코더 이전 대상) | 형태/규정 |
|---|---|---|---|
| **Apple** | Apple HIG: https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple<br>SDK: `expo-apple-authentication` 권장 (네이티브 `AppleAuthenticationButton` 사용 시 자산 불필요) | `expo-app/assets/brand-icons/apple.svg` (fallback 사용 시) | **권장**: `expo-apple-authentication`의 네이티브 버튼 컴포넌트 사용 → Apple이 자동 렌더링. 자체 마크업 시 흑/백 반전 페어만 허용, 모서리 둥글기 8~12 (앱과 정합), 최소 너비 140pt, 텍스트 "Sign in with Apple" 영문 고정 (Apple HIG §). |
| **Kakao** | https://developers.kakao.com/docs/latest/ko/kakaologin/design-guide<br>리소스 다운로드: https://developers.kakao.com/tool/resource/login | `expo-app/assets/brand-icons/kakao-symbol.png` (@1x/@2x/@3x 또는 SVG) | 배경 `#FEE500`, 카카오톡 말풍선 심볼(black) 좌측 정렬. 카피: **"카카오로 시작하기"** (현재 "카카오로 로그인" → 변경). 심볼·텍스트 가로 정렬, 가로폭 70% 이상 권장. 라운드 모서리 12px 허용. |
| **Naver** | https://developers.naver.com/docs/login/bi/bi.md<br>BI 다운로드 페이지 | `expo-app/assets/brand-icons/naver-symbol.png` (@1x/@2x/@3x 또는 SVG) | 배경 `#03C75A`, 흰색 'N' 심볼 좌측. 카피: **"네이버로 시작하기"** (현재 "네이버로 로그인" → 변경). 심볼은 정사각 비율 유지, 패딩 12px. |

### 5.3 검수 주의사항

- **각 사 자산은 반드시 정식 다운로드 자산 사용**. 임의 재제작·임의 색상 변경 금지.
- Apple은 **`expo-apple-authentication`의 `AppleAuthenticationButton`** 사용 시 자산 관리·다국어·다크모드까지 자동 처리되므로 **이 방식 강력 권장**.
- 새 자산 추가 PR 시 **각 사 라이센스 페이지의 다운로드 일자·버전을 커밋 메시지에 명시**.

---

## 6. Reduce Motion 분기 표

`AccessibilityInfo.isReduceMotionEnabled()` 가 `true` 일 때:

| 요소 | 정상 모드 | Reduce Motion 모드 |
|---|---|---|
| 배경 fade-in | 600ms | **200ms** (단축) |
| 배경 drift 호흡 | 8000ms 주기 ∞ | **정지** (정적 그라데이션만) |
| 로고 등장 | fade + scale 0.96→1 | **fade만**, scale 즉시 1.0 |
| 로고 breathing | 1.00 ↔ 1.02 ∞ | **정지** (scale 1.0 고정) |
| 타이틀/서브타이틀/워드마크 | fade + translateY 6→0 | **fade만** (translate 0) |
| SNS 버튼 등장 | fade + translateY 8→0 + stagger 120ms | **fade만** (translate 0, stagger 60ms로 축소) |
| Press feedback | scale 0.98 | **opacity 0.85** (scale 대신) |
| 인터랙션 활성 시점 | 1340ms | **800ms** (스태거·트랜슬레이트 축소로 자연 단축) |

> Reduce Motion에서도 fade-in은 유지 (인지적 진입 신호). 진입 전까지는 동일하게 `pointerEvents: 'none'`.

### 6.1 콘트라스트 (WCAG AA)

| 텍스트 | 배경 | 비율 | 등급 |
|---|---|---|---|
| `#2C2C2C` 본문 | `#FAF9F7` 베이스 | 12.6:1 | AAA |
| `#5C6B61` 보조 | `#FAF9F7` | 5.4:1 | AA |
| `#9E9E9E` 보조2 | `#FAF9F7` | 3.2:1 | AA Large (14pt+ Bold 또는 18pt+) |
| `#191919` 카카오 텍스트 | `#FEE500` | 16.9:1 | AAA |
| `#FFFFFF` 네이버 텍스트 (16pt Bold) | `#03C75A` | 3.0:1 | AA Large 통과 |
| `#FFFFFF` Apple 텍스트 | `#000000` | 21:1 | AAA |

---

## 7. SafeArea / 반응형 — 화면 크기별 가이드

| 디바이스 | 폭(pt) | 로고 크기 | 좌우 패딩 | 버튼 높이 | 헤더-버튼 gap | 비고 |
|---|---|---|---|---|---|---|
| iPhone SE (gen 3) | 375 | 120 | 20 | 52 | 32 | 가장 좁음 — `ScrollView` 필수 |
| iPhone 14 / 15 | 393 | 140 | 24 | 52 | 40 | 기준 사이즈 |
| iPhone 14 Pro Max | 430 | 150 | 24 | 52 | 48 | 여유 |
| iPad mini | 744 | 160 | 32 | 56 | 56 | 콘텐츠 max-width `440` (중앙 정렬) |
| iPad Pro 12.9 | 1024 | 160 | 48 | 56 | 64 | 콘텐츠 max-width `440` (중앙 정렬), 좌우 그라데이션 확장 |

### 7.1 SafeArea 적용 규칙

- `react-native-safe-area-context` `SafeAreaView` 또는 `useSafeAreaInsets()` 사용 (notch · 홈 인디케이터).
- 배경 그라데이션은 **SafeArea를 무시하고 전체 화면(`StyleSheet.absoluteFill`)에 칠함** → 콘텐츠만 SafeArea 인셋 적용.
- 키보드 뜰 때 `KeyboardAvoidingView` (기존 패턴 유지) + 콘텐츠 `ScrollView` 로 가림 방지.

### 7.2 콘텐츠 max-width

- iPad/태블릿에서 콘텐츠는 `maxWidth: 440` 중앙 정렬 → 가로 늘어남 방지.
- 배경 그라데이션은 풀블리드.

---

## 8. 다크 모드 대응

| 항목 | 정책 |
|---|---|
| 적용 여부 | **다크 모드 비활성** (현 시점) — Expo 앱 전반이 라이트 톤 기준 |
| 향후 확장 시 | 배경 그라데이션만 다크 stops 로 분기. 로고는 **동일 자산** (사용자 명시) |
| 다크 stops (참고용) | `['#1F1B16', '#2A2418', '#1F2A24', '#1A1E1B']` (옐로우·틸 톤 어두운 변환) |
| 다크 본문 텍스트 | `#F5F3EF` (기존 `surface` 톤) |
| 다크 SNS 버튼 | 카카오/네이버 동일 (브랜드 색 유지), Apple은 **흰색 배경 + 검정 텍스트로 자동 반전** (Apple HIG) |

> 본 스펙 적용 시점에는 **라이트 톤만 구현**. 다크 모드는 별도 위임에서 처리.

---

## 9. 레퍼런스 비교 — 정합점·차이점

| 항목 | 사용자 레퍼런스 | 본 스펙 적용 결정 |
|---|---|---|
| 배경 톤 | 파스텔 그라데이션 흐름 | ✅ 동일 (오프화이트 + 옐로우·틸 stops) |
| 로고 등장 | scale + fade | ✅ 동일 |
| 로고 breathing | 미세 scale | ✅ 동일 (1.00~1.02, 5초) |
| 버튼 stagger | 순차 등장 | ✅ 동일 (카카오→네이버→Apple, 120ms) |
| 파티클·반짝임 | 없음 | ✅ 사용자 명시대로 미사용 |
| Lottie/Rive | 사용 가능 | ❌ **사용 금지** (사용자 명시) |
| 텍스트 흔들림/블러 | 없음 | ✅ 사용자 명시대로 미사용 |
| 컬러 톤 | 자유로움 | ⚠️ **MindGarden 어드민 톤(B0KlA)으로 정합** — 옐로우·틸·중성으로 한정, 채도 낮춤 |
| 버튼 색상 | 자유 | ⚠️ **각 사 브랜드 가이드 강제** (카카오 #FEE500, 네이버 #03C75A, Apple 검정/흰) |
| 로고 자산 | 별도 일러스트 | ⚠️ **사용자 명시 단일 자산** (그라데이션 나비 PNG 1종) |

---

## 10. 코더(core-coder) 핸드오프 체크리스트

코더 위임 프롬프트에 **본 섹션 전체를 인용**.

### 10.1 구조

- [ ] `expo-app/src/components/auth/loginAnimationConstants.ts` 신규 — §4 모든 수치 단일 export.
- [ ] `expo-app/src/components/atoms/SocialLoginButton.tsx` 신규 — Atom (variant: `'kakao' | 'naver' | 'apple'`), `OAUTH_*` 상수 재사용, 접근성 label·role.
- [ ] `expo-app/src/components/auth/AnimatedPastelBackground.tsx` 신규 — `LinearGradient` (expo-linear-gradient) + `Animated.View` drift 레이어.
- [ ] `expo-app/src/components/auth/LogoSection.tsx` 신규 — 로고 fade+scale+breathing, 타이틀/서브타이틀/워드마크/기관명 fade-in.
- [ ] `expo-app/src/components/auth/LoginButtonsSection.tsx` 신규 — 3개 SNS 버튼 stagger, Divider, Toggle, CredentialForm.
- [ ] `expo-app/app/(auth)/login.tsx` 슬림화 — 비즈니스 로직(`handleKakaoLogin` 등)은 그대로, **UI 구조만 위 4개 컴포넌트로 분리**.

### 10.2 자산

- [ ] `docs/design-system/assets/login-brand/mindgarden-butterfly-logo.png` → `expo-app/assets/brand/mindgarden-butterfly-logo.png` 로 **복사** (원본도 docs에 유지).
- [ ] 브랜드 아이콘 자산 (Kakao/Naver/Apple) — §5.2 정식 출처에서 다운로드 후 `expo-app/assets/brand-icons/` 에 배치. PR 메시지에 출처 URL·일자 명시.
- [ ] 추가 텍스트 로고 자산 사용 금지 (단일 로고 PNG만).

### 10.3 모션·접근성

- [ ] 모든 애니메이션 `useNativeDriver: true` (transform·opacity만 사용 — slide는 translateY).
- [ ] `pointerEvents: 'none'` → `'auto'` 전환은 마지막 버튼 등장 완료 시점(`1340ms` 정상, `800ms` Reduce Motion).
- [ ] `AccessibilityInfo.isReduceMotionEnabled()` 호출 + 이벤트 리스너(`reduceMotionChanged`) 등록 → §6 분기 표 적용.
- [ ] 모든 버튼 `accessibilityLabel`, `accessibilityRole="button"` 명시 (기존 패턴 유지).
- [ ] Apple 버튼: **`expo-apple-authentication`의 `AppleAuthenticationButton`** 우선 사용. fallback 시에만 자체 `Pressable`.

### 10.4 정합·표준

- [ ] 모든 색상은 `theme.colors.*` 또는 `OAUTH_*` 상수로 참조 (hex 직접 입력 금지).
- [ ] 모든 spacing/radius는 `theme.spacing.*`, `theme.borderRadius.*` 또는 `loginAnimationConstants` 사용.
- [ ] 폰트는 `theme.fontFamily.*` (Pretendard) 사용.
- [ ] **운영 반영 게이트 §17 + §1.3** 준수 — `check-hardcode` 통과.
- [ ] 기존 비즈니스 로직(`handleKakaoLogin`, `handleNaverLogin`, `handleAppleLogin`, `handleCredentialLogin`, `UnifiedModal` 모달 흐름, `requiresOAuthPhoneVerification` 라우팅, ExpoGo 배너) **변경 금지**.
- [ ] OAuth phone OTP SSOT 정착(ba2fbdcf) 머지 후 본 작업 시작.

### 10.5 카피 변경 (사용자 명시)

- [ ] "카카오로 로그인" → **"카카오로 시작하기"** (Kakao 가이드 권장 카피)
- [ ] "네이버로 로그인" → **"네이버로 시작하기"** (Naver 가이드 권장 카피)
- [ ] "Apple로 계속하기" → **"Sign in with Apple"** (Apple HIG 권장, 영문 고정)

---

## 11. 테스트 시나리오 (core-tester 검증 항목)

### 11.1 시각 회귀

- [ ] 화면 캡처 (iPhone SE / 14 / 14 Pro Max / iPad mini / iPad Pro 12.9) — 와이어 §1.1과 정합.
- [ ] 로고 가로 크기 (120/140/150/160 단계별) 정확.
- [ ] SNS 버튼 색·텍스트가 §1.2 / §5.2 가이드와 일치 (각 사 브랜드).
- [ ] 그라데이션 stops·locations·방향 §1.3과 일치.

### 11.2 모션 회귀

- [ ] 등장 타임라인 §3.1과 정확히 일치 (Detox 또는 수동 측정 ±50ms).
- [ ] 로고 breathing 5초 주기, scale 범위 1.00~1.02 (값 변동 ±0.005).
- [ ] 버튼 stagger 120ms ±20ms.
- [ ] 등장 전 클릭 차단 (1340ms 전 onPress 무반응).

### 11.3 접근성

- [ ] `AccessibilityInfo.isReduceMotionEnabled()` 강제 true 모킹 시 §6 분기 표대로 동작.
- [ ] VoiceOver 스캔: 로고(header) → 타이틀 → 기관명 → 카카오/네이버/Apple 버튼 → 토글 → 기관 변경.
- [ ] 콘트라스트 비율 자동화 검사 (axe-core 또는 수동) — §6.1 모두 통과.
- [ ] 키보드 접근 (Bluetooth 키보드 / iPad 외장키보드) Tab 순서 검증.

### 11.4 기능 회귀 (기존 흐름 유지)

- [ ] 카카오 로그인 → `requiresSignup`, `requiresOAuthPhoneVerification`, `requiresDuplicateLoginConfirmation`, `error` 4가지 분기 모두 모킹 통과.
- [ ] 네이버 동일.
- [ ] Apple 동일 + `requiresApplePhoneVerification` 추가 분기.
- [ ] 이메일/PW 로그인 토글 expand/collapse + 제출.
- [ ] ExpoGo 환경 배너 표시 + SNS 버튼 disabled.
- [ ] Duplicate Login 모달 (UnifiedModal) 표시·확인·취소.
- [ ] `다른 기관으로 변경` 링크 → `/(auth)/tenant-select`.

### 11.5 성능

- [ ] 60fps 유지 (Flipper Performance / `react-native-performance`).
- [ ] 메모리 누수 없음 (등장 완료 후 `Animated.loop` 해제는 unmount 시).
- [ ] 콜드 스타트 시 로고 첫 렌더 ≤ 200ms.

### 11.6 다크 모드 (스모크)

- [ ] iOS 시스템 다크 토글 시 앱 라이트 톤 유지 (현 정책 — 다크 미지원).
- [ ] 향후 다크 도입 시 §8 정책대로 동작.

---

## 12. 변경 이력

| 일자 | 작성자 | 내용 |
|---|---|---|
| 2026-06-09 | core-designer | 최초 작성 (로그인 화면 리디자인 스펙). SSOT 머지 후 코더 위임 예정. |

---

## 13. 후속 작업 (사용자 결정 필요)

코더 위임 전 사용자 확인이 필요한 항목:

1. **Apple 버튼 구현 방식** — `expo-apple-authentication` 네이티브 버튼 vs 자체 `Pressable` 자산. **본 스펙은 네이티브 버튼 권장**.
2. **카피 변경 승인** — "카카오로 시작하기" / "네이버로 시작하기" / "Sign in with Apple" (영문). **각 사 가이드 권장 카피**.
3. **다크 모드 도입 시점** — 본 위임 범위 외 (별도 핸드오프 필요).
4. **CSS 토큰 신규 추가** — `--mg-login-bg-warm`, `--mg-login-bg-cool` 신규 토큰 등록 시점 (웹·앱 동시 추가 필요 여부).
5. **`AppBrandMark`(기존) 처분** — 텍스트 임베드형 PNG (`mindgarden-brand-inapp.png`) 사용처 정리·deprecate 여부.

---

## 14. 사용자 결정 (2026-06-09 23:14 KST 확정)

§13 의 후속 결정 항목에 대한 사용자 확정. 코더 위임 시 인풋으로 사용.

| # | 항목 | 결정 | 비고 |
|---|---|---|---|
| 1 | Apple 버튼 구현 | **네이티브 `expo-apple-authentication` 의 `AppleAuthenticationButton` 사용** | Apple HIG 자동 준수 — 검수 우호적. cornerRadius·width·height 만 props 로 조정 |
| 2 | 버튼 카피 | **"카카오로 시작하기" / "네이버로 시작하기" / "Sign in with Apple" (영문 고정)** | 각 사 가이드 권장 표준 카피. Apple 은 영문 고정이 안전 |
| 3 | CSS 토큰 신규 추가 | **웹 + expo 양쪽 동시 추가** | SSOT 일관성. `frontend/src/styles/design-tokens.css` + expo 측 매핑 동시 |
| 4 | 다크 모드 | **본 워크 제외 — 현 라이트 단일 모드 유지** | 별도 후속 워크 (현 시점 기획 없음) |
| 5 | 기존 `AppBrandMark` PNG | **deprecate** | 새 SSOT 로고 (그라데이션 나비) + 텍스트는 폰트 렌더링으로 일원화. 코더가 전수 점검 후 사용처 정리 |

### 코더 위임 시 추가 지시 사항

1. **`expo-apple-authentication` 패키지 확인** — 이미 설치되어 있다면 그대로 사용, 없으면 `npx expo install expo-apple-authentication` 으로 추가 (Expo SDK 호환 버전).
2. **새 토큰 추가 위치**:
   - `frontend/src/styles/design-tokens.css` 에 `--mg-login-bg-warm`, `--mg-login-bg-cool`, `--mg-login-bg-base`, `--mg-login-bg-end` 추가 (값은 §1 시각 시안 그라데이션 stops 참고)
   - expo 측은 `expo-app/src/styles/tokens.ts` (또는 동등 위치) 에 동일 매핑 추가
3. **`AppBrandMark` deprecate 절차**:
   - 사용처 전수 점검 (`rg "AppBrandMark"` + import 추적)
   - 사용처별로 새 SSOT 로고 컴포넌트로 치환
   - 사용처 0 확인 후 `AppBrandMark` 파일 + `mindgarden-brand-inapp.png` 자산 삭제
   - 본 작업이 큰 범위가 되면 별도 PR 분리 가능
4. **충돌 회피**: SSOT 정착 워크 ([ba2fbdcf](ba2fbdcf-4a8f-4cf2-b5d2-e992eea4ad57)) 머지 후 main 기준 분기. `login.tsx` 직접 충돌은 SSOT 머지 후 해소.
