package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
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
 * GET /api/v1/schedules/date-range — 날짜 범위 목록 쿼리 수 회귀.
 *
 * <p>행 수가 늘어도 {@code convertToScheduleDtosBatched} 경로라 SQL 문 수가 일정 수에 비례하지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-08
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@WithMockAdminSecurityContext
@DisplayName("일정 date-range 목록 — 쿼리 수 상수(N+1 없음)")
class ScheduleDateRangeQueryCountIntegrationTest {

    private static final String DATE_RANGE_API = "/api/v1/schedules/date-range";
    private static final LocalDate RANGE_START = LocalDate.of(2026, 10, 1);
    private static final LocalDate RANGE_END = LocalDate.of(2026, 10, 31);
    private static final LocalDate FIRST_DAY = LocalDate.of(2026, 10, 1);
    private static final int CLIENT_COUNT = 4;
    private static final int SMALL_ROWS = 1;
    private static final int LARGE_ROWS = 24;
    private static final int TOTAL_SESSIONS = 10;
    private static final int REMAINING_SESSIONS = 6;

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private ScheduleRepository scheduleRepository;
    @Autowired private ConsultantClientMappingRepository mappingRepository;
    @Autowired private EntityManagerFactory entityManagerFactory;

    private String tenantId;
    private User consultant;
    private final List<User> clients = new ArrayList<>();
    private final List<ConsultantClientMapping> mappings = new ArrayList<>();

    @BeforeEach
    void setUp() {
        tenantId = "sdrqc-" + UUID.randomUUID().toString().replace("-", "").substring(0, 25);
        TenantContextHolder.setTenantId(tenantId);
        consultant = saveUser(UserRole.CONSULTANT, "날짜범위상담사");
        for (int i = 0; i < CLIENT_COUNT; i++) {
            User client = saveUser(UserRole.CLIENT, "날짜범위내담자" + i);
            clients.add(client);
            mappings.add(saveMapping(client));
        }
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("1건 vs N건 — date-range prepareStatementCount 동일 상한")
    void dateRange_statementCountIndependentOfRows() throws Exception {
        seedRows(0, SMALL_ROWS);
        Measured warmup = measure(dateRange(), selfCaller());
        Measured small = measure(dateRange(), selfCaller());

        seedRows(SMALL_ROWS, LARGE_ROWS - SMALL_ROWS);
        Measured large = measure(dateRange(), selfCaller());

        System.out.printf(
                "[schedule-date-range-qc] warmup=%d | small rows=%d stmts=%d ms=%d"
                        + " | large rows=%d stmts=%d ms=%d%n",
                warmup.statements,
                small.rows, small.statements, small.millis,
                large.rows, large.statements, large.millis);

        assertThat(small.rows).isEqualTo(SMALL_ROWS);
        assertThat(large.rows).isEqualTo(LARGE_ROWS);
        assertThat(large.statements)
                .as("행 수가 %d→%d 여도 SQL 문 수는 같아야 함 (N+1 금지)", SMALL_ROWS, LARGE_ROWS)
                .isEqualTo(small.statements);
    }

    @Test
    @DisplayName("date-range 배치 변환 후에도 이름·매칭·회기 필드 유지")
    void dateRange_keepsResponseFieldValues() throws Exception {
        Schedule mapped = saveSchedule(clients.get(0), mappings.get(0).getId(), FIRST_DAY, 1);
        Schedule legacy = saveSchedule(clients.get(1), null, FIRST_DAY.plusDays(1), 1);

        List<JsonNode> rows = schedulesOf(perform(dateRange(), selfCaller()));
        JsonNode mappedRow = rows.stream()
                .filter(node -> node.path("id").asLong() == mapped.getId())
                .findFirst()
                .orElseThrow();
        JsonNode legacyRow = rows.stream()
                .filter(node -> node.path("id").asLong() == legacy.getId())
                .findFirst()
                .orElseThrow();

        assertThat(mappedRow.path("consultantName").asText()).isEqualTo(consultant.getName());
        assertThat(mappedRow.path("clientName").asText()).isEqualTo(clients.get(0).getName());
        assertThat(mappedRow.path("mappingId").asLong()).isEqualTo(mappings.get(0).getId());
        assertThat(mappedRow.path("totalSessions").asInt()).isEqualTo(TOTAL_SESSIONS);
        assertThat(mappedRow.path("remainingSessions").asInt()).isEqualTo(REMAINING_SESSIONS);

        assertThat(legacyRow.path("mappingId").asLong()).isEqualTo(mappings.get(1).getId());
        assertThat(legacyRow.path("clientName").asText()).isEqualTo(clients.get(1).getName());
    }

    private void seedRows(int offset, int scheduleCount) {
        for (int i = 0; i < scheduleCount; i++) {
            int index = offset + i;
            User client = clients.get(index % CLIENT_COUNT);
            Long mappingId = index % 2 == 0 ? mappings.get(index % CLIENT_COUNT).getId() : null;
            saveSchedule(client, mappingId, FIRST_DAY.plusDays(index % 28), index + 1);
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

    private MockHttpServletRequestBuilder dateRange() {
        return get(DATE_RANGE_API)
                .param("userId", String.valueOf(consultant.getId()))
                .param("userRole", UserRole.CONSULTANT.name())
                .param("startDate", RANGE_START.toString())
                .param("endDate", RANGE_END.toString());
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
        JsonNode data = body.path("data");
        List<JsonNode> rows = new ArrayList<>();
        if (data.isArray()) {
            data.forEach(rows::add);
        } else {
            data.path("schedules").forEach(rows::add);
        }
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
        schedule.setTitle("sdrqc-it-schedule");
        schedule.setSessionSequence(sessionSequence);
        schedule.setIsDeleted(false);
        return scheduleRepository.saveAndFlush(schedule);
    }

    private ConsultantClientMapping saveMapping(User client) {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setTenantId(tenantId);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setStartDate(LocalDateTime.now().minusYears(1));
        mapping.setStatus(MappingStatus.ACTIVE);
        mapping.setTotalSessions(TOTAL_SESSIONS);
        mapping.setRemainingSessions(REMAINING_SESSIONS);
        mapping.setUsedSessions(TOTAL_SESSIONS - REMAINING_SESSIONS);
        mapping.setPackageName("sdrqc-it");
        mapping.setPackagePrice(0L);
        return mappingRepository.saveAndFlush(mapping);
    }

    private User saveUser(UserRole role, String name) {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User user = new User();
        user.setTenantId(tenantId);
        user.setUserId("sdrqc-" + role.name().toLowerCase() + "-" + suffix);
        user.setEmail("sdrqc-" + suffix + "@example.test");
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

    private record Measured(int rows, long statements, long millis) {
    }
}
