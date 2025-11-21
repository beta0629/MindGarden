-- V36: 결제 및 구독 시스템 공통 코드 등록
-- 결제 및 구독 시스템에서 사용하는 공통 코드를 등록합니다.
-- 하드코딩 금지 원칙에 따라 모든 드롭다운 옵션은 공통 코드에서 가져옵니다.

-- 1. SUBSCRIPTION_STATUS (구독 상태) 코드 그룹 등록
INSERT INTO common_codes (
    code_group,
    code_value,
    code_label,
    korean_name,
    code_description,
    sort_order,
    is_active,
    tenant_id,
    color_code,
    icon,
    created_at,
    updated_at,
    is_deleted,
    version
) VALUES
-- 초안
('SUBSCRIPTION_STATUS', 'DRAFT', 'Draft', '초안', '구독이 생성되었지만 아직 활성화되지 않은 상태', 1, true, NULL, '#9e9e9e', '📝', NOW(), NOW(), false, 0),
-- 활성화 대기
('SUBSCRIPTION_STATUS', 'PENDING_ACTIVATION', 'Pending Activation', '활성화 대기', '구독이 생성되었고 활성화를 기다리는 상태', 2, true, NULL, '#ff9800', '⏳', NOW(), NOW(), false, 0),
-- 활성
('SUBSCRIPTION_STATUS', 'ACTIVE', 'Active', '활성', '구독이 활성화되어 정상적으로 서비스를 이용 중인 상태', 3, true, NULL, '#4caf50', '✅', NOW(), NOW(), false, 0),
-- 일시정지
('SUBSCRIPTION_STATUS', 'SUSPENDED', 'Suspended', '일시정지', '구독이 일시적으로 정지된 상태', 4, true, NULL, '#ff9800', '⏸️', NOW(), NOW(), false, 0),
-- 취소됨
('SUBSCRIPTION_STATUS', 'CANCELLED', 'Cancelled', '취소됨', '구독이 취소된 상태', 5, true, NULL, '#f44336', '❌', NOW(), NOW(), false, 0),
-- 종료됨
('SUBSCRIPTION_STATUS', 'TERMINATED', 'Terminated', '종료됨', '구독이 완전히 종료된 상태', 6, true, NULL, '#757575', '🔚', NOW(), NOW(), false, 0)
ON DUPLICATE KEY UPDATE
    code_label = VALUES(code_label),
    korean_name = VALUES(korean_name),
    code_description = VALUES(code_description),
    sort_order = VALUES(sort_order),
    color_code = VALUES(color_code),
    icon = VALUES(icon),
    updated_at = NOW();

-- 2. BILLING_CYCLE (결제 주기) 코드 그룹 등록
INSERT INTO common_codes (
    code_group,
    code_value,
    code_label,
    korean_name,
    code_description,
    sort_order,
    is_active,
    tenant_id,
    color_code,
    icon,
    created_at,
    updated_at,
    is_deleted,
    version
) VALUES
-- 월간
('BILLING_CYCLE', 'MONTHLY', 'Monthly', '월간', '매월 자동 결제', 1, true, NULL, '#2196f3', '📅', NOW(), NOW(), false, 0),
-- 분기
('BILLING_CYCLE', 'QUARTERLY', 'Quarterly', '분기', '3개월마다 자동 결제', 2, true, NULL, '#4caf50', '📆', NOW(), NOW(), false, 0),
-- 연간
('BILLING_CYCLE', 'YEARLY', 'Yearly', '연간', '1년마다 자동 결제', 3, true, NULL, '#ff9800', '🗓️', NOW(), NOW(), false, 0)
ON DUPLICATE KEY UPDATE
    code_label = VALUES(code_label),
    korean_name = VALUES(korean_name),
    code_description = VALUES(code_description),
    sort_order = VALUES(sort_order),
    color_code = VALUES(color_code),
    icon = VALUES(icon),
    updated_at = NOW();

