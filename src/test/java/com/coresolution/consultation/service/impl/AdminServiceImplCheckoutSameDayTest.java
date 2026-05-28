package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping.PaymentStatus;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultantRatingRepository;
import com.coresolution.consultation.repository.ConsultantRepository;
import com.coresolution.consultation.repository.ConsultantSalaryProfileRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.AmountManagementService;
import com.coresolution.consultation.service.BatchNotificationDispatchService;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.ClientStatsService;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultantAvailabilityService;
import com.coresolution.consultation.service.ConsultantRatingService;
import com.coresolution.consultation.service.ConsultantStatsService;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.MappingSettlementNotificationHelper;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.PasswordResetService;
import com.coresolution.consultation.service.ProfessionalProviderTypeService;
import com.coresolution.consultation.service.RealTimeStatisticsService;
import com.coresolution.consultation.service.RefundAutoCancelNotificationService;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.service.StoredProcedureService;
import com.coresolution.consultation.service.UserIdGenerator;
import com.coresolution.consultation.service.UserLifecycleService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.repository.TenantRoleRepository;
import com.coresolution.core.repository.UserRoleAssignmentRepository;
import com.coresolution.core.security.PasswordService;
import com.coresolution.core.service.UserRoleQueryService;
import com.coresolution.core.util.StatusCodeHelper;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 옵션 B (예약 우선 매칭) 당일 카드 결제 단일 트랜잭션 진입점 검증.
 *
 * <p>합의서: {@code docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN.md}.
 *
 * <p>매트릭스:
 * <ul>
 *   <li>단회기 (totalSessions=1, 가예약 1건): 잔여 0 + SESSIONS_EXHAUSTED, approveMapping 호출 0회</li>
 *   <li>n회 패키지 (totalSessions=10, 가예약 1건): 잔여 9 + ACTIVE, approveMapping 호출 1회</li>
 *   <li>가예약 없음 (totalSessions=10, finalize에서 차감 0회): 회기 부여만 + ACTIVE</li>
 *   <li>OCC: useSession 차감 경합 시 OptimisticLockingFailureException 전파</li>
 *   <li>tenantId 누락: IllegalStateException</li>
 *   <li>매핑 없음: RuntimeException(매칭을 찾을 수 없습니다)</li>
 *   <li>paymentStatus 이미 APPROVED: IllegalStateException</li>
 *   <li>필수 인자(method/reference/amount) 누락: IllegalArgumentException</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-05-28
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminServiceImpl 옵션 B 당일 카드 결제 (checkoutSameDayCard)")
class AdminServiceImplCheckoutSameDayTest {

    private static final String TEST_TENANT_ID = "tenant-option-b-" + UUID.randomUUID();
    private static final Long MAPPING_ID = 1001L;
    private static final Long CONSULTANT_ID = 901L;
    private static final Long CLIENT_ID = 902L;
    private static final String PAYMENT_METHOD = "CREDIT_CARD";
    private static final String PAYMENT_REFERENCE = "AUTH-12345";
    private static final Long PAYMENT_AMOUNT = 500_000L;

