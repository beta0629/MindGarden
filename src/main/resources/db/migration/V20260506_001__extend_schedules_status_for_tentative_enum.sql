-- ScheduleStatus.TENTATIVE_PENDING_PAYMENT 등 긴 enum 문자열 저장 (기존 행 값 유지)
ALTER TABLE schedules MODIFY COLUMN status VARCHAR(32) NOT NULL;
