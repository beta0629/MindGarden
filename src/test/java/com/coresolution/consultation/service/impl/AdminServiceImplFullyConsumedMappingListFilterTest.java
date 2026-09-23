package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.core.context.TenantContextHolder;
import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.PlatformTransactionManager;

/**
 * stale ACTIVE rem&gt;0 + COMPLETED 완전 소비 시 active/remaining 목록 제외 검증.
 *
 * @author CoreSolution
 * @since 2026-09-23
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminServiceImpl fully-consumed 목록 SSOT 필터")
class AdminServiceImplFullyConsumedMappingListFilterTest {

    private static final Long MAPPING_STALE_ID = 276L;
    private static final Long MAPPING_OPEN_ID = 277L;
    private static final Long CONSULTANT_ID = 501L;
    private static final Long CLIENT_STALE_ID = 601L;
    private static final Long CLIENT_OPEN_ID = 602L;

    @Mock
    private ConsultantClientMappingRepository mappingRepository;
    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private EntityManager entityManager;

    private AdminServiceImpl adminService;
    private String tenantId;

    @BeforeEach
    void setUp() {
        tenantId = "tenant-fully-consumed-" + UUID.randomUUID();
        TenantContextHolder.setTenantId(tenantId);
        adminService = new AdminServiceImpl(
                mock(com.coresolution.consultation.repository.UserRepository.class),
                mock(com.coresolution.consultation.repository.ConsultantRepository.class),
                mock(com.coresolution.consultation.repository.ClientRepository.class),
                mappingRepository,
                mock(com.coresolution.consultation.repository.ConsultantRatingRepository.class),
                mock(com.coresolution.consultation.service.ConsultantRatingService.class),
                scheduleRepository,
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
                mock(com.coresolution.consultation.service.SalaryTaxRateLookupService.class));
        ReflectionTestUtils.setField(adminService, "entityManager", entityManager);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("getActiveMappings — ACTIVE rem=1 used=0 + COMPLETED>=total → 미포함")
    void getActiveMappings_excludesStaleFullyConsumed() {
        ConsultantClientMapping stale = mapping(MAPPING_STALE_ID, CLIENT_STALE_ID, 1, 0, 1);
        ConsultantClientMapping open = mapping(MAPPING_OPEN_ID, CLIENT_OPEN_ID, 5, 1, 4);
        when(mappingRepository.findActiveMappingsWithDetailsByTenantId(tenantId))
                .thenReturn(List.of(stale, open));
        when(scheduleRepository.countOccupyingConsultationSchedulesForMapping(
                eq(tenantId), eq(MAPPING_STALE_ID), eq(CONSULTANT_ID), eq(CLIENT_STALE_ID), anyCollection()))
                .thenReturn(1L);
        when(scheduleRepository.countOccupyingConsultationSchedulesForMapping(
                eq(tenantId), eq(MAPPING_OPEN_ID), eq(CONSULTANT_ID), eq(CLIENT_OPEN_ID), anyCollection()))
                .thenReturn(0L);

        List<ConsultantClientMapping> result = adminService.getActiveMappings();

        assertThat(result).extracting(ConsultantClientMapping::getId).containsExactly(MAPPING_OPEN_ID);
        assertThat(stale.getRemainingSessions()).isEqualTo(1);
        verify(mappingRepository, never()).save(any());
    }

    @Test
    @DisplayName("getAllMappings — detach 후 rem=0 클램프, repository.save 미호출 (DB heal 금지)")
    void getAllMappings_detachesThenClampsRem_withoutSave() {
        ConsultantClientMapping stale = mapping(MAPPING_STALE_ID, CLIENT_STALE_ID, 1, 0, 1);
        when(mappingRepository.findAllWithDetailsByTenantId(tenantId)).thenReturn(List.of(stale));
        when(scheduleRepository.countOccupyingConsultationSchedulesForMapping(
                eq(tenantId), eq(MAPPING_STALE_ID), eq(CONSULTANT_ID), eq(CLIENT_STALE_ID), anyCollection()))
                .thenReturn(1L);
        when(entityManager.contains(stale)).thenReturn(true);

        List<ConsultantClientMapping> result = adminService.getAllMappings();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getRemainingSessions()).isZero();
        assertThat(result.get(0).getStatus()).isEqualTo(MappingStatus.ACTIVE);
        assertThat(result.get(0).getUsedSessions()).isZero();

        InOrder inOrder = Mockito.inOrder(entityManager);
        inOrder.verify(entityManager).contains(stale);
        inOrder.verify(entityManager).detach(stale);
        verify(mappingRepository, never()).save(any());
    }

    private static ConsultantClientMapping mapping(
            Long id, Long clientId, int total, int used, int rem) {
        User consultant = new User();
        consultant.setId(CONSULTANT_ID);
        User client = new User();
        client.setId(clientId);
        ConsultantClientMapping m = new ConsultantClientMapping();
        m.setId(id);
        m.setConsultant(consultant);
        m.setClient(client);
        m.setTotalSessions(total);
        m.setUsedSessions(used);
        m.setRemainingSessions(rem);
        m.setStatus(MappingStatus.ACTIVE);
        return m;
    }
}
