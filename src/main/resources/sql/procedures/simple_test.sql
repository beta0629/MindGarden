-- =====================================================
-- 간단한 테스트용 PL/SQL 프로시저
-- =====================================================

DELIMITER //

CREATE PROCEDURE TestMappingSync()
BEGIN
    SELECT 'PL/SQL 매핑 동기화 테스트 성공' as message;
END //

DELIMITER ;
