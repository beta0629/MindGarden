# MindGarden 디자인 시스템 가이드

**작성일**: 2025년 10월 14일  
**버전**: 2.0  
**작성자**: MindGarden Development Team

---

## 📋 목차

1. [소개](#소개)
2. [색상 시스템](#색상-시스템)
3. [타이포그래피](#타이포그래피)
4. [레이아웃 시스템](#레이아웃-시스템)
5. [컴포넌트 가이드](#컴포넌트-가이드)
6. [대시보드 레이아웃](#대시보드-레이아웃)
7. [반응형 디자인](#반응형-디자인)
8. [사용 예시](#사용-예시)

---

## 소개

MindGarden 디자인 시스템은 **순수 CSS + JavaScript**로 구현된 통일된 UI 프레임워크입니다. 모든 대시보드와 페이지에서 일관된 사용자 경험을 제공하기 위해 설계되었습니다.

### 핵심 원칙

- ✅ **일관성**: 모든 페이지에서 동일한 디자인 패턴 사용
- ✅ **반응형**: 모바일, 태블릿, 데스크탑 완벽 지원
- ✅ **접근성**: 명확한 계층 구조와 가독성
- ✅ **재사용성**: 컴포넌트 기반 설계
- ✅ **성능**: 순수 CSS, 최소한의 JavaScript

### 기술 스택

- **CSS**: CSS Variables, Flexbox, Grid
- **JavaScript**: React 18.2.0
- **애니메이션**: CSS @keyframes
- **아이콘**: Lucide React

---

## 색상 시스템

### 주요 색상

```css
:root {
  /* Main Colors */
  --cream: #F5F5DC;           /* 메인 배경색 */
  --light-beige: #FDF5E6;     /* 보조 배경색 */
  --cocoa: #8B4513;           /* 텍스트 및 강조색 */
  --olive-green: #808000;     /* 버튼 및 액센트 */
  --mint-green: #98FB98;      /* 포인트 색상 */
  --soft-mint: #B6E5D8;       /* 부드러운 액센트 */
  
  /* Text Colors */
  --dark-gray: #2F2F2F;       /* 주요 텍스트 */
  --medium-gray: #6B6B6B;     /* 보조 텍스트 */
  --light-cream: #FFFEF7;     /* 밝은 배경 */
}
```

### 상태별 색상

```css
/* 상태 색상 */
--status-active: #10b981;      /* 활성 - 녹색 */
--status-pending: #f59e0b;     /* 대기 - 주황색 */
--status-inactive: #6b7280;    /* 비활성 - 회색 */
--status-error: #ef4444;       /* 오류 - 빨간색 */
```

### 사용 예시

```jsx
// 성공 메시지
<div style={{ color: '#10b981' }}>상담 예약이 완료되었습니다.</div>

// 에러 메시지
<div style={{ color: '#ef4444' }}>입력 정보를 확인해주세요.</div>
```

---

## 타이포그래피

### 헤딩 스타일

```css
.mg-h1 { font-size: 3rem; font-weight: 700; }      /* 48px */
.mg-h2 { font-size: 2.5rem; font-weight: 700; }    /* 40px */
.mg-h3 { font-size: 2rem; font-weight: 600; }      /* 32px */
.mg-h4 { font-size: 1.5rem; font-weight: 600; }    /* 24px */
.mg-h5 { font-size: 1.25rem; font-weight: 600; }   /* 20px */
.mg-h6 { font-size: 1rem; font-weight: 600; }      /* 16px */
```

### 본문 텍스트

```css
.mg-body-large { font-size: 1.125rem; }   /* 18px */
.mg-body-medium { font-size: 1rem; }      /* 16px */
.mg-body-small { font-size: 0.875rem; }   /* 14px */
.mg-text-xs { font-size: 0.75rem; }       /* 12px */
```

### 모바일 반응형

```css
@media (max-width: 768px) {
  .mg-h1 { font-size: 2rem; }      /* 32px */
  .mg-h2 { font-size: 1.75rem; }   /* 28px */
  .mg-h3 { font-size: 1.5rem; }    /* 24px */
  .mg-h4 { font-size: 1.25rem; }   /* 20px */
}
```

---

## 레이아웃 시스템

### 스페이싱 (Spacing)

```css
:root {
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 1rem;      /* 16px */
  --spacing-lg: 1.5rem;    /* 24px */
  --spacing-xl: 2rem;      /* 32px */
  --spacing-xxl: 3rem;     /* 48px */
}
```

### Border Radius

```css
:root {
  --radius-sm: 0.25rem;    /* 4px */
  --radius-md: 0.5rem;     /* 8px */
  --radius-lg: 1rem;       /* 16px */
  --radius-xl: 1.5rem;     /* 24px */
  --radius-full: 50%;      /* 원형 */
}
```

### Shadow

```css
:root {
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
}
```

---

## 컴포넌트 가이드

### 1. 버튼 (Buttons)

#### Primary Button
```jsx
<button className="mg-button mg-button-primary">
  버튼 텍스트
</button>
```

#### 버튼 변형
```jsx
// Outline 버튼
<button className="mg-button mg-button-outline">
  Outline
</button>

// Ghost 버튼
<button className="mg-button mg-button-ghost">
  Ghost
</button>

// Danger 버튼
<button className="mg-button mg-button-danger">
  삭제
</button>
```

#### 버튼 크기
```jsx
<button className="mg-button mg-button-primary mg-button-sm">Small</button>
<button className="mg-button mg-button-primary">Medium</button>
<button className="mg-button mg-button-primary mg-button-lg">Large</button>
```

---

### 2. 카드 (Cards)

#### 기본 카드
```jsx
<div className="mg-card">
  <h3 className="mg-h4">카드 제목</h3>
  <p className="mg-body-medium">카드 내용</p>
</div>
```

#### Glass Card
```jsx
<div className="mg-glass-card">
  <h3 className="mg-h4">Glass 효과 카드</h3>
  <p>글라스모피즘 효과가 적용된 카드</p>
</div>
```

---

### 3. 통계 카드 (Stat Cards)

```jsx
<div className="mg-stats-grid">
  <div className="mg-stat-card">
    <div className="mg-stat-icon">
      <Users size={24} />
    </div>
    <div className="mg-stat-value">2,543</div>
    <div className="mg-stat-label">총 사용자</div>
    <div className="mg-stat-change positive">+12.5%</div>
  </div>
</div>
```

**CSS 클래스**:
- `.mg-stats-grid`: 통계 카드 그리드 컨테이너
- `.mg-stat-card`: 개별 통계 카드
- `.mg-stat-icon`: 아이콘 영역
- `.mg-stat-value`: 숫자 값
- `.mg-stat-label`: 라벨 텍스트
- `.mg-stat-change.positive`: 긍정적 변화 (녹색)
- `.mg-stat-change.negative`: 부정적 변화 (빨간색)

---

### 4. 클라이언트 카드 (Client Cards)

#### 컴팩트 카드 (목록용)
```jsx
<div className="mg-client-card mg-client-card--compact">
  <div className="mg-client-card__avatar">김</div>
  <div className="mg-client-card__info">
    <h4 className="mg-client-card__name">김민지</h4>
    <div className="mg-client-card__status">진행중</div>
  </div>
</div>
```

#### 상세 카드 (메인)
```jsx
<div className="mg-client-card mg-client-card--detailed">
  <div className="mg-client-card__status-badge">진행중</div>
  <div className="mg-client-card__avatar mg-client-card__avatar--large">김</div>
  <h4 className="mg-client-card__name mg-client-card__name--large">김민지</h4>
  <div className="mg-client-card__details">
    {/* 상세 정보 */}
  </div>
</div>
```

---

### 5. 상담사 카드 (Consultant Cards)

#### 컴팩트 카드
```jsx
<div className="mg-consultant-card mg-consultant-card--compact">
  <div className="mg-consultant-card__avatar">김</div>
  <div className="mg-consultant-card__info">
    <h4 className="mg-consultant-card__name">김상담</h4>
    <div className="mg-consultant-card__rating">
      <Star size={14} />
      <span>4.8</span>
    </div>
  </div>
</div>
```

---

### 6. 폼 요소 (Form Elements)

#### Input
```jsx
<div className="mg-form-group">
  <label className="mg-label">이메일</label>
  <input type="email" className="mg-input" placeholder="example@email.com" />
  <span className="mg-form-error">필수 입력 항목입니다.</span>
</div>
```

#### Textarea
```jsx
<textarea className="mg-textarea" rows="4" placeholder="내용을 입력하세요"></textarea>
```

#### Select
```jsx
<select className="mg-select">
  <option>옵션 1</option>
  <option>옵션 2</option>
</select>
```

#### Checkbox & Radio
```jsx
<label className="mg-checkbox">
  <input type="checkbox" />
  <span>동의합니다</span>
</label>

<label className="mg-radio">
  <input type="radio" name="option" />
  <span>옵션 1</span>
</label>
```

---

### 7. 모달 (Modal)

```jsx
import ReactDOM from 'react-dom';

const Modal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="mg-modal-overlay">
      <div className="mg-modal-content">
        <div className="mg-modal-header">
          <h3>모달 제목</h3>
          <button className="mg-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="mg-modal-body">
          모달 내용
        </div>
        <div className="mg-modal-footer">
          <button className="mg-button mg-button-outline" onClick={onClose}>
            취소
          </button>
          <button className="mg-button mg-button-primary">
            확인
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
```

**주의사항**: 모달은 `ReactDOM.createPortal`을 사용하여 `document.body`에 직접 렌더링해야 z-index 문제를 방지할 수 있습니다.

---

### 8. 테이블 (Tables)

#### 기본 테이블
```jsx
<div className="mg-table-container">
  <table className="mg-table">
    <thead>
      <tr>
        <th>이름</th>
        <th>이메일</th>
        <th>상태</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td data-label="이름">김민지</td>
        <td data-label="이메일">kim@example.com</td>
        <td data-label="상태">활성</td>
      </tr>
    </tbody>
  </table>
</div>
```

**중요**: 모바일에서 카드 스타일로 전환되려면 각 `<td>`에 `data-label` 속성이 필수입니다.

#### 줄무늬 테이블
```jsx
<table className="mg-table mg-table-striped">
  {/* 테이블 내용 */}
</table>
```

---

### 9. 로딩 (Loading)

#### Spinner
```jsx
<div className="mg-loading-spinner"></div>
```

#### Progress Bar
```jsx
<div className="mg-progress-bar">
  <div className="mg-progress-fill" style={{ width: '75%' }}></div>
</div>
```

#### Skeleton
```jsx
<div className="mg-skeleton"></div>
```

---

### 10. 알림 (Notifications)

```jsx
<div className="mg-notification mg-notification-success">
  <strong>성공!</strong> 작업이 완료되었습니다.
</div>

<div className="mg-notification mg-notification-error">
  <strong>오류!</strong> 문제가 발생했습니다.
</div>

<div className="mg-notification mg-notification-warning">
  <strong>경고!</strong> 주의가 필요합니다.
</div>

<div className="mg-notification mg-notification-info">
  <strong>정보</strong> 새로운 업데이트가 있습니다.
</div>
```

---

## 대시보드 레이아웃

### 통일된 대시보드 구조

모든 대시보드 페이지는 다음 구조를 따라야 합니다:

```jsx
<div className="mg-dashboard-layout">
  {/* 1. 대시보드 헤더 */}
  <div className="mg-dashboard-header">
    <div className="mg-dashboard-header-content">
      <div className="mg-dashboard-header-left">
        <LayoutDashboard size={28} />
        <div>
          <h1 className="mg-dashboard-title">대시보드</h1>
          <p className="mg-dashboard-subtitle">전체 현황을 한눈에 확인하세요</p>
        </div>
      </div>
      <div className="mg-dashboard-header-right">
        <button className="mg-dashboard-icon-btn">
          <Bell size={20} />
        </button>
        <button className="mg-dashboard-icon-btn">
          <Settings size={20} />
        </button>
      </div>
    </div>
  </div>

  {/* 2. 통계 카드 그리드 */}
  <div className="mg-dashboard-stats">
    <div className="mg-dashboard-stat-card">
      <div className="mg-dashboard-stat-icon">
        <Users size={20} />
      </div>
      <div className="mg-dashboard-stat-content">
        <div className="mg-dashboard-stat-value">2,543</div>
        <div className="mg-dashboard-stat-label">총 사용자</div>
        <div className="mg-dashboard-stat-change positive">+12.5%</div>
      </div>
    </div>
    {/* 추가 통계 카드 */}
  </div>

  {/* 3. 콘텐츠 그리드 */}
  <div className="mg-dashboard-content">
    {/* 메인 콘텐츠 */}
    <div className="mg-dashboard-main">
      <div className="mg-dashboard-section">
        <div className="mg-dashboard-section-header">
          <h3 className="mg-dashboard-section-title">최근 활동</h3>
          <a href="#" className="mg-dashboard-section-link">모두 보기</a>
        </div>
        <div className="mg-dashboard-section-content">
          {/* 섹션 내용 */}
        </div>
      </div>
    </div>

    {/* 사이드바 */}
    <div className="mg-dashboard-sidebar">
      <div className="mg-dashboard-section">
        <div className="mg-dashboard-section-header">
          <h3 className="mg-dashboard-section-title">빠른 작업</h3>
        </div>
        <div className="mg-dashboard-section-content">
          {/* 빠른 작업 버튼들 */}
        </div>
      </div>
    </div>
  </div>
</div>
```

### 대시보드 레이아웃 구성 요소

#### 1. 대시보드 헤더
- **클래스**: `.mg-dashboard-header`
- **용도**: 페이지 제목, 아이콘, 액션 버튼
- **구성**: 왼쪽 (제목+서브타이틀), 오른쪽 (아이콘 버튼들)

#### 2. 통계 카드 그리드
- **클래스**: `.mg-dashboard-stats`
- **용도**: 주요 지표 표시 (3-4개)
- **반응형**: 데스크탑 3-4열, 모바일 1열

#### 3. 콘텐츠 그리드
- **클래스**: `.mg-dashboard-content`
- **구성**: 메인 영역 + 사이드바
- **반응형**: 모바일에서 세로 스택

#### 4. 섹션
- **클래스**: `.mg-dashboard-section`
- **구성**: 섹션 헤더 + 섹션 콘텐츠
- **스타일**: 글라스모피즘 효과

---

## 반응형 디자인

### Breakpoints

```css
/* Mobile: < 768px */
@media (max-width: 768px) { }

/* Tablet: 769px - 1024px */
@media (min-width: 769px) and (max-width: 1024px) { }

/* Desktop: > 1024px */
@media (min-width: 1025px) { }
```

### 모바일 우선 원칙

1. **그리드 레이아웃**
   - 데스크탑: 3-4열
   - 태블릿: 2열
   - 모바일: 1열

2. **네비게이션**
   - 데스크탑: 전체 메뉴 표시
   - 모바일: 햄버거 메뉴 또는 숨김

3. **테이블**
   - 데스크탑: 기본 테이블
   - 모바일: 카드 스타일로 자동 전환

4. **통계 카드**
   - 데스크탑: 가로 레이아웃 (아이콘 + 텍스트)
   - 모바일: 세로 레이아웃 (아이콘 위, 텍스트 아래)

---

## 사용 예시

### Admin Dashboard 적용 예시

```jsx
import React from 'react';
import { Users, Calendar, TrendingUp, Bell, Settings } from 'lucide-react';

const AdminDashboard = () => {
  return (
    <div className="mg-dashboard-layout">
      {/* 헤더 */}
      <div className="mg-dashboard-header">
        <div className="mg-dashboard-header-content">
          <div className="mg-dashboard-header-left">
            <LayoutDashboard size={28} style={{ color: 'var(--olive-green)' }} />
            <div>
              <h1 className="mg-dashboard-title">관리자 대시보드</h1>
              <p className="mg-dashboard-subtitle">시스템 전체 현황</p>
            </div>
          </div>
          <div className="mg-dashboard-header-right">
            <button className="mg-dashboard-icon-btn">
              <Bell size={20} />
            </button>
            <button className="mg-dashboard-icon-btn">
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* 통계 */}
      <div className="mg-dashboard-stats">
        <div className="mg-dashboard-stat-card">
          <div className="mg-dashboard-stat-icon">
            <Users size={20} />
          </div>
          <div className="mg-dashboard-stat-content">
            <div className="mg-dashboard-stat-value">2,543</div>
            <div className="mg-dashboard-stat-label">총 사용자</div>
            <div className="mg-dashboard-stat-change positive">+12.5%</div>
          </div>
        </div>
        {/* 추가 통계 카드들 */}
      </div>

      {/* 콘텐츠 */}
      <div className="mg-dashboard-content">
        <div className="mg-dashboard-main">
          {/* 메인 콘텐츠 */}
        </div>
        <div className="mg-dashboard-sidebar">
          {/* 사이드바 */}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
```

---

## 체크리스트

### 새 대시보드 페이지 생성 시

- [ ] `mg-dashboard-layout` 컨테이너 사용
- [ ] 대시보드 헤더 추가 (제목 + 액션 버튼)
- [ ] 통계 카드 그리드 추가 (3-4개)
- [ ] 메인 콘텐츠와 사이드바 구성
- [ ] 각 섹션에 적절한 제목 추가
- [ ] 모바일 테스트 수행
- [ ] 테이블에 `data-label` 속성 추가
- [ ] 모달은 `ReactDOM.createPortal` 사용

### 컴포넌트 생성 시

- [ ] 적절한 `mg-` 클래스 사용
- [ ] CSS Variables 사용 (색상, 간격 등)
- [ ] 반응형 고려
- [ ] 접근성 고려 (ARIA 속성)
- [ ] 일관된 네이밍 규칙 준수

---

## 추가 리소스

- **쇼케이스 페이지**: `/design-system`
- **CSS 파일**: `frontend/src/styles/mindgarden-design-system.css`
- **컴포넌트 폴더**: `frontend/src/components/mindgarden/`

---

## 변경 이력

### v2.0 (2025-10-14)
- 통일된 대시보드 레이아웃 추가
- 클라이언트/상담사 카드 변형 추가
- 모바일 반응형 개선
- 18개 컴포넌트 완성

### v1.0 (2024-08-26)
- 초기 디자인 시스템 구축
- 기본 컴포넌트 정의

---

## 📚 참고 문서

- **[MASTER_GUIDE.md](./MASTER_GUIDE.md)** - 전체 디자인 시스템 개요 (필수)
- **[ICON_LAYOUT_CENTRALIZATION_GUIDE.md](./ICON_LAYOUT_CENTRALIZATION_GUIDE.md)** - 아이콘/레이아웃 중앙화
- **[CARD_SYSTEM_GUIDE.md](./CARD_SYSTEM_GUIDE.md)** - 카드 시스템 상세 가이드
- **[MGBUTTON_MIGRATION_GUIDE.md](./MGBUTTON_MIGRATION_GUIDE.md)** - MGButton 마이그레이션 가이드
- **[MOBILE_OPTIMIZATION_GUIDE.md](./MOBILE_OPTIMIZATION_GUIDE.md)** - 모바일 최적화 가이드
- [디자인 시스템 아키텍처](./DESIGN_SYSTEM_ARCHITECTURE.md)
- [구현 계획](./IMPLEMENTATION_PLAN.md)
- [진행 상황 보고서](./PROGRESS_REPORT.md)

---

**문의**: development@mindgarden.com  
**문서 위치**: `/docs/design-system-v2/MINDGARDEN_DESIGN_SYSTEM_GUIDE.md`
