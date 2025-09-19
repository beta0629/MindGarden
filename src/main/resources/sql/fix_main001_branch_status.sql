-- MAIN001 지점 상태 수정
-- PLANNING → ACTIVE 상태로 변경하여 상담사 등록 오류 해결

UPDATE branches 
SET 
    branch_status = 'ACTIVE',
    branch_name = '본점',
    updated_at = NOW()
WHERE branch_code = 'MAIN001' AND branch_status = 'PLANNING';

-- 결과 확인
SELECT 
    branch_code, 
    branch_name, 
    branch_status, 
    is_deleted,
    updated_at
FROM branches 
WHERE branch_code = 'MAIN001';
