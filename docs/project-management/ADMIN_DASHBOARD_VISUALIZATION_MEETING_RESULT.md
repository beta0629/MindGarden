# 어드민 대시보드 V2 시각화 개선 — 서브에이전트 회의 결과

**일자**: 2025-03-15  
**참여**: core-designer, core-component-manager, core-coder (의견 수집) / core-planner (취합·문서화)  
**목적**: 시각화가 빈약하다는 피드백에 대한 다른 시각화 구성 방안 및 권장안 정리

---

## (가) 현재 시각화 한계 요약

| 구분 | 내용 |
|------|------|
| **위치** | `frontend/src/components/dashboard-v2/AdminDashboardV2.js` 메인 콘텐츠 |
| **현재 구성** | ① ContentKpiRow(KPI 카드 한 줄) ② AdminMetricsVisualization variant="pipeline"(5단계 파이프라인) ③ 상담 현황 추이 막대 차트 1개(월간/주간 토글) |
| **한계** | 차트가 **막대 1종**뿐이며, **variant="grid"**·**variant="option-c"**는 placeholder만 있어 그리드 타일·차트 다양성이 부족함. 어드민 대시보드 샘플 대비 헤더 단순(검색·캘린더·알림 등 없음), “한눈에 보이는 대시보드” 밀도가 낮다는 인상. |
| **디자인 기준** | mindgarden-design-system B0KlA, unified-design-tokens.css, AdminDashboardB0KlA.css / AdminDashboardPipeline.css |

---

## (나) 서브에이전트별 의견 요약

### core-designer

- **갭 분석**: 샘플(https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample)에는 통합 검색·캘린더/알림/테마 아이콘, 시각적 밀도가 있음. V2는 파이프라인·매칭/입금/스케줄 등 **업무 정보는 많으나** 차트 단일·지표 그리드 미구현·헤더 단순으로 “대시보드다움”이 약함.
- **제안**:  
  - **variant="grid"**: 5단계를 숫자 타일 그리드로 표시(단계명·건수·악센트).  
  - **variant="option-c"**: 상단 그리드 + 하단 파이프라인.  
  - **차트 1종 추가**: 단계별 비율(도넛/파이) 또는 예약 vs 완료(라인).  
  - **헤더 보강(선택)**: 검색 placeholder + 캘린더/알림/테마 아이콘.  
  - **KPI·섹션 B0KlA 통일**: 좌측 악센트 4px, 트렌드 배지, radius 16px 등.  
- **레이아웃 순서**: KPI Row → (그리드 →) 파이프라인 → 차트+상담사 Row → 환불/매칭/입금·스케줄/관리 기능.  
- **산출**: `docs/design-system/ADMIN_DASHBOARD_V2_VISUALIZATION_PROPOSAL.md` (와이어프레임·블록별 토큰·클래스 포함)

### core-component-manager

- **재사용**: ContentSection/ContentCard/ContentArea/ContentHeader는 다수 화면에서 사용 중 → 위치 유지. ContentKpiRow는 어드민·ERP에서 사용.  
- **중복**: StatCard 2종(common vs ui/Card), KPI 카드 그리드 3종(ContentKpiRow vs MappingKpiSection vs PsychKpiSection + ClientStatisticsTab), Chart 2종(common/Chart vs MGChart).  
- **신규 시각화 시**: **확장 우선** — 그리드 → AdminMetricsVisualization variant="grid" + ContentKpiRow 재사용, 추가 차트 → common/Chart 확장, option-c → variant="option-c"에서 grid+파이프라인 조합. **신규**는 지도/타임라인/트리 등 완전히 다른 패턴만.  
- **일관성**: ERP는 ContentArea/ContentHeader/ContentKpiRow·B0KlA로 어드민 V2와 정렬됨. 상담사 대시보드는 Content 블록 미사용 → KPI·섹션·카드를 공통 패턴으로 맞추는 제안. StatCard 단일화, KPI 그리드 ContentKpiRow 기반 통일, Chart 기준 통일 제안.  
- **산출**: `docs/project-management/ADMIN_DASHBOARD_V2_VISUALIZATION_COMPONENT_REVIEW.md`

