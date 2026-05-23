# 통합 캘린더 옵션 A 디자인 핸드오프

> P1 디자이너 핸드오프 — 옵션 A (어드민 캘린더 재사용) 적용 + 공휴일 배경 fix + 회기 라벨 통일 + 모바일 분기 시안.

## 1. 적용 범위

| 화면 | 라우트 | 변경 사항 |
| --- | --- | --- |
| 어드민 통합 스케줄 | `/admin/integrated-schedule` | 무변경 (SSOT) |
| 어드민 일반 스케줄 | `/admin/schedules` | 회기 라벨 ON, 공휴일 배경 fix |
| 어드민 SchedulePage | `/admin/schedule` | 회기 라벨 ON, 공휴일 배경 fix |
| 상담사 renewal | `/consultant/renewal/schedule` | (데스크탑) 어드민 캘린더 적용 / (모바일) day-bar 유지 |
| 내담자 일정 | `/client/schedule` | 어드민 캘린더 적용 (구트리 ScheduleCalendar 폐기) |

## 2. 공휴일 배경 톤·겹침 결정 (P1 시각 명세)

### 2.1 결정 옵션

| 옵션 | 일요일 | 공휴일 | 토요일 | 일요일+공휴일 겹침 | 토요일+공휴일 겹침 |
| --- | --- | --- | --- | --- | --- |
| **A — 일요일과 동일 톤** (추천) | `var(--mg-calendar-weekend-sun-bg)` (현재 연한 분홍) | 동일 (`--mg-calendar-holiday-bg = --mg-calendar-weekend-sun-bg`) | 연한 파랑 | 분홍 | 공휴일 우선 (분홍) |
| **B — 별도 톤 (공휴일이 좀 더 진한 분홍)** | 연한 분홍 (`#FCEAEA` 등) | 약간 진한 분홍 (`#F8D7DA` 등) | 연한 파랑 | 공휴일 우선 | 공휴일 우선 |
| **C — 통합 톤 (주말·공휴일 단일 분홍)** | 분홍 | 분홍 (동일) | 분홍 (토요일도 분홍으로 통일) | 분홍 | 분홍 |

**권고**: **옵션 A** — 사용자 요구 "일요일·공휴일 한 세트" 명확 충족 + 토요일은 별도 톤 유지(연한 파랑) + 범례 문구 정합("공휴일 우선" 자연 충족).

### 2.2 hex 확정

- `--mg-calendar-weekend-sun-bg` 현재 hex 확인 (`ScheduleCalendarView.css` 또는 `unified-design-tokens.css`)
- `--mg-calendar-holiday-bg` 신설 (또는 weekend-sun-bg 재사용)
- 다크 모드 cascade hex 정의

### 2.3 z-order

- 셀 배경 (z:0): `td.fc-daygrid-day.mg-v2-ad-calendar-day--kr-public-holiday` 분홍 배경
- 공휴일 배지 (z:1): `.mg-v2-ad-calendar-holiday-name-badge` (또는 식별된 배지 클래스)
- 날짜 텍스트 (z:2): `.fc-daygrid-day-number` 빨간 글씨

### 2.4 텍스트 색

- 날짜: 일요일·공휴일 동일 빨간색 (현재 색 유지)
- 공휴일 배지 텍스트: 진한 빨강 (`--mg-calendar-holiday-text` 신설)

### 2.5 디자인 토큰 신설 (P3, D11 사이클 흡수)

```css
:root {
  --mg-calendar-holiday-bg: var(--mg-calendar-weekend-sun-bg);
  --mg-calendar-holiday-text: var(--mg-calendar-weekend-sun-text);
  --mg-calendar-holiday-badge-bg: rgba(255, 255, 255, 0.8);
  --mg-calendar-holiday-badge-text: #C0392B; /* 추정 */
}

@media (prefers-color-scheme: dark) {
  :root {
    --mg-calendar-holiday-bg: var(--mg-calendar-weekend-sun-bg-dark);
    /* ... */
  }
}
```

## 3. 회기 라벨 표시 (옵션 A 적용)

### 3.1 props 전파

옵션 A 적용 시 다음 caller 모두 `integratedMonthEventLayout=true` + `calendarSkin="integrated"` props 전파:

| caller 파일 | 변경 사항 |
| --- | --- |
| `ConsultantSchedule.js` (레거시, 옵션 외) | 변경 없음 |
| `ConsultantScheduleRenewal.js` (데스크탑만) | 어드민 컴포넌트 + 두 props |
| `ClientSchedule.js` | 구트리 ScheduleCalendar → 어드민 컴포넌트 + 두 props |
| `AdminSchedulesPage.js` | 두 props 추가 |
| `SchedulePage.js` | 두 props 추가 |

