-- V20261004_001 잔여분: BaseEntity(AuditableTenantBase) 가 매핑하는데 생성 DDL 에 없는 컬럼 보정 (2차)
-- 증상: Unknown column '<alias>.deleted_at' / '.updated_at' in 'field list' → JPA 조회 500
--   · emotion_tracking_history.updated_at  (V70, GET /api/v1/emotion-analysis/trend/{clientId})
--   · counselor_feedbacks.deleted_at       (V72, GET /api/v1/training/feedback/{consultantId})
--   · virtual_client_sessions.deleted_at   (V72)
--   · treatment_predictions.deleted_at     (V71)
--   · dropout_risk_assessments.deleted_at  (V71)
-- 엔티티가 없는 테이블(audio_transcriptions·counseling_technique_evaluations·passive_monitoring_data·
-- similar_case_matches·prediction_model_performance·simulation_scenario_templates)은 JPA 매핑이 없어 대상이 아니다.
-- 이미 컬럼이 있는 DB 에서도 적용 가능하도록 information_schema 기준 idempotent 처리 (V20261004_001 과 동일 방식)

SET @dbname = DATABASE();

-- emotion_tracking_history.updated_at (V20261004_001 이 deleted_at/version 만 추가해 updated_at 이 남아 있었다)
SET @prepared = (
    SELECT COUNT(*) = 0 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'emotion_tracking_history' AND COLUMN_NAME = 'updated_at'
);
SET @sql = IF(@prepared,
    'ALTER TABLE emotion_tracking_history ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    'SELECT ''emotion_tracking_history.updated_at already exists'' AS msg');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- counselor_feedbacks.deleted_at
SET @prepared = (
    SELECT COUNT(*) = 0 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'counselor_feedbacks' AND COLUMN_NAME = 'deleted_at'
);
SET @sql = IF(@prepared,
    'ALTER TABLE counselor_feedbacks ADD COLUMN deleted_at DATETIME(6) NULL',
    'SELECT ''counselor_feedbacks.deleted_at already exists'' AS msg');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- virtual_client_sessions.deleted_at
SET @prepared = (
    SELECT COUNT(*) = 0 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'virtual_client_sessions' AND COLUMN_NAME = 'deleted_at'
);
SET @sql = IF(@prepared,
    'ALTER TABLE virtual_client_sessions ADD COLUMN deleted_at DATETIME(6) NULL',
    'SELECT ''virtual_client_sessions.deleted_at already exists'' AS msg');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- treatment_predictions.deleted_at
SET @prepared = (
    SELECT COUNT(*) = 0 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'treatment_predictions' AND COLUMN_NAME = 'deleted_at'
);
SET @sql = IF(@prepared,
    'ALTER TABLE treatment_predictions ADD COLUMN deleted_at DATETIME(6) NULL',
    'SELECT ''treatment_predictions.deleted_at already exists'' AS msg');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- dropout_risk_assessments.deleted_at
SET @prepared = (
    SELECT COUNT(*) = 0 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'dropout_risk_assessments' AND COLUMN_NAME = 'deleted_at'
);
SET @sql = IF(@prepared,
    'ALTER TABLE dropout_risk_assessments ADD COLUMN deleted_at DATETIME(6) NULL',
    'SELECT ''dropout_risk_assessments.deleted_at already exists'' AS msg');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
