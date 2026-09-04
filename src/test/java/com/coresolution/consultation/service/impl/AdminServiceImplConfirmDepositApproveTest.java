package com.coresolution.consultation.service.impl;

import java.util.Map;
import java.util.Optional;

import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.ConsultantRatingRepository;
import com.coresolution.consultation.repository.ConsultantRepository;
import com.coresolution.consultation.repository.ConsultantSalaryProfileRepository;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.AmountManagementService;
import com.coresolution.consultation.service.BatchNotificationDispatchService;
import com.coresolution.consultation.service.RefundAutoCancelNotificationService;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.ClientStatsService;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultantAvailabilityService;
import com.coresolution.consultation.service.ConsultantRatingService;
import com.coresolution.consultation.service.ConsultantStatsService;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.MappingSettlementNotificationHelper;
import com.coresolution.consultation.service.MappingSettlementScenario;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.PasswordResetService;
import com.coresolution.consultation.service.ProfessionalProviderTypeService;
import com.coresolution.consultation.service.RealTimeStatisticsService;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.service.StoredProcedureService;
import com.coresolution.consultation.service.UserIdGenerator;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.service.erp.financial.CardMerchantFeeResolutionService;
import com.coresolution.consultation.service.PaymentMethodSsotService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.repository.TenantRoleRepository;
import com.coresolution.core.repository.UserRoleAssignmentRepository;
import com.coresolution.core.service.UserRoleQueryService;
import com.coresolution.core.util.StatusCodeHelper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import com.coresolution.core.security.PasswordService;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * AdminServiceImpl confirmDeposit / approveMapping — Spring 전체 컨텍스트 없이 Mockito로 검증.
 *
 * @author MindGarden
 * @since 2026-03-14
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminServiceImpl 입금확인/승인 테스트")
class AdminServiceImplConfirmDepositApproveTest {

    private static final String TEST_TENANT_ID = "tenant-test-" + java.util.UUID.randomUUID();

    @Mock
    private UserRepository userRepository;
    @Mock
    private ConsultantRepository consultantRepository;
    @Mock
    private ClientRepository clientRepository;
    @Mock
    private ConsultantClientMappingRepository mappingRepository;
    @Mock
    private ConsultantRatingRepository consultantRatingRepository;
    @Mock
    private ConsultantRatingService consultantRatingService;
    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock private ConsultationRecordRepository consultationRecordRepository;
    @Mock
    private CommonCodeRepository commonCodeRepository;
    @Mock
    private CommonCodeService commonCodeService;
    @Mock
    private PasswordService passwordService;
    @Mock
    private PersonalDataEncryptionUtil encryptionUtil;
    @Mock
    private ConsultantAvailabilityService consultantAvailabilityService;
    @Mock
    private ConsultationMessageService consultationMessageService;
    @Mock
    private BranchService branchService;
    @Mock
    private NotificationService notificationService;
    @Mock
    private FinancialTransactionService financialTransactionService;
    @Mock
    private CardMerchantFeeResolutionService cardMerchantFeeResolutionService;
    @Mock
    private PaymentMethodSsotService paymentMethodSsotService;
    @Mock
    private RealTimeStatisticsService realTimeStatisticsService;
    @Mock
    private FinancialTransactionRepository financialTransactionRepository;
    @Mock
    private AmountManagementService amountManagementService;
    @Mock
    private StoredProcedureService storedProcedureService;
    @Mock
    private UserRoleAssignmentRepository userRoleAssignmentRepository;
    @Mock
    private TenantRoleRepository tenantRoleRepository;
    @Mock
    private UserRoleQueryService userRoleQueryService;
    @Mock
    private StatusCodeHelper statusCodeHelper;
    @Mock
    private UserPersonalDataCacheService userPersonalDataCacheService;
    @Mock
    private ScheduleListUserFieldsResolver scheduleListUserFieldsResolver;
    @Mock
    private ConsultantStatsService consultantStatsService;
    @Mock
    private ClientStatsService clientStatsService;
    @Mock
    private NotificationChannelPreferenceResolutionService notificationChannelPreferenceResolutionService;
    @Mock
    private PasswordResetService passwordResetService;
    @Mock
    private UserIdGenerator userIdGenerator;
    @Mock
    private UserService userService;
    @Mock
    private ConsultantSalaryProfileRepository consultantSalaryProfileRepository;
    @Mock
    private ScheduleService scheduleService;
    @Mock
    private ProfessionalProviderTypeService professionalProviderTypeService;
    @Mock
    private MappingSettlementNotificationHelper mappingSettlementNotificationHelper;
    @Mock
    private BatchNotificationDispatchService batchNotificationDispatchService;
    @Mock
    private RefundAutoCancelNotificationService refundAutoCancelNotificationService;

