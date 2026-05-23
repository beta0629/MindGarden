# 캘린더 공휴일 배경 cascade 미적용 회귀 분석

- **역할**: core-debugger (정적 분석, 코드 무변경)
- **대상 페이지**: `/admin/integrated-schedule` 어드민 통합 스케줄 (FullCalendar v6, dayGridMonth)
- **회귀 표면화 일자**: 2026-05-23 (사용자 스크린샷 3장 — 어드민 1, 상담사 renewal 1, 공휴일 영역 클로즈업 1)
- **분석 시각**: 2026-05-23 21:35 KST
- **HEAD (develop)**: `e9088361b docs(planning): 통합 스케줄 role 확장 기획서 폐기 표시 — 스코프 축소`
- **선행 인벤토리**: [a9e5c535](a9e5c535) (`CALENDAR_DESIGN_UNIFICATION_PLAN.md` 옵션 A — 어드민 캘린더 컴포넌트를 상담사·내담자 재사용)
- **교차 참조**: `docs/project-management/2026-04-28/INTEGRATED_SCHEDULE_CALENDAR_CSS_ARCHITECTURE_ORCHESTRATION.md` §4.2·§4.3, `docs/project-management/2026-04-28/INTEGRATED_SCHEDULE_KR_HOLIDAYS_ORCHESTRATION.md`

---

## 0. 요약 (TL;DR)

| 항목 | 결과 |
| --- | --- |
| SSOT 컴포넌트 | `frontend/src/components/ui/Schedule/ScheduleCalendarView.{js,css}` |
| 일요일 분홍 배경 메커니즘 | JS `dayCellClassNames`로 `.mg-v2-ad-calendar-day--weekend-sun` 부여 → CSS `color-mix(--mg-error-300 12%, surface)` |
| 공휴일 데이터 출처 | `frontend/src/utils/krPublicHolidays.js` 정적 ISO 테이블 (2024–2028) |
| 공휴일 라벨 렌더 | `handleDayCellDidMount` → `dayTop`에 `<div.mg-v2-ad-calendar-day-holiday-badge>` 동적 주입 |
| **미적용 원인 (확정)** | **#2** (CSS 셀렉터가 의도적으로 `transparent !important`) + **JS 가드 부수효과** (`!holidayName` 조건으로 weekend 클래스가 공휴일 셀에 미부여) |
| 회귀 결정 commit | `e569c7301 fix(integrated-schedule): 공휴일은 날짜·배지 텍스트 중심, 셀 배경 투명화` (2026-05-04 ±) |
| 권고 옵션 | **P1 (CSS 셀렉터 추가)** — 가장 가벼움, 즉시 적용 가능 |

**핵심 발견**: 공휴일 데이터·클래스·라벨은 모두 정상이다. 회귀는 `e569c7301`이 "공휴일 = 텍스트만, 셀 배경은 투명" 으로 의도적 결정한 결과이며, 같은 PR에서 정착된 범례 문구(`SCHEDULE_LEGEND_INTEGRATED_WEEKEND_HOLIDAY_NOTE`)가 **"공휴일은 붉은 계열(겹치면 공휴일 우선)"** 이라 사용자에게 약속한 것과 **시각적으로 모순**된다. 사용자 의도와 범례 문구를 신뢰원으로 본다면, 공휴일 셀에도 분홍(또는 더 진한 붉은) 배경을 부여하는 CSS 1블록 추가가 가장 작은 패치이다.

---

## 1. 회귀 시나리오 (사용자 제공 스크린샷 영역 설명)

**3번째 스크린샷 (어드민 통합 스케줄, 2026년 5월 월간)**

| 날짜 | 요일 (실제) | 사용자 표기 | 셀 배경 | 일자 색 | 배지 |
| --- | --- | --- | --- | --- | --- |
| 5/17 | 일 | "일요일" ✅ | 분홍 ✅ | 검정 (기본) | — |
| 5/24 | **일** | "월요일, 부처님오신날" ❌ | **흰색/옅은 회색** ❌ | 빨강 ✅ | "부처님오신날 / 내일 대체공휴일" (흰 띠 + 빨강 텍스트) |
| 5/25 | 월 | "월요일/화요일, 대체공휴일" | **흰색/옅은 회색** ❌ | 빨강 ✅ | "대체공휴일" (흰 띠 + 빨강 텍스트) |
| 5/31 | 일 | "일요일" ✅ | 분홍 ✅ | 검정 (기본) | — |

