package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.UnauthorizedException;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.ConsultantRatingService;
import com.coresolution.consultation.service.ConsultantStatsService;
import com.coresolution.consultation.service.erp.ErpService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.consultation.service.RoleCommonCodeAuthorizationService;
import com.coresolution.consultation.service.SessionSyncService;
import com.coresolution.consultation.service.support.ClientPathAccessGuard;
import com.coresolution.consultation.service.support.ResourceOwnerAccessGuard;
import com.coresolution.core.constant.OpsTenantConstants;
import com.coresolution.core.constants.SecurityRoleConstants;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.ApiPerformanceController;
import com.coresolution.core.interceptor.ApiPerformanceInterceptor;
import com.coresolution.core.security.OpsAccessGuard;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Answers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * 인증만 요구하던 집계·운영 조회 API 의 역할 가드 회귀.
 *
 * <p>테넌트 범위 집계(회기 동기화, ERP 동기화 상태, 일정 상태 통계)와 API 성능 조회는 같은 기관 관리자만,
 * 서버 전역 자원(백업 파일·성능 통계 초기화)은 본사 Ops 운영자만 허용한다. 기관 전체 환불·재무·예산 조회는
 * 같은 기관 관리자만, 사무원이 쓰는 대시보드 통계·상담사 통계 목록은 같은 기관 관리자·사무원만 허용한다.
 * 거부 시 서비스는 호출되지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("집계·운영 조회 API — 관리자/Ops 전용 가드")
class OpsAggregateEndpointsRoleGuardTest {

    private static final String TENANT_ID = "tenant-ops-aggregate-a";
    private static final String OTHER_TENANT_ID = "tenant-ops-aggregate-b";
    private static final String HQ_TENANT_ID = "tenant-ops-aggregate-hq";
    private static final Long MAPPING_ID = 77L;

    @Mock private AdminService adminService;
    @Mock private SessionSyncService sessionSyncService;
    @Mock private ApiPerformanceInterceptor performanceInterceptor;
    @Mock private RoleCommonCodeAuthorizationService roleCommonCodeAuthorizationService;
    @Mock private ErpService erpService;
    @Mock private FinancialTransactionService financialTransactionService;
    @Mock private ConsultantStatsService consultantStatsService;
    @Mock private ConsultantRatingService consultantRatingService;

    @Spy
    private ClientPathAccessGuard clientPathAccessGuard = new ClientPathAccessGuard(
            mock(ConsultantClientMappingRepository.class), mock(UserRepository.class));

    @Mock(answer = Answers.CALLS_REAL_METHODS)
    private ResourceOwnerAccessGuard resourceOwnerAccessGuard;

    @Spy
    private OpsAccessGuard opsAccessGuard = new OpsAccessGuard(hqTenantConstants());

