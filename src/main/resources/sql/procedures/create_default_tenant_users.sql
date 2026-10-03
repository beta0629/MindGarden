-- CreateDefaultTenantUsers
-- 개발 서버 PlSqlInitializer 가 기동 때마다 이 파일을 강제 적용한다.
-- 비교: V57 은 users.username 을 INSERT 한 뒤 EXIT HANDLER 가 ROLLBACK 한다.
-- V20251208_002 가 username 을 user_id 로 바꿨으므로 그 INSERT 는 1054 로 바로 실패하고
-- ROLLBACK 이 승인 트랜잭션 전체를 끝낸다.
-- 샘플 사용자는 테넌트·관리자 커밋에 포함하지 않는다.

DROP PROCEDURE IF EXISTS CreateDefaultTenantUsers;

DELIMITER $$

CREATE PROCEDURE CreateDefaultTenantUsers(
    IN p_tenant_id VARCHAR(64),
    IN p_business_type VARCHAR(50),
    IN p_created_by VARCHAR(100),
    OUT p_success BOOLEAN,
    OUT p_message TEXT
)
proc_label: BEGIN
    SET p_success = TRUE;
    SET p_message = '승인 트랜잭션에서는 샘플 사용자를 만들지 않습니다.';
END$$

DELIMITER ;
