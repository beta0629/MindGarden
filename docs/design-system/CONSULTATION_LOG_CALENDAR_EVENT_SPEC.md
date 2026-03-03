# 상담일지 캘린더 이벤트 시각 개선 스펙

**대상**: `mg-v2-consultation-log-calendar-block` 내 FullCalendar dayGrid 이벤트  
**목적**: 배경·텍스트 대비 확보 및 B0KlA 디자인 토큰 기반 시각적 개선  
**참조**: 어드민 대시보드 샘플 (https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample), PENCIL_DESIGN_GUIDE.md

---

## 1. 현황 분석

### 1.1 DOM 구조

```
div.mg-v2-consultation-log-calendar-wrapper
  └─ .fc (FullCalendar)
      └─ .fc-event.fc-daygrid-event.fc-daygrid-block-event.fc-h-event
          └─ .fc-event-main (텍스트 "이재학" 등)
```

### 1.2 현재 스타일 (ConsultationLogCalendarBlock.css)

| 속성 | 현재값 | 비고 |
|------|--------|------|
| background-color | 인라인 `var(--mg-success-500)` / `var(--mg-warning-500)` | FullCalendar event 객체에서 주입 |
| border-color | 동일 | 배경과 동일 |
| color | `#fff` | 고정 흰색 |
| border | `none` | 테두리 없음 |
| border-radius | `4px` | |
| padding | `2px 6px` | 좁음 |
| font-size | `12px` | |
| font-weight | `500` | |

### 1.3 문제점

