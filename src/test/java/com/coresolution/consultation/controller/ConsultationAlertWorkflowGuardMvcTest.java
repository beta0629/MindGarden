package com.coresolution.consultation.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;

import java.lang.reflect.Field;
import java.util.Map;
import java.util.Optional;

import com.coresolution.consultation.config.SecurityHeaderFilter;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.GlobalExceptionHandler;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.PlSqlConsultationRecordAlertService;
import com.coresolution.consultation.service.WorkflowAutomationService;
import com.coresolution.consultation.service.support.ClientPathAccessGuard;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * 상담일지 미작성 알림·워크플로 자동화 API 권한 가드 (#1407·#1408 검증 FAIL 보완).
 *
 * <p>두 컨트롤러 모두 인증·권한 검증 없이 열려 있어 내담자·상담사가 테넌트 전체의 미작성 현황과
 * 워크플로 실행 API 를 호출할 수 있었다. {@code auto-complete-with-reminder} 와 같은 공용 가드
 * ({@link ClientPathAccessGuard#requireTenantManager} + {@code requireCallerTenantId}) 적용을
 * 고정한다: 미인증 401, 내담자·상담사 403, 다른 테넌트 관리자 403, 같은 테넌트 관리자 200.</p>
 *
 * <p>프로시저 부재 같은 서버 오류에 원시 예외 문구가 그대로 실리지 않는지도 함께 고정한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@DisplayName("상담일지 알림·워크플로 API 권한 가드")
class ConsultationAlertWorkflowGuardMvcTest {

    private static final String TENANT_A = "tenant-alert-a";
    private static final String TENANT_B = "tenant-alert-b";
    private static final long ADMIN_A = 1L;
    private static final long ADMIN_B = 900L;
    private static final long CONSULTANT_A = 41L;
    private static final long CLIENT_A = 20L;

    private static final String PERIOD = "startDate=2026-10-01&endDate=2026-10-31";
    private static final String ALERTS = "/api/v1/admin/consultation-record-alerts";
    private static final String WORKFLOW = "/api/v1/admin/workflow";
    /** 프로시저 부재 시 JDBC 가 그대로 올리는 원시 문구 — 응답에 노출되면 안 된다. */
    private static final String RAW_DB_ERROR =
        "PROCEDURE mindgarden.GetMissingConsultationRecordAlerts does not exist";

    private PlSqlConsultationRecordAlertService alertService;
    private WorkflowAutomationService workflowService;
    private UserRepository userRepository;
    private Object[] dataServices;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() throws Exception {
        SecurityContextHolder.clearContext();
        TenantContextHolder.clear();
        alertService = mock(PlSqlConsultationRecordAlertService.class);
        workflowService = mock(WorkflowAutomationService.class);
        userRepository = mock(UserRepository.class);
        ConsultantClientMappingRepository mappingRepository = mock(ConsultantClientMappingRepository.class);
        dataServices = new Object[] {alertService, workflowService};

        ClientPathAccessGuard guard = new ClientPathAccessGuard(mappingRepository, userRepository);
        for (long id : new long[] {ADMIN_A, CONSULTANT_A, CLIENT_A}) {
            when(userRepository.findByTenantIdAndId(TENANT_A, id)).thenReturn(Optional.of(new User()));
        }
        when(alertService.getMissingConsultationRecordAlerts(any(), any(), any()))
            .thenReturn(Map.of());
        when(alertService.getConsultationRecordMissingStatistics(any(), any(), any()))
            .thenReturn(Map.of());
        when(workflowService.getWorkflowStatus()).thenReturn(Map.of());

        ConsultationRecordAlertController alertController = new ConsultationRecordAlertController();
        inject(alertController, "consultationRecordAlertService", alertService);
        inject(alertController, "clientPathAccessGuard", guard);

        WorkflowAutomationController workflowController =
            new WorkflowAutomationController(workflowService, guard);

        mockMvc = MockMvcBuilders.standaloneSetup(alertController, workflowController)
            .addFilter(new SecurityHeaderFilter())
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    // ---- 1. 알림 API 가드 ----

    @Test
    @DisplayName("미작성 알림 목록 — 미인증 401 / 내담자·상담사 403 / 다른 테넌트 관리자 403 / 같은 테넌트 관리자 200")
    void missingAlerts_guardMatrix() throws Exception {
        String uri = ALERTS + "/missing-alerts?" + PERIOD;
        assertUnauthenticated(HttpMethod.GET, uri);
        assertForbidden(HttpMethod.GET, uri, client());
        assertForbidden(HttpMethod.GET, uri, consultant());
        assertForbiddenCrossTenant(HttpMethod.GET, uri);
        call(HttpMethod.GET, uri, admin()).andExpect(status().isOk());
    }

    @Test
    @DisplayName("알림 통계 — 미인증 401 / 내담자·상담사 403 / 같은 테넌트 관리자 200")
    void statistics_guardMatrix() throws Exception {
        String uri = ALERTS + "/statistics?" + PERIOD;
        assertUnauthenticated(HttpMethod.GET, uri);
        assertForbidden(HttpMethod.GET, uri, client());
        assertForbidden(HttpMethod.GET, uri, consultant());
        call(HttpMethod.GET, uri, admin()).andExpect(status().isOk());
    }

    @Test
    @DisplayName("상담사별 미작성 — 미인증 401 / 내담자 403 / 다른 상담사 403")
    void consultantMissing_guardMatrix() throws Exception {
        String uri = ALERTS + "/consultant-missing?consultantId=" + CONSULTANT_A + "&" + PERIOD;
        assertUnauthenticated(HttpMethod.GET, uri);
        assertForbidden(HttpMethod.GET, uri, client());
        assertForbidden(HttpMethod.GET, uri, user(42L, UserRole.CONSULTANT, TENANT_A));
    }

    @Test
    @DisplayName("시스템 상태 — 미인증 401 / 내담자·상담사 403")
    void alertStatus_guardMatrix() throws Exception {
        String uri = ALERTS + "/status";
        assertUnauthenticated(HttpMethod.GET, uri);
        assertForbidden(HttpMethod.GET, uri, client());
        assertForbidden(HttpMethod.GET, uri, consultant());
    }

    @Test
    @DisplayName("알림 POST 전체 — 미인증 401 / 내담자 403 / 상담사 403")
    void alertPosts_guardMatrix() throws Exception {
        String[] uris = {
            ALERTS + "/check-missing?checkDate=2026-10-01",
            ALERTS + "/resolve-alert?consultationId=1&resolvedBy=tester",
            ALERTS + "/resolve-all-alerts?consultantId=" + CONSULTANT_A + "&resolvedBy=tester",
            ALERTS + "/manual-check"
        };
        for (String uri : uris) {
            assertUnauthenticated(HttpMethod.POST, uri);
            assertForbidden(HttpMethod.POST, uri, client());
            assertForbidden(HttpMethod.POST, uri, consultant());
        }
    }

    // ---- 2. 워크플로 API 가드 ----

    @Test
    @DisplayName("워크플로 전체 — 미인증 401 / 내담자 403 / 상담사 403 / 다른 테넌트 관리자 403")
    void workflow_guardMatrix() throws Exception {
        assertUnauthenticated(HttpMethod.GET, WORKFLOW + "/status");
        assertForbidden(HttpMethod.GET, WORKFLOW + "/status", client());
        assertForbidden(HttpMethod.GET, WORKFLOW + "/status", consultant());
        assertForbiddenCrossTenant(HttpMethod.GET, WORKFLOW + "/status");

        String[] posts = {"/reminders/send", "/alerts/send", "/summary/daily",
            "/report/monthly", "/execute-all"};
        for (String path : posts) {
            assertUnauthenticated(HttpMethod.POST, WORKFLOW + path);
            assertForbidden(HttpMethod.POST, WORKFLOW + path, client());
            assertForbidden(HttpMethod.POST, WORKFLOW + path, consultant());
        }
        assertUnauthenticated(HttpMethod.GET, WORKFLOW + "/logs");
        assertForbidden(HttpMethod.GET, WORKFLOW + "/logs", client());

        // 허용 경로는 거부 단언(서비스 미호출 검증) 이후에 둔다.
        call(HttpMethod.GET, WORKFLOW + "/status", admin()).andExpect(status().isOk());
    }

    // ---- 3. 오류 문구 비노출 ----

    @Test
    @DisplayName("프로시저 부재 등 서버 오류에 원시 예외 문구를 싣지 않는다")
    void serverError_doesNotLeakRawMessage() throws Exception {
        when(alertService.getMissingConsultationRecordAlerts(any(), any(), any()))
            .thenThrow(new org.springframework.dao.InvalidDataAccessResourceUsageException(RAW_DB_ERROR));

        call(HttpMethod.GET, ALERTS + "/missing-alerts?" + PERIOD, admin())
            .andExpect(status().is5xxServerError())
            .andExpect(content().string(not(containsString(RAW_DB_ERROR))))
            .andExpect(content().string(not(containsString("does not exist"))))
            .andExpect(jsonPath("$.errorCode").exists());
    }

    @Test
    @DisplayName("서비스가 내부 오류(추적 id)를 표시하면 공용 500 본문만 — 원시 문구 없음")
    void serviceInternalErrorMarker_mapsToShared500() throws Exception {
        java.util.Map<String, Object> failed = new java.util.HashMap<>();
        failed.put("success", false);
        failed.put("message", "공용 문구");
        failed.put("traceId", "trace-1");
        failed.put("alerts", RAW_DB_ERROR);
        when(alertService.getMissingConsultationRecordAlerts(any(), any(), any())).thenReturn(failed);

        call(HttpMethod.GET, ALERTS + "/missing-alerts?" + PERIOD, admin())
            .andExpect(status().isInternalServerError())
            .andExpect(jsonPath("$.errorCode").exists())
            .andExpect(jsonPath("$.traceId").value("trace-1"))
            .andExpect(content().string(not(containsString(RAW_DB_ERROR))));
    }

    @Test
    @DisplayName("manual-check — 호출자 테넌트만 처리(서비스 직접 호출), 범위 밖 daysBack 은 400")
    void manualCheck_callerTenantOnly() throws Exception {
        when(alertService.autoCreateMissingConsultationRecordAlerts(1)).thenReturn(Map.of("success", true));
        call(HttpMethod.POST, ALERTS + "/manual-check", admin()).andExpect(status().isOk());
        org.mockito.Mockito.verify(alertService).autoCreateMissingConsultationRecordAlerts(1);

        call(HttpMethod.POST, ALERTS + "/manual-check?daysBack=0", admin()).andExpect(status().isBadRequest());
        call(HttpMethod.POST, ALERTS + "/manual-check?daysBack=999", admin()).andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("워크플로 수동 실행 — 호출자 테넌트 전용 메서드만 호출 (전체 테넌트 배치 메서드 미호출)")
    void workflowPosts_callerTenantOnly() throws Exception {
        call(HttpMethod.POST, WORKFLOW + "/execute-all", admin()).andExpect(status().isOk());
        org.mockito.Mockito.verify(workflowService).sendScheduleRemindersForTenant(TENANT_A);
        org.mockito.Mockito.verify(workflowService).sendIncompleteConsultationAlertsForTenant(TENANT_A);
        org.mockito.Mockito.verify(workflowService).sendDailyPerformanceSummaryForTenant(TENANT_A);
        org.mockito.Mockito.verify(workflowService, org.mockito.Mockito.never()).sendScheduleReminders();
        org.mockito.Mockito.verify(workflowService, org.mockito.Mockito.never()).sendIncompleteConsultationAlerts();
        org.mockito.Mockito.verify(workflowService, org.mockito.Mockito.never()).sendDailyPerformanceSummary();

        call(HttpMethod.POST, WORKFLOW + "/report/monthly", admin()).andExpect(status().isOk());
        org.mockito.Mockito.verify(workflowService).generateMonthlyPerformanceReportForTenant(TENANT_A);
        org.mockito.Mockito.verify(workflowService, org.mockito.Mockito.never()).generateMonthlyPerformanceReport();
    }

    // ---- helpers ----

    private void assertUnauthenticated(HttpMethod method, String uri) throws Exception {
        mockMvc.perform(request(method, uri))
            .andExpect(status().isUnauthorized());
        verifyNoInteractions(dataServices);
    }

    /** 다른 테넌트 관리자 — 세션 사용자는 TENANT_B, 요청 TenantContext 는 TENANT_A 인 경우 403. */
    private void assertForbiddenCrossTenant(HttpMethod method, String uri) throws Exception {
        User otherTenantAdmin = user(ADMIN_B, UserRole.ADMIN, TENANT_B);
        mockMvc.perform(request(method, uri).session(session(otherTenantAdmin)).with(r -> {
            TenantContextHolder.setTenantId(TENANT_A);
            return r;
        })).andExpect(status().isForbidden());
        verifyNoInteractions(dataServices);
    }

    private void assertForbidden(HttpMethod method, String uri, User caller) throws Exception {
        call(method, uri, caller).andExpect(status().isForbidden());
        verifyNoInteractions(dataServices);
    }

    private ResultActions call(HttpMethod method, String uri, User caller) throws Exception {
        return mockMvc.perform(request(method, uri).session(session(caller)).with(r -> {
            TenantContextHolder.setTenantId(caller.getTenantId());
            return r;
        }));
    }

    private static User admin() {
        return user(ADMIN_A, UserRole.ADMIN, TENANT_A);
    }

    private static User consultant() {
        return user(CONSULTANT_A, UserRole.CONSULTANT, TENANT_A);
    }

    private static User client() {
        return user(CLIENT_A, UserRole.CLIENT, TENANT_A);
    }

    private static User user(long id, UserRole role, String tenantId) {
        User u = new User();
        u.setId(id);
        u.setUserId("u-" + id);
        u.setRole(role);
        u.setTenantId(tenantId);
        return u;
    }

    private static MockHttpSession session(User u) {
        MockHttpSession s = new MockHttpSession();
        s.setAttribute(SessionConstants.USER_OBJECT, u);
        s.setAttribute(SessionConstants.TENANT_ID, u.getTenantId());
        return s;
    }

    /** {@code @Autowired} 필드 주입 컨트롤러를 standalone MockMvc 로 세우기 위한 주입 헬퍼. */
    private static void inject(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
