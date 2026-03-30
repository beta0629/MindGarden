-- 테마 시스템을 위한 데이터베이스 마이그레이션 스크립트
-- User 테이블에 테마 관련 컬럼 추가

-- 1. 테마 설정 컬럼 추가
ALTER TABLE users 
ADD COLUMN theme_preference VARCHAR(50) DEFAULT NULL COMMENT '테마 설정 (client, consultant, admin)';

-- 2. 커스텀 테마 색상 컬럼 추가
ALTER TABLE users 
ADD COLUMN custom_theme_colors TEXT DEFAULT NULL COMMENT '커스텀 테마 색상 (JSON 형태로 저장)';

-- 3. 인덱스 추가 (테마 설정으로 검색할 때 성능 향상)
CREATE INDEX idx_users_theme_preference ON users(theme_preference);

-- 4. 기존 사용자들의 역할별 기본 테마 설정
UPDATE users 
SET theme_preference = CASE 
    WHEN role = 'CLIENT' OR role = 'ROLE_CLIENT' THEN 'client'
    WHEN role = 'CONSULTANT' OR role = 'ROLE_CONSULTANT' THEN 'consultant'
    WHEN role = 'ADMIN' OR role = 'ROLE_ADMIN' OR role = 'SUPER_ADMIN' OR role = 'BRANCH_SUPER_ADMIN' THEN 'admin'
    ELSE 'admin'
END
WHERE theme_preference IS NULL;

-- 5. 테마 설정 검증을 위한 체크 제약조건 추가
ALTER TABLE users 
ADD CONSTRAINT chk_theme_preference 
CHECK (theme_preference IN ('client', 'consultant', 'admin') OR theme_preference IS NULL);

-- 6. 커스텀 테마 색상 JSON 유효성 검사를 위한 트리거 생성 (MySQL 5.7+)
DELIMITER $$

CREATE TRIGGER validate_custom_theme_colors
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
    IF NEW.custom_theme_colors IS NOT NULL THEN
        -- JSON 유효성 검사
        IF JSON_VALID(NEW.custom_theme_colors) = 0 THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'custom_theme_colors must be valid JSON';
        END IF;
    END IF;
END$$

CREATE TRIGGER validate_custom_theme_colors_update
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    IF NEW.custom_theme_colors IS NOT NULL THEN
        -- JSON 유효성 검사
        IF JSON_VALID(NEW.custom_theme_colors) = 0 THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'custom_theme_colors must be valid JSON';
        END IF;
    END IF;
END$$

DELIMITER ;

-- 7. 테마 통계를 위한 뷰 생성
CREATE VIEW theme_statistics AS
SELECT 
    theme_preference,
    COUNT(*) as user_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users WHERE is_deleted = false), 2) as percentage
FROM users 
WHERE is_deleted = false
GROUP BY theme_preference
ORDER BY user_count DESC;

-- 8. 테마 설정 변경 이력을 위한 테이블 생성 (선택사항)
CREATE TABLE theme_change_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    old_theme VARCHAR(50),
    new_theme VARCHAR(50) NOT NULL,
    old_custom_colors TEXT,
    new_custom_colors TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_theme_history_user_id (user_id),
    INDEX idx_theme_history_changed_at (changed_at)
) COMMENT '테마 설정 변경 이력';

-- 9. 테마 설정 변경 이력 트리거 생성
DELIMITER $$

CREATE TRIGGER log_theme_change_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    IF NEW.theme_preference IS NOT NULL THEN
        INSERT INTO theme_change_history (
            user_id, 
            old_theme, 
            new_theme, 
            old_custom_colors, 
            new_custom_colors,
            changed_at
        ) VALUES (
            NEW.id,
            NULL,
            NEW.theme_preference,
            NULL,
            NEW.custom_theme_colors,
            NOW()
        );
    END IF;
END$$

CREATE TRIGGER log_theme_change_update
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    IF OLD.theme_preference != NEW.theme_preference OR OLD.custom_theme_colors != NEW.custom_theme_colors THEN
        INSERT INTO theme_change_history (
            user_id, 
            old_theme, 
            new_theme, 
            old_custom_colors, 
            new_custom_colors,
            changed_at
        ) VALUES (
            NEW.id,
            OLD.theme_preference,
            NEW.theme_preference,
            OLD.custom_theme_colors,
            NEW.custom_theme_colors,
            NOW()
        );
    END IF;
END$$

DELIMITER ;

-- 10. 롤백 스크립트 (필요시 사용)
/*
-- 테마 관련 모든 변경사항 롤백
DROP TRIGGER IF EXISTS log_theme_change_update;
DROP TRIGGER IF EXISTS log_theme_change_insert;
DROP TRIGGER IF EXISTS validate_custom_theme_colors_update;
DROP TRIGGER IF EXISTS validate_custom_theme_colors;

DROP TABLE IF EXISTS theme_change_history;
DROP VIEW IF EXISTS theme_statistics;

ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_theme_preference;
DROP INDEX IF EXISTS idx_users_theme_preference ON users;
ALTER TABLE users DROP COLUMN IF EXISTS custom_theme_colors;
ALTER TABLE users DROP COLUMN IF EXISTS theme_preference;
*/

-- 11. 마이그레이션 완료 확인 쿼리
SELECT 
    'Migration completed successfully' as status,
    COUNT(*) as total_users,
    COUNT(theme_preference) as users_with_theme,
    COUNT(custom_theme_colors) as users_with_custom_colors
FROM users 
WHERE is_deleted = false;
