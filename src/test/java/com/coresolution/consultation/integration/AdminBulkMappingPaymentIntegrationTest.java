package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import javax.sql.DataSource;
import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.AdminShopOrderRefundService;
import com.coresolution.consultation.service.MappingSettlementNotificationHelper;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.RefundAutoCancelNotificationService;
import com.coresolution.consultation.service.SalaryTaxRateLookupService;
import com.coresolution.consultation.service.portone.PortOneV2PaymentCancelService;
import com.coresolution.consultation.service.support.ResourceOwnerAccessGuard;
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
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * POST /api/v1/admin/mapping/payment/{confirm,cancel} — H2 실제 트랜잭션·행 잠금·원장으로 돈 반례를 고정한다.
 *
 * <p>테스트 트랜잭션을 두지 않아 운영처럼 매칭마다 커밋된다. 외부 알림 빈만 목으로 바꿔 호출 시점의
 * 트랜잭션·커넥션 점유(Hikari active)를 기록한다. PortOne 취소·쇼핑 주문 환불 빈은 호출되지 않아야 한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@WithMockAdminSecurityContext
@DisplayName("일괄 결제 확인·취소 — 원장 환불 1회·전부 아니면 전무·외부 알림은 커넥션 반환 뒤")
class AdminBulkMappingPaymentIntegrationTest {

    private static final String CANCEL_URL = "/api/v1/admin/mapping/payment/cancel";
    private static final String CONFIRM_URL = "/api/v1/admin/mapping/payment/confirm";
    private static final long PACKAGE_PRICE = 100_000L;
    /** 전액 환불 전표 세부 카테고리 (AdminServiceImpl 전액 환불 SSOT 와 같은 값). */
    private static final String FULL_REFUND_SUBCATEGORY = "CONSULTATION_REFUND";

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
    @MockBean private PortOneV2PaymentCancelService portOneV2PaymentCancelService;
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
        tenantId = "bmp-" + UUID.randomUUID().toString().replace("-", "").substring(0, 28);
        TenantContextHolder.setTenantId(tenantId);
        consultant = saveUser(tenantId, UserRole.CONSULTANT, "상담사");
        client = saveUser(tenantId, UserRole.CLIENT, "내담자");

        when(notificationService.sendRefundCompleted(any(), anyInt(), anyLong())).thenAnswer(inv -> {
            record("sendRefundCompleted");
            return true;
        });
        when(refundAutoCancelNotificationService.dispatchRefundAutoCancelNotification(
                anyString(), any(), anyLong(), anyInt(), anyString())).thenAnswer(inv -> {
                    record("dispatchRefundAutoCancelNotification");
                    return Map.of("INAPP", "OK");
                });
        when(salaryTaxRateLookupService.getVatRate(anyString())).thenReturn(new BigDecimal("0.10"));
        when(salaryTaxRateLookupService.getWithholdingNationalRate(anyString())).thenReturn(new BigDecimal("0.03"));
        when(salaryTaxRateLookupService.getWithholdingLocalRate(anyString())).thenReturn(new BigDecimal("0.003"));
        org.mockito.Mockito.doAnswer(inv -> {
            record("notifyAfterMappingSettlement");
            return null;
        }).when(mappingSettlementNotificationHelper).notifyAfterMappingSettlement(any(), anyString(), any());
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

