# OAuth Phone Verification UX 스펙 (Provider-Agnostic)

**작성자**: core-designer (서브에이전트)
**작성일**: 2026-06-09
**버전**: v1.0 (Phase 2 산출물 — core-coder Phase 3B/3C 입력)
**대상**: Apple / Google / Kakao / Naver 공통 OAuth 휴대폰 매칭(OTP) 화면
**상태**: 디자인 스펙 확정 — 코드 작성은 core-coder가 본 문서를 입력으로 진행
**모델**: 기본(Claude) — gemini-3.1-pro 할당량 초과로 fallback (룰상 "권장")

---

## 0. 개요·배경

### 0.1 목적
모든 OAuth 제공자(Apple/Google/Kakao/Naver)가 동일한 UX 로 "휴대폰 입력 + SMS OTP 인증"을 수행할 수 있도록 **provider-agnostic** 화면 스펙을 정의한다. 현재 Apple SIWA P1 화면(`expo-app/app/(auth)/apple-phone-link.tsx`)을 베이스로 일반화하며, 사용자 학습 비용·시각적 회귀를 0 으로 유지한다.

### 0.2 배경
- 네이버 로그인 검수 거부 대응(`docs/project-management/2026-06-08/NAVER_LOGIN_REVIEW_REJECTION_RESPONSE_2026_06_05.md`) 결과, 분기 (A) "mobile scope 유지" → (C) "mobile 미사용 + 휴대폰 OTP 자체 검증"으로 변경 예정.
- Kakao null 이름 버그(`[1d543328]`) PR 진행 중 — 본 스펙은 **신규 파일 우선** 전략으로 회피 라인을 절대 건드리지 않는다.
- BE 측 일반화: `/api/v1/apple/phone/{send,verify}` → `/api/v1/oauth/phone/{send,verify}` (provider 필드 body 포함) 권장.

### 0.3 베이스 화면 (인용 확인)
| 파일 | 역할 | 인용 결과 |
|---|---|---|
| `expo-app/app/(auth)/apple-phone-link.tsx` | Apple OTP 통합 화면 | **읽음**. step='phone'|'otp' 단일 라우트, `useTheme()`+`fontSize` 100% 토큰 사용. |
| `expo-app/src/components/molecules/OtpCodeInput.tsx` | 6칸 OTP Molecule | **읽음**. `theme.colors.{primary,error,border,bgSub,textMain}` + `theme.fontFamily.semibold`, iOS/Android SMS 자동 입력(`textContentType="oneTimeCode"`, `autoComplete="sms-otp"`) 호환. |
| `expo-app/src/utils/applePhoneOtp.ts` | OTP 유틸 (포맷·검증) | **읽음**. `formatOtpCountdown` / `tickOtpCountdown` / `canResendOtp` / `applyServerExpiresIn` / `applyServerRetryAfter` / `validateKoreanMobileInput` — Apple 명칭만 일반화하면 그대로 재사용 가능. |
| `expo-app/src/services/auth/applePhoneVerificationMapper.ts` | 응답 매퍼 | **읽음**. `mapAppleLoginResponseRaw` / `mapApplePhoneSendResponse` — `provider` 필드만 추가하면 그대로 일반화 가능. |
| `expo-app/src/api/auth/appleAuth.ts` | Apple API 클라이언트 | **읽음**. 인터페이스 시그니처(`{phoneVerificationToken, phoneNumber}`, `{phoneVerificationToken, otpChallengeToken, code}`) 그대로 일반화. |
| `frontend/src/components/auth/SocialSignupModal.js` | 웹 소셜 가입 모달 | **읽음**. `UnifiedModal` 컴포지션 + `mg-v2-form-*` / `mg-v2-input` / `social-signup-modal__*` 패턴. |

---

## 1. D-1 ~ D-4 디자이너 평가·권장안

### 1.1 D-1. OTP 화면 일반화 방식 — 4가지 평가

| 옵션 | UX 영향 | 회귀 위험 | 충돌 라인 위험 | 디자이너 권장도 |
|---|---|---|---|---|
| (a) Apple 화면 리네임 → `oauth-phone-link.tsx` (provider prop) | 동일 | **높음** — `social-signup.tsx:62-69, 182-204` import 경로 변경 강제, Kakao PR 충돌 | 매우 높음 | ❌ 비권장 |
| (b) Apple 경로 유지 + 신규 OAuth 화면 별도 추가 | 동일 | 중간 — Apple 코드 2벌 유지(중복) | 낮음 | △ |
| **(c) Apple 화면 리네임 + redirect alias 유지** | **동일** | **낮음** — `apple-phone-link` 경로는 alias 로 보존, Apple 호출처 무수정 | **낮음** — 회피 라인 무수정 | ✅ **권장** |
| (d) 디자이너 제안 | — | — | — | (제안 없음 — c 채택) |

