# GNB 통합 알림 · 관리자 통합 페이지 구현 보고

**담당**: core-coder  
**참조**: GNB_AND_ADMIN_NOTIFICATION_INTEGRATION_POLICY.md §5 체크리스트, GNB_AND_ADMIN_NOTIFICATION_UI_SPEC.md  
**일자**: 2026-03-17

---

## 1. 구현 요약

| 항목 | 상태 | 비고 |
|------|------|------|
| GNB 배지 통합 카운트 | ✅ | NotificationContext `unreadCount`(unreadSystemCount + unreadMessageCount) 사용, dashboard-v2/atoms/NotificationBadge, 99+ 규칙 및 aria-label("읽지 않은 알림 99개 이상") 반영 |
| GNB 드롭다운 2탭 | ✅ | "시스템 공지" \| "메시지" 탭, 퍼블 마크업(gnb-notification-dropdown.html) 클래스·DOM·role/aria 반영 |
| GNB 드롭다운 API | ✅ | 공지: GET /api/v1/system-notifications (page, size). 메시지: 역할별 GET /api/v1/consultation-messages/consultant|client|all. StandardizedApi 사용 |
| GNB 한 행·헤더·푸터 | ✅ | 한 행(아이콘·제목·시간·미읽음 도트·발신), 헤더 "알림" + "모두 읽음", 푸터 "알림 전체 보기" → /notifications (Link) |
| /admin/notifications | ✅ | AdminNotificationsPage, AdminCommonLayout, ContentHeader, 탭(시스템 공지 \| 메시지), 탭별 SystemNotificationManagement(contentOnly) / AdminMessages(contentOnly) |
| LNB 메뉴 | ✅ | DEFAULT_MENU_ITEMS(폴백) "알림·메시지 관리" → ADMIN_ROUTES.NOTIFICATIONS (/admin/notifications). API LNB는 DB 기반이므로 DB 메뉴 path를 /admin/notifications로 추가 시 동일 적용 |
| 기존 경로 리다이렉트 | ✅ | /admin/system-notifications, /admin/messages → Navigate to /admin/notifications |
| common/NotificationBadge | ✅ | GNB는 dashboard-v2/atoms만 사용. common/NotificationBadge는 기존 @deprecated 주석 유지(모달·컨텍스트 연동형, 개수만 쓸 때는 dashboard-v2/atoms 사용 권장) |
| 반응형 | ✅ | 드롭다운 360px/320px(기존 CSS), 관리자 탭·목록 모바일(AdminNotificationsPage.css) |

---

## 2. 변경·추가 파일

- **frontend**
  - `components/dashboard-v2/atoms/NotificationBadge.js` — 99+ 시 aria-label "읽지 않은 알림 99개 이상"
  - `components/dashboard-v2/molecules/NotificationDropdown.js` — 전면 확장(NotificationContext, 2탭, system-notifications/consultation-messages API, 퍼블 구조)
  - `components/dashboard-v2/molecules/NotificationDropdown.css` — 탭 바·패널 콘텐츠 스타일
  - `components/admin/AdminNotificationsPage.js` — 신규 통합 페이지
  - `components/admin/AdminNotificationsPage.css` — mg-v2-ad-b0kla__tabs, __tab, __section 등
  - `components/admin/SystemNotificationManagement.js` — contentOnly prop, 통합 페이지용 블록·이벤트 수신(공지 작성)
  - `components/admin/AdminMessages.js` — contentOnly prop, 통합 페이지용 블록
  - `constants/adminRoutes.js` — NOTIFICATIONS: '/admin/notifications', 기존 경로 @deprecated
  - `components/dashboard-v2/constants/menuItems.js` — 알림 항목 → "알림·메시지 관리", NOTIFICATIONS 경로
  - `App.js` — /admin/notifications 라우트, /admin/system-notifications·/admin/messages 리다이렉트

---

## 3. 정책 문서 §5 체크리스트 대응

- [x] GNB 배지: 통합 카운트(공지+메시지), 99+ 규칙, NotificationContext 연동
- [x] GNB 드롭다운: 2탭(시스템 공지 \| 메시지), 각 API 연동, 한 행·헤더·푸터 스펙 반영
- [x] 관리자: /admin/notifications 단일 페이지, AdminCommonLayout, 탭·목록·모달 동작
- [x] LNB: "알림·메시지 관리" 메뉴 추가(폴백), 기존 경로 리다이렉트
- [x] common/NotificationBadge: GNB에서 사용 없음(dashboard-v2만 사용), deprecated 유지
- [x] 반응형: 드롭다운 360px/320px, 관리자 탭·목록 모바일 대응

---

## 4. 참고 사항

- **공지/메시지 목록 API**: system-notifications는 `response.data.notifications`, consultation-messages는 `response.data.messages`(역할별 엔드포인트) 기준으로 파싱. 백엔드 응답 형식 변경 시 드롭다운 파싱만 점검하면 됨.
- **LNB DB 메뉴**: 실제 운영 LNB는 `/api/v1/menus/lnb` 기반이므로, "알림·메시지 관리" 단일 메뉴를 쓰려면 DB(또는 시드)에 menuPath `/admin/notifications` 로 메뉴 추가 필요. 폴백용 DEFAULT_MENU_ITEMS는 반영 완료.
- **모두 읽음**: 현재 드롭다운 "모두 읽음"은 현재 로드된 공지/메시지 목록에 대해 항목별 읽음 처리 후 Context 새로고침. 백엔드에 read-all API 추가 시 한 번에 처리하도록 교체 가능.

---

*구현 완료. 기획(core-planner) 검토 후 배포·운영 반영.*
