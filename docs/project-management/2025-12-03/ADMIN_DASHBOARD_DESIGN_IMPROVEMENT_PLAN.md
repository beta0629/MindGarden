# 관리자 대시보드 디자인 개선 계획

**작성일:** 2025-12-03  
**담당:** AI Assistant  
**목표:** 기존 AdminDashboard 디자인 표준화 및 시각적 개선  
**참조 표준:** [디자인 중앙화 표준](../../standards/DESIGN_CENTRALIZATION_STANDARD.md)

---

## 📌 배경

### 위젯 방식 보류 결정
- **문제점:**
  - 통계 차트/그래프를 위젯으로 표현하기 어려움
  - 3단계 구조(위젯 그룹 → 정의 → 컴포넌트)로 복잡도 높음
  - 개발 시간 과다 소요
  - 유지보수 어려움

- **결정 사항:**
  - 위젯 시스템 보류 (추후 다른 용도 활용 가능)
  - 기존 AdminDashboard 디자인 개선으로 방향 전환
  - 표준화된 디자인 시스템 재작성

---

## 🎯 목표

### 1. 디자인 표준 재작성
- MindGarden 디자인 시스템 v3.0 정의
- 관리자 대시보드 전용 디자인 가이드 작성
- CSS 변수 체계 재정립

### 2. 시각적 개선
- 모던한 UI/UX 적용
- 일관된 색상 시스템
- 애니메이션 및 인터랙션 강화

### 3. 기능 강화
- 실시간 통계 차트 추가
- 데이터 시각화 개선
- 반응형 디자인 최적화

---

## 📋 Phase별 실행 계획

### Phase 1: 디자인 표준 재작성 (1일, 8시간)

#### 1.1 디자인 시스템 문서 작성
**파일:** `docs/design-system-v3/ADMIN_DASHBOARD_DESIGN_STANDARD.md`

**내용:**
```markdown
# 관리자 대시보드 디자인 표준 v3.0

## 1. 색상 시스템
### 기본 색상
- Primary: #667eea (보라)
- Success: #11998e (청록)
- Warning: #f5576c (핑크)
- Info: #4facfe (하늘)
- Danger: #e74c3c (빨강)

### 그라데이션
- Primary Gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
- Success Gradient: linear-gradient(135deg, #11998e 0%, #38ef7d 100%)
- Warning Gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)
- Info Gradient: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)

### 배경 색상
- Dashboard BG: #f8f9fa
- Card BG: #ffffff
- Section BG: #f5f7fa

### 텍스트 색상
- Primary Text: #2c3e50
- Secondary Text: #7f8c8d
- Muted Text: #95a5a6

## 2. 타이포그래피
### 폰트 크기
- Huge: 48px (대시보드 타이틀)
- XXL: 32px (섹션 타이틀)
- XL: 24px (카드 타이틀)
- LG: 20px (서브 타이틀)
- MD: 16px (본문)
- SM: 14px (설명)
- XS: 12px (레이블)

### 폰트 굵기
- Bold: 700 (타이틀)
- Semibold: 600 (서브 타이틀)
- Medium: 500 (본문)
- Regular: 400 (설명)

## 3. 간격 시스템
- XXS: 4px
- XS: 8px
- SM: 12px
- MD: 16px
- LG: 24px
- XL: 32px
- XXL: 48px
- XXXL: 64px

## 4. 그림자 시스템
- SM: 0 2px 4px rgba(0, 0, 0, 0.06)
- MD: 0 4px 8px rgba(0, 0, 0, 0.08)
- LG: 0 8px 16px rgba(0, 0, 0, 0.10)
- XL: 0 12px 24px rgba(0, 0, 0, 0.12)
- XXL: 0 16px 32px rgba(0, 0, 0, 0.14)

## 5. 둥근 모서리
- SM: 4px
- MD: 8px
- LG: 12px
- XL: 16px
- XXL: 20px
- FULL: 9999px (원형)

## 6. 애니메이션
- Fast: 150ms
- Normal: 300ms
- Slow: 500ms
- Easing: cubic-bezier(0.4, 0, 0.2, 1)
```

#### 1.2 CSS 변수 파일 생성
**파일:** `frontend/src/styles/admin-dashboard-v3.css`

