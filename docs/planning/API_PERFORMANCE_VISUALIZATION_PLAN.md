# API 성능 모니터링 페이지 시각화 및 B0KlA 아토믹 디자인 적용 기획

## 1. 개요 및 목표
기존의 단순 나열식 'API 성능 모니터링' 페이지를 프로젝트 표준 아토믹 디자인과 B0KlA 대시보드 스펙에 완벽히 부합하도록 개편합니다. 단순 텍스트 데이터를 차트와 그래프 형태(대시보드형 뷰)로 직관적으로 시각화하여 관리자 사용성을 극대화합니다.

## 2. 레이아웃 및 아토믹 디자인 적용 방안 (B0KlA 기준)

### 2.1 공통 레이아웃 구조 (Template)
- **AdminCommonLayout 사용**: 모든 어드민 페이지 표준인 `AdminCommonLayout` 템플릿을 사용하여 LNB와 GNB를 감싸고 화면을 구성합니다.
- **ContentHeader**: 상단 제목 영역에 `ContentHeader` 컴포넌트를 사용하여 "API 성능 및 트래픽 모니터링" 등 명확한 타이틀을 배치합니다.
- **ContentArea**: 실제 대시보드 컴포넌트들을 `ContentArea` 하위에 렌더링합니다.

### 2.2 대시보드 Grid 구조 (Organisms/Molecules)
- `mg-v2-ad-b0kla__grid-container` 또는 `mg-v2-ad-b0kla__dashboard-grid` 와 같은 B0KlA 전용 그리드 클래스를 활용하여 화면을 분할합니다.
- 상단 (Summary Cards): 4개의 카드를 한 줄로 배치하여 핵심 지표(평균 응답속도, 금일 에러율, 전체 캐시 히트율, 금일 총 요청 수)를 표시합니다.
- 중단 (Main Charts): 좌우 분할 구조(예: 7:3 또는 6:4 비율)로 라인 차트(응답 시간 트렌드)와 도넛 차트(캐시 히트율/에러율)를 배치합니다.
- 하단 (List/Table): 병목을 유발하는 "가장 느린 API Top 5" 목록을 B0KlA 스타일의 테이블 또는 카드 리스트(Organism)로 하단에 배치합니다.

## 3. 그래프/시각화 요소 기획 (chart.js / react-chartjs-2 활용)

### 3.1 주요 시각화 항목
1. **응답 시간 트렌드 (Line Chart)**
   - X축: 시간대별 (최근 24시간 또는 7일)
   - Y축: 평균 응답 시간 (ms)
   - 특징: 트렌드 변화를 한눈에 볼 수 있도록 곡선(Line) 형태로 렌더링. B0KlA 디자인 토큰(예: `--ad-b0kla-green`, `--mg-primary-main`) 색상 적용.
2. **상태 코드 비율 및 에러율 (Doughnut Chart)**
   - 항목: 200 OK, 4xx Client Error, 5xx Server Error 비율 시각화
   - 특징: 정상(초록색 계열), 4xx(노란색 계열), 5xx(빨간색 계열)로 토큰 매핑.
3. **캐시 히트율 (Bar Chart 또는 Doughnut Chart)**
   - 항목: Cache Hit vs Cache Miss
   - 특징: 서버 부하 판단을 위한 직관적 차트 제공.
4. **가장 느린 API (Horizontal Bar Chart 또는 B0KlA 스타일 리스트)**
   - Y축: API 엔드포인트 명
   - X축: 응답 시간(ms)
   - 특징: 가장 오래 걸리는 API를 직관적으로 비교할 수 있는 가로형 막대그래프.

### 3.2 Mock 데이터를 활용한 구현 방안
- 백엔드 API 연동 전에 Chart.js가 렌더링될 수 있도록 더미 데이터 설정 로직을 생성하여 컴포넌트에 주입합니다.
- 더미 데이터 구조는 chart.js의 기본 포맷(labels, datasets)을 따르도록 설계합니다.

## 4. JIRA 티켓 / 작업 지시서 (분배실행)

### 4.1 Phase 1: 디자인 시안 및 UI 명세 (core-designer)
- **담당**: core-designer
- **목표**: B0KlA 스펙을 반영한 API 모니터링 대시보드 화면 설계 문서 작성
- **요구사항**: 단순 텍스트가 아닌 대시보드형 뷰 기획, Grid 클래스명(`mg-v2-ad-b0kla__*`) 활용, 반응형 레이아웃 설계

### 4.2 Phase 2: 차트 및 대시보드 뷰 구현 (core-coder)
- **담당**: core-coder
- **목표**: `react-chartjs-2`를 활용한 컴포넌트 개발 및 Mock 데이터 연동
- **요구사항**: `AdminCommonLayout` 적용, 아토믹 디자인 패턴(Atoms/Molecules/Organisms) 준수, 모의 데이터 렌더링 확인

---
*본 문서는 core-planner에 의해 작성되었으며, 이후 core-designer와 core-coder의 작업 기준으로 활용됩니다.*
