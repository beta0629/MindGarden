package com.coresolution.consultation.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;

import com.coresolution.consultation.config.LifecycleCutoffProperties;
import com.coresolution.consultation.entity.PersonalDataAccessLog;
import com.coresolution.consultation.lifecycle.BusinessMode;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.PersonalDataAccessLogRepository;
import com.coresolution.consultation.repository.SalaryCalculationRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 라이프사이클 cutoff 분기 + destruction 로그 metadata stamp 검증.
 *
 * <p>본 합의서 {@code docs/standards/USER_LIFECYCLE_TERMINATION_POLICY.md} v1.2 §0.1 Q9·Q10 결재 결과 —
 * NON_MEDICAL 3년 default / MEDICAL 10년 / payments 5년 / access logs 1년 / metadata stamp.
 *
 * @author MindGarden
 * @since 2026-05-28
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PersonalDataDestructionService — cutoff 분기 + metadata stamp")
class PersonalDataDestructionServiceCutoffTest {

    private static final String TENANT_ID = "tenant-a";

    @Mock
    private PersonalDataAccessLogRepository personalDataAccessLogRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ConsultationRecordRepository consultationRecordRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private SalaryCalculationRepository salaryCalculationRepository;
    @Mock
    private com.coresolution.core.service.TenantService tenantService;

    private LifecycleCutoffProperties cutoffProperties;
    private PersonalDataDestructionService service;

