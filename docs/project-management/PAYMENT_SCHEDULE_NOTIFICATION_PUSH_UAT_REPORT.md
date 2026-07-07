# 결제·승인·일정 알림/푸시 — 수동 UAT 리포트

**작성**: core-tester  
**최종 갱신**: 2026-07-07 (Seq **28h** doc alignment — B1 §0/§10 cross-ref · B5 `APPOINTMENT` alias · B6 `/confirm` API path; 배치 **10** Solapi Phase D **`c5b181d28`** + 감정일기 inbox 회귀 **32+23 PASS**; human Solapi·§8.5 **NOT RUN**)  
**이전**: 2026-05-20 배치 6/6 · 2026-05-20 배치 5/5 · 2026-05-18 Phase C 자동 게이트  
**SSOT**: [PAYMENT_SCHEDULE_NOTIFICATION_PUSH_AUDIT_ORCHESTRATION.md](./PAYMENT_SCHEDULE_NOTIFICATION_PUSH_AUDIT_ORCHESTRATION.md) §3~§7·§7.6 · [MOBILE_PUSH_EXPO_DEPLOYMENT_CHECKLIST.md](./MOBILE_PUSH_EXPO_DEPLOYMENT_CHECKLIST.md) §2.1 · **API·시드·common_code 정합**: [PAYMENT_SCHEDULE_NOTIFICATION_UAT_API_SEED_ALIGNMENT.md](./PAYMENT_SCHEDULE_NOTIFICATION_UAT_API_SEED_ALIGNMENT.md)  
**코드 기준**: **`c5b181d28`** (Solapi Phase D SSOT) · 실행 HEAD **`3f3e97e28`** — `MappingSettlementNotificationHelper`, `NotificationServiceImpl`, Expo `pushNavigation`  
**환경**: `https://dev.core-solution.co.kr` — `/actuator/health` **200** (배치 **10**). dev JVM journal L1·`mobile_push_tokens`·CLIENT 실기기·Solapi ENV — **human 선행**.

---

## A. 배치 3/4 요약 (core-tester)

### A.1 오케스트레이션 §3 기대 vs 코드 실제 (grep·Java)

> **주의**: [오케스트레이션 §2~§3](./PAYMENT_SCHEDULE_NOTIFICATION_PUSH_AUDIT_ORCHESTRATION.md)은 **P0 구현 전** 스냅샷이다. 아래 **「코드 실제」** 열이 런타임·단위 테스트 SSOT이다.

| 트리거 | 채널 | 오케스트레이션 §3 (문서) | 코드 실제 (`24b901caf`) | 단위·베이스라인 테스트 |
|--------|------|--------------------------|-------------------------|-------------------------|
| **PG `Payment` APPROVED** | 인앱 | 조건부 | **Y** — `PaymentServiceImpl` `sendMessage(consultantId, clientId, …, CONSULTANT, PAYMENT_COMPLETION)` | `PaymentServiceImpl` 경로 (별도 베이스라인 없음) |
| | 푸시 | 조건부 (payer) | **Y** — `dispatchPaymentCompleted` (쇼핑 PG는 스킵) | `MobilePushDispatchServiceImplTest` |
| | 시스템 | **N** | **조건부 Y** (Phase D **`c5b181d28`** 이후) — `sendPaymentCompleted` · §10 D-3 | `NotificationServiceImplSmsFallbackTest` |
| | admin_ops | 조건부 | **조건부** — 본문 「결제」·타입 필터 | — |
| **confirm-payment** | 인앱·푸시 | **N** | **Y** — `notifyMappingSettlement(PAYMENT_CONFIRMED)` → `MappingSettlementNotificationHelper` | `AdminServiceImplMappingSettlementNotificationBaselineTest` |
| **confirm-deposit** | 인앱·푸시 | **N** / session_low만 | **Y** 인앱·`payment_completed` 푸시 + **session_low**는 회기 차감 시 `remaining≤2` (`useSessionForSpecificMapping`) | 동일 + `ScheduleServiceImplFinalizeTentativeAfterDepositTest` |
| **approve** | 전 채널 | **N** | **Y** 인앱(CLIENT·CONSULTANT)·`mapping_approved` 푸시 | `MappingSettlementNotificationHelperImplTest` |
| **POST `/schedules/consultant`** (BOOKED) | 인앱·푸시 | **N** | **Y** — `notifyScheduleCreated` → `ScheduleCreatedNotificationHelper` | `ScheduleServiceImplCreateConsultantScheduleNotificationBaselineTest` |
| | 가예약 | — | **N** — `tentativeBeforeDeposit=true` 시 알림·푸시 없음 | `ScheduleServiceImplNotifyScheduleCreatedTest` |
| **confirmSchedule** | 인앱 | N | **N** | `ScheduleServiceImplConfirmScheduleAlimTalkTest` |
| | 푸시·시스템 | 조건부 | **Y** — `dispatchBookingConfirmed` + `sendConsultationConfirmed` | 동일 |
| **웹 FCM** | — | **N** | **N** — `PushNotificationService.js` **import 0** | — |

### A.2 §7 체크리스트 판정 (PASS / FAIL / BLOCKED / NOT RUN)