**중요:** 기존 표준 준수
- ✅ **기본 CSS 변수**: `frontend/src/styles/unified-design-tokens.css` (1,026개 변수)
- ✅ **BEM 네이밍**: `mg-{component}-{element}--{modifier}`
- ✅ **변수 네이밍**: `--mg-{category}-{property}-{variant}`

**작업 내용:**
- [ ] 기존 `unified-design-tokens.css` 확인 및 활용
- [ ] 관리자 대시보드 전용 변수 추가 (기존 변수 확장)
- [ ] 역할별 Primary 색상 정의 (Admin, Consultant, Client, ERP, HQ)
- [ ] 대시보드 특화 변수 정의 (카드, 통계, 차트)
- [ ] 기존 표준과 충돌 없는지 확인

**예상 시간:** 2시간

#### 1.3 컴포넌트 스타일 가이드
**파일:** `docs/design-system-v3/COMPONENT_STYLE_GUIDE.md`

**내용:**
```markdown
# 컴포넌트 스타일 가이드

## 1. StatCard (통계 카드)
### 구조
- 아이콘 영역
- 값 영역 (숫자)
- 레이블 영역
- 변화율 영역 (선택)

### 스타일
- 배경: 그라데이션 또는 단색
- 그림자: --shadow-lg
- 둥근 모서리: --radius-xl
- 패딩: --spacing-xl
- 호버 효과: transform + shadow

## 2. DashboardSection (대시보드 섹션)
### 구조
- 헤더 (아이콘 + 타이틀 + 서브타이틀)
- 컨텐츠 영역

### 스타일
- 배경: --color-card-bg
- 테두리: 1px solid --color-border
- 둥근 모서리: --radius-lg
- 마진: --spacing-xxl

## 3. ManagementCard (관리 기능 카드)
### 구조
- 아이콘 영역 (그라데이션 배경)
- 타이틀
- 설명

### 스타일
- 배경: --color-card-bg
- 호버 효과: transform + border-color
- 아이콘 크기: 64px
- 둥근 모서리: --radius-lg
```

**예상 시간:** 2시간

#### 1.4 레이아웃 가이드
**파일:** `docs/design-system-v3/LAYOUT_GUIDE.md`

**내용:**
- 그리드 시스템
- 반응형 브레이크포인트
- 컨테이너 너비
- 섹션 간격

**예상 시간:** 1시간

#### 1.5 인터랙션 가이드
**파일:** `docs/design-system-v3/INTERACTION_GUIDE.md`

**내용:**
- 호버 효과
- 클릭 피드백
- 로딩 상태
- 에러 상태
- 성공 상태

**예상 시간:** 1시간

#### 1.6 차트 디자인 가이드
**파일:** `docs/design-system-v3/CHART_DESIGN_GUIDE.md`

**내용:**
- 차트 색상 팔레트
- 라인 차트 스타일
- 바 차트 스타일
- 파이 차트 스타일
- 범례 스타일
- 툴팁 스타일

**예상 시간:** 2시간

---

### Phase 2: CSS 변수 시스템 구축 (0.5일, 4시간)

#### 2.1 기존 CSS 분석
**작업 내용:**
- [ ] `AdminDashboard.new.css` 분석
- [ ] 하드코딩된 값 추출
- [ ] 중복 스타일 정리
- [ ] 사용되지 않는 스타일 제거

**예상 시간:** 1시간

#### 2.2 CSS 변수 파일 작성
**파일:** `frontend/src/styles/admin-dashboard-v3.css`

