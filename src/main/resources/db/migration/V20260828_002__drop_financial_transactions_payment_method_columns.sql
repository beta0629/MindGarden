-- =============================================================================
-- V20260828_002__drop_financial_transactions_payment_method_columns.sql
-- cardMerchantFeeAmount(D5) SSOT: 결제 수단은 Payment·Mapping에만 존재.
-- V20260828_001 에 추가된 payment_method/card_issuer 컬럼 제거.
-- =============================================================================

ALTER TABLE financial_transactions
    DROP COLUMN IF EXISTS payment_method,
    DROP COLUMN IF EXISTS card_issuer;
