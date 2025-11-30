-- ============================================================================
-- 복합 인덱스 추가 (성능 최적화)
-- 작성일: 2025-11-30
-- 목적: tenant_id 기반 쿼리 성능 향상
-- ============================================================================

-- ============================================================================
-- 1. schedules 테이블
-- ============================================================================

-- tenant_id + created_at (최근 스케줄 조회)
CREATE INDEX IF NOT EXISTS idx_schedules_tenant_created 
ON schedules(tenant_id, created_at DESC);

-- tenant_id + date (날짜별 스케줄 조회)
CREATE INDEX IF NOT EXISTS idx_schedules_tenant_date 
ON schedules(tenant_id, date);

-- tenant_id + status + date (상태별 날짜 조회)
CREATE INDEX IF NOT EXISTS idx_schedules_tenant_status_date 
ON schedules(tenant_id, status, date);

-- tenant_id + consultant_id + date (상담사별 스케줄)
CREATE INDEX IF NOT EXISTS idx_schedules_tenant_consultant_date 
ON schedules(tenant_id, consultant_id, date);

-- tenant_id + client_id + date (내담자별 스케줄)
CREATE INDEX IF NOT EXISTS idx_schedules_tenant_client_date 
ON schedules(tenant_id, client_id, date);

-- ============================================================================
-- 2. financial_transactions 테이블
-- ============================================================================

-- tenant_id + transaction_date (거래 날짜별 조회)
CREATE INDEX IF NOT EXISTS idx_financial_tenant_date 
ON financial_transactions(tenant_id, transaction_date DESC);

-- tenant_id + transaction_type + transaction_date (거래 유형별 조회)
CREATE INDEX IF NOT EXISTS idx_financial_tenant_type_date 
ON financial_transactions(tenant_id, transaction_type, transaction_date DESC);

-- tenant_id + subcategory + transaction_date (세부 카테고리별 조회)
CREATE INDEX IF NOT EXISTS idx_financial_tenant_subcat_date 
ON financial_transactions(tenant_id, subcategory, transaction_date DESC);

-- tenant_id + is_deleted + transaction_date (삭제되지 않은 거래 조회)
CREATE INDEX IF NOT EXISTS idx_financial_tenant_active_date 
ON financial_transactions(tenant_id, is_deleted, transaction_date DESC);

-- ============================================================================
-- 3. consultation_records 테이블
-- ============================================================================

-- tenant_id + consultation_date (상담 날짜별 조회)
CREATE INDEX IF NOT EXISTS idx_consultation_tenant_date 
ON consultation_records(tenant_id, consultation_date DESC);

-- tenant_id + consultant_id + consultation_date (상담사별 상담 기록)
CREATE INDEX IF NOT EXISTS idx_consultation_tenant_consultant_date 
ON consultation_records(tenant_id, consultant_id, consultation_date DESC);

-- tenant_id + client_id + consultation_date (내담자별 상담 기록)
CREATE INDEX IF NOT EXISTS idx_consultation_tenant_client_date 
ON consultation_records(tenant_id, client_id, consultation_date DESC);

-- ============================================================================
-- 4. users 테이블
-- ============================================================================

-- tenant_id + role (역할별 사용자 조회)
CREATE INDEX IF NOT EXISTS idx_users_tenant_role 
ON users(tenant_id, role);

-- tenant_id + is_active + is_deleted (활성 사용자 조회)
CREATE INDEX IF NOT EXISTS idx_users_tenant_active 
ON users(tenant_id, is_active, is_deleted);

-- tenant_id + role + is_active (활성 역할별 사용자)
CREATE INDEX IF NOT EXISTS idx_users_tenant_role_active 
ON users(tenant_id, role, is_active);

-- tenant_id + branch_code (지점별 사용자 조회)
CREATE INDEX IF NOT EXISTS idx_users_tenant_branch 
ON users(tenant_id, branch_code);

-- tenant_id + email (이메일 조회 - 로그인)
CREATE INDEX IF NOT EXISTS idx_users_tenant_email 
ON users(tenant_id, email);

-- ============================================================================
-- 5. consultant_client_mapping 테이블
-- ============================================================================

-- tenant_id + status (상태별 매칭 조회)
CREATE INDEX IF NOT EXISTS idx_mapping_tenant_status 
ON consultant_client_mapping(tenant_id, status);

