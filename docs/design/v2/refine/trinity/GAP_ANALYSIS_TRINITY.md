# Visual Gap Analysis: frontend-trinity vs Design v2 Mockup

**작성일**: 2026-06-17  
**대상 코드베이스**: `frontend-trinity/` (Next.js 14 App Router, TypeScript)  
**운영 URL**: `https://apply.e-trinity.co.kr`  
**개발 URL**: `https://apply.dev.e-trinity.co.kr`  
**기준 Mockup**: `assets/design-v2-refine-*-target-mockup-v2.png`  
**참고 SPEC (MindGarden CRA, 디자인 의도만)**: `docs/design/v2/refine/v2/DESIGN_V2_REFINE_V2_*_SPEC.md`

---

## 1. 개요

MindGarden CRA(`frontend/`)에 머지된 Design v2 PR(#425/#427/#426)은 **운영 Trinity와 무관**합니다. 본 갭 분석은 **e-trinity Trinity 온보딩·랜딩·요금(Step3)** SSOT인 `frontend-trinity/`를 Mockup v2 및 v2 Refine SPEC 디자인 의도와 대조합니다.

### 1.1 SSOT 파일 맵

| 영역 | 라우트 (prod) | SSOT 경로 |
|------|---------------|-----------|
| Landing | `/` | `frontend-trinity/app/page.tsx`, `components/Hero.tsx`, `Header.tsx`, `Footer.tsx` |
| Onboarding | `/onboarding/` | `frontend-trinity/app/onboarding/page.tsx`, `components/onboarding/Step*.tsx` |
| Pricing (온보딩 내) | Step 3 | `components/onboarding/Step3PricingPlan.tsx` |
| 상수·단계 | — | `constants/trinity.ts` (`ONBOARDING_STEP`, `ONBOARDING_STEPS`) |
| 스타일 토큰 | — | `styles/variables.css`, `styles/components/*.css` |
| 배포 | — | `.github/workflows/deploy-trinity-dev.yml`, `deploy-trinity-prod.yml` |

---

## 2. 6단계 vs Mockup 4단계 — 정합 결론

| 구분 | Mockup v2 Onboarding SPEC (MindGarden) | Trinity 현행 | 결론 |
|------|----------------------------------------|--------------|------|
| 스텝 수 | 4단계 축소 제안 (`STEP 1 OF 4`, 4-dot Stepper) | **6단계** 비즈니스 로직 (`ONBOARDING_STEP` 1~6) | **6단계 유지** |
| 실제 사용자 경로 | 단일 폼 축소 시나리오 | Step1→2→3→**(4·5 스킵)**→6 제출 (Step4 `false` 숨김) | 경로는 코드로 확정, 시각만 v2 적용 |
| Progress UI | 4-dot 시각 Stepper | `AnimatedProgressBar` + `ONBOARDING_STEPS` **5개 라벨** (Step6 미표시) | **6-dot Stepper로 정합** 필요 |
| 좌측 패널 | 40% Dark + TenantNetworkVisual | 단일 컬럼 `Header` + 중앙 폼 | **40/60 Split 신규** |

**확정 결론**: Mockup v2의 **4단계는 MindGarden CRA 단순화 시안**이며 Trinity **비즈니스·API·CAPTCHA·대시보드 설정(Step6)** 요구와 충돌합니다. Design v2 Refine Trinity는 **6단계 플로우를 유지**하고, Mockup v2의 **비주얼 언어**(40/60 Split, Navy 패널, Tenant Network, Blue→Violet CTA, Enterprise 다크 카드 등)만 이식합니다. 좌측 패널 인디케이터는 `STEP N OF 6` 형식을 사용합니다.

### Trinity 6단계 정의 (유지)

| Step | 상수 | 컴포넌트 | 현행 노출 |
|------|------|----------|-----------|
| 1 | `BASIC_INFO` | `Step1BasicInfoProgressive` | 활성 — 이메일 검증·서브도메인 포함 |
| 2 | `BUSINESS_TYPE` | `Step2BusinessType` | 활성 — API 업종 카테고리 |
| 3 | `PRICING_PLAN` | `Step3PricingPlan` | 활성 |
| 4 | `PAYMENT_METHOD` | `Step4Payment` | **숨김** (`false &&`) — PG 추후 |
| 5 | `COMPLETION` | `Step5Completion` | 정상 플로우에서 **스킵** (3→6) |
| 6 | `DASHBOARD_SETUP` | `Step6DashboardSetup` + CAPTCHA | 활성 — 최종 제출 |

---

## 3. 페이지별 갭 분석

### 3.1 Landing (`/` — `app/page.tsx`)

| 항목 | Mockup v2 / SPEC | Trinity 현행 | Gap |
|------|------------------|--------------|-----|
| Hero 레이아웃 | 50:50 — 텍스트 좌 / DashboardPreview 우 | 중앙 정렬 단일 컬럼 (`Hero.tsx`) | **Critical** — 구조 전면 개편 |
| Eyebrow Chip | "Multi-Tenant SaaS Platform" Pill | 없음 | 추가 필요 |
| H1 카피 | B2B SaaS 멀티테넌트 (2줄 + 그라데이션) | "소상공인을 위한 통합 솔루션" | 카피·브랜드 정체성 변경 |
| Social Proof | 200+ 기업 + 5 로고 (ACME 등) | 없음 | 추가 필요 |
| Feature Grid | 3열 — 격리/자동화/분석 | `SERVICES` 3카드 (ERP/권한/쉬운사용) | 내용·아이콘·비주얼 교체 |
| Pricing 섹션 | 별도 Pricing 페이지 Hero 스타일 | 홈 내 `#pricing` + API `getActivePricingPlans` | 레이아웃 v2 카드 스타일 미적용 |
| NavBar | Slim GNB 64~72px, 4 링크 + CTA | `Header.tsx` — Trinity 단순 헤더 | GNB v2 스펙 미적용 |
| 토큰 | `--mg-v2-*` / Navy Primary `#3B82F6` | `--color-primary: #007aff` (iOS Blue) | **토큰 체계 전환** |
| 에셋 | `dashboard-preview.svg`, feature icons, logos | 이모지 아이콘 (`📊` 등) | SVG 에셋 연결 |

### 3.2 Pricing (온보딩 Step 3 — `Step3PricingPlan.tsx`)

Trinity에 **독립 `/pricing` 라우트 없음**. Mockup v2 Pricing 페이지 스펙은 **Step3 + Landing `#pricing`** 에 분할 적용.

| 항목 | Mockup v2 Pricing SPEC | Trinity Step3 / Landing | Gap |
|------|------------------------|-------------------------|-----|
| Hero / Eyebrow | "PRICING" Eyebrow + H1 | Step3: `h3` "요금제 선택"만 | Eyebrow·타이포 스케일 미적용 |
| Billing Toggle | 월간/연간 Pill | 없음 | 온보딩 Step3에는 **제외** (Landing만 선택 적용) |
| 카드 variant | starter / popular / enterprise-dark | 단일 `PricingCard` 스타일 | Pro Featured·Enterprise Dark 미구현 |
| Trust Badges | ISO/SOC2/GDPR/KISA 하단 | 없음 | Landing pricing 섹션에 추가 |
| 가격 데이터 | API `baseFee` 실시간 | API 연동 ✅ | 표시 포맷·TBD 정책은 운영 데이터 따름 |
| Compare 토글 | "자세한 비교 보기" | 없음 | Landing 후순위 (Phase 3+) |

### 3.3 Onboarding (`/onboarding/` — `app/onboarding/page.tsx`)

| 항목 | Mockup v2 Onboarding SPEC | Trinity 현행 | Gap |
|------|---------------------------|--------------|-----|
| 레이아웃 | 40% Dark / 60% White Split | `Header` + 단일 `container` 폼 | **Critical** — Template 신규 |
| 좌측 패널 | BrandSymbol + TenantNetworkVisual + Value Prop | `OnboardingWelcome` 별도 화면 | Welcome을 Split 좌측으로 통합 또는 재배치 |
| Stepper | 4-dot (SPEC) → Trinity **6-dot** | `AnimatedProgressBar` (5단계 기준) | 6-dot + 라벨 정합 |
| 폼 필드 | 56px 높이, Segmented Control | Progressive 필드·기본 input | 높이·Segmented 스타일 v2 |
| CTA | Full-width Gradient Primary | `trinity-progressive-fields__nav-button` | Gradient CTA 미적용 |
| 다크 모드 | Form Panel 변형 정의 | 미구현 | Phase 2+ |
| CAPTCHA | SPEC 외 Trinity 요구 | `OnboardingCaptchaSection` Step6 | **유지** — 레이아웃 내 배치만 |
| 이메일 검증·서브도메인 | SPEC에 없음 | Step1 Progressive에 구현 | **Trinity 전용 — 유지** |
| Step4 Payment | — | 숨김 + PG 안내 박스 | PG 활성화 시 Step4 복원 계획 명시 |

### 3.4 스타일·토큰 시스템

| 항목 | v2 Target | Trinity `variables.css` | Gap |
|------|-----------|-------------------------|-----|
| Primary | `#3B82F6` | `#007aff` | 불일치 |
| Navy Panel | `#0F172A` | `--bg-dark: #1d1d1f` | 불일치 |
| Accent Gradient | `#3B82F6 → #8B5CF6` | 없음 | 추가 |
| 네이밍 | `--mg-v2-*` 또는 Trinity 전용 `--trinity-v2-*` | `--color-*`, `--text-*` | **Trinity v2 토큰 레이어** 신설 권장 |
| CSS 구조 | 컴포넌트 BEM | `trinity-onboarding__*` 등 존재 | v2 클래스 병행·점진 교체 |

### 3.5 에셋

v2 SVG 에셋은 `docs/design/v2/refine/v2/assets/`에 존재. Trinity 구현 시 **복사 또는 public 경로 참조** 필요:

- Onboarding: `tenant-network-visual.svg`, `brand-symbol-*.svg`
- Landing: `dashboard-preview.svg`, `icon-feature-*.svg`, `logo-*.svg`
- Pricing: `icon-plan-*.svg`, `badge-*.svg`

---

## 4. MindGarden CRA vs Trinity — 혼동 방지

| 항목 | MindGarden `frontend/` | Trinity `frontend-trinity/` |
|------|------------------------|----------------------------|
| 프레임워크 | React CRA SPA | Next.js 14 App Router |
| 온보딩 경로 | `/onboarding` (React Router) | `/onboarding/` (`app/onboarding/page.tsx`) |
| Pricing 페이지 | `/pricing` 독립 | **없음** — Step3 + Landing |
| Design v2 PR | #425/#427/#426 (develop) | **미적용** — 본 배치로 재작업 |
| 사용자 결정 | `mg_decide_after_trinity` — Trinity 완료 후 | revert/배포 **금지** |

---

## 5. 조치 우선순위 (Orchestration Phase 연계)

| 우선순위 | 항목 | Phase |
|----------|------|-------|
| P0 | Trinity v2 토큰 레이어 (`variables.css` 확장) | Phase 2 Coder |
| P0 | Onboarding 40/60 Split Template + 6-dot Stepper | Phase 2 Coder |
| P0 | Landing Hero 50:50 + DashboardPreview 에셋 | Phase 2 Coder |
| P1 | Step3 / Landing PricingCard v2 variant (popular, enterprise-dark) | Phase 2 Coder |
| P1 | PublicNavBar 공통화 (Landing + Onboarding) | Phase 2 Coder |
| P2 | Trust Badges, Social Proof Logos | Phase 2~3 |
| P2 | Billing Cycle Toggle (Landing only) | Phase 3 |
| P3 | 다크 모드, FAQ/Compare (Landing Pricing 확장) | Phase 3+ |
| 보류 | MindGarden CRA #425/#427/#426 revert/배포 | Phase 5 — 사용자 결정 |

---

## 6. 검증 기준 (dev 배포 후)

- `https://apply.dev.e-trinity.co.kr/` — Landing v2 시각 확인
- `https://apply.dev.e-trinity.co.kr/onboarding/` — 6단계 플로우·Split 레이아웃·제출(CAPTCHA) 동작
- GitHub Actions `deploy-trinity-dev.yml` health URL 통과
- `frontend/` 및 MindGarden PR 코드 **미변경** 확인
