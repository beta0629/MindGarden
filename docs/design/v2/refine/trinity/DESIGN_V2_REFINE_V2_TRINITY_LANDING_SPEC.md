# Trinity Landing UI/UX Spec (Design v2 Refine)

- **작성일**: 2026-06-17
- **브랜드**: Trinity / CoreSolution (e-trinity.co.kr)
- **코드베이스**: `frontend-trinity/` (Next.js 14 App Router)
- **운영 URL**: `https://apply.e-trinity.co.kr/`
- **Mockup**: `assets/design-v2-refine-landing-target-mockup-v2.png`
- **참고**: MindGarden CRA `DESIGN_V2_REFINE_V2_LANDING_SPEC.md` — 디자인 의도만 이식

---

## 1. 개요

Trinity 랜딩은 `app/page.tsx` 단일 페이지. v2 Refine은 **B2B SaaS 멀티테넌트** 비주얼로 전환하되, Trinity **소상공인·CoreSolution ERP** 포지셔닝은 카피에 반영합니다.

### 1.1 Next.js SSOT

```
frontend-trinity/
├── app/page.tsx              # Landing Page (Client)
├── app/layout.tsx
├── components/
│   ├── Header.tsx            → PublicNavBar로 개편
│   ├── Hero.tsx              → Hero 50:50 개편
│   ├── Section.tsx
│   ├── Card.tsx
│   ├── PricingCard.tsx       → TrinityPricingPlanCard 연동
│   └── Footer.tsx
├── styles/components/hero.css, header.css, footer.css, pricing.css
└── constants/trinity.ts      # COMPANY, SERVICES, BRANDING
```

---

## 2. 레이아웃 그리드

- **Max width**: 1920px, content max 1200px
- **Sections 순서**:
  1. `PublicNavBar` (72px)
  2. `Hero` — 50:50
  3. `FeatureGrid` — 3열
  4. `PricingSection` — `#pricing` (→ Pricing SPEC)
  5. `Footer`

기존 `Section id="about"` 회사 소개는 **FeatureGrid 하단** 또는 Footer 직전 **간소 About** 블록으로 축소 (Phase 2 디자이너 확정).

---

## 3. PublicNavBar (`Header.tsx` 개편)

| 영역 | 스펙 |
|------|------|
| 높이 | 64px (Landing) / 72px (Pricing Hero 연속 시 통일 72px 권장) |
| 좌측 | Trinity Wordmark + `BrandSymbol` |
| 중앙 | 제품, 가격(`#pricing`), 고객사례(placeholder `#`), 문서(placeholder) |
| 우측 | Ghost "로그인" + Primary "무료로 시작" → `/onboarding` |
| 반응형 | Mobile: 햄버거 + drawer |

Onboarding 페이지와 **동일 NavBar** 공유 (`components/PublicNavBar.tsx`).

---

## 4. Hero — 50:50 Split

### 4.1 좌측 50% (텍스트 & CTA)

| 요소 | 스펙 |
|------|------|
| Eyebrow Chip | "Multi-Tenant SaaS Platform" — pill, gradient border, pulse optional |
| H1 Line 1 | "여러 테넌트, 하나의 플랫폼." — 64px/800 (laptop 52px, mobile 40px) |
| H1 Line 2 | "운영을 단순하게." — gradient text `#3B82F6 → #8B5CF6` |
| Sub-H1 | CoreSolution B2B SaaS 설명 18px — Trinity 소상공인 ERP 톤 병행 가능 |
| Primary CTA | "무료로 시작" → `/onboarding` |
| Secondary CTA | "데모 보기 →" Ghost — `#services` 또는 외부 데모 URL (Phase 2 확정) |
| Social Proof | "현재 200+ 기업이 사용 중" + 5 logos |

**Social Proof 로고**: `logo-acme.svg`, `logo-globex.svg`, `logo-initech.svg`, `logo-umbrella.svg`, `logo-cyberdyne.svg` — height 24px, opacity 0.6, grayscale.

### 4.2 우측 50% (Dashboard Preview)

- **권장**: `dashboard-preview.svg`를 `public/assets/v2/` 또는 `next/image`로 삽입
- Container: max-width 800px, aspect ~16:10, radius 16px, shadow `0 20px 40px rgba(0,0,0,0.1)`
- Hover: translateY(-8px) scale(1.01)
- **React 합성 DashboardPreview 금지** (번들·유지보수) — SVG/WebP 정적 에셋 우선

---

## 5. Feature Grid (3 Cards)

