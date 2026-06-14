package com.coresolution.consultation.integration;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.ConsultationRecordDraftSaveRequest;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.integrationtest.support.WithMockConsultantSecurityContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * 상담일지 서버 초안 API — 테넌트 헤더·세션 사용자·스케줄 검증 성공 경로.
 *
 * @author CoreSolution
 * @since 2026-04-22
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@Transactional
@WithMockConsultantSecurityContext
@DisplayName("ScheduleController 상담일지 서버 초안 API")
class ConsultationRecordDraftScheduleIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ScheduleRepository scheduleRepository;

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("PUT 후 GET — X-Tenant-Id·세션 상담사·schedule- 접두 consultationId 로 200")
    void putThenGet_draft_returns200() throws Exception {
        String tenantId = UUID.randomUUID().toString();

        User consultant = new User();
        consultant.setId(99001L);
        consultant.setUserId("consultant-draft-test");
        consultant.setEmail("consultant-draft@test.com");
        consultant.setName("초안테스트상담사");
        consultant.setTenantId(tenantId);
        consultant.setRole(UserRole.CONSULTANT);

        Schedule schedule = new Schedule();
        schedule.setTenantId(tenantId);
        schedule.setConsultantId(consultant.getId());
        schedule.setDate(LocalDate.now());
        schedule.setStartTime(LocalTime.of(9, 0));
        schedule.setEndTime(LocalTime.of(10, 0));
        schedule.setStatus(ScheduleStatus.BOOKED);
        schedule.setIsDeleted(false);
        scheduleRepository.saveAndFlush(schedule);

        String consultationParam = "schedule-" + schedule.getId();

        ConsultationRecordDraftSaveRequest saveBody = new ConsultationRecordDraftSaveRequest();
        saveBody.setPayloadJson("{\"memo\":\"draft-content\"}");

        mockMvc.perform(put("/api/v1/schedules/consultation-records/draft")
                        .queryParam("consultationId", consultationParam)
                        .queryParam("consultantId", consultant.getId().toString())
                        .header("X-Tenant-Id", tenantId)
                        .sessionAttr(SessionConstants.USER_OBJECT, consultant)
                        .sessionAttr(SessionConstants.TENANT_ID, tenantId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(saveBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.hasDraft").value(true))
                .andExpect(jsonPath("$.data.payloadJson").value("{\"memo\":\"draft-content\"}"));

        mockMvc.perform(get("/api/v1/schedules/consultation-records/draft")
                        .queryParam("consultationId", consultationParam)
                        .queryParam("consultantId", consultant.getId().toString())
                        .header("X-Tenant-Id", tenantId)
                        .sessionAttr(SessionConstants.USER_OBJECT, consultant)
                        .sessionAttr(SessionConstants.TENANT_ID, tenantId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.hasDraft").value(true))
                .andExpect(jsonPath("$.data.consultantId").value(99001));
    }

    @Test
    @DisplayName("GET 초안 — 테넌트 컨텍스트 없음(사용자·세션·헤더 모두 없음) 시 400 ApiResponse")
    void getDraft_missingTenant_returns400() throws Exception {
        User consultant = new User();
        consultant.setId(99101L);
        consultant.setUserId("consultant-no-tenant");
        consultant.setEmail("no-tenant@test.com");
        consultant.setName("테넌트없음");
        consultant.setTenantId(null);
        consultant.setRole(UserRole.CONSULTANT);

        mockMvc.perform(get("/api/v1/schedules/consultation-records/draft")
                        .queryParam("consultationId", "schedule-1")
                        .queryParam("consultantId", consultant.getId().toString())
                        .sessionAttr(SessionConstants.USER_OBJECT, consultant)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message", containsString("테넌트")));
    }

    /**
     * <p>B6 (2026-06-14) 이후: ScheduleController 가 {@code X-Tenant-Id} 헤더 직파싱을 제거하고
     * {@link com.coresolution.core.filter.TenantContextFilter} 단일 SSOT 로 위임한다.
     * MockMvc 는 {@code addFilters=false} 라 필터 체인이 동작하지 않으므로,
     * 사용자 세션에도 tenantId 가 없으면 컨트롤러가 즉시 400 으로 거부한다.
     * 이는 cross-tenant 접근을 더 이른 단계에서 차단하므로 보안적으로 더 강한 동작이다.</p>
     *
     * <p>PR-3d (2026-06-14, B8): {@link WithMockConsultantSecurityContext} 로
     * {@code @PreAuthorize("isAuthenticated()")} 를 통과시키되, 컨트롤러의 tenant 가드
     * 회귀(400) 동작을 그대로 검증한다.</p>
     */
    @Test
    @DisplayName("GET 초안 — 사용자 tenant 없이 잘못된 X-Tenant-Id만 있으면 cross-tenant 차단(400 BAD_REQUEST)")
    void getDraft_wrongTenantHeader_only_noUserTenant_isRejected() throws Exception {
        String realTenant = UUID.randomUUID().toString();
        String wrongHeaderTenant = UUID.randomUUID().toString();

        User consultant = new User();
        consultant.setId(99102L);
        consultant.setUserId("consultant-wrong-header");
        consultant.setEmail("wrong-header@test.com");
        consultant.setName("헤더테스트");
        consultant.setTenantId(null);
        consultant.setRole(UserRole.CONSULTANT);

        Schedule schedule = new Schedule();
        schedule.setTenantId(realTenant);
        schedule.setConsultantId(consultant.getId());
        schedule.setDate(LocalDate.now());
        schedule.setStartTime(LocalTime.of(10, 0));
        schedule.setEndTime(LocalTime.of(11, 0));
        schedule.setStatus(ScheduleStatus.BOOKED);
        schedule.setIsDeleted(false);
        scheduleRepository.saveAndFlush(schedule);

        String consultationParam = "schedule-" + schedule.getId();

        mockMvc.perform(get("/api/v1/schedules/consultation-records/draft")
                        .queryParam("consultationId", consultationParam)
                        .queryParam("consultantId", consultant.getId().toString())
                        .header("X-Tenant-Id", wrongHeaderTenant)
                        .sessionAttr(SessionConstants.USER_OBJECT, consultant)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message", containsString("테넌트")));
    }

    @Test
    @DisplayName("PUT 초안 — 상담사가 본인이 아닌 consultantId 로 저장 시 403")
    void putDraft_consultantCannotWriteOtherConsultant_returns403() throws Exception {
        String tenantId = UUID.randomUUID().toString();
        Long selfId = 99103L;
        Long otherConsultantId = 99104L;

        User consultant = new User();
        consultant.setId(selfId);
        consultant.setUserId("consultant-self-only");
        consultant.setEmail("self-only@test.com");
        consultant.setName("본인만");
        consultant.setTenantId(tenantId);
        consultant.setRole(UserRole.CONSULTANT);

        ConsultationRecordDraftSaveRequest saveBody = new ConsultationRecordDraftSaveRequest();
        saveBody.setPayloadJson("{\"memo\":\"x\"}");

        mockMvc.perform(put("/api/v1/schedules/consultation-records/draft")
                        .queryParam("consultationId", "schedule-1")
                        .queryParam("consultantId", otherConsultantId.toString())
                        .header("X-Tenant-Id", tenantId)
                        .sessionAttr(SessionConstants.USER_OBJECT, consultant)
                        .sessionAttr(SessionConstants.TENANT_ID, tenantId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(saveBody)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("ACCESS_DENIED"));
    }

    @Test
    @DisplayName("PUT 초안 — expectedVersion 불일치 시 400 VALIDATION_ERROR")
    void putDraft_expectedVersionMismatch_returns400() throws Exception {
        String tenantId = UUID.randomUUID().toString();
        Long consultantPk = 99105L;

        User consultant = new User();
        consultant.setId(consultantPk);
        consultant.setUserId("consultant-version");
        consultant.setEmail("version@test.com");
        consultant.setName("버전테스트");
        consultant.setTenantId(tenantId);
        consultant.setRole(UserRole.CONSULTANT);

        Schedule schedule = new Schedule();
        schedule.setTenantId(tenantId);
        schedule.setConsultantId(consultantPk);
        schedule.setDate(LocalDate.now());
        schedule.setStartTime(LocalTime.of(14, 0));
        schedule.setEndTime(LocalTime.of(15, 0));
        schedule.setStatus(ScheduleStatus.BOOKED);
        schedule.setIsDeleted(false);
        scheduleRepository.saveAndFlush(schedule);

        String consultationParam = "schedule-" + schedule.getId();

        ConsultationRecordDraftSaveRequest first = new ConsultationRecordDraftSaveRequest();
        first.setPayloadJson("{\"memo\":\"v1\"}");

        mockMvc.perform(put("/api/v1/schedules/consultation-records/draft")
                        .queryParam("consultationId", consultationParam)
                        .queryParam("consultantId", consultantPk.toString())
                        .header("X-Tenant-Id", tenantId)
                        .sessionAttr(SessionConstants.USER_OBJECT, consultant)
                        .sessionAttr(SessionConstants.TENANT_ID, tenantId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(first)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.version").exists());

        ConsultationRecordDraftSaveRequest second = new ConsultationRecordDraftSaveRequest();
        second.setPayloadJson("{\"memo\":\"v2\"}");
        second.setExpectedVersion(99999L);

        mockMvc.perform(put("/api/v1/schedules/consultation-records/draft")
                        .queryParam("consultationId", consultationParam)
                        .queryParam("consultantId", consultantPk.toString())
                        .header("X-Tenant-Id", tenantId)
                        .sessionAttr(SessionConstants.USER_OBJECT, consultant)
                        .sessionAttr(SessionConstants.TENANT_ID, tenantId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(second)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
    }
}
