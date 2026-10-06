package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.reset;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping.PaymentStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.exception.MappingErpSyncFailedException;
import com.coresolution.consultation.exception.SalaryTaxRateNotConfiguredException;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.MappingSettlementNotificationHelper;
import com.coresolution.consultation.service.RealTimeStatisticsService;
import com.coresolution.consultation.service.SalaryTaxRateLookupService;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.service.StoredProcedureService;
import com.coresolution.consultation.service.erp.accounting.AccountingService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.integrationtest.support.WithMockAdminSecurityContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.aop.support.AopUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.AopTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * 결제 확인 → 입금 확인 → 취소 전 구간의 상담료 INCOME 원자성 — H2 실제 트랜잭션(테스트 트랜잭션 없음).
 *
 * <ul>
 *   <li>결제 확인은 INCOME 을 쓰지 않는다. 입금 확인이 어느 단계에서 실패하든 INCOME 0건·회기 변화 0.</li>
 *   <li>실패 후 재시도 성공이면 INCOME 정확히 1건. 동시 입금 확인 2회도 1건.</li>
 *   <li>입금 확인 성공 후 취소는 INCOME 취소 1건·순액 0. 입금 확인 전 취소는 남은 INCOME 을 취소한다.</li>
 *   <li>결제·입금 확인을 감싼 바깥 트랜잭션이 롤백되면 INCOME 0건 — REQUIRES_NEW·선커밋이 다시 들어오면 실패한다.</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@WithMockAdminSecurityContext
@DisplayName("입금 확인 INCOME 원자성 — 결제 확인 무기록·실패 시 0건·재시도 1건·취소 순액 0")
class DepositIncomeAtomicityIntegrationTest {

    private static final long PACKAGE_PRICE = 100_000L;
    private static final int TOTAL_SESSIONS = 10;
    private static final String TAX_CODE_GROUP_HINT = "SALARY_TAX_RATE";
    private static final int CONCURRENT_REQUESTS = 2;
    private static final long BARRIER_WAIT_SECONDS = 2L;
    private static final long FUTURE_WAIT_SECONDS = 60L;
    private static final Set<String> MAPPING_INCOME_TYPES = Set.of(
            FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING,
            FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_ADDITIONAL,
            FinancialTransactionConstants.RELATED_ENTITY_INSTITUTION_LINK_PREPAID);

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private ConsultantClientMappingRepository mappingRepository;
    @Autowired private ScheduleRepository scheduleRepository;
    @SpyBean private FinancialTransactionRepository financialTransactionRepository;
    @SpyBean private RealTimeStatisticsService realTimeStatisticsService;
    @SpyBean private AccountingService accountingService;
    @SpyBean private ScheduleService scheduleService;
    @SpyBean private FinancialTransactionService financialTransactionService;
    @Autowired private AdminService adminService;
    @Autowired private PlatformTransactionManager transactionManager;

    @MockBean private StoredProcedureService storedProcedureService;
    @MockBean private MappingSettlementNotificationHelper mappingSettlementNotificationHelper;
    @MockBean private SalaryTaxRateLookupService salaryTaxRateLookupService;

    private final List<Long> createdMappingIds = new ArrayList<>();
    private final List<Long> createdScheduleIds = new ArrayList<>();
    private final List<Long> createdUserIds = new ArrayList<>();
    private String tenantId;
    private User consultant;
    private User client;

    @BeforeEach
    void setUp() {
        tenantId = "dia-" + UUID.randomUUID().toString().replace("-", "").substring(0, 28);
        TenantContextHolder.setTenantId(tenantId);
        consultant = saveUser(UserRole.CONSULTANT, "상담사");
        client = saveUser(UserRole.CLIENT, "내담자");
        configureTaxRates();
    }

