package com.coresolution.consultation.util;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;

/**
 * ERP 월별 세금(부가세·원천·지출 측 세액 필드) 집계.
 * <p>
 * 역산 세율 없이 {@link FinancialTransaction#getTaxAmount()},
 * {@link FinancialTransaction#getWithholdingTaxAmount()} 저장값 합산만 사용한다.
 * INCOME 건은 신규 경로(D2: 부가세는 {@code tax_amount}, 원천은 {@code withholding_tax_amount})와
 * D8 이전 레거시(원천 예정액이 {@code tax_amount}에만 남은 경우)가 공존하므로,
 * {@code withholding_tax_amount &gt; 0}이면 해당 금액은 원천, 나머지 {@code tax_amount}는 부가세로 보며,
 * 원천 컬럼이 0일 때는 설명/비고에 사업소득·원천징수 문구가 있으면 {@code tax_amount}를 원천으로 재분류한다(휴리스틱).
 * </p>
 *
 * @author MindGarden
 * @since 2026-04-17
 */
public final class ErpMonthlyTaxBreakdownHelper {

    private ErpMonthlyTaxBreakdownHelper() {
    }

    /**
     * 단일 기간(예: 한 달) 거래 목록에 대한 세금 필드 합계.
     *
     * @param transactions 해당 기간·테넌트로 이미 필터된 비삭제 거래 목록
     * @return vatTotal, withholdingTotal, expenseVatTotal (BigDecimal, null 아님)
     */
    public static Map<String, Object> buildBreakdown(List<FinancialTransaction> transactions) {
        Objects.requireNonNull(transactions, "transactions");
        BigDecimal vatTotal = BigDecimal.ZERO;
        BigDecimal withholdingTotal = BigDecimal.ZERO;
        BigDecimal expenseVatTotal = BigDecimal.ZERO;
        for (FinancialTransaction t : transactions) {
            if (t == null || t.getTransactionType() == null) {
                continue;
            }
            if (t.getTransactionType() == FinancialTransaction.TransactionType.INCOME) {
                BigDecimal w = nullToZero(t.getWithholdingTaxAmount());
                BigDecimal taxAmt = nullToZero(t.getTaxAmount());
                if (w.compareTo(BigDecimal.ZERO) > 0) {
                    withholdingTotal = withholdingTotal.add(w);
                    vatTotal = vatTotal.add(taxAmt);
                } else if (legacyWithholdingAmountProbablyInTaxField(t)) {
                    withholdingTotal = withholdingTotal.add(taxAmt);
                } else {
                    vatTotal = vatTotal.add(taxAmt);
                }
            } else if (t.getTransactionType() == FinancialTransaction.TransactionType.EXPENSE) {
                expenseVatTotal = expenseVatTotal.add(nullToZero(t.getTaxAmount()));
            }
        }
        Map<String, Object> map = new HashMap<>();
        map.put("vatTotal", vatTotal);
        map.put("withholdingTotal", withholdingTotal);
        map.put("expenseVatTotal", expenseVatTotal);
        return map;
    }

    /**
     * 연도 내 1~12월 각각에 대해 {@link #buildBreakdown(List)}를 적용한 목록.
     *
     * @param year       연도 (4자리)
     * @param inYearTxs  해당 연 1/1~12/31, 테넌트·비삭제로 필터된 전체 거래
     * @return month 1~12, 각 월 breakdown 맵
     */
    public static List<Map<String, Object>> buildMonthlySeriesForYear(int year, List<FinancialTransaction> inYearTxs) {
        Objects.requireNonNull(inYearTxs, "inYearTxs");
        List<Map<String, Object>> months = new ArrayList<>(12);
        for (int m = 1; m <= 12; m++) {
            LocalDate start = LocalDate.of(year, m, 1);
            LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
            List<FinancialTransaction> monthTx = new ArrayList<>();
            for (FinancialTransaction t : inYearTxs) {
                if (t == null || t.getTransactionDate() == null) {
                    continue;
                }
                LocalDate d = t.getTransactionDate();
                if (!d.isBefore(start) && !d.isAfter(end)) {
                    monthTx.add(t);
                }
            }
            Map<String, Object> row = new HashMap<>();
            row.put("month", m);
            row.putAll(buildBreakdown(monthTx));
            months.add(row);
        }
        return months;
    }

    private static BigDecimal nullToZero(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }

    /**
     * D8 배치 전 일부 거래는 원천 예정액이 {@code tax_amount}에만 있고 {@code withholding_tax_amount}는 비어 있다.
     * 월별 요약에서 부가세 열로 합산되지 않도록 설명·비고 키워드로 보정한다.
     */
    private static boolean legacyWithholdingAmountProbablyInTaxField(FinancialTransaction t) {
        String d = t.getDescription();
        String r = t.getRemarks();
        String combined = (d != null ? d : "") + " " + (r != null ? r : "");
        String lower = combined.toLowerCase(Locale.ROOT);
        return lower.contains("원천징수") || lower.contains("사업소득");
    }
}