| 구분 | ID | 항목 | 판정 | 근거 |
|------|-----|------|:----:|------|
| **§7.1** | P-1 | 4역할·테넌트 계정 | **NOT RUN** | QA 미연결 |
| | P-2 | CLIENT Expo `push-token/register` | **NOT RUN** | dev DB·실기기 미확인 |
| | P-3 | dev `EXPO_ACCESS_TOKEN` | **BLOCKED (env)** | 원격에서 JVM journal 미확인; 로컬 단위만 `ExpoPushPropertiesTest` PASS |
| | P-4 | 앱 카테고리 payment·schedule ON | **NOT RUN** | |
| | P-5 | admin_ops·MESSAGE_MANAGE | **NOT RUN** | |
| **§7.2** | 2-1 | PG → CLIENT 인앱·푸시 | **NOT RUN** | 코드·단위 **PASS** |
| | 2-2 | PG → admin_ops | **NOT RUN** | |
| | 2-3 | confirm-payment 알림 | **NOT RUN** | 코드 **PASS** (`MappingSettlement…`) |
| | 2-4 | confirm-deposit + session_low (≤2) | **NOT RUN** | `session_low`는 **일정 회기 차감** 경로만; 입금만으로 잔여≤2여도 스케줄 없으면 푸시 없을 수 있음 |
| | 2-5 | confirm-deposit (잔여 >2) | **NOT RUN** | |
| **§7.3** | 3-1 | approve 알림 | **NOT RUN** | 코드 **PASS** |
| | 3-2 | confirm-deposit 가예약→BOOKED | **NOT RUN** | `finalizeTentativeSchedulesAfterDepositConfirmed` 코드 있음 |
| **§7.4** | 4-1 | 일정 등록 CLIENT | **NOT RUN** | 코드 **PASS** |
| | 4-1b | 일정 등록 CONSULTANT | **NOT RUN** | 코드 **PASS** |
| | 4-2 | confirmSchedule 푸시·알림톡 | **NOT RUN** | 코드 **PASS** |
| **§7.5** | 5-1~5-3 | 웹·Expo 동일 API·푸시 | **NOT RUN** | health 200만 확인 |
| **자동** | — | Java Phase B/C 6클래스 | **PASS** | 2026-05-20 실행, 0 failures |
| | — | Expo `pushScenarios\|notificationService` | **PASS** | 7 tests |
| | — | Expo `test:utils` 전체 | **PASS** | 33 suites, **192** tests, 0 failed (2026-05-20 배치 **4/4** @ `e52678ab7` 후) |

**종합**: **CONDITIONAL** — 코드·단위·베이스라인 **PASS**; 라이브 UAT·푸시 E2E **PENDING/BLOCKED**.

### A.3 라이브 UAT 서버 선행 조건 (§5.1 + §2.1)

| # | 선행 조건 | 점검 |
|---|-----------|------|
| 1 | 테스트 테넌트 + ADMIN/STAFF/CONSULTANT/CLIENT 계정, API `X-Tenant-ID` | QA 준비 |
| 2 | dev `/etc/mindgarden/dev.env` — `export EXPO_ACCESS_TOKEN=…` ([§2.1](./MOBILE_PUSH_EXPO_DEPLOYMENT_CHECKLIST.md)) | journal `Expo push access token configured: true` |
| 3 | (Android) Expo 대시보드 FCM V1 + 기기 `registerToken` 200 → `mobile_push_tokens.active=1` | §2.2 |
| 4 | **CLIENT** APK 로그인·카테고리 `payment`·`schedule` ON — ADMIN 모바일은 푸시 E2E **비대상** | UAT 리포트 §0 |
| 5 | PG 테스트 또는 `confirm-payment`로 결제 시나리오 재현 | §7.2 |
| 6 | 웹·Expo 어드민 `POST /api/v1/schedules/consultant` (BOOKED, `tentativeBeforeDeposit=false`) | §8.5 |

### A.4 dev 미도달 시 코드 수준 기대 (Java + Expo)

| 트리거 | 서버 (Java) | 클라이언트 (Expo) |
|--------|-------------|-------------------|
| PG APPROVED | `consultation_messages` + `MobilePushDispatchServiceImpl.dispatchPaymentCompleted` | `pushScenarios` `payment_completed` → sessions-payment 딥링크; 카테고리 `payment` |
| confirm-payment/deposit | `MappingSettlementNotificationHelperImpl` 인앱 + `dispatchMappingSettlement` (`payment_completed`) | 동일 type |
| approve | 인앱 2건 + `mapping_approved` (CLIENT·CONSULTANT 푸시) | `mapping_approved` |
| schedules/consultant | 로그 `예약 생성 알림 발송/완료`, `dispatchBookingConfirmed` | `booking_confirmed`, 카테고리 `schedule` |
| confirmSchedule | `sendConsultationConfirmed` + `dispatchBookingConfirmed` | `booking_confirmed` (인앱 메시지 타입 없음) |
| 토큰·env 없음 | 로그 `푸시 발송 생략: Expo access token 미설정` / `활성 토큰 없음` | `registerToken` `outcome=failed` — 정상 스킵 |

### A.5 core-coder 우선 갭 Top 3

| 순위 | 갭 | 근거·권장 |
|------|-----|-----------|
| **1** | **시스템 알림 (P0-3 → Phase D ☑)** | Phase D **`c5b181d28`** 에서 PG `APPROVED`·confirm-payment/deposit → `sendPaymentCompleted` **연결됨** (§10·[정합표](./PAYMENT_SCHEDULE_NOTIFICATION_UAT_API_SEED_ALIGNMENT.md) §2 B1~B3). **잔여**: human Solapi UAT §10.3 D-0~D-4 **NOT RUN** · `ALIMTALK_BIZ_TEMPLATE_CODE.PAYMENT_COMPLETED` Flyway 미시드(정합표 §3.1) |
| **2** | **웹 푸시 파이프라인 부재 (P0-4)** | 서버 `MobilePushPlatform` ios/android만; `frontend/.../PushNotificationService.js` **미참조** — Phase C 별도 트랙 또는 문서화 |
| **3** | **오케스트레이션 §2~§3 문서 드리프트** | `createConsultantSchedule`·매칭 API는 **Y**로 구현됨 — [오케스트레이션](./PAYMENT_SCHEDULE_NOTIFICATION_PUSH_AUDIT_ORCHESTRATION.md) §2·§9·§7 수동 기대(「없음」) 갱신 또는 `session_low`가 **입금 직후**에도 나가야 하는지 제품 확인 (`confirm-deposit`만으로는 회기 차감 없으면 푸시 없음) |