```css
/* ===== Admin Dashboard v3.0 Design System ===== */

/* 1. 색상 시스템 */
:root {
    /* Primary Colors */
    --admin-v3-primary: #667eea;
    --admin-v3-primary-dark: #764ba2;
    --admin-v3-primary-light: #8b9eff;
    --admin-v3-primary-rgb: 102, 126, 234;

    /* Success Colors */
    --admin-v3-success: #11998e;
    --admin-v3-success-dark: #0d7a6f;
    --admin-v3-success-light: #38ef7d;
    --admin-v3-success-rgb: 17, 153, 142;

    /* Warning Colors */
    --admin-v3-warning: #f5576c;
    --admin-v3-warning-dark: #e74c3c;
    --admin-v3-warning-light: #f093fb;
    --admin-v3-warning-rgb: 245, 87, 108;

    /* Info Colors */
    --admin-v3-info: #4facfe;
    --admin-v3-info-dark: #00f2fe;
    --admin-v3-info-light: #7ec8ff;
    --admin-v3-info-rgb: 79, 172, 254;

    /* Danger Colors */
    --admin-v3-danger: #e74c3c;
    --admin-v3-danger-dark: #c0392b;
    --admin-v3-danger-light: #ff6b6b;
    --admin-v3-danger-rgb: 231, 76, 60;

    /* Gradients */
    --admin-v3-gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --admin-v3-gradient-success: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    --admin-v3-gradient-warning: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    --admin-v3-gradient-info: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);

    /* Background Colors */
    --admin-v3-bg-dashboard: #f8f9fa;
    --admin-v3-bg-card: #ffffff;
    --admin-v3-bg-section: #f5f7fa;
    --admin-v3-bg-hover: #f0f2f5;

    /* Text Colors */
    --admin-v3-text-primary: #2c3e50;
    --admin-v3-text-secondary: #7f8c8d;
    --admin-v3-text-muted: #95a5a6;
    --admin-v3-text-white: #ffffff;

    /* Border Colors */
    --admin-v3-border: #e1e8ed;
    --admin-v3-border-light: #f0f3f7;
    --admin-v3-border-dark: #d1d8dd;

    /* 2. 타이포그래피 */
    --admin-v3-font-huge: 48px;
    --admin-v3-font-xxxl: 36px;
    --admin-v3-font-xxl: 32px;
    --admin-v3-font-xl: 24px;
    --admin-v3-font-lg: 20px;
    --admin-v3-font-md: 16px;
    --admin-v3-font-sm: 14px;
    --admin-v3-font-xs: 12px;

    --admin-v3-font-bold: 700;
    --admin-v3-font-semibold: 600;
    --admin-v3-font-medium: 500;
    --admin-v3-font-regular: 400;

    /* 3. 간격 시스템 */
    --admin-v3-spacing-xxs: 4px;
    --admin-v3-spacing-xs: 8px;
    --admin-v3-spacing-sm: 12px;
    --admin-v3-spacing-md: 16px;
    --admin-v3-spacing-lg: 24px;
    --admin-v3-spacing-xl: 32px;
    --admin-v3-spacing-xxl: 48px;
    --admin-v3-spacing-xxxl: 64px;

    /* 4. 그림자 시스템 */
    --admin-v3-shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.06);
    --admin-v3-shadow-md: 0 4px 8px rgba(0, 0, 0, 0.08);
    --admin-v3-shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.10);
    --admin-v3-shadow-xl: 0 12px 24px rgba(0, 0, 0, 0.12);
    --admin-v3-shadow-xxl: 0 16px 32px rgba(0, 0, 0, 0.14);

    /* 5. 둥근 모서리 */
    --admin-v3-radius-sm: 4px;
    --admin-v3-radius-md: 8px;
    --admin-v3-radius-lg: 12px;
    --admin-v3-radius-xl: 16px;
    --admin-v3-radius-xxl: 20px;
    --admin-v3-radius-full: 9999px;

    /* 6. 애니메이션 */
    --admin-v3-transition-fast: 150ms;
    --admin-v3-transition-normal: 300ms;
    --admin-v3-transition-slow: 500ms;
    --admin-v3-easing: cubic-bezier(0.4, 0, 0.2, 1);

    /* 7. Z-Index */
    --admin-v3-z-base: 1;
    --admin-v3-z-dropdown: 1000;
    --admin-v3-z-sticky: 1020;
    --admin-v3-z-fixed: 1030;
    --admin-v3-z-modal-backdrop: 1040;
    --admin-v3-z-modal: 1050;
    --admin-v3-z-popover: 1060;
    --admin-v3-z-tooltip: 1070;
}
```

**예상 시간:** 2시간

#### 2.3 기존 CSS 리팩토링
**작업 내용:**
- [ ] `AdminDashboard.new.css` 수정
- [ ] 하드코딩 값을 CSS 변수로 변경
- [ ] 중복 스타일 제거
- [ ] 클래스명 표준화

