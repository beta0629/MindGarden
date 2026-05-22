# 결제·승인·일정 — 인앱·시스템·푸시 점검 오케스트레이션

**작성**: core-planner  
**일자**: 2026-05-18  
**상태**: 점검·분배 대기 (코드 변경 없음 — 본 문서는 감사·UAT·서브에이전트 위임용)

---

## 1. 목표·범위

### 목표

Expo 앱·웹에서 아래 **3대 트리거** 발생 시, **인앱 메시지**, **시스템 알림(Alert/GNB)**, **모바일 푸시(Expo)**, **웹 푸시(FCM 래퍼)** 가 **실제로 발화·수신·표시**되는지 코드·런타임 기준으로 점검하고, 갭을 P0/P1로 분류한다.

| # | 시나리오 | 대표 API·서비스 |
|---|----------|-----------------|
| 1 | **결제 완료** (PG `Payment` 승인 / 매칭·일반) | `PaymentServiceImpl.updatePaymentStatus(APPROVED)`, `AdminController` `confirm-payment` |
| 2 | **승인** (매칭 approve, 입금 확인 후 승인 등) | `confirm-deposit`, `approve`, (결제 확인 `confirm-payment`) |
| 3 | **일정 등록** (스케줄 생성) | `POST /api/v1/schedules/consultant` → `createConsultantSchedule` |

### 채널 정의

| 채널 | 구현 앵커 | 비고 |
|------|-----------|------|
| **인앱 메시지** | `ConsultationMessageService.sendMessage` / `sendSystemThreadMessage` | 관리자 목록: `GET .../consultation-messages/all?view=admin_ops` |
| **시스템 알림** | `NotificationService` → 카카오/SMS/이메일, 실패 시 `Alert` 엔티티 (`alertRepository`) | GNB·`/admin/notifications` 등과 **별도 SSOT** 가능 |
| **모바일 푸시** | `MobilePushDispatchServiceImpl` → Expo Push API (`EXPO_ACCESS_TOKEN`) | 토큰: `POST /api/v1/mobile/push-token/register` (ios/android만) |
| **웹 푸시** | `frontend/src/services/PushNotificationService.js` (FCM) | **현재 앱에서 import·호출 없음**; 서버 발송 파이프라인은 **Expo 전용** |

### 포함·제외

| 포함 | 제외 |
|------|------|
| 위 3 시나리오 × 역할 × 채널 매트릭스 | 이메일 단독, ERP 거래 생성, 통계 갱신 |
| 웹 vs Expo **동일 API** 여부 | `WorkflowAutomationServiceImpl` 리마인더 **전체** 설계 변경 |
| 수동 UAT·자동 테스트 분배 | 본 배치에서 **코드 수정** |

---

## 2. 코드 팩트 요약 (탐색 앵커)

### 2.1 결제 완료 (`Payment` 엔티티, `APPROVED`)

**경로**: `PaymentServiceImpl.updatePaymentStatus` → `case APPROVED`

| 채널 | 발화 | 수신자 |
|------|:----:|--------|
| 인앱 메시지 | **Y** | `PAYMENT_COMPLETION`, `sendMessage(payerId, recipientId, …, CLIENT)` |
| 시스템 알림 | **N** | `NotificationService.sendPaymentCompleted` **호출처 없음** (dead API) |
| 모바일 푸시 | **Y** | `dispatchPaymentCompleted` → **payerId만** |
| 웹 푸시 | **N** | 서버 Expo 전용; 웹 FCM 미연동 |

**트리거**: PG 웹훅·`PaymentController` 상태 변경 등 `APPROVED` 전이 시.  
**매칭 어드민 `confirm-payment`**: `AdminServiceImpl.confirmPayment` — **메시지·푸시·Notification 없음** (매핑 상태·ERP만).

### 2.2 승인 (매칭)

| API | 서비스 | 인앱 | 시스템 | 모바일 푸시 |
|-----|--------|:----:|:------:|:-----------:|
| `POST .../confirm-payment` | `confirmPayment` | **N** | **N** | **N** |
| `POST .../confirm-deposit` | `confirmDeposit` | **N** | **N** | **조건부** |
| `POST .../approve` | `approveMapping` | **N** | **N** | **N** |

**confirm-deposit 부가 동작**

