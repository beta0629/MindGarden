# Trinity Design v2 Refine — Orchestration Plan

- **작성일**: 2026-06-17
- **목표**: `frontend-trinity/` Design v2 Refine 전면 재작업 — SPEC 재작성 → 구현 → dev 검증 → prod 배포
- **브랜치 (문서)**: `feat/design-v2-refine-trinity-planning`
- **코드 브랜치 (Phase 2+)**: `feat/design-v2-refine-trinity` (develop 기준 권장)
- **MindGarden CRA PR**: #425/#427/#426 — `mg_decide_after_trinity` (revert/배포 **금지**)

---

## 1. 확정 사항

| 항목 | 값 |
|------|-----|
| 적용 대상 | `frontend-trinity/` only |
| 운영 도메인 | `https://apply.e-trinity.co.kr` |
| Dev 도메인 | `https://apply.dev.e-trinity.co.kr` |
| 온보딩 | `/onboarding/` — **6단계 유지** |
| Pricing | 독립 `/pricing` 없음 — Step3 + Landing `#pricing` |
| Landing | `/` — `app/page.tsx` |
| Mockup 4단계 vs Trinity 6단계 | **6단계 유지**, v2 비주얼만 이식 (→ `GAP_ANALYSIS_TRINITY.md` §2) |

---

## 2. 문서 산출물 (Phase 0 — 본 커밋)

| # | 경로 | 상태 |
|---|------|------|
| 1 | `docs/design/v2/refine/trinity/GAP_ANALYSIS_TRINITY.md` | ✅ |
| 2 | `docs/design/v2/refine/trinity/DESIGN_V2_REFINE_V2_TRINITY_ONBOARDING_SPEC.md` | ✅ |
| 3 | `docs/design/v2/refine/trinity/DESIGN_V2_REFINE_V2_TRINITY_PRICING_SPEC.md` | ✅ |
| 4 | `docs/design/v2/refine/trinity/DESIGN_V2_REFINE_V2_TRINITY_LANDING_SPEC.md` | ✅ |
| 5 | `docs/design/v2/refine/trinity/TRINITY_DESIGN_V2_ORCHESTRATION.md` | ✅ (본 문서) |

---

## 3. Phase 목록

### Phase 0 — 기획·SPEC (현재)

- **담당**: core-planner
- **산출**: 5개 문서 + 브랜치 push
- **완료 조건**: 사용자 SPEC 검수 게이트 진입

### Phase 1 — 디자인 확정

- **담당**: `core-designer`
- **모델**: **`gemini-3.1-pro`** (디자인 변경 배치 권장)
- **입력**: 4개 SPEC + `GAP_ANALYSIS_TRINITY.md` + mockup PNG 3종
- **산출**: Pencil/B0KlA 또는 Figma 시안, `--trinity-v2-*` 토큰 확정표, 컴포넌트 스펙 보강
- **완료 조건**: Onboarding Split·6-dot·Landing 50:50·Pricing 3 variant 시각 확정

**Phase 1 designer 위임 prompt (1줄 요약)**:
> Trinity frontend-trinity v2 Refine — 6단계 온보딩 40/60 Split·Landing 50:50 Hero·Step3/Landing Pricing 3-variant 시안을 mockup v2 + `docs/design/v2/refine/trinity/*_SPEC.md` 기준으로 `--trinity-v2-*` 토큰과 함께 확정해 주세요.

#### Phase 1 전달 프롬프트 (전문)

