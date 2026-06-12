-- =============================================================================
-- V20260612_002__branches_archive_and_fk_drop.sql
-- branches 테이블 ARCHIVE + 자식 테이블 branch_id FK 제거 + branches RENAME
--
-- 배경 (Role SSOT 9-PR 시리즈 PR-7/9)
-- - 사용자 결정: SSOT 4종 (ADMIN/STAFF/CONSULTANT/CLIENT) 정착 후 branch 개념 폐기.
-- - PR-3 (#280): BE Branch 클래스 @Deprecated + @ConditionalOnProperty (기본 false).
-- - PR-5 (#282): FE Branch UI 숨김 + LNB 메뉴 시드 필터.
-- - PR-6 (#283): users.role SSOT 4종 정규화 (V20260612_001).
-- - PR-7 (본 마이그레이션): branches 테이블 ARCHIVE + RENAME, 자식 테이블 FK 제거.
--
-- 안전 원칙 (PRE_PRODUCTION_GO_LIVE_CHECKLIST)
-- - branches 테이블은 **DROP 금지**, RENAME 만 사용한다 (1-2주 모니터링 후 별도 PR DROP).
-- - 자식 테이블의 branch_id **컬럼은 보존**한다.
--   ★ BE 엔티티(academy/UserRoleAssignment/RefreshToken/Payment/Account)가 여전히
--     @Column(name="branch_id") 로 매핑하고 있으며, 일부는 nullable=false 이다.
--     컬럼 DROP 시 Hibernate SELECT/INSERT 가 즉시 깨진다 — 별도 PR에서 BE 엔티티
--     매핑 제거 후 컬럼 DROP 으로 진행한다.
-- - 자식 테이블의 branches FK 만 제거한다 (branches RENAME 후 무결성 검증 안전망 정리).
-- - 운영 사용자 영향 0 — Branch UI 이미 숨김, BE Branch 빈 @ConditionalOnProperty false.
--
-- 자식 테이블 FK 인벤토리 (총 11개, 인벤토리 결과)
--   1. courses                       fk_courses_branches
--   2. classes                       fk_classes_branches
--   3. class_schedules               fk_class_schedules_branches
--   4. class_enrollments             fk_class_enrollments_branches
--   5. attendances                   fk_attendances_branches
--   6. academy_billing_schedules     fk_academy_billing_schedules_branches
--   7. academy_invoices              fk_academy_invoices_branches
--   8. academy_tuition_payments      fk_academy_tuition_payments_branches
--   9. academy_settlements           fk_academy_settlements_branches
--  10. academy_settlement_items      fk_academy_settlement_items_branches
--  11. user_role_assignments         fk_user_role_branch
--
-- DROP FOREIGN KEY 전략
-- - `ALTER TABLE … DROP FOREIGN KEY IF EXISTS` 는 MariaDB 10.5+/MySQL 8.0.29+ 만 지원.
-- - 운영 RDS MySQL 버전 게이트를 보수적으로 가정 — INFORMATION_SCHEMA 동적 조회 후
--   PREPARE/EXECUTE 패턴으로 처리하여 모든 MySQL 8.x 버전과 H2(MODE=MySQL) 호환.
--
-- 롤백 절차 (운영 모니터링 1-2주 후 문제 발생 시)
--   1) RENAME TABLE branches_dropped_20260612 TO branches;
--   2) (선택) 자식 테이블 FK 복원 — 본 마이그레이션의 FOREIGN KEY DDL 역방향 적용.
--   3) Branch 빈 @ConditionalOnProperty true 로 재활성화.
--
-- 참조
-- - docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md (PR-7/9)
-- - docs/standards/DATABASE_MIGRATION_STANDARD.md
-- - docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md
-- =============================================================================

-- =============================================================================
-- 1) branches 테이블 ARCHIVE (rollback 안전망)
--    - 본 테이블이 없으면 CREATE 단계 자체가 noop 이어야 하므로 IF NOT EXISTS 사용.
--    - SELECT * FROM branches 는 branches 테이블 존재 시에만 의미가 있음 — 부재 시
--      CREATE 가 실패할 수 있으므로 동적 SQL 로 안전 가드.
-- =============================================================================