### 3.2 회기 라벨 노출 매트릭스

| 권한 | 라벨 노출 |
| --- | --- |
| ADMIN/STAFF | 본인 테넌트의 모든 매칭 회기 (예: "오후 5시 황여진 0/2회") |
| CONSULTANT | 본인 매칭 내담자 회기 (백엔드가 본인 스코프 강제) |
| CLIENT | 본인 회기 (백엔드가 본인 스코프 강제) |

### 3.3 라벨 포맷

- 어드민 현재: "오후 5시 황여진 0/2회"
- 통일 후 동일 포맷
- 회기 부재 시 "오후 5시 황여진" (기존)

## 4. 모바일 분기 (Q1=preserve)

### 4.1 라우트 분기 명세

`ConsultantScheduleRenewal.js`:
- 데스크탑 (>= 1024px): 어드민 캘린더 컴포넌트 (`UnifiedScheduleComponent`)
- 모바일 (< 1024px): 기존 7일 day-bar + 타임라인 카드 + 바텀시트 UX 유지

### 4.2 breakpoint 결정

- `unified-design-tokens.css` 또는 `_breakpoints.css` 의 기존 토큰 활용
- 권고: `--mg-breakpoint-tablet` (1024px) 또는 동일 가치 토큰

### 4.3 분기 패턴

```jsx
const isDesktop = useMediaQuery('(min-width: 1024px)');
return isDesktop
  ? <UnifiedScheduleComponent userRole="CONSULTANT" integratedMonthEventLayout calendarSkin="integrated" />
  : <ExistingDayBarTimeline ... />;
```

### 4.4 모바일 day-bar 유지 사유

- 사용자 컨펌 (Q1=preserve)
- 모바일 좁은 화면에서 FullCalendar dayGridMonth 가독성 저하
- 기존 바텀시트 UX (상담 시작/완료 액션) 보존

## 5. 시각 회귀 검수 셀렉터

| 셀렉터 | 검증 항목 |
| --- | --- |
| `td.fc-day-sun.fc-daygrid-day` | 일요일 분홍 배경 (변경 전후 동일) |
| `td.fc-day-sat.fc-daygrid-day` | 토요일 연한 파랑 배경 (변경 전후 동일) |
| `td.mg-v2-ad-calendar-day--kr-public-holiday` | 공휴일 분홍 배경 신규 적용 (P1 fix) |
| `td.fc-day-sun.mg-v2-ad-calendar-day--kr-public-holiday` | 일요일+공휴일 분홍 배경 (단일 톤) |
| `.mg-v2-ad-calendar-event` | 회기 라벨 포함 (`0/2회` 형식) |
| `.consultant-schedule-renewal` (모바일) | day-bar UX 회귀 없음 |
| `.mg-v2-schedule-calendar-view` (데스크탑) | 어드민 통합 스킨 적용 |

## 6. 후속 코더 위임 권고

다음 본문 그대로 core-coder 위임 프롬프트에 첨부:

### 6.1 CSS 패치 (P1)
- `ScheduleCalendarView.css:208-213` 의 `background-color: transparent !important` 제거
- 신규 토큰 `--mg-calendar-holiday-bg` 신설 + 셀에 적용
- 다크 모드 cascade 정의

### 6.2 JS 가드 수정
- `ScheduleCalendarView.js:119` 의 `!holidayName` 가드 제거 또는 공휴일 셀에도 weekend-sun 클래스 부여

### 6.3 옵션 A 적용
- `ConsultantScheduleRenewal.js` 데스크탑 분기 + `UnifiedScheduleComponent` 적용
- `ClientSchedule.js` 구트리 ScheduleCalendar → `UnifiedScheduleComponent` 교체
- `AdminSchedulesPage.js`/`SchedulePage.js` props 추가
- 구트리 `ScheduleCalendar.{js,css}` + 하위 4개 모듈 폐기 (use 0 검증 후)

### 6.4 단위 테스트
- 공휴일 셀 배경 적용 — TC1 일요일·공휴일 분홍 동일
- 토요일+공휴일 겹침 — TC2 공휴일 우선 (분홍)
- 회기 라벨 노출 — TC3 caller 3개 모두 표시
- 모바일 분기 — TC4 < 1024px day-bar 노출, >= 1024px 어드민 캘린더 노출

### 6.5 하드코딩 게이트
- `scripts/check-hardcode.sh` 통과
- `lint:codemod-mappings` 통과

## 7. 변경 이력

- 2026-05-23 신설 — explore a9e5c535·6f45763f + core-debugger b9244a46 + 사용자 컨펌 옵션 A·Q1=preserve·Q2=yes 통합