-- tenant_id + consultant_id + status (상담사별 매칭)
CREATE INDEX IF NOT EXISTS idx_mapping_tenant_consultant_status 
ON consultant_client_mapping(tenant_id, consultant_id, status);

-- tenant_id + client_id + status (내담자별 매칭)
CREATE INDEX IF NOT EXISTS idx_mapping_tenant_client_status 
ON consultant_client_mapping(tenant_id, client_id, status);

-- tenant_id + payment_status (결제 상태별 조회)
CREATE INDEX IF NOT EXISTS idx_mapping_tenant_payment 
ON consultant_client_mapping(tenant_id, payment_status);

-- tenant_id + created_at (최근 매칭 조회)
CREATE INDEX IF NOT EXISTS idx_mapping_tenant_created 
ON consultant_client_mapping(tenant_id, created_at DESC);

-- ============================================================================
-- 6. clients 테이블
-- ============================================================================

-- tenant_id + is_deleted + created_at (활성 내담자 조회)
CREATE INDEX IF NOT EXISTS idx_clients_tenant_active_created 
ON clients(tenant_id, is_deleted, created_at DESC);

-- tenant_id + branch_code (지점별 내담자)
CREATE INDEX IF NOT EXISTS idx_clients_tenant_branch 
ON clients(tenant_id, branch_code);

-- ============================================================================
-- 7. consultants 테이블
-- ============================================================================

-- tenant_id + is_deleted + created_at (활성 상담사 조회)
CREATE INDEX IF NOT EXISTS idx_consultants_tenant_active_created 
ON consultants(tenant_id, is_deleted, created_at DESC);

-- tenant_id + branch_code (지점별 상담사)
CREATE INDEX IF NOT EXISTS idx_consultants_tenant_branch 
ON consultants(tenant_id, branch_code);

-- ============================================================================
-- 8. common_codes 테이블
-- ============================================================================

-- tenant_id + code_group + is_active (코드 그룹별 조회)
CREATE INDEX IF NOT EXISTS idx_common_codes_tenant_group_active 
ON common_codes(tenant_id, code_group, is_active);

-- tenant_id + code_group + sort_order (정렬된 코드 조회)
CREATE INDEX IF NOT EXISTS idx_common_codes_tenant_group_sort 
ON common_codes(tenant_id, code_group, sort_order);

-- ============================================================================
-- 9. branches 테이블
-- ============================================================================

-- tenant_id + branch_status (상태별 지점 조회)
CREATE INDEX IF NOT EXISTS idx_branches_tenant_status 
ON branches(tenant_id, branch_status);

-- tenant_id + is_active (활성 지점 조회)
CREATE INDEX IF NOT EXISTS idx_branches_tenant_active 
ON branches(tenant_id, is_active);

-- ============================================================================
-- 10. consultant_availability 테이블
-- ============================================================================

-- tenant_id + consultant_id + is_active (상담사별 가용 시간)
CREATE INDEX IF NOT EXISTS idx_availability_tenant_consultant_active 
ON consultant_availability(tenant_id, consultant_id, is_active);

-- tenant_id + consultant_id + day_of_week (요일별 가용 시간)
CREATE INDEX IF NOT EXISTS idx_availability_tenant_consultant_day 
ON consultant_availability(tenant_id, consultant_id, day_of_week);

-- ============================================================================
-- 성능 확인 쿼리
-- ============================================================================

-- 인덱스 생성 확인
-- SHOW INDEX FROM schedules WHERE Key_name LIKE 'idx_schedules_tenant%';
-- SHOW INDEX FROM financial_transactions WHERE Key_name LIKE 'idx_financial_tenant%';
-- SHOW INDEX FROM users WHERE Key_name LIKE 'idx_users_tenant%';

-- 쿼리 실행 계획 확인 (인덱스 사용 여부)
-- EXPLAIN SELECT * FROM schedules WHERE tenant_id = 'xxx' AND date > '2025-01-01';
-- type이 'range' 또는 'ref'이면 인덱스 사용 중

-- ============================================================================
-- 주의사항
-- ============================================================================
-- 1. 인덱스는 INSERT/UPDATE 성능을 약간 저하시킬 수 있습니다
-- 2. 사용되지 않는 인덱스는 주기적으로 제거해야 합니다
-- 3. 인덱스 크기가 너무 크면 메모리 부족 문제가 발생할 수 있습니다
-- 4. 복합 인덱스의 컬럼 순서가 매우 중요합니다 (tenant_id가 항상 첫 번째)

