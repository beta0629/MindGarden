-- users.user_id 전역 UNIQUE 를 (tenant_id, user_id) 복합 UNIQUE 로 바꾼다.
-- UK_r43af9ap4edm43mmtq01oddj6 와 UK_users_user_id 는 둘 다 user_id 단독이며
-- soft-delete 행까지 포함한다. 다른 테넌트의 삭제된 user_id 가 신규 테넌트 INSERT 를 막는다.
-- 기존 행은 UPDATE/DELETE 하지 않는다. (tenant_id, user_id) 중복이 있으면 중단한다.
-- 적용 전 확인 (tenant_id 가 NULL 인 행은 MySQL UNIQUE 가 서로 다르다고 보므로 제외):
--   SELECT tenant_id, user_id, COUNT(*) AS cnt
--   FROM users
--   WHERE tenant_id IS NOT NULL
--   GROUP BY tenant_id, user_id
--   HAVING COUNT(*) > 1;

SET @dbname = DATABASE();

SET @duplicateCount = (
    SELECT COALESCE(SUM(dup_cnt - 1), 0)
    FROM (
        SELECT COUNT(*) AS dup_cnt
        FROM users
        WHERE tenant_id IS NOT NULL
        GROUP BY tenant_id, user_id
        HAVING COUNT(*) > 1
    ) AS dup_groups
);

SET @msg = CONCAT(
    'V20261011_001 ABORT — users (tenant_id, user_id) duplicate groups remain: ',
    @duplicateCount
);

SET @preparedStatement = (SELECT IF(
    @duplicateCount > 0,
    CONCAT('SIGNAL SQLSTATE ''45000'' SET MESSAGE_TEXT = ''', REPLACE(@msg, '''', ''''''), ''''),
    'SELECT 1'
));
PREPARE abortIfTenantUserIdDuplicates FROM @preparedStatement;
EXECUTE abortIfTenantUserIdDuplicates;
DEALLOCATE PREPARE abortIfTenantUserIdDuplicates;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = @dbname
       AND TABLE_NAME = 'users'
       AND INDEX_NAME = 'UK_users_tenant_user_id') > 0,
    'SELECT 1',
    'ALTER TABLE users ADD CONSTRAINT UK_users_tenant_user_id UNIQUE (tenant_id, user_id)'
));
PREPARE addTenantUserIdUnique FROM @preparedStatement;
EXECUTE addTenantUserIdUnique;
DEALLOCATE PREPARE addTenantUserIdUnique;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = @dbname
       AND TABLE_NAME = 'users'
       AND INDEX_NAME = 'UK_r43af9ap4edm43mmtq01oddj6') > 0,
    'ALTER TABLE users DROP INDEX UK_r43af9ap4edm43mmtq01oddj6',
    'SELECT 1'
));
PREPARE dropHibernateUserIdUnique FROM @preparedStatement;
EXECUTE dropHibernateUserIdUnique;
DEALLOCATE PREPARE dropHibernateUserIdUnique;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = @dbname
       AND TABLE_NAME = 'users'
       AND INDEX_NAME = 'UK_users_user_id') > 0,
    'ALTER TABLE users DROP INDEX UK_users_user_id',
    'SELECT 1'
));
PREPARE dropNamedUserIdUnique FROM @preparedStatement;
EXECUTE dropNamedUserIdUnique;
DEALLOCATE PREPARE dropNamedUserIdUnique;
