-- 예산 카테고리 CommonCode 추가
-- 2025-09-15 ERP 시스템 구축

INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, is_deleted, version, extra_data, created_at, updated_at) 
VALUES 
('BUDGET_CATEGORY', 'OPERATING', '운영비', '일반적인 운영 비용', 1, true, false, 0, 
'{"description": "사무용품, 전화비, 인터넷비 등 운영에 필요한 비용", "color": "#007bff"}', NOW(), NOW()),

('BUDGET_CATEGORY', 'MARKETING', '마케팅', '마케팅 및 홍보 비용', 2, true, false, 0, 
'{"description": "광고비, 홍보물 제작비, 이벤트 비용 등", "color": "#28a745"}', NOW(), NOW()),

('BUDGET_CATEGORY', 'TRAINING', '교육훈련', '직원 교육 및 훈련 비용', 3, true, false, 0, 
'{"description": "교육비, 세미나 참가비, 자격증 취득비 등", "color": "#ffc107"}', NOW(), NOW()),

('BUDGET_CATEGORY', 'EQUIPMENT', '장비', '장비 구매 및 유지보수 비용', 4, true, false, 0, 
'{"description": "컴퓨터, 사무용품, 장비 구매 및 수리비", "color": "#dc3545"}', NOW(), NOW()),

('BUDGET_CATEGORY', 'TRAVEL', '출장비', '출장 및 교통비', 5, true, false, 0, 
'{"description": "출장비, 교통비, 숙박비 등", "color": "#6f42c1"}', NOW(), NOW()),

('BUDGET_CATEGORY', 'UTILITIES', '공과금', '전기, 가스, 수도 등 공과금', 6, true, false, 0, 
'{"description": "전기료, 가스료, 수도료, 관리비 등", "color": "#17a2b8"}', NOW(), NOW()),

('BUDGET_CATEGORY', 'RENT', '임대료', '사무실 및 시설 임대료', 7, true, false, 0, 
'{"description": "사무실 임대료, 시설 사용료 등", "color": "#fd7e14"}', NOW(), NOW()),

('BUDGET_CATEGORY', 'OTHER', '기타', '기타 비용', 8, true, false, 0, 
'{"description": "분류되지 않은 기타 비용", "color": "#6c757d"}', NOW(), NOW());
