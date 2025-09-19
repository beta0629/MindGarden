package com.mindgarden.consultation.service.impl;

import com.mindgarden.consultation.entity.CommonCode;
import com.mindgarden.consultation.repository.CommonCodeRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 재무 거래 관련 공통 코드 초기화 서비스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FinancialCommonCodeInitializer implements CommandLineRunner {

    private final CommonCodeRepository commonCodeRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        initializeFinancialCommonCodes();
    }

    /**
     * 재무 거래 관련 공통 코드 초기화
     */
    private void initializeFinancialCommonCodes() {
        log.info("🏦 재무 거래 관련 공통 코드 초기화 시작");

        // 1. 거래 유형 (INCOME, EXPENSE)
        initializeTransactionTypes();
        
        // 2. 수입 카테고리
        initializeIncomeCategories();
        
        // 3. 지출 카테고리
        initializeExpenseCategories();
        
        // 4. 수입 세부 항목
        initializeIncomeSubcategories();
        
        // 5. 지출 세부 항목
        initializeExpenseSubcategories();
        
        // 6. 부가세 적용 여부
        initializeVatCategories();

        log.info("✅ 재무 거래 관련 공통 코드 초기화 완료");
    }

    /**
     * 거래 유형 초기화
     */
    private void initializeTransactionTypes() {
        String codeGroup = "TRANSACTION_TYPE";
        
        // 기존 코드가 있는지 확인
        if (commonCodeRepository.countByCodeGroup(codeGroup) > 0) {
            log.info("거래 유형 코드가 이미 존재합니다.");
            return;
        }

        commonCodeRepository.save(CommonCode.builder()
                .codeGroup(codeGroup)
                .codeValue("INCOME")
                .codeLabel("수입")
                .codeDescription("수입 거래")
                .sortOrder(1)
                .isActive(true)
                .build());

        commonCodeRepository.save(CommonCode.builder()
                .codeGroup(codeGroup)
                .codeValue("EXPENSE")
                .codeLabel("지출")
                .codeDescription("지출 거래")
                .sortOrder(2)
                .isActive(true)
                .build());

        log.info("거래 유형 코드 초기화 완료");
    }

    /**
     * 수입 카테고리 초기화
     */
    private void initializeIncomeCategories() {
        String codeGroup = "INCOME_CATEGORY";
        
        if (commonCodeRepository.countByCodeGroup(codeGroup) > 0) {
            log.info("수입 카테고리 코드가 이미 존재합니다.");
            return;
        }

        String[][] incomeCategories = {
            {"CONSULTATION", "상담료", "상담 서비스 수익"},
            {"PACKAGE", "패키지", "상담 패키지 판매 수익"},
            {"OTHER", "기타수입", "기타 수입 항목"}
        };

        for (int i = 0; i < incomeCategories.length; i++) {
            commonCodeRepository.save(CommonCode.builder()
                    .codeGroup(codeGroup)
                    .codeValue(incomeCategories[i][0])
                    .codeLabel(incomeCategories[i][1])
                    .codeDescription(incomeCategories[i][2])
                    .sortOrder(i + 1)
                    .isActive(true)
                    .build());
        }

        log.info("수입 카테고리 코드 초기화 완료");
    }

    /**
     * 지출 카테고리 초기화
     */
    private void initializeExpenseCategories() {
        String codeGroup = "EXPENSE_CATEGORY";
        
        if (commonCodeRepository.countByCodeGroup(codeGroup) > 0) {
            log.info("지출 카테고리 코드가 이미 존재합니다.");
            return;
        }

        String[][] expenseCategories = {
            {"SALARY", "급여", "직원 급여"},
            {"RENT", "임대료", "사무실 임대료"},
            {"UTILITY", "관리비", "시설 관리비"},
            {"OFFICE_SUPPLIES", "사무용품", "사무용품 구매"},
            {"TAX", "세금", "각종 세금"},
            {"MARKETING", "마케팅", "마케팅 비용"},
            {"EQUIPMENT", "장비", "장비 구매"},
            {"SOFTWARE", "소프트웨어", "소프트웨어 라이선스"},
            {"CONSULTING", "컨설팅", "외부 컨설팅 비용"},
            {"OTHER", "기타잡비", "기타 지출 항목"}
        };

        for (int i = 0; i < expenseCategories.length; i++) {
            commonCodeRepository.save(CommonCode.builder()
                    .codeGroup(codeGroup)
                    .codeValue(expenseCategories[i][0])
                    .codeLabel(expenseCategories[i][1])
                    .codeDescription(expenseCategories[i][2])
                    .sortOrder(i + 1)
                    .isActive(true)
                    .build());
        }

        log.info("지출 카테고리 코드 초기화 완료");
    }

    /**
     * 수입 세부 항목 초기화
     */
    private void initializeIncomeSubcategories() {
        String codeGroup = "INCOME_SUBCATEGORY";
        
        if (commonCodeRepository.countByCodeGroup(codeGroup) > 0) {
            log.info("수입 세부 항목 코드가 이미 존재합니다.");
            return;
        }

        String[][] incomeSubcategories = {
            {"INDIVIDUAL_CONSULTATION", "개인상담", "개인 상담 서비스", "CONSULTATION"},
            {"GROUP_CONSULTATION", "그룹상담", "그룹 상담 서비스", "CONSULTATION"},
            {"BASIC_PACKAGE", "기본패키지", "기본 상담 패키지", "PACKAGE"},
            {"PREMIUM_PACKAGE", "프리미엄패키지", "프리미엄 상담 패키지", "PACKAGE"},
            {"OTHER_INCOME", "기타수입", "기타 수입 항목", "OTHER"}
        };

        for (int i = 0; i < incomeSubcategories.length; i++) {
            commonCodeRepository.save(CommonCode.builder()
                    .codeGroup(codeGroup)
                    .codeValue(incomeSubcategories[i][0])
                    .codeLabel(incomeSubcategories[i][1])
                    .codeDescription(incomeSubcategories[i][2])
                    .parentCodeGroup("INCOME_CATEGORY")
                    .parentCodeValue(incomeSubcategories[i][3])
                    .sortOrder(i + 1)
                    .isActive(true)
                    .build());
        }

        log.info("수입 세부 항목 코드 초기화 완료");
    }

    /**
     * 지출 세부 항목 초기화
     */
    private void initializeExpenseSubcategories() {
        String codeGroup = "EXPENSE_SUBCATEGORY";
        
        if (commonCodeRepository.countByCodeGroup(codeGroup) > 0) {
            log.info("지출 세부 항목 코드가 이미 존재합니다.");
            return;
        }

        String[][] expenseSubcategories = {
            {"CONSULTANT_SALARY", "상담사급여", "상담사 급여", "SALARY"},
            {"ADMIN_SALARY", "관리자급여", "관리자 급여", "SALARY"},
            {"OFFICE_RENT", "사무실임대료", "사무실 임대료", "RENT"},
            {"MAINTENANCE_FEE", "시설관리비", "시설 관리비", "UTILITY"},
            {"ELECTRICITY", "전기요금", "전기 요금", "UTILITY"},
            {"WATER", "수도요금", "수도 요금", "UTILITY"},
            {"STATIONERY", "문구류", "사무용 문구류", "OFFICE_SUPPLIES"},
            {"PRINTING", "인쇄비", "인쇄 관련 비용", "OFFICE_SUPPLIES"},
            {"INCOME_TAX", "소득세", "소득세", "TAX"},
            {"VAT", "부가가치세", "부가가치세", "TAX"},
            {"CORPORATE_TAX", "법인세", "법인세", "TAX"},
            {"ONLINE_ADS", "온라인광고", "온라인 광고비", "MARKETING"},
            {"OFFLINE_ADS", "오프라인광고", "오프라인 광고비", "MARKETING"},
            {"COMPUTER", "컴퓨터장비", "컴퓨터 장비", "EQUIPMENT"},
            {"FURNITURE", "가구", "사무용 가구", "EQUIPMENT"},
            {"LICENSE", "소프트웨어라이선스", "소프트웨어 라이선스", "SOFTWARE"},
            {"EXTERNAL_CONSULTING", "외부컨설팅", "외부 컨설팅", "CONSULTING"},
            {"CONSULTATION_REFUND", "상담료환불", "상담료 환불", "CONSULTATION"},
            {"OTHER_EXPENSE", "기타", "기타 지출", "OTHER"}
        };

        for (int i = 0; i < expenseSubcategories.length; i++) {
            commonCodeRepository.save(CommonCode.builder()
                    .codeGroup(codeGroup)
                    .codeValue(expenseSubcategories[i][0])
                    .codeLabel(expenseSubcategories[i][1])
                    .codeDescription(expenseSubcategories[i][2])
                    .parentCodeGroup("EXPENSE_CATEGORY")
                    .parentCodeValue(expenseSubcategories[i][3])
                    .sortOrder(i + 1)
                    .isActive(true)
                    .build());
        }

        log.info("지출 세부 항목 코드 초기화 완료");
    }

    /**
     * 부가세 적용 여부 카테고리 초기화
     */
    private void initializeVatCategories() {
        String codeGroup = "VAT_APPLICABLE";
        
        if (commonCodeRepository.countByCodeGroup(codeGroup) > 0) {
            log.info("부가세 적용 여부 코드가 이미 존재합니다.");
            return;
        }

        commonCodeRepository.save(CommonCode.builder()
                .codeGroup(codeGroup)
                .codeValue("APPLICABLE")
                .codeLabel("부가세 적용")
                .codeDescription("부가세가 적용되는 항목")
                .sortOrder(1)
                .isActive(true)
                .build());

        commonCodeRepository.save(CommonCode.builder()
                .codeGroup(codeGroup)
                .codeValue("NOT_APPLICABLE")
                .codeLabel("부가세 미적용")
                .codeDescription("부가세가 적용되지 않는 항목 (급여 등)")
                .sortOrder(2)
                .isActive(true)
                .build());

        log.info("부가세 적용 여부 코드 초기화 완료");
    }
}
