# 🚨 하드코딩된 스타일 정리 계획

## 📊 현황 분석

### 발견된 문제
- **!important**: 20개 파일, 751개 사용
- **하드코딩 padding**: 92개 파일, 1,181개 사용  
- **하드코딩 font-size**: 96개 파일, 1,102개 사용
- **하드코딩 margin**: 88개 파일, 803개 사용

**총 3,837개의 하드코딩된 스타일**

## 🎯 정리 전략

### 1단계: !important 제거 (우선순위: 높음)
**20개 파일, 751개 !important**

**우선순위 파일들:**
- `frontend/src/index.css`
- `frontend/src/components/common/Toast.css`
- `frontend/src/components/layout/SimpleHeader.css`
- `frontend/src/components/admin/UserManagement.css`
- `frontend/src/components/admin/MappingManagement.css`

### 2단계: CSS 변수로 변환
**모든 하드코딩된 픽셀 값을 CSS 변수로 변환**

**변환 규칙:**
```css
/* Before (하드코딩) */
padding: 16px;
font-size: 14px;
margin: 8px;

/* After (CSS 변수) */
padding: var(--spacing-md);
font-size: var(--font-size-base);
margin: var(--spacing-sm);
```

### 3단계: BEM 네이밍 적용
**클래스명 충돌 방지**

**변환 규칙:**
```css
/* Before (일반 클래스) */
.summary-card { ... }

/* After (BEM 네이밍) */
.payment-sessions__summary-card { ... }
```

### 4단계: 새 디자인 시스템 적용
**표준 컴포넌트 클래스 사용**

**적용 규칙:**
- 카드: `.card`, `.stat-card`, `.management-card`
- 버튼: `.btn`, `.btn--primary`, `.btn--secondary`
- 모달: `.modal`, `.modal__header`, `.modal__body`

## 📋 실행 계획

### Phase 1: 핵심 컴포넌트 (1주)
1. Layout 컴포넌트들
2. Common 컴포넌트들  
3. Dashboard 컴포넌트들

### Phase 2: 페이지 컴포넌트 (1주)
1. Admin 페이지들
2. Client 페이지들
3. Consultant 페이지들

### Phase 3: 유틸리티 컴포넌트 (1주)
1. Modal 컴포넌트들
2. Form 컴포넌트들
3. Chart 컴포넌트들

## ✅ 검증 기준

1. **!important 사용 0개**
2. **하드코딩된 픽셀 값 0개**
3. **CSS 변수 사용 100%**
4. **BEM 네이밍 적용**
5. **새 디자인 시스템 준수**

## 🚀 기대 효과

1. **유지보수성 향상**
2. **CSS 충돌 제거**
3. **일관된 디자인**
4. **반응형 디자인 개선**
5. **성능 최적화**
