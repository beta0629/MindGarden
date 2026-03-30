-- ============================================
-- 이메일 패턴으로 여러 사용자 삭제 스크립트
-- ============================================
-- 목적: 이메일 패턴으로 여러 사용자 및 관련 데이터 일괄 삭제
-- 사용법: mysql -u [user] -p [database] < delete_users_by_email_pattern.sql
--        또는 직접 실행: CALL DeleteUsersByEmailPattern('beta0629', @deleted_count, @message);
-- 작성일: 2025-12-10
-- 주의: LIKE 패턴을 사용하므로 주의해서 사용할 것
-- ============================================

DELIMITER //

DROP PROCEDURE IF EXISTS DeleteUsersByEmailPattern //

CREATE PROCEDURE DeleteUsersByEmailPattern(
    IN p_email_pattern VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    OUT p_deleted_count INT,
    OUT p_message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_user_count INT DEFAULT 0;
    DECLARE v_deleted_assignments INT DEFAULT 0;
    DECLARE v_deleted_users INT DEFAULT 0;
    DECLARE v_error_message VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_deleted_count = 0;
        SET p_message = CONCAT('사용자 삭제 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 이메일 패턴 정규화 (LIKE 패턴으로 변환)
    IF p_email_pattern NOT LIKE '%@%' THEN
        SET p_email_pattern = CONCAT('%', p_email_pattern, '%');
    END IF;
    
    -- 일치하는 사용자 수 확인
    SELECT COUNT(*) INTO v_user_count
    FROM users
    WHERE email COLLATE utf8mb4_unicode_ci LIKE p_email_pattern COLLATE utf8mb4_unicode_ci
      AND (is_deleted IS NULL OR is_deleted = FALSE);
    
    IF v_user_count = 0 THEN
        SET p_deleted_count = 0;
        SET p_message = CONCAT('일치하는 사용자를 찾을 수 없습니다: ', p_email_pattern);
        ROLLBACK;
    ELSE
        -- 참조 데이터 삭제 (외래키 제약 조건 해결 - 올바른 순서로)
        -- 1. session_extension_requests 삭제 (consultant_client_mappings를 참조하므로 먼저)
        DELETE ser FROM session_extension_requests ser
        INNER JOIN consultant_client_mappings ccm ON ser.mapping_id = ccm.id
        INNER JOIN users u ON (ccm.client_id = u.id OR ccm.consultant_id = u.id)
        WHERE u.email COLLATE utf8mb4_unicode_ci LIKE p_email_pattern COLLATE utf8mb4_unicode_ci;
        
        -- 2. consultant_client_mappings 삭제
        DELETE ccm FROM consultant_client_mappings ccm
        INNER JOIN users u ON (ccm.client_id = u.id OR ccm.consultant_id = u.id)
        WHERE u.email COLLATE utf8mb4_unicode_ci LIKE p_email_pattern COLLATE utf8mb4_unicode_ci;
        
        -- 3. user_role_assignments 삭제
        DELETE ura FROM user_role_assignments ura
        INNER JOIN users u ON ura.user_id = u.id
        WHERE u.email COLLATE utf8mb4_unicode_ci LIKE p_email_pattern COLLATE utf8mb4_unicode_ci
          AND (ura.is_deleted IS NULL OR ura.is_deleted = FALSE);
        
        SET v_deleted_assignments = ROW_COUNT();
        
        -- 4. user_sessions 삭제
        DELETE us FROM user_sessions us
        INNER JOIN users u ON us.user_id = u.id
        WHERE u.email COLLATE utf8mb4_unicode_ci LIKE p_email_pattern COLLATE utf8mb4_unicode_ci;
        
        -- 5. user_social_accounts 삭제
        DELETE usa FROM user_social_accounts usa
        INNER JOIN users u ON usa.user_id = u.id
        WHERE u.email COLLATE utf8mb4_unicode_ci LIKE p_email_pattern COLLATE utf8mb4_unicode_ci;
        
        -- 6. user_passkey 삭제
        DELETE up FROM user_passkey up
        INNER JOIN users u ON up.user_id = u.id
        WHERE u.email COLLATE utf8mb4_unicode_ci LIKE p_email_pattern COLLATE utf8mb4_unicode_ci;
        
        -- 7. password_reset_tokens 삭제
        DELETE prt FROM password_reset_tokens prt
        INNER JOIN users u ON prt.user_id = u.id
        WHERE u.email COLLATE utf8mb4_unicode_ci LIKE p_email_pattern COLLATE utf8mb4_unicode_ci;
        
        -- 8. consultant_ratings 삭제
        DELETE cr FROM consultant_ratings cr
        INNER JOIN users u ON (cr.consultant_id = u.id OR cr.client_id = u.id)
        WHERE u.email COLLATE utf8mb4_unicode_ci LIKE p_email_pattern COLLATE utf8mb4_unicode_ci;
        
        -- 9. consultants 테이블 삭제 (users를 참조)
        DELETE c FROM consultants c
        INNER JOIN users u ON c.id = u.id
        WHERE u.email COLLATE utf8mb4_unicode_ci LIKE p_email_pattern COLLATE utf8mb4_unicode_ci;
        
        -- 10. clients 테이블 삭제 (users를 참조)
        DELETE c FROM clients c
        INNER JOIN users u ON c.id = u.id
        WHERE u.email COLLATE utf8mb4_unicode_ci LIKE p_email_pattern COLLATE utf8mb4_unicode_ci;
        
        -- 11. 사용자 삭제 (모든 참조 삭제 후)
        -- 주의: 일부 비즈니스 데이터 테이블(asset_revenues, consultations, deposit_records 등)은
        --       데이터 무결성을 위해 삭제하지 않습니다. 필요시 수동으로 처리하세요.
        DELETE FROM users
        WHERE email COLLATE utf8mb4_unicode_ci LIKE p_email_pattern COLLATE utf8mb4_unicode_ci
          AND (is_deleted IS NULL OR is_deleted = FALSE);
        
        SET v_deleted_users = ROW_COUNT();
        
        IF v_deleted_users > 0 THEN
            SET p_deleted_count = v_deleted_users;
            SET p_message = CONCAT('사용자 ', v_deleted_users, '명 삭제 완료 (역할 할당 ', v_deleted_assignments, '개 삭제): ', p_email_pattern);
            COMMIT;
        ELSE
            SET p_deleted_count = 0;
            SET p_message = CONCAT('사용자 삭제 실패: ', p_email_pattern);
            ROLLBACK;
        END IF;
    END IF;
END //

DELIMITER ;

-- ============================================
-- 사용 예시
-- ============================================
-- -- 특정 이메일 패턴으로 삭제
-- CALL DeleteUsersByEmailPattern('beta0629', @deleted_count, @message);
-- SELECT @deleted_count, @message;
--
-- -- 전체 이메일로 삭제
-- CALL DeleteUsersByEmailPattern('beta0629@gmail.com', @deleted_count, @message);
-- SELECT @deleted_count, @message;

