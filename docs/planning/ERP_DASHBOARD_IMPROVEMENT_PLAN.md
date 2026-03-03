# ERP 대시보드 개선 기획서

**작성일**: 2025-03-04  
**목적**: ERP 대시보드가 "어드민 대시보드처럼" 보이도록 레이아웃·스타일·사용성을 정리하고, Phase별 실행 항목(기획·디자인·코딩 연계)을 문서화  
**참조**: 어드민 대시보드 샘플 https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample  
**관련 문서**: `docs/planning/ERP_SECTION_AUDIT_AND_PLANNING.md`, `docs/planning/ERP_LAYOUT_DESIGN_REVIEW.md`

---

## 1. 목표·배경

- **목표**: ERP 대시보드(`/erp/dashboard`)를 어드민 대시보드(또는 시스템 설정·심리검사 관리 등)와 **동일한 레이아웃·카드 스타일·토큰**으로 맞추고, 사용자 편의에 맞게 개선한다.
- **배경**: 현재 ERP 대시보드는 `mg-dashboard-stats`, `mg-dashboard-section--card`, `mg-management-grid`/`mg-management-card` 등 기존 레이아웃 클래스를 사용해 어드민 대시보드와 비주얼·구조가 다르다는 피드백이 있음. B0KlA·ContentArea/ContentHeader·어드민 샘플 기준으로 통일할 필요가 있음.

---

## 2. 현황 vs 어드민 대시보드 스타일 차이 (표 정리)

| 구분 | ERP 대시보드 (현재) | 어드민 대시보드·시스템 설정·심리검사 관리 (목표) |
|------|---------------------|--------------------------------------------------|
| **본문 루트** | `mg-dashboard-layout` | `ContentArea` (`mg-v2-content-area`) |
| **상단 헤더** | `mg-dashboard-header` (제목·부제·새로고침) + Layout `title`과 **이중 제목** | `ContentHeader` (제목·부제·actions). 제목은 한 곳에서만. |
| **통계/KPI 영역** | `mg-dashboard-stats` + `StatCard` (4개: 총 아이템 수, 승인 대기, 총 주문 수, 예산 사용률) | `ContentKpiRow` 또는 B0KlA KPI 스타일 (`mg-v2-content-kpi-row`, `mg-v2-content-kpi-card` / `mg-v2-ad-b0kla__kpi-*`) |
| **통계 카드 스타일** | `dashboard-common-v3.css` 기반 (`--mg-bg-card`, `--mg-shadow-md` 등) | B0KlA 토큰 (`--ad-b0kla-card-bg`, `--ad-b0kla-border`, `--ad-b0kla-shadow`, 아이콘 variant green/orange/blue) |
| **섹션 래퍼** | `DashboardSection` → `mg-dashboard-section mg-dashboard-section--card` | `mg-v2-ad-b0kla__card` 또는 `ContentCard` + 섹션 제목은 `mg-v2-ad-b0kla__section-title` (좌측 악센트 바 옵션) |
| **빠른 액션 그리드** | `mg-management-grid` + `mg-management-card` | `mg-v2-ad-b0kla__admin-grid` + `mg-v2-ad-b0kla__admin-card` (아이콘: `mg-v2-ad-b0kla__admin-icon`, 라벨/설명: `mg-v2-ad-b0kla__admin-label`, `mg-v2-ad-b0kla__admin-desc`) |
| **색상·타이포·간격** | `--mg-*`, `--spacing-*` 등 혼용, ErpDashboard.css에 `erp-*` 미사용·다른 공통 클래스 사용 | `unified-design-tokens.css` + `--ad-b0kla-*` (dashboard-tokens-extension.css), `--mg-spacing-*`, `--mg-layout-section-padding` |
| **배경·메인 영역** | `mg-dashboard-layout` 내부 패딩·그라데이션 (dashboard-common-v3) | ContentArea 배경·패딩 (B0KlA 스펙), 메인 배경 `#FAF9F7`~`#F2EDE8` 톤 유지 |

---

## 3. "어드민 대시보드처럼" 구체화

### 3.1 레이아웃 구조

