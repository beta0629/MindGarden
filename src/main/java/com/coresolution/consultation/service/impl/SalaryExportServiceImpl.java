package com.coresolution.consultation.service.impl;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.coresolution.consultation.constant.salary.SalaryExportConstants;
import com.coresolution.consultation.dto.EmailResponse;
import com.coresolution.consultation.dto.SalaryExportRequest;
import com.coresolution.consultation.entity.SalaryCalculation;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.SalaryCalculationRepository;
import com.coresolution.consultation.salaryexport.SalaryExportFlyingSaucerPdfRenderer;
import com.coresolution.consultation.salaryexport.SalaryExportHtmlRenderer;
import com.coresolution.consultation.service.EmailService;
import com.coresolution.consultation.service.SalaryExportService;
import com.coresolution.consultation.service.SalaryManagementService;
import com.coresolution.core.context.TenantContextHolder;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 급여 계산 단건 export. PDF는 UTF-8 XHTML + Flying Saucer(OpenPDF) + classpath 한글 폰트.
 *
 * @author CoreSolution
 * @since 2026-05-11
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SalaryExportServiceImpl implements SalaryExportService {

    private final SalaryCalculationRepository salaryCalculationRepository;

    private final SalaryManagementService salaryManagementService;

    private final EmailService emailService;

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> exportPdf(SalaryExportRequest request) {
        SalaryCalculation calc = loadCalculationForCurrentTenant(request.getCalculationId());
        Map<String, Object> taxDetails = resolveTaxDetails(request, calc.getId());
        String xhtml = SalaryExportHtmlRenderer.buildSalaryExportXhtml(calc, taxDetails, request);
        byte[] bytes = SalaryExportFlyingSaucerPdfRenderer.renderToPdfBytes(xhtml);
        String filename = buildFilename(calc, "pdf");

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put(
                SalaryExportConstants.RESPONSE_KEY_DOWNLOAD_URL,
                SalaryExportConstants.DATA_URI_PREFIX_PDF + Base64.getEncoder().encodeToString(bytes));
        payload.put(SalaryExportConstants.RESPONSE_KEY_FILENAME, filename);

        if (StringUtils.hasText(request.getEmailAddress())) {
            Map<String, Object> salaryData = buildSalaryDataMapForEmail(calc);
            String period = resolvePeriodForEmail(calc, request);
            String consultantName = resolveConsultantNameForEmail(calc, request);
            EmailResponse emailResponse = emailService.sendSalaryCalculationEmailWithResponse(
                    request.getEmailAddress().trim(),
                    consultantName,
                    period,
                    salaryData,
                    bytes,
                    filename);
            payload.put(SalaryExportConstants.RESPONSE_KEY_EMAIL_SENT, emailResponse.isSuccess());
            if (!emailResponse.isSuccess()) {
                String msg = StringUtils.hasText(emailResponse.getErrorMessage())
                        ? emailResponse.getErrorMessage()
                        : emailResponse.getMessage();
                payload.put(SalaryExportConstants.RESPONSE_KEY_EMAIL_MESSAGE, msg != null ? msg : "이메일 발송에 실패했습니다.");
            }
        }

        return payload;
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

    private Map<String, Object> buildSalaryDataMapForEmail(SalaryCalculation calc) {
        Map<String, Object> m = new HashMap<>();
        BigDecimal hourly = calc.getHourlyEarnings() != null ? calc.getHourlyEarnings() : BigDecimal.ZERO;
        BigDecimal commission = calc.getCommissionEarnings() != null ? calc.getCommissionEarnings() : BigDecimal.ZERO;
        m.put("baseSalary", toWholeWonLong(calc.getBaseSalary()));
        m.put("optionSalary", toWholeWonLong(hourly.add(commission)));
        m.put("totalSalary", toWholeWonLong(calc.getTotalSalary()));
        m.put("taxAmount", toWholeWonLong(calc.getDeductions()));
        m.put("netSalary", toWholeWonLong(calc.getNetSalary()));
        int consultations = calc.getCompletedConsultations() != null ? calc.getCompletedConsultations() : 0;
        m.put("consultationCount", consultations);
        return m;
    }

    private static long toWholeWonLong(BigDecimal v) {
        if (v == null) {
            return 0L;
        }
        return v.setScale(0, RoundingMode.HALF_UP).longValue();
    }

    private static String resolvePeriodForEmail(SalaryCalculation calc, SalaryExportRequest request) {
        if (request.getPeriod() != null && !request.getPeriod().isBlank()) {
            return request.getPeriod().trim();
        }
        if (calc.getCalculationPeriodStart() != null && calc.getCalculationPeriodEnd() != null) {
            return calc.getCalculationPeriodStart() + " ~ " + calc.getCalculationPeriodEnd();
        }
        return "";
    }

    private static String resolveConsultantNameForEmail(SalaryCalculation calc, SalaryExportRequest request) {
        if (request.getConsultantName() != null && !request.getConsultantName().isBlank()) {
            return request.getConsultantName().trim();
        }
        if (calc.getConsultant() != null && calc.getConsultant().getName() != null) {
            return calc.getConsultant().getName();
        }
        return "";
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
