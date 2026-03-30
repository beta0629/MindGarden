-- TCI/MMPI 심리검사 리포트 AI 분석 테이블
-- 표준화: 원문 PDF는 암호화 저장(파일 스토리지) + DB에는 메타/해시/키버전/상태만 저장

CREATE TABLE IF NOT EXISTS psych_assessment_documents (
  id BIGINT NOT NULL AUTO_INCREMENT,
  tenant_id VARCHAR(100) NOT NULL,
  client_id BIGINT NULL,
  assessment_type VARCHAR(50) NOT NULL, -- TCI, MMPI
  source_type VARCHAR(50) NOT NULL,     -- SCANNED_PDF
  original_filename VARCHAR(255) NULL,
  content_type VARCHAR(100) NULL,
  file_size BIGINT NOT NULL,
  sha256 CHAR(64) NOT NULL,
  storage_path VARCHAR(512) NOT NULL,   -- encrypted blob path
  encryption_key_version VARCHAR(50) NOT NULL,
  status VARCHAR(30) NOT NULL,          -- UPLOADED, OCR_PENDING, OCR_DONE, EXTRACTED, FAILED
  created_by BIGINT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  is_deleted BIT(1) NOT NULL DEFAULT b'0',
  PRIMARY KEY (id),
  INDEX idx_psych_doc_tenant (tenant_id),
  INDEX idx_psych_doc_tenant_type (tenant_id, assessment_type),
  INDEX idx_psych_doc_sha (sha256),
  INDEX idx_psych_doc_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS psych_assessment_extractions (
  id BIGINT NOT NULL AUTO_INCREMENT,
  tenant_id VARCHAR(100) NOT NULL,
  document_id BIGINT NOT NULL,
  template_id VARCHAR(100) NULL,
  extraction_mode VARCHAR(30) NOT NULL, -- TEMPLATE, GENERIC
  ocr_engine VARCHAR(50) NOT NULL,
  ocr_confidence DECIMAL(5,2) NULL,
  extracted_json LONGTEXT NULL,         -- raw extracted fields
  validation_json LONGTEXT NULL,        -- errors/warnings
  status VARCHAR(30) NOT NULL,          -- PENDING, DONE, NEEDS_REVIEW, FAILED
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  is_deleted BIT(1) NOT NULL DEFAULT b'0',
  PRIMARY KEY (id),
  INDEX idx_psych_ext_tenant (tenant_id),
  INDEX idx_psych_ext_doc (document_id),
  CONSTRAINT fk_psych_ext_doc FOREIGN KEY (document_id) REFERENCES psych_assessment_documents(id)
);

CREATE TABLE IF NOT EXISTS psych_assessment_metrics (
  id BIGINT NOT NULL AUTO_INCREMENT,
  tenant_id VARCHAR(100) NOT NULL,
  document_id BIGINT NOT NULL,
  extraction_id BIGINT NOT NULL,
  assessment_type VARCHAR(50) NOT NULL,
  scale_code VARCHAR(100) NOT NULL,     -- internal standardized code
  scale_label VARCHAR(255) NULL,        -- as printed
  raw_score DECIMAL(10,2) NULL,
  t_score DECIMAL(10,2) NULL,
  percentile DECIMAL(10,2) NULL,
  cutoff_tag VARCHAR(50) NULL,          -- e.g. NORMAL, ELEVATED, HIGH
  flags_json TEXT NULL,                 -- risk/validity flags
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  is_deleted BIT(1) NOT NULL DEFAULT b'0',
  PRIMARY KEY (id),
  INDEX idx_psych_metric_tenant (tenant_id),
  INDEX idx_psych_metric_doc (document_id),
  INDEX idx_psych_metric_scale (tenant_id, assessment_type, scale_code),
  CONSTRAINT fk_psych_metric_doc FOREIGN KEY (document_id) REFERENCES psych_assessment_documents(id),
  CONSTRAINT fk_psych_metric_ext FOREIGN KEY (extraction_id) REFERENCES psych_assessment_extractions(id)
);

CREATE TABLE IF NOT EXISTS psych_assessment_reports (
  id BIGINT NOT NULL AUTO_INCREMENT,
  tenant_id VARCHAR(100) NOT NULL,
  document_id BIGINT NOT NULL,
  extraction_id BIGINT NOT NULL,
  report_version INT NOT NULL DEFAULT 1,
  prompt_version VARCHAR(50) NULL,
  model_name VARCHAR(100) NULL,
  rules_version VARCHAR(50) NULL,
  report_markdown LONGTEXT NOT NULL,
  evidence_json LONGTEXT NULL,          -- links to metrics/rules used
  status VARCHAR(30) NOT NULL,          -- GENERATED, APPROVED, REJECTED
  created_by BIGINT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  is_deleted BIT(1) NOT NULL DEFAULT b'0',
  PRIMARY KEY (id),
  INDEX idx_psych_report_tenant (tenant_id),
  INDEX idx_psych_report_doc (document_id),
  CONSTRAINT fk_psych_report_doc FOREIGN KEY (document_id) REFERENCES psych_assessment_documents(id),
  CONSTRAINT fk_psych_report_ext FOREIGN KEY (extraction_id) REFERENCES psych_assessment_extractions(id)
);