    @InjectMocks private AdminController adminController;
    @InjectMocks private SessionSyncController sessionSyncController;
    @InjectMocks private ApiPerformanceController apiPerformanceController;
    @InjectMocks private BackupStatusController backupStatusController;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        TenantContextHolder.setTenantId(TENANT_ID);
        ReflectionTestUtils.setField(resourceOwnerAccessGuard, "clientPathAccessGuard", clientPathAccessGuard);
        ReflectionTestUtils.setField(backupStatusController, "backupDirectory", tempDir.toString());
        ReflectionTestUtils.setField(backupStatusController, "logDirectory", tempDir.toString());
        when(performanceInterceptor.getAllApiStats()).thenReturn(new ConcurrentHashMap<>());
        when(sessionSyncService.getSyncStatus()).thenReturn(new HashMap<>());
        when(sessionSyncService.validateAllSessions()).thenReturn(new HashMap<>());
        when(adminService.getErpSyncStatus()).thenReturn(new HashMap<>());
        when(adminService.getScheduleStatistics()).thenReturn(new HashMap<>());
        when(adminService.getRefundStatistics(org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.any())).thenReturn(new HashMap<>());
        when(adminService.getRefundHistory(org.mockito.ArgumentMatchers.anyInt(),
                org.mockito.ArgumentMatchers.anyInt(), org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any())).thenReturn(new HashMap<>());
        when(adminService.getPaymentConfirmedMappings()).thenReturn(List.of());
        when(erpService.getAllActiveBudgets()).thenReturn(List.of());
        when(consultantRatingService.getAdminRatingStatistics()).thenReturn(new HashMap<>());
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("미인증 — 테넌트 집계·성능 조회는 401")
    void anonymous_unauthorized() {
        MockHttpSession anonymous = new MockHttpSession();
        assertThatThrownBy(() -> sessionSyncController.getSyncStatus(anonymous))
                .isInstanceOf(UnauthorizedException.class);
        assertThatThrownBy(() -> adminController.getErpSyncStatus(anonymous))
                .isInstanceOf(UnauthorizedException.class);
        assertThatThrownBy(() -> adminController.getScheduleStatistics(null, anonymous))
                .isInstanceOf(UnauthorizedException.class);
        assertThatThrownBy(() -> apiPerformanceController.getAllPerformanceStats(anonymous))
                .isInstanceOf(UnauthorizedException.class);
        verifyNoInteractions(sessionSyncService, adminService);
        verify(performanceInterceptor, never()).getAllApiStats();
    }

    @Test
    @DisplayName("내담자·상담사·사무원 — 관리자 전용 집계·성능·회기 동기화 쓰기 403, 서비스 호출 없음")
    void nonAdminRoles_forbidden() {
        for (UserRole role : new UserRole[] {UserRole.CLIENT, UserRole.CONSULTANT, UserRole.STAFF}) {
            MockHttpSession session = sessionOf(role, TENANT_ID);
            assertDenied(() -> sessionSyncController.getSyncStatus(session));
            assertDenied(() -> sessionSyncController.validateAllSessions(session));
            assertDenied(() -> sessionSyncController.fixSessionMismatches(session));
            assertDenied(() -> sessionSyncController.logSessionUsage(Map.of("mappingId", MAPPING_ID), session));
            assertDenied(() -> adminController.getErpSyncStatus(session));
            assertDenied(() -> adminController.getScheduleStatistics(null, session));
            assertDenied(() -> apiPerformanceController.getAllPerformanceStats(session));
            assertDenied(() -> apiPerformanceController.getEndpointStats("GET /api/v1/x", session));
            assertDenied(() -> apiPerformanceController.getSlowApis(1L, session));
            assertDenied(() -> apiPerformanceController.getErrorProneApis(1.0, session));
        }
        verifyNoInteractions(sessionSyncService, adminService);
        verify(performanceInterceptor, never()).getAllApiStats();
    }

    @Test
    @DisplayName("같은 기관 관리자 200 / 다른 기관 관리자(세션 기관 ≠ 요청 기관) 403")
    void sameTenantAdminAllowed_otherTenantAdminForbidden() {
        MockHttpSession admin = sessionOf(UserRole.ADMIN, TENANT_ID);
        assertOk(sessionSyncController.getSyncStatus(admin));
        assertOk(sessionSyncController.validateAllSessions(admin));
        assertOk(adminController.getErpSyncStatus(admin));
        assertOk(adminController.getScheduleStatistics(null, admin));
        assertOk(apiPerformanceController.getAllPerformanceStats(admin));
        verify(sessionSyncService).getSyncStatus();
        verify(adminService).getErpSyncStatus();

        MockHttpSession otherTenantAdmin = sessionOf(UserRole.ADMIN, OTHER_TENANT_ID);
        assertDenied(() -> sessionSyncController.getSyncStatus(otherTenantAdmin));
        assertDenied(() -> sessionSyncController.fixSessionMismatches(otherTenantAdmin));
        assertDenied(() -> adminController.getErpSyncStatus(otherTenantAdmin));
        assertDenied(() -> adminController.getScheduleStatistics(null, otherTenantAdmin));
        verify(sessionSyncService, never()).fixSessionMismatches();
    }

