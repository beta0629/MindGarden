package com.coresolution.consultation.constant.onboarding;

/**
 * 테넌트 온보딩 급여·ERP 공통코드 시드의 한글 라벨·설명·JSON(extraData) 문자열.
 * <p>
 * {@link com.coresolution.consultation.support.TenantOnboardingSalaryAndFinancialSeedDefinitions}와 동기화한다.
 * 재무 공통코드(TRANSACTION_TYPE 등) 한글 문자열은 {@link com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings}를 참고한다.
 * </p>
 *
 * @author CoreSolution
 * @since 2026-04-21
 */
public final class TenantOnboardingSalaryAndFinancialSeedStrings {

    private TenantOnboardingSalaryAndFinancialSeedStrings() {
    }

    // --- SALARY_PAY_DAY ---

    public static final String SALARY_PAY_DAY_TENTH_DISPLAY = "10일 지급";

    public static final String SALARY_PAY_DAY_TENTH_DESCRIPTION = "매월 10일에 급여 지급 (기본)";

    public static final String SALARY_PAY_DAY_TENTH_EXTRA_DATA =
            "{\"dayOfMonth\": 10, \"description\": \"매월 10일 지급\", \"isDefault\": true}";

    public static final String SALARY_PAY_DAY_FIFTEENTH_DISPLAY = "15일 지급";

    public static final String SALARY_PAY_DAY_FIFTEENTH_DESCRIPTION = "매월 15일에 급여 지급";

    public static final String SALARY_PAY_DAY_FIFTEENTH_EXTRA_DATA =
            "{\"dayOfMonth\": 15, \"description\": \"매월 15일 지급\", \"isDefault\": false}";

    public static final String SALARY_PAY_DAY_TWENTIETH_DISPLAY = "20일 지급";

    public static final String SALARY_PAY_DAY_TWENTIETH_DESCRIPTION = "매월 20일에 급여 지급";

    public static final String SALARY_PAY_DAY_TWENTIETH_EXTRA_DATA =
            "{\"dayOfMonth\": 20, \"description\": \"매월 20일 지급\", \"isDefault\": false}";

    public static final String SALARY_PAY_DAY_TWENTY_FIFTH_DISPLAY = "25일 지급";

    public static final String SALARY_PAY_DAY_TWENTY_FIFTH_DESCRIPTION = "매월 25일에 급여 지급";

    public static final String SALARY_PAY_DAY_TWENTY_FIFTH_EXTRA_DATA =
            "{\"dayOfMonth\": 25, \"description\": \"매월 25일 지급\", \"isDefault\": false}";

    public static final String SALARY_PAY_DAY_LAST_DAY_DISPLAY = "말일 지급";

    public static final String SALARY_PAY_DAY_LAST_DAY_DESCRIPTION = "매월 말일에 급여 지급";

    public static final String SALARY_PAY_DAY_LAST_DAY_EXTRA_DATA =
            "{\"dayOfMonth\": 0, \"description\": \"매월 말일 지급\", \"isDefault\": false}";

    public static final String SALARY_PAY_DAY_FIRST_DAY_DISPLAY = "1일 지급";

    public static final String SALARY_PAY_DAY_FIRST_DAY_DESCRIPTION = "매월 1일에 급여 지급";

    public static final String SALARY_PAY_DAY_FIRST_DAY_EXTRA_DATA =
            "{\"dayOfMonth\": 1, \"description\": \"매월 1일 지급\", \"isDefault\": false}";

    // --- CONSULTANT_GRADE ---

    public static final String CONSULTANT_GRADE_JUNIOR_DISPLAY = "주니어 상담사";

    public static final String CONSULTANT_GRADE_JUNIOR_DESCRIPTION = "신입 상담사 (1-2년 경력)";

    public static final String CONSULTANT_GRADE_JUNIOR_EXTRA_DATA =
            "{\"level\": 1, \"experience\": \"1-2년\", \"description\": \"신입 상담사\", \"multiplier\": 1.0}";

    public static final String CONSULTANT_GRADE_SENIOR_DISPLAY = "시니어 상담사";

    public static final String CONSULTANT_GRADE_SENIOR_DESCRIPTION = "중급 상담사 (3-5년 경력)";

