-- V71: 예측 기반 경과 모니터링 테이블 생성
-- 치료 경과 예측, 중도 탈락 예측, 일상 데이터 연동
-- 작성일: 2026-01-21

-- 치료 경과 예측 결과
CREATE TABLE IF NOT EXISTS treatment_predictions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    client_id BIGINT NOT NULL COMMENT '내담자 ID',
    consultation_id BIGINT COMMENT '상담 ID',

    -- 예측 결과
    predicted_outcome VARCHAR(50) COMMENT '예측 결과 (EXCELLENT, GOOD, MODERATE, POOR)',
    success_probability DECIMAL(3,2) COMMENT '성공 확률 (0-1)',
    estimated_improvement_rate DECIMAL(5,2) COMMENT '예상 개선률 (%)',

    -- 권장 회기 수
    recommended_session_count INT COMMENT '권장 상담 회기 수',
    confidence_level DECIMAL(3,2) COMMENT '예측 신뢰도 (0-1)',

    -- 예측 근거
    prediction_factors JSON COMMENT '예측 요인 목록',
    similar_cases_count INT COMMENT '유사 케이스 수',
    similar_case_ids JSON COMMENT '유사 케이스 ID 목록',

    -- 위험 요인
    risk_factors JSON COMMENT '위험 요인 목록',
    protective_factors JSON COMMENT '보호 요인 목록',

    -- 모델 정보
    model_name VARCHAR(100) DEFAULT 'treatment_outcome_predictor' COMMENT 'ML 모델명',
    model_version VARCHAR(50) COMMENT '모델 버전',
    prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '예측 일시',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    version INT DEFAULT 0,

    INDEX idx_client (client_id),
    INDEX idx_tenant (tenant_id),
    INDEX idx_outcome (predicted_outcome),
    INDEX idx_prediction_date (prediction_date),

    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (consultation_id) REFERENCES consultations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='치료 경과 예측 결과';

-- 중도 탈락 위험도 평가
CREATE TABLE IF NOT EXISTS dropout_risk_assessments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    client_id BIGINT NOT NULL COMMENT '내담자 ID',
    consultation_id BIGINT COMMENT '상담 ID',

    -- 탈락 위험도
    dropout_risk_level VARCHAR(20) COMMENT '탈락 위험도 (CRITICAL, HIGH, MEDIUM, LOW)',
    dropout_probability DECIMAL(3,2) COMMENT '탈락 확률 (0-1)',

    -- 위험 요인
    engagement_score DECIMAL(3,2) COMMENT '참여도 점수 (0-1)',
    attendance_rate DECIMAL(3,2) COMMENT '출석률 (0-1)',
    response_delay_hours DECIMAL(5,2) COMMENT '평균 응답 지연 시간 (시간)',
    emotional_progress_stagnation BOOLEAN COMMENT '감정 변화 정체 여부',

    -- 위험 신호
    warning_signs JSON COMMENT '경고 신호 목록',
    early_intervention_needed BOOLEAN DEFAULT FALSE COMMENT '조기 개입 필요 여부',

    -- 대응 전략
    recommended_actions JSON COMMENT '권장 조치 목록',
    intervention_strategies TEXT COMMENT '개입 전략',

    -- 모델 정보
    model_name VARCHAR(100) DEFAULT 'dropout_risk_predictor' COMMENT 'ML 모델명',
    assessment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '평가 일시',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    version INT DEFAULT 0,

    INDEX idx_client (client_id),
    INDEX idx_tenant (tenant_id),
    INDEX idx_risk_level (dropout_risk_level),
    INDEX idx_assessment_date (assessment_date),

    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (consultation_id) REFERENCES consultations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='중도 탈락 위험도 평가';

