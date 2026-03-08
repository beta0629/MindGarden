# 상담사 대시보드 Phase 1 컨텐츠 CSS 상세 스펙

**작성일**: 2026-03-09  
**작성자**: Core Designer  
**목적**: Phase 1 컨텐츠 4개의 CSS 구현 상세 스펙 (코더가 그대로 적용 가능한 수준)

**참조**:
- 디자인 스펙: `docs/design-system/v2/CONSULTANT_DASHBOARD_PHASE1_DESIGN_SPEC.md`
- 펜슬 가이드: `docs/design-system/PENCIL_DESIGN_GUIDE.md`
- 디자인 토큰: `frontend/src/styles/unified-design-tokens.css`

---

## 1. 빠른 액션 바 (Quick Action Bar) CSS

### 1.1 컨테이너

```css
.mg-v2-quick-action-bar {
  background: var(--mg-color-surface-main); /* #F5F3EF */
  border: 1px solid var(--mg-color-border-main); /* #D4CFC8 */
  border-radius: 16px;
  padding: 20px 24px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
```

### 1.2 제목 영역

```css
.mg-v2-quick-action-bar__title {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: var(--mg-color-text-main); /* #2C2C2C */
  display: flex;
  align-items: center;
  gap: 8px;
}

.mg-v2-quick-action-bar__title svg {
  width: 18px;
  height: 18px;
  color: var(--mg-color-accent-main); /* #8B7355 */
}
```

### 1.3 버튼 그룹

```css
.mg-v2-quick-action-bar__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
```

### 1.4 버튼 스타일

**주조 버튼 (Primary)**:
```css
.mg-v2-btn-primary {
  background: var(--mg-color-primary-main); /* #3D5246 */
  color: var(--mg-color-background-main); /* #FAF9F7 */
  border: none;
  height: 40px;
  padding: 10px 20px;
  border-radius: 10px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mg-v2-btn-primary:hover {
  background: var(--mg-color-primary-light); /* #4A6354 */
}

.mg-v2-btn-primary svg {
  width: 16px;
  height: 16px;
}
```

**아웃라인 버튼 (Outline)**:
```css
.mg-v2-btn-outline {
  background: transparent;
  color: var(--mg-color-text-main); /* #2C2C2C */
  border: 1px solid var(--mg-color-border-main); /* #D4CFC8 */
  height: 40px;
  padding: 10px 20px;
  border-radius: 10px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mg-v2-btn-outline:hover {
  background: var(--mg-color-surface-main); /* #F5F3EF */
  border-color: var(--mg-color-primary-main); /* #3D5246 */
}

.mg-v2-btn-outline svg {
  width: 16px;
  height: 16px;
}
```

### 1.5 반응형 (모바일)

```css
@media (max-width: 767px) {
  .mg-v2-quick-action-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .mg-v2-quick-action-bar__actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .mg-v2-quick-action-bar__actions .mg-v2-btn {
    flex: 1 1 auto;
    min-width: 120px;
  }
}
```

---

## 2. 미작성 상담일지 알림 (Incomplete Records Alert) CSS

### 2.1 컨테이너

```css
.mg-v2-alert {
  border-radius: 16px;
  padding: 20px 24px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  position: relative;
}

.mg-v2-alert::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: 2px 0 0 2px;
}

.mg-v2-alert--warning {
  background: var(--mg-color-warning-light); /* #FEF3C7 */
  border: 1px solid var(--mg-color-warning-main); /* #F59E0B */
}

.mg-v2-alert--warning::before {
  background: var(--mg-color-warning-main); /* #F59E0B */
}
```

### 2.2 컨텐츠 영역

```css
.mg-v2-alert__content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.mg-v2-alert__icon {
  width: 24px;
  height: 24px;
  color: var(--mg-color-warning-main); /* #F59E0B */
  flex-shrink: 0;
}

.mg-v2-alert__text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mg-v2-alert__text-title {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: var(--mg-color-text-main); /* #2C2C2C */
}

.mg-v2-alert__text-subtitle {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: var(--mg-color-text-secondary); /* #5C6B61 */
}
```

### 2.3 액션 영역

```css
.mg-v2-alert__action {
  flex-shrink: 0;
}
```

### 2.4 반응형 (모바일)

```css
@media (max-width: 767px) {
  .mg-v2-alert {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .mg-v2-alert__action {
    width: 100%;
  }
  
  .mg-v2-alert__action .mg-v2-btn {
    width: 100%;
  }
}
```

---

## 3. 다음 상담 준비 카드 (Next Consultation Prep Card) CSS

### 3.1 컨테이너

```css
.mg-v2-next-consultation-card {
  background: var(--mg-color-surface-main); /* #F5F3EF */
  border: 1px solid var(--mg-color-border-main); /* #D4CFC8 */
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  position: relative;
  transition: border-color 0.2s ease;
}

.mg-v2-next-consultation-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--mg-color-primary-main); /* #3D5246 */
  border-radius: 2px 0 0 2px;
}

.mg-v2-next-consultation-card:hover {
  border-color: var(--mg-color-primary-main); /* #3D5246 */
}
```