> 사용자 표기 보정: 2026-05-24는 **일요일**이다 (부처님오신날 일요일과 겹쳐 익일 25일이 대체공휴일). 사용자가 "월요일"로 인식한 것은 분홍 배경이 안 나와 시각적으로 일요일임이 표시되지 않았기 때문일 가능성이 높다.

**사용자 의도 (verbatim)**

> "일요일및 공휴일 배경이 안나오고 있는것같아 배경이색이 먼저 나오고 그 위에 공휴일 나오면 될것 같은데"

→ 공휴일 셀에도 **일요일과 동일한(혹은 더 진한) 분홍 배경이 먼저 깔리고**, 그 위에 공휴일 라벨이 z-index 위로 표시되어야 함.

---

## 2. SSOT 식별

### 2.1 페이지 진입 cascade

| 계층 | 파일 / 라인 | 역할 |
| --- | --- | --- |
| 페이지 | `frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.js:391-406` | `<main data-calendar-skin="integrated" data-layout-context="integrated-schedule">` 스코프 부여 + `<UnifiedScheduleComponent calendarSkin="integrated" integratedMonthEventLayout />` 호출 |
| 컨테이너 | `frontend/src/components/schedule/UnifiedScheduleComponent.js:70-81` | `calendarSkin`·`integratedMonthEventLayout` props 전달, `KR_PUBLIC_HOLIDAY_FULLCALENDAR_EVENTS` 배경 이벤트로 주입 (L38, L94+) |
| 프레젠테이션 (SSOT) | `frontend/src/components/ui/Schedule/ScheduleCalendarView.js:1-427` | FullCalendar 래핑·`dayCellClassNames`·`dayCellDidMount`·`eventClassNames` 단일 진입점 |
| 스타일 (SSOT) | `frontend/src/components/ui/Schedule/ScheduleCalendarView.css:192-419` | `[data-calendar-skin="integrated"]` 스코프 한정 공휴일·주말·배지 cascade |
| 전역 (간섭) | `frontend/src/components/schedule/ScheduleB0KlA.css:619-636` | `.mg-v2-ad-b0kla .fc-daygrid-day { background: var(--ad-b0kla-card-bg); }` — 모든 셀에 흰 배경 강제 |
| 데이터 | `frontend/src/utils/krPublicHolidays.js:16-116` | 2024–2028 정적 ISO 테이블, 2026-05-24=`'부처님오신날'`, 2026-05-25=`'대체공휴일'` |

### 2.2 일요일 분홍 배경 정의 (현행 정상)

`ScheduleCalendarView.css:301-307`

```css
[data-calendar-skin="integrated"] .mg-v2-schedule-calendar.mg-v2-ad-b0kla
  .mg-v2-schedule-calendar-view td.fc-daygrid-day.mg-v2-ad-calendar-day--weekend-sun {
    background-color: color-mix(
        in srgb,
        var(--mg-error-300) 12%,
        var(--mg-color-background-main, var(--mg-color-surface-main))
    ) !important;
}
```

- **부여 조건** (`ScheduleCalendarView.js:115-127`):
  ```js
  if (calendarSkin === 'integrated') {
      ...
      if (arg.view?.type === 'dayGridMonth' && !holidayName) {
          const dow = arg.date.getDay();
          if (dow === 6) list.push(WEEKEND_SAT_DAY_CELL_CLASS);
          if (dow === 0) list.push(WEEKEND_SUN_DAY_CELL_CLASS);
      }
  }
  ```
  → `!holidayName` 가드로 **공휴일 셀에는 weekend 클래스 자체가 부여되지 않는다.**
- **사용 토큰**: `--mg-error-300` 12% + `--mg-color-background-main` (현 라이트 모드 fallback `--mg-color-surface-main`)

### 2.3 토요일 파랑 배경 (참고)

`ScheduleCalendarView.css:293-299` — `--mg-info-300` 14% 동일 패턴.

---

## 3. 공휴일 데이터·라벨 흐름

### 3.1 데이터 (정상)

`frontend/src/utils/krPublicHolidays.js:65-66`

