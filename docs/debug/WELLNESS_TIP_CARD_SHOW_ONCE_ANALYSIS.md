# "오늘의 마음 건강 팁" 카드 한 번만 표시 — 원인 분석 보고

**분석 일자**: 2025-03-17  
**담당**: core-debugger (디버그 전용, 코드 수정 없음)

---

## 1. 표시 로직 위치

### 1.1 카드가 그려지는 곳

| 위치 | 파일 | 설명 |
|------|------|------|
| **통합 알림 페이지** | `frontend/src/components/notifications/UnifiedNotifications.js` | 시스템 공지 탭에서 `systemNotifications.map()`으로 카드 렌더. 클래스: `mg-card mg-cursor-pointer` + `notification.isRead ? 'mg-card-read' : 'mg-card-unread'` (라인 271) |
| **GNB 알림 드롭다운** | `frontend/src/components/dashboard-v2/molecules/NotificationDropdown.js` | 동일 API로 시스템 공지 목록 조회 후 리스트 렌더 (라인 91~98) |

카드 문구("오늘의 마음 건강 팁", "전체", 날짜, "마음 건강을 위한 시간", "깊은 호흡" 등)는 **시스템 공지(SystemNotification)** 의 `title` / `content` 이며, 백엔드 기본값은 `OpenAIWellnessService.getDefaultContent()` (라인 254~264)와 동일한 내용입니다.

### 1.2 데이터 소스

- **API**: `GET /api/v1/system-notifications?page=0&size=50` (또는 size=20 등)
- **프론트**: `UnifiedNotifications.js` → `apiGet('/api/v1/system-notifications?page=0&size=50')`, `NotificationDropdown.js` → `StandardizedApi.get('/api/v1/system-notifications', { page: 0, size: LIST_SIZE })`
- **백엔드**: `SystemNotificationController` → `systemNotificationService.getNotificationsForUser(userId, userRole, pageable)` → **`SystemNotificationRepository.findValidNotificationsByTargetTypes(targetTypes, now, pageable)`** 사용

### 1.3 "한 번만 보여준다" 조건 존재 여부

- **프론트**: **없음.**  
  - `sessionStorage` / `localStorage` / `shownOnce` / `dismissed` 등 “오늘의 팁을 이미 봤다”는 플래그나 1회만 노출하는 분기 없음.  
  - API가 준 `notifications` 배열을 그대로 전부 렌더.
- **백엔드**:  
  - **생성 측**: `WellnessNotificationScheduler`에서 **테넌트당·당일 1건**만 생성하는 idempotency는 있음 (`existsByTenantIdAndNotificationTypeAndCreatedAtBetween`).  
  - **조회 측**: “사용자당/세션당 1회만 보여준다”거나 “오늘 팁 1건만 반환”하는 필터/플래그는 **없음.**

**결론**: “한 번만”은 **구현되어 있지 않음**. 테넌트당 1건 생성만 있고, 목록 API는 조건 없이 (아래 2번에서처럼) 여러 건을 반환할 수 있음.

---

## 2. 역할(관리자) 분기 여부

### 2.1 공지 목록 API의 역할 처리

- **Controller** (`SystemNotificationController`):  
  `SessionUtils.getCurrentUser(session)` 로 `userId`, `userRole` 취득 후 `getNotificationsForUser(userId, userRole, pageable)` 호출. **ADMIN이든 CLIENT/CONSULTANT이든 동일 진입점.**
- **Service** (`SystemNotificationServiceImpl.getNotificationsForUser`):  
  - `getTargetTypesForUser(userRole)` → `UserRole.fromString(userRole)` 후 CONSULTANT/CLIENT만 추가. **ADMIN은 `targetTypes = ["ALL"]` 만 사용.**  
  - 이후 **`findValidNotificationsByTargetTypes(targetTypes, now, pageable)`** 호출.

### 2.2 테넌트 필터 여부 (근본 원인)

- **Repository** (`SystemNotificationRepository`):  
  - **테넌트 필터 있음**: `findValidNotificationsByTenantIdAndTargetTypes(tenantId, targetTypes, now, pageable)`  
  - **테넌트 필터 없음(Deprecated)**: `findValidNotificationsByTargetTypes(targetTypes, now, pageable)` — 주석: *"🚨 극도로 위험: 모든 테넌트 공지사항 노출!"*
- **실제 사용**: `SystemNotificationServiceImpl.getNotificationsForUser()` 는 **tenantId를 전혀 넘기지 않고** `findValidNotificationsByTargetTypes` 만 사용함.  
  → **모든 테넌트의 공지가 한꺼번에 조회됨.**

### 2.3 웰니스 팁 생성

- `WellnessNotificationScheduler.sendWellnessTipForTenant(tenantId)` 가 **테넌트별로** 1일 1건씩 `SystemNotification`(타입 WELLNESS, targetType ALL) 생성.  
- 테넌트가 N개면 **같은 날짜에 N건**의 “오늘의 마음 건강 팁” 성격 공지가 존재할 수 있음.

**결론**:  
- **역할별로 “다수 표시”를 의도한 분기는 없음.**  
- 다만 **공지 목록 API가 tenantId 없이 조회**하므로, **관리자뿐 아니라 같은 API를 쓰는 모든 역할**이 **여러 테넌트의 웰니스 공지를 모두 보게 됨.**  
- 단일 테넌트만 쓰는 환경에서는 1건만 보일 수 있고, 멀티테넌트 또는 관리자 계정이 여러 테넌트 공지를 보는 구조라면 **관리자 화면에서 여러 개의 “오늘의 마음 건강 팁” 카드**가 보이는 현상이 발생함.

---

## 3. 원인 정리

