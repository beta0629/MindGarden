package com.coresolution.consultation.integration;

import java.util.UUID;

import com.coresolution.consultation.constant.ServerErrorMessages;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.ConsultantStatsService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.integrationtest.support.WithMockAdminSecurityContext;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.dao.InvalidDataAccessResourceUsageException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * AdminController catch 블록 500 — 응답에 SQL 원문이 없고 공통 문구 + traceId 로 응답한다 (MockMvc).
 *
 * @author MindGarden
 * @since 2026-10-03
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@Transactional
@WithMockAdminSecurityContext
@DisplayName("AdminController — 500 응답 문구 정리")
class AdminControllerServerErrorSanitizeIntegrationTest {

    private static final String TEST_TENANT_ID = UUID.randomUUID().toString();
    private static final String SQL_LEAK =
            "PreparedStatementCallback; bad SQL grammar [SELECT c.specialty FROM consultants c WHERE c.tenant_id = ?]";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ConsultantStatsService consultantStatsService;

    @MockBean
    private DynamicPermissionService dynamicPermissionService;

    @Test
    @DisplayName("전문분야 통계 DB 오류 → 500 · 공통 문구 · traceId · SQL 원문 없음")
    void specialtyStatistics_dbFailure_returnsGenericBody() throws Exception {
        when(dynamicPermissionService.hasPermission(any(User.class), anyString())).thenReturn(true);
        when(consultantStatsService.getAllConsultantsWithStats())
                .thenThrow(new InvalidDataAccessResourceUsageException(SQL_LEAK));

        mockMvc.perform(get("/api/v1/admin/statistics/specialty")
                        .sessionAttr(SessionConstants.USER_OBJECT, adminUser())
                        .sessionAttr(SessionConstants.TENANT_ID, TEST_TENANT_ID))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(ServerErrorMessages.INTERNAL_SERVER_ERROR))
                .andExpect(jsonPath("$.errorCode").value(ServerErrorMessages.CODE_INTERNAL_SERVER_ERROR))
                .andExpect(jsonPath("$.traceId").isNotEmpty())
                .andExpect(content().string(not(containsString("SQL"))))
                .andExpect(content().string(not(containsString("consultants"))));
    }

    private User adminUser() {
        User user = new User();
        user.setId(1L);
        user.setUserId("admin-sanitize-mvc");
        user.setEmail("admin-sanitize-mvc@test.com");
        user.setName("테스트관리자");
        user.setTenantId(TEST_TENANT_ID);
        user.setRole(UserRole.ADMIN);
        return user;
    }
}
