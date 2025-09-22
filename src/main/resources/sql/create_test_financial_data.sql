-- 지점별 재무 거래 테스트 데이터 생성
-- 각 지점별로 수입/지출 데이터를 생성하여 ERP 시스템 테스트

-- 1. 본점 (MAIN001) 테스트 데이터
INSERT INTO financial_transactions (
    transaction_type, category, subcategory, amount, description, 
    transaction_date, status, branch_code, is_deleted, created_at, updated_at
) VALUES 
-- 본점 수입
('INCOME', 'CONSULTATION', 'INDIVIDUAL_CONSULTATION', 150000, '개별 상담료', '2025-09-01', 'COMPLETED', 'MAIN001', false, NOW(), NOW()),
('INCOME', 'CONSULTATION', 'GROUP_CONSULTATION', 200000, '그룹 상담료', '2025-09-02', 'COMPLETED', 'MAIN001', false, NOW(), NOW()),
('INCOME', 'ADDITIONAL_CONSULTATION', 'ADDITIONAL_SESSION', 100000, '추가 상담료', '2025-09-03', 'COMPLETED', 'MAIN001', false, NOW(), NOW()),

-- 본점 지출
('EXPENSE', 'SALARY', 'CONSULTANT_SALARY', 3000000, '상담사 급여', '2025-09-01', 'COMPLETED', 'MAIN001', false, NOW(), NOW()),
('EXPENSE', 'RENT', 'OFFICE_RENT', 1500000, '사무실 임대료', '2025-09-01', 'COMPLETED', 'MAIN001', false, NOW(), NOW()),
('EXPENSE', 'UTILITY', 'ELECTRICITY', 200000, '전기료', '2025-09-02', 'COMPLETED', 'MAIN001', false, NOW(), NOW()),
('EXPENSE', 'OFFICE_SUPPLIES', 'STATIONERY', 50000, '사무용품', '2025-09-03', 'COMPLETED', 'MAIN001', false, NOW(), NOW()),

-- 2. 강남점 (GANGNAM) 테스트 데이터
('INCOME', 'CONSULTATION', 'INDIVIDUAL_CONSULTATION', 180000, '개별 상담료', '2025-09-01', 'COMPLETED', 'GANGNAM', false, NOW(), NOW()),
('INCOME', 'CONSULTATION', 'GROUP_CONSULTATION', 250000, '그룹 상담료', '2025-09-02', 'COMPLETED', 'GANGNAM', false, NOW(), NOW()),
('INCOME', 'ADDITIONAL_CONSULTATION', 'ADDITIONAL_SESSION', 120000, '추가 상담료', '2025-09-03', 'COMPLETED', 'GANGNAM', false, NOW(), NOW()),

-- 강남점 지출
('EXPENSE', 'SALARY', 'CONSULTANT_SALARY', 3500000, '상담사 급여', '2025-09-01', 'COMPLETED', 'GANGNAM', false, NOW(), NOW()),
('EXPENSE', 'RENT', 'OFFICE_RENT', 2000000, '사무실 임대료', '2025-09-01', 'COMPLETED', 'GANGNAM', false, NOW(), NOW()),
('EXPENSE', 'UTILITY', 'ELECTRICITY', 250000, '전기료', '2025-09-02', 'COMPLETED', 'GANGNAM', false, NOW(), NOW()),
('EXPENSE', 'OFFICE_SUPPLIES', 'STATIONERY', 80000, '사무용품', '2025-09-03', 'COMPLETED', 'GANGNAM', false, NOW(), NOW()),

-- 3. 홍대점 (HONGDAE) 테스트 데이터
('INCOME', 'CONSULTATION', 'INDIVIDUAL_CONSULTATION', 160000, '개별 상담료', '2025-09-01', 'COMPLETED', 'HONGDAE', false, NOW(), NOW()),
('INCOME', 'CONSULTATION', 'GROUP_CONSULTATION', 220000, '그룹 상담료', '2025-09-02', 'COMPLETED', 'HONGDAE', false, NOW(), NOW()),

-- 홍대점 지출
('EXPENSE', 'SALARY', 'CONSULTANT_SALARY', 2800000, '상담사 급여', '2025-09-01', 'COMPLETED', 'HONGDAE', false, NOW(), NOW()),
('EXPENSE', 'RENT', 'OFFICE_RENT', 1800000, '사무실 임대료', '2025-09-01', 'COMPLETED', 'HONGDAE', false, NOW(), NOW()),

-- 4. 잠실점 (JAMSIL) 테스트 데이터
('INCOME', 'CONSULTATION', 'INDIVIDUAL_CONSULTATION', 140000, '개별 상담료', '2025-09-01', 'COMPLETED', 'JAMSIL', false, NOW(), NOW()),
('EXPENSE', 'SALARY', 'CONSULTANT_SALARY', 2500000, '상담사 급여', '2025-09-01', 'COMPLETED', 'JAMSIL', false, NOW(), NOW()),

-- 5. 신촌점 (SINCHON) 테스트 데이터
('INCOME', 'CONSULTATION', 'INDIVIDUAL_CONSULTATION', 170000, '개별 상담료', '2025-09-01', 'COMPLETED', 'SINCHON', false, NOW(), NOW()),
('EXPENSE', 'SALARY', 'CONSULTANT_SALARY', 2700000, '상담사 급여', '2025-09-01', 'COMPLETED', 'SINCHON', false, NOW(), NOW()),

-- 6. 본사 (HQ) 테스트 데이터
('INCOME', 'OTHER', 'FRANCHISE_FEE', 5000000, '가맹비 수입', '2025-09-01', 'COMPLETED', 'HQ', false, NOW(), NOW()),
('EXPENSE', 'MANAGEMENT', 'HEADQUARTERS_EXPENSE', 1000000, '본사 운영비', '2025-09-01', 'COMPLETED', 'HQ', false, NOW(), NOW());
