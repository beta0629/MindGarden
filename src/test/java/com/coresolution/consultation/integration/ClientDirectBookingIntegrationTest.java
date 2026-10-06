package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doReturn;
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
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import javax.sql.DataSource;

import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.constant.PaymentTimingConstants;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping.PaymentStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.Vacation;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.VacationRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.BatchNotificationDispatchService;
import com.coresolution.consultation.service.ImmediateReservationSmsDeferralService;
import com.coresolution.consultation.service.MappingSettlementNotificationHelper;
import com.coresolution.consultation.service.SalaryTaxRateLookupService;
import com.coresolution.consultation.service.StoredProcedureService;
import com.coresolution.core.constant.OnboardingConstants;
import com.coresolution.core.context.TenantContextHolder;
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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * 내담자 직접 예약 {@code POST /api/v1/clients/me/bookings} — H2 실제 트랜잭션.
 *
 * <ul>
 *   <li>예약 → 가예약(차감 0, INCOME 0) → 센터 확정(차감 0) → 당일 카드 결제에서 1회 차감·INCOME 1건, 재시도 반영 없음.</li>
 *   <li>본문 clientId 주입·다른 테넌트·세션 사용자 없음·CONSULTANT/ADMIN 은 거절, 일정 생성 없음.</li>
 *   <li>과거·겹침·휴무·비활성 매칭·공통코드에 없는 상담 유형은 거절, 일정 생성 없음.</li>
 *   <li>같은 슬롯 동시 2건은 1건만 생성.</li>
 *   <li>예약 안내 발송 시점에 트랜잭션·동기화·EntityManager 바인딩 없음, Hikari active 0.</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@WithMockUser(username = "cbk-client", roles = "CLIENT")
@DisplayName("내담자 직접 예약 — 가예약 접수, 결제 후 1회 차감, 권한·테넌트·검증 차단")
class ClientDirectBookingIntegrationTest {

    private static final String BOOKING_URL = "/api/v1/clients/me/bookings";
    private static final long PACKAGE_PRICE = 100_000L;
    private static final int TOTAL_SESSIONS = 10;
    private static final String TYPE_CODE = "CBK_IT_TYPE";

    private record CallBoundary(boolean actualTransaction, boolean synchronization, boolean entityManagerBound,
            int activeConnections) {
    }

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private ConsultantClientMappingRepository mappingRepository;
    @Autowired private ScheduleRepository scheduleRepository;
    @Autowired private FinancialTransactionRepository financialTransactionRepository;
    @Autowired private CommonCodeRepository commonCodeRepository;
    @Autowired private VacationRepository vacationRepository;
    @Autowired private DataSource dataSource;
    @Autowired private EntityManagerFactory entityManagerFactory;

    @MockBean private StoredProcedureService storedProcedureService;
    @MockBean private MappingSettlementNotificationHelper mappingSettlementNotificationHelper;
    @MockBean private SalaryTaxRateLookupService salaryTaxRateLookupService;
    @MockBean private BatchNotificationDispatchService batchNotificationDispatchService;
    @MockBean private ImmediateReservationSmsDeferralService immediateReservationSmsDeferralService;

    private final List<Long> createdMappingIds = new ArrayList<>();
    private final List<Long> createdUserIds = new ArrayList<>();
    private final List<Long> createdCodeIds = new ArrayList<>();
    private final List<Long> createdVacationIds = new ArrayList<>();
    private final List<CallBoundary> notificationCalls = new CopyOnWriteArrayList<>();
    private String tenantId;
    private User consultant;
    private User client;