**디자이너 권장: (c)** — Phase 1B FE explore 우회 전략과 일치. 사용자 학습 비용 zero(시각·인터랙션 동일), Apple 회귀 zero(redirect alias). 1줄 근거: **신규 파일 1개로 4개 provider 통합 가능하며, Apple 화면을 점진 이관(deprecate) 할 수 있는 유일한 안전한 안**.

### 1.2 D-2. provider 식별 UX

| 옵션 | 사용성 | 학습 비용 | 접근성 | 디자이너 권장도 |
|---|---|---|---|---|
| (i) 상단 헤더에 provider 로고 + 색상 노출 | 매우 명확 | 낮음 | 로고 alt 필요 | △ — 브랜드 색 4종 추가 토큰 필요(스코프 초과) |
| **(ii) 텍스트 라벨 + provider 명** ("네이버 계정과 휴대폰을 연결합니다") | 명확 | 낮음 | aria-label 자연 | ✅ **권장** |
| (iii) 비표기 | 모호 — 사용자 어느 provider 와 연결 중인지 불명 | 높음 | — | ❌ |

**디자이너 권장: (ii)** — 1줄 근거: **B0KlA 팔레트(주조 #3D5246)만 사용하여 디자인 일관성 유지하면서, 화면 제목·prefill 박스 라벨에 provider 명 명시하면 충분. 로고는 Phase 2 스코프 외 — 추후 atoms 추가 시 확장.** 단, prefill 박스 상단에 **"{provider} 계정 정보"** aria-label 만 추가하여 스크린리더 사용자에게 provider 식별 보강.

### 1.3 D-3. 화면 분할 vs 통합 (expo-app)

| 옵션 | UX 영향 | 회귀 위험 | 디자이너 권장도 |
|---|---|---|---|
| **통합 (단일 라우트, stepper)** | **동일** — Apple 현재와 100% 일치 | **낮음** | ✅ **권장** |
| 분할 (휴대폰 → OTP 두 라우트) | 라우팅 1단계 추가, 뒤로가기 처리 복잡 | 중간 — Apple 회귀 발생 | ❌ |

**디자이너 권장: 통합 유지** — 1줄 근거: **Apple 현재 = 단일 화면 = 회귀 zero. 화면 분할 시 라우팅·상태(otpChallengeToken) 라이프사이클 재설계 필요로 비용 대비 효익 없음**.

### 1.4 D-4. frontend/web 적용 형태

| 옵션 | 충돌 라인 위험 | 코드 재사용 | 디자이너 권장도 |
|---|---|---|---|
| (i) `SocialSignupModal.js` 내 단계 추가 | **높음** — 회피 라인(`107-116, 227-249`) 침범 | 높음 | ❌ |
| **(ii) 신규 `OAuthPhoneVerificationModal.js` 별도 모달** | **낮음** — 신규 파일, 회피 라인 무수정 | 중간 — `UnifiedModal` + `mg-v2-form-*` 재사용 | ✅ **권장** |

**디자이너 권장: (ii)** — 1줄 근거: **신규 모달은 `UnifiedModal` (variant='form', size='small') + `OtpCodeInput.js`(웹 신규 atom) 컴포지션으로 작성. SocialSignupModal 의 휴대폰 입력 단계는 그대로 두되, OAuth 응답이 `requiresPhoneVerification=true` 일 때만 신규 모달로 분기**.

---

## 2. 화면 명세

### 2.1 화면 메타

| 항목 | 값 |
|---|---|
| 화면 ID | `OAUTH_PHONE_VERIFICATION` |
| 화면명 | OAuth 휴대폰 매칭 인증 |
| 라우트 (expo-app) | `/(auth)/oauth-phone-link` (신규) + `/(auth)/apple-phone-link` (redirect alias, deprecation) |
| 컴포넌트 (frontend/web) | `OAuthPhoneVerificationModal.js` (신규) — `UnifiedModal` 본문 |
| 진입 조건 | BE OAuth `/login` 응답이 `requiresPhoneVerification=true` + `phoneVerificationToken` 발급 |
| 종료 조건 | (1) 정상 로그인 → `navigateAfterAuthenticated()`, (2) 다중 매칭 → `oauth-account-selection`, (3) 사용자 취소 → 로그인 화면 |
| 사용자 역할 | 신규 OAuth 로그인 모든 사용자 (역할 무관) |
| 멀티테넌트 | tenantId 는 BE `phoneVerificationToken` JWT 내 포함 — 화면 노출 없음 |

### 2.2 컴포넌트 트리 (아토믹)

```
Page: OauthPhoneLinkScreen (expo-app)  /  OAuthPhoneVerificationModal (frontend)
└── Template: AuthScrollScreen (expo) / UnifiedModal variant="form" (web)
    └── Organism: OAuthPhoneVerificationForm
        ├── Molecule: ProviderHeader        (provider 식별 텍스트 + prefill 박스)
        │   ├── Atom: Text (제목)
        │   ├── Atom: Text (설명)
        │   └── Atom: PrefillBox (provider 이름·이메일 표시)
        ├── Molecule: PhoneInputField       (step='phone')
        │   ├── Atom: Label
        │   ├── Atom: PhoneInput (TextInput / mg-v2-input)
        │   └── Atom: InlineError
        ├── Molecule: OtpInputBlock         (step='otp')
        │   ├── Atom: Text (제목/마스킹 번호 안내)
        │   ├── Molecule: OtpCodeInput      (★ 이미 존재 — expo. web 은 신규 동등 atom 추가)
        │   ├── Atom: CountdownTimer
        │   ├── Atom: ResendButton (TextLink)
        │   └── Atom: InlineError
        └── Molecule: ActionBar
            ├── Atom: PrimaryButton (인증번호 발송 / 확인)
            ├── Atom: SecondaryLink (휴대폰 번호 변경, step='otp' 시)
            └── Atom: TertiaryLink (로그인으로)
```

**기존 공통 모듈 재사용**:
- `OtpCodeInput` (expo molecule, 이미 존재) — 그대로 사용
- `UnifiedModal` (web common, 이미 존재) — variant='form', size='small'
- `MGButton` (web common) — primary/outline 버튼
- `mg-v2-form-group`, `mg-v2-input` (web 토큰 클래스)

**신규 atom 필요**:
- `frontend/src/components/atoms/OtpCodeInput.js` (웹 6칸 OTP — expo 의 molecule 와 동등 시각) — core-coder Phase 3C 산출

### 2.3 와이어 (텍스트)

#### 2.3.1 expo-app — Step 1: 휴대폰 입력

```
┌─────────────────────────────────────────┐
│  bgMain (#FAF9F7)                       │
│                                         │
│  Naver 계정 연결                        │  ← title (2xl, 700, textMain)
│  ─────────────────────────────────────  │
│  본인 확인을 위해 가입된 휴대폰 번호로  │  ← description (sm, textSecondary)
│  SMS 인증 코드를 보내드립니다.          │
│                                         │
│  ┌─────────────────────────────────┐    │  ← prefillBox (bgSub, border, radius:12)
│  │  이름                            │    │     (provider 가 prefill 제공한 경우만)
│  │  홍길동                          │    │
│  │  이메일                          │    │
│  │  user@naver.com                  │    │
│  └─────────────────────────────────┘    │
│                                         │
│  휴대폰 번호                            │  ← fieldLabel (sm, 500, textSecondary)
│  ┌─────────────────────────────────┐    │  ← inputBox (border, radius:12, p:14/12)
│  │ 01012345678                     │    │     keyboardType="phone-pad", maxLength=11
│  └─────────────────────────────────┘    │
│                                         │
│  (인라인 에러 — error 컬러, sm)         │
│                                         │
│  ┌─────────────────────────────────┐    │  ← primaryBtn (primary, radius:12, minH:48)
│  │       인증번호 발송               │    │     opacity:0.5 when disabled
│  └─────────────────────────────────┘    │
│                                         │
│            로그인으로                    │  ← tertiaryLink (textTertiary)
└─────────────────────────────────────────┘
```

#### 2.3.2 expo-app — Step 2: OTP 입력

```
┌─────────────────────────────────────────┐
│  Naver 계정 연결                        │
│  본인 확인을 위해 ...                   │
│                                         │
│  ┌─────────────────────────────────┐    │  ← prefillBox (Step 1과 동일)
│  │ 이름 / 이메일                    │    │
│  └─────────────────────────────────┘    │
│                                         │
│  인증번호 확인                          │  ← otpTitle (lg, 700, textMain)
│  문자로 전송된 6자리 인증번호를 입력해   │  ← sub (sm, textSecondary)
│  주세요. (010-****-5678)                │     ★ 마스킹: maskKoreanMobileForDisplay
│                                         │
│   ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐         │  ← OtpCodeInput (6칸, cell 44px, gap 8px)
│   │1 │ │2 │ │3 │ │4 │ │  │ │  │         │     cell border: primary(filled)/border(empty)/error
│   └──┘ └──┘ └──┘ └──┘ └──┘ └──┘         │
│                                         │
│  남은 시간 4:32          인증번호 재발송  │  ← timerRow (sm, textSecondary)
│                          (또는 재발송 0:35) │   resend disabled 시 textTertiary
│                                         │
│  (인라인 에러 — error 컬러, sm)         │
│                                         │
│  ┌─────────────────────────────────┐    │  ← primaryBtn (확인)
│  │            확인                  │    │
│  └─────────────────────────────────┘    │
│                                         │
│           휴대폰 번호 변경                │  ← changePhoneBtn (sm, textTertiary)
│                                         │
│            로그인으로                    │
└─────────────────────────────────────────┘
```

#### 2.3.3 frontend/web — UnifiedModal 본문

```
╔══════════ UnifiedModal (variant="form", size="small") ══════════╗
║  ✕                                                              ║
║  Naver 계정 연결                                                ║  ← UnifiedModal title
║  ─────────────────────────────────────────────────────────────  ║
║                                                                 ║
║  ┌────── .oauth-phone-modal__provider ──────────────────────┐  ║  ← provider 식별 영역 (data-provider="naver")
║  │  [N]  네이버 계정과 휴대폰을 연결합니다                   │  ║     (badge 는 mg-warning/success 폴백)
║  └──────────────────────────────────────────────────────────┘  ║
║                                                                 ║
║  step='phone':                                                  ║
║  ─────────────────                                              ║
║  .mg-v2-form-group                                              ║
║   ├ label: 휴대폰 번호                                          ║
║   ├ input.mg-v2-input (type=tel, maxLength=11, autoFormat)     ║
║   └ .mg-v2-form-error (옵션)                                    ║
║                                                                 ║
║  step='otp':                                                    ║
║  ─────────────────                                              ║
║  안내 텍스트 + 마스킹 번호 (010-****-5678)                      ║
║  [OtpCodeInput — 6칸 그리드, cell 48px, gap 8px]                ║
║  타이머 (남은 시간 4:32)  /  재발송 링크 (0:35)                 ║
║  .mg-v2-form-error (옵션)                                       ║
║                                                                 ║
║  ─────────────────────── ActionBar ───────────────────────────  ║
║  [휴대폰 변경] (step='otp' 시)        [취소] [확인 / 발송]     ║  ← UnifiedModal actions
╚═════════════════════════════════════════════════════════════════╝
```

### 2.4 상태표

| 상태 | 트리거 | 시각 표시 | 사용자 액션 |
|---|---|---|---|
| **Idle (phone)** | 화면 진입 | input 활성 + Send 활성 | 휴대폰 입력 |
| **Phone validation error** | 11자리/형식 위반 | inline error + 햅틱 Warning | 입력 수정 |
| **Sending OTP** | Send 클릭 | Send 버튼 → ActivityIndicator + busyHint "발송 중…" | 대기 |
| **Cooldown** | BE retryAfterSeconds > 0 | inline error 메시지 + resend 카운트다운 표시 | 대기 후 재시도 |
| **OTP idle** | step='otp' 진입 | 6칸 빈 cell + autoFocus + 카운트다운 시작 (300s/180s 등 BE 반환값) | OTP 입력 |
| **OTP filling** | 1~5자리 입력 | filled cell border = primary, 빈 cell border = border | 계속 입력 |
| **OTP complete (auto-verify)** | 6자리 입력 완료 | `onComplete` 콜백 → 자동 verify | 자동 진행 |
| **Verifying** | Verify 클릭/자동 | Verify 버튼 → ActivityIndicator | 대기 |
| **OTP error** | BE 불일치/형식 위반 | inline error + cell border = error + 햅틱 Error | 재입력 (cell 클릭 → 입력 클리어 권장) |
| **OTP expired** | remainingExpiresSeconds <= 0 | timer text → error 컬러 + "인증번호가 만료되었습니다." + Verify 비활성 | 재발송 |
| **Resend disabled** | cooldown > 0 | resend link → textTertiary + 카운트다운 표시 | 대기 |
| **Resend enabled** | cooldown <= 0 | resend link → primary | 재발송 |
| **Verified (single match)** | BE `success+user+tokens` | 햅틱 Success → 즉시 라우팅 | — |
| **Verified (multi match)** | BE `requiresPhoneAccountSelection` | 즉시 `/oauth-account-selection` 라우팅 | — |
| **Daily limit exceeded** | BE rate-limit | inline error "오늘 인증 시도 횟수를 초과했습니다. 내일 다시 시도해 주세요." + resend 영구 비활성 | 다음날 재시도 / 다른 로그인 |
| **Token expired (10분)** | `phoneVerificationToken` 만료 | full-screen error + "로그인 화면으로" 버튼 | 처음부터 재로그인 |

### 2.5 사용 토큰

#### 2.5.1 expo-app (theme tokens, `useTheme()`)

| 용도 | 토큰 |
|---|---|
| 배경 메인 | `theme.colors.bgMain` (#FAF9F7) |
| 배경 보조 (prefill box, OTP cell) | `theme.colors.bgSub` (#F0EDE8) |
| 주조 (버튼·filled cell border·primary text) | `theme.colors.primary` (역할별 #3D5246 등) |
| 텍스트 메인 | `theme.colors.textMain` (#2C2C2C) |
| 텍스트 보조 | `theme.colors.textSecondary` (#5C6B61) |
| 텍스트 3차 (placeholder·disabled·hint) | `theme.colors.textTertiary` (#9E9E9E) |
| 버튼 위 텍스트 | `theme.colors.textOnPrimary` (#FFFFFF) |
| 테두리 (input box·empty OTP cell) | `theme.colors.border` (#D4CFC8) |
| 에러 | `theme.colors.error` (#E57373) |
| 폰트 패밀리 | `theme.fontFamily.semibold` (OTP cell) |
| 폰트 크기 | `fontSize.{xs, sm, base, lg, xl, 2xl}` |
| Spacing | StyleSheet 하드코딩 8/12/14/16/20/24/40/56 — 기존 Apple 화면 패턴 그대로 (별도 spacing 토큰화는 Phase 2 외) |
| Radius | StyleSheet 12 (inputBox/primaryBtn), 10 (OTP cell), 16 (prefillBox 변경 시) |

#### 2.5.2 frontend/web (`unified-design-tokens.css` `var(--mg-*)`)

| 용도 | 토큰 |
|---|---|
| 모달 컨테이너 | UnifiedModal 기본 (별도 토큰 불필요) |
| 입력 필드 | 클래스 `mg-v2-input`, error 시 `mg-v2-input--error` |
| 폼 그룹 | 클래스 `mg-v2-form-group`, `mg-v2-form-label`, `mg-v2-form-error` |
| 버튼 | `MGButton` 컴포넌트 (variant primary/outline) |
| 주조 색 | `var(--mg-color-primary-main)` (#3D5246) |
| 텍스트 메인 | `var(--mg-color-text-main)` |
| 텍스트 보조 | `var(--mg-color-text-secondary)` |
| 테두리 | `var(--mg-color-border-main)` |
| 에러 | `var(--mg-error-500)` |
| 카드 배경 | `var(--mg-color-background-secondary)` |
| Spacing | `var(--spacing-{sm,md,lg})` |
| Radius | 기본 `var(--mg-radius-md)` (8~12px) |
| 폰트 크기 | `var(--font-size-{xs,sm,md,lg})` |
| OTP cell (신규 atom) | 48×48px, border 2px, radius 10px, 폰트 20px/700 — 위 토큰 조합 |

### 2.6 접근성 (Accessibility)

| 요구사항 | 적용 |
|---|---|
| **aria-label (휴대폰 입력)** | "휴대폰 번호 11자리 입력" |
| **aria-label (OTP 입력)** | "인증번호 6자리 입력" (OtpCodeInput 기본값) |
| **accessibilityHint (OTP)** | "6자리 숫자를 입력해 주세요" |
| **aria-live (타이머)** | RN: `accessibilityLabel` 동적 갱신 — "남은 시간 M:SS" / "인증번호 만료됨". Web: `aria-live="polite"` 영역에 카운트다운. 너무 잦은 갱신 방지를 위해 10초 단위로만 announce(스크린리더). |
| **aria-live (에러)** | `accessibilityRole="alert"` (RN) / `role="alert"` (web). |
| **aria-label (재발송)** | enabled: "인증번호 재발송", disabled: "인증번호 재발송 (재발송까지 M:SS)" |
| **focus order** | step='phone': prefillBox → 휴대폰 입력 → Send → 로그인으로. step='otp': prefillBox → OTP 입력(autoFocus) → 재발송 → Verify → 휴대폰 변경 → 로그인으로. |
| **autoFocus** | step 진입 시 첫 입력에 자동 포커스 (휴대폰 / OTP) — 150ms delay (RN), web 은 즉시. |
| **iOS/Android SMS 자동입력** | `textContentType="oneTimeCode"`, `autoComplete="sms-otp"` (이미 OtpCodeInput 적용) |
| **터치 영역** | primary 버튼 minHeight 48px, OTP cell 44×44px, 재발송 링크 hitSlop 12px (RN). |
| **색 대비** | 모든 텍스트/배경 4.5:1 이상 — 기존 토큰 조합으로 통과. error 색만 대문자/굵게로 보강 권장 없음(샘플과 동일 톤 유지). |
| **PII 마스킹** | OTP 단계 안내 텍스트는 `010-****-5678` 마스킹된 번호만 노출. 운영 환경 로그·에러 메시지에 전체 번호 금지. |
| **키보드 회피** | RN: `KeyboardAvoidingView` (iOS=padding, Android=height). Web: `UnifiedModal` 기본 처리. |

---

## 3. 인터랙션 시퀀스 다이어그램 (텍스트)

```
[OAuth 제공자 로그인 완료]
         │
         ▼
[BE /api/v1/oauth/login or /api/v1/{provider}/login]
         │
         ├─ requiresPhoneVerification=true + phoneVerificationToken
         ▼
[Client: OAuthPhoneLink 진입 — provider, prefillEmail, prefillName, phoneVerificationToken params]
         │
         ▼
[Step 1: 휴대폰 입력]
         │
         │  사용자 입력 → validateKoreanMobileInput (11자리 01[016789] 패턴)
         │
         ▼
[Send 클릭 → AuthService.sendOAuthPhoneOtp(provider, phoneVerificationToken, phone)]
         │
         ▼
[POST /api/v1/oauth/phone/send  body: {provider, phoneVerificationToken, phoneNumber}]
         │
         ├─ kind='sent'    → otpChallengeToken + expiresInSeconds
         │                   → setStep('otp'), startTimers(expires, RESEND_COOLDOWN=60s)
         │                   → 햅틱 Success
         ├─ kind='cooldown' → retryAfterSeconds
         │                   → inline error + resend 카운트다운, step 유지
         │                   → 햅틱 Warning
         └─ kind='error'    → inline error, step 유지
                             → 햅틱 Error
         │
         ▼
[Step 2: OTP 입력]
         │
         │  6자리 입력 → onComplete (자동) 또는 Verify 클릭
         │
         ▼
[AuthService.verifyOAuthPhoneOtp(provider, phoneVerificationToken, otpChallengeToken, code)]
         │
         ▼
[POST /api/v1/oauth/phone/verify  body: {provider, phoneVerificationToken, otpChallengeToken, code}]
         │
         ├─ kind='authenticated'              → user + tokens → navigateAfterAuthenticated()
         ├─ kind='requiresPhoneAccountSelection' → selectionToken
         │                                      → router.replace('/oauth-account-selection', {selectionToken, provider})
         └─ kind='error'                      → inline error + cell border error + 햅틱 Error
                                              (만료 시 timer 가 0 이면 재발송 강제)
         │
         ▼
[다음 화면]
   ├─ 로그인 완료 → 역할별 홈 화면
   └─ 다중 매칭 → 계정 선택 → 선택 후 로그인 완료
```

**timeouts**:
- `phoneVerificationToken` JWT: 10분 (BE 발급, 클라이언트 측 만료 처리는 401 에러 핸들링 → 로그인 화면으로 복귀)
- `otpChallengeToken`: BE 가 `expiresInSeconds` 로 알려줌 (권장 180s, 본 스펙은 **300s 권장** 안 BE 와 합의 필요 — `applyServerExpiresIn` fallback 180s 유지)
- Resend cooldown: 클라이언트 기본 60s, BE `retryAfterSeconds` 우선

---

## 4. Provider 별 differentiation 매트릭스

| Provider | 화면 제목 | prefill 가능 필드 | private relay 처리 | 비고 |
|---|---|---|---|---|
| **APPLE** | `Apple 계정 연결` | name(첫 로그인만), email(relay 가능), providerUserId | `socialUserInfo.isPrivateRelay=true` 시 prefillBox 하단에 "Private Relay 이메일이 사용됩니다" 안내 (12px, textTertiary) | 기존 화면과 100% 동일. |
| **GOOGLE** | `Google 계정 연결` | name, email | 해당 없음 | name·email 항상 prefill. |
| **KAKAO** | `Kakao 계정 연결` | name(선택 동의), email(선택 동의), nickname | **name null 가능** — null 시 prefillBox 이름 행 숨김, nickname 가용 시 nickname 표시 (Kakao 버그 `[1d543328]` 충돌 회피) | prefillBox 항목 null-safe 렌더. |
| **NAVER** | `Naver 계정 연결` | name, email | mobile scope 제거 분기 (C) — name·email 만 prefill | 본 스펙의 최우선 사용처. |

**provider 식별 텍스트 (D-2 권장안 ii)**:
- 화면 제목: `{providerDisplayName} 계정 연결` (Apple/Google/Kakao/Naver — Korean 그대로)
- 설명: `본인 확인을 위해 가입된 휴대폰 번호로 SMS 인증 코드를 보내드립니다. {providerDisplayName} 계정 정보와 연결됩니다.`
- prefillBox aria-label: `{providerDisplayName} 계정 정보`

**provider display name 매핑 (상수, 카피)**:
```
APPLE  → "Apple"
GOOGLE → "Google"
KAKAO  → "카카오"     (한국어 표기)
NAVER  → "네이버"     (한국어 표기)
```

---

## 5. expo-app vs frontend/web 차이 매트릭스

| 항목 | expo-app | frontend/web |
|---|---|---|
| 컨테이너 | 전용 스크린 (`KeyboardAvoidingView` + `ScrollView`) | `UnifiedModal` variant="form" size="small" |
| 라우팅 | `expo-router` Stack (`/(auth)/oauth-phone-link`) | 모달 open/close (상위 컴포넌트 state) |
| 토큰 시스템 | `useTheme()` (JS object) | CSS Custom Properties (`var(--mg-*)`) |
| OTP 입력 | `OtpCodeInput` molecule (이미 존재) | 신규 atom `OtpCodeInput.js` (core-coder 작성) |
| 휴대폰 입력 | `TextInput` keyboardType="phone-pad" | `<input type="tel">` + `formatPhoneNumber` autoFormat |
| SMS 자동입력 | `textContentType="oneTimeCode"`, `autoComplete="sms-otp"` | `autocomplete="one-time-code"` |
| 햅틱 | `expo-haptics` Success/Warning/Error | 해당 없음 (시각 강조만) |
| 카운트다운 라이브러리 | `setInterval` + `tickOtpCountdown` | 동일 패턴 (web 도 동일 util 권장) |
| 버튼 | `Pressable` + 자체 스타일 | `MGButton` |
| 키보드 회피 | `KeyboardAvoidingView` | `UnifiedModal` 기본 |
| 화면 제목 위치 | ScrollView 본문 상단 | UnifiedModal title prop |
| 액션바 | 본문 내 primary 버튼 + 하단 cancel 링크 | UnifiedModal `actions` prop (cancel/submit) |
| 닫기 UX | "로그인으로" 텍스트 링크 | UnifiedModal 우상단 ✕ + cancel 버튼 |
| 자동 verify | OTP 6자리 입력 시 `onComplete` 콜백 → verify | 동일 (자동 submit) |
| Private relay 안내 | prefillBox 하단 작은 텍스트 | 동일 |

---

## 6. 카피 라이팅 (한국어, 5~10건)

| ID | 컨텍스트 | 카피 |
|---|---|---|
| TITLE | 화면 제목 | `{providerDisplayName} 계정 연결` |
| DESCRIPTION | 화면 설명 | `본인 확인을 위해 가입된 휴대폰 번호로 SMS 인증 코드를 보내드립니다. {providerDisplayName} 계정 정보와 연결됩니다.` |
| PHONE_LABEL | 휴대폰 라벨 | `휴대폰 번호` |
| PHONE_PLACEHOLDER | 휴대폰 placeholder | `01012345678` |
| SEND_BUTTON | 1차 발송 버튼 | `인증번호 발송` |
| SENDING_BUTTON | 발송 중 hint | `발송 중…` |
| OTP_TITLE | OTP 단계 제목 | `인증번호 확인` |
| OTP_DESCRIPTION | OTP 단계 설명 | `문자로 전송된 6자리 인증번호를 입력해 주세요.` + (옵션) ` ({maskedPhone})` |
| TIMER_REMAINING | 카운트다운 | `남은 시간 {M:SS}` |
| TIMER_EXPIRED | 만료 | `인증번호가 만료되었습니다.` |
| VERIFY_BUTTON | 확인 버튼 | `확인` |
| VERIFYING_BUTTON | 확인 중 | `확인 중…` |
| RESEND_ENABLED | 재발송 활성 | `인증번호 재발송` |
| RESEND_DISABLED | 재발송 쿨다운 | `인증번호 재발송 {M:SS}` |
| CHANGE_PHONE | 휴대폰 변경 | `휴대폰 번호 변경` |
| CANCEL | 취소·뒤로 | `로그인으로` |
| ERROR_PHONE_REQUIRED | 휴대폰 미입력 | `휴대폰 번호를 입력해 주세요.` |
| ERROR_PHONE_LENGTH | 11자리 미달/초과 | `휴대폰 번호 11자리를 입력해 주세요.` |
| ERROR_PHONE_FORMAT | 01x 패턴 위반 | `01로 시작하는 휴대폰 번호를 입력해 주세요.` |
| ERROR_OTP_LENGTH | OTP 6자리 미만 | `인증번호 6자리를 입력해 주세요.` |
| ERROR_OTP_MISMATCH | OTP 불일치 | `인증번호가 일치하지 않습니다. 다시 확인해 주세요.` |
| ERROR_OTP_EXPIRED | OTP 만료 후 verify | `인증번호가 만료되었습니다. 인증번호를 다시 받아 주세요.` |
| ERROR_DAILY_LIMIT | 한도 초과 | `오늘 인증 시도 횟수를 초과했습니다. 내일 다시 시도하거나 다른 로그인 수단을 이용해 주세요.` |
| ERROR_TOKEN_EXPIRED | phoneVerificationToken 만료 | `인증 세션이 만료되었습니다. 로그인 화면에서 다시 시도해 주세요.` |
| ERROR_SESSION_EXPIRED | otpChallengeToken 만료/세션 오류 | `인증 세션이 만료되었습니다. 인증번호를 다시 받아 주세요.` |
| ERROR_GENERIC_SEND | 발송 실패 generic | `인증번호 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.` |
| ERROR_COOLDOWN | 쿨다운 (BE 신호) | `잠시 후 다시 시도해 주세요.` |
| PRIVATE_RELAY_HINT | Apple Private Relay | `Apple Private Relay 이메일이 사용됩니다.` |

**카피 원칙**:
- 운영 환경 **PII 노출 금지** — 에러 메시지에 전체 휴대폰 번호 절대 금지. 마스킹 번호만 사용.
- 사용자 친화 — 기술 용어("JWT", "challenge token") 노출 금지. "인증 세션"으로 통일.
- 제공자 명은 한국어 표기 (카카오/네이버), 영문 그대로 (Apple/Google).

---

## 7. 상호작용·상태 추가 디테일

### 7.1 자동 verify 트리거 조건
- OTP 6자리 입력 완료 + busy=false + otpChallengeToken 존재 + 만료되지 않음 → 자동 `handleVerifyOtp()`
- 사용자가 5자리 후 백스페이스 → 자동 verify 취소 (입력 길이로 동기화됨)

### 7.2 재발송 후 클리어
- 재발송 성공 → OTP 입력값 클리어 (`setOtpInput('')`), 타이머 리셋, OTP cell autoFocus 유지
- 재발송 실패 → 입력값 유지, 에러만 표시

### 7.3 휴대폰 번호 변경 (step='otp' → step='phone')
- OTP 입력값 클리어, otpChallengeToken null, 타이머 클리어
- 휴대폰 입력값은 유지(편의)
- 변경 후 다시 발송 시 BE 가 새 challenge 토큰 발급 (기존 challenge 토큰 무효화는 BE 책임)

### 7.4 백 버튼 / 모달 닫기
- expo-app: 시스템 백 버튼 / "로그인으로" → 타이머 정리 + `router.replace('/(auth)/login')`
- frontend/web: ✕ 또는 "취소" → 타이머 정리 + 모달 close + 부모 컴포넌트가 로그인 화면 복귀

### 7.5 햅틱 가이드 (expo-app 한정)
| 시점 | 햅틱 |
|---|---|
| 발송 성공 (sent) | Success |
| 발송 cooldown | Warning |
| 발송 error | Error |
| OTP 검증 성공 (authenticated) | Success |
| OTP 검증 실패 | Error |
| 입력 검증 실패 (휴대폰/OTP 형식 위반) | Warning |

---

## 8. 참조

- `expo-app/app/(auth)/apple-phone-link.tsx` — Apple OTP 베이스 화면 (인용 확인)
- `expo-app/src/components/molecules/OtpCodeInput.tsx` — OTP molecule 재사용
- `expo-app/src/utils/applePhoneOtp.ts` — OTP 유틸 (제너릭화 대상)
- `expo-app/src/services/auth/applePhoneVerificationMapper.ts` — 응답 매퍼 (제너릭화 대상)
- `expo-app/src/api/auth/appleAuth.ts` — Apple API 클라이언트 (제너릭화 대상)
- `expo-app/src/services/AuthService.ts:178-201, 571-616` — provider dispatch 확장점
- `frontend/src/components/auth/SocialSignupModal.js` — 웹 베이스 모달 (회피 라인 준수)
- `frontend/src/components/common/modals/UnifiedModal.js` — 웹 모달 공통
- `frontend/src/styles/unified-design-tokens.css` — `var(--mg-*)` 단일 소스
- `docs/design-system/PENCIL_DESIGN_GUIDE.md` — 펜슬 단일 소스 가이드
- `docs/design-system/ATOMIC_DESIGN_SYSTEM.md` — 아토믹 계층 규칙
- `docs/design-system/AUTH_PAGES_REDESIGN_SPEC.md` — 인증 페이지 비주얼 톤
- `docs/standards/DESIGN_CENTRALIZATION_STANDARD.md` — 토큰 중앙화
- `docs/standards/COMMON_MODULES_USAGE_GUIDE.md` — 공통 모듈 우선 검토 (UnifiedModal 등)
- `docs/project-management/2026-06-08/NAVER_LOGIN_REVIEW_REJECTION_RESPONSE_2026_06_05.md` — 배경

---

## 9. core-coder 핸드오프 — Phase 3B/3C 위임문 인용용 5줄 요약

> **OAuth OTP UX 스펙 핵심 (`docs/design-system/OAUTH_PHONE_VERIFICATION_UX_SPEC.md`)**:
> 1. **신규 파일 우선 (D-1=(c), D-4=(ii))**: `expo-app/app/(auth)/oauth-phone-link.tsx`(provider param) + `apple-phone-link.tsx` redirect alias, `frontend/src/components/auth/OAuthPhoneVerificationModal.js`(`UnifiedModal` variant="form" size="small"). 회피 라인 무수정.
> 2. **시각·인터랙션 = Apple 베이스와 100% 동일**: expo 는 `useTheme()` + `fontSize` 토큰만, web 은 `var(--mg-*)` + `mg-v2-form-*` + `MGButton` + `UnifiedModal` 만. 하드코딩 색·간격 금지(StyleSheet 의 기존 px 값은 그대로 유지).
> 3. **컴포넌트 재사용**: expo `OtpCodeInput` molecule 그대로, web 은 신규 atom `OtpCodeInput.js`(48×48 cell, border 2px, radius 10px, primary/border/error 토큰) 추가. `MGButton`·`UnifiedModal`·`mg-v2-input` 재사용.
> 4. **provider 식별 = 텍스트만 (D-2=(ii))**: `{providerDisplayName} 계정 연결` 제목 + prefillBox aria-label `{providerDisplayName} 계정 정보`. 로고/브랜드 색은 본 Phase 스코프 외. Kakao name null 시 prefillBox 이름 행 숨김 필수.
> 5. **카피·상태·접근성**: 본 문서 §6(카피 26개), §2.4(상태 14개), §2.6(접근성)·§7(상호작용 디테일)을 빠짐없이 반영. 운영 환경 PII(전체 번호) 노출 금지 — `010-****-5678` 마스킹만. 카운트다운은 `aria-live="polite"` 10초 간격 announce.

