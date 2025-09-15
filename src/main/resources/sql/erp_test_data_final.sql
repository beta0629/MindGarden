-- ERP 시스템 테스트 데이터 생성 (최종 수정)
-- 실제 계산 검증을 위한 샘플 데이터

-- 1. 아이템 테스트 데이터 (먼저 생성)
INSERT INTO items (id, name, description, category, unit_price, stock_quantity, min_stock_level, supplier, supplier_contact, unit, is_active, is_approved, is_deleted, version, created_at, updated_at) VALUES
(5001, '노트북', '개발용 노트북', 'EQUIPMENT', 1500000.00, 5, 2, '삼성전자', '02-1234-5678', '대', true, true, false, 0, NOW(), NOW()),
(5002, '모니터', '24인치 모니터', 'EQUIPMENT', 300000.00, 10, 5, 'LG전자', '02-2345-6789', '대', true, true, false, 0, NOW(), NOW()),
(5003, '의자', '사무용 의자', 'FURNITURE', 200000.00, 20, 10, '이케아', '02-3456-7890', '개', true, true, false, 0, NOW(), NOW()),
(5004, '책상', '사무용 책상', 'FURNITURE', 500000.00, 15, 5, '이케아', '02-3456-7890', '개', true, true, false, 0, NOW(), NOW());

-- 2. 구매 요청 테스트 데이터
INSERT INTO purchase_requests (id, request_number, item_id, quantity, total_amount, status, requester_id, approver_id, reviewer_id, reason, notes, approval_comments, review_comments, requested_at, reviewed_at, approved_at, rejected_at, version, created_at, updated_at) VALUES
(1001, 'PR-2024-001', 5001, 5, 7500000.00, 'PENDING', 1, NULL, NULL, '개발팀 노트북 구매', '급하게 필요함', NULL, NULL, NOW(), NULL, NULL, NULL, 0, NOW(), NOW()),
(1002, 'PR-2024-002', 5002, 10, 3000000.00, 'APPROVED', 1, 1, 1, '모니터 교체', '기존 모니터 노후화', '승인', '검토 완료', NOW(), NOW(), NOW(), NULL, 0, NOW(), NOW()),
(1003, 'PR-2024-003', 5003, 20, 4000000.00, 'REJECTED', 1, 1, 1, '의자 교체', '사무실 의자 교체', NULL, '예산 부족', NOW(), NOW(), NULL, NOW(), 0, NOW(), NOW());

-- 3. 구매 주문 테스트 데이터 (올바른 컬럼명 사용)
INSERT INTO purchase_orders (id, order_number, item_id, purchase_request_id, quantity, unit_price, total_amount, supplier, supplier_contact, order_date, status, purchaser_id, notes, delivery_address, expected_delivery_date, actual_delivery_date, tracking_number, version, created_at, updated_at) VALUES
(2001, 'PO-2024-001', 5001, 1001, 5, 1500000.00, 7500000.00, '삼성전자', '02-1234-5678', '2024-01-20', 'ORDERED', 1, '노트북 5대 주문', '서울시 강남구', '2024-01-25', NULL, 'TRK001', 0, NOW(), NOW()),
(2002, 'PO-2024-002', 5002, 1002, 10, 300000.00, 3000000.00, 'LG전자', '02-2345-6789', '2024-01-21', 'DELIVERED', 1, '모니터 10대 주문', '서울시 강남구', '2024-01-26', '2024-01-26', 'TRK002', 0, NOW(), NOW()),
(2003, 'PO-2024-003', 5003, 1003, 20, 200000.00, 4000000.00, '이케아', '02-3456-7890', '2024-01-22', 'CANCELLED', 1, '의자 20개 주문 (취소됨)', '서울시 강남구', '2024-01-27', NULL, NULL, 0, NOW(), NOW());

-- 4. 예산 테스트 데이터
INSERT INTO budgets (id, budget_name, category, allocated_amount, used_amount, remaining_amount, fiscal_year, quarter, status, branch_code, created_at, updated_at) VALUES
(3001, '2024년 운영비', 'OPERATING', 100000000.00, 15000000.00, 85000000.00, 2024, 1, 'ACTIVE', 'HQ', NOW(), NOW()),
(3002, '2024년 마케팅비', 'MARKETING', 50000000.00, 8000000.00, 42000000.00, 2024, 1, 'ACTIVE', 'HQ', NOW(), NOW()),
(3003, '2024년 장비비', 'EQUIPMENT', 30000000.00, 12000000.00, 18000000.00, 2024, 1, 'ACTIVE', 'HQ', NOW(), NOW()),
(3004, '2024년 인사비', 'PERSONNEL', 200000000.00, 45000000.00, 155000000.00, 2024, 1, 'ACTIVE', 'HQ', NOW(), NOW());

-- 5. 재무 거래 테스트 데이터
INSERT INTO financial_transactions (id, transaction_number, description, amount, transaction_type, category, transaction_date, status, branch_code, created_at, updated_at) VALUES
(4001, 'FT-2024-001', '노트북 구매', 7500000.00, 'EXPENSE', 'EQUIPMENT', '2024-01-20', 'COMPLETED', 'HQ', NOW(), NOW()),
(4002, 'FT-2024-002', '모니터 구매', 3000000.00, 'EXPENSE', 'EQUIPMENT', '2024-01-21', 'COMPLETED', 'HQ', NOW(), NOW()),
(4003, 'FT-2024-003', '월급 지급', 45000000.00, 'EXPENSE', 'PERSONNEL', '2024-01-25', 'COMPLETED', 'HQ', NOW(), NOW()),
(4004, 'FT-2024-004', '상담 수익', 5000000.00, 'INCOME', 'CONSULTATION', '2024-01-30', 'COMPLETED', 'HQ', NOW(), NOW()),
(4005, 'FT-2024-005', '마케팅 비용', 2000000.00, 'EXPENSE', 'MARKETING', '2024-02-01', 'COMPLETED', 'HQ', NOW(), NOW());

-- 6. 세무 계산 테스트 데이터 (CommonCode에 추가)
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, is_deleted, version, extra_data, created_at, updated_at) VALUES
('TAX_CALCULATION', 'VAT_2024_001', '부가가치세 2024-01', '2024년 1월 부가가치세 계산', 1, true, false, 0, '{"baseAmount": 5000000, "taxRate": 10, "taxAmount": 500000, "dueDate": "2024-02-25"}', NOW(), NOW()),
('TAX_CALCULATION', 'INCOME_TAX_2024_001', '소득세 2024-01', '2024년 1월 소득세 계산', 2, true, false, 0, '{"baseAmount": 45000000, "taxRate": 15, "taxAmount": 6750000, "dueDate": "2024-03-10"}', NOW(), NOW()),
('TAX_CALCULATION', 'CORPORATE_TAX_2024_001', '법인세 2024-01', '2024년 1월 법인세 계산', 3, true, false, 0, '{"baseAmount": 10000000, "taxRate": 20, "taxAmount": 2000000, "dueDate": "2024-03-31"}', NOW(), NOW());