- `finalizeTentativeBookingsAfterDepositPhase4b` → 가예약 `TENTATIVE_PENDING_PAYMENT` → `BOOKED`, 회기 차감.
- 회기 차감 후 `remainingSessions` 1~2이면 `dispatchSessionLow` (**내담자**, 매핑 입금 플로우).
- **일정 생성 알림·예약 확정 푸시 없음**.

### 2.3 일정 등록

| 경로 | 실제 메서드 | 인앱 (APPOINTMENT_CONFIRMATION / NEW_APPOINTMENT) | 모바일 푸시 |
|------|-------------|:--------------------------------------------------:|:-----------:|
| **운영 표준** `POST /api/v1/schedules/consultant` (웹·Expo 어드민) | `createConsultantSchedule` | **N** | **N** |
| 레거시 `createSchedule(Schedule)` | 동 메서드 내 `sendMessage` 2건 | **Y** (코드 존재) | **N** |
| 관리자 **예약 확정** `confirmSchedule` | `confirmSchedule` | **N** (별도 메시지 타입 없음) | **Y** `dispatchBookingConfirmed` (내담자만) |

**부가**

- `confirmSchedule` 시 `NotificationService.sendConsultationConfirmed` (알림톡/SMS/Alert) — **내담자**, tenant 컨텍스트 필요.
- `cancelSchedule` → `dispatchBookingCancelled` (내담자·상담사).
- `WorkflowAutomationServiceImpl.sendScheduleReminders` → `REMINDER` 인앱 + `dispatchBookingReminder` (관리자 **미대상**).

### 2.4 웹 vs Expo

| 항목 | 웹 | Expo |
|------|----|------|
| 매핑 결제/입금/승인 API | 동일 `AdminController` | 동일 (`useAdminMappingSettlement` 등) |
| 일정 등록 API | 동일 `POST /api/v1/schedules/consultant` | `useAdminCreateSchedule` → 동일 |
| 인앱 메시지 목록 (어드민) | `consultation-messages/all?view=admin_ops` | 동일 |
| 푸시 토큰 | `PushNotificationService.js` (**미사용**) | `NotificationService.registerToken` (Expo token) |
| 푸시 수신 | **서버 발송 없음** (FCM 토큰도 API가 ios/android만 허용) | Expo Push + 앱 내 토스트 |

### 2.5 관리자 인박스 (`admin_ops`)

- 필터: `AdminMessageInboxFilter` — `SYSTEM` + allowlist **또는** 제목·본문 키워드(결제·예약 등).
- `PAYMENT_COMPLETION`은 `CLIENT` 발신이어도 본문 **「결제」** 키워드로 **조건부 노출** 가능.
- `createConsultantSchedule` 경로는 메시지 자체가 없어 **어드민 인박스에도 미발생**.

---

## 3. 시나리오 × 역할 × 채널 매트릭스

**범례**: **Y** = 코드상 발화·수신 경로 있음 | **N** = 없음 | **조건부** = 설정·토큰·tenant·키워드·상태에 따름

### 3.1 결제 완료

| 역할 | 인앱 메시지 | 시스템 알림 (Alert/알림톡) | 모바일 푸시 | 웹 푸시 |
|------|:-----------:|:--------------------------:|:-----------:|:-------:|
| **CLIENT** (내담자·payer) | **조건부** — PG `APPROVED` 시 스레드 메시지(수신자 매핑은 §5 P0 참고) | **N** | **조건부** — 토큰·`EXPO_ACCESS_TOKEN`·카테고리 `payment` on | **N** |
| **CONSULTANT** | **N** (PG 결제 플로우) | **N** | **N** | **N** |
| **ADMIN** | **조건부** — `admin_ops` 키워드·타입 필터로 목록만 | **N** | **N** | **N** |
| **STAFF** | ADMIN과 동일 (`MESSAGE_MANAGE`) | **N** | **N** | **N** |

| 하위 시나리오 | 인앱 | 푸시 |
|---------------|:----:|:----:|
| PG/`Payment` `APPROVED` | 조건부 | 조건부 (payer) |
| 어드민 `confirm-payment` (매칭) | **N** | **N** |
| 어드민 `confirm-deposit` | **N** | **조건부** (`session_low` 만, 잔여 회기 ≤2) |

### 3.2 승인 (매칭 approve·입금 확인)

