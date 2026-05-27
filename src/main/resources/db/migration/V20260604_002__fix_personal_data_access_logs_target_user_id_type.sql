-- =============================================================================
-- V20260604_002 — personal_data_access_logs.target_user_id 타입 정착 (W2 P0)
--
-- 입력 보고서: /tmp/fk-survey-report.md (core-debugger, 2026-05-27)
--   §1.2 / W2 — `personal_data_access_logs.target_user_id = varchar(255)` 인데
--                `users.id = bigint` → FK 정의 불가. 운영 0행 안전 윈도우.
--
-- 사전 운영 검증 (read-only):
--   SELECT COUNT(*) FROM personal_data_access_logs;            -- → 0
--   SELECT COUNT(*) FROM personal_data_access_logs
--    WHERE target_user_id IS NOT NULL AND target_user_id != '';-- → 0
--   결론: 데이터 이전 무관. 단순 ALTER COLUMN + FK 추가 안전.
--
-- ⚠ Entity 영향 분석 (위임 범위 밖 — 후속 보고 §5):
--   src/main/java/com/coresolution/consultation/entity/PersonalDataAccessLog.java
--   현재 `private String targetUserId;` (line 60). 본 마이그레이션 적용 후 Hibernate
--   가 bigint 컬럼 ↔ String 필드 매핑 실패 가능 → 후속 entity·repository·service
--   변경 위임이 즉시 (P0) 필요. 본 위임은 마이그레이션만 정착.
--
-- ⚠ 본 마이그레이션은 위임 명세상 V20260528_006 예정이었으나 develop 채번 충돌로
--    V20260604_002 로 변경. V20260604_001 직후 적용.
--
-- @author CoreSolution
-- @since 2026-06-04
-- =============================================================================

ALTER TABLE personal_data_access_logs
    MODIFY COLUMN target_user_id BIGINT NULL
        COMMENT '대상 사용자 users.id — varchar(255)→bigint 변경 (W2 P0 fix, fk_survey-report §1.2)';

-- target_user_name 컬럼은 PII 인용 가능성 + 향후 anonymize 정책으로 NULLABLE 유지.
-- 별도 처리 (anonymize_token 컬럼 추가 등) 는 합의서 §4 정착 후 후속 마이그레이션에서.

-- FK 신설 — 운영 0행 안전. NO ACTION 으로 운영 56/57 와 정합.
ALTER TABLE personal_data_access_logs
    ADD CONSTRAINT fk_pdal_target_user
        FOREIGN KEY (target_user_id) REFERENCES users (id);
