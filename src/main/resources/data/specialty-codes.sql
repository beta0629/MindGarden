-- 전문분야 공통코드 등록
-- 코드 그룹: SPECIALTY

-- 기존 SPECIALTY 그룹의 코드들 삭제 (있다면)
DELETE FROM common_codes WHERE code_group = 'SPECIALTY';

-- 전문분야 공통코드 등록
INSERT INTO common_codes (code_group, code_value, code_name, description, is_active, sort_order, created_at, updated_at) VALUES
('SPECIALTY', 'DEPRESSION', '우울증', '우울증 상담 전문', true, 1, NOW(), NOW()),
('SPECIALTY', 'ANXIETY', '불안장애', '불안장애 상담 전문', true, 2, NOW(), NOW()),
('SPECIALTY', 'TRAUMA', '트라우마', '트라우마 상담 전문', true, 3, NOW(), NOW()),
('SPECIALTY', 'RELATIONSHIP', '인간관계', '인간관계 상담 전문', true, 4, NOW(), NOW()),
('SPECIALTY', 'FAMILY', '가족상담', '가족상담 전문', true, 5, NOW(), NOW()),
('SPECIALTY', 'COUPLE', '부부상담', '부부상담 전문', true, 6, NOW(), NOW()),
('SPECIALTY', 'CHILD', '아동상담', '아동상담 전문', true, 7, NOW(), NOW()),
('SPECIALTY', 'ADOLESCENT', '청소년상담', '청소년상담 전문', true, 8, NOW(), NOW()),
('SPECIALTY', 'ADULT', '성인상담', '성인상담 전문', true, 9, NOW(), NOW()),
('SPECIALTY', 'ELDERLY', '노인상담', '노인상담 전문', true, 10, NOW(), NOW()),
('SPECIALTY', 'ADDICTION', '중독상담', '중독상담 전문', true, 11, NOW(), NOW()),
('SPECIALTY', 'EATING', '섭식장애', '섭식장애 상담 전문', true, 12, NOW(), NOW()),
('SPECIALTY', 'SLEEP', '수면장애', '수면장애 상담 전문', true, 13, NOW(), NOW()),
('SPECIALTY', 'STRESS', '스트레스', '스트레스 관리 상담 전문', true, 14, NOW(), NOW()),
('SPECIALTY', 'ANGER', '분노조절', '분노조절 상담 전문', true, 15, NOW(), NOW()),
('SPECIALTY', 'GRIEF', '상실과 슬픔', '상실과 슬픔 상담 전문', true, 16, NOW(), NOW()),
('SPECIALTY', 'CAREER', '진로상담', '진로상담 전문', true, 17, NOW(), NOW()),
('SPECIALTY', 'STUDY', '학습상담', '학습상담 전문', true, 18, NOW(), NOW()),
('SPECIALTY', 'SOCIAL', '사회성', '사회성 향상 상담 전문', true, 19, NOW(), NOW()),
('SPECIALTY', 'SELF', '자아정체성', '자아정체성 상담 전문', true, 20, NOW(), NOW()),
('SPECIALTY', 'OTHER', '기타', '기타 상담 분야', true, 99, NOW(), NOW());