---

## 0. P0 후 기대 (코더·테스터 SSOT) — 기대 Y 표

| # | 트리거 | CLIENT 인앱 | CLIENT 푸시 | CONSULTANT 인앱 | CONSULTANT 푸시 | ADMIN/STAFF 인박스 | 시스템(Alert/알림톡) |
|---|--------|:-----------:|:-------------:|:---------------:|:---------------:|:-------------------:|:--------------------:|
| B1 | PG `Payment` **APPROVED** | **조건부 Y** | **조건부 Y** (`payment_completed`) | N | N | **조건부** (`admin_ops` 키워드) | N |
| B2 | 어드민 **confirm-payment** | **Y** (`PAYMENT_COMPLETION`) | **조건부 Y** (`payment_completed`) | N | N | **조건부** (키워드·타입) | N |
| B3 | 어드민 **confirm-deposit** | **Y** | **조건부 Y** (`payment_completed`) + **조건부** (`session_low`, 잔여 ≤2) | N | N | **조건부** | N |
| B4 | 어드민 **approve** | **Y** | **조건부 Y** (`mapping_approved`) | **Y** | **조건부 Y** (`mapping_approved`) | **조건부** | N |
| B5 | **POST** `/api/v1/schedules/consultant` (BOOKED 등록) | **Y** (`APPOINTMENT`¹) | **조건부 Y** (`booking_confirmed`) | **Y** (`NEW_APPOINTMENT`) | N | **조건부** | N |
| B5-API | 동일 API **HTTP 응답** (P0·`ScheduleCreatedNotificationHelper` REQUIRES_NEW 반영 후) | — | — | — | — | **Y** — `success=true`, `data.id`(또는 schedule id) | — |
| B6 | **`PUT /api/v1/schedules/{id}/confirm?userRole=ADMIN\|STAFF`** (`confirmSchedule`) | N (별도 메시지 타입 없음) | **조건부 Y** (`booking_confirmed`) | N | N | N | **조건부 Y** (내담자 알림톡/SMS) |

> **조건부**: `EXPO_ACCESS_TOKEN`·활성 토큰(`mobile_push_tokens.active=1`)·앱 카테고리(`payment`/`schedule`/`system`) on. 가예약(`tentativeBeforeDeposit=true`) 일정 등록은 B5·B5-API 알림 **N**(API 자체는 200 가능).  
> **ADMIN 모바일 MVP**: `payment_completed`·푸시 E2E **비대상** — 검증은 **CLIENT**(필수)·CONSULTANT(매핑 승인 시) APK.  
> **B1 시스템 열**: 본 §0 표는 **P0·Phase C 스냅샷**(시스템 **N**). Solapi Phase D(§10) 이후 B1~B3 시스템 알림톡/SMS는 **조건부 Y** — [정합표](./PAYMENT_SCHEDULE_NOTIFICATION_UAT_API_SEED_ALIGNMENT.md) §2·§6·§7 D-1.  
> ¹ **B5 인앱 type**: 런타임 DB `consultation_messages.message_type` = **`APPOINTMENT`**. common_code 시드명 `APPOINTMENT_CONFIRMATION`과 **별칭** — admin_ops 필터는 둘 다 allow ([정합표](./PAYMENT_SCHEDULE_NOTIFICATION_UAT_API_SEED_ALIGNMENT.md) §4).

---

## 1. 사전 조건 (§7.1)

| ID | 항목 | 완료 | 증빙 |
|----|------|:----:|------|
| P-1 | 테스트 테넌트·`X-Tenant-ID`·4역할(ADMIN, STAFF, CONSULTANT, CLIENT) 계정 준비 | ☐ | |
| P-2 | CLIENT·CONSULTANT Expo: 로그인 후 `POST /api/v1/mobile/push-token/register` 성공 | ☐ | API 응답 / 앱 설정 화면 |
| P-3 | 서버 `EXPO_ACCESS_TOKEN` 설정 확인 (미설정 시 푸시 **N** 정상) | ☐ | 서버 env / 로그 `Expo access token 미설정` |
| P-4 | Expo 앱: 푸시 카테고리 `payment`·`schedule` ON | ☐ | 스크린샷 |
| P-5 | 어드민(웹·Expo): 메시지 `view=admin_ops`, `MESSAGE_MANAGE` 권한 | ☐ | |

---

## 2. 결제 완료 (§7.2)

| 단계 | 조작 (dev API) | 역할 | 인앱 메시지함 | 푸시 | DB/로그 증빙 | Pass |
|------|----------------|------|:-------------:|:----:|---------------|:----:|
| 2-1 | PG 테스트 결제 → `Payment` **APPROVED** | CLIENT | `PAYMENT_COMPLETION` 또는 본문 「결제」 1건+ | `payment_completed` 또는 서버 `Expo 푸시` 로그 | `consultation_messages` | ☐ |
| 2-2 | 동일 | ADMIN/STAFF | `admin_ops` 목록 노출(키워드·필터) | N | 목록 API / 스크린 | ☐ |
| 2-3 | `POST .../mappings/{id}/confirm-payment` | CLIENT | **Y** — `PAYMENT_COMPLETION` 1건+ (B2) | **조건부 Y** — `payment_completed` | `consultation_messages`·푸시 로그 | ☐ |
| 2-4 | `POST .../mappings/{id}/confirm-deposit` (잔여 회기 ≤2) | CLIENT | **Y** (B3) | **`payment_completed` + `session_low`** (조건부) | 푸시 type / 로그 | ☐ |
| 2-5 | 동일 (잔여 회기 >2) | CLIENT | **Y** | **`payment_completed`만** (`session_low` 없음) | | ☐ |

---

## 3. 승인 (§7.3)

