-- =====================================================
-- AI 모니터링 시스템 테이블 생성
-- 작성일: 2025-12-02
-- 설명: AI 기반 이상 탐지, 예측 분석, 보안 위협 탐지
-- =====================================================

-- 1. 시스템 메트릭 테이블
CREATE TABLE IF NOT EXISTS system_metrics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) COMMENT '테넌트 ID (NULL이면 시스템 전체)',
    metric_type VARCHAR(50) NOT NULL COMMENT '메트릭 타입: CPU, MEMORY, DISK, NETWORK, DB_CONNECTION, API_RESPONSE_TIME',
    metric_value DOUBLE NOT NULL COMMENT '메트릭 값',
    unit VARCHAR(20) COMMENT '단위: %, MB, ms 등',
    host VARCHAR(100) COMMENT '호스트명',
    additional_data JSON COMMENT '추가 데이터',
    collected_at TIMESTAMP NOT NULL COMMENT '수집 시간',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_metric_type (metric_type),
    INDEX idx_collected_at (collected_at),
    INDEX idx_tenant_metric_time (tenant_id, metric_type, collected_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='시스템 메트릭 수집 테이블';

-- 2. AI 이상 탐지 결과 테이블
CREATE TABLE IF NOT EXISTS ai_anomaly_detection (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) COMMENT '테넌트 ID',
    detection_type VARCHAR(50) NOT NULL COMMENT '탐지 타입: PERFORMANCE, SECURITY, BEHAVIOR',
    anomaly_score DOUBLE NOT NULL COMMENT '이상 점수 (0-1)',
    severity VARCHAR(20) NOT NULL COMMENT '심각도: LOW, MEDIUM, HIGH, CRITICAL',
    metric_type VARCHAR(50) COMMENT '관련 메트릭 타입',
    metric_value DOUBLE COMMENT '이상 값',
    expected_value DOUBLE COMMENT '예상 값',
    deviation DOUBLE COMMENT '편차',
    model_used VARCHAR(50) COMMENT '사용된 모델: ISOLATION_FOREST, LSTM, STATISTICAL',
    details JSON COMMENT '상세 정보',
    is_false_positive BOOLEAN DEFAULT FALSE COMMENT '오탐 여부',
    resolved_at TIMESTAMP COMMENT '해결 시간',
    detected_at TIMESTAMP NOT NULL COMMENT '탐지 시간',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_detection_type (detection_type),
    INDEX idx_severity (severity),
    INDEX idx_detected_at (detected_at),
    INDEX idx_resolved (resolved_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='AI 이상 탐지 결과 테이블';

-- 3. 보안 위협 탐지 테이블
CREATE TABLE IF NOT EXISTS security_threat_detection (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) COMMENT '테넌트 ID',
    threat_type VARCHAR(50) NOT NULL COMMENT '위협 타입: BRUTE_FORCE, SQL_INJECTION, DDOS, XSS, SUSPICIOUS_BEHAVIOR',
    severity VARCHAR(20) NOT NULL COMMENT '심각도: LOW, MEDIUM, HIGH, CRITICAL',
    source_ip VARCHAR(50) COMMENT '출발지 IP',
    target_url VARCHAR(500) COMMENT '대상 URL',
    user_id BIGINT COMMENT '사용자 ID',
    user_email VARCHAR(255) COMMENT '사용자 이메일',
    attack_pattern TEXT COMMENT '공격 패턴',
    confidence_score DOUBLE COMMENT '신뢰도 점수 (0-1)',
    blocked BOOLEAN DEFAULT FALSE COMMENT '차단 여부',
    auto_blocked BOOLEAN DEFAULT FALSE COMMENT '자동 차단 여부',
    details JSON COMMENT '상세 정보',
    detected_at TIMESTAMP NOT NULL COMMENT '탐지 시간',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_threat_type (threat_type),
    INDEX idx_severity (severity),
    INDEX idx_source_ip (source_ip),
    INDEX idx_blocked (blocked),
    INDEX idx_detected_at (detected_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='보안 위협 탐지 테이블';

-- 4. AI 예측 분석 결과 테이블
CREATE TABLE IF NOT EXISTS ai_prediction_result (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) COMMENT '테넌트 ID',
    prediction_type VARCHAR(50) NOT NULL COMMENT '예측 타입: RESOURCE_USAGE, USER_GROWTH, PERFORMANCE_DEGRADATION',
    metric_type VARCHAR(50) NOT NULL COMMENT '메트릭 타입',
    current_value DOUBLE COMMENT '현재 값',
    predicted_value DOUBLE NOT NULL COMMENT '예측 값',
    prediction_time TIMESTAMP NOT NULL COMMENT '예측 시점',
    confidence_interval_lower DOUBLE COMMENT '신뢰 구간 하한',
    confidence_interval_upper DOUBLE COMMENT '신뢰 구간 상한',
    model_used VARCHAR(50) COMMENT '사용된 모델: PROPHET, ARIMA, LSTM',
    accuracy DOUBLE COMMENT '정확도',
    alert_threshold DOUBLE COMMENT '알림 임계값',
    alert_triggered BOOLEAN DEFAULT FALSE COMMENT '알림 발생 여부',
    details JSON COMMENT '상세 정보',
    predicted_at TIMESTAMP NOT NULL COMMENT '예측 생성 시간',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_prediction_type (prediction_type),
    INDEX idx_prediction_time (prediction_time),
    INDEX idx_alert_triggered (alert_triggered),
    INDEX idx_predicted_at (predicted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='AI 예측 분석 결과 테이블';

-- 5. 자동 대응 이력 테이블
CREATE TABLE IF NOT EXISTS auto_remediation_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) COMMENT '테넌트 ID',
    trigger_type VARCHAR(50) NOT NULL COMMENT '트리거 타입: ANOMALY, THREAT, PREDICTION',
    trigger_id BIGINT NOT NULL COMMENT '트리거 ID (anomaly_id, threat_id 등)',
    action_type VARCHAR(50) NOT NULL COMMENT '조치 타입: SCALE_UP, RESTART, BLOCK_IP, ALERT_ADMIN',
    action_status VARCHAR(20) NOT NULL COMMENT '조치 상태: PENDING, IN_PROGRESS, SUCCESS, FAILED',
    action_details JSON COMMENT '조치 상세 정보',
    result TEXT COMMENT '조치 결과',
    error_message TEXT COMMENT '오류 메시지',
    execution_time BIGINT COMMENT '실행 시간 (ms)',
    executed_by VARCHAR(50) DEFAULT 'AI_SYSTEM' COMMENT '실행 주체',
    executed_at TIMESTAMP NOT NULL COMMENT '실행 시간',
    completed_at TIMESTAMP COMMENT '완료 시간',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_trigger_type (trigger_type),
    INDEX idx_action_type (action_type),
    INDEX idx_action_status (action_status),
    INDEX idx_executed_at (executed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='자동 대응 이력 테이블';

-- 6. AI 모델 메타데이터 테이블
CREATE TABLE IF NOT EXISTS ai_model_metadata (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    model_name VARCHAR(100) UNIQUE NOT NULL COMMENT '모델명',
    model_type VARCHAR(50) NOT NULL COMMENT '모델 타입: ANOMALY_DETECTION, PREDICTION, THREAT_DETECTION',
    model_version VARCHAR(20) NOT NULL COMMENT '모델 버전',
    algorithm VARCHAR(50) COMMENT '알고리즘: ISOLATION_FOREST, LSTM, PROPHET, ARIMA',
    training_data_size INT COMMENT '학습 데이터 크기',
    accuracy DOUBLE COMMENT '정확도',
    precision_score DOUBLE COMMENT '정밀도',
    recall DOUBLE COMMENT '재현율',
    f1_score DOUBLE COMMENT 'F1 점수',
    model_path VARCHAR(500) COMMENT '모델 파일 경로',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성 상태',
    last_trained_at TIMESTAMP COMMENT '마지막 학습 시간',
    next_training_at TIMESTAMP COMMENT '다음 학습 예정 시간',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_model_type (model_type),
    INDEX idx_is_active (is_active),
    INDEX idx_last_trained_at (last_trained_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='AI 모델 메타데이터 테이블';

-- 7. 모니터링 알림 이력 테이블
CREATE TABLE IF NOT EXISTS monitoring_alert_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) COMMENT '테넌트 ID',
    alert_type VARCHAR(50) NOT NULL COMMENT '알림 타입: ANOMALY, THREAT, PREDICTION, SYSTEM',
    severity VARCHAR(20) NOT NULL COMMENT '심각도: LOW, MEDIUM, HIGH, CRITICAL',
    title VARCHAR(255) NOT NULL COMMENT '알림 제목',
    message TEXT NOT NULL COMMENT '알림 메시지',
    source_type VARCHAR(50) COMMENT '출처 타입: AI_DETECTION, THRESHOLD, MANUAL',
    source_id BIGINT COMMENT '출처 ID',
    channel VARCHAR(50) COMMENT '발송 채널: EMAIL, SLACK, SMS, SYSTEM',
    recipient VARCHAR(255) COMMENT '수신자',
    sent_status VARCHAR(20) DEFAULT 'PENDING' COMMENT '발송 상태: PENDING, SENT, FAILED',
    sent_at TIMESTAMP COMMENT '발송 시간',
    acknowledged BOOLEAN DEFAULT FALSE COMMENT '확인 여부',
    acknowledged_by BIGINT COMMENT '확인자 ID',
    acknowledged_at TIMESTAMP COMMENT '확인 시간',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_alert_type (alert_type),
    INDEX idx_severity (severity),
    INDEX idx_sent_status (sent_status),
    INDEX idx_acknowledged (acknowledged),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='모니터링 알림 이력 테이블';

-- 8. IP 차단 목록 테이블
CREATE TABLE IF NOT EXISTS ip_blocklist (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(50) UNIQUE NOT NULL COMMENT 'IP 주소',
    block_reason VARCHAR(100) NOT NULL COMMENT '차단 사유',
    threat_type VARCHAR(50) COMMENT '위협 타입',
    block_type VARCHAR(20) DEFAULT 'TEMPORARY' COMMENT '차단 타입: TEMPORARY, PERMANENT',
    blocked_by VARCHAR(50) DEFAULT 'AI_SYSTEM' COMMENT '차단 주체',
    blocked_at TIMESTAMP NOT NULL COMMENT '차단 시간',
    expires_at TIMESTAMP COMMENT '만료 시간',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성 상태',
    unblocked_at TIMESTAMP COMMENT '차단 해제 시간',
    unblocked_by VARCHAR(50) COMMENT '차단 해제자',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_ip_address (ip_address),
    INDEX idx_is_active (is_active),
    INDEX idx_expires_at (expires_at),
    INDEX idx_blocked_at (blocked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='IP 차단 목록 테이블';

