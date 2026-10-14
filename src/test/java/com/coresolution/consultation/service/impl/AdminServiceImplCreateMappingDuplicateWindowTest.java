package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.dto.ConsultantClientMappingCreateRequest;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultantRatingRepository;
import com.coresolution.consultation.repository.ConsultantRepository;
import com.coresolution.consultation.repository.ConsultantSalaryProfileRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
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
import com.coresolution.consultation.service.erp.financial.CardMerchantFeeResolutionService;
import com.coresolution.consultation.service.PaymentMethodSsotService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.repository.TenantRoleRepository;
import com.coresolution.core.repository.UserRoleAssignmentRepository;
import com.coresolution.core.security.PasswordService;
import com.coresolution.core.service.UserRoleQueryService;
import com.coresolution.core.util.StatusCodeHelper;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 관리자 수동 배정(createMappingFromAdmin) 짧은 시간창 내 동일 상품 중복 생성 가드 검증.
 *
 * <p>요구사항: 같은 tenant + 상담사 + 내담자 + 동일 packageName(trim 정규화) 매칭이 짧은 시간창
 * (기본 30초) 안에 이미 있으면 신규 생성을 거부한다. 서로 다른 packageName 은 짧은 시간 안에도
 * 허용된다. 결제·환불·ERP·회기 차감 로직은 검증 대상이 아니다.</p>
 *
 * <p>가드는 관리자 수동 배정 경로({@code createMappingFromAdmin})에만 적용되며, 결제 확정
 * (PaymentServiceImpl) 등 기존 호출자가 쓰는 {@code createMapping}에는 적용되지 않는다
 * (부분 성공 방지, #1616 후속).</p>
 *
 * @author MindGarden
 * @since 2026-10-14
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminServiceImpl createMappingFromAdmin 짧은 시간창 중복 생성 가드")
class AdminServiceImplCreateMappingDuplicateWindowTest {

    private static final String TEST_TENANT_ID = "tenant-duplicate-window-" + UUID.randomUUID();
    private static final Long CONSULTANT_ID = 701L;
    private static final Long CLIENT_ID = 702L;

    @Mock private UserRepository userRepository;
    @Mock private ConsultantRepository consultantRepository;
    @Mock private ClientRepository clientRepository;
    @Mock private ConsultantClientMappingRepository mappingRepository;
    @Mock private ConsultantRatingRepository consultantRatingRepository;
    @Mock private ConsultantRatingService consultantRatingService;
    @Mock private ScheduleRepository scheduleRepository;
    @Mock private ConsultationRecordRepository consultationRecordRepository;
    @Mock private CommonCodeRepository commonCodeRepository;
    @Mock private CommonCodeService commonCodeService;
    @Mock private PasswordService passwordService;
    @Mock private PersonalDataEncryptionUtil encryptionUtil;
    @Mock private ConsultantAvailabilityService consultantAvailabilityService;
    @Mock private ConsultationMessageService consultationMessageService;
    @Mock private BranchService branchService;
    @Mock private NotificationService notificationService;
    @Mock private FinancialTransactionService financialTransactionService;
    @Mock private CardMerchantFeeResolutionService cardMerchantFeeResolutionService;
    @Mock private PaymentMethodSsotService paymentMethodSsotService;
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
    private User consultant;
    private User client;

    @BeforeEach
    void setUp() {
        adminService = new AdminServiceImpl(
                userRepository, consultantRepository, clientRepository, mappingRepository,
                consultantRatingRepository, consultantRatingService, scheduleRepository,
                consultationRecordRepository,
                commonCodeRepository, commonCodeService, passwordService, encryptionUtil,
                consultantAvailabilityService, consultationMessageService, branchService,
                notificationService, financialTransactionService, cardMerchantFeeResolutionService, paymentMethodSsotService, realTimeStatisticsService,
                financialTransactionRepository, amountManagementService, storedProcedureService,
                userRoleAssignmentRepository, tenantRoleRepository, userRoleQueryService,
                statusCodeHelper, userPersonalDataCacheService, scheduleListUserFieldsResolver,
                consultantStatsService, clientStatsService,
                notificationChannelPreferenceResolutionService, passwordResetService,
                noopTransactionManager, userIdGenerator, userService,
                consultantSalaryProfileRepository, scheduleService, org.mockito.Mockito.mock(com.coresolution.consultation.service.SalaryLateSessionAutoSyncService.class), professionalProviderTypeService,
                mappingSettlementNotificationHelper, batchNotificationDispatchService,
                refundAutoCancelNotificationService, userLifecycleService,
                org.mockito.Mockito.mock(
                        com.coresolution.consultation.service.AdminRequestIdempotencyService.class),
                org.mockito.Mockito.mock(com.coresolution.consultation.service.SalaryTaxRateLookupService.class),
                null,
                org.mockito.Mockito.mock(com.coresolution.consultation.repository.InstitutionLinkContractRepository.class),
                org.mockito.Mockito.mock(com.coresolution.consultation.repository.ShopClientOrderLineRepository.class),
                org.mockito.Mockito.mock(com.coresolution.consultation.repository.PaymentRepository.class));
        TenantContextHolder.setTenantId(TEST_TENANT_ID);

        consultant = new User();
        consultant.setId(CONSULTANT_ID);
        consultant.setTenantId(TEST_TENANT_ID);
        consultant.setRole(UserRole.CONSULTANT);
        consultant.setName("테스트상담사");

        client = new User();
        client.setId(CLIENT_ID);
        client.setTenantId(TEST_TENANT_ID);
        client.setRole(UserRole.CLIENT);
        client.setName("테스트내담자");

        when(userRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(CONSULTANT_ID)))
                .thenReturn(Optional.of(consultant));
        when(userRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(CLIENT_ID)))
                .thenReturn(Optional.of(client));
        org.mockito.Mockito.lenient().when(userRepository.lockClientRowForMappingCreate(eq(TEST_TENANT_ID), eq(CLIENT_ID)))
                .thenReturn(List.of(CLIENT_ID));
        when(mappingRepository.findByTenantIdAndConsultantAndClientAndStatusIn(
                eq(TEST_TENANT_ID), eq(consultant), eq(client), anyCollection()))
                .thenReturn(List.<ConsultantClientMapping>of());
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> {
            ConsultantClientMapping m = inv.getArgument(0);
            if (m.getId() == null) {
                m.setId(999L);
            }
            return m;
        });
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private ConsultantClientMappingCreateRequest newRequest(String packageName) {
        ConsultantClientMappingCreateRequest dto = new ConsultantClientMappingCreateRequest();
        dto.setConsultantId(CONSULTANT_ID);
        dto.setClientId(CLIENT_ID);
        dto.setTotalSessions(10);
        dto.setPackageName(packageName);
        dto.setPackagePrice(50_000L);
        dto.setStatus(MappingStatus.PENDING_PAYMENT.name());
        dto.setPaymentStatus(ConsultantClientMapping.PaymentStatus.PENDING.name());
        return dto;
    }

    @Test
    @DisplayName("동일 상담사·내담자·동일 packageName — 두 번째 생성 시 짧은 시간창 내 중복으로 거부(save 1회만)")
    void createMappingFromAdmin_sameConsultantClientAndPackageName_rejectsSecondCallWithinWindow() {
        when(mappingRepository
                .existsByTenantIdAndConsultant_IdAndClient_IdAndPackageNameAndCreatedAtGreaterThanEqual(
                        eq(TEST_TENANT_ID), eq(CONSULTANT_ID), eq(CLIENT_ID), eq("표준 패키지"), any()))
                .thenReturn(false, true);

        adminService.createMappingFromAdmin(newRequest("표준 패키지"));

        assertThatThrownBy(() -> adminService.createMappingFromAdmin(newRequest("표준 패키지")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(AdminServiceUserFacingMessages.MSG_MAPPING_CREATE_DUPLICATE_WINDOW);

        verify(mappingRepository, times(1)).save(any(ConsultantClientMapping.class));
    }

    @Test
    @DisplayName("동일 상담사·내담자·서로 다른 packageName — 두 번 모두 저장 성공")
    void createMappingFromAdmin_differentPackageNames_bothSucceed() {
        when(mappingRepository
                .existsByTenantIdAndConsultant_IdAndClient_IdAndPackageNameAndCreatedAtGreaterThanEqual(
                        eq(TEST_TENANT_ID), eq(CONSULTANT_ID), eq(CLIENT_ID), any(String.class), any()))
                .thenReturn(false);

        ConsultantClientMapping first = adminService.createMappingFromAdmin(newRequest("표준 패키지"));
        ConsultantClientMapping second = adminService.createMappingFromAdmin(newRequest("프리미엄 패키지"));

        assertThat(first.getPackageName()).isEqualTo("표준 패키지");
        assertThat(second.getPackageName()).isEqualTo("프리미엄 패키지");
        verify(mappingRepository, times(2)).save(any(ConsultantClientMapping.class));
    }

    @Test
    @DisplayName("packageName 앞뒤 공백은 trim 후 비교 — 공백만 다른 동일 상품은 중복으로 거부")
    void createMappingFromAdmin_packageNameWhitespaceTrimmed_treatedAsDuplicate() {
        when(mappingRepository
                .existsByTenantIdAndConsultant_IdAndClient_IdAndPackageNameAndCreatedAtGreaterThanEqual(
                        eq(TEST_TENANT_ID), eq(CONSULTANT_ID), eq(CLIENT_ID), eq("표준 패키지"), any()))
                .thenReturn(false, true);

        adminService.createMappingFromAdmin(newRequest("표준 패키지"));

        assertThatThrownBy(() -> adminService.createMappingFromAdmin(newRequest("  표준 패키지  ")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(AdminServiceUserFacingMessages.MSG_MAPPING_CREATE_DUPLICATE_WINDOW);

        verify(mappingRepository, times(1)).save(any(ConsultantClientMapping.class));
    }

    @Test
    @DisplayName("동일 상담사·내담자·동일 packageName — 30초 경과(창 밖) 후 재요청은 두 번째도 성공(save 2회)")
    void createMappingFromAdmin_secondCallAfterWindowElapsed_bothSucceed() {
        // exists 쿼리가 창 밖(false)을 반환하도록 모킹 — 첫 생성 후 30초가 지나 창이 닫힌 상황을 흉내낸다.
        when(mappingRepository
                .existsByTenantIdAndConsultant_IdAndClient_IdAndPackageNameAndCreatedAtGreaterThanEqual(
                        eq(TEST_TENANT_ID), eq(CONSULTANT_ID), eq(CLIENT_ID), eq("표준 패키지"), any()))
                .thenReturn(false, false);

        ConsultantClientMapping first = adminService.createMappingFromAdmin(newRequest("표준 패키지"));
        ConsultantClientMapping second = adminService.createMappingFromAdmin(newRequest("표준 패키지"));

        assertThat(first.getPackageName()).isEqualTo("표준 패키지");
        assertThat(second.getPackageName()).isEqualTo("표준 패키지");
        verify(mappingRepository, times(2)).save(any(ConsultantClientMapping.class));
    }

    @Test
    @DisplayName("createMappingFromAdmin — 내담자 행 잠금(lockClientRowForMappingCreate)을 호출한다")
    void createMappingFromAdmin_locksClientRow() {
        when(mappingRepository
                .existsByTenantIdAndConsultant_IdAndClient_IdAndPackageNameAndCreatedAtGreaterThanEqual(
                        eq(TEST_TENANT_ID), eq(CONSULTANT_ID), eq(CLIENT_ID), any(String.class), any()))
                .thenReturn(false);

        adminService.createMappingFromAdmin(newRequest("표준 패키지"));

        verify(userRepository).lockClientRowForMappingCreate(TEST_TENANT_ID, CLIENT_ID);
    }

    @Test
    @DisplayName("createMapping(비관리자, 결제 경로) — 짧은 시간창 중복 가드 미적용: exists 호출 없음, 중복이어도 save 성공")
    void createMapping_paymentPath_doesNotApplyDuplicateWindowGuard() {
        ConsultantClientMapping first = adminService.createMapping(newRequest("표준 패키지"));
        ConsultantClientMapping second = adminService.createMapping(newRequest("표준 패키지"));

        assertThat(first.getPackageName()).isEqualTo("표준 패키지");
        assertThat(second.getPackageName()).isEqualTo("표준 패키지");
        verify(mappingRepository, times(2)).save(any(ConsultantClientMapping.class));
        verify(mappingRepository, org.mockito.Mockito.never())
                .existsByTenantIdAndConsultant_IdAndClient_IdAndPackageNameAndCreatedAtGreaterThanEqual(
                        any(), any(), any(), any(), any());
        verify(userRepository, org.mockito.Mockito.never())
                .lockClientRowForMappingCreate(any(), any());
    }
}