| 역할 | 인앱 | 시스템 | 모바일 푸시 | 웹 푸시 |
|------|:----:|:------:|:-----------:|:-------:|
| **CLIENT** | **N** | **N** | **조건부** (입금 확인 후 회기 임박만) | **N** |
| **CONSULTANT** | **N** | **N** | **N** | **N** |
| **ADMIN** | **N** | **N** | **N** | **N** |
| **STAFF** | **N** | **N** | **N** | **N** |

| 하위 시나리오 | 비고 |
|---------------|------|
| `approve` | 상태 저장만 |
| `confirm-deposit` | ERP·가예약 확정·회기; 알림 메시지 없음 |
| `confirm-payment` | 매핑 결제 확인; 알림 없음 |

### 3.3 일정 등록 (`POST .../schedules/consultant`)

| 역할 | 인앱 | 시스템 | 모바일 푸시 | 웹 푸시 |
|------|:----:|:------:|:-----------:|:-------:|
| **CLIENT** | **N** | **N** | **N** | **N** |
| **CONSULTANT** | **N** | **N** | **N** | **N** |
| **ADMIN** (등록 주체) | **N** | **N** | **N** | **N** |
| **STAFF** | **N** | **N** | **N** | **N** |

| 관련·별도 트리거 | CLIENT | CONSULTANT |
|------------------|:------:|:----------:|
| `confirmSchedule` (관리자 확정) | 알림톡/SMS/Alert **조건부** | **N** |
| 동일 | `booking_confirmed` 푸시 **조건부** | **N** |
| 리마인더 (스케줄러) | **조건부** (`REMINDER`, 푸시) | **조건부** |

> **핵심**: 운영에서 말하는 「일정 등록」은 `createConsultantSchedule`인데, **알림 코드는 미호출** `createSchedule`에만 존재.

---

## 4. 갭·버그 후보

### P0 (기능 누락·운영 직결)

| ID | 갭 | 근거 |
|----|-----|------|
| P0-1 | **일정 등록 시 인앱·푸시 전무** | `createConsultantSchedule`는 저장·회기만; `createSchedule`의 `APPOINTMENT_CONFIRMATION`/`NEW_APPOINTMENT` **미연결** |
| P0-2 | **매칭 결제 확인·입금 확인·승인 시 인앱/푸시 없음** | `AdminServiceImpl` 해당 메서드에 `sendMessage`/`MobilePushDispatch` 없음 |
| P0-3 | **`NotificationService.sendPaymentCompleted` 미사용** | PG 결제 완료 시 알림톡·Alert 경로 없음; 인앱·Expo 푸시만 |
| P0-4 | **웹 푸시 파이프라인 부재** | `PushNotificationService.js` 미참조; 서버는 Expo만; `MobilePushPlatform` ios/android만 — **Phase C 본 배치 제외**(Expo·서버 FCM 연동은 별도 트랙) |
| P0-5 | **결제 완료 `sendMessage` consultant/client 인자 순서** | `PaymentServiceImpl`: `sendMessage(payerId, recipientId, …, CLIENT)` → `CLIENT` 발신 시 `senderId=recipientId`, `receiverId=payerId`로 해석될 수 있음 — **수신자·발신자颠倒 여부 core-debugger 검증 필수** |

### P1 (조건불일치·UX·운영 혼선)

| ID | 갭 | 근거 |
|----|-----|------|
| P1-1 | **예약 확정 푸시는 「등록」이 아니라 `confirmSchedule`** | 등록 직후 내담자 `booking_confirmed` 없음 |
| P1-2 | **어드민 인박스 vs 실제 발화 불일치** | 필터는 결제·예약 키워드 대비, `createConsultantSchedule`는 메시지 미생성 |
| P1-3 | **입금 확인 시 `session_low`만** | 결제·승인 완료 안내 없이 회기 임박 푸시만 가능 |
| P1-4 | **`EXPO_ACCESS_TOKEN` 미설정 시 전체 푸시 스킵** | `MobilePushDispatchServiceImpl` warn 후 return |
| P1-5 | **리마인더는 관리자 제외** | `WorkflowAutomationServiceImpl` — 본 점검 시나리오 3종과 별도이나 혼동 주의 |

---

## 5. 점검 방법 (코드 작성 없음)

### 5.1 사전 조건

