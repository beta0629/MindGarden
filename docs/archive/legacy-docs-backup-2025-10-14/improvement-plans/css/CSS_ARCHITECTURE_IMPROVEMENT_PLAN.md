# CSS 아키텍처 개선 계획서

## 📋 개요

현재 MindGarden 프로젝트의 CSS 충돌 및 퍼블리싱 문제를 근본적으로 해결하기 위한 체계적인 개선 계획입니다.

## 🚨 현재 문제점

### 1. CSS 충돌 문제
- **전역 CSS 오염**: `index.css`에 과도한 전역 스타일
- **클래스명 충돌**: 동일한 클래스명이 여러 컴포넌트에서 사용
- **z-index 지옥**: 모달, 드롭다운, 오버레이의 z-index 충돌
- **CSS 우선순위 혼란**: `!important` 남발로 인한 스타일 덮어쓰기

### 2. 유지보수성 문제
- **스타일 중복**: 같은 스타일이 여러 곳에 반복 정의
- **컴포넌트 격리 부족**: 각 컴포넌트가 독립적으로 스타일링되지 않음
- **일관성 부족**: 색상, 간격, 폰트 등이 통일되지 않음

## 🎯 개선 목표

1. **CSS 충돌 완전 제거**
2. **컴포넌트별 스타일 격리**
3. **일관된 디자인 시스템 구축**
4. **유지보수성 향상**
5. **성능 최적화**

## 🏗️ 개선 전략

### Phase 1: 즉시 적용 (1-2주)

#### 1.1 CSS 변수 시스템 구축

```css
/* src/styles/variables.css */
:root {
  /* Z-Index 레이어 시스템 */
  --z-base: 0;
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
  --z-toast: 1080;

  /* 색상 시스템 */
  --color-primary: #007bff;
  --color-secondary: #6c757d;
  --color-success: #28a745;
  --color-danger: #dc3545;
  --color-warning: #ffc107;
  --color-info: #17a2b8;
  --color-light: #f8f9fa;
  --color-dark: #343a40;

  /* 간격 시스템 */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-xxl: 48px;

  /* 폰트 시스템 */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-xxl: 1.5rem;

  /* 보더 반경 */
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  --border-radius-xl: 16px;

  /* 그림자 */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.12);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
}
```

#### 1.2 컴포넌트별 네임스페이스 적용

```css
/* 각 컴포넌트마다 고유한 접두사 사용 */
.mg-recurring-expense-modal { }
.mg-specialty-management-modal { }
.mg-erp-report-modal { }
.mg-performance-metrics-modal { }
.mg-branch-mapping-modal { }
```

#### 1.3 중복 CSS 제거

```css
/* 기존 중복 제거 */
/* ❌ 제거할 중복 스타일들 */
body.modal-open { /* 중복 1 */ }
body.modal-open { /* 중복 2 */ }

/* ✅ 통합된 단일 정의 */
body.modal-open {
  overflow: hidden !important;
  position: fixed !important;
  width: 100% !important;
  height: 100% !important;
  top: 0 !important;
  left: 0 !important;
}
```

### Phase 2: 구조 개선 (2-3주)

#### 2.1 CSS Modules 도입

```javascript
// RecurringExpenseModal.module.css
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: var(--z-modal-backdrop);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  background: white;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-xl);
  max-width: 90vw;
  max-height: 90vh;
  width: 800px;
  z-index: var(--z-modal);
  position: relative;
  overflow: hidden;
}
```

```javascript
// RecurringExpenseModal.js
import styles from './RecurringExpenseModal.module.css';

return (
  <div className={styles.overlay}>
    <div className={styles.modal}>
      {/* 모달 내용 */}
    </div>
  </div>
);
```

#### 2.2 BEM 방법론 적용

```css
/* Block__Element--Modifier */
.mg-modal { }
.mg-modal__overlay { }
.mg-modal__content { }
.mg-modal__header { }
.mg-modal__body { }
.mg-modal__footer { }
.mg-modal--large { }
.mg-modal--small { }
.mg-modal__close-btn { }
.mg-modal__close-btn--hover { }
```

#### 2.3 ITCSS 구조 도입

```
src/styles/
├── settings/           # 변수 정의
│   ├── _variables.css
│   ├── _colors.css
│   └── _typography.css
├── tools/             # 믹스인, 함수
│   ├── _mixins.css
│   └── _functions.css
├── generic/           # 리셋, normalize
│   ├── _reset.css
│   └── _normalize.css
├── elements/          # 기본 HTML 요소
│   ├── _headings.css
│   ├── _forms.css
│   └── _buttons.css
├── objects/           # 레이아웃 객체
│   ├── _layout.css
│   ├── _grid.css
│   └── _container.css
├── components/        # UI 컴포넌트
│   ├── _modal.css
│   ├── _dropdown.css
│   └── _button.css
└── utilities/         # 유틸리티 클래스
    ├── _spacing.css
    ├── _text.css
    └── _display.css
```