### 3.2 헤더

```css
.mg-v2-next-consultation-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.mg-v2-next-consultation-card__title {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: var(--mg-color-text-main); /* #2C2C2C */
  display: flex;
  align-items: center;
  gap: 8px;
}

.mg-v2-next-consultation-card__title svg {
  width: 18px;
  height: 18px;
  color: var(--mg-color-primary-main); /* #3D5246 */
}
```

### 3.3 배지

```css
.mg-v2-badge {
  padding: 4px 12px;
  border-radius: 8px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
}

.mg-v2-badge--primary {
  background: var(--mg-color-primary-main); /* #3D5246 */
  color: var(--mg-color-background-main); /* #FAF9F7 */
}
```

### 3.4 본문 (정보 블록)

```css
.mg-v2-next-consultation-card__body {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
}

.mg-v2-info-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mg-v2-info-block__label {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: var(--mg-color-text-secondary); /* #5C6B61 */
}

.mg-v2-info-block__value {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: var(--mg-color-text-main); /* #2C2C2C */
}
```

### 3.5 푸터

```css
.mg-v2-next-consultation-card__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

.mg-v2-btn-sm {
  height: 36px;
  padding: 8px 16px;
  font-size: 14px;
}
```

### 3.6 반응형 (모바일·태블릿)

```css
@media (max-width: 767px) {
  .mg-v2-next-consultation-card__body {
    grid-template-columns: 1fr;
  }
  
  .mg-v2-next-consultation-card__footer {
    flex-direction: column;
  }
  
  .mg-v2-next-consultation-card__footer .mg-v2-btn {
    width: 100%;
  }
}

@media (min-width: 768px) and (max-width: 1279px) {
  .mg-v2-next-consultation-card__body {
    grid-template-columns: 1fr 1fr;
  }
}
```

---

## 4. 긴급 확인 필요 내담자 (Urgent Clients Alert) CSS

### 4.1 컨테이너

```css
.mg-v2-urgent-clients-section {
  background: var(--mg-color-surface-main); /* #F5F3EF */
  border: 1px solid var(--mg-color-border-main); /* #D4CFC8 */
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  position: relative;
}

.mg-v2-urgent-clients-section::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--mg-color-error-main); /* #EF4444 */
  border-radius: 2px 0 0 2px;
}
```

### 4.2 헤더

```css
.mg-v2-urgent-clients-section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.mg-v2-urgent-clients-section__title {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: var(--mg-color-text-main); /* #2C2C2C */
  display: flex;
  align-items: center;
  gap: 8px;
}

.mg-v2-urgent-clients-section__title svg {
  width: 18px;
  height: 18px;
  color: var(--mg-color-error-main); /* #EF4444 */
}
```

### 4.3 본문 (내담자 목록)

```css
.mg-v2-urgent-clients-section__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
```

### 4.4 내담자 카드

```css
.mg-v2-urgent-client-card {
  background: var(--mg-color-background-main); /* #FAF9F7 */
  border: 1px solid var(--mg-color-border-main); /* #D4CFC8 */
  border-radius: 12px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mg-v2-urgent-client-card:hover {
  border-color: var(--mg-color-error-main); /* #EF4444 */
  background: rgba(239, 68, 68, 0.02);
}
```

### 4.5 내담자 정보

```css
.mg-v2-urgent-client-card__info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.mg-v2-urgent-client-card__name {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: var(--mg-color-text-main); /* #2C2C2C */
}

.mg-v2-urgent-client-card__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: var(--mg-color-text-secondary); /* #5C6B61 */
}

.mg-v2-urgent-client-card__meta svg {
  width: 12px;
  height: 12px;
}

.mg-v2-urgent-client-card__issue {
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: var(--mg-color-text-secondary); /* #5C6B61 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

### 4.6 액션 영역

```css
.mg-v2-urgent-client-card__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
```

### 4.7 위험도 배지

```css
.mg-v2-badge--critical {
  background: var(--mg-color-error-main); /* #EF4444 */
  color: white;
}

.mg-v2-badge--high {
  background: var(--mg-color-warning-main); /* #F59E0B */
  color: white;
}

