package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;

import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.constant.InstitutionLinkConstants;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping.PaymentStatus;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.exception.MappingAmountBelowRefundFloorException;
import com.coresolution.consultation.exception.MappingErpSyncFailedException;
import com.coresolution.consultation.exception.SalaryTaxRateNotConfiguredException;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.MappingSettlementNotificationHelper;
import com.coresolution.consultation.service.SalaryTaxRateLookupService;
import com.coresolution.consultation.service.StoredProcedureService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.integrationtest.support.WithMockAdminSecurityContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * 매칭 입금 확인·수정의 재무(ERP) 전표 — H2 실제 트랜잭션(테스트 트랜잭션 없음)으로 커밋 여부를 본다.
 *
 * <ul>
 *   <li>입금 확인: INCOME 기록 실패면 422, 입금 상태·회기·전표 모두 그대로. 성공이면 INCOME 1건, 재요청은 반영 안 됨.</li>
 *   <li>수정(PUT): 입금 확인된 매칭의 금액 변경은 매칭 변경과 차액 조정 INCOME 을 한 트랜잭션에서 남긴다. 기존 전표는
 *       그대로다. 감액은 (결제액 − 누적 환불액) 이상만 허용하고 음수 INCOME 조정 1건이다. 전표 실패면 422·매칭 변경 없음. 같은 요청 재전송·같은
 *       변경의 두 번째 기록은 전표를 늘리지 않는다({@code uk_financial_transactions_dedupe}). UpdateMappingInfo 는
 *       부르지 않는다.</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@WithMockAdminSecurityContext
@DisplayName("매칭 ERP 전표 fail-closed — 입금 확인·수정 실패 시 422·변경 없음, 금액 조정은 차액 전표 1건")
class MappingErpSyncFailClosedIntegrationTest {

    private static final long PACKAGE_PRICE = 100_000L;
    private static final long INCREASED_PRICE = 120_000L;
    private static final long PARTIAL_REFUNDED = 30_000L;
    private static final long REFUND_FLOOR = PACKAGE_PRICE - PARTIAL_REFUNDED;
    private static final int TOTAL_SESSIONS = 10;
    private static final String TAX_CODE_GROUP_HINT = "SALARY_TAX_RATE";
    private static final String DEDUPE_INDEX = "uk_financial_transactions_dedupe";
    private static final String CREATE_DEDUPE_INDEX = "CREATE UNIQUE INDEX IF NOT EXISTS " + DEDUPE_INDEX
            + " ON financial_transactions (tenant_id, related_entity_id, related_entity_type, transaction_type,"
            + " is_deleted)";

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private ConsultantClientMappingRepository mappingRepository;
    @Autowired private FinancialTransactionRepository financialTransactionRepository;
    @Autowired private JdbcTemplate jdbcTemplate;

    @MockBean private StoredProcedureService storedProcedureService;
    @MockBean private MappingSettlementNotificationHelper mappingSettlementNotificationHelper;
    @MockBean private SalaryTaxRateLookupService salaryTaxRateLookupService;

    private final List<Long> createdMappingIds = new ArrayList<>();
    private final List<Long> createdUserIds = new ArrayList<>();
    private final List<String> touchedTenants = new ArrayList<>();
    private boolean dedupeIndexCreatedHere;
    private String tenantId;
    private User consultant;
    private User client;

    @BeforeEach
    void setUp() {
        dedupeIndexCreatedHere = !dedupeIndexExists();
        jdbcTemplate.execute(CREATE_DEDUPE_INDEX);
        tenantId = newTenantId();
        TenantContextHolder.setTenantId(tenantId);
        consultant = saveUser(UserRole.CONSULTANT, "상담사");
        client = saveUser(UserRole.CLIENT, "내담자");
        doReturn(new BigDecimal("0.10")).when(salaryTaxRateLookupService).getVatRate(anyString());
        doReturn(new BigDecimal("0.03")).when(salaryTaxRateLookupService).getWithholdingNationalRate(anyString());
        doReturn(new BigDecimal("0.003")).when(salaryTaxRateLookupService).getWithholdingLocalRate(anyString());
    }

