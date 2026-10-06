package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doReturn;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.Consultation;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultationRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.service.TenantService;
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

/**
 * {@code POST /api/v1/consultations} — 엔티티 바인딩 제거 후 명시 DTO·센터 권한·테넌트 강제.
 *
 * <ul>
 *   <li>내담자 세션 → 403 (내담자 예약은 {@code /api/v1/clients/me/bookings}).</li>
 *   <li>관리자 → 201, 테넌트는 컨텍스트 기준, 본문 tenantId·status 무시.</li>
 *   <li>다른 테넌트 내담자 id → 거절, 생성 없음. 클래스 {@code @RequireBusinessType} 애스펙트가 예외를 403 으로 감싼다.</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@WithMockAdminSecurityContext
@DisplayName("상담 요청 생성 — 명시 DTO, 센터 전용, 테넌트 강제")
class ConsultationCreateDtoIntegrationTest {

    private static final String URL = "/api/v1/consultations";
    private static final String BUSINESS_TYPE = "CONSULTATION";

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private ConsultationRepository consultationRepository;

    @MockBean private TenantService tenantService;

    private final List<Long> createdUserIds = new ArrayList<>();
    private String tenantId;
    private User consultant;
    private User client;

    @BeforeEach
    void setUp() {
        tenantId = "ccd-" + UUID.randomUUID().toString().replace("-", "").substring(0, 28);
        TenantContextHolder.setTenantId(tenantId);
        doReturn(BUSINESS_TYPE).when(tenantService).getBusinessType(anyString());
        consultant = saveUser(tenantId, UserRole.CONSULTANT);
        client = saveUser(tenantId, UserRole.CLIENT);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.setTenantId(tenantId);
        consultationRepository.deleteAll(consultationsOf(createdUserIds));
        createdUserIds.forEach(userRepository::deleteById);
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("내담자 세션 → 403, 생성 없음")
    void clientSession_isForbidden() throws Exception {
        create(session(client.getId(), UserRole.CLIENT), body(client.getId()))
                .andExpect(status().isForbidden());

        assertThat(consultationsOf(createdUserIds)).isEmpty();
    }

    @Test
    @DisplayName("관리자 → 201, 테넌트는 컨텍스트 기준이고 본문 tenantId·status 는 무시")
    void admin_createsWithContextTenant() throws Exception {
        Map<String, Object> body = body(client.getId());
        body.put("tenantId", "ccd-injected-tenant");
        body.put("status", "COMPLETED");

        create(session(1L, UserRole.ADMIN), body)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.clientId").value(client.getId()));

        List<Consultation> rows = consultationsOf(createdUserIds);
        assertThat(rows).hasSize(1);
        assertThat(rows.get(0).getTenantId()).isEqualTo(tenantId);
        assertThat(rows.get(0).getStatus()).isEqualTo("REQUESTED");
    }

    @Test
    @DisplayName("다른 테넌트 내담자 id → 403(업종 애스펙트가 검증 예외를 감쌈), 생성 없음")
    void foreignTenantClient_isRejected() throws Exception {
        User foreign = saveUser("ccd-o-" + UUID.randomUUID().toString().replace("-", "").substring(0, 26),
                UserRole.CLIENT);

        create(session(1L, UserRole.ADMIN), body(foreign.getId()))
                .andExpect(status().isForbidden());

        assertThat(consultationsOf(createdUserIds)).isEmpty();
    }

    private ResultActions create(Map<String, Object> sessionAttrs, Map<String, Object> body) throws Exception {
        var builder = post(URL).contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body));
        sessionAttrs.forEach(builder::sessionAttr);
        ResultActions result = mockMvc.perform(builder);
        TenantContextHolder.setTenantId(tenantId);
        return result;
    }

    private Map<String, Object> body(Long clientId) {
        Map<String, Object> body = new HashMap<>();
        body.put("consultantId", consultant.getId());
        body.put("clientId", clientId);
        body.put("consultationDate", LocalDate.now().plusDays(3).toString());
        body.put("startTime", "10:00");
        body.put("endTime", "10:50");
        body.put("title", "ccd-it");
        return body;
    }

    private Map<String, Object> session(Long userId, UserRole role) {
        User user = new User();
        user.setId(userId);
        user.setUserId("ccd-caller-" + role.name().toLowerCase());
        user.setRole(role);
        user.setTenantId(tenantId);
        Map<String, Object> attrs = new HashMap<>();
        attrs.put(SessionConstants.USER_OBJECT, user);
        attrs.put(SessionConstants.TENANT_ID, tenantId);
        return attrs;
    }

    private List<Consultation> consultationsOf(List<Long> userIds) {
        return consultationRepository.findAll().stream()
                .filter(c -> userIds.contains(c.getClientId()) || userIds.contains(c.getConsultantId()))
                .toList();
    }

    private User saveUser(String userTenantId, UserRole role) {
        TenantContextHolder.setTenantId(userTenantId);
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User user = new User();
        user.setTenantId(userTenantId);
        user.setUserId("ccd-" + role.name().toLowerCase() + "-" + suffix);
        user.setEmail("ccd-" + suffix + "@example.test");
        user.setPassword("not-a-real-hash");
        user.setName("ccd-" + role.name().toLowerCase());
        user.setRole(role);
        user.setIsDeleted(false);
        User saved = userRepository.saveAndFlush(user);
        createdUserIds.add(saved.getId());
        TenantContextHolder.setTenantId(tenantId);
        return saved;
    }
}