    @BeforeEach
    void setUp() {
        tenantId = "cbk-" + UUID.randomUUID().toString().replace("-", "").substring(0, 28);
        TenantContextHolder.setTenantId(tenantId);
        consultant = saveUser(tenantId, UserRole.CONSULTANT, "상담사");
        client = saveUser(tenantId, UserRole.CLIENT, "내담자");
        saveConsultationTypeCode(tenantId);
        doReturn(new BigDecimal("0.10")).when(salaryTaxRateLookupService).getVatRate(anyString());
        doReturn(new BigDecimal("0.03")).when(salaryTaxRateLookupService).getWithholdingNationalRate(anyString());
        doReturn(new BigDecimal("0.003")).when(salaryTaxRateLookupService).getWithholdingLocalRate(anyString());
        doReturn(Optional.empty()).when(immediateReservationSmsDeferralService).resolveDeferredFireAt();
        doAnswer(inv -> {
            notificationCalls.add(currentBoundary());
            return null;
        }).when(batchNotificationDispatchService).dispatchReservationImmediateLate(anyLong());
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        TenantContextHolder.setTenantId(tenantId);
        financialTransactionRepository.deleteAll(financialTransactionRepository.findByTenantId(tenantId));
        scheduleRepository.deleteAll(scheduleRepository.findAll().stream()
                .filter(s -> createdUserIds.contains(s.getClientId()) || createdUserIds.contains(s.getConsultantId()))
                .toList());
        createdVacationIds.forEach(vacationRepository::deleteById);
        createdMappingIds.forEach(mappingRepository::deleteById);
        createdCodeIds.forEach(commonCodeRepository::deleteById);
        createdUserIds.forEach(userRepository::deleteById);
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("예약 → 가예약(차감 0·INCOME 0) → 센터 확정(차감 0) → 당일 카드 결제 1회 차감·INCOME 1건, 재시도 반영 없음")
    void booking_isTentative_thenConfirm_thenPaymentDeductsOnce() throws Exception {
        ConsultantClientMapping mapping = saveMapping(client, MappingStatus.PENDING_PAYMENT, PaymentStatus.PENDING,
                PaymentTimingConstants.SAME_DAY_CARD, 0);

        book(clientSession(client, tenantId), body(futureDate(), LocalTime.of(10, 0)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value(ScheduleStatus.TENTATIVE_PENDING_PAYMENT.name()));

        List<Schedule> schedules = schedulesOf(client);
        assertThat(schedules).hasSize(1);
        Schedule schedule = schedules.get(0);
        assertThat(schedule.getStatus()).isEqualTo(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        assertThat(schedule.getClientId()).isEqualTo(client.getId());
        assertThat(schedule.getTenantId()).isEqualTo(tenantId);
        assertThat(schedule.getConsultationType()).isEqualTo(TYPE_CODE);
        assertSessions(mapping, 0, 0);
        assertThat(incomeRows(mapping)).isEmpty();

        perform(put("/api/v1/schedules/{id}/confirm", schedule.getId()).param("userRole", UserRole.ADMIN.name()),
                adminSession(), Map.of("adminNote", "cbk-confirm"))
                .andExpect(status().isOk());
        assertThat(reload(schedule).getStatus()).isEqualTo(ScheduleStatus.CONFIRMED);
        assertSessions(mapping, 0, 0);
        assertThat(incomeRows(mapping)).isEmpty();

        String requestId = UUID.randomUUID().toString();
        Map<String, Object> checkout = new HashMap<>();
        checkout.put("paymentMethod", "CARD");
        checkout.put("paymentReference", "cbk-card");
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
    @DisplayName("ACTIVE(결제 완료) 매칭도 접수는 가예약, 접수 시 차감 없음")
    void activeMapping_bookingIsTentative_noDeduction() throws Exception {
        ConsultantClientMapping mapping = saveMapping(client, MappingStatus.ACTIVE, PaymentStatus.APPROVED,
                PaymentTimingConstants.ADVANCE, TOTAL_SESSIONS);

        book(clientSession(client, tenantId), body(futureDate(), LocalTime.of(11, 0)))
                .andExpect(status().isCreated());

        assertThat(schedulesOf(client)).singleElement()
                .extracting(Schedule::getStatus).isEqualTo(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        assertSessions(mapping, 0, TOTAL_SESSIONS);
    }

    @Test
    @DisplayName("본문 clientId 로 다른 내담자 예약 시도 → 400, 어느 내담자에게도 일정 없음")
    void bodyClientId_isRejected() throws Exception {
        User other = saveUser(tenantId, UserRole.CLIENT, "다른 내담자");
        saveMapping(client, MappingStatus.ACTIVE, PaymentStatus.APPROVED, PaymentTimingConstants.ADVANCE, TOTAL_SESSIONS);
        saveMapping(other, MappingStatus.ACTIVE, PaymentStatus.APPROVED, PaymentTimingConstants.ADVANCE, TOTAL_SESSIONS);
        Map<String, Object> body = body(futureDate(), LocalTime.of(10, 0));
        body.put("clientId", other.getId());

        book(clientSession(client, tenantId), body).andExpect(status().isBadRequest());

        assertThat(schedulesOf(client)).isEmpty();
        assertThat(schedulesOf(other)).isEmpty();
    }

    @Test
    @DisplayName("다른 테넌트 내담자 세션 → 403, 일정 없음")
    void otherTenantClient_isForbidden() throws Exception {
        String otherTenant = "cbk-o-" + UUID.randomUUID().toString().replace("-", "").substring(0, 26);
        User foreign = saveUser(otherTenant, UserRole.CLIENT, "타 테넌트 내담자");
        TenantContextHolder.setTenantId(tenantId);
        saveMapping(client, MappingStatus.ACTIVE, PaymentStatus.APPROVED, PaymentTimingConstants.ADVANCE, TOTAL_SESSIONS);

        book(clientSession(foreign, otherTenant), body(futureDate(), LocalTime.of(10, 0)))
                .andExpect(status().isForbidden());

        assertThat(schedulesOf(foreign)).isEmpty();
        assertThat(schedulesOf(consultant)).isEmpty();
    }

    @Test
    @DisplayName("세션 사용자 없음 → 401, 일정 없음")
    void noSessionUser_isUnauthorized() throws Exception {
        saveMapping(client, MappingStatus.ACTIVE, PaymentStatus.APPROVED, PaymentTimingConstants.ADVANCE, TOTAL_SESSIONS);

        book(Map.of(), body(futureDate(), LocalTime.of(10, 0))).andExpect(status().isUnauthorized());

        assertThat(schedulesOf(consultant)).isEmpty();
    }

    @Test
    @DisplayName("CONSULTANT·ADMIN 세션 → 403, 일정 없음")
    void consultantAndAdmin_areForbidden() throws Exception {
        saveMapping(client, MappingStatus.ACTIVE, PaymentStatus.APPROVED, PaymentTimingConstants.ADVANCE, TOTAL_SESSIONS);

        book(sessionOf(consultant.getId(), UserRole.CONSULTANT, tenantId), body(futureDate(), LocalTime.of(10, 0)))
                .andExpect(status().isForbidden());
        book(adminSession(), body(futureDate(), LocalTime.of(10, 0)))
                .andExpect(status().isForbidden());

        assertThat(schedulesOf(consultant)).isEmpty();
    }

    @Test
    @DisplayName("과거 시각 → 400 SCHEDULE_CREATE_IN_PAST, 일정 없음")
    void pastStart_isRejected() throws Exception {
        saveMapping(client, MappingStatus.ACTIVE, PaymentStatus.APPROVED, PaymentTimingConstants.ADVANCE, TOTAL_SESSIONS);

        book(clientSession(client, tenantId), body(LocalDate.now().minusDays(1), LocalTime.of(10, 0)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("SCHEDULE_CREATE_IN_PAST"));

        assertThat(schedulesOf(client)).isEmpty();
    }

    @Test
    @DisplayName("겹치는 슬롯 → 409 CLIENT_BOOKING_SLOT_CONFLICT, 기존 1건만")
    void overlappingSlot_isRejected() throws Exception {
        saveMapping(client, MappingStatus.ACTIVE, PaymentStatus.APPROVED, PaymentTimingConstants.ADVANCE, TOTAL_SESSIONS);
        LocalDate date = futureDate();
        book(clientSession(client, tenantId), body(date, LocalTime.of(10, 0))).andExpect(status().isCreated());

        Map<String, Object> overlap = body(date, LocalTime.of(10, 30));
        overlap.put("endTime", "11:20");
        book(clientSession(client, tenantId), overlap)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("CLIENT_BOOKING_SLOT_CONFLICT"));

        assertThat(schedulesOf(client)).hasSize(1);
    }

    @Test
    @DisplayName("상담사 휴무일 → 409 CLIENT_BOOKING_CONSULTANT_ON_VACATION, 일정 없음")
    void vacationDay_isRejected() throws Exception {
        saveMapping(client, MappingStatus.ACTIVE, PaymentStatus.APPROVED, PaymentTimingConstants.ADVANCE, TOTAL_SESSIONS);
        LocalDate date = futureDate();
        saveVacation(date);

        book(clientSession(client, tenantId), body(date, LocalTime.of(10, 0)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("CLIENT_BOOKING_CONSULTANT_ON_VACATION"));

        assertThat(schedulesOf(client)).isEmpty();
    }

    @Test
    @DisplayName("비활성 매칭(종료·선납 결제 대기) → 409 CLIENT_BOOKING_NO_ACTIVE_MAPPING, 일정 없음")
    void inactiveMapping_isRejected() throws Exception {
        saveMapping(client, MappingStatus.TERMINATED, PaymentStatus.APPROVED, PaymentTimingConstants.ADVANCE, 0);
        saveMapping(client, MappingStatus.PENDING_PAYMENT, PaymentStatus.PENDING, PaymentTimingConstants.ADVANCE, 0);

        book(clientSession(client, tenantId), body(futureDate(), LocalTime.of(10, 0)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("CLIENT_BOOKING_NO_ACTIVE_MAPPING"));

        assertThat(schedulesOf(client)).isEmpty();
    }

    @Test
    @DisplayName("공통코드에 없는 상담 유형 → 400, 일정 없음")
    void unknownConsultationType_isRejected() throws Exception {
        saveMapping(client, MappingStatus.ACTIVE, PaymentStatus.APPROVED, PaymentTimingConstants.ADVANCE, TOTAL_SESSIONS);
        Map<String, Object> body = body(futureDate(), LocalTime.of(10, 0));
        body.put("consultationType", "NOT_A_REGISTERED_TYPE");

        book(clientSession(client, tenantId), body).andExpect(status().isBadRequest());

        assertThat(schedulesOf(client)).isEmpty();
    }

    @Test
    @DisplayName("같은 슬롯 동시 2건 → 1건만 생성")
    void concurrentSameSlot_createsOnlyOne() throws Exception {
        saveMapping(client, MappingStatus.ACTIVE, PaymentStatus.APPROVED, PaymentTimingConstants.ADVANCE, TOTAL_SESSIONS);
        Map<String, Object> body = body(futureDate(), LocalTime.of(15, 0));
        Map<String, Object> session = clientSession(client, tenantId);
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            Callable<Integer> task = () -> {
                TenantContextHolder.setTenantId(tenantId);
                SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                        "cbk-client", null, List.of(new SimpleGrantedAuthority("ROLE_CLIENT"))));
                try {
                    start.await();
                    return book(session, body).andReturn().getResponse().getStatus();
                } finally {
                    SecurityContextHolder.clearContext();
                    TenantContextHolder.clear();
                }
            };
            Future<Integer> a = pool.submit(task);
            Future<Integer> b = pool.submit(task);
            start.countDown();
            List<Integer> statuses = List.of(a.get(30, TimeUnit.SECONDS), b.get(30, TimeUnit.SECONDS));
            assertThat(statuses).containsExactlyInAnyOrder(201, 409);
        } finally {
            pool.shutdownNow();
        }
        TenantContextHolder.setTenantId(tenantId);
        assertThat(schedulesOf(client)).hasSize(1);
    }

    @Test
    @DisplayName("예약 안내 발송 시점: 트랜잭션·동기화·EntityManager 바인딩 없음, Hikari active 0")
    void reservationNotification_runsWithoutHeldConnection() throws Exception {
        saveMapping(client, MappingStatus.ACTIVE, PaymentStatus.APPROVED, PaymentTimingConstants.ADVANCE, TOTAL_SESSIONS);

        book(clientSession(client, tenantId), body(LocalDate.now().plusDays(1), LocalTime.of(16, 0)))
                .andExpect(status().isCreated());

        assertThat(notificationCalls).hasSize(1);
        CallBoundary b = notificationCalls.get(0);
        assertThat(b.actualTransaction()).as("actualTransaction").isFalse();
        assertThat(b.synchronization()).as("synchronization").isFalse();
        assertThat(b.entityManagerBound()).as("entityManagerBound").isFalse();
        assertThat(b.activeConnections()).as("activeConnections").isZero();
    }

    private ResultActions book(Map<String, Object> session, Map<String, Object> body) throws Exception {
        return perform(post(BOOKING_URL), session, body);
    }

    private Map<String, Object> body(LocalDate date, LocalTime start) {
        Map<String, Object> body = new HashMap<>();
        body.put("consultantId", consultant.getId());
        body.put("date", date.toString());
        body.put("startTime", start.toString());
        body.put("endTime", start.plusMinutes(50).toString());
        body.put("consultationType", TYPE_CODE);
        return body;
    }

    private static LocalDate futureDate() {
        return LocalDate.now().plusDays(7);
    }

    private ResultActions perform(MockHttpServletRequestBuilder builder, Map<String, Object> sessionAttrs,
            Map<String, Object> body) throws Exception {
        builder.contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(body));
        sessionAttrs.forEach(builder::sessionAttr);
        ResultActions result = mockMvc.perform(builder);
        TenantContextHolder.setTenantId(tenantId);
        return result;
    }

    private Map<String, Object> clientSession(User user, String sessionTenantId) {
        return sessionOf(user.getId(), UserRole.CLIENT, sessionTenantId);
    }

    private Map<String, Object> adminSession() {
        return sessionOf(1L, UserRole.ADMIN, tenantId);
    }

    private Map<String, Object> sessionOf(Long userId, UserRole role, String sessionTenantId) {
        User user = new User();
        user.setId(userId);
        user.setUserId("cbk-caller-" + role.name().toLowerCase());
        user.setRole(role);
        user.setTenantId(sessionTenantId);
        Map<String, Object> attrs = new HashMap<>();
        attrs.put(SessionConstants.USER_OBJECT, user);
        attrs.put(SessionConstants.TENANT_ID, sessionTenantId);
        return attrs;
    }

    private CallBoundary currentBoundary() {
        try {
            return new CallBoundary(
                    TransactionSynchronizationManager.isActualTransactionActive(),
                    TransactionSynchronizationManager.isSynchronizationActive(),
                    TransactionSynchronizationManager.hasResource(entityManagerFactory),
                    dataSource.unwrap(HikariDataSource.class).getHikariPoolMXBean().getActiveConnections());
        } catch (SQLException e) {
            throw new IllegalStateException(e);
        }
    }

    private List<Schedule> schedulesOf(User user) {
        TenantContextHolder.setTenantId(tenantId);
        return scheduleRepository.findAll().stream()
                .filter(s -> user.getId().equals(s.getClientId()) || user.getId().equals(s.getConsultantId()))
                .filter(s -> !Boolean.TRUE.equals(s.getIsDeleted()))
                .toList();
    }

    private Schedule reload(Schedule schedule) {
        return scheduleRepository.findById(schedule.getId()).orElseThrow();
    }

    private void assertSessions(ConsultantClientMapping mapping, int used, int remaining) {
        TenantContextHolder.setTenantId(tenantId);
        ConsultantClientMapping after = mappingRepository.findById(mapping.getId()).orElseThrow();
        assertThat(after.getUsedSessions()).as("usedSessions").isEqualTo(used);
        assertThat(after.getRemainingSessions()).as("remainingSessions").isEqualTo(remaining);
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

    private void saveConsultationTypeCode(String codeTenantId) {
        CommonCode code = new CommonCode();
        code.setTenantId(codeTenantId);
        code.setCodeGroup(OnboardingConstants.TENANT_COMMON_CODE_GROUP_CONSULTATION_TYPE);
        code.setCodeValue(TYPE_CODE);
        code.setCodeLabel("cbk-it");
        code.setKoreanName("통합테스트 상담");
        code.setSortOrder(1);
        code.setIsActive(true);
        code.setIsDeleted(false);
        createdCodeIds.add(commonCodeRepository.saveAndFlush(code).getId());
    }

    private void saveVacation(LocalDate date) {
        Vacation vacation = new Vacation();
        vacation.setTenantId(tenantId);
        vacation.setConsultantId(consultant.getId());
        vacation.setVacationDate(date);
        vacation.setVacationType(Vacation.VacationType.ALL_DAY);
        vacation.setIsApproved(true);
        vacation.setIsDeleted(false);
        createdVacationIds.add(vacationRepository.saveAndFlush(vacation).getId());
    }

    private ConsultantClientMapping saveMapping(User mappedClient, MappingStatus status, PaymentStatus paymentStatus,
            String paymentTiming, int remaining) {
        ConsultantClientMapping m = new ConsultantClientMapping();
        m.setTenantId(tenantId);
        m.setConsultant(consultant);
        m.setClient(mappedClient);
        m.setStartDate(LocalDateTime.now());
        m.setStatus(status);
        m.setPaymentStatus(paymentStatus);
        m.setPaymentTiming(paymentTiming);
        m.setPaymentMethod("CARD");
        m.setTotalSessions(TOTAL_SESSIONS);
        m.setRemainingSessions(remaining);
        m.setUsedSessions(0);
        m.setPackageName("cbk-it");
        m.setPackagePrice(PACKAGE_PRICE);
        m.setPaymentAmount(PACKAGE_PRICE);
        ConsultantClientMapping saved = mappingRepository.saveAndFlush(m);
        createdMappingIds.add(saved.getId());
        return saved;
    }

    private User saveUser(String userTenantId, UserRole role, String name) {
        TenantContextHolder.setTenantId(userTenantId);
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User user = new User();
        user.setTenantId(userTenantId);
        user.setUserId("cbk-" + role.name().toLowerCase() + "-" + suffix);
        user.setEmail("cbk-" + suffix + "@example.test");
        user.setPassword("not-a-real-hash");
        user.setName(name);
        user.setRole(role);
        user.setIsDeleted(false);
        User saved = userRepository.saveAndFlush(user);
        createdUserIds.add(saved.getId());
        TenantContextHolder.setTenantId(tenantId);
        return saved;
    }
}
