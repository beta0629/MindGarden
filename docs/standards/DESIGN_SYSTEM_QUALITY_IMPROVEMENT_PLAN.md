# 디자인 시스템 품질 개선 계획

**작성일**: 2025-12-09  
**상태**: 긴급  
**우선순위**: 최우선

---

## 🚨 현재 문제점

### 1. 버튼 스타일 불일치
- `.mg-button` (MGButton.css)
- `.mg-btn` (여러 CSS 파일)
- `.mg-v2-button` (unified-design-tokens.css)
- `.btn-common` (components.css)
- **결과**: 버튼이 제각각으로 표시됨

### 2. 모달 사이즈 불일치
- `.mg-modal` (여러 곳에 정의)
- `.mg-v2-modal` (unified-design-tokens.css)
- 각기 다른 max-width, padding 값
- **결과**: 모달 사이즈가 일관되지 않음

### 3. CSS 파일 분산
- `mindgarden-design-system.css` 파일이 백업만 존재
- 여러 CSS 파일에 중복 정의
- 표준화된 CSS 변수 시스템이 제대로 적용되지 않음

### 4. 디자인 퀄리티 저하
- 하드코딩/인라인 스타일 제거 후 기본 스타일이 없음
- 표준 컴포넌트가 제대로 정의되지 않음
- 일관성 없는 디자인

---

## 🎯 해결 방안

### Phase 0: 레이아웃 및 카드 표준화 (우선 진행)

#### 0.1 표준 레이아웃 시스템 정의
**목표**: 모든 페이지에서 일관된 레이아웃 사용

**표준 레이아웃 클래스**:
```css
/* 컨테이너 */
.mg-container { /* 기본 컨테이너 */ }
.mg-container--sm { max-width: 640px; }
.mg-container--md { max-width: 768px; }
.mg-container--lg { max-width: 1024px; }
.mg-container--xl { max-width: 1280px; }
.mg-container--2xl { max-width: 1536px; }

/* 그리드 레이아웃 */
.mg-grid { /* 기본 그리드 */ }
.mg-grid--cols-1 { grid-template-columns: 1fr; }
.mg-grid--cols-2 { grid-template-columns: repeat(2, 1fr); }
.mg-grid--cols-3 { grid-template-columns: repeat(3, 1fr); }
.mg-grid--cols-4 { grid-template-columns: repeat(4, 1fr); }

/* 대시보드 레이아웃 */
.mg-dashboard-layout { /* 대시보드 기본 레이아웃 */ }
.mg-dashboard-grid { /* 통계 카드 그리드 */ }
```

#### 0.2 표준 카드 시스템 정의
**목표**: 모든 카드가 일관된 스타일과 반응형 동작

**표준 카드 클래스**:
```css
/* 기본 카드 */
.mg-card { /* 기본 카드 스타일 */ }
.mg-card--default { /* 기본 변형 */ }
.mg-card--elevated { /* 그림자 강조 */ }
.mg-card--outlined { /* 테두리 강조 */ }
.mg-card--glass { /* 글래스모피즘 */ }

/* 카드 패딩 */
.mg-card--padding-none { padding: 0; }
.mg-card--padding-small { padding: var(--mg-spacing-sm); }
.mg-card--padding-medium { padding: var(--mg-spacing-md); }
.mg-card--padding-large { padding: var(--mg-spacing-lg); }

/* 카드 구조 */
.mg-card__header { /* 카드 헤더 */ }
.mg-card__body { /* 카드 본문 */ }
.mg-card__footer { /* 카드 푸터 */ }
```

#### 0.3 반응형 브레이크포인트 표준화
**목표**: 모든 컴포넌트가 동일한 브레이크포인트 사용

**표준 브레이크포인트**:
```css
:root {
  --mg-breakpoint-xs: 320px;   /* 모바일 작은 화면 */
  --mg-breakpoint-sm: 640px;   /* 모바일 큰 화면 */
  --mg-breakpoint-md: 768px;   /* 태블릿 */
  --mg-breakpoint-lg: 1024px;  /* 데스크탑 작은 화면 */
  --mg-breakpoint-xl: 1280px;  /* 데스크탑 큰 화면 */
  --mg-breakpoint-2xl: 1536px; /* 데스크탑 매우 큰 화면 */
}
```

**반응형 미디어 쿼리 패턴**:
```css
/* 모바일 우선 설계 */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

#### 0.4 카드 반응형 그리드 시스템
**목표**: 화면 크기에 따라 자동으로 열 수 조정

**표준 그리드 클래스**:
```css
/* 자동 반응형 그리드 */
.mg-grid-responsive {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--mg-spacing-md);
}