    public static final String CONSULTANT_GRADE_SENIOR_EXTRA_DATA =
            "{\"level\": 2, \"experience\": \"3-5년\", \"description\": \"중급 상담사\", \"multiplier\": 1.2}";

    public static final String CONSULTANT_GRADE_EXPERT_DISPLAY = "엑스퍼트 상담사";

    public static final String CONSULTANT_GRADE_EXPERT_DESCRIPTION = "고급 상담사 (6-10년 경력)";

    public static final String CONSULTANT_GRADE_EXPERT_EXTRA_DATA =
            "{\"level\": 3, \"experience\": \"6-10년\", \"description\": \"고급 상담사\", \"multiplier\": 1.4}";

    public static final String CONSULTANT_GRADE_MASTER_DISPLAY = "마스터 상담사";

    public static final String CONSULTANT_GRADE_MASTER_DESCRIPTION = "최고급 상담사 (10년 이상 경력)";

    public static final String CONSULTANT_GRADE_MASTER_EXTRA_DATA =
            "{\"level\": 4, \"experience\": \"10년 이상\", \"description\": \"최고급 상담사\", \"multiplier\": 1.6}";

    // --- CLIENT_GRADE ---

    public static final String CLIENT_GRADE_STANDARD_DISPLAY = "일반";

    public static final String CLIENT_GRADE_STANDARD_DESCRIPTION = "기본 내담자 등급";

    public static final String CLIENT_GRADE_STANDARD_EXTRA_DATA =
            "{\"level\": 1, \"tier\": \"STANDARD\", \"description\": \"일반 내담자\", \"multiplier\": 1.0}";

    public static final String CLIENT_GRADE_PREMIUM_DISPLAY = "우수";

    public static final String CLIENT_GRADE_PREMIUM_DESCRIPTION = "우수 내담자 등급";

    public static final String CLIENT_GRADE_PREMIUM_EXTRA_DATA =
            "{\"level\": 2, \"tier\": \"PREMIUM\", \"description\": \"우수 내담자\", \"multiplier\": 1.1}";

    public static final String CLIENT_GRADE_VIP_DISPLAY = "프리미엄";

    public static final String CLIENT_GRADE_VIP_DESCRIPTION = "프리미엄 내담자 등급";

    public static final String CLIENT_GRADE_VIP_EXTRA_DATA =
            "{\"level\": 3, \"tier\": \"VIP\", \"description\": \"프리미엄 내담자\", \"multiplier\": 1.2}";

    public static final String CLIENT_GRADE_ELITE_DISPLAY = "엘리트";

    public static final String CLIENT_GRADE_ELITE_DESCRIPTION = "최상위 내담자 등급";

    public static final String CLIENT_GRADE_ELITE_EXTRA_DATA =
            "{\"level\": 4, \"tier\": \"ELITE\", \"description\": \"엘리트 내담자\", \"multiplier\": 1.3}";

    // --- ADMIN_GRADE ---

    public static final String ADMIN_GRADE_JUNIOR_DISPLAY = "주니어 관리";

    public static final String ADMIN_GRADE_JUNIOR_DESCRIPTION = "초급 관리 업무";

    public static final String ADMIN_GRADE_JUNIOR_EXTRA_DATA =
            "{\"level\": 1, \"scope\": \"JUNIOR\", \"description\": \"주니어 관리\", \"multiplier\": 1.0}";

    public static final String ADMIN_GRADE_SENIOR_DISPLAY = "시니어 관리";

    public static final String ADMIN_GRADE_SENIOR_DESCRIPTION = "중급 관리 업무";

    public static final String ADMIN_GRADE_SENIOR_EXTRA_DATA =
            "{\"level\": 2, \"scope\": \"SENIOR\", \"description\": \"시니어 관리\", \"multiplier\": 1.15}";

    public static final String ADMIN_GRADE_EXPERT_DISPLAY = "전문 관리";

    public static final String ADMIN_GRADE_EXPERT_DESCRIPTION = "고급 관리 업무";

    public static final String ADMIN_GRADE_EXPERT_EXTRA_DATA =
            "{\"level\": 3, \"scope\": \"EXPERT\", \"description\": \"전문 관리\", \"multiplier\": 1.3}";

