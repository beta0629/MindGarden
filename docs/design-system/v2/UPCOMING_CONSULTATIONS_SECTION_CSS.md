# 다가오는 상담 섹션 — CSS 스타일 정의

**작성일**: 2026-03-09  
**대상 파일**: `frontend/src/components/dashboard-v2/consultant/ConsultantDashboard.css`  
**담당**: core-designer → core-coder  

---

## 1. 개요

이 문서는 "다가오는 상담" 섹션의 CSS 스타일을 정의합니다. 기존 `ConsultantDashboard.css`에 추가할 스타일 규칙을 제공하며, 모든 토큰은 `unified-design-tokens.css`를 따릅니다.

---

## 2. CSS 스타일 정의

### 2.1 상담 일정 목록 컨테이너

```css
/* Upcoming Schedule List */
.upcoming-schedule-list {
  display: flex;
  flex-direction: column;
  gap: var(--mg-v2-spacing-md, 12px);
}
```

### 2.2 일정 항목 (기본)

```css
/* Upcoming Schedule Item */
.upcoming-schedule-item {
  display: flex;
  align-items: flex-start;
  gap: var(--mg-v2-spacing-md, 12px);
  padding: var(--mg-v2-spacing-md, 12px);
  border-radius: var(--mg-v2-radius-md, 8px);
  background-color: var(--mg-v2-color-background, #f9fafb);
  border: 1px solid var(--mg-v2-color-border-light, #f3f4f6);
  transition: background-color 0.2s ease, transform 0.2s ease;
  cursor: pointer;
}

.upcoming-schedule-item:hover {
  background-color: var(--mg-v2-color-background-hover, rgba(0, 0, 0, 0.02));
  transform: translateY(-1px);
}
```

### 2.3 일정 항목 (강조)

```css
/* Upcoming Schedule Item - Highlighted (First Item) */
.upcoming-schedule-item--highlighted {
  background-color: var(--mg-v2-color-primary-50, #eff6ff);
  border: 2px solid var(--mg-v2-color-primary-200, #bfdbfe);
  position: relative;
  padding-left: calc(var(--mg-v2-spacing-md, 12px) + 8px); /* 악센트 바 공간 확보 */
}

.upcoming-schedule-item--highlighted::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background-color: var(--mg-v2-color-primary-600, #2563eb);
  border-radius: 2px 0 0 2px;
}

.upcoming-schedule-item--highlighted:hover {
  background-color: var(--mg-v2-color-primary-100, #dbeafe);
}
```

### 2.4 날짜/시간 영역

```css
/* Upcoming Schedule Date */
.upcoming-schedule-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 70px;
  gap: var(--mg-v2-spacing-xs, 4px);
}

.upcoming-schedule-date__day {
  font-size: var(--mg-v2-font-size-md, 15px);
  font-weight: var(--mg-v2-font-weight-semibold, 600);
  color: var(--mg-v2-color-primary-600, #2563eb);
  line-height: 1.2;
}

.upcoming-schedule-date__weekday {
  font-size: var(--mg-v2-font-size-xs, 12px);
  color: var(--mg-v2-color-text-tertiary, #9ca3af);
  font-weight: var(--mg-v2-font-weight-normal, 400);
}

.upcoming-schedule-date__time {
  font-size: var(--mg-v2-font-size-sm, 14px);
  color: var(--mg-v2-color-text-secondary, #6b7280);
  font-weight: var(--mg-v2-font-weight-medium, 500);
}
```

### 2.5 상세 정보 영역

```css
/* Upcoming Schedule Details */
.upcoming-schedule-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--mg-v2-spacing-xs, 4px);
}

.upcoming-schedule-details__client {
  font-size: var(--mg-v2-font-size-md, 15px);
  color: var(--mg-v2-color-text-primary, #111827);
  font-weight: var(--mg-v2-font-weight-medium, 500);
  line-height: 1.4;
}

.upcoming-schedule-details__meta {
  font-size: var(--mg-v2-font-size-xs, 12px);
  color: var(--mg-v2-color-text-secondary, #6b7280);
  display: flex;
  align-items: center;
  gap: 4px;
  line-height: 1.4;
}

.upcoming-schedule-details__meta svg {
  flex-shrink: 0;
}
```

### 2.6 반응형 조정

```css
/* Responsive Adjustments */
@media (max-width: 768px) {
  .upcoming-schedule-item {
    padding: var(--mg-v2-spacing-sm, 10px);
    gap: var(--mg-v2-spacing-sm, 10px);
  }

  .upcoming-schedule-item--highlighted {
    padding-left: calc(var(--mg-v2-spacing-sm, 10px) + 8px);
  }

  .upcoming-schedule-date {
    min-width: 60px;
  }

  .upcoming-schedule-date__day {
    font-size: var(--mg-v2-font-size-sm, 14px);
  }

  .upcoming-schedule-date__time {
    font-size: var(--mg-v2-font-size-xs, 12px);
  }

  .upcoming-schedule-details__client {
    font-size: var(--mg-v2-font-size-sm, 14px);
  }
}
```

---

## 3. B0KlA 스타일 적용 (선택)

B0KlA 디자인 시스템을 적용하려면 아래 토큰을 사용합니다.

### 3.1 악센트 바 색상 변경

```css
/* B0KlA Style - Accent Bar */
.upcoming-schedule-item--highlighted::before {
  background-color: var(--mg-color-primary-main, #3D5246); /* B0KlA 주조색 */
}
```

### 3.2 날짜 색상 변경

```css
/* B0KlA Style - Date Color */
.upcoming-schedule-date__day {
  color: var(--mg-color-primary-main, #3D5246); /* B0KlA 주조색 */
}
```

### 3.3 강조 배경 변경

```css
/* B0KlA Style - Highlighted Background */
.upcoming-schedule-item--highlighted {
  background-color: var(--mg-color-surface-main, #F5F3EF); /* B0KlA 서페이스 */
  border: 2px solid var(--mg-color-border-main, #D4CFC8); /* B0KlA 테두리 */
}

.upcoming-schedule-item--highlighted:hover {
  background-color: var(--mg-color-background-main, #FAF9F7); /* B0KlA 배경 */
}
```

---

## 4. 완료 체크리스트

- [ ] `ConsultantDashboard.css`에 위 스타일 추가
- [ ] 토큰명 정확히 사용 (`var(--mg-v2-*)`)
- [ ] 반응형 미디어 쿼리 적용
- [ ] B0KlA 스타일 선택 적용 (필요 시)
- [ ] 기존 스타일과 충돌 없음 확인
- [ ] 브라우저 테스트 (Chrome, Safari, Firefox)

---

## 5. 참조

- `frontend/src/styles/unified-design-tokens.css` — 디자인 토큰 정의
- `docs/design-system/PENCIL_DESIGN_GUIDE.md` — B0KlA 색상 팔레트
- `docs/design-system/v2/UPCOMING_CONSULTATIONS_SECTION_SPEC.md` — 화면설계서

---

**작성 완료일**: 2026-03-09  
**작성자**: core-designer  
**다음 단계**: core-coder가 `ConsultantDashboard.css`에 스타일 추가