    @AfterEach
    void tearDown() {
        for (String t : touchedTenants) {
            TenantContextHolder.setTenantId(t);
            financialTransactionRepository.deleteAll(financialTransactionRepository.findByTenantId(t));
        }
        TenantContextHolder.setTenantId(tenantId);
        createdMappingIds.forEach(mappingRepository::deleteById);
        createdUserIds.forEach(userRepository::deleteById);
        TenantContextHolder.clear();
        if (dedupeIndexCreatedHere) {
            jdbcTemplate.execute("DROP INDEX IF EXISTS " + DEDUPE_INDEX);
        }
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
        assertThat(after.getRemainingSessions()).isEqualTo(TOTAL_SESSIONS);
        assertThat(incomeRows(mapping)).hasSize(1);

        perform(post("/api/v1/admin/mappings/{id}/confirm-deposit", mapping.getId()),
                Map.of("depositReference", "it-dep-retry"));
        assertThat(incomeRows(mapping)).hasSize(1);
        assertThat(reload(mapping).getRemainingSessions()).isEqualTo(TOTAL_SESSIONS);
        verify(storedProcedureService, never()).updateMappingInfo(any(), any(), anyDouble(), anyInt(), any());
    }

    // ── 매칭 수정 (PUT): 금액 ──

    @Test
    @DisplayName("입금 확인 매칭 증액 — 200, +차액 조정 INCOME 1건, 기존 INCOME 그대로. 재전송해도 1건")
    void updateMapping_paidIncrease_writesPositiveAdjustmentOnce() throws Exception {
        ConsultantClientMapping mapping = paidMappingWithBaseIncome();
        long baseVersion = reload(mapping).getVersion();

        putPackage(mapping, INCREASED_PRICE, TOTAL_SESSIONS).andExpect(status().isOk());
        putPackage(mapping, INCREASED_PRICE, TOTAL_SESSIONS).andExpect(status().isOk());

        ConsultantClientMapping after = reload(mapping);
        assertThat(after.getPackagePrice()).isEqualTo(INCREASED_PRICE);
        assertThat(after.getPaymentAmount()).isEqualTo(PACKAGE_PRICE);
        List<FinancialTransaction> adjustments = adjustmentRows(mapping);
        assertThat(adjustments).hasSize(1);
        FinancialTransaction adj = adjustments.get(0);
        assertThat(adj.getAmount()).isEqualByComparingTo(BigDecimal.valueOf(INCREASED_PRICE - PACKAGE_PRICE));
        assertThat(adj.getTransactionType()).isEqualTo(FinancialTransaction.TransactionType.INCOME);
        assertThat(adj.getRelatedEntityType())
                .isEqualTo(FinancialTransactionConstants.mappingPackageAdjustmentRelatedEntityType(baseVersion));
        assertThat(adj.getTaxAmount().add(adj.getAmountBeforeTax())).isEqualByComparingTo(adj.getAmount());
        assertBaseIncomeUntouched(mapping);
        verify(storedProcedureService, never()).updateMappingInfo(any(), any(), anyDouble(), anyInt(), any());
    }

    @Test
    @DisplayName("증액 후 원래 금액으로 감액(하한=결제액) — 200, +차액 INCOME / 음수 INCOME, 순수입=결제액")
    void updateMapping_increaseThenDecreaseToPaid_writesTwoAdjustments() throws Exception {
        ConsultantClientMapping mapping = paidMappingWithBaseIncome();

        putPackage(mapping, INCREASED_PRICE, TOTAL_SESSIONS).andExpect(status().isOk());
        putPackage(mapping, PACKAGE_PRICE, TOTAL_SESSIONS).andExpect(status().isOk());
        putPackage(mapping, PACKAGE_PRICE, TOTAL_SESSIONS).andExpect(status().isOk());

        assertThat(reload(mapping).getPackagePrice()).isEqualTo(PACKAGE_PRICE);
        List<FinancialTransaction> adjustments = adjustmentRows(mapping);
        assertThat(adjustments).hasSize(2);
        assertThat(adjustments).allMatch(t -> t.getTransactionType() == FinancialTransaction.TransactionType.INCOME);
        assertThat(adjustments).noneMatch(t -> t.getTransactionType() == FinancialTransaction.TransactionType.EXPENSE);
        assertThat(adjustments).filteredOn(t -> t.getAmount().signum() > 0)
                .singleElement().extracting(FinancialTransaction::getAmount)
                .satisfies(a -> assertThat(a).isEqualByComparingTo(BigDecimal.valueOf(INCREASED_PRICE - PACKAGE_PRICE)));
        assertThat(adjustments).filteredOn(t -> t.getAmount().signum() < 0)
                .singleElement().extracting(FinancialTransaction::getAmount)
                .satisfies(a -> assertThat(a).isEqualByComparingTo(
                        BigDecimal.valueOf(PACKAGE_PRICE - INCREASED_PRICE)));
        assertThat(netConsultationIncome(mapping)).isEqualByComparingTo(BigDecimal.valueOf(PACKAGE_PRICE));
        assertBaseIncomeUntouched(mapping);
    }

