# 관리자 메시지 인박스 필터 — 오케스트레이션

**작성**: core-planner  
**일자**: 2026-05-18  
**상태**: 기획·분배 대기 (구현 전)

---

## 1. 목표·비목표

### 목표

- **ADMIN / STAFF**가 실기기(Expo)·웹에서 보는 **관리자 메시지 목록**의 노이즈를 줄인다.
- **운영에 필요한 알림만** 기본 노출: **결제·매칭 결제·입금·결제 완료** / **스케줄 생성·변경·취소·예약 확인** 계열.
- 웹(`AdminMessageListBlock`)·Expo(`app/(admin)/(messages)/index.tsx`)·API가 **동일 필터 규칙(SSOT)** 을 따른다.

### 비목표 (본 배치 범위 밖)

| 항목 | 설명 |
|------|------|
| **푸시 알림 필터** | `MobilePushDispatchService`, `pushScenarios.ts`, OS 푸시 설정은 **변경하지 않음**. 인앱·웹 **목록 API** 만 대상. |
| **상담사·내담자 메시지함** | `GET .../client/{id}`, `.../consultant/{id}` 등 역할별 API는 그대로. |
| **시스템 공지 탭** | `/admin/notifications` 의 **시스템 공지** 탭(`SystemNotificationManagement`) — 별도 SSOT. |
| **메시지 발송·워크플로우 변경** | `WorkflowAutomationServiceImpl` 스케줄러·리마인더 **발송 자체**는 유지. 관리자 **목록 노출만** 제한. |

---

## 2. 배경·SSOT (코드 팩트)

| 계층 | 위치 | 현황 |
|------|------|------|
| API | `ConsultationMessageController.getAllMessages()` | `GET /api/v1/consultation-messages/all` — tenantId + `MESSAGE_MANAGE` 후 **전체 반환**, 필터 없음 |
| 웹 | `frontend/src/components/admin/organisms/AdminMessageListBlock.js` | 클라이언트 `MESSAGE_TYPES` (GENERAL, REMINDER, …) — **유형 선택 필터만**, 기본은 전체 |
| Expo | `expo-app/app/(admin)/(messages)/index.tsx` | 동일 API, 검색만, **유형 필터 없음** |
| 공통코드 | `database/migrations/workflow_common_codes.sql` | `MESSAGE_TYPE` 그룹 9종 (아래 표) |
| 엔티티 레거시 | `ConsultationMessage.messageType` 기본값 `GENERAL` | 수동 스레드·일부 워크플로우 폴백 |
| 시스템 스레드 | `sendSystemThreadMessage` → `senderType=SYSTEM` | 리마인더 등 `REMINDER` 직접 저장 |
| 결제 | `PaymentServiceImpl` | `PAYMENT_COMPLETION` |
| 일정 | `ScheduleServiceImpl` | `APPOINTMENT_CONFIRMATION`, `NEW_APPOINTMENT`, `COMPLETION`(일지 누락 시) |
| 과부하 원인 | `WorkflowAutomationServiceImpl` | `REMINDER`, `INCOMPLETE_CONSULTATION`→폴백 `GENERAL`, `DAILY_SUMMARY`→`GENERAL` |

**리스크**: `getMessageTypeFromCommonCode` 실패 시 `INCOMPLETE_CONSULTATION`·`DAILY_SUMMARY`가 DB에 **`GENERAL`로 저장**될 수 있음 → **messageType 단독 allowlist만으로는 누수 가능** → §4 보조 규칙 필요.

---

## 3. 노출 정책

### 3.1 P0 allowlist (messageType — 관리자 기본 탭)

| messageType (code_value) | 분류 | 관리자 노출 | 비고 |
|--------------------------|------|:-----------:|------|
| `PAYMENT_COMPLETION` | 결제 | **Y** | 결제 완료 (`PaymentServiceImpl`) |
| `APPOINTMENT_CONFIRMATION` | 스케줄 | **Y** | 예약 확인 — 내담자 측 생성 알림 |
| `NEW_APPOINTMENT` | 스케줄 | **Y** | 새 예약 — 상담사 측 |
| `APPOINTMENT` | 스케줄 | **Y** | 공통코드 `REMINDER` 매핑 폴백값(Workflow) — 리마인더와 구분 필요 시 §3.3 |
| `COMPLETION` | 스케줄·운영 | **Y (조건부)** | 제목·본문에 **일정/예약/취소** 키워드 있을 때만. **「상담일지 누락」** 제목은 **N** |
| `URGENT` | 결제·스케줄 | **Y (조건부)** | §3.3 키워드 규칙 충족 시만 (레거시·수동 발송) |

