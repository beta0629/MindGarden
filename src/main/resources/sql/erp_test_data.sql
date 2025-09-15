-- ERP 시스템 테스트 데이터 생성
-- 실제 계산 검증을 위한 샘플 데이터

-- 1. 구매 요청 테스트 데이터
INSERT INTO purchase_requests (id, request_number, item_name, description, quantity, unit_price, total_amount, request_date, status, requester_id, branch_code, created_at, updated_at) VALUES
(1001, 'PR-2024-001', '노트북', '개발용 노트북', 5, 1500000, 7500000, '2024-01-15', 'PENDING', 1, 'HQ', NOW(), NOW()),
(1002, 'PR-2024-002', '모니터', '24인치 모니터', 10, 300000, 3000000, '2024-01-16', 'APPROVED', 1, 'HQ', NOW(), NOW()),
(1003, 'PR-2024-003', '의자', '사무용 의자', 20, 200000, 4000000, '2024-01-17', 'REJECTED', 1, 'HQ', NOW(), NOW());

-- 2. 구매 주문 테스트 데이터
INSERT INTO purchase_orders (id, order_number, supplier_name, supplier_contact, total_amount, order_date, status, approver_id, branch_code, created_at, updated_at) VALUES
(2001, 'PO-2024-001', '삼성전자', '02-1234-5678', 7500000, '2024-01-20', 'PENDING', 1, 'HQ', NOW(), NOW()),
(2002, 'PO-2024-002', 'LG전자', '02-2345-6789', 3000000, '2024-01-21', 'COMPLETED', 1, 'HQ', NOW(), NOW()),
(2003, 'PO-2024-003', '이케아', '02-3456-7890', 4000000, '2024-01-22', 'CANCELLED', 1, 'HQ', NOW(), NOW());

-- 3. 예산 테스트 데이터
INSERT INTO budgets (id, budget_name, category, allocated_amount, used_amount, remaining_amount, fiscal_year, quarter, status, branch_code, created_at, updated_at) VALUES
(3001, '2024년 운영비', 'OPERATING', 100000000, 15000000, 85000000, 2024, 1, 'ACTIVE', 'HQ', NOW(), NOW()),
(3002, '2024년 마케팅비', 'MARKETING', 50000000, 8000000, 42000000, 2024, 1, 'ACTIVE', 'HQ', NOW(), NOW()),
(3003, '2024년 장비비', 'EQUIPMENT', 30000000, 12000000, 18000000, 2024, 1, 'ACTIVE', 'HQ', NOW(), NOW()),
(3004, '2024년 인사비', 'PERSONNEL', 200000000, 45000000, 155000000, 2024, 1, 'ACTIVE', 'HQ', NOW(), NOW());

-- 4. 재무 거래 테스트 데이터
INSERT INTO financial_transactions (id, transaction_number, description, amount, transaction_type, category, transaction_date, status, branch_code, created_at, updated_at) VALUES
(4001, 'FT-2024-001', '노트북 구매', 7500000, 'EXPENSE', 'EQUIPMENT', '2024-01-20', 'COMPLETED', 'HQ', NOW(), NOW()),
(4002, 'FT-2024-002', '모니터 구매', 3000000, 'EXPENSE', 'EQUIPMENT', '2024-01-21', 'COMPLETED', 'HQ', NOW(), NOW()),
(4003, 'FT-2024-003', '월급 지급', 45000000, 'EXPENSE', 'PERSONNEL', '2024-01-25', 'COMPLETED', 'HQ', NOW(), NOW()),
(4004, 'FT-2024-004', '상담 수익', 5000000, 'INCOME', 'CONSULTATION', '2024-01-30', 'COMPLETED', 'HQ', NOW(), NOW()),
(4005, 'FT-2024-005', '마케팅 비용', 2000000, 'EXPENSE', 'MARKETING', '2024-02-01', 'COMPLETED', 'HQ', NOW(), NOW());

-- 5. 세무 계산 테스트 데이터 (CommonCode에 추가)
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, is_deleted, version, extra_data, created_at, updated_at) VALUES
('TAX_CALCULATION', 'VAT_2024_001', '부가가치세 2024-01', '2024년 1월 부가가치세 계산', 1, true, false, 0, '{"baseAmount": 5000000, "taxRate": 10, "taxAmount": 500000, "dueDate": "2024-02-25"}', NOW(), NOW()),
('TAX_CALCULATION', 'INCOME_TAX_2024_001', '소득세 2024-01', '2024년 1월 소득세 계산', 2, true, false, 0, '{"baseAmount": 45000000, "taxRate": 15, "taxAmount": 6750000, "dueDate": "2024-03-10"}', NOW(), NOW()),
('TAX_CALCULATION', 'CORPORATE_TAX_2024_001', '법인세 2024-01', '2024년 1월 법인세 계산', 3, true, false, 0, '{"baseAmount": 10000000, "taxRate": 20, "taxAmount": 2000000, "dueDate": "2024-03-31"}', NOW(), NOW());

-- 6. 아이템 테스트 데이터
INSERT INTO items (id, item_code, item_name, description, category, unit_price, stock_quantity, min_stock_level, supplier, branch_code, created_at, updated_at) VALUES
(5001, 'ITEM-001', '노트북', '개발용 노트북', 'EQUIPMENT', 1500000, 5, 2, '삼성전자', 'HQ', NOW(), NOW()),
(5002, 'ITEM-002', '모니터', '24인치 모니터', 'EQUIPMENT', 300000, 10, 5, 'LG전자', 'HQ', NOW(), NOW()),
(5003, 'ITEM-003', '의자', '사무용 의자', 'FURNITURE', 200000, 20, 10, '이케아', 'HQ', NOW(), NOW()),
(5004, 'ITEM-004', '책상', '사무용 책상', 'FURNITURE', 500000, 15, 5, '이케아', 'HQ', NOW(), NOW());
