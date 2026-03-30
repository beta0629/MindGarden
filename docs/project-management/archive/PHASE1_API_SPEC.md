# MindGarden Phase 1 (Academy) API Specification

> 본 문서는 Phase 1 학원용 MVP에 필요한 주요 REST API 엔드포인트 초안을
> 정의합니다. 최종 스키마는 개발/QA 과정에서 업데이트될 수 있습니다.

- **Base URL (Staging):** `https://stg-api.mindgarden.com`
- **Authentication:** Bearer Token (`Authorization: Bearer <accessToken>`)
- **Tenant Context:** `X-Tenant-Key` 헤더 사용 (공개 API 제외)
- **Trace Header:** `X-Request-Id` (요청/응답 모두 포함)

## 1. 인증 및 세션

### 1.1 로그인

- **Endpoint:** `POST /api/auth/login`
- **Description:** Staff/Admin/Consumer 로그인 처리
- **Headers:**
  - `Content-Type: application/json`
- **Request Body:**

  ```json
  {
    "username": "string",   // 필수, 이메일 또는 사번
    "password": "string",   // 필수
    "tenantKey": "string"   // 선택, 소비자 로그인 시 생략 가능
  }
  ```

- **Response 200:**

  ```json
  {
    "accessToken": "string",
    "refreshToken": "string",
    "expiresIn": 3600,
    "user": {
      "id": "uuid",
      "role": "ADMIN|STAFF|CONSUMER",
      "tenantId": "uuid",
      "branchId": "uuid",
      "displayName": "홍길동"
    }
  }
  ```

- **Errors:**

  | Code | Message | Notes |
  | --- | --- | --- |
  | 400 | `tenantKey required for staff login` | 테넌트 키 미전달 |
  | 401 | `invalid_credentials` | ID/PW 불일치 |
  | 423 | `account_locked` | 5회 이상 실패 |

### 1.2 세션 조회

- **Endpoint:** `GET /api/auth/session`
- **Description:** 현재 로그인 사용자/테넌트 정보 확인
- **Headers:** `Authorization`
- **Response 200:**

  ```json
  {
    "authenticated": true,
    "user": {
      "id": "uuid",
      "name": "string",
      "role": "ADMIN",
      "tenantId": "uuid",
      "branchId": "uuid"
    },
    "permissions": ["reservation:view", "payment:approve"],
    "expiresAt": "2025-11-20T12:00:00Z"
  }
  ```

## 2. 소비자 포털 API

### 공통 쿼리 파라미터

- `page` (기본 1), `size` (기본 10, 최대 50)
- 응답 페이징 형식:

  ```json
  {
    "items": [...],
    "page": 1,
    "size": 10,
    "total": 124,
    "hasNext": true
  }
  ```

### 2.1 학원 목록 조회

- **Endpoint:** `GET /api/public/academies`
- **Query Params:** `category`, `keyword`, `location`, `page`, `size`
- **Response 200:**

  ```json
  {
    "items": [
      {
        "tenantId": "uuid",
        "name": "마인드가든 스터디센터",
        "categories": ["수학", "과학"],
        "rating": 4.8,
        "thumbnail": "https://...",
        "address": "서울시 ...",
        "summary": "설명",
        "tags": ["중등", "소수정예"],
        "distanceKm": 2.4
      }
    ],
    "page": 1,
    "size": 10,
    "total": 124,
    "hasNext": true
  }
  ```

### 2.2 학원 상세 조회

- **Endpoint:** `GET /api/public/academies/{tenantId}`
- **Response 200:** 학원 정보 + 커리큘럼 + 강사 소개 + 시간표(주간/Schedule) + 리뷰 + FAQ
- **Response 404:** `academy_not_found`

### 2.3 상담 예약 생성

- **Endpoint:** `POST /api/public/academies/{tenantId}/reservations`
- **Headers:** `Content-Type: application/json`
- **Request Body:**

  ```json
  {
    "consumer": {
      "name": "홍길동",
      "phone": "010-0000-0000",
      "email": "gildong@example.com"
    },
    "preferredDate": "2025-11-20",
    "preferredTime": "15:00",
    "memo": "중등 수학 상담",
    "marketingConsent": true
  }
  ```

- **Response 201:**

  ```json
  {
    "reservationId": "uuid",
    "status": "PENDING",
    "message": "상담 신청이 접수되었습니다.",
    "nextSteps": ["관리자가 연락을 드립니다."]
  }
  ```

- **Errors:**

  | Code | Message | Notes |
  | --- | --- | --- |
  | 400 | `invalid_phone_format` | 유효성 오류 |
  | 422 | `duplicate_reservation` | 동일 시간 중복 예약 |

### 2.4 결제 요청

