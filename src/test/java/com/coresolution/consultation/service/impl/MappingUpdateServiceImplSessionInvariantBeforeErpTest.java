package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.dto.ConsultantClientMappingCreateRequest;
import com.coresolution.consultation.dto.ConsultantClientMappingResponse;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping.PaymentStatus;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.service.MappingSettlementNotificationHelper;
import com.coresolution.consultation.service.PaymentMethodSsotService;
import com.coresolution.consultation.service.StoredProcedureService;
import com.coresolution.consultation.service.support.ClientEventWriteSupport;
import com.coresolution.core.context.TenantContextHolder;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;

/**
 * MappingUpdateServiceImpl#update — ERP UpdateMappingInfo 호출 전 회기 불변식 선행 검증.
 *
 * @author CoreSolution
 * @since 2026-11-26
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("MappingUpdateServiceImpl — ERP 전 회기 불변식")
class MappingUpdateServiceImplSessionInvariantBeforeErpTest {

    private static final String TENANT_ID = "tenant-map-session-before-erp";
    private static final Long MAPPING_ID = 555L;
    private static final String PACKAGE_NAME = "기본 패키지";

    @Mock private ConsultantClientMappingRepository mappingRepository;
    @Mock private PaymentMethodSsotService paymentMethodSsotService;
    @Mock private MappingSettlementNotificationHelper mappingSettlementNotificationHelper;
    @Mock private PaymentRepository paymentRepository;
    @Mock private ClientEventWriteSupport clientEventWriteSupport;
    @Mock private StoredProcedureService storedProcedureService;

    private AdminServiceImpl adminService;
    private MappingUpdateServiceImpl mappingUpdateService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        PlatformTransactionManager noopTx = new AbstractPlatformTransactionManager() {
            @Override
            protected Object doGetTransaction() {
                return new Object();
            }

            @Override
            protected void doBegin(Object transaction, TransactionDefinition definition) {
            }

            @Override
            protected void doCommit(DefaultTransactionStatus status) {
            }

            @Override
            protected void doRollback(DefaultTransactionStatus status) {
            }
        };
        adminService = new AdminServiceImpl(
                mock(com.coresolution.consultation.repository.UserRepository.class),
                mock(com.coresolution.consultation.repository.ConsultantRepository.class),
                mock(com.coresolution.consultation.repository.ClientRepository.class),
                mappingRepository,
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
                noopTx,
                mock(com.coresolution.consultation.service.UserIdGenerator.class),
                mock(com.coresolution.consultation.service.UserService.class),
                mock(com.coresolution.consultation.repository.ConsultantSalaryProfileRepository.class),
                mock(com.coresolution.consultation.service.ScheduleService.class),
                mock(com.coresolution.consultation.service.SalaryLateSessionAutoSyncService.class),
                mock(com.coresolution.consultation.service.ProfessionalProviderTypeService.class),
                mappingSettlementNotificationHelper,
                mock(com.coresolution.consultation.service.BatchNotificationDispatchService.class),
                mock(com.coresolution.consultation.service.RefundAutoCancelNotificationService.class),
                mock(com.coresolution.consultation.service.UserLifecycleService.class),
                mock(com.coresolution.consultation.service.AdminRequestIdempotencyService.class),
                mock(com.coresolution.consultation.service.SalaryTaxRateLookupService.class),
                null,
                mock(com.coresolution.consultation.repository.InstitutionLinkContractRepository.class),
                mock(com.coresolution.consultation.repository.ShopClientOrderLineRepository.class),
                paymentRepository);
        ReflectionTestUtils.setField(adminService, "clientEventWriteSupport", clientEventWriteSupport);
        when(paymentMethodSsotService.normalizeToCanonicalCodeValue(anyString(), anyString()))
                .thenAnswer(inv -> inv.getArgument(1));
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(anyString(), anyString()))
                .thenReturn(Collections.emptyList());
        when(clientEventWriteSupport.toMappingSessionJson(any())).thenReturn("{\"totalSessions\":10}");

        mappingUpdateService = new MappingUpdateServiceImpl(adminService, storedProcedureService);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("APPROVED · totalSessions < usedSessions → IAE, UpdateMappingInfo 미호출")
    void update_totalLessThanUsed_throwsBeforeErp() {
        ConsultantClientMapping mapping = approvedMapping(10, 5, 5);
        when(mappingRepository.findByTenantIdAndId(TENANT_ID, MAPPING_ID))
                .thenReturn(Optional.of(mapping));

        ConsultantClientMappingCreateRequest dto = new ConsultantClientMappingCreateRequest();
        dto.setTotalSessions(3);

        assertThatThrownBy(() -> mappingUpdateService.update(MAPPING_ID, dto, "admin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(String.format(
                        AdminServiceUserFacingMessages.MSG_MAPPING_TOTAL_SESSIONS_LESS_THAN_USED_FMT, 3, 5));

        verify(storedProcedureService, never()).updateMappingInfo(
                anyLong(), anyString(), anyDouble(), anyInt(), anyString());
        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
    }

    @Test
    @DisplayName("APPROVED · 유효한 totalSessions 증가 → UpdateMappingInfo 1회 후 updateMapping")
    void update_validTotalIncrease_callsErpThenUpdateMapping() {
        ConsultantClientMapping mapping = approvedMapping(10, 2, 8);
        when(mappingRepository.findByTenantIdAndId(TENANT_ID, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        when(storedProcedureService.updateMappingInfo(
                eq(MAPPING_ID), anyString(), anyDouble(), eq(15), anyString()))
                .thenReturn(Map.of("success", true));

        ConsultantClientMappingCreateRequest dto = new ConsultantClientMappingCreateRequest();
        dto.setTotalSessions(15);

        ConsultantClientMappingResponse response = mappingUpdateService.update(MAPPING_ID, dto, "admin");

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(MAPPING_ID);
        assertThat(mapping.getTotalSessions()).isEqualTo(15);
        assertThat(mapping.getUsedSessions()).isEqualTo(2);
        assertThat(mapping.getRemainingSessions()).isEqualTo(13);

        verify(storedProcedureService, times(1)).updateMappingInfo(
                eq(MAPPING_ID), eq(PACKAGE_NAME), eq(100_000.0), eq(15), eq("admin"));
        verify(mappingRepository, times(1)).save(any(ConsultantClientMapping.class));
    }

    private ConsultantClientMapping approvedMapping(int total, int used, int remaining) {
        User client = new User();
        client.setId(42L);
        User consultant = new User();
        consultant.setId(31L);
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(MAPPING_ID);
        mapping.setTenantId(TENANT_ID);
        mapping.setClient(client);
        mapping.setConsultant(consultant);
        mapping.setStatus(MappingStatus.ACTIVE);
        mapping.setPaymentStatus(PaymentStatus.APPROVED);
        mapping.setPackageName(PACKAGE_NAME);
        mapping.setPackagePrice(100_000L);
        mapping.setTotalSessions(total);
        mapping.setUsedSessions(used);
        mapping.setRemainingSessions(remaining);
        return mapping;
    }
}
