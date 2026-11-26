-- 매핑 이력 event_type 주석에 배정 변경(회기 정정) REASSIGN 계열 추가.
-- 컬럼은 VARCHAR(40) STRING enum — DDL 변경 없음. 기존 마이그레이션 수정 금지.
-- @author MindGarden
-- @since 2026-11-26

ALTER TABLE consultant_client_mapping_history
    MODIFY COLUMN event_type VARCHAR(40) NOT NULL
        COMMENT 'CREATED / UPDATED / PARTIAL_REFUND / TERMINATED / RESTORED / SESSION_USED / SESSION_ADDED / STATUS_CHANGED / SESSION_REASSIGN_OUT / SESSION_REASSIGN_IN';
