# Trinity Pricing UI/UX Spec (Design v2 Refine)

- **작성일**: 2026-06-17
- **브랜드**: Trinity / CoreSolution (e-trinity.co.kr)
- **코드베이스**: `frontend-trinity/` (Next.js 14 App Router)
- **Mockup**: `assets/design-v2-refine-pricing-target-mockup-v2.png`
- **참고**: MindGarden CRA `DESIGN_V2_REFINE_V2_PRICING_SPEC.md` — 디자인 의도만 이식

---

## 1. Trinity에서 Pricing의 위치

Trinity **독립 `/pricing` 페이지 없음**. Pricing v2 스펙은 다음 두 Surface에 분할 적용합니다.

| Surface | SSOT | 라우트 |
|---------|------|--------|
| **온보딩 Step 3** | `components/onboarding/Step3PricingPlan.tsx` | `/onboarding/` (step=3) |
| **Landing Pricing 섹션** | `app/page.tsx` `#pricing` + `PricingCard.tsx` | `/` |

데이터 SSOT: API `getActivePricingPlans()` → `/api/v1/ops/plans/active` (fallback: `constants/trinity.ts` `PRICING_PLANS`).

---

## 2. 레이아웃 그리드

### 2.1 Landing Pricing 섹션 (전체 페이지 Hero 포함)

- **Max content width**: 1200px (1920 컨테이너 내)
- **NavBar**: 72px 고정 (`PublicNavBar` — Landing SPEC과 공유)
- **Hero** (Landing `#pricing` 상단 또는 별도 Pricing Hero 블록):
  - Eyebrow: "PRICING" — Primary, uppercase, letter-spacing
  - H1: "비즈니스 규모에 맞춘 합리적인 요금" — 48px / 700
  - Sub-H1: 보조 텍스트 16~18px
  - **Billing Cycle Pill Toggle** (Landing only): 월간 / 연간(20% 할인)
- **Cards Grid**: 3열, gap 24px
- **Bottom Row**: Compare 토글 + Trust Badges (가로 1열)

### 2.2 Onboarding Step 3 (간소 Hero)

- Full Pricing Hero **생략** — Step 컨텍스트 내 카드 선택만
- H1 스케일: Onboarding SPEC — 36px 단계 제목 "요금제 선택"
- **Billing Toggle 제외** (온보딩에서는 월간 기본)
- 3카드 Grid — 모바일 1열 스택

---

## 3. Pricing Cards (3종)

공통 컴포넌트: `PricingCard.tsx` 확장 또는 `TrinityPricingPlanCard.tsx` 신규.

### 3.1 Starter

| 속성 | 스펙 |
|------|------|
| variant | `starter` — white, subtle border, radius 16px |
| 아이콘 | `icon-plan-starter.svg` (48×48) |
| 플랜명 | API `nameKo` / `name` |
| 가격 | API `baseFee` + `/월` — `Intl.NumberFormat` (Trinity 현행 유지) |
| Features | `featuresJson` 파싱 → `parseAndConvertFeatures` |
| CTA | Outline "시작하기" → 온보딩: **선택 상태** (border highlight); Landing: `/onboarding` 링크 |

### 3.2 Pro [FEATURED]

| 속성 | 스펙 |
|------|------|
| variant | `popular` — Y축 -8px lift, gradient border |
| Badge | "가장 인기" Pill — 카드 상단 overlap |
| 아이콘 | `icon-plan-pro.svg` |
| CTA | Solid Gradient Button |
| popular 판별 | API `displayOrder === 1` (Landing 현행) 또는 `isPopular` |

### 3.3 Enterprise [DARK]

| 속성 | 스펙 |
|------|------|
| variant | `enterprise-dark` — Navy/Black 배경, white text |
| 아이콘 | `icon-plan-enterprise.svg` |
| 가격 | "맞춤 견적" (API에 baseFee 없을 때) |
| CTA | White Outline "영업팀 문의" — `mailto:admin@e-trinity.co.kr` 또는 문의 URL |

---

## 4. Bottom 영역 (Landing `#pricing` 하단)

### 4.1 Compare Toggle

- "자세한 비교 보기" — 차트 아이콘 + 화살표
- Phase 3+ — Feature Matrix Accordion (MindGarden SPEC 참고, Trinity 우선순위 P2)

