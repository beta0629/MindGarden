package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.erp.financial.CardMerchantFeeSettings;
import com.coresolution.consultation.repository.erp.financial.CardMerchantFeeSettingsRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.service.PaymentMethodSsotService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.PlatformTransactionManager;

/**
 * {@link AdminServiceImpl} 매핑 경로 카드 수수료 산출 검증.
 *
 * @author CoreSolution
 * @since 2026-09-01
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminServiceImpl 카드 수수료 매핑 경로 테스트")
class AdminServiceImplCardMerchantFeeTest {

    private static final String TENANT_ID = "tenant-mapping-fee-" + UUID.randomUUID();

    @Mock
    private CardMerchantFeeSettingsRepository settingsRepository;

    private AdminServiceImpl adminService;

    @BeforeEach
    void setUp() {
        PaymentMethodSsotService paymentMethodSsotService = mock(PaymentMethodSsotService.class);
        lenient().when(paymentMethodSsotService.isCardMerchantFeeEligible(eq(TENANT_ID), eq("CREDIT_CARD")))
                .thenReturn(true);
        lenient().when(paymentMethodSsotService.isCardMerchantFeeEligible(eq(TENANT_ID), eq("CASH")))
                .thenReturn(false);
        lenient().when(paymentMethodSsotService.normalizeToCanonicalCodeValue(eq(TENANT_ID), eq("CREDIT_CARD")))
                .thenReturn("CREDIT_CARD");
        lenient().when(paymentMethodSsotService.normalizeToCanonicalCodeValue(eq(TENANT_ID), eq("CASH")))
                .thenReturn("CASH");

        CardMerchantFeeResolutionServiceImpl resolutionService =
                new CardMerchantFeeResolutionServiceImpl(settingsRepository, paymentMethodSsotService);

        adminService = new AdminServiceImpl(
                mock(com.coresolution.consultation.repository.UserRepository.class),
                mock(com.coresolution.consultation.repository.ConsultantRepository.class),
                mock(com.coresolution.consultation.repository.ClientRepository.class),
                mock(com.coresolution.consultation.repository.ConsultantClientMappingRepository.class),
                mock(com.coresolution.consultation.repository.ConsultantRatingRepository.class),
                mock(com.coresolution.consultation.service.ConsultantRatingService.class),
                mock(com.coresolution.consultation.repository.ScheduleRepository.class),
                mock(com.coresolution.consultation.repository.ConsultationRecordRepository.class),
                mock(com.coresolution.consultation.repository.CommonCodeRepository.class),
                mock(com.coresolution.consultation.service.CommonCodeService.class),
                mock(com.coresolution.core.security.PasswordService.class),
                mock(com.coresolution.consultation.util.PersonalDataEncryptionUtil.class),
                mock(com.coresolution.consultation.service.ConsultantAvailabilityService.class),
                mock(com.coresolution.consultation.service.ConsultationMessageService.class),
                mock(com.coresolution.consultation.service.BranchService.class),
                mock(com.coresolution.consultation.service.NotificationService.class),
                mock(com.coresolution.consultation.service.erp.financial.FinancialTransactionService.class),
                resolutionService,
                paymentMethodSsotService,
                mock(com.coresolution.consultation.service.RealTimeStatisticsService.class),
                mock(com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository.class),
                mock(com.coresolution.consultation.service.AmountManagementService.class),
                mock(com.coresolution.consultation.service.StoredProcedureService.class),
                mock(com.coresolution.core.repository.UserRoleAssignmentRepository.class),
                mock(com.coresolution.core.repository.TenantRoleRepository.class),
                mock(com.coresolution.core.service.UserRoleQueryService.class),
                mock(com.coresolution.core.util.StatusCodeHelper.class),
                mock(com.coresolution.consultation.service.UserPersonalDataCacheService.class),
                mock(com.coresolution.consultation.service.ScheduleListUserFieldsResolver.class),
                mock(com.coresolution.consultation.service.ConsultantStatsService.class),
                mock(com.coresolution.consultation.service.ClientStatsService.class),
                mock(com.coresolution.consultation.service.impl.NotificationChannelPreferenceResolutionService.class),
                mock(com.coresolution.consultation.service.PasswordResetService.class),
                mock(PlatformTransactionManager.class),
                mock(com.coresolution.consultation.service.UserIdGenerator.class),
                mock(com.coresolution.consultation.service.UserService.class),
                mock(com.coresolution.consultation.repository.ConsultantSalaryProfileRepository.class),
                mock(com.coresolution.consultation.service.ScheduleService.class),
                mock(com.coresolution.consultation.service.SalaryLateSessionAutoSyncService.class),
                mock(com.coresolution.consultation.service.ProfessionalProviderTypeService.class),
                mock(com.coresolution.consultation.service.MappingSettlementNotificationHelper.class),
                mock(com.coresolution.consultation.service.BatchNotificationDispatchService.class),
                mock(com.coresolution.consultation.service.RefundAutoCancelNotificationService.class),
                mock(com.coresolution.consultation.service.UserLifecycleService.class),
                mock(com.coresolution.consultation.service.AdminRequestIdempotencyService.class),
                org.mockito.Mockito.mock(com.coresolution.consultation.service.SalaryTaxRateLookupService.class));
    }

    @Test
    @DisplayName("CREDIT_CARD 매핑 + 2026-09-01 이후 + 2.08% → 90,000원 수수료 1,872원")
    void resolveMappingCardMerchantFee_creditCard_postSept() {
        CardMerchantFeeSettings settings = CardMerchantFeeSettings.builder()
                .averageRatePercent(new BigDecimal("2.08"))
                .build();
        settings.setId(1L);
        settings.setTenantId(TENANT_ID);
        when(settingsRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID))
                .thenReturn(Optional.of(settings));

        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setPaymentMethod("CREDIT_CARD");

        BigDecimal fee = ReflectionTestUtils.invokeMethod(
                adminService,
                "resolveMappingCardMerchantFee",
                TENANT_ID,
                new BigDecimal("90000"),
                mapping,
                LocalDate.of(2026, 9, 15));

        assertThat(fee).isEqualByComparingTo(new BigDecimal("1872"));
    }

    @Test
    @DisplayName("CASH 매핑 → 수수료 0")
    void resolveMappingCardMerchantFee_cash_returnsZero() {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setPaymentMethod("CASH");

        BigDecimal fee = ReflectionTestUtils.invokeMethod(
                adminService,
                "resolveMappingCardMerchantFee",
                TENANT_ID,
                new BigDecimal("90000"),
                mapping,
                LocalDate.of(2026, 9, 15));

        assertThat(fee).isEqualByComparingTo(BigDecimal.ZERO);
    }
}
