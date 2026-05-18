# 결제·승인·일정 알림/푸시 — 수동 UAT 리포트

**작성**: core-tester  
**일자**: 2026-05-18  
**SSOT**: [PAYMENT_SCHEDULE_NOTIFICATION_PUSH_AUDIT_ORCHESTRATION.md](./PAYMENT_SCHEDULE_NOTIFICATION_PUSH_AUDIT_ORCHESTRATION.md) §5~§7  
**환경**: 개발 API (`dev` / 스테이징), 테스트 테넌트·4역할 계정

---

## 0. P0 후 기대 (코더·테스터 SSOT) — 기대 Y 표

| # | 트리거 | CLIENT 인앱 | CLIENT 푸시 | CONSULTANT 인앱 | CONSULTANT 푸시 | ADMIN/STAFF 인박스 | 시스템(Alert/알림톡) |
|---|--------|:-----------:|:-------------:|:---------------:|:---------------:|:-------------------:|:--------------------:|
| B1 | PG `Payment` **APPROVED** | **조건부 Y** | **조건부 Y** (`payment_completed`) | N | N | **조건부** (`admin_ops` 키워드) | N |
| B2 | 어드민 **confirm-payment** | **Y** (`PAYMENT_COMPLETION`) | **조건부 Y** (`payment_completed`) | N | N | **조건부** (키워드·타입) | N |
| B3 | 어드민 **confirm-deposit** | **Y** | **조건부 Y** (`payment_completed`) + **조건부** (`session_low`, 잔여 ≤2) | N | N | **조건부** | N |
| B4 | 어드민 **approve** | **Y** | **조건부 Y** (`mapping_approved`) | **Y** | **조건부 Y** (`mapping_approved`) | **조건부** | N |
| B5 | **POST** `/api/v1/schedules/consultant` (BOOKED 등록) | **Y** (`APPOINTMENT_CONFIRMATION`) | **조건부 Y** (`booking_confirmed`) | **Y** (`NEW_APPOINTMENT`) | N | **조건부** | N |
| B5-API | 동일 API **HTTP 응답** (P0·`ScheduleCreatedNotificationHelper` REQUIRES_NEW 반영 후) | — | — | — | — | **Y** — `success=true`, `data.id`(또는 schedule id) | — |
| B6 | 관리자 **confirmSchedule** (예약 확정) | N (별도 메시지 타입 없음) | **조건부 Y** (`booking_confirmed`) | N | N | N | **조건부 Y** (내담자 알림톡/SMS) |

> **조건부**: `EXPO_ACCESS_TOKEN`·활성 토큰(`mobile_push_tokens.active=1`)·앱 카테고리(`payment`/`schedule`/`system`) on. 가예약(`tentativeBeforeDeposit=true`) 일정 등록은 B5·B5-API 알림 **N**(API 자체는 200 가능).  
> **ADMIN 모바일 MVP**: `payment_completed`·푸시 E2E **비대상** — 검증은 **CLIENT**(필수)·CONSULTANT(매핑 승인 시) APK.

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
| 4-1 | 웹 또는 Expo 어드민 `POST /api/v1/schedules/consultant` (BOOKED) | CLIENT | **Y** (B5) | **조건부 Y** — `booking_confirmed` | **N** | ☐ |
| 4-1b | 동일 | CONSULTANT | **Y** — `NEW_APPOINTMENT` | **N** | **N** | ☐ |
| 4-2 | 관리자 **예약 확정** (`confirmSchedule`) | CLIENT | N | **`booking_confirmed` 조건부 Y** (B6) | 알림톡/SMS **조건부** | ☐ |
| 4-3 | 동일 | CONSULTANT | N | N | N | ☐ |

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

**실행일**: 2026-05-18  
**실행자**: core-tester  
**코드 기준**: `f0d6b44ad` — `ScheduleCreatedNotificationHelper` REQUIRES_NEW, `ExpoPushProperties` 기동 로그  
**dev 전제(셸)**: `EXPO_ACCESS_TOKEN` JVM **OK** · `mobile_push_tokens` 활성 행 **0** (CLIENT `registerToken` 전)  
**판정 요약**: Phase C Java·Expo 자동 **PASS** / 푸시 E2E·§1~§5 수동 **미실행** → **CONDITIONAL**

### 8.1 Java (Phase C — P0 알림·푸시 단위)

| 항목 | 결과 |
|------|------|
| **판정** | **PASS** (12 tests, 0 failures) |
| **명령** | 아래 3클래스 |

```bash
cd /Users/mind/mindGarden
mvn -q -Dtest=ScheduleCreatedNotificationHelperImplTest,ExpoPushPropertiesTest,MobilePushDispatchServiceImplTest test
```

| 테스트 클래스 | Tests | Failures | 검증 요지 |
|---------------|------:|---------:|-----------|
| `ScheduleCreatedNotificationHelperImplTest` | 1 | 0 | BOOKED → 인앱 2건·`dispatchBookingConfirmed` |
| `ExpoPushPropertiesTest` | 2 | 0 | `@PostConstruct` — `Expo push access token configured: true/false` |
| `MobilePushDispatchServiceImplTest` | 9 | 0 | 토큰 미설정·카테고리 off·멱등·Expo HTTP |

> **회귀(선택)**: Phase B2 전체 8클래스는 §7 명령·2026-05-18 **26 tests PASS** 기록 유지.

### 8.2 Expo (`test:utils`)

| 항목 | 결과 |
|------|------|
| **판정** | **PASS** |
| **명령** | `cd expo-app && npm run test:utils` |
| **결과** | 21 suites, **111 tests**, 0 failed (~12s) |
| **관련 스위트** | `notificationServiceRequestPermission.test.ts`, `navigateAfterAuth.test.ts` (`registerToken`), `adminScheduleCreateBody.test.ts` 등 |

### 8.3 수동 UAT

| 항목 | 결과 |
|------|------|
| **판정** | **미실행** (CLIENT 실기기·토큰 DB 0건·QA 미연결) |
| **§1~§5** | **§8.4** 8단계 또는 **§8.5** 푸시 E2E 5줄 |
| **결제 푸시** | ADMIN 앱으로 `payment_completed` 검증 **하지 않음** (비대상) |

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

### 8.6 게이트 최종 판정 (Phase C)

| 레이어 | 판정 |
|--------|------|
| Java Phase C (3클래스) | **PASS** |
| Expo utils | **PASS** |
| 푸시 E2E dev (§8.5) | **PENDING** — 토큰 0건·실기기 미검 |
| §1~§5 전체 수동 | **PENDING** |
| **종합** | **CONDITIONAL** — 자동·단위 통과; §8.4 또는 §8.5 완료 전 운영 반영 비권장 |

---

## 9. 코더 P0 후 재검증 체크리스트

- [x] `AdminServiceImplMappingSettlementNotificationBaselineTest` — `MappingSettlementNotificationHelper` **verify**
- [x] `ScheduleServiceImplCreateConsultantScheduleNotificationBaselineTest` — 인앱·`dispatchBookingConfirmed` **verify**
- [x] 본 문서 §0 P0 후 기대 Y 표·§2~§4 expected 갱신
- [ ] §2~§4 수동 UAT (dev·§1 사전 조건 후 실행)
- [ ] §8.5 푸시 E2E (CLIENT·`mobile_push_tokens`·웹 일정 등록·로그)
- [ ] (선택) `PaymentServiceImpl` APPROVED — `sendMessage` 수신자 P0-5 debugger 확정 반영 테스트 추가