> **P0 핵심 5종 (구현·테스트 우선)**: `PAYMENT_COMPLETION`, `APPOINTMENT_CONFIRMATION`, `NEW_APPOINTMENT`, `APPOINTMENT`(키워드 없이 스케줄 계열로 간주), `COMPLETION`(키워드 allow만).

### 3.2 denylist (기본 숨김)

| messageType | 관리자 노출 | 대표 원인 |
|-------------|:-----------:|-----------|
| `REMINDER` | **N** | 상담 N분 전 리마인더 (`sendSystemThreadMessage`, 하드코드 `"REMINDER"`) |
| `INCOMPLETE_CONSULTATION` | **N** | 미완료 상담 알림 |
| `DAILY_SUMMARY` | **N** | 일일 성과 요약 (상담사 대상) |
| `MONTHLY_REPORT` | **N** | 월간 리포트 |
| `RATING_REQUEST` | **N** | 평가 요청 |
| `GENERAL` | **N** | 상담사↔내담자 일반 스레드, 워크플로우 폴백 |
| `FOLLOW_UP` | **N** | 후속 조치 (수동) |
| `HOMEWORK` | **N** | 과제 안내 (수동) |
| `IMPORTANT` | **N** | 레거시 플래그형 (있을 경우) |

**senderType 규칙**

| senderType | 기본 |
|------------|------|
| `SYSTEM` | allowlist messageType **또는** §3.3 키워드 통과 시만 Y |
| `CONSULTANT` / `CLIENT` / `ADMIN` | **N** (1:1 스레드·관리자 독촉) — §3.3 예외 없으면 숨김 |

### 3.3 보조 규칙 (SYSTEM + GENERAL/폴백 누수 방지)

`messageType`이 denylist이거나 `GENERAL`일 때, **아래 키워드가 title 또는 content에 포함**되면 운영 알림으로 **포함(Y)**:

**결제·매칭**: `결제`, `입금`, `매칭`, `PENDING_PAYMENT`, `DEPOSIT`, `환불`, `결제 완료`, `결제 확인`  
**스케줄**: `예약`, `일정`, `스케줄`, `취소`, `변경`, `가예약`, `예약 확인`, `새 예약`

**명시 제외 키워드** (포함 시 **무조건 N**, allowlist여도 제외):

`리마인더`, `미완료 상담`, `일일`, `성과 요약`, `월간`, `상담일지`, `일지 누락`, `30분`, `분 전`

> 키워드 목록은 `adminMessageInboxFilter.ts`(웹·Expo 공유 utils) + 백엔드 `AdminMessageInboxFilter`(Java) **동일 상수**로 유지. 하드코딩 검사 대상.

### 3.4 결제·스케줄 매핑 표 (발송원 → messageType → 노출)

| 발송 원천 | messageType | 관리자 노출 |
|-----------|-------------|:-----------:|
| `PaymentServiceImpl` 결제 완료 | `PAYMENT_COMPLETION` | Y |
| `ScheduleServiceImpl.createSchedule` 내담자 | `APPOINTMENT_CONFIRMATION` | Y |
| `ScheduleServiceImpl.createSchedule` 상담사 | `NEW_APPOINTMENT` | Y |
| `ScheduleServiceImpl` 일지 누락 리마인드 | `COMPLETION` + 제목 「상담일지 누락」 | **N** |
| `WorkflowAutomationServiceImpl` 리마인더 | `REMINDER` / `APPOINTMENT` | **N** |
| `WorkflowAutomationServiceImpl` 미완료 | `INCOMPLETE_CONSULTATION` / `GENERAL` | **N** |
| `WorkflowAutomationServiceImpl` 일일 요약 | `DAILY_SUMMARY` / `GENERAL` | **N** |
| `AdminServiceImpl` 상담일지 독촉 | `REMINDER` + sender `ADMIN` | **N** |
| 수동 메시지 (상담사↔내담자) | `GENERAL`, `FOLLOW_UP`, … | **N** |
| 입금 대기 푸시 (`NotificationServiceImpl.DEPOSIT_PENDING_REMINDER`) | 인앱 메시지 미연동 시 해당 없음 — 추후 메시지화 시 `MESSAGE_TYPE` 신규 코드 검토 | TBD |

