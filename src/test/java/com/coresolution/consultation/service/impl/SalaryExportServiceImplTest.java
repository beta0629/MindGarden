package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.coresolution.consultation.constant.salary.SalaryExportConstants;
import com.coresolution.consultation.dto.EmailResponse;
import com.coresolution.consultation.dto.SalaryExportRequest;
import com.coresolution.consultation.entity.SalaryCalculation;
import com.coresolution.consultation.entity.SalaryProfile;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.SalaryCalculationRepository;
import com.coresolution.consultation.service.EmailService;
import com.coresolution.consultation.service.SalaryManagementService;
import com.coresolution.core.context.TenantContextHolder;

/**
 * 급여 PDF·이메일 export 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-05-11
 */
@ExtendWith(MockitoExtension.class)
class SalaryExportServiceImplTest {

    private static final String TENANT = "tenant-salary-export-test";

    @Mock
    private SalaryCalculationRepository salaryCalculationRepository;

    @Mock
    private SalaryManagementService salaryManagementService;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private SalaryExportServiceImpl salaryExportService;

    @BeforeEach
    void setTenant() {
        TenantContextHolder.setTenantId(TENANT);
    }

    @AfterEach
    void clearTenant() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("exportPdf: emailAddress 있으면 PDF 바이트로 급여 이메일 API 호출")
    void exportPdf_withEmailAddress_callsEmailWithPdfBytes() {
        User consultant = new User();
        consultant.setName("테스트상담사");
        SalaryProfile profile = new SalaryProfile();
        SalaryCalculation calc = SalaryCalculation.builder()
                .consultant(consultant)
                .salaryProfile(profile)
                .calculationPeriodStart(LocalDate.of(2025, 6, 1))
                .calculationPeriodEnd(LocalDate.of(2025, 6, 30))
                .totalConsultations(0)
                .completedConsultations(2)
                .baseSalary(new BigDecimal("1000000"))
                .grossSalary(new BigDecimal("1100000"))
                .deductions(new BigDecimal("100000"))
                .netSalary(new BigDecimal("1000000"))
                .totalSalary(new BigDecimal("1100000"))
                .hourlyEarnings(BigDecimal.ZERO)
                .commissionEarnings(BigDecimal.ZERO)
                .status(SalaryCalculation.SalaryStatus.CALCULATED)
                .calculatedAt(LocalDateTime.now())
                .build();
        calc.setId(42L);
        calc.setTenantId(TENANT);

        when(salaryCalculationRepository.findByIdWithConsultant(42L)).thenReturn(Optional.of(calc));
        when(salaryManagementService.getTaxDetails(42L)).thenReturn(Map.of());
        when(emailService.sendSalaryCalculationEmailWithResponse(
                eq("payroll@example.com"), eq("테스트상담사"), anyString(), anyMap(), any(), anyString()))
                .thenReturn(EmailResponse.builder().success(true).message("ok").build());

        SalaryExportRequest request = new SalaryExportRequest();
        request.setCalculationId(42L);
        request.setIncludeTaxDetails(true);
        request.setIncludeCalculationDetails(true);
        request.setEmailAddress("payroll@example.com");

        Map<String, Object> result = salaryExportService.exportPdf(request);

        assertNotNull(result.get(SalaryExportConstants.RESPONSE_KEY_DOWNLOAD_URL));
        assertTrue(result.get(SalaryExportConstants.RESPONSE_KEY_DOWNLOAD_URL).toString()
                .startsWith(SalaryExportConstants.DATA_URI_PREFIX_PDF));
        assertEquals(true, result.get(SalaryExportConstants.RESPONSE_KEY_EMAIL_SENT));
        verify(emailService).sendSalaryCalculationEmailWithResponse(
                eq("payroll@example.com"), eq("테스트상담사"), anyString(), anyMap(), any(), anyString());
    }
}
