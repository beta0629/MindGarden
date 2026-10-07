package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.Vacation;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.VacationRepository;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.integrationtest.support.WithMockAdminSecurityContext;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/**
 * GET /api/v1/schedules/consultant/{id}?startDate&endDate — 휴가 범위 병합·경계·권한 (H2 실제 컨트롤러·서비스).
 *
 * <ul>
 *   <li>날짜 분기도 무파라미터 분기와 같은 DTO(일정 + 휴가)를 범위만 좁혀 돌려준다.</li>
 *   <li>startDate·endDate 양끝 포함, 범위 밖 일정·휴가·삭제 휴가 제외, 이전 달 그리드 날짜 휴가 포함.</li>
 *   <li>휴가·일정 모두 범위 쿼리만 사용(전량 조회 후 필터 금지).</li>
 *   <li>다른 상담사 id 403, 다른 테넌트 상담사 id 는 데이터 0.</li>
 *   <li>날짜 미전달 호출은 기존 전량 동작 유지.</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-10-07
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@WithMockAdminSecurityContext
@DisplayName("상담사 일정 date-range — 휴가 범위 병합·경계·권한")
class ScheduleConsultantDateRangeVacationIntegrationTest {

    private static final String API = "/api/v1/schedules/consultant/{consultantId}";
    private static final LocalDate RANGE_START = LocalDate.of(2026, 9, 27);
    private static final LocalDate RANGE_END = LocalDate.of(2026, 11, 7);
    private static final String VACATION_STATUS = ScheduleStatus.VACATION.name();
    private static final int PERF_MONTHS = 24;
    private static final int PERF_SCHEDULES_PER_MONTH = 20;
    private static final int PERF_VACATIONS_PER_MONTH = 2;

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private EntityManagerFactory entityManagerFactory;
    @SpyBean private ScheduleRepository scheduleRepository;
    @SpyBean private VacationRepository vacationRepository;

    private String tenantId;
    private User consultant;
    private User otherConsultant;
    private User client;

    @BeforeEach
    void setUp() {
        tenantId = "scdr-" + UUID.randomUUID().toString().replace("-", "").substring(0, 26);
        TenantContextHolder.setTenantId(tenantId);
        consultant = saveUser(tenantId, UserRole.CONSULTANT, "범위상담사");
        otherConsultant = saveUser(tenantId, UserRole.CONSULTANT, "다른상담사");
        client = saveUser(tenantId, UserRole.CLIENT, "범위내담자");
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("날짜 분기 — 범위 안 일정·휴가만, 양끝 포함, 범위 밖·삭제 휴가 제외")
    void dateRange_includesVacationsInRangeOnly() throws Exception {
        Schedule beforeStart = saveSchedule(consultant, RANGE_START.minusDays(1));
        Schedule onStart = saveSchedule(consultant, RANGE_START);
        Schedule middle = saveSchedule(consultant, LocalDate.of(2026, 10, 15));
        Schedule onEnd = saveSchedule(consultant, RANGE_END);
        Schedule afterEnd = saveSchedule(consultant, RANGE_END.plusDays(1));
        saveSchedule(otherConsultant, LocalDate.of(2026, 10, 15));

        Vacation vacBefore = saveVacation(tenantId, consultant, RANGE_START.minusDays(1), false);
        Vacation vacPrevMonthGrid = saveVacation(tenantId, consultant, LocalDate.of(2026, 9, 30), false);
        Vacation vacNextMonthGrid = saveVacation(tenantId, consultant, LocalDate.of(2026, 11, 1), false);
        Vacation vacOnEnd = saveVacation(tenantId, consultant, RANGE_END, false);
        Vacation vacAfter = saveVacation(tenantId, consultant, RANGE_END.plusDays(1), false);
        Vacation vacDeleted = saveVacation(tenantId, consultant, LocalDate.of(2026, 10, 20), true);
        saveVacation(tenantId, otherConsultant, LocalDate.of(2026, 10, 10), false);

        List<JsonNode> rows = schedulesOf(perform(rangeRequest(consultant.getId()), selfCaller()));

        assertThat(scheduleIds(rows)).containsExactlyInAnyOrder(onStart.getId(), middle.getId(), onEnd.getId());
        assertThat(scheduleIds(rows)).doesNotContain(beforeStart.getId(), afterEnd.getId());
        assertThat(vacationDates(rows)).containsExactlyInAnyOrder(
                vacPrevMonthGrid.getVacationDate().toString(),
                vacNextMonthGrid.getVacationDate().toString(),
                vacOnEnd.getVacationDate().toString());
        assertThat(vacationDates(rows)).doesNotContain(
                vacBefore.getVacationDate().toString(),
                vacAfter.getVacationDate().toString(),
                vacDeleted.getVacationDate().toString());
        assertThat(rows).allSatisfy(row ->
                assertThat(row.path("consultantId").asLong()).isEqualTo(consultant.getId()));
    }

    @Test
    @DisplayName("날짜 분기 — 휴가·일정 모두 범위 쿼리만 사용 (전량 조회 없음)")
    void dateRange_usesRangeQueriesOnly() throws Exception {
        saveSchedule(consultant, LocalDate.of(2026, 10, 15));
        saveVacation(tenantId, consultant, LocalDate.of(2026, 10, 16), false);
        clearInvocations(scheduleRepository, vacationRepository);

        perform(rangeRequest(consultant.getId()), selfCaller());

        verify(vacationRepository).findByTenantIdAndConsultantIdAndDateRange(
                tenantId, consultant.getId(), RANGE_START, RANGE_END);
        verify(vacationRepository, never())
                .findByTenantIdAndConsultantIdAndIsDeletedFalseOrderByVacationDateAsc(anyString(), anyLong());
        verify(vacationRepository, never()).findByTenantIdAndIsDeletedFalseOrderByVacationDateAsc(anyString());
        verify(scheduleRepository).findByTenantIdAndConsultantIdAndDateBetween(
                tenantId, consultant.getId(), RANGE_START, RANGE_END);
        verify(scheduleRepository, never()).findByTenantIdAndConsultantId(anyString(), anyLong());
    }

    @Test
    @DisplayName("무파라미터 — 기존 전량 동작 유지, 같은 id 의 DTO 는 날짜 분기와 동일")
    void noParams_keepsFullFetchAndMatchesRangePayload() throws Exception {
        Schedule inRange = saveSchedule(consultant, LocalDate.of(2026, 10, 15));
        Schedule outRange = saveSchedule(consultant, LocalDate.of(2026, 12, 15));
        saveVacation(tenantId, consultant, LocalDate.of(2026, 10, 16), false);
        saveVacation(tenantId, consultant, LocalDate.of(2026, 12, 16), false);
        saveVacation(tenantId, consultant, LocalDate.of(2026, 10, 17), true);

        List<JsonNode> full = schedulesOf(perform(get(API, consultant.getId()), selfCaller()));
        List<JsonNode> range = schedulesOf(perform(rangeRequest(consultant.getId()), selfCaller()));

        assertThat(scheduleIds(full)).containsExactlyInAnyOrder(inRange.getId(), outRange.getId());
        assertThat(vacationDates(full)).containsExactlyInAnyOrder("2026-10-16", "2026-12-16");

        Map<Long, JsonNode> fullById = new HashMap<>();
        full.forEach(row -> fullById.put(row.path("id").asLong(), row));
        assertThat(range).isNotEmpty();
        for (JsonNode row : range) {
            assertThat(row).isEqualTo(fullById.get(row.path("id").asLong()));
        }
    }

    @Test
    @DisplayName("한쪽 날짜만 전달 — 기존처럼 전량 분기")
    void onlyStartDate_fallsBackToFullFetch() throws Exception {
        Schedule outRange = saveSchedule(consultant, LocalDate.of(2025, 1, 15));

        List<JsonNode> rows = schedulesOf(perform(
                get(API, consultant.getId()).param("startDate", RANGE_START.toString()), selfCaller()));

        assertThat(scheduleIds(rows)).contains(outRange.getId());
    }

    @Test
    @DisplayName("날짜 분기 — 상담사가 다른 상담사 id 조회 시 403, 타인 데이터 없음")
    void dateRange_otherConsultant_forbidden() throws Exception {
        saveSchedule(otherConsultant, LocalDate.of(2026, 10, 15));
        saveVacation(tenantId, otherConsultant, LocalDate.of(2026, 10, 16), false);
        clearInvocations(scheduleRepository, vacationRepository);

        MvcResult result = mockMvc.perform(withSession(rangeRequest(otherConsultant.getId()), selfCaller()))
                .andExpect(status().isForbidden())
                .andReturn();

        assertThat(result.getResponse().getContentAsString()).doesNotContain(otherConsultant.getName());
        verify(scheduleRepository, never()).findByTenantIdAndConsultantIdAndDateBetween(any(), any(), any(), any());
        verify(vacationRepository, never()).findByTenantIdAndConsultantIdAndDateRange(any(), any(), any(), any());
    }

    @Test
    @DisplayName("날짜 분기 — 다른 테넌트 상담사 id 는 일정·휴가 0건")
    void dateRange_otherTenantConsultant_returnsNothing() throws Exception {
        String otherTenant = "scdr-" + UUID.randomUUID().toString().replace("-", "").substring(0, 26);
        User foreignConsultant = saveUser(otherTenant, UserRole.CONSULTANT, "타테넌트상담사");
        User foreignClient = saveUser(otherTenant, UserRole.CLIENT, "타테넌트내담자");
        saveSchedule(otherTenant, foreignConsultant, foreignClient, LocalDate.of(2026, 10, 15));
        saveVacation(otherTenant, foreignConsultant, LocalDate.of(2026, 10, 16), false);

        List<JsonNode> rows = schedulesOf(perform(rangeRequest(foreignConsultant.getId()), adminCaller()));

        assertThat(rows).isEmpty();
    }

    @Test
    @DisplayName("성능 기준 — 24개월 픽스처에서 날짜 분기의 행·payload 는 무파라미터보다 작고 쿼리 수는 넘지 않는다")
    void dateRange_reducesStatementsAndPayloadVersusFullFetch() throws Exception {
        LocalDate firstMonth = RANGE_START.withDayOfMonth(1).minusMonths(PERF_MONTHS / 2);
        for (int m = 0; m < PERF_MONTHS; m++) {
            LocalDate monthStart = firstMonth.plusMonths(m);
            for (int i = 0; i < PERF_SCHEDULES_PER_MONTH; i++) {
                saveSchedule(consultant, monthStart.plusDays(i));
            }
            for (int v = 0; v < PERF_VACATIONS_PER_MONTH; v++) {
                saveVacation(tenantId, consultant, monthStart.plusDays(PERF_SCHEDULES_PER_MONTH + v), false);
            }
        }

        Measured full = measure(get(API, consultant.getId()));
        Measured range = measure(rangeRequest(consultant.getId()));

        System.out.printf("[schedule-date-range-perf] full: rows=%d statements=%d bytes=%d | "
                        + "range: rows=%d statements=%d bytes=%d%n",
                full.rows, full.statements, full.bytes, range.rows, range.statements, range.bytes);

        assertThat(full.rows).isEqualTo(PERF_MONTHS * (PERF_SCHEDULES_PER_MONTH + PERF_VACATIONS_PER_MONTH));
        assertThat(range.rows).isPositive().isLessThan(full.rows);
        // 목록 변환이 일괄 조회라 두 분기 모두 행 수와 무관한 상수 쿼리 — 범위 분기가 더 많으면 회귀
        assertThat(range.statements).isLessThanOrEqualTo(full.statements);
        assertThat(range.bytes).isLessThan(full.bytes);
    }

    private Measured measure(MockHttpServletRequestBuilder request) throws Exception {
        Statistics statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        statistics.setStatisticsEnabled(true);
        statistics.clear();
        MvcResult result = perform(request, selfCaller());
        long statements = statistics.getPrepareStatementCount();
        statistics.setStatisticsEnabled(false);
        int bytes = result.getResponse().getContentAsByteArray().length;
        return new Measured(schedulesOf(result).size(), statements, bytes);
    }

    private MockHttpServletRequestBuilder rangeRequest(Long consultantId) {
        return get(API, consultantId)
                .param("startDate", RANGE_START.toString())
                .param("endDate", RANGE_END.toString());
    }

    private MockHttpServletRequestBuilder withSession(MockHttpServletRequestBuilder request, User caller) {
        return request
                .sessionAttr(SessionConstants.USER_OBJECT, caller)
                .sessionAttr(SessionConstants.TENANT_ID, tenantId);
    }

    private MvcResult perform(MockHttpServletRequestBuilder request, User caller) throws Exception {
        return mockMvc.perform(withSession(request, caller))
                .andExpect(status().isOk())
                .andReturn();
    }

    private List<JsonNode> schedulesOf(MvcResult result) throws Exception {
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsByteArray());
        List<JsonNode> rows = new ArrayList<>();
        body.path("data").path("schedules").forEach(rows::add);
        return rows;
    }

    private Set<Long> scheduleIds(List<JsonNode> rows) {
        return rows.stream()
                .filter(row -> !VACATION_STATUS.equals(row.path("status").asText()))
                .map(row -> row.path("id").asLong())
                .collect(Collectors.toSet());
    }

    private List<String> vacationDates(List<JsonNode> rows) {
        return rows.stream()
                .filter(row -> VACATION_STATUS.equals(row.path("status").asText()))
                .map(row -> row.path("date").asText())
                .collect(Collectors.toList());
    }

    private Schedule saveSchedule(User scheduleConsultant, LocalDate date) {
        return saveSchedule(tenantId, scheduleConsultant, client, date);
    }

    private Schedule saveSchedule(String tenant, User scheduleConsultant, User scheduleClient, LocalDate date) {
        Schedule schedule = new Schedule();
        schedule.setTenantId(tenant);
        schedule.setConsultantId(scheduleConsultant.getId());
        schedule.setClientId(scheduleClient.getId());
        schedule.setDate(date);
        schedule.setStartTime(LocalTime.of(10, 0));
        schedule.setEndTime(LocalTime.of(10, 50));
        schedule.setStatus(ScheduleStatus.BOOKED);
        schedule.setScheduleType("CONSULTATION");
        schedule.setConsultationType("INDIVIDUAL");
        schedule.setTitle("scdr-it-schedule");
        schedule.setIsDeleted(false);
        return scheduleRepository.saveAndFlush(schedule);
    }

    private Vacation saveVacation(String tenant, User vacationConsultant, LocalDate date, boolean deleted) {
        Vacation vacation = new Vacation();
        vacation.setTenantId(tenant);
        vacation.setConsultantId(vacationConsultant.getId());
        vacation.setVacationDate(date);
        vacation.setVacationType(Vacation.VacationType.MORNING);
        vacation.setReason("scdr-it-vacation");
        vacation.setIsApproved(true);
        vacation.setIsDeleted(deleted);
        return vacationRepository.saveAndFlush(vacation);
    }

    private User saveUser(String tenant, UserRole role, String name) {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User user = new User();
        user.setTenantId(tenant);
        user.setUserId("scdr-" + role.name().toLowerCase() + "-" + suffix);
        user.setEmail("scdr-" + suffix + "@example.test");
        user.setPassword("not-a-real-hash");
        user.setName(name);
        user.setRole(role);
        user.setIsDeleted(false);
        return userRepository.saveAndFlush(user);
    }

    private User selfCaller() {
        User user = new User();
        user.setId(consultant.getId());
        user.setUserId(consultant.getUserId());
        user.setRole(UserRole.CONSULTANT);
        user.setTenantId(tenantId);
        return user;
    }

    private User adminCaller() {
        User user = new User();
        user.setId(1L);
        user.setUserId("scdr-caller-admin");
        user.setRole(UserRole.ADMIN);
        user.setTenantId(tenantId);
        return user;
    }

    private record Measured(int rows, long statements, int bytes) {
    }
}
