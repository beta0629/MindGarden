-- V72: 상담사 역량 강화 및 교육 테이블 생성
-- 상담 피드백, 가상 내담자 시뮬레이션
-- 작성일: 2026-01-21

-- 상담사 피드백
CREATE TABLE IF NOT EXISTS counselor_feedbacks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    consultant_id BIGINT NOT NULL COMMENT '상담사 ID',
    consultation_record_id BIGINT COMMENT '상담 기록 ID (실제 상담)',

    -- 상담 기법 평가
    empathic_listening_score DECIMAL(3,2) COMMENT '공감적 경청 점수 (0-1)',
    questioning_technique_score DECIMAL(3,2) COMMENT '질문 기법 점수 (0-1)',
    intervention_timing_score DECIMAL(3,2) COMMENT '개입 타이밍 점수 (0-1)',
    rapport_building_score DECIMAL(3,2) COMMENT '라포 형성 점수 (0-1)',

    -- 전체 평가
    overall_performance_score DECIMAL(3,2) COMMENT '전체 수행 점수 (0-1)',
    performance_level VARCHAR(20) COMMENT '수행 수준 (EXCELLENT, GOOD, NEEDS_IMPROVEMENT)',

    -- 강점 및 개선 영역
    strengths JSON COMMENT '강점 목록',
    areas_for_improvement JSON COMMENT '개선이 필요한 영역',

    -- AI 생성 피드백
    ai_feedback_summary TEXT COMMENT 'AI 생성 피드백 요약',
    specific_recommendations TEXT COMMENT '구체적인 개선 제안',
    example_responses JSON COMMENT '모범 응답 예시',

    -- 분석 메타 정보
    analysis_model VARCHAR(100) DEFAULT 'gemini-pro' COMMENT 'AI 모델',
    feedback_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '피드백 생성 일시',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    version INT DEFAULT 0,

    INDEX idx_consultant (consultant_id),
    INDEX idx_consultation_record (consultation_record_id),
    INDEX idx_tenant (tenant_id),
    INDEX idx_performance_level (performance_level),

    FOREIGN KEY (consultant_id) REFERENCES consultants(id),
    FOREIGN KEY (consultation_record_id) REFERENCES consultation_records(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='상담사 피드백';

-- 가상 내담자 시뮬레이션 세션
CREATE TABLE IF NOT EXISTS virtual_client_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    consultant_id BIGINT NOT NULL COMMENT '상담사 ID',

    -- 시나리오 정보
    scenario_type VARCHAR(100) COMMENT '시나리오 유형 (예: 우울증, 불안장애, 성격장애)',
    difficulty_level VARCHAR(20) DEFAULT 'MEDIUM' COMMENT '난이도 (BEGINNER, INTERMEDIATE, ADVANCED)',

    -- 가상 내담자 프로필
    virtual_client_profile JSON COMMENT '가상 내담자 프로필 (나이, 성별, 증상 등)',
    presenting_problem TEXT COMMENT '호소 문제',
    background_story TEXT COMMENT '배경 스토리',

    -- 대화 기록
    conversation_history JSON COMMENT '대화 이력 [{role, message, timestamp}]',
    turn_count INT DEFAULT 0 COMMENT '대화 턴 수',

    -- 평가 결과
    counselor_performance_score DECIMAL(3,2) COMMENT '상담사 수행 점수',
    technique_used JSON COMMENT '사용한 상담 기법',
    mistakes_made JSON COMMENT '실수한 부분',
    good_responses JSON COMMENT '좋은 응답',

    -- AI 평가
    ai_evaluation_summary TEXT COMMENT 'AI 평가 요약',
    learning_points JSON COMMENT '학습 포인트',

    -- 세션 상태
    session_status VARCHAR(20) DEFAULT 'IN_PROGRESS' COMMENT '세션 상태 (IN_PROGRESS, COMPLETED, ABANDONED)',
    completed_at TIMESTAMP COMMENT '완료 시각',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    version INT DEFAULT 0,

    INDEX idx_consultant (consultant_id),
    INDEX idx_tenant (tenant_id),
    INDEX idx_scenario (scenario_type),
    INDEX idx_status (session_status),

    FOREIGN KEY (consultant_id) REFERENCES consultants(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='가상 내담자 시뮬레이션 세션';

-- 상담 기법 평가 기록
CREATE TABLE IF NOT EXISTS counseling_technique_evaluations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    consultant_id BIGINT NOT NULL COMMENT '상담사 ID',
    session_id BIGINT COMMENT '시뮬레이션 세션 ID (가상 상담)',
    consultation_record_id BIGINT COMMENT '상담 기록 ID (실제 상담)',

    -- 평가 대상 발화
    counselor_statement TEXT COMMENT '상담사 발화',
    client_context TEXT COMMENT '내담자 문맥',

    -- 기법 분류
    technique_type VARCHAR(100) COMMENT '상담 기법 유형 (개방형 질문, 반영, 재진술 등)',
    technique_effectiveness DECIMAL(3,2) COMMENT '기법 효과성 (0-1)',

    -- 평가 결과
    is_appropriate BOOLEAN COMMENT '적절성 여부',
    timing_quality VARCHAR(20) COMMENT '타이밍 적절성 (EXCELLENT, GOOD, POOR)',

    -- AI 피드백
    ai_feedback TEXT COMMENT 'AI 피드백',
    suggested_alternative TEXT COMMENT '제안하는 대안 응답',

    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '평가 일시',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,

    INDEX idx_consultant (consultant_id),
    INDEX idx_session (session_id),
    INDEX idx_technique (technique_type),
    INDEX idx_tenant (tenant_id),

    FOREIGN KEY (consultant_id) REFERENCES consultants(id),
    FOREIGN KEY (session_id) REFERENCES virtual_client_sessions(id),
    FOREIGN KEY (consultation_record_id) REFERENCES consultation_records(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='상담 기법 평가 기록';

-- 시뮬레이션 시나리오 템플릿
CREATE TABLE IF NOT EXISTS simulation_scenario_templates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',

    -- 시나리오 기본 정보
    scenario_name VARCHAR(200) NOT NULL COMMENT '시나리오명',
    scenario_type VARCHAR(100) COMMENT '시나리오 유형',
    difficulty_level VARCHAR(20) DEFAULT 'MEDIUM' COMMENT '난이도',

    -- 가상 내담자 설정
    client_profile JSON COMMENT '내담자 프로필 템플릿',
    initial_presentation TEXT COMMENT '초기 호소',
    background_template TEXT COMMENT '배경 스토리 템플릿',

    -- 학습 목표
    learning_objectives JSON COMMENT '학습 목표',
    key_skills_practiced JSON COMMENT '연습할 핵심 기술',

    -- 시나리오 진행
    expected_turns INT DEFAULT 10 COMMENT '예상 대화 턴 수',
    crisis_points JSON COMMENT '위기 시점 (특정 턴에서 위기 상황 발생)',

    -- 평가 기준
    evaluation_criteria JSON COMMENT '평가 기준',
    passing_score DECIMAL(3,2) DEFAULT 0.7 COMMENT '합격 점수',

    -- 메타 정보
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성 여부',
    usage_count INT DEFAULT 0 COMMENT '사용 횟수',
    avg_completion_rate DECIMAL(3,2) COMMENT '평균 완료율',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    version INT DEFAULT 0,

    INDEX idx_scenario_type (scenario_type),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_tenant (tenant_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='시뮬레이션 시나리오 템플릿';
