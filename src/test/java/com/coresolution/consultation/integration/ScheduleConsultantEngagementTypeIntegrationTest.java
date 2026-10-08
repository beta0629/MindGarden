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

import com.coresolution.consultation.constant.ClientEngagementTypeConstants;
import com.coresolution.consultation.constant.PaymentTimingConstants;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.integrationtest.support.WithMockAdminSecurityContext;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
 * 상담사 일정 API 응답에 engagementType/paymentTiming 포함 · 타인 접근 차단.
 *
 * @author CoreSolution
 * @since 2026-10-08
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@WithMockAdminSecurityContext
@DisplayName("상담사 일정 engagementType 응답")
class ScheduleConsultantEngagementTypeIntegrationTest {

    private static final String API = "/api/v1/schedules/consultant/{consultantId}";
    private static final LocalDate DAY = LocalDate.of(2026, 10, 15);

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private ClientRepository clientRepository;
    @Autowired private ScheduleRepository scheduleRepository;
    @Autowired private ConsultantClientMappingRepository mappingRepository;

    private String tenantId;
    private User consultant;
    private User otherConsultant;
    private User clientUser;
    private Client clientEntity;
    private ConsultantClientMapping mapping;
    private Schedule schedule;

    @BeforeEach
    void setUp() {
        tenantId = "scet-" + UUID.randomUUID().toString().replace("-", "").substring(0, 26);
        TenantContextHolder.setTenantId(tenantId);
        consultant = saveUser(tenantId, UserRole.CONSULTANT, "연계상담사");
        otherConsultant = saveUser(tenantId, UserRole.CONSULTANT, "다른상담사");
        clientUser = saveUser(tenantId, UserRole.CLIENT, "기관내담자");
        clientEntity = saveClient(clientUser, ClientEngagementTypeConstants.INSTITUTION_LINK);
        mapping = saveMapping(consultant, clientUser, PaymentTimingConstants.INSTITUTION_LINK);
        schedule = saveSchedule(consultant, clientUser, mapping.getId(), DAY);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("본인 상담사 API — engagementType·paymentTiming 포함")
    void selfConsultant_includesEngagementType() throws Exception {
        List<JsonNode> rows = schedulesOf(perform(rangeRequest(consultant.getId()), selfCaller()));
        JsonNode row = rows.stream()
                .filter(r -> r.path("id").asLong() == schedule.getId())
                .findFirst()
                .orElseThrow();
        assertThat(row.path("engagementType").asText())
                .isEqualTo(ClientEngagementTypeConstants.INSTITUTION_LINK);
        assertThat(row.path("paymentTiming").asText())
                .isEqualTo(PaymentTimingConstants.INSTITUTION_LINK);
    }

    @Test
    @DisplayName("다른 상담사 id — 403, schedules 데이터 없음")
    void otherConsultant_forbidden() throws Exception {
        MvcResult result = mockMvc.perform(withSession(rangeRequest(otherConsultant.getId()), selfCaller()))
                .andExpect(status().isForbidden())
                .andReturn();
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsByteArray());
        assertThat(body.path("success").asBoolean(true)).isFalse();
        assertThat(body.path("data").path("schedules").isMissingNode()
                || body.path("data").path("schedules").isEmpty()).isTrue();
        assertThat(body.path("errorCode").asText()).isEqualTo("ACCESS_DENIED");
    }

    private MockHttpServletRequestBuilder rangeRequest(Long consultantId) {
        return get(API, consultantId)
                .param("startDate", DAY.toString())
                .param("endDate", DAY.toString());
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

    private User selfCaller() {
        User user = new User();
        user.setId(consultant.getId());
        user.setUserId(consultant.getUserId());
        user.setRole(UserRole.CONSULTANT);
        user.setTenantId(tenantId);
        return user;
    }

    private User saveUser(String tenant, UserRole role, String name) {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User user = new User();
        user.setTenantId(tenant);
        user.setUserId("scet-" + role.name().toLowerCase() + "-" + suffix);
        user.setEmail("scet-" + suffix + "@example.test");
        user.setPassword("not-a-real-hash");
        user.setName(name);
        user.setRole(role);
        user.setIsDeleted(false);
        return userRepository.saveAndFlush(user);
    }

    private Client saveClient(User user, String engagementType) {
        Client client = new Client();
        client.setId(user.getId());
        client.setTenantId(tenantId);
        client.setName(user.getName());
        client.setEmail(user.getEmail());
        client.setEngagementType(engagementType);
        client.setIsDeleted(false);
        return clientRepository.saveAndFlush(client);
    }

    private ConsultantClientMapping saveMapping(User scheduleConsultant, User scheduleClient, String paymentTiming) {
        ConsultantClientMapping m = new ConsultantClientMapping();
        m.setTenantId(tenantId);
        m.setConsultant(scheduleConsultant);
        m.setClient(scheduleClient);
        m.setStatus(MappingStatus.ACTIVE);
        m.setTotalSessions(10);
        m.setRemainingSessions(8);
        m.setPaymentTiming(paymentTiming);
        m.setStartDate(LocalDateTime.of(DAY, LocalTime.of(9, 0)));
        m.setIsDeleted(false);
        return mappingRepository.saveAndFlush(m);
    }

    private Schedule saveSchedule(User scheduleConsultant, User scheduleClient, Long mappingId, LocalDate date) {
        Schedule s = new Schedule();
        s.setTenantId(tenantId);
        s.setConsultantId(scheduleConsultant.getId());
        s.setClientId(scheduleClient.getId());
        s.setMappingId(mappingId);
        s.setDate(date);
        s.setStartTime(LocalTime.of(10, 0));
        s.setEndTime(LocalTime.of(10, 50));
        s.setStatus(ScheduleStatus.BOOKED);
        s.setScheduleType("CONSULTATION");
        s.setConsultationType("INDIVIDUAL");
        s.setTitle("scet-engagement");
        s.setIsDeleted(false);
        return scheduleRepository.saveAndFlush(s);
    }
}
