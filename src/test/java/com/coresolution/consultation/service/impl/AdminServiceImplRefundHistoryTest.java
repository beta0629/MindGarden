package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
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
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * AdminServiceImpl#getRefundHistory P0 핫픽스 회귀 가드 테스트 (옵션 A).
 *
 * <p>P0 hotfix 2026-05-29: 운영 /erp/refund-management 5월 환불 0건 표시 결함(H11) 차단.
 * 운영 financial_transactions 에 CONSULTATION_REFUND (전체환불) + CONSULTATION_PARTIAL_REFUND
 * (부분환불) 가 동일 매핑(67/72)에 동시에 기록되어 있는데, 기존 코드는 partial 분기에서
 * "CONSULTATION_PARTIAL_REFUND" 단일 값만 조회하여 전체환불이 어느 분기에도 카운팅되지 않는
 * 결함을 보유했다. 본 테스트는 다음을 보장한다:
 *
 * <ol>
 *   <li>동일 매핑에 CONSULTATION_REFUND + CONSULTATION_PARTIAL_REFUND 둘 다 있으면
 *       mapping_id 단위로 1건만 반환되고 CONSULTATION_REFUND (전체환불) 가 우선된다</li>
 *   <li>CONSULTATION_REFUND 만 있어도 1건 반환된다 (기존 결함이라면 0건 반환)</li>
 *   <li>CONSULTATION_PARTIAL_REFUND 만 있어도 1건 반환된다 (회귀 가드)</li>
 *   <li>서로 다른 매핑은 각각 1건씩 반환된다 (dedup 이 매핑 간 침범 금지)</li>
 *   <li>repository 호출 시 tenantId 가 호출자(컨트롤러) tenantId 와 일치한다 (멀티테넌트 격리)</li>
 *   <li>repository 가 빈 결과 (is_deleted=1 케이스 시뮬레이션) 를 반환하면 화면도 0건</li>
 * </ol>
 *
 * <p>디버그 보고서: docs/project-management/2026-05-29/REFUND_MANAGEMENT_MAY_MISSING_DEBUG.md</p>
 *
 * @author MindGarden
 * @since 2026-05-29 P0 hotfix
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AdminServiceImpl getRefundHistory P0 hotfix (CONSULTATION_REFUND IN + mapping dedup) 테스트")
class AdminServiceImplRefundHistoryTest {

    private static final String TEST_TENANT_ID = "tenant-incheon-counseling-001";
    private static final String OTHER_TENANT_ID = "tenant-other-counseling-002";

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

