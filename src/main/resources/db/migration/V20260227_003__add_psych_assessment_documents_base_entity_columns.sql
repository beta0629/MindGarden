-- psych_assessment_documents: BaseEntity 필수 컬럼 추가 (version, deleted_at)
-- JPA 조회 시 Unknown column 예외로 500 발생 방지

ALTER TABLE psych_assessment_documents
  ADD COLUMN deleted_at DATETIME(6) NULL,
  ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