- [ ] 개발/스테이징 API·DB, 테스트 테넌트·계정 4역할 (ADMIN, STAFF, CONSULTANT, CLIENT)
- [ ] CLIENT·CONSULTANT Expo 앱: 로그인 후 `registerToken` 성공, `EXPO_ACCESS_TOKEN` 서버 설정 확인
- [ ] 어드민 웹·Expo: `MESSAGE_MANAGE`, 메시지 탭 `view=admin_ops`
- [ ] (선택) PG 테스트 결제 → `Payment` `APPROVED` 유도

### 5.2 시나리오별 관측 포인트

| 시나리오 | 조작 | 인앱 확인 | 시스템/GNB | 푸시 |
|----------|------|-----------|------------|------|
| PG 결제 완료 | 결제 승인 | CLIENT/CONSULTANT 메시지함, ADMIN `admin_ops` | Alert·알림톡 로그 | CLIENT 디바이스 |
| 매칭 confirm-payment | 어드민 API | 동일 | — | — |
| confirm-deposit | 입금 확인 | — | — | 잔여 회기 ≤2 시만 |
| approve | 승인 | — | — | — |
| 일정 등록 | `schedules/consultant` | **없음 예상** | — | **없음 예상** |
| 일정 확정 | `confirmSchedule` | — | 내담자 알림톡/Alert | 내담자 `booking_confirmed` |

---

## 6. 분배실행 (서브에이전트)

**원칙**: 본 문서는 **코드 수정 없음**. 구현·패치는 별도 배치에서 `core-coder`가 P0 항목 승인 후 진행.

### Phase A — 병렬 가능

| 담당 | subagent_type | 전달 프롬프트 요약 |
|------|---------------|-------------------|
| **A1 코드·발화 경로 검증** | `core-debugger` | 본 문서 §2~§4. **검증**: (1) `PaymentServiceImpl` `sendMessage` 수신자·발신자 ID (2) `createSchedule` 호출 그래프 전수 (3) `confirm-deposit` 후 푸시·메시지 (4) `NotificationService.sendPaymentCompleted` 미호출 확인. **산출**: 재현 절차·로그 키워드·P0/P1 확정 목록(코드 수정 없음). |
| **A2 API·클라이언트 계약** | `explore` | 웹 `AdminMessageListBlock`·Expo `messages/index.tsx`·`useAdminCreateSchedule`·`PushNotificationService.js` 참조 여부. **산출**: 웹/Expo 동일 API 표 + 클라이언트 미연동 목록. |

### Phase B — A 완료 후

| 담당 | subagent_type | 전달 프롬프트 요약 |
|------|---------------|-------------------|
| **B1 자동 테스트** | `core-tester` | **대상**: `PaymentServiceImpl`(APPROVED), `ScheduleServiceImpl`(createConsultantSchedule vs createSchedule), `AdminServiceImpl`(confirm-deposit/approve), `MobilePushDispatchServiceImplTest` 확장 제안. **기준**: 시나리오 3종×채널 기대 Y/N assertion. **게이트**: 기존 Jest/Java 테스트 green. |
| **B2 수동 UAT** | (사용자·QA) | §7 체크리스트 실행, 증빙(스크린·DB `consultation_messages`·`mobile_push_token`·서버 로그). |

### Phase C — P0 수정 배치 (별도 승인 후)

| 담당 | subagent_type | 전달 프롬프트 요약 |
|------|---------------|-------------------|
| **C1 구현** | `core-coder` | P0-1~P0-5 중 기획 승인 항목만. **원칙**: `createConsultantSchedule` 종료 시 알림 헬퍼 단일화(중복 `createSchedule` 정리), 매칭 입금/승인 메시지 타입·상수 SSOT, `/core-solution-multi-tenant`, `/core-solution-api`. **금지**: import 경로만 반복 변경(Expo Metro 핸드오프 준수). |
| **C2 회귀** | `core-tester` | B1 + UAT 재실행. |

**디자인**: 본 배치 UI 변경 최소. 카피·토스트는 `core-designer`는 P0 메시지 문구 확정 시만.

### § 솔라피 병행 배치 (Phase D — 별도 승인)

