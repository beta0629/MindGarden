-- ====================================================================
-- 코어 공통코드 보강: REGION / RISK_LEVEL / ONBOARDING_STATUS
-- ====================================================================
-- 배경: 일부 운영 DB는 Flyway 이력은 있으나 common_codes 코어 행이 비어 있거나
--       마이그레이션 누락·수동 DB로 인해 Trinity 온보딩 등에서
--       GET /api/v1/common-codes?codeGroup=REGION 이 빈 배열을 반환함.
-- 목적: 개발(V20251203_001 REGION, V35 온보딩 코드)과 동일한 코어(tenant_id IS NULL)
--       데이터를 idempotent하게 보장.
-- 표준: uk_tenant_code_group_value (tenant_id, code_group, code_value)
-- ====================================================================

-- 소프트삭제·비활성으로 남은 동일 키 행 복구 (유니크 충돌 방지)
UPDATE common_codes
SET
    is_deleted = FALSE,
    deleted_at = NULL,
    is_active = TRUE,
    updated_at = NOW()
WHERE tenant_id IS NULL
  AND code_group = 'REGION'
  AND code_value IN (
      'SEOUL', 'BUSAN', 'INCHEON', 'DAEGU', 'GWANGJU', 'DAEJEON', 'ULSAN', 'SEJONG',
      'GYEONGGI', 'GANGWON'
  );

UPDATE common_codes
SET
    is_deleted = FALSE,
    deleted_at = NULL,
    is_active = TRUE,
    updated_at = NOW()
WHERE tenant_id IS NULL
  AND code_group = 'RISK_LEVEL'
  AND code_value IN ('LOW', 'MEDIUM', 'HIGH');

UPDATE common_codes
SET
    is_deleted = FALSE,
    deleted_at = NULL,
    is_active = TRUE,
    updated_at = NOW()
WHERE tenant_id IS NULL
  AND code_group = 'ONBOARDING_STATUS'
  AND code_value IN ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'ON_HOLD');

-- REGION (지역) — V20251203_001 와 동일
INSERT INTO common_codes (tenant_id, code_group, code_value, code_label, korean_name, code_description, sort_order, is_active, is_deleted, version, created_at, updated_at)
VALUES
(NULL, 'REGION', 'SEOUL', '서울', '서울', '서울특별시', 1, 1, 0, 0, NOW(), NOW()),
(NULL, 'REGION', 'BUSAN', '부산', '부산', '부산광역시', 2, 1, 0, 0, NOW(), NOW()),
(NULL, 'REGION', 'INCHEON', '인천', '인천', '인천광역시', 3, 1, 0, 0, NOW(), NOW()),
(NULL, 'REGION', 'DAEGU', '대구', '대구', '대구광역시', 4, 1, 0, 0, NOW(), NOW()),
(NULL, 'REGION', 'GWANGJU', '광주', '광주', '광주광역시', 5, 1, 0, 0, NOW(), NOW()),
(NULL, 'REGION', 'DAEJEON', '대전', '대전', '대전광역시', 6, 1, 0, 0, NOW(), NOW()),
(NULL, 'REGION', 'ULSAN', '울산', '울산', '울산광역시', 7, 1, 0, 0, NOW(), NOW()),
(NULL, 'REGION', 'SEJONG', '세종', '세종', '세종특별자치시', 8, 1, 0, 0, NOW(), NOW()),
(NULL, 'REGION', 'GYEONGGI', '경기', '경기', '경기도', 9, 1, 0, 0, NOW(), NOW()),
(NULL, 'REGION', 'GANGWON', '강원', '강원', '강원도', 10, 1, 0, 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    code_label = VALUES(code_label),
    korean_name = VALUES(korean_name),
    code_description = VALUES(code_description),
    sort_order = VALUES(sort_order),
    is_active = VALUES(is_active),
    is_deleted = VALUES(is_deleted),
    updated_at = NOW();

-- RISK_LEVEL — V35 와 동일
INSERT INTO common_codes (
    code_group, code_value, code_label, korean_name, code_description, sort_order, is_active, tenant_id,
    color_code, icon, created_at, updated_at, is_deleted, version
) VALUES
('RISK_LEVEL', 'LOW', 'Low Risk', '낮음', '낮은 위험도 - 일반적인 온보딩 요청', 1, true, NULL, '#2e7d32', '🟢', NOW(), NOW(), false, 0),
('RISK_LEVEL', 'MEDIUM', 'Medium Risk', '보통', '보통 위험도 - 추가 검토가 필요한 온보딩 요청', 2, true, NULL, '#e65100', '🟡', NOW(), NOW(), false, 0),
('RISK_LEVEL', 'HIGH', 'High Risk', '높음', '높은 위험도 - 신중한 검토가 필요한 온보딩 요청', 3, true, NULL, '#c62828', '🔴', NOW(), NOW(), false, 0)
ON DUPLICATE KEY UPDATE
    code_label = VALUES(code_label),
    korean_name = VALUES(korean_name),
    code_description = VALUES(code_description),
    sort_order = VALUES(sort_order),
    color_code = VALUES(color_code),
    icon = VALUES(icon),
    is_active = VALUES(is_active),
    is_deleted = VALUES(is_deleted),
    updated_at = NOW();

-- ONBOARDING_STATUS — V35 와 동일
INSERT INTO common_codes (
    code_group, code_value, code_label, korean_name, code_description, sort_order, is_active, tenant_id,
    color_code, icon, created_at, updated_at, is_deleted, version
) VALUES
('ONBOARDING_STATUS', 'PENDING', 'Pending', '대기 중', '온보딩 요청이 제출되어 대기 중인 상태', 1, true, NULL, '#ff9800', '⏳', NOW(), NOW(), false, 0),
('ONBOARDING_STATUS', 'IN_REVIEW', 'In Review', '검토 중', '온보딩 요청이 검토 중인 상태', 2, true, NULL, '#2196f3', '🔍', NOW(), NOW(), false, 0),
('ONBOARDING_STATUS', 'APPROVED', 'Approved', '승인됨', '온보딩 요청이 승인된 상태', 3, true, NULL, '#4caf50', '✅', NOW(), NOW(), false, 0),
('ONBOARDING_STATUS', 'REJECTED', 'Rejected', '거부됨', '온보딩 요청이 거부된 상태', 4, true, NULL, '#f44336', '❌', NOW(), NOW(), false, 0),
('ONBOARDING_STATUS', 'ON_HOLD', 'On Hold', '보류', '온보딩 요청이 보류된 상태 (추가 정보 필요 등)', 5, true, NULL, '#9e9e9e', '⏸️', NOW(), NOW(), false, 0)
ON DUPLICATE KEY UPDATE
    code_label = VALUES(code_label),
    korean_name = VALUES(korean_name),
    code_description = VALUES(code_description),
    sort_order = VALUES(sort_order),
    color_code = VALUES(color_code),
    icon = VALUES(icon),
    is_active = VALUES(is_active),
    is_deleted = VALUES(is_deleted),
    updated_at = NOW();
