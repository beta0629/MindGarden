-- 감정 분석(V70)·임상 자동화(V68) 테이블: BaseEntity 필수 컬럼 추가 (deleted_at, version)
-- 엔티티는 AuditableTenantBase 를 상속해 deleted_at/version 을 매핑하는데 생성 DDL 에 없어
-- JPA 조회 시 Unknown column 예외 → 500 이 난다 (V20260227_003 의 psych_assessment_documents 와 같은 사례)
-- 이미 컬럼이 있는 DB 에서도 적용 가능하도록 information_schema 기준 idempotent 처리

SET @dbname = DATABASE();

-- multimodal_emotion_reports.deleted_at
SET @prepared = (
    SELECT COUNT(*) = 0 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'multimodal_emotion_reports' AND COLUMN_NAME = 'deleted_at'
);
SET @sql = IF(@prepared,
    'ALTER TABLE multimodal_emotion_reports ADD COLUMN deleted_at DATETIME(6) NULL',
    'SELECT ''multimodal_emotion_reports.deleted_at already exists'' AS msg');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- voice_biomarkers.deleted_at
SET @prepared = (
    SELECT COUNT(*) = 0 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'voice_biomarkers' AND COLUMN_NAME = 'deleted_at'
);
SET @sql = IF(@prepared,
    'ALTER TABLE voice_biomarkers ADD COLUMN deleted_at DATETIME(6) NULL',
    'SELECT ''voice_biomarkers.deleted_at already exists'' AS msg');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- video_emotion_analysis.deleted_at
SET @prepared = (
    SELECT COUNT(*) = 0 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'video_emotion_analysis' AND COLUMN_NAME = 'deleted_at'
);
SET @sql = IF(@prepared,
    'ALTER TABLE video_emotion_analysis ADD COLUMN deleted_at DATETIME(6) NULL',
    'SELECT ''video_emotion_analysis.deleted_at already exists'' AS msg');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- text_emotion_analysis.deleted_at
SET @prepared = (
    SELECT COUNT(*) = 0 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'text_emotion_analysis' AND COLUMN_NAME = 'deleted_at'
);
SET @sql = IF(@prepared,
    'ALTER TABLE text_emotion_analysis ADD COLUMN deleted_at DATETIME(6) NULL',
    'SELECT ''text_emotion_analysis.deleted_at already exists'' AS msg');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- emotion_tracking_history.deleted_at / version
SET @prepared = (
    SELECT COUNT(*) = 0 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'emotion_tracking_history' AND COLUMN_NAME = 'deleted_at'
);
SET @sql = IF(@prepared,
    'ALTER TABLE emotion_tracking_history ADD COLUMN deleted_at DATETIME(6) NULL',
    'SELECT ''emotion_tracking_history.deleted_at already exists'' AS msg');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @prepared = (
    SELECT COUNT(*) = 0 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'emotion_tracking_history' AND COLUMN_NAME = 'version'
);
SET @sql = IF(@prepared,
    'ALTER TABLE emotion_tracking_history ADD COLUMN version BIGINT NOT NULL DEFAULT 0',
    'SELECT ''emotion_tracking_history.version already exists'' AS msg');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- consultation_audio_files.deleted_at / version (ResourceOwnerAccessGuard 음성 파일 경로)
SET @prepared = (
    SELECT COUNT(*) = 0 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'consultation_audio_files' AND COLUMN_NAME = 'deleted_at'
);
SET @sql = IF(@prepared,
    'ALTER TABLE consultation_audio_files ADD COLUMN deleted_at DATETIME(6) NULL',
    'SELECT ''consultation_audio_files.deleted_at already exists'' AS msg');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @prepared = (
    SELECT COUNT(*) = 0 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'consultation_audio_files' AND COLUMN_NAME = 'version'
);
SET @sql = IF(@prepared,
    'ALTER TABLE consultation_audio_files ADD COLUMN version BIGINT NOT NULL DEFAULT 0',
    'SELECT ''consultation_audio_files.version already exists'' AS msg');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- clinical_reports.deleted_at / version
SET @prepared = (
    SELECT COUNT(*) = 0 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'clinical_reports' AND COLUMN_NAME = 'deleted_at'
);
SET @sql = IF(@prepared,
    'ALTER TABLE clinical_reports ADD COLUMN deleted_at DATETIME(6) NULL',
    'SELECT ''clinical_reports.deleted_at already exists'' AS msg');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @prepared = (
    SELECT COUNT(*) = 0 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'clinical_reports' AND COLUMN_NAME = 'version'
);
SET @sql = IF(@prepared,
    'ALTER TABLE clinical_reports ADD COLUMN version BIGINT NOT NULL DEFAULT 0',
    'SELECT ''clinical_reports.version already exists'' AS msg');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