| 구분 | 내용 |
|------|------|
| **1) 여러 카드가 보이는 이유** | `getNotificationsForUser()` 가 **테넌트 조건 없이** `findValidNotificationsByTargetTypes()` 를 사용해, **모든 테넌트의 시스템 공지**를 반환함. 테넌트 수만큼 웰니스 팁 공지가 있으면 그 수만큼 카드가 노출됨. |
| **2) “한 번만”이 안 되는 이유** | (가) 목록 API에 “오늘 웰니스 1건만” 또는 “사용자당 1회만” 같은 제한이 없음. (나) 프론트에 “이미 봤음”/“한 번만 표시” 로직(sessionStorage, dismissed, 읽음 후 숨김 등)이 없음. |
| **3) 관리자만 유독 많이 보일 수 있는 이유** | 관리자만의 별도 분기가 있어서가 아니라, **같은 API를 쓰는 모든 사용자**가 원래는 여러 테넌트 공지를 볼 수 있는 구조임. 다만 실제로 알림/공지 페이지를 자주 쓰는 사용자가 관리자일 가능성이 높아, 관리자 환경에서 현상이 두드러질 수 있음. |

---

## 4. 수정 제안 (core-coder 전달용)

### 4.1 백엔드 (필수 — 테넌트 격리)

- **파일**: `src/main/java/com/coresolution/consultation/service/impl/SystemNotificationServiceImpl.java`
- **메서드**: `getNotificationsForUser(Long userId, String userRole, Pageable pageable)`
- **내용**:  
  - 현재 사용 중인 `findValidNotificationsByTargetTypes(targetTypes, now, pageable)` 제거.  
  - **현재 사용자의 tenantId**를 취득 (예: `TenantContextHolder.getTenantId()` 또는 `SessionUtils`/현재 사용자 기반 tenantId 조회) 후  
    `findValidNotificationsByTenantIdAndTargetTypes(tenantId, targetTypes, now, pageable)` 를 호출하도록 변경.  
- **참고**: 멀티테넌트 표준(core-solution-multi-tenant)에 따라, 공지 목록은 **해당 사용자 소속 테넌트만** 필터링해야 함.

### 4.2 “한 번만” 표시 (기획 확정 후)

- **옵션 A — 백엔드**:  
  - “오늘의 웰니스 팁” 1건만 노출하려면:  
    - 같은 테넌트·같은 날짜·`notificationType=WELLNESS` 인 공지 중 **1건만** 반환하거나,  
    - “사용자당 오늘 1회만 노출” 규칙이면, 읽음/노출 이력 테이블을 활용해 해당 사용자에게 “오늘 이미 1회 노출됐으면” 목록에서 제외하는 조건 추가.  
- **옵션 B — 프론트**:  
  - “세션당 1회만”이면:  
    - 해당 카드(또는 notificationType=WELLNESS인 첫 번째 공지)를 한 번 클릭/닫기 시 `sessionStorage` 등에 표시 완료 플래그를 두고, 다음부터는 그 카드를 렌더하지 않거나 접어두기.  
  - “사용자당 1회만”이면:  
    - 읽음 처리 API 호출 후, 같은 웰니스 공지는 목록에서 제외하거나 “이미 읽음” 상태로만 표시하는 방식으로 1회성 UX 구현.

(어느 쪽으로 할지는 기획/정책에 따라 결정 후, 위 옵션 중 하나로 core-coder에 태스크로 전달 권장.)

---

## 5. 체크리스트 (수정 후 확인)

- [ ] **백엔드**: `SystemNotificationServiceImpl.getNotificationsForUser()` 가 **tenantId를 사용**해 `findValidNotificationsByTenantIdAndTargetTypes` 만 호출하는지 확인.
- [ ] **백엔드**: 관리자·상담사·내담자 각 역할로 로그인해 `/api/v1/system-notifications` 호출 시, **해당 사용자 tenantId의 공지만** 반환되는지 확인 (다른 테넌트 공지 미포함).
- [ ] **프론트**: 동일 계정으로 통합 알림 페이지 / GNB 알림 드롭다운에서 “오늘의 마음 건강 팁” 성격 카드가 **테넌트당 1건 이하**로만 보이는지 확인.
- [ ] **(선택)** “한 번만” 정책 반영 시: 세션당/사용자당 1회 노출·숨김 동작이 요구사항대로 동작하는지 확인.

---

## 6. 참고 파일 목록

| 구분 | 파일 경로 |
|------|-----------|
| 프론트 — 카드 렌더 | `frontend/src/components/notifications/UnifiedNotifications.js` (라인 266~314) |
| 프론트 — 드롭다운 목록 | `frontend/src/components/dashboard-v2/molecules/NotificationDropdown.js` (라인 88~104) |
| 백엔드 — 목록 API | `src/main/java/com/coresolution/consultation/controller/SystemNotificationController.java` (라인 78~83) |
| 백엔드 — 서비스(현재 사용 쿼리) | `src/main/java/com/coresolution/consultation/service/impl/SystemNotificationServiceImpl.java` (라인 54~69, 37~50) |
| 백엔드 — Repository | `src/main/java/com/coresolution/consultation/repository/SystemNotificationRepository.java` (라인 23~48) |
| 백엔드 — 웰니스 팁 생성 | `src/main/java/com/coresolution/consultation/scheduler/WellnessNotificationScheduler.java` (라인 150~199) |
| 백엔드 — 기본 제목/내용 | `src/main/java/com/coresolution/consultation/service/OpenAIWellnessService.java` (라인 253~264) |

---

*이 문서는 디버그 분석만 수행하였으며, 코드 수정은 core-coder에게 위임합니다.*
