# 결제·승인·일정 알림 — UAT ↔ API·시드·common_code 정합표

**작성**: core-planner (V3+ Seq 28h — Notification API/doc·시드 정합)  
**일자**: 2026-07-06  
**범위**: 코드 변경 없음 · **docs만**  
**UAT SSOT**: [PAYMENT_SCHEDULE_NOTIFICATION_PUSH_UAT_REPORT.md](./PAYMENT_SCHEDULE_NOTIFICATION_PUSH_UAT_REPORT.md) §0·§2~§4·§10  
**감사 SSOT**: [PAYMENT_SCHEDULE_NOTIFICATION_PUSH_AUDIT_ORCHESTRATION.md](./PAYMENT_SCHEDULE_NOTIFICATION_PUSH_AUDIT_ORCHESTRATION.md)  
**코드 기준 HEAD**: develop `7de415923` (문서 작성 시점; UAT 본문의 `c5b181d28`·`3f3e97e28` Solapi 배치와 **동일 트리거·계약** 유지)

---

## 1. 목적·사용법

| 항목 | 설명 |
|------|------|
| **목적** | UAT 리포트 §0(B1~B6)·§10(Solapi Phase D) 기대와 **REST API·Flyway 시드·common_codes** 실제를 한 표에서 대조 |
| **독자** | human/QA(UAT 실행)·core-tester(회귀)·core-coder(드리프트 수정 전 SSOT) |
| **정합 기호** | **✅** 일치 · **⚠️** UAT↔코드/시드 드리프트(기능은 동작하나 명칭·시드·문서 불일치) · **✅†** 허용 드리프트(문서·QA SSOT로 확정) · **—** 해당 없음 · **조건부** 토큰·카테고리·ENV |

> UAT §0 「시스템(Alert/알림톡)」 열은 **2026-05-18 P0 푸시 배치** 기준. **§10 Phase D** 이후 PG·매칭 정산 경로는 `sendPaymentCompleted` 연결됨 — §3·§4 참고.

---

## 2. 트리거 × API × 채널 × 식별자 (마스터 정합표)

