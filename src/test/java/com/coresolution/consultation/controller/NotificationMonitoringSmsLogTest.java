package com.coresolution.consultation.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.coresolution.consultation.dto.SmsLogItem;
import com.coresolution.consultation.service.AdminPushMonitoringService;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 「푸시 설정 모니터링」 - 최근 SMS/알림톡 발송 카드 endpoint MockMvc 테스트.
 *
 * <p>{@code GET /api/v1/admin/notifications/monitoring/sms-logs} 의 테넌트 격리·limit 가드·
 * 마스킹 통과·ApiResponse 래핑을 검증한다.
 *
 * @author MindGarden core-coder
 * @since 2026-06-13
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@DisplayName("AdminPushMonitoringController /sms-logs API")
class NotificationMonitoringSmsLogTest {

    private static final String TEST_TENANT_ID = UUID.randomUUID().toString();
    private static final String SMS_LOGS_PATH =
        "/api/v1/admin/notifications/monitoring/sms-logs";

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
    @DisplayName("GET /sms-logs — 기본 limit 20 + 응답 마스킹·성공 플래그 통과")
    @WithMockUser(roles = {"ADMIN"})
    void recentSmsLogsDefaultLimit() throws Exception {
        SmsLogItem sample = SmsLogItem.builder()
            .id(1001L)
            .templateCode("RESERVATION_REMINDER_D2")
            .channelUsed("SMS")
            .targetType("SCHEDULE")
            .targetId(42L)
            .recipientUserId(7L)
            .recipientName("홍길동")
            .recipientPhone("010-***-1234")
            .successFlag(Boolean.TRUE)
            .createdAt(LocalDateTime.now())
            .build();
        when(adminPushMonitoringService.loadRecentSmsLogs(eq(TEST_TENANT_ID), eq(20)))
            .thenReturn(List.of(sample));

        mockMvc.perform(get(SMS_LOGS_PATH))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data[0].id").value(1001))
            .andExpect(jsonPath("$.data[0].channelUsed").value("SMS"))
            .andExpect(jsonPath("$.data[0].recipientPhone").value("010-***-1234"))
            .andExpect(jsonPath("$.data[0].recipientName").value("홍길동"))
            .andExpect(jsonPath("$.data[0].successFlag").value(true));
    }

    @Test
    @DisplayName("GET /sms-logs — 명시적 limit=10 그대로 서비스에 전달")
    @WithMockUser(roles = {"STAFF"})
    void recentSmsLogsHonorsExplicitLimit() throws Exception {
        when(adminPushMonitoringService.loadRecentSmsLogs(eq(TEST_TENANT_ID), eq(10)))
            .thenReturn(List.of());

        mockMvc.perform(get(SMS_LOGS_PATH).param("limit", "10"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
        verify(adminPushMonitoringService).loadRecentSmsLogs(TEST_TENANT_ID, 10);
    }

    @Test
    @DisplayName("GET /sms-logs — limit > 100 은 100 으로 clamp 후 서비스 호출")
    @WithMockUser(roles = {"ADMIN"})
    void recentSmsLogsClampsLimit() throws Exception {
        when(adminPushMonitoringService.loadRecentSmsLogs(anyString(), anyInt()))
            .thenReturn(List.of());

        mockMvc.perform(get(SMS_LOGS_PATH).param("limit", "999"))
            .andExpect(status().isOk());

        ArgumentCaptor<Integer> limitCaptor = ArgumentCaptor.forClass(Integer.class);
        verify(adminPushMonitoringService).loadRecentSmsLogs(eq(TEST_TENANT_ID), limitCaptor.capture());
        org.assertj.core.api.Assertions.assertThat(limitCaptor.getValue()).isEqualTo(100);
    }

    @Test
    @DisplayName("GET /sms-logs — limit 0/음수는 기본 20 으로 clamp")
    @WithMockUser(roles = {"ADMIN"})
    void recentSmsLogsClampsZeroAndNegativeLimit() throws Exception {
        when(adminPushMonitoringService.loadRecentSmsLogs(anyString(), anyInt()))
            .thenReturn(List.of());

        mockMvc.perform(get(SMS_LOGS_PATH).param("limit", "0"))
            .andExpect(status().isOk());
        mockMvc.perform(get(SMS_LOGS_PATH).param("limit", "-3"))
            .andExpect(status().isOk());

        verify(adminPushMonitoringService, org.mockito.Mockito.times(2))
            .loadRecentSmsLogs(TEST_TENANT_ID, 20);
    }

    @Test
    @DisplayName("GET /sms-logs — 테넌트 컨텍스트 없음 시 400 TENANT_CONTEXT_MISSING")
    @WithMockUser(roles = {"ADMIN"})
    void recentSmsLogsMissingTenantContext() throws Exception {
        TenantContextHolder.clear();

        mockMvc.perform(get(SMS_LOGS_PATH))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errorCode").value("TENANT_CONTEXT_MISSING"));
        verify(adminPushMonitoringService, never()).loadRecentSmsLogs(anyString(), anyInt());
    }
}