    @AfterEach
    void tearDown() {
        reset(scheduleService, financialTransactionService, financialTransactionRepository);
        TenantContextHolder.setTenantId(tenantId);
        financialTransactionRepository.deleteAll(financialTransactionRepository.findByTenantId(tenantId));
        createdScheduleIds.forEach(scheduleRepository::deleteById);
        createdMappingIds.forEach(mappingRepository::deleteById);
        createdUserIds.forEach(userRepository::deleteById);
        TenantContextHolder.clear();
    }

    // ── 1. 입금 확인 422 → INCOME 0건·회기 변화 0 (단계별) ──

    @Test
    @DisplayName("[1] 결제 확인 후 입금 확인 INCOME 기록 실패(422) — INCOME 0건, 회기·상태 그대로")
    void confirmPaymentThenDeposit_incomeWriteFails_leavesNoIncomeAndNoSessionChange() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.PENDING_PAYMENT, PaymentStatus.PENDING, "");
        confirmPaymentOk(mapping);
        assertThat(mappingIncomeRows(mapping)).as("결제 확인은 INCOME 을 쓰지 않는다").isEmpty();

        doThrow(new SalaryTaxRateNotConfiguredException(TAX_CODE_GROUP_HINT, "VAT", null))
                .when(salaryTaxRateLookupService).getVatRate(anyString());
        confirmDeposit(mapping, "dia-dep-income-fail")
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value(MappingErpSyncFailedException.ERROR_CODE));

        assertPaymentConfirmedUnchanged(mapping);
        assertThat(mappingIncomeRows(mapping)).isEmpty();
    }

    @Test
    @DisplayName("[1] 결제 확인 후 입금 확인 — INCOME 저장 뒤 완료 처리 실패(422) — INCOME 0건, 회기 그대로")
    void confirmPaymentThenDeposit_failureAfterIncomeInsert_leavesNoIncome() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.PENDING_PAYMENT, PaymentStatus.PENDING, "");
        confirmPaymentOk(mapping);
        failOnCompletedIncomeSave();

        confirmDeposit(mapping, "dia-dep-after-insert")
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value(MappingErpSyncFailedException.ERROR_CODE));
        reset(financialTransactionRepository);

        assertPaymentConfirmedUnchanged(mapping);
        assertThat(mappingIncomeRows(mapping)).isEmpty();
    }

    @Test
    @DisplayName("[1] 결제 확인 후 입금 확인 — 가예약 회기 적용 실패 — 실패 응답, INCOME 0건, 가예약·회기 그대로")
    void confirmPaymentThenDeposit_sessionApplyFails_leavesNoIncome() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.PENDING_PAYMENT, PaymentStatus.PENDING, "");
        Schedule tentative = saveSchedule(mapping, ScheduleStatus.TENTATIVE_PENDING_PAYMENT, LocalDate.now().plusDays(7));
        confirmPaymentOk(mapping);
        doThrow(new IllegalStateException("dia-session-apply-failure"))
                .when(scheduleService).finalizeTentativeSchedulesAfterDepositConfirmed(any());

        int httpStatus = confirmDeposit(mapping, "dia-dep-session-fail").andReturn().getResponse().getStatus();
        reset(scheduleService);

        assertThat(httpStatus).isBetween(400, 599);
        assertPaymentConfirmedUnchanged(mapping);
        assertThat(mappingIncomeRows(mapping)).isEmpty();
        assertThat(scheduleRepository.findById(tentative.getId()).orElseThrow().getStatus())
                .isEqualTo(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
    }

    @Test
    @DisplayName("[1] 원샷 결제 — INCOME 기록 뒤 당일 일정 회기 차감 실패 — INCOME 0건, 결제 대기 그대로")
    void checkoutSameDay_postStepFailsAfterIncome_leavesNoIncome() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.PENDING_PAYMENT, PaymentStatus.PENDING, "");
        Schedule sameDay = saveSchedule(mapping, ScheduleStatus.BOOKED, LocalDate.now());
        doThrow(new IllegalStateException("dia-post-step-failure"))
                .when(scheduleService).useSessionForSpecificMapping(anyString(), anyLong(), anyLong(), anyLong(), any());

        Map<String, Object> body = checkoutBody();
        body.put("sameDaySessionScheduleId", sameDay.getId());
        int httpStatus = perform(post("/api/v1/admin/mappings/{id}/checkout-same-day", mapping.getId())
                        .header("X-Request-Id", UUID.randomUUID().toString()), body)
                .andReturn().getResponse().getStatus();
        reset(scheduleService);

        assertThat(httpStatus).isBetween(400, 599);
        ConsultantClientMapping after = reload(mapping);
        assertThat(after.getStatus()).isEqualTo(MappingStatus.PENDING_PAYMENT);
        assertThat(after.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(after.getRemainingSessions()).isZero();
        assertThat(after.getUsedSessions()).isZero();
        assertThat(mappingIncomeRows(mapping)).isEmpty();
    }

    @Test
    @DisplayName("[1] 추가 매칭 입금 확인 — 추가 회기 INCOME 완료 처리 실패(422) — 추가 회기 INCOME 0건")
    void additionalMappingDeposit_completionFails_leavesNoAdditionalIncome() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.PENDING_PAYMENT, PaymentStatus.PENDING,
                AdminServiceUserFacingMessages.NOTES_ADDITIONAL_MAPPING_MARKER + " dia " + TOTAL_SESSIONS + "회");
        confirmPaymentOk(mapping);
        failOnCompletedIncomeSave();

        confirmDeposit(mapping, "dia-dep-additional")
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value(MappingErpSyncFailedException.ERROR_CODE));
        reset(financialTransactionRepository);

        assertPaymentConfirmedUnchanged(mapping);
        assertThat(mappingIncomeRows(mapping)).isEmpty();
    }

    @Test
    @DisplayName("[변이 가드] 결제·입금 확인 성공 후 바깥 트랜잭션 롤백 — INCOME 0건 (REQUIRES_NEW·선커밋이면 실패)")
    void paymentAndDepositInsideRolledBackCaller_leaveNoIncome() {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.PENDING_PAYMENT, PaymentStatus.PENDING, "");
        Long mappingId = mapping.getId();
        new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            adminService.confirmPayment(mappingId, "CARD", "dia-outer-pay", PACKAGE_PRICE);
            adminService.confirmDeposit(mappingId, "dia-outer-dep");
            status.setRollbackOnly();
        });

        ConsultantClientMapping after = reload(mapping);
        assertThat(after.getStatus()).isEqualTo(MappingStatus.PENDING_PAYMENT);
        assertThat(after.getRemainingSessions()).isZero();
        assertThat(mappingIncomeRows(mapping)).isEmpty();
    }

    // ── 2. 422 후 재시도 → INCOME 정확히 1건 ──

    @Test
    @DisplayName("[2] 입금 확인 422 후 재시도 성공 — INCOME 정확히 1건, 회기 1회 충전. 재요청은 반영 안 됨")
    void depositFailsThenRetrySucceeds_writesExactlyOneIncome() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.PENDING_PAYMENT, PaymentStatus.PENDING, "");
        confirmPaymentOk(mapping);
        doThrow(new SalaryTaxRateNotConfiguredException(TAX_CODE_GROUP_HINT, "VAT", null))
                .when(salaryTaxRateLookupService).getVatRate(anyString());
        confirmDeposit(mapping, "dia-dep-retry").andExpect(status().isUnprocessableEntity());

        configureTaxRates();
        confirmDeposit(mapping, "dia-dep-retry").andExpect(status().isOk());

        ConsultantClientMapping after = reload(mapping);
        assertThat(after.getPaymentStatus()).isEqualTo(PaymentStatus.APPROVED);
        assertThat(after.getRemainingSessions()).isEqualTo(TOTAL_SESSIONS);
        assertThat(mappingIncomeRows(mapping)).hasSize(1);

        int replay = confirmDeposit(mapping, "dia-dep-retry").andReturn().getResponse().getStatus();
        assertThat(replay).isNotEqualTo(200);
        assertThat(mappingIncomeRows(mapping)).hasSize(1);
        assertThat(reload(mapping).getRemainingSessions()).isEqualTo(TOTAL_SESSIONS);
    }

    @Test
    @DisplayName("[2] 같은 매칭 입금 확인 동시 2회 — INCOME 정확히 1건, 회기 1회만 충전")
    void concurrentDeposits_writeExactlyOneIncome() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.PAYMENT_CONFIRMED, PaymentStatus.CONFIRMED, "");
        Long mappingId = mapping.getId();
        CyclicBarrier insideTransaction = new CyclicBarrier(CONCURRENT_REQUESTS);
        doAnswer(invocation -> {
            try {
                insideTransaction.await(BARRIER_WAIT_SECONDS, TimeUnit.SECONDS);
            } catch (Exception ignored) {
                // 상대 요청이 행 잠금에서 기다리면 장벽 없이 진행한다. 판정은 결과 건수로만 한다.
            }
            return invocation.callRealMethod();
        }).when(financialTransactionService).createTransaction(any(), any());

        ExecutorService pool = Executors.newFixedThreadPool(CONCURRENT_REQUESTS);
        try {
            List<Future<Boolean>> results = new ArrayList<>();
            for (int i = 0; i < CONCURRENT_REQUESTS; i++) {
                String reference = "dia-dep-concurrent-" + i;
                results.add(pool.submit(() -> {
                    TenantContextHolder.setTenantId(tenantId);
                    try {
                        adminService.confirmDeposit(mappingId, reference);
                        return true;
                    } catch (RuntimeException e) {
                        return false;
                    } finally {
                        TenantContextHolder.clear();
                    }
                }));
            }
            int succeeded = 0;
            for (Future<Boolean> result : results) {
                if (result.get(FUTURE_WAIT_SECONDS, TimeUnit.SECONDS)) {
                    succeeded++;
                }
            }
            assertThat(succeeded).isEqualTo(1);
        } finally {
            pool.shutdownNow();
            reset(financialTransactionService);
        }

        ConsultantClientMapping after = reload(mapping);
        assertThat(after.getPaymentStatus()).isEqualTo(PaymentStatus.APPROVED);
        assertThat(after.getRemainingSessions()).isEqualTo(TOTAL_SESSIONS);
        assertThat(mappingIncomeRows(mapping)).hasSize(1);
    }

    // ── 3. 취소 → INCOME 취소 정확히 1건·순액 0 ──

    @Test
    @DisplayName("[3] 입금 확인 성공 후 매칭 취소 — INCOME 취소 1건, 환불 EXPENSE 0건, 순액 0. 재취소는 반영 안 됨")
    void cancelAfterDeposit_reversesIncomeExactlyOnce() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.PENDING_PAYMENT, PaymentStatus.PENDING, "");
        confirmPaymentOk(mapping);
        confirmDeposit(mapping, "dia-dep-cancel").andExpect(status().isOk());
        assertThat(postedIncomeRows(mapping)).hasSize(1);

        terminate(mapping).andExpect(status().isOk());

        assertSingleCancelledIncomeAndNetZero(mapping);
        assertThat(reload(mapping).getStatus()).isEqualTo(MappingStatus.CANCELLED);

        int again = terminate(mapping).andReturn().getResponse().getStatus();
        assertThat(again).isBetween(400, 499);
        assertSingleCancelledIncomeAndNetZero(mapping);
    }

    @Test
    @DisplayName("[3] 입금 확인 422 후 매칭 취소 — INCOME·환불 전표 0건, 순액 0")
    void cancelAfterFailedDeposit_leavesEmptyLedger() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.PENDING_PAYMENT, PaymentStatus.PENDING, "");
        confirmPaymentOk(mapping);
        doThrow(new SalaryTaxRateNotConfiguredException(TAX_CODE_GROUP_HINT, "VAT", null))
                .when(salaryTaxRateLookupService).getVatRate(anyString());
        confirmDeposit(mapping, "dia-dep-fail-cancel").andExpect(status().isUnprocessableEntity());
        configureTaxRates();

        terminate(mapping).andExpect(status().isOk());

        assertThat(mappingLedgerRows(mapping)).isEmpty();
        assertThat(postedNet(mapping)).isZero();
        assertThat(reload(mapping).getStatus()).isEqualTo(MappingStatus.CANCELLED);
    }

    @Test
    @DisplayName("[3] 입금 확인 전 매칭에 이전 코드가 남긴 INCOME — 취소 시 1건 취소, 순액 0. 재취소는 반영 안 됨")
    void cancelBeforeDeposit_withLeftoverIncome_cancelsItExactlyOnce() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.PAYMENT_CONFIRMED, PaymentStatus.CONFIRMED, "");
        saveLeftoverPostedIncome(mapping);

        terminate(mapping).andExpect(status().isOk());

        assertSingleCancelledIncomeAndNetZero(mapping);
        int again = terminate(mapping).andReturn().getResponse().getStatus();
        assertThat(again).isBetween(400, 499);
        assertSingleCancelledIncomeAndNetZero(mapping);
    }

    // ── 공통 검증 ──

    private void assertPaymentConfirmedUnchanged(ConsultantClientMapping mapping) {
        ConsultantClientMapping after = reload(mapping);
        assertThat(after.getStatus()).isEqualTo(MappingStatus.PAYMENT_CONFIRMED);
        assertThat(after.getPaymentStatus()).isEqualTo(PaymentStatus.CONFIRMED);
        assertThat(after.getTotalSessions()).isEqualTo(TOTAL_SESSIONS);
        assertThat(after.getRemainingSessions()).isZero();
        assertThat(after.getUsedSessions()).isZero();
    }

    private void assertSingleCancelledIncomeAndNetZero(ConsultantClientMapping mapping) {
        List<FinancialTransaction> incomes = mappingIncomeRows(mapping);
        assertThat(incomes).hasSize(1);
        assertThat(incomes.get(0).getStatus()).isEqualTo(FinancialTransaction.TransactionStatus.CANCELLED);
        assertThat(mappingLedgerRows(mapping).stream()
                .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.EXPENSE)
                .toList()).isEmpty();
        assertThat(postedNet(mapping)).isZero();
    }

    private List<FinancialTransaction> mappingLedgerRows(ConsultantClientMapping mapping) {
        return financialTransactionRepository.findByTenantId(tenantId).stream()
                .filter(t -> mapping.getId().equals(t.getRelatedEntityId()))
                .filter(t -> t.getRelatedEntityType() != null)
                .filter(t -> !Boolean.TRUE.equals(t.getIsDeleted()))
                .toList();
    }

    private List<FinancialTransaction> mappingIncomeRows(ConsultantClientMapping mapping) {
        return mappingLedgerRows(mapping).stream()
                .filter(t -> MAPPING_INCOME_TYPES.contains(t.getRelatedEntityType()))
                .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.INCOME)
                .toList();
    }

    private List<FinancialTransaction> postedIncomeRows(ConsultantClientMapping mapping) {
        return mappingIncomeRows(mapping).stream().filter(DepositIncomeAtomicityIntegrationTest::isPosted).toList();
    }

    private BigDecimal postedNet(ConsultantClientMapping mapping) {
        BigDecimal net = BigDecimal.ZERO;
        for (FinancialTransaction t : mappingLedgerRows(mapping)) {
            if (!isPosted(t) || t.getAmount() == null) {
                continue;
            }
            if (t.getTransactionType() == FinancialTransaction.TransactionType.INCOME) {
                net = net.add(t.getAmount());
            } else if (t.getTransactionType() == FinancialTransaction.TransactionType.EXPENSE) {
                net = net.subtract(t.getAmount());
            }
        }
        return net;
    }

    private static boolean isPosted(FinancialTransaction t) {
        return t.getStatus() != FinancialTransaction.TransactionStatus.CANCELLED
                && t.getStatus() != FinancialTransaction.TransactionStatus.REJECTED;
    }

    // ── 요청·픽스처 ──

    private void configureTaxRates() {
        doReturn(new BigDecimal("0.10")).when(salaryTaxRateLookupService).getVatRate(anyString());
        doReturn(new BigDecimal("0.03")).when(salaryTaxRateLookupService).getWithholdingNationalRate(anyString());
        doReturn(new BigDecimal("0.003")).when(salaryTaxRateLookupService).getWithholdingLocalRate(anyString());
    }

    private void failOnCompletedIncomeSave() {
        FinancialTransactionRepository delegate = financialTransactionDelegate();
        doAnswer(invocation -> {
            FinancialTransaction entity = invocation.getArgument(0);
            FinancialTransaction saved = delegate.save(entity);
            if (saved.getStatus() == FinancialTransaction.TransactionStatus.COMPLETED) {
                throw new IllegalStateException("dia-post-insert-completion-failure");
            }
            return saved;
        }).when(financialTransactionRepository).save(any(FinancialTransaction.class));
    }

    private void confirmPaymentOk(ConsultantClientMapping mapping) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("paymentMethod", "CARD");
        body.put("paymentReference", "dia-pay-" + mapping.getId());
        body.put("paymentAmount", PACKAGE_PRICE);
        perform(post("/api/v1/admin/mappings/{id}/confirm-payment", mapping.getId()), body)
                .andExpect(status().isOk());
        assertThat(reload(mapping).getPaymentStatus()).isEqualTo(PaymentStatus.CONFIRMED);
    }

    private ResultActions confirmDeposit(ConsultantClientMapping mapping, String reference) throws Exception {
        return perform(post("/api/v1/admin/mappings/{id}/confirm-deposit", mapping.getId()),
                Map.of("depositReference", reference));
    }

    private ResultActions terminate(ConsultantClientMapping mapping) throws Exception {
        return perform(post("/api/v1/admin/mappings/{id}/terminate", mapping.getId()),
                Map.of("reason", "dia-cancel"));
    }

    private Map<String, Object> checkoutBody() {
        Map<String, Object> body = new HashMap<>();
        body.put("paymentMethod", "CARD");
        body.put("paymentReference", "dia-oneshot");
        body.put("paymentAmount", PACKAGE_PRICE);
        return body;
    }

    private ResultActions perform(MockHttpServletRequestBuilder builder, Map<String, Object> body) throws Exception {
        return mockMvc.perform(builder
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body))
                .sessionAttr(SessionConstants.USER_OBJECT, caller())
                .sessionAttr(SessionConstants.TENANT_ID, tenantId));
    }

    private ConsultantClientMapping reload(ConsultantClientMapping mapping) {
        return mappingRepository.findById(mapping.getId()).orElseThrow();
    }

    private void saveLeftoverPostedIncome(ConsultantClientMapping mapping) {
        FinancialTransaction leftover = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE)
                .subcategory("CONSULTATION_FEE")
                .amount(BigDecimal.valueOf(PACKAGE_PRICE))
                .description("dia-leftover-income")
                .transactionDate(LocalDate.now())
                .relatedEntityId(mapping.getId())
                .relatedEntityType(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING)
                .taxIncluded(true)
                .taxAmount(BigDecimal.ZERO)
                .withholdingTaxAmount(BigDecimal.ZERO)
                .amountBeforeTax(BigDecimal.valueOf(PACKAGE_PRICE))
                .cardMerchantFeeAmount(BigDecimal.ZERO)
                .status(FinancialTransaction.TransactionStatus.COMPLETED)
                .build();
        leftover.setTenantId(tenantId);
        financialTransactionDelegate().saveAndFlush(leftover);
    }

    private FinancialTransactionRepository financialTransactionDelegate() {
        Object candidate = financialTransactionRepository;
        if (AopUtils.isAopProxy(candidate)) {
            candidate = AopTestUtils.getUltimateTargetObject(candidate);
        }
        org.mockito.MockingDetails details = org.mockito.Mockito.mockingDetails(candidate);
        if (!details.isMock()) {
            throw new IllegalStateException("financial transaction repository is not a spy");
        }
        Object delegated = readDelegatedObject(details.getMockHandler().getMockSettings().getDefaultAnswer());
        if (!(delegated instanceof FinancialTransactionRepository delegate) || delegate == financialTransactionRepository) {
            throw new IllegalStateException("financial transaction repository delegate unresolved");
        }
        return delegate;
    }

    private static Object readDelegatedObject(Object answer) {
        Class<?> type = answer.getClass();
        while (type != null) {
            try {
                java.lang.reflect.Field field = type.getDeclaredField("delegatedObject");
                field.setAccessible(true);
                return field.get(answer);
            } catch (NoSuchFieldException ignored) {
                type = type.getSuperclass();
            } catch (IllegalAccessException e) {
                throw new IllegalStateException(e);
            }
        }
        return null;
    }

    private Schedule saveSchedule(ConsultantClientMapping mapping, ScheduleStatus scheduleStatus, LocalDate date) {
        Schedule schedule = new Schedule();
        schedule.setTenantId(tenantId);
        schedule.setConsultantId(consultant.getId());
        schedule.setClientId(client.getId());
        schedule.setMappingId(mapping.getId());
        schedule.setDate(date);
        schedule.setStartTime(LocalTime.of(10, 0));
        schedule.setEndTime(LocalTime.of(10, 50));
        schedule.setStatus(scheduleStatus);
        schedule.setScheduleType("CONSULTATION");
        schedule.setConsultationType("INDIVIDUAL");
        schedule.setTitle("dia-it-schedule");
        schedule.setIsDeleted(false);
        Schedule saved = scheduleRepository.saveAndFlush(schedule);
        createdScheduleIds.add(saved.getId());
        return saved;
    }

    private ConsultantClientMapping saveMapping(MappingStatus status, PaymentStatus paymentStatus, String notes) {
        ConsultantClientMapping m = new ConsultantClientMapping();
        m.setTenantId(tenantId);
        m.setConsultant(consultant);
        m.setClient(client);
        m.setStartDate(LocalDateTime.now());
        m.setStatus(status);
        m.setPaymentStatus(paymentStatus);
        m.setPaymentMethod("CARD");
        m.setTotalSessions(TOTAL_SESSIONS);
        m.setRemainingSessions(0);
        m.setUsedSessions(0);
        m.setPackageName("dia-it");
        m.setPackagePrice(PACKAGE_PRICE);
        m.setPaymentAmount(PACKAGE_PRICE);
        m.setNotes(notes);
        ConsultantClientMapping saved = mappingRepository.saveAndFlush(m);
        createdMappingIds.add(saved.getId());
        return saved;
    }

    private User saveUser(UserRole role, String name) {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User user = new User();
        user.setTenantId(tenantId);
        user.setUserId("dia-" + role.name().toLowerCase() + "-" + suffix);
        user.setEmail("dia-" + suffix + "@example.test");
        user.setPassword("not-a-real-hash");
        user.setName(name);
        user.setRole(role);
        user.setIsDeleted(false);
        User saved = userRepository.saveAndFlush(user);
        createdUserIds.add(saved.getId());
        return saved;
    }

    private User caller() {
        User user = new User();
        user.setId(1L);
        user.setUserId("dia-caller-admin");
        user.setRole(UserRole.ADMIN);
        user.setTenantId(tenantId);
        return user;
    }
}
