-- V70: 멀티모달 감정 분석 테이블 생성
-- 음성 바이오마커, 비디오 감정, 텍스트 감정 분석 데이터 저장
-- 작성일: 2026-01-21

-- 음성 바이오마커 분석 결과
CREATE TABLE IF NOT EXISTS voice_biomarkers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    consultation_record_id BIGINT NOT NULL COMMENT '상담 기록 ID',
    audio_file_id BIGINT COMMENT '음성 파일 ID (consultation_audio_files 참조)',

    -- 음성 특징
    pitch_mean DECIMAL(6,2) COMMENT '평균 피치 (Hz)',
    pitch_std DECIMAL(6,2) COMMENT '피치 표준편차',
    pitch_min DECIMAL(6,2) COMMENT '최소 피치',
    pitch_max DECIMAL(6,2) COMMENT '최대 피치',

    speech_rate_wpm INT COMMENT '말 속도 (단어/분)',
    pause_count INT COMMENT '휴지기 횟수',
    avg_pause_duration DECIMAL(5,2) COMMENT '평균 휴지기 길이 (초)',

    volume_mean DECIMAL(5,2) COMMENT '평균 볼륨 (dB)',
    volume_std DECIMAL(5,2) COMMENT '볼륨 표준편차',

    tremor_detected BOOLEAN DEFAULT FALSE COMMENT '음성 떨림 감지 여부',
    tremor_frequency DECIMAL(5,2) COMMENT '떨림 주파수 (Hz)',

    -- 감정 지표
    stress_score DECIMAL(3,2) COMMENT '스트레스 점수 (0-1)',
    anxiety_score DECIMAL(3,2) COMMENT '불안 점수 (0-1)',
    depression_score DECIMAL(3,2) COMMENT '우울 점수 (0-1)',
    energy_level DECIMAL(3,2) COMMENT '에너지 레벨 (0-1)',

    -- 분석 메타 정보
    analysis_engine VARCHAR(50) DEFAULT 'GOOGLE_SPEECH' COMMENT '분석 엔진',
    processing_time_ms INT COMMENT '처리 시간 (ms)',
    confidence_score DECIMAL(3,2) COMMENT '신뢰도 (0-1)',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    version INT DEFAULT 0,

    INDEX idx_consultation_record (consultation_record_id),
    INDEX idx_audio_file (audio_file_id),
    INDEX idx_tenant (tenant_id),
    INDEX idx_created_at (created_at),

    FOREIGN KEY (consultation_record_id) REFERENCES consultation_records(id),
    FOREIGN KEY (audio_file_id) REFERENCES consultation_audio_files(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='음성 바이오마커 분석 결과';

-- 비디오 감정 분석 결과
CREATE TABLE IF NOT EXISTS video_emotion_analysis (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    consultation_record_id BIGINT NOT NULL COMMENT '상담 기록 ID',
    video_file_path VARCHAR(500) COMMENT '비디오 파일 경로',

    -- 전체 감정 요약
    dominant_emotion VARCHAR(50) COMMENT '주요 감정 (joy, sorrow, anger, surprise, fear, disgust, neutral)',
    emotion_timeline JSON COMMENT '시간별 감정 변화 [{time, joy, sorrow, anger, ...}]',

    -- 개별 감정 평균 점수
    avg_joy DECIMAL(3,2) COMMENT '기쁨 평균 (0-1)',
    avg_sorrow DECIMAL(3,2) COMMENT '슬픔 평균 (0-1)',
    avg_anger DECIMAL(3,2) COMMENT '분노 평균 (0-1)',
    avg_surprise DECIMAL(3,2) COMMENT '놀람 평균 (0-1)',
    avg_fear DECIMAL(3,2) COMMENT '두려움 평균 (0-1)',
    avg_disgust DECIMAL(3,2) COMMENT '혐오 평균 (0-1)',

    -- 비언어적 신호
    gaze_direction_changes INT COMMENT '시선 방향 변경 횟수',
    avg_gaze_confidence DECIMAL(3,2) COMMENT '시선 추적 신뢰도',
    posture_changes INT COMMENT '자세 변화 횟수',

    -- 분석 메타 정보
    analysis_engine VARCHAR(50) DEFAULT 'GOOGLE_VIDEO_INTELLIGENCE' COMMENT '분석 엔진',
    video_duration_seconds INT COMMENT '비디오 길이 (초)',
    frames_analyzed INT COMMENT '분석된 프레임 수',
    processing_time_ms INT COMMENT '처리 시간 (ms)',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    version INT DEFAULT 0,

    INDEX idx_consultation_record (consultation_record_id),
    INDEX idx_tenant (tenant_id),
    INDEX idx_dominant_emotion (dominant_emotion),

    FOREIGN KEY (consultation_record_id) REFERENCES consultation_records(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='비디오 감정 분석 결과';

-- 텍스트 감정 분석 결과
CREATE TABLE IF NOT EXISTS text_emotion_analysis (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    consultation_record_id BIGINT NOT NULL COMMENT '상담 기록 ID',
    source_text LONGTEXT COMMENT '분석 대상 텍스트 (전사록 또는 채팅)',
    source_type VARCHAR(50) COMMENT '텍스트 소스 (TRANSCRIPTION, CHAT, NOTE)',

    -- Google Natural Language API 감정 분석
    sentiment_score DECIMAL(3,2) COMMENT '감정 점수 (-1.0 ~ 1.0, 부정 ~ 긍정)',
    sentiment_magnitude DECIMAL(5,2) COMMENT '감정 강도 (0.0 ~ 무한대)',
    sentiment_classification VARCHAR(50) COMMENT '감정 분류 (very_negative, negative, neutral, positive, very_positive)',

    -- 문장별 감정 (JSON)
    sentence_sentiments JSON COMMENT '문장별 감정 분석 [{text, score, magnitude}]',

    -- 인지 왜곡 분석 (Gemini)
    cognitive_distortions JSON COMMENT '인지 왜곡 패턴 [{type, text, context, severity}]',
    distortion_count INT DEFAULT 0 COMMENT '발견된 인지 왜곡 수',
    distortion_risk_level VARCHAR(20) COMMENT '인지 왜곡 위험도 (HIGH, MEDIUM, LOW)',

    -- 키워드 분석
    negative_keywords JSON COMMENT '부정적 키워드 목록',
    positive_keywords JSON COMMENT '긍정적 키워드 목록',
    cognitive_distortion_keywords JSON COMMENT '인지 왜곡 키워드 목록',

    -- 분석 메타 정보
    analysis_engine VARCHAR(50) DEFAULT 'GOOGLE_NL' COMMENT '분석 엔진',
    ai_model_used VARCHAR(100) COMMENT 'AI 모델명 (예: gemini-pro)',
    processing_time_ms INT COMMENT '처리 시간 (ms)',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    version INT DEFAULT 0,

    INDEX idx_consultation_record (consultation_record_id),
    INDEX idx_tenant (tenant_id),
    INDEX idx_risk_level (distortion_risk_level),
    INDEX idx_classification (sentiment_classification),

    FOREIGN KEY (consultation_record_id) REFERENCES consultation_records(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='텍스트 감정 및 인지 왜곡 분석';

-- 멀티모달 감정 통합 리포트
CREATE TABLE IF NOT EXISTS multimodal_emotion_reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    consultation_record_id BIGINT NOT NULL COMMENT '상담 기록 ID',

    -- 참조 ID
    voice_biomarker_id BIGINT COMMENT 'voice_biomarkers 참조',
    video_emotion_id BIGINT COMMENT 'video_emotion_analysis 참조',
    text_emotion_id BIGINT COMMENT 'text_emotion_analysis 참조',

    -- 통합 감정 분석
    overall_emotion VARCHAR(50) COMMENT '종합 감정 (통합 분석 결과)',
    emotion_confidence DECIMAL(3,2) COMMENT '감정 판단 신뢰도',

    -- 3가지 모달리티 점수
    voice_emotion_score DECIMAL(3,2) COMMENT '음성 감정 점수',
    video_emotion_score DECIMAL(3,2) COMMENT '비디오 감정 점수',
    text_emotion_score DECIMAL(3,2) COMMENT '텍스트 감정 점수',

    -- 통합 지표
    stress_index DECIMAL(3,2) COMMENT '스트레스 지수 (0-1)',
    anxiety_index DECIMAL(3,2) COMMENT '불안 지수 (0-1)',
    depression_index DECIMAL(3,2) COMMENT '우울 지수 (0-1)',
    energy_index DECIMAL(3,2) COMMENT '에너지 지수 (0-1)',

    -- 위험도 평가
    overall_risk_level VARCHAR(20) COMMENT '종합 위험도 (CRITICAL, HIGH, MEDIUM, LOW)',
    risk_factors JSON COMMENT '위험 요인 목록',

    -- AI 분석 요약
    ai_summary TEXT COMMENT 'AI가 생성한 감정 분석 요약',
    recommendations TEXT COMMENT 'AI 추천 사항',

    -- 분석 메타 정보
    modalities_used VARCHAR(100) COMMENT '사용된 모달리티 (voice, video, text)',
    total_processing_time_ms INT COMMENT '총 처리 시간',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    version INT DEFAULT 0,

    INDEX idx_consultation_record (consultation_record_id),
    INDEX idx_tenant (tenant_id),
    INDEX idx_risk_level (overall_risk_level),
    INDEX idx_overall_emotion (overall_emotion),

    FOREIGN KEY (consultation_record_id) REFERENCES consultation_records(id),
    FOREIGN KEY (voice_biomarker_id) REFERENCES voice_biomarkers(id),
    FOREIGN KEY (video_emotion_id) REFERENCES video_emotion_analysis(id),
    FOREIGN KEY (text_emotion_id) REFERENCES text_emotion_analysis(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='멀티모달 감정 통합 리포트';

-- 감정 변화 추적 (시계열)
CREATE TABLE IF NOT EXISTS emotion_tracking_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    client_id BIGINT NOT NULL COMMENT '내담자 ID',
    consultation_record_id BIGINT NOT NULL COMMENT '상담 기록 ID',

    -- 감정 점수 (세션별)
    session_number INT COMMENT '상담 회기',
    emotion_type VARCHAR(50) COMMENT '감정 유형',
    emotion_score DECIMAL(3,2) COMMENT '감정 점수 (0-1)',

    -- 변화 추이
    score_change_from_previous DECIMAL(3,2) COMMENT '이전 회기 대비 변화',
    trend VARCHAR(20) COMMENT '추세 (IMPROVING, STABLE, WORSENING)',

    measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '측정 시각',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,

    INDEX idx_client (client_id),
    INDEX idx_tenant (tenant_id),
    INDEX idx_consultation_record (consultation_record_id),
    INDEX idx_measured_at (measured_at),
    INDEX idx_emotion_type (emotion_type),

    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (consultation_record_id) REFERENCES consultation_records(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='감정 변화 추적 (시계열 데이터)';
