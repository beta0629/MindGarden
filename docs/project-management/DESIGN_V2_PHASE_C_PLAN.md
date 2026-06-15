# Design V2 Phase C — Organism + Templates + Pages + Visual Regression Gate 기획서

> **문서 상태**: DRAFT (사용자 결정 게이트 5종 대기 중)  
> **담당**: core-planner (오케스트레이터, 직접 구현 X)  
> **작업 워크트리**: `/Users/mind/mindGarden-design-v2-phase-c-plan`  
> **브랜치**: `docs/design-v2-phase-c-plan`  
> **작성 일자**: 2026-06-15  
> **선행 PR**:
> - PR #347 — Phase 0 위임 가이드 (`DESIGN_V2_DELEGATION_GUIDE.md`)
> - PR #349 — Phase A1 Visual Spec (`docs/design/v2/DESIGN_V2_VISUAL_SPEC.md`)
> - PR #350 — Phase A3 토큰 SSOT (`frontend/src/styles/tokens/design-v2-tokens.css`)
> - PR #351 — Phase A2 Public & Onboarding Visual Spec (4 user decision gates)
> - PR #356 — Phase B Atoms + Molecules + Skeleton Pages

---

## 목차

1. [§1. 개요·목표](#1-개요목표)
2. [§2. 선행 결과 정합 (Phase A1/A2/A3/B)](#2-선행-결과-정합)
3. [§3. Phase C 범위·산출물](#3-phase-c-범위산출물)
4. [§4. 사용자 결정 게이트 (5종) — **필독**](#4-사용자-결정-게이트-5종)
5. [§5. 분배 실행 표 (Phase C-1 ~ C-4)](#5-분배-실행-표)
6. [§6. 일정·병렬도](#6-일정병렬도)
7. [§7. 리스크·롤백](#7-리스크롤백)
8. [§8. 완료 기준 (Phase C Done Definition)](#8-완료-기준)
9. [§9. 본 사이클 직접 위임 vs 보류](#9-본-사이클-직접-위임-vs-보류)
10. [§10. 참조 문서·스킬](#10-참조-문서스킬)

---

## §1. 개요·목표

### 1.1 목표

Phase A1/A2/A3/B 결과를 바탕으로, **공개(Public) + 온보딩 영역의 Organism → Templates → Pages를 완성**하고, **WCAG 2.1 AA + 다크 모드 + 모바일 반응형이 자동 검증되는 Visual Regression Gate**를 구축한다.

### 1.2 사용자 요구

- **사용자 결정 (2026-06-15 16:40 KST)**: `design_c` — Phase C 바로 진입.
- **퀄리티 원칙**: "MVP 의미 없고 만족할 만한 수준" — Phase B 스켈레톤을 실 화면으로 완전 전환.
- **모델 정책 (`.cursor/rules/mindgarden-subagents.mdc`)**: 디자인 변경 배치는 **`gemini-3.1-pro`** 권장.
- **격리 워크트리 운영**: 메인 점유 금지 — 본 기획서·후속 모든 위임은 별도 워크트리에서 진행.

### 1.3 비충돌 영역

- **백엔드(cutover c7040379)** 영역과 비충돌 — Phase C는 **프론트엔드 공개/온보딩 영역**에 한정.
- **운영 진행 중 작업(PII 회전, secret 회전 등)**과 비충돌 — Phase C는 디자인·UI만 변경, 비즈니스 로직 0.

---

## §2. 선행 결과 정합

### 2.1 Phase A1 (PR #349) — Visual Spec

- **15 Atom** 시스템 (MGButton, MGInput, MGBadge, MGCard 등) 정의.
- **Calm Forest 팔레트** 채택 — Primary/Secondary/Neutral/Semantic/Surface 5분류.
- **타이포 + 그리드 + 다크 모드 + 모바일** 정책 확정.

### 2.2 Phase A2 (PR #351) — Public & Onboarding 4 결정 게이트 결과

| 결정 게이트 | 사용자 채택 결과 |
|------------|----------------|
| **G1. `/landing` 라우트 처리** | **옵션 C (흡수)** — `/landing` 콘텐츠를 `/` 메인 랜딩 하위 섹션으로 통합 후 삭제 |
| **G2. Tenant 공개 신청 폼** | **옵션 C (하이브리드)** — 공개 페이지 6단계 Stepper 신청 → 어드민 PENDING 승인 |
| **G3. AdminCommonLayout 오용 교정** | **옵션 B (PublicLayout 도입)** — Header + Footer만 존재하는 깔끔한 `PublicLayout` 신규 |
| **G4. Footer 항목 구성** | **옵션 A 채택** — 회사 정보 + 도움말 + 법적 고지 + 소셜 4섹션 |

### 2.3 Phase A3 (PR #350) — Token SSOT

- `frontend/src/styles/tokens/design-v2-tokens.css` (~161 토큰)
- 라이트/다크/forced-colors 3모드 포함, `--mg-v2-*` prefix.

### 2.4 Phase B (PR #356) — Atoms + Molecules + Skeleton Pages

이미 메인에 반영된 산출물 (`origin/main b0e06aeae` 시점):

| 계층 | 파일 |
|------|------|
| Layout | `frontend/src/components/public/layouts/PublicLayout.jsx` |
| Atom | `frontend/src/components/public/atoms/PublicHeader.jsx` |
| Atom | `frontend/src/components/public/atoms/PublicFooter.jsx` |
| Molecule | `frontend/src/components/public/molecules/OnboardingStepper.jsx` |
| Molecule | `frontend/src/components/public/molecules/PricingCard.jsx` |
| Page Skeleton | `frontend/src/pages/public/TenantOnboardingPage.jsx` |
| Page Skeleton | `frontend/src/pages/public/PricingPage.jsx` |
| Test | `frontend/src/components/public/__tests__/*.test.jsx` (5종) |

**Phase B 미진 영역 (Phase C에서 해결)**:
- Step Content는 모두 스켈레톤(`mg-v2-onboarding-page__skeleton-block`) — 실 입력 폼 없음.
- FAQ는 placeholder (`faq-coming-soon`) — 실 내용 없음.
- Landing 페이지 (`/`) **자체가 없음** — Phase C에서 신규 생성.
- Visual Regression CI 없음 (`.github/workflows/visual-regression.yml` 부재).
- React Router 라우트 정합 미확인 — `/onboarding`, `/pricing`, `/`가 실제로 PublicLayout으로 흐르는지 검증 필요.

---

## §3. Phase C 범위·산출물

### 3.1 Phase C-1: 시각 스펙 강화 (디자인)

**담당**: `core-designer` (model = **`gemini-3.1-pro`** — 사용자 결정 게이트 ①)

**대상**:

| 영역 | 산출물 |
|------|--------|
| Onboarding Step 1~6 실 화면 | Step별 입력 양식·검증 메시지·진행 UI 시안 |
| Step 1 | 기본 정보 (테넌트명·도메인·연락처) |
| Step 2 | 비즈니스 정보 (업종·세부 카테고리) |
| Step 3 | 결제 정보 (요금제·결제 수단) — **사용자 결정 게이트 ③ 가격 확정 후** |
| Step 4 | 약관 동의 (개인정보 처리방침·이용약관) |
| Step 5 | 관리자 계정 생성 |
| Step 6 | 완료 (PENDING 안내 + 대시보드 진입) |
| Pricing 본격 | Basic/Pro/Enterprise 본 가격 + **기능 비교 표** + **FAQ 8문항** |
| Landing | Hero + Features + Testimonials + CTA 4섹션 |
| **다크 모드 토글** | 위치/UX — **사용자 결정 게이트 ②** |
| **모바일 (414×896)** | 반응형 시안 동시 작성 |
| 마이크로 인터랙션 | 호버/포커스/진행 애니메이션 명세 |
| WCAG 2.1 AA | 컬러 대비 + 키보드 nav 검증 결과 포함 |

**산출 위치**: `docs/design/v2/DESIGN_V2_PHASE_C1_VISUAL_SPEC.md` (Phase A2 와 동일 디렉토리, Phase C1 명시)

### 3.2 Phase C-2: Organism 구현 (코더)

**담당**: `core-coder` (model = `claude-4.6-opus-high-thinking` — 복잡 상호작용 정확성, Delegation Guide §2.1 표 준수)

**대상 컴포넌트** (`frontend/src/components/public/organisms/`):

| Organism | 사용처 | 비고 |
|----------|--------|------|
| `OnboardingStepForm` | Onboarding Step 1~5 | Step별 입력 양식 SSOT |
| `OnboardingNavigation` | Onboarding 하단 | 이전·다음·저장 |
| `PricingFeatureMatrix` | PricingPage | Basic/Pro/Enterprise 기능 비교 표 |
| `LandingHero` | LandingPage Hero | 1280px PC + 414px Mobile |
| `LandingFeatures` | LandingPage Features | 기능 카드 그리드 |
| `LandingTestimonials` | LandingPage Testimonials | 고객 후기 carousel |
| `LandingCTA` | LandingPage CTA | 전환 유도 섹션 |
| `PublicNotification` | PublicLayout 슬롯 | 안내 토스트 (성공/경고/에러) |
| `PublicErrorBoundary` | PublicLayout 슬롯 | 퍼블릭 오류 화면 |

**절대 규칙** (Delegation Guide §5.5 준수):
- CSS override 0줄
- 인라인 스타일 0 (동적 값 예외)
- `var(--mg-v2-*)` 토큰만 사용 (하드코딩 색상/사이즈 0)
- 다크 모드 자동 지원 (토큰 사용으로 달성)
- PropTypes 또는 TypeScript interface 정의

**완료 기준**:
- 각 Organism 별 단위 테스트 (`__tests__/*.test.jsx`) — 렌더링·a11y·키보드 nav.
- Storybook 또는 동등한 데모 페이지에서 모든 variant 시각 확인.

### 3.3 Phase C-3: Templates + Pages 구현 (코더)

**담당**: `core-coder` (model = `claude-4.6-sonnet-medium-thinking` — Delegation Guide §2.1 페이지 마이그 합리 비용)

**대상**:

| Template / Page | 위치 |
|----------------|------|
| `TenantOnboardingPage` 실 화면 전환 | `frontend/src/pages/public/TenantOnboardingPage.jsx` (Phase B 스켈레톤 → 실) |
| `PricingPage` 실 화면 전환 | `frontend/src/pages/public/PricingPage.jsx` (Phase B 스켈레톤 → 실) |
| `LandingPage` 신규 (`/` 라우트) | `frontend/src/pages/public/LandingPage.jsx` (신규) |
| 라우터 정합 | `frontend/src/App.js` — `/`·`/onboarding`·`/pricing` PublicLayout 흐름 |
| `/landing` → `/` 흡수 | Phase A2 G1 결정 반영 (라우트 삭제 + redirect) |

**완료 기준**:
- 모든 페이지에서 토큰 사용률 100%, override CSS 0줄.
- 라이트/다크 모드 전환 정상.
- 1440×900 / 414×896 양쪽 정상.
- 기능 동일 (Phase B 단위 테스트 회귀 0).

### 3.4 Phase C-4: Visual Regression Gate (테스터)

**담당**: `core-tester` (model = `gemini-3.1-pro` — Delegation Guide §2.1 시각 회귀 멀티모달 강점)

**대상**:

| 항목 | 내용 |
|------|------|
| 시각 회귀 도구 | **사용자 결정 게이트 ⑤** (Playwright vs Chromatic) |
| 라이트/다크 모드 스크린샷 | `/`·`/onboarding`·`/onboarding/step-1~6`·`/pricing` |
| 데스크탑 (1440×900) | 위 페이지 전체 |
| 모바일 (414×896) | 위 페이지 전체 |
| WCAG 2.1 AA 자동 검증 | `axe-core` 통합 (위반 0건) |
| Lighthouse 접근성 | ≥ 90 |
| CI 게이트 | `.github/workflows/visual-regression.yml` 신규 |

**완료 기준**:
- baseline 스크린샷 확정 + diff 0
- WCAG violation 0
- CI에서 `visual-regression` job이 PR 머지 차단 게이트로 동작

### 3.5 Phase C-5: 사용자 검수 게이트

- **Phase C-1 시안 검수**: Onboarding Step 1~6 / Pricing / Landing 시안 채택 여부.
- **Phase C-2/C-3 결과 검증**: 브라우저 직접 확인 (라이트/다크/모바일).
- **Phase C-4 회귀 게이트 PASS**: 전 페이지 diff 0 + axe 0 violation.

---

## §4. 사용자 결정 게이트 (5종)

> 본 기획서가 완성된 시점부터 분배 실행까지 **사용자 결정이 필수**인 항목.  
> 결정 없이 진행 시 디자인 드리프트·재작업 위험.

### G① — Phase C-1 디자인 모델 선택

**문항**: Phase C-1 디자인 시안 작성용 `core-designer` 모델은?
- (a) **`gemini-3.1-pro`** — `.cursor/rules/mindgarden-subagents.mdc` 권장안, Phase A1/A2와 동일 (정합성 유지)
- (b) `claude-4.6-opus-high-thinking` — 코드 일관성 우선 (시각 일관성 약간 양보)
- (c) 그 외 (사용자 지정)

**권장**: **(a)** — Phase A2 패턴 유지 + 멀티모달 시각 일관성.

---

### G② — 다크 모드 토글 위치

**문항**: 다크 모드 토글 UI 위치는?
- (a) **헤더(`PublicHeader`)** 우측 — 즉시 접근, 모바일에서도 가시성 높음
- (b) 푸터(`PublicFooter`) 우측 — 헤더가 가벼워짐, 발견성 낮음
- (c) 별도 설정 페이지(`/settings/appearance`) — 가장 깔끔하나 발견성 가장 낮음

**권장**: **(a)** — 공개 페이지 특성상 즉시 접근성 우선.

**파생 결정**: 토글 상태 저장소 (localStorage vs cookie vs OS 자동) — 권장 **OS 자동 + 명시 override (`localStorage`)**.

---

### G③ — Pricing 페이지 가격 확정 (운영팀 영역)

**문항**: Basic/Pro/Enterprise 실 가격은? (Phase B 스켈레톤은 `49,000` / `149,000` / Contact Sales placeholder)
- 운영팀(과금/세일즈) 확정 필요.
- **공개 페이지에 노출되는 실제 가격**이므로 디자인이 아닌 비즈니스 결정.

**제출 형식**: 
```
Basic: ₩{value}/월 (포함 기능: ...)
Pro: ₩{value}/월 (포함 기능: ...)
Enterprise: 견적 / 또는 ₩{value}+/월 (포함 기능: ...)
연간 결제 할인율: {value}% (있다면)
```

**권장**: 운영팀(또는 사용자)이 결정 → Phase C-1 시안 작성 전 확정.

---

### G④ — Landing 페이지 콘텐츠 (Hero·Features·Testimonials)

**문항**: Landing 페이지에 들어갈 실 콘텐츠는?

**Hero**:
- 메인 카피 (1줄 + 부제목 1줄)
- 보조 이미지/일러스트 (스톡 vs 자체 제작 vs 추후 결정)

**Features** (3~6개 카드):
- 기능 키워드 + 짧은 설명

**Testimonials**:
- 실제 도입처 후기 노출 여부 (개인정보 동의 필요)
- 또는 익명 후기 placeholder만 노출

**제출 형식**:
```
Hero 메인: "..."
Hero 부제: "..."
Hero 이미지: [URL/경로 / 또는 "디자이너 자유 선택"]
Features: 
  - 키워드 1: 설명
  - 키워드 2: 설명
  ...
Testimonials:
  - 실제 사용 vs placeholder
  - 노출할 후기 (있다면): "...", 출처: "..."
```

**권장**: 콘텐츠 미확정 시 Phase C-1은 **시각/레이아웃만 확정**하고 Phase C-3 페이지 구현 단계에서 **placeholder 노출 → 운영팀 콘텐츠 입력 슬롯**으로 분리.

---

### G⑤ — Visual Regression 도구

**문항**: Phase C-4 시각 회귀 도구는?
- (a) **Playwright** — 이미 `tests/e2e/playwright.config.ts` 존재, 추가 의존성 최소, OSS 무료
- (b) Chromatic — Storybook 통합 우수, UI 검토 워크플로 좋음, 유료 (commercial)
- (c) 둘 다 (Playwright = 스크린샷, Chromatic = 컴포넌트 단위)

**권장**: **(a) Playwright** — 기존 인프라 재사용 + 무료 + CI 통합 단순. axe-core는 `@axe-core/playwright` 패키지로 통합.

---

## §5. 분배 실행 표

> **호출 규칙**: 본 기획서는 **분배만** 정의. 실제 호출은 **사용자 결정 게이트 통과 후** 본 planner가 다음 사이클에서 수행.  
> **의존성**: C-1 시안 채택 → C-2 Organism 구현 → C-3 Pages 구현 → C-4 회귀 게이트. C-2 내부 / C-3 내부는 그룹별 병렬 가능.

| Phase | 담당 서브에이전트 | 모델 | 병렬 여부 | 전달 프롬프트 요약 | 적용 스킬·문서 |
|-------|------------------|-----|----------|------------------|---------------|
| **C-1 (디자인)** | `core-designer` | **`gemini-3.1-pro`** (G① 결정) | C-1 내부: Onboarding/Pricing/Landing 3분할 병렬 가능 (단, 토큰·팔레트 정합 위해 1차 페이지 1건 채택 후 나머지 진행 권장) | "Onboarding Step 1~6 + Pricing 본격 + Landing 시안 작성. 라이트/다크/414×896 모바일 동시. WCAG 2.1 AA 준수. 산출 `docs/design/v2/DESIGN_V2_PHASE_C1_VISUAL_SPEC.md`." | `/core-solution-design-handoff`, `/core-solution-design-system-css`, `/core-solution-planning §0`, Phase A1/A2 SPEC + A3 토큰 |
| **C-2 (Organism)** | `core-coder` | `claude-4.6-opus-high-thinking` | Organism 9종 → 의미 단위 3그룹 (Onboarding 2 / Pricing 1 / Landing 4 / Public 2) 병렬 가능 | "Phase C-1 시안 기준으로 `frontend/src/components/public/organisms/` 하위 9 Organism 구현. 토큰만 사용·CSS override 0. 단위 테스트 동반." | `/core-solution-atomic-design`, `/core-solution-frontend`, `/core-solution-common-modules`, Phase A3 토큰, Phase B 컴포넌트 |
| **C-3 (Templates + Pages)** | `core-coder` | `claude-4.6-sonnet-medium-thinking` | TenantOnboardingPage / PricingPage / LandingPage / Router 4개 작업 — 페이지 단위 병렬 가능 (단, App.js 라우터는 마지막 합류) | "Phase B 스켈레톤 → 실 화면 전환. LandingPage 신규. `/landing` → `/` 흡수 redirect. 토큰 100%·override 0." | `/core-solution-frontend`, `/core-solution-atomic-design`, Phase A2 G1/G3 결정 |
| **C-4 (Visual Regression)** | `core-tester` | `gemini-3.1-pro` | C-3 완료 후 단일 진행 (CI 게이트는 PR 머지 차단 단일 워크플로) | "Playwright (G⑤ 결정) 기반 시각 회귀. 라이트/다크 × 1440·414 × 5페이지. axe-core a11y. CI `.github/workflows/visual-regression.yml`." | `/core-solution-testing`, `/core-solution-deployment` (CI 게이트) |
| **C-5 (사용자 검수)** | — (사용자 직접) | — | 각 단계 종료 시점 | 시안 → 구현 → 회귀 게이트 3단계 검수 | — |
| **(보조) 문서 정리** | `generalPurpose` | default | C-1 시안 채택 직후 | "DESIGN_V2_PHASE_C1_VISUAL_SPEC.md 인덱스 등재 + `docs/project-management/DESIGN_V2_DELEGATION_GUIDE.md §3.3` Phase C 진행 상태 갱신." | `/core-solution-documentation` |

### 5.1 위임 프롬프트 초안 — Phase C-1 (디자인)

```
## 임무: 디자인 v2 Phase C-1 — Public/Onboarding/Landing 실 시안

**모델**: gemini-3.1-pro (사용자 결정 게이트 ① 채택안)
**참조 스킬**: /core-solution-design-handoff, /core-solution-design-system-css, /core-solution-planning §0
**참조 문서**:
  - docs/project-management/DESIGN_V2_DELEGATION_GUIDE.md §3.1
  - docs/design/v2/DESIGN_V2_VISUAL_SPEC.md (Phase A1)
  - docs/design/v2/DESIGN_V2_PUBLIC_ONBOARDING_SPEC.md (Phase A2 — G1~G4 결정 결과 적용)
  - frontend/src/styles/tokens/design-v2-tokens.css (Phase A3 토큰 SSOT — 변경 금지)
  - frontend/src/components/public/atoms/PublicHeader.jsx 등 (Phase B 산출물)
**작업 워크트리**: 신규 (예: /Users/mind/mindGarden-design-v2-phase-c1)

### 사용성 요구
- Onboarding: 6단계 진행 명확성, 각 Step 1화면 1결정, 모바일 키보드 친화.
- Pricing: 3 plan 비교 가능성, 차이 명확, Enterprise 견적 흐름.
- Landing: 첫 화면 5초 안에 가치 전달, 다음 액션(Onboarding) 명확.

### 정보 노출 원칙
- Pricing 가격: 사용자 결정 게이트 ③ 결과 반영. 미정 시 placeholder (`TBD — 운영팀 확정 대기`) 노출.
- Landing 콘텐츠: 사용자 결정 게이트 ④ 결과 반영. 미정 시 카피·이미지 placeholder + 운영팀 입력 슬롯 설계.

### 레이아웃
- Desktop 1440×900 + Mobile 414×896 동시 작성.
- 다크 모드 토글 위치: 사용자 결정 게이트 ② 결과 반영 (기본 권장 — 헤더 우측).

### 산출물
파일: docs/design/v2/DESIGN_V2_PHASE_C1_VISUAL_SPEC.md
- §A. Onboarding Step 1~6 (각 Step별 와이어 + 토큰 매핑)
- §B. Pricing 본격 (3 plan + 비교 표 + FAQ 8문항)
- §C. Landing (Hero + Features + Testimonials + CTA)
- §D. 다크 모드 토글 UI·동작
- §E. 모바일 414×896 대응
- §F. 마이크로 인터랙션 (호버/포커스/진행)
- §G. WCAG 2.1 AA 컬러 대비 + 키보드 nav 검증 결과
- §H. 사용자 결정 게이트 결과 정리 (G①~G⑤)

### 절대 규칙
- Phase A3 토큰 SSOT 변경 금지. 새 토큰 필요 시 § 부록에 제안 → 사용자 결정 후 별도 PR.
- 코드 직접 수정 금지 (디자이너 역할).
- 마크업·코드는 core-coder(C-2)에 전달할 spec 형태로만 작성.

### 완료 기준
- §A~§H 모두 작성
- 모든 컬러·여백·타이포 `var(--mg-v2-*)` 토큰명 매핑
- 라이트/다크/모바일 3 변형 페이지별 노출
- WCAG 2.1 AA 위반 0 (대비 ≥ 4.5:1 본문, ≥ 3:1 큰 텍스트)
```

### 5.2 위임 프롬프트 초안 — Phase C-2 (Organism)

```
## 임무: 디자인 v2 Phase C-2 — Public Organism 9종 구현

**모델**: claude-4.6-opus-high-thinking
**참조 스킬**: /core-solution-atomic-design, /core-solution-frontend, /core-solution-common-modules, /core-solution-encapsulation-modularization
**참조 문서**:
  - docs/project-management/DESIGN_V2_DELEGATION_GUIDE.md §3.2 B3 (Organism 표준)
  - docs/design/v2/DESIGN_V2_PHASE_C1_VISUAL_SPEC.md (C-1 산출물 — 사용자 검수 통과본)
  - frontend/src/styles/tokens/design-v2-tokens.css (토큰 SSOT — 변경 금지)
  - frontend/src/components/public/atoms/*, molecules/* (Phase B 산출물 — 재사용)
**작업 워크트리**: 신규 (예: /Users/mind/mindGarden-design-v2-phase-c2)

### 대상 Organism (frontend/src/components/public/organisms/)
1. OnboardingStepForm — Onboarding Step 1~5 입력 양식 SSOT
2. OnboardingNavigation — 이전·다음·저장 버튼 영역
3. PricingFeatureMatrix — Basic/Pro/Enterprise 기능 비교 표
4. LandingHero — Hero 섹션 (Desktop 1440 + Mobile 414)
5. LandingFeatures — 기능 카드 그리드
6. LandingTestimonials — 고객 후기 carousel
7. LandingCTA — 전환 유도 섹션
8. PublicNotification — PublicLayout 슬롯 안내 토스트
9. PublicErrorBoundary — PublicLayout 슬롯 오류 화면

### 절대 규칙
- var(--mg-v2-*) 토큰만 사용 (하드코딩 색상/사이즈 0)
- CSS override 0줄
- 인라인 스타일 0 (애니메이션 동적 값 예외)
- !important 0
- 다크 모드 자동 지원 (토큰 사용으로 달성)
- PropTypes 또는 TypeScript interface 정의

### 캡슐화 원칙 (/core-solution-encapsulation-modularization)
- Atom·Molecule 조합으로만 Organism 구성 — 신규 Atom 생성 시 Phase B 보강 PR 분리
- 각 Organism은 단일 책임, props로 데이터 주입

### 완료 기준
- 9 Organism 모두 구현 + 단위 테스트 (__tests__/*.test.jsx)
- 각 a11y 검증 (역할 attr·키보드 nav)
- Storybook 또는 데모 페이지에서 모든 variant 시각 확인
- override CSS 0, 토큰 사용률 100%
- Phase B 단위 테스트 회귀 0

### PR 분리
- Onboarding 2 / Pricing 1 / Landing 4 / Public 2 — 가능하면 그룹별 별도 PR
- 그룹 간 의존성 없으면 병렬 가능
```

### 5.3 위임 프롬프트 초안 — Phase C-3 (Templates + Pages)

```
## 임무: 디자인 v2 Phase C-3 — Public Pages 실 화면 전환

**모델**: claude-4.6-sonnet-medium-thinking
**참조 스킬**: /core-solution-frontend, /core-solution-atomic-design
**참조 문서**:
  - docs/project-management/DESIGN_V2_DELEGATION_GUIDE.md §3.3 (Phase C)
  - docs/design/v2/DESIGN_V2_PHASE_C1_VISUAL_SPEC.md
  - docs/design/v2/DESIGN_V2_PUBLIC_ONBOARDING_SPEC.md (G1/G3 결정 — `/landing` 흡수, PublicLayout)
  - frontend/src/components/public/organisms/* (C-2 산출물)
**작업 워크트리**: 신규 (예: /Users/mind/mindGarden-design-v2-phase-c3)

### 대상
1. frontend/src/pages/public/TenantOnboardingPage.jsx — Phase B 스켈레톤 → 실 화면 (Step 1~6 OnboardingStepForm 연결, OnboardingNavigation 연결)
2. frontend/src/pages/public/PricingPage.jsx — Phase B 스켈레톤 → 실 화면 (PricingFeatureMatrix + FAQ 실 내용)
3. frontend/src/pages/public/LandingPage.jsx — 신규 (LandingHero + LandingFeatures + LandingTestimonials + LandingCTA)
4. frontend/src/App.js — 라우트 정합:
   - `/` → LandingPage (PublicLayout)
   - `/onboarding` → TenantOnboardingPage (PublicLayout)
   - `/pricing` → PricingPage (PublicLayout)
   - `/landing` → Redirect `/` (G1 흡수)

### 절대 규칙
- 토큰 100%, override CSS 0
- 비즈니스 로직 변경 금지 (API/DB 호출 0 — 폼 submit 핸들러는 stub 또는 기존 API 재사용)
- Phase B 단위 테스트 회귀 0
- 라이트/다크 모드 양쪽 정상
- 1440×900 / 414×896 양쪽 정상

### 완료 기준
- 3 페이지 모두 토큰 100%·override 0
- 라우트 정합 — `/landing` 흡수 redirect 동작
- 페이지별 단위 테스트 + 통합 테스트 1건 이상
- 사용자 브라우저 직접 검수 PASS

### PR 분리
- 페이지 단위로 3 PR 권장 — Router 정합은 마지막 합류 PR
```

### 5.4 위임 프롬프트 초안 — Phase C-4 (Visual Regression Gate)

```
## 임무: 디자인 v2 Phase C-4 — Visual Regression Gate 구축

**모델**: gemini-3.1-pro (시각 회귀 멀티모달)
**참조 스킬**: /core-solution-testing, /core-solution-deployment
**참조 문서**:
  - docs/project-management/DESIGN_V2_DELEGATION_GUIDE.md §3.4 D1
  - tests/e2e/playwright.config.ts (기존 Playwright 설정)
**작업 워크트리**: 신규 (예: /Users/mind/mindGarden-design-v2-phase-c4)

### 도구 (사용자 결정 게이트 ⑤ 결과 — 기본 권장 Playwright)
- @playwright/test (이미 존재)
- @axe-core/playwright (신규 추가)

### 대상 페이지·시나리오
- `/`, `/onboarding`, `/onboarding/step-1` ~ `/onboarding/step-6`, `/pricing`
- 라이트 모드 + 다크 모드
- Desktop 1440×900 + Mobile 414×896
- 총 9 페이지 × 2 모드 × 2 viewport = 36 baseline 스크린샷

### KPI (전부 통과해야 Phase C 완료)
- baseline 스크린샷 diff 0
- axe-core WCAG 2.1 AA violation 0
- Lighthouse 접근성 점수 ≥ 90 (전 페이지)

### CI 게이트
- `.github/workflows/visual-regression.yml` 신규
- PR 머지 차단 게이트로 등록
- 실패 시 diff 이미지 아티팩트 업로드

### 완료 기준
- 36 baseline 확정
- CI 워크플로 통과
- 실패 시 진단 절차 문서화 (`docs/operations/VISUAL_REGRESSION_RUNBOOK.md`)

### 비고
- Chromatic 채택 시(G⑤ b/c): 별도 spec 필요. 본 프롬프트는 Playwright 기준.
```

---

## §6. 일정·병렬도

### 6.1 예상 소요 (사용자 결정 게이트 통과 후 기준)

| Phase | 예상 기간 | 위임 횟수 | 병렬 |
|-------|---------|----------|------|
| C-1 시안 | 2~3일 | 1~3회 (페이지별 분할 시) | 가능 (단, 1차 페이지 채택 후) |
| C-2 Organism | 3~5일 | 4회 (그룹별) | 그룹 간 병렬 (Onboarding/Pricing/Landing/Public) |
| C-3 Pages | 2~3일 | 3~4회 (페이지 + Router) | 페이지 간 병렬, Router 합류 |
| C-4 회귀 게이트 | 2~3일 | 1~2회 | 단일 |
| C-5 검수 | 각 단계 종료 시 | — | — |
| **합계** | **9~14일** (사용자 결정 게이트 통과 시점부터) | **9~13회** | — |

### 6.2 타임라인

```
[사용자 결정 게이트 G①~G⑤ 통과]
        │
        ▼
Day 1~3: Phase C-1 시안 (gemini-3.1-pro) — Onboarding/Pricing/Landing 병렬
        │
        ▼ [사용자 검수 게이트 C-5a]
Day 4~8: Phase C-2 Organism (opus) — 4그룹 병렬
        │
        ▼
Day 9~11: Phase C-3 Pages (sonnet) — 페이지 병렬 + Router
        │
        ▼ [사용자 검수 게이트 C-5b]
Day 12~14: Phase C-4 회귀 게이트 (gemini) — baseline + CI
        │
        ▼ [사용자 검수 게이트 C-5c]
Phase C 완료
```

---

## §7. 리스크·롤백

### 7.1 리스크 목록

| 리스크 | 심각도 | 완화 |
|--------|-------|------|
| C-1 시안 미채택으로 C-2 재작업 | HIGH | 사용자 검수 게이트 C-5a 엄격 (시안 채택 없이 C-2 진입 금지) |
| Pricing 가격 미확정으로 노출 placeholder 잔존 | MEDIUM | G③ 운영팀 확정 → Phase C-3 직전 반영. 미확정 시 `TBD` 명시 + 별도 hotfix PR |
| Landing 콘텐츠 미확정으로 placeholder 잔존 | MEDIUM | G④ 미확정 시 디자이너 자유 카피 + 운영팀 입력 슬롯 분리 (Phase C-3 후 콘텐츠 보강 PR) |
| Visual Regression 도구 학습 비용 | MEDIUM | G⑤ Playwright (기존 인프라 재사용) 권장 |
| 다크 모드 토큰 누락 | HIGH | Phase A3 토큰 변경 없이 C-1에서 토큰 부족 시 부록 제안 → 사용자 결정 → 별도 PR |
| 백엔드(cutover c7040379) 영역 침범 | HIGH | Phase C는 `frontend/`·`docs/`·`.github/workflows/visual-regression.yml`만 변경. 백엔드 파일 0 |
| 메인 워크트리 점유 | MEDIUM | 모든 Phase 별도 워크트리 필수 |

### 7.2 롤백 전략

| 단계 | 롤백 방법 |
|------|---------|
| C-1 시안 | docs 변경만 — PR revert 즉시 |
| C-2 Organism | 그룹별 PR 분리 — 특정 Organism PR만 revert 가능 |
| C-3 Pages | 페이지별 PR — 특정 페이지 PR만 revert. Router PR은 마지막 합류이므로 revert 영향 최소 |
| C-4 회귀 게이트 | CI 워크플로 disable → baseline 재확정 |

---

## §8. 완료 기준

### 8.1 Phase C Done Definition

- [ ] C-1 시안 작성 완료 (`docs/design/v2/DESIGN_V2_PHASE_C1_VISUAL_SPEC.md` §A~§H)
- [ ] C-1 사용자 검수 PASS
- [ ] C-2 Organism 9종 구현 + 단위 테스트 + override CSS 0
- [ ] C-3 Pages 3종 (Landing 신규 + Onboarding/Pricing 실 화면) + Router 정합
- [ ] C-3 사용자 검수 PASS (라이트/다크/1440·414 전수 확인)
- [ ] C-4 Visual Regression baseline 36건 + CI 게이트 동작 + axe 0 + Lighthouse ≥ 90
- [ ] Phase B 회귀 0 (Phase B 단위 테스트 GREEN 유지)
- [ ] `docs/project-management/DESIGN_V2_DELEGATION_GUIDE.md §3.3` Phase C 완료 표시 갱신

### 8.2 정량 메트릭

| 메트릭 | 목표 |
|--------|------|
| 토큰 사용률 (Phase C 신규 파일) | 100% |
| CSS override 라인 | 0 |
| 인라인 스타일 라인 | 0 (애니메이션 동적 값 예외) |
| 시각 회귀 diff | 0 |
| axe WCAG 2.1 AA violation | 0 |
| Lighthouse 접근성 | ≥ 90 (전 페이지) |
| Phase B 단위 테스트 회귀 | 0 |

---

## §9. 본 사이클 직접 위임 vs 보류

### 9.1 본 사이클 직접 위임 — **없음**

본 planner 사이클에서는 **직접 위임을 수행하지 않는다**. 이유:

- **모든 Phase C 작업이 사용자 결정 게이트에 의존**:
  - C-1 시안 → G① (디자인 모델), G② (다크 토글 위치), G③ (가격), G④ (Landing 콘텐츠)
  - C-4 회귀 게이트 → G⑤ (도구 선택)
- 사용자 결정 없이 진행 시 디자인 드리프트·재작업 발생 위험 (Phase A2에서 4결정 게이트를 사용자가 사전 확정한 패턴과 동일하게 운영).

### 9.2 다음 사이클 분배 진행

사용자 G①~G⑤ 결정 수신 후, 다음 사이클에서 본 planner가:

1. C-1 위임 호출 (`core-designer`, G① 모델로) — **격리 워크트리 신규 생성**.
2. C-1 산출물 검수 후 사용자 검수 게이트 통과 시 C-2 위임 (`core-coder`, opus).
3. C-2 완료 후 C-3 위임 (`core-coder`, sonnet).
4. C-3 사용자 검수 통과 후 C-4 위임 (`core-tester`, gemini, G⑤ 도구).
5. C-4 통과 후 Phase C 완료 보고 + Delegation Guide §3.3 상태 갱신 위임 (`generalPurpose` + `/core-solution-documentation`).

---

## §10. 참조 문서·스킬

### 10.1 표준 문서

| 문서 | 경로 | 용도 |
|------|------|------|
| Phase 0 위임 가이드 | `docs/project-management/DESIGN_V2_DELEGATION_GUIDE.md` | 모델·Phase·위임 양식 SSOT |
| Phase A1 Visual Spec | `docs/design/v2/DESIGN_V2_VISUAL_SPEC.md` | 15 Atom·Calm Forest·타이포·그리드 |
| Phase A2 Public Spec | `docs/design/v2/DESIGN_V2_PUBLIC_ONBOARDING_SPEC.md` | G1~G4 결정 결과 + 페이지 와이어 |
| Phase A3 토큰 SSOT | `frontend/src/styles/tokens/design-v2-tokens.css` | 161 토큰 — **변경 금지** |
| Phase A3 토큰 문서 | `docs/design/v2/DESIGN_V2_TOKEN_SSOT.md` | 토큰 사용법 |
| Phase A 핸드오프 | `docs/design/v2/DESIGN_V2_HANDOFF_TO_CODER.md` | 코더 인계 |
| 서브에이전트 규칙 | `.cursor/rules/mindgarden-subagents.mdc` | 디자인 모델 = gemini 권장 |

### 10.2 스킬

| 스킬 | 적용 시점 |
|------|---------|
| `/core-solution-design-handoff` | C-1 디자인 위임 시 |
| `/core-solution-design-system-css` | C-1 토큰 정합 시 |
| `/core-solution-atomic-design` | C-2/C-3 위임 시 |
| `/core-solution-frontend` | C-2/C-3 위임 시 |
| `/core-solution-common-modules` | C-2 위임 시 (UnifiedModal 등 재사용) |
| `/core-solution-encapsulation-modularization` | 전 Phase |
| `/core-solution-testing` | C-4 위임 시 |
| `/core-solution-deployment` | C-4 CI 게이트 등록 시 |
| `/core-solution-planning §0` | 본 기획서 작성 |

### 10.3 본 기획서 산출물

- 파일: `docs/project-management/DESIGN_V2_PHASE_C_PLAN.md` (본 문서)
- 브랜치: `docs/design-v2-phase-c-plan`
- 워크트리: `/Users/mind/mindGarden-design-v2-phase-c-plan`

---

## 부록 A. 사용자 결정 게이트 요약 카드

| 게이트 | 문항 | 권장안 | 영향 Phase |
|-------|------|-------|----------|
| **G①** | C-1 디자인 모델 | `gemini-3.1-pro` | C-1 |
| **G②** | 다크 모드 토글 위치 | 헤더 우측 + OS 자동 + localStorage override | C-1, C-2 |
| **G③** | Pricing 가격 (Basic/Pro/Enterprise) | 운영팀 결정 필요 | C-1, C-3 |
| **G④** | Landing 콘텐츠 (Hero·Features·Testimonials) | 디자이너 자유 + 운영팀 입력 슬롯 분리 | C-1, C-3 |
| **G⑤** | Visual Regression 도구 | Playwright + axe-core | C-4 |

---

*이 문서는 디자인 v2 Phase C 작업 SSOT입니다. 사용자 결정 게이트 G①~G⑤ 통과 전에 분배 실행 금지.*  
*모든 Phase 위임은 별도 워크트리에서 진행하며, 메인 워크트리 점유 금지.*
