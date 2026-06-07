package com.coresolution.consultation.controller;

import java.util.List;
import java.util.UUID;

import com.coresolution.consultation.dto.PushMonitoringChannelFilter;
import com.coresolution.consultation.dto.PushMonitoringRange;
import com.coresolution.consultation.dto.PushMonitoringResendResponse;
import com.coresolution.consultation.dto.PushMonitoringSnapshotResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.AdminPushMonitoringService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
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
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * BW-1 「푸시 설정 모니터링」 컨트롤러 MockMvc 테스트.
 *
 * <p>스냅샷 GET 의 query parsing / 권한·테넌트 가드 / 재발송 source 분기 / ApiResponse 래핑을
 * 검증한다.
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@DisplayName("AdminPushMonitoringController API")
class AdminPushMonitoringControllerTest {

    private static final String TEST_TENANT_ID = UUID.randomUUID().toString();
    private static final Long TEST_USER_ID = 901L;

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AdminPushMonitoringService adminPushMonitoringService;

    @BeforeEach
    void setTenantContext() {
        TenantContextHolder.setTenantId(TEST_TENANT_ID);
    }

    @AfterEach
    void clearTenantContext() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("GET /snapshot — 기본 파라미터 (range=D7, channel=ALL) 호출 200")
    @WithMockUser(roles = {"ADMIN"})
    void snapshotDefaultParams() throws Exception {
        PushMonitoringSnapshotResponse stub = PushMonitoringSnapshotResponse.builder()
            .range(PushMonitoringRange.D7)
            .channel(PushMonitoringChannelFilter.ALL)
            .failures(List.of())
            .failuresTotal(0L)
            .build();
        when(adminPushMonitoringService.loadSnapshot(eq(TEST_TENANT_ID),
            eq(PushMonitoringRange.D7),
            eq(PushMonitoringChannelFilter.ALL),
            anyInt())).thenReturn(stub);

        mockMvc.perform(get("/api/v1/admin/notifications/monitoring/snapshot"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.range").value("D7"))
            .andExpect(jsonPath("$.data.channel").value("ALL"));
    }

    @Test
    @DisplayName("GET /snapshot — range=H24 채널=PUSH 200")
    @WithMockUser(roles = {"STAFF"})
    void snapshotChannelPush() throws Exception {
        PushMonitoringSnapshotResponse stub = PushMonitoringSnapshotResponse.builder()
            .range(PushMonitoringRange.H24)
            .channel(PushMonitoringChannelFilter.PUSH)
            .failures(List.of())
            .failuresTotal(0L)
            .build();
        when(adminPushMonitoringService.loadSnapshot(eq(TEST_TENANT_ID),
            eq(PushMonitoringRange.H24),
            eq(PushMonitoringChannelFilter.PUSH),
            anyInt())).thenReturn(stub);

        mockMvc.perform(get("/api/v1/admin/notifications/monitoring/snapshot")
                .param("range", "H24")
                .param("channel", "PUSH"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.channel").value("PUSH"));
    }

    @Test
    @DisplayName("GET /snapshot — 잘못된 range 값은 400 RANGE_INVALID")
    @WithMockUser(roles = {"ADMIN"})
    void snapshotInvalidRange() throws Exception {
        mockMvc.perform(get("/api/v1/admin/notifications/monitoring/snapshot")
                .param("range", "BOGUS"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errorCode").value("RANGE_INVALID"));
        verify(adminPushMonitoringService, never())
            .loadSnapshot(anyString(), any(), any(), anyInt());
    }

    @Test
    @DisplayName("GET /snapshot — 잘못된 channel 값은 400 CHANNEL_INVALID")
    @WithMockUser(roles = {"ADMIN"})
    void snapshotInvalidChannel() throws Exception {
        mockMvc.perform(get("/api/v1/admin/notifications/monitoring/snapshot")
                .param("channel", "FAX"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errorCode").value("CHANNEL_INVALID"));
    }

    @Test
    @DisplayName("POST /resend — ADMIN_TEST source 성공 200")
    @WithMockUser(roles = {"ADMIN"})
    void resendAdminTestSuccess() throws Exception {
        when(adminPushMonitoringService.resendFailure(eq(TEST_TENANT_ID), any(User.class),
                eq(123L), eq("ADMIN_TEST"), any()))
            .thenReturn(PushMonitoringResendResponse.builder()
                .success(true)
                .resentLogId(123L)
                .build());

        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(any(HttpSession.class)))
                .thenReturn(currentUser());
            mockMvc.perform(post("/api/v1/admin/notifications/monitoring/resend/123")
                    .param("source", "ADMIN_TEST"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.success").value(true))
                .andExpect(jsonPath("$.data.resentLogId").value(123));
        }
    }

    @Test
    @DisplayName("POST /resend — BATCH source 는 200 + body success=false")
    @WithMockUser(roles = {"STAFF"})
    void resendBatchSourceBlockedAtBody() throws Exception {
        when(adminPushMonitoringService.resendFailure(eq(TEST_TENANT_ID), any(User.class),
                eq(456L), eq("BATCH"), any()))
            .thenReturn(PushMonitoringResendResponse.builder()
                .success(false)
                .errorCode("BATCH_RESEND_NOT_SUPPORTED")
                .errorMessage("BATCH 발송 행 재발송은 후속 PR 에서 제공됩니다.")
                .build());

        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(any(HttpSession.class)))
                .thenReturn(currentUser());
            mockMvc.perform(post("/api/v1/admin/notifications/monitoring/resend/456")
                    .param("source", "BATCH"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.success").value(false))
                .andExpect(jsonPath("$.data.errorCode").value("BATCH_RESEND_NOT_SUPPORTED"));
        }
    }

    @Test
    @DisplayName("POST /resend — 세션 사용자 없음 401")
    @WithMockUser(roles = {"ADMIN"})
    void resendUnauthorized() throws Exception {
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(any(HttpSession.class)))
                .thenReturn(null);
            mockMvc.perform(post("/api/v1/admin/notifications/monitoring/resend/789")
                    .param("source", "ADMIN_TEST"))
                .andExpect(status().isUnauthorized());
        }
        verify(adminPushMonitoringService, never())
            .resendFailure(anyString(), any(), anyLong(), anyString(), any());
    }

    @Test
    @DisplayName("GET /snapshot — 테넌트 컨텍스트 없음 시 400 TENANT_CONTEXT_MISSING")
    @WithMockUser(roles = {"ADMIN"})
    void snapshotMissingTenant() throws Exception {
        TenantContextHolder.clear();
        mockMvc.perform(get("/api/v1/admin/notifications/monitoring/snapshot"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errorCode").value("TENANT_CONTEXT_MISSING"));
    }

    private User currentUser() {
        User user = new User();
        ReflectionTestUtils.setField(user, "id", TEST_USER_ID);
        return user;
    }
}
