package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.converter.ConsultationBodyAttributeConverter;
import com.coresolution.consultation.dto.ConsultationRecordDraftSaveRequest;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultationRecordDraftRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.integrationtest.support.WithMockConsultantSecurityContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * 상담일지 서버 초안 — 작성자 전용 접근·삭제·캐시 금지·저장 시 암호화 검증.
 *
 * <p>초안은 아직 확정되지 않은 상담사 개인 작업본이므로, 같은 테넌트 관리자도 읽을 수 없다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@Transactional
@WithMockConsultantSecurityContext
@DisplayName("ScheduleController 상담일지 초안 — 작성자 전용")
class ConsultationRecordDraftAuthorOnlyIntegrationTest {

    private static final String DRAFT_PATH = "/api/v1/schedules/consultation-records/draft";
    private static final String PAYLOAD = "{\"formData\":{\"mainIssues\":\"내담자가 불안을 호소\"},\"memoDraft\":\"\"}";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ScheduleRepository scheduleRepository;

    @Autowired
    private ConsultationRecordDraftRepository draftRepository;

    @Autowired
    private EntityManager entityManager;

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private User user(Long id, String tenantId, UserRole role, String suffix) {
        User u = new User();
        u.setId(id);
        u.setUserId("draft-author-" + suffix);
        u.setEmail("draft-author-" + suffix + "@test.com");
        u.setName("초안권한" + suffix);
        u.setTenantId(tenantId);
        u.setRole(role);
        return u;
    }

    private Schedule schedule(String tenantId, Long consultantId, int hour) {
        Schedule s = new Schedule();
        s.setTenantId(tenantId);
        s.setConsultantId(consultantId);
        s.setDate(LocalDate.now());
        s.setStartTime(LocalTime.of(hour, 0));
        s.setEndTime(LocalTime.of(hour + 1, 0));
        s.setStatus(ScheduleStatus.BOOKED);
        s.setIsDeleted(false);
        return scheduleRepository.saveAndFlush(s);
    }

    private ConsultationRecordDraftSaveRequest saveBody(String payloadJson) {
        ConsultationRecordDraftSaveRequest body = new ConsultationRecordDraftSaveRequest();
        body.setPayloadJson(payloadJson);
        return body;
    }