    /** JDBC 없이 TransactionTemplate(REQUIRES_NEW) 콜백만 수행 */
    private final PlatformTransactionManager noopTransactionManager = new AbstractPlatformTransactionManager() {
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

    private AdminServiceImpl adminService;

    @BeforeEach
    void setUp() {
        AdminServiceImpl real = new AdminServiceImpl(
                userRepository,
                consultantRepository,
                clientRepository,
                mappingRepository,
                consultantRatingRepository,
                consultantRatingService,
                scheduleRepository,
                consultationRecordRepository,
                commonCodeRepository,
                commonCodeService,
                passwordService,
                encryptionUtil,
                consultantAvailabilityService,
                consultationMessageService,
                branchService,
                notificationService,
                financialTransactionService,
                cardMerchantFeeResolutionService,
                paymentMethodSsotService,
                realTimeStatisticsService,
                financialTransactionRepository,
                amountManagementService,
                storedProcedureService,
                userRoleAssignmentRepository,
                tenantRoleRepository,
                userRoleQueryService,
                statusCodeHelper,
                userPersonalDataCacheService,
                scheduleListUserFieldsResolver,
                consultantStatsService,
                clientStatsService,
                notificationChannelPreferenceResolutionService,
                passwordResetService,
                noopTransactionManager,
                userIdGenerator,
                userService,
                consultantSalaryProfileRepository,
                scheduleService,
                org.mockito.Mockito.mock(com.coresolution.consultation.service.SalaryLateSessionAutoSyncService.class),
                professionalProviderTypeService,
                mappingSettlementNotificationHelper,
                batchNotificationDispatchService,
                refundAutoCancelNotificationService,
                org.mockito.Mockito.mock(
                        com.coresolution.consultation.service.UserLifecycleService.class),
                org.mockito.Mockito.mock(
                        com.coresolution.consultation.service.AdminRequestIdempotencyService.class),
                org.mockito.Mockito.mock(com.coresolution.consultation.service.SalaryTaxRateLookupService.class));
        adminService = Mockito.spy(real);
        TenantContextHolder.setTenantId(TEST_TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("confirmDeposit 시 mapping 저장 및 createConsultationIncomeTransactionAsync 호출")
    void confirmDeposit_savesMappingAndCallsCreateConsultationIncomeTransactionAsync() {
        Long mappingId = 1L;
        ConsultantClientMapping mapping = buildMappingForConfirmDeposit(mappingId);

        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(mappingId))).thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(adminService).createConsultationIncomeTransactionAsync(any(ConsultantClientMapping.class));
        when(storedProcedureService.updateMappingInfo(any(), any(), anyDouble(), anyInt(), any()))
                .thenReturn(Map.of("success", true, "message", "OK"));

        ConsultantClientMapping result = adminService.confirmDeposit(mappingId, "REF-001");

        assertNotNull(result);
        verify(mappingRepository).save(any(ConsultantClientMapping.class));
        verify(adminService).createConsultationIncomeTransactionAsync(any(ConsultantClientMapping.class));
        verify(storedProcedureService).updateMappingInfo(any(), any(), anyDouble(), anyInt(), any());
        verify(scheduleService).finalizeTentativeSchedulesAfterDepositConfirmed(any(ConsultantClientMapping.class));
        verify(mappingSettlementNotificationHelper).notifyAfterMappingSettlement(
                any(ConsultantClientMapping.class), eq(TEST_TENANT_ID), eq(MappingSettlementScenario.DEPOSIT_CONFIRMED));
    }

    @Test
    @DisplayName("confirmDeposit: updateMappingInfo가 RuntimeException이어도 입금 확인 결과 반환")
    void confirmDeposit_returnsMappingWhenUpdateMappingInfoThrows() {
        Long mappingId = 3L;
        ConsultantClientMapping mapping = buildMappingForConfirmDeposit(mappingId);

        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(mappingId))).thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(adminService).createConsultationIncomeTransactionAsync(any(ConsultantClientMapping.class));
        when(storedProcedureService.updateMappingInfo(any(), any(), anyDouble(), anyInt(), any()))
                .thenThrow(new RuntimeException("프로시저 실패"));

        ConsultantClientMapping result = adminService.confirmDeposit(mappingId, "REF-002");