    @BeforeEach
    void setUp() {
        cutoffProperties = new LifecycleCutoffProperties();
        service = new PersonalDataDestructionService(
            personalDataAccessLogRepository,
            userRepository,
            consultationRecordRepository,
            paymentRepository,
            salaryCalculationRepository,
            tenantService,
            cutoffProperties);
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void clearTenant() {
        TenantContextHolder.clear();
    }

    @Nested
    @DisplayName("CONSULTATION_RECORDS cutoff")
    class ConsultationRecordsCutoff {

        @Test
        @DisplayName("NON_MEDICAL default → 3년 cutoff 적용")
        void nonMedicalUses3YearCutoff() {
            cutoffProperties.setBusinessMode(BusinessMode.NON_MEDICAL);
            cutoffProperties.setConsultationRecordsYears(3);
            when(consultationRecordRepository.findExpiredRecordsForDestruction(eq(TENANT_ID), any()))
                .thenReturn(Collections.emptyList());

            ArgumentCaptor<LocalDateTime> cutoffCaptor = ArgumentCaptor.forClass(LocalDateTime.class);

            service.destroyExpiredConsultationData();

            verify(consultationRecordRepository).findExpiredRecordsForDestruction(eq(TENANT_ID), cutoffCaptor.capture());
            LocalDateTime expected = LocalDateTime.now().minusYears(3);
            assertThat(cutoffCaptor.getValue())
                .isCloseTo(expected, within(5, ChronoUnit.SECONDS));
        }

        @Test
        @DisplayName("MEDICAL → 10년 cutoff 자동 분기 (의료법 §22)")
        void medicalUses10YearCutoff() {
            cutoffProperties.setBusinessMode(BusinessMode.MEDICAL);
            cutoffProperties.setMedicalConsultationRecordsYears(10);
            when(consultationRecordRepository.findExpiredRecordsForDestruction(eq(TENANT_ID), any()))
                .thenReturn(Collections.emptyList());

            ArgumentCaptor<LocalDateTime> cutoffCaptor = ArgumentCaptor.forClass(LocalDateTime.class);

            service.destroyExpiredConsultationData();

            verify(consultationRecordRepository).findExpiredRecordsForDestruction(eq(TENANT_ID), cutoffCaptor.capture());
            LocalDateTime expected = LocalDateTime.now().minusYears(10);
            assertThat(cutoffCaptor.getValue())
                .isCloseTo(expected, within(5, ChronoUnit.SECONDS));
        }
    }

    @Test
    @DisplayName("PAYMENTS 5년 cutoff (전자상거래법 §6 + 국세기본법 §85의3 + 전금법 §22)")
    void paymentsUses5YearCutoff() {
        cutoffProperties.setPaymentsYears(5);
        when(paymentRepository.findExpiredPaymentsForDestructionByTenantId(eq(TENANT_ID), any()))
            .thenReturn(Collections.emptyList());

        ArgumentCaptor<LocalDateTime> captor = ArgumentCaptor.forClass(LocalDateTime.class);

        service.destroyExpiredPaymentData();

        verify(paymentRepository).findExpiredPaymentsForDestructionByTenantId(eq(TENANT_ID), captor.capture());
        LocalDateTime expected = LocalDateTime.now().minusYears(5);
        assertThat(captor.getValue()).isCloseTo(expected, within(5, ChronoUnit.SECONDS));
    }

    @Test
    @DisplayName("ACCESS_LOGS 1년 cutoff")
    void accessLogsUses1YearCutoff() {
        cutoffProperties.setAccessLogsYears(1);
        when(personalDataAccessLogRepository.deleteByTenantIdAndAccessTimeBefore(eq(TENANT_ID), any()))
            .thenReturn(0);

        ArgumentCaptor<LocalDateTime> captor = ArgumentCaptor.forClass(LocalDateTime.class);

        service.destroyExpiredAccessLogs();

        verify(personalDataAccessLogRepository).deleteByTenantIdAndAccessTimeBefore(eq(TENANT_ID), captor.capture());
        LocalDateTime expected = LocalDateTime.now().minusYears(1);
        assertThat(captor.getValue()).isCloseTo(expected, within(5, ChronoUnit.SECONDS));
    }

    @Test
    @DisplayName("SALARY_DATA 3년 cutoff")
    void salaryUses3YearCutoff() {
        cutoffProperties.setSalaryDataYears(3);
        when(salaryCalculationRepository.findExpiredSalariesForDestructionByTenantId(eq(TENANT_ID), any()))
            .thenReturn(Collections.emptyList());

        ArgumentCaptor<LocalDateTime> captor = ArgumentCaptor.forClass(LocalDateTime.class);

        service.destroyExpiredSalaryData();

        verify(salaryCalculationRepository).findExpiredSalariesForDestructionByTenantId(eq(TENANT_ID), captor.capture());
        LocalDateTime expected = LocalDateTime.now().minusYears(3);
        assertThat(captor.getValue()).isCloseTo(expected, within(5, ChronoUnit.SECONDS));
    }

    @Test
    @DisplayName("USER_DATA 1년 cutoff")
    void userDataUses1YearCutoff() {
        cutoffProperties.setUserDataYears(1);
        when(userRepository.findExpiredUsersForDestructionByTenantId(eq(TENANT_ID), any()))
            .thenReturn(Collections.emptyList());

        ArgumentCaptor<LocalDateTime> captor = ArgumentCaptor.forClass(LocalDateTime.class);

        service.destroyExpiredUserData();

        verify(userRepository).findExpiredUsersForDestructionByTenantId(eq(TENANT_ID), captor.capture());
        LocalDateTime expected = LocalDateTime.now().minusYears(1);
        assertThat(captor.getValue()).isCloseTo(expected, within(5, ChronoUnit.SECONDS));
    }

    @Test
    @DisplayName("destruction 로그 metadata 에 businessMode + policyVersion + category + retentionYears stamp")
    void destructionLogStampsMetadata() {
        cutoffProperties.setBusinessMode(BusinessMode.NON_MEDICAL);
        cutoffProperties.setPolicyVersion("v1.2-test");
        cutoffProperties.setConsultationRecordsYears(3);
        when(consultationRecordRepository.findExpiredRecordsForDestruction(eq(TENANT_ID), any()))
            .thenReturn(List.<Object[]>of(new Object[] { 42L, "상담사A" }));

        service.destroyExpiredConsultationData();

        ArgumentCaptor<PersonalDataAccessLog> logCaptor = ArgumentCaptor.forClass(PersonalDataAccessLog.class);
        verify(personalDataAccessLogRepository).save(logCaptor.capture());
        PersonalDataAccessLog saved = logCaptor.getValue();
        assertThat(saved.getMetadata())
            .contains("\"policyVersion\":\"v1.2-test\"")
            .contains("\"businessMode\":\"NON_MEDICAL\"")
            .contains("\"category\":\"CONSULTATION_RECORDS\"")
            .contains("\"retentionYears\":3");
        assertThat(saved.getAccessType()).isEqualTo("DELETE");
        assertThat(saved.getDataType()).isEqualTo("CONSULTATION_RECORD");
        assertThat(saved.getReason()).contains("3년");
    }

    @Test
    @DisplayName("MEDICAL 모드에서 destruction 로그 metadata 의 retentionYears=10")
    void medicalDestructionLogStamps10Years() {
        cutoffProperties.setBusinessMode(BusinessMode.MEDICAL);
        cutoffProperties.setMedicalConsultationRecordsYears(10);
        when(consultationRecordRepository.findExpiredRecordsForDestruction(eq(TENANT_ID), any()))
            .thenReturn(List.<Object[]>of(new Object[] { 99L, "상담사B" }));

        service.destroyExpiredConsultationData();

        ArgumentCaptor<PersonalDataAccessLog> logCaptor = ArgumentCaptor.forClass(PersonalDataAccessLog.class);
        verify(personalDataAccessLogRepository).save(logCaptor.capture());
        assertThat(logCaptor.getValue().getMetadata())
            .contains("\"businessMode\":\"MEDICAL\"")
            .contains("\"retentionYears\":10");
    }

}
