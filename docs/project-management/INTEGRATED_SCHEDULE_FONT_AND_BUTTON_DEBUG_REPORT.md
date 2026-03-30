# 통합 스케줄 카드 폰트·버튼 색상 디버그 리포트

**작성일**: 2025-03-14  
**대상**: `mg-v2-card-container` 내 텍스트 폰트 불일치, `mg-v2-button--success` 색상 미표시  
**담당**: core-debugger (원인 분석·수정 제안만, 코드 수정 없음)

---

## 1. 증상 요약

| 증상 | 상세 |
|------|------|
| **폰트 크기 불일치** | 동일 `mg-v2-card-container`인데 "김선희→이재학 활성 1회 남음" 카드는 작은 폰트, "김선희→이혁진 종료됨 0회 남음" 카드는 더 큰 폰트 |
| **버튼 색상 미표시** | 결제 확인 버튼(`mg-v2-button mg-v2-button--success`)에 배경색이 적용되지 않음 |

---

## 2. font-size 규칙 분석

### 2.1 적용 경로

| 요소 | 클래스 | font-size 출처 |
|------|--------|----------------|
| `li.integrated-schedule__card` | fc-event 있음 | `ScheduleCalendar.css` L483 `.fc-event { font-size: 0.8rem; }` |
| `li.integrated-schedule__card` | fc-event 없음 | 전역 상속 (body/ul, 대략 1rem) |
| `.mg-v2-card-container` | — | `IntegratedMatchingSchedule.css` L281 `font-size: inherit` |

### 2.2 근본 원인

- `fc-event`가 있는 카드: `li`에 `.fc-event`가 붙어서 `.fc-event` 전역 규칙의 `font-size: 0.8rem`이 적용됨.
- `mg-v2-card-container`는 `font-size: inherit`로 되어 있어서 부모 `li`의 0.8rem을 그대로 상속함.
- `fc-event`가 없는 카드: `li`에 `.fc-event`가 없어서 전역 `.fc-event`가 적용되지 않고, 상위(ul 등)의 1rem/14px 등을 상속함.
- 결과: 같은 `mg-v2-card-container`인데 fc-event 유무에 따라 상속되는 font-size가 달라져서 폰트 크기가 다르게 보임.

### 2.3 fc-event font-size 관련 규칙

| 파일 | 셀렉터 | font-size | 비고 |
|------|--------|-----------|------|
| `ScheduleCalendar.css` L483 | `.fc-event` | `0.8rem` | 전역, sidebar `li`에도 적용됨 |
| `ScheduleCalendar.css` L156 (미디어쿼리) | `.fc-event` | `0.75rem` | max-width 768px |
| `MappingCalendarView.css` L46 | `.mg-v2-mapping-calendar-wrapper .fc-event` | `11px` | 캘린더 영역만, sidebar 제외 |
| `ConsultantSchedule.css` L227 | `.fc-event` | 지정 없음 | — |

sidebar 카드의 `li`에는 `ScheduleCalendar.css`의 전역 `.fc-event`가 직접 적용되므로, 이 규칙이 폰트 차이의 직접 원인임.

---

## 3. 버튼 색상(mg-v2-button--success) 분석

### 3.1 CSS 적용 경로

| 파일 | 셀렉터 | background | 비고 |
|------|--------|------------|------|
| `ActionButton.css` L26 | `.mg-v2-button--success` | `var(--mg-success-500)` | ActionButton 컴포넌트가 이 클래스 사용 |
| `AdminDashboardB0KlA.css` L38 | `.mg-v2-ad-b0kla .mg-v2-button-success` | `var(--ad-b0kla-green)` | 클래스명 불일치 |
| `unified-design-tokens.css` L11205 | `.mg-v2-button-success` | (해당 규칙 존재) | BEM `--` 아님 |
| `Button.css` (ui/Button) | `.mg-v2-button--success` | `var(--mg-success-500)` | — |

### 3.2 원인 후보

#### (1) 클래스명 불일치 (가능성 높음)

- ActionButton 실제 클래스: `mg-v2-button--success` (BEM modifier `--`)
- AdminDashboardB0KlA.css 셀렉터: `.mg-v2-button-success` (single dash)
- 따라서 B0KlA 영역에서 success 버튼에 대한 B0KlA 오버라이드가 적용되지 않음.

#### (2) CSS 변수 순환 참조 (가능성 높음)

`unified-design-tokens.css`:

```css
/* L47 */
--cs-success-500: var(--mg-success-500);
/* L305 */
--mg-success-500: var(--cs-success-500);
```

