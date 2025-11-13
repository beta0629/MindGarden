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

RoleTemplate (role_template_id PK)
 ├─ RoleTemplatePermission (role_template_id FK, permission_code)
 └─ RoleTemplateMapping (role_template_id FK, business_type)

TenantRole (tenant_role_id PK, tenant_id FK, role_template_id FK)
 ├─ RolePermission (tenant_role_id FK, permission_code, policy_json)
 └─ UserRoleAssignment (assignment_id PK, tenant_role_id FK, user_id FK)

PricingPlan (plan_id PK)
 ├─ PricingPlanFeature (plan_id FK, feature_code)
 └─ PricingAddon (addon_id PK)
      └─ PricingAddonFeature (addon_id FK, feature_code)

TenantSubscription (subscription_id PK, tenant_id FK, plan_id FK)
 ├─ SubscriptionAddon (subscription_id FK, addon_id FK)
 ├─ TenantAIService (tenant_ai_id PK, model_code, addon_id FK)
 └─ SubscriptionInvoice (invoice_id PK, subscription_id FK)
      └─ SubscriptionInvoiceLine (line_id PK, invoice_id FK, charge_type, amount)

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
| `pricing_plan` | `plan_id`, `plan_code`, `name`, `base_fee`, `limits_json`, `is_active`, `display_order` | Starter/Standard/Premium 등 기본 요금제 정의 |
| `pricing_plan_feature` | `plan_id`, `feature_code`, `feature_level`, `included_flag` | 요금제별 제공 기능/한도 세부 정보 |
| `pricing_addon` | `addon_id`, `addon_code`, `name`, `category`, `fee_model`, `metadata_json` | AI Advanced Pack, Security Compliance Pack 등 선택 애드온 |
| `pricing_addon_feature` | `addon_id`, `feature_code`, `feature_level`, `notes` | 애드온으로 추가 제공되는 기능/한도 |
| `tenant_subscription` | `subscription_id`, `tenant_id`, `plan_id`, `status`, `effective_from`, `effective_to`, `billing_cycle` | 테넌트별 활성 요금제 |
| `subscription_addon` | `subscription_id`, `addon_id`, `activated_at`, `deactivated_at`, `approval_user_id` | 테넌트가 활성화한 애드온 내역 |
| `tenant_ai_service` | `tenant_ai_id`, `subscription_id`, `model_code`, `pricing_ref`, `status`, `usage_limit` | 테넌트별 AI 모델 선택 상태 |
| `tenant_ai_usage_daily` | `usage_id`, `tenant_id`, `model_code`, `metric`, `amount`, `usage_date` | 일별 AI 사용량 집계 |
| `subscription_invoice` | `invoice_id`, `subscription_id`, `billing_period`, `total_amount`, `status`, `due_date` | 요금제 청구서 헤더 |
| `subscription_invoice_line` | `line_id`, `invoice_id`, `charge_type`, `description`, `quantity`, `unit_price`, `amount`, `tax_amount` | 청구 내역 라인 (기본 요금/애드온/초과 사용) |
| `role_template` | `role_template_id`, `template_code`, `name`, `business_type`, `description` | 업종별 기본 역할 템플릿 (예: 학생, 교사, 원장) |
| `role_template_permission` | `role_template_id`, `permission_code`, `scope`, `default_flag` | 템플릿에 포함된 권한 목록 |
| `role_template_mapping` | `role_template_id`, `business_type`, `priority`, `is_default` | 업종별 템플릿 자동 매핑(학원, 미용 등) |
| `tenant_role` | `tenant_role_id`, `tenant_id`, `role_template_id`, `name`, `description`, `is_active` | 테넌트 커스텀 역할 (템플릿 기반 복제) |
| `role_permission` | `tenant_role_id`, `permission_code`, `policy_json`, `granted_by` | 테넌트 역할에 부여된 권한/정책 |
| `user_role_assignment` | `assignment_id`, `user_id`, `tenant_role_id`, `branch_id`, `effective_from`, `effective_to` | 사용자 역할/지점 배정 기록 |
| `ops_onboarding_request` | `id`, `tenant_id`, `tenant_name`, `requested_by`, `status`, `risk_level`, `checklist_json`, `decided_by`, `decision_at`, `decision_note`, `created_at`, `updated_at` | 내부 운영 포털 온보딩 요청 |
| `ops_pricing_plan` | `id`, `plan_code`, `display_name`, `base_fee`, `currency`, `description`, `active`, `created_at`, `updated_at` | 운영용 요금제 메타데이터 |
| `ops_pricing_addon` | `id`, `addon_code`, `display_name`, `category`, `fee_type`, `unit_price`, `unit`, `active`, `created_at`, `updated_at` | 운영용 애드온 메타데이터 |
| `ops_plan_addon` | `id`, `plan_id`, `addon_id`, `notes`, `created_at`, `updated_at` | 요금제-애드온 매핑 |
| `ops_feature_flag` | `id`, `flag_key`, `description`, `state`, `target_scope`, `expires_at`, `created_at`, `updated_at` | 운영 포털 Feature Flag |
| `ops_audit_log` | `id`, `event_type`, `entity_type`, `entity_id`, `actor_id`, `actor_role`, `action`, `metadata_json`, `created_at`, `updated_at` | 운영 감사 로그 |
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

