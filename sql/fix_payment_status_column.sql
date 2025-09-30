-- payment_status 컬럼 크기 수정
-- 새로운 enum 값들을 수용할 수 있도록 VARCHAR 크기를 늘림

ALTER TABLE consultant_client_mappings 
MODIFY COLUMN payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING';

-- 변경 사항 확인
DESCRIBE consultant_client_mappings;
