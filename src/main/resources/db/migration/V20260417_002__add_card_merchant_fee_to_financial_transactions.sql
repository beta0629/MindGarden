-- ERP D5: 카드 승인액 대비 가맹점 수수료(실입금 = amount - card_merchant_fee_amount)
ALTER TABLE financial_transactions
    ADD COLUMN card_merchant_fee_amount DECIMAL(15, 2) NOT NULL DEFAULT 0;
