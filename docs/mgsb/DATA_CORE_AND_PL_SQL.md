# MindGarden Small Business Platform: Data Core & PL/SQL Strategy

## 1. 데이터 도메인 개요 (중앙화 원칙)

- **핵심 엔터티:** 테넌트, 지점, 사용자(직원/소비자), 인증/계정, 상품/서비스, 반/강좌, 주문/수강, 청구/결제, 정산, 출결, 공통 코드, 감사 로그
- **중앙화 원칙:**
  - 모든 데이터는 **중앙 데이터 코어**(공동 DB 클러스터)에 저장하며, 업종별 확장은 모듈 테이블을 추가하는 방식으로 일관성을 유지한다.
  - 테넌트 식별자(`tenant_id`)를 통한 파티셔닝 전략으로 멀티테넌시를 구현하되, HQ/HQ-Admin은 `tenant_id=NULL` 상태에서 전체 데이터 접근 권한을 가진다.
  - 공통 코드, 감사 로그, 보안 이벤트 등 플랫폼 공통 데이터도 중앙 데이터베이스에서 일괄 관리한다.
- **데이터 모델링 원칙:**
  - 모든 주요 테이블에 `tenant_id`, `branch_id`, `lang_code`, `created_at`, `created_by`, `updated_at`, `deleted_at` 필드를 포함
  - 공통 코드 테이블은 코드 값과 한글/영문 명칭을 모두 포함, 테넌트 커스텀 코드 지원
  - 이벤트 소싱(주문/정산 상태 이력) 및 감사 로그 테이블 별도 구성

### 1.1 통합 ERD (텍스트 표현)

```
Tenant (tenant_id PK)
 ├─ Branch (branch_id PK, tenant_id FK)
 │   ├─ StaffAccount (staff_id PK, branch_id FK, tenant_id FK)
 │   └─ Class (class_id PK, tenant_id FK) ─┬─ ClassSchedule (schedule_id PK)
 │                                         └─ ClassEnrollment (enrollment_id PK) ── Attendance (attendance_id PK)
 └─ ConsumerAccount (consumer_id PK, tenant_id FK)
      └─ Order / Enrollment (order_id PK, tenant_id FK)
           ├─ OrderItem (order_item_id PK)
           ├─ Invoice (invoice_id PK) ── Payment (payment_id PK)
           └─ SettlementResult (settlement_id PK)

AuthUser (auth_user_id PK) ─┬─ StaffAccount (1:1 via auth_user_id)
                            └─ ConsumerAccount (1:1 via auth_user_id)

CommonCode (code_id PK)
AuditLog (audit_id PK)
SecurityEvent (event_id PK)
```

### 1.2 핵심 테이블 정의 (요약)

| 테이블 | 주요 컬럼 | 설명 |
| --- | --- | --- |
| `tenant` | `tenant_id`, `name`, `business_type`, `status` | 학원/미용실 등 사업장 |
| `branch` | `branch_id`, `tenant_id`, `name`, `hq_flag` | 지점/센터 |
| `auth_user` | `auth_user_id`, `login_id`, `password_hash`, `mfa_secret`, `status` | 통합 계정 정보 (소셜 로그인 매핑 포함) |
| `staff_account` | `staff_id`, `auth_user_id`, `tenant_id`, `branch_id`, `role` | 관리자/HQ/스태프 |
| `consumer_account` | `consumer_id`, `auth_user_id`, `tenant_id`, `profile` | 학부모/회원 |
| `course` | `course_id`, `tenant_id`, `name`, `category`, `pricing_policy` | 강좌/상품 |
| `class` | `class_id`, `course_id`, `teacher_id`, `capacity`, `options` | 반, 강좌 단위 운영 |
| `class_schedule` | `schedule_id`, `class_id`, `day_of_week`, `start_time`, `end_time`, `room` | 시간표 |
| `class_enrollment` | `enrollment_id`, `class_id`, `consumer_id`, `status`, `tuition_plan_id` | 수강 등록 |
| `attendance` | `attendance_id`, `enrollment_id`, `schedule_id`, `status`, `recorded_at` | 출결 |
| `billing_schedule` | `billing_schedule_id`, `tenant_id`, `cycle`, `day_of_month`, `target_filters` | 월별 청구 설정 |
| `invoice` | `invoice_id`, `tenant_id`, `consumer_id`, `amount`, `status`, `due_date` | 청구서 |
| `payment` | `payment_id`, `invoice_id`, `order_id`, `amount`, `method`, `pg_tx_id` | 결제 |
| `settlement_result` | `settlement_id`, `tenant_id`, `period`, `gross_amount`, `royalty_amount`, `teacher_payout` | 정산 결과 |
| `audit_log` | `audit_id`, `tenant_id`, `user_id`, `action`, `resource`, `metadata` | 감사 로그 |
| `security_event` | `event_id`, `severity`, `category`, `details` | 보안 이벤트/알림 |