기존 `TRINITY_CONSTANTS.SERVICES` (ERP/권한/쉬운사용) → v2 Feature 카피로 **교체 또는 병행**:

| # | Title | Description | Icon |
|---|-------|-------------|------|
| 1 | 멀티 테넌트 격리 | 테넌트별 데이터·권한·도메인 완벽 분리 | `icon-feature-multi-tenant.svg` |
| 2 | 자동화 워크플로우 | 반복 업무 코드 없이 자동화 | `icon-feature-automation.svg` |
| 3 | 실시간 운영 분석 | 비즈니스 지표 한눈에 추적 | `icon-feature-analytics.svg` |

Card: padding 32px, border 1px, radius 16px, hover border primary + icon scale 1.05.

`components/FeatureCard.tsx` 신규 — `Card.tsx`와 역할 분리.

---

## 6. Pricing Section (`#pricing`)

`DESIGN_V2_REFINE_V2_TRINITY_PRICING_SPEC.md` Landing Surface 전체 적용:
- Pricing Hero (Eyebrow + H1 + Billing Toggle)
- 3 TrinityPricingPlanCard
- Trust Badges + Compare Toggle (P2)

현행 `getActivePricingPlans()` + `parseFeatures` 로직 **유지**.

---

## 7. 디자인 토큰

`--trinity-v2-*` (Onboarding SPEC §4와 동일) + Landing 전용:

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--trinity-v2-color-background` | `#FAF9F7` 또는 `#FFFFFF` | 페이지 배경 |
| `--trinity-v2-color-surface` | `#F5F3EF` | Feature card |
| `--trinity-v2-gradient-hero-title` | `#3B82F6 → #8B5CF6` | H1 line 2 |
| `--trinity-v2-color-text-main` | `#2C2C2C` | 본문 |

기존 `--color-primary: #007aff` → v2 primary로 **점진 교체**.

---

## 8. 반응형

| Breakpoint | Hero | Features |
|------------|------|----------|
| ≥1280px | 50:50 | 3열 |
| 1024–1279px | 45:55, H1 52px | 3열 |
| 768–1023px | Stack (text top, preview bottom) | 2열 + 1 full |
| <768px | Stack, preview 축소 | 1열 |

---

## 9. 컴포넌트 분리

| 컴포넌트 | 경로 |
|----------|------|
| `PublicNavBar` | `components/PublicNavBar.tsx` |
| `HeroEyebrowChip` | `components/landing/HeroEyebrowChip.tsx` |
| `HeroSection` | `components/landing/HeroSection.tsx` (기존 Hero 대체) |
| `DashboardPreviewImage` | `components/landing/DashboardPreviewImage.tsx` |
| `SocialProofLogos` | `components/landing/SocialProofLogos.tsx` |
| `FeatureCard` | `components/landing/FeatureCard.tsx` |
| `PricingSection` | `components/landing/PricingSection.tsx` |

`app/page.tsx`는 섹션 조립만 담당.

---

## 10. 갭 분석 (현행 vs 본 SPEC)

| 항목 | `Hero.tsx` / `page.tsx` 현행 | 목표 |
|------|------------------------------|------|
| Hero 레이아웃 | 중앙 정렬 단일 컬럼 | 50:50 Split |
| H1 | "소상공인 통합 솔루션" | 멀티테넌트 2줄 + gradient |
| Dashboard preview | 없음 | SVG 에셋 |
| Social proof | 없음 | 로고 row |
| Features | 이모지 Card | SVG icon FeatureCard |
| NavBar | 단순 Trinity Header | PublicNavBar v2 |
| About 섹션 | 별도 Section | 축소/이동 |
| 토큰 | iOS Blue `#007aff` | v2 Blue `#3B82F6` |

상세: `GAP_ANALYSIS_TRINITY.md` §3.1

---

## 11. SEO·메타 (`app/layout.tsx`)

- title: Trinity - CoreSolution
- description: `TRINITY_CONSTANTS.BRANDING.CORESOLUTION_DESCRIPTION`
- Phase 2: Open Graph image — `dashboard-preview` crop

---

## 12. 에셋 경로 (구현 시)

소스: `docs/design/v2/refine/v2/assets/`  
배포: `frontend-trinity/public/assets/v2/` (Phase 2 coder 복사)

---

## 13. 금지 모티프·제약

- MindGarden garden/zen 모티프 금지
- `frontend/` CRA 파일 수정 금지
- 텍스트: `constants/trinity.ts` 상수화 (i18n은 후순위)