| 단계 | 조작 | 역할 | 인앱 | 푸시 | 시스템 | Pass |
|------|------|------|:----:|:----:|:------:|:----:|
| 3-1 | `POST .../mappings/{id}/approve` | CLIENT | **Y** (B4) | **조건부 Y** — `mapping_approved` | **N** | ☐ |
| 3-1b | 동일 | CONSULTANT | **Y** | **조건부 Y** — `mapping_approved` | **N** | ☐ |
| 3-2 | confirm-deposit 후 가예약→BOOKED | CLIENT | 가예약 확정 인앱 **조건부** (별도 경로) | 입금·승인 푸시는 B3·B4 기준 | **N** | ☐ |

---

## 4. 일정 등록·확정 (§7.4)

| 단계 | 조작 | 역할 | 인앱 | 푸시 | 시스템 | Pass |
|------|------|------|:----:|:----:|:------:|:----:|
| 4-1 | 웹 또는 Expo 어드민 `POST /api/v1/schedules/consultant` (BOOKED) | CLIENT | **Y** (B5) — `message_type` **`APPOINTMENT`**¹ | **조건부 Y** — `booking_confirmed` | **N** | ☐ |
| 4-1b | 동일 | CONSULTANT | **Y** — `NEW_APPOINTMENT` | **N** | **N** | ☐ |
| 4-2 | **`PUT /api/v1/schedules/{id}/confirm?userRole=ADMIN\|STAFF`** (B6) | CLIENT | N | **`booking_confirmed` 조건부 Y** (B6) | 알림톡/SMS **조건부** (`CONSULTATION_CONFIRMED`) | ☐ |
| 4-3 | 동일 | CONSULTANT | N | N | N | ☐ |

> ¹ B5 CLIENT 인앱: DB `message_type` = **`APPOINTMENT`** (시드 라벨 `APPOINTMENT_CONFIRMATION`과 별칭). QA 증빙은 `consultation_messages.message_type` 컬럼 기준 — [정합표 §4](./PAYMENT_SCHEDULE_NOTIFICATION_UAT_API_SEED_ALIGNMENT.md).

---

## 5. 웹 vs 앱 (§7.5)

| 단계 | 검증 | Pass | 증빙 |
|------|------|:----:|------|
| 5-1 | 웹·Expo 동일 API → 동일 `schedules` / `mappings` DB 행 | ☐ | DB id |
| 5-2 | 웹 브라우저 OS 알림 **없음** (현행 정상) | ☐ | |
| 5-3 | Expo 동일 CLIENT 계정: B1/B6에서 푸시 유무 기록 | ☐ | 디바이스·로그 |

---

## 6. 증빙 수집 가이드

| 채널 | 확인 방법 |
|------|-----------|
| **인앱** | CLIENT/CONSULTANT 앱 메시지함; ADMIN `GET .../consultation-messages/all?view=admin_ops` |
| **푸시** | Expo 디바이스 알림; 서버 로그 `Expo 푸시`, `type=payment_completed` / `booking_confirmed` / `session_low` |
| **DB** | `consultation_messages` (message_type, sender/receiver); `mobile_push_tokens` (`active`, `tenant_id`, `user_id`) |
| **시스템** | `NotificationService` 알림톡/SMS 로그; `alert` 테이블 (해당 시) |

---

## 7. 자동 테스트 게이트 (core-tester)

### Phase C (푸시 E2E 배치 — 필수)

| 테스트 클래스 | 역할 |
|---------------|------|
| `ScheduleCreatedNotificationHelperImplTest` | BOOKED → 인앱·`dispatchBookingConfirmed` (REQUIRES_NEW 헬퍼) |
| `ExpoPushPropertiesTest` | 기동 로그 `Expo push access token configured` |
| `MobilePushDispatchServiceImplTest` | Expo 발송·스킵·멱등·`booking_confirmed` |

```bash
mvn -q -Dtest=ScheduleCreatedNotificationHelperImplTest,ExpoPushPropertiesTest,MobilePushDispatchServiceImplTest test
cd expo-app && npm run test:utils
```

### Phase B2 회귀 (선택·전체 매칭·일정)

| 테스트 클래스 | 역할 |
|---------------|------|
| `AdminServiceImplMappingSettlementNotificationBaselineTest` | confirm-payment/deposit/approve → helper **verify** |
| `MappingSettlementNotificationHelperImplTest` | 시나리오별 인앱·`dispatchMappingSettlement` |
| `ScheduleServiceImplCreateConsultantScheduleNotificationBaselineTest` | `createConsultantSchedule` → 알림 **verify** |
| `ScheduleServiceImplNotifyScheduleCreatedTest` | BOOKED/가예약 분기 |
| `ScheduleServiceImplConfirmScheduleAlimTalkTest` | confirmSchedule → 알림톡 + **booking_confirmed** |
| `MobilePushDispatchServiceImplTest` | (Phase C와 중복 실행 가능) |

```bash
mvn -Dtest=MappingSettlementNotificationHelperImplTest,ScheduleServiceImplNotifyScheduleCreatedTest,MobilePushDispatchServiceImplTest,AdminServiceImplMappingSettlementNotificationBaselineTest,ScheduleServiceImplCreateConsultantScheduleNotificationBaselineTest,ScheduleServiceImplConfirmScheduleAlimTalkTest,ScheduleServiceImplFinalizeTentativeAfterDepositTest,AdminServiceImplConfirmDepositApproveTest test
```

---

## 8. 자동 검증 결과 (Phase C — 푸시 E2E 게이트)