### 1.4 테넌트 역할 템플릿 & RBAC 구조

- **목적:** 업종/테넌트에 따라 `학생`, `학부모`, `강사`, `사무원`, `원장`, `HQ 관리자` 등 역할 구성을 유연하게 유지하면서도 플랫폼 차원에서 표준 RBAC/ABAC 정책을 강제
- **구성요소:**
  - `role_template`: MindGarden HQ가 업종별 기본 역할 세트를 정의 (예: 학원 비즈니스 → 학생, 학부모, 강사, 사무원, 관리자, 원장)
  - `role_template_permission`: 각 템플릿이 보유한 기본 권한 코드(메뉴, API, 데이터 범위)와 기본 스코프(자기 자신, 지점, 전체)
  - `role_template_mapping`: 테넌트 가입 시 업종(`business_type`)에 따라 자동으로 추천되는 템플릿 목록과 우선순위
  - `tenant_role`: 테넌트가 템플릿을 복제/커스터마이징하여 사용하는 실제 역할. 이름/설명/활성 상태 관리
  - `role_permission`: 테넌트 커스텀 권한. 정책 JSON(`policy_json`) 필드에 ABAC 조건(예: 본인 지점 데이터만 접근)을 저장
  - `user_role_assignment`: 사용자와 역할의 배정 이력. 지점/유효 기간/승인자 등 메타데이터 기록
- **운영 정책:**
  - 테넌트가 기본 템플릿을 수정하면 변경 이력을 감사 로그에 기록하고, HQ가 검토할 수 있는 승인 워크플로우 제공
  - 민감 리소스(로그, AI 과금, 결제 설정 등)는 HQ가 제공한 “필수 권한” 플래그를 통해 삭제/수정 불가하도록 잠금
  - 멀티롤 지원: 한 사용자가 `교사`+`사무원` 등 다중 역할을 가질 수 있으며, 세션 시 `active_role`을 선택하도록 UX 제공
  - ABAC 확장: 권한 정책에 `branch_id`, `tenant_id`, `role_level`, `business_type` 등을 조건으로 사용해 세밀한 접근 제어 구현
  - 역할 변경 시 API/Notification을 통해 테넌트 관리자에게 알림 전송, `user_role_assignment`에 이력 남김
- 내부 운영 포털(Ops) 모듈 테이블은 Flyway(`V1__init_ops_tables.sql`)로 관리하며, MindGarden 핵심 DB와 동일 클러스터에 위치시키되 `ops_*` 네임스페이스를 사용한다.
- 감사 로그/Feature Flag 등 운영 데이터도 중앙 DB에서 관리하며, 추후 데이터 마트로 전송 시 CDC(예: Debezium) 연동을 검토한다.

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