```js
'2026-05-24': '부처님오신날',
'2026-05-25': '대체공휴일',
```

- 정적 ISO 테이블 — API 의존 없음, 로드 시점 부재 가능성 0
- `getKrPublicHolidayNameForLocalDate(date)` (L149-157): YYYY-MM-DD 키 조회
- `buildKrPublicHolidayFullCalendarEvents()` (L163-180): `display: 'background'` + `classNames: ['mg-v2-ad-calendar-event--kr-public-holiday-bg']`
- `KR_PUBLIC_HOLIDAY_FULLCALENDAR_EVENTS` 모듈 상수 → `UnifiedScheduleComponent`에서 캘린더 events 배열에 합성

### 3.2 셀 클래스 부여 (정상)

`ScheduleCalendarView.js:109-130`

```js
const dayCellClassNamesForKrHoliday = useCallback((arg) => {
    const list = [];
    const holidayName = getKrPublicHolidayNameForLocalDate(arg.date);
    if (holidayName) {
        list.push('mg-v2-ad-calendar-day--kr-public-holiday');
    }
    ...
}, [calendarSkin]);
```

→ 2026-05-24·25 셀 `<td>`에 `mg-v2-ad-calendar-day--kr-public-holiday` 클래스 정상 부착.

### 3.3 라벨 (배지) 렌더 — DOM 직접 주입

`ScheduleCalendarView.js:136-178` `handleDayCellDidMount`

- `.fc-daygrid-day-top` 자식으로 `<div class="mg-v2-ad-calendar-day-holiday-badge">` 생성·`appendChild`
- 내부: `<span class="...__name">부처님오신날</span>` + (대체공휴일 전날이면) `<span class="...__eve-hint">내일 대체공휴일</span>`
- `aria-hidden`·`tabIndex=-1` 처리는 별도 배경 이벤트(`handleEventDidMount` L226-231)

### 3.4 배지 시각 (현행)

`ScheduleCalendarView.css:335-352` (통합 스킨 한정)

```css
[data-calendar-skin="integrated"] ... .fc-daygrid-day-top .mg-v2-ad-calendar-day-holiday-badge {
    flex: 1 0 100%;
    order: 1;
    ...
    background-color: var(--mg-color-surface-main, var(--mg-white));  /* ← 흰 띠 */
    color: var(--mg-color-text-main, inherit);
    border: none;
}

... .__name { color: var(--mg-error-600, var(--mg-error-500)); }       /* ← 빨간 글씨 */
```

→ 사용자가 본 **"흰색/옅은 회색 배경"의 정체는 ①셀 배경 transparent + ②배지 자체의 `surface-main`(흰) 띠** 두 레이어가 합성된 결과.

### 3.5 z-index 계층 (현재 정합)

| 레이어 | 셀렉터 | z-index | 위치 |
| --- | --- | --- | --- |
| 배경 이벤트 (kr-public-holiday-bg) | `.fc-daygrid-day-bg` | **0** + `opacity: 0` | `ScheduleCalendarView.css:198-206, 235-240` |
| 셀 본체 (`<td>`) | `td.fc-daygrid-day...--kr-public-holiday` | (basic) | L208-213 `background-color: transparent !important` |
| day-events (예약 카드) | `.fc-daygrid-day-events` | **1** | L246-249 |
| day-top (일자 + 배지) | `.fc-daygrid-day-top` | **2** | L255-266 |

→ z-index/opacity 충돌 없음. **#3 후보 (z-index 충돌) 기각.**

---

## 4. 미적용 원인 확정

### 4.1 사용자 제시 원인 후보 검토

| # | 가설 | 판정 | 근거 |
| --- | --- | --- | --- |
| 1 | 공휴일 데이터 부재 | **기각** | `krPublicHolidays.js:65-66` 명시. 어드민에서 "부처님오신날" 배지 정상 표시 = 데이터 도달 |
| 2 | 공휴일 CSS 셀렉터에 분홍 배경 미정의 | **확정** | `ScheduleCalendarView.css:208-213` 명시적 `background-color: transparent !important` |
| 3 | z-index 충돌로 셀 배경이 라벨 덮음 | **기각** | §3.5 표 — day-top z:2, day-bg z:0, 충돌 없음 |
| 4 | 공휴일 데이터 import 경로 누락 | **기각** | `UnifiedScheduleComponent.js:38`에서 import 확인, 정적 모듈 상수라 화면별 누락 불가능 |