| 영역 | 적용 내용 |
|------|-----------|
| **본문 루트** | `ContentArea`로 감싼다. `mg-dashboard-layout` 제거. |
| **상단 헤더** | `ContentHeader` 사용. title="ERP 대시보드" (또는 "ERP 관리"), subtitle="통합 자원·회계 현황을 한눈에 확인하세요." 등. actions에 새로고침 버튼. **Layout의 title과 중복되지 않도록** Layout에는 동일 제목 전달하되, 본문 내부에는 ContentHeader만 두거나, Layout title을 ERP 대시보드용으로 통일하고 본문에는 부제·액션만 둠. |
| **통계 영역** | KPI 행은 `ContentKpiRow` + items 배열(아이콘, label, value, badge/subtitle). 또는 B0KlA KPI 카드 스타일을 쓰는 기존 StatCard를 `ContentKpiRow`와 동일한 마크업·클래스로 교체. |
| **카드 그리드(빠른 액션)** | 한 개의 `mg-v2-ad-b0kla__card` 섹션 안에 제목("빠른 액션") + `mg-v2-ad-b0kla__admin-grid` + `mg-v2-ad-b0kla__admin-card` 나열. 섹션 제목은 `mg-v2-ad-b0kla__section-title` (필요 시 좌측 악센트 바). |

### 3.2 카드·섹션 스타일

- **통계 카드**: `mg-v2-ad-b0kla__card` 또는 ContentKpiRow 내부 `mg-v2-content-kpi-card` (어드민 샘플·AdminDashboardV2의 KPI 행과 동일).
- **빠른 액션 카드**: `mg-v2-ad-b0kla__admin-card`, 아이콘 `mg-v2-ad-b0kla__admin-icon mg-v2-ad-b0kla__admin-icon--green|blue|orange|gray`, 라벨 `mg-v2-ad-b0kla__admin-label`, 설명 `mg-v2-ad-b0kla__admin-desc`.
- **섹션 구분**: 좌측 악센트 바(4px, 주조색)는 `mg-v2-ad-b0kla__section-title` 또는 B0KlA 섹션 헤더 스펙에 맞게 적용.

### 3.3 간격·타이포·색상 토큰

- **간격**: `--mg-spacing-xl`, `--mg-layout-section-padding`, `--mg-layout-grid-gap` 등. `--spacing-lg` 등 레거시 변수 대신 통일.
- **타이포**: 제목 `--ad-b0kla-title-color`, 부제/보조문 `--ad-b0kla-text-secondary`, `--mg-font-*` 사용.
- **색상**: 카드 배경 `--ad-b0kla-card-bg`, 테두리 `--ad-b0kla-border`, 그림자 `--ad-b0kla-shadow` / `--ad-b0kla-shadow-hover`. 어드민 B0KlA 토큰만 사용하도록 ERP 전용 하드코딩 색 제거.

### 3.4 빠른 액션 배치 방식

- **그리드**: `mg-v2-ad-b0kla__admin-grid` (repeat(auto-fit, minmax(200px, 1fr)) 유사). 어드민 대시보드와 동일한 카드 크기·간격.
- **순서**: 권한에 따라 동적 노출 유지. 제안 순서(우선노출): 구매 요청하기 → 승인 관리 → 아이템 관리 → 예산 관리 → 급여 관리 → 세금 관리 → 통합 회계 → 환불 관리 → (고도화) 분개·원장·정산·현금흐름.
- **아이콘 variant**: 기능별로 green/orange/blue/gray 중 지정해 어드민 카드와 시각적 일관성 유지.

---

## 4. 사용자 편의 개선 제안

| 항목 | 제안 내용 |
|------|-----------|
| **진입 경로** | LNB "ERP 관리" → "ERP 대시보드" 유지. 어드민 메인 대시보드에서 ERP 카드 클릭 시 `/erp/dashboard` 이동 유지. 위젯(ErpManagementGridWidget 등) 링크가 `/erp/dashboard`와 일치하도록 정리(기존 ERP_SECTION_AUDIT 문서 Phase 3 참고). |
| **핵심 지표 노출 순서** | ① 승인 대기(즉시 대응 필요) ② 예산 사용률 ③ 총 아이템 수 ④ 총 주문 수. 또는 사용자 역할(예: 승인 담당자)에 따라 "승인 대기"를 첫 번째로 노출하는 옵션 검토. |
| **권한별 노출** | 현재와 동일하게 권한 체크 후 통계(KPI)·빠른 액션 카드를 필터링. 없는 권한의 카드는 비노출. 통계도 권한에 따라 일부만 보이게 할지(예: 통합 재무 권한 없으면 예산 사용률만) 정책 확정 후 반영. |
| **반응형** | ContentArea·ContentKpiRow·B0KlA 그리드는 이미 반응형 스펙 있음. 768px 이하 1열, 1024px 이하 2열 등 RESPONSIVE_LAYOUT_SPEC·AdminDashboardB0KlA.css 기준 유지. ERP 전용 미디어쿼리는 B0KlA 브레이크포인트에 맞춰 정리. |
| **접근성** | ContentArea에 role="region", aria-label. 빠른 액션 카드는 버튼 또는 role="button" + tabIndex, 키보드 포커스·포커스 링락. 섹션 제목은 heading 레벨(h2) 유지. |

---

## 5. 범위·의존성·Phase

