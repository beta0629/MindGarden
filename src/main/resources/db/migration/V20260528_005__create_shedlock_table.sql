-- =============================================================================
-- ShedLock 메타 테이블 생성 (트랙 A 핫픽스, 2026-05-23)
-- 기획: WELLNESS_DAILY_TIP_DUPLICATE_DEBUG_REPORT §5#21 D6-1 — blue/green 컷오버
--       09:00 ± n 분 겹쳐 첫 cron 미실행 → ShedLock 으로 분산 락 및 중복 차단.
-- 적용 스케줄러: WellnessNotificationScheduler.sendDailyWellnessTip (name='wellness-notification')
-- ShedLock 5.13.0 표준 스키마 (JdbcTemplateLockProvider 기본 매핑).
-- 멱등 패턴: CREATE TABLE IF NOT EXISTS — 재실행 NO-OP.
-- 운영 영향: 신규 테이블 1건만 추가 (기존 데이터 무변경).
-- 보존: 솔라피 V20260528_003 미적용 보존 — 본 마이그레이션은 005 로 다음 슬롯 사용.
-- =============================================================================

CREATE TABLE IF NOT EXISTS shedlock (
    name        VARCHAR(64)  NOT NULL,
    lock_until  TIMESTAMP(3) NOT NULL,
    locked_at   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    locked_by   VARCHAR(255) NOT NULL,
    PRIMARY KEY (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='ShedLock 분산 락 (스케줄러 중복 실행 방지)';
