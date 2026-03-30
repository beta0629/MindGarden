# 공통 컴포넌트 통합 가이드

## 개요

현재 프로젝트에서 동일한 기능을 하는 여러 컴포넌트들이 중복으로 존재하여 일관성 문제가 발생하고 있습니다. 이 문서는 이러한 중복 컴포넌트들을 통합하고 표준화하는 방향을 제시합니다.

## 현재 문제점

### 1. 알림 시스템 중복
- **Toast.js**: 기본 토스트 알림
- **DuplicateLoginAlert.js**: 중복 로그인 전용 알림
- **NotificationTest.js**: 테스트용 알림
- **각 컴포넌트별 개별 알림**: 다양한 스타일과 동작

**문제점:**
- 일관성 없는 디자인
- 중복된 CSS 스타일
- 다른 알림 처리 로직

### 2. 로딩 시스템 중복
- **LoadingSpinner.js**: 공통 로딩 스피너 (가이드 있음)
- **CommonLoading.js**: 또 다른 로딩 컴포넌트
- **각 컴포넌트별 개별 로딩**: 다양한 스타일

**문제점:**
- 로딩 UI 일관성 부족
- 중복된 애니메이션 코드
- 반응형 처리 불일치

### 3. 헤더 시스템 중복
- **SimpleHeader.js**: 기본 헤더
- **ErpHeader.js**: ERP 전용 헤더
- **DashboardHeader.js**: 대시보드 전용 헤더
- **Homepage.js 내장 헤더**: 홈페이지 전용

**문제점:**
- 역할별로 다른 헤더 구조
- 중복된 네비게이션 로직
- 일관성 없는 사용자 경험

### 4. 모달 시스템 중복
- **BaseModal.js**: 기본 모달 (새로 생성됨)
- **ConfirmModal.js**: 확인 모달
- **ScheduleDetailModal.js**: 스케줄 상세 모달
- **각 컴포넌트별 개별 모달**: 다양한 스타일

**문제점:**
- z-index 충돌
- 일관성 없는 모달 디자인
- 중복된 모달 로직

## 통합 방향

### 1. 알림 시스템 통합

#### 표준 알림 컴포넌트
```jsx
// UnifiedNotification.js
<UnifiedNotification
  type="toast" | "modal" | "banner"
  variant="success" | "error" | "warning" | "info"
  message="알림 메시지"
  duration={5000}
  position="top-right" | "top-center" | "bottom-right"
  actions={[{ label: "확인", onClick: handleConfirm }]}
/>
```

#### 통합 대상
- `Toast.js` → `UnifiedNotification` (toast 타입)
- `DuplicateLoginAlert.js` → `UnifiedNotification` (modal 타입)
- `NotificationTest.js` → 제거 (개발용)

### 2. 로딩 시스템 통합

#### 표준 로딩 컴포넌트
```jsx
// UnifiedLoading.js
<UnifiedLoading
  variant="spinner" | "dots" | "pulse" | "bars"
  size="small" | "medium" | "large"
  text="로딩 중..."
  fullscreen={false}
  overlay={true}
/>
```

#### 통합 대상
- `LoadingSpinner.js` → `UnifiedLoading` (기존 가이드 활용)
- `CommonLoading.js` → 제거 또는 `UnifiedLoading`으로 통합

### 3. 헤더 시스템 통합

#### 표준 헤더 컴포넌트
```jsx
// UnifiedHeader.js
<UnifiedHeader
  variant="default" | "dashboard" | "erp" | "minimal"
  title="페이지 제목"
  subtitle="부제목"
  showBackButton={true}
  showUserMenu={true}
  showHamburgerMenu={true}
  actions={[<button>액션</button>]}
/>
```

#### 통합 대상
- `SimpleHeader.js` → `UnifiedHeader` (default 타입)
- `ErpHeader.js` → `UnifiedHeader` (erp 타입)
- `DashboardHeader.js` → `UnifiedHeader` (dashboard 타입)
- `Homepage.js` 내장 헤더 → `UnifiedHeader` (minimal 타입)

### 4. 모달 시스템 통합

#### 표준 모달 컴포넌트
```jsx
// UnifiedModal.js
<UnifiedModal
  variant="default" | "confirm" | "form" | "detail"
  size="small" | "medium" | "large" | "fullscreen"
  title="모달 제목"
  showCloseButton={true}
  backdropClick={true}
  zIndex={1000}
>
  {children}
</UnifiedModal>
```

#### 통합 대상
- `BaseModal.js` → `UnifiedModal` (default 타입)
- `ConfirmModal.js` → `UnifiedModal` (confirm 타입)
- `ScheduleDetailModal.js` → `UnifiedModal` (detail 타입)

## 구현 계획

### Phase 1: 알림 시스템 통합
1. `UnifiedNotification` 컴포넌트 생성
2. 기존 알림 컴포넌트들을 `UnifiedNotification`으로 마이그레이션
3. 중복 CSS 정리
4. 테스트 및 검증

