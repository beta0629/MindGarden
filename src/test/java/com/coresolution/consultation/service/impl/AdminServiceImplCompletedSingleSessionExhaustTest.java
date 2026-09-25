package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.PaymentTimingConstants;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.core.context.TenantContextHolder;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;

/**
 * 목록 조회에서 완료 일정이 있는 단회기만 회기 소진으로 맞춘다.
 *
 * @author CoreSolution
 * @since 2026-09-25
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminServiceImpl 완료 단회기 소진 정합")
class AdminServiceImplCompletedSingleSessionExhaustTest {

    private static final String TENANT_ID = "tenant-single-exhaust-" + UUID.randomUUID();
    private static final Long COMPLETED_SINGLE_ID = 4101L;
    private static final Long BOOKED_SINGLE_ID = 4102L;
    private static final Long MULTI_SESSION_ID = 4103L;
    private static final Long COMPLETED_PACKAGE_PRICE = 80_000L;
    private static final Long BOOKED_PACKAGE_PRICE = 100_000L;
    private static final Long MULTI_PACKAGE_PRICE = 300_000L;

    @Mock
    private ScheduleRepository scheduleRepository;

    @Mock
    private ConsultantClientMappingRepository mappingRepository;

    private AdminServiceImpl adminService;

    @BeforeEach
    void setUp() {
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
                mock(com.coresolution.consultation.service.SalaryTaxRateLookupService.class),
                mock(com.coresolution.consultation.repository.PartnerInstitutionRepository.class),
                mock(com.coresolution.consultation.repository.InstitutionLinkContractRepository.class),
                mock(com.coresolution.consultation.repository.ShopClientOrderLineRepository.class),
                mock(org.springframework.beans.factory.ObjectProvider.class),
                mock(com.coresolution.consultation.repository.PaymentRepository.class));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("완료 일정 단회기는 소진으로 저장하고 예약 단회기·다회기는 신규배정 상태를 유지한다")
    void completedSingleSession_isExhausted_bookedSingleAndMultiStayActive() {
        ConsultantClientMapping completedSingle = activeSingle(COMPLETED_SINGLE_ID, COMPLETED_PACKAGE_PRICE);
        ConsultantClientMapping bookedSingle = activeSingle(BOOKED_SINGLE_ID, BOOKED_PACKAGE_PRICE);
        ConsultantClientMapping multi = activeSingle(MULTI_SESSION_ID, MULTI_PACKAGE_PRICE);
        multi.setTotalSessions(10);
        multi.setUsedSessions(2);
        multi.setRemainingSessions(8);

        Schedule completed = new Schedule();
        completed.setId(901L);
        completed.setMappingId(COMPLETED_SINGLE_ID);
        completed.setStatus(ScheduleStatus.COMPLETED);

        TenantContextHolder.setTenantId(TENANT_ID);
        when(scheduleRepository.findOccupyingSchedulesByMappingIds(
                eq(TENANT_ID), any(), eq(List.of(ScheduleStatus.COMPLETED))))
                .thenReturn(List.of(completed));
        when(mappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        adminService.prepareMappingsPageForListResponse(List.of(completedSingle, bookedSingle, multi));

        ArgumentCaptor<ConsultantClientMapping> captor =
                ArgumentCaptor.forClass(ConsultantClientMapping.class);
        verify(mappingRepository, times(1)).save(captor.capture());
        ConsultantClientMapping saved = captor.getValue();
        assertThat(saved.getId()).isEqualTo(COMPLETED_SINGLE_ID);
        assertThat(saved.getUsedSessions()).isEqualTo(1);
        assertThat(saved.getRemainingSessions()).isZero();
        assertThat(saved.getTotalSessions()).isEqualTo(1);
        assertThat(saved.getStatus()).isEqualTo(MappingStatus.SESSIONS_EXHAUSTED);
        assertThat(saved.getPackagePrice()).isEqualTo(COMPLETED_PACKAGE_PRICE);
        assertThat(saved.getPaymentAmount()).isEqualTo(COMPLETED_PACKAGE_PRICE);

        assertThat(bookedSingle.getStatus()).isEqualTo(MappingStatus.ACTIVE);
        assertThat(bookedSingle.getUsedSessions()).isZero();
        assertThat(bookedSingle.getRemainingSessions()).isEqualTo(1);
        assertThat(bookedSingle.getPackagePrice()).isEqualTo(BOOKED_PACKAGE_PRICE);

        assertThat(multi.getStatus()).isEqualTo(MappingStatus.ACTIVE);
        assertThat(multi.getUsedSessions()).isEqualTo(2);
        assertThat(multi.getRemainingSessions()).isEqualTo(8);
        assertThat(multi.getPackagePrice()).isEqualTo(MULTI_PACKAGE_PRICE);

        adminService.prepareMappingsPageForListResponse(List.of(completedSingle, bookedSingle, multi));
        verify(mappingRepository, times(1)).save(any(ConsultantClientMapping.class));
    }

    @Test
    @DisplayName("이미 소진된 단회기는 다시 저장하지 않는다")
    void alreadyExhausted_isNotRewritten() {
        ConsultantClientMapping exhausted = activeSingle(COMPLETED_SINGLE_ID, COMPLETED_PACKAGE_PRICE);
        exhausted.setStatus(MappingStatus.SESSIONS_EXHAUSTED);
        exhausted.setUsedSessions(1);
        exhausted.setRemainingSessions(0);

        TenantContextHolder.setTenantId(TENANT_ID);
        adminService.prepareMappingsPageForListResponse(List.of(exhausted));

        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
        verify(scheduleRepository, never()).findOccupyingSchedulesByMappingIds(any(), any(), any());
        assertThat(exhausted.getPackagePrice()).isEqualTo(COMPLETED_PACKAGE_PRICE);
        assertThat(exhausted.getStatus()).isEqualTo(MappingStatus.SESSIONS_EXHAUSTED);
    }

    @Test
    @DisplayName("tenantId 가 없으면 단회기를 갱신하지 않는다")
    void missingTenantId_doesNotUpdate() {
        ConsultantClientMapping completedSingle = activeSingle(COMPLETED_SINGLE_ID, COMPLETED_PACKAGE_PRICE);
        TenantContextHolder.clear();

        adminService.prepareMappingsPageForListResponse(List.of(completedSingle));

        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
        assertThat(completedSingle.getStatus()).isEqualTo(MappingStatus.ACTIVE);
        assertThat(completedSingle.getRemainingSessions()).isEqualTo(1);
    }

    @Test
    @DisplayName("매핑 tenantId 가 없으면 컨텍스트가 있어도 갱신하지 않는다")
    void mappingWithoutTenantId_doesNotUpdate() {
        ConsultantClientMapping completedSingle = activeSingle(COMPLETED_SINGLE_ID, COMPLETED_PACKAGE_PRICE);
        completedSingle.setTenantId(null);
        TenantContextHolder.setTenantId(TENANT_ID);

        adminService.prepareMappingsPageForListResponse(List.of(completedSingle));

        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
        verify(scheduleRepository, never()).findOccupyingSchedulesByMappingIds(any(), any(), any());
        assertThat(completedSingle.getStatus()).isEqualTo(MappingStatus.ACTIVE);
        assertThat(completedSingle.getPackagePrice()).isEqualTo(COMPLETED_PACKAGE_PRICE);
    }

    @Test
    @DisplayName("기관연동·바우처 단회기는 완료 일정이 있어도 소진으로 바꾸지 않는다")
    void institutionLinkAndVoucher_stayActive() {
        ConsultantClientMapping institutionLink = activeSingle(COMPLETED_SINGLE_ID, COMPLETED_PACKAGE_PRICE);
        institutionLink.setPaymentTiming(PaymentTimingConstants.INSTITUTION_LINK);
        ConsultantClientMapping voucher = activeSingle(BOOKED_SINGLE_ID, BOOKED_PACKAGE_PRICE);
        voucher.setPaymentTiming(PaymentTimingConstants.VOUCHER);

        TenantContextHolder.setTenantId(TENANT_ID);
        adminService.prepareMappingsPageForListResponse(List.of(institutionLink, voucher));

        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
        verify(scheduleRepository, never()).findOccupyingSchedulesByMappingIds(any(), any(), any());
        assertThat(institutionLink.getStatus()).isEqualTo(MappingStatus.ACTIVE);
        assertThat(voucher.getStatus()).isEqualTo(MappingStatus.ACTIVE);
        assertThat(institutionLink.getPackagePrice()).isEqualTo(COMPLETED_PACKAGE_PRICE);
        assertThat(voucher.getPackagePrice()).isEqualTo(BOOKED_PACKAGE_PRICE);
    }

    private ConsultantClientMapping activeSingle(Long id, Long packagePrice) {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(id);
        mapping.setTenantId(TENANT_ID);
        mapping.setStatus(MappingStatus.ACTIVE);
        mapping.setPaymentTiming(PaymentTimingConstants.ADVANCE);
        mapping.setTotalSessions(1);
        mapping.setUsedSessions(0);
        mapping.setRemainingSessions(1);
        mapping.setPackagePrice(packagePrice);
        mapping.setPaymentAmount(packagePrice);
        return mapping;
    }
}
