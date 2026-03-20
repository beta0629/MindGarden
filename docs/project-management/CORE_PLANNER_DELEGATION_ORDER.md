# core-planner 위임 명령 (오케스트레이션 전용)

**대상**: `core-planner`  
**목적**: 프론트 품질·React 자식 안전(#130)·에러/KPI/API 필드 표시 관련 작업을 **단일 기획 주관**으로 실행하고, **일반 대화형 어시스턴트의 직접 코드 수정을 금지**한다.

---

## 명령 (아래 블록을 core-planner에게 전달)

```
역할: core-planner (오케스트레이터)

당신이 주관한다. 일반 어시스턴트(Auto/채팅 에이전트)는 이 과제에서 소스 코드를 직접 수정하지 않는다.

범위:
- React minified #130 / "Objects are not valid as a React child"
- JSX에 API 필드·error·숫자 필드(obj) 직접 렌더
- safeDisplay / SafeErrorDisplay / toSafeNumber 도입·확장·치환
- 차트 labels·KPI·스케줄 표시 등 동적 값 방어

필수 절차:
1) 배치 착수 전: explore로 인벤토리 갱신(필요 시), core-debugger로 High/Medium 정리,
   core-component-manager와 공통 컴포넌트·중복 배치 합의(회의 결과 1페이지 요약 문서화).
2) 구현: 반드시 core-coder에만 패치를 맡긴다. 파일 경로·완료 조건·회귀 체크리스트를 명시한다.
3) 검증(필수): 코드 변경이 있으면 반드시 core-tester가 역할별 스모크·회귀·콘솔 #130 0건 등을 확인한다. 미통과 시 배치 미완료.
4) 사용자 보고: 스캔 요약 / PR 범위 / 잔여 리스크 / 다음 배치를 한 장으로 취합한다.

참고 문서:
- docs/project-management/FRONTEND_REACT_CHILD_SAFETY_FULL_AUDIT_ORCHESTRATION.md (본편 §0·§4)
- docs/project-management/attachments/FRONTEND_REACT_CHILD_INVENTORY_20260212.md
- docs/project-management/ORCHESTRATION_BATCH_REACT130_UNIFIED_SCHEDULE_20260321.md (대시보드 #130 + UnifiedSchedule 배치)

위 지시를 수락하고, 다음 배치 작업 계획서와 서브에이전트 배분표부터 출력하라.
```

---

## 사용 방법

1. Cursor에서 **core-planner** Task를 열고, 위 **명령 블록**을 프롬프트에 붙여넣는다.  
2. 이후 사용자 요청은 “위 오케스트레이션 문서에 따라 진행” 한 줄로 플래너에 위임해도 된다.

---

## 사용자 강제 규칙 (필수)

| 규칙 | 내용 |
|------|------|
| **직접 수정 금지** | 일반 대화형 어시스턴트는 **소스 코드를 직접 수정하지 않는다.** 구현은 **`core-planner` → `core-coder`(또는 명시된 서브에이전트)** 에만 위임한다. |
| **검증 게이트** | **코드 변경이 수반된 배치는 반드시 `core-tester`로 검증**한다(스모크·회귀·콘솔 오류 0건 등). 테스터 통과 전 작업 완료로 보고하지 않는다. |

**작성**: 2026-03-22 · 운영 규칙 반영

---

## 인시던트 메모 (2026-03-21) — React #130 + `UnifiedScheduleComponent` 로그

**사용자 요청**: 일반 어시스턴트의 직접 수정 금지 → **아래 분석은 `core-planner` → `core-debugger` / `core-coder` 파이프라인으로만 반영.**

### 증상

- 운영 번들에서 **`Error: Minified React error #130`** (`args[]=object`) 반복.
- 직전 콘솔: **`📅 UnifiedScheduleComponent 렌더링: { userRole: 'ADMIN', userId: undefined }`** (동일 로그가 2회 — React 18 개발 모드/이중 렌더와 혼동 주의, **프로덕션은 minify**).
- 앞선 로그에 **`[Dashboard Charts] consultation-completion`**(= `AdminDashboardV2`의 fetch 로그)가 있어, **한 탭에서 대시보드만 본 것인지** vs **이후 `/admin/integrated-schedule` 등으로 이동했는지** 콘솔만으로는 100% 단정 어려움.

### 코드 상 관찰 (원인 후보 정렬)

1. **`userId: undefined` + `userRole: 'ADMIN'`**  
   - `frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.js`에서  
     `UnifiedScheduleComponent`에 **`userId` 미전달**(기본값 `undefined`).  
   - → 동일 로그가 나오면 **최소한 해당 트리(통합 스케줄 화면)가 마운트된 시점**으로 추적할 것.
2. **React #130**  
   - 일반적으로 **객체를 JSX 자식으로 렌더**하거나, **차트/tooltip 라벨 등에 원시 객체**가 들어간 경우.  
   - 우선 점검 트리: `UnifiedScheduleComponent` → `ScheduleHeader`, `ScheduleLegend`, `ScheduleCalendarView`, 모달 타이틀/상태 문구 등 API 매핑 구간.
3. **대시보드 단독 경로**  
   - `AdminDashboardV2` 정적 import 트리에는 `UnifiedScheduleComponent` 없음.  
   - **실제 `location.pathname`을 에러 시점에 한 줄 로깅**해 대시보드인지 통합 스케줄인지 확정할 것(디버깅용, 배포 전 제거).

### core-planner 액션 아이템

| 담당 | 작업 |
|------|------|
| **core-debugger** | 프로덕션에서 dev 번들이 아닐 때 재현 경로 확정(pathname), #130 스택과 함께 **첫 불량 JSX** 후보 파일/라인 후보 보고. |
| **core-coder** | `IntegratedMatchingSchedule`에서 ADMIN용 `userId` 필요 여부 규격화(세션 `user.id` 전달 vs 옵션 유지) + 스케줄 UI 전역 `toDisplayString`/`toSafeNumber` 정리. |
| **core-tester** | `/admin/dashboard`, `/admin/integrated-schedule`, `/admin/schedules` 역할별 스모크 + 콘솔 #130 0건. |

위 행은 **명령 블록(본 문서 상단)과 동일한 오케스트레이션** 안에서만 실행한다.

### 보강 (2026-03-21 로그 v2) — `/admin/dashboard` 단독 + 알림 폴링

- **`UnifiedScheduleComponent` 로그 없이** `#130` 발생 사례 확인됨.
- 트리거 상관: **`NotificationContext` `setInterval` → `loadUnreadCount`** 직후 리렌더.
- **전수 스캔·우선순위 표**: `docs/project-management/attachments/ADMIN_DASHBOARD_REACT130_SCAN_20260321.md`
- **core-planner**: 위 첨부를 배치 입력으로 넘기고, P0→P2 순으로 `core-coder`에 파일 단위 지시한 뒤 `core-tester`로 폴링 후 스모크.