`--mg-success-500` ↔ `--cs-success-500`가 서로를 참조하여 순환 구조.  
computed value 시점에 무효가 되어 `background: var(--mg-success-500)`가 색상을 지정하지 못함.

#### (3) 스코프·특정성 충돌

- ActionButton.css: `.mg-v2-button--success` (0,1,0)
- B0KlA: `.mg-v2-ad-b0kla .mg-v2-button-success` (0,2,0)이지만 실제 클래스와 불일치로 적용 안 됨
- unified-design-tokens 내 규칙과의 우선순위·로드 순서 이슈 가능

### 3.3 HTML 구조 (card-actions)

- `CardActionGroup`(common): `div.mg-v2-card-actions` + `children`
- integrated-schedule molecules `CardActionGroup`: `CommonCardActionGroup`으로 감싸고, 조건에 따라 `ActionButton` 렌더
- `mapping.status === 'PENDING_PAYMENT'`일 때만 “결제 확인” ActionButton 렌더
- `ActionButton`은 `<button>` 사용, `div` 아님.
- 따라서 “버튼이 div처럼 보인다”는 현상은 이 컴포넌트 구조상 발생하지 않아야 함.  
  만약 div처럼 보인다면, 다른 경로(예: 조건부 렌더 미동작, 잘못된 import 등)를 의심해야 함.

---

## 4. 수정 제안

### 4.1 폰트 크기 통일

**파일**: `frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.css`  

**현재** (L276–281):

```css
.integrated-schedule__sidebar .integrated-schedule__list > li.integrated-schedule__card .mg-v2-card-container {
  display: flex;
  flex-direction: column;
  gap: var(--mg-spacing-12);
  min-height: 172px;
  font-size: inherit;
}
```

**변경 방향**:

- `font-size: inherit` → `font-size: var(--mg-font-size-base, 1rem)` 또는 `font-size: 14px`
- fc-event 유무와 상관없이 동일한 font-size를 사용하도록 강제

**core-coder용 태스크**:  
`IntegratedMatchingSchedule.css`의 `.mg-v2-card-container` 규칙에서 `font-size: inherit`을 `font-size: var(--mg-font-size-base, 1rem)`으로 변경하여 fc-event에 따른 폰트 차이 제거.

---

### 4.2 버튼 색상

#### A. B0KlA 셀렉터 수정

**파일**: `frontend/src/components/admin/AdminDashboard/AdminDashboardB0KlA.css`  

**현재** (L38):

```css
.mg-v2-ad-b0kla .mg-v2-button-success {
```

**변경 방향**:

- `mg-v2-button-success` → `mg-v2-button--success` (BEM modifier로 맞춤)

**core-coder용 태스크**:  
AdminDashboardB0KlA.css에서 `.mg-v2-button-success`를 `.mg-v2-button--success`로 변경.

#### B. CSS 변수 순환 참조 제거

**파일**: `frontend/src/styles/unified-design-tokens.css`  

**변경 방향**:

- `--cs-success-500` 또는 `--mg-success-500` 중 하나에 실제 색상값을 직접 지정  
  - 예: `--cs-success-500: #22c55e;`  
  - 다른 변수는 이 값을 참조하도록 유지

**core-coder용 태스크**:  
unified-design-tokens.css에서 `--cs-success-500` 또는 `--mg-success-500`에 구체 색상값(hex 등)을 설정하여 순환 참조 제거.

---

## 5. 체크리스트 (수정 후 확인)

- [ ] fc-event 있는 카드(김선희→이재학)와 fc-event 없는 카드(김선희→이혁진) 폰트 크기 동일
- [ ] 결제 확인 버튼(mg-v2-button--success)에 녹색 배경 정상 표시
- [ ] 입금 확인 버튼(mg-v2-button--primary) 색상 정상 표시
- [ ] DevTools에서 `--mg-success-500` computed value가 유효한 색상인지 확인
- [ ] card-actions 영역에서 `<button>`이 렌더되고 있는지 확인 (div만 있는 경우 추가 디버깅)

---

## 6. 참조 문서

- `FC_EVENT_CARD_BORDER_DEBUG.md` — fc-event 전역 스타일 충돌
- `CARD_VISUAL_CONSISTENCY_PLAN.md` — 카드 시각 통일
- `INTEGRATED_SCHEDULE_CARD_LAYOUT_SPEC.md` — 카드 레이아웃 스펙
- `docs/design-system/v2/INTEGRATED_SCHEDULE_LAYOUT_AND_CARD_SPEC.md` — font-size inherit 관련 권장 사항
