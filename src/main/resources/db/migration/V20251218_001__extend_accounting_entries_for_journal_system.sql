-- =====================================================
-- ERP 고도화: 분개 시스템 완성 (Phase 1-1)
-- 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
-- =====================================================

-- 1. accounting_entries 테이블 확장
-- 1-1. tenant_id를 NOT NULL로 변경 (기존 NULL 데이터는 기본값 설정)
UPDATE accounting_entries SET tenant_id = 'unknown' WHERE tenant_id IS NULL;
ALTER TABLE accounting_entries 
    MODIFY COLUMN tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID';

-- 1-2. 분개 번호 컬럼 추가
ALTER TABLE accounting_entries 
    ADD COLUMN entry_number VARCHAR(100) NULL COMMENT '분개 번호 (테넌트별 독립 채번)';

-- 1-3. 차변/대변 합계 컬럼 추가
ALTER TABLE accounting_entries 
    ADD COLUMN total_debit DECIMAL(15, 2) DEFAULT 0 COMMENT '차변 합계',
    ADD COLUMN total_credit DECIMAL(15, 2) DEFAULT 0 COMMENT '대변 합계';

-- 1-4. 분개 상태 컬럼 추가 (DRAFT/APPROVED/POSTED)
ALTER TABLE accounting_entries 
    ADD COLUMN entry_status VARCHAR(20) DEFAULT 'DRAFT' COMMENT '분개 상태: DRAFT, APPROVED, POSTED';

-- 1-5. 전기 시간 컬럼 추가
ALTER TABLE accounting_entries 
    ADD COLUMN posted_at TIMESTAMP NULL COMMENT '전기 시간';

-- 1-6. entry_number를 NOT NULL로 변경 (기존 데이터는 임시 번호 생성)
UPDATE accounting_entries 
SET entry_number = CONCAT('JE-TEMP-', id, '-', DATE_FORMAT(entry_date, '%Y%m%d'))
WHERE entry_number IS NULL;
ALTER TABLE accounting_entries 
    MODIFY COLUMN entry_number VARCHAR(100) NOT NULL COMMENT '분개 번호';

-- 1-7. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_accounting_entries_tenant_id ON accounting_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_entry_number ON accounting_entries(entry_number);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_tenant_entry_date ON accounting_entries(tenant_id, entry_date);
CREATE UNIQUE INDEX IF NOT EXISTS uk_accounting_entries_tenant_entry_number ON accounting_entries(tenant_id, entry_number);

-- 2. erp_journal_entry_lines 테이블 생성 (분개 상세)
CREATE TABLE IF NOT EXISTS erp_journal_entry_lines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    journal_entry_id BIGINT NOT NULL COMMENT '분개 ID (accounting_entries.id)',
    account_id BIGINT NOT NULL COMMENT '계정 ID (accounts.id)',
    debit_amount DECIMAL(15, 2) DEFAULT 0 COMMENT '차변 금액',
    credit_amount DECIMAL(15, 2) DEFAULT 0 COMMENT '대변 금액',
    description TEXT COMMENT '설명',
    line_number INT NOT NULL COMMENT '라인 번호',
    
    -- 감사 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT COMMENT '생성자 ID',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by BIGINT COMMENT '수정자 ID',
    
    -- 소프트 삭제
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    deleted_by BIGINT COMMENT '삭제자 ID',
    
    FOREIGN KEY (journal_entry_id) REFERENCES accounting_entries(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    
    INDEX idx_erp_journal_entry_lines_tenant_id (tenant_id),
    INDEX idx_erp_journal_entry_lines_journal_entry_id (journal_entry_id),
    INDEX idx_erp_journal_entry_lines_account_id (account_id),
    INDEX idx_erp_journal_entry_lines_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='분개 상세 테이블';

