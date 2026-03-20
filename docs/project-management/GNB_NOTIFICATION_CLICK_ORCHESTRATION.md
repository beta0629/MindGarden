# GNB 알림 드롭다운 클릭 → 상세·읽음 (오케스트레이션 메모)

**이슈**: 시스템 공지 행 클릭 시 패널만 닫히고 읽음/상세가 기대와 다름.

## 원인 (구현 완료)

| 항목 | 내용 |
|------|------|
| 읽음 API 불일치 | 백엔드 `POST /api/v1/system-notifications/{id}/read` 인데, 프론트 `NotificationContext` 등에서 **GET** 호출 → 읽음 처리 실패 |
| 상세 미연결 | `NotificationDropdown` 클릭 시 `setIsOpen(false)`만 수행, 통합 알림 페이지의 상세 모달과 경로 없음 |

## 조치 (코드)

- `NotificationContext.markSystemNotificationAsRead`: **apiPost** 로 통일
- 동일 GET 호출 위치: `NotificationWidget.js`, `NotificationWidget.js.js` → **apiPost**
- `NotificationDropdown`: 시스템/메시지 클릭 후 `navigate('/notifications', { state: { openSystemNotificationId } | openConsultationMessageId })`
- `UnifiedNotifications`: 위 location state 수신 시 상세 API 호출 후 모달 오픈, `notification-read` / `message-read` 이벤트로 배지 갱신

## 기획·QA 후속 (담당 배분 제안)

| 담당 | 작업 |
|------|------|
| **기획** | 상세는 “전체 페이지” vs “모달” vs “사이드 패널” 최종 UX 확정; 비로그인/권한 없음 시 동작 문구 |
| **core-tester** | 역할별(관리자·상담사·내담자) 클릭 → `/notifications` 도착 → 모달 · 배지 · 목록 읽음 상태 E2E |
| **core-debugger** | 메시지 상세 API가 `MESSAGE_MANAGE` 전제인 경우, 드롭다운 사용자와 권한 정책 정합성 점검 |
| **core-coder** | 필요 시 쿼리스트링 딥링크(`?notice=`) 공유·북마크 요구 반영 |

**검증 체크리스트**

1. 미읽음 시스템 공지 클릭 → 읽음 처리 성공(네트워크 POST 200) → GNB 카운트 감소  
2. 동일 클릭 → `/notifications` 이동 후 해당 공지 **상세 모달** 표시  
3. 메시지 탭 행 클릭 → 동일 패턴(메시지 모달)  
4. “알림 전체 보기” 링크 기존 동작 유지  

---
*작성: 개발 병행 수정 반영 · 기획 배분용*
