# Admin 대시보드 React #130 스캔 (2026-03-21)

## 재현 로그 특징 (최신)

- `🔍 현재 경로: /admin/dashboard` — **통합 스케줄 미포함 화면에서도 재현 가능**.
- `#130` 직전: **`⏰ 주기적 알림 갱신 - loadUnreadCount 호출`** → **`📢 읽지 않은 공지 개수 업데이트: 2`**.
- 의미: `NotificationContext`가 `unreadMessageCount` / `unreadSystemCount` / `unreadCount`를 갱신하면서 **대시보드 전체가 리렌더**되고, 그 시점에 **어딘가에서 객체가 JSX 자식으로 들어감**.

## React #130 요약

- Minified `invariant=130&args[]=object`: **객체를 React 자식으로 렌더**한 경우가 대부분.

## 코드베이스 고위험 지점 (grep/리뷰 기준)

| 우선순위 | 파일 | 내용 |
|----------|------|------|
| P0 | `contexts/NotificationContext.js` | 카운트는 `typeof === 'number'`로 이미 방어. 리렌더 **트리거**만 해당. |
| P0 | `dashboard-v2/atoms/NotificationBadge.js` | `count`가 비정상 타입이면 `{displayCount}`에 객체 전달 가능 → **Number 정규화 권장**. |
| P0 | `common/CustomSelect.js` | `{option.label}`, `{selectedOption.label}` — API/`c.name`이 객체이면 **#130**. |
| P0 | `AdminDashboard/.../MatchQueueRow.js` | `{clientName}`, `{clientMeta}` 직접 렌더. |
| P1 | `DepositPendingList.js`, `SchedulePendingList.js` | `clientName`, `consultantName` 직접 렌더. |
| P1 | `dashboard-v2/molecules/NotificationDropdown.js` | `item.title`, `item.content?.slice`, `senderName`/`receiverName` 조합. |
| P1 | `ui/Card/StatCard.js` | `{value}`, `{label}`, `{change}` — 다른 화면에서 객체 전달 시 #130. |
| P2 | `common/Badge.js` | `variant !== 'kpi'&&'count'`일 때 `displayContent`가 raw `label`/`value`. |
| P2 | `UnifiedScheduleComponent` + `IntegratedMatchingSchedule` | 과거 로그와 함께 **별도 경로**에서도 점검. |

## Workspace 적용 메모 (코어 코더 선행 방어)

다음 파일에 **`toDisplayString` / `toSafeNumber` 방어**를 반영함 (배포 후에도 `core-planner` 잔여 P1~P2 스윕 유지):

- `dashboard-v2/atoms/NotificationBadge.js`
- `common/CustomSelect.js`
- `AdminDashboard/molecules/MatchQueueRow.js`
- `AdminDashboard/organisms/DepositPendingList.js`, `SchedulePendingList.js`
- `dashboard-v2/molecules/NotificationDropdown.js`
- `ui/Card/StatCard.js`
- `dashboard-v2/AdminDashboardV2.js` (toast 본문)

## core-planner 지시 (잔여 스윕)

1. **core-explore**: `frontend/src/components/admin` · `dashboard-v2` · `common` 아래  
   `>{[a-z][a-zA-Z0-9_.]*}` 패턴 또는 `children=\{[^'"]` 형태 수동 리뷰.
2. **core-coder**: 표에 없는 컴포넌트도 동일 패턴이면 `toDisplayString` / `ContentKpiRow.safeKpiChild` 패턴 통일.
3. **core-tester**: `/admin/dashboard`에서 **폴링 주기(기본 60초 등) 이후** 콘솔 #130 0건 확인.

## 참고

- 상위 위임: `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`
