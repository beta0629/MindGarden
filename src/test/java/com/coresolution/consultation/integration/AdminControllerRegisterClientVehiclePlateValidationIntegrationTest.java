package com.coresolution.consultation.integration;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.AdminService;
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

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * POST /api/v1/admin/clients — {@code vehiclePlate} Bean Validation 실패 시
 * HTTP 400 및 {@link com.coresolution.core.dto.ErrorResponse} 필드 검증 (MockMvc).
 *
 * @author CoreSolution
 * @since 2026-03-28
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@Transactional
@DisplayName("AdminController 내담자 등록 vehiclePlate 검증 MockMvc 통합 테스트")
class AdminControllerRegisterClientVehiclePlateValidationIntegrationTest {

    private static final String TEST_TENANT_ID = UUID.randomUUID().toString();

    private static final String BEAN_VALIDATION_MESSAGE = "입력 데이터 검증에 실패했습니다.";
    private static final String BEAN_VALIDATION_CODE = "BEAN_VALIDATION_ERROR";
    private static final String VEHICLE_PLATE_HINT = "차량번호";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AdminService adminService;

    private User adminUser() {
        User user = new User();
        user.setId(1L);
        user.setUserId("admin-plate-mvc");
        user.setEmail("admin-plate-mvc@test.com");
        user.setName("테스트관리자");
        user.setTenantId(TEST_TENANT_ID);
        user.setRole(UserRole.ADMIN);
        return user;
    }

    private Map<String, Object> clientBodyWithPlate(String vehiclePlate) {
        Map<String, Object> body = new HashMap<>();
        body.put("email", "mvc-vehicle-plate-" + UUID.randomUUID() + "@test.com");
        body.put("name", "테스트내담자");
        body.put("vehiclePlate", vehiclePlate);
        return body;
    }

    @Test
    @DisplayName("vehiclePlate 금지 문자 포함 시 400, errorCode·details에 vehiclePlate·차량번호 안내")
    void registerClient_invalidPlateCharacter_returns400WithDetails() throws Exception {
        mockMvc.perform(post("/api/v1/admin/clients")
                        .sessionAttr(SessionConstants.USER_OBJECT, adminUser())
                        .sessionAttr(SessionConstants.TENANT_ID, TEST_TENANT_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(clientBodyWithPlate("12@3456"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errorCode").value(BEAN_VALIDATION_CODE))
                .andExpect(jsonPath("$.message").value(BEAN_VALIDATION_MESSAGE))
                .andExpect(jsonPath("$.details", containsString("vehiclePlate")))
                .andExpect(jsonPath("$.details", containsString(VEHICLE_PLATE_HINT)));

        verify(adminService, never()).registerClient(any());
    }

    @Test
    @DisplayName("vehiclePlate 33자 초과 시 400, details에 vehiclePlate 위반")
    void registerClient_plateTooLong_returns400WithDetails() throws Exception {
        String tooLong = "1".repeat(33);
        mockMvc.perform(post("/api/v1/admin/clients")
                        .sessionAttr(SessionConstants.USER_OBJECT, adminUser())
                        .sessionAttr(SessionConstants.TENANT_ID, TEST_TENANT_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(clientBodyWithPlate(tooLong))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errorCode").value(BEAN_VALIDATION_CODE))
                .andExpect(jsonPath("$.message").value(BEAN_VALIDATION_MESSAGE))
                .andExpect(jsonPath("$.details", containsString("vehiclePlate")))
                .andExpect(jsonPath("$.details", containsString(VEHICLE_PLATE_HINT)));

        verify(adminService, never()).registerClient(any());
    }
}
