-- V35: 온보딩 시스템 공통 코드 등록
-- 온보딩 시스템에서 사용하는 공통 코드를 등록합니다.
-- 하드코딩 금지 원칙에 따라 모든 드롭다운 옵션은 공통 코드에서 가져옵니다.

-- 1. RISK_LEVEL (위험도) 코드 그룹 등록
-- 온보딩 요청의 위험도를 나타내는 코드
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
-- 낮은 위험도
('RISK_LEVEL', 'LOW', 'Low Risk', '낮음', '낮은 위험도 - 일반적인 온보딩 요청', 1, true, NULL, '#2e7d32', '🟢', NOW(), NOW(), false, 0),
-- 보통 위험도
('RISK_LEVEL', 'MEDIUM', 'Medium Risk', '보통', '보통 위험도 - 추가 검토가 필요한 온보딩 요청', 2, true, NULL, '#e65100', '🟡', NOW(), NOW(), false, 0),
-- 높은 위험도
('RISK_LEVEL', 'HIGH', 'High Risk', '높음', '높은 위험도 - 신중한 검토가 필요한 온보딩 요청', 3, true, NULL, '#c62828', '🔴', NOW(), NOW(), false, 0)
ON DUPLICATE KEY UPDATE
    code_label = VALUES(code_label),
    korean_name = VALUES(korean_name),
    code_description = VALUES(code_description),
    sort_order = VALUES(sort_order),
    color_code = VALUES(color_code),
    icon = VALUES(icon),
    updated_at = NOW();

-- 2. ONBOARDING_STATUS (온보딩 상태) 코드 그룹 등록
-- 온보딩 요청의 상태를 나타내는 코드
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
-- 대기 중
('ONBOARDING_STATUS', 'PENDING', 'Pending', '대기 중', '온보딩 요청이 제출되어 대기 중인 상태', 1, true, NULL, '#ff9800', '⏳', NOW(), NOW(), false, 0),
-- 검토 중
('ONBOARDING_STATUS', 'IN_REVIEW', 'In Review', '검토 중', '온보딩 요청이 검토 중인 상태', 2, true, NULL, '#2196f3', '🔍', NOW(), NOW(), false, 0),
-- 승인됨
('ONBOARDING_STATUS', 'APPROVED', 'Approved', '승인됨', '온보딩 요청이 승인된 상태', 3, true, NULL, '#4caf50', '✅', NOW(), NOW(), false, 0),
-- 거부됨
('ONBOARDING_STATUS', 'REJECTED', 'Rejected', '거부됨', '온보딩 요청이 거부된 상태', 4, true, NULL, '#f44336', '❌', NOW(), NOW(), false, 0),
-- 보류
('ONBOARDING_STATUS', 'ON_HOLD', 'On Hold', '보류', '온보딩 요청이 보류된 상태 (추가 정보 필요 등)', 5, true, NULL, '#9e9e9e', '⏸️', NOW(), NOW(), false, 0)
ON DUPLICATE KEY UPDATE
    code_label = VALUES(code_label),
    korean_name = VALUES(korean_name),
    code_description = VALUES(code_description),
    sort_order = VALUES(sort_order),
    color_code = VALUES(color_code),
    icon = VALUES(icon),
    updated_at = NOW();

-- 3. 코드 그룹 메타데이터 등록 (code_group_metadata 테이블이 있는 경우)
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
(''RISK_LEVEL'', ''위험도'', ''온보딩 요청의 위험도를 나타내는 코드'', ''⚠️'', true, 100, ''CORE''),
(''ONBOARDING_STATUS'', ''온보딩 상태'', ''온보딩 요청의 상태를 나타내는 코드'', ''📋'', true, 101, ''CORE'')
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
(''RISK_LEVEL'', ''위험도'', ''온보딩 요청의 위험도를 나타내는 코드'', ''⚠️'', true, 100),
(''ONBOARDING_STATUS'', ''온보딩 상태'', ''온보딩 요청의 상태를 나타내는 코드'', ''📋'', true, 101)
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
SELECT '온보딩 시스템 공통 코드 등록 완료' AS message;