### 5.1 범위

- **포함**: ERP 대시보드 1개 페이지(`ErpDashboard.js`·`ErpDashboard.css`)의 본문 구조·클래스·스타일을 ContentArea + ContentHeader + B0KlA 카드/KPI·빠른 액션 그리드로 변경.
- **제외**: 다른 ERP 하위 페이지(구매·재무·예산·세무 등)는 별도 Phase에서 점진 적용. API·백엔드·권한 로직 변경 없음(기존 데이터·권한 체크 유지).

### 5.2 의존성·선행

- **ContentArea, ContentHeader, ContentKpiRow, ContentCard** 컴포넌트 및 B0KlA CSS(AdminDashboardB0KlA.css, dashboard-tokens-extension.css)는 이미 코드베이스에 있음. 추가 구현 없이 참조만 하면 됨.
- **AdminCommonLayout**은 이미 ERP 대시보드에 적용됨. 유지.

### 5.3 Phase 목록

| Phase | 담당 | 목표 | 호출 시 전달할 태스크 설명 초안 |
|-------|------|------|--------------------------------|
| **Phase 0** | **explore** | ERP 대시보드·어드민 샘플·Content 컴포넌트 사용처·클래스 정의 위치 최종 확인 | "ErpDashboard.js와 AdminDashboardV2.js·AdminDashboardSample.js에서 ContentArea/ContentHeader/ContentKpiRow·mg-v2-ad-b0kla__admin-grid 사용 방식을 비교해, ErpDashboard에 적용할 구체적인 import·JSX 구조·클래스명 목록을 요약해 주세요. 산출: 짧은 비교표 + 적용 시 사용할 컴포넌트·클래스 목록." |
| **Phase 1** | **core-designer** | ERP 대시보드 화면 설계(어드민처럼 보이게) | "docs/planning/ERP_DASHBOARD_IMPROVEMENT_PLAN.md를 참조해 ERP 대시보드 본문을 어드민 대시보드 샘플(https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample)과 동일한 레이아웃·비주얼로 설계해 주세요. 사용성: ERP 담당자가 승인 대기·예산·빠른 액션을 최소 클릭으로 사용. 정보 노출: 권한별 KPI·카드 노출 유지. 레이아웃: ContentArea + ContentHeader + KPI 행 + 빠른 액션 섹션( mg-v2-ad-b0kla__card + mg-v2-ad-b0kla__admin-grid ). 색상·간격은 unified-design-tokens.css·B0KlA(--ad-b0kla-*)만 사용. 산출: 화면 블록 구성도·섹션별 클래스·토큰 매핑 문서. 코드 작성 없음." |
| **Phase 2** | **core-coder** | ErpDashboard 본문을 ContentArea + ContentHeader + B0KlA 구조로 리팩터링 | "docs/planning/ERP_DASHBOARD_IMPROVEMENT_PLAN.md와 Phase 1 디자이너 산출물을 반영해 ErpDashboard.js 본문을 수정해 주세요. (1) mg-dashboard-layout 제거, ContentArea로 루트 감싸기. (2) mg-dashboard-header 제거, ContentHeader 사용(title/subtitle/actions 새로고침). (3) mg-dashboard-stats + StatCard를 ContentKpiRow(items) 또는 B0KlA KPI 카드 스타일로 교체. (4) 빠른 액션은 DashboardSection 대신 mg-v2-ad-b0kla__card + mg-v2-ad-b0kla__admin-grid + mg-v2-ad-b0kla__admin-card 사용. (5) AdminCommonLayout title은 'ERP 대시보드' 등으로 한 곳만 노출되게 조정. (6) ErpDashboard.css에서 본문 구조에만 관여하는 레거시 클래스 정리. 참조: AdminDashboardV2.js, ContentArea/ContentHeader/ContentKpiRow, AdminDashboardB0KlA.css, core-solution-frontend·core-solution-atomic-design 스킬." |
| **Phase 3** | **core-coder** | 반응형·접근성·토큰 정리 검증 | "ERP 대시보드가 768/1024px에서 레이아웃이 깨지지 않는지, ContentArea·B0KlA 그리드 반응형이 적용되는지 확인하고 필요 시 미디어쿼리 보완. 빠른 액션 카드에 키보드 포커스·aria 레이블 적용. ErpDashboard.css에 하드코딩 색이 남아 있으면 --ad-b0kla-* 또는 --mg-* 토큰으로 교체." |
| **Phase 4** | **core-tester** (선택) | ERP 대시보드 시각·권한 회귀 검증 | "ERP 대시보드 접근 시 ContentArea·ContentHeader·KPI 행·빠른 액션 그리드가 노출되는지, 권한별로 카드가 숨겨지는지 확인하는 E2E 또는 수동 시나리오 체크리스트 작성·실행." |

