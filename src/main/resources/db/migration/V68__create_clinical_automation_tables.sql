-- V68: 임상 문서 자동화 테이블 생성
-- 작성일: 2026-01-21
-- 설명: 음성 파일, 전사 결과, 임상 보고서 테이블 생성

-- ====================================================================================
-- 1. 상담 음성 파일 테이블
-- ====================================================================================
CREATE TABLE IF NOT EXISTS consultation_audio_files (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '음성 파일 ID',
    tenant_id VARCHAR(100) COMMENT '테넌트 ID',
    consultation_id BIGINT NOT NULL COMMENT '상담 ID',
    consultation_record_id BIGINT COMMENT '상담 기록 ID',

    -- 파일 정보
    file_name VARCHAR(500) NOT NULL COMMENT '파일명',
    file_path VARCHAR(1000) NOT NULL COMMENT '파일 경로',
    file_size_bytes BIGINT COMMENT '파일 크기 (바이트)',
    duration_seconds INT COMMENT '음성 길이 (초)',
    mime_type VARCHAR(100) COMMENT 'MIME 타입 (audio/wav, audio/mp3 등)',

    -- 상태 관리
    upload_status VARCHAR(20) DEFAULT 'PENDING' COMMENT '업로드 상태: PENDING, UPLOADED, FAILED',
    transcription_status VARCHAR(20) DEFAULT 'PENDING' COMMENT '전사 상태: PENDING, PROCESSING, COMPLETED, FAILED',

    -- 메타 정보
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    is_deleted BOOLEAN DEFAULT FALSE COMMENT '삭제 여부',

    -- 인덱스
    INDEX idx_consultation_id (consultation_id),
    INDEX idx_consultation_record_id (consultation_record_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_transcription_status (transcription_status),
    INDEX idx_created_at (created_at),

    -- 외래키
    CONSTRAINT fk_audio_consultation_record
        FOREIGN KEY (consultation_record_id)
        REFERENCES consultation_records(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='상담 음성 파일 메타데이터';

-- ====================================================================================
-- 2. 음성 전사 결과 테이블
-- ====================================================================================
CREATE TABLE IF NOT EXISTS audio_transcriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '전사 결과 ID',
    audio_file_id BIGINT NOT NULL COMMENT '음성 파일 ID',

    -- 전사 내용
    transcription_text LONGTEXT COMMENT '전사된 텍스트',
    confidence_score DECIMAL(5,2) COMMENT '신뢰도 점수 (0-100)',
    language_code VARCHAR(10) DEFAULT 'ko-KR' COMMENT '언어 코드',

    -- 처리 정보
    processing_time_ms INT COMMENT '처리 시간 (밀리초)',
    ai_provider VARCHAR(50) DEFAULT 'GOOGLE_SPEECH' COMMENT 'AI 제공자: GOOGLE_SPEECH, WHISPER 등',
    ai_model_used VARCHAR(100) COMMENT '사용된 AI 모델',

    -- 화자 분리 (선택적)
    speaker_labels JSON COMMENT '화자 레이블 (JSON 배열)',

    -- 메타 정보
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',

    -- 인덱스
    INDEX idx_audio_file_id (audio_file_id),
    INDEX idx_ai_provider (ai_provider),
    INDEX idx_created_at (created_at),

    -- 외래키
    CONSTRAINT fk_transcription_audio_file
        FOREIGN KEY (audio_file_id)
        REFERENCES consultation_audio_files(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='음성 전사 결과';

-- ====================================================================================
-- 3. 임상 보고서 테이블
-- ====================================================================================
CREATE TABLE IF NOT EXISTS clinical_reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '보고서 ID',
    tenant_id VARCHAR(100) COMMENT '테넌트 ID',
    consultation_record_id BIGINT NOT NULL COMMENT '상담 기록 ID',

    -- 보고서 타입
    report_type VARCHAR(50) NOT NULL COMMENT '보고서 타입: SOAP, DAP, DIAGNOSTIC',
    report_format VARCHAR(20) DEFAULT 'SOAP' COMMENT '보고서 형식: SOAP, DAP',

    -- SOAP 형식 필드
    subjective_text TEXT COMMENT 'Subjective: 주관적 정보 (내담자 보고)',
    objective_text TEXT COMMENT 'Objective: 객관적 정보 (관찰된 행동)',
    assessment_text TEXT COMMENT 'Assessment: 평가 (임상적 인상)',
    plan_text TEXT COMMENT 'Plan: 계획 (치료 계획)',

    -- DAP 형식 필드
    data_text TEXT COMMENT 'Data: 데이터 (관찰 + 보고)',

    -- 진단 정보
    diagnosis_summary TEXT COMMENT '진단 요약',
    diagnostic_impressions TEXT COMMENT '진단적 인상',
    treatment_recommendations TEXT COMMENT '치료 권고사항',

    -- AI 생성 메타 정보
    auto_generated BOOLEAN DEFAULT TRUE COMMENT 'AI 자동 생성 여부',
    human_reviewed BOOLEAN DEFAULT FALSE COMMENT '사람 검토 완료 여부',
    reviewed_by_user_id BIGINT COMMENT '검토자 사용자 ID',
    reviewed_at TIMESTAMP COMMENT '검토 일시',

    ai_model_used VARCHAR(50) COMMENT '사용된 AI 모델 (GEMINI, GPT-4 등)',
    generation_time_ms INT COMMENT '생성 시간 (밀리초)',
    confidence_score DECIMAL(5,2) COMMENT 'AI 생성 신뢰도 (0-100)',

    -- 메타 정보
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    is_deleted BOOLEAN DEFAULT FALSE COMMENT '삭제 여부',

    -- 인덱스
    INDEX idx_consultation_record_id (consultation_record_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_report_type (report_type),
    INDEX idx_human_reviewed (human_reviewed),
    INDEX idx_created_at (created_at),

    -- 외래키
    CONSTRAINT fk_clinical_report_consultation_record
        FOREIGN KEY (consultation_record_id)
        REFERENCES consultation_records(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='임상 보고서 (SOAP/DAP)';

-- ====================================================================================
-- 4. 기존 위험 징후 알림 테이블 확장 (운영 스키마에 alert_level 없음 → title 뒤에 추가)
-- ====================================================================================
SET @dbname = DATABASE();

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'consultation_record_alerts' AND COLUMN_NAME = 'alert_source') > 0,
    'SELECT 1',
    'ALTER TABLE consultation_record_alerts ADD COLUMN alert_source VARCHAR(50) DEFAULT ''MANUAL'' COMMENT ''AI_DETECTED, MANUAL, KEYWORD_MATCH'' AFTER title'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'consultation_record_alerts' AND COLUMN_NAME = 'detected_keywords') > 0,
    'SELECT 1',
    'ALTER TABLE consultation_record_alerts ADD COLUMN detected_keywords TEXT COMMENT ''JSON array of detected risk keywords'' AFTER alert_source'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'consultation_record_alerts' AND COLUMN_NAME = 'confidence_score') > 0,
    'SELECT 1',
    'ALTER TABLE consultation_record_alerts ADD COLUMN confidence_score DECIMAL(5,2) COMMENT ''AI 위험도 신뢰도 (0-100)'' AFTER detected_keywords'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'consultation_record_alerts' AND COLUMN_NAME = 'ai_analysis_text') > 0,
    'SELECT 1',
    'ALTER TABLE consultation_record_alerts ADD COLUMN ai_analysis_text TEXT COMMENT ''AI의 위험도 분석 상세'' AFTER confidence_score'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'consultation_record_alerts' AND INDEX_NAME = 'idx_alert_source') > 0,
    'SELECT 1',
    'CREATE INDEX idx_alert_source ON consultation_record_alerts(alert_source)'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'consultation_record_alerts' AND INDEX_NAME = 'idx_confidence_score') > 0,
    'SELECT 1',
    'CREATE INDEX idx_confidence_score ON consultation_record_alerts(confidence_score)'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
