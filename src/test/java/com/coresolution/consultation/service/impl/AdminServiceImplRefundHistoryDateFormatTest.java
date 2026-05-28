package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * AdminServiceImpl#getRefundHistory(page, size, period, status, branchCode) 회귀 가드 테스트.
 *
 * <p>P0 핫픽스 2026-05-28: {@code FinancialTransaction.transactionDate} 는 {@link LocalDate} 인데
 * AdminServiceImpl.java L4619/L4627 의 부분환불 매핑 람다가 잘못 {@code "yyyy-MM-dd HH:mm"} 패턴으로
 * 포맷하여 {@link java.time.temporal.UnsupportedTemporalTypeException}: Unsupported field: HourOfDay 가
 * 발생하고 {@code GET /api/v1/admin/refund-history} 가 500 으로 폭발한 회귀를 차단한다.</p>
 *
 * <p>본 테스트는 두 가지를 동시에 검증한다:
 * <ol>
 *   <li>부분환불 {@code transaction.getTransactionDate()} ({@link LocalDate}) 는 시간 컴포넌트 없이
 *       {@code yyyy-MM-dd} 로만 포맷된다.</li>
 *   <li>강제 종료 매핑 {@code mapping.getTerminatedAt()} ({@link LocalDateTime}) 은 시간 컴포넌트를
 *       포함하여 {@code yyyy-MM-dd HH:mm} 으로 그대로 포맷된다 (의도적 표시 차이 회귀 가드).</li>
 * </ol>
 *
 * @author MindGarden
 * @since 2026-05-28
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AdminServiceImpl getRefundHistory LocalDate 포맷 회귀 가드 테스트")
class AdminServiceImplRefundHistoryDateFormatTest {

    private static final String TEST_TENANT_ID = "tenant-test-refund-history-date";

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

    /** JDBC 없이 REQUIRES_NEW 콜백만 수행하는 노옵 트랜잭션 매니저 (부모 트랜잭션 영향 격리) */
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

        // TERMINATED 상태 코드는 enum 이름과 동일하게 반환 (테넌트 공통 코드 운영 기본값 가정)
        when(statusCodeHelper.getStatusCodeValue(eq("MAPPING_STATUS"), eq("TERMINATED")))
                .thenReturn(ConsultantClientMapping.MappingStatus.TERMINATED.name());