-- 일상 데이터 모니터링 (패시브 모니터링)
CREATE TABLE IF NOT EXISTS passive_monitoring_data (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    client_id BIGINT NOT NULL COMMENT '내담자 ID',

    -- 수면 데이터
    sleep_duration_hours DECIMAL(4,2) COMMENT '수면 시간 (시간)',
    sleep_quality_score DECIMAL(3,2) COMMENT '수면 질 점수 (0-1)',
    sleep_interruptions INT COMMENT '수면 중단 횟수',

    -- 활동 데이터
    step_count INT COMMENT '걸음 수',
    active_minutes INT COMMENT '활동 시간 (분)',
    distance_km DECIMAL(5,2) COMMENT '이동 거리 (km)',

    -- 스크린 타임
    screen_time_minutes INT COMMENT '화면 사용 시간 (분)',
    social_app_usage_minutes INT COMMENT 'SNS 사용 시간 (분)',

    -- 위치 변화
    location_changes INT COMMENT '위치 변경 횟수',
    time_at_home_hours DECIMAL(4,2) COMMENT '집에 있던 시간 (시간)',

    -- 생활 패턴
    meal_times JSON COMMENT '식사 시간 기록',
    wake_up_time TIME COMMENT '기상 시각',
    bedtime TIME COMMENT '취침 시각',

    -- 데이터 소스
    data_source VARCHAR(50) DEFAULT 'GOOGLE_FIT' COMMENT '데이터 소스 (GOOGLE_FIT, APPLE_HEALTH, SAMSUNG_HEALTH)',
    measurement_date DATE NOT NULL COMMENT '측정 날짜',

    -- 변화 감지
    significant_change_detected BOOLEAN DEFAULT FALSE COMMENT '유의미한 변화 감지 여부',
    change_type VARCHAR(50) COMMENT '변화 유형 (IMPROVED, WORSENED)',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,

    INDEX idx_client (client_id),
    INDEX idx_tenant (tenant_id),
    INDEX idx_measurement_date (measurement_date),
    INDEX idx_data_source (data_source),

    FOREIGN KEY (client_id) REFERENCES clients(id),
    UNIQUE KEY uk_client_date (client_id, measurement_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='일상 데이터 모니터링 (패시브 모니터링)';

-- 유사 케이스 매칭
CREATE TABLE IF NOT EXISTS similar_case_matches (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    source_client_id BIGINT NOT NULL COMMENT '원본 내담자 ID',
    matched_client_id BIGINT NOT NULL COMMENT '매칭된 내담자 ID',

    -- 유사도 점수
    similarity_score DECIMAL(3,2) COMMENT '유사도 점수 (0-1)',

    -- 유사 요인
    similar_factors JSON COMMENT '유사 요인 목록 (증상, 나이, 성별 등)',
    matching_symptoms JSON COMMENT '일치하는 증상',

    -- 매칭된 케이스 결과
    matched_case_outcome VARCHAR(50) COMMENT '매칭된 케이스의 치료 결과',
    matched_case_session_count INT COMMENT '매칭된 케이스의 총 회기 수',
    matched_case_improvement_rate DECIMAL(5,2) COMMENT '매칭된 케이스의 개선률 (%)',

    -- 학습 가능 인사이트
    lessons_learned TEXT COMMENT '학습 가능한 인사이트',

    matched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '매칭 일시',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,

    INDEX idx_source_client (source_client_id),
    INDEX idx_matched_client (matched_client_id),
    INDEX idx_similarity (similarity_score),
    INDEX idx_tenant (tenant_id),

    FOREIGN KEY (source_client_id) REFERENCES clients(id),
    FOREIGN KEY (matched_client_id) REFERENCES clients(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='유사 케이스 매칭';

-- 예측 모델 성능 추적
CREATE TABLE IF NOT EXISTS prediction_model_performance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    model_name VARCHAR(100) NOT NULL COMMENT '모델명',
    model_version VARCHAR(50) NOT NULL COMMENT '모델 버전',

    -- 성능 지표
    accuracy DECIMAL(3,2) COMMENT '정확도',
    precision_score DECIMAL(3,2) COMMENT '정밀도',
    recall_score DECIMAL(3,2) COMMENT '재현율',
    f1_score DECIMAL(3,2) COMMENT 'F1 점수',

    -- 사용 통계
    total_predictions INT DEFAULT 0 COMMENT '총 예측 수',
    correct_predictions INT DEFAULT 0 COMMENT '정확한 예측 수',

    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '평가 일시',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_model (model_name, model_version),
    INDEX idx_tenant (tenant_id),
    INDEX idx_evaluated_at (evaluated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='예측 모델 성능 추적';