**실행일**: 2026-05-20 (배치 **4/4** · `e52678ab7` 후) · 2026-05-20 (배치 3/4) · 2026-05-18 (최초)  
**실행자**: core-tester  
**코드 기준**: **`e52678ab7`** — `ScheduleCreatedNotificationHelper` REQUIRES_NEW, `MappingSettlementNotificationHelper`, `ExpoPushProperties`, Expo `pushNavigation`·`test:utils`  
**dev**: `https://dev.core-solution.co.kr/actuator/health` → **200** (`{"status":"UP"}`)  
**dev 푸시 토큰 재기동**: 운영 측 재기동 **가정** — 본 배치에서 **원격 journal·DB 미접근** → §8.3 L1·§8.5 **NOT RUN/BLOCKED 유지** (재기동 후 `journalctl`로 `Expo push access token configured: true` 확인 시 L1·§8.5만 갱신 가능)  
**판정 요약**: Java 6클래스·Expo 푸시 Jest·`test:utils` **192/192 PASS** / §1~§5·§8.5 라이브 **NOT RUN** → **CONDITIONAL**

### 8.1 Java (Phase C — P0 알림·푸시 단위)

| 항목 | 결과 |
|------|------|
| **판정** | **PASS** (26 tests, 0 failures — 6클래스) |
| **명령** | 아래 3클래스 |

```bash
cd /Users/mind/mindGarden
mvn -q -Dtest=ScheduleCreatedNotificationHelperImplTest,ExpoPushPropertiesTest,MobilePushDispatchServiceImplTest,MappingSettlementNotificationHelperImplTest,ScheduleServiceImplCreateConsultantScheduleNotificationBaselineTest,AdminServiceImplMappingSettlementNotificationBaselineTest test
```

| 테스트 클래스 | Tests | Failures | 검증 요지 |
|---------------|------:|---------:|-----------|
| `ScheduleCreatedNotificationHelperImplTest` | 1 | 0 | BOOKED → 인앱 2건·`dispatchBookingConfirmed` |
| `ExpoPushPropertiesTest` | 2 | 0 | `@PostConstruct` — `Expo push access token configured: true/false` |
| `MobilePushDispatchServiceImplTest` | 9 | 0 | 토큰 미설정·카테고리 off·멱등·Expo HTTP |
| `MappingSettlementNotificationHelperImplTest` | — | 0 | confirm-payment/deposit/approve 인앱·푸시 |
| `AdminServiceImplMappingSettlementNotificationBaselineTest` | — | 0 | AdminService → helper **verify** |
| `ScheduleServiceImplCreateConsultantScheduleNotificationBaselineTest` | — | 0 | `createConsultantSchedule` → helper **verify** |

> **2026-05-20**: 위 6클래스 일괄 실행 **0 failures**. Phase B2 추가 2클래스(`ScheduleServiceImplNotifyScheduleCreatedTest` 등)는 선택 회귀.

### 8.2 Expo

| 항목 | 결과 |
|------|------|
| **푸시 계약** | **PASS** — `npx jest --testPathPattern='pushScenarios\|notificationService'` → **7 tests**, 0 failed |
| **test:utils 전체** | **PASS** — 33 suites, **192** tests, 0 failed (2026-05-20 배치 **5/5**, ~45s) — **`pushNavigation.test.ts` 포함** |
| **pushNavigation** | **PASS** — P1–P12·alias·fallback (`pushNavigation.test.ts`, 배치 5) |
| **pushScenarios\|notificationService** | **PASS** — 3 suites, **7** tests (배치 4·5 자동 회귀) |
| **관련 스위트** | `pushScenarios.test.ts`, `notificationServiceRegisterToken.test.ts`, `notificationServiceRequestPermission.test.ts` |

### 8.3 수동 UAT

| 항목 | 결과 |
|------|------|
| **판정** | **NOT RUN** — `EXPO_ACCESS_TOKEN` 미설정 · CLIENT 실기기·토큰 DB 미확인 · QA 미연결 |
| **§1~§5** | **§8.4** 8단계 또는 **§8.5** 푸시 E2E 5줄 (선행 조건 미충족 시 실행 금지) |
| **결제 푸시** | ADMIN 앱으로 `payment_completed` 검증 **하지 않음** (비대상) |

**라이브 UAT 선행 체크 (미충족 시 NOT RUN 유지)**

| # | 조건 | 배치 **5/5** 점검 |
|---|------|-------------------|
| L1 | dev JVM `EXPO_ACCESS_TOKEN` 설정 | **BLOCKED** — 테스터 SSH/journal **미접근**; EAS **`cbae858a` queue** — IPA finished **후** journal `Expo push access token configured: true` 확인 |
| L2 | CLIENT `POST .../push-token/register` **200** | **NOT RUN** — CLIENT IPA/APK + 실기기 필요 |
| L3 | `mobile_push_tokens` CLIENT `active=1` **≥ 1** | **NOT RUN** |
| L4 | 앱 카테고리 `payment`·`schedule` ON | **NOT RUN** |
| L5 | QA 4역할·테스트 테넌트 | **NOT RUN** |

### 8.4 QA·dev 수동 UAT — 8단계 (P0·Phase C, CONDITIONAL 해제용)

> §1 사전 조건 후 §2~§5 Pass·증빙 채움. 푸시만 빠르게 보려면 **§8.5** 5줄 우선.

| # | 스텝 | 검증 (P0 후 기대) | SSOT |
|---|------|-------------------|------|
| 1 | 테스트 테넌트·4역할·`X-Tenant-ID` | 계정·권한 | §1 P-1 |
| 2 | **CLIENT** Expo 로그인 → 푸시 허용 → `NotificationService.registerToken` → `POST /api/v1/mobile/push-token/register` **200** | §1 P-2 · §8.5 |
| 3 | dev JVM·journal: `Expo push access token configured: true` | §1 P-3 |
| 4 | 앱 설정: 카테고리 `payment`·`schedule` **ON** | §1 P-4 |
| 5 | PG **APPROVED** 또는 `confirm-payment` | CLIENT 인앱·`payment_completed` (ADMIN 앱 아님) | §2 |
| 6 | 웹·Expo 어드민 `POST /api/v1/schedules/consultant` (BOOKED, 가예약 아님) | **B5-API Y** + B5 인앱·`booking_confirmed` | §4 · §0 |
| 6b | (선택) **`PUT /api/v1/schedules/{id}/confirm?userRole=ADMIN\|STAFF`** | B6 — `booking_confirmed` 푸시·`CONSULTATION_CONFIRMED` 알림톡/SMS | §4 4-2 |
| 7 | DB: `consultation_messages` + `mobile_push_tokens` (CLIENT `user_id`, `active=1`) | §6 |
| 8 | 서버 로그·실기기 알림 스크린 | §8.5 로그 키워드 | §6 |

