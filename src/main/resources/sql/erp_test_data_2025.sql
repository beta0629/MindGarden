-- ERP 시스템 2025년 테스트 데이터 생성
-- 9월 데이터 포함

-- 1. 재무 거래 테스트 데이터 (2025년 9월)
INSERT INTO financial_transactions (id, description, amount, amount_before_tax, tax_amount, tax_included, transaction_type, category, subcategory, transaction_date, status, department, project_code, related_entity_id, related_entity_type, remarks, approval_comment, approved_at, approver_id, category_code_id, subcategory_code_id, is_deleted, created_at, updated_at, branch_code) VALUES
(5001, '9월 상담 수익 - 본점', 3000000.00, 2727272.73, 272727.27, true, 'INCOME', 'CONSULTATION', 'SERVICE', '2025-09-15', 'COMPLETED', '상담팀', 'PRJ-001', NULL, NULL, '2025년 9월 상담 수익', '승인', NOW(), 1, NULL, NULL, false, NOW(), NOW(), 'MAIN001'),
(5002, '9월 상담 수익 - 강남점', 2500000.00, 2272727.27, 227272.73, true, 'INCOME', 'CONSULTATION', 'SERVICE', '2025-09-16', 'COMPLETED', '상담팀', 'PRJ-002', NULL, NULL, '2025년 9월 상담 수익', '승인', NOW(), 1, NULL, NULL, false, NOW(), NOW(), 'GN001'),
(5003, '9월 상담 수익 - 홍대점', 2000000.00, 1818181.82, 181818.18, true, 'INCOME', 'CONSULTATION', 'SERVICE', '2025-09-17', 'COMPLETED', '상담팀', 'PRJ-003', NULL, NULL, '2025년 9월 상담 수익', '승인', NOW(), 1, NULL, NULL, false, NOW(), NOW(), 'HD001'),
(5004, '9월 상담 수익 - 잠실점', 1500000.00, 1363636.36, 136363.64, true, 'INCOME', 'CONSULTATION', 'SERVICE', '2025-09-18', 'COMPLETED', '상담팀', 'PRJ-004', NULL, NULL, '2025년 9월 상담 수익', '승인', NOW(), 1, NULL, NULL, false, NOW(), NOW(), 'JS001'),
(5005, '9월 상담 수익 - 신촌점', 1000000.00, 909090.91, 90909.09, true, 'INCOME', 'CONSULTATION', 'SERVICE', '2025-09-19', 'COMPLETED', '상담팀', 'PRJ-005', NULL, NULL, '2025년 9월 상담 수익', '승인', NOW(), 1, NULL, NULL, false, NOW(), NOW(), 'SC001'),

-- 9월 지출 데이터
(5006, '9월 월급 지급 - 본점', 8000000.00, 8000000.00, 0.00, false, 'EXPENSE', 'PERSONNEL', 'SALARY', '2025-09-15', 'COMPLETED', '인사팀', 'PRJ-001', NULL, NULL, '2025년 9월 직원 월급', '승인', NOW(), 1, NULL, NULL, false, NOW(), NOW(), 'MAIN001'),
(5007, '9월 월급 지급 - 강남점', 6000000.00, 6000000.00, 0.00, false, 'EXPENSE', 'PERSONNEL', 'SALARY', '2025-09-16', 'COMPLETED', '인사팀', 'PRJ-002', NULL, NULL, '2025년 9월 직원 월급', '승인', NOW(), 1, NULL, NULL, false, NOW(), NOW(), 'GN001'),
(5008, '9월 월급 지급 - 홍대점', 5000000.00, 5000000.00, 0.00, false, 'EXPENSE', 'PERSONNEL', 'SALARY', '2025-09-17', 'COMPLETED', '인사팀', 'PRJ-003', NULL, NULL, '2025년 9월 직원 월급', '승인', NOW(), 1, NULL, NULL, false, NOW(), NOW(), 'HD001'),
(5009, '9월 월급 지급 - 잠실점', 4000000.00, 4000000.00, 0.00, false, 'EXPENSE', 'PERSONNEL', 'SALARY', '2025-09-18', 'COMPLETED', '인사팀', 'PRJ-004', NULL, NULL, '2025년 9월 직원 월급', '승인', NOW(), 1, NULL, NULL, false, NOW(), NOW(), 'JS001'),
(5010, '9월 월급 지급 - 신촌점', 3000000.00, 3000000.00, 0.00, false, 'EXPENSE', 'PERSONNEL', 'SALARY', '2025-09-19', 'COMPLETED', '인사팀', 'PRJ-005', NULL, NULL, '2025년 9월 직원 월급', '승인', NOW(), 1, NULL, NULL, false, NOW(), NOW(), 'SC001'),

-- 9월 기타 지출
(5011, '9월 임대료 - 본점', 2000000.00, 1818181.82, 181818.18, true, 'EXPENSE', 'RENT', 'OFFICE', '2025-09-15', 'COMPLETED', '관리팀', 'PRJ-001', NULL, NULL, '2025년 9월 사무실 임대료', '승인', NOW(), 1, NULL, NULL, false, NOW(), NOW(), 'MAIN001'),
(5012, '9월 임대료 - 강남점', 1500000.00, 1363636.36, 136363.64, true, 'EXPENSE', 'RENT', 'OFFICE', '2025-09-16', 'COMPLETED', '관리팀', 'PRJ-002', NULL, NULL, '2025년 9월 사무실 임대료', '승인', NOW(), 1, NULL, NULL, false, NOW(), NOW(), 'GN001'),
(5013, '9월 마케팅비 - 본점', 1000000.00, 909090.91, 90909.09, true, 'EXPENSE', 'MARKETING', 'ADVERTISING', '2025-09-17', 'COMPLETED', '마케팅팀', 'PRJ-001', NULL, NULL, '2025년 9월 온라인 광고비', '승인', NOW(), 1, NULL, NULL, false, NOW(), NOW(), 'MAIN001'),
(5014, '9월 마케팅비 - 강남점', 800000.00, 727272.73, 72727.27, true, 'EXPENSE', 'MARKETING', 'ADVERTISING', '2025-09-18', 'COMPLETED', '마케팅팀', 'PRJ-002', NULL, NULL, '2025년 9월 온라인 광고비', '승인', NOW(), 1, NULL, NULL, false, NOW(), NOW(), 'GN001'),
(5015, '9월 장비비 - 본점', 500000.00, 454545.45, 45454.55, true, 'EXPENSE', 'EQUIPMENT', 'COMPUTER', '2025-09-19', 'COMPLETED', 'IT팀', 'PRJ-001', NULL, NULL, '2025년 9월 장비 구매', '승인', NOW(), 1, NULL, NULL, false, NOW(), NOW(), 'MAIN001');

-- 2. 8월 데이터 (비어있어야 함)
-- 8월에는 데이터가 없으므로 INSERT하지 않음

-- 3. 7월 데이터 (비어있어야 함)  
-- 7월에는 데이터가 없으므로 INSERT하지 않음
