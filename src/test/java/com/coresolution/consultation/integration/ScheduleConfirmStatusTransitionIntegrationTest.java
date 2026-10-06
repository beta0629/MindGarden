package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Map;
import java.util.UUID;

import com.coresolution.consultation.constant.ScheduleServiceUserFacingMessages;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping.PaymentStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.ScheduleStatusTransitionException;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.util.ScheduleStatusTransitionPolicy;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.integrationtest.support.WithMockAdminSecurityContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

/**
 * 일정 확정 상태 전이 — H2 실제 서비스·컨트롤러.
 *
 * <ul>
 *   <li>취소·휴가·완료·진행중 일정 확정은 409 + 오류 코드, 회기·일정 변화 0.</li>
 *   <li>확정 → 취소(회기 복원) → 재확정은 409 로 막혀 재차감이 없다 (.dev 일정 551 사례).</li>
 *   <li>예약됨 확정은 1회 차감, 이미 확정된 일정 재확정은 변화 없음.</li>
 *   <li>결제 대기 매핑 가예약 확정은 허용하되 차감·다른 매핑 대체 차감 없음 (#1482/#1484 유지).</li>
 *   <li>취소·완료 일정을 수정 API 로 확정·예약 상태로 되돌리는 것도 막는다.</li>
 *   <li>다른 테넌트 일정 확정은 실패하고 대상 일정은 그대로다.</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@Transactional
@WithMockAdminSecurityContext
@DisplayName("일정 확정 상태 전이 — 확정 불가 상태 409·회기 변화 0")
class ScheduleConfirmStatusTransitionIntegrationTest {

    private static final int TOTAL_SESSIONS = 3;

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private ConsultantClientMappingRepository mappingRepository;
    @Autowired private ScheduleRepository scheduleRepository;
    @Autowired private ScheduleService scheduleService;

    private String tenantId;
    private User consultant;
    private User client;

    @BeforeEach
    void setUp() {
        tenantId = "scst-" + UUID.randomUUID().toString().replace("-", "").substring(0, 26);
        TenantContextHolder.setTenantId(tenantId);
        consultant = saveUser(tenantId, UserRole.CONSULTANT, "상담사");
        client = saveUser(tenantId, UserRole.CLIENT, "내담자");
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @ParameterizedTest(name = "{0} 일정 확정 → 409")
    @EnumSource(value = ScheduleStatus.class, names = {"CANCELLED", "VACATION", "COMPLETED", "IN_PROGRESS", "AVAILABLE"})
    @DisplayName("확정 불가 상태 일정 확정 — 409·오류 코드·회기 변화 0·상태 그대로")
    void confirm_nonConfirmableStatus_returns409WithoutSessionChange(ScheduleStatus status) throws Exception {
        ConsultantClientMapping mapping = saveActiveMapping(TOTAL_SESSIONS, 0);
        Schedule schedule = saveSchedule(tenantId, mapping, status);
        SessionCounts before = sessionCounts(mapping);

        confirm(schedule.getId())
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value(ScheduleStatusTransitionPolicy.CONFIRM_NOT_ALLOWED_ERROR_CODE))
                .andExpect(jsonPath("$.message").value(ScheduleServiceUserFacingMessages.MSG_SCHEDULE_STATUS_NOT_CONFIRMABLE));

        assertThat(sessionCounts(mapping)).isEqualTo(before);
        Schedule after = reload(schedule);
        assertThat(after.getStatus()).isEqualTo(status);
        assertThat(after.getSessionSequence()).isNull();
    }

    @Test
    @DisplayName("예약됨 확정 → 1회 차감, 취소(복원) 후 재확정 → 409·재차감 없음")
    void confirm_cancelThenReconfirm_isRejectedAndDoesNotDeductAgain() throws Exception {
        ConsultantClientMapping mapping = saveActiveMapping(TOTAL_SESSIONS, 0);
        Schedule schedule = saveSchedule(tenantId, mapping, ScheduleStatus.BOOKED);

        confirm(schedule.getId()).andExpect(status().isOk());
        assertThat(reload(schedule).getStatus()).isEqualTo(ScheduleStatus.CONFIRMED);
        assertThat(sessionCounts(mapping)).isEqualTo(new SessionCounts(TOTAL_SESSIONS, 1, TOTAL_SESSIONS - 1));

        scheduleService.cancelSchedule(schedule.getId(), "scst-cancel");
        assertThat(reload(schedule).getStatus()).isEqualTo(ScheduleStatus.CANCELLED);
        SessionCounts afterCancel = sessionCounts(mapping);
        assertThat(afterCancel).isEqualTo(new SessionCounts(TOTAL_SESSIONS, 0, TOTAL_SESSIONS));

        confirm(schedule.getId())
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value(ScheduleStatusTransitionPolicy.CONFIRM_NOT_ALLOWED_ERROR_CODE));
        confirm(schedule.getId()).andExpect(status().isConflict());

        assertThat(sessionCounts(mapping)).isEqualTo(afterCancel);
        assertThat(reload(schedule).getStatus()).isEqualTo(ScheduleStatus.CANCELLED);
    }

    @Test
    @DisplayName("이미 확정된 일정 재확정 — 200·회기 변화 없음(멱등)")
    void confirm_alreadyConfirmed_isIdempotent() throws Exception {
        ConsultantClientMapping mapping = saveActiveMapping(TOTAL_SESSIONS, 0);
        Schedule schedule = saveSchedule(tenantId, mapping, ScheduleStatus.BOOKED);
        confirm(schedule.getId()).andExpect(status().isOk());
        SessionCounts afterFirst = sessionCounts(mapping);
        Integer sequence = reload(schedule).getSessionSequence();

        confirm(schedule.getId()).andExpect(status().isOk());

        assertThat(sessionCounts(mapping)).isEqualTo(afterFirst);
        assertThat(reload(schedule).getSessionSequence()).isEqualTo(sequence);
    }

    @Test
    @DisplayName("결제 대기 매핑 가예약 확정 — 허용, 차감 없음, 같은 쌍 ACTIVE 매핑 대체 차감 없음")
    void confirm_tentativeOnPendingPaymentMapping_allowedWithoutDeduction() throws Exception {
        ConsultantClientMapping pending = saveMapping(tenantId, MappingStatus.PENDING_PAYMENT, PaymentStatus.PENDING,
                TOTAL_SESSIONS, 0, 0);
        ConsultantClientMapping active = saveActiveMapping(TOTAL_SESSIONS, 0);
        Schedule tentative = saveSchedule(tenantId, pending, ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        SessionCounts pendingBefore = sessionCounts(pending);
        SessionCounts activeBefore = sessionCounts(active);

        confirm(tentative.getId()).andExpect(status().isOk());

        assertThat(reload(tentative).getStatus()).isEqualTo(ScheduleStatus.CONFIRMED);
        assertThat(sessionCounts(pending)).isEqualTo(pendingBefore);
        assertThat(sessionCounts(active)).isEqualTo(activeBefore);
        assertThat(reloadMapping(pending).getStatus()).isEqualTo(MappingStatus.PENDING_PAYMENT);
    }

    @ParameterizedTest(name = "{0} 일정 → 수정 API 로 확정 시도 거절")
    @EnumSource(value = ScheduleStatus.class, names = {"CANCELLED", "COMPLETED"})
    @DisplayName("취소·완료 일정을 수정 API 로 확정 전환 — 거절, 회기 변화 0")
    void update_terminalToConfirmed_isRejected(ScheduleStatus terminal) {
        ConsultantClientMapping mapping = saveActiveMapping(TOTAL_SESSIONS, 0);
        Schedule schedule = saveSchedule(tenantId, mapping, terminal);
        SessionCounts before = sessionCounts(mapping);
        Schedule update = new Schedule();
        update.setStatus(ScheduleStatus.CONFIRMED);

        assertThatThrownBy(() -> scheduleService.updateSchedule(schedule.getId(), update))
                .isInstanceOf(ScheduleStatusTransitionException.class)
                .extracting(e -> ((ScheduleStatusTransitionException) e).getErrorCode())
                .isEqualTo(ScheduleStatusTransitionPolicy.REOCCUPY_NOT_ALLOWED_ERROR_CODE);

        assertThat(sessionCounts(mapping)).isEqualTo(before);
        assertThat(reload(schedule).getStatus()).isEqualTo(terminal);
    }

    @Test
    @DisplayName("다른 테넌트 예약됨 일정 확정 — 실패, 대상 일정·매핑 그대로")
    void confirm_otherTenantSchedule_failsAndLeavesItUntouched() throws Exception {
        String otherTenant = "scst-o-" + UUID.randomUUID().toString().replace("-", "").substring(0, 24);
        TenantContextHolder.setTenantId(otherTenant);
        User otherConsultant = saveUser(otherTenant, UserRole.CONSULTANT, "다른상담사");
        User otherClient = saveUser(otherTenant, UserRole.CLIENT, "다른내담자");
        ConsultantClientMapping otherMapping = saveMapping(otherTenant, otherConsultant, otherClient,
                MappingStatus.ACTIVE, PaymentStatus.APPROVED, TOTAL_SESSIONS, 0, TOTAL_SESSIONS);
        Schedule otherSchedule = saveSchedule(otherTenant, otherMapping, otherConsultant, otherClient,
                ScheduleStatus.BOOKED);
        TenantContextHolder.setTenantId(tenantId);

        ResultActions result = confirm(otherSchedule.getId());

        int httpStatus = result.andReturn().getResponse().getStatus();
        assertThat(httpStatus).isBetween(400, 499);
        TenantContextHolder.setTenantId(otherTenant);
        Schedule untouched = scheduleRepository.findByTenantIdAndId(otherTenant, otherSchedule.getId()).orElseThrow();
        assertThat(untouched.getStatus()).isEqualTo(ScheduleStatus.BOOKED);
        assertThat(untouched.getSessionSequence()).isNull();
        ConsultantClientMapping mappingAfter = mappingRepository.findByTenantIdAndId(otherTenant, otherMapping.getId())
                .orElseThrow();
        assertThat(mappingAfter.getUsedSessions()).isZero();
        assertThat(mappingAfter.getRemainingSessions()).isEqualTo(TOTAL_SESSIONS);
    }

    private ResultActions confirm(Long scheduleId) throws Exception {
        return mockMvc.perform(put("/api/v1/schedules/{id}/confirm", scheduleId)
                .sessionAttr(SessionConstants.USER_OBJECT, caller())
                .sessionAttr(SessionConstants.TENANT_ID, tenantId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("adminNote", "scst-confirm"))));
    }

    private SessionCounts sessionCounts(ConsultantClientMapping mapping) {
        ConsultantClientMapping current = reloadMapping(mapping);
        return new SessionCounts(
                current.getTotalSessions() == null ? 0 : current.getTotalSessions(),
                current.getUsedSessions() == null ? 0 : current.getUsedSessions(),
                current.getRemainingSessions() == null ? 0 : current.getRemainingSessions());
    }

    private ConsultantClientMapping reloadMapping(ConsultantClientMapping mapping) {
        return mappingRepository.findByTenantIdAndId(mapping.getTenantId(), mapping.getId()).orElseThrow();
    }

    private Schedule reload(Schedule schedule) {
        return scheduleRepository.findByTenantIdAndId(schedule.getTenantId(), schedule.getId()).orElseThrow();
    }

    private ConsultantClientMapping saveActiveMapping(int total, int used) {
        return saveMapping(tenantId, MappingStatus.ACTIVE, PaymentStatus.APPROVED, total, used, total - used);
    }

    private ConsultantClientMapping saveMapping(String tenant, MappingStatus status, PaymentStatus paymentStatus,
            int total, int used, int remaining) {
        return saveMapping(tenant, consultant, client, status, paymentStatus, total, used, remaining);
    }

    private ConsultantClientMapping saveMapping(String tenant, User mappingConsultant, User mappingClient,
            MappingStatus status, PaymentStatus paymentStatus, int total, int used, int remaining) {
        ConsultantClientMapping m = new ConsultantClientMapping();
        m.setTenantId(tenant);
        m.setConsultant(mappingConsultant);
        m.setClient(mappingClient);
        m.setStartDate(LocalDateTime.now());
        m.setStatus(status);
        m.setPaymentStatus(paymentStatus);
        m.setPaymentMethod("CARD");
        m.setTotalSessions(total);
        m.setUsedSessions(used);
        m.setRemainingSessions(remaining);
        m.setPackageName("scst-it");
        m.setIsDeleted(false);
        return mappingRepository.saveAndFlush(m);
    }

    private Schedule saveSchedule(String tenant, ConsultantClientMapping mapping, ScheduleStatus status) {
        return saveSchedule(tenant, mapping, consultant, client, status);
    }

    private Schedule saveSchedule(String tenant, ConsultantClientMapping mapping, User scheduleConsultant,
            User scheduleClient, ScheduleStatus status) {
        Schedule schedule = new Schedule();
        schedule.setTenantId(tenant);
        schedule.setConsultantId(scheduleConsultant.getId());
        schedule.setClientId(scheduleClient.getId());
        schedule.setMappingId(mapping.getId());
        schedule.setDate(LocalDate.now().plusDays(7));
        schedule.setStartTime(LocalTime.of(10, 0));
        schedule.setEndTime(LocalTime.of(10, 50));
        schedule.setStatus(status);
        schedule.setScheduleType("CONSULTATION");
        schedule.setConsultationType("INDIVIDUAL");
        schedule.setTitle("scst-it-schedule");
        schedule.setIsDeleted(false);
        return scheduleRepository.saveAndFlush(schedule);
    }

    private User saveUser(String tenant, UserRole role, String name) {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User user = new User();
        user.setTenantId(tenant);
        user.setUserId("scst-" + role.name().toLowerCase() + "-" + suffix);
        user.setEmail("scst-" + suffix + "@example.test");
        user.setPassword("not-a-real-hash");
        user.setName(name);
        user.setRole(role);
        user.setIsDeleted(false);
        return userRepository.saveAndFlush(user);
    }

    private User caller() {
        User user = new User();
        user.setId(1L);
        user.setUserId("scst-caller-admin");
        user.setRole(UserRole.ADMIN);
        user.setTenantId(tenantId);
        return user;
    }

    private record SessionCounts(int total, int used, int remaining) {
    }
}