### core-coder

- **단기(기존 API·구조로 가능)**:  
  - **variant="grid"**: 난이도 낮음, API 없음. 기존 stats/metrics로 5단계 타일 그리드 구현.  
  - **variant="option-c"**: 난이도 낮음~중간, grid 위 + pipeline 아래 조합.  
  - **도넛/파이(단계별 비율)**: 난이도 낮음. common/Chart에 Doughnut/Pie 있음, 5단계 건수만 비율로 가공.  
  - **라인(예약 vs 완료)**: 난이도 중간. consultationStats에 예약 시계열 있으면 단기, 없으면 백엔드 확장 필요.  
  - **헤더 보강·KPI·섹션 B0KlA 통일**: 난이도 낮음. CSS/클래스 정리 수준.  
- **중장기**: StatCard 2종 통합, KPI 카드 그리드 ContentKpiRow 기반 통일, Chart vs MGChart 수렴 → 사용처 많아 리팩터 범위 큼. 상담사 대시보드 Content 블록 도입, 지도/타임라인/트리 등 신규 시각화·API 설계.  
- **대시보드 API**: grid/option-c/도넛(단계 비율)은 **현재 대시보드 API만으로 구현 가능**. 새 엔드포인트는 예약 vs 완료 라인용 예약 시계열이 없을 때만 필요.  
- **산출**: `docs/project-management/ADMIN_DASHBOARD_V2_VISUALIZATION_OPTIONS_BY_EFFORT.md`

---

## (다) 다른 시각화 구성 방안 — 옵션 목록

| 옵션 | 설명 | 구현 관점 |
|------|------|------------|
| **그리드 KPI 타일 (variant="grid")** | 5단계(매칭→입금확인→회기권한→스케줄등록→회계처리)를 숫자 타일 그리드로 표시. 파이프라인과 동일 데이터, 다른 뷰. | 기존 AdminMetricsVisualization 확장, API 없음, 난이도 낮음. |
| **상단 그리드 + 하단 파이프라인 (variant="option-c")** | 상단에 5단계 타일 그리드, 하단에 기존 파이프라인. “숫자 → 흐름” 순서. | grid 구현 후 조합, API 없음, 난이도 낮음~중간. |
| **추가 차트 — 도넛/파이(단계별 비율)** | 5단계 건수 비율을 도넛 또는 파이 차트로 표시. | common/Chart 확장, 기존 stats로 비율 계산, 난이도 낮음. |
| **추가 차트 — 라인(예약 vs 완료)** | 월/주별 예약 건수 vs 완료 건수 2선 비교. | consultationStats에 예약 시계열 있으면 단기, 없으면 백엔드 확장. |
| **헤더 보강** | ContentHeader 우측에 통합 검색 placeholder + 캘린더/알림/테마 아이콘. | B0KlA 토큰·클래스만 적용, 난이도 낮음. |
| **KPI·섹션 B0KlA 통일** | 카드 좌측 세로 악센트 4px, 트렌드 배지, 섹션 제목 악센트, radius 16px 등 일관 적용. | CSS/클래스 정리, 난이도 낮음. |
| **타 대시보드 위젯 재사용** | ContentKpiRow, ContentSection/ContentCard, StatCard(통일 후), common/Chart를 ERP·상담사 대시보드와 동일 패턴으로 사용. | component-manager 제안대로 확장 우선, 중장기에는 StatCard·KPI 그리드 통일. |
| **완전 신규 시각화(지도/타임라인/트리)** | 완전히 다른 패턴 필요 시에만 신규 컴포넌트. | 라이브러리·데이터·API 설계 필요, 중장기. |

---

