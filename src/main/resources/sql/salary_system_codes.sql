-- 급여 체계 공통코드 데이터
-- 작성일: 2025-01-11
-- 설명: 상담사 급여 체계를 위한 공통코드 데이터

-- ==================== 급여 유형 (SALARY_TYPE) ====================
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, is_deleted, created_at, updated_at) VALUES
('SALARY_TYPE', 'REGULAR', '정규직', '계약된 연봉으로 급여 지급', 1, true, false, NOW(), NOW()),
('SALARY_TYPE', 'FREELANCE', '프리랜서', '상담 건수별 차등 급여 지급', 2, true, false, NOW(), NOW()),
('SALARY_TYPE', 'PART_TIME', '파트타임', '시간제 급여 지급', 3, true, false, NOW(), NOW()),
('SALARY_TYPE', 'CONTRACT', '계약직', '계약 기간별 급여 지급', 4, true, false, NOW(), NOW());

-- ==================== 급여 옵션 타입 (SALARY_OPTION_TYPE) ====================
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, is_deleted, created_at, updated_at) VALUES
('SALARY_OPTION_TYPE', 'FAMILY_CONSULTATION', '가족상담', '가족상담 시 추가 급여', 1, true, false, NOW(), NOW()),
('SALARY_OPTION_TYPE', 'INITIAL_CONSULTATION', '초기상담', '초기상담 시 추가 급여', 2, true, false, NOW(), NOW()),
('SALARY_OPTION_TYPE', 'COUPLE_CONSULTATION', '부부상담', '부부상담 시 추가 급여', 3, true, false, NOW(), NOW()),
('SALARY_OPTION_TYPE', 'GROUP_CONSULTATION', '그룹상담', '그룹상담 시 추가 급여', 4, true, false, NOW(), NOW()),
('SALARY_OPTION_TYPE', 'CRISIS_INTERVENTION', '위기개입', '위기개입 시 추가 급여', 5, true, false, NOW(), NOW()),
('SALARY_OPTION_TYPE', 'EVENING_CONSULTATION', '야간상담', '야간상담 시 추가 급여', 6, true, false, NOW(), NOW()),
('SALARY_OPTION_TYPE', 'WEEKEND_CONSULTATION', '주말상담', '주말상담 시 추가 급여', 7, true, false, NOW(), NOW()),
('SALARY_OPTION_TYPE', 'ONLINE_CONSULTATION', '온라인상담', '온라인상담 시 추가 급여', 8, true, false, NOW(), NOW()),
('SALARY_OPTION_TYPE', 'PHONE_CONSULTATION', '전화상담', '전화상담 시 추가 급여', 9, true, false, NOW(), NOW()),
('SALARY_OPTION_TYPE', 'TRAUMA_CONSULTATION', '트라우마상담', '트라우마상담 시 추가 급여', 10, true, false, NOW(), NOW());

-- ==================== 상담사 등급별 기본급 (CONSULTANT_GRADE_SALARY) ====================
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at) VALUES
('CONSULTANT_GRADE_SALARY', 'JUNIOR_BASE', '주니어 기본급', '주니어 상담사 기본 급여', 1, true, '{"baseAmount": 3000000, "grade": "CONSULTANT_JUNIOR"}', NOW(), NOW()),
('CONSULTANT_GRADE_SALARY', 'SENIOR_BASE', '시니어 기본급', '시니어 상담사 기본 급여', 2, true, '{"baseAmount": 4000000, "grade": "CONSULTANT_SENIOR"}', NOW(), NOW()),
('CONSULTANT_GRADE_SALARY', 'EXPERT_BASE', '엑스퍼트 기본급', '엑스퍼트 상담사 기본 급여', 3, true, '{"baseAmount": 5000000, "grade": "CONSULTANT_EXPERT"}', NOW(), NOW()),
('CONSULTANT_GRADE_SALARY', 'MASTER_BASE', '마스터 기본급', '마스터 상담사 기본 급여', 4, true, '{"baseAmount": 6000000, "grade": "CONSULTANT_MASTER"}', NOW(), NOW());

-- ==================== 프리랜서 기본 상담료 (FREELANCE_BASE_RATE) ====================
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at) VALUES
('FREELANCE_BASE_RATE', 'JUNIOR_RATE', '주니어 기본상담료', '주니어 프리랜서 기본 상담료', 1, true, '{"rate": 30000, "grade": "CONSULTANT_JUNIOR", "duration": 50}', NOW(), NOW()),
('FREELANCE_BASE_RATE', 'SENIOR_RATE', '시니어 기본상담료', '시니어 프리랜서 기본 상담료', 2, true, '{"rate": 35000, "grade": "CONSULTANT_SENIOR", "duration": 50}', NOW(), NOW()),
('FREELANCE_BASE_RATE', 'EXPERT_RATE', '엑스퍼트 기본상담료', '엑스퍼트 프리랜서 기본 상담료', 3, true, '{"rate": 40000, "grade": "CONSULTANT_EXPERT", "duration": 50}', NOW(), NOW()),
('FREELANCE_BASE_RATE', 'MASTER_RATE', '마스터 기본상담료', '마스터 프리랜서 기본 상담료', 4, true, '{"rate": 45000, "grade": "CONSULTANT_MASTER", "duration": 50}', NOW(), NOW());

