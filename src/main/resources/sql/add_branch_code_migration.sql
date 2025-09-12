-- 지점코드 컬럼 추가 마이그레이션
-- 실행일: 2025-01-11
-- 설명: 모든 주요 테이블에 branch_code 컬럼 추가

-- 1. schedules 테이블에 branch_code 컬럼 추가
ALTER TABLE schedules 
ADD COLUMN branch_code VARCHAR(20) DEFAULT 'MAIN001' COMMENT '지점코드';

-- 2. consultant_client_mappings 테이블에 branch_code 컬럼 추가
ALTER TABLE consultant_client_mappings 
ADD COLUMN branch_code VARCHAR(20) DEFAULT 'MAIN001' COMMENT '지점코드';

-- 3. users 테이블에 branch_code 컬럼이 이미 있는지 확인하고 없으면 추가
-- (users 테이블은 이미 branch_code가 있을 것으로 예상되지만 안전하게 처리)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS branch_code VARCHAR(20) DEFAULT 'MAIN001' COMMENT '지점코드';

-- 4. clients 테이블에 branch_code 컬럼이 이미 있는지 확인하고 없으면 추가
-- (clients는 users를 상속받으므로 별도로 추가할 필요 없을 수 있지만 안전하게 처리)
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS branch_code VARCHAR(20) DEFAULT 'MAIN001' COMMENT '지점코드';

-- 5. consultants 테이블에 branch_code 컬럼이 이미 있는지 확인하고 없으면 추가
-- (consultants는 users를 상속받으므로 별도로 추가할 필요 없을 수 있지만 안전하게 처리)
ALTER TABLE consultants 
ADD COLUMN IF NOT EXISTS branch_code VARCHAR(20) DEFAULT 'MAIN001' COMMENT '지점코드';

-- 6. 기존 데이터에 기본 지점코드 설정 (NULL인 경우)
UPDATE schedules SET branch_code = 'MAIN001' WHERE branch_code IS NULL;
UPDATE consultant_client_mappings SET branch_code = 'MAIN001' WHERE branch_code IS NULL;
UPDATE users SET branch_code = 'MAIN001' WHERE branch_code IS NULL;
UPDATE clients SET branch_code = 'MAIN001' WHERE branch_code IS NULL;
UPDATE consultants SET branch_code = 'MAIN001' WHERE branch_code IS NULL;

-- 7. 인덱스 추가 (성능 최적화)
CREATE INDEX idx_schedules_branch_code ON schedules(branch_code);
CREATE INDEX idx_mappings_branch_code ON consultant_client_mappings(branch_code);
CREATE INDEX idx_users_branch_code ON users(branch_code);

-- 8. 마이그레이션 완료 로그
SELECT 'Branch code migration completed successfully' as status;