    /** JDBC 없이 REQUIRES_NEW 콜백만 수행하는 노옵 트랜잭션 매니저 (부모 트랜잭션 영향 격리). */
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
                batchNotificationDispatchService,
                refundAutoCancelNotificationService,
                org.mockito.Mockito.mock(
                        com.coresolution.consultation.service.UserLifecycleService.class),
                org.mockito.Mockito.mock(
                        com.coresolution.consultation.service.AdminRequestIdempotencyService.class));
        TenantContextHolder.setTenantId(TEST_TENANT_ID);

        // TERMINATED 상태 코드는 enum 이름과 동일하게 반환 (테넌트 공통 코드 기본값 가정)
        when(statusCodeHelper.getStatusCodeValue(eq("MAPPING_STATUS"), eq("TERMINATED")))
                .thenReturn(ConsultantClientMapping.MappingStatus.TERMINATED.name());

        // commonCodeRepository (환불 기간 코드) 는 빈 결과 반환 → fallback (1개월) 적용.
        when(commonCodeRepository.findByTenantIdAndCodeGroupOrderBySortOrderAsc(
                anyString(), anyString()))
                .thenReturn(List.of());
        when(commonCodeRepository.findByTenantIdAndCodeGroupAndIsActiveTrueOrderBySortOrderAsc(
                anyString(), anyString()))
                .thenReturn(List.of());

        // 강제 종료 매핑 분기는 본 테스트 범위 밖이므로 빈 결과 고정.
        when(mappingRepository.findByTenantId(eq(TEST_TENANT_ID)))
                .thenReturn(List.of());
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("케이스 1: 동일 매핑에 CONSULTATION_REFUND + CONSULTATION_PARTIAL_REFUND 둘 다 있으면 dedup 으로 1건만 반환되고 CONSULTATION_REFUND 가 우선된다 (운영 매핑 67/72 재현)")
    void dedup_sameMapping_prefersFullRefund() {
        Long mappingId = 67L;
        Long fullId = 79L;
        Long partialId = 80L;
        LocalDate refundDate = LocalDate.of(2026, 5, 13);

        ConsultantClientMapping mapping = buildActiveMapping(mappingId, 110L, 210L);

        FinancialTransaction fullRefund = buildRefundTransaction(
                fullId, mappingId, refundDate, "CONSULTATION_REFUND", 100000L, "전체 환불 처리 [사유: 단순 변심]");
        FinancialTransaction partialRefund = buildRefundTransaction(
                partialId, mappingId, refundDate, "CONSULTATION_PARTIAL_REFUND", 100000L, "(5)회기 부분 환불 [사유: 단순 변심]");

        stubRepoReturning(List.of(partialRefund, fullRefund));
        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(mappingId)))
                .thenReturn(Optional.of(mapping));

        Map<String, Object> result = invokeRefundHistory();

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> refundHistory = (List<Map<String, Object>>) result.get("refundHistory");
        assertThat(refundHistory)
                .as("mapping_id 단위 dedup 으로 동일 매핑의 환불 transaction 은 1건만 반환되어야 한다")
                .hasSize(1);
        Map<String, Object> row = refundHistory.get(0);
        assertThat(row.get("mappingId")).isEqualTo(mappingId);
        assertThat((Long) row.get("refundAmount"))
                .as("CONSULTATION_REFUND (전체환불) 우선 → 전체환불 금액이 표시되어야 한다")
                .isEqualTo(100000L);
        assertThat((Integer) result.get("totalElements") != null
                ? (Integer) result.get("totalElements")
                : ((Integer) ((Map<String, Object>) result.get("pageInfo")).get("totalElements")))
                .isEqualTo(1);
    }

    @Test
    @DisplayName("케이스 2: CONSULTATION_REFUND (전체환불) 만 있을 때 1건 반환된다 (기존 결함이라면 0건이 됐을 케이스)")
    void onlyFullRefund_returnsOneRow() {
        Long mappingId = 99L;
        Long fullId = 1001L;
        LocalDate refundDate = LocalDate.of(2026, 5, 20);

        ConsultantClientMapping mapping = buildActiveMapping(mappingId, 120L, 220L);
        FinancialTransaction fullRefund = buildRefundTransaction(
                fullId, mappingId, refundDate, "CONSULTATION_REFUND", 200000L, "전체 환불 처리 [사유: 회기 미사용]");

        stubRepoReturning(List.of(fullRefund));
        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(mappingId)))
                .thenReturn(Optional.of(mapping));

        Map<String, Object> result = invokeRefundHistory();

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> refundHistory = (List<Map<String, Object>>) result.get("refundHistory");
        assertThat(refundHistory)
                .as("CONSULTATION_REFUND 단독 케이스도 IN 절 조회 + dedup 후 1건 반환되어야 한다")
                .hasSize(1);
        assertThat(refundHistory.get(0).get("mappingId")).isEqualTo(mappingId);
        assertThat((Long) refundHistory.get(0).get("refundAmount")).isEqualTo(200000L);
    }

    @Test
    @DisplayName("케이스 3: CONSULTATION_PARTIAL_REFUND (부분환불) 만 있을 때 1건 반환된다 (기존 정상 케이스 회귀 가드)")
    void onlyPartialRefund_returnsOneRow() {
        Long mappingId = 88L;
        Long partialId = 2002L;
        LocalDate refundDate = LocalDate.of(2026, 5, 18);

        ConsultantClientMapping mapping = buildActiveMapping(mappingId, 130L, 230L);
        FinancialTransaction partialRefund = buildRefundTransaction(
                partialId, mappingId, refundDate, "CONSULTATION_PARTIAL_REFUND", 50000L, "(2)회기 부분 환불 [사유: 일정 변경]");

        stubRepoReturning(List.of(partialRefund));
        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(mappingId)))
                .thenReturn(Optional.of(mapping));

        Map<String, Object> result = invokeRefundHistory();

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> refundHistory = (List<Map<String, Object>>) result.get("refundHistory");
        assertThat(refundHistory)
                .as("CONSULTATION_PARTIAL_REFUND 단독 케이스도 1건 반환되어야 한다 (회귀 가드)")
                .hasSize(1);
        assertThat(refundHistory.get(0).get("mappingId")).isEqualTo(mappingId);
        assertThat((Long) refundHistory.get(0).get("refundAmount")).isEqualTo(50000L);
    }

    @Test
    @DisplayName("케이스 4: 서로 다른 매핑은 각각 1건씩 반환된다 (운영 5월 매핑 67/72 듀얼 케이스 재현)")
    void differentMappings_areNotDeduped() {
        Long mappingA = 67L;
        Long mappingB = 72L;
        LocalDate dateA = LocalDate.of(2026, 5, 13);
        LocalDate dateB = LocalDate.of(2026, 5, 16);

        ConsultantClientMapping a = buildActiveMapping(mappingA, 110L, 210L);
        ConsultantClientMapping b = buildActiveMapping(mappingB, 111L, 211L);

        FinancialTransaction fullA = buildRefundTransaction(79L, mappingA, dateA, "CONSULTATION_REFUND", 100000L, "전체 환불 처리");
        FinancialTransaction partialA = buildRefundTransaction(80L, mappingA, dateA, "CONSULTATION_PARTIAL_REFUND", 100000L, "(5)회기 부분 환불");
        FinancialTransaction fullB = buildRefundTransaction(87L, mappingB, dateB, "CONSULTATION_REFUND", 80000L, "전체 환불 처리");
        FinancialTransaction partialB = buildRefundTransaction(88L, mappingB, dateB, "CONSULTATION_PARTIAL_REFUND", 80000L, "(4)회기 부분 환불");

        stubRepoReturning(List.of(partialA, fullA, partialB, fullB));
        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(mappingA)))
                .thenReturn(Optional.of(a));
        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(mappingB)))
                .thenReturn(Optional.of(b));

        Map<String, Object> result = invokeRefundHistory();

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> refundHistory = (List<Map<String, Object>>) result.get("refundHistory");
        assertThat(refundHistory)
                .as("서로 다른 매핑은 dedup 대상이 아니므로 각각 1건씩 총 2건 반환되어야 한다")
                .hasSize(2);
        assertThat(refundHistory)
                .extracting(row -> row.get("mappingId"))
                .containsExactlyInAnyOrder(mappingA, mappingB);
        assertThat(refundHistory)
                .as("두 행 모두 전체환불 금액 (CONSULTATION_REFUND 우선 dedup) 으로 표시되어야 한다")
                .extracting(row -> row.get("refundAmount"))
                .containsExactlyInAnyOrder(100000L, 80000L);
    }

    @Test
    @DisplayName("케이스 5: repository 가 빈 결과 (다른 tenant / is_deleted=1 시뮬레이션) 를 반환하면 화면도 0건이고, 호출 시 호출자 tenantId 가 정확히 전달된다 (멀티테넌트 격리 회귀 가드)")
    void repositoryReturnsEmpty_isolationAndDeletedSimulated() {
        stubRepoReturning(List.of());

        Map<String, Object> result = invokeRefundHistory();

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> refundHistory = (List<Map<String, Object>>) result.get("refundHistory");
        assertThat(refundHistory)
                .as("다른 tenant 거래 또는 is_deleted=1 거래는 derived query (IsDeletedFalse + tenantId) 단계에서 차단되므로 화면 0건")
                .isEmpty();
        @SuppressWarnings("unchecked")
        Map<String, Object> pageInfo = (Map<String, Object>) result.get("pageInfo");
        assertThat(pageInfo.get("totalElements")).isEqualTo(0);

        // 호출자 tenantId 가 정확히 repository 에 전달되었는지 확인 (멀티테넌트 격리)
        ArgumentCaptor<String> tenantCaptor = ArgumentCaptor.forClass(String.class);
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Collection<String>> subcategoryCaptor = ArgumentCaptor.forClass(Collection.class);
        verify(financialTransactionRepository)
                .findByTenantIdAndTransactionTypeAndSubcategoryInAndTransactionDateBetweenAndIsDeletedFalse(
                        tenantCaptor.capture(),
                        eq(FinancialTransaction.TransactionType.EXPENSE),
                        subcategoryCaptor.capture(),
                        any(LocalDate.class), any(LocalDate.class));
        assertThat(tenantCaptor.getValue())
                .as("repository 호출 시 호출자 tenantId 가 그대로 전달되어야 한다 (다른 tenant 환불 transaction 노출 방지)")
                .isEqualTo(TEST_TENANT_ID)
                .isNotEqualTo(OTHER_TENANT_ID);
        assertThat(subcategoryCaptor.getValue())
                .as("IN 절 subcategories 는 CONSULTATION_REFUND + CONSULTATION_PARTIAL_REFUND 를 정확히 포함해야 한다")
                .containsExactlyInAnyOrder("CONSULTATION_REFUND", "CONSULTATION_PARTIAL_REFUND");
    }

    /** 컨트롤러 호출 시그니처 (branchCode 5번째 파라미터) 와 동일하게 호출한다. */
    private Map<String, Object> invokeRefundHistory() {
        return adminService.getRefundHistory(0, 10, "month", "all", null);
    }

    @SuppressWarnings("unchecked")
    private void stubRepoReturning(List<FinancialTransaction> transactions) {
        when(financialTransactionRepository
                .findByTenantIdAndTransactionTypeAndSubcategoryInAndTransactionDateBetweenAndIsDeletedFalse(
                        eq(TEST_TENANT_ID),
                        eq(FinancialTransaction.TransactionType.EXPENSE),
                        any(Collection.class),
                        any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(transactions);
    }

    private FinancialTransaction buildRefundTransaction(Long id,
                                                        Long mappingId,
                                                        LocalDate transactionDate,
                                                        String subcategory,
                                                        long amount,
                                                        String description) {
        FinancialTransaction tx = new FinancialTransaction();
        tx.setId(id);
        tx.setTransactionType(FinancialTransaction.TransactionType.EXPENSE);
        tx.setSubcategory(subcategory);
        tx.setAmount(BigDecimal.valueOf(amount));
        tx.setDescription(description);
        tx.setTransactionDate(transactionDate);
        tx.setRelatedEntityId(mappingId);
        tx.setRelatedEntityType("CONSULTANT_CLIENT_MAPPING");
        tx.setTenantId(TEST_TENANT_ID);
        tx.setCreatedAt(LocalDateTime.of(transactionDate, java.time.LocalTime.of(10, 0)));
        return tx;
    }

    private ConsultantClientMapping buildActiveMapping(Long mappingId, Long consultantId, Long clientId) {
        User consultant = new User();
        consultant.setId(consultantId);
        consultant.setName("상담사_테스트_" + consultantId);
        consultant.setTenantId(TEST_TENANT_ID);
        User client = new User();
        client.setId(clientId);
        client.setName("내담자_테스트_" + clientId);
        client.setTenantId(TEST_TENANT_ID);

        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(mappingId);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setPackageName("테스트패키지");
        mapping.setPackagePrice(100000L);
        mapping.setTotalSessions(10);
        mapping.setUsedSessions(3);
        mapping.setRemainingSessions(7);
        mapping.setStatus(ConsultantClientMapping.MappingStatus.ACTIVE);
        mapping.setTenantId(TEST_TENANT_ID);
        return mapping;
    }
}
