package com.coresolution.consultation.integration;

import java.util.HashMap;
import java.util.Map;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.RealTimeStatisticsService;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.transaction.annotation.Transactional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * AdminController.createMapping `@Valid` 적용 통합 테스트 (P0 핫픽스 2026-05-28).
 *
 * <p>합의서: docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN.md
 *
 * <ul>
 *   <li>consultantId / packageName / totalSessions / packagePrice 누락 시 400</li>
 *   <li>정상 페이로드는 200 + adminService.createMapping 호출</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-05-28
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@Transactional
@DisplayName("AdminController createMapping @Valid 통합 테스트")
class AdminControllerCreateMappingValidationIntegrationTest {

    private static final String TEST_TENANT_ID = "tenant-test-" + java.util.UUID.randomUUID();

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AdminService adminService;

    @MockBean
    private RealTimeStatisticsService realTimeStatisticsService;

    @MockBean
    private DynamicPermissionService dynamicPermissionService;

    @BeforeEach
    void setUp() {
        when(dynamicPermissionService.hasPermission(any(User.class), eq("MAPPING_MANAGE")))
                .thenReturn(true);
    }

    private User adminUser() {
        User user = new User();
        user.setId(1L);
        user.setUserId("admin-test");
        user.setEmail("admin@test.com");
        user.setName("테스트관리자");
        user.setTenantId(TEST_TENANT_ID);
        user.setRole(UserRole.ADMIN);
        return user;
    }

    private Map<String, Object> validPayload() {
        Map<String, Object> body = new HashMap<>();
        body.put("consultantId", 10);
        body.put("clientId", 20);
        body.put("packageName", "표준 패키지");
        body.put("totalSessions", 5);
        body.put("packagePrice", 300000);
        body.put("paymentMethod", "BANK_TRANSFER");
        return body;
    }

    @Test
    @DisplayName("consultantId 누락 → 400 + createMapping 미호출")
    void createMapping_missingConsultantId_returns400() throws Exception {
        Map<String, Object> body = validPayload();
        body.remove("consultantId");

        mockMvc.perform(post("/api/v1/admin/mappings")
                        .sessionAttr(SessionConstants.USER_OBJECT, adminUser())
                        .sessionAttr(SessionConstants.TENANT_ID, TEST_TENANT_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest());

        verify(adminService, never())
                .createMapping(any(com.coresolution.consultation.dto.ConsultantClientMappingCreateRequest.class));
    }

    @Test
    @DisplayName("packageName 빈 문자열 → 400 + createMapping 미호출")
    void createMapping_blankPackageName_returns400() throws Exception {
        Map<String, Object> body = validPayload();
        body.put("packageName", "");

        mockMvc.perform(post("/api/v1/admin/mappings")
                        .sessionAttr(SessionConstants.USER_OBJECT, adminUser())
                        .sessionAttr(SessionConstants.TENANT_ID, TEST_TENANT_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest());

        verify(adminService, never())
                .createMapping(any(com.coresolution.consultation.dto.ConsultantClientMappingCreateRequest.class));
    }

    @Test
    @DisplayName("totalSessions 누락 → 400")
    void createMapping_missingTotalSessions_returns400() throws Exception {
        Map<String, Object> body = validPayload();
        body.remove("totalSessions");

        mockMvc.perform(post("/api/v1/admin/mappings")
                        .sessionAttr(SessionConstants.USER_OBJECT, adminUser())
                        .sessionAttr(SessionConstants.TENANT_ID, TEST_TENANT_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("packagePrice 0 → 400 (@Min(1) 위반)")
    void createMapping_zeroPackagePrice_returns400() throws Exception {
        Map<String, Object> body = validPayload();
        body.put("packagePrice", 0);

        mockMvc.perform(post("/api/v1/admin/mappings")
                        .sessionAttr(SessionConstants.USER_OBJECT, adminUser())
                        .sessionAttr(SessionConstants.TENANT_ID, TEST_TENANT_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("정상 페이로드 → 200 + createMapping 호출")
    void createMapping_validPayload_returnsOk() throws Exception {
        User consultant = new User();
        consultant.setId(10L);
        consultant.setTenantId(TEST_TENANT_ID);
        User client = new User();
        client.setId(20L);
        client.setTenantId(TEST_TENANT_ID);

        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(1L);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setPackageName("표준 패키지");
        mapping.setPackagePrice(300000L);
        mapping.setTotalSessions(5);

        when(adminService.createMapping(any(com.coresolution.consultation.dto.ConsultantClientMappingCreateRequest.class)))
                .thenReturn(mapping);

        mockMvc.perform(post("/api/v1/admin/mappings")
                        .sessionAttr(SessionConstants.USER_OBJECT, adminUser())
                        .sessionAttr(SessionConstants.TENANT_ID, TEST_TENANT_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validPayload())))
                .andExpect(status().is2xxSuccessful());

        verify(adminService)
                .createMapping(any(com.coresolution.consultation.dto.ConsultantClientMappingCreateRequest.class));
    }
}
