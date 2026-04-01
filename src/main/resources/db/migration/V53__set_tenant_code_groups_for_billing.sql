-- V53: 요금 체계 관련 코드 그룹을 TENANT 타입으로 설정
-- code_group_metadata는 V10 기준 created_at/updated_at 없음 (운영 스키마 정합)

UPDATE code_group_metadata cgm
SET code_type = 'TENANT'
WHERE EXISTS (
    SELECT 1 FROM common_codes cc
    WHERE cc.code_group = cgm.group_name
      AND cc.code_group IN (
          'CONSULTATION_PACKAGE', 'PACKAGE_TYPE', 'PAYMENT_METHOD', 'SPECIALTY',
          'CONSULTATION_TYPE', 'MAPPING_STATUS', 'RESPONSIBILITY', 'CONSULTANT_GRADE'
      )
)
  AND (cgm.code_type IS NULL OR cgm.code_type != 'TENANT');

INSERT INTO code_group_metadata (group_name, code_type, korean_name, description, is_active, display_order)
SELECT DISTINCT
    cc.code_group,
    'TENANT',
    cc.code_group,
    CONCAT(cc.code_group, ' 코드 그룹'),
    true,
    100
FROM common_codes cc
WHERE cc.code_group IN (
    'CONSULTATION_PACKAGE', 'PACKAGE_TYPE', 'PAYMENT_METHOD', 'SPECIALTY',
    'CONSULTATION_TYPE', 'MAPPING_STATUS', 'RESPONSIBILITY', 'CONSULTANT_GRADE'
)
  AND NOT EXISTS (SELECT 1 FROM code_group_metadata cgm WHERE cgm.group_name = cc.code_group)
ON DUPLICATE KEY UPDATE code_type = 'TENANT';
