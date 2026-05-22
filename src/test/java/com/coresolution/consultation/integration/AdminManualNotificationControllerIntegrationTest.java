package com.coresolution.consultation.integration;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.coresolution.consultation.config.AdminTestNotificationProperties;
import com.coresolution.consultation.dto.BulkAlimtalkManualRequest;
import com.coresolution.consultation.dto.BulkNotificationResponse;
import com.coresolution.consultation.dto.BulkRecipientResult;
import com.coresolution.consultation.dto.BulkSmsManualRequest;
import com.coresolution.consultation.dto.TestNotificationAlimtalkTemplateSource;
import com.coresolution.consultation.dto.TestNotificationChannel;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.AdminManualNotificationService;
import com.coresolution.consultation.service.AdminTestNotificationService;
import com.coresolution.consultation.service.impl.AdminManualNotificationServiceImpl;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * {@code AdminManualNotificationController} MockMvc 통합 테스트(P1.2).
 *
 * <p>커버리지: 단일·다중 SMS·알림톡 정상 발송, batch_id 일관성, rate-limit 부족 전체 차단,
 * 수신자 누락(전화번호 부재) 부분 실패, 권한 거부, 50명 초과 거부, 템플릿 매핑 누락 차단.
 *
 * @author MindGarden
 * @since 2026-05-23
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@DisplayName("어드민 수동 다중 알림 발송 API")
class AdminManualNotificationControllerIntegrationTest {

    private static final String TEST_TENANT_ID = UUID.randomUUID().toString();
    private static final Long TEST_USER_ID = 999L;
    private static final String TEST_USER_LOGIN = "admin_tester";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AdminManualNotificationService manualService;

    @MockBean
    private AdminTestNotificationService singleService;

    @MockBean
    private AdminTestNotificationProperties properties;

    @BeforeEach
    void setTenantContext() {
        TenantContextHolder.setTenantId(TEST_TENANT_ID);
        AdminTestNotificationProperties.RateLimit rateLimit =
            new AdminTestNotificationProperties.RateLimit();
        when(properties.getRateLimit()).thenReturn(rateLimit);
        when(properties.getHistoryPageSizeDefault()).thenReturn(30);
        when(properties.getHistoryPageSizeMax()).thenReturn(100);
    }

    @AfterEach
    void clearTenantContext() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("POST /sms — 다중 발송 3명 모두 성공 + batch_id 동일")
    @WithMockUser(roles = {"ADMIN"})
    void sendBulkSms_whenAllSucceed_returns200WithBatchId() throws Exception {
        BulkSmsManualRequest request = BulkSmsManualRequest.builder()
            .userIds(Arrays.asList(101L, 102L, 103L))
            .content("[테스트] 다중 SMS 발송")
            .reason("P1.2 통합 — 다중 정상 시나리오")
            .build();

        String batchId = UUID.randomUUID().toString();
        List<BulkRecipientResult> results = new ArrayList<>();
        results.add(buildSuccess(101L, batchId));
        results.add(buildSuccess(102L, batchId));
        results.add(buildSuccess(103L, batchId));

        BulkNotificationResponse response = BulkNotificationResponse.builder()
            .batchId(batchId)
            .channel(TestNotificationChannel.SMS)
            .startedAt(LocalDateTime.now())
            .totalCount(3)
            .successCount(3)
            .failureCount(0)
            .results(results)
            .build();

        when(singleService.checkRateLimit(eq(TEST_TENANT_ID), any())).thenReturn(Decision.allowed(50, 100));
        when(manualService.sendBulkSms(eq(TEST_TENANT_ID), any(User.class), any(BulkSmsManualRequest.class)))
            .thenReturn(response);

        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(any(HttpSession.class)))
                .thenReturn(buildCurrentUser());

            mockMvc.perform(post("/api/v1/admin/manual-notifications/sms")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.batchId").value(batchId))
                .andExpect(jsonPath("$.data.totalCount").value(3))
                .andExpect(jsonPath("$.data.successCount").value(3))
                .andExpect(jsonPath("$.data.results.length()").value(3));
        }

