# 화면설계서: API 성능 및 트래픽 모니터링 대시보드

## 1. 개요 및 목적
- **화면명**: API 성능 및 트래픽 모니터링
- **목적**: 기존 텍스트 위주의 API 성능 데이터를 대시보드(차트 및 그래프 형태)로 시각화하여, 관리자와 개발자가 시스템 병목, 에러율, 캐시 히트 상태 등을 직관적으로 파악할 수 있도록 합니다.
- **주요 대상**: 시스템 관리자, 백엔드 개발자

## 2. 화면 레이아웃 및 아토믹 컴포넌트 구조

### 2.1 전체 레이아웃 (Template)
- **공통 템플릿**: `AdminCommonLayout` 적용
  - 좌측 사이드바(260px 고정, 배경: 다크 #2C2C2C)
  - 상단 브레드크럼 및 GNB 포함
- **ContentHeader**: 
  - 타이틀: "API 성능 및 트래픽 모니터링"
  - 배경: `var(--mg-color-background-main)`
- **ContentArea**:
  - 패딩: 24~32px
  - 그리드 컨테이너: `mg-v2-ad-b0kla__grid-container` 클래스를 적용하여 대시보드 내부 레이아웃 분할

### 2.2 대시보드 영역 분할 (Organisms)
- **Top Section (요약 지표 카드 4종)**
  - 1행 4열 그리드 배치 (`display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;`)
- **Middle Section (메인 차트 2종)**
  - 좌우 분할 구조 (약 7:3 또는 6:4 비율)
  - 좌측: 응답 시간 트렌드 (Line Chart)
  - 우측: 상태 코드 비율 (Doughnut Chart)
- **Bottom Section (상세 지표 및 리스트)**
  - 가장 느린 API 리스트 및 캐시 히트율 상세 내역 배치 (전체 폭 사용 혹은 반분할)

## 3. UI 스펙 및 디자인 토큰 적용 가이드

### 3.1 섹션 블록 공통 스타일 (Molecules)
- 대시보드 내의 각 차트/카드 영역은 B0KlA 섹션 블록 스타일을 준수하여 렌더링합니다.
- **배경색**: `var(--mg-color-surface-main)`
- **테두리**: 1px solid `var(--mg-color-border-main)`
- **반경 (Radius)**: 16px
- **여백 (Padding)**: 24px (내부 요소 간 간격 16px)
- **섹션 제목 영역**: 
  - 좌측 세로 악센트 바: 폭 4px, `var(--mg-color-primary-main)`, radius 2px
  - 텍스트: 16px, fontWeight 600, `var(--mg-color-text-main)`

### 3.2 상단 요약 카드 (Summary Cards)
다음 4개의 핵심 지표를 요약 카드로 노출합니다.
1. **평균 응답속도 (ms)**
2. **금일 에러율 (%)**
3. **전체 캐시 히트율 (%)**
4. **금일 총 요청 수 (건)**
- **숫자 텍스트 (데이터)**: 24px, fontWeight 600, `var(--mg-color-text-main)`
- **라벨 텍스트 (항목명)**: 12px, `var(--mg-color-text-secondary)`
- 각 카드 좌측에 4px 너비의 악센트 바를 배치하여 시각적 구분을 더할 수 있습니다.

### 3.3 중단/하단 차트 영역 (Chart.js DOM 구조)
- `chart.js` 또는 `react-chartjs-2`를 사용하기 위해, 각 섹션 블록 내부에 캔버스를 감싸는 래퍼 DOM 구조를 정의합니다.
- **DOM 구조 예시**:
  ```html
  <div class="mg-v2-ad-b0kla__chart-section">
    <div class="mg-v2-ad-b0kla__section-header">
      <span class="mg-v2-ad-b0kla__accent-bar"></span>
      <h3>응답 시간 트렌드</h3>
    </div>
    <div class="mg-v2-ad-b0kla__canvas-wrapper" style="position: relative; height: 300px; width: 100%;">
      <canvas id="responseTimeChart"></canvas>
    </div>
  </div>
  ```

#### 1) 응답 시간 트렌드 (Line Chart)
- **목적**: 최근 24시간 또는 7일간의 평균 응답 시간 변화 표시
- **차트 색상 (Line)**: `var(--mg-primary-500)` 또는 `var(--mg-color-primary-main)`
- **X축**: 시간대
- **Y축**: 평균 응답 시간 (ms)

#### 2) 상태 코드 비율 및 에러율 (Doughnut Chart)
- **목적**: 200 OK, 4xx Client Error, 5xx Server Error 비율 시각화
- **차트 색상 (토큰 매핑)**:
  - 정상 (2xx): `var(--mg-success-500)`
  - 클라이언트 에러 (4xx): `var(--mg-error-500)` (또는 별도의 Warning 토큰)
  - 서버 에러 (5xx): `var(--mg-error-500)`
- **정보 노출 범위**: 범례(Legend) 및 툴팁을 통해 HTTP 상태 코드 그룹(2xx, 4xx, 5xx)과 점유율을 명확히 노출합니다.

#### 3) 캐시 히트율 (Bar Chart 또는 Doughnut Chart)
- **목적**: Cache Hit vs Cache Miss 상태 확인
- **정보 노출 범위**: 캐시 히트 여부 (Hit / Miss) 및 건수/비율 표시

### 3.4 하단 가장 느린 API (Horizontal Bar Chart 또는 List)
- **목적**: 병목을 유발하는 API 엔드포인트 파악
- **정보 노출 범위**: 
  - API 엔드포인트 경로 (예: `/api/v1/users/profile`)
  - 응답 시간 (ms)
- **스타일**: 가로 막대 그래프 시 `var(--mg-color-accent-main)` 등 포인트 컬러 토큰을 적용하여 가장 느린 구간을 강조합니다.

## 4. 반응형 레이아웃 가이드
- **PC (1280px 이상)**: 
  - 사이드바 260px 고정, 메인 콘텐츠 최대 넓이 1200px.
  - 상단 요약 카드: 1행 4열
  - 메인 차트: 좌우 분할
- **Tablet (768px ~ 1279px)**: 
  - 상단 요약 카드: 2행 2열 구조로 변경.
  - 메인 차트: 세로 배치(상하 분할)로 각각 100% 폭 사용.
- **Mobile (375px ~ 767px)**: 
  - 모든 카드 및 차트는 1열 세로 배치.
  - 컨테이너 패딩 축소 (예: 16px) 및 최소 터치 영역 높이 44px 이상 확보.