### 4.2 확정 원인 (단일 시퀀스)

```
[2026-05-24 셀]
  ↓ FullCalendar 렌더
  ↓ dayCellClassNamesForKrHoliday(date=2026-05-24)
  ↓   holidayName = '부처님오신날' → push '...--kr-public-holiday'
  ↓   !holidayName 가드 false → weekend-sun 클래스 미부여  ← ★ 회귀의 절반
  ↓ td.fc-daygrid-day.mg-v2-ad-calendar-day--kr-public-holiday (클래스 1개만)
  ↓
[CSS cascade 적용]
  ScheduleB0KlA.css:619     .fc-daygrid-day { background: var(--ad-b0kla-card-bg); }   ← 흰색 기본
  ScheduleCalendarView.css:208-213
      td...--kr-public-holiday { background-color: transparent !important; }            ← ★ 회귀의 나머지 절반
  ScheduleCalendarView.css:230-232
      .fc-daygrid-day-frame { background-color: transparent; }                          ← 프레임도 투명
  ↓
[배지 합성]
  ScheduleCalendarView.css:343  .holiday-badge { background-color: surface-main(=흰) }  ← 흰 띠 추가
  ↓
[최종 시각]
  셀 = 흰색 (B0KlA card-bg 노출) + 흰 띠 배지 + 빨강 텍스트 + 빨강 일자 숫자
  → 사용자: "분홍 배경 미적용"
```

**원인 확정**: **#2 (CSS 셀렉터)** + **JS 가드 부수효과**. 결정 commit `e569c7301`로 의도된 변경이며, 같은 commit이 `ScheduleB0KlA.css:619`의 흰 배경 위에 분홍을 덮을 기회를 모두 차단했다.

### 4.3 범례 문구 ↔ 실제 시각 모순

`frontend/src/constants/schedule.js:240-241`

```js
export const SCHEDULE_LEGEND_INTEGRATED_WEEKEND_HOLIDAY_NOTE =
  '월간: 토요일은 연한 파랑·일요일은 연한 붉은 틴트, 공휴일은 붉은 계열(겹치면 공휴일 우선).';
```

→ 범례는 "**공휴일은 붉은 계열(겹치면 공휴일 우선)**" 라고 약속. 실제 시각은 "**날짜 숫자만 붉음, 배경은 흰색**". 사용자 의도는 범례와 일치, 현 구현이 범례를 배신.

→ 결정의 근거가 된 `ScheduleCalendarView.css:194-195` 주석 ("공휴일 색 강조는 «날짜 숫자·배지 텍스트» 중심") 은 범례 문구 정착 이전·이후 어느 시점에 합의됐는지 불명확. **합의 갱신이 필요**.

---

## 5. 수정안 P1 / P2 / P3

### P1 — CSS 셀렉터 추가 (가장 가벼움, 즉시 적용 가능)

**변경 파일**: `frontend/src/components/ui/Schedule/ScheduleCalendarView.css`

**변경 위치**: L208-213 블록을 **삭제 대신 보강**하거나, L307 직후에 1블록 추가.

**제안 패치 (개념적, core-coder 위임 시 참고)**