```
Full Repository Path: /Users/mind/mindGarden
Role: core-designer
Model: gemini-3.1-pro

Trinity (e-trinity) frontend-trinity Design v2 Refine — Phase 1 디자인 확정.

참조 문서 (필독):
- docs/design/v2/refine/trinity/GAP_ANALYSIS_TRINITY.md
- docs/design/v2/refine/trinity/DESIGN_V2_REFINE_V2_TRINITY_ONBOARDING_SPEC.md
- docs/design/v2/refine/trinity/DESIGN_V2_REFINE_V2_TRINITY_PRICING_SPEC.md
- docs/design/v2/refine/trinity/DESIGN_V2_REFINE_V2_TRINITY_LANDING_SPEC.md

Mockup PNG:
- assets/design-v2-refine-onboarding-target-mockup-v2.png
- assets/design-v2-refine-pricing-target-mockup-v2.png
- assets/design-v2-refine-landing-target-mockup-v2.png

SVG 에셋: docs/design/v2/refine/v2/assets/

핵심 제약:
- 코드베이스는 frontend-trinity/ (Next.js 14) — frontend/ CRA 수정 금지
- 온보딩 6단계 유지 (Mockup 4단계 축소 안 함) — 6-dot Stepper, STEP N OF 6
- Pricing 독립 페이지 없음 — Step3 + Landing #pricing
- CAPTCHA Step6, 이메일 검증·서브도메인 Step1 Trinity 로직 유지 — 레이아웃만 v2

산출물:
1. Onboarding 40/60 Split + 6-dot Stepper 시안 (Desktop/Tablet/Mobile)
2. Landing Hero 50:50 + Feature 3열 + Pricing 섹션 시안
3. TrinityPricingPlanCard 3 variant (starter/popular/enterprise-dark)
4. --trinity-v2-* CSS 토큰 확정표
5. PublicNavBar 공통 GNB

스킬: /core-solution-design-handoff, /core-solution-design-system-css
코드 작성 금지 — 스펙·시안만.
```

### Phase 2 — 구현 (Coder)

- **담당**: `core-coder`
- **선행**: Phase 1 시안 + **사용자 SPEC 검수 승인**
- **범위**: `frontend-trinity/**` only
- **주요 작업**:
  - `styles/variables.css` — `--trinity-v2-*` 레이어
  - `OnboardingSplitTemplate`, `OnboardingStepper` (6-dot)
  - `PublicNavBar`, `HeroSection`, `FeatureCard`, `TrinityPricingPlanCard`
  - `constants/trinity.ts` — `ONBOARDING_STEPS` 6항목 정합
  - SVG → `public/assets/v2/`
  - `app/onboarding/page.tsx`, `app/page.tsx` 조립
- **금지**: `frontend/**` 수정, MindGarden PR revert

#### Phase 2 전달 프롬프트 (요약)

```
Full Repository Path: /Users/mind/mindGarden
Role: core-coder

Trinity Design v2 Phase 2 — frontend-trinity 구현.

참조: docs/design/v2/refine/trinity/*_SPEC.md + Phase 1 designer 산출물
표준: /core-solution-frontend, /core-solution-code-style, /core-solution-standardization
범위: frontend-trinity/** only

완료 조건:
- 6단계 온보딩 Split 레이아웃 + 제출(CAPTCHA) 동작
- Landing Hero 50:50 + Pricing v2 cards
- npm run build 성공
- frontend/ 미변경
```

**병렬 가능**: 토큰 CSS + 에셋 복사 vs 컴포넌트 신규 (의존성: 토큰 선행 권장)

### Phase 3 — 디자인 QA·2차 구현

- **담당**: `core-designer` (시각 QA) + `core-coder` (픽스)
- **모델 (designer)**: `gemini-3.1-pro`
- **범위**: Trust Badges, Social Proof, Billing Toggle, Compare Toggle (P2), 다크 모드 (P3)
- **완료 조건**: dev URL 시각 diff ≤ 합의 허용 범위

### Phase 4 — 테스트·dev 검증·prod 배포

| 단계 | 담당 | 작업 |
|------|------|------|
| 4a | `core-tester` | `frontend-trinity` 단위·통합·온보딩 E2E (`__tests__/`) |
| 4b | `core-deployer` | `develop` merge → `deploy-trinity-dev.yml` → health URL 확인 |
| 4c | 사용자 | dev 시각·플로우 검수 |
| 4d | `core-deployer` | prod — `deploy-trinity-prod.yml`, `apply.e-trinity.co.kr` |

#### Phase 4a tester 프롬프트 (요약)

```
대상: frontend-trinity
시나리오: 온보딩 6단계(3→6 경로), Landing 렌더, API pricing fallback
기준: /core-solution-testing
```

#### Phase 4b deployer 프롬프트 (요약)

```
Workflow: .github/workflows/deploy-trinity-dev.yml
Health: https://apply.dev.e-trinity.co.kr
Paths trigger: frontend-trinity/**
```

### Phase 5 — MindGarden CRA 보류

