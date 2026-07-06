# Trinity Onboarding UI/UX Spec (Design v2 Refine)

- **작성일**: 2026-06-17
- **브랜드**: Trinity / CoreSolution (e-trinity.co.kr)
- **코드베이스**: `frontend-trinity/` (Next.js 14 App Router)
- **운영 URL**: `https://apply.e-trinity.co.kr/onboarding/`
- **Mockup**: `assets/design-v2-refine-onboarding-target-mockup-v2.png`
- **참고**: MindGarden CRA SPEC (`DESIGN_V2_REFINE_V2_ONBOARDING_SPEC.md`) — **디자인 의도만** 이식

---

## 1. 개요

Trinity 테넌트 온보딩은 **6단계 비즈니스 플로우를 유지**합니다. Mockup v2의 4단계 축소안은 적용하지 않고, **40/60 Split·Dark Panel·Tenant Network·v2 토큰**만 이식합니다.

### 1.1 Next.js 구조 (SSOT)

```
frontend-trinity/
├── app/onboarding/
│   ├── page.tsx          # 메인 온보딩 페이지 (Client)
│   ├── layout.tsx
│   ├── callback/page.tsx # PG 콜백
│   └── status/page.tsx
├── components/onboarding/
│   ├── Step1BasicInfoProgressive.tsx  # Step 1
│   ├── Step2BusinessType.tsx          # Step 2
│   ├── Step3PricingPlan.tsx           # Step 3
│   ├── Step4Payment.tsx             # Step 4 (현재 숨김)
│   ├── Step5Completion.tsx          # Step 5
│   ├── Step6DashboardSetup.tsx        # Step 6
│   ├── ProgressSteps.tsx / AnimatedProgressBar.tsx
│   ├── OnboardingWelcome.tsx
│   ├── OnboardingCaptchaSection.tsx
│   └── StepTransition.tsx
├── hooks/useOnboarding.ts
├── constants/trinity.ts   # ONBOARDING_STEP, ONBOARDING_STEPS
└── styles/components/onboarding.css
```

### 1.2 6단계 정의 (유지)

| Step | ID | 라벨 (한글) | 컴포넌트 | 사용자 경로 |
|------|-----|-------------|----------|-------------|
| 1 | `BASIC_INFO` | 기본 정보 | `Step1BasicInfoProgressive` | 활성 |
| 2 | `BUSINESS_TYPE` | 업종 선택 | `Step2BusinessType` | 활성 |
| 3 | `PRICING_PLAN` | 요금제 선택 | `Step3PricingPlan` | 활성 |
| 4 | `PAYMENT_METHOD` | 결제 수단 | `Step4Payment` | 숨김 (PG 추후) |
| 5 | `COMPLETION` | 신청 완료 | `Step5Completion` | 스킵 (3→6) |
| 6 | `DASHBOARD_SETUP` | 대시보드 설정 | `Step6DashboardSetup` | 활성 + CAPTCHA 제출 |

`constants/trinity.ts`의 `ONBOARDING_STEPS` 배열을 **6항목**으로 정합하고, `AnimatedProgressBar`의 `totalSteps`도 6으로 통일합니다.

---

## 2. 레이아웃 그리드

### 2.1 Desktop (≥1024px)

- **전체**: max-width 1920px, 중앙 정렬
- **Split**: 좌측 Dark Panel **40%** / 우측 Form Panel **60%**
- **GNB**: Onboarding 전용 Slim Header 또는 Split 위 공통 `PublicNavBar` (높이 64px)
- **Grid**: 12-column, gutter 24px (Form 영역 내부)

### 2.2 좌측 Dark Panel (40%)

| 요소 | 스펙 |
|------|------|
| 배경 | `var(--trinity-v2-color-navy)` → `#0F172A` |
| 패딩 | 64px (`4rem`) |
| Brand Wordmark | 상단 좌측, 높이 32px — Trinity / CoreSolution |
| TenantNetworkVisual | 중앙, viewBox 480×480, 에셋 `tenant-network-visual.svg` |
| Value Proposition | 하단 — H1 40px/700, 2줄 이내 |
| Step 인디케이터 | `STEP {current} OF 6`, 14px, 하단 progress bar 2px |

**Value Prop 카피 (제안)**:
- Title: "여러 테넌트, 하나의 플랫폼"
- Desc: "CoreSolution으로 소상공인 비즈니스 운영을 통합하세요"

### 2.3 우측 White Form Panel (60%)

| 요소 | 스펙 |
|------|------|
| 배경 | `var(--trinity-v2-color-surface-light)` → `#FFFFFF` |
| 패딩 | 상하 80px, 좌우 120px (tablet/mobile 유동) |
| 6-dot Stepper | 상단 중앙, dot 32×32px, 활성 Primary |
| H1 (단계 제목) | 36px / 700, margin-bottom 16px |
| Subtitle | 16px / 400, `--trinity-v2-color-text-secondary` |
| 폼 필드 높이 | 56px, radius 8px, border 1px `--trinity-v2-color-border` |
| Primary CTA | width 100%, height 56px, gradient Primary→Accent, shadow |
| 보조 링크 | "이미 계정이 있으신가요? 로그인" — 14px, margin-top 24px |

### 2.4 Welcome / 기존 요청 화면

- `OnboardingWelcome`, 기존 요청 선택 UI는 **Split 레이아웃 내 우측 패널**에 배치 (좌측 패널은 공통 유지).
- `showWelcome` / `showExistingRequests` 분기 시에도 Split Template 래퍼 유지.

---

## 3. 단계별 UI 요구 (Trinity 기능 + v2 비주얼)

### Step 1 — 기본 정보 (`Step1BasicInfoProgressive`)

