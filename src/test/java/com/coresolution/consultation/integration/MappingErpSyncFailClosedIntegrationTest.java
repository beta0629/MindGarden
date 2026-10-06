package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import javax.sql.DataSource;

import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.constant.InstitutionLinkConstants;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
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
import com.coresolution.consultation.service.erp.accounting.AccountingService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.consultation.service.StoredProcedureService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.integrationtest.support.WithMockAdminSecurityContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zaxxer.hikari.HikariDataSource;
import jakarta.persistence.EntityManagerFactory;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.AopTestUtils;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * 매칭 입금 확인·수정의 재무(ERP) 동기화 실패를 삼키지 않는다 — H2 실제 트랜잭션(테스트 트랜잭션 없음)으로 커밋 여부를 본다.
 *
 * <ul>
 *   <li>입금 확인: INCOME 기록 실패면 422, 입금 상태·회기·전표 모두 그대로. 성공이면 INCOME 1건, 재요청은 반영 안 됨.
 *       UpdateMappingInfo 는 부르지 않는다.</li>
 *   <li>수정(PUT): 입금 확인된 매칭의 금액·회기 변경은 UpdateMappingInfo 를 트랜잭션·커넥션 없이 먼저 부르고,
 *       실패면 422·변경 없음. 프로시저가 같은 행 version 을 올려도 수정이 커밋된다.</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@WithMockAdminSecurityContext
@DisplayName("매칭 ERP 동기화 fail-closed — 입금 확인·수정 실패 시 422·변경 없음, 프로시저는 트랜잭션 밖")
class MappingErpSyncFailClosedIntegrationTest {

    private static final long PACKAGE_PRICE = 100_000L;
    private static final long NEW_PACKAGE_PRICE = 120_000L;
    private static final String TAX_CODE_GROUP_HINT = "SALARY_TAX_RATE";

    private record CallBoundary(boolean actualTransaction, boolean synchronization, boolean entityManagerBound,
            int activeConnections) {
    }

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
    @Autowired private DataSource dataSource;
    @Autowired private EntityManagerFactory entityManagerFactory;
    @Autowired private JdbcTemplate jdbcTemplate;

    @MockBean private StoredProcedureService storedProcedureService;
    @MockBean private MappingSettlementNotificationHelper mappingSettlementNotificationHelper;
    @MockBean private SalaryTaxRateLookupService salaryTaxRateLookupService;

    private final List<CallBoundary> procedureCalls = new CopyOnWriteArrayList<>();
    private final List<Long> createdMappingIds = new ArrayList<>();
    private final List<Long> createdScheduleIds = new ArrayList<>();
    private final List<Long> createdUserIds = new ArrayList<>();
    private String tenantId;
    private User consultant;
    private User client;

    @BeforeEach
    void setUp() {
        tenantId = "mes-" + UUID.randomUUID().toString().replace("-", "").substring(0, 28);
        TenantContextHolder.setTenantId(tenantId);
        consultant = saveUser(UserRole.CONSULTANT, "상담사");
        client = saveUser(UserRole.CLIENT, "내담자");
        doReturn(new BigDecimal("0.10")).when(salaryTaxRateLookupService).getVatRate(anyString());
        doReturn(new BigDecimal("0.03")).when(salaryTaxRateLookupService).getWithholdingNationalRate(anyString());
        doReturn(new BigDecimal("0.003")).when(salaryTaxRateLookupService).getWithholdingLocalRate(anyString());
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.setTenantId(tenantId);
        financialTransactionRepository.deleteAll(financialTransactionRepository.findByTenantId(tenantId));
        createdScheduleIds.forEach(scheduleRepository::deleteById);
        createdMappingIds.forEach(mappingRepository::deleteById);
        createdUserIds.forEach(userRepository::deleteById);
        TenantContextHolder.clear();
    }

    // ── 입금 확인 ──