    @Test
    @DisplayName("매핑 회기 검증(통합 일정 「배정 완료」) — 사무원·관리자 허용, 내담자·상담사 403, 다른 기관 403")
    void validateMapping_managerOnly() {
        assertDenied(() -> sessionSyncController.validateMappingSessions(
                MAPPING_ID, sessionOf(UserRole.CLIENT, TENANT_ID)));
        assertDenied(() -> sessionSyncController.validateMappingSessions(
                MAPPING_ID, sessionOf(UserRole.CONSULTANT, TENANT_ID)));
        assertDenied(() -> sessionSyncController.validateMappingSessions(
                MAPPING_ID, sessionOf(UserRole.STAFF, OTHER_TENANT_ID)));
        assertThatThrownBy(() -> sessionSyncController.validateMappingSessions(MAPPING_ID, new MockHttpSession()))
                .isInstanceOf(UnauthorizedException.class);
        verify(sessionSyncService, never()).validateAndSyncMappingSessions(anyLong());

        assertOk(sessionSyncController.validateMappingSessions(MAPPING_ID, sessionOf(UserRole.STAFF, TENANT_ID)));
        assertOk(sessionSyncController.validateMappingSessions(MAPPING_ID, sessionOf(UserRole.ADMIN, TENANT_ID)));
    }

    @Test
    @DisplayName("백업·성능 초기화(서버 전역) — 미인증 401, 기관 관리자 403, 외부 기관 Ops 403, 본사 Ops 200")
    void platformOps_hqOpsOnly() {
        assertThatThrownBy(() -> backupStatusController.getBackupStatus())
                .isInstanceOf(AuthenticationCredentialsNotFoundException.class);

        authenticate(SecurityRoleConstants.ROLE_ADMIN);
        assertDenied(() -> backupStatusController.getBackupStatus());
        assertDenied(() -> backupStatusController.getBackupLogs());
        assertDenied(() -> backupStatusController.getDirectoryInfo());
        assertDenied(() -> apiPerformanceController.clearPerformanceStats());

        authenticate(SecurityRoleConstants.ROLE_OPS);
        assertDenied(() -> backupStatusController.getBackupStatus());
        assertDenied(() -> apiPerformanceController.clearPerformanceStats());
        verify(performanceInterceptor, never()).clearStats();

        TenantContextHolder.setTenantId(HQ_TENANT_ID);
        assertThat(backupStatusController.getBackupStatus()).containsKey("status");
        assertThat(backupStatusController.getDirectoryInfo()).containsKey("status");
        assertOk(apiPerformanceController.clearPerformanceStats());
        verify(performanceInterceptor).clearStats();
    }

    @Test
    @DisplayName("기관 전체 환불·결제확인 매칭·예산·재무 거래 — 내담자·상담사·사무원·다른 기관 관리자 403, 서비스 호출 없음 / 같은 기관 관리자 200")
    void tenantWideFinanceReads_adminOnly() {
        for (UserRole role : new UserRole[] {UserRole.CLIENT, UserRole.CONSULTANT, UserRole.STAFF}) {
            assertFinanceReadsDenied(sessionOf(role, TENANT_ID));
        }
        assertFinanceReadsDenied(sessionOf(UserRole.ADMIN, OTHER_TENANT_ID));
        MockHttpSession anonymous = new MockHttpSession();
        assertThatThrownBy(() -> adminController.getRefundHistory(0, 20, null, null, anonymous))
                .isInstanceOf(UnauthorizedException.class);
        assertThatThrownBy(() -> adminController.getFinancialTransactions(0, 20, null, null, null, null, anonymous))
                .isInstanceOf(UnauthorizedException.class);
        verifyNoInteractions(adminService, erpService, financialTransactionService);

        MockHttpSession admin = sessionOf(UserRole.ADMIN, TENANT_ID);
        assertOk(adminController.getRefundStatistics("month", admin));
        assertOk(adminController.getRefundHistory(0, 20, null, null, admin));
        assertOk(adminController.getPaymentConfirmedMappings(admin));
        assertOk(adminController.getBudgets(0, 20, admin));
        verify(adminService).getPaymentConfirmedMappings();
        verify(erpService).getAllActiveBudgets();
    }