모바일(Expo)과 **동일 트리거**에서 `NotificationService`(알림톡 `provider=solapi` → SMS `SolapiSmsProvider` 폴백)를 **Expo 푸시·인앱과 병행** 호출한다. 기준 패턴: `ScheduleServiceImpl.tryDispatchScheduleConfirmedExternalNotification` → `sendConsultationConfirmed`. **선행**: `NotificationServiceImpl.sendSms`가 `SmsProvider`(Solapi)를 실제 호출하도록 정비(현재 TODO·시뮬레이션). **대상 트리거**: (1) PG `PaymentServiceImpl` `APPROVED` — `sendPaymentCompleted` (2) `MappingSettlementNotificationHelperImpl` 3시나리오 — `confirm-payment`/`confirm-deposit`/`approve`와 동일. **수신자**: 내담자 필수; `MAPPING_APPROVED`는 상담사 병행 검토. **원칙**: try/catch·본 트랜잭션 롤백 금지·`TenantContextHolder` 유지·쇼핑 PG·웹 FCM 제외. **템플릿**: `PAYMENT_COMPLETED` 기존 SSOT; 입금·승인은 `NotificationType`·`SMS_TEMPLATE`·`ALIMTALK_BIZ_TEMPLATE_CODE` 확장 시 `core-designer` 합의 후. **검증**: `core-tester` — Solapi mock·기존 푸시 baseline green·알림톡/SMS 호출 assertion.

---

## 7. 수동 UAT 체크리스트

### 7.1 공통

- [ ] 테넌트·역할·`tenantId` 헤더 일치
- [ ] Expo: 설정 → 푸시 카테고리 `payment`·`schedule` on
- [ ] 서버: `EXPO_ACCESS_TOKEN` 설정됨 (미설정 시 푸시 N 예상)

### 7.2 결제 완료

- [ ] **PG 결제** → CLIENT 인앱 메시지 1건 이상 (`PAYMENT_COMPLETION` 또는 본문 결제 키워드)
- [ ] **PG 결제** → CLIENT 모바일 푸시 (`payment_completed`) 또는 서버 로그 `Expo 푸시`
- [ ] **PG 결제** → ADMIN/STAFF `admin_ops` 목록 노출(키워드·필터)
- [ ] **매칭 confirm-payment** → 위 3항 **없음**이 정상(현행)인지 기록
- [ ] **confirm-deposit** (잔여 회기 2 이하) → `session_low` 푸시만 여부

### 7.3 승인

- [ ] **approve** → 전 채널 **없음** 확인
- [ ] **confirm-deposit** → 가예약→BOOKED, 인앱·승인 안내 푸시 **없음** 확인

### 7.4 일정 등록

- [ ] 웹 또는 Expo 어드민에서 **일정 등록** (`/schedules/consultant`)
- [ ] CLIENT·CONSULTANT 인앱 **없음** (현행 코드 기준)
- [ ] 모바일 푸시 **없음**
- [ ] (대조) 관리자 **예약 확정** 시 내담자 푸시·알림톡 **있음** 여부

### 7.5 웹 vs 앱

- [ ] 동일 API로 동일 DB 행 생성 확인
- [ ] 웹 브라우저: OS 알림 **없음** (현행 정상)
- [ ] Expo: 동일 계정 푸시 **있음/없음** 기록

### 7.6 Solapi Phase D UAT (알림톡·SMS)

