package com.coresolution.consultation.integration;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import com.coresolution.consultation.config.AdminTestNotificationProperties;
import com.coresolution.consultation.dto.TestAlimtalkRequest;
import com.coresolution.consultation.dto.TestNotificationChannel;
import com.coresolution.consultation.dto.TestNotificationRecipientMode;
import com.coresolution.consultation.dto.TestNotificationResponse;
import com.coresolution.consultation.dto.TestSmsRequest;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.AdminTestNotificationService;
import com.coresolution.consultation.service.impl.AdminTestNotificationRateLimiter.Decision;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * {@code AdminTestNotificationController} MockMvc 테스트.
 *
 * <p>커버리지: 200 (ADMIN SELF 발송) / 400 (PHONE 모드 거부) / 403 (CONSULTANT 권한 거부) /
 * 429 (rate-limit 초과). 기획서 §4.X C2(admin_staff) / C3(self_plus_db) / C5(10_100) 검증.
 *
 * @author MindGarden
 * @since 2026-05-22
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@DisplayName("어드민 SMS·알림톡 테스트 발송 API")
class AdminTestNotificationControllerTest {

    private static final String TEST_TENANT_ID = UUID.randomUUID().toString();
    private static final Long TEST_USER_ID = 999L;
    private static final String TEST_USER_LOGIN = "admin_tester";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AdminTestNotificationService adminTestNotificationService;

    @MockBean
    private AdminTestNotificationProperties adminTestNotificationProperties;

    @BeforeEach
    void setTenantContext() {
        TenantContextHolder.setTenantId(TEST_TENANT_ID);
        AdminTestNotificationProperties.RateLimit rateLimit =
            new AdminTestNotificationProperties.RateLimit();
        when(adminTestNotificationProperties.getRateLimit()).thenReturn(rateLimit);
        when(adminTestNotificationProperties.getHistoryPageSizeDefault()).thenReturn(30);
        when(adminTestNotificationProperties.getHistoryPageSizeMax()).thenReturn(100);
    }

    @AfterEach
    void clearTenantContext() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("POST /sms — ADMIN + SELF 발송 200")
    @WithMockUser(roles = {"ADMIN"})
    void sendSms_whenAdminSelf_returns200() throws Exception {
        TestSmsRequest request = TestSmsRequest.builder()
            .recipientMode(TestNotificationRecipientMode.SELF)
            .message("[테스트] 어드민 SMS 발송 검증")
            .reason("P3 검증 시나리오 #1 — SELF 발송")
            .build();

        TestNotificationResponse response = TestNotificationResponse.builder()
            .success(true)
            .sentAt(LocalDateTime.now())
            .logId(123L)
            .build();

        Decision allowed = Decision.allowed(9, 99);
        when(adminTestNotificationService.checkRateLimit(eq(TEST_TENANT_ID), any()))
            .thenReturn(allowed);
        when(adminTestNotificationService.sendSms(eq(TEST_TENANT_ID), any(User.class), any(TestSmsRequest.class)))
            .thenReturn(response);

        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(any(HttpSession.class)))
                .thenReturn(buildCurrentUser());

            mockMvc.perform(post("/api/v1/admin/test-notifications/sms")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.success").value(true))
                .andExpect(jsonPath("$.data.logId").value(123));
        }

        verify(adminTestNotificationService)
            .sendSms(eq(TEST_TENANT_ID), any(User.class), any(TestSmsRequest.class));
    }

    @Test
    @DisplayName("POST /sms — CONSULTANT 권한이면 403")
    @WithMockUser(roles = {"CONSULTANT"})
    void sendSms_whenConsultant_returns403() throws Exception {
        TestSmsRequest request = TestSmsRequest.builder()
            .recipientMode(TestNotificationRecipientMode.SELF)
            .message("denied")
            .reason("403 시나리오 검증")
            .build();

        mockMvc.perform(post("/api/v1/admin/test-notifications/sms")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isForbidden());

        verify(adminTestNotificationService, never())
            .sendSms(anyString(), any(User.class), any(TestSmsRequest.class));
    }

    @Test
    @DisplayName("POST /sms — Rate-limit 초과 시 429 + Retry-After")
    @WithMockUser(roles = {"STAFF"})
    void sendSms_whenRateLimitExceeded_returns429() throws Exception {
        TestSmsRequest request = TestSmsRequest.builder()
            .recipientMode(TestNotificationRecipientMode.SELF)
            .message("[테스트] rate-limit 검증")
            .reason("429 시나리오")
            .build();

        Decision exceeded = Decision.exceeded("PER_MINUTE", 0, 50, 60L);
        when(adminTestNotificationService.checkRateLimit(eq(TEST_TENANT_ID), any()))
            .thenReturn(exceeded);

        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(any(HttpSession.class)))
                .thenReturn(buildCurrentUser());

            mockMvc.perform(post("/api/v1/admin/test-notifications/sms")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string("Retry-After", "60"))
                .andExpect(header().string("X-RateLimit-Remaining-Per-Minute", "0"))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data.errorCode").value("RATE_LIMIT_EXCEEDED"))
                .andExpect(jsonPath("$.data.limitKind").value("PER_MINUTE"));
        }

        verify(adminTestNotificationService, never())
            .sendSms(anyString(), any(User.class), any(TestSmsRequest.class));
    }

    @Test
    @DisplayName("POST /alimtalk — PHONE 모드는 백엔드에서 거부(400)")
    @WithMockUser(roles = {"ADMIN"})
    void sendAlimtalk_whenPhoneMode_returns400() throws Exception {
        String rawJson = "{"
            + "\"recipientMode\":\"PHONE\","
            + "\"templateCode\":\"CONSULTATION_CONFIRMED\","
            + "\"templateParams\":{},"
            + "\"reason\":\"PHONE 모드 거부 시나리오\""
            + "}";

        mockMvc.perform(post("/api/v1/admin/test-notifications/alimtalk")
                .contentType(MediaType.APPLICATION_JSON)
                .content(rawJson))
            .andExpect(status().isBadRequest());

        verify(adminTestNotificationService, never())
            .sendAlimtalk(anyString(), any(User.class), any(TestAlimtalkRequest.class));
    }

    private User buildCurrentUser() {
        User user = new User();
        user.setId(TEST_USER_ID);
        user.setUserId(TEST_USER_LOGIN);
        user.setTenantId(TEST_TENANT_ID);
        return user;
    }
}
