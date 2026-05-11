package com.coresolution.consultation.service.impl;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.coresolution.consultation.constant.salary.SalaryExportConstants;
import com.coresolution.consultation.dto.SalaryExportRequest;
import com.coresolution.consultation.entity.SalaryCalculation;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.SalaryCalculationRepository;
import com.coresolution.consultation.service.SalaryExportService;
import com.coresolution.consultation.service.SalaryManagementService;
import com.coresolution.core.context.TenantContextHolder;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 급여 계산 단건 export. PDF는 Type1(라틴)만 안전 표시, 한글은 Excel/CSV에 반영.
 *
 * @author CoreSolution
 * @since 2026-05-11
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SalaryExportServiceImpl implements SalaryExportService {

    private static final float PDF_MARGIN = 50f;

    private static final float PDF_LINE_HEIGHT = 14f;

    private static final int PDF_MAX_LINES_FIRST_PAGE = 48;

    private final SalaryCalculationRepository salaryCalculationRepository;

    private final SalaryManagementService salaryManagementService;

    @Override
    @Transactional(readOnly = true)
    public Map<String, String> exportPdf(SalaryExportRequest request) {
        SalaryCalculation calc = loadCalculationForCurrentTenant(request.getCalculationId());
        Map<String, Object> taxDetails = resolveTaxDetails(request, calc.getId());
        byte[] bytes = buildPdf(calc, taxDetails, request);
        String filename = buildFilename(calc, "pdf");
        return Map.of(
                SalaryExportConstants.RESPONSE_KEY_DOWNLOAD_URL,
                SalaryExportConstants.DATA_URI_PREFIX_PDF + Base64.getEncoder().encodeToString(bytes),
                SalaryExportConstants.RESPONSE_KEY_FILENAME,
                filename);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, String> exportExcel(SalaryExportRequest request) {
        SalaryCalculation calc = loadCalculationForCurrentTenant(request.getCalculationId());
        Map<String, Object> taxDetails = resolveTaxDetails(request, calc.getId());
        byte[] bytes = buildXlsx(calc, taxDetails, request);
        String filename = buildFilename(calc, "xlsx");
        return Map.of(
                SalaryExportConstants.RESPONSE_KEY_DOWNLOAD_URL,
                SalaryExportConstants.DATA_URI_PREFIX_XLSX + Base64.getEncoder().encodeToString(bytes),
                SalaryExportConstants.RESPONSE_KEY_FILENAME,
                filename);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, String> exportCsv(SalaryExportRequest request) {
        SalaryCalculation calc = loadCalculationForCurrentTenant(request.getCalculationId());
        Map<String, Object> taxDetails = resolveTaxDetails(request, calc.getId());
        byte[] bytes = buildCsv(calc, taxDetails, request);
        String filename = buildFilename(calc, "csv");
        return Map.of(
                SalaryExportConstants.RESPONSE_KEY_DOWNLOAD_URL,
                SalaryExportConstants.DATA_URI_PREFIX_CSV + Base64.getEncoder().encodeToString(bytes),
                SalaryExportConstants.RESPONSE_KEY_FILENAME,
                filename);
    }

    private Map<String, Object> resolveTaxDetails(SalaryExportRequest request, Long calculationId) {
        if (Boolean.FALSE.equals(request.getIncludeTaxDetails())) {
            return Map.of();
        }
        return salaryManagementService.getTaxDetails(calculationId);
    }

    private SalaryCalculation loadCalculationForCurrentTenant(Long calculationId) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        SalaryCalculation calc = salaryCalculationRepository.findByIdWithConsultant(calculationId)
                .orElseThrow(() -> new EntityNotFoundException("급여 계산 정보를 찾을 수 없습니다: " + calculationId));
        if (calc.getTenantId() == null || !calc.getTenantId().equals(tenantId)) {
            throw new EntityNotFoundException("급여 계산 정보를 찾을 수 없습니다: " + calculationId);
        }
        return calc;
    }

    private String buildFilename(SalaryCalculation calc, String ext) {
        String consultant = calc.getConsultant() != null ? Objects.toString(calc.getConsultant().getName(), "") : "";
        consultant = consultant.replace('\\', '_').replace('/', '_').replace(':', '_')
                .replace('*', '_').replace('?', '_').replace('"', '_')
                .replace('<', '_').replace('>', '_').replace('|', '_');
        if (consultant.isBlank()) {
            consultant = "consultant";
        }
        String periodPart = calc.getCalculationPeriodStart() != null
                ? calc.getCalculationPeriodStart().toString()
                : "period";
        return SalaryExportConstants.FILENAME_PREFIX + calc.getId() + "_" + periodPart + "_" + consultant + "." + ext;
    }

    private byte[] buildPdf(SalaryCalculation calc, Map<String, Object> taxDetails, SalaryExportRequest request) {
        List<String> lines = buildExportTextLines(calc, taxDetails, request, true);
        try (PDDocument document = new PDDocument()) {
            PDType1Font font = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);
            float y = page.getMediaBox().getHeight() - PDF_MARGIN;
            int lineIndex = 0;
            try (PDPageContentStream stream = new PDPageContentStream(document, page)) {
                stream.beginText();
                stream.setFont(font, 11);
                stream.newLineAtOffset(PDF_MARGIN, y);
                for (String line : lines) {
                    if (lineIndex >= PDF_MAX_LINES_FIRST_PAGE) {
                        break;
                    }
                    String safe = sanitizeForWinAnsiPdf(line);
                    stream.showText(safe);
                    stream.newLineAtOffset(0, -PDF_LINE_HEIGHT);
                    lineIndex++;
                }
                stream.endText();
            }
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        } catch (IOException e) {
            log.error("급여 PDF 생성 실패 calculationId={}", calc.getId(), e);
            throw new IllegalStateException("급여 PDF 생성에 실패했습니다.", e);
        }
    }

    /**
     * PDF Type1 / WinAnsi 안전 구간(대략 라틴·숫자)만 허용.
     */
    private static String sanitizeForWinAnsiPdf(String s) {
        if (s == null) {
            return "";
        }
        StringBuilder b = new StringBuilder(Math.min(s.length(), 200));
        for (int i = 0; i < s.length() && b.length() < 200; i++) {
            char c = s.charAt(i);
            if (c >= 32 && c <= 126) {
                b.append(c);
            } else {
                b.append('?');
            }
        }
        return b.toString();
    }

    private List<String> buildExportTextLines(
            SalaryCalculation calc,
            Map<String, Object> taxDetails,
            SalaryExportRequest request,
            boolean asciiLabels) {
        List<String> lines = new ArrayList<>();
        if (asciiLabels) {
            lines.add("MindGarden Salary export (PDF: Latin labels only; use Excel/CSV for Korean)");
        }
        lines.add("calculationId=" + calc.getId());
        if (calc.getCalculationPeriodStart() != null && calc.getCalculationPeriodEnd() != null) {
            lines.add("period=" + calc.getCalculationPeriodStart() + ".." + calc.getCalculationPeriodEnd());
        }
        lines.add("status=" + (calc.getStatus() != null ? calc.getStatus().name() : ""));
        if (Boolean.FALSE.equals(request.getIncludeCalculationDetails())) {
            lines.add("(calculation detail rows omitted by request)");
            return lines;
        }
        lines.add("baseSalary=" + formatAmount(calc.getBaseSalary()));
        lines.add("grossSalary=" + formatAmount(calc.getGrossSalary()));
        lines.add("deductions=" + formatAmount(calc.getDeductions()));
        lines.add("netSalary=" + formatAmount(calc.getNetSalary()));
        lines.add("totalSalary=" + formatAmount(calc.getTotalSalary()));
        lines.add("hourlyEarnings=" + formatAmount(calc.getHourlyEarnings()));
        lines.add("commissionEarnings=" + formatAmount(calc.getCommissionEarnings()));
        if (taxDetails != null && !taxDetails.isEmpty()) {
            lines.add("--- tax summary ---");
            lines.add("grossSalary(tax)=" + formatAmount(asBigDecimal(taxDetails.get("grossSalary"))));
            lines.add("netSalary(tax)=" + formatAmount(asBigDecimal(taxDetails.get("netSalary"))));
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> details =
                    (List<Map<String, Object>>) taxDetails.get(SalaryExportConstants.TAX_PAYLOAD_KEY_TAX_DETAILS);
            if (details != null) {
                for (Map<String, Object> row : details) {
                    lines.add("tax " + row.get(SalaryExportConstants.TAX_ROW_KEY_TAX_TYPE) + "="
                            + formatAmount(asBigDecimal(row.get(SalaryExportConstants.TAX_ROW_KEY_TAX_AMOUNT))));
                }
            }
        }
        return lines;
    }

    private byte[] buildXlsx(SalaryCalculation calc, Map<String, Object> taxDetails, SalaryExportRequest request) {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("salary");
            int r = 0;
            r = appendCalculationRows(sheet, r, calc, request);
            r++;
            if (taxDetails != null && !taxDetails.isEmpty()) {
                Row header = sheet.createRow(r++);
                header.createCell(0).setCellValue("세금 항목");
                header.createCell(1).setCellValue("금액");
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> details =
                        (List<Map<String, Object>>) taxDetails.get(SalaryExportConstants.TAX_PAYLOAD_KEY_TAX_DETAILS);
                if (details != null) {
                    for (Map<String, Object> row : details) {
                        Row excelRow = sheet.createRow(r++);
                        excelRow.createCell(0).setCellValue(Objects.toString(row.get(SalaryExportConstants.TAX_ROW_KEY_TAX_TYPE), ""));
                        setAmountCell(excelRow.createCell(1), asBigDecimal(row.get(SalaryExportConstants.TAX_ROW_KEY_TAX_AMOUNT)));
                    }
                }
            }
            for (int i = 0; i < 6; i++) {
                sheet.autoSizeColumn(i);
            }
            workbook.write(baos);
            return baos.toByteArray();
        } catch (IOException e) {
            log.error("급여 Excel 생성 실패 calculationId={}", calc.getId(), e);
            throw new IllegalStateException("급여 Excel 생성에 실패했습니다.", e);
        }
    }

    private int appendCalculationRows(Sheet sheet, int startRow, SalaryCalculation calc, SalaryExportRequest request) {
        int r = startRow;
        Row title = sheet.createRow(r++);
        title.createCell(0).setCellValue("급여 계산서");
        if (Boolean.FALSE.equals(request.getIncludeCalculationDetails())) {
            Row row = sheet.createRow(r++);
            row.createCell(0).setCellValue("상세 생략(요청)");
            return r;
        }
        r = putPair(sheet, r, "계산 ID", String.valueOf(calc.getId()));
        String consultantName = calc.getConsultant() != null ? calc.getConsultant().getName() : "";
        r = putPair(sheet, r, "상담사", consultantName);
        if (calc.getCalculationPeriodStart() != null) {
            r = putPair(sheet, r, "기간 시작", calc.getCalculationPeriodStart().toString());
        }
        if (calc.getCalculationPeriodEnd() != null) {
            r = putPair(sheet, r, "기간 종료", calc.getCalculationPeriodEnd().toString());
        }
        r = putPair(sheet, r, "상태", calc.getStatus() != null ? calc.getStatus().name() : "");
        r = putAmountRow(sheet, r, "기본급", calc.getBaseSalary());
        r = putAmountRow(sheet, r, "총 급여(총액)", calc.getTotalSalary());
        r = putAmountRow(sheet, r, "총 지급(과세 전)", calc.getGrossSalary());
        r = putAmountRow(sheet, r, "공제", calc.getDeductions());
        r = putAmountRow(sheet, r, "실수령", calc.getNetSalary());
        r = putAmountRow(sheet, r, "시급 소득", calc.getHourlyEarnings());
        r = putAmountRow(sheet, r, "커미션", calc.getCommissionEarnings());
        return r;
    }

    private static int putPair(Sheet sheet, int r, String label, String value) {
        Row row = sheet.createRow(r);
        row.createCell(0).setCellValue(label);
        row.createCell(1).setCellValue(value != null ? value : "");
        return r + 1;
    }

    private static int putAmountRow(Sheet sheet, int r, String label, BigDecimal amount) {
        Row row = sheet.createRow(r);
        row.createCell(0).setCellValue(label);
        setAmountCell(row.createCell(1), amount);
        return r + 1;
    }

    private static void setAmountCell(Cell cell, BigDecimal amount) {
        if (amount != null) {
            cell.setCellValue(amount.stripTrailingZeros().toPlainString());
        } else {
            cell.setCellValue("");
        }
    }

    private byte[] buildCsv(SalaryCalculation calc, Map<String, Object> taxDetails, SalaryExportRequest request) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            baos.write(0xEF);
            baos.write(0xBB);
            baos.write(0xBF);
            try (Writer w = new OutputStreamWriter(baos, StandardCharsets.UTF_8)) {
                w.append("항목,값\n");
                w.append("계산 ID,").append(csvEscape(String.valueOf(calc.getId()))).append('\n');
                String consultantName = calc.getConsultant() != null ? calc.getConsultant().getName() : "";
                w.append("상담사,").append(csvEscape(consultantName)).append('\n');
                if (calc.getCalculationPeriodStart() != null) {
                    w.append("기간 시작,").append(csvEscape(calc.getCalculationPeriodStart().toString())).append('\n');
                }
                if (calc.getCalculationPeriodEnd() != null) {
                    w.append("기간 종료,").append(csvEscape(calc.getCalculationPeriodEnd().toString())).append('\n');
                }
                w.append("상태,").append(csvEscape(calc.getStatus() != null ? calc.getStatus().name() : "")).append('\n');
                if (Boolean.FALSE.equals(request.getIncludeCalculationDetails())) {
                    // 상세 생략
                } else {
                    w.append("기본급,").append(csvEscape(formatAmount(calc.getBaseSalary()))).append('\n');
                    w.append("총 급여,").append(csvEscape(formatAmount(calc.getTotalSalary()))).append('\n');
                    w.append("총 지급(과세 전),").append(csvEscape(formatAmount(calc.getGrossSalary()))).append('\n');
                    w.append("공제,").append(csvEscape(formatAmount(calc.getDeductions()))).append('\n');
                    w.append("실수령,").append(csvEscape(formatAmount(calc.getNetSalary()))).append('\n');
                }
                if (taxDetails != null && !taxDetails.isEmpty()) {
                    w.append("세금_총지급,").append(csvEscape(formatAmount(asBigDecimal(taxDetails.get("grossSalary")))))
                            .append('\n');
                    w.append("세금_실수령,").append(csvEscape(formatAmount(asBigDecimal(taxDetails.get("netSalary")))))
                            .append('\n');
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> details =
                            (List<Map<String, Object>>) taxDetails.get(SalaryExportConstants.TAX_PAYLOAD_KEY_TAX_DETAILS);
                    if (details != null) {
                        for (Map<String, Object> row : details) {
                            w.append("세금,")
                                    .append(csvEscape(Objects.toString(row.get(SalaryExportConstants.TAX_ROW_KEY_TAX_TYPE), "")))
                                    .append(',')
                                    .append(csvEscape(formatAmount(asBigDecimal(row.get(SalaryExportConstants.TAX_ROW_KEY_TAX_AMOUNT)))))
                                    .append('\n');
                        }
                    }
                }
            }
            return baos.toByteArray();
        } catch (IOException e) {
            log.error("급여 CSV 생성 실패 calculationId={}", calc.getId(), e);
            throw new IllegalStateException("급여 CSV 생성에 실패했습니다.", e);
        }
    }

    private static String csvEscape(String v) {
        if (v == null) {
            return "";
        }
        String s = v.replace("\"", "\"\"");
        if (s.contains(",") || s.contains("\n") || s.contains("\"") || s.contains("\r")) {
            return "\"" + s + "\"";
        }
        return s;
    }

    private static String formatAmount(BigDecimal v) {
        if (v == null) {
            return "";
        }
        return v.stripTrailingZeros().toPlainString();
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
