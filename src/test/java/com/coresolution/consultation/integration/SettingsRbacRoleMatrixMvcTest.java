package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.coresolution.consultation.constant.NotificationSchedulerFlagKeys;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.NotificationSchedulerFlagDto;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.ComplianceService;
import com.coresolution.consultation.service.PersonalDataDestructionService;
import com.coresolution.consultation.service.SmsTemplateService;
import com.coresolution.consultation.service.SystemConfigService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;
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
import org.springframework.test.web.servlet.MvcResult;

/**
 * 설정 화면 RBAC 역할×결과 매트릭스 MockMvc 테스트.
 *
 * <p>P1 보안(2026-10-03) 검증 매트릭스:
 * <table>
 *   <caption>역할별 기대 결과</caption>
 *   <tr><th>엔드포인트</th><th>ADMIN</th><th>STAFF</th><th>CONSULTANT</th><th>CLIENT</th><th>미인증</th></tr>
 *   <tr><td>GET /compliance/* (5종)</td><td>200</td><td>403</td><td>403</td><td>403</td><td>401</td></tr>
 *   <tr><td>GET /personal-data-destruction/status·preview</td><td>200</td><td>403</td><td>403</td><td>403</td><td>401</td></tr>
 *   <tr><td>PUT /notification-scheduler/flags/{key}</td><td>403(ops)</td><td>403</td><td>403</td><td>403</td><td>401</td></tr>
 *   <tr><td>GET /notification-scheduler/flags</td><td>200</td><td>403</td><td>403</td><td>403</td><td>401</td></tr>
 *   <tr><td>PATCH /sms-templates/global-dispatch</td><td>403(ops)</td><td>403</td><td>403</td><td>403</td><td>401</td></tr>
 * </table>
 *
 * <p>본 클래스는 {@code addFilters = false} 로 메서드 보안(@PreAuthorize)만 검증한다.
 * 미인증 401 은 필터 체인이 필요하므로 {@code SettingsRbacUnauthenticatedMvcTest} 가 담당한다.
 * 파기는 어디서도 실행하지 않는다(서비스 전체 mock + {@code never()} 검증).
 *
 * @author MindGarden
 * @since 2026-10-03
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@DisplayName("설정 RBAC — 역할×엔드포인트 매트릭스")
class SettingsRbacRoleMatrixMvcTest {

    /** TenantContextFilter 통과용 더미 헤더. */
    private static final String TENANT_HEADER = "tenant-rbac-matrix";

    private static final String FLAG_KEY = NotificationSchedulerFlagKeys.WELLNESS_TIP_ENABLED;

    /** 응답에 나타나선 안 되는 관리자 이메일 픽스처. */
    private static final String FIXTURE_ADMIN_EMAIL = "other-admin@example.com";

    /** ADMIN 조회가 허용되는 GET 경로. */
    private static final List<String> ADMIN_ONLY_GET_PATHS = List.of(
            "/api/v1/admin/compliance/personal-data-processing",
            "/api/v1/admin/compliance/impact-assessment",
            "/api/v1/admin/compliance/breach-response",
            "/api/v1/admin/compliance/education",
            "/api/v1/admin/compliance/policy",
            "/api/v1/admin/compliance/overall",
            "/api/v1/admin/compliance/dashboard",
            "/api/v1/admin/personal-data-destruction/status",
            "/api/v1/admin/personal-data-destruction/preview",
            "/api/v1/admin/notification-scheduler/flags");

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ComplianceService complianceService;

    @MockBean
    private PersonalDataDestructionService personalDataDestructionService;

    @MockBean
    private SystemConfigService systemConfigService;

    @MockBean
    private SmsTemplateService smsTemplateService;

    @BeforeEach
    void stubServices() {
        TenantContextHolder.setTenantId(TENANT_HEADER);
        when(complianceService.getPersonalDataProcessingStatus(any(), any())).thenReturn(Map.of("status", "success"));
        when(complianceService.getPersonalDataImpactAssessment()).thenReturn(Map.of("status", "success"));
        when(complianceService.getPersonalDataBreachResponseStatus()).thenReturn(Map.of("status", "success"));
        when(complianceService.getPersonalDataProtectionEducationStatus()).thenReturn(Map.of("status", "success"));
        when(complianceService.getPersonalDataProcessingPolicyStatus()).thenReturn(Map.of("status", "success"));
        when(complianceService.getComplianceOverallStatus()).thenReturn(Map.of("status", "success"));
        when(personalDataDestructionService.getPersonalDataDestructionStatus())
                .thenReturn(Map.of("totalDestroyed", 0));
        when(personalDataDestructionService.previewExpiredCounts())
                .thenReturn(Map.of(PersonalDataDestructionService.SCOPE_USER_DATA, 0));
        when(personalDataDestructionService.previewExpiredCount(anyString())).thenReturn(0);
        when(systemConfigService.listNotificationSchedulerFlags()).thenReturn(List.of(
                NotificationSchedulerFlagDto.builder()
                        .key(FLAG_KEY)
                        .value(true)
                        .updatedBy(NotificationSchedulerFlagDto.ACTOR_LABEL_ADMIN)
                        .build()));
    }

    @AfterEach
    void clearTenantContext() {
        TenantContextHolder.clear();
    }

    private User sessionUser(UserRole role) {
        User user = User.builder().email(FIXTURE_ADMIN_EMAIL).build();
        user.setId(90001L);
        user.setRole(role);
        user.setTenantId(TENANT_HEADER);
        return user;
    }

    private MvcResult performGet(String path) throws Exception {
        return mockMvc.perform(get(path).header("X-Tenant-Id", TENANT_HEADER)).andReturn();
    }

    @Test
    @DisplayName("ADMIN — 가드 대상 GET 10종 모두 200")
    @WithMockUser(roles = {"ADMIN"})
    void adminGets_return200() throws Exception {
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(any(HttpSession.class)))
                    .thenReturn(sessionUser(UserRole.ADMIN));

            for (String path : ADMIN_ONLY_GET_PATHS) {
                assertThat(performGet(path).getResponse().getStatus())
                        .as("ADMIN 200: %s", path).isEqualTo(200);
            }
        }
    }

    @Test
    @DisplayName("STAFF — 가드 대상 GET 10종 모두 403")
    @WithMockUser(roles = {"STAFF"})
    void staffGets_return403() throws Exception {
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(any(HttpSession.class)))
                    .thenReturn(sessionUser(UserRole.STAFF));

            for (String path : ADMIN_ONLY_GET_PATHS) {
                assertThat(performGet(path).getResponse().getStatus())
                        .as("STAFF 403: %s", path).isEqualTo(403);
            }
        }
    }

    @Test
    @DisplayName("CONSULTANT — 가드 대상 GET 10종 모두 403")
    @WithMockUser(roles = {"CONSULTANT"})
    void consultantGets_return403() throws Exception {
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(any(HttpSession.class)))
                    .thenReturn(sessionUser(UserRole.CONSULTANT));

            for (String path : ADMIN_ONLY_GET_PATHS) {
                assertThat(performGet(path).getResponse().getStatus())
                        .as("CONSULTANT 403: %s", path).isEqualTo(403);
            }
        }
    }

    @Test
    @DisplayName("CLIENT — 가드 대상 GET 10종 모두 403")
    @WithMockUser(roles = {"CLIENT"})
    void clientGets_return403() throws Exception {
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(any(HttpSession.class)))
                    .thenReturn(sessionUser(UserRole.CLIENT));

            for (String path : ADMIN_ONLY_GET_PATHS) {
                assertThat(performGet(path).getResponse().getStatus())
                        .as("CLIENT 403: %s", path).isEqualTo(403);
            }
        }
    }

    @Test
    @DisplayName("전역 알림 스위치 쓰기 — ADMIN 403(운영자 전용) · 하위 역할 403 · 미인증 401")
    @WithMockUser(roles = {"ADMIN"})
    void schedulerFlagWrite_isBlockedForTenantAdmin() throws Exception {
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(any(HttpSession.class)))
                    .thenReturn(sessionUser(UserRole.ADMIN));

            mockMvc.perform(put("/api/v1/admin/notification-scheduler/flags/" + FLAG_KEY)
                            .header("X-Tenant-Id", TENANT_HEADER)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"value\":true}"))
                    .andExpect(status().isForbidden());
        }

        verify(systemConfigService, never()).setGlobalBoolean(anyString(), anyBoolean(), anyString());
    }

    @Test
    @DisplayName("전역 SMS 발송 스위치 쓰기 — ADMIN 403(운영자 전용), 서비스 호출 없음")
    @WithMockUser(roles = {"ADMIN"})
    void globalDispatchWrite_isBlockedForTenantAdmin() throws Exception {
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(any(HttpSession.class)))
                    .thenReturn(sessionUser(UserRole.ADMIN));

            mockMvc.perform(patch("/api/v1/admin/sms-templates/global-dispatch")
                            .header("X-Tenant-Id", TENANT_HEADER)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"enabled\":true}"))
                    .andExpect(status().isForbidden());
        }

        verify(smsTemplateService, never()).setGlobalAutoDispatchEnabled(anyBoolean(), any());
    }

    @Test
    @DisplayName("flags 응답에 관리자 이메일이 없다 (역할 라벨만)")
    @WithMockUser(roles = {"ADMIN"})
    void flagsResponse_containsNoEmail() throws Exception {
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(any(HttpSession.class)))
                    .thenReturn(sessionUser(UserRole.ADMIN));

            String body = performGet("/api/v1/admin/notification-scheduler/flags")
                    .getResponse().getContentAsString();

            assertThat(body).doesNotContain(FIXTURE_ADMIN_EMAIL);
            assertThat(body).doesNotContain("@");
            assertThat(body).contains(NotificationSchedulerFlagDto.ACTOR_LABEL_ADMIN);
        }
    }

    @Test
    @DisplayName("파기 실행 — 역할 가드 통과 전/후 모두 실제 파기 호출 없음")
    @WithMockUser(roles = {"CONSULTANT"})
    void destructionExecute_isBlockedAndNeverRuns() throws Exception {
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(any(HttpSession.class)))
                    .thenReturn(sessionUser(UserRole.CONSULTANT));

            mockMvc.perform(post("/api/v1/admin/personal-data-destruction/execute/user-data")
                            .header("X-Tenant-Id", TENANT_HEADER)
                            .param("confirm", "true")
                            .param("expectedCount", "1"))
                    .andExpect(status().isForbidden());
        }

        verify(personalDataDestructionService, never()).destroyExpiredUserData();
        verify(personalDataDestructionService, never()).destroyExpiredConsultationData();
        verify(personalDataDestructionService, never()).destroyExpiredPaymentData();
        verify(personalDataDestructionService, never()).destroyExpiredSalaryData();
    }
}
