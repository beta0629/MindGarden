# GNB 벨 알림 카운트 정책

**문서 경로**: `docs/project-management/GNB_NOTIFICATION_BADGE_COUNT_POLICY.md`  
**목적**: GNB 우측 벨 아이콘(`.mg-v2-notification-trigger`)에 표시하는 알림 배지의 카운트 정책을 정의한다.

---

## 1. 정책 요약

| 항목 | 내용 |
|------|------|
| **표시 대상** | **확인 안 된(미읽음) 알림**의 총 개수만 배지에 표시한다. |
| **집계 범위** | **시스템 공지(미읽음)** + **본인 메시지(미읽음)** 의 합계. |
| **0일 때** | 배지를 **비표시**한다. (배지 DOM 자체를 렌더하지 않음.) |
| **99 초과 시** | **"99+"** 로 표기한다. |
| **표시 위치** | GNB 우측 벨 트리거 버튼 우상단(`.mg-v2-notification-trigger-wrapper` 기준 `position: absolute`). |

---

## 2. 상세 규칙

- **시스템 공지**: `loadUnreadSystemCount()` / `/api/v1/system-notifications/unread-count` 기준 미읽음 개수.
- **본인 메시지**: 역할(ADMIN/CONSULTANT/CLIENT)에 따라 해당하는 `unread-count` API 기준 미읽음 개수.
- **총합**: `totalUnread = unreadSystemCount + unreadMessageCount`. 이 값만 배지에 사용하며, 별도 필터나 역할별 분리 표기는 하지 않음.
- **접근성**: 배지에 `aria-label`로 "읽지 않은 알림 N개" 또는 "읽지 않은 알림 99개 이상" 제공.

---

## 3. 구현 참조

- **Context**: `NotificationContext` — `unreadSystemCount`, `unreadMessageCount` 제공; `loadUnreadCount()`가 둘을 병렬 로드.
- **표시**: `NotificationDropdown`에서 `totalUnread = (unreadSystemCount || 0) + (unreadMessageCount || 0)` 계산 후 `NotificationBadge count={totalUnread}` 로 전달.
- **배지 컴포넌트**: `dashboard-v2/atoms/NotificationBadge.js` — `count <= 0`이면 `null`, `count > 99`이면 `"99+"` 렌더.
- **스타일**: `NotificationBadge.css` — `.mg-v2-notification-badge` (위치·크기·색상·폰트).

---

## 4. 원인 후보 및 수정 방향 (기획 취합)

탐색(explore) 및 코드 확인 결과, 배지가 안 보이는 현상에 대한 **원인 후보**와 **수정 방향**은 아래와 같다.

| # | 원인 후보 | 수정 방향 |
|---|-----------|-----------|
| 1 | **공개→보호 라우트 전환 시 미호출** — `NotificationProvider`의 `useEffect` 의존성이 `[isLoggedIn, user?.id]`만 있어, 로그인 직후 공개 경로(랜딩/로그인 등)에 있을 때 effect가 실행되면 `isPublicRoute()`로 `loadUnreadCount()`가 스킵된다. 이후 대시보드 등 보호된 경로로 라우트만 변경되어도 effect가 재실행되지 않아, 카운트가 한 번도 로드되지 않고 0으로 유지될 수 있다. | **보호된 경로 진입 시** `loadUnreadCount()`를 한 번 호출하도록 보강한다. 예: `pathname`(또는 라우트)을 effect 의존성에 포함하거나, 라우트 변경 시 비공개 경로로 진입할 때 Context의 `loadUnreadCount()`를 호출하는 리스너/훅을 둔다. |
| 2 | **API 지연/실패** — 첫 로드나 네트워크 지연 시 0으로 보일 수 있고, 폴링 주기(현재 10초) 전까지는 갱신이 없다. | 공개→보호 전환 시 즉시 로드(위 1번)로 상당 부분 완화된다. 필요 시 폴링 간격 단축은 별도 검토. |
| 3 | **배지 z-index 미지정** — `.mg-v2-notification-badge`에 `z-index`가 없어, GNB/트리거 영역의 다른 요소에 의해 가려질 가능성이 있다. | 배지가 버튼 위에 확실히 보이도록 `.mg-v2-notification-badge`에 `z-index`(예: `2` 또는 `10`)를 부여한다. |

---

**적용 순서**: (1) 정책 문서 본 문서 유지, (2) 원인 1·3에 대한 수정을 core-coder에 배정하여 반영, (3) 배지 동작이 "총 미확인 알림만 표시, 0이면 비표시, 99+ 표기"를 따르는지 확인.