- **대비 부족**: `--mg-success-500`(#10b981 계열) + 흰색 텍스트 → WCAG AA(4.5:1) 미달 가능
- **배경과 혼동**: 셀 배경(`--ad-b0kla-card-bg`, `--ad-b0kla-green-bg`)과 이벤트 색이 비슷해 구분 어려움
- **시각적 구분 부족**: 테두리·그림자 없어 카드/블록과 구분감 부족
- **토큰 불일치**: B0KlA `--ad-b0kla-*` 토큰 미활용

---

## 2. 시각적 개선안

### 2.1 권장 패턴: **라이트 배경 + 진한 텍스트 (고대비)**

어드민 대시보드 샘플의 카드·섹션 블록과 동일하게, **밝은 배경 + 진한 텍스트**로 대비를 확보한다.

| 상태 | 배경 | 텍스트 | 테두리 | 비고 |
|------|------|--------|--------|------|
| **완료** (isSessionCompleted) | `var(--mg-success-50)` | `var(--mg-success-700)` | `1px solid var(--mg-success-300)` | WCAG AA 충족 |
| **미완료** | `var(--mg-warning-50)` | `var(--mg-warning-700)` | `1px solid var(--mg-warning-300)` | 동일 |

### 2.2 대안 패턴: **진한 배경 + 흰색 텍스트 (현 구조 유지 시)**

인라인 배경색을 유지할 경우, **진한 톤**으로 변경해 대비를 확보한다.

| 상태 | 배경 | 텍스트 | 테두리 |
|------|------|--------|--------|
| **완료** | `var(--mg-success-600)` 또는 `var(--ad-b0kla-green)` | `var(--mg-white)` | `1px solid var(--mg-success-700)` |
| **미완료** | `var(--mg-warning-600)` | `var(--mg-white)` | `1px solid var(--mg-warning-700)` |

> **권장**: 2.1 라이트 배경 패턴. B0KlA 카드·섹션 블록과 시각적 일관성 확보.

---

## 3. B0KlA 디자인 토큰 활용

### 3.1 사용 토큰 목록

| 용도 | 토큰 | hex 참고 |
|------|------|----------|
| 완료 배경 | `var(--mg-success-50)` | #ecfdf5 |
| 완료 텍스트 | `var(--mg-success-700)` | #047857 |
| 완료 테두리 | `var(--mg-success-300)` | #6ee7b7 |
| 미완료 배경 | `var(--mg-warning-50)` | #fffbeb |
| 미완료 텍스트 | `var(--mg-warning-700)` | #b45309 |
| 미완료 테두리 | `var(--mg-warning-300)` | #fcd34d |
| 그림자 | `var(--ad-b0kla-shadow)` | 0 1px 2px rgba(0,0,0,0.05) |
| radius | `var(--ad-b0kla-radius-sm)` | 12px |
| 호버 배경 | `var(--ad-b0kla-green-bg)` (완료) / `var(--ad-b0kla-orange-bg)` (미완료) | |

### 3.2 B0KlA 관련 토큰 (dashboard-tokens-extension.css)

```
--ad-b0kla-green: var(--mg-success-600)
--ad-b0kla-green-bg: var(--mg-success-50)
--ad-b0kla-orange: var(--cs-orange-400)
--ad-b0kla-orange-bg: var(--cs-orange-50)
--ad-b0kla-radius-sm: 12px
--ad-b0kla-shadow: var(--cs-shadow-xs)
--ad-b0kla-shadow-hover: var(--cs-shadow-soft)
```

---

## 4. CSS 수정 제안 (core-coder 구현용)

### 4.1 적용 대상

- **파일**: `frontend/src/components/admin/consultation-log-view/ConsultationLogCalendarBlock.css`
- **셀렉터**: `.mg-v2-consultation-log-calendar-wrapper .fc-event`

### 4.2 권장 CSS (라이트 배경 패턴)

```css
/* FullCalendar 이벤트 - B0KlA 라이트 배경 패턴 (고대비) */
.mg-v2-consultation-log-calendar-wrapper .fc-event {
  /* 인라인 backgroundColor/borderColor 오버라이드 */
  background-color: var(--mg-success-50) !important;
  border: 1px solid var(--mg-success-300) !important;
  border-radius: var(--ad-b0kla-radius-sm);
  color: var(--mg-success-700);
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  box-shadow: var(--ad-b0kla-shadow);
  cursor: pointer;
  transition: box-shadow 0.2s, background-color 0.2s;
}

.mg-v2-consultation-log-calendar-wrapper .fc-event:hover {
  box-shadow: var(--ad-b0kla-shadow-hover);
  background-color: var(--mg-success-100) !important;
}

/* 미완료 이벤트 - extendedProps.isSessionCompleted === false 시 적용 */
.mg-v2-consultation-log-calendar-wrapper .fc-event[data-event-status="미완료"],
.mg-v2-consultation-log-calendar-wrapper .fc-event.fc-event-warning {
  background-color: var(--mg-warning-50) !important;
  border-color: var(--mg-warning-300) !important;
  color: var(--mg-warning-700);
}

.mg-v2-consultation-log-calendar-wrapper .fc-event.fc-event-warning:hover {
  background-color: var(--mg-warning-100) !important;
}
```

> **주의**: FullCalendar는 `backgroundColor`/`borderColor`를 인라인으로 주입하므로, `!important` 또는 더 높은 specificity로 오버라이드 필요.  
> 미완료 구분을 위해 `eventClassNames` 또는 `eventDidMount`에서 `fc-event-warning` 등 클래스 추가 필요.

### 4.3 JS 수정 제안 (이벤트 클래스 구분)

`ConsultationLogCalendarBlock.js`의 events 매핑 시:

```javascript
// 기존
backgroundColor: isCompleted ? COLOR_SUCCESS : COLOR_WARNING,
borderColor: isCompleted ? COLOR_SUCCESS : COLOR_WARNING,

// 수정: CSS에서 오버라이드하므로 인라인 제거 또는 유지해도 됨.
// 클래스로 구분하려면:
className: isCompleted ? 'fc-event-completed' : 'fc-event-warning',
// 또는 eventClassNames 콜백 사용
```

그리고 CSS에서:

```css
.mg-v2-consultation-log-calendar-wrapper .fc-event.fc-event-completed { ... }
.mg-v2-consultation-log-calendar-wrapper .fc-event.fc-event-warning { ... }
```

---

## 5. 대비(Contrast) 확보 방안 요약

| 방안 | 설명 | WCAG |
|------|------|------|
| **A. 라이트 배경** | 배경 `-50`, 텍스트 `-700` | AA 이상 |
| **B. 진한 배경** | 배경 `-600`/`-700`, 텍스트 `#fff` | AA 이상 |
| **C. 테두리 강화** | 1px `-300` 테두리로 형태 명확화 | 보조 |
| **D. 그림자** | `--ad-b0kla-shadow`로 셀과 분리 | 보조 |
| **E. 호버 피드백** | `-100` 배경으로 상호작용 표시 | UX |

**최종 권장**: A + C + D + E 조합.

---

## 6. 체크리스트 (구현 후 검증)

- [ ] 완료 이벤트: 배경 `--mg-success-50`, 텍스트 `--mg-success-700`
- [ ] 미완료 이벤트: 배경 `--mg-warning-50`, 텍스트 `--mg-warning-700`
- [ ] 테두리 1px, `-300` 톤
- [ ] border-radius `--ad-b0kla-radius-sm` (12px)
- [ ] box-shadow `--ad-b0kla-shadow`
- [ ] 호버 시 `-100` 배경, `--ad-b0kla-shadow-hover`
- [ ] 인라인 스타일 오버라이드 동작 확인
- [ ] 오늘 셀(`.fc-day-today`) 배경과 이벤트 색 구분 확인

---

## 7. 참조 문서

- `docs/design-system/PENCIL_DESIGN_GUIDE.md`
- `frontend/src/styles/dashboard-tokens-extension.css`
- `frontend/src/styles/unified-design-tokens.css` (토큰명 참고)
- `frontend/src/components/schedule/ScheduleB0KlA.css` (fc-event B0KlA 예시)