-- 3. PG_PROVIDER (PG 제공자) 코드 그룹 등록
INSERT INTO common_codes (
    code_group,
    code_value,
    code_label,
    korean_name,
    code_description,
    sort_order,
    is_active,
    tenant_id,
    color_code,
    icon,
    created_at,
    updated_at,
    is_deleted,
    version
) VALUES
-- 토스페이먼츠
('PG_PROVIDER', 'TOSS', 'Toss Payments', '토스페이먼츠', '토스페이먼츠 결제 서비스', 1, true, NULL, '#0064ff', '💳', NOW(), NOW(), false, 0),
-- 스트라이프
('PG_PROVIDER', 'STRIPE', 'Stripe', '스트라이프', '스트라이프 결제 서비스', 2, true, NULL, '#635bff', '💳', NOW(), NOW(), false, 0),
-- 아임포트
('PG_PROVIDER', 'IAMPORT', 'Iamport', '아임포트', '아임포트 결제 서비스', 3, true, NULL, '#1a237e', '💳', NOW(), NOW(), false, 0)
ON DUPLICATE KEY UPDATE
    code_label = VALUES(code_label),
    korean_name = VALUES(korean_name),
    code_description = VALUES(code_description),
    sort_order = VALUES(sort_order),
    color_code = VALUES(color_code),
    icon = VALUES(icon),
    updated_at = NOW();

-- 4. 코드 그룹 메타데이터 등록 (code_group_metadata 테이블이 있는 경우)
-- 참고: code_group_metadata 테이블의 PK는 group_name입니다.
-- code_type 컬럼이 있는지 확인 후 조건부로 INSERT
SET @dbname = DATABASE();
SET @tablename = 'code_group_metadata';
SET @columnname = 'code_type';
SET @hasCodeType = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
);

-- code_type 컬럼이 있는 경우
SET @sqlWithCodeType = 'INSERT INTO code_group_metadata (
    group_name,
    korean_name,
    description,
    icon,
    is_active,
    display_order,
    code_type
) VALUES
(''SUBSCRIPTION_STATUS'', ''구독 상태'', ''구독의 현재 상태를 나타내는 코드'', ''📋'', true, 102, ''CORE''),
(''BILLING_CYCLE'', ''결제 주기'', ''구독 결제 주기를 나타내는 코드'', ''💳'', true, 103, ''CORE''),
(''PG_PROVIDER'', ''PG 제공자'', ''결제 게이트웨이 제공자를 나타내는 코드'', ''🏦'', true, 104, ''CORE'')
ON DUPLICATE KEY UPDATE
    korean_name = VALUES(korean_name),
    description = VALUES(description),
    icon = VALUES(icon),
    display_order = VALUES(display_order),
    code_type = VALUES(code_type)';

-- code_type 컬럼이 없는 경우
SET @sqlWithoutCodeType = 'INSERT INTO code_group_metadata (
    group_name,
    korean_name,
    description,
    icon,
    is_active,
    display_order
) VALUES
(''SUBSCRIPTION_STATUS'', ''구독 상태'', ''구독의 현재 상태를 나타내는 코드'', ''📋'', true, 102),
(''BILLING_CYCLE'', ''결제 주기'', ''구독 결제 주기를 나타내는 코드'', ''💳'', true, 103),
(''PG_PROVIDER'', ''PG 제공자'', ''결제 게이트웨이 제공자를 나타내는 코드'', ''🏦'', true, 104)
ON DUPLICATE KEY UPDATE
    korean_name = VALUES(korean_name),
    description = VALUES(description),
    icon = VALUES(icon),
    display_order = VALUES(display_order)';

SET @preparedStatement = IF(@hasCodeType > 0, @sqlWithCodeType, @sqlWithoutCodeType);
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 완료 메시지
SELECT '결제 및 구독 시스템 공통 코드 등록 완료' AS message;

