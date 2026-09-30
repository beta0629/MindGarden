-- users.tokens_invalidated_at — 계정 단위 JWT 폐기 기준 시각(관리자 강제 로그아웃 등 계정 전체 세션 종료 시에만 기록).
-- 이 시각 이전에 발급된 Access/Refresh JWT 는 거부된다. 일반 로그인·로그아웃은 갱신하지 않는다.
-- 추가 전용(nullable) — 기존 행은 NULL 로 두며 데이터 변경 없음.
-- @author MindGarden
-- @since 2026-09-30

SET @db := DATABASE();

SET @ddl_col := IF(
    (SELECT COUNT(*)
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db
       AND TABLE_NAME = 'users'
       AND COLUMN_NAME = 'tokens_invalidated_at') = 0,
    'ALTER TABLE users ADD COLUMN tokens_invalidated_at DATETIME NULL COMMENT ''계정 단위 JWT 폐기 기준 시각(이전 발급 토큰 거부)'' AFTER last_login_at',
    'SELECT 1'
);
PREPARE stmt_col FROM @ddl_col;
EXECUTE stmt_col;
DEALLOCATE PREPARE stmt_col;