/* 모바일: 1열, 태블릿: 2열, 데스크탑: 3열 */
.mg-grid-responsive--auto {
  grid-template-columns: 1fr;
}
@media (min-width: 768px) {
  .mg-grid-responsive--auto {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (min-width: 1024px) {
  .mg-grid-responsive--auto {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

---

### Phase 1: 표준 디자인 시스템 CSS 통합 (1-2일)

#### 1.1 통합 CSS 파일 생성
**목표**: 모든 표준 스타일을 하나의 파일로 통합

**작업 내용**:
1. `frontend/src/styles/mindgarden-design-system.css` 생성
2. 표준 버튼 스타일 통합 (`.mg-button` 기준)
3. 표준 모달 스타일 통합 (`.mg-modal` 기준)
4. 표준 카드, 폼, 테이블 등 모든 컴포넌트 스타일 정의

**표준 클래스 정의**:
```css
/* 버튼 - 단일 표준 */
.mg-button { /* 기본 스타일 */ }
.mg-button--primary { /* Primary 버튼 */ }
.mg-button--secondary { /* Secondary 버튼 */ }
.mg-button--small { /* 작은 크기 */ }
.mg-button--medium { /* 중간 크기 */ }
.mg-button--large { /* 큰 크기 */ }

/* 모달 - 단일 표준 */
.mg-modal-overlay { /* 오버레이 */ }
.mg-modal { /* 모달 컨테이너 */ }
.mg-modal--small { /* 작은 모달: max-width: 400px */ }
.mg-modal--medium { /* 중간 모달: max-width: 600px */ }
.mg-modal--large { /* 큰 모달: max-width: 900px */ }
.mg-modal--fullscreen { /* 전체 화면: max-width: 95vw */ }
```

#### 1.2 CSS 변수 표준화
**목표**: 모든 디자인 토큰을 CSS 변수로 중앙 관리

**작업 내용**:
1. `unified-design-tokens.css`의 변수를 표준으로 사용
2. 모든 하드코딩된 값 제거
3. 일관된 네이밍 규칙 적용 (`--mg-*`)

**표준 변수 예시**:
```css
:root {
  /* 색상 */
  --mg-primary-500: #3b82f6;
  --mg-secondary-500: #6b7280;
  --mg-success-500: #10b981;
  --mg-error-500: #ef4444;
  
  /* 간격 */
  --mg-spacing-xs: 0.25rem;  /* 4px */
  --mg-spacing-sm: 0.5rem;   /* 8px */
  --mg-spacing-md: 1rem;     /* 16px */
  --mg-spacing-lg: 1.5rem;   /* 24px */
  
  /* 모달 사이즈 */
  --mg-modal-small: 400px;
  --mg-modal-medium: 600px;
  --mg-modal-large: 900px;
  
  /* 버튼 높이 */
  --mg-button-height-small: 32px;
  --mg-button-height-medium: 40px;
  --mg-button-height-large: 48px;
}
```

---

### Phase 2: 공통 컴포넌트 표준화 (2-3일)

#### 2.1 MGButton 컴포넌트 개선
**목표**: 모든 버튼이 동일한 스타일 사용

**작업 내용**:
1. `MGButton.js`가 표준 `.mg-button` 클래스만 사용하도록 수정
2. 모든 variant, size에 대한 표준 스타일 정의
3. CSS 변수만 사용 (하드코딩 제거)

**수정 사항**:
```javascript
// MGButton.js - 표준 클래스만 사용
const buttonClasses = [
  'mg-button',
  `mg-button--${variant}`,  // primary, secondary, success, danger
  `mg-button--${size}`,     // small, medium, large
  disabled ? 'mg-button--disabled' : '',
  fullWidth ? 'mg-button--full-width' : '',
  className
].filter(Boolean).join(' ');
```

#### 2.2 UnifiedModal 컴포넌트 개선
**목표**: 모든 모달이 일관된 사이즈 사용

**작업 내용**:
1. `UnifiedModal.js`가 표준 `.mg-modal` 클래스만 사용
2. size prop에 따른 표준 사이즈 적용
3. CSS 변수로 사이즈 관리

**수정 사항**:
```javascript
// UnifiedModal.js - 표준 사이즈 적용
const modalClasses = [
  'mg-modal',
  `mg-modal--${size}`,  // small, medium, large, fullscreen
  variant !== 'default' ? `mg-modal--${variant}` : '',
  className
].filter(Boolean).join(' ');
```

---

### Phase 3: 기존 컴포넌트 마이그레이션 (3-5일)

#### 3.1 버튼 마이그레이션
**목표**: 모든 버튼을 MGButton 컴포넌트로 전환

**작업 순서**:
1. 주요 페이지부터 시작 (Admin, Dashboard)
2. 네이티브 `<button>` → `<MGButton>` 전환
3. 커스텀 버튼 스타일 제거

**마이그레이션 예시**:
```javascript
// Before
<button className="custom-btn" onClick={handleClick}>
  저장
</button>

// After
<MGButton variant="primary" onClick={handleClick}>
  저장
</MGButton>
```

#### 3.2 모달 마이그레이션
**목표**: 모든 모달을 UnifiedModal 컴포넌트로 전환

**작업 순서**:
1. 주요 모달부터 시작
2. 커스텀 모달 → UnifiedModal 전환
3. 사이즈 표준화 (small: 400px, medium: 600px, large: 900px)

---

### Phase 4: 디자인 품질 검증 (1일)

#### 4.1 시각적 일관성 검증
- 모든 버튼이 동일한 스타일인지 확인
- 모든 모달이 표준 사이즈를 사용하는지 확인
- 색상, 간격, 폰트가 일관된지 확인

#### 4.2 반응형 검증
- 모바일, 태블릿, 데스크탑에서 일관된 디자인 확인
- 버튼/모달이 모든 화면 크기에서 올바르게 표시되는지 확인

---

## 📋 실행 계획

### 우선순위 1: 긴급 (오늘)
1. ✅ 표준 디자인 시스템 CSS 파일 생성
2. ✅ 버튼/모달 표준 스타일 정의
3. ✅ CSS 변수 표준화

### 우선순위 2: 높음 (1-2일)
1. MGButton/UnifiedModal 컴포넌트 개선
2. 주요 페이지 버튼/모달 마이그레이션
3. 디자인 품질 검증

### 우선순위 3: 중간 (3-5일)
1. 나머지 컴포넌트 마이그레이션
2. 레거시 CSS 정리
3. 문서화

---

## 🎨 표준 디자인 가이드

### 버튼 표준
- **Primary**: 파란색 배경, 흰색 텍스트
- **Secondary**: 회색 배경, 흰색 텍스트
- **Success**: 녹색 배경, 흰색 텍스트
- **Danger**: 빨간색 배경, 흰색 텍스트
- **크기**: small (32px), medium (40px), large (48px)

### 모달 표준
- **Small**: 400px (간단한 확인/알림)
- **Medium**: 600px (일반 폼/상세 정보)
- **Large**: 900px (복잡한 폼/대시보드)
- **Fullscreen**: 95vw (대용량 콘텐츠)

---

## 📊 성공 지표

1. ✅ 모든 버튼이 동일한 스타일
2. ✅ 모든 모달이 표준 사이즈
3. ✅ CSS 변수만 사용 (하드코딩 0%)
4. ✅ 디자인 퀄리티 향상
5. ✅ 일관된 사용자 경험

---

## ⚠️ 주의사항

1. **점진적 마이그레이션**: 한 번에 모든 것을 바꾸지 말고 단계적으로 진행
2. **테스트 필수**: 각 단계마다 시각적 테스트 수행
3. **백업**: 변경 전 백업 필수
4. **문서화**: 변경 사항 문서화

---

## ✅ 완료된 작업 (2025-12-09)

### Phase 0: 레이아웃 및 카드 표준화 ✅ 완료

1. **표준 디자인 시스템 CSS 파일 생성**
   - ✅ `frontend/src/styles/mindgarden-design-system.css` 생성
   - ✅ 버튼, 모달, 카드, 레이아웃 표준 스타일 정의
   - ✅ 반응형 브레이크포인트 표준화
   - ✅ CSS 변수만 사용 (하드코딩 제거)

2. **표준 레이아웃 시스템 정의**
   - ✅ 컨테이너: `.mg-container` (sm, md, lg, xl, 2xl)
   - ✅ 그리드: `.mg-grid` (cols-1, cols-2, cols-3, cols-4)
   - ✅ 반응형 그리드: `.mg-grid-responsive` (자동 열 수 조정)
   - ✅ 대시보드 레이아웃: `.mg-dashboard-layout`, `.mg-dashboard-grid`

3. **표준 카드 시스템 정의**
   - ✅ 기본 카드: `.mg-card`
   - ✅ 변형: `.mg-card--default`, `.mg-card--elevated`, `.mg-card--outlined`, `.mg-card--glass`
   - ✅ 패딩: `.mg-card--padding-none/small/medium/large`
   - ✅ 구조: `.mg-card__header`, `.mg-card__body`, `.mg-card__footer`
   - ✅ 클릭 가능: `.mg-card--clickable` (호버 효과 포함)

4. **반응형 브레이크포인트 표준화**
   - ✅ 모바일: 640px 미만 (1열 그리드, 전체 너비 버튼)
   - ✅ 태블릿: 768px 이상 (2열 그리드)
   - ✅ 데스크탑: 1024px 이상 (3열 그리드)
   - ✅ 큰 데스크탑: 1280px 이상 (4열 그리드)

5. **CSS 파일 연결**
   - ✅ `frontend/src/styles/main.css`에 `mindgarden-design-system.css` import 추가

**다음 단계**:
- Phase 1: 버튼/모달 표준화 (MGButton, UnifiedModal 컴포넌트 개선)
- Phase 2: 기존 컴포넌트 마이그레이션 (표준 클래스 사용)
- Phase 3: 디자인 품질 검증

---

**작성자**: AI Assistant  
**최종 수정일**: 2025-12-09

