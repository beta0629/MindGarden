package com.coresolution.consultation.constant;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * FinancialTransactionConstants remap/SSOT 단위 테스트
 *
 * @author CoreSolution
 * @since 2026-08-29
 */
class FinancialTransactionConstantsTest {

    @Test
    @DisplayName("CONSULTATION → 상담료 (type 무관)")
    void remapConsultationLegacyToKoreanSsot() {
        assertThat(FinancialTransactionConstants.remapCategoryToSsot("CONSULTATION", "INCOME"))
                .isEqualTo(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE);
        assertThat(FinancialTransactionConstants.remapCategoryToSsot("CONSULTATION", "EXPENSE"))
                .isEqualTo(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE);
        assertThat(FinancialTransactionConstants.remapCategoryToSsot("CONSULTATION", null))
                .isEqualTo(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE);
    }

    @Test
    @DisplayName("EXPENSE 한글/레거시 → EN SSOT")
    void remapExpenseAliases() {
        assertThat(FinancialTransactionConstants.remapCategoryToSsot("급여", "EXPENSE"))
                .isEqualTo(FinancialTransactionConstants.CATEGORY_SALARY);
        assertThat(FinancialTransactionConstants.remapCategoryToSsot("임대료", "EXPENSE"))
                .isEqualTo(FinancialTransactionConstants.CATEGORY_RENT);
        assertThat(FinancialTransactionConstants.remapCategoryToSsot("MANAGEMENT_FEE", "EXPENSE"))
                .isEqualTo(FinancialTransactionConstants.CATEGORY_UTILITY);
        assertThat(FinancialTransactionConstants.remapCategoryToSsot("관리비", "EXPENSE"))
                .isEqualTo(FinancialTransactionConstants.CATEGORY_UTILITY);
        assertThat(FinancialTransactionConstants.remapCategoryToSsot("세금", "EXPENSE"))
                .isEqualTo(FinancialTransactionConstants.CATEGORY_TAX);
        assertThat(FinancialTransactionConstants.remapCategoryToSsot("식대", "EXPENSE"))
                .isEqualTo(FinancialTransactionConstants.CATEGORY_MEAL);
        assertThat(FinancialTransactionConstants.remapCategoryToSsot("기타잡비", "EXPENSE"))
                .isEqualTo(FinancialTransactionConstants.CATEGORY_OTHER);
        assertThat(FinancialTransactionConstants.remapCategoryToSsot("기타", "EXPENSE"))
                .isEqualTo(FinancialTransactionConstants.CATEGORY_OTHER);
    }

    @Test
    @DisplayName("INCOME 기타/기타수입 → OTHER")
    void remapIncomeOtherAliases() {
        assertThat(FinancialTransactionConstants.remapCategoryToSsot("기타", "INCOME"))
                .isEqualTo(FinancialTransactionConstants.CATEGORY_OTHER);
        assertThat(FinancialTransactionConstants.remapCategoryToSsot("기타수입", "INCOME"))
                .isEqualTo(FinancialTransactionConstants.CATEGORY_OTHER);
    }

    @Test
    @DisplayName("INCOME 결제수단-as-category → 상담료")
    void remapPaymentMethodAsIncomeCategoryToConsultationFee() {
        assertThat(FinancialTransactionConstants.remapCategoryToSsot("카드결제", "INCOME"))
                .isEqualTo(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE);
        assertThat(FinancialTransactionConstants.remapCategoryToSsot("현금결제", "INCOME"))
                .isEqualTo(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE);
        assertThat(FinancialTransactionConstants.remapCategoryToSsot("계좌이체", "INCOME"))
                .isEqualTo(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE);
        assertThat(FinancialTransactionConstants.remapCategoryToSsot("가상계좌", "INCOME"))
                .isEqualTo(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE);
        assertThat(FinancialTransactionConstants.remapCategoryToSsot("기타결제", "INCOME"))
                .isEqualTo(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE);
        assertThat(FinancialTransactionConstants.remapCategoryToSsot("PAYMENT", "INCOME"))
                .isEqualTo(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE);
        assertThat(FinancialTransactionConstants.remapCategoryToSsot("결제", "INCOME"))
                .isEqualTo(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE);
    }

    @Test
    @DisplayName("PACKAGE·이미 SSOT·null 은 변경하지 않음 (결제수단은 INCOME 에서만 remap)")
    void remapLeavesUnconfirmedCategoriesUntouched() {
        assertThat(FinancialTransactionConstants.remapCategoryToSsot("PACKAGE", "INCOME"))
                .isEqualTo("PACKAGE");
        assertThat(FinancialTransactionConstants.remapCategoryToSsot("SALARY", "EXPENSE"))
                .isEqualTo("SALARY");
        assertThat(FinancialTransactionConstants.remapCategoryToSsot("상담료", "INCOME"))
                .isEqualTo("상담료");
        // 결제수단 문자열은 EXPENSE 에서는 그대로 (INCOME 전용 remap)
        assertThat(FinancialTransactionConstants.remapCategoryToSsot("카드결제", "EXPENSE"))
                .isEqualTo("카드결제");
        assertThat(FinancialTransactionConstants.remapCategoryToSsot(null, "INCOME")).isNull();
    }

    @Test
    @DisplayName("isConsultationCategory · matchesConsultationFilter 하위호환")
    void consultationFilterCompat() {
        assertThat(FinancialTransactionConstants.isConsultationCategory("상담료")).isTrue();
        assertThat(FinancialTransactionConstants.isConsultationCategory("CONSULTATION")).isTrue();
        assertThat(FinancialTransactionConstants.matchesConsultationFilter("상담료", "CONSULTATION")).isTrue();
        assertThat(FinancialTransactionConstants.matchesConsultationFilter("CONSULTATION", "상담료")).isTrue();
    }
}
