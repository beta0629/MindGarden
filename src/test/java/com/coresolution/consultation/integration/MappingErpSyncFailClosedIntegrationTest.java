package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import javax.sql.DataSource;

import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.constant.InstitutionLinkConstants;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping.PaymentStatus;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.support.TransactionSynchronizationManager;

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
    @Autowired private FinancialTransactionRepository financialTransactionRepository;
    @Autowired private DataSource dataSource;
    @Autowired private EntityManagerFactory entityManagerFactory;
    @Autowired private JdbcTemplate jdbcTemplate;

    @MockBean private StoredProcedureService storedProcedureService;
    @MockBean private MappingSettlementNotificationHelper mappingSettlementNotificationHelper;
    @MockBean private SalaryTaxRateLookupService salaryTaxRateLookupService;

    private final List<CallBoundary> procedureCalls = new CopyOnWriteArrayList<>();
    private final List<Long> createdMappingIds = new ArrayList<>();
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
