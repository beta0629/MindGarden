-- 세무 카테고리 CommonCode 추가
-- 2025-09-15 ERP 시스템 구축

INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, is_deleted, version, extra_data, created_at, updated_at) 
VALUES 
('TAX_CATEGORY', 'VAT', '부가가치세', '부가가치세 관련 세금', 1, true, false, 0, 
'{"description": "부가가치세 계산 및 신고", "taxRate": 10, "color": "#007bff"}', NOW(), NOW()),

('TAX_CATEGORY', 'INCOME_TAX', '소득세', '소득세 관련 세금', 2, true, false, 0, 
'{"description": "소득세 계산 및 신고", "taxRate": 6, "color": "#28a745"}', NOW(), NOW()),

('TAX_CATEGORY', 'CORPORATE_TAX', '법인세', '법인세 관련 세금', 3, true, false, 0, 
'{"description": "법인세 계산 및 신고", "taxRate": 20, "color": "#ffc107"}', NOW(), NOW()),

('TAX_CATEGORY', 'LOCAL_TAX', '지방세', '지방세 관련 세금', 4, true, false, 0, 
'{"description": "지방소득세, 지방소비세 등", "taxRate": 0.1, "color": "#dc3545"}', NOW(), NOW()),

('TAX_CATEGORY', 'HEALTH_INSURANCE', '건강보험료', '건강보험료 관련', 5, true, false, 0, 
'{"description": "건강보험료 계산 및 납부", "taxRate": 3.545, "color": "#6f42c1"}', NOW(), NOW()),

('TAX_CATEGORY', 'PENSION', '국민연금', '국민연금 관련', 6, true, false, 0, 
'{"description": "국민연금 계산 및 납부", "taxRate": 4.5, "color": "#17a2b8"}', NOW(), NOW()),

('TAX_CATEGORY', 'EMPLOYMENT_INSURANCE', '고용보험료', '고용보험료 관련', 7, true, false, 0, 
'{"description": "고용보험료 계산 및 납부", "taxRate": 0.9, "color": "#fd7e14"}', NOW(), NOW()),

('TAX_CATEGORY', 'WORKERS_COMPENSATION', '산재보험료', '산재보험료 관련', 8, true, false, 0, 
'{"description": "산업재해보상보험료 계산 및 납부", "taxRate": 0.7, "color": "#6c757d"}', NOW(), NOW()),

('TAX_CATEGORY', 'OTHER_TAX', '기타 세금', '기타 세금 및 수수료', 9, true, false, 0, 
'{"description": "기타 세금 및 수수료", "taxRate": 0, "color": "#6c757d"}', NOW(), NOW());
