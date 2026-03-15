# 어드민 대시보드 V2 시각화 컴포넌트 검토 — 재사용·중복·적재적소 제안

**작성**: core-component-manager  
**일자**: 2025-03-15  
**범위**: 시각화 관련 컴포넌트 재사용·중복·적재적소 검토 (제안·문서만, 코드 수정 없음)

---

## 1. 요약

| 구분 | 내용 |
|------|------|
| **재사용** | ContentSection / ContentCard / ContentArea·ContentHeader는 ERP·매칭·심리검사·상담일지 등에서 이미 공통 사용 중. ContentKpiRow는 어드민·ERP 메인에서만 사용. |
| **중복** | (1) StatCard 2종(common vs ui/Card), (2) KPI 카드 그리드 패턴 3종(ContentKpiRow vs MappingKpiSection vs PsychKpiSection + ClientStatisticsTab 인라인), (3) Chart 2종(common/Chart vs common/MGChart). |
| **적재적소** | AdminMetricsVisualization·CoreFlowPipeline은 admin/ 하위에 있어 도메인 결합적. 그리드/차트용 공통 시각화 블록은 dashboard-v2 또는 common 쪽 정리가 필요. |
| **신규 시각화** | 그리드 타일·추가 차트는 **기존 모듈 확장 우선**(AdminMetricsVisualization variant 확장, ContentKpiRow/공통 KPI 카드 재사용). 완전히 다른 패턴만 **신규 컴포넌트**로 추가 권장. |
| **다른 대시보드 일관성** | ERP는 ContentArea/ContentHeader/ContentKpiRow·B0KlA CSS 사용으로 어드민 V2와 정렬됨. 상담사 대시보드는 Content 블록 미사용. **공통 위젯/패턴**으로 KPI 행·섹션·카드 래퍼를 통일 제안. |

---

## 2. 현재 시각화 관련 컴포넌트 정리

### 2.1 블록·레이아웃 (dashboard-v2/content)

| 컴포넌트 | 위치 | 역할 | 사용처 |
|----------|------|------|--------|
| **ContentKpiRow** | dashboard-v2/content | B0KlA KPI 카드 행 (items: icon, label, value, badge, onClick) | AdminDashboardV2, ErpDashboard |
| **ContentSection** | dashboard-v2/content | B0KlA 섹션 래퍼 (title, subtitle, actions, noCard) | AdminDashboardV2, StaffManagement, PsychKpiSection, PsychUploadSection, ConsultantClientList, MappingSearchSection, MappingStatsSection, ConsultationLogTableBlock 등 다수 |
| **ContentCard** | dashboard-v2/content | B0KlA 카드 래퍼(섹션 없음) | AdminDashboardV2(파이프라인 래퍼), PsychUploadSection, ConsultationLogTableBlock, ConsultantComprehensiveManagement 등 |
| **ContentArea** | dashboard-v2/content | 본문 영역 래퍼 | AdminDashboardV2, ErpDashboard, ConsultantClientList, ERP 다수 페이지 |
| **ContentHeader** | dashboard-v2/content | 본문 헤더(제목·부제) | AdminDashboardV2, ErpDashboard, ERP 다수 페이지 |

**적재적소**: content 블록은 이미 “대시보드·관리 화면 본문”의 공통 레이어로 자리 잡음. **위치 유지 권장.**

---

### 2.2 지표 시각화 (admin/AdminDashboard)

| 컴포넌트 | 위치 | 역할 | 사용처 |
|----------|------|------|--------|
| **AdminMetricsVisualization** | admin/AdminDashboard/organisms | variant별 지표 영역 (pipeline만 구현, grid/option-c placeholder) | AdminDashboardV2 |
| **CoreFlowPipeline** | admin/AdminDashboard/organisms | 5단계 파이프라인 (steps 또는 stats로 기본 5단계) | AdminMetricsVisualization, AdminDashboard(레거시) |

**적재적소**: 둘 다 “어드민 도메인”에 묶여 있음. CoreFlowPipeline은 “5단계 플로우” 전용이므로 admin 유지 가능. AdminMetricsVisualization은 **variant 확장 시** “그리드/차트”가 어드민 전용이면 현 위치, 공통 위젯이 되면 dashboard-v2/organisms 또는 common 쪽 이동 검토.

---

### 2.3 KPI·통계 카드 (중복 이슈 있음)

| 컴포넌트/패턴 | 위치 | API/역할 | 사용처 |
|---------------|------|----------|--------|
| **ContentKpiRow** | dashboard-v2/content | items 배열, 아이콘 variant, badge, 클릭 | AdminDashboardV2, ErpDashboard |
| **StatCard (ui/Card)** | ui/Card/StatCard | icon, value, label, change, changeType, onClick, mg-dashboard-stat-card | AdminDashboardV2, AdminDashboard, SessionManagement, IntegratedFinanceDashboard, TodayStatsWidget 등 **대부분** |
| **StatCard (common)** | common/StatCard | title, value, icon, color, change, BaseCard 기반 | DashboardStats, ComponentTestPage, common/index export |
| **MappingKpiSection** | admin/mapping-management/organisms | ContentSection + **자체** 카드 그리드(mg-v2-mapping-kpi-section__card) | MappingManagementPage |
| **PsychKpiSection** | admin/psych-assessment/organisms | ContentSection + **자체** 카드 그리드(mg-v2-psych-kpi-section__card) | 심리검사 |
| **ClientStatisticsTab** | admin/ClientComprehensiveManagement | **인라인** renderStatCard → mg-v2-mapping-kpi-section__card 클래스 재사용 | 내담자 통계 탭 |