**예상 시간:** 1시간

---

### Phase 3: 컴포넌트 시각적 개선 (1일, 8시간)

#### 3.1 StatCard 개선
**파일:** `frontend/src/components/ui/Card/StatCard.js`

**개선 사항:**
- [ ] 그라데이션 배경 적용
- [ ] 아이콘 애니메이션 추가
- [ ] 호버 효과 강화
- [ ] 트렌드 화살표 추가
- [ ] 숫자 카운트업 애니메이션

**예상 시간:** 2시간

#### 3.2 DashboardSection 개선
**파일:** `frontend/src/components/layout/DashboardSection.js`

**개선 사항:**
- [ ] 헤더 디자인 개선
- [ ] 접기/펼치기 애니메이션 개선
- [ ] 그림자 효과 추가
- [ ] 아이콘 스타일 통일

**예상 시간:** 1시간

#### 3.3 ManagementCard 개선
**파일:** `frontend/src/components/admin/AdminDashboard.js` (인라인 스타일)

**개선 사항:**
- [ ] 카드 레이아웃 개선
- [ ] 아이콘 그라데이션 배경
- [ ] 호버 효과 강화
- [ ] 클릭 피드백 추가
- [ ] 로딩 상태 표시

**예상 시간:** 2시간

#### 3.4 대시보드 헤더 개선
**작업 내용:**
- [ ] 타이틀 타이포그래피 개선
- [ ] 버튼 스타일 통일
- [ ] 반응형 레이아웃 개선

**예상 시간:** 1시간

#### 3.5 전체 레이아웃 조정
**작업 내용:**
- [ ] 섹션 간격 조정
- [ ] 그리드 레이아웃 최적화
- [ ] 여백 및 패딩 조정
- [ ] 반응형 브레이크포인트 개선

**예상 시간:** 2시간

---

### Phase 4: 차트 추가 (1일, 8시간)

#### 4.1 차트 라이브러리 선택 및 설치
**선택지:**
- Chart.js (추천) - 가볍고 사용하기 쉬움
- Recharts - React 친화적
- ApexCharts - 고급 기능

**결정:** Chart.js

**설치:**
```bash
npm install chart.js react-chartjs-2
```

**예상 시간:** 0.5시간

#### 4.2 라인 차트: 최근 7일 상담 추이
**파일:** `frontend/src/components/admin/charts/ConsultationTrendChart.js`

**기능:**
- [ ] API 연동 (`/api/admin/statistics/consultation-trend?days=7`)
- [ ] 차트 렌더링
- [ ] 툴팁 커스터마이징
- [ ] 반응형 디자인
- [ ] 로딩 상태

**예상 시간:** 2시간

#### 4.3 바 차트: 상담사별 상담 건수
**파일:** `frontend/src/components/admin/charts/ConsultantPerformanceChart.js`

**기능:**
- [ ] API 연동 (`/api/admin/statistics/consultant-performance`)
- [ ] 차트 렌더링
- [ ] 상위 10명만 표시
- [ ] 클릭 시 상세 정보
- [ ] 반응형 디자인

**예상 시간:** 2시간

#### 4.4 파이 차트: 상담 유형별 분포
**파일:** `frontend/src/components/admin/charts/ConsultationTypeChart.js`

**기능:**
- [ ] API 연동 (`/api/admin/statistics/consultation-types`)
- [ ] 차트 렌더링
- [ ] 범례 커스터마이징
- [ ] 퍼센트 표시
- [ ] 반응형 디자인

**예상 시간:** 2시간

#### 4.5 차트 통합
**작업 내용:**
- [ ] AdminDashboard에 차트 추가
- [ ] 차트 섹션 레이아웃
- [ ] 차트 간 간격 조정
- [ ] 전체 테스트

**예상 시간:** 1.5시간

---

### Phase 5: 인터랙션 및 애니메이션 (0.5일, 4시간)

#### 5.1 호버 효과 강화
**작업 내용:**
- [ ] 카드 호버 시 transform
- [ ] 그림자 변화
- [ ] 색상 변화
- [ ] 아이콘 애니메이션

**예상 시간:** 1시간