```css
/* P1 — 공휴일 셀: 일요일과 동일 톤(또는 한 단계 진한)으로 배경 부여 */
[data-calendar-skin="integrated"] .mg-v2-schedule-calendar.mg-v2-ad-b0kla
  .mg-v2-schedule-calendar-view td.fc-daygrid-day.mg-v2-ad-calendar-day--kr-public-holiday {
    background-color: color-mix(
        in srgb,
        var(--mg-error-300) 16%,  /* 일요일(12%)보다 1단계 진하게, core-designer 확정 필요 */
        var(--mg-color-background-main, var(--mg-color-surface-main))
    ) !important;
    border-color: var(--fc-border-color, var(--ad-b0kla-border)) !important;
    box-shadow: none !important;
    outline: none !important;
}

[data-calendar-skin="integrated"] .mg-v2-schedule-calendar.mg-v2-ad-b0kla
  .mg-v2-schedule-calendar-view td.fc-daygrid-day.mg-v2-ad-calendar-day--kr-public-holiday:hover {
    background-color: color-mix(
        in srgb,
        var(--mg-error-300) 22%,
        var(--mg-color-background-main, var(--mg-color-surface-main))
    ) !important;
    border-color: var(--fc-border-color, var(--ad-b0kla-border)) !important;
}

/* 프레임 투명 유지(상위 td 배경 노출) */
[data-calendar-skin="integrated"] .mg-v2-schedule-calendar.mg-v2-ad-b0kla
  .mg-v2-schedule-calendar-view .fc-daygrid-day.mg-v2-ad-calendar-day--kr-public-holiday .fc-daygrid-day-frame {
    background-color: transparent;
}

/* 배지 배경도 투명으로(흰 띠 제거), 셀 배경이 그대로 노출되도록 */
[data-calendar-skin="integrated"] .mg-v2-schedule-calendar.mg-v2-ad-b0kla
  .mg-v2-schedule-calendar-view .fc-daygrid-day-top .mg-v2-ad-calendar-day-holiday-badge {
    background-color: transparent;
}
```

**트레이드오프**

| 항목 | 평가 |
| --- | --- |
| 변경 범위 | CSS 1파일, 약 15라인. 컴포넌트·JS·토큰 변경 없음 |
| 위험도 | **낮음**. 다른 화면 영향 0 (스코프 `[data-calendar-skin="integrated"]` 한정) |
| 디자인 토큰 추가 | 불필요 (기존 `--mg-error-300` + `--mg-color-background-main` 재사용) |
| 범례 정합 | ✅ "공휴일은 붉은 계열" 약속을 시각으로 충족 |
| z-index 정합 | ✅ 기존 day-top z:2 > day-bg z:0 유지 |
| 일요일 + 공휴일 겹침 (5/24) | 공휴일 16% 일관 적용 (weekend-sun 클래스는 여전히 미부여, 한 톤만 적용되어 깔끔) |
| `e569c7301` 결정 번복 | 의도적, 사용자·범례와 정합. 변경 사유는 §4.3 |

### P2 — `dayCellClassNames` callback 보강 + CSS 추가

**변경 파일**: `ScheduleCalendarView.js:109-130` + `ScheduleCalendarView.css`

**개념**

```js
const dayCellClassNamesForKrHoliday = useCallback((arg) => {
    const list = [];
    const holidayName = getKrPublicHolidayNameForLocalDate(arg.date);
    if (holidayName) {
        list.push('mg-v2-ad-calendar-day--kr-public-holiday');
        if (calendarSkin === 'integrated' && arg.view?.type === 'dayGridMonth') {
            list.push('mg-v2-ad-calendar-day--kr-public-holiday-bg');  /* ← 신규 배경 클래스 */
        }
    }
    /* 기존 weekend 가드 유지 또는 완화 */
    ...
}, [calendarSkin]);
```

CSS는 P1과 동일하지만 **셀렉터 분리**(`-bg` 변형 클래스에만 배경 색 적용 → 데이터/마크업 변경과 시각 변경의 책임 분리).

**트레이드오프**

| 항목 | 평가 |
| --- | --- |
| 변경 범위 | JS + CSS 2파일 |
| 위험도 | 중간 (JS 변경 → 단위 테스트 추가 필요) |
| 확장성 | ✅ 향후 "공휴일이지만 시각 강조 OFF" 같은 옵션 분리 용이 |
| 추가 클래스 비용 | DOM 클래스 1개 추가 |

→ **P1보다 1단계 무겁고, 즉시 효익은 동일**. P1로 충분.

### P3 — 디자인 토큰 신설 + 3 셀렉터 일괄 토큰 참조

**변경 파일**: `frontend/src/styles/unified-design-tokens.css` + `ScheduleCalendarView.css` + (필요 시) `ScheduleLegend` 범례 swatch

**개념**

```css
/* unified-design-tokens.css */
:root {
    --mg-calendar-holiday-bg: color-mix(in srgb, var(--mg-error-300) 16%, var(--mg-color-surface-main));
    --mg-calendar-holiday-text: var(--mg-error-600);
    --mg-calendar-weekend-sun-bg: color-mix(in srgb, var(--mg-error-300) 12%, var(--mg-color-surface-main));
    --mg-calendar-weekend-sat-bg: color-mix(in srgb, var(--mg-info-300)  14%, var(--mg-color-surface-main));
}
```

