-- =============================================================================
-- Apple App Store Guideline 1.4.1 (Medical Citations) — T3 의료 출처 4 컬럼 추가
--
-- 대상 거절: Submission ce38fb9a-ced4-4957-b606-21618ff23518 (2026-06-04)
-- Plan A 오케스트레이션: docs/project-management/APPLE_REJECTION_PLAN_A_ORCHESTRATION_2026_06_04.md
-- 디자이너 핸드오프:    docs/project-management/2026-06-04/APPLE_T3_CITATION_DESIGN_HANDOFF.md
--
-- 변경:
--   • psycho_education_articles  + source_label / source_url / source_author / source_published_year
--   • healing_content_catalog_items + 동일 4 컬럼
--   • daily_healing_content      + 동일 4 컬럼
--   • self_assessment_templates  + 동일 4 컬럼
--
-- 모든 컬럼 NULL 허용 — 기존 행 회귀 0. 운영 적용 시 ALTER TABLE 만 실행되므로 락 시간 짧음.
-- =============================================================================

ALTER TABLE psycho_education_articles
    ADD COLUMN source_label          VARCHAR(200) NULL COMMENT '의료 출처 라벨(표시용)',
    ADD COLUMN source_url            VARCHAR(500) NULL COMMENT '외부 출처 링크(URL)',
    ADD COLUMN source_author         VARCHAR(200) NULL COMMENT '저자/기관',
    ADD COLUMN source_published_year INT          NULL COMMENT '발행 연도(YYYY)';

ALTER TABLE healing_content_catalog_items
    ADD COLUMN source_label          VARCHAR(200) NULL COMMENT '의료 출처 라벨(표시용)',
    ADD COLUMN source_url            VARCHAR(500) NULL COMMENT '외부 출처 링크(URL)',
    ADD COLUMN source_author         VARCHAR(200) NULL COMMENT '저자/기관',
    ADD COLUMN source_published_year INT          NULL COMMENT '발행 연도(YYYY)';

ALTER TABLE daily_healing_content
    ADD COLUMN source_label          VARCHAR(200) NULL COMMENT '의료 출처 라벨(표시용)',
    ADD COLUMN source_url            VARCHAR(500) NULL COMMENT '외부 출처 링크(URL)',
    ADD COLUMN source_author         VARCHAR(200) NULL COMMENT '저자/기관',
    ADD COLUMN source_published_year INT          NULL COMMENT '발행 연도(YYYY)';

ALTER TABLE self_assessment_templates
    ADD COLUMN source_label          VARCHAR(200) NULL COMMENT '의료 출처 라벨(표시용)',
    ADD COLUMN source_url            VARCHAR(500) NULL COMMENT '외부 출처 링크(URL)',
    ADD COLUMN source_author         VARCHAR(200) NULL COMMENT '저자/기관',
    ADD COLUMN source_published_year INT          NULL COMMENT '발행 연도(YYYY)';