#### 5.2 클릭 피드백
**작업 내용:**
- [ ] 버튼 클릭 시 ripple 효과
- [ ] 카드 클릭 시 scale 효과
- [ ] 로딩 스피너 추가

**예상 시간:** 1시간

#### 5.3 페이지 로딩 애니메이션
**작업 내용:**
- [ ] 스켈레톤 UI 추가
- [ ] Fade-in 애니메이션
- [ ] Stagger 애니메이션 (순차 표시)

**예상 시간:** 1시간

#### 5.4 스크롤 애니메이션
**작업 내용:**
- [ ] Intersection Observer 활용
- [ ] 스크롤 시 요소 fade-in
- [ ] 부드러운 스크롤

**예상 시간:** 1시간

---

### Phase 6: 반응형 디자인 최적화 (0.5일, 4시간)

#### 6.1 모바일 레이아웃
**작업 내용:**
- [ ] 그리드 1열로 변경
- [ ] 폰트 크기 조정
- [ ] 터치 영역 확대
- [ ] 네비게이션 개선

**예상 시간:** 1.5시간

#### 6.2 태블릿 레이아웃
**작업 내용:**
- [ ] 그리드 2열로 변경
- [ ] 간격 조정
- [ ] 차트 크기 조정

**예상 시간:** 1시간

#### 6.3 데스크탑 최적화
**작업 내용:**
- [ ] 넓은 화면 활용
- [ ] 사이드바 고정
- [ ] 멀티 컬럼 레이아웃

**예상 시간:** 1시간

#### 6.4 반응형 테스트
**작업 내용:**
- [ ] Chrome DevTools 테스트
- [ ] 실제 기기 테스트
- [ ] 브레이크포인트 조정

**예상 시간:** 0.5시간

---

### Phase 7: 테스트 및 최적화 (0.5일, 4시간)

#### 7.1 브라우저 테스트
**작업 내용:**
- [ ] Chrome 테스트
- [ ] Safari 테스트
- [ ] Firefox 테스트
- [ ] Edge 테스트

**예상 시간:** 1시간

#### 7.2 성능 최적화
**작업 내용:**
- [ ] CSS 최적화
- [ ] 불필요한 리렌더링 방지
- [ ] 이미지 최적화
- [ ] 번들 크기 확인

**예상 시간:** 1시간

#### 7.3 접근성 개선
**작업 내용:**
- [ ] ARIA 레이블 추가
- [ ] 키보드 네비게이션
- [ ] 색상 대비 확인
- [ ] 스크린 리더 테스트

**예상 시간:** 1시간

#### 7.4 최종 검증
**작업 내용:**
- [ ] 전체 기능 테스트
- [ ] 디자인 가이드 준수 확인
- [ ] 표준화 체크리스트 확인
- [ ] 사용자 피드백 수집

**예상 시간:** 1시간

---

## 📊 전체 일정

| Phase | 작업 내용 | 예상 시간 | 우선순위 |
|-------|----------|----------|---------|
| Phase 1 | 디자인 표준 재작성 | 8시간 (1일) | 🔥 최우선 |
| Phase 2 | CSS 변수 시스템 구축 | 4시간 (0.5일) | 🔥 최우선 |
| Phase 3 | 컴포넌트 시각적 개선 | 8시간 (1일) | ⭐ 높음 |
| Phase 4 | 차트 추가 | 8시간 (1일) | ⭐ 높음 |
| Phase 5 | 인터랙션 및 애니메이션 | 4시간 (0.5일) | 📊 중간 |
| Phase 6 | 반응형 디자인 최적화 | 4시간 (0.5일) | 📊 중간 |
| Phase 7 | 테스트 및 최적화 | 4시간 (0.5일) | ✅ 낮음 |

**총 예상 시간:** 40시간 (5일)

---

## 🎨 디자인 미리보기

### 개선 전 vs 개선 후

#### 1. StatCard
```
[개선 전]
┌─────────────────┐
│ 👤 123          │
│ 총 사용자        │
└─────────────────┘

[개선 후]
┌─────────────────┐
│ 🎨 [그라데이션]  │
│ 👤 123 ↑12.5%  │
│ 총 사용자        │
│ [애니메이션]     │
└─────────────────┘
```