ScheduleCalendarView.css의 L293·L301·L208·L217 4 블록을 토큰 참조로 일괄 교체.

**트레이드오프**

| 항목 | 평가 |
| --- | --- |
| 변경 범위 | 토큰 + CSS + 범례 swatch (3 파일) |
| 위험도 | 중간 (디자인 토큰 추가는 다른 화면·다크모드까지 합의 필요) |
| 디자인 일관성 | ✅ 캘린더 전체에서 동일 톤. P2(2026Q2 디자인 토큰 갭) 정합 |
| 시간 | P1 즉시 / P3 디자이너 합의 후 |
| 운영 게이트 (하드코딩) | ✅ 토큰화로 하드코딩 게이트 통과 명확 |

→ **장기적으로 P3가 옳다.** P1으로 우선 회귀를 막고, P3을 D11 (`docs/standards/DESIGN_TOKEN_GAP_2026Q2_D11.md`) 디자인 토큰 갭 작업에 흡수.

### 권고

**P1 (즉시) → P3 (디자인 토큰 갭 작업과 함께 점진 흡수)**.
- P1으로 사용자 회귀를 **단일 PR 작은 패치(약 15라인)** 로 해소.
- P3은 별도 코어 디자이너 합의 + 토큰 추가 후 P1 셀렉터를 토큰 참조로 치환 (다음 D11 cycle).
- **P2는 채택하지 않음** — JS·CSS 양쪽 변경 비용 대비 P1과 효익 동일, 향후 P3 이관 시 다시 JS 수정 부담.

---

## 6. 영향 범위

### 6.1 옵션 A (CALENDAR_DESIGN_UNIFICATION_PLAN.md) 채택 시

| 화면 | 라우트 | 패치 적용 경로 |
| --- | --- | --- |
| 어드민 (SSOT) | `/admin/integrated-schedule` | 즉시 |
| 상담사 renewal | `/consultant/renewal/schedule` | 옵션 A 정착 후 자동 (동일 ScheduleCalendarView + `data-calendar-skin="integrated"` 부여 시) |
| 내담자 | `/client/schedule` | 동일 |

→ **SSOT 한 곳 (`ScheduleCalendarView.css`) fix로 3화면 동시 해결**. 별도 화면별 hotfix 불필요.

### 6.2 비대상 화면 (회귀 없음 — 스코프 한정)

| 화면 | 라우트 | 영향 |
| --- | --- | --- |
| 레거시 상담사 | `/consultant/schedule` (`ConsultantSchedule.js`) | 영향 없음 (`data-calendar-skin="integrated"` 미부여) |
| 어드민 일반 스케줄 | `/admin/schedules` | 영향 없음 |
| 상담일지 캘린더 | `/admin/consultation-log` | 영향 없음 |

→ P1 셀렉터의 4중 cascade prefix `[data-calendar-skin="integrated"] .mg-v2-schedule-calendar.mg-v2-ad-b0kla .mg-v2-schedule-calendar-view td.fc-daygrid-day.mg-v2-ad-calendar-day--kr-public-holiday` 가 통합 스킨 한정을 보장.

### 6.3 단위 테스트 추가 권고 (core-tester 위임 시 포함)

- `ScheduleCalendarView.test.js` (신설 권고)
  - **TC1**: dayGridMonth + integrated skin + 2026-05-24 (일요일 + 부처님오신날) → td에 `mg-v2-ad-calendar-day--kr-public-holiday` 클래스 부여, 계산된 `background-color`가 transparent가 아닌 분홍 계열인지 검증 (`getComputedStyle` jsdom 한계 시 클래스 부여만 검증)
  - **TC2**: 2026-05-25 (월요일 + 대체공휴일) → 동일
  - **TC3**: 2026-05-17 (일요일, 비공휴일) → `mg-v2-ad-calendar-day--weekend-sun` 클래스 부여, `--kr-public-holiday` 미부여
  - **TC4**: integrated가 아닌 스킨 → 어떤 weekend/holiday 셀 클래스도 부여되지 않음