    @Test
    @DisplayName("입금 확인 + INCOME 기록 실패(세율 미설정) — 422, 입금 상태·회기 그대로, 전표 0건, 알림·프로시저 없음")
    void confirmDeposit_incomeFailure_rollsBackEverything() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.PAYMENT_CONFIRMED, PaymentStatus.CONFIRMED, 0);
        doThrow(new SalaryTaxRateNotConfiguredException(TAX_CODE_GROUP_HINT, "VAT", null))
                .when(salaryTaxRateLookupService).getVatRate(anyString());

        perform(post("/api/v1/admin/mappings/{id}/confirm-deposit", mapping.getId()),
                Map.of("depositReference", "it-dep-fail"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value(MappingErpSyncFailedException.ERROR_CODE))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.not(
                        org.hamcrest.Matchers.containsString(tenantId))));

        ConsultantClientMapping after = reload(mapping);
        assertThat(after.getPaymentStatus()).isEqualTo(PaymentStatus.CONFIRMED);
        assertThat(after.getStatus()).isEqualTo(MappingStatus.PAYMENT_CONFIRMED);
        assertThat(after.getRemainingSessions()).isZero();
        assertThat(incomeRows(mapping)).isEmpty();
        verify(mappingSettlementNotificationHelper, never()).notifyAfterMappingSettlement(any(), anyString(), any());
        verify(storedProcedureService, never()).updateMappingInfo(any(), any(), anyDouble(), anyInt(), any());
    }

    @Test
    @DisplayName("입금 확인 실패 후 세율 설정하고 재시도 — 200, INCOME 정확히 1건, 회기 충전. 같은 요청 반복은 반영 안 됨")
    void confirmDeposit_retryAfterFix_writesIncomeOnce() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.PAYMENT_CONFIRMED, PaymentStatus.CONFIRMED, 0);
        doThrow(new SalaryTaxRateNotConfiguredException(TAX_CODE_GROUP_HINT, "VAT", null))
                .when(salaryTaxRateLookupService).getVatRate(anyString());
        perform(post("/api/v1/admin/mappings/{id}/confirm-deposit", mapping.getId()),
                Map.of("depositReference", "it-dep-retry"))
                .andExpect(status().isUnprocessableEntity());

        doReturn(new BigDecimal("0.10")).when(salaryTaxRateLookupService).getVatRate(anyString());
        perform(post("/api/v1/admin/mappings/{id}/confirm-deposit", mapping.getId()),
                Map.of("depositReference", "it-dep-retry"))
                .andExpect(status().isOk());

        ConsultantClientMapping after = reload(mapping);
        assertThat(after.getPaymentStatus()).isEqualTo(PaymentStatus.APPROVED);
        assertThat(after.getRemainingSessions()).isEqualTo(10);
        assertThat(incomeRows(mapping)).hasSize(1);

        perform(post("/api/v1/admin/mappings/{id}/confirm-deposit", mapping.getId()),
                Map.of("depositReference", "it-dep-retry"));
        assertThat(incomeRows(mapping)).hasSize(1);
        assertThat(reload(mapping).getRemainingSessions()).isEqualTo(10);
        verify(storedProcedureService, never()).updateMappingInfo(any(), any(), anyDouble(), anyInt(), any());
    }

    @Test
    @DisplayName("원샷 결제 — 바깥 트랜잭션이 롤백되면 INCOME 0건. 생성은 입금 확인 한 번만")
    void checkoutSameDay_outerRollback_leavesNoIncome() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.PENDING_PAYMENT, PaymentStatus.PENDING, 0);
        clearInvocations(financialTransactionService);
        doThrow(new IllegalStateException("oneshot-outer-rollback"))
                .when(scheduleService).finalizeTentativeSchedulesAfterDepositConfirmed(any());
        try {
            perform(post("/api/v1/admin/mappings/{id}/checkout-same-day", mapping.getId())
                            .header("X-Request-Id", UUID.randomUUID().toString()),
                    checkoutBody())
                    .andExpect(status().isBadRequest());
        } finally {
            reset(scheduleService);
        }

        ConsultantClientMapping after = reload(mapping);
        assertThat(after.getStatus()).isEqualTo(MappingStatus.PENDING_PAYMENT);
        assertThat(after.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(incomeRows(mapping)).isEmpty();
        verify(financialTransactionService, never()).createTransaction(any(), any());
    }

    @Test
    @DisplayName("원샷 결제 성공 — INCOME 정확히 1건, 생성 시도 1회")
    void checkoutSameDay_success_writesIncomeOnce() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.PENDING_PAYMENT, PaymentStatus.PENDING, 0);
        clearInvocations(financialTransactionService);

        perform(post("/api/v1/admin/mappings/{id}/checkout-same-day", mapping.getId())
                        .header("X-Request-Id", UUID.randomUUID().toString()),
                checkoutBody())
                .andExpect(status().isOk());

        ConsultantClientMapping after = reload(mapping);
        assertThat(after.getStatus()).isEqualTo(MappingStatus.ACTIVE);
        assertThat(after.getPaymentStatus()).isEqualTo(PaymentStatus.APPROVED);
        assertThat(incomeRows(mapping)).hasSize(1);
        verify(financialTransactionService, times(1)).createTransaction(any(), any());
    }

    @Test
    @DisplayName("단독 결제 확인 — 호출자 트랜잭션을 롤백해도 REQUIRES_NEW INCOME은 남는다")
    void confirmPayment_standalone_commitsIncomeOutsideCallerRollback() {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.PENDING_PAYMENT, PaymentStatus.PENDING, 0);
        TransactionTemplate caller = new TransactionTemplate(transactionManager);
        caller.executeWithoutResult(status -> {
            adminService.confirmPayment(mapping.getId(), "CARD", "standalone-pay", PACKAGE_PRICE);
            status.setRollbackOnly();
        });

        ConsultantClientMapping after = reload(mapping);
        assertThat(after.getStatus()).isEqualTo(MappingStatus.PENDING_PAYMENT);
        assertThat(after.getPaymentStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(incomeRows(mapping)).hasSize(1);
    }

    @Test
    @DisplayName("입금 확인 + INCOME 저장 후 완료 처리 실패 — 422, 전표 0건, 회기 그대로, 커밋 전 분개 없음")
    void confirmDeposit_failureAfterIncomeInsert_rollsBackIncomeAndSkipsStatistics() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.PAYMENT_CONFIRMED, PaymentStatus.CONFIRMED, 0);
        FinancialTransactionRepository delegate = financialTransactionDelegate();
        doAnswer(invocation -> {
            FinancialTransaction entity = invocation.getArgument(0);
            FinancialTransaction saved = delegate.save(entity);
            if (saved.getStatus() == FinancialTransaction.TransactionStatus.COMPLETED) {
                throw new IllegalStateException("post-insert completion failure");
            }
            return saved;
        }).when(financialTransactionRepository).save(any(FinancialTransaction.class));

        try {
            perform(post("/api/v1/admin/mappings/{id}/confirm-deposit", mapping.getId()),
                    Map.of("depositReference", "it-dep-after-insert"))
                    .andExpect(status().isUnprocessableEntity())
                    .andExpect(jsonPath("$.code").value(MappingErpSyncFailedException.ERROR_CODE));
        } finally {
            reset(financialTransactionRepository);
        }

        ConsultantClientMapping after = reload(mapping);
        assertThat(after.getPaymentStatus()).isEqualTo(PaymentStatus.CONFIRMED);
        assertThat(after.getStatus()).isEqualTo(MappingStatus.PAYMENT_CONFIRMED);
        assertThat(after.getRemainingSessions()).isZero();
        assertThat(after.getUsedSessions()).isZero();
        assertThat(incomeRows(mapping)).isEmpty();
        verify(accountingService, never()).createJournalEntryFromTransaction(any(FinancialTransaction.class));
        verify(realTimeStatisticsService, never()).updateFinancialStatisticsOnPayment(
                isNull(), anyLong(), any(LocalDate.class));
        verify(storedProcedureService, never()).updateMappingInfo(any(), any(), anyDouble(), anyInt(), any());
    }

    @Test
    @DisplayName("가예약 1건 입금 확인 성공 후 재요청 — INCOME 1건, 회기 차감 1회")
    void confirmDeposit_withOneTentative_writesIncomeOnceAndDeductsOnce() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.PAYMENT_CONFIRMED, PaymentStatus.CONFIRMED, 0);
        saveTentative(mapping);

        perform(post("/api/v1/admin/mappings/{id}/confirm-deposit", mapping.getId()),
                Map.of("depositReference", "it-dep-tentative"))
                .andExpect(status().isOk());

        ConsultantClientMapping after = reload(mapping);
        assertThat(after.getPaymentStatus()).isEqualTo(PaymentStatus.APPROVED);
        assertThat(after.getUsedSessions()).isEqualTo(1);
        assertThat(after.getRemainingSessions()).isEqualTo(9);
        assertThat(incomeRows(mapping)).hasSize(1);
        verify(accountingService, atLeastOnce()).createJournalEntryFromTransaction(any(FinancialTransaction.class));

        perform(post("/api/v1/admin/mappings/{id}/confirm-deposit", mapping.getId()),
                Map.of("depositReference", "it-dep-tentative"));
        ConsultantClientMapping retried = reload(mapping);
        assertThat(incomeRows(mapping)).hasSize(1);
        assertThat(retried.getUsedSessions()).isEqualTo(1);
        assertThat(retried.getRemainingSessions()).isEqualTo(9);
        verify(storedProcedureService, never()).updateMappingInfo(any(), any(), anyDouble(), anyInt(), any());
    }

    // ── 매칭 수정 (PUT) ──

    @Test
    @DisplayName("입금 확인된 매칭 금액 변경 + 프로시저 실패 응답 — 422, 금액·회기 그대로")
    void updateMapping_paidPriceChange_procedureFails_noChange() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.ACTIVE, PaymentStatus.APPROVED, 10);
        when(storedProcedureService.updateMappingInfo(any(), any(), anyDouble(), anyInt(), any()))
                .thenAnswer(inv -> {
                    recordProcedureBoundary();
                    return Map.of("success", false, "message", "Duplicate entry");
                });

        perform(put("/api/v1/admin/mappings/{id}", mapping.getId()), priceChange(NEW_PACKAGE_PRICE))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value(MappingErpSyncFailedException.ERROR_CODE))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.not(
                        org.hamcrest.Matchers.containsString("Duplicate entry"))));

        ConsultantClientMapping after = reload(mapping);
        assertThat(after.getPackagePrice()).isEqualTo(PACKAGE_PRICE);
        assertThat(after.getTotalSessions()).isEqualTo(10);
        assertProcedureCalledOutsideTransaction();
    }

    @Test
    @DisplayName("입금 확인된 매칭 금액 변경 + 프로시저 예외 — 422, 변경 없음")
    void updateMapping_paidPriceChange_procedureThrows_noChange() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.ACTIVE, PaymentStatus.APPROVED, 10);
        when(storedProcedureService.updateMappingInfo(any(), any(), anyDouble(), anyInt(), any()))
                .thenThrow(new RuntimeException("Parameter number 6 is not an OUT parameter"));

        perform(put("/api/v1/admin/mappings/{id}", mapping.getId()), priceChange(NEW_PACKAGE_PRICE))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value(MappingErpSyncFailedException.ERROR_CODE));

        assertThat(reload(mapping).getPackagePrice()).isEqualTo(PACKAGE_PRICE);
    }

    @Test
    @DisplayName("입금 확인된 매칭 금액 변경 + 프로시저 성공(같은 행 version 증가) — 200, 수정 커밋, 프로시저는 트랜잭션·커넥션 밖")
    void updateMapping_paidPriceChange_procedureSucceeds_commits() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.ACTIVE, PaymentStatus.APPROVED, 10);
        when(storedProcedureService.updateMappingInfo(any(), any(), anyDouble(), anyInt(), any()))
                .thenAnswer(inv -> {
                    recordProcedureBoundary();
                    jdbcTemplate.update("UPDATE consultant_client_mappings SET package_price = ?, "
                            + "payment_amount = ?, version = version + 1 WHERE id = ?",
                            NEW_PACKAGE_PRICE, NEW_PACKAGE_PRICE, mapping.getId());
                    return Map.of("success", true, "message", "OK");
                });

        perform(put("/api/v1/admin/mappings/{id}", mapping.getId()), priceChange(NEW_PACKAGE_PRICE))
                .andExpect(status().isOk());

        assertThat(reload(mapping).getPackagePrice()).isEqualTo(NEW_PACKAGE_PRICE);
        assertProcedureCalledOutsideTransaction();
    }

    @Test
    @DisplayName("입금 전(PENDING) 매칭 금액 변경 — 전표가 없으니 프로시저 미호출, 200")
    void updateMapping_unpaidPriceChange_skipsProcedure() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.PENDING_PAYMENT, PaymentStatus.PENDING, 10);

        perform(put("/api/v1/admin/mappings/{id}", mapping.getId()), priceChange(NEW_PACKAGE_PRICE))
                .andExpect(status().isOk());

        assertThat(reload(mapping).getPackagePrice()).isEqualTo(NEW_PACKAGE_PRICE);
        verify(storedProcedureService, never()).updateMappingInfo(any(), any(), anyDouble(), anyInt(), any());
    }

    @Test
    @DisplayName("입금 확인된 타기관 연계 매칭 금액 변경 — 동기화 경로 없음 422, 변경 없음, 프로시저 미호출")
    void updateMapping_paidInstitutionLink_rejected() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.ACTIVE, PaymentStatus.APPROVED, 10);
        mapping.setPaymentTiming(InstitutionLinkConstants.PAYMENT_TIMING);
        mappingRepository.saveAndFlush(mapping);

        perform(put("/api/v1/admin/mappings/{id}", mapping.getId()), priceChange(NEW_PACKAGE_PRICE))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value(MappingErpSyncFailedException.ERROR_CODE));

        assertThat(reload(mapping).getPackagePrice()).isEqualTo(PACKAGE_PRICE);
        verify(storedProcedureService, never()).updateMappingInfo(any(), any(), anyDouble(), anyInt(), any());
    }

    @Test
    @DisplayName("레거시 POST /mappings/{id}/update 는 제거됨 — 매칭 변경 없음")
    void legacyUpdateEndpoint_removed() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.ACTIVE, PaymentStatus.APPROVED, 10);

        int status = perform(post("/api/v1/admin/mappings/{id}/update", mapping.getId()),
                Map.of("packageName", "x", "packagePrice", NEW_PACKAGE_PRICE, "totalSessions", 12))
                .andReturn().getResponse().getStatus();

        assertThat(status).isBetween(400, 499);
        assertThat(reload(mapping).getPackagePrice()).isEqualTo(PACKAGE_PRICE);
        verify(storedProcedureService, never()).updateMappingInfo(any(), any(), anyDouble(), anyInt(), any());
    }

    private Map<String, Object> checkoutBody() {
        Map<String, Object> body = new HashMap<>();
        body.put("paymentMethod", "CARD");
        body.put("paymentReference", "oneshot-it");
        body.put("paymentAmount", PACKAGE_PRICE);
        return body;
    }

    private Map<String, Object> priceChange(long price) {
        Map<String, Object> body = new HashMap<>();
        body.put("packageName", "mes-it");
        body.put("packagePrice", price);
        body.put("totalSessions", 10);
        return body;
    }

    private ResultActions perform(MockHttpServletRequestBuilder builder, Map<String, Object> body) throws Exception {
        return mockMvc.perform(builder
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body))
                .sessionAttr(SessionConstants.USER_OBJECT, caller())
                .sessionAttr(SessionConstants.TENANT_ID, tenantId));
    }

    private void recordProcedureBoundary() {
        procedureCalls.add(new CallBoundary(
                TransactionSynchronizationManager.isActualTransactionActive(),
                TransactionSynchronizationManager.isSynchronizationActive(),
                TransactionSynchronizationManager.hasResource(entityManagerFactory),
                activeConnections()));
    }

    private void assertProcedureCalledOutsideTransaction() {
        assertThat(procedureCalls).hasSize(1);
        CallBoundary b = procedureCalls.get(0);
        assertThat(b.actualTransaction()).as("actualTransaction").isFalse();
        assertThat(b.synchronization()).as("synchronization").isFalse();
        assertThat(b.entityManagerBound()).as("entityManagerBound").isFalse();
        assertThat(b.activeConnections()).as("activeConnections").isZero();
    }

    private int activeConnections() {
        try {
            return dataSource.unwrap(HikariDataSource.class).getHikariPoolMXBean().getActiveConnections();
        } catch (SQLException e) {
            throw new IllegalStateException(e);
        }
    }

    private List<FinancialTransaction> incomeRows(ConsultantClientMapping mapping) {
        return financialTransactionRepository.findByTenantId(tenantId).stream()
                .filter(t -> mapping.getId().equals(t.getRelatedEntityId()))
                .filter(t -> FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING
                        .equals(t.getRelatedEntityType()))
                .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.INCOME)
                .filter(t -> !Boolean.TRUE.equals(t.getIsDeleted()))
                .toList();
    }

    private ConsultantClientMapping reload(ConsultantClientMapping mapping) {
        return mappingRepository.findById(mapping.getId()).orElseThrow();
    }

    private FinancialTransactionRepository financialTransactionDelegate() {
        Object candidate = financialTransactionRepository;
        if (org.springframework.aop.support.AopUtils.isAopProxy(candidate)) {
            candidate = AopTestUtils.getUltimateTargetObject(candidate);
        }
        org.mockito.MockingDetails details = org.mockito.Mockito.mockingDetails(candidate);
        if (!details.isMock()) {
            throw new IllegalStateException("financial transaction repository is not a spy");
        }
        Object answer = details.getMockHandler().getMockSettings().getDefaultAnswer();
        Object delegated = readDelegatedObject(answer);
        if (!(delegated instanceof FinancialTransactionRepository delegate)
                || delegate == financialTransactionRepository) {
            throw new IllegalStateException("financial transaction repository delegate unresolved: "
                    + (answer == null ? "null" : answer.getClass().getName()));
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

    private Schedule saveTentative(ConsultantClientMapping mapping) {
        Schedule schedule = new Schedule();
        schedule.setTenantId(tenantId);
        schedule.setConsultantId(consultant.getId());
        schedule.setClientId(client.getId());
        schedule.setMappingId(mapping.getId());
        schedule.setDate(LocalDate.now().plusDays(7));
        schedule.setStartTime(LocalTime.of(10, 0));
        schedule.setEndTime(LocalTime.of(10, 50));
        schedule.setStatus(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        schedule.setScheduleType("CONSULTATION");
        schedule.setConsultationType("INDIVIDUAL");
        schedule.setTitle("mes-it-tentative");
        schedule.setIsDeleted(false);
        Schedule saved = scheduleRepository.saveAndFlush(schedule);
        createdScheduleIds.add(saved.getId());
        return saved;
    }

    private ConsultantClientMapping saveMapping(MappingStatus status, PaymentStatus paymentStatus, int remaining) {
        ConsultantClientMapping m = new ConsultantClientMapping();
        m.setTenantId(tenantId);
        m.setConsultant(consultant);
        m.setClient(client);
        m.setStartDate(LocalDateTime.now());
        m.setStatus(status);
        m.setPaymentStatus(paymentStatus);
        m.setPaymentMethod("CARD");
        m.setTotalSessions(10);
        m.setRemainingSessions(remaining);
        m.setUsedSessions(0);
        m.setPackageName("mes-it");
        m.setPackagePrice(PACKAGE_PRICE);
        m.setPaymentAmount(PACKAGE_PRICE);
        ConsultantClientMapping saved = mappingRepository.saveAndFlush(m);
        createdMappingIds.add(saved.getId());
        return saved;
    }

    private User saveUser(UserRole role, String name) {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User user = new User();
        user.setTenantId(tenantId);
        user.setUserId("mes-" + role.name().toLowerCase() + "-" + suffix);
        user.setEmail("mes-" + suffix + "@example.test");
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
        user.setUserId("mes-caller-admin");
        user.setRole(UserRole.ADMIN);
        user.setTenantId(tenantId);
        return user;
    }
}
