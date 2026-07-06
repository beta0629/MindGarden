# Core Solution 디자인 문서 — 단일 진입점 (INDEX)

> **Status**: Active  
> **Scope**: Core Solution **메인 앱 UI** (`frontend/`, 로그인 후 **`/`** 허브·대시보드). Trinity(`frontend-trinity`) 공개 퍼널은 **범위 외**.

---

## 목적

Core Solution(MindGarden) **내부 앱** 디자인 v2의 문서 SSOT를 한곳에서 탐색·적용하기 위한 인덱스입니다.  
코드·React·static HTML mockup 선행 없이, **문서 정리 → 고품질 시안 1벌 → 사용자 검수 → React 반영** 워크플로만 정의합니다.

## 범위

> **진행 순서 확정**: **어드민(ADMIN) → 상담사(CONSULTANT) → 내담자(CLIENT)** 순차 진행 (Phase 1은 어드민만 대상).  
> **Phase 1 상태**: KPI 확정됨 (오늘 상담 일정, 상담사별 오늘 일정, 신규 접수) - 2026-06-18

| 포함 | 제외 |
|------|------|
| `frontend/` Core Solution 메인 앱 UI | Trinity(`frontend-trinity/`) 회사·공개 퍼널 |
| 로그인 후 **`/`** (TabletHomepage / 대시보드 허브) | `/landing`, `/onboarding`, `/pricing` 디자인 1순위 |
| B0KlA / `AdminDashboardV2`, Calm Forest `--mg-v2-*` | docs static HTML mockup (삭제됨) |
| Shield H2 로고 (Trinity `public/assets` = 에셋 호스팅 참조) | H2 Blackhole Ring (Deprecated) |

## 3차 재시도 맥락

1. **1·2차**: public 랜딩·mockup·SaaS Blue 톤 중심으로 진행 → CS 메인 앱과 혼동, 부분 패치·일괄 치환 반복.
2. **재정립 (본 INDEX)**: 디자인은 **마지막 단계**. Phase 3는 **`/` 메인 허브 시안**부터. C-1 public 스펙·mockup은 Reference/Deprecated.
3. **코드 앵커**: `frontend/src/components/dashboard-v2/AdminDashboardV2.js`

## 읽는 순서 (Phase 1 시작 시)

아래 순서로 읽은 뒤 [DESIGN_PHASE3_MASTER_PLAN.md](./DESIGN_PHASE3_MASTER_PLAN.md) Phase 1을 시작합니다.

1. [SAMPLE_PAGES_POLICY.md](../SAMPLE_PAGES_POLICY.md) — 샘플 라우트·mockup 금지 정책  
2. [DESIGN_PHASE3_MASTER_PLAN.md](./DESIGN_PHASE3_MASTER_PLAN.md) — Phase 0~4 로드맵·완료 조건  
3. [DESIGN_CURRENT_STATE_ANALYSIS.md](./DESIGN_CURRENT_STATE_ANALYSIS.md) — 현황 점검·P0/P1/P2·코드 근거  
4. [PHASE1_PUBLIC_MAIN_SPEC.md](./PHASE1_PUBLIC_MAIN_SPEC.md) — Phase 3 공개 메인(Public Main) 상용화 Rebuild 스펙
5. [COMMERCIALIZATION_DESIGN_PLAN.md](./COMMERCIALIZATION_DESIGN_PLAN.md) — 상용화 바·의사결정·Phase 1 브리프  
6. [DESIGN_REVIEW_CHECKLIST.md](./DESIGN_REVIEW_CHECKLIST.md) — 전체 페이지 인벤토리·Phase 3 Batch·디자인 검수 게이트 SSOT  
7. [CORE_SOLUTION_IDENTITY.md](./CORE_SOLUTION_IDENTITY.md) — 제품 정체성·Calm Forest 톤  
8. [BRAND_SSOT_CORE_SOLUTION.md](../BRAND_SSOT_CORE_SOLUTION.md) — Shield 로고·브랜드 경계 (앱 UI 색상은 TOKEN SSOT 우선)  
9. [DESIGN_V2_TOKEN_SSOT.md](../../DESIGN_V2_TOKEN_SSOT.md) — `--mg-v2-*` Calm Forest 토큰  
10. [DESIGN_V2_VISUAL_SPEC.md](../../DESIGN_V2_VISUAL_SPEC.md) — 시각 명세 §A~§J  
11. [KR_SAAS_BENCHMARK_20260617.md](./KR_SAAS_BENCHMARK_20260617.md) — 국내 B2B SaaS 벤치마크 (참고)  
12. [GAP_ANALYSIS.md](../v2/GAP_ANALYSIS.md) — **`/` 메인 앱** 기준 갭 (public C-1 갭은 Reference)  
13. [DOC_INVENTORY.md](./DOC_INVENTORY.md) — CS 관련 파일 전체 목록·Status  

**C-1 public 스펙**(`DESIGN_V2_PHASE_C1_*.md`)은 읽기 순서에 **포함하지 않음**. Trinity/public funnel Reference는 [trinity/README.md](../trinity/README.md) 참조.

## Trinity 분리

- **Trinity** = 회사 브랜드·공개 퍼널 (`frontend-trinity/`). 본 CS Phase 3와 **별도 트랙**.
- Trinity canonical 로고 경로는 **에셋 호스팅 참조**로만 [BRAND_SSOT §0](../BRAND_SSOT_CORE_SOLUTION.md)에 기재.

## 관련 링크

- 전체 파일 목록: [DOC_INVENTORY.md](./DOC_INVENTORY.md)  
- Phase 로드맵: [DESIGN_PHASE3_MASTER_PLAN.md](./DESIGN_PHASE3_MASTER_PLAN.md)  
- Trinity 문서 보관: [trinity/README.md](../trinity/README.md)