    @Test
    @DisplayName("작성 상담사 본인 — PUT·GET·DELETE 모두 200, 응답에 Cache-Control no-store")
    void author_canCrudDraft_andResponsesAreNoStore() throws Exception {
        String tenantId = UUID.randomUUID().toString();
        User author = user(99201L, tenantId, UserRole.CONSULTANT, "self");
        Schedule schedule = schedule(tenantId, author.getId(), 9);
        String consultationParam = "schedule-" + schedule.getId();

        mockMvc.perform(put(DRAFT_PATH)
                        .queryParam("consultationId", consultationParam)
                        .queryParam("consultantId", author.getId().toString())
                        .sessionAttr(SessionConstants.USER_OBJECT, author)
                        .sessionAttr(SessionConstants.TENANT_ID, tenantId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(saveBody(PAYLOAD))))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, org.hamcrest.Matchers.containsString("no-store")));

        mockMvc.perform(get(DRAFT_PATH)
                        .queryParam("consultationId", consultationParam)
                        .queryParam("consultantId", author.getId().toString())
                        .sessionAttr(SessionConstants.USER_OBJECT, author)
                        .sessionAttr(SessionConstants.TENANT_ID, tenantId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.hasDraft").value(true))
                .andExpect(jsonPath("$.data.payloadJson").value(PAYLOAD))
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, org.hamcrest.Matchers.containsString("no-store")));

        mockMvc.perform(delete(DRAFT_PATH)
                        .queryParam("consultationId", consultationParam)
                        .queryParam("consultantId", author.getId().toString())
                        .sessionAttr(SessionConstants.USER_OBJECT, author)
                        .sessionAttr(SessionConstants.TENANT_ID, tenantId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.hasDraft").value(false));

        mockMvc.perform(get(DRAFT_PATH)
                        .queryParam("consultationId", consultationParam)
                        .queryParam("consultantId", author.getId().toString())
                        .sessionAttr(SessionConstants.USER_OBJECT, author)
                        .sessionAttr(SessionConstants.TENANT_ID, tenantId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.hasDraft").value(false));
    }

    @Test
    @DisplayName("저장된 payload_json 은 평문이 아니다 (같은 변환기로 암호화)")
    void storedPayloadIsNotPlaintext() throws Exception {
        String tenantId = UUID.randomUUID().toString();
        User author = user(99202L, tenantId, UserRole.CONSULTANT, "enc");
        Schedule schedule = schedule(tenantId, author.getId(), 10);

        mockMvc.perform(put(DRAFT_PATH)
                        .queryParam("consultationId", "schedule-" + schedule.getId())
                        .queryParam("consultantId", author.getId().toString())
                        .sessionAttr(SessionConstants.USER_OBJECT, author)
                        .sessionAttr(SessionConstants.TENANT_ID, tenantId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(saveBody(PAYLOAD))))
                .andExpect(status().isOk());

        entityManager.flush();
        entityManager.clear();
        Object raw = entityManager
                .createNativeQuery("SELECT payload_json FROM consultation_record_drafts "
                        + "WHERE tenant_id = :tenantId AND consultation_id = :consultationId")
                .setParameter("tenantId", tenantId)
                .setParameter("consultationId", schedule.getId())
                .getSingleResult();
        String stored = String.valueOf(raw);

        assertThat(stored).doesNotContain("내담자가 불안을 호소");
        assertThat(ConsultationBodyAttributeConverter.looksEncrypted(stored)).isTrue();

        // 변환기 dual-read: 엔티티로 읽으면 평문으로 돌아온다
        assertThat(draftRepository
                .findByTenantIdAndConsultationIdAndConsultantIdAndIsDeletedFalse(
                    tenantId, schedule.getId(), author.getId())
                .orElseThrow()
                .getPayloadJson())
            .isEqualTo(PAYLOAD);
    }

    @Test
    @DisplayName("다른 상담사 — 같은 테넌트라도 타인 초안 GET 403")
    void otherConsultant_isForbidden() throws Exception {
        String tenantId = UUID.randomUUID().toString();
        User author = user(99203L, tenantId, UserRole.CONSULTANT, "owner");
        User other = user(99204L, tenantId, UserRole.CONSULTANT, "other");
        Schedule schedule = schedule(tenantId, author.getId(), 11);

        mockMvc.perform(get(DRAFT_PATH)
                        .queryParam("consultationId", "schedule-" + schedule.getId())
                        .queryParam("consultantId", author.getId().toString())
                        .sessionAttr(SessionConstants.USER_OBJECT, other)
                        .sessionAttr(SessionConstants.TENANT_ID, tenantId))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("내담자 — 초안 GET 403 (본인 id 를 넣어도 거부)")
    void client_isForbidden() throws Exception {
        String tenantId = UUID.randomUUID().toString();
        User author = user(99205L, tenantId, UserRole.CONSULTANT, "forclient");
        User client = user(99206L, tenantId, UserRole.CLIENT, "client");
        Schedule schedule = schedule(tenantId, author.getId(), 12);

        mockMvc.perform(get(DRAFT_PATH)
                        .queryParam("consultationId", "schedule-" + schedule.getId())
                        .queryParam("consultantId", author.getId().toString())
                        .sessionAttr(SessionConstants.USER_OBJECT, client)
                        .sessionAttr(SessionConstants.TENANT_ID, tenantId))
                .andExpect(status().isForbidden());

        mockMvc.perform(get(DRAFT_PATH)
                        .queryParam("consultationId", "schedule-" + schedule.getId())
                        .queryParam("consultantId", client.getId().toString())
                        .sessionAttr(SessionConstants.USER_OBJECT, client)
                        .sessionAttr(SessionConstants.TENANT_ID, tenantId))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("관리자 — 작성자가 아니므로 초안 GET 403 (확정 일지와 다른 좁은 규칙)")
    void tenantAdmin_isForbidden() throws Exception {
        String tenantId = UUID.randomUUID().toString();
        User author = user(99207L, tenantId, UserRole.CONSULTANT, "foradmin");
        User admin = user(99208L, tenantId, UserRole.ADMIN, "admin");
        Schedule schedule = schedule(tenantId, author.getId(), 13);

        mockMvc.perform(get(DRAFT_PATH)
                        .queryParam("consultationId", "schedule-" + schedule.getId())
                        .queryParam("consultantId", author.getId().toString())
                        .sessionAttr(SessionConstants.USER_OBJECT, admin)
                        .sessionAttr(SessionConstants.TENANT_ID, tenantId))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("다른 테넌트 상담사 — 같은 consultantId 라도 403 (존재 여부 미노출)")
    void otherTenant_isForbidden() throws Exception {
        String tenantId = UUID.randomUUID().toString();
        String otherTenantId = UUID.randomUUID().toString();
        Long consultantPk = 99209L;
        User author = user(consultantPk, tenantId, UserRole.CONSULTANT, "tenantA");
        User sameIdOtherTenant = user(consultantPk, otherTenantId, UserRole.CONSULTANT, "tenantB");
        Schedule schedule = schedule(tenantId, author.getId(), 14);

        mockMvc.perform(get(DRAFT_PATH)
                        .queryParam("consultationId", "schedule-" + schedule.getId())
                        .queryParam("consultantId", consultantPk.toString())
                        .sessionAttr(SessionConstants.USER_OBJECT, sameIdOtherTenant)
                        .sessionAttr(SessionConstants.TENANT_ID, otherTenantId))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("DELETE — 다른 상담사는 403, 초안은 남아 있다")
    void delete_byOtherConsultant_isForbidden() throws Exception {
        String tenantId = UUID.randomUUID().toString();
        User author = user(99210L, tenantId, UserRole.CONSULTANT, "delowner");
        User other = user(99211L, tenantId, UserRole.CONSULTANT, "delother");
        Schedule schedule = schedule(tenantId, author.getId(), 15);
        String consultationParam = "schedule-" + schedule.getId();

        mockMvc.perform(put(DRAFT_PATH)
                        .queryParam("consultationId", consultationParam)
                        .queryParam("consultantId", author.getId().toString())
                        .sessionAttr(SessionConstants.USER_OBJECT, author)
                        .sessionAttr(SessionConstants.TENANT_ID, tenantId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(saveBody(PAYLOAD))))
                .andExpect(status().isOk());

        mockMvc.perform(delete(DRAFT_PATH)
                        .queryParam("consultationId", consultationParam)
                        .queryParam("consultantId", author.getId().toString())
                        .sessionAttr(SessionConstants.USER_OBJECT, other)
                        .sessionAttr(SessionConstants.TENANT_ID, tenantId))
                .andExpect(status().isForbidden());

        assertThat(draftRepository
                .findByTenantIdAndConsultationIdAndConsultantIdAndIsDeletedFalse(
                    tenantId, schedule.getId(), author.getId()))
            .isPresent();
    }
}
