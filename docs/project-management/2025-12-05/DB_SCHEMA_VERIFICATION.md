# DB 스키마 검증 결과

**작성일**: 2025-12-05  
**검증 대상**: 표준화된 프로시저와 실제 DB 스키마 비교

---

## 🔍 주요 발견 사항

### 1. tenant_id 타입 불일치 ⚠️

**실제 DB 타입**:
- 대부분의 테이블: `varchar(36)` (UUID 형식)
- 일부 테이블: `varchar(100)` (discount_accounting_transactions, consultant_performance, consultation_record_alerts, package_discounts)

**프로시저 정의**: `VARCHAR(100)`

**권장 조치**: 
- 프로시저 파라미터는 `VARCHAR(100)` 유지 (호환성)
- 실제 WHERE 절에서는 타입 변환이 필요 없음 (MySQL 자동 변환)

### 2. 존재하지 않는 테이블 ❌

다음 테이블들이 실제 DB에 존재하지 않음:
- `system_logs` - ProcessBatchScheduleCompletion 프로시저에서 사용
- `erp_sync_logs` - GetIntegratedSalaryStatistics 프로시저에서 사용

**권장 조치**: 
- 해당 프로시저에서 이 테이블 사용 부분 제거 또는 주석 처리
- 또는 테이블 생성 마이그레이션 추가

### 3. 필드 누락 ⚠️

#### session_usage_logs 테이블
- `tenant_id` 필드가 없음
- `created_by` 필드가 없음

**현재 필드**:
- id, mapping_id, schedule_id, consultant_id, client_id, session_type, action_type, additional_sessions, package_name, package_price, reason, created_at

**권장 조치**: 
- UseSessionForMapping 프로시저에서 tenant_id, created_by INSERT 제거 또는 주석 처리
- 또는 테이블에 필드 추가 마이그레이션 필요

#### discount_accounting_transactions 테이블
- `is_deleted` 필드가 없음
- `created_by` 필드가 없음
- `updated_by` 필드가 없음

**현재 필드**:
- id, applied_at, applied_by, branch_code, cancellation_reason, cancelled_at, confirmed_at, created_at, discount_amount, discount_code, discount_name, discount_transaction_id, final_amount, mapping_id, notes, original_amount, refund_reason, refund_transaction_id, refunded_amount, refunded_at, remaining_amount, revenue_transaction_id, status, updated_at, tenant_id

**권장 조치**: 
- GetDiscountStatistics, ProcessDiscountAccounting, UpdateDiscountStatus 프로시저에서 is_deleted 조건 제거
- created_by, updated_by 사용 부분 제거 또는 주석 처리
- 또는 테이블에 필드 추가 마이그레이션 필요

### 4. branch_code 필드 존재 ✅

다음 테이블에 `branch_code` 필드가 여전히 존재:
- consultant_client_mappings
- financial_transactions
- users
- schedules
- discount_accounting_transactions
- daily_statistics
- salary_calculations

**상태**: 프로시저에서는 이미 제거했으므로 문제 없음 ✅

### 5. is_deleted 타입 ✅

**실제 DB**: `bit(1)` (BOOLEAN)  
**프로시저**: `FALSE` 사용  
**상태**: 올바름 ✅

---

## 📋 수정 필요한 프로시저 목록

### 1. ProcessBatchScheduleCompletion
- `system_logs` 테이블 사용 부분 제거 또는 주석 처리

### 2. GetIntegratedSalaryStatistics
- `erp_sync_logs` 테이블 사용 부분 제거 또는 주석 처리

### 3. UseSessionForMapping
- `session_usage_logs` INSERT 시 `tenant_id`, `created_by` 제거 또는 주석 처리

### 4. GetDiscountStatistics
- `discount_accounting_transactions` WHERE 절에서 `is_deleted = FALSE` 조건 제거

### 5. ProcessDiscountAccounting
- `discount_accounting_transactions` INSERT 시 `is_deleted`, `created_by` 제거 또는 주석 처리

### 6. UpdateDiscountStatus
- `discount_accounting_transactions` WHERE 절에서 `is_deleted = FALSE` 조건 제거
- `updated_by` 사용 부분 제거 또는 주석 처리

---

## ✅ 검증 완료된 사항

1. ✅ `tenant_id` 필드 존재 확인 (모든 주요 테이블)
2. ✅ `is_deleted` 필드 존재 확인 (대부분의 테이블)
3. ✅ `created_at`, `updated_at` 필드 존재 확인
4. ✅ 주요 테이블 구조 확인 완료

---

## 🔧 다음 단계

1. 위의 수정 사항을 프로시저에 반영
2. 누락된 테이블/필드에 대한 마이그레이션 스크립트 작성 검토
3. 수정된 프로시저 재검증