### 8.5 푸시 E2E — dev 절차 (CLIENT · 일정 `booking_confirmed`)

**대상 역할**: **CLIENT** 내담자 APK(또는 client 셸). **ADMIN 모바일**은 토큰 등록·`payment_completed` E2E **제외**.

| 단계 | 조작 | 기대·증빙 |
|------|------|-----------|
| **E0** | dev 서버 기동 후 journal | `Expo push access token configured: true` (`ExpoPushProperties`). `false`이면 이후 푸시 전부 스킵 정상 |
| **E1** | **CLIENT** 계정으로 Expo 로그인, OS 푸시 허용 | 앱: `registerToken` 호출 · API `POST /api/v1/mobile/push-token/register` → **HTTP 200**, `success=true` |
| **E2** | DB (테넌트·CLIENT `user_id` 치환) | `SELECT COUNT(*) FROM mobile_push_tokens WHERE tenant_id = ? AND user_id = ? AND active = 1` → **≥ 1**. (사전 0건이면 E1 후 재조회) |
| **E3** | **웹 어드민**(또는 Expo 어드민)에서 매핑·상담사·일시 확정 후 `POST /api/v1/schedules/consultant` | **B5-API**: 응답 **200**·schedule id. 본문 `tentativeBeforeDeposit` **false**·상태 BOOKED |
| **E4** | 서버 로그 grep (동일 `tenantId`) | **발화**: `예약 생성 알림 발송`, `예약 생성 알림 완료`, `dispatchBookingConfirmed` 경로, `type=booking_confirmed` 또는 `Expo 푸시` 성공 로그 · **스킵(정상 가능)**: `푸시 발송 생략: Expo access token 미설정`, `활성 토큰 없음`, `카테고리 off`, `푸시 멱등으로 스킵` |
| **E5** | CLIENT 실기기 | OS 알림 1건 (`booking_confirmed` 시나리오). 없으면 E2·E4 스킵 사유와 앱 카테고리 `schedule` 재확인 |

**QA — dev에서 할 순서 (5줄)**

1. journal에서 `Expo push access token configured: true` 확인  
2. **CLIENT** APK 로그인 → 푸시 허용 → register API 200  
3. `mobile_push_tokens` CLIENT 행 `active=1` **≥ 1**  
4. 웹 어드민으로 `POST /api/v1/schedules/consultant` (BOOKED) → API **200**  
5. 로그 `예약 생성 알림`·`booking_confirmed`·실기기 알림 (또는 §8.5 E4 스킵 사유 기록)

### 8.5.1 IPA·EAS finished 후 실행 순서 (L1~L5 → E0~E5)

> **선행**: CLIENT **internal-dev IPA** **`79fbcd1b`**(human 설치) 또는 Android dev APK · dev `https://dev.core-solution.co.kr` UP. **라이브 E2E**(L2~L5·E1~E5)는 본 배치 **NOT RUN** — 자동 가능 범위만 아래 「배치 6 자동」 참고.

| 순서 | ID | 단계 | 담당 | 증빙·Pass 기록 | 블로커 |
|------|-----|------|------|----------------|--------|
| 0 | — | CLIENT IPA **`79fbcd1b`** 또는 dev APK 설치 | human | 실기기 설치 완료 | 본 배치 미검 |
| 1 | **L1** / **E0** | dev JVM journal — `EXPO_ACCESS_TOKEN` | ops/tester | `Expo push access token configured: true` | SSH/journal 미접근 → **BLOCKED** (배치 6) |
| 2 | **L5** | QA 테스트 테넌트·4역할·`X-Tenant-ID` | human/QA | 계정 목록·테넌트 id | — |
| 3 | **L2** / **E1** | **CLIENT** 로그인 → OS 푸시 허용 → `registerToken` | tester | `POST .../push-token/register` **200** · `success=true` | IPA/APK·실기기 |
| 4 | **L4** | 앱 설정 카테고리 `payment`·`schedule` **ON** | tester | 설정 스크린 또는 in-app state | E1 후 |
| 5 | **L3** / **E2** | DB `mobile_push_tokens` | tester | `active=1` **≥ 1** (tenant·CLIENT `user_id`) | E1 후 |
| 6 | **E3** | 웹·Expo 어드민 `POST /api/v1/schedules/consultant` (BOOKED, `tentativeBeforeDeposit=false`) | tester/web admin | API **200** · schedule id | L5·매핑 시드 |
| 7 | **E4** | 서버 로그 grep (`tenantId`) | tester | `예약 생성 알림`·`booking_confirmed`·`dispatchBookingConfirmed` 또는 **스킵 사유** 기록 | E3 후 |
| 8 | **E5** | CLIENT 실기기 OS 알림 | tester | `booking_confirmed` 1건 또는 E4 skip 사유 + L4 재확인 | E4 후 |

**ADMIN G4(C3-06)와의 관계**: 동일 EAS finished 신호로 **병렬** 가능 — ADMIN 스모크는 [`COMMERCIALIZATION_TEST_REPORT` §6.5](./ADMIN_MOBILE_COMMERCIALIZATION_TEST_REPORT.md); 본 표는 **CLIENT 푸시 E2E 전용**.

**배치 6 자동 (2026-05-20 · `35765024b`)**

