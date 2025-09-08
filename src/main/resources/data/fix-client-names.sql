-- 내담자 이름이 null인 경우 기본값으로 수정
UPDATE clients 
SET name = 'Unknown Client' 
WHERE name IS NULL OR name = '';

-- 수정된 내담자 수 확인
SELECT COUNT(*) as updated_clients 
FROM clients 
WHERE name = 'Unknown Client';

-- 모든 내담자 이름 확인
SELECT id, name, email, created_at 
FROM clients 
ORDER BY created_at DESC;
