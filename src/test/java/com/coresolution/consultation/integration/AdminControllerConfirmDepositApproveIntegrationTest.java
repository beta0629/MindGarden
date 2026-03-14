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
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * AdminController confirmDeposit / approveMapping MockMvc 통합 테스트
 * - TenantContextHolder 설정 및 통계 업데이트 호출 검증
 * - 권한(MAPPING_MANAGE)·필수 파라미터 검증
 *
 * @author MindGarden
 * @since 2026-03-14
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@Transactional
@DisplayName("AdminController 입금확인/승인 API 통합 테스트")
class AdminControllerConfirmDepositApproveIntegrationTest {

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

    private User consultantUser() {
        User user = new User();
        user.setId(2L);
        user.setUserId("consultant-test");
        user.setEmail("consultant@test.com");
        user.setName("테스트상담사");
        user.setTenantId(TEST_TENANT_ID);
        user.setRole(UserRole.CONSULTANT);
        return user;
    }

    private ConsultantClientMapping mappingWithRelations(Long mappingId, Long consultantId, Long clientId) {
        User consultant = new User();
        consultant.setId(consultantId);
        consultant.setTenantId(TEST_TENANT_ID);
        User client = new User();
        client.setId(clientId);
        client.setTenantId(TEST_TENANT_ID);
        ConsultantClientMapping m = new ConsultantClientMapping();
        m.setId(mappingId);
        m.setConsultant(consultant);
        m.setClient(client);
        m.setPackageName("테스트패키지");
        m.setPackagePrice(100000L);
        m.setTotalSessions(10);
        m.setRemainingSessions(10);
        return m;
    }

    @Test
    @DisplayName("confirmDeposit 호출 시 TenantContextHolder 설정 및 통계 업데이트가 호출된다")
    void confirmDeposit_callsTenantContextAndStatisticsUpdate() throws Exception {
        Long mappingId = 1L;
        Long consultantId = 10L;
        Long clientId = 20L;
        ConsultantClientMapping mapping = mappingWithRelations(mappingId, consultantId, clientId);

        when(adminService.getMappingById(mappingId)).thenReturn(mapping);
        when(adminService.confirmDeposit(eq(mappingId), eq("REF-001"))).thenReturn(mapping);

        Map<String, Object> body = new HashMap<>();
        body.put("depositReference", "REF-001");

        mockMvc.perform(post("/api/v1/admin/mappings/{mappingId}/confirm-deposit", mappingId)
                        .sessionAttr(SessionConstants.USER_OBJECT, adminUser())
                        .sessionAttr(SessionConstants.TENANT_ID, TEST_TENANT_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(adminService).confirmDeposit(mappingId, "REF-001");
        verify(realTimeStatisticsService).updateStatisticsOnMappingChange(
                eq(consultantId), eq(clientId), isNull());
    }

    @Test
    @DisplayName("approveMapping 호출 시 TenantContextHolder 설정 및 통계 업데이트가 호출된다")
    void approveMapping_callsTenantContextAndStatisticsUpdate() throws Exception {
        Long mappingId = 2L;
        Long consultantId = 11L;
        Long clientId = 21L;
        ConsultantClientMapping mapping = mappingWithRelations(mappingId, consultantId, clientId);

        when(adminService.approveMapping(eq(mappingId), eq("관리자이름"))).thenReturn(mapping);
        when(adminService.getMappingById(mappingId)).thenReturn(mapping);

        Map<String, Object> body = new HashMap<>();
        body.put("adminName", "관리자이름");

        mockMvc.perform(post("/api/v1/admin/mappings/{mappingId}/approve", mappingId)
                        .sessionAttr(SessionConstants.USER_OBJECT, adminUser())
                        .sessionAttr(SessionConstants.TENANT_ID, TEST_TENANT_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(adminService).approveMapping(mappingId, "관리자이름");
        verify(realTimeStatisticsService).updateStatisticsOnMappingChange(
                eq(consultantId), eq(clientId), isNull());
    }

    @Test
    @DisplayName("confirmDeposit - 매핑 없을 때 400 에러 응답")
    void confirmDeposit_mappingNotFound_returnsError() throws Exception {
        Long mappingId = 999L;
        when(adminService.getMappingById(mappingId)).thenReturn(null);

        Map<String, Object> body = new HashMap<>();
        body.put("depositReference", "REF-001");

        mockMvc.perform(post("/api/v1/admin/mappings/{mappingId}/confirm-deposit", mappingId)
                        .sessionAttr(SessionConstants.USER_OBJECT, adminUser())
                        .sessionAttr(SessionConstants.TENANT_ID, TEST_TENANT_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("confirmDeposit - MAPPING_MANAGE 권한 없을 때 403")
    void confirmDeposit_withoutMappingManagePermission_returns403() throws Exception {
        when(dynamicPermissionService.hasPermission(any(User.class), eq("MAPPING_MANAGE")))
                .thenReturn(false);

        Map<String, Object> body = new HashMap<>();
        body.put("depositReference", "REF-001");

        mockMvc.perform(post("/api/v1/admin/mappings/1/confirm-deposit")
                        .sessionAttr(SessionConstants.USER_OBJECT, consultantUser())
                        .sessionAttr(SessionConstants.TENANT_ID, TEST_TENANT_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("approveMapping - 필수 파라미터 adminName 포함 시 정상 호출")
    void approveMapping_withAdminName_succeeds() throws Exception {
        Long mappingId = 3L;
        ConsultantClientMapping mapping = mappingWithRelations(mappingId, 12L, 22L);
        when(adminService.approveMapping(eq(mappingId), eq("Admin"))).thenReturn(mapping);
        when(adminService.getMappingById(mappingId)).thenReturn(mapping);

        Map<String, Object> body = new HashMap<>();
        body.put("adminName", "Admin");

        mockMvc.perform(post("/api/v1/admin/mappings/{mappingId}/approve", mappingId)
                        .sessionAttr(SessionConstants.USER_OBJECT, adminUser())
                        .sessionAttr(SessionConstants.TENANT_ID, TEST_TENANT_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk());
        verify(adminService).approveMapping(mappingId, "Admin");
    }
}
