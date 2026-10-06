-- =============================================================================
-- V20260914_006 — 내담자 → 연계 기관 마스터 FK
--
-- 기관 행은 partner_institutions 에만 둔다. 내담자마다 기관을 복제하지 않는다.
-- 여러 내담자가 같은 partner_institution_id 를 가리킨다.
-- 월결제 계약 테이블(institution_link_contracts)과 별개. 가예약 일지 마이그 없음.
-- =============================================================================

ALTER TABLE clients
    ADD COLUMN partner_institution_id BIGINT NULL
        COMMENT 'partner_institutions.id. 타기관 연계 시 필수. 기관 행 복제 금지';

ALTER TABLE clients
    ADD KEY idx_clients_tenant_partner_institution (tenant_id, partner_institution_id);

ALTER TABLE clients
    ADD CONSTRAINT fk_clients_partner_institution
        FOREIGN KEY (partner_institution_id) REFERENCES partner_institutions (id);