- **상태**: `mg_decide_after_trinity` — Trinity prod 배포·사용자 검수 **완료 후** 사용자 결정
- **대상**: develop #425/#427/#426 (`frontend/` Design v2)
- **금지**: revert, develop 배포, Trinity 작업과 혼합 PR
- **담당**: 사용자 + core-planner (후속 오케스트레이션)

---

## 4. 분배실행 표

| Phase | subagent_type | 병렬 | 모델 | 의존성 |
|-------|---------------|------|------|--------|
| 0 | core-planner | — | — | — |
| 1 | core-designer | — | **gemini-3.1-pro** | Phase 0 문서 |
| 2 | core-coder | 토큰/에셋 ‖ 컴포넌트 | default | Phase 1 + **사용자 검수** |
| 3 | core-designer + core-coder | QA ‖ 픽스 | designer: gemini-3.1-pro | Phase 2 |
| 4a | core-tester | ‖ 4b | default | Phase 2~3 |
| 4b | core-deployer | ‖ 4a | default | Phase 2 merge |
| 5 | 사용자 결정 | — | — | Phase 4c 완료 |

---

## 5. 사용자 SPEC 검수 게이트 (Phase 0 → 1/2)

검수 시 다음을 확인해 주세요:

| # | 검수 포인트 | 문서 위치 |
|---|-------------|-----------|
| G1 | **6단계 유지** 동의 (Mockup 4단계 미적용) | GAP §2, Onboarding §1 |
| G2 | Step3→6 스킵, Step4 숨김 — 현행 플로우 유지 동의 | GAP §2, Onboarding §1.2 |
| G3 | Pricing 독립 페이지 없음 — Step3+Landing 분할 동의 | Pricing §1 |
| G4 | 카피 톤 — B2B SaaS + 소상공인 Trinity 병행 | Landing §4, Onboarding §2.2 |
| G5 | `--trinity-v2-*` 토큰 신설 (MindGarden `--mg-v2-*`와 분리) | 각 SPEC 토큰 섹션 |
| G6 | 에셋 — `v2/assets/` SVG를 `public/assets/v2/`로 복사 (Phase 2) | Landing §12 |
| G7 | MindGarden #425/#427/#426 미처리 동의 | 본 문서 Phase 5 |
| G8 | PG Step4 추후 활성화 — 현재 숨김 유지 | Onboarding Step 4 |
| G9 | 운영 가격 — API `baseFee` 따름 (TBD placeholder 강제 여부) | Pricing §3 |
| G10 | Social Proof "200+ 기업" — 사실 확인 또는 placeholder 허용 | Landing §4.1 |

**승인 후**: Phase 1 `core-designer` 가동 → 완료 후 Phase 2 `core-coder` 위임.

**수정 요청 시**: 해당 SPEC 문서만 수정 → 재커밋 → 재검수.

---

## 6. 리스크·제약

| 리스크 | 완화 |
|--------|------|
| MindGarden/Trinity 코드베이스 혼동 | 경로 `frontend-trinity/**` only, PR 분리 |
| ONBOARDING_STEPS 5 vs 6 불일치 | Phase 2에서 상수·UI 동시 정합 |
| API pricing 없을 때 UI | `TRINITY_CONSTANTS.PRICING_PLANS` fallback 유지 |
| CAPTCHA·이메일 검증 regression | Phase 4a E2E 필수 |
| deploy develop only for dev | prod는 별도 workflow·승인 |
| gemini-3.1-pro 일시 오류 | designer Task 1회 재시도 |

---

## 7. 참조 문서·스킬

- `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`
- `/core-solution-planning`, `/core-solution-design-handoff`
- `/core-solution-frontend`, `/core-solution-design-system-css`
- `/core-solution-deployment` — `deploy-trinity-*.yml`
- MindGarden 참고 (수정 금지): `docs/design/v2/refine/v2/GAP_ANALYSIS.md`

---

## 8. 다음 액션

1. **사용자**: 본 SPEC 5종 검수 (게이트 G1~G10)
2. **승인 시**: Phase 1 `core-designer` (`gemini-3.1-pro`) 호출
3. **Phase 1 완료 후**: Phase 2 `core-coder` 구현
4. **Trinity prod 배포 후**: Phase 5 MindGarden CRA 결정