### 1.3 ERD 스냅샷 (업종 공통 + 학원 모듈)

| 모듈 | 주요 관계 |
| --- | --- |
| **공통/계정** | `auth_user` 1:1 `staff_account` / `consumer_account` (OAuth provider table로 소셜 로그인 식별) |
| **테넌트/지점** | `tenant` 1:N `branch`; HQ 서브도메인은 `tenant.is_hq` / `branch.hq_flag` |
| **학원 수강** | `consumer_account` 1:N `class_enrollment`; `class` 1:N `class_schedule` |
| **청구/결제** | `billing_schedule` → 생성된 `invoice` → `payment` (1:N) → `settlement_result` |
| **정산** | `settlement_result` → `settlement_detail` (강사/본사/지점 분배 상세) |
| **출결** | `attendance`는 `class_enrollment`와 `class_schedule` 사이 다대다 역할 (복합 PK 구성) |
| **공지/알림** | `notification_template`, `notification_log`, `notification_status` |

> 추후 업종 확장(미용, 배달 등)은 `tenant.business_type`에 따라 모듈 테이블(`salon_booking`, `delivery_order`)을 플러그인 형태로 추가하고, 공통 인증/정산 테이블과 연결합니다.

## 2. PL/SQL 기반 처리 흐름

### 2.1 정산 배치 프로세스

1. 스케줄러 서비스가 정산 대상 기간을 PL/SQL 패키지에 전달
2. 패키지가 주문/결제 데이터를 기준으로 매출·수수료·정산 금액 계산
3. 계산 결과를 정산 결과 테이블에 저장하고, 로그/감사 테이블에 기록
4. API 서버는 정산 결과를 ERP 및 관리자 포털에 제공

### 2.2 통계/집계 배치

- 일/주/월 단위 매출, 주문 수, 신규 회원 수 등 지표 집계
- PL/SQL 패키지가 집계 작업을 수행하고, 요약 테이블에 반영
- 캐시(예: Redis)에 Top-N 지표를 적재하여 대시보드 성능 최적화

### 2.3 예외 및 재처리 흐름

- 배치 실행 중 오류 발생 시 PL/SQL 패키지가 상세 로그 저장 → 스케줄러가 알림 발송
- 재처리 플래그를 통해 특정 기간 또는 테넌트만 재집계 가능
- 부분 정산/취소 처리 시 보정 데이터 입력을 지원하는 관리자 UI 제공

## 3. 공통 코드 및 한글 필드 적용

- **구조:** `code_group`, `code_value`, `name_ko`, `name_en`, `sort_order`, `is_active`
- **관리:**
  - MindGarden HQ가 공통 코드 관리 UI를 통해 코드 등록/수정
  - 테넌트 전용 코드(예: 메뉴 카테고리)는 `tenant_id`를 포함하여 별도 관리
- **사용 패턴:**
  - API 응답 시 코드 값과 한국어 명칭을 함께 반환 (프런트엔드 렌더링 일관성)
  - 다국어 확장을 대비하여 `lang_code` 기반 조회 지원

## 4. 데이터 일관성 및 트랜잭션 전략

- **트랜잭션 경계:** 주문 생성/결제/정산 간의 트랜잭션을 Saga 패턴으로 구성
- **동시성 제어:**
  - 주요 테이블에 비관적/낙관적 잠금 전략 병행
  - PL/SQL 배치 내에서도 테넌트·기간 단위 잠금으로 경합 최소화
- **데이터 동기화:**
  - ERP ↔ 플랫폼 간 데이터 차이를 주기적으로 비교하는 검증 배치
  - 이벤트 로그/감사 로그를 기반으로 재처리 가능하도록 설계

## 5. 성능, 모니터링, 장애 대응

- **성능 최적화:**
  - 핵심 배치 패키지에 대한 실행 계획 분석, 주기적 인덱스 튜닝
  - 슬라이딩 파티션, 병렬 처리 옵션 활용 검토
- **모니터링:**
  - DB 모니터링 툴(예: Oracle AWR, pg_stat_statements)과 애플리케이션 APM 연계
  - 배치 실행 결과/소요시간/에러율 대시보드화
- **장애 대응:**
  - 배치 실패 자동 알림, 자동 재시도 정책(재시도 횟수/간격)
  - 수동 재처리 UI, 롤백 스크립트, 백업/복구 시나리오 수립