    @Mock private UserRepository userRepository;
    @Mock private ConsultantRepository consultantRepository;
    @Mock private ClientRepository clientRepository;
    @Mock private ConsultantClientMappingRepository mappingRepository;
    @Mock private ConsultantRatingRepository consultantRatingRepository;
    @Mock private ConsultantRatingService consultantRatingService;
    @Mock private ScheduleRepository scheduleRepository;
    @Mock private CommonCodeRepository commonCodeRepository;
    @Mock private CommonCodeService commonCodeService;
    @Mock private PasswordService passwordService;
    @Mock private PersonalDataEncryptionUtil encryptionUtil;
    @Mock private ConsultantAvailabilityService consultantAvailabilityService;
    @Mock private ConsultationMessageService consultationMessageService;
    @Mock private BranchService branchService;
    @Mock private NotificationService notificationService;
    @Mock private FinancialTransactionService financialTransactionService;
    @Mock private RealTimeStatisticsService realTimeStatisticsService;
    @Mock private FinancialTransactionRepository financialTransactionRepository;
    @Mock private AmountManagementService amountManagementService;
    @Mock private StoredProcedureService storedProcedureService;
    @Mock private UserRoleAssignmentRepository userRoleAssignmentRepository;
    @Mock private TenantRoleRepository tenantRoleRepository;
    @Mock private UserRoleQueryService userRoleQueryService;
    @Mock private StatusCodeHelper statusCodeHelper;
    @Mock private UserPersonalDataCacheService userPersonalDataCacheService;
    @Mock private ScheduleListUserFieldsResolver scheduleListUserFieldsResolver;
    @Mock private ConsultantStatsService consultantStatsService;
    @Mock private ClientStatsService clientStatsService;
    @Mock private NotificationChannelPreferenceResolutionService notificationChannelPreferenceResolutionService;
    @Mock private PasswordResetService passwordResetService;
    @Mock private UserIdGenerator userIdGenerator;
    @Mock private UserService userService;
    @Mock private ConsultantSalaryProfileRepository consultantSalaryProfileRepository;
    @Mock private ScheduleService scheduleService;
    @Mock private ProfessionalProviderTypeService professionalProviderTypeService;
    @Mock private MappingSettlementNotificationHelper mappingSettlementNotificationHelper;
    @Mock private BatchNotificationDispatchService batchNotificationDispatchService;
    @Mock private RefundAutoCancelNotificationService refundAutoCancelNotificationService;
    @Mock private UserLifecycleService userLifecycleService;
    @Mock private com.coresolution.consultation.service.AdminRequestIdempotencyService adminRequestIdempotencyService;

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

    private AdminServiceImpl realService;
    private AdminServiceImpl spyService;

    @BeforeEach
    void setUp() {
        realService = new AdminServiceImpl(
                userRepository,
                consultantRepository,
                clientRepository,
                mappingRepository,
                consultantRatingRepository,
                consultantRatingService,
                scheduleRepository,
                commonCodeRepository,
                commonCodeService,
                passwordService,
                encryptionUtil,
                consultantAvailabilityService,
                consultationMessageService,
                branchService,
                notificationService,
                financialTransactionService,
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
                professionalProviderTypeService,
                mappingSettlementNotificationHelper,
                batchNotificationDispatchService,
                refundAutoCancelNotificationService,
                userLifecycleService,
                adminRequestIdempotencyService);
        spyService = Mockito.spy(realService);
        TenantContextHolder.setTenantId(TEST_TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("단회기 (totalSessions=1, 가예약 1건): 차감 후 SESSIONS_EXHAUSTED → approveMapping 호출 0회")
    void checkoutSameDayCard_singleSessionPackage_skipsApproveAfterExhaustion() {
        ConsultantClientMapping initial = newPendingPaymentMapping(1, 0, 0);
        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(MAPPING_ID)))
                .thenReturn(Optional.of(initial));

        ConsultantClientMapping afterPayment = newPaymentConfirmedMapping(1, 0, 0);
        doReturn(afterPayment).when(spyService).confirmPayment(
                eq(MAPPING_ID), eq(PAYMENT_METHOD), eq(PAYMENT_REFERENCE), eq(PAYMENT_AMOUNT));

        // confirmDeposit 모의: 단회기 + 가예약 1건 차감 후 잔여 0 + SESSIONS_EXHAUSTED
        ConsultantClientMapping afterDeposit = newMapping(
                MappingStatus.SESSIONS_EXHAUSTED, PaymentStatus.APPROVED, 1, 1, 0);
        doReturn(afterDeposit).when(spyService).confirmDeposit(eq(MAPPING_ID), eq(PAYMENT_REFERENCE));

        ConsultantClientMapping result = spyService.checkoutSameDayCard(
                MAPPING_ID, PAYMENT_METHOD, PAYMENT_REFERENCE, PAYMENT_AMOUNT, null);

        assertThat(result.getStatus()).isEqualTo(MappingStatus.SESSIONS_EXHAUSTED);
        assertThat(result.getRemainingSessions()).isZero();
        assertThat(result.getUsedSessions()).isEqualTo(1);

        verify(spyService).confirmPayment(MAPPING_ID, PAYMENT_METHOD, PAYMENT_REFERENCE, PAYMENT_AMOUNT);
        verify(spyService).confirmDeposit(MAPPING_ID, PAYMENT_REFERENCE);
        verify(spyService, never()).approveMapping(anyLong(), anyString());
    }