**중복 요약**  
- **StatCard**: 구현 2종(common vs ui/Card). 대시보드·ERP·세션 등은 거의 전부 ui/Card/StatCard 사용. common/StatCard는 소수만 사용 → **통합 제안**.  
- **KPI 카드 그리드**: ContentKpiRow(공통) vs MappingKpiSection/PsychKpiSection(도메인 전용 마크업) vs ClientStatisticsTab(인라인). 시각/역할이 비슷한 “아이콘+라벨+값+클릭” 카드가 세 곳에 나뉘어 있음 → **ContentKpiRow 기반으로 통일 검토**.

---

### 2.4 차트

| 컴포넌트 | 위치 | 역할 | 사용처 |
|----------|------|------|--------|
| **Chart** | common/Chart | Chart.js + react-chartjs-2, type/data/options/height | AdminDashboardV2(상담 현황 추이), StatisticsDashboard |
| **MGChart** | common/MGChart | Chart.js 동적 import, variant/height | AdvancedDesignSample 등 |
| **TreatmentOutcomeChart** | prediction/ | 도메인 전용 차트 | PredictionDashboard |
| **ApiPerformanceChart** 계열 | admin/widgets | 라인/도넛/바 전용 | ApiPerformanceMonitoring |

**중복**: common/Chart와 common/MGChart가 공존. 대시보드에서는 **common/Chart** 사용이 많음. MGChart는 샘플/특수 용도로만 보임 → **역할 분리 정리 또는 Chart로 수렴 제안**.

---

## 3. 신규 시각화(그리드 타일·추가 차트) 시 확장 vs 신규 제안

### 3.1 기존 모듈 확장 권장

- **그리드 타일(KPI 타일)**  
  - **AdminMetricsVisualization** `variant="grid"` 구현 시, 내부에서 **ContentKpiRow** 또는 동일 스펙의 items를 그리드로 배치하는 방식 권장.  
  - 별도 “KPI 타일 전용” 컴포넌트를 새로 두기보다, AdminMetricsVisualization이 grid 레이아웃만 담당하고, 카드 단위는 ContentKpiRow(또는 공통 KPI 카드) 재사용.

- **추가 차트(막대/라인/도넛 등)**  
  - **common/Chart** 확장 권장.  
  - 옵션/스타일만 다르다면 새 컴포넌트 대신 Chart에 type/options로 대응.  
  - 도메인 전용 해석(예: “상담 추이”, “ERP 수입/지출”)은 페이지/컨테이너에서 데이터 가공 후 Chart에 넘기는 구조 유지.

- **옵션 C(상단 그리드 + 하단 파이프라인)**  
  - **AdminMetricsVisualization** `variant="option-c"` 구현으로 처리. 상단은 grid, 하단은 기존 CoreFlowPipeline 재사용.

### 3.2 신규 컴포넌트 권장

- **완전히 다른 시각화 패턴**(예: 지도, 타임라인, 트리)이 필요할 때만 **신규 컴포넌트** 추가.  
- 추가 시 **위치**: 공통 재사용이면 `dashboard-v2/organisms` 또는 `common/`, 어드민 전용이면 `admin/AdminDashboard/organisms` 또는 admin 전용 위젯 폴더.

---

## 4. 다른 대시보드와의 일관성 제안

### 4.1 현재 사용 정리

| 대시보드 | ContentArea/Header | ContentKpiRow | ContentSection/Card | StatCard | B0KlA CSS |
|----------|--------------------|--------------|---------------------|----------|-----------|
| **어드민 V2** | ✅ | ✅ | ✅ | ✅ (ui/Card) | ✅ |
| **ERP 메인** | ✅ | ✅ | — | ✅ (ui/Card) | ✅ |
| **ERP 통합재무** | — | — | — | ✅ (ui/Card), DashboardSection | ✅ |
| **상담사 V2** | — | — | — | — | 자체 CSS |
| **매칭/심리/상담일지** | 부분 | — | ✅ | — | ✅ |

### 4.2 공통 위젯/패턴 재사용 제안

1. **KPI 행**  
   - 모든 대시보드 “상단 요약 지표”는 **ContentKpiRow**(또는 통일 후의 단일 KPI 행 컴포넌트) + 동일 B0KlA 스타일로 통일.  
   - ERP는 이미 ContentKpiRow 사용 중 → 유지.  
   - **상담사 대시보드**에 “오늘의 지표”가 있다면 ContentKpiRow + 동일 토큰 적용 검토.

