-- =============================================================================
-- V20260612_001__role_ssot_legacy_normalize.sql
-- users.role 레거시 → SSOT 4종 정규화 (ADMIN/STAFF/CONSULTANT/CLIENT)
--
-- 배경
-- - 사용자 결정: SSOT 4종 (ADMIN/STAFF/CONSULTANT/CLIENT) 정착.
-- - PR-1~5 코드 정착 후 본 PR (PR-6/9) 에서 DB 데이터·프로시저 정리.
-- - 운영 사용자 영향 0 — 2026-06-11 KST S2 인벤토리 결과 레거시 role 사용자 0건.
-- - 본 마이그레이션은 운영 기준 no-op (UPDATE 0행) 이며, 향후 dev/스테이징/장애복구
--   복원본 등에서 레거시 role 이 잔존할 경우를 대비한 idempotent 정규화.
--
-- 매핑 규칙
-- - SUPER_ADMIN, HQ_ADMIN, BRANCH_SUPER_ADMIN, BRANCH_ADMIN, HQ_MASTER,
--   SUPER_HQ_ADMIN, TENANT_ADMIN, PRINCIPAL, OWNER → ADMIN
-- - PLAY_THERAPIST, SPEECH_THERAPIST → CONSULTANT
-- - STAFF, CLIENT 은 그대로 유지 (이미 SSOT 4종 안에 포함)
--
-- 선행 마이그레이션
-- - V20251204_001 — common_codes (USER_ROLE/ROLE) 에서 HQ_*/BRANCH_* 코드 삭제
-- - V20260212_001 — role_permissions 에서 SSOT 외 role_name 행 삭제
-- - 본 V20260612_001 — users.role 컬럼 값 자체를 SSOT 4종으로 정규화 (마지막 단계)
--
-- 안전 가드
-- - 모든 UPDATE 는 명시적 IN 절로 매핑 대상 role 만 변경 — 다른 값(SSOT 4종 포함)은 미터치.
-- - branches 테이블/branch_id 컬럼/사용자 BE/FE 코드는 변경하지 않음 (PR-7 별도 범위).
-- - admin override / 강제 다운그레이드 없음.
--
-- 참조
-- - docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md (PR-6/9)
-- - docs/standards/DATABASE_MIGRATION_STANDARD.md
-- - docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md
-- =============================================================================

-- 1) 관리자 계열 레거시 role → ADMIN
UPDATE users
   SET role = 'ADMIN',
       updated_at = NOW()
 WHERE role IN (
        'SUPER_ADMIN',
        'HQ_ADMIN',
        'BRANCH_SUPER_ADMIN',
        'BRANCH_ADMIN',
        'BRANCH_MANAGER',
        'HQ_MASTER',
        'SUPER_HQ_ADMIN',
        'HQ_SUPER_ADMIN',
        'TENANT_ADMIN',
        'PRINCIPAL',
        'OWNER'
       );

-- 2) 치료사 계열 레거시 role → CONSULTANT
UPDATE users
   SET role = 'CONSULTANT',
       updated_at = NOW()
 WHERE role IN (
        'PLAY_THERAPIST',
        'SPEECH_THERAPIST'
       );

-- 3) 사후 검증 — SSOT 4종 외 잔존 role 이 있으면 마이그레이션 실패
--    (운영은 사전 인벤토리에서 0건 확인 — 본 가드는 회귀 방지용)
SET @ssot_violation_count := (
    SELECT COUNT(*)
      FROM users
     WHERE role NOT IN ('ADMIN', 'STAFF', 'CONSULTANT', 'CLIENT')
);

SET @ssot_violation_msg := CONCAT(
    'V20260612_001 정규화 후에도 SSOT 4종 외 role 행 ',
    @ssot_violation_count,
    ' 건 존재 — 매핑 규칙 추가 또는 신규 레거시 role 인벤토리 필요.'
);

-- IF 문은 마이그레이션 외부에서 동작하지 않으므로 동적 SQL 로 SIGNAL 처리
-- (V20260609_002 에서 사용한 동일 패턴).
SET @stmt := IF(
    @ssot_violation_count > 0,
    CONCAT('SIGNAL SQLSTATE ''45000'' SET MESSAGE_TEXT = ''',
           REPLACE(@ssot_violation_msg, '''', ''''''), ''';'),
    'DO 0'
);
PREPARE check_stmt FROM @stmt;
EXECUTE check_stmt;
DEALLOCATE PREPARE check_stmt;
