package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
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
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.support.ClientPathAccessGuard;
import com.coresolution.consultation.service.support.ResourceOwnerAccessGuard;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.CacheManagementController;
import com.coresolution.core.controller.SecurityMonitoringController;
import com.coresolution.core.security.SecurityAuditService;
import com.coresolution.core.service.CacheStatsService;
import java.util.Collections;
import java.util.HashMap;
import javax.sql.DataSource;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * 인증만 요구하던 관리자 목록·운영 API 의 세션 역할 가드 회귀.
 *
 * <p>.dev 에서 내담자 계정이 {@code /api/v1/admin/schedules}·{@code /admin/mappings/*} 로 같은 기관 다른 내담자의
 * 일정·매칭을, 보안·캐시·시스템 도구 API 로 의심 IP·개인정보 캐시 키·서버 로그를 읽고 비우기까지 할 수 있었다.
 * 목록은 관리자·사무원, 운영 도구는 관리자만 허용한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("관리자 목록·운영 API — 세션 역할 가드")
class AdminOpsEndpointsRoleGuardTest {

    private static final String TENANT_ID = "tenant-ops-guard-a";
    private static final String OTHER_TENANT_ID = "tenant-ops-guard-b";

    @Mock private AdminService adminService;
    @Mock private SecurityAuditService securityAuditService;
    @Mock private CacheStatsService cacheStatsService;
    @Mock private DataSource dataSource;
    @Mock private DynamicPermissionService dynamicPermissionService;

    @Spy
    private ClientPathAccessGuard clientPathAccessGuard = new ClientPathAccessGuard(
            mock(ConsultantClientMappingRepository.class), mock(UserRepository.class));

    @Mock(answer = Answers.CALLS_REAL_METHODS)
    private ResourceOwnerAccessGuard resourceOwnerAccessGuard;

    @InjectMocks private AdminController adminController;
    @InjectMocks private SecurityMonitoringController securityMonitoringController;
    @InjectMocks private CacheManagementController cacheManagementController;
    @InjectMocks private SystemToolsController systemToolsController;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        TenantContextHolder.setTenantId(TENANT_ID);
        ReflectionTestUtils.setField(resourceOwnerAccessGuard, "clientPathAccessGuard", clientPathAccessGuard);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("관리자 매칭 목록 3종 — 내담자·상담사 403(조회 없음), 미인증 401, 사무원·관리자 허용")
    void adminMappingLists_managerOnly() {
        for (UserRole denied : new UserRole[] {UserRole.CLIENT, UserRole.CONSULTANT}) {
            MockHttpSession session = sessionOf(denied);
            assertDenied(() -> adminController.getActiveMappings(session));
            assertDenied(() -> adminController.getPendingPaymentMappings(session));
            assertDenied(() -> adminController.getSessionsExhaustedMappings(session));
        }
        assertThatThrownBy(() -> adminController.getActiveMappings(new MockHttpSession()))
                .isInstanceOf(UnauthorizedException.class);
        verifyNoInteractions(adminService);

        when(adminService.getPendingPaymentMappings()).thenReturn(Collections.emptyList());
        adminController.getPendingPaymentMappings(sessionOf(UserRole.STAFF));
        adminController.getPendingPaymentMappings(sessionOf(UserRole.ADMIN));
        verify(adminService, times(2)).getPendingPaymentMappings();
    }

    @Test
    @DisplayName("관리자 일정 목록 — 내담자 403(조회 없음), 다른 기관 관리자 403")
    void adminSchedules_managerOfSameTenantOnly() {
        assertDenied(() -> adminController.getSchedules(null, null, null, null, 0, 20, sessionOf(UserRole.CLIENT)));

        MockHttpSession otherTenantAdmin = sessionOf(UserRole.ADMIN);
        ((User) otherTenantAdmin.getAttribute(SessionConstants.USER_OBJECT)).setTenantId(OTHER_TENANT_ID);
        assertDenied(() -> adminController.getSchedules(null, null, null, null, 0, 20, otherTenantAdmin));
        verifyNoInteractions(adminService);
    }

    @Test
    @DisplayName("보안 모니터링 — 내담자·사무원 403, 서비스 호출 없음(읽기·삭제·설정 변경)")
    void securityMonitoring_adminOnly() {
        for (UserRole denied : new UserRole[] {UserRole.CLIENT, UserRole.STAFF, UserRole.CONSULTANT}) {
            MockHttpSession session = sessionOf(denied);
            assertDenied(() -> securityMonitoringController.getSecurityStatistics(session));
            assertDenied(() -> securityMonitoringController.getBlockedIPs(session));
            assertDenied(() -> securityMonitoringController.generateAuditReport(session));
            assertDenied(() -> securityMonitoringController.clearSecurityStats(session));
            assertDenied(() -> securityMonitoringController.getSecurityStatus(session));
            assertDenied(() -> securityMonitoringController.getSecurityRecommendations(session));
            assertDenied(() -> securityMonitoringController.unblockIP("blocked-ip-under-test", session));
            assertDenied(() -> securityMonitoringController.getAlertSettings(session));
            assertDenied(() -> securityMonitoringController.updateAlertSettings(new HashMap<>(), session));
        }
        verifyNoInteractions(securityAuditService);
    }

    @Test
    @DisplayName("캐시 관리 — 내담자·사무원 403(통계·비우기·워밍업), 관리자 허용")
    void cacheManagement_adminOnly() {
        for (UserRole denied : new UserRole[] {UserRole.CLIENT, UserRole.STAFF}) {
            MockHttpSession session = sessionOf(denied);
            assertDenied(() -> cacheManagementController.getAllCacheStats(session));
            assertDenied(() -> cacheManagementController.getCacheStats("userPersonalData", session));
            assertDenied(() -> cacheManagementController.clearCache("userPersonalData", session));
            assertDenied(() -> cacheManagementController.clearAllCaches(session));
            assertDenied(() -> cacheManagementController.warmupCache(session));
        }
        verifyNoInteractions(cacheStatsService);

        ResponseEntity<?> response = cacheManagementController.getAllCacheStats(sessionOf(UserRole.ADMIN));
        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
    }

    @Test
    @DisplayName("시스템 도구 — 내담자·사무원 403(로그·캐시·권한 캐시·백업), 의존성 호출 없음")
    void systemTools_adminOnly() {
        for (UserRole denied : new UserRole[] {UserRole.CLIENT, UserRole.STAFF}) {
            MockHttpSession session = sessionOf(denied);
            assertDenied(() -> systemToolsController.getRecentLogs(session));
            assertDenied(() -> systemToolsController.clearCache(session));
            assertDenied(() -> systemToolsController.clearPermissionCache(session));
            assertDenied(() -> systemToolsController.createBackup(session));
        }
        verifyNoInteractions(dataSource, dynamicPermissionService);
        assertThatThrownBy(() -> systemToolsController.getRecentLogs(new MockHttpSession()))
                .isInstanceOf(UnauthorizedException.class);
    }

    private static void assertDenied(Runnable call) {
        assertThatThrownBy(call::run).isInstanceOf(AccessDeniedException.class);
    }

    private MockHttpSession sessionOf(UserRole role) {
        User user = new User();
        user.setId(role.isAdmin() ? 1L : 20L);
        user.setRole(role);
        user.setTenantId(TENANT_ID);
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionConstants.USER_OBJECT, user);
        return session;
    }
}
