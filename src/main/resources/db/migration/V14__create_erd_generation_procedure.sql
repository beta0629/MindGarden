-- ============================================
-- Week 3 Day 4: ERD 생성 PL/SQL 프로시저
-- ============================================
-- 목적: 온보딩 승인 시 ERD 자동 생성 (PL/SQL 코어 로직)
-- 작성일: 2025-01-XX
-- 주의: 개발 서버 DB에 직접 적용
-- ============================================

DELIMITER //

-- ============================================
-- ERD 생성 프로시저 (온보딩 승인 시 호출)
-- ============================================
CREATE PROCEDURE GenerateErdOnOnboardingApproval(
    IN p_tenant_id VARCHAR(36),
    IN p_tenant_name VARCHAR(255),
    IN p_business_type VARCHAR(50),
    IN p_approved_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
BEGIN
    DECLARE v_diagram_id VARCHAR(36);
    DECLARE v_mermaid_code TEXT;
    DECLARE v_text_erd TEXT;
    DECLARE v_error_message VARCHAR(500);
    DECLARE v_table_name VARCHAR(255);
    DECLARE v_column_name VARCHAR(255);
    DECLARE v_data_type VARCHAR(100);
    DECLARE v_is_nullable VARCHAR(3);
    DECLARE v_column_key VARCHAR(3);
    DECLARE v_referenced_table VARCHAR(255);
    DECLARE v_referenced_column VARCHAR(255);
    DECLARE done INT DEFAULT FALSE;
    
    DECLARE cur_tables CURSOR FOR
        SELECT DISTINCT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_TYPE = 'BASE TABLE'
            AND (
                -- tenant_id 컬럼이 있는 테이블
                TABLE_NAME IN (
                    SELECT DISTINCT TABLE_NAME
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE()
                        AND COLUMN_NAME = 'tenant_id'
                )
                -- 또는 공통 테이블
                OR TABLE_NAME IN ('tenants', 'branches', 'auth_users', 'staff_accounts', 'consumer_accounts')
            )
        ORDER BY TABLE_NAME;
    
    DECLARE cur_columns CURSOR FOR
        SELECT 
            COLUMN_NAME,
            DATA_TYPE,
            IS_NULLABLE,
            COLUMN_KEY
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = v_table_name
        ORDER BY ORDINAL_POSITION;
    
    DECLARE cur_foreign_keys CURSOR FOR
        SELECT 
            REFERENCED_TABLE_NAME,
            REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = v_table_name
            AND REFERENCED_TABLE_NAME IS NOT NULL;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('ERD 생성 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- ERD 다이어그램 ID 생성
    SET v_diagram_id = UUID();
    
    -- Mermaid ERD 코드 초기화
    SET v_mermaid_code = CONCAT('erDiagram\n');
    SET v_text_erd = CONCAT('=== ERD (텍스트 형식) ===\n\n');
    
    -- 테이블 정의 생성
    OPEN cur_tables;
    table_loop: LOOP
        FETCH cur_tables INTO v_table_name;
        IF done THEN
            SET done = FALSE;
            LEAVE table_loop;
        END IF;
        
        -- 테이블 정의 시작
        SET v_mermaid_code = CONCAT(v_mermaid_code, '    ', v_table_name, ' {\n');
        SET v_text_erd = CONCAT(v_text_erd, '테이블: ', v_table_name, '\n');
        
        -- 컬럼 정보 추가
        OPEN cur_columns;
        column_loop: LOOP
            FETCH cur_columns INTO v_column_name, v_data_type, v_is_nullable, v_column_key;
            IF done THEN
                SET done = FALSE;
                LEAVE column_loop;
            END IF;
            
            -- Mermaid 형식
            SET v_mermaid_code = CONCAT(
                v_mermaid_code,
                '        ',
                v_data_type, ' ',
                v_column_name,
                CASE 
                    WHEN v_column_key = 'PRI' THEN ' PK'
                    WHEN v_column_key = 'UNI' THEN ' UK'
                    WHEN v_column_key = 'MUL' THEN ' FK'
                    ELSE ''
                END,
                CASE WHEN v_is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END,
                '\n'
            );
            
            -- 텍스트 형식
            SET v_text_erd = CONCAT(
                v_text_erd,
                '  - ',
                v_column_name,
                ' (', v_data_type, ')',
                CASE 
                    WHEN v_column_key = 'PRI' THEN ' PK'
                    WHEN v_column_key = 'UNI' THEN ' UK'
                    WHEN v_column_key = 'MUL' THEN ' FK'
                    ELSE ''
                END,
                CASE WHEN v_is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END,
                '\n'
            );
        END LOOP;
        CLOSE cur_columns;
        
        SET v_mermaid_code = CONCAT(v_mermaid_code, '    }\n');
        SET v_text_erd = CONCAT(v_text_erd, '\n');
    END LOOP;
    CLOSE cur_tables;
    
    -- 관계 정의 추가
    OPEN cur_tables;
    SET done = FALSE;
    relationship_loop: LOOP
        FETCH cur_tables INTO v_table_name;
        IF done THEN
            LEAVE relationship_loop;
        END IF;
        
        OPEN cur_foreign_keys;
        fk_loop: LOOP
            FETCH cur_foreign_keys INTO v_referenced_table, v_referenced_column;
            IF done THEN
                SET done = FALSE;
                LEAVE fk_loop;
            END IF;
            
            SET v_mermaid_code = CONCAT(
                v_mermaid_code,
                '    ',
                v_referenced_table,
                ' ||--o{ ',
                v_table_name,
                ' : "has"\n'
            );
        END LOOP;
        CLOSE cur_foreign_keys;
    END LOOP;
    CLOSE cur_tables;
    
    -- ERD 메타데이터 저장
    INSERT INTO erd_diagrams (
        diagram_id,
        tenant_id,
        name,
        description,
        diagram_type,
        module_type,
        mermaid_code,
        text_erd,
        version,
        is_active,
        is_public,
        trigger_source,
        created_at,
        updated_at,
        created_by
    ) VALUES (
        v_diagram_id,
        p_tenant_id,
        CONCAT('테넌트 ERD: ', p_tenant_name),
        CONCAT('온보딩 승인 시 자동 생성된 ERD (업종: ', p_business_type, ')'),
        'TENANT',
        p_business_type,
        v_mermaid_code,
        v_text_erd,
        1,
        TRUE,
        TRUE,
        'ONBOARDING_APPROVAL',
        NOW(),
        NOW(),
        p_approved_by
    );
    
    -- 변경 이력 기록
    INSERT INTO erd_diagram_history (
        diagram_id,
        version,
        change_type,
        change_description,
        mermaid_code,
        changed_by,
        changed_at
    ) VALUES (
        v_diagram_id,
        1,
        'CREATED',
        '온보딩 승인 시 자동 생성',
        v_mermaid_code,
        p_approved_by,
        NOW()
    );
    
    SET p_success = TRUE;
    SET p_message = CONCAT('ERD 생성 완료: diagram_id=', v_diagram_id);
    
    COMMIT;
END //

DELIMITER ;