    public static final String ADMIN_GRADE_MASTER_DISPLAY = "마스터 관리";

    public static final String ADMIN_GRADE_MASTER_DESCRIPTION = "최고급 관리 업무";

    public static final String ADMIN_GRADE_MASTER_EXTRA_DATA =
            "{\"level\": 4, \"scope\": \"MASTER\", \"description\": \"마스터 관리\", \"multiplier\": 1.45}";

    // --- SALARY_TYPE ---

    public static final String SALARY_TYPE_FREELANCE_DISPLAY = "프리랜서";

    public static final String SALARY_TYPE_FREELANCE_DESCRIPTION = "프리랜서 상담사 급여";

    public static final String SALARY_TYPE_FREELANCE_EXTRA_DATA =
            "{\"type\": \"FREELANCE\", \"description\": \"프리랜서 상담사\", \"taxType\": \"WITHHOLDING\"}";

    public static final String SALARY_TYPE_REGULAR_DISPLAY = "정규직";

    public static final String SALARY_TYPE_REGULAR_DESCRIPTION = "정규직 상담사 급여";

    public static final String SALARY_TYPE_REGULAR_EXTRA_DATA =
            "{\"type\": \"REGULAR\", \"description\": \"정규직 상담사\", \"taxType\": \"INCOME_TAX\"}";

    // --- SALARY_OPTION_TYPE ---

    public static final String SALARY_OPTION_FAMILY_CONSULTATION_DISPLAY = "가족상담";

    public static final String SALARY_OPTION_FAMILY_CONSULTATION_DESCRIPTION = "가족상담 시 추가 급여";

    public static final String SALARY_OPTION_FAMILY_CONSULTATION_EXTRA_DATA =
            "{\"type\": \"FAMILY_CONSULTATION\", \"baseAmount\": 3000, \"description\": \"가족상담 추가 급여\"}";

    public static final String SALARY_OPTION_INITIAL_CONSULTATION_DISPLAY = "초기상담";

    public static final String SALARY_OPTION_INITIAL_CONSULTATION_DESCRIPTION = "초기상담 시 추가 급여";

    public static final String SALARY_OPTION_INITIAL_CONSULTATION_EXTRA_DATA =
            "{\"type\": \"INITIAL_CONSULTATION\", \"baseAmount\": 5000, \"description\": \"초기상담 추가 급여\"}";

    public static final String SALARY_OPTION_WEEKEND_CONSULTATION_DISPLAY = "주말상담";

    public static final String SALARY_OPTION_WEEKEND_CONSULTATION_DESCRIPTION = "주말상담 시 추가 급여";

    public static final String SALARY_OPTION_WEEKEND_CONSULTATION_EXTRA_DATA =
            "{\"type\": \"WEEKEND_CONSULTATION\", \"baseAmount\": 2000, \"description\": \"주말상담 추가 급여\"}";

    public static final String SALARY_OPTION_ONLINE_CONSULTATION_DISPLAY = "온라인상담";

    public static final String SALARY_OPTION_ONLINE_CONSULTATION_DESCRIPTION = "온라인상담 시 추가 급여";

    public static final String SALARY_OPTION_ONLINE_CONSULTATION_EXTRA_DATA =
            "{\"type\": \"ONLINE_CONSULTATION\", \"baseAmount\": 1000, \"description\": \"온라인상담 추가 급여\"}";

    public static final String SALARY_OPTION_PHONE_CONSULTATION_DISPLAY = "전화상담";

    public static final String SALARY_OPTION_PHONE_CONSULTATION_DESCRIPTION = "전화상담 시 추가 급여";

    public static final String SALARY_OPTION_PHONE_CONSULTATION_EXTRA_DATA =
            "{\"type\": \"PHONE_CONSULTATION\", \"baseAmount\": 1500, \"description\": \"전화상담 추가 급여\"}";

    public static final String SALARY_OPTION_TRAUMA_CONSULTATION_DISPLAY = "트라우마상담";

    public static final String SALARY_OPTION_TRAUMA_CONSULTATION_DESCRIPTION = "트라우마상담 시 추가 급여";

    public static final String SALARY_OPTION_TRAUMA_CONSULTATION_EXTRA_DATA =
            "{\"type\": \"TRAUMA_CONSULTATION\", \"baseAmount\": 4000, \"description\": \"트라우마상담 추가 급여\"}";

