package com.coresolution.consultation.support;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * 온보딩 시 신규 테넌트에 삽입할 급여·ERP 공통코드 시드 정의.
 * <p>
 * 프론트엔드 {@code TENANT_CODE_GROUPS} / {@code TENANT_WRITE_ISOLATED_GROUPS}와 동일 정책으로 동기화 —
 * {@code frontend/src/constants/tenantCodeConstants.js}.
 * </p>
 * <p>
 * <strong>동기화 단일 출처</strong>: 문자열·JSON은 아래와 동일하게 유지할 것. 변경 시 함께 갱신.
 * </p>
 * <ul>
 * <li>급여: {@link com.coresolution.consultation.service.impl.CodeInitializationServiceImpl}
 * (initializeSalaryPayDayOptions ~ initializeFreelanceBaseRates)</li>
 * <li>재무: {@link com.coresolution.consultation.service.impl.FinancialCommonCodeInitializer}</li>
 * </ul>
 * <p>
 * TENANT_WRITE_ISOLATED_GROUPS 중 탭({@code TENANT_CODE_GROUPS})에 없는 ERP 전용 그룹(예: {@code FINANCIAL_CATEGORY})은
 * 본 파일 또는 {@link com.coresolution.core.service.impl.OnboardingServiceImpl} 온보딩 공통코드 삽입 로직에서
 * 선택적으로 시드한다.
 * </p>
 *
 * @author CoreSolution
 * @since 2026-04-13
 */
public final class TenantOnboardingSalaryAndFinancialSeedDefinitions {

    private TenantOnboardingSalaryAndFinancialSeedDefinitions() {
    }

    /**
     * 테넌트 온보딩 시 추가할 급여·ERP 공통코드 한 행.
     *
     * @param parentCodeGroup 하위 분류용 상위 그룹 (없으면 null)
     * @param parentCodeValue 하위 분류용 상위 값 (없으면 null)
     */
    public record SeedRow(String codeGroup, String codeValue, String koreanName, String codeLabel,
            String description, String extraData, Integer sortOrder, String parentCodeGroup,
            String parentCodeValue) {
    }

    private static final List<SeedRow> ROWS;