---

## 6. 리스크·제약

- **기존 클래스 의존**: 다른 페이지(IntegratedFinanceDashboard, TaxManagement, SalaryManagement 등)에서 `mg-dashboard-layout`·`mg-dashboard-stats`를 쓰고 있으므로, 해당 클래스 정의는 dashboard-common-v3.css 등에서 **제거하지 않고** 유지. ERP 대시보드만 새 구조로 전환.
- **StatCard 재사용**: StatCard를 그대로 쓰되 B0KlA KPI 스타일을 부모에서 주입하거나, ContentKpiRow items로 변환해 통계 4개를 넘기면 됨. StatCard 컴포넌트 자체 삭제는 하지 않음(다른 대시보드에서 사용 가능).
- **최근 활동 섹션**: 현재 빈 상태. 개선 Phase에서 "최근 활동" 블록을 B0KlA 카드로 감싸서 유지할지, 또는 제거 후 추후 API 연동 시 추가할지 정책 결정 후 반영.

---

## 7. 단계별 완료 기준·체크리스트

| Phase | 완료 기준 | 체크리스트 |
|-------|-----------|------------|
| Phase 0 | 적용 대상 컴포넌트·클래스 목록이 명확해짐 | [ ] ContentArea/ContentHeader/ContentKpiRow import 경로·props 정리됨 [ ] mg-v2-ad-b0kla__admin-* 사용 예시(AdminDashboardV2) 참조 경로 정리됨 |
| Phase 1 | 디자이너 산출물로 코더가 구현 가능 | [ ] 블록 구성도(ContentArea > ContentHeader, KPI, 카드 섹션) 문서화 [ ] 섹션별 클래스·토큰 매핑 표 작성 [ ] 사용성·정보 노출·레이아웃 요구 반영됨 |
| Phase 2 | ERP 대시보드가 어드민처럼 보임 | [ ] 본문 루트가 ContentArea [ ] 상단이 ContentHeader(제목·부제·새로고침) [ ] KPI 4개가 ContentKpiRow 또는 B0KlA KPI 스타일 [ ] 빠른 액션이 mg-v2-ad-b0kla__admin-grid + mg-v2-ad-b0kla__admin-card [ ] 이중 제목 제거 [ ] 기존 권한·네비게이션 동작 유지 |
| Phase 3 | 반응형·접근성·토큰 일관 | [ ] 768px 이하 1열·1024px 이하 2열 등 확인 [ ] 카드 포커스·키보드 이동 가능 [ ] ERP 전용 하드코딩 색 제거 |
| Phase 4 | 회귀 없음 확인 | [ ] 권한별 카드 노출/비노출 확인 [ ] 링크 클릭 시 해당 ERP 페이지 이동 확인 |

---

## 8. 실행 요청문 (서브에이전트 호출 순서)

다음 순서로 서브에이전트를 호출해 주세요.

1. **Phase 0 (explore)**  
   - **서브에이전트**: explore  
   - **전달 프롬프트**: 위 §5.3 Phase 0 "호출 시 전달할 태스크 설명 초안" 전문.  
   - **산출**: ErpDashboard 적용용 컴포넌트·클래스 목록 요약.

2. **Phase 1 (core-designer)**  
   - **서브에이전트**: core-designer  
   - **전달 프롬프트**: 위 §5.3 Phase 1 "호출 시 전달할 태스크 설명 초안" + "참조 문서: docs/planning/ERP_DASHBOARD_IMPROVEMENT_PLAN.md, docs/planning/ERP_LAYOUT_DESIGN_REVIEW.md"  
   - **산출**: 화면 블록 구성도·섹션별 클래스·토큰 매핑 문서(코드 없음).

3. **Phase 2 (core-coder)**  
   - **서브에이전트**: core-coder  
   - **전달 프롬프트**: 위 §5.3 Phase 2 "호출 시 전달할 태스크 설명 초안" + Phase 1 산출물 경로.  
   - **산출**: ErpDashboard.js·ErpDashboard.css 수정 반영.

4. **Phase 3 (core-coder)**  
   - **서브에이전트**: core-coder  
   - **전달 프롬프트**: 위 §5.3 Phase 3 설명.  
   - **산출**: 반응형·접근성·토큰 보완 커밋.

5. **Phase 4 (core-tester, 선택)**  
   - **서브에이전트**: core-tester  
   - **전달 프롬프트**: 위 §5.3 Phase 4 설명.  
   - **산출**: ERP 대시보드 체크리스트·실행 결과 요약.

---

**문서 끝.** 기획만 수행하며, 실제 서브에이전트 호출은 부모 에이전트 또는 사용자가 수행합니다.
