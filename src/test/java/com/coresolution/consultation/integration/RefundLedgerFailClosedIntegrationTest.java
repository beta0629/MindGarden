package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import javax.sql.DataSource;
import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.exception.RefundLedgerNotRecordedException;
import com.coresolution.consultation.exception.SalaryTaxRateNotConfiguredException;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.AdminShopOrderRefundService;
import com.coresolution.consultation.service.MappingSettlementNotificationHelper;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.RefundAutoCancelNotificationService;
import com.coresolution.consultation.service.SalaryTaxRateLookupService;
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
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * 환불 전표 fail-closed — 기관 세율 공통코드가 없어 전표를 만들 수 없으면 매칭 변경까지 롤백하고 오류를 돌려준다.
 * 단건 종료·부분 환불·일괄 취소가 같은 경로를 쓴다. H2 실제 트랜잭션(테스트 트랜잭션 없음)으로 커밋 여부를 본다.
 *
 * <p>정상 경로에서는 전표가 정확히 1건이고 누적 환불이 결제액을 넘지 않으며, 외부 알림(환불 완료·결제 확인)은
 * 트랜잭션·커넥션이 반환된 뒤 호출되는지 기록한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@WithMockAdminSecurityContext
@DisplayName("환불 전표 fail-closed — 세율 미설정 시 매칭 롤백·오류, 정상 시 전표 1건·알림은 커넥션 반환 뒤")
class RefundLedgerFailClosedIntegrationTest {

    private static final long PACKAGE_PRICE = 100_000L;
    private static final String FULL_REFUND_SUBCATEGORY = "CONSULTATION_REFUND";
    private static final String PARTIAL_REFUND_SUBCATEGORY = "CONSULTATION_PARTIAL_REFUND";
    private static final String TAX_CODE_GROUP_HINT = "SALARY_TAX_RATE";

    private record CallBoundary(String call, boolean actualTransaction, boolean synchronization,
            boolean entityManagerBound, int activeConnections) {
    }

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private ConsultantClientMappingRepository mappingRepository;
    @Autowired private ScheduleRepository scheduleRepository;
    @Autowired private FinancialTransactionRepository financialTransactionRepository;
    @Autowired private DataSource dataSource;
    @Autowired private EntityManagerFactory entityManagerFactory;

    @MockBean private NotificationService notificationService;
    @MockBean private RefundAutoCancelNotificationService refundAutoCancelNotificationService;
    @MockBean private MappingSettlementNotificationHelper mappingSettlementNotificationHelper;
    @MockBean private AdminShopOrderRefundService adminShopOrderRefundService;
    @MockBean private SalaryTaxRateLookupService salaryTaxRateLookupService;

    private final List<CallBoundary> boundaries = new CopyOnWriteArrayList<>();
    private final List<Long> createdMappingIds = new ArrayList<>();
    private final List<Long> createdUserIds = new ArrayList<>();
    private String tenantId;
    private User consultant;
    private User client;

    @BeforeEach
    void setUp() {
        tenantId = "rlf-" + UUID.randomUUID().toString().replace("-", "").substring(0, 28);
        TenantContextHolder.setTenantId(tenantId);
        consultant = saveUser(UserRole.CONSULTANT, "상담사");
        client = saveUser(UserRole.CLIENT, "내담자");

        when(notificationService.sendRefundCompleted(any(), anyInt(), anyLong())).thenAnswer(inv -> {
            record("sendRefundCompleted");
            return true;
        });
        when(refundAutoCancelNotificationService.dispatchRefundAutoCancelNotification(
                anyString(), any(), anyLong(), anyInt(), anyString())).thenAnswer(inv -> {
                    record("dispatchRefundAutoCancelNotification");
                    return Map.of("INAPP", "OK");
                });
        org.mockito.Mockito.doAnswer(inv -> {
            record("notifyAfterMappingSettlement");
            return null;
        }).when(mappingSettlementNotificationHelper).notifyAfterMappingSettlement(any(), anyString(), any());
        configureTaxRates();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.setTenantId(tenantId);
        financialTransactionRepository.deleteAll(financialTransactionRepository.findByTenantId(tenantId));
        for (Long mappingId : createdMappingIds) {
            scheduleRepository.deleteAll(scheduleRepository.findByTenantIdAndConsultantIdAndClientIdAndDateGreaterThanEqual(
                    tenantId, consultant.getId(), client.getId(), LocalDate.now().minusYears(1)));
            mappingRepository.deleteById(mappingId);
        }
        createdUserIds.forEach(userRepository::deleteById);
        TenantContextHolder.clear();
    }

