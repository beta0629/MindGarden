-- ============================================
-- 사용자 이메일로 삭제 스크립트
-- ============================================
-- 목적: 이메일로 사용자 및 관련 데이터 삭제
-- 사용법: mysql -u [user] -p [database] < delete_user_by_email.sql
--        또는 직접 실행: CALL DeleteUserByEmail('user@example.com');
-- 작성일: 2025-12-10
-- ============================================

DELIMITER //

DROP PROCEDURE IF EXISTS DeleteUserByEmail //

CREATE PROCEDURE DeleteUserByEmail(
    IN p_email VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    OUT p_success BOOLEAN,
    OUT p_message TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
)
BEGIN
    DECLARE v_user_id BIGINT;
    DECLARE v_user_count INT DEFAULT 0;
    DECLARE v_deleted_assignments INT DEFAULT 0;
    DECLARE v_error_message VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            v_error_message = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('사용자 삭제 중 오류 발생: ', v_error_message);
    END;
    
    START TRANSACTION;
    
    -- 이메일 정규화
    SET p_email = LOWER(TRIM(p_email));
    
    -- 사용자 존재 확인
    SELECT COUNT(*), MAX(id) INTO v_user_count, v_user_id
    FROM users
    WHERE email COLLATE utf8mb4_unicode_ci = p_email COLLATE utf8mb4_unicode_ci
      AND (is_deleted IS NULL OR is_deleted = FALSE);
    
    IF v_user_count = 0 THEN
        SET p_success = FALSE;
        SET p_message = CONCAT('사용자를 찾을 수 없습니다: ', p_email);
        ROLLBACK;
    ELSE
        -- 1. 역할 할당 삭제
        DELETE FROM user_role_assignments
        WHERE user_id = v_user_id
          AND (is_deleted IS NULL OR is_deleted = FALSE);
        
        SET v_deleted_assignments = ROW_COUNT();
        
        -- 2. 사용자 삭제
        DELETE FROM users
        WHERE id = v_user_id
          AND (is_deleted IS NULL OR is_deleted = FALSE);
        
        IF ROW_COUNT() > 0 THEN
            SET p_success = TRUE;
            SET p_message = CONCAT('사용자 삭제 완료: ', p_email, ' (역할 할당 ', v_deleted_assignments, '개 삭제)');
            COMMIT;
        ELSE
            SET p_success = FALSE;
            SET p_message = CONCAT('사용자 삭제 실패: ', p_email);
            ROLLBACK;
        END IF;
    END IF;
END //

DELIMITER ;

-- ============================================
-- 사용 예시
-- ============================================
-- CALL DeleteUserByEmail('user@example.com', @success, @message);
-- SELECT @success, @message;