    @Test
    @DisplayName("n회 패키지 (totalSessions=10, 가예약 1건): 잔여 9 + ACTIVE → approveMapping 호출 1회")
    void checkoutSameDayCard_multiSessionPackage_callsApproveAfterDeduction() {
        ConsultantClientMapping initial = newPendingPaymentMapping(10, 0, 0);
        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(MAPPING_ID)))
                .thenReturn(Optional.of(initial));

        ConsultantClientMapping afterPayment = newPaymentConfirmedMapping(10, 0, 0);
        doReturn(afterPayment).when(spyService).confirmPayment(
                eq(MAPPING_ID), eq(PAYMENT_METHOD), eq(PAYMENT_REFERENCE), eq(PAYMENT_AMOUNT));

        ConsultantClientMapping afterDeposit = newMapping(
                MappingStatus.DEPOSIT_PENDING, PaymentStatus.APPROVED, 10, 1, 9);
        doReturn(afterDeposit).when(spyService).confirmDeposit(eq(MAPPING_ID), eq(PAYMENT_REFERENCE));

        ConsultantClientMapping approved = newMapping(
                MappingStatus.ACTIVE, PaymentStatus.APPROVED, 10, 1, 9);
        doReturn(approved).when(spyService).approveMapping(eq(MAPPING_ID), eq("SYSTEM_AUTO_OPTION_B"));

        ConsultantClientMapping result = spyService.checkoutSameDayCard(
                MAPPING_ID, PAYMENT_METHOD, PAYMENT_REFERENCE, PAYMENT_AMOUNT, null);

        assertThat(result.getStatus()).isEqualTo(MappingStatus.ACTIVE);
        assertThat(result.getRemainingSessions()).isEqualTo(9);
        assertThat(result.getUsedSessions()).isEqualTo(1);

        verify(spyService).approveMapping(MAPPING_ID, "SYSTEM_AUTO_OPTION_B");
    }

    @Test
    @DisplayName("가예약 없음: 회기 부여만 (차감 0회) + ACTIVE → approveMapping 호출 1회")
    void checkoutSameDayCard_noTentativeSchedule_grantsOnlyAndActivates() {
        ConsultantClientMapping initial = newPendingPaymentMapping(10, 0, 0);
        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(MAPPING_ID)))
                .thenReturn(Optional.of(initial));

        doReturn(newPaymentConfirmedMapping(10, 0, 0)).when(spyService).confirmPayment(
                eq(MAPPING_ID), eq(PAYMENT_METHOD), eq(PAYMENT_REFERENCE), eq(PAYMENT_AMOUNT));

        // 가예약 없음 → finalize에서 차감 0회 → 회기 부여만 (잔여 10)
        ConsultantClientMapping afterDeposit = newMapping(
                MappingStatus.DEPOSIT_PENDING, PaymentStatus.APPROVED, 10, 0, 10);
        doReturn(afterDeposit).when(spyService).confirmDeposit(eq(MAPPING_ID), eq(PAYMENT_REFERENCE));

        ConsultantClientMapping approved = newMapping(
                MappingStatus.ACTIVE, PaymentStatus.APPROVED, 10, 0, 10);
        doReturn(approved).when(spyService).approveMapping(eq(MAPPING_ID), eq("SYSTEM_AUTO_OPTION_B"));

        ConsultantClientMapping result = spyService.checkoutSameDayCard(
                MAPPING_ID, PAYMENT_METHOD, PAYMENT_REFERENCE, PAYMENT_AMOUNT, null);

        assertThat(result.getStatus()).isEqualTo(MappingStatus.ACTIVE);
        assertThat(result.getRemainingSessions()).isEqualTo(10);
        assertThat(result.getUsedSessions()).isZero();
        verify(spyService, times(1)).approveMapping(MAPPING_ID, "SYSTEM_AUTO_OPTION_B");
    }

    @Test
    @DisplayName("OCC: confirmDeposit 단계의 useSession 차감 경합 시 OptimisticLockingFailureException 전파")
    void checkoutSameDayCard_optimisticLockingConflict_propagates() {
        ConsultantClientMapping initial = newPendingPaymentMapping(10, 0, 0);
        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(MAPPING_ID)))
                .thenReturn(Optional.of(initial));

        doReturn(newPaymentConfirmedMapping(10, 0, 0)).when(spyService).confirmPayment(
                eq(MAPPING_ID), eq(PAYMENT_METHOD), eq(PAYMENT_REFERENCE), eq(PAYMENT_AMOUNT));
        doThrow(new OptimisticLockingFailureException("동시 차감 충돌"))
                .when(spyService).confirmDeposit(eq(MAPPING_ID), eq(PAYMENT_REFERENCE));

        assertThatThrownBy(() -> spyService.checkoutSameDayCard(
                MAPPING_ID, PAYMENT_METHOD, PAYMENT_REFERENCE, PAYMENT_AMOUNT, null))
                .isInstanceOf(OptimisticLockingFailureException.class);

        verify(spyService, never()).approveMapping(anyLong(), anyString());
    }

    @Test
    @DisplayName("tenantId 누락: IllegalStateException")
    void checkoutSameDayCard_missingTenantId_throwsIllegalStateException() {
        TenantContextHolder.clear();

        assertThatThrownBy(() -> spyService.checkoutSameDayCard(
                MAPPING_ID, PAYMENT_METHOD, PAYMENT_REFERENCE, PAYMENT_AMOUNT, null))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("매핑 없음: RuntimeException (매칭을 찾을 수 없습니다)")
    void checkoutSameDayCard_mappingNotFound_throwsRuntimeException() {
        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(MAPPING_ID)))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> spyService.checkoutSameDayCard(
                MAPPING_ID, PAYMENT_METHOD, PAYMENT_REFERENCE, PAYMENT_AMOUNT, null))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("매칭");
    }

    @Test
    @DisplayName("paymentStatus 이미 APPROVED: IllegalStateException")
    void checkoutSameDayCard_alreadyApproved_throwsIllegalStateException() {
        ConsultantClientMapping initial = newMapping(
                MappingStatus.ACTIVE, PaymentStatus.APPROVED, 10, 0, 10);
        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(MAPPING_ID)))
                .thenReturn(Optional.of(initial));

        assertThatThrownBy(() -> spyService.checkoutSameDayCard(
                MAPPING_ID, PAYMENT_METHOD, PAYMENT_REFERENCE, PAYMENT_AMOUNT, null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("이미 승인된 결제입니다");

        verify(spyService, never()).confirmPayment(anyLong(), anyString(), anyString(), anyLong());
        verify(spyService, never()).confirmDeposit(anyLong(), anyString());
        verify(spyService, never()).approveMapping(anyLong(), anyString());
    }

    @Test
    @DisplayName("필수 인자(paymentMethod) 누락: IllegalArgumentException")
    void checkoutSameDayCard_blankPaymentMethod_throwsIllegalArgumentException() {
        assertThatThrownBy(() -> spyService.checkoutSameDayCard(
                MAPPING_ID, "  ", PAYMENT_REFERENCE, PAYMENT_AMOUNT, null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("필수 인자(paymentReference) 누락: IllegalArgumentException")
    void checkoutSameDayCard_nullPaymentReference_throwsIllegalArgumentException() {
        assertThatThrownBy(() -> spyService.checkoutSameDayCard(
                MAPPING_ID, PAYMENT_METHOD, null, PAYMENT_AMOUNT, null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("paymentAmount <= 0: IllegalArgumentException")
    void checkoutSameDayCard_nonPositiveAmount_throwsIllegalArgumentException() {
        assertThatThrownBy(() -> spyService.checkoutSameDayCard(
                MAPPING_ID, PAYMENT_METHOD, PAYMENT_REFERENCE, 0L, null))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> spyService.checkoutSameDayCard(
                MAPPING_ID, PAYMENT_METHOD, PAYMENT_REFERENCE, -100L, null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("호출 순서: confirmPayment → confirmDeposit → approveMapping (성공 분기)")
    void checkoutSameDayCard_callOrder_paymentDepositApprove() {
        ConsultantClientMapping initial = newPendingPaymentMapping(10, 0, 0);
        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(MAPPING_ID)))
                .thenReturn(Optional.of(initial));

        doReturn(newPaymentConfirmedMapping(10, 0, 0)).when(spyService).confirmPayment(
                eq(MAPPING_ID), eq(PAYMENT_METHOD), eq(PAYMENT_REFERENCE), eq(PAYMENT_AMOUNT));
        doReturn(newMapping(MappingStatus.DEPOSIT_PENDING, PaymentStatus.APPROVED, 10, 1, 9))
                .when(spyService).confirmDeposit(eq(MAPPING_ID), eq(PAYMENT_REFERENCE));
        doReturn(newMapping(MappingStatus.ACTIVE, PaymentStatus.APPROVED, 10, 1, 9))
                .when(spyService).approveMapping(eq(MAPPING_ID), eq("SYSTEM_AUTO_OPTION_B"));

        spyService.checkoutSameDayCard(
                MAPPING_ID, PAYMENT_METHOD, PAYMENT_REFERENCE, PAYMENT_AMOUNT, null);

        org.mockito.InOrder inOrder = Mockito.inOrder(spyService);
        inOrder.verify(spyService).confirmPayment(MAPPING_ID, PAYMENT_METHOD, PAYMENT_REFERENCE, PAYMENT_AMOUNT);
        inOrder.verify(spyService).confirmDeposit(MAPPING_ID, PAYMENT_REFERENCE);
        inOrder.verify(spyService).approveMapping(MAPPING_ID, "SYSTEM_AUTO_OPTION_B");
    }

    /**
     * 결제 대기 상태(PENDING_PAYMENT, PaymentStatus.PENDING)의 mapping 매핑 인스턴스를 생성한다.
     */
    private ConsultantClientMapping newPendingPaymentMapping(int total, int used, int remaining) {
        return newMapping(MappingStatus.PENDING_PAYMENT, PaymentStatus.PENDING, total, used, remaining);
    }

    /**
     * 결제 확인 상태(PAYMENT_CONFIRMED, PaymentStatus.CONFIRMED)의 mapping 인스턴스를 생성한다.
     */
    private ConsultantClientMapping newPaymentConfirmedMapping(int total, int used, int remaining) {
        return newMapping(MappingStatus.PAYMENT_CONFIRMED, PaymentStatus.CONFIRMED, total, used, remaining);
    }

    private ConsultantClientMapping newMapping(MappingStatus status, PaymentStatus paymentStatus,
            int total, int used, int remaining) {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(MAPPING_ID);
        mapping.setTenantId(TEST_TENANT_ID);
        mapping.setStatus(status);
        mapping.setPaymentStatus(paymentStatus);
        mapping.setTotalSessions(total);
        mapping.setUsedSessions(used);
        mapping.setRemainingSessions(remaining);
        mapping.setPackageName("test-package");
        mapping.setPackagePrice(PAYMENT_AMOUNT);

        User consultant = new User();
        consultant.setId(CONSULTANT_ID);
        consultant.setTenantId(TEST_TENANT_ID);
        mapping.setConsultant(consultant);

        User client = new User();
        client.setId(CLIENT_ID);
        client.setTenantId(TEST_TENANT_ID);
        mapping.setClient(client);

        return mapping;
    }
}