## (라) 권장 단계별 로드맵 및 담당 역할

### 1단계 — 우선 적용 (단기, 기존 API만 사용)

| 순서 | 항목 | 담당 | 비고 |
|------|------|------|------|
| 1 | **variant="grid"** 구현 | core-coder | designer 스펙·와이어프레임·토큰은 `ADMIN_DASHBOARD_V2_VISUALIZATION_PROPOSAL.md` 참조. component-manager 제안대로 AdminMetricsVisualization 확장 + ContentKpiRow(또는 동일 items) 그리드 배치. |
| 2 | **variant="option-c"** 구현 | core-coder | grid 위 + CoreFlowPipeline 아래 한 블록. placeholder 제거 후 실제 UI. |
| 3 | **차트 1종 추가 — 도넛/파이(단계별 비율)** | core-coder | common/Chart 확장, 5단계 건수 → 비율 가공, B0KlA 색상. 배치: designer 제안대로 차트+상담사 Row 내. |
| 4 | **KPI·섹션 B0KlA 통일** | core-coder | designer 제안: 좌측 악센트 4px, 제목 16px 600, radius 16px, 트렌드 배지 등. CSS/클래스만 정리. |

**설계 확정 필요 시**: core-designer가 1~4에 대한 화면설계서·스펙 보강 후 core-coder 구현.

### 2단계 — 선택·다음 단계

| 순서 | 항목 | 담당 | 비고 |
|------|------|------|------|
| 5 | **헤더 보강(선택)** | core-designer 스펙 → core-coder | 검색 placeholder + 캘린더/알림/테마 아이콘. 우선순위 낮으면 보류. |
| 6 | **라인 차트(예약 vs 완료)** | 백엔드 확인 후 core-coder | consultationStats에 예약 시계열 있으면 단기 추가. 없으면 API 확장 후 진행. |

### 3단계 — 중장기 (리팩터·일관성)

| 순서 | 항목 | 담당 | 비고 |
|------|------|------|------|
| 7 | **StatCard 단일화** | core-coder | common/StatCard vs ui/Card/StatCard 통합. component-manager 제안서 참조. 사용처 다수 → 단계적 이전. |
| 8 | **KPI 카드 그리드 ContentKpiRow 기반 통일** | core-coder | MappingKpiSection, PsychKpiSection, ClientStatisticsTab을 ContentKpiRow 스펙 또는 단일 KpiCardGrid로 리팩터. |
| 9 | **Chart vs MGChart 수렴** | core-coder | common/Chart 기본, MGChart 사용처 이전 또는 역할 명확화. |
| 10 | **상담사 대시보드 Content 블록 도입** | core-designer 레이아웃 제안 → core-coder | ContentArea/ContentHeader/ContentKpiRow 적용해 어드민·ERP와 일관성. |

---

## 참조 문서

| 문서 | 설명 |
|------|------|
| `docs/design-system/ADMIN_DASHBOARD_V2_VISUALIZATION_PROPOSAL.md` | designer 시각화 강화 제안·갭 분석·와이어프레임·블록별 토큰·클래스 |
| `docs/project-management/ADMIN_DASHBOARD_V2_VISUALIZATION_COMPONENT_REVIEW.md` | component-manager 재사용·중복·적재적소·확장 vs 신규·다른 대시보드 일관성 |
| `docs/project-management/ADMIN_DASHBOARD_V2_VISUALIZATION_OPTIONS_BY_EFFORT.md` | core-coder 단기/중장기 옵션·난이도·API·공수 |

---

**회의 진행 방식**: core-planner가 designer·component-manager·coder를 순차/병렬 호출해 의견 수집 후, 위 내용으로 취합·문서화함.  
**다음 액션**: 1단계(grid → option-c → 도넛/파이 차트 → B0KlA 통일)를 core-coder에게 분배 실행할지 결정 후, designer 스펙이 필요하면 core-designer 호출 후 구현 진행.
