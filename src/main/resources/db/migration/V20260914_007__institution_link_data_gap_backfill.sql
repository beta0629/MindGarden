-- =============================================================================
-- V20260914_007 — 타기관(INSTITUTION_LINK) 연계 데이터 갭 백필 (멱등)
--
-- 전제: V20260914_002~006 이 이미 적용된 환경(DEV/PROD flyway_history 확인됨).
-- 범위: 안전한 단건·조건부 UPDATE 만. ERP 전표 INSERT/수정 없음. 대량 삭제 없음.
--
-- 적용 대상 (2026-09-14 READ-ONLY 실측):
--   • PROD contract#1 prepaid_amount 0 → clients.institution_prepaid_amount(100000)
--   • PROD institution_link_consultation_logs#1 contract_id NULL → contract#1
--   • DEV  clients#78 institution_name NULL → partner_institutions.name
--
-- 의도적으로 남김 (본 스크립트 미처리):
--   • mapping#245 ACTIVE 이며 source_mapping 미연결 (schedule#378 이력 유지)
--   • mapping#242 TERMINATED SAME_DAY + schedule#373 (전환 전 가예약/당일카드 이력)
--   • consultation_records#328/#355 → 타기관 일지 이관 (본문 복사 별도 배치)
--   • monthly_amount=0 (월 고정 주기 아님, INSTITUTION_LINK_FINANCE.md)
--   • financial_transactions ERP 재전기 (전표 금지)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) 계약 선납액: 내담자 denorm(institution_prepaid_amount) → contract.prepaid_amount
--    tenant-safe. prepaid=0 이고 내담자 선납 확정(금액>0)일 때만.
-- -----------------------------------------------------------------------------
UPDATE institution_link_contracts c
INNER JOIN clients cl
    ON cl.id = c.client_id
   AND cl.tenant_id = c.tenant_id
SET c.prepaid_amount = cl.institution_prepaid_amount,
    c.prepaid_at = COALESCE(c.prepaid_at, CURRENT_TIMESTAMP(6)),
    c.updated_at = CURRENT_TIMESTAMP(6)
WHERE c.is_deleted = FALSE
  AND c.tenant_id IS NOT NULL
  AND c.tenant_id <> ''
  AND cl.engagement_type = 'INSTITUTION_LINK'
  AND cl.institution_prepaid = TRUE
  AND cl.institution_prepaid_amount IS NOT NULL
  AND cl.institution_prepaid_amount > 0
  AND c.prepaid_amount = 0;

-- -----------------------------------------------------------------------------
-- 2) 타기관 일지 contract_id NULL: 동일 tenant+client 활성 계약이 정확히 1건일 때만
-- -----------------------------------------------------------------------------
UPDATE institution_link_consultation_logs l
INNER JOIN institution_link_contracts c
    ON c.tenant_id = l.tenant_id
   AND c.client_id = l.client_id
   AND c.is_deleted = FALSE
SET l.contract_id = c.id,
    l.updated_at = CURRENT_TIMESTAMP(6)
WHERE l.is_deleted = FALSE
  AND l.contract_id IS NULL
  AND l.tenant_id IS NOT NULL
  AND l.tenant_id <> ''
  AND (
      SELECT COUNT(*)
      FROM institution_link_contracts c2
      WHERE c2.tenant_id = l.tenant_id
        AND c2.client_id = l.client_id
        AND c2.is_deleted = FALSE
  ) = 1;

-- -----------------------------------------------------------------------------
-- 3) 내담자 institution_name denorm: partner_institutions.name 백필 (NULL/빈문자만)
-- -----------------------------------------------------------------------------
UPDATE clients cl
INNER JOIN partner_institutions pi
    ON pi.id = cl.partner_institution_id
   AND pi.tenant_id = cl.tenant_id
   AND pi.is_deleted = FALSE
SET cl.institution_name = pi.name,
    cl.updated_at = CURRENT_TIMESTAMP(6)
WHERE cl.engagement_type = 'INSTITUTION_LINK'
  AND cl.partner_institution_id IS NOT NULL
  AND cl.tenant_id IS NOT NULL
  AND cl.tenant_id <> ''
  AND (cl.is_deleted = FALSE OR cl.is_deleted IS NULL)
  AND (cl.institution_name IS NULL OR cl.institution_name = '');