---

## 4. 구현 권장안

### 선택: **A. 백엔드 1차 필터 (권장)** + **C. 하이브리드 보조**

| 안 | 요약 | 판단 |
|----|------|------|
| **A** | `getAllMessages`에 `?view=admin_ops`(기본) / `view=full` 쿼리. 서버에서 allowlist+키워드 적용 | **채택** — 웹·Expo 동일, 페이로드·권한 일관 |
| **B** | 프론트만 필터 | 기각 — 데이터 과다, Expo·웹 규칙 분기 위험 |
| **C** | A + 클라이언트 2차(검색·칩) | **부분 채택** — `GENERAL` 폴백 누수·레거시 대비 2차 동일 utils |

**이유**

1. `MESSAGE_MANAGE` 게이트가 이미 API에 있음 → **필터는 서버가 SSOT** 가 적합.  
2. `INCOMPLETE_*` → `GENERAL` 폴백은 **타입만으로 불충분**.  
3. 기존 `filterType` UI는 **「전체 보기」** 모드에서만 유지.

**API 제안**

```
GET /api/v1/consultation-messages/all?view=admin_ops   # 기본(생략 시 admin_ops)
GET /api/v1/consultation-messages/all?view=full        # 기존 전체(감사·CS용)
```

- 하위 호환: 쿼리 없으면 **`admin_ops`** (Breaking 시 릴리즈 노트·웹/Expo 동시 배포).  
- 응답 메타(선택): `{ filtered: true, view: "admin_ops", totalBeforeFilter: N }` — 디버그용.

---

## 5. UX

### 5.1 기본 탭·토글

| 요소 | 권장 |
|------|------|
| 기본 목록 | **「운영 알림」만** (`view=admin_ops`) |
| 「전체 보기」 | **1단계: 숨김 또는 More 메뉴** — STAFF 과부하 방지. 2단계: `view=full` 토글 + 확인 카피 |
| 필터 칩 | 운영 알림 내: `결제` / `스케줄` (messageType 그룹) — **core-designer 선택** |
| 검색 | 기존 유지 (제목·내용·발신·수신) |

### 5.2 빈 목록 카피 (상수화)

| 키 | 문구 (초안) |
|----|-------------|
| `EMPTY_OPS_TITLE` | 운영 알림이 없습니다 |
| `EMPTY_OPS_BODY` | 결제·일정 관련 알림만 표시됩니다. 상담 메시지는 웹 메시지 관리의 「전체 보기」에서 확인할 수 있습니다. |
| `EMPTY_SEARCH_TITLE` | 검색 결과가 없습니다 |
| `EMPTY_SEARCH_BODY` | 다른 검색어를 입력해 보세요. |

- 웹: `frontend/src/constants/adminMessageInboxCopy.js` (신규)  
- Expo: `expo-app/src/constants/adminMessageInboxCopy.ts` — 문구 **동일**  
- 기존 `ADMIN_MOBILE_MESSAGES_COPY.EMPTY_*` 는 ops 모드에 맞게 분기

### 5.3 웹 레이아웃

- `AdminMessageListBlock` / `/admin/notifications` 메시지 탭: **AdminCommonLayout** 유지 (기존 정책).  
- 상단에 세그먼트: `운영 알림` | `전체` (2단계).

---

## 6. 멀티테넌트·권한

- **tenantId**: 기존과 동일 — `currentUser.getTenantId()` 없으면 403. 필터 쿼리도 **tenant 스코프 필수**.  
- **MESSAGE_MANAGE**: `view=full` 포함 **동일 권한**. 역할별 view 차등은 **하지 않음** (ADMIN=STAFF 동일 정책).  
- **감사**: `view=full` 호출 시 access log(선택) — 운영 반영 체크리스트 참고.

---

## 7. 완료 기준·체크리스트