- Progressive 필드 순서 유지: 회사명 → 이메일(검증) → 연락처 → 서브도메인(중복 확인) → 지역 등
- v2: 각 필드 56px, Focus ring `2px solid primary` + glow
- Segmented Control: 임직원 규모 등 선택 UI가 있으면 4분할 Segmented 스타일 적용
- **Trinity 전용 로직 유지**: 이메일 중복·인증 타이머, 서브도메인 preview

### Step 2 — 업종 (`Step2BusinessType`)

- API `loadBusinessCategories` / `loadBusinessCategoryItems` 유지
- v2: Dropdown 56px, 카테고리→세부 업종 2단 선택 UI 정돈

### Step 3 — 요금제 (`Step3PricingPlan`)

- API `getActivePricingPlans` 유지
- v2 Pricing 카드 variant 적용 (→ `DESIGN_V2_REFINE_V2_TRINITY_PRICING_SPEC.md` Step3 섹션)
- PG 안내 박스 (`trinity-onboarding__warning-box`) — v2 Warning 스타일로 시각만 정리

### Step 4 — 결제 (`Step4Payment`) — 현재 숨김

- `page.tsx`의 `false && step === 4` 유지
- v2 레이아웃·컴포넌트는 **미구현 상태로 스펙만 보존**
- PG 활성화 시: Step3 → Step4 → Step6 또는 Step3 → Step4 → Step5 → Step6 경로 재정의 (별도 Phase)

### Step 5 — 완료 (`Step5Completion`)

- 정상 플로우 스킵; PG/완료 화면 복원 시 PENDING 메시지 v2 타이포 적용

### Step 6 — 대시보드 설정 + 제출 (`Step6DashboardSetup`)

- 업종별 대시보드 설정 필드 유지
- `OnboardingCaptchaSection` — Step6 하단, 제출 버튼 직전
- CAPTCHA 미완료 시 제출 disabled 유지

---

## 4. 디자인 토큰 (Trinity v2)

`styles/variables.css`에 **v2 레이어** 추가 (`--trinity-v2-*`). 기존 `--color-*`는 점진 교체.

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--trinity-v2-color-navy` | `#0F172A` | 좌측 패널 |
| `--trinity-v2-color-primary` | `#3B82F6` | Stepper 활성, Focus |
| `--trinity-v2-color-accent` | `#8B5CF6` | CTA gradient 끝 |
| `--trinity-v2-color-border` | `#E2E8F0` | Input border |
| `--trinity-v2-color-text-secondary` | `#64748B` | Subtitle |
| `--trinity-v2-gradient-cta` | `linear-gradient(90deg, #3B82F6, #8B5CF6)` | Primary CTA |
| `--trinity-v2-shadow-cta` | `0 4px 14px rgba(59,130,246,0.4)` | CTA shadow |

타이포: Pretendard / system-ui. H1 36px, body 16px, caption 14px.

---

## 5. 반응형

| Breakpoint | 레이아웃 |
|------------|----------|
| ≥1024px | 40/60 Split |
| 768–1023px | Dark Panel → 상단 Hero (일러스트 축소), Form 하단 full-width, padding 40px |
| <768px | 일러스트 최소화/숨김, Form padding 24px, 필드 48px, Stepper dot 축소 |

---

## 6. 컴포넌트 분리 (신규·개편)

| 컴포넌트 | 경로 (제안) | 역할 |
|----------|-------------|------|
| `OnboardingSplitTemplate` | `components/onboarding/OnboardingSplitTemplate.tsx` | 40/60 Split 래퍼 |
| `OnboardingDarkPanel` | `components/onboarding/OnboardingDarkPanel.tsx` | 좌측 Brand + Visual + Step indicator |
| `OnboardingStepper` | `components/onboarding/OnboardingStepper.tsx` | **6-dot** Stepper (Mockup 4-dot 대체) |
| `BrandSymbol` | `components/branding/BrandSymbol.tsx` | variant: blackhole-ring 등 |
| `TenantNetworkVisual` | `components/branding/TenantNetworkVisual.tsx` | SVG 래퍼 |
| `TrinityGradientButton` | `components/Button.tsx` 확장 또는 variant | CTA gradient |

기존 `StepTransition`, `AnimatedProgressBar`는 `OnboardingStepper`로 통합 또는 병행 후 제거 검토.

---

## 7. 갭 분석 (현행 vs 본 SPEC)

| 항목 | 현행 | 목표 |
|------|------|------|
| 레이아웃 | 단일 컬럼 + Header | 40/60 Split |
| Stepper | 5-step progress bar | 6-dot Stepper |
| Primary 색 | `#007aff` | `#3B82F6` |
| 좌측 비주얼 | 없음 (Welcome 별도) | TenantNetworkVisual 상시 |
| Step4/5 | 숨김/스킵 | 유지 (비즈니스) |
| CAPTCHA | Step6 | 유지 |

상세: `GAP_ANALYSIS_TRINITY.md` §3.3

---

## 8. 라우트·배포

- **Prod**: `https://apply.e-trinity.co.kr/onboarding/`
- **Dev**: `https://apply.dev.e-trinity.co.kr/onboarding/`
- **배포**: `develop` push → `deploy-trinity-dev.yml`; prod → `deploy-trinity-prod.yml`
- **코드 변경 범위**: `frontend-trinity/**` 만 (Phase 2)

---

## 9. 텍스트 상수

하드코딩 금지 — `constants/trinity.ts`의 `MESSAGES`, `ONBOARDING_STEPS` 확장. 새 카피는 동일 파일 또는 i18n 도입 Phase에서 처리.

---

## 10. 금지 모티프

MindGarden garden/zen/healing/pastel 모티프 **금지**. B2B SaaS Navy·Network Node·Blue/Violet gradient만 사용. Trinity 소상공인 톤은 카피로만 유지.
