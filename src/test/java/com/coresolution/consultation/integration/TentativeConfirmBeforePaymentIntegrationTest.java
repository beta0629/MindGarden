package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doReturn;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.constant.PaymentTimingConstants;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping.PaymentStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/**
 * 결제 대기 매칭의 가예약 확정과 결제 시점 단일 차감 — H2 실제 트랜잭션.
 *
 * <ul>
 *   <li>결제 대기(선납·사후 카드) 가예약 확정은 200, 회기·잔여 불변, 재요청도 불변.</li>
 *   <li>이후 입금 확인(선납) 또는 당일 카드 결제(사후 카드)에서 회기 1회 차감, INCOME 1건. 반복 요청은 반영 안 됨.</li>
 *   <li>결제 완료 매칭의 확정은 기존처럼 1회 차감, 재요청은 추가 차감 없음.</li>
 *   <li>내담자 세션·다른 테넌트 관리자 세션의 확정은 거절되고 일정·회기는 그대로.</li>
 *   <li>확정된 결제 대기 일정은 상담일지를 작성할 수 있고 잔여는 그대로.</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@WithMockAdminSecurityContext
@DisplayName("결제 대기 가예약 확정 — 확정 시 차감 없음, 결제 시 1회 차감·INCOME 1건")
class TentativeConfirmBeforePaymentIntegrationTest {

    private static final long PACKAGE_PRICE = 100_000L;
    private static final int TOTAL_SESSIONS = 10;
    /** 세션 속성이 아니라 확정 요청 userRole 쿼리 값으로만 쓰는 키. */
    private static final String ROLE_HINT_KEY = "tcbRoleHint";

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private ConsultantClientMappingRepository mappingRepository;
    @Autowired private ScheduleRepository scheduleRepository;
    @Autowired private FinancialTransactionRepository financialTransactionRepository;
    @Autowired private ConsultationRecordRepository consultationRecordRepository;

    @MockBean private StoredProcedureService storedProcedureService;
    @MockBean private MappingSettlementNotificationHelper mappingSettlementNotificationHelper;
    @MockBean private SalaryTaxRateLookupService salaryTaxRateLookupService;

    private final List<Long> createdMappingIds = new ArrayList<>();
    private final List<Long> createdUserIds = new ArrayList<>();
    private final List<Long> createdScheduleIds = new ArrayList<>();
    private String tenantId;
    private User consultant;
    private User client;

    @BeforeEach
    void setUp() {
        tenantId = "tcb-" + UUID.randomUUID().toString().replace("-", "").substring(0, 28);
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
        consultationRecordRepository.deleteAll(consultationRecordRepository.findAll().stream()
                .filter(r -> tenantId.equals(r.getTenantId()))
                .toList());
        createdScheduleIds.forEach(scheduleRepository::deleteById);
        createdMappingIds.forEach(mappingRepository::deleteById);
        createdUserIds.forEach(userRepository::deleteById);
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("선납 결제 대기: 확정 200·재확정 200 모두 회기 불변 → 입금 확인에서 1회 차감·INCOME 1건, 반복 입금 확인은 반영 없음")
    void advancePending_confirmThenDeposit_deductsOnceAtPayment() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.PENDING_PAYMENT, PaymentStatus.PENDING,
                PaymentTimingConstants.ADVANCE, 0);
        Schedule schedule = saveSchedule(mapping, ScheduleStatus.TENTATIVE_PENDING_PAYMENT);

        confirm(schedule, adminSession()).andExpect(status().isOk());
        assertSessions(mapping, 0, 0);
        assertThat(reloadSchedule(schedule).getStatus()).isEqualTo(ScheduleStatus.CONFIRMED);
        assertThat(incomeRows(mapping)).isEmpty();

        confirm(schedule, adminSession()).andExpect(status().isOk());
        assertSessions(mapping, 0, 0);

        perform(post("/api/v1/admin/mappings/{id}/confirm-payment", mapping.getId()), adminSession(),
                Map.of("paymentMethod", "BANK_TRANSFER", "paymentReference", "tcb-pay",
                        "paymentAmount", PACKAGE_PRICE))
                .andExpect(status().isOk());
        assertSessions(mapping, 0, 0);

        perform(post("/api/v1/admin/mappings/{id}/confirm-deposit", mapping.getId()), adminSession(),
                Map.of("depositReference", "tcb-dep"))
                .andExpect(status().isOk());
        assertSessions(mapping, 1, TOTAL_SESSIONS - 1);
        assertThat(incomeRows(mapping)).hasSize(1);
        assertThat(reloadSchedule(schedule).getSessionSequence()).isEqualTo(1);

        perform(post("/api/v1/admin/mappings/{id}/confirm-deposit", mapping.getId()), adminSession(),
                Map.of("depositReference", "tcb-dep"));
        confirm(schedule, adminSession());
        assertSessions(mapping, 1, TOTAL_SESSIONS - 1);
        assertThat(incomeRows(mapping)).hasSize(1);
    }

    @Test
    @DisplayName("사후 카드 결제 대기: 확정 200 회기 불변 → 당일 카드 결제에서 1회 차감·INCOME 1건, 같은 요청 반복은 반영 없음")
    void sameDayCardPending_confirmThenCheckout_deductsOnceAtPayment() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.PENDING_PAYMENT, PaymentStatus.PENDING,
                PaymentTimingConstants.SAME_DAY_CARD, 0);
        Schedule schedule = saveSchedule(mapping, ScheduleStatus.TENTATIVE_PENDING_PAYMENT);

        confirm(schedule, adminSession()).andExpect(status().isOk());
        assertSessions(mapping, 0, 0);
        assertThat(reloadSchedule(schedule).getStatus()).isEqualTo(ScheduleStatus.CONFIRMED);

        String requestId = UUID.randomUUID().toString();
        Map<String, Object> checkout = new HashMap<>();
        checkout.put("paymentMethod", "CARD");
        checkout.put("paymentReference", "tcb-card");
        checkout.put("paymentAmount", PACKAGE_PRICE);
        checkout.put("sameDaySessionScheduleId", schedule.getId());
        perform(post("/api/v1/admin/mappings/{id}/checkout-same-day", mapping.getId())
                .header("X-Request-Id", requestId), adminSession(), checkout)
                .andExpect(status().isOk());
        assertSessions(mapping, 1, TOTAL_SESSIONS - 1);
        assertThat(incomeRows(mapping)).hasSize(1);

        perform(post("/api/v1/admin/mappings/{id}/checkout-same-day", mapping.getId())
                .header("X-Request-Id", requestId), adminSession(), checkout);
        assertSessions(mapping, 1, TOTAL_SESSIONS - 1);
        assertThat(incomeRows(mapping)).hasSize(1);
    }

    @Test
    @DisplayName("결제 완료 매칭 확정은 기존처럼 1회 차감, 재확정은 추가 차감 없음")
    void paidMapping_confirmDeductsOnce() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.ACTIVE, PaymentStatus.APPROVED,
                PaymentTimingConstants.ADVANCE, TOTAL_SESSIONS);
        Schedule schedule = saveSchedule(mapping, ScheduleStatus.BOOKED);

        confirm(schedule, adminSession()).andExpect(status().isOk());
        assertSessions(mapping, 1, TOTAL_SESSIONS - 1);

        confirm(schedule, adminSession()).andExpect(status().isOk());
        assertSessions(mapping, 1, TOTAL_SESSIONS - 1);
    }

    @Test
    @DisplayName("결제 대기 매칭이 있어도 같은 쌍의 결제 완료 매칭 회기는 확정 때 차감되지 않는다")
    void pendingConfirm_doesNotConsumeSiblingActive() throws Exception {
        ConsultantClientMapping sibling = saveMapping(MappingStatus.ACTIVE, PaymentStatus.APPROVED,
                PaymentTimingConstants.ADVANCE, TOTAL_SESSIONS);
        ConsultantClientMapping pending = saveMapping(MappingStatus.PENDING_PAYMENT, PaymentStatus.PENDING,
                PaymentTimingConstants.ADVANCE, 0);
        Schedule schedule = saveSchedule(pending, ScheduleStatus.TENTATIVE_PENDING_PAYMENT);

        confirm(schedule, adminSession()).andExpect(status().isOk());

        assertSessions(pending, 0, 0);
        assertSessions(sibling, 0, TOTAL_SESSIONS);
    }

    @Test
    @DisplayName("내담자 세션의 확정 요청은 403, 일정·회기 그대로")
    void clientSession_confirmForbidden() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.PENDING_PAYMENT, PaymentStatus.PENDING,
                PaymentTimingConstants.ADVANCE, 0);
        Schedule schedule = saveSchedule(mapping, ScheduleStatus.TENTATIVE_PENDING_PAYMENT);

        confirm(schedule, session(client.getId(), UserRole.CLIENT, tenantId)).andExpect(status().isForbidden());

        assertThat(reloadSchedule(schedule).getStatus()).isEqualTo(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        assertThat(reloadSchedule(schedule).getSessionSequence()).isNull();
        assertSessions(mapping, 0, 0);
    }

    @Test
    @DisplayName("상담사 세션의 확정 요청은 거절, 일정 그대로")
    void consultantSession_confirmRejected() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.PENDING_PAYMENT, PaymentStatus.PENDING,
                PaymentTimingConstants.ADVANCE, 0);
        Schedule schedule = saveSchedule(mapping, ScheduleStatus.TENTATIVE_PENDING_PAYMENT);

        int status = confirm(schedule, session(consultant.getId(), UserRole.CONSULTANT, tenantId))
                .andReturn().getResponse().getStatus();

        assertThat(status).isBetween(400, 499);
        assertThat(reloadSchedule(schedule).getStatus()).isEqualTo(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
    }

    @Test
    @DisplayName("다른 테넌트 관리자 세션의 확정 요청은 거절, 일정·회기 그대로")
    void otherTenantAdmin_confirmRejected() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.PENDING_PAYMENT, PaymentStatus.PENDING,
                PaymentTimingConstants.ADVANCE, 0);
        Schedule schedule = saveSchedule(mapping, ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        String otherTenant = "tcb-other-" + UUID.randomUUID().toString().substring(0, 8);

        int status = confirm(schedule, session(1L, UserRole.ADMIN, otherTenant))
                .andReturn().getResponse().getStatus();

        TenantContextHolder.setTenantId(tenantId);
        assertThat(status).isBetween(400, 499);
        assertThat(reloadSchedule(schedule).getStatus()).isEqualTo(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        assertThat(reloadSchedule(schedule).getSessionSequence()).isNull();
        assertSessions(mapping, 0, 0);
    }

    @Test
    @DisplayName("확정된 선납 결제 대기 일정은 상담일지 작성 201, 잔여·사용 회기 그대로")
    void confirmedAdvancePending_allowsConsultationLog() throws Exception {
        ConsultantClientMapping mapping = saveMapping(MappingStatus.PENDING_PAYMENT, PaymentStatus.PENDING,
                PaymentTimingConstants.ADVANCE, 0);
        Schedule schedule = saveSchedule(mapping, ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        confirm(schedule, adminSession()).andExpect(status().isOk());

        Map<String, Object> record = new HashMap<>();
        record.put("consultationId", schedule.getId());
        record.put("clientId", client.getId());
        record.put("consultantId", consultant.getId());
        record.put("sessionDate", schedule.getDate().toString());
        record.put("clientCondition", "tcb-it");
        record.put("sessionDurationMinutes", 50);
        record.put("mainIssues", "tcb-it");
        record.put("interventionMethods", "tcb-it");
        record.put("clientResponse", "tcb-it");
        record.put("riskAssessment", "LOW");
        record.put("progressEvaluation", "tcb-it");
        perform(post("/api/v1/schedules/consultation-records"),
                session(consultant.getId(), UserRole.CONSULTANT, tenantId), record)
                .andExpect(status().is2xxSuccessful());

        assertSessions(mapping, 0, 0);
        assertThat(reloadSchedule(schedule).getSessionSequence()).isEqualTo(1);
    }

    private ResultActions confirm(Schedule schedule, Map<String, Object> sessionAttrs) throws Exception {
        return perform(put("/api/v1/schedules/{id}/confirm", schedule.getId())
                .param("userRole", String.valueOf(sessionAttrs.get(ROLE_HINT_KEY))),
                sessionAttrs, Map.of("adminNote", "tcb-confirm"));
    }

    private void assertSessions(ConsultantClientMapping mapping, int used, int remaining) {
        TenantContextHolder.setTenantId(tenantId);
        ConsultantClientMapping after = mappingRepository.findById(mapping.getId()).orElseThrow();
        assertThat(after.getUsedSessions()).as("usedSessions").isEqualTo(used);
        assertThat(after.getRemainingSessions()).as("remainingSessions").isEqualTo(remaining);
    }

    private Schedule reloadSchedule(Schedule schedule) {
        return scheduleRepository.findById(schedule.getId()).orElseThrow();
    }

    private List<FinancialTransaction> incomeRows(ConsultantClientMapping mapping) {
        TenantContextHolder.setTenantId(tenantId);
        return financialTransactionRepository.findByTenantId(tenantId).stream()
                .filter(t -> mapping.getId().equals(t.getRelatedEntityId()))
                .filter(t -> FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING
                        .equals(t.getRelatedEntityType()))
                .filter(t -> t.getTransactionType() == FinancialTransaction.TransactionType.INCOME)
                .filter(t -> !Boolean.TRUE.equals(t.getIsDeleted()))
                .toList();
    }

    private ResultActions perform(MockHttpServletRequestBuilder builder, Map<String, Object> sessionAttrs,
            Map<String, Object> body) throws Exception {
        builder.contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(body));
        sessionAttrs.forEach((name, value) -> {
            if (!ROLE_HINT_KEY.equals(name)) {
                builder.sessionAttr(name, value);
            }
        });
        ResultActions result = mockMvc.perform(builder);
        TenantContextHolder.setTenantId(tenantId);
        return result;
    }

    private Map<String, Object> adminSession() {
        return session(1L, UserRole.ADMIN, tenantId);
    }

    private Map<String, Object> session(Long userId, UserRole role, String sessionTenantId) {
        User user = new User();
        user.setId(userId);
        user.setUserId("tcb-caller-" + role.name().toLowerCase());
        user.setRole(role);
        user.setTenantId(sessionTenantId);
        Map<String, Object> attrs = new HashMap<>();
        attrs.put(SessionConstants.USER_OBJECT, user);
        attrs.put(SessionConstants.TENANT_ID, sessionTenantId);
        attrs.put(ROLE_HINT_KEY, role.name());
        return attrs;
    }

    private Schedule saveSchedule(ConsultantClientMapping mapping, ScheduleStatus status) {
        Schedule s = new Schedule();
        s.setTenantId(tenantId);
        s.setConsultantId(consultant.getId());
        s.setClientId(client.getId());
        s.setMappingId(mapping.getId());
        s.setDate(LocalDate.now().plusDays(7));
        s.setStartTime(LocalTime.of(10, 0));
        s.setEndTime(LocalTime.of(10, 50));
        s.setStatus(status);
        s.setScheduleType("CONSULTATION");
        s.setConsultationType("INDIVIDUAL");
        s.setTitle("tcb-it");
        s.setIsDeleted(false);
        Schedule saved = scheduleRepository.saveAndFlush(s);
        createdScheduleIds.add(saved.getId());
        return saved;
    }

    private ConsultantClientMapping saveMapping(MappingStatus status, PaymentStatus paymentStatus,
            String paymentTiming, int remaining) {
        ConsultantClientMapping m = new ConsultantClientMapping();
        m.setTenantId(tenantId);
        m.setConsultant(consultant);
        m.setClient(client);
        m.setStartDate(LocalDateTime.now());
        m.setStatus(status);
        m.setPaymentStatus(paymentStatus);
        m.setPaymentTiming(paymentTiming);
        m.setPaymentMethod("CARD");
        m.setTotalSessions(TOTAL_SESSIONS);
        m.setRemainingSessions(remaining);
        m.setUsedSessions(0);
        m.setPackageName("tcb-it");
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
        user.setUserId("tcb-" + role.name().toLowerCase() + "-" + suffix);
        user.setEmail("tcb-" + suffix + "@example.test");
        user.setPassword("not-a-real-hash");
        user.setName(name);
        user.setRole(role);
        user.setIsDeleted(false);
        User saved = userRepository.saveAndFlush(user);
        createdUserIds.add(saved.getId());
        return saved;
    }
}