- [ ] `GET .../all` 기본이 운영 알림만 반환 (denylist·키워드 제외 검증)  
- [ ] 웹·Expo 기본 UI가 ops 목록만 표시, 카피 상수화  
- [ ] `REMINDER`·`INCOMPLETE`·일반 `GENERAL` 스레드 실기기에서 미노출  
- [ ] `PAYMENT_COMPLETION`, `NEW_APPOINTMENT`, `APPOINTMENT_CONFIRMATION` 노출  
- [ ] `view=full` 시 기존과 동일 전체 목록  
- [ ] 단위 테스트: allowlist·denylist·키워드·제외 키워드  
- [ ] `MESSAGE_MANAGE` 없음 → 403 회귀  
- [ ] tenantId 누락 → 403 회귀  
- [ ] 푸시 시나리오 **무변경** 확인

---

## 8. 분배실행 표

| Phase | 담당 | 병렬 | 전달 요약 |
|-------|------|:----:|-----------|
| **P0** | **core-coder** | — | §4 API `view=admin_ops`·Java 필터·웹·Expo·공유 상수·Jest/Java 테스트. 참조: 본 문서 §3, `ConsultationMessageController`, `AdminMessageListBlock.js`, `expo-app/.../messages/index.tsx`. 표준: `/core-solution-api`, `/core-solution-multi-tenant`, `/core-solution-frontend`. 하드코딩: 키워드·카피 상수화. |
| **P0b** | **core-tester** | P0 완료 후 | allowlist 회귀, `GENERAL` 폴백 케이스, 403/tenant, `view=full`. |
| **P1 (선택)** | **core-designer** | P0와 병렬 가능 | `model: gemini-3.1-pro`. 운영 알림 세그먼트·결제/스케줄 칩·빈 상태(B0KlA). 전달: §5 UX, 어드민 샘플 URL. |
| **P2 (선택)** | **core-debugger** | 이슈 시 | 필터 누수·과소 필터 재현만. 수정은 coder 위임. |

**의존성**: designer 산출물 없이 P0 coder 진행 가능(기본 세그먼트·EmptyState만).

---

## 9. core-coder 위임 프롬프트 (요약)

```
[목표] ADMIN/STAFF 메시지 목록 과부하 해소 — 결제·스케줄 운영 알림만 기본 노출.

[SSOT] docs/project-management/ADMIN_MESSAGE_INBOX_FILTER_ORCHESTRATION.md §3~4

[백엔드]
- ConsultationMessageController.getAllMessages: query view=admin_ops|full (default admin_ops)
- AdminMessageInboxFilter (신규): allowlist §3.1, denylist §3.2, keyword §3.3
- consultationMessageService.getAllMessagesForAdminOps(tenantId) 또는 stream filter
- tenantId·MESSAGE_MANAGE 유지

[프론트]
- AdminMessageListBlock: default admin_ops API, segment 운영|전체, adminMessageInboxCopy.js
- expo (admin)/(messages)/index.tsx: 동일 view param + copy
- shared filter utils (키워드·타입) — 웹 re-export 또는 duplicate 최소

[테스트]
- Java: filter unit tests (REMINDER N, PAYMENT_COMPLETION Y, GENERAL+결제키워드 Y, 상담일지 N)
- Jest: adminMessageInboxFilter.test.ts

[비목표] 푸시·WorkflowAutomation 발송 로직 변경 없음.

[완료] §7 체크리스트 전항.
```

---

## 10. 리스크

| 리스크 | 완화 |
|--------|------|
| `GENERAL` 폴백으로 운영 알림 누락 | 키워드 allow §3.3 |
| `GENERAL` 폴백으로 노이즈 유입 | 키워드 deny §3.3 |
| `APPOINTMENT` vs `REMINDER` 혼동 | REMINDER deny; APPOINTMENT는 스케줄 확인류만 Y |
| Breaking default API | 웹·Expo 동시 배포, `view=full` 문서화 |

---

## 11. 참고 문서

- `docs/debug/DEBUG_MESSAGE_MANAGEMENT_20260227.md`
- `docs/project-management/GNB_AND_ADMIN_NOTIFICATION_INTEGRATION_POLICY.md`
- `database/migrations/workflow_common_codes.sql`
- `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`
