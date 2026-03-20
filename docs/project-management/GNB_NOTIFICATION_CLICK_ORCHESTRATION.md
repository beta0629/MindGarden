# GNB 알림 드롭다운 클릭 → 상세·읽음 (오케스트레이션 메모)

**이슈(초기)**: 시스템 공지 행 클릭 시 패널만 닫히고 읽음/상세가 기대와 다름.  
**UX(2026-02 업데이트)**: 시스템 공지는 **읽음 처리 + 드롭다운 닫기**만 하고 통합 알림 상세로 **이동하지 않음**. 메시지 탭은 기존대로 `/notifications` 딥링크 유지.

## 원인 (구현 완료)

| 항목 | 내용 |
|------|------|
| 읽음 API 불일치 | 백엔드 `POST /api/v1/system-notifications/{id}/read` 인데, 프론트 `NotificationContext` 등에서 **GET** 호출 → 읽음 처리 실패 |
| 상세 미연결 | `NotificationDropdown` 클릭 시 `setIsOpen(false)`만 수행, 통합 알림 페이지의 상세 모달과 경로 없음 |

## 조치 (코드)

- `NotificationContext.markSystemNotificationAsRead`: **apiPost** 로 통일
- 동일 GET 호출 위치: `NotificationWidget.js`, `NotificationWidget.js.js` → **apiPost**
- `NotificationDropdown`: **메시지** 클릭 시만 `navigate('/notifications', { state: { openConsultationMessageId } })` / 시스템 공지는 navigate **없음**
- `UnifiedNotifications`: 위 location state 수신 시 상세 API 호출 후 모달 오픈, `notification-read` / `message-read` 이벤트로 배지 갱신

## 기획·QA 후속 (담당 배분 제안)

| 담당 | 작업 |
|------|------|
| **기획** | 상세는 “전체 페이지” vs “모달” vs “사이드 패널” 최종 UX 확정; 비로그인/권한 없음 시 동작 문구 |
| **core-tester** | 시스템: 클릭 시 읽음·카운트·패널 닫힘. 메시지: `/notifications` 모달. 푸터 “알림 전체 보기” E2E |
| **core-debugger** | 메시지 상세 API가 `MESSAGE_MANAGE` 전제인 경우, 드롭다운 사용자와 권한 정책 정합성 점검 |
| **core-coder** | 필요 시 쿼리스트링 딥링크(`?notice=`) 공유·북마크 요구 반영 |

**검증 체크리스트**

1. 미읽음 시스템 공지 클릭 → 읽음 처리 성공(POST 200) → GNB 카운트 감소 → **현재 페이지 유지**(상세 미이동)  
2. 미읽음 메시지 행 클릭 → `/notifications` 이동 후 메시지 **상세 모달**  
3. “알림 전체 보기” → 통합 알림 목록  

---
*작성: 개발 병행 수정 반영 · 기획 배분용*
