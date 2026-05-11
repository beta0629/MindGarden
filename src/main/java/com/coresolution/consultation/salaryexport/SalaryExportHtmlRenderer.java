package com.coresolution.consultation.salaryexport;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import com.coresolution.consultation.constant.salary.SalaryExportConstants;
import com.coresolution.consultation.constant.salary.SalaryTaxTypeDisplayLabels;
import com.coresolution.consultation.dto.SalaryExportRequest;
import com.coresolution.consultation.entity.SalaryCalculation;

/**
 * 급여 export용 UTF-8 XHTML 문자열 생성 (Flying Saucer 입력).
 *
 * @author CoreSolution
 * @since 2026-05-11
 */
public final class SalaryExportHtmlRenderer {

    private SalaryExportHtmlRenderer() {
    }

    /**
     * 급여·세금 요약 XHTML을 생성한다.
     *
     * @param calc       급여 계산
     * @param taxDetails 세금 상세(비어 있으면 생략)
     * @param request    포함 옵션
     * @return XHTML 문자열
     */
    public static String buildSalaryExportXhtml(
            SalaryCalculation calc,
            Map<String, Object> taxDetails,
            SalaryExportRequest request) {
        return buildSalaryExportXhtml(calc, taxDetails, request, null);
    }

    /**
     * 급여·세금 요약 XHTML을 생성한다. {@code consultantDisplayName}이 비어 있으면 요청·엔티티 기본 규칙으로 보완한다.
     *
     * @param calc                    급여 계산
     * @param taxDetails              세금 상세(비어 있으면 생략)
     * @param request                 포함 옵션
     * @param consultantDisplayName   표시용 상담사명(서비스에서 복호화·요청 우선 적용 후 전달, null 가능)
     * @return XHTML 문자열
     */
    public static String buildSalaryExportXhtml(
            SalaryCalculation calc,
            Map<String, Object> taxDetails,
            SalaryExportRequest request,
            String consultantDisplayName) {
        String consultant = resolveConsultantNameForDisplay(calc, request, consultantDisplayName);
        String period = resolvePeriodLabel(calc, request);
        StringBuilder body = new StringBuilder(4096);
        body.append("<div class=\"header\"><h1>급여 계산서</h1><p class=\"muted\">MindGarden</p></div>");
        body.append("<table class=\"kv\"><tbody>");
        appendRow(body, "계산 ID", String.valueOf(calc.getId()));
        appendRow(body, "상담사", consultant);
        appendRow(body, "기간", period);
        appendRow(body, "상태", calc.getStatus() != null ? calc.getStatus().name() : "");
        if (Boolean.FALSE.equals(request.getIncludeCalculationDetails())) {
            appendRow(body, "계산 상세", "요청에 따라 생략되었습니다.");
        } else {
            for (SalaryCalculationStatementRows.LabelAmount row : SalaryCalculationStatementRows.buildPretaxComponentRows(calc)) {
                appendRow(body, row.label(), formatAmount(row.amount()));
            }
            BigDecimal bonus = calc.getBonusEarnings() != null ? calc.getBonusEarnings() : BigDecimal.ZERO;
            if (bonus.compareTo(BigDecimal.ZERO) > 0) {
                appendRow(body, SalaryCalculationStatementRows.LABEL_SPECIAL_SUPPORT, "+" + formatAmount(bonus));
            }
            appendRow(body, SalaryCalculationStatementRows.LABEL_GROSS_PRETAX,
                    formatAmount(SalaryCalculationStatementRows.resolveGrossPreTaxDisplay(calc)));
            BigDecimal deductions = calc.getDeductions() != null ? calc.getDeductions() : BigDecimal.ZERO;
            if (deductions.compareTo(BigDecimal.ZERO) > 0) {
                appendRow(body, SalaryCalculationStatementRows.LABEL_TAX_DEDUCTIONS, "-" + formatAmount(deductions));
            }
            BigDecimal netDisplay = calc.getNetSalary() != null
                    ? calc.getNetSalary()
                    : nz(calc.getTotalSalary()).subtract(deductions);
            appendRow(body, SalaryCalculationStatementRows.LABEL_NET, formatAmount(netDisplay));
            int completed = calc.getCompletedConsultations() != null ? calc.getCompletedConsultations() : 0;
            appendRow(body, SalaryCalculationStatementRows.LABEL_CONSULTATION_COUNT, completed + "건");
        }
        body.append("</tbody></table>");

        if (Boolean.FALSE.equals(request.getIncludeTaxDetails()) || taxDetails == null || taxDetails.isEmpty()) {
            return wrapDocument(body.toString());
        }

        body.append("<h2 class=\"section\">세금 요약</h2>");
        body.append("<table class=\"kv\"><tbody>");
        appendRow(body, "세금 기준 총지급", formatAmount(asBigDecimal(taxDetails.get("grossSalary"))));
        appendRow(body, "세금 기준 실수령", formatAmount(asBigDecimal(taxDetails.get("netSalary"))));
        body.append("</tbody></table>");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> details =
                (List<Map<String, Object>>) taxDetails.get(SalaryExportConstants.TAX_PAYLOAD_KEY_TAX_DETAILS);
        if (details != null && !details.isEmpty()) {
            body.append("<h2 class=\"section\">세금 항목</h2>");
            body.append("<table class=\"grid\"><thead><tr><th>세목</th><th class=\"num\">금액</th></tr></thead><tbody>");
            for (Map<String, Object> row : details) {
                String taxTypeCode = Objects.toString(row.get(SalaryExportConstants.TAX_ROW_KEY_TAX_TYPE), "");
                String taxTypeLabel = SalaryTaxTypeDisplayLabels.labelForTaxType(taxTypeCode);
                body.append("<tr><td>")
                        .append(xmlEscape(taxTypeLabel))
                        .append("</td><td class=\"num\">")
                        .append(xmlEscape(formatAmount(asBigDecimal(row.get(SalaryExportConstants.TAX_ROW_KEY_TAX_AMOUNT)))))
                        .append("</td></tr>");
            }
            body.append("</tbody></table>");
        }

        return wrapDocument(body.toString());
    }

