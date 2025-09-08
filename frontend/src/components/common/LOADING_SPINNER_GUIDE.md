# 공통 로딩바 사용 가이드

## 개요
프로젝트 전체에서 일관된 로딩 UI를 제공하기 위해 `LoadingSpinner` 컴포넌트를 공통으로 사용합니다.

## 컴포넌트 위치
```
frontend/src/components/common/LoadingSpinner.js
frontend/src/components/common/LoadingSpinner.css
```

## 사용법

### 기본 사용
```jsx
import LoadingSpinner from '../common/LoadingSpinner';

// 기본 로딩바
<LoadingSpinner text="로딩 중..." size="medium" />
```

### 다양한 스타일
```jsx
// 도트 스타일
<LoadingSpinner variant="dots" text="도트 로딩" size="medium" />

// 펄스 스타일
<LoadingSpinner variant="pulse" text="펄스 로딩" size="large" />

// 바 스타일
<LoadingSpinner variant="bars" text="바 로딩" size="small" />
```

### 크기 옵션
- `small`: 32px
- `medium`: 48px (기본값)
- `large`: 64px

### 특수 스타일 클래스
```jsx
// 전체 화면 로딩
<LoadingSpinner 
    text="전체 화면 로딩 중..." 
    size="large" 
    className="loading-spinner-fullscreen"
/>

// 인라인 로딩 (카드 형태)
<LoadingSpinner 
    text="인라인 로딩" 
    size="medium" 
    className="loading-spinner-inline"
/>

// 텍스트 없음
<LoadingSpinner size="medium" showText={false} />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `text` | string | "로딩 중..." | 표시할 텍스트 |
| `size` | string | "medium" | 크기 (small, medium, large) |
| `variant` | string | "default" | 스타일 (default, dots, pulse, bars) |
| `showText` | boolean | true | 텍스트 표시 여부 |
| `className` | string | "" | 추가 CSS 클래스 |

## 스타일 클래스

### 기본 클래스
- `.loading-spinner-container`: 컨테이너
- `.loading-spinner-icon`: 기본 스피너 아이콘
- `.loading-spinner-text`: 텍스트

### 바리언트별 클래스
- `.loading-dots`: 도트 스타일
- `.loading-pulse`: 펄스 스타일
- `.loading-bars`: 바 스타일

### 특수 클래스
- `.loading-spinner-fullscreen`: 전체 화면 로딩
- `.loading-spinner-inline`: 인라인 로딩 (카드 형태)

## 기존 로딩 UI 교체

### Before (기존)
```jsx
{loading && (
    <div className="loading-overlay">
        <div className="loading-spinner">로딩 중...</div>
    </div>
)}
```

### After (공통 컴포넌트)
```jsx
{loading && (
    <LoadingSpinner 
        text="로딩 중..." 
        size="large" 
        variant="pulse"
        className="loading-spinner-fullscreen"
    />
)}
```

## 적용된 컴포넌트

### ✅ 완료된 컴포넌트
- `ScheduleCalendar`: 전체 화면 로딩 (pulse)
- `ConsultantSelectionStep`: 인라인 로딩 (dots)
- `ConsultantStatus`: 인라인 로딩 (bars)
- `TodayStats`: 인라인 로딩 (dots)

### 🔄 진행 중인 컴포넌트
- 기타 로딩 상태가 있는 컴포넌트들

## CSS 정리

기존 컴포넌트별 로딩 CSS는 제거하고 공통 `LoadingSpinner.css`만 사용합니다.

### 제거된 CSS 클래스
- `.loading-overlay`
- `.loading-spinner`
- `.loading-container`
- `.consultant-status-loading`
- `.stat-item.loading`

## 반응형 지원

모든 로딩바는 반응형으로 설계되어 모바일에서도 적절한 크기로 표시됩니다.

```css
@media (max-width: 768px) {
  .loading-spinner-medium {
    width: 40px;
    height: 40px;
  }
}

@media (max-width: 480px) {
  .loading-spinner-small {
    width: 28px;
    height: 28px;
  }
}
```

## 애니메이션

- **기본 스피너**: 회전 애니메이션 (1.2s)
- **도트**: 바운스 애니메이션 (1.4s)
- **펄스**: 스케일 애니메이션 (1.5s)
- **바**: 웨이브 애니메이션 (1.2s)
- **텍스트**: 페이드 애니메이션 (2s)

## 접근성

- 스크린 리더를 위한 적절한 텍스트 제공
- 애니메이션 감도 설정 고려
- 키보드 네비게이션 지원

## 성능 최적화

- CSS 애니메이션 사용으로 GPU 가속
- 불필요한 리렌더링 방지
- 메모리 효율적인 구현