-- ==================== 급여 옵션 금액 (SALARY_OPTION_AMOUNT) ====================
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at) VALUES
('SALARY_OPTION_AMOUNT', 'FAMILY_BONUS', '가족상담 보너스', '가족상담 시 추가 급여', 1, true, '{"amount": 3000, "optionType": "FAMILY_CONSULTATION"}', NOW(), NOW()),
('SALARY_OPTION_AMOUNT', 'INITIAL_BONUS', '초기상담 보너스', '초기상담 시 추가 급여', 2, true, '{"amount": 5000, "optionType": "INITIAL_CONSULTATION"}', NOW(), NOW()),
('SALARY_OPTION_AMOUNT', 'COUPLE_BONUS', '부부상담 보너스', '부부상담 시 추가 급여', 3, true, '{"amount": 4000, "optionType": "COUPLE_CONSULTATION"}', NOW(), NOW()),
('SALARY_OPTION_AMOUNT', 'GROUP_BONUS', '그룹상담 보너스', '그룹상담 시 추가 급여', 4, true, '{"amount": 2000, "optionType": "GROUP_CONSULTATION"}', NOW(), NOW()),
('SALARY_OPTION_AMOUNT', 'CRISIS_BONUS', '위기개입 보너스', '위기개입 시 추가 급여', 5, true, '{"amount": 8000, "optionType": "CRISIS_INTERVENTION"}', NOW(), NOW()),
('SALARY_OPTION_AMOUNT', 'EVENING_BONUS', '야간상담 보너스', '야간상담 시 추가 급여', 6, true, '{"amount": 5000, "optionType": "EVENING_CONSULTATION"}', NOW(), NOW()),
('SALARY_OPTION_AMOUNT', 'WEEKEND_BONUS', '주말상담 보너스', '주말상담 시 추가 급여', 7, true, '{"amount": 3000, "optionType": "WEEKEND_CONSULTATION"}', NOW(), NOW()),
('SALARY_OPTION_AMOUNT', 'ONLINE_BONUS', '온라인상담 보너스', '온라인상담 시 추가 급여', 8, true, '{"amount": 2000, "optionType": "ONLINE_CONSULTATION"}', NOW(), NOW()),
('SALARY_OPTION_AMOUNT', 'PHONE_BONUS', '전화상담 보너스', '전화상담 시 추가 급여', 9, true, '{"amount": 1000, "optionType": "PHONE_CONSULTATION"}', NOW(), NOW()),
('SALARY_OPTION_AMOUNT', 'TRAUMA_BONUS', '트라우마상담 보너스', '트라우마상담 시 추가 급여', 10, true, '{"amount": 6000, "optionType": "TRAUMA_CONSULTATION"}', NOW(), NOW());

-- ==================== 급여 지급 주기 (SALARY_PAYMENT_CYCLE) ====================
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, is_deleted, created_at, updated_at) VALUES
('SALARY_PAYMENT_CYCLE', 'MONTHLY', '월급', '매월 급여 지급', 1, true, false, NOW(), NOW()),
('SALARY_PAYMENT_CYCLE', 'WEEKLY', '주급', '매주 급여 지급', 2, true, false, NOW(), NOW()),
('SALARY_PAYMENT_CYCLE', 'BIWEEKLY', '격주급', '격주 급여 지급', 3, true, false, NOW(), NOW()),
('SALARY_PAYMENT_CYCLE', 'PER_CONSULTATION', '상담별', '상담 완료 시마다 급여 지급', 4, true, false, NOW(), NOW());

-- ==================== 급여 지급일 옵션 (SALARY_PAY_DAY) ====================
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at) VALUES
('SALARY_PAY_DAY', 'TENTH', '10일 지급', '매월 10일에 급여 지급 (기본)', 1, true, '{"dayOfMonth": 10, "description": "매월 10일 지급", "isDefault": true}', NOW(), NOW()),
('SALARY_PAY_DAY', 'FIFTEENTH', '15일 지급', '매월 15일에 급여 지급', 2, true, '{"dayOfMonth": 15, "description": "매월 15일 지급", "isDefault": false}', NOW(), NOW()),
('SALARY_PAY_DAY', 'TWENTIETH', '20일 지급', '매월 20일에 급여 지급', 3, true, '{"dayOfMonth": 20, "description": "매월 20일 지급", "isDefault": false}', NOW(), NOW()),
('SALARY_PAY_DAY', 'TWENTY_FIFTH', '25일 지급', '매월 25일에 급여 지급', 4, true, '{"dayOfMonth": 25, "description": "매월 25일 지급", "isDefault": false}', NOW(), NOW()),
('SALARY_PAY_DAY', 'LAST_DAY', '말일 지급', '매월 말일에 급여 지급', 5, true, '{"dayOfMonth": 0, "description": "매월 말일 지급", "isDefault": false}', NOW(), NOW()),
('SALARY_PAY_DAY', 'FIRST_DAY', '1일 지급', '매월 1일에 급여 지급', 6, true, '{"dayOfMonth": 1, "description": "매월 1일 지급", "isDefault": false}', NOW(), NOW());