.mg-v2-badge--medium {
  background: var(--mg-color-secondary-main); /* #6B7F72 */
  color: white;
}
```

### 4.8 반응형 (모바일)

```css
@media (max-width: 767px) {
  .mg-v2-urgent-client-card {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .mg-v2-urgent-client-card__actions {
    width: 100%;
    justify-content: space-between;
  }
}
```

---

## 5. 공통 유틸리티 클래스

### 5.1 버튼 크기

```css
.mg-v2-btn {
  font-family: 'Noto Sans KR', sans-serif;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  outline: none;
}

.mg-v2-btn-md {
  height: 40px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 10px;
}

.mg-v2-btn-sm {
  height: 36px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 10px;
}
```

### 5.2 버튼 타입

```css
.mg-v2-btn-ghost {
  background: transparent;
  color: var(--mg-color-text-secondary); /* #5C6B61 */
  border: none;
}

.mg-v2-btn-ghost:hover {
  background: var(--mg-color-surface-main); /* #F5F3EF */
  color: var(--mg-color-text-main); /* #2C2C2C */
}
```

### 5.3 스피너 (로딩)

```css
.mg-v2-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--mg-color-border-main); /* #D4CFC8 */
  border-top-color: var(--mg-color-primary-main); /* #3D5246 */
  border-radius: 50%;
  animation: mg-v2-spin 0.8s linear infinite;
}

@keyframes mg-v2-spin {
  to {
    transform: rotate(360deg);
  }
}
```

---

## 6. 접근성 (Accessibility)

### 6.1 포커스 스타일

```css
.mg-v2-btn:focus-visible,
.mg-v2-urgent-client-card:focus-visible {
  outline: 2px solid var(--mg-color-primary-main); /* #3D5246 */
  outline-offset: 2px;
}
```

### 6.2 키보드 네비게이션

```css
.mg-v2-urgent-client-card[tabindex="0"]:focus {
  border-color: var(--mg-color-primary-main); /* #3D5246 */
}
```

---

## 7. 다크 모드 대응 (선택)

**참고**: 현재 어드민 대시보드는 라이트 모드만 지원하지만, 향후 다크 모드 추가 시 아래 변수 활용

```css
@media (prefers-color-scheme: dark) {
  .mg-v2-quick-action-bar,
  .mg-v2-next-consultation-card,
  .mg-v2-urgent-clients-section {
    background: var(--mg-color-surface-dark, #2C2C2C);
    border-color: var(--mg-color-border-dark, #4A4A4A);
  }
  
  .mg-v2-alert--warning {
    background: rgba(245, 158, 11, 0.15);
  }
}
```

---

## 8. 성능 최적화

### 8.1 GPU 가속

```css
.mg-v2-btn,
.mg-v2-urgent-client-card {
  will-change: transform;
}
```

### 8.2 레이아웃 시프트 방지

```css
.mg-v2-quick-action-bar,
.mg-v2-alert,
.mg-v2-next-consultation-card,
.mg-v2-urgent-clients-section {
  min-height: 80px; /* 로딩 중에도 레이아웃 유지 */
}
```

---

## 9. 브라우저 호환성

**지원 브라우저**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Fallback**:
- `gap` 속성 미지원 시 `margin` 사용
- `grid` 미지원 시 `flex` 사용

```css
@supports not (gap: 16px) {
  .mg-v2-quick-action-bar__actions > * {
    margin-right: 12px;
  }
  
  .mg-v2-quick-action-bar__actions > *:last-child {
    margin-right: 0;
  }
}
```

---

## 10. CSS 파일 구조

**파일 경로**: `frontend/src/components/dashboard-v2/consultant/ConsultantDashboard.css`

**섹션 구조**:
```css
/* ===== 1. 빠른 액션 바 ===== */
.mg-v2-quick-action-bar { ... }
.mg-v2-quick-action-bar__title { ... }
.mg-v2-quick-action-bar__actions { ... }

/* ===== 2. 미작성 상담일지 알림 ===== */
.mg-v2-alert { ... }
.mg-v2-alert--warning { ... }
.mg-v2-alert__content { ... }

/* ===== 3. 다음 상담 준비 카드 ===== */
.mg-v2-next-consultation-card { ... }
.mg-v2-next-consultation-card__header { ... }
.mg-v2-next-consultation-card__body { ... }

/* ===== 4. 긴급 확인 필요 내담자 ===== */
.mg-v2-urgent-clients-section { ... }
.mg-v2-urgent-client-card { ... }

/* ===== 5. 공통 유틸리티 ===== */
.mg-v2-btn { ... }
.mg-v2-badge { ... }
.mg-v2-spinner { ... }

/* ===== 6. 반응형 (모바일) ===== */
@media (max-width: 767px) { ... }

/* ===== 7. 반응형 (태블릿) ===== */
@media (min-width: 768px) and (max-width: 1279px) { ... }
```

---

## 11. 코더 전달 체크리스트

- [ ] 모든 클래스명 `mg-v2-*` 형식 사용
- [ ] 디자인 토큰 `var(--mg-*)` 사용, 하드코딩 금지
- [ ] 반응형 브레이크포인트 3단계 (모바일·태블릿·데스크톱) 적용
- [ ] 호버·포커스 효과 transition 0.2s
- [ ] 접근성: focus-visible, tabindex, aria-label
- [ ] 브라우저 호환성: gap fallback, grid fallback
- [ ] 성능: will-change, min-height (레이아웃 시프트 방지)
- [ ] BEM 네이밍 컨벤션 준수 (block__element--modifier)

---

**문서 종료**
