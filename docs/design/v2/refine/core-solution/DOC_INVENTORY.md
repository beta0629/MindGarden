# Core Solution 디자인 문서 인벤토리

> **Status**: Active  
> **Scope**: `docs/design/v2/` 중 Core Solution **메인 앱 UI** 관련 파일만. Trinity 폴더는 범위 외.

**범위 외 (한 줄)**: [`docs/design/v2/refine/trinity/`](../trinity/README.md) — Trinity 회사·공개 퍼널 전용. CS Phase 3와 분리.

---

## Active — Phase 3 SSOT

| 경로 | Status | Phase | 비고 |
|------|--------|-------|------|
| [core-solution/README.md](./README.md) | Active | 0 | CS 디자인 단일 INDEX |
| [core-solution/DESIGN_PHASE3_MASTER_PLAN.md](./DESIGN_PHASE3_MASTER_PLAN.md) | Active | 0~4 | Phase 로드맵 v1.1·상용화 게이트 |
| [core-solution/DESIGN_CURRENT_STATE_ANALYSIS.md](./DESIGN_CURRENT_STATE_ANALYSIS.md) | Active | 0~1 | 현황 점검·P0/P1/P2·코드 근거 |
| [core-solution/COMMERCIALIZATION_SPEC_ACTIVE.md](./COMMERCIALIZATION_SPEC_ACTIVE.md) | Active (Commercial) | 0~4 | **상용화 Gate·Batch·진행 상태 단일 SSOT** |
| [core-solution/COMMERCIALIZATION_DESIGN_PLAN.md](./COMMERCIALIZATION_DESIGN_PLAN.md) | Active | 0~4 | 상용화 바·의사결정·Phase 1 브리프 |
| [core-solution/VISUAL_DESIGN_PACK_PHASE1.md](./VISUAL_DESIGN_PACK_PHASE1.md) | Active (Step B) | 1~2 | Phase 1 시안 산출물 패키지 — [COMMERCIALIZATION_SPEC_ACTIVE §Step B](./COMMERCIALIZATION_SPEC_ACTIVE.md#진행-상태) 검수 대상; core-designer |
| [core-solution/DESIGN_REVIEW_CHECKLIST.md](./DESIGN_REVIEW_CHECKLIST.md) | Active | 0~4 | 전체 페이지·영역 인벤토리·6 Batch·검수 게이트 SSOT |
| [core-solution/PHASE1_PUBLIC_MAIN_SPEC.md](./PHASE1_PUBLIC_MAIN_SPEC.md) | Active | 1~3 | 공개 메인(Public Main) 상용화 Rebuild 스펙 |
| [core-solution/PHASE1_ADMIN_MAIN_HUB_SPEC.md](./PHASE1_ADMIN_MAIN_HUB_SPEC.md) | Active | 1~3 | 어드민 메인 허브(`/`)·Pipeline·KPI 스펙 |
| [core-solution/KPI_FLIP_CARD_SPEC.md](./KPI_FLIP_CARD_SPEC.md) | Active | 3 | KpiFlipCard 3D flip 구현 핸드오프 |
| [core-solution/DOC_INVENTORY.md](./DOC_INVENTORY.md) | Active | 0 | 본 문서 |
| [refine/SAMPLE_PAGES_POLICY.md](../SAMPLE_PAGES_POLICY.md) | Active | 0 | 샘플 라우트·mockup 삭제 정책 |
| [refine/BRAND_SSOT_CORE_SOLUTION.md](../BRAND_SSOT_CORE_SOLUTION.md) | Active | 0~1 | Shield 로고·브랜드; 앱 UI 색상은 TOKEN SSOT |
| [core-solution/CORE_SOLUTION_IDENTITY.md](./CORE_SOLUTION_IDENTITY.md) | Active | 1 | 제품 정체성·Calm Forest §4.2 |
| [DESIGN_V2_TOKEN_SSOT.md](../../DESIGN_V2_TOKEN_SSOT.md) | Active | 1~3 | `--mg-v2-*` Calm Forest SSOT |
| [DESIGN_V2_VISUAL_SPEC.md](../../DESIGN_V2_VISUAL_SPEC.md) | Active | 1~3 | 시각 명세 §A~§J |
| [core-solution/KR_SAAS_BENCHMARK_20260617.md](./KR_SAAS_BENCHMARK_20260617.md) | Active | 1 | 국내 B2B SaaS 벤치마크 참고 |
| [v2/GAP_ANALYSIS.md](../v2/GAP_ANALYSIS.md) | Active | 1~4 | **`/` 메인 앱** 갭; C-1 public은 Reference |

---

## Reference — 보조·레거시·public SaaS 톤

| 경로 | Status | Phase | 비고 |
|------|--------|-------|------|
| [DESIGN_V2_HANDOFF_TO_CODER.md](../../DESIGN_V2_HANDOFF_TO_CODER.md) | Reference | 3 | 코더 핸드오프; TOKEN/VISUAL 요약 |
| [DESIGN_V2_PUBLIC_ONBOARDING_SPEC.md](../../DESIGN_V2_PUBLIC_ONBOARDING_SPEC.md) | Reference | — | Phase A2 public 초안; C-1로 대체·Deprecated 쪽 |
| [refine/BRAND_ALIGNMENT_PLAN.md](../BRAND_ALIGNMENT_PLAN.md) | Archive | — | 2026-06 브랜드 정렬 기록; SSOT는 BRAND_SSOT |
| [v2/ASSET_INVENTORY.md](../v2/ASSET_INVENTORY.md) | Reference | — | SaaS public mockup 컴포넌트; CS 앱 1순위 아님 |
| [v2/assets/ASSETS_LANDING.md](../v2/assets/ASSETS_LANDING.md) | Reference | — | public landing SVG; SaaS 톤 |
| [v2/assets/ASSETS_ONBOARDING.md](../v2/assets/ASSETS_ONBOARDING.md) | Reference | — | public onboarding SVG |
| [v2/assets/ASSETS_PRICING.md](../v2/assets/ASSETS_PRICING.md) | Reference | — | public pricing SVG |
| [refine/assets/ASSETS_MANIFEST.md](../assets/ASSETS_MANIFEST.md) | Reference | — | PNG manifest; public hero 등 |
| [refine/assets/ASSETS_INVENTORY_AND_PROMPTS.md](../assets/ASSETS_INVENTORY_AND_PROMPTS.md) | Reference | — | 에셋·프롬프트 기록 |
| [DESIGN_V2_PHASE_C1_LANDING_SPEC.md](../../DESIGN_V2_PHASE_C1_LANDING_SPEC.md) | Deprecated | — | Trinity/public funnel; [trinity/README](../trinity/README.md) |
| [DESIGN_V2_PHASE_C1_ONBOARDING_SPEC.md](../../DESIGN_V2_PHASE_C1_ONBOARDING_SPEC.md) | Deprecated | — | 동일 |
| [DESIGN_V2_PHASE_C1_PRICING_SPEC.md](../../DESIGN_V2_PHASE_C1_PRICING_SPEC.md) | Deprecated | — | 동일 |

---

## Deprecated / Archive

| 경로 | Status | Phase | 비고 |
|------|--------|-------|------|
| [core-solution/LANDING_WIREFRAME.md](./LANDING_WIREFRAME.md) | Deprecated | — | public landing 와이어; Phase 3 `/` 아님 |
| [core-solution/LOGO_H2_BLACKHOLE_RING.md](./LOGO_H2_BLACKHOLE_RING.md) | Archive | — | Shield H2로 대체 |
| [core-solution/LOGO_SHIELD_VARIANT.md](./LOGO_SHIELD_VARIANT.md) | Deprecated | — | superseded by BRAND_SSOT §1 |
| [core-solution/mockups/README.md](./mockups/README.md) | Deprecated | — | static mockups removed |

---

## 에셋 (문서 아님 — 참조용)

| 경로 | Status | 비고 |
|------|--------|------|
| `core-solution/assets/final/*.svg` | Deprecated (docs copy) | Canonical: Trinity `public/assets` — [BRAND_SSOT §0](../BRAND_SSOT_CORE_SOLUTION.md) |
| `core-solution/mockups/*` | Deprecated | HTML/CSS mockup 삭제·미사용 |
| `v2/assets/*.svg` | Reference | public SaaS 일러스트 |

---

## 코드 앵커 (저장소 루트 기준)

| 경로 | 용도 |
|------|------|
| `frontend/src/components/dashboard-v2/AdminDashboardV2.js` | B0KlA 대시보드 UI 기준 |
| `frontend/src/styles/tokens/design-v2-tokens.css` | 토큰 구현 |
| `/admin-dashboard-sample` | 어드민 비주얼 샘플 라우트 (삭제 금지) |

---

*마지막 갱신: 2026-06-18 — VISUAL_DESIGN_PACK_PHASE1 Status Active (Step B) 반영; COMMERCIALIZATION_SPEC_ACTIVE 연계*