| ID | 자동 확인 | 결과 | 비고 |
|----|-----------|------|------|
| — | `curl https://dev.core-solution.co.kr/actuator/health` | **PASS** | HTTP **200** |
| **L1** / **E0** | dev JVM journal grep | **BLOCKED** | SSH/journal 미접근 |
| **L2~L5** · **E1~E5** | CLIENT 실기기·register·DB·일정 POST·OS 알림 | **NOT RUN** | IPA human·팀 CLIENT 계정 선행 |

**배치 5 판정**: L1~L5·E1~E5 **전항 NOT RUN/BLOCKED 유지** — journal·register 200·DB 행·실기기 알림 **증빙 없음**.

### 8.6 게이트 최종 판정 (배치 **6/6**)

| 레이어 | 판정 |
|--------|------|
| Java Phase B/C (6클래스) | **PASS** (배치 4 기준 **26** tests — 본 배치 **미재실행**) |
| Expo 푸시·알림 Jest (`pushScenarios\|notificationService`) | **PASS** (7 tests — 배치 4 기준) |
| Expo `test:utils` 전체 | **PASS** (**196/196**, 2026-05-20 배치 **6/6**, ~10s) — **`pushNavigation.test.ts`·`notificationServiceNavigate.test.ts` 포함** |
| dev API reachability | **PASS** — `/actuator/health` **200** (배치 **6/6**) |
| 푸시 E2E dev (§8.5) | **NOT RUN / BLOCKED** — L1 journal **BLOCKED**; L2~L5·E1~E5 **NOT RUN** (라이브 유지) |
| §1~§5 전체 수동 | **NOT RUN** |
| Shop R10 (dev FE+API) | **PASS** — **2 passed** (~8s); 로컬 **8080 BLOCKED** ([`SHOP_P2` §1.0.1](./SHOP_P2_INTEGRATION_TEST_REPORT.md)) |
| **종합** | **CONDITIONAL** — §A.2 참조; §8.5.1 라이브 완료 전 운영 go-live 비권장 |