#### 2. 차트 섹션
```
[개선 전]
- 차트 없음
- 숫자만 표시

[개선 후]
┌─────────────────────────┐
│ 📈 최근 7일 상담 추이    │
│ [라인 차트]             │
├─────────────────────────┤
│ 📊 상담사별 상담 건수    │
│ [바 차트]               │
├─────────────────────────┤
│ 🥧 상담 유형별 분포      │
│ [파이 차트]             │
└─────────────────────────┘
```

#### 3. ManagementCard
```
[개선 전]
┌─────────────────┐
│ 🔧              │
│ 스케줄 관리      │
│ 설명...         │
└─────────────────┘

[개선 후]
┌─────────────────┐
│ 🎨 [그라데이션]  │
│ 🔧 [애니메이션]  │
│ 스케줄 관리      │
│ 설명...         │
│ [호버 효과]      │
└─────────────────┘
```

---

## ✅ 체크리스트

### Phase 1: 디자인 표준 재작성
- [ ] `ADMIN_DASHBOARD_DESIGN_STANDARD.md` 작성
- [ ] `COMPONENT_STYLE_GUIDE.md` 작성
- [ ] `LAYOUT_GUIDE.md` 작성
- [ ] `INTERACTION_GUIDE.md` 작성
- [ ] `CHART_DESIGN_GUIDE.md` 작성

### Phase 2: CSS 변수 시스템 구축
- [ ] 기존 CSS 분석 완료
- [ ] `admin-dashboard-v3.css` 작성
- [ ] 기존 CSS 리팩토링 완료

### Phase 3: 컴포넌트 시각적 개선
- [ ] StatCard 개선
- [ ] DashboardSection 개선
- [ ] ManagementCard 개선
- [ ] 대시보드 헤더 개선
- [ ] 전체 레이아웃 조정

### Phase 4: 차트 추가
- [ ] Chart.js 설치
- [ ] 라인 차트 구현
- [ ] 바 차트 구현
- [ ] 파이 차트 구현
- [ ] 차트 통합

### Phase 5: 인터랙션 및 애니메이션
- [ ] 호버 효과 강화
- [ ] 클릭 피드백
- [ ] 페이지 로딩 애니메이션
- [ ] 스크롤 애니메이션

### Phase 6: 반응형 디자인 최적화
- [ ] 모바일 레이아웃
- [ ] 태블릿 레이아웃
- [ ] 데스크탑 최적화
- [ ] 반응형 테스트

### Phase 7: 테스트 및 최적화
- [ ] 브라우저 테스트
- [ ] 성능 최적화
- [ ] 접근성 개선
- [ ] 최종 검증

---

## 🚨 주의사항

### 필수 준수 사항
1. ✅ **CSS 변수만 사용** - 하드코딩 절대 금지
2. ✅ **컴포넌트 분리** - 재사용 가능한 구조
3. ✅ **다중 테넌트 지원** - 테넌트별 데이터 격리
4. ✅ **반응형 디자인** - 모든 기기 대응
5. ✅ **접근성** - WCAG 2.1 AA 준수
6. ✅ **성능** - 초기 로딩 3초 이내

### 금지 사항
1. ❌ **인라인 스타일** - style 속성 사용 금지
2. ❌ **하드코딩된 색상** - #ffffff 같은 직접 값 금지
3. ❌ **매직 넘버** - 의미 없는 숫자 금지
4. ❌ **중복 코드** - DRY 원칙 준수
5. ❌ **!important** - 최대한 사용 자제

---

## 📚 참고 자료

### 디자인 시스템
- [Material Design](https://material.io/design)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Ant Design](https://ant.design/)

### CSS 프레임워크
- [Tailwind CSS](https://tailwindcss.com/)
- [Bootstrap](https://getbootstrap.com/)

### 차트 라이브러리
- [Chart.js 공식 문서](https://www.chartjs.org/)
- [React Chart.js 2](https://react-chartjs-2.js.org/)

### 애니메이션
- [Framer Motion](https://www.framer.com/motion/)
- [React Spring](https://www.react-spring.io/)

---

## 📝 변경 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2025-12-03 | 1.0 | 초안 작성 | AI Assistant |

---

**작성자:** AI Assistant  
**최종 수정:** 2025-12-03  
**다음 검토:** Phase 1 완료 후

