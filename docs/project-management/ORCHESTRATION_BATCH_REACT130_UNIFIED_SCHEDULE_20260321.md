# 오케스트레이션 배치: React #130 + UnifiedSchedule (2026-03-21)

## 사용자 로그 요약

- URL/경로: **`/admin/dashboard`** (React Router 로그 일치).
- 직전 로그: **`📅 UnifiedScheduleComponent 렌더링: { userRole: 'ADMIN', userId: undefined }`** (2회).
- 직후: **`Minified React error #130`** (`args[]=object` — 객체를 React 자식으로 렌더).
- `main.b7198a9b.js` 동일 해시 → **배포 번들이 최신인지** core-tester가 배포 후 `main.*.js` 해시·소스맵으로 확인 권장.

## core-planner 지시

1. **core-debugger**에게 아래 **검증 과제**를 먼저 할당한다.
2. **core-coder**에게만 패치를 허용한다 (파일 경로·완료 조건 아래).
3. **core-tester**로 게이트: `/admin/dashboard`, `/admin/integrated-schedule`, `/admin/schedules` 스모크 + 콘솔 #130 0건.

---

## core-debugger 과제 (원인 확정)

| ID | 확인 내용 |
|----|-----------|
| D1 | **프로덕션에서** `/admin/dashboard` 로드 시 `UnifiedScheduleComponent`가 **왜** 마운트되는지: React DevTools Profiler 또는 `why-did-you-render`/일시적 `console.trace`로 **부모 컴포넌트** 확정. (로컬 소스상 `AdminDashboardV2`는 `UnifiedSchedule`를 import하지 않음 — **배포물 차이·중복 Route·히스토리 상태** 가능성.) |
| D2 | #130 **첫 불량 자식** 특정: **dev 빌드**(`npm start`)로 동일 계정/테넌트 재현 후 React 에러 전체 메시지 확인. |
| D3 | `972.*.chunk.js` = `AdminDashboardV2` 청크. 청크에 `UnifiedSchedule` 문자열 포함 여부 **번들 분석**(`source-map-explorer` 등). |

---

## core-coder 과제 (우선순위 — 코드 리뷰 기반 후보)

### P0 (강력 후보 — 즉시 패치 권장)

**파일**: `frontend/src/components/ui/Schedule/ScheduleHeader.js`  
**위치**: `<option>…{consultant.name}…</option>` (약 37–40행)  
**문제**: API/매핑에서 `consultant.name`이 **문자열이 아닌 객체**이면 **React #130**.  
**수정**: `toDisplayString(consultant.name, '—')` 사용 (`safeDisplay.js`). `<option>` 표시값은 반드시 문자열로 정규화.

### P1

**파일**: `frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.js`  
**내용**: `UnifiedScheduleComponent`에 `userId` 미전달 → 로그 `userId: undefined`와 일치. **ADMIN에도 세션 `user.id` 전달** 여부 제품 규격에 맞게 정리 (표시/권한/로그만이면 optional, 백엔드 호출에 필요하면 필수).

### P2

- `ScheduleLegend`: 이미 `toDisplayString` 적용됨 — 회귀 없는지 확인.
- `UnifiedScheduleComponent` 하위 모달/FullCalendar 커스텀 **content**에서 객체 출력 여부 전수 스캔.

---

## core-tester 수락 기준

- [ ] develop 빌드 후 관리자 OAuth → `/admin/dashboard` **30초 이상 유지** (알림 폴링 포함) 시 **콘솔 #130 없음**.
- [ ] `/admin/integrated-schedule`에서 스케줄 헤더 상담사 드롭다운·캘린더 정상.
- [ ] 회귀: `CustomSelect`·알림 드롭다운·KPI 행.

---

## 참고 문서

- `CORE_PLANNER_DELEGATION_ORDER.md` (직접 수정 금지 / **core-tester 게이트**)
- `attachments/ADMIN_DASHBOARD_REACT130_SCAN_20260321.md`
