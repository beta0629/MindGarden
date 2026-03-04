# API 성능 모니터링 UI 재설계 명세서 (API_PERFORMANCE_UI_SPEC)

## 1. 개요
본 명세서는 `ApiPerformanceMonitoring.js` 페이지 및 관련 위젯(`ApiPerformanceWidget.js`, `PerformanceWidget.js`)을 최신 아토믹 디자인 패턴(B0KlA)과 공통 레이아웃(`AdminCommonLayout`) 표준에 맞게 재설계하기 위한 가이드입니다. 
기존의 파편화된 CSS 클래스를 제거하고, B0KlA 표준 클래스 및 토큰을 적용하여 UI의 일관성과 유지보수성을 극대화합니다.

## 2. CSS 클래스 1:1 매핑 테이블

### 2.1. 페이지 레이아웃 및 그리드
| 기존 클래스 / 요소 | 변경 후 클래스 (B0KlA/Token) | 비고 |
| --- | --- | --- |
| `.api-performance-monitoring` | `mg-v2-ad-b0kla__container` | 페이지 전체 컨테이너 |
| `.page-header` | **제거** | `AdminCommonLayout`의 기능(타이틀, 액션 등)으로 대체 |
| `.header-left` | **제거** | `AdminCommonLayout` 기본 타이틀 영역으로 대체 |
| `.header-actions` | `mg-v2-ad-b0kla__flex` (또는 `headerActions` prop) | 페이지 우측 상단 액션 버튼 그룹 (gap: 8px 등 토큰 활용) |
| `.dashboard-grid` | `mg-v2-ad-b0kla__grid` | 위젯 배치용 반응형 CSS Grid (예: `grid-template-columns`, `gap: var(--mg-spacing-24)`) |
| `.widget-container` | **제거** | 위젯 카드 자체가 그리드 아이템이 되도록 간소화 |

### 2.2. 위젯 (카드 구조)
| 기존 클래스 / 요소 | 변경 후 클래스 (B0KlA/Token) | 비고 |
| --- | --- | --- |
| `.performance-widget`, `.api-performance-widget` | `mg-v2-ad-b0kla__card` | 개별 위젯 컨테이너 |
| `.widget-header`, `.mg-card-header` | `mg-v2-ad-b0kla__card-header` | 카드 상단 (타이틀, 아이콘, 탭 버튼 등 배치) |
| `.widget-body`, `.mg-card-body` | `mg-v2-ad-b0kla__card-body` | 카드 본문 영역 |
| `.widget-title` | `mg-v2-ad-b0kla__text--bold mg-v2-ad-b0kla__text--lg` | 카드 제목 텍스트 |
| `.widget-footer` | `mg-v2-ad-b0kla__card-footer` (또는 하단 텍스트용 유틸) | 마지막 업데이트 등 하단 메타정보 |
| `.performance-tips` | `mg-v2-ad-b0kla__card` | 팁 영역도 독립된 카드 컴포넌트로 통일 |

### 2.3. 텍스트 및 통계 지표 (Atoms)
| 기존 클래스 / 요소 | 변경 후 클래스 (B0KlA/Token) | 비고 |
| --- | --- | --- |
| `.metric-item`, `.mg-stats-card` | `mg-v2-ad-b0kla__stat-item` (또는 flex-col) | 개별 통계 블록 |
| `.metric-label`, `.mg-stats-card__label` | `mg-v2-ad-b0kla__text--sm` | 지표 이름. 색상: `var(--mg-gray-600)` 등 |
| `.metric-value`, `.mg-stats-card__value` | `mg-v2-ad-b0kla__text--xl mg-v2-ad-b0kla__text--bold` | 주요 수치 텍스트 |
| `.tip-item` | `mg-v2-ad-b0kla__flex` | 아이콘 + 텍스트 수평 배치 (align-items: flex-start) |
| `.last-updated` | `mg-v2-ad-b0kla__text--xs mg-v2-text-muted` | 업데이트 시간 텍스트 |

### 2.4. 상태/에러 뱃지 및 컬러 토큰
| 기존 클래스 / 상태 | B0KlA 시맨틱 토큰 / 뱃지 클래스 | 비고 |
| --- | --- | --- |
| `.excellent`, `등급: 최고` | `var(--mg-success-500)` / `mg-v2-tag mg-v2-tag--success` | 정상 상태 |
| `.good`, `등급: 양호` | `var(--mg-info-500)` / `mg-v2-tag mg-v2-tag--info` | 양호/안정 상태 |
| `.poor`, `등급: 경고/에러` | `var(--mg-error-500)` / `mg-v2-tag mg-v2-tag--error` | 위험 상태 |
| `.mg-stat-badge` | `mg-v2-tag` | API 목록 내 통계 뱃지 |
| `.danger-button` | `MGButton variant="danger"` 혹은 B0KlA 클래스 | 삭제/초기화 버튼 |


## 3. 컴포넌트 DOM 트리 구조 명세서

