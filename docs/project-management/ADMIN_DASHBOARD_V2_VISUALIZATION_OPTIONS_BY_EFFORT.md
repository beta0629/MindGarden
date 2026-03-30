# 어드민 대시보드 V2 시각화 옵션 — 구현 난이도·우선순위 정리

**작성**: core-coder  
**일자**: 2025-03-15  
**참조**: designer 제안(`docs/design-system/ADMIN_DASHBOARD_V2_VISUALIZATION_PROPOSAL.md`), component-manager 제안(`docs/project-management/ADMIN_DASHBOARD_V2_VISUALIZATION_COMPONENT_REVIEW.md`)  
**범위**: 단기/중장기 옵션 목록 + 난이도·API·공수 코멘트. **코드 수정 없음.**

---

## 1. 단기적으로 추가 가능한 시각화 옵션

| 옵션 | 구현 난이도 | 필요 API | 예상 공수·코멘트 |
|------|-------------|----------|------------------|
| **variant="grid" 구현** | 낮음 | 없음 (기존 pipeline과 동일 `stats`/`metrics` 사용) | AdminMetricsVisualization에서 grid 분기만 추가하고, 5단계를 ContentKpiRow 스펙 또는 동일 items로 그리드 레이아웃(`repeat(auto-fit, minmax(160px, 1fr))`)으로 배치하면 됨. B0KlA 카드·악센트 CSS 적용. |
| **variant="option-c" 구현** | 낮음~중간 | 없음 | grid 구현 후 option-c는 “상단 grid + 하단 CoreFlowPipeline” 한 블록으로 조합하면 됨. placeholder 제거 후 실제 UI만 넣으면 됨. |
| **차트 1종 추가 — 도넛/파이(단계별 비율)** | 낮음 | 없음 (기존 `stats`: totalMappings, activeMappings, schedulePendingCount, pendingDeposit 등으로 5단계 비율 계산 가능) | common/Chart는 이미 Doughnut/Pie 지원. 데이터만 5단계 건수 → 비율로 가공해 전달. B0KlA 토큰 색상만 options에 적용. |
| **차트 1종 추가 — 라인(예약 vs 완료)** | 중간 | 조건부 | `consultationStats`에 월/주별 **예약 건수** 시계열이 있으면 기존 API만 사용. 없으면 `GET /api/v1/admin/statistics/consultation-completion` 또는 신규 엔드포인트에 예약 시계열 추가 필요. |
| **헤더 보강(선택)** | 낮음 | 없음 (검색·캘린더·알림은 placeholder 가능) | ContentHeader 우측에 검색 입력 + 아이콘 버튼(캘린더, 알림, 테마) 추가. B0KlA 헤더 토큰·클래스만 적용하면 됨. |
| **KPI·섹션 B0KlA 통일** | 낮음 | 없음 | 좌측 악센트 4px, 제목 16px 600, 카드 radius 16px 등 기존 제안 스펙에 맞춰 CSS/클래스 정리. 시각만 맞추는 수준. |

---

## 2. 중장기 옵션

| 옵션 | 왜 중장기인지 (요약) |
|------|----------------------|
| **StatCard 단일화** | common/StatCard vs ui/Card/StatCard 2종 통합. 사용처가 많아 import·props 정리·테스트 회귀 범위가 큼. |
| **KPI 카드 그리드 통일(ContentKpiRow 기반)** | MappingKpiSection, PsychKpiSection, ClientStatisticsTab 등 도메인별 카드 그리드를 ContentKpiRow(items 스펙) 또는 단일 KpiCardGrid로 리팩터. 스펙 맞추기·CSS 통합·도메인 페이지 검증 필요. |
| **Chart vs MGChart 수렴** | common/Chart를 기본으로 두고 MGChart 사용처 이전 또는 역할 명확화. 샘플/레거시 페이지 영향 정리 필요. |
| **상담사 대시보드에 Content 블록 도입** | ContentArea/ContentHeader/ContentKpiRow를 상담사 V2에 적용해 어드민·ERP와 레이아웃 일관성 확보. 페이지 구조 변경 및 권한별 노출 정리 필요. |
| **지도/타임라인/트리 등 완전 신규 시각화** | component-manager 제안대로 “완전히 다른 패턴”만 신규. 라이브러리 선정·데이터 스키마·API 설계부터 필요. |
| **예약 vs 완료 라인 차트용 백엔드 확장** | 현재 consultation-completion API에 “예약 건수” 시계열이 없으면 백엔드에서 집계·API 스펙 확장 후 프론트 연동 필요. |

---

## 3. 요약 표

| 구분 | 단기 (API 없이 또는 기존 API만) | 중장기 (API·데이터·리팩터링 필요) |
|------|---------------------------------|-----------------------------------|
| **grid/option-c** | ✅ grid, option-c 구현 가능. 기존 pipeline stats 재사용. | — |
| **추가 차트** | ✅ 도넛/파이(단계 비율) — 기존 데이터로 가능. 라인(예약 vs 완료) — API에 예약 시계열 있으면 단기. | 예약 시계열 없으면 백엔드 확장 후 진행. |
| **헤더·KPI·섹션 B0KlA** | ✅ CSS/토큰 정리 수준으로 단기 가능. | — |
| **대시보드 API 연동** | grid/option-c/도넛은 **기존 대시보드 API만으로 가능**. 새 엔드포인트 불필요. | StatCard·KPI 그리드 통일, Chart 수렴, 상담사 대시보드 구조 변경은 리팩터링·영향도 검토 필요. |

---

**문서 끝.**  
구현 시 designer 제안서의 토큰·클래스명과 component-manager의 “확장 우선(AdminMetricsVisualization, ContentKpiRow, common/Chart)” 방향을 따르면 됩니다.