**배치 6**: 자동(`test:utils` **196/196`·dev health **200**) **PASS**; §8.5 라이브 **NOT RUN → 변경 없음**.

---

## 9. 코더 P0 후 재검증 체크리스트

- [x] `AdminServiceImplMappingSettlementNotificationBaselineTest` — `MappingSettlementNotificationHelper` **verify**
- [x] `ScheduleServiceImplCreateConsultantScheduleNotificationBaselineTest` — 인앱·`dispatchBookingConfirmed` **verify**
- [x] 본 문서 §0 P0 후 기대 Y 표·§2~§4 expected 갱신
- [ ] §2~§4 수동 UAT (dev·§1 사전 조건 후 실행)
- [ ] §8.5 푸시 E2E (CLIENT·`mobile_push_tokens`·웹 일정 등록·로그) — **IPA finished 후** [§8.5.1](./PAYMENT_SCHEDULE_NOTIFICATION_PUSH_UAT_REPORT.md#851-ipaeas-finished후-실행-순서-l1l5--e0e5) 순서표
- [ ] (선택) `PaymentServiceImpl` APPROVED — `sendMessage` 수신자 P0-5 debugger 확정 반영 테스트 추가

---

## 10. Solapi Phase D (2026-05-22)

> **배치 10-4** (core-tester) · SSOT commit **`c5b181d28`** · 오케스트레이션 [§7.6](./PAYMENT_SCHEDULE_NOTIFICATION_PUSH_AUDIT_ORCHESTRATION.md#76-solapi-phase-d-uat-알림톡sms) · ENV 디버그: [`SOLAPI_NOTIFICATION_MISS_DEBUG.md`](./2026-05-22/SOLAPI_NOTIFICATION_MISS_DEBUG.md)

**D-0 dev ENV (human 선행 — 핫픽스 `3f3e97e28` 반영·재기동 후)**: dev `/etc/mindgarden/dev.env`·JVM journal에서 아래 3줄을 **D-2~D-4 착수 전** 확인한다. (1) **`SOLAPI_ALIMTALK_PFID` → `kakao.alimtalk.solapi.pf-id` 바인딩** — 기동·발송 시 WARN `자격 증명 또는 pfId` **0건** (`KakaoAlimTalkServiceImpl#isServiceAvailable` true). (2) **`SMS_TEST_MODE=false`** — journal `🧪 Solapi 테스트 모드 - 실제 발송 스킵` **0건** (정책상 dev 실발송 허용 시 `sync-solapi-sms-env.sh` merge `"false"`). (3) **confirm-deposit 재시도** — 어드민 매칭 **입금 확정** 1회 → `finalizeTentativeSchedulesAfterDepositConfirmed`·`MappingSettlementNotificationHelper` 로그 + 단말 알림톡/SMS 1건 ([§8 Step 2~3](./2026-05-22/SOLAPI_NOTIFICATION_MISS_DEBUG.md#8-재현-절차-수정-후-검증용)).

### 10.1 자동 게이트 (2026-05-22)

| 레이어 | 명령 | 결과 |
|--------|------|:----:|
| **Java 7클래스** | `mvn -q test -Dtest=MappingSettlementNotificationHelperImplTest,SmsAuthServiceNotificationMessageTest,NotificationServiceImplSmsFallbackTest,NotificationServiceImplAlimtalkTemplateResolveTest,MoodJournalControllerInboxIntegrationTest,MoodJournalServiceImplSharePushTest,MobilePushDispatchServiceImplTest` | **PASS** — **32** tests, 0 failures (~75s) |
| **Expo pushNavigation** | `cd expo-app && npm run test:utils -- pushNavigation` | **PASS** — **23** tests, 0 failures (~3s) — `mood_journal_shared` → `/(consultant)/(more)/mood-journal-inbox` 포함 |
| **dev reachability** | `curl …/actuator/health` | **PASS** — HTTP **200** |

| 테스트 클래스 | Tests | 검증 요지 |
|---------------|------:|-----------|
| `MappingSettlementNotificationHelperImplTest` | 4 | confirm-payment/deposit → 인앱·`payment_completed` 푸시 + **`sendPaymentCompleted` verify**; approve는 `sendPaymentCompleted` **미호출** |
| `NotificationServiceImplSmsFallbackTest` | 1 | `PAYMENT_COMPLETED`: 알림톡 실패 → `SmsAuthService.sendNotificationMessage` SMS 폴백 |
| `NotificationServiceImplAlimtalkTemplateResolveTest` | 6 | 알림톡 biz templateId resolve (테넌트 DB → 공통코드 → type name) |
| `SmsAuthServiceNotificationMessageTest` | 2 | 프로덕션 모드 **SolapiSmsProvider** 발송; testMode 시 provider 스킵 |
| `MoodJournalControllerInboxIntegrationTest` | 3 | `GET /api/v1/mood-journals/inbox` 계약·테넌트·역할 |
| `MoodJournalServiceImplSharePushTest` | 3 | `sharedWithConsultant` false→true 1회 fanout |
| `MobilePushDispatchServiceImplTest` | 13 | `payment_completed`·`mood_journal_shared` 등 Expo dispatch baseline |

**판정**: Solapi Phase D **코드·단위·통합 회귀 PASS** — human UAT(§10.3) **착수 가능** (ENV·templateId 선행).

### 10.2 코드 수준 기대 (Phase D)

| 트리거 | 알림톡 | variables / 호출 | SMS 폴백 |
|--------|--------|------------------|----------|
| **PG `Payment` APPROVED** | `NotificationType.PAYMENT_COMPLETED` · template `PAYMENT_COMPLETED` | `paymentAmount`, `packageName`, `consultantName` (`NotificationServiceImpl.sendPaymentCompleted`) | 알림톡 실패 시 **Solapi** (`SmsAuthService` → `SolapiSmsProvider`) |
| **confirm-payment** | 동일 (`MappingSettlementNotificationHelper` → `sendPaymentCompleted`) | 매핑 금액·패키지명·상담사명 | 동일 |
| **confirm-deposit** | 동일 | 동일 | 동일 |
| **approve** | **N** (Phase D 범위 외) | `sendPaymentCompleted` **미호출** (단위 검증) | — |

> **병행 유지**: 인앱 `PAYMENT_COMPLETION` · Expo `payment_completed` 푸시는 기존 baseline과 **동시** 발화 (`MappingSettlementNotificationHelperImplTest` verify).

### 10.3 Human UAT 체크리스트 (Solapi · §7.6)

> **담당**: human/QA (배치 **10-5**) · **선행**: `SMS_TEST_MODE=false` · Solapi PFID·발신번호·`PAYMENT_COMPLETED` templateId 검수 승인 · [`§7.6`](./PAYMENT_SCHEDULE_NOTIFICATION_PUSH_AUDIT_ORCHESTRATION.md#76-solapi-phase-d-uat-알림톡sms) 행 1~2

| # | 시나리오 | 검증 (기대) | Pass | 증빙 |
|---|----------|-------------|:----:|------|
| D-0 | **선행 ENV** | journal `kakao.alimtalk.solapi.*` WARN **0건** · Solapi 발신번호·PFID 바인딩 | ☐ | journal grep · env 스크린 |
| D-1 | **선행 templateId** | 솔라피 콘솔 `PAYMENT_COMPLETED` 검수 승인 · 매핑 정산 templateId 목록 | ☐ | 콘솔 스크린·templateId |
| D-2 | **confirm-payment** | CLIENT 단말 **알림톡 1건** (variables: 금액·패키지·상담사) 또는 **SMS 폴백**; 인앱·Expo 푸시 **유지** | ☐ | 단말 수신 · 콘솔 `groupId` · 서버 `MappingSettlementNotificationHelper` 로그 |
| D-3 | **PG APPROVED** (테스트 결제) | CLIENT 알림톡/SMS · `sendPaymentCompleted` · **`PAYMENT_COMPLETED` templateId** 정합 | ☐ | PG·Payment `APPROVED` 행 · 단말 수신 |
| D-4 | **알림톡 실패 → SMS** | 알림톡 차단/실패 시 Solapi SMS 본문 수신 (`[마인드가든] 결제…`) | ☐ | 단말 SMS · `SmsAuthService`/`SolapiSmsProvider` 로그 |

### 10.4 감정일기 inbox 회귀 (배치 10 교차)

**자동**: §10.1 Java·Expo **PASS** (V1~V3). **Human 푸시 E2E**는 [`MOOD_JOURNAL_CONSULTANT_INBOX_TEST_PLAN.md` §6.2](./MOOD_JOURNAL_CONSULTANT_INBOX_TEST_PLAN.md#62-human-85-스모크--qa-3줄-mood_journal_shared) 3줄 스모크( CLIENT 공유 ON → CONSULTANT 푸시·inbox · 재저장 0건 · mind-weather 회귀) — **별도 human UAT**, Solapi D-2~D-4와 **병렬 가능**(EAS·`push-token/register` 선행).

### 10.5 배치 10 게이트 판정

| 레이어 | 판정 |
|--------|------|
| Solapi Phase D 자동 (§10.1) | **PASS** |
| 감정일기 inbox 자동 (§10.1) | **PASS** |
| Solapi human (§10.3 D-0~D-4) | **NOT RUN** |
| 감정일기 human (§10.4 cross-ref) | **NOT RUN** |
| §8.5 CLIENT 푸시 E2E (결제·일정) | **NOT RUN / BLOCKED** (L1 journal) |
| **종합** | **CONDITIONAL** — **human UAT 착수 가능** (자동 게이트 green; D-0~D-1 ENV·templateId 선행 후 D-2~D-4·감정일기 §6.2 실행) |
