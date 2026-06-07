package com.coresolution.consultation.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.PushMonitoringChannelFilter;
import com.coresolution.consultation.dto.PushMonitoringFailureItem;
import com.coresolution.consultation.dto.PushMonitoringRange;
import com.coresolution.consultation.dto.PushMonitoringSnapshotResponse;
import com.coresolution.consultation.dto.TestNotificationResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.GlobalExceptionHandler;
import com.coresolution.consultation.service.AdminPushMonitoringService;
import com.coresolution.core.context.TenantContextHolder;

import java.time.LocalDateTime;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * BW-1 Phase 3 — {@link AdminPushMonitoringController} 회귀 가드.
 *
 * <p>Standalone MockMvc 로 컨트롤러 계층 핵심을 검증한다(파싱·라우팅·400/401, 서비스 위임).
 *
 * @author MindGarden core-coder
 * @since 2026-06-07
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("BW-1 어드민 푸시 모니터링 API 회귀")
class AdminPushMonitoringControllerTest {

    private static final String TENANT = "tenant-bw1-push";

    @Mock
    private AdminPushMonitoringService service;

    @InjectMocks
    private AdminPushMonitoringController controller;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
        TenantContextHolder.setTenantId(TENANT);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private MockHttpSession sessionWithAdmin() {
        User u = new User();
        u.setId(8001L);
        u.setUserId("admin-bw1");
        u.setEmail("admin-bw1@test.com");
        u.setName("BW1 Admin");
        u.setTenantId(TENANT);
        u.setRole(UserRole.ADMIN);
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionConstants.USER_OBJECT, u);
        session.setAttribute(SessionConstants.TENANT_ID, TENANT);
        return session;
    }

    private static PushMonitoringSnapshotResponse stubSnapshot() {
        return PushMonitoringSnapshotResponse.builder()
            .generatedAt(LocalDateTime.now())
            .range(PushMonitoringRange.D7)
            .channel(PushMonitoringChannelFilter.ALL)
            .pushAutoTrackingAvailable(false)
            .costAvailable(false)
            .build();
    }

    @Test
    @DisplayName("T1: GET /snapshot 기본값 → 200, range=D7/channel=ALL 위임")
    void snapshotDefaultsToD7AndAll() throws Exception {
        when(service.buildSnapshot(eq(TENANT), eq(PushMonitoringRange.D7),
            eq(PushMonitoringChannelFilter.ALL))).thenReturn(stubSnapshot());

        mockMvc.perform(get("/api/v1/admin/notifications/monitoring/snapshot")
                .session(sessionWithAdmin()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.pushAutoTrackingAvailable").value(false))
            .andExpect(jsonPath("$.data.costAvailable").value(false));

        verify(service).buildSnapshot(TENANT, PushMonitoringRange.D7,
            PushMonitoringChannelFilter.ALL);
    }

    @Test
    @DisplayName("T2: GET /snapshot?range=H24&channel=ALIMTALK → 200")
    void snapshotParsesRangeAndChannel() throws Exception {
        when(service.buildSnapshot(eq(TENANT), eq(PushMonitoringRange.H24),
            eq(PushMonitoringChannelFilter.ALIMTALK))).thenReturn(stubSnapshot());

        mockMvc.perform(get("/api/v1/admin/notifications/monitoring/snapshot")
                .param("range", "H24")
                .param("channel", "ALIMTALK")
                .session(sessionWithAdmin()))
            .andExpect(status().isOk());

        verify(service).buildSnapshot(TENANT, PushMonitoringRange.H24,
            PushMonitoringChannelFilter.ALIMTALK);
    }

    @Test
    @DisplayName("T3: GET /snapshot?range=GARBAGE → 400 INVALID_REQUEST")
    void snapshotRejectsInvalidRange() throws Exception {
        mockMvc.perform(get("/api/v1/admin/notifications/monitoring/snapshot")
                .param("range", "GARBAGE")
                .session(sessionWithAdmin()))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.errorCode").value(
                AdminPushMonitoringController.ERROR_CODE_INVALID_REQUEST));

        verify(service, never()).buildSnapshot(any(), any(), any());
    }

    @Test
    @DisplayName("T4: GET /snapshot?channel=GARBAGE → 400 INVALID_REQUEST")
    void snapshotRejectsInvalidChannel() throws Exception {
        mockMvc.perform(get("/api/v1/admin/notifications/monitoring/snapshot")
                .param("channel", "GARBAGE")
                .session(sessionWithAdmin()))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false));

        verify(service, never()).buildSnapshot(any(), any(), any());
    }

    @Test
    @DisplayName("T5: GET /snapshot tenant 미설정 → 400 TENANT_CONTEXT_MISSING")
    void snapshotRejectsMissingTenant() throws Exception {
        TenantContextHolder.clear();

        mockMvc.perform(get("/api/v1/admin/notifications/monitoring/snapshot")
                .session(sessionWithAdmin()))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errorCode").value(
                AdminPushMonitoringController.ERROR_CODE_TENANT_CONTEXT_MISSING));
    }

    @Test
    @DisplayName("T6: POST /resend/{id}?source=BATCH → 200, 서비스 호출")
    void resendDelegatesBatch() throws Exception {
        when(service.resend(eq(TENANT), any(User.class), eq(123L),
            eq(PushMonitoringFailureItem.Source.BATCH)))
            .thenReturn(TestNotificationResponse.builder().success(true).build());

        mockMvc.perform(post("/api/v1/admin/notifications/monitoring/resend/{id}", 123L)
                .param("source", "BATCH")
                .session(sessionWithAdmin()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.success").value(true));

        verify(service).resend(eq(TENANT), any(User.class), eq(123L),
            eq(PushMonitoringFailureItem.Source.BATCH));
    }

    @Test
    @DisplayName("T7: POST /resend/{id} source 잘못됨 → 400")
    void resendRejectsInvalidSource() throws Exception {
        mockMvc.perform(post("/api/v1/admin/notifications/monitoring/resend/{id}", 123L)
                .param("source", "WTF")
                .session(sessionWithAdmin()))
            .andExpect(status().isBadRequest());

        verify(service, never()).resend(any(), any(), any(), any());
    }

    @Test
    @DisplayName("T8: POST /resend 세션 없음 → 401")
    void resendRequiresSession() throws Exception {
        mockMvc.perform(post("/api/v1/admin/notifications/monitoring/resend/{id}", 123L)
                .param("source", "BATCH"))
            .andExpect(status().isUnauthorized());

        verify(service, never()).resend(any(), any(), any(), any());
    }

}