- **Endpoint:** `POST /api/payments`
- **Headers:** `Authorization`, `Content-Type`
- **Request Body:**

  ```json
  {
    "tenantId": "uuid",
    "consumerId": "uuid",
    "enrollmentCommand": {
      "classId": "uuid",
      "scheduleId": "uuid",
      "startDate": "2025-12-01"
    },
    "price": 330000,
    "currency": "KRW",
    "paymentMethod": "CARD",
    "installments": 0,
    "metadata": {
      "couponId": "uuid"
    }
  }
  ```

- **Response 200:** 승인 정보 + `orderId` + `receiptUrl`
- **Errors:**

  | Code | Message | Notes |
  | --- | --- | --- |
  | 402 | `payment_declined` | PG 승인 실패 |
  | 409 | `price_mismatch` | 서버 계산 금액과 불일치 |
  | 422 | `enrollment_closed` | 마감된 강좌 |

### 2.5 마이 페이지

- `GET /api/consumer/orders`: 최근 결제/수강 내역, 상태 배지
  (ONGOING/COMPLETED/CANCELLED)
- `GET /api/consumer/orders/{orderId}/receipt`: PDF URL 반환
  (`Content-Disposition` 지원)
- `PUT /api/consumer/me`: 연락처/주소 업데이트 (입력 검증 포함)

## 3. 관리자 포털 API

### 3.1 예약 관리

- `GET /api/admin/reservations`: 필터(`status`, `dateRange`, `staffId`)
- `PUT /api/admin/reservations/{id}`: 승인/거절/일정 변경

  ```json
  {
    "status": "APPROVED",
    "assignedStaffId": "uuid",
    "scheduledAt": "2025-11-21T15:00:00+09:00",
    "note": "전화 상담 완료"
  }
  ```

- 상태 전이: `PENDING → APPROVED → COMPLETED` 또는 `PENDING → REJECTED`

### 3.2 반/강좌 및 수강 등록 관리

- **반 목록 조회:** `GET /api/admin/classes?courseId=&status=ACTIVE`
- **반 생성:** `POST /api/admin/classes`

  ```json
  {
    "name": "중등 심화반 A",
    "courseId": "uuid",
    "teacherId": "uuid",
    "schedule": [
      {"dayOfWeek": "TUE", "startTime": "18:00", "endTime": "20:00", "room": "301"},
      {"dayOfWeek": "FRI", "startTime": "18:00", "endTime": "20:00", "room": "301"}
    ],
    "capacity": 12,
    "options": {
      "seatMap": "3x4",
      "color": "#37B26C"
    }
  }
  ```

- **반 수정:** `PUT /api/admin/classes/{id}`
- **학생 배정:** `POST /api/admin/classes/{classId}/enrollments`
- **수강 등록 관리:**  
  - `POST /api/admin/enrollments` (반 배정 포함)  
  - `PUT /api/admin/enrollments/{id}` (ACTIVE ↔ PAUSED ↔ COMPLETED, CANCELLED)  
  - `GET /api/admin/enrollments/{id}/history` (배정/청구/출결 히스토리)

- **에러 코드 예시:** `409 class_full`, `409 already_assigned`, `422 invalid_schedule`

### 3.3 출결/시간표

- `GET /api/admin/schedule?from=2025-12-01&to=2025-12-07`: 시간표/강의 캘린더
- `POST /api/admin/attendance`

  ```json
  {
    "classId": "uuid",
    "scheduleId": "uuid",
    "records": [
      {"memberId": "uuid", "status": "PRESENT", "timestamp": "2025-12-01T18:03:00+09:00"},
      {"memberId": "uuid", "status": "ABSENT", "reason": "사전 통보"}
    ],
    "notifyParents": true
  }
  ```

- `PUT /api/admin/attendance/{attendanceId}`: 상태/메모 수정, 감사 로그 기록
- `GET /api/admin/attendance/export?classId=&month=`: 월별 출결 보고서
- **상태:** `PRESENT | ABSENT | LATE | EXCUSED`

### 3.4 회원 CRM

- `GET /api/admin/members?stage=lead|student`
- `GET /api/admin/members/{id}`: 기본 정보 + 상담 이력 + 결제 히스토리
- `POST /api/admin/members/{id}/notes`: 메모 생성 (`visibility`: PRIVATE/TEAM)

### 3.5 청구/결제

- **청구 스케줄 관리:**  
  - `POST /api/admin/billing/schedules`

    ```json
    {
      "name": "월초 청구",
      "startDate": "2026-01-01",
      "cycle": "MONTHLY",           // 또는 WEEKLY
      "dayOfMonth": 1,
      "graceDays": 3,
      "target": {
        "classIds": ["uuid1", "uuid2"],
        "memberTags": ["장기수강", "형제할인"]
      }
    }
    ```

  - `GET /api/admin/billing/schedules`
  - `DELETE /api/admin/billing/schedules/{id}`
