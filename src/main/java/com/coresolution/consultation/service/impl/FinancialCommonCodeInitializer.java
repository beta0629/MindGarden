package com.coresolution.consultation.service.impl;


import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.coresolution.consultation.constant.financial.FinancialCommonCodeSeedStrings;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.repository.CommonCodeRepository;

/**
 * 재무 거래 관련 공통 코드 초기화 서비스
 * ApplicationReadyEvent를 사용하여 데이터베이스 연결 풀이 완전히 초기화된 후 실행
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FinancialCommonCodeInitializer {

    private final CommonCodeRepository commonCodeRepository;

    @EventListener(ApplicationReadyEvent.class)
    @Order(30) // 다른 초기화 작업보다 먼저 실행
    @Transactional
    public void initialize(ApplicationReadyEvent event) {
        try {
            log.info("🚀 재무 공통코드 초기화 시작");
            initializeFinancialCommonCodes();
            log.info("✅ 재무 공통코드 초기화 완료");
        } catch (Exception e) {
            log.error("❌ 재무 거래 관련 공통 코드 초기화 실패 (계속 진행): {}", e.getMessage(), e);
        }
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

        // 7. ERP 계정 타입 (재무제표·분개 연동용, 테넌트별 extraData.accountId 설정 시 분개 생성)
        initializeErpAccountTypes();

        log.info("✅ 재무 거래 관련 공통 코드 초기화 완료");
    }

    /**
     * ERP 계정 타입 코드 초기화 (코어)
     * 테넌트별로 동일 그룹/값으로 오버라이드 시 extraData에 {"accountId": 계정ID} 설정 필요.
     * 표준: docs/planning/ERP_STATEMENTS_VS_OTHER_REPORTS_LINKAGE_PLAN.md
     */
    private void initializeErpAccountTypes() {
        String codeGroup = "ERP_ACCOUNT_TYPE";
        java.util.List<CommonCode> existing = commonCodeRepository.findCoreCodesByGroup(codeGroup);
        if (!existing.isEmpty()) {
            boolean augmented = false;
            if (existing.stream().noneMatch(cc -> "LIABILITY".equals(cc.getCodeValue()))) {
                commonCodeRepository.save(CommonCode.builder()
                        .codeGroup(codeGroup)
                        .codeValue("LIABILITY")
                        .codeLabel(FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_LIABILITY_DISPLAY)
                        .koreanName(FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_LIABILITY_DISPLAY)
                        .codeDescription(FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_LIABILITY_DESCRIPTION)
                        .sortOrder(4)
                        .isActive(true)
                        .build());
                log.info("ERP_ACCOUNT_TYPE LIABILITY 코어 코드 추가 완료");
                augmented = true;
            }
            if (existing.stream().noneMatch(cc -> "VAT_PAYABLE".equals(cc.getCodeValue()))) {
                commonCodeRepository.save(CommonCode.builder()
                        .codeGroup(codeGroup)
                        .codeValue("VAT_PAYABLE")
                        .codeLabel(FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_VAT_PAYABLE_DISPLAY)
                        .koreanName(FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_VAT_PAYABLE_DISPLAY)
                        .codeDescription(FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_VAT_PAYABLE_DESCRIPTION)
                        .sortOrder(5)
                        .isActive(true)
                        .build());
                log.info("ERP_ACCOUNT_TYPE VAT_PAYABLE 코어 코드 추가 완료");
                augmented = true;
            }
            if (existing.stream().noneMatch(cc -> "WITHHOLDING_PAYABLE".equals(cc.getCodeValue()))) {
                commonCodeRepository.save(CommonCode.builder()
                        .codeGroup(codeGroup)
                        .codeValue("WITHHOLDING_PAYABLE")
                        .codeLabel(FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_WITHHOLDING_PAYABLE_DISPLAY)
                        .koreanName(FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_WITHHOLDING_PAYABLE_DISPLAY)
                        .codeDescription(FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_WITHHOLDING_PAYABLE_DESCRIPTION)
                        .sortOrder(6)
                        .isActive(true)
                        .build());
                log.info("ERP_ACCOUNT_TYPE WITHHOLDING_PAYABLE 코어 코드 추가 완료");
                augmented = true;
            }
            if (!augmented) {
                log.info("ERP_ACCOUNT_TYPE 코어 코드가 이미 존재합니다.");
            }
            return;
        }

        commonCodeRepository.save(CommonCode.builder()
                .codeGroup(codeGroup)
                .codeValue("REVENUE")
                .codeLabel(FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_REVENUE_DISPLAY)
                .koreanName(FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_REVENUE_DISPLAY)
                .codeDescription(FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_REVENUE_DESCRIPTION)
                .sortOrder(1)
                .isActive(true)
                .build());

        commonCodeRepository.save(CommonCode.builder()
                .codeGroup(codeGroup)
                .codeValue("EXPENSE")
                .codeLabel(FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_EXPENSE_DISPLAY)
                .koreanName(FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_EXPENSE_DISPLAY)
                .codeDescription(FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_EXPENSE_DESCRIPTION)
                .sortOrder(2)
                .isActive(true)
                .build());

        commonCodeRepository.save(CommonCode.builder()
                .codeGroup(codeGroup)
                .codeValue("CASH")
                .codeLabel(FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_CASH_DISPLAY)
                .koreanName(FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_CASH_DISPLAY)
                .codeDescription(FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_CASH_DESCRIPTION)
                .sortOrder(3)
                .isActive(true)
                .build());

        commonCodeRepository.save(CommonCode.builder()
                .codeGroup(codeGroup)
                .codeValue("LIABILITY")
                .codeLabel(FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_LIABILITY_DISPLAY)
                .koreanName(FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_LIABILITY_DISPLAY)
                .codeDescription(FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_LIABILITY_DESCRIPTION)
                .sortOrder(4)
                .isActive(true)
                .build());

        commonCodeRepository.save(CommonCode.builder()
                .codeGroup(codeGroup)
                .codeValue("VAT_PAYABLE")
                .codeLabel(FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_VAT_PAYABLE_DISPLAY)
                .koreanName(FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_VAT_PAYABLE_DISPLAY)
                .codeDescription(FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_VAT_PAYABLE_DESCRIPTION)
                .sortOrder(5)
                .isActive(true)
                .build());

        commonCodeRepository.save(CommonCode.builder()
                .codeGroup(codeGroup)
                .codeValue("WITHHOLDING_PAYABLE")
                .codeLabel(FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_WITHHOLDING_PAYABLE_DISPLAY)
                .koreanName(FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_WITHHOLDING_PAYABLE_DISPLAY)
                .codeDescription(FinancialCommonCodeSeedStrings.ERP_ACCOUNT_TYPE_WITHHOLDING_PAYABLE_DESCRIPTION)
                .sortOrder(6)
                .isActive(true)
                .build());

        log.info("ERP_ACCOUNT_TYPE 코어 코드 초기화 완료 (REVENUE, EXPENSE, CASH, LIABILITY, VAT_PAYABLE, "
                + "WITHHOLDING_PAYABLE)");
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
                .codeLabel(FinancialCommonCodeSeedStrings.TRANSACTION_TYPE_INCOME_DISPLAY)
                .codeDescription(FinancialCommonCodeSeedStrings.TRANSACTION_TYPE_INCOME_DESCRIPTION)
                .sortOrder(1)
                .isActive(true)
                .build());

        commonCodeRepository.save(CommonCode.builder()
                .codeGroup(codeGroup)
                .codeValue("EXPENSE")
                .codeLabel(FinancialCommonCodeSeedStrings.TRANSACTION_TYPE_EXPENSE_DISPLAY)
                .codeDescription(FinancialCommonCodeSeedStrings.TRANSACTION_TYPE_EXPENSE_DESCRIPTION)
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
            {"CONSULTATION", FinancialCommonCodeSeedStrings.INCOME_CATEGORY_CONSULTATION_DISPLAY,
                    FinancialCommonCodeSeedStrings.INCOME_CATEGORY_CONSULTATION_DESCRIPTION},
            {"PACKAGE", FinancialCommonCodeSeedStrings.INCOME_CATEGORY_PACKAGE_DISPLAY,
                    FinancialCommonCodeSeedStrings.INCOME_CATEGORY_PACKAGE_DESCRIPTION},
            {"OTHER", FinancialCommonCodeSeedStrings.INCOME_CATEGORY_OTHER_DISPLAY,
                    FinancialCommonCodeSeedStrings.INCOME_CATEGORY_OTHER_DESCRIPTION}
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
            {"SALARY", FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_SALARY_DISPLAY,
                    FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_SALARY_DESCRIPTION},
            {"RENT", FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_RENT_DISPLAY,
                    FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_RENT_DESCRIPTION},
            {"UTILITY", FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_UTILITY_DISPLAY,
                    FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_UTILITY_DESCRIPTION},
            {"OFFICE_SUPPLIES", FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_OFFICE_SUPPLIES_DISPLAY,
                    FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_OFFICE_SUPPLIES_DESCRIPTION},
            {"TAX", FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_TAX_DISPLAY,
                    FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_TAX_DESCRIPTION},
            {"MARKETING", FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_MARKETING_DISPLAY,
                    FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_MARKETING_DESCRIPTION},
            {"EQUIPMENT", FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_EQUIPMENT_DISPLAY,
                    FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_EQUIPMENT_DESCRIPTION},
            {"SOFTWARE", FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_SOFTWARE_DISPLAY,
                    FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_SOFTWARE_DESCRIPTION},
            {"CONSULTING", FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_CONSULTING_DISPLAY,
                    FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_CONSULTING_DESCRIPTION},
            {"OTHER", FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_OTHER_DISPLAY,
                    FinancialCommonCodeSeedStrings.EXPENSE_CATEGORY_OTHER_DESCRIPTION}
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
            {"INDIVIDUAL_CONSULTATION",
                    FinancialCommonCodeSeedStrings.INCOME_SUBCATEGORY_INDIVIDUAL_CONSULTATION_DISPLAY,
                    FinancialCommonCodeSeedStrings.INCOME_SUBCATEGORY_INDIVIDUAL_CONSULTATION_DESCRIPTION, "CONSULTATION"},
            {"GROUP_CONSULTATION",
                    FinancialCommonCodeSeedStrings.INCOME_SUBCATEGORY_GROUP_CONSULTATION_DISPLAY,
                    FinancialCommonCodeSeedStrings.INCOME_SUBCATEGORY_GROUP_CONSULTATION_DESCRIPTION, "CONSULTATION"},
            {"ADDITIONAL_CONSULTATION",
                    FinancialCommonCodeSeedStrings.INCOME_SUBCATEGORY_ADDITIONAL_CONSULTATION_DISPLAY,
                    FinancialCommonCodeSeedStrings.INCOME_SUBCATEGORY_ADDITIONAL_CONSULTATION_DESCRIPTION, "CONSULTATION"},
            {"BASIC_PACKAGE", FinancialCommonCodeSeedStrings.INCOME_SUBCATEGORY_BASIC_PACKAGE_DISPLAY,
                    FinancialCommonCodeSeedStrings.INCOME_SUBCATEGORY_BASIC_PACKAGE_DESCRIPTION, "PACKAGE"},
            {"PREMIUM_PACKAGE", FinancialCommonCodeSeedStrings.INCOME_SUBCATEGORY_PREMIUM_PACKAGE_DISPLAY,
                    FinancialCommonCodeSeedStrings.INCOME_SUBCATEGORY_PREMIUM_PACKAGE_DESCRIPTION, "PACKAGE"},
            {"OTHER_INCOME", FinancialCommonCodeSeedStrings.INCOME_SUBCATEGORY_OTHER_INCOME_DISPLAY,
                    FinancialCommonCodeSeedStrings.INCOME_SUBCATEGORY_OTHER_INCOME_DESCRIPTION, "OTHER"}
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
            {"CONSULTANT_SALARY", FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_CONSULTANT_SALARY_DISPLAY,
                    FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_CONSULTANT_SALARY_DESCRIPTION, "SALARY"},
            {"ADMIN_SALARY", FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_ADMIN_SALARY_DISPLAY,
                    FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_ADMIN_SALARY_DESCRIPTION, "SALARY"},
            {"OFFICE_RENT", FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_OFFICE_RENT_DISPLAY,
                    FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_OFFICE_RENT_DESCRIPTION, "RENT"},
            {"MAINTENANCE_FEE", FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_MAINTENANCE_FEE_DISPLAY,
                    FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_MAINTENANCE_FEE_DESCRIPTION, "UTILITY"},
            {"ELECTRICITY", FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_ELECTRICITY_DISPLAY,
                    FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_ELECTRICITY_DESCRIPTION, "UTILITY"},
            {"WATER", FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_WATER_DISPLAY,
                    FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_WATER_DESCRIPTION, "UTILITY"},
            {"STATIONERY", FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_STATIONERY_DISPLAY,
                    FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_STATIONERY_DESCRIPTION, "OFFICE_SUPPLIES"},
            {"PRINTING", FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_PRINTING_DISPLAY,
                    FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_PRINTING_DESCRIPTION, "OFFICE_SUPPLIES"},
            {"INCOME_TAX", FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_INCOME_TAX_DISPLAY,
                    FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_INCOME_TAX_DESCRIPTION, "TAX"},
            {"VAT", FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_VAT_DISPLAY,
                    FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_VAT_DESCRIPTION, "TAX"},
            {"CORPORATE_TAX", FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_CORPORATE_TAX_DISPLAY,
                    FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_CORPORATE_TAX_DESCRIPTION, "TAX"},
            {"ONLINE_ADS", FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_ONLINE_ADS_DISPLAY,
                    FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_ONLINE_ADS_DESCRIPTION, "MARKETING"},
            {"OFFLINE_ADS", FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_OFFLINE_ADS_DISPLAY,
                    FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_OFFLINE_ADS_DESCRIPTION, "MARKETING"},
            {"COMPUTER", FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_COMPUTER_DISPLAY,
                    FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_COMPUTER_DESCRIPTION, "EQUIPMENT"},
            {"FURNITURE", FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_FURNITURE_DISPLAY,
                    FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_FURNITURE_DESCRIPTION, "EQUIPMENT"},
            {"LICENSE", FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_LICENSE_DISPLAY,
                    FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_LICENSE_DESCRIPTION, "SOFTWARE"},
            {"EXTERNAL_CONSULTING", FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_EXTERNAL_CONSULTING_DISPLAY,
                    FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_EXTERNAL_CONSULTING_DESCRIPTION, "CONSULTING"},
            {"CONSULTATION_REFUND", FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_CONSULTATION_REFUND_DISPLAY,
                    FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_CONSULTATION_REFUND_DESCRIPTION, "CONSULTATION"},
            {"OTHER_EXPENSE", FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_OTHER_EXPENSE_DISPLAY,
                    FinancialCommonCodeSeedStrings.EXPENSE_SUBCATEGORY_OTHER_EXPENSE_DESCRIPTION, "OTHER"}
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
                .codeLabel(FinancialCommonCodeSeedStrings.VAT_APPLICABLE_YES_DISPLAY)
                .codeDescription(FinancialCommonCodeSeedStrings.VAT_APPLICABLE_YES_DESCRIPTION)
                .sortOrder(1)
                .isActive(true)
                .build());

        commonCodeRepository.save(CommonCode.builder()
                .codeGroup(codeGroup)
                .codeValue("NOT_APPLICABLE")
                .codeLabel(FinancialCommonCodeSeedStrings.VAT_APPLICABLE_NO_DISPLAY)
                .codeDescription(FinancialCommonCodeSeedStrings.VAT_APPLICABLE_NO_DESCRIPTION)
                .sortOrder(2)
                .isActive(true)
                .build());

        log.info("부가세 적용 여부 코드 초기화 완료");
    }
}
