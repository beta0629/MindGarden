-- HQ 및 BRANCH 관련 역할 코드 삭제
-- 브랜치 개념이 제거되어 테넌트 기반으로 변경됨
-- 
-- @author MindGarden
-- @version 1.0.0
-- @since 2025-12-04

-- HQ 관련 역할 코드 삭제
DELETE FROM common_codes 
WHERE code_group = 'USER_ROLE' 
  AND code_value IN (
    'HQ_ADMIN',
    'SUPER_HQ_ADMIN',
    'HQ_MASTER',
    'HQ_SUPER_ADMIN'
  );

-- BRANCH 관련 역할 코드 삭제
DELETE FROM common_codes 
WHERE code_group = 'USER_ROLE' 
  AND code_value IN (
    'BRANCH_ADMIN',
    'BRANCH_SUPER_ADMIN',
    'BRANCH_MANAGER'
  );

-- ROLE 그룹에도 동일하게 적용 (혹시 있을 경우)
DELETE FROM common_codes 
WHERE code_group = 'ROLE' 
  AND code_value IN (
    'HQ_ADMIN',
    'SUPER_HQ_ADMIN',
    'HQ_MASTER',
    'HQ_SUPER_ADMIN',
    'BRANCH_ADMIN',
    'BRANCH_SUPER_ADMIN',
    'BRANCH_MANAGER'
  );

-- 삭제된 코드 수 확인 (로깅용)
SELECT 
    COUNT(*) as deleted_count,
    'HQ 및 BRANCH 관련 역할 코드 삭제 완료' as message
FROM common_codes 
WHERE code_group IN ('USER_ROLE', 'ROLE')
  AND code_value IN (
    'HQ_ADMIN', 'SUPER_HQ_ADMIN', 'HQ_MASTER', 'HQ_SUPER_ADMIN',
    'BRANCH_ADMIN', 'BRANCH_SUPER_ADMIN', 'BRANCH_MANAGER'
  );