        assertNotNull(result);
        verify(mappingRepository).save(any(ConsultantClientMapping.class));
        verify(scheduleService).finalizeTentativeSchedulesAfterDepositConfirmed(any(ConsultantClientMapping.class));
    }

    @Test
    @DisplayName("confirmDeposit: 유효 금액 없으면 updateMappingInfo 미호출")
    void confirmDeposit_skipsProcedureWhenNoEffectiveAmount() {
        Long mappingId = 4L;
        ConsultantClientMapping mapping = buildMappingForConfirmDepositNoAmount(mappingId);

        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(mappingId))).thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));

        ConsultantClientMapping result = adminService.confirmDeposit(mappingId, "REF-003");

        assertNotNull(result);
        verify(storedProcedureService, never()).updateMappingInfo(any(), any(), anyDouble(), anyInt(), any());
        verify(adminService, never()).createConsultationIncomeTransactionAsync(any(ConsultantClientMapping.class));
        verify(scheduleService).finalizeTentativeSchedulesAfterDepositConfirmed(any(ConsultantClientMapping.class));
    }

    @Test
    @DisplayName("approveMapping 시 mapping 승인 저장 검증")
    void approveMapping_savesApprovedMapping() {
        Long mappingId = 2L;
        ConsultantClientMapping mapping = buildMappingForApprove(mappingId);

        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(mappingId))).thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));

        ConsultantClientMapping result = adminService.approveMapping(mappingId, "AdminName");

        assertNotNull(result);
        verify(mappingRepository).save(any(ConsultantClientMapping.class));
        assertEquals(ConsultantClientMapping.MappingStatus.ACTIVE, result.getStatus());
    }

    @Test
    @DisplayName("추가 매칭 confirmDeposit: self remaining 미채움 + 가예약 확정 스킵")
    void confirmDeposit_additionalMapping_skipsSelfRemainingAndFinalize() {
        Long mappingId = 50L;
        ConsultantClientMapping mapping = buildMappingForConfirmDeposit(mappingId);
        mapping.setNotes(String.format(AdminServiceUserFacingMessages.NOTES_ADDITIONAL_MAPPING_LINE_FMT, 103L, 10));
        mapping.setRemainingSessions(0);

        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(mappingId))).thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        when(storedProcedureService.updateMappingInfo(any(), any(), anyDouble(), anyInt(), any()))
                .thenReturn(Map.of("success", true, "message", "OK"));

        ConsultantClientMapping result = adminService.confirmDeposit(mappingId, "REF-ADD");

        assertEquals(0, result.getRemainingSessions());
        verify(scheduleService, never()).finalizeTentativeSchedulesAfterDepositConfirmed(any());
        verify(adminService, never()).createConsultationIncomeTransactionAsync(any());
    }

    @Test
    @DisplayName("추가 매칭 approveMapping: 타깃 ACTIVE addSessions + 본 행 TERMINATED + 이중 ACTIVE 없음")
    void approveMapping_mergesAdditionalIntoActiveAndTerminates() {
        Long additionalId = 60L;
        Long activeId = 103L;

        User consultant = new User();
        consultant.setId(11L);
        consultant.setTenantId(TEST_TENANT_ID);
        User client = new User();
        client.setId(21L);
        client.setTenantId(TEST_TENANT_ID);

        ConsultantClientMapping active = new ConsultantClientMapping();
        active.setId(activeId);
        active.setTenantId(TEST_TENANT_ID);
        active.setConsultant(consultant);
        active.setClient(client);
        active.setStatus(ConsultantClientMapping.MappingStatus.ACTIVE);
        active.setPackageName("기존패키지");
        active.setPackagePrice(800_000L);
        active.setTotalSessions(10);
        active.setRemainingSessions(7);
        active.setUsedSessions(3);

        ConsultantClientMapping additional = new ConsultantClientMapping();
        additional.setId(additionalId);
        additional.setTenantId(TEST_TENANT_ID);
        additional.setConsultant(consultant);
        additional.setClient(client);
        additional.setStatus(ConsultantClientMapping.MappingStatus.DEPOSIT_PENDING);
        additional.setPaymentStatus(ConsultantClientMapping.PaymentStatus.APPROVED);
        additional.setTotalSessions(5);
        additional.setRemainingSessions(0);
        additional.setUsedSessions(0);
        additional.setPackageName("추가오픈");
        additional.setNotes(String.format(
                AdminServiceUserFacingMessages.NOTES_ADDITIONAL_MAPPING_LINE_FMT, activeId, 5));

        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(additionalId)))
                .thenReturn(Optional.of(additional));
        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(activeId)))
                .thenReturn(Optional.of(active));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));

        ConsultantClientMapping result = adminService.approveMapping(additionalId, "AdminMerge");

        assertEquals(ConsultantClientMapping.MappingStatus.TERMINATED, result.getStatus());
        assertNotNull(result.getTerminatedAt());
        assertEquals(0, result.getRemainingSessions());
        assertTrue(result.getNotes().contains("추가 패키지 병합 완료"));

        assertEquals(ConsultantClientMapping.MappingStatus.ACTIVE, active.getStatus());
        assertEquals("기존패키지", active.getPackageName());
        assertEquals(15, active.getTotalSessions());
        assertEquals(12, active.getRemainingSessions());
        assertEquals(3, active.getUsedSessions());
    }

    @Test
    @DisplayName("추가 매칭 approveMapping: 타깃 ACTIVE 없으면 IllegalStateException (신규 ACTIVE 금지)")
    void approveMapping_additionalThrowsWhenTargetActiveMissing() {
        Long additionalId = 61L;
        Long missingActiveId = 999L;

        User consultant = new User();
        consultant.setId(11L);
        consultant.setTenantId(TEST_TENANT_ID);
        User client = new User();
        client.setId(21L);
        client.setTenantId(TEST_TENANT_ID);

        ConsultantClientMapping additional = new ConsultantClientMapping();
        additional.setId(additionalId);
        additional.setTenantId(TEST_TENANT_ID);
        additional.setConsultant(consultant);
        additional.setClient(client);
        additional.setStatus(ConsultantClientMapping.MappingStatus.DEPOSIT_PENDING);
        additional.setPaymentStatus(ConsultantClientMapping.PaymentStatus.APPROVED);
        additional.setTotalSessions(5);
        additional.setNotes(String.format(
                AdminServiceUserFacingMessages.NOTES_ADDITIONAL_MAPPING_LINE_FMT, missingActiveId, 5));

        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(additionalId)))
                .thenReturn(Optional.of(additional));
        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(missingActiveId)))
                .thenReturn(Optional.empty());

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> adminService.approveMapping(additionalId, "AdminMerge"));
        assertTrue(ex.getMessage().contains("활성 매칭을 찾을 수 없습니다"));
        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
    }

    private ConsultantClientMapping buildMappingForConfirmDeposit(Long mappingId) {
        User consultant = new User();
        consultant.setId(10L);
        consultant.setTenantId(TEST_TENANT_ID);
        User client = new User();
        client.setId(20L);
        client.setTenantId(TEST_TENANT_ID);

        ConsultantClientMapping m = new ConsultantClientMapping();
        m.setId(mappingId);
        m.setConsultant(consultant);
        m.setClient(client);
        m.setPackageName("테스트패키지");
        m.setPackagePrice(100000L);
        m.setTotalSessions(10);
        m.setRemainingSessions(0);
        m.setPaymentReference("PAY-REF");
        m.setPaymentStatus(ConsultantClientMapping.PaymentStatus.CONFIRMED);
        m.setStatus(ConsultantClientMapping.MappingStatus.PAYMENT_CONFIRMED);
        m.setTenantId(TEST_TENANT_ID);
        return m;
    }

    private ConsultantClientMapping buildMappingForConfirmDepositNoAmount(Long mappingId) {
        User consultant = new User();
        consultant.setId(10L);
        consultant.setTenantId(TEST_TENANT_ID);
        User client = new User();
        client.setId(20L);
        client.setTenantId(TEST_TENANT_ID);

        ConsultantClientMapping m = new ConsultantClientMapping();
        m.setId(mappingId);
        m.setConsultant(consultant);
        m.setClient(client);
        m.setPackageName("테스트패키지");
        m.setPackagePrice(0L);
        m.setTotalSessions(10);
        m.setRemainingSessions(0);
        m.setPaymentReference("PAY-REF");
        m.setPaymentStatus(ConsultantClientMapping.PaymentStatus.CONFIRMED);
        m.setStatus(ConsultantClientMapping.MappingStatus.PAYMENT_CONFIRMED);
        m.setTenantId(TEST_TENANT_ID);
        return m;
    }

    private ConsultantClientMapping buildMappingForApprove(Long mappingId) {
        User consultant = new User();
        consultant.setId(11L);
        consultant.setTenantId(TEST_TENANT_ID);
        User client = new User();
        client.setId(21L);
        client.setTenantId(TEST_TENANT_ID);

        ConsultantClientMapping m = new ConsultantClientMapping();
        m.setId(mappingId);
        m.setConsultant(consultant);
        m.setClient(client);
        m.setPackageName("패키지");
        m.setPackagePrice(100000L);
        m.setTotalSessions(10);
        m.setRemainingSessions(10);
        m.setStatus(ConsultantClientMapping.MappingStatus.DEPOSIT_PENDING);
        m.setPaymentStatus(ConsultantClientMapping.PaymentStatus.APPROVED);
        m.setTenantId(TEST_TENANT_ID);
        return m;
    }
}
