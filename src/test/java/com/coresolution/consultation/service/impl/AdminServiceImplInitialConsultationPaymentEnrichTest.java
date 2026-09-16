package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;

/**
 * 초기상담 결제 enrich — 재무 FT SSOT (contract prepaid 금지).
 *
 * @author CoreSolution
 * @since 2026-09-16
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminServiceImpl initialConsultationPayment enrich")
class AdminServiceImplInitialConsultationPaymentEnrichTest {

    private static final String TENANT_ID = "tenant-il-initial-pay-" + UUID.randomUUID();
    private static final Long CLIENT_ID = 78L;
    private static final Long MAPPING_245 = 245L;
    private static final Long MAPPING_265 = 265L;

    @Mock
    private FinancialTransactionRepository financialTransactionRepository;

    private AdminServiceImpl adminService;

    @BeforeEach
    void setUp() {
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
                mock(com.coresolution.consultation.service.erp.financial.CardMerchantFeeResolutionService.class),
                mock(com.coresolution.consultation.service.PaymentMethodSsotService.class),
                mock(com.coresolution.consultation.service.RealTimeStatisticsService.class),
                financialTransactionRepository,
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
                mock(com.coresolution.consultation.service.SalaryTaxRateLookupService.class),
                mock(com.coresolution.consultation.repository.PartnerInstitutionRepository.class),
                mock(com.coresolution.consultation.repository.InstitutionLinkContractRepository.class));
    }

    @Test
    @DisplayName("타기관선납 FT 금액을 내담자 단위로 노출 (형제 매핑 공유, prepaid 10만 무시)")
    void getInitialConsultationPaymentByClientId_usesPrepaidFtAmountForSiblingMappings() {
        FinancialTransaction prepaidFt = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .amount(new BigDecimal("90000"))
                .transactionDate(LocalDate.of(2026, 9, 7))
                .status(FinancialTransaction.TransactionStatus.COMPLETED)
                .relatedEntityId(MAPPING_265)
                .relatedEntityType(FinancialTransactionConstants.RELATED_ENTITY_INSTITUTION_LINK_PREPAID)
                .build();
        prepaidFt.setId(241L);

        when(financialTransactionRepository
                .findByTenantIdAndTransactionTypeAndRelatedEntityTypeInAndRelatedEntityIdInAndIsDeletedFalse(
                        eq(TENANT_ID),
                        eq(FinancialTransaction.TransactionType.INCOME),
                        any(),
                        any()))
                .thenReturn(List.of(prepaidFt));

        Map<Long, Long> mappingIdToClientId = Map.of(
                MAPPING_245, CLIENT_ID,
                MAPPING_265, CLIENT_ID);

        Map<Long, Map<String, Object>> result =
                adminService.getInitialConsultationPaymentByClientId(
                        TENANT_ID, mappingIdToClientId, Set.of(CLIENT_ID));

        assertThat(result).containsKey(CLIENT_ID);
        Map<String, Object> payment = result.get(CLIENT_ID);
        assertThat(payment.get("financialTransactionId")).isEqualTo(241L);
        assertThat(payment.get("amount")).isEqualTo(90000L);
        assertThat(payment.get("transactionDate")).isEqualTo("2026-09-07");
        assertThat(payment.get("status")).isEqualTo("COMPLETED");
        assertThat(payment.get("relatedMappingId")).isEqualTo(MAPPING_265);
        assertThat(payment.get("relatedEntityType"))
                .isEqualTo(FinancialTransactionConstants.RELATED_ENTITY_INSTITUTION_LINK_PREPAID);
        assertThat(payment.get("amount")).isNotEqualTo(100000L);
    }

    @Test
    @DisplayName("선납 FT 없으면 IL 내담자 매핑 INCOME 으로 fallback")
    void getInitialConsultationPaymentByClientId_fallsBackToMappingIncomeForIlClient() {
        FinancialTransaction mappingIncome = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .amount(new BigDecimal("90000"))
                .transactionDate(LocalDate.of(2026, 9, 7))
                .status(FinancialTransaction.TransactionStatus.COMPLETED)
                .relatedEntityId(MAPPING_265)
                .relatedEntityType(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING)
                .build();
        mappingIncome.setId(241L);

        when(financialTransactionRepository
                .findByTenantIdAndTransactionTypeAndRelatedEntityTypeInAndRelatedEntityIdInAndIsDeletedFalse(
                        eq(TENANT_ID),
                        eq(FinancialTransaction.TransactionType.INCOME),
                        any(),
                        any()))
                .thenReturn(List.of(mappingIncome));

        Map<Long, Map<String, Object>> result =
                adminService.getInitialConsultationPaymentByClientId(
                        TENANT_ID,
                        Map.of(MAPPING_265, CLIENT_ID),
                        Set.of(CLIENT_ID));

        assertThat(result.get(CLIENT_ID).get("amount")).isEqualTo(90000L);
        assertThat(result.get(CLIENT_ID).get("relatedEntityType"))
                .isEqualTo(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING);
    }
}
