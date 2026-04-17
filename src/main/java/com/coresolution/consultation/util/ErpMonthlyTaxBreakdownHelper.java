package com.coresolution.consultation.util;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;

/**
 * ERP 월별 세금(부가세·원천·지출 측 세액 필드) 집계.
 * <p>
 * 역산 세율 없이 {@link FinancialTransaction#getTaxAmount()},
 * {@link FinancialTransaction#getWithholdingTaxAmount()} 저장값 합산만 사용한다.
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
                vatTotal = vatTotal.add(nullToZero(t.getTaxAmount()));
                withholdingTotal = withholdingTotal.add(nullToZero(t.getWithholdingTaxAmount()));
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
}