2. **섹션·카드**  
   - **ContentSection**(noCard 옵션 포함)·**ContentCard**를 “대시보드/관리 화면”의 기본 블록으로 사용.  
   - ERP 통합재무의 DashboardSection과의 역할 중복 여부만 정리(레이아웃만 담당하면 ContentSection으로 통일 가능).

3. **통계 카드**  
   - StatCard를 **한 종류로 통합**(아래 5절)한 뒤, 어드민·ERP·위젯 전반에서 동일 StatCard 사용.  
   - “KPI 카드 그리드”는 ContentKpiRow 또는 StatCard 중 하나로 패턴 통일(라벨/값/아이콘/클릭 규격 맞춤).

4. **차트**  
   - 대시보드용 차트는 **common/Chart** 기준으로 통일.  
   - mg-v2-ad-b0kla__chart-* 등 B0KlA 차트 래퍼는 유지하되, 내부는 Chart 컴포넌트로 일원화 제안.

---

## 5. 역할별 정리 (확장 권장 / 신규 권장 / 공통화 제안)

### 5.1 확장 권장 (기존 모듈 확장)

| 대상 | 제안 |
|------|------|
| **AdminMetricsVisualization** | `variant="grid"` 구현 시 ContentKpiRow(또는 공통 KPI 카드)로 그리드 구성. `variant="option-c"` 구현 시 상단 grid + 하단 CoreFlowPipeline 조합. |
| **ContentKpiRow** | 그리드 레이아웃 옵션 추가 검토(현재는 행 형태). AdminMetricsVisualization grid에서 재사용. |
| **common/Chart** | 새 차트 타입/옵션은 Chart 컴포넌트 확장으로 대응. 도메인별 래퍼는 페이지/컨테이너에서 데이터만 가공. |

### 5.2 신규 권장 (완전히 다른 패턴일 때만)

| 상황 | 제안 |
|------|------|
| 지도/타임라인/트리 등 새로운 시각화 | 공통이면 dashboard-v2/organisms 또는 common/, 어드민 전용이면 admin/AdminDashboard/organisms 또는 admin 위젯. |
| Chart로 수렴하기 어려운 전용 차트 | 도메인 폴더(예: prediction/, emotion/)에 전용 컴포넌트 유지. 공통 API가 생기면 common으로 올리는 건 이후 검토. |

### 5.3 공통화 제안 (중복 제거·일관성)

| 항목 | 제안 |
|------|------|
| **StatCard** | **단일 구현으로 통합.** ui/Card/StatCard 사용처가 많으므로, common/StatCard는 “BaseCard 기반 StatCard”와 “ui/Card StatCard” 중 하나로 통일하고, 다른 쪽은 re-export 또는 deprecated 후 제거. (실제 통합·이동은 core-coder 수행.) |
| **KPI 카드 그리드** | **ContentKpiRow 기반 통일 검토.** MappingKpiSection, PsychKpiSection은 “items 빌더 + ContentKpiRow” 또는 “ContentKpiRow와 동일한 items 스펙을 받는 공통 KpiCardGrid”로 리팩터. ClientStatisticsTab의 renderStatCard는 ContentKpiRow items 또는 동일 스펙으로 교체해 클래스/마크업 중복 제거. |
| **Chart vs MGChart** | **common/Chart를 기본**으로 두고, MGChart 사용처가 “샘플/레거시”면 Chart로 이전 또는 역할 명확화(예: MGChart는 제한된 용도로만 문서화). |
| **대시보드 본문 구조** | ERP·어드민 공통: ContentArea + ContentHeader + ContentKpiRow(또는 통일된 KPI 블록) + ContentSection/ContentCard. 상담사 대시보드에도 동일 블록 도입 검토. |

---

## 6. core-coder 작업 시 참고 사항

- **코드 변경은 core-coder가 수행.** 본 문서는 “무엇을 할지” 제안만 포함.
- StatCard 통합 시: import 경로 일괄 변경 및 common/StatCard vs ui/Card/StatCard 중 하나로 수렴.
- MappingKpiSection/PsychKpiSection 리팩터 시: ContentKpiRow와 스펙 호환(items 배열, iconVariant, badge, onClick)하도록 맞추고, 기존 CSS(mg-v2-mapping-kpi-section__card 등)는 ContentKpiRow 클래스와 통합하거나 BEM 확장으로 정리.
- AdminMetricsVisualization grid/option-c 구현 시: ContentKpiRow 또는 동일 스펙 컴포넌트만 사용해 “KPI 카드” 구현체를 한 종류로 유지.

---

## 7. 참조

- 캡슐화·모듈화: `.cursor/skills/core-solution-encapsulation-modularization/SKILL.md`
- 아토믹 디자인: `.cursor/skills/core-solution-atomic-design/SKILL.md`
- 컴포넌트 구조 표준: `docs/standards/COMPONENT_STRUCTURE_STANDARD.md`
- 서브에이전트 활용: `docs/standards/SUBAGENT_USAGE.md`
