-- =============================================================================
-- V20260615_001 — PII 재암호화 진행률 추적 테이블 신설
--
-- 작성 일자 : 2026-06-15
-- 브랜치    : feat/pii-rotation-phase1
-- 표준      :
--   • docs/standards/PII_KEY_ROTATION_REENCRYPTION_DESIGN.md §3.2.3 (Phase 1)
--   • docs/standards/SECRET_ROTATION_POLICY.md v1.2.0 §3.4 (PII KEY/IV)
--   • docs/standards/PII_PROTECTION_STANDARD.md
--   • docs/standards/DATABASE_MIGRATION_STANDARD.md (안전 ALTER 절차)
--
-- 배경 (one-liner)
--   • PII KEY/IV 회전 (옵션 B Dual-Read + 백그라운드 배치) 의 재시작·진행률·실패
--     chunk 추적을 위한 SSOT 테이블을 신설한다. 본 PR (Phase 1 인프라) 에서는 테이블·
--     관리 메서드만 추가하고, 실제 회전 실행은 Phase 2 PR 에서 별도 트리거로 진행한다.
--   • 본 테이블은 운영 PII 데이터를 보관하지 않는다. chunk 메타·상태·키 ID·집계만
--     기록하므로 평문/암호문 누출 위험이 없다.
--
-- 변경
--   • CREATE TABLE pii_reencryption_progress (신규, IF NOT EXISTS)
--     - 테이블별·target_key_id 별 chunk 진행률 SSOT
--     - status: PENDING / IN_PROGRESS / DONE / FAILED / SKIPPED
--     - UNIQUE (table_name, chunk_no, target_key_id) — chunk 중복 적재 방지
--     - INDEX (status, table_name) — 실패 chunk 재시도·진행률 조회 최적화
--
-- 사전 검증 (운영 DB 안전성)
--   • 신규 테이블 생성만 — 기존 데이터 변경 없음
--   • InnoDB row 포맷 / utf8mb4 collation — 다른 운영 테이블과 동일 정합
--   • IF NOT EXISTS — 재실행 안전
--
-- 회귀 위험
--   • 0건 — 본 테이블에 의존하는 운영 코드는 본 PR 에서 신설된 회전 서비스 / admin
--     endpoint 뿐이다. 기존 트래픽·스케줄러·배치는 영향 없음.
--
-- 참조
--   • docs/standards/PII_KEY_ROTATION_REENCRYPTION_DESIGN.md §3.2 Phase 1
--   • src/main/java/com/coresolution/consultation/service/PersonalDataKeyRotationService.java
-- =============================================================================

CREATE TABLE IF NOT EXISTS pii_reencryption_progress (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(64) NOT NULL COMMENT '회전 대상 테이블 — users / clients / accounts / branches / dormant_user_pii_vault',
    chunk_no INT NOT NULL COMMENT 'chunk 일련번호 (0부터 증가, table_name+target_key_id 단위)',
    chunk_start_id BIGINT NULL COMMENT 'chunk 의 PK 시작 (포함, 빈 chunk 는 NULL)',
    chunk_end_id BIGINT NULL COMMENT 'chunk 의 PK 끝 (포함, 빈 chunk 는 NULL)',
    status VARCHAR(16) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING / IN_PROGRESS / DONE / FAILED / SKIPPED',
    rows_total INT NULL COMMENT 'chunk 총 row 수 (실제 fetch 결과)',
    rows_done INT NULL COMMENT '실제 재암호화에 성공한 row 수 (변경 없는 row 는 미포함 가능)',
    error_message TEXT NULL COMMENT '실패 시 sanitize 된 에러 요약 (PII 평문 절대 금지)',
    started_at DATETIME NULL COMMENT 'chunk IN_PROGRESS 진입 시각 (서버 LocalDateTime, KST)',
    finished_at DATETIME NULL COMMENT 'DONE / FAILED / SKIPPED 종료 시각',
    active_key_id VARCHAR(16) NOT NULL COMMENT '회전 시점의 활성 키 ID 스냅샷',
    target_key_id VARCHAR(16) NOT NULL COMMENT '회전 목표 키 ID (Phase 1 에서는 active_key_id 와 동일)',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'progress 행 신설 시각',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '상태 업데이트 시각',
    UNIQUE KEY uniq_table_chunk_target (table_name, chunk_no, target_key_id),
    KEY idx_pii_progress_status (status, table_name),
    KEY idx_pii_progress_target_key (target_key_id, table_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='PII KEY/IV 회전 chunk 진행률 SSOT (PII_KEY_ROTATION_REENCRYPTION_DESIGN §3.2.3)';