-- ==================== 급여 상태 (SALARY_STATUS) ====================
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, is_deleted, created_at, updated_at) VALUES
('SALARY_STATUS', 'PENDING', '대기중', '급여 계산 대기 상태', 1, true, false, NOW(), NOW()),
('SALARY_STATUS', 'CALCULATED', '계산완료', '급여 계산 완료 상태', 2, true, false, NOW(), NOW()),
('SALARY_STATUS', 'APPROVED', '승인완료', '급여 승인 완료 상태', 3, true, false, NOW(), NOW()),
('SALARY_STATUS', 'PAID', '지급완료', '급여 지급 완료 상태', 4, true, false, NOW(), NOW()),
('SALARY_STATUS', 'CANCELLED', '취소', '급여 지급 취소 상태', 5, true, false, NOW(), NOW());

-- ==================== 세금 관련 공통코드 ====================
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at) VALUES
('TAX_TYPE', 'WITHHOLDING_TAX', '원천징수', '프리랜서 원천징수 3.3%', 1, true, '{"rate": 0.033, "description": "프리랜서 원천징수"}', NOW(), NOW()),
('TAX_TYPE', 'VAT', '부가세', '센터 부가세 10%', 2, true, '{"rate": 0.10, "description": "센터 부가세"}', NOW(), NOW()),
('TAX_TYPE', 'INCOME_TAX', '소득세', '정규직 소득세', 3, true, '{"description": "정규직 소득세"}', NOW(), NOW()),
('TAX_TYPE', 'ADDITIONAL_TAX', '추가세금', '기타 추가 세금', 4, true, '{"description": "기타 추가 세금"}', NOW(), NOW());

-- ==================== 소득세율 (정규직) ====================
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at) VALUES
('INCOME_TAX_RATE', 'RATE_6', '6%', '소득세 6% (1,200만원 이하)', 1, true, '{"rate": 0.06, "minAmount": 0, "maxAmount": 12000000}', NOW(), NOW()),
('INCOME_TAX_RATE', 'RATE_15', '15%', '소득세 15% (1,200만원 초과 4,600만원 이하)', 2, true, '{"rate": 0.15, "minAmount": 12000000, "maxAmount": 46000000}', NOW(), NOW()),
('INCOME_TAX_RATE', 'RATE_24', '24%', '소득세 24% (4,600만원 초과 8,800만원 이하)', 3, true, '{"rate": 0.24, "minAmount": 46000000, "maxAmount": 88000000}', NOW(), NOW()),
('INCOME_TAX_RATE', 'RATE_35', '35%', '소득세 35% (8,800만원 초과 1억 5천만원 이하)', 4, true, '{"rate": 0.35, "minAmount": 88000000, "maxAmount": 150000000}', NOW(), NOW()),
('INCOME_TAX_RATE', 'RATE_38', '38%', '소득세 38% (1억 5천만원 초과 3억원 이하)', 5, true, '{"rate": 0.38, "minAmount": 150000000, "maxAmount": 300000000}', NOW(), NOW()),
('INCOME_TAX_RATE', 'RATE_40', '40%', '소득세 40% (3억원 초과 5억원 이하)', 6, true, '{"rate": 0.40, "minAmount": 300000000, "maxAmount": 500000000}', NOW(), NOW()),
('INCOME_TAX_RATE', 'RATE_42', '42%', '소득세 42% (5억원 초과)', 7, true, '{"rate": 0.42, "minAmount": 500000000, "maxAmount": 999999999999}', NOW(), NOW());

-- ==================== 세금 계산 옵션 ====================
INSERT INTO common_codes (code_group, code_value, code_label, code_description, sort_order, is_active, extra_data, created_at, updated_at) VALUES
('TAX_CALCULATION_OPTION', 'WITHHOLDING_3_3', '원천징수 3.3%', '프리랜서 원천징수 3.3%', 1, true, '{"rate": 0.033, "target": "FREELANCE", "description": "프리랜서 원천징수"}', NOW(), NOW()),
('TAX_CALCULATION_OPTION', 'VAT_10', '부가세 10%', '센터 부가세 10%', 2, true, '{"rate": 0.10, "target": "CENTER", "description": "센터 부가세"}', NOW(), NOW()),
('TAX_CALCULATION_OPTION', 'INCOME_TAX_PROGRESSIVE', '소득세 누진세율', '정규직 소득세 누진세율 적용', 3, true, '{"target": "REGULAR", "description": "정규직 소득세"}', NOW(), NOW()),
('TAX_CALCULATION_OPTION', 'ADDITIONAL_TAX_OPTION', '추가세금 옵션', '기타 추가 세금 옵션', 4, true, '{"target": "ALL", "description": "기타 추가 세금"}', NOW(), NOW());
