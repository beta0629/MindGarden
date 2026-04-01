-- =====================================================
-- 런타임 조회 시 zero-date 예외 방지용 데이터 정리
-- 작성일: 2026-03-30
-- 설명: 0000-00-00 / 0000-00-00 00:00:00 값을 NULL로 치환
-- 주의: NULL 허용 컬럼만 대상으로 제한
-- =====================================================

SET @__v20260330_002_prev_sql_mode = @@SESSION.sql_mode;
SET SESSION sql_mode = REPLACE(
    REPLACE(
        REPLACE(REPLACE(@@SESSION.sql_mode, 'NO_ZERO_DATE', ''), 'NO_ZERO_IN_DATE', ''),
        ',,',
        ','
    ),
    ',,',
    ','
);

SET @users_birth_date_nullable = (
    SELECT IS_NULLABLE
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'birth_date'
    LIMIT 1
);
SET @users_birth_date_sql = IF(
    @users_birth_date_nullable = 'YES',
    'UPDATE users SET birth_date = NULL WHERE birth_date = ''0000-00-00''',
    'SELECT 1'
);
PREPARE users_birth_date_stmt FROM @users_birth_date_sql;
EXECUTE users_birth_date_stmt;
DEALLOCATE PREPARE users_birth_date_stmt;

SET @users_last_login_nullable = (
    SELECT IS_NULLABLE
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'last_login_at'
    LIMIT 1
);
SET @users_last_login_sql = IF(
    @users_last_login_nullable = 'YES',
    'UPDATE users SET last_login_at = NULL WHERE last_login_at = ''0000-00-00 00:00:00''',
    'SELECT 1'
);
PREPARE users_last_login_stmt FROM @users_last_login_sql;
EXECUTE users_last_login_stmt;
DEALLOCATE PREPARE users_last_login_stmt;

SET @users_email_verify_nullable = (
    SELECT IS_NULLABLE
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'email_verification_expires_at'
    LIMIT 1
);
SET @users_email_verify_sql = IF(
    @users_email_verify_nullable = 'YES',
    'UPDATE users SET email_verification_expires_at = NULL WHERE email_verification_expires_at = ''0000-00-00 00:00:00''',
    'SELECT 1'
);
PREPARE users_email_verify_stmt FROM @users_email_verify_sql;
EXECUTE users_email_verify_stmt;
DEALLOCATE PREPARE users_email_verify_stmt;

SET @users_password_reset_nullable = (
    SELECT IS_NULLABLE
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'password_reset_expires_at'
    LIMIT 1
);
SET @users_password_reset_sql = IF(
    @users_password_reset_nullable = 'YES',
    'UPDATE users SET password_reset_expires_at = NULL WHERE password_reset_expires_at = ''0000-00-00 00:00:00''',
    'SELECT 1'
);
PREPARE users_password_reset_stmt FROM @users_password_reset_sql;
EXECUTE users_password_reset_stmt;
DEALLOCATE PREPARE users_password_reset_stmt;

SET @clients_birth_date_nullable = (
    SELECT IS_NULLABLE
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'clients'
      AND COLUMN_NAME = 'birth_date'
    LIMIT 1
);
SET @clients_birth_date_sql = IF(
    @clients_birth_date_nullable = 'YES',
    'UPDATE clients SET birth_date = NULL WHERE birth_date = ''0000-00-00''',
    'SELECT 1'
);
PREPARE clients_birth_date_stmt FROM @clients_birth_date_sql;
EXECUTE clients_birth_date_stmt;
DEALLOCATE PREPARE clients_birth_date_stmt;

SET SESSION sql_mode = @__v20260330_002_prev_sql_mode;
