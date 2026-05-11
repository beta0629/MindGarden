package com.coresolution.consultation.constant.salary;

import java.util.Map;

/**
 * 급여 세금 행 {@code taxType} 코드의 화면 표시 라벨.
 * 프론트 {@code frontend/src/constants/salaryConstants.js} 의 {@code SALARY_TAX_ROW_TYPE_LABELS} 와 1:1 동일해야 한다.
 *
 * @author CoreSolution
 * @since 2026-05-11
 */
public final class SalaryTaxTypeDisplayLabels {

    private static final Map<String, String> BY_CODE = Map.ofEntries(
            Map.entry("WITHHOLDING_TAX", "원천징수(국세 3%, 지방세 0.3%, 합계 3.3%)"),
            Map.entry("LOCAL_INCOME_TAX", "지방소득세(정규직 등)"),
            Map.entry("VAT", "부가가치세"),
            Map.entry("INCOME_TAX", "소득세"),
            Map.entry("FOUR_INSURANCE", "4대보험"),
            Map.entry("ADDITIONAL_TAX", "추가세금"));

    private SalaryTaxTypeDisplayLabels() {
    }

    /**
     * 세금 유형 코드에 대한 한글 라벨을 반환한다. 매핑이 없으면 {@code 기타(코드)} 형식으로 반환한다.
     *
     * @param code API/DB 세금 유형 코드 (null·공백이면 빈 문자열)
     * @return 표시용 라벨(평문, XML 이스케이프는 호출부에서 수행)
     */
    public static String labelForTaxType(String code) {
        if (code == null || code.isBlank()) {
            return "";
        }
        String trimmed = code.trim();
        String label = BY_CODE.get(trimmed);
        if (label != null) {
            return label;
        }
        return "기타(" + trimmed + ")";
    }
}