    // ── 세율 미설정 → 전체 실패 ──

    @Test
    @DisplayName("단건 종료 + 세율 미설정 — 422, 매칭 상태·회기 그대로, 전표 0건, 환불 알림 없음")
    void terminate_taxRateMissing_rollsBackMappingNoLedger() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.ACTIVE, 10, 6);
        removeTaxRates();

        postJson("/api/v1/admin/mappings/{id}/terminate", mapping.getId(), Map.of("reason", "it-terminate"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value(RefundLedgerNotRecordedException.ERROR_CODE))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString(TAX_CODE_GROUP_HINT)))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.not(
                        org.hamcrest.Matchers.containsString(tenantId))));

        ConsultantClientMapping after = reload(mapping);
        assertThat(after.getStatus()).isEqualTo(MappingStatus.ACTIVE);
        assertThat(after.getRemainingSessions()).isEqualTo(6);
        assertThat(ledgerRows(mapping)).isEmpty();
        assertThat(boundaries).isEmpty();
    }

    @Test
    @DisplayName("부분 환불 + 세율 미설정 — 422, 회기 차감 롤백, 부분 환불 전표 0건, 환불 알림 없음")
    void partialRefund_taxRateMissing_rollsBackSessionsNoLedger() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.ACTIVE, 10, 6);
        removeTaxRates();

        postJson("/api/v1/admin/mappings/{id}/partial-refund", mapping.getId(),
                Map.of("refundSessions", 2, "reason", "it-partial"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value(RefundLedgerNotRecordedException.ERROR_CODE));

        ConsultantClientMapping after = reload(mapping);
        assertThat(after.getStatus()).isEqualTo(MappingStatus.ACTIVE);
        assertThat(after.getRemainingSessions()).isEqualTo(6);
        assertThat(after.getTotalSessions()).isEqualTo(10);
        assertThat(ledgerRows(mapping)).isEmpty();
        assertThat(boundaries).isEmpty();
    }

    @Test
    @DisplayName("일괄 취소 + 세율 미설정 — 커밋 0건이라 422(세율 안내 문구), 매칭별 결과 모두 전표 미기록, 매칭 그대로·전표 0건")
    void bulkCancel_taxRateMissing_allItemsFailWithLedgerCode() throws Exception {
        ConsultantClientMapping first = saveMapping(MappingStatus.ACTIVE, 10, 6);
        ConsultantClientMapping second = saveMapping(MappingStatus.ACTIVE, 10, 6);
        removeTaxRates();

        postJson("/api/v1/admin/mapping/payment/cancel", null,
                Map.of("mappingIds", List.of(first.getId(), second.getId())))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString(TAX_CODE_GROUP_HINT)))
                .andExpect(jsonPath("$.data.results.length()").value(2))
                .andExpect(jsonPath("$.data.results[0].mappingId").value(first.getId()))
                .andExpect(jsonPath("$.data.results[0].status").value("FAILED"))
                .andExpect(jsonPath("$.data.results[0].code").value(RefundLedgerNotRecordedException.ERROR_CODE))
                .andExpect(jsonPath("$.data.results[1].mappingId").value(second.getId()))
                .andExpect(jsonPath("$.data.results[1].status").value("FAILED"))
                .andExpect(jsonPath("$.data.results[1].code").value(RefundLedgerNotRecordedException.ERROR_CODE))
                .andExpect(jsonPath("$.data.cancelledMappings.length()").value(0));

        for (ConsultantClientMapping mapping : List.of(first, second)) {
            assertThat(reload(mapping).getStatus()).isEqualTo(MappingStatus.ACTIVE);
            assertThat(reload(mapping).getRemainingSessions()).isEqualTo(6);
            assertThat(ledgerRows(mapping)).isEmpty();
        }
        assertThat(boundaries).isEmpty();
    }

    @Test
    @DisplayName("세율 미설정으로 실패한 뒤 세율을 설정하고 재시도 — 전표 정확히 1건(실패 시도는 흔적 없음)")
    void terminate_retryAfterTaxConfigured_recordsExactlyOnce() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.ACTIVE, 10, 6);
        removeTaxRates();
        postJson("/api/v1/admin/mappings/{id}/terminate", mapping.getId(), Map.of("reason", "it-terminate"))
                .andExpect(status().isUnprocessableEntity());

        configureTaxRates();
        postJson("/api/v1/admin/mappings/{id}/terminate", mapping.getId(), Map.of("reason", "it-terminate"))
                .andExpect(status().isOk());

        assertThat(reload(mapping).getStatus()).isEqualTo(MappingStatus.CANCELLED);
        assertThat(countBySubcategory(mapping, FULL_REFUND_SUBCATEGORY)).isEqualTo(1);
    }

    // ── 정상 경로 ──

    @Test
    @DisplayName("단건 종료 정상 — 200, CANCELLED, 전액 환불 전표 정확히 1건(≤ 결제액), 환불 알림은 트랜잭션·커넥션 밖")
    void terminate_normal_exactlyOneLedgerNotificationsOutsideTx() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.ACTIVE, 10, 6);

        postJson("/api/v1/admin/mappings/{id}/terminate", mapping.getId(), Map.of("reason", "it-terminate"))
                .andExpect(status().isOk());

        assertThat(reload(mapping).getStatus()).isEqualTo(MappingStatus.CANCELLED);
        assertThat(countBySubcategory(mapping, FULL_REFUND_SUBCATEGORY)).isEqualTo(1);
        assertThat(refundSum(mapping)).isLessThanOrEqualTo(BigDecimal.valueOf(PACKAGE_PRICE));
        assertThat(boundaries).extracting(CallBoundary::call).contains("sendRefundCompleted");
        assertExternalCallsOutsideTransaction();
    }

    @Test
    @DisplayName("부분 환불 정상 — 200, 회기 차감, 부분 환불 전표 정확히 1건, 환불 완료 알림은 트랜잭션·커넥션 밖")
    void partialRefund_normal_exactlyOneLedgerNotificationOutsideTx() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.ACTIVE, 10, 6);

        postJson("/api/v1/admin/mappings/{id}/partial-refund", mapping.getId(),
                Map.of("refundSessions", 2, "reason", "it-partial"))
                .andExpect(status().isOk());

        assertThat(reload(mapping).getRemainingSessions()).isEqualTo(4);
        assertThat(countBySubcategory(mapping, PARTIAL_REFUND_SUBCATEGORY)).isEqualTo(1);
        assertThat(boundaries).extracting(CallBoundary::call).containsExactly("sendRefundCompleted");
        assertExternalCallsOutsideTransaction();
    }

    @Test
    @DisplayName("누적 상한 — 부분 환불 2회 뒤 단건 종료, 누적 환불(부분+전액) ≤ 결제액")
    void partialTwiceThenTerminate_cumulativeWithinPaid() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.ACTIVE, 10, 8);

        for (int i = 0; i < 2; i++) {
            postJson("/api/v1/admin/mappings/{id}/partial-refund", mapping.getId(),
                    Map.of("refundSessions", 3, "reason", "it-partial-" + i))
                    .andExpect(status().isOk());
        }
        postJson("/api/v1/admin/mappings/{id}/terminate", mapping.getId(), Map.of("reason", "it-terminate"))
                .andExpect(status().isOk());

        assertThat(countBySubcategory(mapping, PARTIAL_REFUND_SUBCATEGORY)).isEqualTo(2);
        assertThat(countBySubcategory(mapping, FULL_REFUND_SUBCATEGORY)).isEqualTo(1);
        assertThat(refundSum(mapping)).isPositive();
        assertThat(refundSum(mapping)).isLessThanOrEqualTo(BigDecimal.valueOf(PACKAGE_PRICE));
    }

    @Test
    @DisplayName("단건 결제 확인 — 결제 정산 알림은 트랜잭션·커넥션 밖")
    void confirmPayment_settlementNotificationOutsideTx() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.PENDING_PAYMENT, 10, 10);

        postJson("/api/v1/admin/mappings/{id}/confirm-payment", mapping.getId(),
                Map.of("paymentMethod", "CARD", "paymentReference", "it-ref", "paymentAmount", PACKAGE_PRICE))
                .andExpect(status().isOk());

        assertThat(reload(mapping).getStatus()).isNotEqualTo(MappingStatus.PENDING_PAYMENT);
        assertThat(boundaries).extracting(CallBoundary::call).contains("notifyAfterMappingSettlement");
        assertExternalCallsOutsideTransaction();
    }

    private ResultActions postJson(String url, Long id, Map<String, Object> body) throws Exception {
        return mockMvc.perform((id != null ? post(url, id) : post(url))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body))
                .sessionAttr(SessionConstants.USER_OBJECT, caller())
                .sessionAttr(SessionConstants.TENANT_ID, tenantId));
    }

    private void configureTaxRates() {
        doReturn(new BigDecimal("0.10")).when(salaryTaxRateLookupService).getVatRate(anyString());
        doReturn(new BigDecimal("0.03")).when(salaryTaxRateLookupService).getWithholdingNationalRate(anyString());
        doReturn(new BigDecimal("0.003")).when(salaryTaxRateLookupService).getWithholdingLocalRate(anyString());
    }

    private void removeTaxRates() {
        doThrow(new SalaryTaxRateNotConfiguredException(TAX_CODE_GROUP_HINT, "VAT", null))
                .when(salaryTaxRateLookupService).getVatRate(anyString());
    }

    private void record(String call) {
        boundaries.add(new CallBoundary(call,
                TransactionSynchronizationManager.isActualTransactionActive(),
                TransactionSynchronizationManager.isSynchronizationActive(),
                TransactionSynchronizationManager.hasResource(entityManagerFactory),
                activeConnections()));
    }

    private void assertExternalCallsOutsideTransaction() {
        assertThat(boundaries).isNotEmpty();
        assertThat(boundaries).allSatisfy(b -> {
            assertThat(b.actualTransaction()).as(b.call() + " actualTransaction").isFalse();
            assertThat(b.synchronization()).as(b.call() + " synchronization").isFalse();
            assertThat(b.entityManagerBound()).as(b.call() + " entityManagerBound").isFalse();
            assertThat(b.activeConnections()).as(b.call() + " activeConnections").isZero();
        });
    }

    private int activeConnections() {
        try {
            return dataSource.unwrap(HikariDataSource.class).getHikariPoolMXBean().getActiveConnections();
        } catch (SQLException e) {
            throw new IllegalStateException(e);
        }
    }

    /** 이 매칭에 연결된 모든 원장 행 (전액·부분 환불·수입 포함) */
    private List<FinancialTransaction> ledgerRows(ConsultantClientMapping mapping) {
        return financialTransactionRepository.findByTenantId(tenantId).stream()
                .filter(t -> mapping.getId().equals(t.getRelatedEntityId()))
                .filter(t -> t.getRelatedEntityType() != null && t.getRelatedEntityType()
                        .startsWith(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING))
                .toList();
    }

    private long countBySubcategory(ConsultantClientMapping mapping, String subcategory) {
        return activeRefundExpenses(mapping).stream().filter(t -> subcategory.equals(t.getSubcategory())).count();
    }

    private List<FinancialTransaction> activeRefundExpenses(ConsultantClientMapping mapping) {
        return ledgerRows(mapping).stream()
                .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.EXPENSE)
                .filter(t -> t.getStatus() != FinancialTransaction.TransactionStatus.CANCELLED
                        && t.getStatus() != FinancialTransaction.TransactionStatus.REJECTED)
                .filter(t -> !Boolean.TRUE.equals(t.getIsDeleted()))
                .toList();
    }

    private BigDecimal refundSum(ConsultantClientMapping mapping) {
        return activeRefundExpenses(mapping).stream().map(FinancialTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private ConsultantClientMapping reload(ConsultantClientMapping mapping) {
        return mappingRepository.findById(mapping.getId()).orElseThrow();
    }

    private ConsultantClientMapping saveMapping(MappingStatus status, int total, int remaining) {
        ConsultantClientMapping m = new ConsultantClientMapping();
        m.setTenantId(tenantId);
        m.setConsultant(consultant);
        m.setClient(client);
        m.setStartDate(LocalDateTime.now());
        m.setStatus(status);
        m.setTotalSessions(total);
        m.setRemainingSessions(remaining);
        m.setUsedSessions(total - remaining);
        m.setPackageName("refund-ledger-it");
        m.setPackagePrice(PACKAGE_PRICE);
        ConsultantClientMapping saved = mappingRepository.saveAndFlush(m);
        createdMappingIds.add(saved.getId());
        return saved;
    }

    private User saveUser(UserRole role, String name) {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User user = new User();
        user.setTenantId(tenantId);
        user.setUserId("rlf-" + role.name().toLowerCase() + "-" + suffix);
        user.setEmail("rlf-" + suffix + "@example.test");
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
        user.setUserId("rlf-caller-admin");
        user.setRole(UserRole.ADMIN);
        user.setTenantId(tenantId);
        return user;
    }
}
