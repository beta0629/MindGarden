package com.coresolution.consultation.integration;

import java.util.UUID;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * GET /api/v1/admin/duplicate-check/phone MockMvc 스모크.
 *
 * @author CoreSolution
 * @since 2026-04-23
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@Transactional
@DisplayName("AdminController 휴대폰 중복 확인")
class AdminControllerDuplicateCheckPhoneIntegrationTest {

    private static final String TEST_TENANT_ID = UUID.randomUUID().toString();

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    private User adminUser() {
        User user = new User();
        user.setId(1L);
        user.setUserId("admin-dup-phone");
        user.setEmail("admin-dup-phone@test.com");
        user.setName("테스트관리자");
        user.setTenantId(TEST_TENANT_ID);
        user.setRole(UserRole.ADMIN);
        return user;
    }

    @Test
    @DisplayName("테넌트 없으면 400")
    void checkPhone_tenantMissing_returns400() throws Exception {
        User u = adminUser();
        u.setTenantId(null);
        mockMvc.perform(get("/api/v1/admin/duplicate-check/phone")
                        .param("phone", "010-1234-5678")
                        .sessionAttr(SessionConstants.USER_OBJECT, u))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("무효한 휴대폰이면 200, available=false, isDuplicate=false")
    void checkPhone_invalidPhone_returns200WithAvailableFalse() throws Exception {
        mockMvc.perform(get("/api/v1/admin/duplicate-check/phone")
                        .param("phone", "02-123-4567")
                        .sessionAttr(SessionConstants.USER_OBJECT, adminUser())
                        .sessionAttr(SessionConstants.TENANT_ID, TEST_TENANT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.phone").value("021234567"))
                .andExpect(jsonPath("$.data.isDuplicate").value(false))
                .andExpect(jsonPath("$.data.available").value(false))
                .andExpect(jsonPath("$.data.message")
                        .value(AdminServiceUserFacingMessages.MSG_DUPLICATE_CHECK_PHONE_INVALID));
    }

    @Test
    @DisplayName("정상 번호·중복 아님: UserService 호출, available true")
    void checkPhone_validAvailable_returns200() throws Exception {
        when(userService.isDuplicateExcludingId(isNull(), eq("phone"), eq("01012345678"))).thenReturn(false);

        mockMvc.perform(get("/api/v1/admin/duplicate-check/phone")
                        .param("phone", "010-1234-5678")
                        .sessionAttr(SessionConstants.USER_OBJECT, adminUser())
                        .sessionAttr(SessionConstants.TENANT_ID, TEST_TENANT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isDuplicate").value(false))
                .andExpect(jsonPath("$.data.available").value(true))
                .andExpect(jsonPath("$.data.message")
                        .value(AdminServiceUserFacingMessages.MSG_DUPLICATE_CHECK_PHONE_AVAILABLE));

        verify(userService).isDuplicateExcludingId(isNull(), eq("phone"), eq("01012345678"));
    }

    @Test
    @DisplayName("excludeUserId 전달 시 동일 인자로 서비스 호출")
    void checkPhone_withExcludeId_passesToService() throws Exception {
        when(userService.isDuplicateExcludingId(eq(99L), eq("phone"), eq("01099998888"))).thenReturn(true);

        mockMvc.perform(get("/api/v1/admin/duplicate-check/phone")
                        .param("phone", "01099998888")
                        .param("excludeUserId", "99")
                        .sessionAttr(SessionConstants.USER_OBJECT, adminUser())
                        .sessionAttr(SessionConstants.TENANT_ID, TEST_TENANT_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isDuplicate").value(true))
                .andExpect(jsonPath("$.data.available").value(false));

        verify(userService).isDuplicateExcludingId(eq(99L), eq("phone"), eq("01099998888"));
    }
}