### 4.2 Trust Badges

- 가로 나열: ISO 27001, SOC 2, GDPR, KISA-ISMS
- 에셋: `docs/design/v2/refine/v2/assets/badge-*.svg`
- 모노톤/grayscale, height ~32px

---

## 5. 디자인 토큰

Onboarding SPEC과 동일 `--trinity-v2-*` 레이어 사용.

| 토큰 | 용도 |
|------|------|
| `--trinity-v2-color-primary` | Pro border, Toggle active |
| `--trinity-v2-gradient-cta` | Pro CTA, Toggle active pill |
| `--trinity-v2-color-surface-dark` | Enterprise 카드 배경 |
| `--trinity-v2-color-border-subtle` | Starter border |
| `--trinity-v2-shadow-card-hover` | Card hover lift |

---

## 6. 인터랙션

- **Card Hover**: translateY(-4px), shadow 강화; Pro border glow 증가
- **Toggle** (Landing): pill slide animation 0.2s ease; 가격 연간 환산 표시 (×0.8 또는 API 필드)
- **Step3 Select**: 클릭 시 `formData.planId` + active border + check icon (현행 유지, v2 스타일)

---

## 7. 반응형

| Breakpoint | Cards |
|------------|-------|
| ≥1024px | 3열 Grid |
| 768–1023px | 2+1 wrap (Starter+Pro / Enterprise) |
| <768px | 1열 stack; Pro는 badge+border로만 강조 |

---

## 8. 컴포넌트 분리

| 컴포넌트 | 경로 | Props |
|----------|------|-------|
| `TrinityPricingPlanCard` | `components/pricing/TrinityPricingPlanCard.tsx` | `variant`, `plan`, `selected`, `onSelect` |
| `BillingCycleToggle` | `components/pricing/BillingCycleToggle.tsx` | `cycle`, `onChange` — Landing only |
| `TrustBadges` | `components/pricing/TrustBadges.tsx` | — |
| `PricingCompareToggle` | `components/pricing/PricingCompareToggle.tsx` | `expanded`, `onToggle` — P2 |

`Step3PricingPlan.tsx`는 `TrinityPricingPlanCard` 조립만 담당. `app/page.tsx` pricing 섹션도 동일 카드 사용.

---

## 9. 갭 분석 (현행 vs 본 SPEC)

| 항목 | `Step3PricingPlan` / `PricingCard` 현행 | 목표 |
|------|----------------------------------------|------|
| Card variant | 단일 스타일 + `CARD_POPULAR` | starter / popular / enterprise-dark |
| Enterprise dark | 없음 | Navy dark card |
| Popular badge | `isPopular` / displayOrder | "가장 인기" Pill |
| Trust badges | 없음 | Landing 하단 추가 |
| Billing toggle | 없음 | Landing only |
| 아이콘 | 없음 | SVG plan icons |
| 가격 소스 | API ✅ | 유지 — TBD 정책은 ops 데이터 따름 |
| Compare/FAQ | 없음 | P2~P3 |

상세: `GAP_ANALYSIS_TRINITY.md` §3.2

---

## 9.1 Step3 vs Landing Pricing 차이 요약

| 기능 | Step3 | Landing `#pricing` |
|------|-------|-------------------|
| Hero Eyebrow/H1 | ❌ | ✅ |
| Billing Toggle | ❌ | ✅ |
| Card variants | ✅ | ✅ |
| Trust Badges | ❌ | ✅ |
| CTA 동작 | planId 선택 | `/onboarding` 링크 |
| Compare | ❌ | P2 |

---

## 10. 라우트·API

- Landing: `https://apply.e-trinity.co.kr/#pricing`
- Onboarding Step3: `https://apply.e-trinity.co.kr/onboarding/` (내부 step)
- API: `TRINITY_CONSTANTS.API_ENDPOINTS.PRICING_PLANS`
- 상수 fallback: `TRINITY_CONSTANTS.PRICING_PLANS` (개발/오류 시)

---

## 11. 금지 사항

- 가격·플랜명 JSX 하드코딩 금지 (API/상수만)
- inline style hex 금지 — `--trinity-v2-*` 토큰
- MindGarden `frontend/src/data/pricingPlans.json` **참조/수정 금지**
