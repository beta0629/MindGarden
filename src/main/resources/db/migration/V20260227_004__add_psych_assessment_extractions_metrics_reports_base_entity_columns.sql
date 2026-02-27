-- psych_assessment_extractions, psych_assessment_metrics, psych_assessment_reports
-- BaseEntity 필수 컬럼 추가 (version, deleted_at)
-- 참조: V20260227_003 (documents 마이그레이션)

ALTER TABLE psych_assessment_extractions
  ADD COLUMN deleted_at DATETIME(6) NULL,
  ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE psych_assessment_metrics
  ADD COLUMN deleted_at DATETIME(6) NULL,
  ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE psych_assessment_reports
  ADD COLUMN deleted_at DATETIME(6) NULL,
  ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
