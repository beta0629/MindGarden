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
import java.util.Optional;

import jakarta.mail.internet.AddressException;
import jakarta.mail.internet.InternetAddress;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.coresolution.consultation.constant.salary.SalaryExportConstants;
import com.coresolution.consultation.constant.salary.SalaryTaxTypeDisplayLabels;
import com.coresolution.consultation.dto.EmailResponse;
import com.coresolution.consultation.dto.SalaryExportRequest;
import com.coresolution.consultation.entity.SalaryCalculation;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.SalaryCalculationRepository;
import com.coresolution.consultation.salaryexport.SalaryCalculationStatementRows;
import com.coresolution.consultation.salaryexport.SalaryExportFlyingSaucerPdfRenderer;
import com.coresolution.consultation.salaryexport.SalaryExportHtmlRenderer;
import com.coresolution.consultation.service.EmailService;
import com.coresolution.consultation.service.SalaryExportService;
import com.coresolution.consultation.service.SalaryManagementService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
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

    private final UserPersonalDataCacheService userPersonalDataCacheService;

    private final PersonalDataEncryptionUtil personalDataEncryptionUtil;

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> exportPdf(SalaryExportRequest request) {
        SalaryCalculation calc = loadCalculationForCurrentTenant(request.getCalculationId());
        Map<String, Object> taxDetails = resolveTaxDetails(request, calc.getId());
        String consultantDisplayName = resolveConsultantDisplayName(calc, request);
        String xhtml = SalaryExportHtmlRenderer.buildSalaryExportXhtml(calc, taxDetails, request, consultantDisplayName);
        byte[] bytes = SalaryExportFlyingSaucerPdfRenderer.renderToPdfBytes(xhtml);
        String filename = buildFilename(calc, "pdf", consultantDisplayName);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put(
                SalaryExportConstants.RESPONSE_KEY_DOWNLOAD_URL,
                SalaryExportConstants.DATA_URI_PREFIX_PDF + Base64.getEncoder().encodeToString(bytes));
        payload.put(SalaryExportConstants.RESPONSE_KEY_FILENAME, filename);

        if (Boolean.TRUE.equals(request.getNotifyConsultantByEmail())) {
            appendPdfEmailPayload(calc, request, consultantDisplayName, bytes, filename, payload);
        }

        return payload;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, String> exportExcel(SalaryExportRequest request) {
        SalaryCalculation calc = loadCalculationForCurrentTenant(request.getCalculationId());
        Map<String, Object> taxDetails = resolveTaxDetails(request, calc.getId());
        String consultantDisplayName = resolveConsultantDisplayName(calc, request);
        byte[] bytes = buildXlsx(calc, taxDetails, request, consultantDisplayName);
        String filename = buildFilename(calc, "xlsx", consultantDisplayName);
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
        String consultantDisplayName = resolveConsultantDisplayName(calc, request);
        byte[] bytes = buildCsv(calc, taxDetails, request, consultantDisplayName);
        String filename = buildFilename(calc, "csv", consultantDisplayName);
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
        m.put("commissionEarnings", toWholeWonLong(commission));
        m.put("hourlyEarnings", toWholeWonLong(hourly));
        m.put("optionSalary", toWholeWonLong(hourly.add(commission)));
        m.put("bonusEarnings", toWholeWonLong(calc.getBonusEarnings()));
        if (calc.getGrossSalary() != null) {
            m.put("grossSalary", toWholeWonLong(calc.getGrossSalary()));
        }
        m.put("totalSalary", toWholeWonLong(calc.getTotalSalary()));
        BigDecimal deductions = calc.getDeductions() != null ? calc.getDeductions() : BigDecimal.ZERO;
        m.put("deductions", toWholeWonLong(deductions));
        m.put("taxAmount", toWholeWonLong(deductions));
        if (calc.getNetSalary() != null) {
            m.put("netSalary", toWholeWonLong(calc.getNetSalary()));
        }
        int consultations = calc.getCompletedConsultations() != null ? calc.getCompletedConsultations() : 0;
        m.put("consultationCount", consultations);
        m.put("completedConsultations", consultations);
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

    /**
     * PDF·엑셀·CSV·이메일 표시용 상담사명. 요청 평문 우선, 이후 캐시 복호화·{@code safeDecrypt} 폴백(엔티티는 변경하지 않음).
     */
    private String resolveConsultantDisplayName(SalaryCalculation calc, SalaryExportRequest request) {
        if (StringUtils.hasText(request.getConsultantName())) {
            return request.getConsultantName().trim();
        }
        User consultant = calc.getConsultant();
        if (consultant == null) {
            return "";
        }
        Map<String, String> decrypted = userPersonalDataCacheService.getDecryptedUserData(consultant);
        if (decrypted != null) {
            String name = decrypted.get("name");
            if (StringUtils.hasText(name)) {
                return name.trim();
            }
        }
        String raw = consultant.getName();
        if (!StringUtils.hasText(raw)) {
            return "";
        }
        String decryptedName = personalDataEncryptionUtil.safeDecrypt(raw);
        return decryptedName != null ? decryptedName.trim() : "";
    }

    /**
     * PDF 이메일 발송: 상담사 등록 이메일만 사용한다. 요청 {@code emailAddress}는 사용하지 않는다.
     */
    private void appendPdfEmailPayload(
            SalaryCalculation calc,
            SalaryExportRequest request,
            String consultantDisplayName,
            byte[] bytes,
            String filename,
            Map<String, Object> payload) {
        User consultant = calc.getConsultant();
        Optional<String> plainOpt = resolveConsultantPlainEmailForSend(consultant);
        if (plainOpt.isEmpty()) {
            payload.put(SalaryExportConstants.RESPONSE_KEY_EMAIL_SENT, false);
            payload.put(SalaryExportConstants.RESPONSE_KEY_EMAIL_MESSAGE,
                    SalaryExportConstants.EMAIL_MESSAGE_NO_CONSULTANT_EMAIL);
            return;
        }
        String to = plainOpt.get();
        if (!isValidEmailFormat(to)) {
            payload.put(SalaryExportConstants.RESPONSE_KEY_EMAIL_SENT, false);
            payload.put(SalaryExportConstants.RESPONSE_KEY_EMAIL_MESSAGE,
                    SalaryExportConstants.EMAIL_MESSAGE_INVALID_CONSULTANT_EMAIL);
            return;
        }
        Map<String, Object> salaryData = buildSalaryDataMapForEmail(calc);
        String period = resolvePeriodForEmail(calc, request);
        EmailResponse emailResponse = emailService.sendSalaryCalculationEmailWithResponse(
                to,
                consultantDisplayName,
                period,
                salaryData,
                bytes,
                filename);
        payload.put(SalaryExportConstants.RESPONSE_KEY_EMAIL_SENT, emailResponse.isSuccess());
        if (emailResponse.isSuccess()) {
            String masked = maskEmailForResponse(to);
            if (StringUtils.hasText(masked)) {
                payload.put(SalaryExportConstants.RESPONSE_KEY_RECIPIENT_EMAIL, masked);
            }
        }
        if (!emailResponse.isSuccess()) {
            String msg = StringUtils.hasText(emailResponse.getErrorMessage())
                    ? emailResponse.getErrorMessage()
                    : emailResponse.getMessage();
            payload.put(SalaryExportConstants.RESPONSE_KEY_EMAIL_MESSAGE, msg != null ? msg : "이메일 발송에 실패했습니다.");
        }
    }

    /**
     * 상담사 발송용 평문 이메일. 캐시 복호화 {@code "email"} 우선, 없으면 {@code safeDecrypt(consultant.getEmail())}.
     *
     * @param consultant 급여 계산에 연결된 상담사(엔티티 변경 없음)
     * @return 비어 있지 않은 문자열이면 Optional.of(trimmed), 아니면 empty
     */
    private Optional<String> resolveConsultantPlainEmailForSend(User consultant) {
        if (consultant == null) {
            return Optional.empty();
        }
        Map<String, String> decrypted = userPersonalDataCacheService.getDecryptedUserData(consultant);
        if (decrypted != null) {
            String fromMap = decrypted.get("email");
            if (StringUtils.hasText(fromMap)) {
                return Optional.of(fromMap.trim());
            }
        }
        String raw = consultant.getEmail();
        if (!StringUtils.hasText(raw)) {
            return Optional.empty();
        }
        String decryptedEmail = personalDataEncryptionUtil.safeDecrypt(raw);
        if (!StringUtils.hasText(decryptedEmail)) {
            return Optional.empty();
        }
        return Optional.of(decryptedEmail.trim());
    }

    private static boolean isValidEmailFormat(String email) {
        try {
            InternetAddress addr = new InternetAddress(email.trim());
            addr.validate();
            return true;
        } catch (AddressException e) {
            return false;
        }
    }

    /**
     * API 응답용 마스킹(평문 전체 노출 방지). 예: {@code ab***@domain.com}
     */
    static String maskEmailForResponse(String plain) {
        if (!StringUtils.hasText(plain)) {
            return null;
        }
        String s = plain.trim();
        int at = s.lastIndexOf('@');
        if (at <= 0 || at >= s.length() - 1) {
            return null;
        }
        String local = s.substring(0, at);
        String domain = s.substring(at + 1);
        if (!StringUtils.hasText(domain)) {
            return null;
        }
        if (local.length() <= 2) {
            return local.charAt(0) + "***@" + domain;
        }
        return local.substring(0, 2) + "***@" + domain;
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

    private String buildFilename(SalaryCalculation calc, String ext, String consultantDisplayName) {
        String consultant = StringUtils.hasText(consultantDisplayName)
                ? consultantDisplayName
                : (calc.getConsultant() != null ? Objects.toString(calc.getConsultant().getName(), "") : "");
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

    private byte[] buildXlsx(
            SalaryCalculation calc,
            Map<String, Object> taxDetails,
            SalaryExportRequest request,
            String consultantDisplayName) {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("salary");
            int r = 0;
            r = appendCalculationRows(sheet, r, calc, request, consultantDisplayName);
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
                        String taxCode = Objects.toString(row.get(SalaryExportConstants.TAX_ROW_KEY_TAX_TYPE), "");
                        excelRow.createCell(0).setCellValue(SalaryTaxTypeDisplayLabels.labelForTaxType(taxCode));
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

    private int appendCalculationRows(
            Sheet sheet,
            int startRow,
            SalaryCalculation calc,
            SalaryExportRequest request,
            String consultantDisplayName) {
        int r = startRow;
        Row title = sheet.createRow(r++);
        title.createCell(0).setCellValue("급여 계산서");
        r = putPair(sheet, r, "계산 ID", String.valueOf(calc.getId()));
        r = putPair(sheet, r, "상담사", consultantDisplayName != null ? consultantDisplayName : "");
        if (calc.getCalculationPeriodStart() != null) {
            r = putPair(sheet, r, "기간 시작", calc.getCalculationPeriodStart().toString());
        }
        if (calc.getCalculationPeriodEnd() != null) {
            r = putPair(sheet, r, "기간 종료", calc.getCalculationPeriodEnd().toString());
        }
        r = putPair(sheet, r, "상태", calc.getStatus() != null ? calc.getStatus().name() : "");
        if (Boolean.FALSE.equals(request.getIncludeCalculationDetails())) {
            r = putPair(sheet, r, "급여 구성 상세", "요청에 따라 생략되었습니다. (PDF와 동일 옵션)");
            return r;
        }
        for (SalaryCalculationStatementRows.LabelAmount row : SalaryCalculationStatementRows.buildPretaxComponentRows(calc)) {
            r = putAmountRow(sheet, r, row.label(), row.amount());
        }
        BigDecimal bonus = calc.getBonusEarnings() != null ? calc.getBonusEarnings() : BigDecimal.ZERO;
        if (bonus.compareTo(BigDecimal.ZERO) > 0) {
            r = putPair(sheet, r, SalaryCalculationStatementRows.LABEL_SPECIAL_SUPPORT, "+" + formatAmount(bonus));
        }
        r = putAmountRow(sheet, r, SalaryCalculationStatementRows.LABEL_GROSS_PRETAX,
                SalaryCalculationStatementRows.resolveGrossPreTaxDisplay(calc));
        BigDecimal deductions = calc.getDeductions() != null ? calc.getDeductions() : BigDecimal.ZERO;
        if (deductions.compareTo(BigDecimal.ZERO) > 0) {
            r = putPair(sheet, r, SalaryCalculationStatementRows.LABEL_TAX_DEDUCTIONS, "-" + formatAmount(deductions));
        }
        BigDecimal netDisplay = calc.getNetSalary() != null ? calc.getNetSalary()
                : nzBig(calc.getTotalSalary()).subtract(deductions);
        r = putAmountRow(sheet, r, SalaryCalculationStatementRows.LABEL_NET, netDisplay);
        int completed = calc.getCompletedConsultations() != null ? calc.getCompletedConsultations() : 0;
        r = putPair(sheet, r, SalaryCalculationStatementRows.LABEL_CONSULTATION_COUNT, completed + "건");
        return r;
    }

    private static BigDecimal nzBig(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
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

    private byte[] buildCsv(
            SalaryCalculation calc,
            Map<String, Object> taxDetails,
            SalaryExportRequest request,
            String consultantDisplayName) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            baos.write(0xEF);
            baos.write(0xBB);
            baos.write(0xBF);
            try (Writer w = new OutputStreamWriter(baos, StandardCharsets.UTF_8)) {
                w.append("항목,값\n");
                w.append("계산 ID,").append(csvEscape(String.valueOf(calc.getId()))).append('\n');
                w.append("상담사,").append(csvEscape(consultantDisplayName != null ? consultantDisplayName : "")).append('\n');
                if (calc.getCalculationPeriodStart() != null) {
                    w.append("기간 시작,").append(csvEscape(calc.getCalculationPeriodStart().toString())).append('\n');
                }
                if (calc.getCalculationPeriodEnd() != null) {
                    w.append("기간 종료,").append(csvEscape(calc.getCalculationPeriodEnd().toString())).append('\n');
                }
                w.append("상태,").append(csvEscape(calc.getStatus() != null ? calc.getStatus().name() : "")).append('\n');
                if (Boolean.FALSE.equals(request.getIncludeCalculationDetails())) {
                    w.append("급여 구성 상세,").append(csvEscape("요청에 따라 생략 (PDF/Excel과 동일)")).append('\n');
                } else {
                    for (SalaryCalculationStatementRows.LabelAmount row
                            : SalaryCalculationStatementRows.buildPretaxComponentRows(calc)) {
                        w.append(csvEscape(row.label())).append(',')
                                .append(csvEscape(formatAmount(row.amount()))).append('\n');
                    }
                    BigDecimal bonus = calc.getBonusEarnings() != null ? calc.getBonusEarnings() : BigDecimal.ZERO;
                    if (bonus.compareTo(BigDecimal.ZERO) > 0) {
                        w.append(csvEscape(SalaryCalculationStatementRows.LABEL_SPECIAL_SUPPORT)).append(',')
                                .append(csvEscape("+" + formatAmount(bonus))).append('\n');
                    }
                    w.append(csvEscape(SalaryCalculationStatementRows.LABEL_GROSS_PRETAX)).append(',')
                            .append(csvEscape(formatAmount(SalaryCalculationStatementRows.resolveGrossPreTaxDisplay(calc))))
                            .append('\n');
                    BigDecimal ded = calc.getDeductions() != null ? calc.getDeductions() : BigDecimal.ZERO;
                    if (ded.compareTo(BigDecimal.ZERO) > 0) {
                        w.append(csvEscape(SalaryCalculationStatementRows.LABEL_TAX_DEDUCTIONS)).append(',')
                                .append(csvEscape("-" + formatAmount(ded))).append('\n');
                    }
                    BigDecimal netD = calc.getNetSalary() != null ? calc.getNetSalary()
                            : nzBig(calc.getTotalSalary()).subtract(ded);
                    w.append(csvEscape(SalaryCalculationStatementRows.LABEL_NET)).append(',')
                            .append(csvEscape(formatAmount(netD))).append('\n');
                    int done = calc.getCompletedConsultations() != null ? calc.getCompletedConsultations() : 0;
                    w.append(csvEscape(SalaryCalculationStatementRows.LABEL_CONSULTATION_COUNT)).append(',')
                            .append(csvEscape(done + "건")).append('\n');
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
                            String taxCode = Objects.toString(row.get(SalaryExportConstants.TAX_ROW_KEY_TAX_TYPE), "");
                            w.append("세금,")
                                    .append(csvEscape(SalaryTaxTypeDisplayLabels.labelForTaxType(taxCode)))
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