- **청구서/Invoice:**  
  - `GET /api/admin/invoices?status=INVOICED|PAID|OVERDUE`
  - `POST /api/admin/invoices/{invoiceId}/remind` (미납 리마인드)
  - `POST /api/admin/invoices/{invoiceId}/cancel`
- **에러 코드:** `409 invoice_already_paid`, `422 billing_cycle_invalid`

### 3.6 결제/정산

- `GET /api/admin/payments?from=2025-11-01&to=2025-11-30`
  - 응답 항목: 결제일시, 금액, 수단, 상태, PG 승인번호
- `GET /api/admin/settlements/{batchId}/report`: CSV/PDF 다운로드 (`Content-Type`)
- `POST /api/admin/settlements/{batchId}/retry`: 부분 실패 건 재처리

### 3.7 알림/마케팅

- 템플릿 목록: `GET /api/admin/notifications/templates?type=SMS`
- 발송:

  ```json
  POST /api/admin/notifications
  {
    "type": "SMS",
    "templateId": "uuid",
    "targets": ["consumerId1", "consumerId2"],
    "scheduleAt": "2025-11-21T09:00:00+09:00",
    "variables": {
      "name": "홍길동",
      "class": "주중 반"
    }
  }
  ```

- 발송 상태 조회: `GET /api/admin/notifications/{id}`

## 4. HQ(본사) 전용 API

- `GET /api/hq/dashboard?period=monthly` → 테넌트별 KPI 요약
- `PUT /api/hq/tenants/{tenantId}` → 상태 변환(ACTIVE/PAUSED/SUSPENDED)
- `POST /api/hq/announcements` → 모든 테넌트 관리자에게 공지 발송

## 5. 공통 코드 및 파일

- 코드 조회: `GET /api/common/codes?group=PAYMENT_METHOD`
  - 응답: `value`, `nameKo`, `nameEn`, `sortOrder`, `tenantCustom`
- 파일 업로드: `POST /api/files/upload`
  - 헤더: `Content-Type: multipart/form-data`
  - 응답: `fileId`, `url`, `contentType`, `size`
- 파일 삭제: `DELETE /api/files/{fileId}` (소유자/권한 검증)

## 6. 오류 코드 공통 규약

| Code | Message | Description |
| --- | --- | --- |
| 400 | `bad_request` | 잘못된 입력, 필수값 누락 |
| 401 | `unauthorized` | 인증 실패, 토큰 만료 |
| 403 | `forbidden` | 권한 없음 (테넌트 불일치 등) |
| 404 | `not_found` | 리소스 없음 |
| 409 | `conflict` | 중복/상태 충돌 |
| 422 | `business_rule_violation` | 비즈니스 규칙 위반 |
| 429 | `too_many_requests` | 레이트 리밋 초과 |
| 500 | `internal_server_error` | 서버 오류 |

### 에러 응답 예시

```json
{
  "timestamp": "2025-11-15T09:12:33.120Z",
  "path": "/api/admin/reservations/123",
  "code": "business_rule_violation",
  "message": "이미 완료된 예약입니다.",
  "details": {
    "currentStatus": "COMPLETED"
  }
}
```

## 7. 상태 전이(요약)

| 도메인 | 상태 흐름 | 비고 |
| --- | --- | --- |
| 예약 | PENDING → APPROVED → COMPLETED | APPROVED → CANCELLED 가능 |
| 수강등록 | DRAFT → ACTIVE → COMPLETED | ACTIVE → PAUSED → ACTIVE |
| 결제 | INIT → APPROVED → CAPTURED | APPROVED → FAILED → RETRY |
| 정산 배치 | SCHEDULED → RUNNING → COMPLETED | RUNNING → FAILED → RETRY |

## 8. Webhook & 이벤트

- **결제 Webhook:** 결제 게이트웨이 → `/api/payments/webhook`
  - Headers: `X-Signature`
  - Payload: 주문 ID, 상태(승인/취소/환불), 승인번호
- **알림 상태 콜백:** 외부 알림 서비스 → `/api/notifications/status`
  - 전송 상태(성공/실패), 실패 사유
- **정산 완료 이벤트:** PL/SQL 배치 완료 후 메시지 큐 발행
  - Topic: `settlement.completed`
  - 메시지: 정산 ID, 테넌트 ID, 기간, 성공/실패 카운트

## 9. 향후 확장 메모

- OpenAPI 3.1 스키마 정의 및 Swagger UI 제공 예정
- GraphQL 쿼리/뮤테이션 도입 고려 (고급 리포트, 대시보드)
- 실시간 알림을 위한 WebSocket/Server-Sent Events 검토
- 서드파티 연동(API 키 관리, 레이트 리밋) 정책 문서 별도 작성 예정
