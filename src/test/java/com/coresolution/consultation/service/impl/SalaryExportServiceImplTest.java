package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
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
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
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

    @Mock
    private UserPersonalDataCacheService userPersonalDataCacheService;

    @Mock
    private PersonalDataEncryptionUtil personalDataEncryptionUtil;

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
    @DisplayName("exportPdf: notifyConsultantByEmail이면 복호화된 상담사 이메일로 발송")
    void exportPdf_notifyConsultant_callsEmailWithDecryptedConsultantEmail() {
        User consultant = new User();
        consultant.setName("테스트상담사");
        consultant.setEmail("enc-mail");
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
        when(userPersonalDataCacheService.getDecryptedUserData(any(User.class)))
                .thenReturn(Map.of("name", "테스트상담사", "email", "consultant@example.com"));
        when(emailService.sendSalaryCalculationEmailWithResponse(
                eq("consultant@example.com"), eq("테스트상담사"), anyString(), anyMap(), any(), anyString()))
                .thenReturn(EmailResponse.builder().success(true).message("ok").build());

        SalaryExportRequest request = new SalaryExportRequest();
        request.setCalculationId(42L);
        request.setIncludeTaxDetails(true);
        request.setIncludeCalculationDetails(true);
        request.setNotifyConsultantByEmail(true);
        request.setEmailAddress("admin-override@example.com");

        Map<String, Object> result = salaryExportService.exportPdf(request);

        assertNotNull(result.get(SalaryExportConstants.RESPONSE_KEY_DOWNLOAD_URL));
        assertTrue(result.get(SalaryExportConstants.RESPONSE_KEY_DOWNLOAD_URL).toString()
                .startsWith(SalaryExportConstants.DATA_URI_PREFIX_PDF));
        assertEquals(true, result.get(SalaryExportConstants.RESPONSE_KEY_EMAIL_SENT));
        assertEquals("co***@example.com", result.get(SalaryExportConstants.RESPONSE_KEY_RECIPIENT_EMAIL));
        verify(emailService).sendSalaryCalculationEmailWithResponse(
                eq("consultant@example.com"), eq("테스트상담사"), anyString(), anyMap(), any(), anyString());
    }

    @Test
    @DisplayName("exportPdf: 캐시에 이메일 없으면 safeDecrypt(consultant.email)로 발송")
    void exportPdf_notifyConsultant_cacheMissEmail_usesSafeDecryptForEmail() {
        User consultant = new User();
        consultant.setName("legacy::KOzkSNN1HL9xwLpOCuKEGA==");
        consultant.setEmail("legacy::EMAIL_CIPHER");
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
        calc.setId(43L);
        calc.setTenantId(TENANT);

        when(salaryCalculationRepository.findByIdWithConsultant(43L)).thenReturn(Optional.of(calc));
        when(salaryManagementService.getTaxDetails(43L)).thenReturn(Map.of());
        when(userPersonalDataCacheService.getDecryptedUserData(any(User.class)))
                .thenReturn(Map.of("name", "복호화된이름"));
        when(personalDataEncryptionUtil.safeDecrypt("legacy::EMAIL_CIPHER")).thenReturn("plain@decrypt.test");
        when(emailService.sendSalaryCalculationEmailWithResponse(
                eq("plain@decrypt.test"), eq("복호화된이름"), anyString(), anyMap(), any(), anyString()))
                .thenReturn(EmailResponse.builder().success(true).message("ok").build());

        SalaryExportRequest request = new SalaryExportRequest();
        request.setCalculationId(43L);
        request.setIncludeTaxDetails(true);
        request.setIncludeCalculationDetails(true);
        request.setNotifyConsultantByEmail(true);

        salaryExportService.exportPdf(request);

        verify(personalDataEncryptionUtil).safeDecrypt("legacy::EMAIL_CIPHER");
        verify(emailService).sendSalaryCalculationEmailWithResponse(
                eq("plain@decrypt.test"), eq("복호화된이름"), anyString(), anyMap(), any(), anyString());
    }

    @Test
    @DisplayName("exportPdf: notify만 true이고 상담사 이메일 없으면 발송 스킵")
    void exportPdf_notifyConsultant_noEmail_skipsSend() {
        User consultant = new User();
        consultant.setName("이름");
        consultant.setEmail("");
        SalaryProfile profile = new SalaryProfile();
        SalaryCalculation calc = SalaryCalculation.builder()
                .consultant(consultant)
                .salaryProfile(profile)
                .calculationPeriodStart(LocalDate.of(2025, 6, 1))
                .calculationPeriodEnd(LocalDate.of(2025, 6, 30))
                .totalConsultations(0)
                .completedConsultations(0)
                .baseSalary(BigDecimal.ZERO)
                .grossSalary(BigDecimal.ZERO)
                .deductions(BigDecimal.ZERO)
                .netSalary(BigDecimal.ZERO)
                .totalSalary(BigDecimal.ZERO)
                .hourlyEarnings(BigDecimal.ZERO)
                .commissionEarnings(BigDecimal.ZERO)
                .status(SalaryCalculation.SalaryStatus.CALCULATED)
                .calculatedAt(LocalDateTime.now())
                .build();
        calc.setId(44L);
        calc.setTenantId(TENANT);

        when(salaryCalculationRepository.findByIdWithConsultant(44L)).thenReturn(Optional.of(calc));
        when(salaryManagementService.getTaxDetails(44L)).thenReturn(Map.of());
        when(userPersonalDataCacheService.getDecryptedUserData(any(User.class)))
                .thenReturn(Map.of("name", "이름"));

        SalaryExportRequest request = new SalaryExportRequest();
        request.setCalculationId(44L);
        request.setNotifyConsultantByEmail(true);

        Map<String, Object> result = salaryExportService.exportPdf(request);

        assertEquals(false, result.get(SalaryExportConstants.RESPONSE_KEY_EMAIL_SENT));
        assertEquals(SalaryExportConstants.EMAIL_MESSAGE_NO_CONSULTANT_EMAIL,
                result.get(SalaryExportConstants.RESPONSE_KEY_EMAIL_MESSAGE));
        verify(emailService, never()).sendSalaryCalculationEmailWithResponse(
                anyString(), anyString(), anyString(), anyMap(), any(), anyString());
    }

    @Test
    @DisplayName("exportPdf: 복호화 값이 이메일 형식이 아니면 발송 스킵")
    void exportPdf_notifyConsultant_invalidEmailFormat_skipsSend() {
        User consultant = new User();
        consultant.setName("이름");
        consultant.setEmail("x");
        SalaryProfile profile = new SalaryProfile();
        SalaryCalculation calc = SalaryCalculation.builder()
                .consultant(consultant)
                .salaryProfile(profile)
                .calculationPeriodStart(LocalDate.of(2025, 6, 1))
                .calculationPeriodEnd(LocalDate.of(2025, 6, 30))
                .totalConsultations(0)
                .completedConsultations(0)
                .baseSalary(BigDecimal.ONE)
                .grossSalary(BigDecimal.ONE)
                .deductions(BigDecimal.ZERO)
                .netSalary(BigDecimal.ONE)
                .totalSalary(BigDecimal.ONE)
                .hourlyEarnings(BigDecimal.ZERO)
                .commissionEarnings(BigDecimal.ZERO)
                .status(SalaryCalculation.SalaryStatus.CALCULATED)
                .calculatedAt(LocalDateTime.now())
                .build();
        calc.setId(46L);
        calc.setTenantId(TENANT);

        when(salaryCalculationRepository.findByIdWithConsultant(46L)).thenReturn(Optional.of(calc));
        when(salaryManagementService.getTaxDetails(46L)).thenReturn(Map.of());
        when(userPersonalDataCacheService.getDecryptedUserData(any(User.class)))
                .thenReturn(Map.of("name", "이름", "email", "not-a-valid-email"));

        SalaryExportRequest request = new SalaryExportRequest();
        request.setCalculationId(46L);
        request.setNotifyConsultantByEmail(true);

        Map<String, Object> result = salaryExportService.exportPdf(request);

        assertEquals(false, result.get(SalaryExportConstants.RESPONSE_KEY_EMAIL_SENT));
        assertEquals(SalaryExportConstants.EMAIL_MESSAGE_INVALID_CONSULTANT_EMAIL,
                result.get(SalaryExportConstants.RESPONSE_KEY_EMAIL_MESSAGE));
        verify(emailService, never()).sendSalaryCalculationEmailWithResponse(
                anyString(), anyString(), anyString(), anyMap(), any(), anyString());
    }

    @Test
    @DisplayName("exportPdf: emailAddress만 있고 notify 아니면 이메일 미호출")
    void exportPdf_emailAddressOnly_noNotify_doesNotSend() {
        User consultant = new User();
        consultant.setName("테스트");
        consultant.setEmail("e@e.com");
        SalaryProfile profile = new SalaryProfile();
        SalaryCalculation calc = SalaryCalculation.builder()
                .consultant(consultant)
                .salaryProfile(profile)
                .calculationPeriodStart(LocalDate.of(2025, 6, 1))
                .calculationPeriodEnd(LocalDate.of(2025, 6, 30))
                .totalConsultations(0)
                .completedConsultations(0)
                .baseSalary(BigDecimal.ONE)
                .grossSalary(BigDecimal.ONE)
                .deductions(BigDecimal.ZERO)
                .netSalary(BigDecimal.ONE)
                .totalSalary(BigDecimal.ONE)
                .hourlyEarnings(BigDecimal.ZERO)
                .commissionEarnings(BigDecimal.ZERO)
                .status(SalaryCalculation.SalaryStatus.CALCULATED)
                .calculatedAt(LocalDateTime.now())
                .build();
        calc.setId(45L);
        calc.setTenantId(TENANT);

        when(salaryCalculationRepository.findByIdWithConsultant(45L)).thenReturn(Optional.of(calc));
        when(salaryManagementService.getTaxDetails(45L)).thenReturn(Map.of());
        when(userPersonalDataCacheService.getDecryptedUserData(any(User.class)))
                .thenReturn(Map.of("name", "테스트", "email", "consultant@e.com"));

        SalaryExportRequest request = new SalaryExportRequest();
        request.setCalculationId(45L);
        request.setEmailAddress("legacy-only@example.com");

        salaryExportService.exportPdf(request);

        verify(emailService, never()).sendSalaryCalculationEmailWithResponse(
                anyString(), anyString(), anyString(), anyMap(), any(), anyString());
    }

    @Test
    @DisplayName("maskEmailForResponse: 로컬 2자 초과 시 앞 2자+마스킹")
    void maskEmailForResponse_masksLocalPart() {
        assertEquals("ab***@example.com", SalaryExportServiceImpl.maskEmailForResponse("abc@example.com"));
        assertEquals("a***@example.com", SalaryExportServiceImpl.maskEmailForResponse("a@example.com"));
        assertNull(SalaryExportServiceImpl.maskEmailForResponse(null));
        assertNull(SalaryExportServiceImpl.maskEmailForResponse("not-email"));
    }
}