    @Test
    @DisplayName("감액 — 하한(결제액 − 부분환불) 초과 금액: 200, 차액 음수 INCOME 1건. 재전송해도 1건")
    void updateMapping_paidDecreaseAboveFloor_writesNegativeAdjustmentOnce() throws Exception {
        ConsultantClientMapping mapping = paidMappingWithBaseIncome();
        savePartialRefund(mapping, PARTIAL_REFUNDED);
        long newPrice = REFUND_FLOOR + 10_000L;

        putPackage(mapping, newPrice, TOTAL_SESSIONS).andExpect(status().isOk());
        putPackage(mapping, newPrice, TOTAL_SESSIONS).andExpect(status().isOk());

        assertThat(reload(mapping).getPackagePrice()).isEqualTo(newPrice);
        List<FinancialTransaction> adjustments = adjustmentRows(mapping);
        assertThat(adjustments).hasSize(1);
        assertDecreaseAdjustment(adjustments.get(0), PACKAGE_PRICE - newPrice);
        assertThat(netConsultationIncome(mapping)).isEqualByComparingTo(BigDecimal.valueOf(newPrice));
        assertBaseIncomeUntouched(mapping);
        assertThat(partialRefundRows(mapping)).hasSize(1);
    }

    @Test
    @DisplayName("감액 — 하한과 정확히 같은 금액: 200, 차액 음수 INCOME 1건. 재전송해도 1건")
    void updateMapping_paidDecreaseExactlyToFloor_allowed() throws Exception {
        ConsultantClientMapping mapping = paidMappingWithBaseIncome();
        savePartialRefund(mapping, PARTIAL_REFUNDED);

        putPackage(mapping, REFUND_FLOOR, TOTAL_SESSIONS).andExpect(status().isOk());
        putPackage(mapping, REFUND_FLOOR, TOTAL_SESSIONS).andExpect(status().isOk());

        assertThat(reload(mapping).getPackagePrice()).isEqualTo(REFUND_FLOOR);
        List<FinancialTransaction> adjustments = adjustmentRows(mapping);
        assertThat(adjustments).hasSize(1);
        assertDecreaseAdjustment(adjustments.get(0), PARTIAL_REFUNDED);
        assertBaseIncomeUntouched(mapping);
    }

    @Test
    @DisplayName("감액 — 하한 미만: 422 MAPPING_AMOUNT_BELOW_REFUND_FLOOR, 매칭·전표 변경 없음. 재전송해도 같음")
    void updateMapping_paidDecreaseBelowFloor_rejected() throws Exception {
        ConsultantClientMapping mapping = paidMappingWithBaseIncome();
        savePartialRefund(mapping, PARTIAL_REFUNDED);
        long versionBefore = reload(mapping).getVersion();

        for (int attempt = 0; attempt < 2; attempt++) {
            putPackage(mapping, REFUND_FLOOR - 1L, TOTAL_SESSIONS + 1)
                    .andExpect(status().isUnprocessableEntity())
                    .andExpect(jsonPath("$.errorCode").value(MappingAmountBelowRefundFloorException.ERROR_CODE))
                    .andExpect(jsonPath("$.code").value(MappingAmountBelowRefundFloorException.ERROR_CODE));
        }

        ConsultantClientMapping after = reload(mapping);
        assertThat(after.getPackagePrice()).isEqualTo(PACKAGE_PRICE);
        assertThat(after.getTotalSessions()).isEqualTo(TOTAL_SESSIONS);
        assertThat(after.getVersion()).isEqualTo(versionBefore);
        assertThat(adjustmentRows(mapping)).isEmpty();
        assertBaseIncomeUntouched(mapping);
    }