    @Test
    @DisplayName("JSON 정수 id(예전 500) — 200, 매칭 CANCELLED, 환불 전표 1건 ≤ 결제액, 미래 일정 취소, 외부 알림은 트랜잭션·커넥션 밖")
    void cancel_integerIds_refundOnce_externalCallsOutsideTx() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.ACTIVE, 10, 6);
        saveFutureBookedSchedule(mapping);

        perform(CANCEL_URL, Map.of("mappingIds", List.of(mapping.getId().intValue())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertThat(reload(mapping).getStatus()).isEqualTo(MappingStatus.CANCELLED);
        assertRefundExpenses(mapping, 1);
        assertThat(boundaries).extracting(CallBoundary::call)
                .contains("sendRefundCompleted", "dispatchRefundAutoCancelNotification");
        assertExternalCallsOutsideTransaction();
        verify(portOneV2PaymentCancelService, never()).cancelPayment(any(), any(), any());
        verify(portOneV2PaymentCancelService, never()).cancelPaymentAmount(any(), any(), any(), any());
        verify(adminShopOrderRefundService, never()).refundPaidOrder(any(), any(), any());
    }

    @Test
    @DisplayName("한 요청 안 중복 id(정수·문자열 섞임) — 한 번만 처리, 환불 전표 1건")
    void cancel_duplicateIds_processedOnce() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.ACTIVE, 10, 6);
        Long id = mapping.getId();

        perform(CANCEL_URL, Map.of("mappingIds", List.of(id, id.intValue(), String.valueOf(id))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.cancelledMappings.length()").value(1));

        assertRefundExpenses(mapping, 1);
    }

    @Test
    @DisplayName("같은 요청 반복 — 두 번째는 409, 원장 그대로(재환불 없음)")
    void cancel_repeatedRequest_conflictNoSecondRefund() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.ACTIVE, 10, 6);
        Map<String, Object> body = Map.of("mappingIds", List.of(mapping.getId()));

        perform(CANCEL_URL, body).andExpect(status().isOk());
        BigDecimal afterFirst = refundSum(mapping);
        perform(CANCEL_URL, body)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.reason").value("ALREADY_CLOSED"));

        assertRefundExpenses(mapping, 1);
        assertThat(refundSum(mapping)).isEqualByComparingTo(afterFirst);
    }

    @Test
    @DisplayName("같은 요청 동시 2건 — 행 잠금으로 환불 전표는 정확히 1건")
    void cancel_concurrentIdenticalRequests_refundOnce() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.ACTIVE, 10, 6);
        Map<String, Object> body = Map.of("mappingIds", List.of(mapping.getId()));
        SecurityContext securityContext = SecurityContextHolder.getContext();
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            List<Future<Integer>> results = new ArrayList<>();
            for (int i = 0; i < 2; i++) {
                results.add(pool.submit(() -> {
                    SecurityContextHolder.setContext(securityContext);
                    TenantContextHolder.setTenantId(tenantId);
                    try {
                        start.await();
                        return perform(CANCEL_URL, body).andReturn().getResponse().getStatus();
                    } finally {
                        TenantContextHolder.clear();
                        SecurityContextHolder.clearContext();
                    }
                }));
            }
            start.countDown();
            List<Integer> statuses = new ArrayList<>();
            for (Future<Integer> f : results) {
                statuses.add(f.get(60, TimeUnit.SECONDS));
            }
            assertThat(statuses).contains(200);
            assertThat(statuses).allMatch(s -> s == 200 || s == 409);
        } finally {
            pool.shutdownNow();
        }
        TenantContextHolder.setTenantId(tenantId);
        assertThat(reload(mapping).getStatus()).isEqualTo(MappingStatus.CANCELLED);
        assertRefundExpenses(mapping, 1);
    }

    @Test
    @DisplayName("부분 환불 뒤 일괄 취소 — 누적 환불(부분+전액)이 결제액을 넘지 않음")
    void cancel_afterPartialRefund_cumulativeWithinPaid() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.ACTIVE, 10, 6);
        mockMvc.perform(post("/api/v1/admin/mappings/{id}/partial-refund", mapping.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("refundSessions", 2, "reason", "it-partial")))
                        .sessionAttr(SessionConstants.USER_OBJECT, caller(UserRole.ADMIN, tenantId))
                        .sessionAttr(SessionConstants.TENANT_ID, tenantId))
                .andExpect(status().isOk());

        perform(CANCEL_URL, Map.of("mappingIds", List.of(mapping.getId()))).andExpect(status().isOk());

        BigDecimal cumulative = refundSum(mapping);
        assertThat(cumulative).isPositive();
        assertThat(cumulative).isLessThanOrEqualTo(BigDecimal.valueOf(PACKAGE_PRICE));
    }

    @Test
    @DisplayName("다른 기관·없는 id 가 섞이면 403(공통 거부 문구), 같은 기관 매칭도 처리 안 됨")
    void cancel_foreignOrUnknownId_forbiddenNothingProcessed() throws Exception {
        ConsultantClientMapping mine = saveMapping(MappingStatus.ACTIVE, 10, 6);
        String otherTenant = tenantId + "x";
        TenantContextHolder.setTenantId(otherTenant);
        User otherConsultant = saveUser(otherTenant, UserRole.CONSULTANT, "타기관상담사");
        User otherClient = saveUser(otherTenant, UserRole.CLIENT, "타기관내담자");
        ConsultantClientMapping foreign = mappingRepository.saveAndFlush(
                newMapping(otherTenant, otherConsultant, otherClient, MappingStatus.ACTIVE, 10, 6));
        createdMappingIds.add(foreign.getId());
        TenantContextHolder.setTenantId(tenantId);

        for (List<Long> ids : List.of(List.of(mine.getId(), foreign.getId()), List.of(mine.getId(), foreign.getId() + 900_000L))) {
            perform(CANCEL_URL, Map.of("mappingIds", ids))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.message").value(ResourceOwnerAccessGuard.DENIAL_RESOURCE_UNAVAILABLE))
                    .andExpect(jsonPath("$.data").doesNotExist());
            perform(CONFIRM_URL, Map.of("mappingIds", ids, "paymentMethod", "CARD", "amount", PACKAGE_PRICE))
                    .andExpect(status().isForbidden());
        }

        assertThat(reload(mine).getStatus()).isEqualTo(MappingStatus.ACTIVE);
        assertRefundExpenses(mine, 0);
        TenantContextHolder.setTenantId(otherTenant);
        assertThat(mappingRepository.findById(foreign.getId()).orElseThrow().getStatus()).isEqualTo(MappingStatus.ACTIVE);
        TenantContextHolder.setTenantId(tenantId);
        assertThat(boundaries).isEmpty();
    }

    @Test
    @DisplayName("형식 오류·빈 목록·유효+무효 섞임 — 400, 아무것도 처리 안 함")
    void cancel_invalidOrMixed_badRequestNothingProcessed() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.ACTIVE, 10, 6);
        List<Object> bodies = List.of(List.of(), List.of("abc"), List.of(mapping.getId(), "abc"),
                List.of(mapping.getId(), 1.5), List.of(mapping.getId(), -1), "1");
        for (Object ids : bodies) {
            perform(CANCEL_URL, Map.of("mappingIds", ids)).andExpect(status().isBadRequest());
            perform(CONFIRM_URL, Map.of("mappingIds", ids, "paymentMethod", "CARD", "amount", PACKAGE_PRICE))
                    .andExpect(status().isBadRequest());
        }
        assertThat(reload(mapping).getStatus()).isEqualTo(MappingStatus.ACTIVE);
        assertRefundExpenses(mapping, 0);
    }

    @Test
    @DisplayName("이미 종료된 매칭이 하나라도 섞이면 409, 다른 매칭도 처리 안 함")
    void cancel_batchWithClosedMapping_conflictNothingProcessed() throws Exception {
        ConsultantClientMapping active = saveMapping(MappingStatus.ACTIVE, 10, 6);
        ConsultantClientMapping closed = saveMapping(MappingStatus.CANCELLED, 10, 0);

        perform(CANCEL_URL, Map.of("mappingIds", List.of(active.getId(), closed.getId())))
                .andExpect(status().isConflict());

        assertThat(reload(active).getStatus()).isEqualTo(MappingStatus.ACTIVE);
        assertRefundExpenses(active, 0);
    }

    @Test
    @DisplayName("일괄 확인 — 합계 일치 200(각 매칭 결제 확인), 알림은 트랜잭션·커넥션 밖 / 합계 불일치 400 / 결제 대기 아님 409")
    void confirm_rules() throws Exception {
        ConsultantClientMapping a = saveMapping(MappingStatus.PENDING_PAYMENT, 10, 10);
        ConsultantClientMapping b = saveMapping(MappingStatus.PENDING_PAYMENT, 10, 10);

        perform(CONFIRM_URL, Map.of("mappingIds", List.of(a.getId(), b.getId()), "paymentMethod", "CARD",
                "amount", PACKAGE_PRICE)).andExpect(status().isBadRequest());
        assertThat(reload(a).getStatus()).isEqualTo(MappingStatus.PENDING_PAYMENT);
        assertThat(reload(b).getStatus()).isEqualTo(MappingStatus.PENDING_PAYMENT);

        perform(CONFIRM_URL, Map.of("mappingIds", List.of(a.getId().intValue(), b.getId().intValue()),
                "paymentMethod", "CARD", "amount", PACKAGE_PRICE * 2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.confirmedMappings.length()").value(2));
        assertThat(reload(a).getStatus()).isNotEqualTo(MappingStatus.PENDING_PAYMENT);
        assertThat(reload(b).getStatus()).isNotEqualTo(MappingStatus.PENDING_PAYMENT);
        assertThat(boundaries).extracting(CallBoundary::call).contains("notifyAfterMappingSettlement");
        assertExternalCallsOutsideTransaction();

        perform(CONFIRM_URL, Map.of("mappingIds", List.of(a.getId()), "paymentMethod", "CARD", "amount", PACKAGE_PRICE))
                .andExpect(status().isConflict());
    }

    private ResultActions perform(String url, Map<String, Object> body) throws Exception {
        return mockMvc.perform(post(url)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body))
                .sessionAttr(SessionConstants.USER_OBJECT, caller(UserRole.ADMIN, tenantId))
                .sessionAttr(SessionConstants.TENANT_ID, tenantId));
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

    private List<FinancialTransaction> refundExpenses(ConsultantClientMapping mapping) {
        return financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        tenantId, mapping.getId(), FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_REFUND)
                .stream()
                .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.EXPENSE)
                .filter(t -> t.getStatus() != FinancialTransaction.TransactionStatus.CANCELLED
                        && t.getStatus() != FinancialTransaction.TransactionStatus.REJECTED)
                .toList();
    }

    private BigDecimal refundSum(ConsultantClientMapping mapping) {
        return refundExpenses(mapping).stream().map(FinancialTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private void assertRefundExpenses(ConsultantClientMapping mapping, int expectedFullRefunds) {
        long fullRefunds = refundExpenses(mapping).stream()
                .filter(t -> FULL_REFUND_SUBCATEGORY.equals(t.getSubcategory()))
                .count();
        assertThat(fullRefunds).as("full refund EXPENSE count").isEqualTo(expectedFullRefunds);
        assertThat(refundSum(mapping)).isLessThanOrEqualTo(BigDecimal.valueOf(PACKAGE_PRICE));
    }

    private ConsultantClientMapping reload(ConsultantClientMapping mapping) {
        return mappingRepository.findById(mapping.getId()).orElseThrow();
    }

    private ConsultantClientMapping saveMapping(MappingStatus status, int total, int remaining) {
        ConsultantClientMapping saved = mappingRepository.saveAndFlush(
                newMapping(tenantId, consultant, client, status, total, remaining));
        createdMappingIds.add(saved.getId());
        return saved;
    }

    private static ConsultantClientMapping newMapping(String tenant, User consultant, User client,
            MappingStatus status, int total, int remaining) {
        ConsultantClientMapping m = new ConsultantClientMapping();
        m.setTenantId(tenant);
        m.setConsultant(consultant);
        m.setClient(client);
        m.setStartDate(LocalDateTime.now());
        m.setStatus(status);
        m.setTotalSessions(total);
        m.setRemainingSessions(remaining);
        m.setUsedSessions(total - remaining);
        m.setPackageName("bulk-pay-it");
        m.setPackagePrice(PACKAGE_PRICE);
        return m;
    }

    private void saveFutureBookedSchedule(ConsultantClientMapping mapping) {
        Schedule schedule = new Schedule();
        schedule.setTenantId(tenantId);
        schedule.setConsultantId(consultant.getId());
        schedule.setClientId(client.getId());
        schedule.setMappingId(mapping.getId());
        schedule.setDate(LocalDate.now().plusDays(3));
        schedule.setStartTime(LocalTime.of(10, 0));
        schedule.setEndTime(LocalTime.of(11, 0));
        schedule.setStatus(ScheduleStatus.BOOKED);
        schedule.setIsDeleted(false);
        scheduleRepository.saveAndFlush(schedule);
    }

    private User saveUser(String tenant, UserRole role, String name) {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User user = new User();
        user.setTenantId(tenant);
        user.setUserId("bmp-" + role.name().toLowerCase() + "-" + suffix);
        user.setEmail("bmp-" + suffix + "@example.test");
        user.setPassword("not-a-real-hash");
        user.setName(name);
        user.setRole(role);
        user.setIsDeleted(false);
        User saved = userRepository.saveAndFlush(user);
        createdUserIds.add(saved.getId());
        return saved;
    }

    private static User caller(UserRole role, String tenantId) {
        User user = new User();
        user.setId(1L);
        user.setUserId("bmp-caller-" + role);
        user.setRole(role);
        user.setTenantId(tenantId);
        return user;
    }
}