        verify(manualService).sendBulkSms(eq(TEST_TENANT_ID), any(User.class), any(BulkSmsManualRequest.class));
    }

    @Test
    @DisplayName("POST /alimtalk — 다중 알림톡 발송 2명 + Solapi IDs 보존")
    @WithMockUser(roles = {"ADMIN"})
    void sendBulkAlimtalk_whenAllSucceed_returns200WithSolapiIds() throws Exception {
        Map<String, String> params = new HashMap<>();
        params.put("name", "홍길동");
        params.put("amount", "10,000");

        BulkAlimtalkManualRequest request = BulkAlimtalkManualRequest.builder()
            .userIds(Arrays.asList(201L, 202L))
            .templateCode("PAYMENT_COMPLETED")
            .templateSource(TestNotificationAlimtalkTemplateSource.COMMON_CODE)
            .templateParams(params)
            .reason("P1.2 통합 — 알림톡 정상")
            .build();

        String batchId = UUID.randomUUID().toString();
        BulkRecipientResult r1 = BulkRecipientResult.builder()
            .userId(201L).success(true).logId(1001L)
            .solapiGroupId("G-1").solapiMessageId("M-1").build();
        BulkRecipientResult r2 = BulkRecipientResult.builder()
            .userId(202L).success(true).logId(1002L)
            .solapiGroupId("G-2").solapiMessageId("M-2").build();

        BulkNotificationResponse response = BulkNotificationResponse.builder()
            .batchId(batchId)
            .channel(TestNotificationChannel.ALIMTALK)
            .startedAt(LocalDateTime.now())
            .totalCount(2)
            .successCount(2)
            .failureCount(0)
            .results(Arrays.asList(r1, r2))
            .build();

        when(singleService.checkRateLimit(eq(TEST_TENANT_ID), any())).thenReturn(Decision.allowed(50, 100));
        when(manualService.sendBulkAlimtalk(eq(TEST_TENANT_ID), any(User.class), any(BulkAlimtalkManualRequest.class)))
            .thenReturn(response);

        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(any(HttpSession.class)))
                .thenReturn(buildCurrentUser());

            mockMvc.perform(post("/api/v1/admin/manual-notifications/alimtalk")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.results[0].solapiGroupId").value("G-1"))
                .andExpect(jsonPath("$.data.results[1].solapiMessageId").value("M-2"));
        }

        verify(manualService).sendBulkAlimtalk(eq(TEST_TENANT_ID), any(User.class),
            any(BulkAlimtalkManualRequest.class));
    }

    @Test
    @DisplayName("POST /sms — rate-limit 잔여 < N 시 0건 발송 + RATE_LIMIT_EXCEEDED_BULK")
    @WithMockUser(roles = {"STAFF"})
    void sendBulkSms_whenRateLimitInsufficient_returnsBatchBlock() throws Exception {
        BulkSmsManualRequest request = BulkSmsManualRequest.builder()
            .userIds(Arrays.asList(301L, 302L, 303L, 304L, 305L))
            .content("rate-limit 부족 시나리오")
            .reason("P1.2 통합 — Q5")
            .build();

        String batchId = UUID.randomUUID().toString();
        BulkNotificationResponse blocked = BulkNotificationResponse.builder()
            .batchId(batchId)
            .channel(TestNotificationChannel.SMS)
            .startedAt(LocalDateTime.now())
            .totalCount(5)
            .successCount(0)
            .failureCount(5)
            .batchErrorCode(AdminManualNotificationServiceImpl.ERROR_CODE_RATE_LIMIT_EXCEEDED_BULK)
            .batchErrorMessage("분당/일당 발송 한도가 부족하여 배치 전체가 차단되었습니다.")
            .results(java.util.Collections.emptyList())
            .build();

        when(singleService.checkRateLimit(eq(TEST_TENANT_ID), any())).thenReturn(Decision.allowed(2, 100));
        when(manualService.sendBulkSms(eq(TEST_TENANT_ID), any(User.class), any(BulkSmsManualRequest.class)))
            .thenReturn(blocked);

        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(any(HttpSession.class)))
                .thenReturn(buildCurrentUser());

            mockMvc.perform(post("/api/v1/admin/manual-notifications/sms")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.batchErrorCode").value("RATE_LIMIT_EXCEEDED_BULK"))
                .andExpect(jsonPath("$.data.successCount").value(0))
                .andExpect(jsonPath("$.data.failureCount").value(5))
                .andExpect(jsonPath("$.data.results.length()").value(0));
        }
    }

    @Test
    @DisplayName("POST /sms — 1명 누락(전화번호 없음) → 1실패 + 2성공")
    @WithMockUser(roles = {"ADMIN"})
    void sendBulkSms_whenOneMissingPhone_returnsPartialSuccess() throws Exception {
        BulkSmsManualRequest request = BulkSmsManualRequest.builder()
            .userIds(Arrays.asList(401L, 402L, 403L))
            .content("부분 실패 시나리오")
            .reason("P1.2 통합 — 부분 성공")
            .build();

        String batchId = UUID.randomUUID().toString();
        BulkRecipientResult ok1 = buildSuccess(401L, batchId);
        BulkRecipientResult fail = BulkRecipientResult.builder()
            .userId(402L)
            .success(false)
            .errorCode(AdminManualNotificationServiceImpl.ERROR_CODE_RECIPIENT_PHONE_MISSING)
            .errorMessage("target user has no phone")
            .phoneMasked("n/a")
            .build();
        BulkRecipientResult ok2 = buildSuccess(403L, batchId);

        BulkNotificationResponse response = BulkNotificationResponse.builder()
            .batchId(batchId)
            .channel(TestNotificationChannel.SMS)
            .startedAt(LocalDateTime.now())
            .totalCount(3)
            .successCount(2)
            .failureCount(1)
            .results(Arrays.asList(ok1, fail, ok2))
            .build();

        when(singleService.checkRateLimit(eq(TEST_TENANT_ID), any())).thenReturn(Decision.allowed(50, 100));
        when(manualService.sendBulkSms(eq(TEST_TENANT_ID), any(User.class), any(BulkSmsManualRequest.class)))
            .thenReturn(response);

        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(any(HttpSession.class)))
                .thenReturn(buildCurrentUser());

            mockMvc.perform(post("/api/v1/admin/manual-notifications/sms")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.successCount").value(2))
                .andExpect(jsonPath("$.data.failureCount").value(1))
                .andExpect(jsonPath("$.data.results[1].errorCode")
                    .value("RECIPIENT_PHONE_MISSING"));
        }
    }

    @Test
    @DisplayName("POST /sms — CONSULTANT 권한이면 403")
    @WithMockUser(roles = {"CONSULTANT"})
    void sendBulkSms_whenConsultant_returns403() throws Exception {
        BulkSmsManualRequest request = BulkSmsManualRequest.builder()
            .userIds(Arrays.asList(501L))
            .content("denied")
            .reason("P1.2 통합 — 권한 거부 시나리오")
            .build();

        mockMvc.perform(post("/api/v1/admin/manual-notifications/sms")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isForbidden());

        verify(manualService, never()).sendBulkSms(anyString(), any(User.class),
            any(BulkSmsManualRequest.class));
    }

    @Test
    @DisplayName("POST /sms — 단일 발송 도구 rate-limit 초과 시 429")
    @WithMockUser(roles = {"ADMIN"})
    void sendBulkSms_whenSingleRateLimitExceeded_returns429() throws Exception {
        BulkSmsManualRequest request = BulkSmsManualRequest.builder()
            .userIds(Arrays.asList(601L))
            .content("rate-limit per-minute hit")
            .reason("P1.2 통합 — 단일 도구와 공유 한도")
            .build();

        when(singleService.checkRateLimit(eq(TEST_TENANT_ID), any()))
            .thenReturn(Decision.exceeded("PER_MINUTE", 0, 50, 60L));

        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(any(HttpSession.class)))
                .thenReturn(buildCurrentUser());

            mockMvc.perform(post("/api/v1/admin/manual-notifications/sms")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.data.errorCode").value("RATE_LIMIT_EXCEEDED"));
        }
    }

    @Test
    @DisplayName("POST /sms — userIds.size() > 50 시 400 BadRequest")
    @WithMockUser(roles = {"ADMIN"})
    void sendBulkSms_whenSizeExceedsCap_returns400() throws Exception {
        List<Long> overflow = new ArrayList<>();
        for (long i = 1; i <= 51; i++) {
            overflow.add(i);
        }
        BulkSmsManualRequest request = BulkSmsManualRequest.builder()
            .userIds(overflow)
            .content("over cap")
            .reason("P1.2 통합 — Q2 50명 상한")
            .build();

        mockMvc.perform(post("/api/v1/admin/manual-notifications/sms")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());

        verify(manualService, never()).sendBulkSms(anyString(), any(User.class),
            any(BulkSmsManualRequest.class));
    }

    @Test
    @DisplayName("POST /alimtalk — COMMON_CODE + 매핑 없음 시 TEMPLATE_NOT_MAPPED 전체 차단")
    @WithMockUser(roles = {"ADMIN"})
    void sendBulkAlimtalk_whenTemplateNotMapped_returnsBatchBlock() throws Exception {
        BulkAlimtalkManualRequest request = BulkAlimtalkManualRequest.builder()
            .userIds(Arrays.asList(701L, 702L))
            .templateCode("UNMAPPED_CODE")
            .templateSource(TestNotificationAlimtalkTemplateSource.COMMON_CODE)
            .templateParams(new HashMap<>())
            .reason("P1.2 통합 — 매핑 없음 시나리오")
            .build();

        String batchId = UUID.randomUUID().toString();
        BulkNotificationResponse blocked = BulkNotificationResponse.builder()
            .batchId(batchId)
            .channel(TestNotificationChannel.ALIMTALK)
            .startedAt(LocalDateTime.now())
            .totalCount(2)
            .successCount(0)
            .failureCount(2)
            .batchErrorCode(AdminManualNotificationServiceImpl.ERROR_CODE_TEMPLATE_NOT_MAPPED)
            .batchErrorMessage("Solapi 템플릿 매핑이 없어 배치 전체가 차단되었습니다.")
            .results(java.util.Collections.emptyList())
            .build();

        when(singleService.checkRateLimit(eq(TEST_TENANT_ID), any())).thenReturn(Decision.allowed(50, 100));
        when(manualService.sendBulkAlimtalk(eq(TEST_TENANT_ID), any(User.class),
                any(BulkAlimtalkManualRequest.class)))
            .thenReturn(blocked);

        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(any(HttpSession.class)))
                .thenReturn(buildCurrentUser());

            mockMvc.perform(post("/api/v1/admin/manual-notifications/alimtalk")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.batchErrorCode").value("TEMPLATE_NOT_MAPPED"))
                .andExpect(jsonPath("$.data.successCount").value(0))
                .andExpect(jsonPath("$.data.results.length()").value(0));
        }
    }

    private BulkRecipientResult buildSuccess(Long userId, String batchId) {
        return BulkRecipientResult.builder()
            .userId(userId)
            .success(true)
            .phoneMasked("010****" + (userId % 10000))
            .logId(userId * 10)
            .build();
    }

    private User buildCurrentUser() {
        User user = new User();
        user.setId(TEST_USER_ID);
        user.setUserId(TEST_USER_LOGIN);
        user.setTenantId(TEST_TENANT_ID);
        return user;
    }
}
