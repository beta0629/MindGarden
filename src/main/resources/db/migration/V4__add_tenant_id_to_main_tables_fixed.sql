-- ============================================
-- V4__add_tenant_id_to_main_tables_fixed.sql: Flyway 호환 형식으로 변환
-- 원본 파일: V4__add_tenant_id_to_main_tables_fixed.sql.backup
-- 변환일: 1766801923.9424293
-- ============================================
-- 주의: DELIMITER를 제거하고 프로시저 본문을 동적으로 생성하여 실행
-- ============================================

DROP PROCEDURE IF EXISTS add_column_if_not_exists;

-- 프로시저 본문 (세미콜론 포함)
-- 주의: Flyway가 세미콜론으로 구문을 분리하므로, 
--       이 프로시저는 Java 코드(PlSqlInitializer)에서 실행됩니다.
--       또는 allowMultiQueries=true로 Connection을 설정하여 실행해야 합니다.

CREATE PROCEDURE add_column_if_not_exists(
    IN p_table_name VARCHAR(64),
    IN p_column_name VARCHAR(64),
    IN p_column_definition TEXT,
    IN p_after_column VARCHAR(64)
)
BEGIN
    DECLARE v_column_exists INT DEFAULT 0;
    DECLARE v_after_column_exists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO v_column_exists
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = p_table_name
      AND COLUMN_NAME = p_column_name;
    
    IF v_column_exists = 0 THEN
        SET @sql = CONCAT('ALTER TABLE ', p_table_name, ' ADD COLUMN ', p_column_name, ' ', p_column_definition);
        IF p_after_column IS NOT NULL AND p_after_column != '' THEN
            -- AFTER 컬럼이 존재하는지 확인
            SELECT COUNT(*) INTO v_after_column_exists
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = @dbname
              AND TABLE_NAME = p_table_name
              AND COLUMN_NAME = p_after_column;
            
            IF v_after_column_exists > 0 THEN
                SET @sql = CONCAT(@sql, ' AFTER ', p_after_column);
            END IF;
        END IF;
        
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END;

-- ============================================
-- 참고: 이 프로시저는 다음 방법 중 하나로 실행됩니다:
-- 1. Java 코드에서 Connection을 직접 사용하여 실행 (PlSqlInitializer)
-- 2. allowMultiQueries=true로 Connection을 설정하여 실행
-- 3. mysql 클라이언트에서 직접 실행
-- ============================================
