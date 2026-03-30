# API 성능 모니터링 페이지 아토믹 디자인(B0KlA) 리모델링 기획

## 1. 개요 및 목표
- **목표**: `ApiPerformanceMonitoring` 상세 페이지와 관련 위젯들을 최신 아토믹 디자인 패턴(B0KlA) 및 공통 레이아웃(`AdminCommonLayout`)에 맞게 전면 개편.
- **핵심 요구사항**: 
  - 레거시 CSS 클래스(예: `api-performance-monitoring`, `page-header`, `performance-widget` 등)를 폐기하고, `mg-v2-ad-b0kla__*` 클래스명과 `var(--ad-b0kla-*)`, `var(--mg-*)` 디자인 토큰으로 대체.
  - 관리자 표준 레이아웃 일관성 확보. 통계 카드, 차트 영역, 목록 영역 등을 `mg-v2-ad-b0kla__card` 스타일로 통일.

## 2. 현행 구조 및 문제점 분석
### 2.1 대상 파일
- **페이지**: `frontend/src/components/admin/ApiPerformanceMonitoring.js`
  - 현재 `AdminCommonLayout`을 사용 중이나, 내부적으로 `.page-header`, `.header-actions`, `.dashboard-grid` 등 독자적인 레거시 CSS를 통해 레이아웃을 구성하고 있음.
- **위젯 1**: `frontend/src/components/admin/widgets/ApiPerformanceWidget.js`
  - `Widget.css`의 `mg-widget--api-performance` 등 위젯 전용 CSS에 크게 의존 중.
- **위젯 2**: `frontend/src/components/admin/widgets/PerformanceWidget.js`
  - `PerformanceWidget.css` 파일의 `.performance-widget`, `.metric-row`, `.metric-item` 등 개별 클래스에 의존 중.
- **CSS 파일**: `ApiPerformanceMonitoring.css`, `PerformanceWidget.css`, `Widget.css`(API 성능 위젯 관련 부분)

### 2.2 문제점
- **파편화된 스타일**: 동일한 형태의 위젯 카드임에도 `performance-widget`, `mg-widget--api-performance` 등 서로 다른 클래스와 CSS 파일로 관리되고 있음.
- **B0KlA 미준수**: 최신 디자인 토큰(`--ad-b0kla-*`) 및 구조(`mg-v2-ad-b0kla__card`)가 적용되지 않음.
- **반응형 비표준**: 미디어 쿼리가 개별 CSS에 하드코딩되어 있어 전체 시스템과 반응형 중단점(breakpoint)이 불일치할 수 있음.

## 3. 리모델링 기획 수립 (Atomic Design & Layout)

### 3.1 전체 레이아웃 (`AdminCommonLayout` 적용)
- `AdminCommonLayout`의 `title` 프롭을 활용하고, 페이지 내부의 중복된 타이틀 영역(`.page-header`)을 제거하거나 B0KlA의 Action Header 구조로 일원화.
- 전체 레이아웃 래퍼: `mg-v2-ad-b0kla__container` 또는 `AdminCommonLayout`의 기본 본문 영역 래퍼 사용.
- 그리드 시스템: `.dashboard-grid` 대신 `mg-v2-ad-b0kla__grid` 사용.

### 3.2 아토믹 디자인 패턴(B0KlA) 적용 가이드
- **카드 컴포넌트**: 모든 위젯과 팁 영역은 `mg-v2-ad-b0kla__card`로 통일.
  - 헤더: `mg-v2-ad-b0kla__card-header` (아이콘, 제목, 트렌드 등 포함)
  - 본문: `mg-v2-ad-b0kla__card-body`
- **통계/지표 영역 (Atoms & Molecules)**:
  - 지표 항목: `mg-v2-ad-b0kla__stat-item`
  - 지표 라벨: `mg-v2-ad-b0kla__text--sm`, `var(--ad-b0kla-color-text-secondary)`
  - 지표 값: `mg-v2-ad-b0kla__text--xl`, `mg-v2-ad-b0kla__text--bold`
- **상태/에러 뱃지 (Atoms)**:
  - `mg-v2-ad-b0kla__badge`, `mg-v2-ad-b0kla__badge--error`, `mg-v2-ad-b0kla__badge--warning` 등 사용.
- **버튼 (Atoms)**:
  - `MGButton`에 주입하는 className을 `mg-v2-ad-b0kla__button` 계열로 일원화 (예: `mg-v2-ad-b0kla__button--primary`, `mg-v2-ad-b0kla__button--danger`).

### 3.3 파일 구조 개편 계획
- 기존 `ApiPerformanceMonitoring.css` 및 `PerformanceWidget.css` **폐기**.
- 위젯 공통 CSS인 `Widget.css` 내 `api-performance` 및 `performance` 관련 코드 **정리 및 삭제**.
- B0KlA 아토믹 클래스가 정의된 공통 CSS(`unified-design-tokens.css` 등) 활용을 극대화하여 컴포넌트 내 인라인 클래스 매핑으로 렌더링.

## 4. 리스크 및 제약사항
- 공통 위젯(`Widget.css`)을 수정할 경우, 다른 대시보드에서 해당 클래스를 참조하고 있다면 사이드 이펙트 발생 가능성 존재. (사전 검색 및 확인 필수)
- 상태별(Excellent, Good, Poor 등) 색상 코드가 레거시에 묶여 있으므로 B0KlA 시맨틱 컬러 토큰(`--ad-b0kla-color-success`, `--ad-b0kla-color-error` 등)으로 매핑 필요.

## 5. 실행 위임 및 분배 (Phase)

| Phase | 담당 | 목표 | 호출 시 전달할 태스크 설명 (프롬프트 요약) |
|---|---|---|---|
| **Phase 1** | `core-designer` | UI/UX B0KlA 토큰 매핑 및 레이아웃 재설계 | `ApiPerformanceMonitoring.js`, `PerformanceWidget.js`, `ApiPerformanceWidget.js` 화면을 B0KlA 아토믹 디자인 패턴(`mg-v2-ad-b0kla__*`) 및 디자인 토큰으로 대체하는 CSS/구조 설계 지시. (기존 클래스 1:1 매핑표 및 구조 스펙 문서 작성) |
| **Phase 2** | `core-coder` | React 컴포넌트 마이그레이션 (JS 구현) | `core-designer`의 시안/스펙을 바탕으로 3개의 JS 파일 내 클래스명 및 마크업을 변경하고, 필요 없는 CSS 파일을 import 목록에서 삭제(또는 파일 자체 삭제)하도록 구현 의뢰. |
| **Phase 3** | `explore` | 사이드 이펙트 확인 및 정리 | `Widget.css` 내 레거시 클래스를 정리하기 전, 해당 클래스를 사용하는 다른 파일이 있는지 전역 검색 의뢰. |