SET @branches_exists := (
    SELECT COUNT(*)
      FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'branches'
);

SET @archive_stmt := IF(
    @branches_exists > 0,
    'CREATE TABLE IF NOT EXISTS branches_archive_20260612 AS SELECT * FROM branches',
    'DO 0'
);
PREPARE archive_stmt FROM @archive_stmt;
EXECUTE archive_stmt;
DEALLOCATE PREPARE archive_stmt;

-- =============================================================================
-- 2) 자식 테이블 FK 동적 DROP (총 11개)
--    - INFORMATION_SCHEMA.KEY_COLUMN_USAGE 로 (table_name, constraint_name) 쌍이
--      현재 스키마에 존재할 때만 ALTER TABLE … DROP FOREIGN KEY 수행.
--    - idempotent — 본 마이그레이션 재실행 또는 부재 환경에서도 noop.
-- =============================================================================

-- 2-1) courses.fk_courses_branches
SET @fk_exists := (
    SELECT COUNT(*)
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = 'courses'
       AND CONSTRAINT_NAME = 'fk_courses_branches'
       AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @stmt := IF(@fk_exists > 0,
    'ALTER TABLE courses DROP FOREIGN KEY fk_courses_branches',
    'DO 0');
PREPARE drop_fk_stmt FROM @stmt; EXECUTE drop_fk_stmt; DEALLOCATE PREPARE drop_fk_stmt;

-- 2-2) classes.fk_classes_branches
SET @fk_exists := (
    SELECT COUNT(*)
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = 'classes'
       AND CONSTRAINT_NAME = 'fk_classes_branches'
       AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @stmt := IF(@fk_exists > 0,
    'ALTER TABLE classes DROP FOREIGN KEY fk_classes_branches',
    'DO 0');
PREPARE drop_fk_stmt FROM @stmt; EXECUTE drop_fk_stmt; DEALLOCATE PREPARE drop_fk_stmt;

-- 2-3) class_schedules.fk_class_schedules_branches
SET @fk_exists := (
    SELECT COUNT(*)
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = 'class_schedules'
       AND CONSTRAINT_NAME = 'fk_class_schedules_branches'
       AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @stmt := IF(@fk_exists > 0,
    'ALTER TABLE class_schedules DROP FOREIGN KEY fk_class_schedules_branches',
    'DO 0');
PREPARE drop_fk_stmt FROM @stmt; EXECUTE drop_fk_stmt; DEALLOCATE PREPARE drop_fk_stmt;

-- 2-4) class_enrollments.fk_class_enrollments_branches
SET @fk_exists := (
    SELECT COUNT(*)
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = 'class_enrollments'
       AND CONSTRAINT_NAME = 'fk_class_enrollments_branches'
       AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @stmt := IF(@fk_exists > 0,
    'ALTER TABLE class_enrollments DROP FOREIGN KEY fk_class_enrollments_branches',
    'DO 0');
PREPARE drop_fk_stmt FROM @stmt; EXECUTE drop_fk_stmt; DEALLOCATE PREPARE drop_fk_stmt;

-- 2-5) attendances.fk_attendances_branches
SET @fk_exists := (
    SELECT COUNT(*)
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = 'attendances'
       AND CONSTRAINT_NAME = 'fk_attendances_branches'
       AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @stmt := IF(@fk_exists > 0,
    'ALTER TABLE attendances DROP FOREIGN KEY fk_attendances_branches',
    'DO 0');
PREPARE drop_fk_stmt FROM @stmt; EXECUTE drop_fk_stmt; DEALLOCATE PREPARE drop_fk_stmt;

-- 2-6) academy_billing_schedules.fk_academy_billing_schedules_branches
SET @fk_exists := (
    SELECT COUNT(*)
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = 'academy_billing_schedules'
       AND CONSTRAINT_NAME = 'fk_academy_billing_schedules_branches'
       AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @stmt := IF(@fk_exists > 0,
    'ALTER TABLE academy_billing_schedules DROP FOREIGN KEY fk_academy_billing_schedules_branches',
    'DO 0');
PREPARE drop_fk_stmt FROM @stmt; EXECUTE drop_fk_stmt; DEALLOCATE PREPARE drop_fk_stmt;

-- 2-7) academy_invoices.fk_academy_invoices_branches
SET @fk_exists := (
    SELECT COUNT(*)
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = 'academy_invoices'
       AND CONSTRAINT_NAME = 'fk_academy_invoices_branches'
       AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @stmt := IF(@fk_exists > 0,
    'ALTER TABLE academy_invoices DROP FOREIGN KEY fk_academy_invoices_branches',
    'DO 0');
PREPARE drop_fk_stmt FROM @stmt; EXECUTE drop_fk_stmt; DEALLOCATE PREPARE drop_fk_stmt;

-- 2-8) academy_tuition_payments.fk_academy_tuition_payments_branches
SET @fk_exists := (
    SELECT COUNT(*)
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = 'academy_tuition_payments'
       AND CONSTRAINT_NAME = 'fk_academy_tuition_payments_branches'
       AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @stmt := IF(@fk_exists > 0,
    'ALTER TABLE academy_tuition_payments DROP FOREIGN KEY fk_academy_tuition_payments_branches',
    'DO 0');
PREPARE drop_fk_stmt FROM @stmt; EXECUTE drop_fk_stmt; DEALLOCATE PREPARE drop_fk_stmt;

-- 2-9) academy_settlements.fk_academy_settlements_branches
SET @fk_exists := (
    SELECT COUNT(*)
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = 'academy_settlements'
       AND CONSTRAINT_NAME = 'fk_academy_settlements_branches'
       AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @stmt := IF(@fk_exists > 0,
    'ALTER TABLE academy_settlements DROP FOREIGN KEY fk_academy_settlements_branches',
    'DO 0');
PREPARE drop_fk_stmt FROM @stmt; EXECUTE drop_fk_stmt; DEALLOCATE PREPARE drop_fk_stmt;

-- 2-10) academy_settlement_items.fk_academy_settlement_items_branches
SET @fk_exists := (
    SELECT COUNT(*)
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = 'academy_settlement_items'
       AND CONSTRAINT_NAME = 'fk_academy_settlement_items_branches'
       AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @stmt := IF(@fk_exists > 0,
    'ALTER TABLE academy_settlement_items DROP FOREIGN KEY fk_academy_settlement_items_branches',
    'DO 0');
PREPARE drop_fk_stmt FROM @stmt; EXECUTE drop_fk_stmt; DEALLOCATE PREPARE drop_fk_stmt;

-- 2-11) user_role_assignments.fk_user_role_branch
SET @fk_exists := (
    SELECT COUNT(*)
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = 'user_role_assignments'
       AND CONSTRAINT_NAME = 'fk_user_role_branch'
       AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @stmt := IF(@fk_exists > 0,
    'ALTER TABLE user_role_assignments DROP FOREIGN KEY fk_user_role_branch',
    'DO 0');
PREPARE drop_fk_stmt FROM @stmt; EXECUTE drop_fk_stmt; DEALLOCATE PREPARE drop_fk_stmt;

-- =============================================================================
-- 3) branches → branches_dropped_20260612 RENAME (DROP 금지, 안전망 유지)
--    - 11개 자식 FK 모두 제거 후 안전하게 RENAME.
--    - 1-2주 모니터링 후 운영 영향 0 확인 시 별도 PR 로 DROP 가능.
-- =============================================================================

SET @branches_exists := (
    SELECT COUNT(*)
      FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'branches'
);

SET @already_renamed := (
    SELECT COUNT(*)
      FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'branches_dropped_20260612'
);

-- branches 가 존재하고 RENAME 대상이 아직 없으면 RENAME (idempotent)
SET @rename_stmt := IF(
    @branches_exists > 0 AND @already_renamed = 0,
    'RENAME TABLE branches TO branches_dropped_20260612',
    'DO 0'
);
PREPARE rename_stmt FROM @rename_stmt;
EXECUTE rename_stmt;
DEALLOCATE PREPARE rename_stmt;