    @Test
    @DisplayName("감액 — 환불 없음: 하한=결제액이라 결제액 미만 감액은 422, 변경 없음")
    void updateMapping_paidDecreaseWithoutRefund_belowPaid_rejected() throws Exception {
        ConsultantClientMapping mapping = paidMappingWithBaseIncome();

        putPackage(mapping, PACKAGE_PRICE - 1L, TOTAL_SESSIONS)
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errorCode").value(MappingAmountBelowRefundFloorException.ERROR_CODE));

        assertThat(reload(mapping).getPackagePrice()).isEqualTo(PACKAGE_PRICE);
        assertThat(adjustmentRows(mapping)).isEmpty();
    }

    // ── 매칭 수정 (PUT): 회기 ──

    @Test
    @DisplayName("입금 확인 매칭 회기 증가 — 200, 총·잔여 회기 반영, 금액 변동 없으니 전표 0건")
    void updateMapping_paidSessionIncrease_noLedgerRows() throws Exception {
        ConsultantClientMapping mapping = paidMappingWithBaseIncome();

        putPackage(mapping, PACKAGE_PRICE, TOTAL_SESSIONS + 2).andExpect(status().isOk());

        ConsultantClientMapping increased = reload(mapping);
        assertThat(increased.getTotalSessions()).isEqualTo(TOTAL_SESSIONS + 2);
        assertThat(increased.getRemainingSessions()).isEqualTo(TOTAL_SESSIONS + 2);
        assertThat(adjustmentRows(mapping)).isEmpty();
        assertBaseIncomeUntouched(mapping);
        verify(storedProcedureService, never()).updateMappingInfo(any(), any(), anyDouble(), anyInt(), any());
    }

    @Test
    @DisplayName("입금 확인 매칭 회기 감소 — 200, 총·잔여 회기 반영, 전표 0건. 재전송해도 전표 없음")
    void updateMapping_paidSessionDecrease_noLedgerRows() throws Exception {
        ConsultantClientMapping mapping = paidMappingWithBaseIncome();

        putPackage(mapping, PACKAGE_PRICE, TOTAL_SESSIONS - 3).andExpect(status().isOk());
        putPackage(mapping, PACKAGE_PRICE, TOTAL_SESSIONS - 3).andExpect(status().isOk());

        ConsultantClientMapping decreased = reload(mapping);
        assertThat(decreased.getTotalSessions()).isEqualTo(TOTAL_SESSIONS - 3);
        assertThat(decreased.getRemainingSessions()).isEqualTo(TOTAL_SESSIONS - 3);
        assertThat(adjustmentRows(mapping)).isEmpty();
        assertBaseIncomeUntouched(mapping);
        verify(storedProcedureService, never()).updateMappingInfo(any(), any(), anyDouble(), anyInt(), any());
    }

    @Test
    @DisplayName("입금 확인 매칭 금액+회기 동시 증가 — 200, 회기 반영, 금액 차액 조정 1건")
    void updateMapping_paidPriceAndSessionsIncrease() throws Exception {
        ConsultantClientMapping mapping = paidMappingWithBaseIncome();

        putPackage(mapping, INCREASED_PRICE, TOTAL_SESSIONS + 2).andExpect(status().isOk());

        ConsultantClientMapping after = reload(mapping);
        assertThat(after.getPackagePrice()).isEqualTo(INCREASED_PRICE);
        assertThat(after.getTotalSessions()).isEqualTo(TOTAL_SESSIONS + 2);
        assertThat(adjustmentRows(mapping)).hasSize(1);
    }

    // ── 매칭 수정 (PUT): 실패·멱등 ──

