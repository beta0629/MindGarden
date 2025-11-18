-- ============================================
-- Week 4 Day 5: ERD mermaid_code 컬럼 타입 수정
-- ============================================
-- 목적: mermaid_code가 TEXT 타입으로는 부족하여 LONGTEXT로 변경
-- 작성일: 2025-01-XX
-- ============================================

-- mermaid_code 컬럼을 LONGTEXT로 변경 (최대 4GB)
ALTER TABLE erd_diagrams 
MODIFY COLUMN mermaid_code LONGTEXT NOT NULL COMMENT 'Mermaid ERD 코드';

-- text_erd 컬럼도 LONGTEXT로 변경 (일관성)
ALTER TABLE erd_diagrams 
MODIFY COLUMN text_erd LONGTEXT COMMENT '텍스트 ERD';

-- erd_diagram_history 테이블의 mermaid_code도 LONGTEXT로 변경
ALTER TABLE erd_diagram_history 
MODIFY COLUMN mermaid_code LONGTEXT COMMENT '변경된 Mermaid ERD 코드';

