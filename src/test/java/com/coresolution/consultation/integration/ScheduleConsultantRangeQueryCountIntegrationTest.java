package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.Vacation;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/**
 * 상담사 범위 조회(/schedules/consultant/{id}?startDate&endDate) 쿼리 수 회귀.
 *
 * <ul>
 *   <li>일정·휴가 행 수가 늘어도 SQL 문 수가 늘지 않는다 (N+1 없음).</li>
 *   <li>같은 범위의 관리자 상담사 필터(/schedules/admin?consultantId)와 같은 일괄 조회 — 상담사 전용 조회(휴가·유형명)만 추가.</li>
 *   <li>응답 필드(이름·매칭·회기·누적 회기·유형 한글명·휴가 제목)는 건별 조회와 같은 값.</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-10-07
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@WithMockAdminSecurityContext
@DisplayName("상담사 일정 범위 조회 — 쿼리 수 상수·관리자 경로 동급")
class ScheduleConsultantRangeQueryCountIntegrationTest {

    private static final String CONSULTANT_API = "/api/v1/schedules/consultant/{consultantId}";
    private static final String ADMIN_API = "/api/v1/schedules/admin";
    private static final LocalDate RANGE_START = LocalDate.of(2026, 9, 27);
    private static final LocalDate RANGE_END = LocalDate.of(2026, 11, 7);
    private static final LocalDate FIRST_DAY = LocalDate.of(2026, 10, 1);
    private static final String VACATION_STATUS = ScheduleStatus.VACATION.name();
    private static final int CLIENT_COUNT = 4;
    private static final int SMALL_ROWS = 8;
    private static final int LARGE_ROWS = 32;
    private static final int SMALL_VACATIONS = 1;
    private static final int LARGE_VACATIONS = 4;
    private static final int TOTAL_SESSIONS = 10;
    private static final int REMAINING_SESSIONS = 6;
    private static final int ADMIN_PAGE_SIZE = 500;
    /** 관리자 목록에 없는 상담사 경로 조회: 휴가 범위·휴가 상담사·일정 유형명·상담 유형명·휴가 유형명 */
    private static final int CONSULTANT_ONLY_LOOKUPS = 5;

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private ScheduleRepository scheduleRepository;
    @Autowired private VacationRepository vacationRepository;
    @Autowired private ConsultantClientMappingRepository mappingRepository;
    @Autowired private EntityManagerFactory entityManagerFactory;

    private String tenantId;
    private User consultant;
    private final List<User> clients = new ArrayList<>();
    private final List<ConsultantClientMapping> mappings = new ArrayList<>();

    @BeforeEach
    void setUp() {
        tenantId = "scqc-" + UUID.randomUUID().toString().replace("-", "").substring(0, 26);
        TenantContextHolder.setTenantId(tenantId);
        consultant = saveUser(UserRole.CONSULTANT, "쿼리상담사");
        for (int i = 0; i < CLIENT_COUNT; i++) {
            User client = saveUser(UserRole.CLIENT, "쿼리내담자" + i);
            clients.add(client);
            mappings.add(saveMapping(client));
        }
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("행 수 4배여도 상담사 범위 조회 SQL 문 수 동일, 관리자 경로 + 상담사 전용 조회 이하")
    void consultantRange_statementCountIndependentOfRows() throws Exception {
        seedRows(0, SMALL_ROWS, SMALL_VACATIONS);
        Measured warmup = measure(consultantRange(), selfCaller());
        Measured consultantSmall = measure(consultantRange(), selfCaller());
        Measured adminSmall = measure(adminRange(), adminCaller());

        seedRows(SMALL_ROWS, LARGE_ROWS - SMALL_ROWS, LARGE_VACATIONS - SMALL_VACATIONS);
        Measured consultantLarge = measure(consultantRange(), selfCaller());
        Measured adminLarge = measure(adminRange(), adminCaller());

        System.out.printf("[schedule-consultant-range-qc] warmup=%d | consultant small rows=%d stmts=%d ms=%d"
                        + " | consultant large rows=%d stmts=%d ms=%d | admin small rows=%d stmts=%d ms=%d"
                        + " | admin large rows=%d stmts=%d ms=%d%n",
                warmup.statements,
                consultantSmall.rows, consultantSmall.statements, consultantSmall.millis,
                consultantLarge.rows, consultantLarge.statements, consultantLarge.millis,
                adminSmall.rows, adminSmall.statements, adminSmall.millis,
                adminLarge.rows, adminLarge.statements, adminLarge.millis);

        assertThat(consultantSmall.rows).isEqualTo(SMALL_ROWS + SMALL_VACATIONS);
        assertThat(consultantLarge.rows).isEqualTo(LARGE_ROWS + LARGE_VACATIONS);
        assertThat(consultantLarge.statements).isEqualTo(consultantSmall.statements);
        assertThat(adminLarge.statements).isEqualTo(adminSmall.statements);
        assertThat(consultantLarge.statements)
                .isLessThanOrEqualTo(adminLarge.statements + CONSULTANT_ONLY_LOOKUPS);
    }

    @Test
    @DisplayName("일괄 조회 후에도 응답 필드 값은 건별 조회와 같다 (매칭·회기·누적·이름·휴가 제목)")
    void consultantRange_keepsResponseFieldValues() throws Exception {
        Schedule mapped = saveSchedule(clients.get(0), mappings.get(0).getId(), FIRST_DAY, 1);
        Schedule legacy = saveSchedule(clients.get(1), null, FIRST_DAY.plusDays(1), 1);
        Schedule second = saveSchedule(clients.get(0), mappings.get(0).getId(), FIRST_DAY.plusDays(2), 2);
        saveVacation(FIRST_DAY.plusDays(3));

        Map<Long, JsonNode> byId = new HashMap<>();
        List<JsonNode> vacations = new ArrayList<>();
        for (JsonNode row : schedulesOf(perform(consultantRange(), selfCaller()))) {
            if (VACATION_STATUS.equals(row.path("status").asText())) {
                vacations.add(row);
            } else {
                byId.put(row.path("id").asLong(), row);
            }
        }

        JsonNode mappedRow = byId.get(mapped.getId());
        assertThat(mappedRow.path("consultantName").asText()).isEqualTo(consultant.getName());
        assertThat(mappedRow.path("clientName").asText()).isEqualTo(clients.get(0).getName());
        assertThat(mappedRow.path("mappingId").asLong()).isEqualTo(mappings.get(0).getId());
        assertThat(mappedRow.path("totalSessions").asInt()).isEqualTo(TOTAL_SESSIONS);
        assertThat(mappedRow.path("remainingSessions").asInt()).isEqualTo(REMAINING_SESSIONS);
        assertThat(mappedRow.path("clientLifetimeSessionCount").asLong()).isEqualTo(1L);
        assertThat(mappedRow.has("consultantProfessionalProviderTypeCode")).isTrue();

        JsonNode legacyRow = byId.get(legacy.getId());
        assertThat(legacyRow.path("mappingId").asLong()).isEqualTo(mappings.get(1).getId());
        assertThat(legacyRow.path("totalSessions").asInt()).isEqualTo(TOTAL_SESSIONS);
        assertThat(legacyRow.path("clientName").asText()).isEqualTo(clients.get(1).getName());

        assertThat(byId.get(second.getId()).path("clientLifetimeSessionCount").asLong()).isEqualTo(2L);

        assertThat(vacations).hasSize(1);
        assertThat(vacations.get(0).path("consultantName").asText()).isEqualTo(consultant.getName());
        assertThat(vacations.get(0).path("title").asText()).startsWith(consultant.getName() + " - ");
    }

    @Test
    @DisplayName("일괄 조회도 테넌트 격리 — 다른 테넌트 사용자·매칭 id 가 일정에 있어도 이름·회기 미노출")
    void consultantRange_batchLookupsStayInTenant() throws Exception {
        String otherTenant = "scqc-" + UUID.randomUUID().toString().replace("-", "").substring(0, 26);
        User foreignClient = saveUser(otherTenant, UserRole.CLIENT, "타테넌트내담자");
        ConsultantClientMapping foreignMapping = saveMapping(otherTenant, consultant, foreignClient);
        Schedule leaked = saveSchedule(foreignClient, foreignMapping.getId(), FIRST_DAY, 1);

        JsonNode row = schedulesOf(perform(consultantRange(), selfCaller())).stream()
                .filter(node -> node.path("id").asLong() == leaked.getId())
                .findFirst()
                .orElseThrow();

        assertThat(row.path("clientName").asText()).isNotEqualTo(foreignClient.getName());
        assertThat(row.path("totalSessions").isNull() || row.path("totalSessions").isMissingNode()).isTrue();
        assertThat(row.path("remainingSessions").isNull() || row.path("remainingSessions").isMissingNode()).isTrue();
    }

    private void seedRows(int offset, int scheduleCount, int vacationCount) {
        for (int i = 0; i < scheduleCount; i++) {
            int index = offset + i;
            User client = clients.get(index % CLIENT_COUNT);
            Long mappingId = index % 2 == 0 ? mappings.get(index % CLIENT_COUNT).getId() : null;
            saveSchedule(client, mappingId, FIRST_DAY.plusDays(index % 28), index + 1);
        }
        for (int v = 0; v < vacationCount; v++) {
            saveVacation(FIRST_DAY.plusDays(offset + v));
        }
    }

    private Measured measure(MockHttpServletRequestBuilder request, User caller) throws Exception {
        Statistics statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        statistics.setStatisticsEnabled(true);
        statistics.clear();
        long started = System.nanoTime();
        MvcResult result = perform(request, caller);
        long millis = (System.nanoTime() - started) / 1_000_000L;
        long statements = statistics.getPrepareStatementCount();
        statistics.setStatisticsEnabled(false);
        return new Measured(schedulesOf(result).size(), statements, millis);
    }

    private MockHttpServletRequestBuilder consultantRange() {
        return get(CONSULTANT_API, consultant.getId())
                .param("startDate", RANGE_START.toString())
                .param("endDate", RANGE_END.toString());
    }

    private MockHttpServletRequestBuilder adminRange() {
        return get(ADMIN_API)
                .param("consultantId", String.valueOf(consultant.getId()))
                .param("startDate", RANGE_START.toString())
                .param("endDate", RANGE_END.toString())
                .param("page", "0")
                .param("size", String.valueOf(ADMIN_PAGE_SIZE));
    }

    private MvcResult perform(MockHttpServletRequestBuilder request, User caller) throws Exception {
        return mockMvc.perform(request
                        .sessionAttr(SessionConstants.USER_OBJECT, caller)
                        .sessionAttr(SessionConstants.TENANT_ID, tenantId))
                .andExpect(status().isOk())
                .andReturn();
    }

    private List<JsonNode> schedulesOf(MvcResult result) throws Exception {
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsByteArray());
        List<JsonNode> rows = new ArrayList<>();
        body.path("data").path("schedules").forEach(rows::add);
        return rows;
    }

    private Schedule saveSchedule(User client, Long mappingId, LocalDate date, int sessionSequence) {
        Schedule schedule = new Schedule();
        schedule.setTenantId(tenantId);
        schedule.setConsultantId(consultant.getId());
        schedule.setClientId(client.getId());
        schedule.setMappingId(mappingId);
        schedule.setDate(date);
        schedule.setStartTime(LocalTime.of(10, 0));
        schedule.setEndTime(LocalTime.of(10, 50));
        schedule.setStatus(ScheduleStatus.BOOKED);
        schedule.setScheduleType("CONSULTATION");
        schedule.setConsultationType("INDIVIDUAL");
        schedule.setTitle("scqc-it-schedule");
        schedule.setSessionSequence(sessionSequence);
        schedule.setIsDeleted(false);
        return scheduleRepository.saveAndFlush(schedule);
    }

    private void saveVacation(LocalDate date) {
        Vacation vacation = new Vacation();
        vacation.setTenantId(tenantId);
        vacation.setConsultantId(consultant.getId());
        vacation.setVacationDate(date);
        vacation.setVacationType(Vacation.VacationType.MORNING);
        vacation.setReason("scqc-it-vacation");
        vacation.setIsApproved(true);
        vacation.setIsDeleted(false);
        vacationRepository.saveAndFlush(vacation);
    }

    private ConsultantClientMapping saveMapping(User client) {
        return saveMapping(tenantId, consultant, client);
    }

    private ConsultantClientMapping saveMapping(String tenant, User mappingConsultant, User client) {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setTenantId(tenant);
        mapping.setConsultant(mappingConsultant);
        mapping.setClient(client);
        mapping.setStartDate(LocalDateTime.now().minusYears(1));
        mapping.setStatus(MappingStatus.ACTIVE);
        mapping.setTotalSessions(TOTAL_SESSIONS);
        mapping.setRemainingSessions(REMAINING_SESSIONS);
        mapping.setUsedSessions(TOTAL_SESSIONS - REMAINING_SESSIONS);
        mapping.setPackageName("scqc-it");
        mapping.setPackagePrice(0L);
        return mappingRepository.saveAndFlush(mapping);
    }

    private User saveUser(UserRole role, String name) {
        return saveUser(tenantId, role, name);
    }

    private User saveUser(String tenant, UserRole role, String name) {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User user = new User();
        user.setTenantId(tenant);
        user.setUserId("scqc-" + role.name().toLowerCase() + "-" + suffix);
        user.setEmail("scqc-" + suffix + "@example.test");
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
        user.setUserId("scqc-caller-admin");
        user.setRole(UserRole.ADMIN);
        user.setTenantId(tenantId);
        return user;
    }

    private record Measured(int rows, long statements, long millis) {
    }
}