- `ScheduleLegend.test.js`는 변경 불필요 (텍스트 검증만)
- **시각 회귀** (Playwright/Percy 등 도구가 있다면): `/admin/integrated-schedule` 2026-05 월간 1장 스냅샷

---

## 7. 후속 위임 권고

### 7.1 core-coder 위임 프롬프트 (드래프트)

```
## 작업: 캘린더 공휴일 셀 배경 cascade 미적용 회귀 수정 (P1)

### 참조 문서
- 본 보고서: docs/project-management/2026-05-23/CALENDAR_HOLIDAY_BG_REGRESSION_ANALYSIS.md
- 오케스트레이션: docs/project-management/2026-04-28/INTEGRATED_SCHEDULE_CALENDAR_CSS_ARCHITECTURE_ORCHESTRATION.md §4.2
- 운영 게이트: docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md
- 스킬: /core-solution-frontend, /core-solution-design-system-css

### 변경 대상
- frontend/src/components/ui/Schedule/ScheduleCalendarView.css L208-213, L230-232, L335-345

### 변경 내용
1. L208-213 td.kr-public-holiday 셀의 background-color: transparent !important; 를
   color-mix(in srgb, var(--mg-error-300) 16%, var(--mg-color-background-main, var(--mg-color-surface-main))) !important;
   (16% 톤은 core-designer 합의 후 미세 조정 가능)
2. L221-224 :hover 블록도 동일 톤의 22% 또는 상응 변형으로 변경
3. L230-232 .fc-daygrid-day-frame background-color: transparent 유지 (상위 td 배경 노출)
4. L335-345 통합 스킨 .mg-v2-ad-calendar-day-holiday-badge 의 background-color 를 transparent 로 변경 (흰 띠 제거)
5. L194-195 주석 갱신: "공휴일 = 텍스트 중심" → "공휴일 = 셀 배경 분홍 + 날짜·배지 텍스트 빨강 (범례 문구 정합)"

### 완료 조건 (체크리스트)
- [ ] 빌드 통과 (build:ci)
- [ ] /admin/integrated-schedule 2026-05 월간 캡처: 17일 분홍 / 24일 분홍 / 25일 분홍 / 31일 분홍
- [ ] /admin/schedules, /consultant/schedule, /admin/consultation-log 1장씩 회귀 캡처 (영향 없어야)
- [ ] 하드코딩 게이트: 신규 hex 없음 (토큰만 사용 확인)
- [ ] core-tester에 단위 테스트 추가 의뢰 (§6.3 TC1-4)
- [ ] 본 보고서 §5 표 갱신 (실제 적용 톤·hex)
```

### 7.2 core-designer 위임 (병렬 또는 선행)

- **결정 필요 항목**:
  - 공휴일 배경 톤: 일요일(12%)과 동일 / 한 단계 진하게(16~20%) / 별도 hue
  - 공휴일 + 일요일 겹침(2026-05-24 같은 경우): 한 톤만 적용 (P1 디폴트) vs 두 톤 색 병합
  - 공휴일 배지 배경: 투명(P1 권고) vs 기존 흰 띠 유지 (가독성 트레이드오프)
- **산출물**: 화면 스펙 1p + 토큰 매핑(P3 흡수 시 사용)
- **모델 권고**: `gemini-3.1-pro` (워크스페이스 룰 §1 디자인·시안 권고)

### 7.3 core-tester 위임 (P1 적용 후)

- §6.3 TC1-4 ScheduleCalendarView 단위 테스트 신설
- 스모크: /admin/schedules·/consultant/schedule·/admin/consultation-log 회귀 캡처
- `build:ci` 통과 확인

### 7.4 옵션 A 정착과의 정합

- 옵션 A (`CALENDAR_DESIGN_UNIFICATION_PLAN.md`) 채택 후 상담사 renewal·내담자 페이지를 동일 `ScheduleCalendarView` + `data-calendar-skin="integrated"` 부여로 통일하면, P1 패치가 자동으로 3화면에 전파된다. **P1은 옵션 A의 선행 디버그 클린업으로 위치**.

---

## 8. 변경 이력

| 일자 | 작성자 | 내용 |
| --- | --- | --- |
| 2026-05-23 21:35 KST | core-debugger | 초안 작성 (정적 분석, 코드 무변경) |