    /**
     * 서비스에서 전달한 표시명이 있으면 우선하고, 없으면 요청 평문·엔티티 원문 순으로 보완한다(복호화는 서비스 책임).
     */
    private static String resolveConsultantNameForDisplay(
            SalaryCalculation calc,
            SalaryExportRequest request,
            String consultantDisplayName) {
        if (consultantDisplayName != null) {
            return consultantDisplayName.isBlank() ? "" : consultantDisplayName.trim();
        }
        if (request.getConsultantName() != null && !request.getConsultantName().isBlank()) {
            return request.getConsultantName().trim();
        }
        if (calc.getConsultant() != null && calc.getConsultant().getName() != null) {
            return calc.getConsultant().getName();
        }
        return "";
    }

    private static String resolvePeriodLabel(SalaryCalculation calc, SalaryExportRequest request) {
        if (request.getPeriod() != null && !request.getPeriod().isBlank()) {
            return request.getPeriod().trim();
        }
        if (calc.getCalculationPeriodStart() != null && calc.getCalculationPeriodEnd() != null) {
            return calc.getCalculationPeriodStart() + " ~ " + calc.getCalculationPeriodEnd();
        }
        if (calc.getCalculationPeriodStart() != null) {
            return calc.getCalculationPeriodStart().toString();
        }
        return "";
    }

    private static void appendRow(StringBuilder body, String label, String value) {
        body.append("<tr><th>")
                .append(xmlEscape(label))
                .append("</th><td>")
                .append(xmlEscape(value != null ? value : ""))
                .append("</td></tr>");
    }

    private static String wrapDocument(String innerBody) {
        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
                + "<html xmlns=\"http://www.w3.org/1999/xhtml\">"
                + "<head><meta http-equiv=\"Content-Type\" content=\"application/xhtml+xml; charset=UTF-8\"/>"
                + "<style type=\"text/css\"><![CDATA["
                + "body{font-family:SalaryExportKorean,sans-serif;font-size:11pt;color:#111;margin:24pt;}"
                + "h1{font-size:16pt;margin:0 0 8pt 0;font-family:SalaryExportKorean,sans-serif;}"
                + "h2.section{font-size:13pt;margin:16pt 0 8pt 0;border-bottom:1pt solid #ccc;padding-bottom:4pt;"
                + "font-family:SalaryExportKorean,sans-serif;}"
                + ".header,.header h1,.header p{font-family:SalaryExportKorean,sans-serif;}"
                + ".muted{color:#555;font-size:9pt;}"
                + "table.kv{width:100%;border-collapse:collapse;margin-bottom:12pt;}"
                + "table.kv th,table.kv td{border:1pt solid #ddd;padding:6pt;text-align:left;vertical-align:top;"
                + "font-family:SalaryExportKorean,sans-serif;}"
                + "table.kv th{width:32%;background:#f7f7f7;font-weight:600;}"
                + "table.grid{width:100%;border-collapse:collapse;}"
                + "table.grid th,table.grid td{border:1pt solid #ddd;padding:6pt;font-family:SalaryExportKorean,sans-serif;}"
                + "table.grid thead th{background:#f0f0f0;}"
                + ".num{text-align:right;font-variant-numeric:tabular-nums;}"
                + "]]></style></head><body>"
                + innerBody
                + "</body></html>";
    }

    private static String xmlEscape(String s) {
        if (s == null || s.isEmpty()) {
            return "";
        }
        StringBuilder b = new StringBuilder(s.length() + 16);
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '&' -> b.append("&amp;");
                case '<' -> b.append("&lt;");
                case '>' -> b.append("&gt;");
                case '"' -> b.append("&quot;");
                default -> b.append(c);
            }
        }
        return b.toString();
    }

    private static String formatAmount(BigDecimal v) {
        if (v == null) {
            return "";
        }
        return v.stripTrailingZeros().toPlainString();
    }

    private static BigDecimal nz(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }

    private static BigDecimal asBigDecimal(Object o) {
        if (o == null) {
            return null;
        }
        if (o instanceof BigDecimal bd) {
            return bd;
        }
        if (o instanceof Number n) {
            return BigDecimal.valueOf(n.doubleValue());
        }
        try {
            return new BigDecimal(o.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