        // commonCodeRepository (환불 기간 코드) 는 빈 결과 반환 → getRefundPeriodStartDate fallback
        // (LocalDate.now().minusMonths(1).atStartOfDay()) 가 적용된다.
        when(commonCodeRepository.findByTenantIdAndCodeGroupOrderBySortOrderAsc(
                anyString(), anyString()))
                .thenReturn(List.of());
        when(commonCodeRepository.findByTenantIdAndCodeGroupAndIsActiveTrueOrderBySortOrderAsc(
                anyString(), anyString()))
                .thenReturn(List.of());
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("부분환불 매핑 found 분기 — LocalDate 는 UnsupportedTemporalTypeException 없이 yyyy-MM-dd 로 포맷된다 (L4619 회귀 가드)")
    void getRefundHistory_LocalDate_format_yyyy_MM_dd_NoUnsupportedException() {
        Long mappingId = 1001L;
        Long consultantId = 11L;
        Long clientId = 21L;
        LocalDate transactionDate = LocalDate.now().minusDays(7);

        ConsultantClientMapping mapping = buildActiveMapping(mappingId, consultantId, clientId);
        FinancialTransaction transaction = buildPartialRefundTransaction(
                mappingId, transactionDate, "(2)회기 부분 환불 [사유: 단순 변심]");

        when(financialTransactionRepository
                .findByTenantIdAndTransactionTypeAndSubcategoryAndTransactionDateBetweenAndIsDeletedFalse(
                        eq(TEST_TENANT_ID),
                        eq(FinancialTransaction.TransactionType.EXPENSE),
                        eq("CONSULTATION_PARTIAL_REFUND"),
                        any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of(transaction));
        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(mappingId)))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.findByTenantId(eq(TEST_TENANT_ID)))
                .thenReturn(List.of());

        Map<String, Object> result = invokeRefundHistory();

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> refundHistory = (List<Map<String, Object>>) result.get("refundHistory");
        assertThat(refundHistory).hasSize(1);
        Object terminatedAt = refundHistory.get(0).get("terminatedAt");
        assertThat(terminatedAt).isInstanceOf(String.class);
        assertThat((String) terminatedAt)
                .as("LocalDate 는 시간 컴포넌트 없이 yyyy-MM-dd (길이 10) 로만 포맷되어야 한다")
                .hasSize(10)
                .matches("\\d{4}-\\d{2}-\\d{2}")
                .doesNotContain(":")
                .isEqualTo(transactionDate.toString());
    }

    @Test
    @DisplayName("부분환불 매핑 not-found else 분기 — relatedEntityId 가 없는 거래도 동일하게 yyyy-MM-dd 로 포맷된다 (L4627 회귀 가드)")
    void getRefundHistory_NoMappingFound_StillFormatsDate() {
        LocalDate transactionDate = LocalDate.of(2026, 5, 28);
        FinancialTransaction transaction = buildPartialRefundTransaction(
                9999L, transactionDate, "(1)회기 부분 환불 [사유: 일정 변경]");

        when(financialTransactionRepository
                .findByTenantIdAndTransactionTypeAndSubcategoryAndTransactionDateBetweenAndIsDeletedFalse(
                        eq(TEST_TENANT_ID),
                        eq(FinancialTransaction.TransactionType.EXPENSE),
                        eq("CONSULTATION_PARTIAL_REFUND"),
                        any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of(transaction));
        // relatedEntityId 9999 는 존재하지 않는다고 가정 (else 분기 진입)
        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(9999L)))
                .thenReturn(Optional.empty());
        when(mappingRepository.findByTenantId(eq(TEST_TENANT_ID)))
                .thenReturn(List.of());

        Map<String, Object> result = invokeRefundHistory();

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> refundHistory = (List<Map<String, Object>>) result.get("refundHistory");
        assertThat(refundHistory).hasSize(1);
        assertThat((String) refundHistory.get(0).get("terminatedAt"))
                .as("else 분기도 LocalDate 를 yyyy-MM-dd 로 안전하게 포맷해야 한다")
                .isEqualTo("2026-05-28")
                .doesNotContain(":");
    }

    @Test
    @DisplayName("강제 종료 매핑 — LocalDateTime 의 yyyy-MM-dd HH:mm 포맷은 그대로 유지된다 (의도적 표시 차이 회귀 가드)")
    void getRefundHistory_TerminatedMapping_LocalDateTime_HH_mm_Preserved() {
        Long mappingId = 2002L;
        Long consultantId = 12L;
        Long clientId = 22L;
        LocalDateTime terminatedAtFixture = LocalDateTime.now().minusDays(2).withHour(14).withMinute(30).withSecond(0).withNano(0);

        ConsultantClientMapping mapping = buildTerminatedMapping(
                mappingId, consultantId, clientId, terminatedAtFixture);

        when(mappingRepository.findByTenantId(eq(TEST_TENANT_ID)))
                .thenReturn(List.of(mapping));
        when(financialTransactionRepository
                .findByTenantIdAndTransactionTypeAndSubcategoryAndTransactionDateBetweenAndIsDeletedFalse(
                        anyString(), any(), anyString(),
                        any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of());

        Map<String, Object> result = invokeRefundHistory();

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> refundHistory = (List<Map<String, Object>>) result.get("refundHistory");
        assertThat(refundHistory).hasSize(1);
        String formatted = (String) refundHistory.get(0).get("terminatedAt");
        assertThat(formatted)
                .as("LocalDateTime 의 강제 종료 시각은 yyyy-MM-dd HH:mm (길이 16) 으로 포맷되어야 한다")
                .hasSize(16)
                .matches("\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}")
                .startsWith(terminatedAtFixture.toLocalDate().toString())
                .contains(":");
    }

    @Test
    @DisplayName("부분환불 + 강제 종료 혼합 — 각각의 도메인 타입에 맞는 포맷이 동시에 적용된다")
    void getRefundHistory_MixedPartialAndTerminated_BothFormatsCorrect() {
        Long partialMappingId = 3001L;
        LocalDate partialTransactionDate = LocalDate.now().minusDays(5);
        ConsultantClientMapping partialMapping = buildActiveMapping(partialMappingId, 31L, 41L);
        FinancialTransaction partialTransaction = buildPartialRefundTransaction(
                partialMappingId, partialTransactionDate, "(3)회기 부분 환불 [사유: 만족도 저하]");

        Long terminatedMappingId = 3002L;
        LocalDateTime terminatedAtFixture = LocalDateTime.now().minusDays(3).withHour(9).withMinute(15).withSecond(0).withNano(0);
        ConsultantClientMapping terminatedMapping = buildTerminatedMapping(
                terminatedMappingId, 32L, 42L, terminatedAtFixture);

        when(financialTransactionRepository
                .findByTenantIdAndTransactionTypeAndSubcategoryAndTransactionDateBetweenAndIsDeletedFalse(
                        eq(TEST_TENANT_ID),
                        eq(FinancialTransaction.TransactionType.EXPENSE),
                        eq("CONSULTATION_PARTIAL_REFUND"),
                        any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of(partialTransaction));
        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(partialMappingId)))
                .thenReturn(Optional.of(partialMapping));
        when(mappingRepository.findByTenantId(eq(TEST_TENANT_ID)))
                .thenReturn(List.of(terminatedMapping));

        assertThatCode(this::invokeRefundHistory)
                .as("부분환불 LocalDate + 강제 종료 LocalDateTime 동시 처리에서 UnsupportedTemporalTypeException 0")
                .doesNotThrowAnyException();

        Map<String, Object> result = invokeRefundHistory();
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> refundHistory = (List<Map<String, Object>>) result.get("refundHistory");
        assertThat(refundHistory).hasSize(2);

        // 매핑 ID 로 식별: partial 은 yyyy-MM-dd (10자), terminated 는 yyyy-MM-dd HH:mm (16자)
        Map<String, Object> partialRow = refundHistory.stream()
                .filter(row -> partialMappingId.equals(row.get("mappingId")))
                .findFirst()
                .orElseThrow(() -> new AssertionError("부분환불 매핑 행이 결과에 포함되지 않았다"));
        Map<String, Object> terminatedRow = refundHistory.stream()
                .filter(row -> terminatedMappingId.equals(row.get("mappingId")))
                .findFirst()
                .orElseThrow(() -> new AssertionError("강제 종료 매핑 행이 결과에 포함되지 않았다"));

        assertThat((String) partialRow.get("terminatedAt"))
                .as("부분환불 (LocalDate) 행은 yyyy-MM-dd 포맷")
                .isEqualTo(partialTransactionDate.toString())
                .doesNotContain(":");
        assertThat((String) terminatedRow.get("terminatedAt"))
                .as("강제 종료 (LocalDateTime) 행은 yyyy-MM-dd HH:mm 포맷")
                .hasSize(16)
                .contains(":");
    }

    /** 컨트롤러 호출 시그니처 (branchCode 5번째 파라미터) 와 동일하게 호출한다. */
    private Map<String, Object> invokeRefundHistory() {
        return adminService.getRefundHistory(0, 10, "month", "all", null);
    }

    /** 부분환불 FinancialTransaction 픽스처: transactionDate 는 LocalDate (HourOfDay 없음). */
    private FinancialTransaction buildPartialRefundTransaction(Long relatedEntityId,
                                                               LocalDate transactionDate,
                                                               String description) {
        FinancialTransaction transaction = new FinancialTransaction();
        transaction.setTransactionType(FinancialTransaction.TransactionType.EXPENSE);
        transaction.setSubcategory("CONSULTATION_PARTIAL_REFUND");
        transaction.setAmount(BigDecimal.valueOf(50000L));
        transaction.setDescription(description);
        transaction.setTransactionDate(transactionDate);
        transaction.setRelatedEntityId(relatedEntityId);
        transaction.setRelatedEntityType("CONSULTANT_CLIENT_MAPPING");
        transaction.setTenantId(TEST_TENANT_ID);
        return transaction;
    }

    /** 활성(부분환불 대상) 매핑 픽스처. */
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

    /** 강제 종료 (TERMINATED) 매핑 픽스처: terminatedAt 은 LocalDateTime (HourOfDay 보유). */
    private ConsultantClientMapping buildTerminatedMapping(Long mappingId, Long consultantId, Long clientId,
                                                           LocalDateTime terminatedAt) {
        ConsultantClientMapping mapping = buildActiveMapping(mappingId, consultantId, clientId);
        mapping.setStatus(ConsultantClientMapping.MappingStatus.TERMINATED);
        mapping.setTerminatedAt(terminatedAt);
        mapping.setNotes("[강제 종료] 고객 요청으로 인한 환불 (환불: 50000원)");
        return mapping;
    }
}