> **선행**: commit **`c5b181d28`** (결제·매핑 정산 Solapi 병행) · Phase D **coder DONE** · 잔여 **운영 UAT·templateId 확인**.  
> ENV·미수신 디버그: [`SOLAPI_NOTIFICATION_MISS_DEBUG.md`](./2026-05-22/SOLAPI_NOTIFICATION_MISS_DEBUG.md) · 배치 10 연계: [`MOOD_JOURNAL…ORCHESTRATION` §9](./2026-05-21/MOOD_JOURNAL_CONSULTANT_INBOX_ORCHESTRATION.md#9-배치-10--deploy--eas--human-85--solapi-uat).

| # | 시나리오 | 검증 (기대) | 담당 | 증빙 |
|---|----------|-------------|------|------|
| 1 | **선행** — dev/운영 ENV | `SMS_TEST_MODE=false` · `kakao.alimtalk.solapi.*` journal **WARN 0건** · Solapi 발신번호·PFID 바인딩 | ops / **human** | journal grep · `/etc/mindgarden/*.env` |
| 2 | **선행** — 솔라피 콘솔 templateId | `PAYMENT_COMPLETED` · 매핑 정산(`confirm-payment`/`deposit`/`approve`) **검수 승인 templateId**·PFID·발신번호 등록 | **human** | 콘솔 스크린·templateId 목록 |
| 3 | **confirm-payment** (어드민 매칭) | CLIENT 실기기 **알림톡 1건** 또는 **SMS 폴백** · 인앱·Expo 푸시 baseline **유지** | **human** (10-5) | 단말 수신 · 콘솔 `groupId` · 서버 `MappingSettlementNotificationHelper` 로그 |
| 4 | **PG APPROVED** (테스트 결제) | CLIENT 알림톡/SMS · `sendPaymentCompleted` · **`PAYMENT_COMPLETED` templateId** 정합 | **human** (10-5) | 단말 수신 · PG·Payment `APPROVED` 행 |
| 5 | **통합 회귀** + 리포트 | `AdminServiceImplMappingSettlementNotificationBaselineTest` · Solapi mock · 기존 Expo 푸시 baseline **green** → UAT 리포트 §7.6 행 채움 | **core-tester** (10-4) | [`PAYMENT_SCHEDULE…UAT_REPORT`](./PAYMENT_SCHEDULE_NOTIFICATION_PUSH_UAT_REPORT.md) 초안 |

---

## 8. 참조 파일

| 구분 | 경로 |
|------|------|
| 결제·메시지·푸시 | `PaymentServiceImpl.java` |
| 일정 | `ScheduleServiceImpl.java` (`createSchedule`, `createConsultantSchedule`, `confirmSchedule`) |
| 매칭 승인·입금 | `AdminServiceImpl.java`, `AdminController.java` |
| 푸시 발송 | `MobilePushDispatchServiceImpl.java`, `MobilePushCanonicalTypes.java` |
| 리마인더 | `WorkflowAutomationServiceImpl.java` |
| 시스템 알림 | `NotificationServiceImpl.java` |
| 어드민 필터 | `AdminMessageInboxFilter.java`, `ADMIN_MESSAGE_INBOX_FILTER_ORCHESTRATION.md` |
| Expo | `expo-app/src/services/NotificationService.ts`, `pushScenarios.ts` |
| 웹 푸시(미연동) | `frontend/src/services/PushNotificationService.js` |
| 토큰 API | `MobilePushController.java` |

---

## 9. 사용자 보고용 결론 초안 (한국어)

1. **결제 완료(PG)** 는 **내담자 대상 인앱 메시지·Expo 푸시**가 `PaymentServiceImpl`에서 나가지만, **알림톡·시스템 Alert·웹 푸시는 연결되어 있지 않다**. **어드민 매칭 「결제 확인」** 은 알림이 **전혀 없다**.

2. **승인·입금 확인** 도 **인앱·승인 안내 푸시가 없고**, 입금 확인 시 **가예약 확정·회기 차감**만 일어난다. 잔여 회기가 적을 때 **`session_low` 푸시만** 나갈 수 있다.

3. **일정 등록** 은 웹·Expo 모두 **`POST /api/v1/schedules/consultant`** 를 쓰며, 이 경로는 **`createConsultantSchedule`만 호출**해 **인앱·푸시가 발생하지 않는다**. 알림 로직이 있는 `createSchedule`은 **현재 컨트롤러에서 호출되지 않는다**. **예약 확정** 단계에서만 내담자 푸시·알림톡이 있다.

4. **웹과 앱은 API는 같지만**, **푸시는 Expo 앱 + 서버 Expo Push만** 실질 동작한다. `PushNotificationService.js`는 **레포에만 존재**하고 웹 UI에서 쓰이지 않으며, 서버도 **FCM 발송을 하지 않는다**.

5. **다음 단계**: §6 **core-debugger**로 P0-5(결제 메시지 수신자) 검증 → **core-tester** 자동화·§7 UAT → P0 승인 시 **core-coder**가 `createConsultantSchedule`·매칭 승인/입금에 알림 헬퍼 통합.

---

## 10. 실행 요청문 (부모 에이전트)

다음 순서로 서브에이전트를 호출해 주세요.

1. **병렬**: `core-debugger` (Phase A1), `explore` (Phase A2) — 본 문서 경로 전달  
2. **순차**: `core-tester` (Phase B1) — A 산출물 반영  
3. **사용자/QA**: §7 수동 UAT  
4. **별도 승인 후**: `core-coder` (Phase C1) + `core-tester` (C2)

**본 문서 작성만으로는 코드 변경 없음.**