### Phase 2: 로딩 시스템 통합
1. `UnifiedLoading` 컴포넌트 생성 (기존 `LoadingSpinner` 가이드 활용)
2. 기존 로딩 컴포넌트들을 `UnifiedLoading`으로 마이그레이션
3. 중복 CSS 정리
4. 테스트 및 검증

### Phase 3: 헤더 시스템 통합
1. `UnifiedHeader` 컴포넌트 생성
2. 기존 헤더 컴포넌트들을 `UnifiedHeader`으로 마이그레이션
3. 네비게이션 로직 통합
4. 테스트 및 검증

### Phase 4: 모달 시스템 통합
1. `UnifiedModal` 컴포넌트 생성
2. 기존 모달 컴포넌트들을 `UnifiedModal`으로 마이그레이션
3. z-index 관리 시스템 구축
4. 테스트 및 검증

## 디자인 시스템 적용

### CSS 클래스 명명 규칙
```css
/* BEM 네이밍 컨벤션 적용 */
.mg-notification { /* Block */ }
.mg-notification--toast { /* Modifier */ }
.mg-notification__content { /* Element */ }

.mg-loading { /* Block */ }
.mg-loading--spinner { /* Modifier */ }
.mg-loading__icon { /* Element */ }

.mg-header { /* Block */ }
.mg-header--dashboard { /* Modifier */ }
.mg-header__title { /* Element */ }

.mg-modal { /* Block */ }
.mg-modal--confirm { /* Modifier */ }
.mg-modal__body { /* Element */ }
```

### CSS 변수 활용
```css
/* 기존 디자인 시스템 변수 활용 */
--color-primary
--color-success
--color-warning
--color-danger
--spacing-sm
--spacing-md
--spacing-lg
--border-radius-sm
--border-radius-md
--border-radius-lg
--z-index-modal
--z-index-dropdown
--z-index-tooltip
```

## 마이그레이션 가이드

### 1. 기존 컴포넌트 사용 중단
```jsx
// Before
import Toast from '../common/Toast';
import LoadingSpinner from '../common/LoadingSpinner';
import SimpleHeader from '../layout/SimpleHeader';

// After
import { UnifiedNotification, UnifiedLoading, UnifiedHeader } from '../common/unified';
```

### 2. Props 매핑
```jsx
// Toast → UnifiedNotification
<Toast type="success" message="성공!" />
<UnifiedNotification variant="success" message="성공!" type="toast" />

// LoadingSpinner → UnifiedLoading
<LoadingSpinner text="로딩 중..." size="medium" />
<UnifiedLoading text="로딩 중..." size="medium" variant="spinner" />

// SimpleHeader → UnifiedHeader
<SimpleHeader />
<UnifiedHeader variant="default" />
```

### 3. CSS 클래스 업데이트
```css
/* 기존 클래스 제거 */
.toast-container { /* 제거 */ }
.loading-spinner-container { /* 제거 */ }
.simple-header { /* 제거 */ }

/* 새로운 클래스 사용 */
.mg-notification { /* 사용 */ }
.mg-loading { /* 사용 */ }
.mg-header { /* 사용 */ }
```

## 테스트 계획

### 1. 단위 테스트
- 각 통합 컴포넌트의 기본 기능 테스트
- Props 전달 및 이벤트 핸들링 테스트
- 접근성 테스트

### 2. 통합 테스트
- 기존 페이지에서 새 컴포넌트 동작 확인
- 브라우저 호환성 테스트
- 반응형 디자인 테스트

### 3. 사용자 테스트
- 실제 사용 시나리오 테스트
- 성능 테스트
- 사용자 경험 일관성 확인

## 성능 최적화

### 1. 번들 크기 최적화
- 중복 CSS 제거
- 사용하지 않는 컴포넌트 제거
- Tree shaking 최적화

### 2. 런타임 성능
- 불필요한 리렌더링 방지
- 메모이제이션 적용
- 이벤트 리스너 최적화

### 3. 메모리 관리
- 컴포넌트 언마운트 시 정리
- 이벤트 리스너 정리
- 타이머 정리

## 롤백 계획

### 1. 단계별 롤백
- 각 Phase별로 독립적인 롤백 가능
- 기존 컴포넌트 보존
- 점진적 마이그레이션

### 2. 문제 발생 시 대응
- 즉시 기존 컴포넌트로 복원
- 문제 분석 및 수정
- 재배포

## 결론

공통 컴포넌트 통합을 통해 다음과 같은 이점을 얻을 수 있습니다:

1. **일관성**: 전체 애플리케이션에서 일관된 사용자 경험
2. **유지보수성**: 중복 코드 제거로 유지보수 비용 절감
3. **성능**: 번들 크기 감소 및 런타임 성능 향상
4. **개발 효율성**: 표준화된 컴포넌트로 개발 속도 향상
5. **품질**: 통합된 테스트 및 품질 관리

이 가이드를 따라 단계적으로 통합을 진행하여 더 나은 코드베이스를 구축하겠습니다.