    static {
        List<SeedRow> rows = new ArrayList<>();

        // --- SALARY_PAY_DAY (CodeInitializationServiceImpl.initializeSalaryPayDayOptions) ---
        rows.add(new SeedRow("SALARY_PAY_DAY", "TENTH", "10일 지급", "10일 지급",
                "매월 10일에 급여 지급 (기본)",
                "{\"dayOfMonth\": 10, \"description\": \"매월 10일 지급\", \"isDefault\": true}", 1,
                null, null));
        rows.add(new SeedRow("SALARY_PAY_DAY", "FIFTEENTH", "15일 지급", "15일 지급",
                "매월 15일에 급여 지급",
                "{\"dayOfMonth\": 15, \"description\": \"매월 15일 지급\", \"isDefault\": false}", 2,
                null, null));
        rows.add(new SeedRow("SALARY_PAY_DAY", "TWENTIETH", "20일 지급", "20일 지급",
                "매월 20일에 급여 지급",
                "{\"dayOfMonth\": 20, \"description\": \"매월 20일 지급\", \"isDefault\": false}", 3,
                null, null));
        rows.add(new SeedRow("SALARY_PAY_DAY", "TWENTY_FIFTH", "25일 지급", "25일 지급",
                "매월 25일에 급여 지급",
                "{\"dayOfMonth\": 25, \"description\": \"매월 25일 지급\", \"isDefault\": false}", 4,
                null, null));
        rows.add(new SeedRow("SALARY_PAY_DAY", "LAST_DAY", "말일 지급", "말일 지급",
                "매월 말일에 급여 지급",
                "{\"dayOfMonth\": 0, \"description\": \"매월 말일 지급\", \"isDefault\": false}", 5,
                null, null));
        rows.add(new SeedRow("SALARY_PAY_DAY", "FIRST_DAY", "1일 지급", "1일 지급",
                "매월 1일에 급여 지급",
                "{\"dayOfMonth\": 1, \"description\": \"매월 1일 지급\", \"isDefault\": false}", 6,
                null, null));

        // --- CONSULTANT_GRADE ---
        rows.add(new SeedRow("CONSULTANT_GRADE", "CONSULTANT_JUNIOR", "주니어 상담사", "주니어 상담사",
                "신입 상담사 (1-2년 경력)",
                "{\"level\": 1, \"experience\": \"1-2년\", \"description\": \"신입 상담사\", \"multiplier\": 1.0}",
                1, null, null));
        rows.add(new SeedRow("CONSULTANT_GRADE", "CONSULTANT_SENIOR", "시니어 상담사", "시니어 상담사",
                "중급 상담사 (3-5년 경력)",
                "{\"level\": 2, \"experience\": \"3-5년\", \"description\": \"중급 상담사\", \"multiplier\": 1.2}",
                2, null, null));
        rows.add(new SeedRow("CONSULTANT_GRADE", "CONSULTANT_EXPERT", "엑스퍼트 상담사", "엑스퍼트 상담사",
                "고급 상담사 (6-10년 경력)",
                "{\"level\": 3, \"experience\": \"6-10년\", \"description\": \"고급 상담사\", \"multiplier\": 1.4}",
                3, null, null));
        rows.add(new SeedRow("CONSULTANT_GRADE", "CONSULTANT_MASTER", "마스터 상담사", "마스터 상담사",
                "최고급 상담사 (10년 이상 경력)",
                "{\"level\": 4, \"experience\": \"10년 이상\", \"description\": \"최고급 상담사\", \"multiplier\": 1.6}",
                4, null, null));

        // --- CLIENT_GRADE (CONSULTANT_GRADE와 동일 extraData 패턴) ---
        rows.add(new SeedRow("CLIENT_GRADE", "CLIENT_STANDARD", "일반", "일반",
                "기본 내담자 등급",
                "{\"level\": 1, \"tier\": \"STANDARD\", \"description\": \"일반 내담자\", \"multiplier\": 1.0}",
                1, null, null));
        rows.add(new SeedRow("CLIENT_GRADE", "CLIENT_PREMIUM", "우수", "우수",
                "우수 내담자 등급",
                "{\"level\": 2, \"tier\": \"PREMIUM\", \"description\": \"우수 내담자\", \"multiplier\": 1.1}",
                2, null, null));
        rows.add(new SeedRow("CLIENT_GRADE", "CLIENT_VIP", "프리미엄", "프리미엄",
                "프리미엄 내담자 등급",
                "{\"level\": 3, \"tier\": \"VIP\", \"description\": \"프리미엄 내담자\", \"multiplier\": 1.2}",
                3, null, null));
        rows.add(new SeedRow("CLIENT_GRADE", "CLIENT_ELITE", "엘리트", "엘리트",
                "최상위 내담자 등급",
                "{\"level\": 4, \"tier\": \"ELITE\", \"description\": \"엘리트 내담자\", \"multiplier\": 1.3}",
                4, null, null));

        // --- ADMIN_GRADE ---
        rows.add(new SeedRow("ADMIN_GRADE", "ADMIN_JUNIOR", "주니어 관리", "주니어 관리",
                "초급 관리 업무",
                "{\"level\": 1, \"scope\": \"JUNIOR\", \"description\": \"주니어 관리\", \"multiplier\": 1.0}",
                1, null, null));
        rows.add(new SeedRow("ADMIN_GRADE", "ADMIN_SENIOR", "시니어 관리", "시니어 관리",
                "중급 관리 업무",
                "{\"level\": 2, \"scope\": \"SENIOR\", \"description\": \"시니어 관리\", \"multiplier\": 1.15}",
                2, null, null));
        rows.add(new SeedRow("ADMIN_GRADE", "ADMIN_EXPERT", "전문 관리", "전문 관리",
                "고급 관리 업무",
                "{\"level\": 3, \"scope\": \"EXPERT\", \"description\": \"전문 관리\", \"multiplier\": 1.3}",
                3, null, null));
        rows.add(new SeedRow("ADMIN_GRADE", "ADMIN_MASTER", "마스터 관리", "마스터 관리",
                "최고급 관리 업무",
                "{\"level\": 4, \"scope\": \"MASTER\", \"description\": \"마스터 관리\", \"multiplier\": 1.45}",
                4, null, null));

        // --- SALARY_TYPE ---
        rows.add(new SeedRow("SALARY_TYPE", "FREELANCE", "프리랜서", "프리랜서", "프리랜서 상담사 급여",
                "{\"type\": \"FREELANCE\", \"description\": \"프리랜서 상담사\", \"taxType\": \"WITHHOLDING\"}",
                1, null, null));
        rows.add(new SeedRow("SALARY_TYPE", "REGULAR", "정규직", "정규직", "정규직 상담사 급여",
                "{\"type\": \"REGULAR\", \"description\": \"정규직 상담사\", \"taxType\": \"INCOME_TAX\"}", 2,
                null, null));

        // --- SALARY_OPTION_TYPE ---
        rows.add(new SeedRow("SALARY_OPTION_TYPE", "FAMILY_CONSULTATION", "가족상담", "가족상담",
                "가족상담 시 추가 급여",
                "{\"type\": \"FAMILY_CONSULTATION\", \"baseAmount\": 3000, \"description\": \"가족상담 추가 급여\"}",
                1, null, null));
        rows.add(new SeedRow("SALARY_OPTION_TYPE", "INITIAL_CONSULTATION", "초기상담", "초기상담",
                "초기상담 시 추가 급여",
                "{\"type\": \"INITIAL_CONSULTATION\", \"baseAmount\": 5000, \"description\": \"초기상담 추가 급여\"}",
                2, null, null));
        rows.add(new SeedRow("SALARY_OPTION_TYPE", "WEEKEND_CONSULTATION", "주말상담", "주말상담",
                "주말상담 시 추가 급여",
                "{\"type\": \"WEEKEND_CONSULTATION\", \"baseAmount\": 2000, \"description\": \"주말상담 추가 급여\"}",
                3, null, null));
        rows.add(new SeedRow("SALARY_OPTION_TYPE", "ONLINE_CONSULTATION", "온라인상담", "온라인상담",
                "온라인상담 시 추가 급여",
                "{\"type\": \"ONLINE_CONSULTATION\", \"baseAmount\": 1000, \"description\": \"온라인상담 추가 급여\"}",
                4, null, null));
        rows.add(new SeedRow("SALARY_OPTION_TYPE", "PHONE_CONSULTATION", "전화상담", "전화상담",
                "전화상담 시 추가 급여",
                "{\"type\": \"PHONE_CONSULTATION\", \"baseAmount\": 1500, \"description\": \"전화상담 추가 급여\"}",
                5, null, null));
        rows.add(new SeedRow("SALARY_OPTION_TYPE", "TRAUMA_CONSULTATION", "트라우마상담", "트라우마상담",
                "트라우마상담 시 추가 급여",
                "{\"type\": \"TRAUMA_CONSULTATION\", \"baseAmount\": 4000, \"description\": \"트라우마상담 추가 급여\"}",
                6, null, null));

        // --- CONSULTANT_GRADE_SALARY ---
        rows.add(new SeedRow("CONSULTANT_GRADE_SALARY", "JUNIOR_BASE", "주니어 기본급", "주니어 기본급",
                "주니어 상담사 기본 급여",
                "{\"baseAmount\": 3000000, \"grade\": \"CONSULTANT_JUNIOR\", \"level\": 1}", 1, null,
                null));
        rows.add(new SeedRow("CONSULTANT_GRADE_SALARY", "SENIOR_BASE", "시니어 기본급", "시니어 기본급",
                "시니어 상담사 기본 급여",
                "{\"baseAmount\": 4000000, \"grade\": \"CONSULTANT_SENIOR\", \"level\": 2}", 2, null,
                null));
        rows.add(new SeedRow("CONSULTANT_GRADE_SALARY", "EXPERT_BASE", "엑스퍼트 기본급", "엑스퍼트 기본급",
                "엑스퍼트 상담사 기본 급여",
                "{\"baseAmount\": 5000000, \"grade\": \"CONSULTANT_EXPERT\", \"level\": 3}", 3, null,
                null));
        rows.add(new SeedRow("CONSULTANT_GRADE_SALARY", "MASTER_BASE", "마스터 기본급", "마스터 기본급",
                "마스터 상담사 기본 급여",
                "{\"baseAmount\": 6000000, \"grade\": \"CONSULTANT_MASTER\", \"level\": 4}", 4, null,
                null));

        // --- FREELANCE_BASE_RATE ---
        rows.add(new SeedRow("FREELANCE_BASE_RATE", "JUNIOR_RATE", "주니어 기본상담료", "주니어 기본상담료",
                "주니어 프리랜서 기본 상담료",
                "{\"rate\": 30000, \"grade\": \"CONSULTANT_JUNIOR\", \"duration\": 50, \"level\": 1}", 1,
                null, null));
        rows.add(new SeedRow("FREELANCE_BASE_RATE", "SENIOR_RATE", "시니어 기본상담료", "시니어 기본상담료",
                "시니어 프리랜서 기본 상담료",
                "{\"rate\": 35000, \"grade\": \"CONSULTANT_SENIOR\", \"duration\": 50, \"level\": 2}", 2,
                null, null));
        rows.add(new SeedRow("FREELANCE_BASE_RATE", "EXPERT_RATE", "엑스퍼트 기본상담료", "엑스퍼트 기본상담료",
                "엑스퍼트 프리랜서 기본 상담료",
                "{\"rate\": 40000, \"grade\": \"CONSULTANT_EXPERT\", \"duration\": 50, \"level\": 3}", 3,
                null, null));
        rows.add(new SeedRow("FREELANCE_BASE_RATE", "MASTER_RATE", "마스터 기본상담료", "마스터 기본상담료",
                "마스터 프리랜서 기본 상담료",
                "{\"rate\": 45000, \"grade\": \"CONSULTANT_MASTER\", \"duration\": 50, \"level\": 4}", 4,
                null, null));

        // --- FinancialCommonCodeInitializer (테넌트 ERP 최소 세트) ---
        rows.add(new SeedRow("TRANSACTION_TYPE", "INCOME", "수입", "수입", "수입 거래", null, 1, null,
                null));
        rows.add(new SeedRow("TRANSACTION_TYPE", "EXPENSE", "지출", "지출", "지출 거래", null, 2, null,
                null));

        rows.add(new SeedRow("INCOME_CATEGORY", "CONSULTATION", "상담료", "상담료", "상담 서비스 수익", null,
                1, null, null));
        rows.add(new SeedRow("INCOME_CATEGORY", "PACKAGE", "패키지", "패키지", "상담 패키지 판매 수익", null,
                2, null, null));
        rows.add(new SeedRow("INCOME_CATEGORY", "OTHER", "기타수입", "기타수입", "기타 수입 항목", null, 3,
                null, null));

        rows.add(new SeedRow("EXPENSE_CATEGORY", "SALARY", "급여", "급여", "직원 급여", null, 1, null,
                null));
        rows.add(new SeedRow("EXPENSE_CATEGORY", "RENT", "임대료", "임대료", "사무실 임대료", null, 2,
                null, null));
        rows.add(new SeedRow("EXPENSE_CATEGORY", "UTILITY", "관리비", "관리비", "시설 관리비", null, 3,
                null, null));
        rows.add(new SeedRow("EXPENSE_CATEGORY", "OFFICE_SUPPLIES", "사무용품", "사무용품", "사무용품 구매",
                null, 4, null, null));
        rows.add(new SeedRow("EXPENSE_CATEGORY", "TAX", "세금", "세금", "각종 세금", null, 5, null,
                null));
        rows.add(new SeedRow("EXPENSE_CATEGORY", "MARKETING", "마케팅", "마케팅", "마케팅 비용", null, 6,
                null, null));
        rows.add(new SeedRow("EXPENSE_CATEGORY", "EQUIPMENT", "장비", "장비", "장비 구매", null, 7, null,
                null));
        rows.add(new SeedRow("EXPENSE_CATEGORY", "SOFTWARE", "소프트웨어", "소프트웨어", "소프트웨어 라이선스",
                null, 8, null, null));
        rows.add(new SeedRow("EXPENSE_CATEGORY", "CONSULTING", "컨설팅", "컨설팅", "외부 컨설팅 비용", null,
                9, null, null));
        rows.add(new SeedRow("EXPENSE_CATEGORY", "OTHER", "기타잡비", "기타잡비", "기타 지출 항목", null, 10,
                null, null));

        rows.add(new SeedRow("INCOME_SUBCATEGORY", "INDIVIDUAL_CONSULTATION", "개인상담", "개인상담",
                "개인 상담 서비스", null, 1, "INCOME_CATEGORY", "CONSULTATION"));
        rows.add(new SeedRow("INCOME_SUBCATEGORY", "GROUP_CONSULTATION", "그룹상담", "그룹상담",
                "그룹 상담 서비스", null, 2, "INCOME_CATEGORY", "CONSULTATION"));
        rows.add(new SeedRow("INCOME_SUBCATEGORY", "ADDITIONAL_CONSULTATION", "추가상담", "추가상담",
                "추가 회기 상담 서비스", null, 3, "INCOME_CATEGORY", "CONSULTATION"));
        rows.add(new SeedRow("INCOME_SUBCATEGORY", "BASIC_PACKAGE", "기본패키지", "기본패키지",
                "기본 상담 패키지", null, 4, "INCOME_CATEGORY", "PACKAGE"));
        rows.add(new SeedRow("INCOME_SUBCATEGORY", "PREMIUM_PACKAGE", "프리미엄패키지", "프리미엄패키지",
                "프리미엄 상담 패키지", null, 5, "INCOME_CATEGORY", "PACKAGE"));
        rows.add(new SeedRow("INCOME_SUBCATEGORY", "OTHER_INCOME", "기타수입", "기타수입", "기타 수입 항목",
                null, 6, "INCOME_CATEGORY", "OTHER"));

        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "CONSULTANT_SALARY", "상담사급여", "상담사급여",
                "상담사 급여", null, 1, "EXPENSE_CATEGORY", "SALARY"));
        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "ADMIN_SALARY", "관리자급여", "관리자급여", "관리자 급여",
                null, 2, "EXPENSE_CATEGORY", "SALARY"));
        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "OFFICE_RENT", "사무실임대료", "사무실임대료",
                "사무실 임대료", null, 3, "EXPENSE_CATEGORY", "RENT"));
        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "MAINTENANCE_FEE", "시설관리비", "시설관리비",
                "시설 관리비", null, 4, "EXPENSE_CATEGORY", "UTILITY"));
        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "ELECTRICITY", "전기요금", "전기요금", "전기 요금", null,
                5, "EXPENSE_CATEGORY", "UTILITY"));
        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "WATER", "수도요금", "수도요금", "수도 요금", null, 6,
                "EXPENSE_CATEGORY", "UTILITY"));
        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "STATIONERY", "문구류", "문구류", "사무용 문구류", null,
                7, "EXPENSE_CATEGORY", "OFFICE_SUPPLIES"));
        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "PRINTING", "인쇄비", "인쇄비", "인쇄 관련 비용", null,
                8, "EXPENSE_CATEGORY", "OFFICE_SUPPLIES"));
        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "INCOME_TAX", "소득세", "소득세", "소득세", null, 9,
                "EXPENSE_CATEGORY", "TAX"));
        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "VAT", "부가가치세", "부가가치세", "부가가치세", null, 10,
                "EXPENSE_CATEGORY", "TAX"));
        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "CORPORATE_TAX", "법인세", "법인세", "법인세", null, 11,
                "EXPENSE_CATEGORY", "TAX"));
        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "ONLINE_ADS", "온라인광고", "온라인광고",
                "온라인 광고비", null, 12, "EXPENSE_CATEGORY", "MARKETING"));
        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "OFFLINE_ADS", "오프라인광고", "오프라인광고",
                "오프라인 광고비", null, 13, "EXPENSE_CATEGORY", "MARKETING"));
        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "COMPUTER", "컴퓨터장비", "컴퓨터장비", "컴퓨터 장비",
                null, 14, "EXPENSE_CATEGORY", "EQUIPMENT"));
        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "FURNITURE", "가구", "가구", "사무용 가구", null, 15,
                "EXPENSE_CATEGORY", "EQUIPMENT"));
        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "LICENSE", "소프트웨어라이선스", "소프트웨어라이선스",
                "소프트웨어 라이선스", null, 16, "EXPENSE_CATEGORY", "SOFTWARE"));
        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "EXTERNAL_CONSULTING", "외부컨설팅", "외부컨설팅",
                "외부 컨설팅", null, 17, "EXPENSE_CATEGORY", "CONSULTING"));
        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "CONSULTATION_REFUND", "상담료환불", "상담료환불",
                "상담료 환불", null, 18, "EXPENSE_CATEGORY", "CONSULTATION"));
        rows.add(new SeedRow("EXPENSE_SUBCATEGORY", "OTHER_EXPENSE", "기타", "기타", "기타 지출", null, 19,
                "EXPENSE_CATEGORY", "OTHER"));

        rows.add(new SeedRow("VAT_APPLICABLE", "APPLICABLE", "부가세 적용", "부가세 적용",
                "부가세가 적용되는 항목", null, 1, null, null));
        rows.add(new SeedRow("VAT_APPLICABLE", "NOT_APPLICABLE", "부가세 미적용", "부가세 미적용",
                "부가세가 적용되지 않는 항목 (급여 등)", null, 2, null, null));

        rows.add(new SeedRow("ERP_ACCOUNT_TYPE", "REVENUE", "수익", "수익", "수익 계정 (손익계산서)", null, 1,
                null, null));
        rows.add(new SeedRow("ERP_ACCOUNT_TYPE", "EXPENSE", "비용", "비용", "비용 계정 (손익계산서)", null, 2,
                null, null));
        rows.add(new SeedRow("ERP_ACCOUNT_TYPE", "CASH", "현금", "현금", "현금/자산 계정 (대차대조표·현금흐름)",
                null, 3, null, null));
        rows.add(new SeedRow("ERP_ACCOUNT_TYPE", "LIABILITY", "환불부채", "환불부채",
                "환불부채 계정 (대차대조표 부채)", null, 4, null, null));
        rows.add(new SeedRow("ERP_ACCOUNT_TYPE", "VAT_PAYABLE", "부가세 예수금", "부가세 예수금",
                "부가세 예수·부채 계정 (대차대조표)", null, 5, null, null));
        rows.add(new SeedRow("ERP_ACCOUNT_TYPE", "WITHHOLDING_PAYABLE", "원천징수 예수금", "원천징수 예수금",
                "원천징수 예수금·부채 계정 (대차대조표)", null, 6, null, null));

        ROWS = Collections.unmodifiableList(rows);
    }

    /**
     * 급여·ERP 온보딩 시드 전체 (순서는 카테고리 선행 후 서브카테고리).
     *
     * @return 불변 목록
     */
    public static List<SeedRow> allRows() {
        return ROWS;
    }
}