    @Test
    @DisplayName("조정 전표 실패(세율 미설정) — 422 MAPPING_ERP_SYNC_FAILED, 매칭 금액·회기·version 그대로, 전표 0건. "
            + "전표 기록은 매칭 수정과 같은 트랜잭션 안")
    void updateMapping_ledgerFailure_rollsBackMapping() throws Exception {
        ConsultantClientMapping mapping = paidMappingWithBaseIncome();
        long versionBefore = reload(mapping).getVersion();
        List<Boolean> txActiveAtLedger = new CopyOnWriteArrayList<>();
        doAnswer(inv -> {
            txActiveAtLedger.add(TransactionSynchronizationManager.isActualTransactionActive());
            throw new SalaryTaxRateNotConfiguredException(TAX_CODE_GROUP_HINT, "VAT", null);
        }).when(salaryTaxRateLookupService).getVatRate(anyString());

        putPackage(mapping, INCREASED_PRICE, TOTAL_SESSIONS + 2)
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errorCode").value(MappingErpSyncFailedException.ERROR_CODE))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.not(
                        org.hamcrest.Matchers.containsString(TAX_CODE_GROUP_HINT + ".VAT"))));

        ConsultantClientMapping after = reload(mapping);
        assertThat(after.getPackagePrice()).isEqualTo(PACKAGE_PRICE);
        assertThat(after.getTotalSessions()).isEqualTo(TOTAL_SESSIONS);
        assertThat(after.getVersion()).isEqualTo(versionBefore);
        assertThat(adjustmentRows(mapping)).isEmpty();
        assertBaseIncomeUntouched(mapping);
        assertThat(txActiveAtLedger).containsExactly(true);
    }

    @Test
    @DisplayName("같은 변경의 조정 전표가 이미 있음(동시 요청이 먼저 커밋) — DB UNIQUE 로 거부, 422, 매칭 그대로, 전표 1건")
    void updateMapping_sameIdempotencyKeyAlreadyRecorded_rejectedByDbUnique() throws Exception {
        ConsultantClientMapping mapping = paidMappingWithBaseIncome();
        long baseVersion = reload(mapping).getVersion();
        saveLedger(mapping, FinancialTransaction.TransactionType.INCOME,
                FinancialTransactionConstants.mappingPackageAdjustmentRelatedEntityType(baseVersion),
                INCREASED_PRICE - PACKAGE_PRICE);

        putPackage(mapping, INCREASED_PRICE, TOTAL_SESSIONS)
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errorCode").value(MappingErpSyncFailedException.ERROR_CODE));

        assertThat(reload(mapping).getPackagePrice()).isEqualTo(PACKAGE_PRICE);
        assertThat(reload(mapping).getVersion()).isEqualTo(baseVersion);
        assertThat(adjustmentRows(mapping)).hasSize(1);
    }

    // ── 매칭 수정 (PUT): 입금 전·경로 없음 ──

    @Test
    @DisplayName("입금 전(PENDING) 매칭 금액 변경 — 200, INCOME·조정 전표 0건")
    void updateMapping_unpaidPriceChange_writesNoIncome() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.PENDING_PAYMENT, PaymentStatus.PENDING, 0);

        putPackage(mapping, INCREASED_PRICE, TOTAL_SESSIONS).andExpect(status().isOk());

        assertThat(reload(mapping).getPackagePrice()).isEqualTo(INCREASED_PRICE);
        assertThat(incomeRows(mapping)).isEmpty();
        assertThat(financialTransactionRepository.findByTenantId(tenantId)).isEmpty();
    }

    @Test
    @DisplayName("입금 확인된 타기관 연계 매칭 금액 변경 — 동기화 경로 없음 422, 변경 없음")
    void updateMapping_paidInstitutionLink_rejected() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.ACTIVE, PaymentStatus.APPROVED, TOTAL_SESSIONS);
        mapping.setPaymentTiming(InstitutionLinkConstants.PAYMENT_TIMING);
        mappingRepository.saveAndFlush(mapping);

        putPackage(mapping, INCREASED_PRICE, TOTAL_SESSIONS)
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value(MappingErpSyncFailedException.ERROR_CODE));

        assertThat(reload(mapping).getPackagePrice()).isEqualTo(PACKAGE_PRICE);
        assertThat(adjustmentRows(mapping)).isEmpty();
    }

    @Test
    @DisplayName("레거시 POST /mappings/{id}/update 는 제거됨 — 매칭 변경 없음")
    void legacyUpdateEndpoint_removed() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.ACTIVE, PaymentStatus.APPROVED, TOTAL_SESSIONS);

        int status = perform(post("/api/v1/admin/mappings/{id}/update", mapping.getId()),
                Map.of("packageName", "x", "packagePrice", INCREASED_PRICE, "totalSessions", 12))
                .andReturn().getResponse().getStatus();

        assertThat(status).isBetween(400, 499);
        assertThat(reload(mapping).getPackagePrice()).isEqualTo(PACKAGE_PRICE);
        verify(storedProcedureService, never()).updateMappingInfo(any(), any(), anyDouble(), anyInt(), any());
    }

    // ── 매칭 수정 (PUT): 권한·테넌트 ──

    @Test
    @WithMockUser(username = "mes-client", roles = {"CLIENT"})
    @DisplayName("내담자 역할 PUT — 403, 매칭·전표 변경 없음")
    void updateMapping_clientRole_forbidden() throws Exception {
        ConsultantClientMapping mapping = paidMappingWithBaseIncome();

        putPackage(mapping, INCREASED_PRICE, TOTAL_SESSIONS).andExpect(status().isForbidden());

        assertThat(reload(mapping).getPackagePrice()).isEqualTo(PACKAGE_PRICE);
        assertThat(adjustmentRows(mapping)).isEmpty();
    }

    @Test
    @WithMockUser(username = "mes-consultant", roles = {"CONSULTANT"})
    @DisplayName("상담사 역할 PUT — 403, 매칭·전표 변경 없음")
    void updateMapping_consultantRole_forbidden() throws Exception {
        ConsultantClientMapping mapping = paidMappingWithBaseIncome();

        putPackage(mapping, INCREASED_PRICE, TOTAL_SESSIONS).andExpect(status().isForbidden());

        assertThat(reload(mapping).getPackagePrice()).isEqualTo(PACKAGE_PRICE);
        assertThat(adjustmentRows(mapping)).isEmpty();
    }

    @Test
    @DisplayName("다른 테넌트 관리자가 이 매칭 PUT — 성공하지 않음, 매칭·전표 변경 없음, 다른 테넌트에도 전표 없음")
    void updateMapping_otherTenant_rejected() throws Exception {
        ConsultantClientMapping mapping = paidMappingWithBaseIncome();
        String otherTenant = newTenantId();
        TenantContextHolder.setTenantId(otherTenant);

        int status = mockMvc.perform(put("/api/v1/admin/mappings/{id}", mapping.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(packageBody(INCREASED_PRICE, TOTAL_SESSIONS)))
                        .sessionAttr(SessionConstants.USER_OBJECT, caller(otherTenant))
                        .sessionAttr(SessionConstants.TENANT_ID, otherTenant))
                .andReturn().getResponse().getStatus();

        assertThat(status).isGreaterThanOrEqualTo(400);
        TenantContextHolder.setTenantId(tenantId);
        assertThat(reload(mapping).getPackagePrice()).isEqualTo(PACKAGE_PRICE);
        assertThat(adjustmentRows(mapping)).isEmpty();
        TenantContextHolder.setTenantId(otherTenant);
        assertThat(financialTransactionRepository.findByTenantId(otherTenant)).isEmpty();
        TenantContextHolder.setTenantId(tenantId);
    }

    // ── helpers ──

    private ConsultantClientMapping paidMappingWithBaseIncome() {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.ACTIVE, PaymentStatus.APPROVED, TOTAL_SESSIONS);
        saveLedger(mapping, FinancialTransaction.TransactionType.INCOME,
                FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING, PACKAGE_PRICE);
        return mapping;
    }

    private void savePartialRefund(ConsultantClientMapping mapping, long amount) {
        saveLedger(mapping, FinancialTransaction.TransactionType.EXPENSE,
                FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_PARTIAL_REFUND, amount);
    }

    private void saveLedger(ConsultantClientMapping mapping, FinancialTransaction.TransactionType type,
            String relatedEntityType, long amount) {
        FinancialTransaction ft = FinancialTransaction.builder()
                .transactionType(type)
                .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE)
                .amount(BigDecimal.valueOf(amount))
                .transactionDate(LocalDate.now())
                .relatedEntityId(mapping.getId())
                .relatedEntityType(relatedEntityType)
                .status(FinancialTransaction.TransactionStatus.COMPLETED)
                .build();
        ft.setTenantId(tenantId);
        financialTransactionRepository.saveAndFlush(ft);
    }

    private void assertBaseIncomeUntouched(ConsultantClientMapping mapping) {
        List<FinancialTransaction> base = financialTransactionRepository
                .findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(tenantId, mapping.getId(),
                        FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING);
        assertThat(base).hasSize(1);
        assertThat(base.get(0).getAmount()).isEqualByComparingTo(BigDecimal.valueOf(PACKAGE_PRICE));
        assertThat(base.get(0).getStatus()).isEqualTo(FinancialTransaction.TransactionStatus.COMPLETED);
        assertThat(financialTransactionRepository.findByTenantId(tenantId))
                .noneMatch(ft -> Boolean.TRUE.equals(ft.getIsDeleted()));
    }

    private ResultActions putPackage(ConsultantClientMapping mapping, long price, int totalSessions)
            throws Exception {
        return perform(put("/api/v1/admin/mappings/{id}", mapping.getId()), packageBody(price, totalSessions));
    }

    private Map<String, Object> packageBody(long price, int totalSessions) {
        Map<String, Object> body = new HashMap<>();
        body.put("packageName", "mes-it");
        body.put("packagePrice", price);
        body.put("totalSessions", totalSessions);
        return body;
    }

    private ResultActions perform(MockHttpServletRequestBuilder builder, Map<String, Object> body) throws Exception {
        return mockMvc.perform(builder
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body))
                .sessionAttr(SessionConstants.USER_OBJECT, caller(tenantId))
                .sessionAttr(SessionConstants.TENANT_ID, tenantId));
    }

    private List<FinancialTransaction> incomeRows(ConsultantClientMapping mapping) {
        return mappingRows(mapping).stream()
                .filter(t -> FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING
                        .equals(t.getRelatedEntityType()))
                .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.INCOME)
                .toList();
    }

    private List<FinancialTransaction> adjustmentRows(ConsultantClientMapping mapping) {
        return mappingRows(mapping).stream()
                .filter(t -> t.getRelatedEntityType() != null && t.getRelatedEntityType()
                        .startsWith(FinancialTransactionConstants.RELATED_ENTITY_MAPPING_PACKAGE_ADJUSTMENT_PREFIX))
                .toList();
    }

    private List<FinancialTransaction> partialRefundRows(ConsultantClientMapping mapping) {
        return mappingRows(mapping).stream()
                .filter(t -> FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_PARTIAL_REFUND
                        .equals(t.getRelatedEntityType()))
                .toList();
    }

    /** 본전표 INCOME + 조정 INCOME(음수 감액 포함). 환불 EXPENSE 제외. */
    private BigDecimal netConsultationIncome(ConsultantClientMapping mapping) {
        return mappingRows(mapping).stream()
                .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.INCOME)
                .map(FinancialTransaction::getAmount)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private void assertDecreaseAdjustment(FinancialTransaction adj, long decrease) {
        assertThat(adj.getTransactionType()).isEqualTo(FinancialTransaction.TransactionType.INCOME);
        assertThat(adj.getSubcategory()).isEqualTo(FinancialTransactionConstants.SUBCATEGORY_PACKAGE_PRICE_ADJUSTMENT);
        assertThat(adj.getAmount()).isEqualByComparingTo(BigDecimal.valueOf(-decrease));
        assertThat(adj.getTaxAmount().add(adj.getAmountBeforeTax())).isEqualByComparingTo(adj.getAmount());
        assertThat(adj.getAmount().signum()).isNegative();
    }

    private List<FinancialTransaction> mappingRows(ConsultantClientMapping mapping) {
        return financialTransactionRepository.findByTenantId(tenantId).stream()
                .filter(t -> mapping.getId().equals(t.getRelatedEntityId()))
                .filter(t -> !Boolean.TRUE.equals(t.getIsDeleted()))
                .toList();
    }

    private boolean dedupeIndexExists() {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.INDEXES WHERE LOWER(INDEX_NAME) = ?",
                Integer.class, DEDUPE_INDEX);
        return count != null && count > 0;
    }

    private ConsultantClientMapping reload(ConsultantClientMapping mapping) {
        return mappingRepository.findById(mapping.getId()).orElseThrow();
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
        m.setTotalSessions(TOTAL_SESSIONS);
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

    private String newTenantId() {
        String t = "mes-" + UUID.randomUUID().toString().replace("-", "").substring(0, 28);
        touchedTenants.add(t);
        return t;
    }

    private User caller(String callerTenantId) {
        User user = new User();
        user.setId(1L);
        user.setUserId("mes-caller-admin");
        user.setRole(UserRole.ADMIN);
        user.setTenantId(callerTenantId);
        return user;
    }
}