    // --- CONSULTANT_GRADE_SALARY ---

    public static final String CONSULTANT_GRADE_SALARY_JUNIOR_BASE_DISPLAY = "주니어 기본급";

    public static final String CONSULTANT_GRADE_SALARY_JUNIOR_BASE_DESCRIPTION = "주니어 상담사 기본 급여";

    public static final String CONSULTANT_GRADE_SALARY_JUNIOR_BASE_EXTRA_DATA =
            "{\"baseAmount\": 3000000, \"grade\": \"CONSULTANT_JUNIOR\", \"level\": 1}";

    public static final String CONSULTANT_GRADE_SALARY_SENIOR_BASE_DISPLAY = "시니어 기본급";

    public static final String CONSULTANT_GRADE_SALARY_SENIOR_BASE_DESCRIPTION = "시니어 상담사 기본 급여";

    public static final String CONSULTANT_GRADE_SALARY_SENIOR_BASE_EXTRA_DATA =
            "{\"baseAmount\": 4000000, \"grade\": \"CONSULTANT_SENIOR\", \"level\": 2}";

    public static final String CONSULTANT_GRADE_SALARY_EXPERT_BASE_DISPLAY = "엑스퍼트 기본급";

    public static final String CONSULTANT_GRADE_SALARY_EXPERT_BASE_DESCRIPTION = "엑스퍼트 상담사 기본 급여";

    public static final String CONSULTANT_GRADE_SALARY_EXPERT_BASE_EXTRA_DATA =
            "{\"baseAmount\": 5000000, \"grade\": \"CONSULTANT_EXPERT\", \"level\": 3}";

    public static final String CONSULTANT_GRADE_SALARY_MASTER_BASE_DISPLAY = "마스터 기본급";

    public static final String CONSULTANT_GRADE_SALARY_MASTER_BASE_DESCRIPTION = "마스터 상담사 기본 급여";

    public static final String CONSULTANT_GRADE_SALARY_MASTER_BASE_EXTRA_DATA =
            "{\"baseAmount\": 6000000, \"grade\": \"CONSULTANT_MASTER\", \"level\": 4}";

    // --- FREELANCE_BASE_RATE ---

    public static final String FREELANCE_BASE_RATE_JUNIOR_DISPLAY = "주니어 기본상담료";

    public static final String FREELANCE_BASE_RATE_JUNIOR_DESCRIPTION = "주니어 프리랜서 기본 상담료";

    public static final String FREELANCE_BASE_RATE_JUNIOR_EXTRA_DATA =
            "{\"rate\": 30000, \"grade\": \"CONSULTANT_JUNIOR\", \"duration\": 50, \"level\": 1}";

    public static final String FREELANCE_BASE_RATE_SENIOR_DISPLAY = "시니어 기본상담료";

    public static final String FREELANCE_BASE_RATE_SENIOR_DESCRIPTION = "시니어 프리랜서 기본 상담료";

    public static final String FREELANCE_BASE_RATE_SENIOR_EXTRA_DATA =
            "{\"rate\": 35000, \"grade\": \"CONSULTANT_SENIOR\", \"duration\": 50, \"level\": 2}";

    public static final String FREELANCE_BASE_RATE_EXPERT_DISPLAY = "엑스퍼트 기본상담료";

    public static final String FREELANCE_BASE_RATE_EXPERT_DESCRIPTION = "엑스퍼트 프리랜서 기본 상담료";

    public static final String FREELANCE_BASE_RATE_EXPERT_EXTRA_DATA =
            "{\"rate\": 40000, \"grade\": \"CONSULTANT_EXPERT\", \"duration\": 50, \"level\": 3}";

    public static final String FREELANCE_BASE_RATE_MASTER_DISPLAY = "마스터 기본상담료";

    public static final String FREELANCE_BASE_RATE_MASTER_DESCRIPTION = "마스터 프리랜서 기본 상담료";

    public static final String FREELANCE_BASE_RATE_MASTER_EXTRA_DATA =
            "{\"rate\": 45000, \"grade\": \"CONSULTANT_MASTER\", \"duration\": 50, \"level\": 4}";
}
