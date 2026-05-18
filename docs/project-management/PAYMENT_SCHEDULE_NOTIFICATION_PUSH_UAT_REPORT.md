# 결제·승인·일정 알림/푸시 — 수동 UAT 리포트

**작성**: core-tester  
**일자**: 2026-05-18  
**SSOT**: [PAYMENT_SCHEDULE_NOTIFICATION_PUSH_AUDIT_ORCHESTRATION.md](./PAYMENT_SCHEDULE_NOTIFICATION_PUSH_AUDIT_ORCHESTRATION.md) §5~§7  
**환경**: 개발 API (`dev` / 스테이징), 테스트 테넌트·4역할 계정

---

## 0. 수정 전 baseline (코더 P0 전) — 기대 N 표

| # | 트리거 | CLIENT 인앱 | CLIENT 푸시 | CONSULTANT | ADMIN/STAFF 인박스 | 시스템(Alert/알림톡) |
|---|--------|:-----------:|:-------------:|:----------:|:-------------------:|:--------------------:|
| B1 | PG `Payment` **APPROVED** | **조건부 Y** | **조건부 Y** (`payment_completed`) | N | **조건부** (`admin_ops` 키워드) | N |
| B2 | 어드민 **confirm-payment** | **N** | **N** | N | N | N |
| B3 | 어드민 **confirm-deposit** | **N** | **조건부** (`session_low`만, 잔여 회기 ≤2) | N | N | N |
| B4 | 어드민 **approve** | **N** | **N** | N | N | N |
| B5 | **POST** `/api/v1/schedules/consultant` (일정 등록) | **N** | **N** | N | N | N |
| B6 | 관리자 **confirmSchedule** (예약 확정) | N (별도 메시지 타입 없음) | **조건부 Y** (`booking_confirmed`) | N | N | **조건부 Y** (내담자 알림톡/SMS) |

> **코더 P0 완료 후**: B2·B3·B4·B5 행은 기획 승인 스펙에 맞게 **Y**로 바뀌어야 하며, 자동 테스트 baseline(`never()` → `verify`) 및 본 표 §0를 함께 갱신한다.

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
| 2-3 | `POST .../mappings/{id}/confirm-payment` | CLIENT | **없음** (baseline B2) | **없음** | 메시지·푸시 로그 없음 | ☐ |
| 2-4 | `POST .../mappings/{id}/confirm-deposit` (잔여 회기 ≤2) | CLIENT | **없음** | **`session_low`만** (baseline B3) | 푸시 type / 로그 | ☐ |
| 2-5 | 동일 (잔여 회기 >2) | CLIENT | **없음** | **없음** | | ☐ |

---

## 3. 승인 (§7.3)

| 단계 | 조작 | 역할 | 인앱 | 푸시 | 시스템 | Pass |
|------|------|------|:----:|:----:|:------:|:----:|
| 3-1 | `POST .../mappings/{id}/approve` | 전 역할 | **N** | **N** | **N** | ☐ |
| 3-2 | confirm-deposit 후 가예약→BOOKED | CLIENT | **N** (승인 안내 없음) | 입금 안내 푸시 **N** | **N** | ☐ |

---

## 4. 일정 등록·확정 (§7.4)

| 단계 | 조작 | 역할 | 인앱 | 푸시 | 시스템 | Pass |
|------|------|------|:----:|:----:|:------:|:----:|
| 4-1 | 웹 또는 Expo 어드민 `POST /api/v1/schedules/consultant` | CLIENT·CONSULTANT | **N** (B5) | **N** | **N** | ☐ |
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
| **DB** | `consultation_messages` (message_type, sender/receiver); `mobile_push_token` 활성 여부 |
| **시스템** | `NotificationService` 알림톡/SMS 로그; `alert` 테이블 (해당 시) |

---

## 7. 자동 테스트 게이트 (core-tester)

| 테스트 클래스 | baseline (수정 전) | P0 코더 후 |
|---------------|-------------------|------------|
| `AdminServiceImplMappingSettlementNotificationBaselineTest` | confirm-payment/deposit/approve → 알림 **never** | `verify` 발화로 전환 |
| `ScheduleServiceImplCreateConsultantScheduleNotificationBaselineTest` | createConsultantSchedule → 알림 **never** | dispatch·sendMessage **verify** |
| `ScheduleServiceImplConfirmScheduleAlimTalkTest` | confirmSchedule → 알림톡 + **booking_confirmed** | 유지 |
| `MobilePushDispatchServiceImplTest` | 카테고리 off, 멱등, token 미설정, DeviceNotRegistered | 확장(매핑 승인 type 등) |

**실행 명령**

```bash
mvn -Dtest=MobilePushDispatchServiceImplTest,MobileAppVersionServiceImplTest,AdminServiceImplMappingSettlementNotificationBaselineTest,ScheduleServiceImplCreateConsultantScheduleNotificationBaselineTest,ScheduleServiceImplConfirmScheduleAlimTalkTest test
cd expo-app && npm run test:utils
```

---

## 8. 실행 결과 (테스터 기록)

| 구분 | 결과 | 비고 |
|------|------|------|
| Java 단위 (위 mvn) | **BLOCKED** (2026-05-18) | `MobilePushDispatchServiceImpl`이 `dispatchMappingSettlement` 미구현 — **core-coder P0 병렬 컴파일 갭**. 테스트 소스는 컴파일 가능하나 main compile 선행 필요 |
| Expo `test:utils` | **PASS** | 21 suites, 111 tests |
| 수동 UAT §2~§5 | **미실행** | QA/dev 계정·§1 사전 조건 후 §2 단계 2-1부터 |

---

## 9. 코더 P0 후 재검증 체크리스트

- [ ] `AdminServiceImplMappingSettlementNotificationBaselineTest` assertion을 **발화 기대**로 수정·green
- [ ] `ScheduleServiceImplCreateConsultantScheduleNotificationBaselineTest` 동일
- [ ] 본 문서 §0 baseline 표 갱신
- [ ] §2~§4 수동 UAT 전 단계 재실행
- [ ] (선택) `PaymentServiceImpl` APPROVED — `sendMessage` 수신자 P0-5 debugger 확정 반영 테스트 추가
