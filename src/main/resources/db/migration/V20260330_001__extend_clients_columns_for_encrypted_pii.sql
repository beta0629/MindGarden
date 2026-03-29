-- clients PII 컬럼: users 테이블 암호문(최대 500) 복사 시 truncation 방지
-- AdminServiceImpl registerClient / updateClient 가 savedUser 값을 Client 에 그대로 저장함
-- @author CoreSolution
-- @since 2026-03-30
ALTER TABLE clients
    MODIFY COLUMN name VARCHAR(500) COLLATE utf8mb4_unicode_ci NOT NULL,
    MODIFY COLUMN email VARCHAR(500) COLLATE utf8mb4_unicode_ci NOT NULL,
    MODIFY COLUMN phone VARCHAR(500) COLLATE utf8mb4_unicode_ci NULL,
    MODIFY COLUMN gender VARCHAR(500) COLLATE utf8mb4_unicode_ci NULL,
    MODIFY COLUMN address VARCHAR(500) COLLATE utf8mb4_unicode_ci NULL,
    MODIFY COLUMN emergency_contact VARCHAR(500) COLLATE utf8mb4_unicode_ci NULL,
    MODIFY COLUMN emergency_phone VARCHAR(500) COLLATE utf8mb4_unicode_ci NULL;