### Phase 3: 고급 개선 (3-4주)

#### 3.1 CSS-in-JS 도입 (선택사항)

```javascript
// styled-components 사용 예시
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: ${props => props.theme.zIndex.modalBackdrop};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Modal = styled.div`
  background: white;
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: ${props => props.theme.shadow.xl};
  max-width: 90vw;
  max-height: 90vh;
  width: 800px;
  z-index: ${props => props.theme.zIndex.modal};
  position: relative;
  overflow: hidden;
`;
```

#### 3.2 디자인 시스템 구축

```javascript
// design-system/tokens.js
export const tokens = {
  colors: {
    primary: {
      50: '#e3f2fd',
      100: '#bbdefb',
      // ... 900: '#0d47a1'
    },
    semantic: {
      success: '#28a745',
      warning: '#ffc107',
      error: '#dc3545',
      info: '#17a2b8'
    }
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  zIndex: {
    dropdown: 1000,
    modalBackdrop: 1040,
    modal: 1050,
    toast: 1080
  }
};
```

## 📁 파일 구조 개선

### 현재 구조
```
frontend/src/
├── index.css (거대한 전역 CSS)
├── components/
│   ├── admin/
│   │   └── AdminDashboard.css
│   ├── finance/
│   │   └── RecurringExpenseModal.css
│   └── ...
```

### 개선된 구조
```
frontend/src/
├── styles/
│   ├── settings/
│   │   ├── _variables.css
│   │   ├── _colors.css
│   │   └── _typography.css
│   ├── generic/
│   │   ├── _reset.css
│   │   └── _normalize.css
│   ├── elements/
│   │   ├── _headings.css
│   │   └── _forms.css
│   ├── objects/
│   │   └── _layout.css
│   ├── components/
│   │   ├── _modal.css
│   │   └── _dropdown.css
│   └── utilities/
│       └── _spacing.css
├── components/
│   ├── admin/
│   │   ├── AdminDashboard.js
│   │   └── AdminDashboard.module.css
│   ├── finance/
│   │   ├── RecurringExpenseModal.js
│   │   └── RecurringExpenseModal.module.css
│   └── ...
└── index.css (최소한의 전역 스타일만)
```

## 🛠️ 실행 계획

### Week 1: 기반 구축
- [ ] CSS 변수 시스템 구축
- [ ] 중복 CSS 제거
- [ ] 컴포넌트별 네임스페이스 적용

### Week 2: 구조 개선
- [ ] CSS Modules 도입
- [ ] BEM 방법론 적용
- [ ] ITCSS 구조 도입

### Week 3: 최적화
- [ ] 성능 최적화
- [ ] 접근성 개선
- [ ] 반응형 디자인 개선

### Week 4: 검증 및 문서화
- [ ] 테스트 및 검증
- [ ] 스타일 가이드 작성
- [ ] 개발자 문서 작성

## 📊 예상 효과

### 정량적 효과
- **CSS 충돌 100% 제거**
- **번들 크기 20-30% 감소**
- **로딩 속도 15-25% 향상**
- **개발 생산성 40-50% 향상**

### 정성적 효과
- **유지보수성 대폭 향상**
- **일관된 디자인 시스템**
- **개발자 경험 개선**
- **코드 품질 향상**

## 🚀 마이그레이션 가이드

### 1단계: 기존 CSS 백업
```bash
# 기존 CSS 백업
cp -r frontend/src frontend/src-backup
```

### 2단계: 점진적 마이그레이션
```javascript
// 1. CSS 변수 도입
// 2. 컴포넌트별 네임스페이스 적용
// 3. CSS Modules 도입
// 4. 중복 제거
```

### 3단계: 검증 및 테스트
```bash
# CSS 충돌 검사
npm run css-lint

# 번들 크기 분석
npm run analyze

# 시각적 회귀 테스트
npm run visual-test
```

## 📝 체크리스트

### Phase 1 체크리스트
- [ ] CSS 변수 시스템 구축 완료
- [ ] 중복 CSS 제거 완료
- [ ] 컴포넌트별 네임스페이스 적용 완료
- [ ] z-index 시스템 표준화 완료

### Phase 2 체크리스트
- [ ] CSS Modules 도입 완료
- [ ] BEM 방법론 적용 완료
- [ ] ITCSS 구조 도입 완료
- [ ] 파일 구조 개선 완료

### Phase 3 체크리스트
- [ ] 디자인 시스템 구축 완료
- [ ] 성능 최적화 완료
- [ ] 접근성 개선 완료
- [ ] 문서화 완료

## 🎯 성공 지표

1. **CSS 충돌 0건**
2. **번들 크기 20% 이상 감소**
3. **로딩 속도 15% 이상 향상**
4. **개발자 만족도 4.5/5 이상**
5. **버그 리포트 50% 이상 감소**

---

**작성일**: 2025-01-30  
**작성자**: AI Assistant  
**버전**: 1.0  
**상태**: 초안
