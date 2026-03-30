-- =====================================================
-- 스케줄러 실행 로그 테이블 생성
-- 작성일: 2025-12-02
-- 설명: 배치 작업 표준화 - 스케줄러 실행 이력 관리
-- =====================================================

-- 1. 스케줄러 실행 로그 테이블
CREATE TABLE IF NOT EXISTS scheduler_execution_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    execution_id VARCHAR(50) NOT NULL COMMENT '실행 ID (UUID)',
    tenant_id VARCHAR(36) COMMENT '테넌트 ID',
    scheduler_name VARCHAR(100) NOT NULL COMMENT '스케줄러명',
    status VARCHAR(20) NOT NULL COMMENT '상태: SUCCESS, FAILED, RUNNING',
    result_data JSON COMMENT '실행 결과 데이터',
    error_message TEXT COMMENT '오류 메시지',
    execution_time BIGINT COMMENT '실행 시간 (ms)',
    started_at TIMESTAMP NOT NULL COMMENT '시작 시간',
    completed_at TIMESTAMP COMMENT '완료 시간',
    
    INDEX idx_execution_id (execution_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_scheduler_name (scheduler_name),
    INDEX idx_status (status),
    INDEX idx_started_at (started_at),
    INDEX idx_tenant_scheduler_date (tenant_id, scheduler_name, started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='스케줄러 실행 로그 테이블';

-- 2. 스케줄러 실행 요약 로그 테이블
CREATE TABLE IF NOT EXISTS scheduler_execution_summary (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    execution_id VARCHAR(50) UNIQUE NOT NULL COMMENT '실행 ID (UUID)',
    scheduler_name VARCHAR(100) NOT NULL COMMENT '스케줄러명',
    total_tenants INT NOT NULL COMMENT '전체 테넌트 수',
    success_count INT NOT NULL COMMENT '성공 수',
    failure_count INT NOT NULL COMMENT '실패 수',
    total_duration BIGINT NOT NULL COMMENT '총 실행 시간 (ms)',
    started_at TIMESTAMP NOT NULL COMMENT '시작 시간',
    completed_at TIMESTAMP NOT NULL COMMENT '완료 시간',
    
    INDEX idx_execution_id (execution_id),
    INDEX idx_scheduler_name (scheduler_name),
    INDEX idx_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='스케줄러 실행 요약 로그 테이블';

-- 3. 초기 데이터: 현재 운영 중인 스케줄러 목록 (참고용)
-- INSERT INTO scheduler_execution_summary (execution_id, scheduler_name, total_tenants, success_count, failure_count, total_duration, started_at, completed_at)
-- VALUES 
-- ('init', 'SalaryBatchScheduler', 0, 0, 0, 0, NOW(), NOW()),
-- ('init', 'SubscriptionSchedulerConfig', 0, 0, 0, 0, NOW(), NOW()),
-- ('init', 'ScheduleAutoCompleteService', 0, 0, 0, 0, NOW(), NOW()),
-- ('init', 'StatisticsSchedulerServiceImpl', 0, 0, 0, 0, NOW(), NOW()),
-- ('init', 'WellnessNotificationScheduler', 0, 0, 0, 0, NOW(), NOW()),
-- ('init', 'ConsultationRecordAlertScheduler', 0, 0, 0, 0, NOW(), NOW());