| UAT ID | 트리거 | HTTP API (표준) | 서비스·헬퍼 | CLIENT 인앱 `message_type` | CLIENT 푸시 `type` | CONSULTANT 인앱 | CONSULTANT 푸시 | 시스템(알림톡/SMS) | UAT §0 | 코드·시드 |
|--------|--------|-----------------|-------------|----------------------------|--------------------|-----------------|-----------------|-------------------|--------|-----------|
| **B1** | PG `Payment` **APPROVED** | `PUT /api/v1/payments/{paymentId}/status?status=APPROVED` | `PaymentServiceImpl.updatePaymentStatus` → `sendMessage` + `dispatchPaymentCompleted` + `trySendPaymentCompletedExternalNotification` | `PAYMENT_COMPLETION` (또는 본문 「결제」) | `payment_completed` | — | — | **조건부 Y** — `NotificationService.sendPaymentCompleted` · `NotificationType.PAYMENT_COMPLETED` | §0: 시스템 **N** (P0 스냅샷) · §10: **Y** | **✅†** §0 vs §10 **허용 드리프트** — §0=P0·Phase C 기대, §10 Phase D·코드가 시스템 SSOT ([§6](#6-uat-10-solapi-phase-d--정합-요약)·UAT §0 각주) |
| **B2** | 어드민 **confirm-payment** | `POST /api/v1/admin/mappings/{mappingId}/confirm-payment` | `AdminServiceImpl.confirmPayment` → `MappingSettlementNotificationHelper` (`PAYMENT_CONFIRMED`) | `PAYMENT_COMPLETION` | `payment_completed` | — | — | **조건부 Y** — `sendPaymentCompleted` | §0·§10 **Y** | **✅** |
| **B3** | 어드민 **confirm-deposit** | `POST /api/v1/admin/mappings/{mappingId}/confirm-deposit` | `AdminServiceImpl.confirmDeposit` → helper (`DEPOSIT_CONFIRMED`) + `finalizeTentativeSchedulesAfterDepositConfirmed` | `PAYMENT_COMPLETION` (정산 인앱) | `payment_completed` + **조건부** `session_low` | — | — | **조건부 Y** — `sendPaymentCompleted` | §0 **Y** | **✅** · `session_low`는 **회기 차감**(`useSessionForSpecificMapping`, 잔여≤2) 시만 — 입금만으로는 **없을 수 있음** (UAT §A.2 2-4 주석과 일치) |
| **B4** | 어드민 **approve** | `POST /api/v1/admin/mappings/{mappingId}/approve` | `AdminServiceImpl.approveMapping` → helper (`MAPPING_APPROVED`) | **Y** (매칭 승인 본문) | `mapping_approved` | **Y** | `mapping_approved` | **N** — helper가 `sendPaymentCompleted` **미호출** (단위 검증) | §0 **Y** / 시스템 **N** | **✅** |
| **B5** | **POST** 일정 등록 (BOOKED) | `POST /api/v1/schedules/consultant` | `ScheduleServiceImpl.createConsultantSchedule` → `ScheduleCreatedNotificationHelper.notifyScheduleCreated` | UAT 라벨: `APPOINTMENT_CONFIRMATION` → DB **`APPOINTMENT`** | `booking_confirmed` | `NEW_APPOINTMENT` | **N** | **N** | §0 **Y** | **✅†** common_code 시드 `APPOINTMENT_CONFIRMATION` vs 런타임 `message_type` **`APPOINTMENT`** — [§4](#4-인앱-메시지--message_type-common_code)·UAT §0 각주¹ |
| **B5-API** | 동일 API HTTP 응답 | 동일 | REQUIRES_NEW 헬퍼 — API 200·`data.id` | — | — | — | — | — | **Y** | **✅** |
| **B6** | 관리자 **confirmSchedule** | `PUT /api/v1/schedules/{id}/confirm?userRole=ADMIN\|STAFF` | `ScheduleServiceImpl.confirmSchedule` → `sendConsultationConfirmed` + `dispatchBookingConfirmed` | **N** (별도 타입 없음) | `booking_confirmed` | — | — | **조건부 Y** — `NotificationType.CONSULTATION_CONFIRMED` | §0·§4 **Y** | **✅** UAT §4 4-2·§8.4 6b에 API path 반영 (2026-07-07) |

**가예약 분기**: `tentativeBeforeDeposit=true` → B5·B5-API 알림 **N** (API 200 가능). UAT §0 각주와 `ScheduleServiceImplNotifyScheduleCreatedTest` **일치**.

**ADMIN/STAFF 인박스**: `GET /api/v1/consultation-messages/all?view=admin_ops` — `PAYMENT_COMPLETION`·`APPOINTMENT`·`APPOINTMENT_CONFIRMATION`·`NEW_APPOINTMENT` + 키워드(결제·입금·매칭). SSOT: `ADMIN_MESSAGE_INBOX_FILTER_ORCHESTRATION.md`.

---

## 3. 시스템 알림(알림톡/SMS) — NotificationService 계층

`NotificationService.NotificationType` (Java enum, **SMS_TEMPLATE 키 = `type.name()`**) ↔ common_code ↔ UAT §10.

| NotificationType | UAT 시나리오 | 호출 경로 | ALIMTALK template resolve | SMS_TEMPLATE 시드 | CONSULTATION_CONFIRMED 등 |
|------------------|--------------|-----------|---------------------------|---------------------|---------------------------|
| `PAYMENT_COMPLETED` | B1·B2·B3 · §10 D-2~D-4 | `PaymentServiceImpl` · `MappingSettlementNotificationHelperImpl.sendPaymentCompletedToClient` | ① `tenant_kakao_alimtalk_settings.template_payment_completed` ② `ALIMTALK_BIZ_TEMPLATE_CODE.PAYMENT_COMPLETED` (`code_label`) ③ fallback `PAYMENT_COMPLETED` | **✅** `V20260529_004` · `code_value=PAYMENT_COMPLETED` · variables: `paymentAmount`,`packageName`,`consultantName` | — |
| `CONSULTATION_CONFIRMED` | B6 | `ScheduleServiceImpl.confirmSchedule` → `sendConsultationConfirmed` | 동일 resolver · `type.name()` = `CONSULTATION_CONFIRMED` | **✅** `V20260529_004` · `CONSULTATION_CONFIRMED` | UAT B6 **일치** |
| `CONSULTATION_REMINDER` | — (본 UAT 범위 외) | 스케줄러·배치 | `ALIMTALK_BIZ_TEMPLATE_CODE` / SMS | **✅** 시드 있음 | — |
| `SCHEDULE_CHANGED` | — | 일정 변경 | resolver | **✅** | — |
| `CONSULTATION_CANCELLED` | — | 취소 | resolver | **✅** | — |
| `REFUND_COMPLETED` | — | 환불 | resolver | **✅** | — |
| `DEPOSIT_PENDING_REMINDER` | — | 입금 대기 | resolver | **✅** | ADMIN 대상 |

### 3.1 ALIMTALK_BIZ_TEMPLATE_CODE 시드 (Flyway)

| code_value | V20260528_001 | UAT 결제·일정 트리거 | 비고 |
|------------|:-------------:|----------------------|------|
| `PAYMENT_COMPLETED` | **❌ 미시드** (의도적) | B1~B3 · §10 | resolver ③단계 fallback **`PAYMENT_COMPLETED` 문자열** → Solapi 콘솔 templateId와 **수동 정합** 필요 (§10 D-1). **Flyway 추가는 후속** — 운영 SSOT는 tenant 설정 + fallback |
| `CONSULTATION_CONFIRMED` | **❌ 미시드** (의도적) | B6 | fallback `CONSULTATION_CONFIRMED` — 동일 resolver ③단계 |
| `RESERVATION_IMMEDIATE_*` 등 8종 | **✅** | B5 직후 즉시 SMS/배치 (별 트랙) | `ScheduleServiceImpl.notifyScheduleCreated` — **BOOKED 등록 인앱·푸시와 별도** |

**레거시 그룹 `ALIMTALK_TEMPLATE`**: `KakaoAlimTalkServiceImpl` 기동 시 자동 생성·`deployment/complete-common-codes-migration.sql`에 `PAYMENT_COMPLETE`(오타형) 존재. **운영 SSOT는 `ALIMTALK_BIZ_TEMPLATE_CODE` + `tenant_kakao_alimtalk_settings`** (`NotificationServiceImpl.resolveAlimTalkBizTemplateCode`).

### 3.2 SMS 발송 게이트 (시드 메타)

| 항목 | SSOT |
|------|------|
| 본문 | `common_codes` · `code_group='SMS_TEMPLATE'` · `code_label` (변수 `{{var}}`) |
| 글로벌 활성 | `V20260607_007` (is_active 복구) |
| 자동 발송 토글 | `extra_data.dispatch_enabled` · `V20260603_002` · `SmsTemplateService.isAutoDispatchEnabledFor` |
| UAT human | §10 D-0: `SMS_TEST_MODE=false` · PFID 바인딩 |

---

## 4. 인앱 메시지 — MESSAGE_TYPE common_code

| UAT 표기 | common_code `code_value` (workflow 시드) | 코드 runtime `message_type` | ConsultationMessageTypeCodes | admin_ops 노출 |
|----------|------------------------------------------|----------------------------|--------------------------------|----------------|
| `PAYMENT_COMPLETION` | **✅** `PAYMENT_COMPLETION` | `PAYMENT_COMPLETION` | `CANONICAL_PAYMENT_COMPLETION` | **Y** |
| `APPOINTMENT_CONFIRMATION` | **✅** `APPOINTMENT_CONFIRMATION` | **`APPOINTMENT`** (키 `APPOINTMENT` 조회) | `CANONICAL_APPOINTMENT = "APPOINTMENT"` | **Y** (allow에 `APPOINTMENT`·`APPOINTMENT_CONFIRMATION` 둘 다) |
| `NEW_APPOINTMENT` | **✅** `NEW_APPOINTMENT` | `NEW_APPOINTMENT` | `CANONICAL_NEW_APPOINTMENT` | **Y** |

**시드 출처**: `database/migrations/workflow_common_codes.sql` · Flyway `V20251203_001` 계열.  
**드리프트**: UAT B5 CLIENT 열 **`APPOINTMENT_CONFIRMATION`** → 실 DB **`APPOINTMENT`**. QA 증빙 시 `consultation_messages.message_type` 컬럼 기준 **`APPOINTMENT`** 로 기록.

---

## 5. 모바일 푸시 — API·type·Expo 계약

### 5.1 REST API (Expo `PUSH_API`)

| Method | Path | UAT 참조 | 용도 |
|--------|------|----------|------|
| `POST` | `/api/v1/mobile/push-token/register` | §1 P-2 · §8.5 E1 | 토큰 등록 · `mobile_push_tokens` |
| `POST` | `/api/v1/mobile/push-token/unregister` | — | 토큰 해제 |
| `GET` | `/api/v1/mobile/push-settings` | §1 P-4 | 카테고리 on/off 조회 |
| `PUT` | `/api/v1/mobile/push-settings` | §1 P-4 | 카테고리 patch (`schedule`·`payment`·`message`·`wellness`·`system`) |

**선행 ENV**: `EXPO_ACCESS_TOKEN` · UAT §8.3 L1 · [MOBILE_PUSH_EXPO_DEPLOYMENT_CHECKLIST.md](./MOBILE_PUSH_EXPO_DEPLOYMENT_CHECKLIST.md) §2.1.

### 5.2 UAT 푸시 type ↔ 서버 ↔ Expo

| UAT / §0 | `MobilePushCanonicalTypes` | `pushScenarios.ts` | settingsCategory (앱) | `MobilePushNotificationCategory` (서버) | 발화 메서드 |
|----------|---------------------------|--------------------|-----------------------|----------------------------------------|-------------|
| `payment_completed` | `payment_completed` | `PAYMENT_COMPLETED` | `payment` | `PAYMENT` | `dispatchPaymentCompleted` · `dispatchMappingSettlement` |
| `session_low` | `session_low` | `SESSION_LOW` | `payment` | `PAYMENT` | `dispatchSessionLow` |
| `mapping_approved` | `mapping_approved` | `MAPPING_APPROVED` | `system` | `SYSTEM` | `dispatchMappingSettlement` |
| `booking_confirmed` | `booking_confirmed` | `BOOKING_CONFIRMED` | `schedule` | `SCHEDULE` (default) | `dispatchBookingConfirmed` |

**쇼핑 PG**: `PaymentServiceImpl` — shop order payment 시 generic `payment_completed` **스킵** (UAT §A.1·`ShopNotificationHelper` 분리). 본 UAT B1은 **매칭·일반 PG** 전제.

---

## 6. UAT §10 Solapi Phase D — 정합 요약

| UAT §10 행 | API·트리거 | `sendPaymentCompleted` | SMS_TEMPLATE | ALIMTALK | 단위 테스트 |
|------------|------------|------------------------|--------------|----------|-------------|
| D-2 confirm-payment | B2 API | **verify** | `PAYMENT_COMPLETED` | templateId §10 D-1 | `MappingSettlementNotificationHelperImplTest` |
| D-3 PG APPROVED | B1 API | **verify** | 동일 | 동일 | `PaymentServiceImpl` 경로 · §10.1 32 tests |
| D-4 SMS 폴백 | 알림톡 실패 | — | `SmsAuthService` → Solapi | — | `NotificationServiceImplSmsFallbackTest` |
| approve (B4) | B4 API | **미호출** | — | — | helper test **verify 0** |

§0 표 「시스템 **N**」은 Phase D **이전** 스냅샷. **§10·본 정합표 §2 B1~B3**를 Solapi UAT SSOT로 사용.

---

## 7. 드리프트·후속 (코드 변경 없음 — 문서·QA만)

| # | 구분 | 내용 | 상태 (2026-07-07) |
|---|------|------|-------------------|
| D-1 | UAT 내부 | §0 B1 시스템 **N** vs §10 **Y** | **✅ 닫힘** — UAT §0 각주 + 본 표 B1 **✅†**; §10·코드 SSOT |
| D-2 | UAT ↔ 코드 | B5 CLIENT `APPOINTMENT_CONFIRMATION` vs DB **`APPOINTMENT`** | **✅ 닫힘** — UAT §0·§4 + 본 표 §4; QA는 DB 컬럼 기준 |
| D-3 | 시드 | `ALIMTALK_BIZ_TEMPLATE_CODE.PAYMENT_COMPLETED` Flyway **미시드** | **✅ 문서화** — §3.1 「의도적 미시드」; human §10 D-1·후속 Flyway 선택 |
| D-4 | UAT ↔ API | B6 **`PUT .../schedules/{id}/confirm`** | **✅ 닫힘** — UAT §0 B6·§4 4-2·§8.4 6b 반영 |
| D-5 | 감사 문서 | [AUDIT §2~§3](./PAYMENT_SCHEDULE_NOTIFICATION_PUSH_AUDIT_ORCHESTRATION.md) 「없음」 vs P0 후 코드·UAT §0 | **✅ 닫힘** — §2·§3 **사전 P0 스냅샷** 배너·현행 SSOT 교차 참조(2026-07-07); `session_low`는 입금 직후가 아니라 **회기 차감·잔여≤2** 시만 (**의도적** · 본 표 §2 B3·UAT §A.2 2-4) |
| D-6 | 레거시 | `ALIMTALK_TEMPLATE.PAYMENT_COMPLETE` vs `PAYMENT_COMPLETED` | **✅ 문서화** — §3.1 레거시 주석; 신규 작업 **`ALIMTALK_BIZ_TEMPLATE_CODE`** 만 |

---

## 8. 관련 문서·시드 인덱스

| 자료 | 경로 |
|------|------|
| UAT 리포트 | [PAYMENT_SCHEDULE_NOTIFICATION_PUSH_UAT_REPORT.md](./PAYMENT_SCHEDULE_NOTIFICATION_PUSH_UAT_REPORT.md) |
| 감사·§7.6 | [PAYMENT_SCHEDULE_NOTIFICATION_PUSH_AUDIT_ORCHESTRATION.md](./PAYMENT_SCHEDULE_NOTIFICATION_PUSH_AUDIT_ORCHESTRATION.md) |
| MESSAGE_TYPE 시드 | [workflow_common_codes.sql](../database/migrations/workflow_common_codes.sql) |
| SMS_TEMPLATE 시드 | [V20260529_004__seed_sms_templates.sql](../src/main/resources/db/migration/V20260529_004__seed_sms_templates.sql) |
| ALIMTALK 8종 스켈레톤 | [V20260528_001__seed_alimtalk_biz_template_code_8types.sql](../src/main/resources/db/migration/V20260528_001__seed_alimtalk_biz_template_code_8types.sql) |
| 테넌트 알림톡 컬럼 | [V20260424_003__tenant_kakao_alimtalk_settings.sql](../src/main/resources/db/migration/V20260424_003__tenant_kakao_alimtalk_settings.sql) |
| 푸시 canonical type | [MobilePushCanonicalTypes.java](../src/main/java/com/coresolution/consultation/constant/MobilePushCanonicalTypes.java) |
| Expo push 계약 | [pushScenarios.ts](../expo-app/src/constants/pushScenarios.ts) |
| Solapi ENV 디버그 | [SOLAPI_NOTIFICATION_MISS_DEBUG.md](./2026-05-22/SOLAPI_NOTIFICATION_MISS_DEBUG.md) |
| Admin 구현 V3+ | [ADMIN_IMPLEMENTATION_PROGRESS_CHECKLIST.md](./2026-06-30/ADMIN_IMPLEMENTATION_PROGRESS_CHECKLIST.md) Seq 28+ |

---

## 9. 변경 이력

| 일자 | 변경 |
|------|------|
| 2026-07-07 | Seq **28h** D-5 — AUDIT §2~§3 사전 P0 스냅샷·SSOT cross-ref; §7 D-5 닫힘 (`session_low` 의도적) |
| 2026-07-07 | Seq **28h** 잔여 정합 — B1/B5 **✅†** 허용 드리프트·B6 API path·§3.1 ALIMTALK 미시드 명시·§7 D-1~D-4·D-6 닫힘 |
| 2026-07-06 | 초판 — V3+ Seq 28h Notification API/doc·시드 정합표 (코드 변경 없음) |
