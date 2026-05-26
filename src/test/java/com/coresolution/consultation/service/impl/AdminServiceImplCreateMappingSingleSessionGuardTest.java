package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.ConsultantClientMappingCreateRequest;
import com.coresolution.consultation.entity.ConsultantClientMapping;
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
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.service.StoredProcedureService;
import com.coresolution.consultation.service.UserIdGenerator;
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
import java.util.Collections;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 단회기({@code total_sessions == 1}) 신규 매핑 환영 메시지 차단 가드 검증.
 *
 * <p>비즈니스 룰 (SSOT: {@code docs/standards/NOTIFICATION_BUSINESS_RULES.md}):
 * <ul>
 *   <li>단회기 빈도가 높아 매번 {@code CLIENT_WELCOME_FIRST} 를 발송하면 스팸이 되므로 차단.</li>
 *   <li>차단 범위: 모든 채널(SMS/알림톡/인앱/푸시) 일괄.</li>
 *   <li>차단 위치: {@code AdminServiceImpl.createMapping} 호출자 가드(옵션 A).</li>
 *   <li>{@code RESERVATION_IMMEDIATE_SINGLE} (예약 안내) 은 유지(본 테스트 범위 외).</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminServiceImpl 단회기 환영 메시지 차단 가드")
class AdminServiceImplCreateMappingSingleSessionGuardTest {

    private static final String TEST_TENANT_ID = "tenant-single-welcome-" + UUID.randomUUID();
    private static final Long CONSULTANT_ID = 901L;
    private static final Long CLIENT_ID = 902L;

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
        adminService = new AdminServiceImpl(
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
                batchNotificationDispatchService);
        TenantContextHolder.setTenantId(TEST_TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("totalSessions=1: dispatchClientWelcomeFirst 호출 0회 (모든 채널 차단)")
    void createMapping_whenSingleSession_skipsWelcomeDispatch() {
        ConsultantClientMappingCreateRequest dto = newRequest(1);
        stubMappingCreate();

        adminService.createMapping(dto);

        verify(batchNotificationDispatchService, never()).dispatchClientWelcomeFirst(anyLong());
        // 같은 위치에서 인앱/푸시 호출은 존재하지 않으므로 함께 발송되지 않는지도 확인 (모든 채널 차단).
        verify(consultationMessageService, never()).sendMessage(any(), any(), any(), any(), any(), any(), any(), any(),
                any());
    }

    @Test
    @DisplayName("totalSessions=2: dispatchClientWelcomeFirst 정상 호출 (단회기 아님)")
    void createMapping_whenMultiSession_dispatchesWelcome() {
        ConsultantClientMappingCreateRequest dto = newRequest(2);
        stubMappingCreate();

        adminService.createMapping(dto);

        verify(batchNotificationDispatchService, times(1)).dispatchClientWelcomeFirst(anyLong());
    }

    @Test
    @DisplayName("totalSessions=null: 기본값(10) 적용되어 단회기 아님 → dispatchClientWelcomeFirst 정상 호출")
    void createMapping_whenNullSessions_dispatchesWelcome() {
        ConsultantClientMappingCreateRequest dto = newRequest(null);
        stubMappingCreate();

        adminService.createMapping(dto);

        verify(batchNotificationDispatchService, times(1)).dispatchClientWelcomeFirst(anyLong());
    }

    @Test
    @DisplayName("totalSessions=1 + 같은 위치 인앱/푸시 채널도 호출되지 않음 (모든 채널 차단 보장)")
    void createMapping_whenSingleSession_noChannelDispatchAtAll() {
        ConsultantClientMappingCreateRequest dto = newRequest(1);
        stubMappingCreate();

        adminService.createMapping(dto);

        // CLIENT_WELCOME_FIRST 알림톡/SMS 발송 = 0
        verify(batchNotificationDispatchService, never()).dispatchClientWelcomeFirst(anyLong());
        // 인앱 메시지 발송 = 0 (createMapping 같은 위치 호출 없음 + 가드도 묶음 차단)
        verify(consultationMessageService, never()).sendMessage(any(), any(), any(), any(), any(), any(), any(), any(),
                any());
        // 정산 헬퍼(매핑 승인/입금 알림) 도 호출되지 않음 (createMapping 단계 — 결제 확정 전)
        verify(mappingSettlementNotificationHelper, never()).notifyAfterMappingSettlement(any(), any(), any());
    }

    private ConsultantClientMappingCreateRequest newRequest(Integer totalSessions) {
        ConsultantClientMappingCreateRequest dto = new ConsultantClientMappingCreateRequest();
        dto.setConsultantId(CONSULTANT_ID);
        dto.setClientId(CLIENT_ID);
        dto.setTotalSessions(totalSessions);
        dto.setPackageName("test-package");
        dto.setPackagePrice(50_000L);
        dto.setStatus(ConsultantClientMapping.MappingStatus.PENDING_PAYMENT.name());
        dto.setPaymentStatus(ConsultantClientMapping.PaymentStatus.PENDING.name());
        return dto;
    }

    /**
     * 매핑 생성 흐름의 외부 의존성을 stubbing 하고, {@code save(...)} 시 입력 매핑을 그대로 반환한다.
     */
    private void stubMappingCreate() {
        User consultant = new User();
        consultant.setId(CONSULTANT_ID);
        consultant.setTenantId(TEST_TENANT_ID);
        consultant.setRole(UserRole.CONSULTANT);

        User client = new User();
        client.setId(CLIENT_ID);
        client.setTenantId(TEST_TENANT_ID);
        client.setRole(UserRole.CLIENT);

        when(userRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(CONSULTANT_ID)))
                .thenReturn(Optional.of(consultant));
        when(userRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(CLIENT_ID)))
                .thenReturn(Optional.of(client));
        when(mappingRepository.findByTenantIdAndConsultantAndClient(eq(TEST_TENANT_ID), eq(consultant), eq(client)))
                .thenReturn(Collections.emptyList());
        // statusCodeHelper / commonCodeService 는 stubbing 하지 않음.
        // getMappingStatusCode / getPaymentStatusCode 가 null 폴백 후 enum 이름 그대로 반환하므로
        // MappingStatus.PENDING_PAYMENT / PaymentStatus.PENDING 으로 정상 파싱됨.

        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> {
            ConsultantClientMapping m = inv.getArgument(0);
            if (m.getId() == null) {
                m.setId(777L);
            }
            return m;
        });
    }
}
