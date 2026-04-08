-- 지출·수입·거래유형 등 재무 공통코드 그룹을 테넌트 전용(code_type=TENANT)으로 정합
-- 목적: /api/v1/tenant/common-codes 생성 시 validateTenantCodeGroup 통과 (운영 공통코드 관리 UI)
-- 참고: PAYMENT_STATUS 등 SYSTEM 그룹은 포함하지 않음

INSERT INTO code_group_metadata (group_name, korean_name, code_type, category, description, icon, is_active, display_order)
VALUES
    ('TRANSACTION_TYPE', '거래 유형', 'TENANT', 'FINANCE', '수입·지출 거래 구분', 'swap', 1, 204),
    ('INCOME_CATEGORY', '수입 카테고리', 'TENANT', 'FINANCE', '수입 항목 분류', 'income', 1, 205),
    ('INCOME_SUBCATEGORY', '수입 세부 항목', 'TENANT', 'FINANCE', '수입 하위 분류', 'list', 1, 206),
    ('EXPENSE_CATEGORY', '지출 카테고리', 'TENANT', 'FINANCE', '지출 항목 분류 (비용 카테고리)', 'expense', 1, 207),
    ('EXPENSE_SUBCATEGORY', '지출 세부 항목', 'TENANT', 'FINANCE', '지출 하위 분류', 'sublist', 1, 208),
    ('FINANCIAL_SUBCATEGORY', '재무 하위 카테고리', 'TENANT', 'FINANCE', '재무 거래 하위 분류', 'layers', 1, 209),
    ('VAT_APPLICABLE', '부가세 적용 여부', 'TENANT', 'FINANCE', '부가세 적용 구분', 'receipt', 1, 210),
    ('TAX_TYPE', '세금 유형', 'TENANT', 'FINANCE', '급여·거래 세금 유형', 'percent', 1, 211),
    ('SALARY_GRADE', '급여 등급', 'TENANT', 'HR', '급여 등급 구분', 'badge', 1, 212)
ON DUPLICATE KEY UPDATE
    code_type = VALUES(code_type),
    category = VALUES(category),
    korean_name = VALUES(korean_name),
    description = VALUES(description),
    is_active = VALUES(is_active);