    @Test
    @DisplayName("대시보드 통계·상담사 통계 목록 — 내담자·상담사·다른 기관 사무원 403, 서비스 호출 없음 / 같은 기관 사무원·관리자 200 (상담사 단건은 쓰기·단건 조회 가드 테스트)")
    void dashboardAggregates_tenantManagerOnly() {
        for (UserRole role : new UserRole[] {UserRole.CLIENT, UserRole.CONSULTANT}) {
            assertDashboardAggregatesDenied(sessionOf(role, TENANT_ID));
        }
        assertDashboardAggregatesDenied(sessionOf(UserRole.STAFF, OTHER_TENANT_ID));
        assertThatThrownBy(() -> adminController.getConsultantRatingStatistics(new MockHttpSession()))
                .isInstanceOf(UnauthorizedException.class);
        verifyNoInteractions(adminService, consultantStatsService, consultantRatingService);

        for (UserRole role : new UserRole[] {UserRole.STAFF, UserRole.ADMIN}) {
            MockHttpSession manager = sessionOf(role, TENANT_ID);
            assertOk(adminController.getConsultantRatingStatistics(manager));
        }
        verify(consultantRatingService, org.mockito.Mockito.times(2)).getAdminRatingStatistics();
    }

    private void assertFinanceReadsDenied(MockHttpSession session) {
        assertDenied(() -> adminController.getRefundStatistics("month", session));
        assertDenied(() -> adminController.getRefundHistory(0, 20, null, null, session));
        assertDenied(() -> adminController.getPaymentConfirmedMappings(session));
        assertDenied(() -> adminController.getBudgets(0, 20, session));
        assertDenied(() -> adminController.getFinancialTransactions(0, 20, null, null, null, null, session));
    }

    private void assertDashboardAggregatesDenied(MockHttpSession session) {
        assertDenied(() -> adminController.getAllConsultantsWithStats(session));
        assertDenied(() -> adminController.getConsultantWithStats(MAPPING_ID, session));
        assertDenied(() -> adminController.getConsultantVacationStats("month", session));
        assertDenied(() -> adminController.getConsultationCompletionStatistics(null, session));
        assertDenied(() -> adminController.getNewClientStatistics(12, session));
        assertDenied(() -> adminController.getConsultationsByDayOfWeek(12, session));
        assertDenied(() -> adminController.getWeeklyReservations(0, session));
        assertDenied(() -> adminController.getConsultantRatingStatistics(session));
    }

    private static OpsTenantConstants hqTenantConstants() {
        OpsTenantConstants constants = new OpsTenantConstants();
        ReflectionTestUtils.setField(constants, "hqTenantId", HQ_TENANT_ID);
        return constants;
    }

    private static void authenticate(String authority) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "ops-guard-test", null, List.of(new SimpleGrantedAuthority(authority))));
    }

    private static void assertDenied(Runnable call) {
        assertThatThrownBy(call::run).isInstanceOf(AccessDeniedException.class);
    }

    private static void assertOk(ResponseEntity<?> response) {
        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
    }

    private MockHttpSession sessionOf(UserRole role, String tenantId) {
        User user = new User();
        user.setId(role.isAdmin() ? 1L : 20L);
        user.setRole(role);
        user.setTenantId(tenantId);
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionConstants.USER_OBJECT, user);
        session.setAttribute(SessionConstants.TENANT_ID, tenantId);
        return session;
    }
}