### 3.1. `ApiPerformanceMonitoring.js` (Page)
```jsx
<AdminCommonLayout
  title="API 성능 모니터링"
  headerActions={
    <div className="mg-v2-ad-b0kla__flex">
      <MGButton variant="outline">보고서 다운로드</MGButton>
      <MGButton variant="danger">통계 초기화</MGButton>
      <MGButton variant="primary">새로고침</MGButton>
    </div>
  }
>
  <div className="mg-v2-ad-b0kla__container">
    <div className="mg-v2-ad-b0kla__grid" style={{ gridTemplateColumns: 'repeat(12, 1fr)', gap: 'var(--mg-spacing-24)' }}>
      
      {/* 위젯 1: 시스템 성능 개요 (Span 4 혹은 Span 12 반응형) */}
      <div style={{ gridColumn: 'span 12' }}>
        <PerformanceWidget />
      </div>

      {/* 위젯 2: API 성능 분석 (Span 8 혹은 Span 12 반응형) */}
      <div style={{ gridColumn: 'span 12' }}>
        <ApiPerformanceWidget />
      </div>

      {/* 위젯 3: 성능 최적화 팁 */}
      <div style={{ gridColumn: 'span 12' }}>
        <div className="mg-v2-ad-b0kla__card">
          <div className="mg-v2-ad-b0kla__card-header">
            <h3 className="mg-v2-ad-b0kla__text--lg mg-v2-ad-b0kla__text--bold">성능 최적화 팁</h3>
          </div>
          <div className="mg-v2-ad-b0kla__card-body mg-v2-ad-b0kla__flex mg-v2-ad-b0kla__flex-col">
            {/* tip-item 영역 */}
          </div>
        </div>
      </div>

    </div>
  </div>
</AdminCommonLayout>
```

### 3.2. `PerformanceWidget.js` (Widget)
```jsx
<div className="mg-v2-ad-b0kla__card">
  {/* Header */}
  <div className="mg-v2-ad-b0kla__card-header mg-v2-ad-b0kla__flex-between">
    <div className="mg-v2-ad-b0kla__flex">
      <FaChartLine className="mg-v2-ad-b0kla__icon" />
      <span className="mg-v2-ad-b0kla__text--bold">{title}</span>
    </div>
    <div className="trend-icon">...</div>
  </div>

  {/* Body */}
  <div className="mg-v2-ad-b0kla__card-body">
    <div className="mg-v2-ad-b0kla__grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
      {/* Metric Item */}
      <div className="mg-v2-ad-b0kla__stat-item mg-v2-ad-b0kla__flex-col">
        <span className="mg-v2-ad-b0kla__text--sm" style={{ color: 'var(--mg-gray-600)' }}>API 응답 시간</span>
        <span className="mg-v2-ad-b0kla__text--xl mg-v2-ad-b0kla__text--bold" style={{ color: 'var(--mg-success-500)' }}>120ms</span>
      </div>
      {/* ... 나머지 통계 ... */}
    </div>
  </div>

  {/* Footer (Optional) */}
  <div className="mg-v2-ad-b0kla__card-footer">
    <span className="mg-v2-ad-b0kla__text--xs mg-v2-text-muted">마지막 업데이트: ...</span>
  </div>
</div>
```

### 3.3. `ApiPerformanceWidget.js` (Widget)
```jsx
<div className="mg-v2-ad-b0kla__card">
  {/* Header */}
  <div className="mg-v2-ad-b0kla__card-header mg-v2-ad-b0kla__flex-between">
    <div className="mg-v2-ad-b0kla__flex">
      <FaChartArea className="mg-v2-ad-b0kla__icon" />
      <span className="mg-v2-ad-b0kla__text--bold">{title}</span>
    </div>
    <div className="mg-v2-ad-b0kla__flex">
      {/* 뷰 전환 버튼 그룹 */}
      <button className="mg-v2-ad-b0kla__btn mg-v2-ad-b0kla__btn--primary mg-v2-ad-b0kla__btn--sm">요약</button>
      <button className="mg-v2-ad-b0kla__btn mg-v2-ad-b0kla__btn--outline mg-v2-ad-b0kla__btn--sm">느린 API</button>
      <button className="mg-v2-ad-b0kla__btn mg-v2-ad-b0kla__btn--outline mg-v2-ad-b0kla__btn--sm">에러 API</button>
    </div>
  </div>

  {/* Body */}
  <div className="mg-v2-ad-b0kla__card-body">
    {/* Summary View */}
    <div className="mg-v2-ad-b0kla__grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
      <div className="mg-v2-ad-b0kla__stat-item mg-v2-ad-b0kla__flex-col">
        {/* 아이콘 + 라벨 + 값 구조 */}
      </div>
    </div>
    
    {/* List View (Slow/Error APIs) */}
    <div className="mg-v2-ad-b0kla__flex-col">
      {/* List Item */}
      <div className="mg-v2-ad-b0kla__flex-between" style={{ padding: '12px', borderBottom: '1px solid var(--mg-gray-200)' }}>
        <span className="mg-v2-ad-b0kla__text--bold">/api/v1/users</span>
        <div className="mg-v2-ad-b0kla__flex">
          <span className="mg-v2-tag mg-v2-tag--error">에러율: 12%</span>
          <span className="mg-v2-tag">총 요청: 150</span>
        </div>
      </div>
    </div>
  </div>
</div>
```

## 4. 후속 작업 (코더 및 정리 담당자용)
1. 위 DOM 트리 및 매핑 테이블에 맞추어 `ApiPerformanceMonitoring.js`, `ApiPerformanceWidget.js`, `PerformanceWidget.js` 내부 JSX 구조 변경.
2. 상태와 연동된 다이내믹 클래스(예: `metric-item ${getPerformanceGrade(...)})` 부분을 B0KlA 인라인 스타일 토큰이나 상태 뱃지 컴포넌트로 마이그레이션.
3. 컴포넌트 마이그레이션 완료 후, 다음 레거시 CSS 파일들을 삭제:
   - `ApiPerformanceMonitoring.css`
   - `PerformanceWidget.css`
   - 위젯 전용으로 정의된 잡다한 커스텀 스타일.
