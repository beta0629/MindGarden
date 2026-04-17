-- ERP Phase1 D3/D4: 원천징수 예정액을 부가세(tax_amount)와 분리 저장
-- 버전: V20260417_001은 KICC PG, V20260417_002는 카드 수수료 컬럼 이후 적용
ALTER TABLE financial_transactions
    ADD COLUMN withholding_tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00
        COMMENT '원천징수 예정액(부가세와 별도; 사업소득 3.3% 등)' AFTER tax_amount;
