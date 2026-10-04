package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.ConsultantClientMappingResponse;
import com.coresolution.consultation.dto.ConsultantRegistrationRequest;
import com.coresolution.consultation.dto.ConsultantTransferRequest;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.UnauthorizedException;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.UserSocialAccountRepository;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.ClientStatsService;
import com.coresolution.consultation.service.ConsultantStatsService;
import com.coresolution.consultation.service.RealTimeStatisticsService;
import com.coresolution.consultation.service.RoleCommonCodeAuthorizationService;
import com.coresolution.consultation.service.support.ClientPathAccessGuard;
import com.coresolution.consultation.service.support.ResourceOwnerAccessGuard;
import com.coresolution.core.constant.OpsTenantConstants;
import com.coresolution.core.constants.SecurityRoleConstants;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.OpsAccessGuard;
import com.coresolution.core.service.impl.OnboardingServiceImpl;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.BiFunction;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Answers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
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
 * AdminController 매핑·상담사 쓰기와 단건 조회의 역할 × 엔드포인트 가드 회귀.
 *
 * <p>배정·통합 일정·사용자 관리 화면(사무원 메뉴)에서 부르는 API 는 같은 기관 관리자·사무원, 화면 호출이 없는
 * 쓰기는 같은 기관 관리자, 테넌트 기본 공통코드 초기화는 본사 Ops 만 허용한다. 자원 id 는 세션 테넌트 소속이어야
 * 하며, 거부 시 서비스는 호출되지 않고 자원 거부 문구는 하나로 통일된다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AdminController 쓰기·단건 조회 — 역할 × 엔드포인트 가드")
class AdminControllerWriteAndSingleReadRoleGuardTest {

    private static final String TENANT_ID = "tenant-admin-write-a";
    private static final String OTHER_TENANT_ID = "tenant-admin-write-b";
    private static final String HQ_TENANT_ID = "tenant-admin-write-hq";
    private static final Long MAPPING_ID = 101L;
    private static final Long FOREIGN_MAPPING_ID = 202L;
    private static final Long CONSULTANT_ID = 301L;
    private static final Long NEW_CONSULTANT_ID = 302L;
    private static final Long CLIENT_ID = 401L;
    private static final Long FOREIGN_USER_ID = 999L;

    private enum Access { ADMIN, MANAGER }

    private record Case(String name, Access access, BiFunction<MockHttpSession, Boolean, ResponseEntity<?>> call) {
        ResponseEntity<?> invoke(MockHttpSession session) {
            return call.apply(session, false);
        }

        ResponseEntity<?> invokeOnForeignResource(MockHttpSession session) {
            return call.apply(session, true);
        }
    }

    @Mock private AdminService adminService;
    @Mock private RealTimeStatisticsService realTimeStatisticsService;
    @Mock private ConsultantStatsService consultantStatsService;
    @Mock private ClientStatsService clientStatsService;
    @Mock private UserSocialAccountRepository userSocialAccountRepository;
    @Mock private RoleCommonCodeAuthorizationService roleCommonCodeAuthorizationService;
    @Mock private OnboardingServiceImpl onboardingService;
    @Mock private ConsultantClientMappingRepository mappingRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private AdminController controller;

    private ResourceOwnerAccessGuard resourceOwnerAccessGuard;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        TenantContextHolder.setTenantId(TENANT_ID);

        ClientPathAccessGuard clientPathAccessGuard = spy(new ClientPathAccessGuard(mappingRepository, userRepository));
        resourceOwnerAccessGuard =
                mock(ResourceOwnerAccessGuard.class, Answers.CALLS_REAL_METHODS);
        ReflectionTestUtils.setField(resourceOwnerAccessGuard, "clientPathAccessGuard", clientPathAccessGuard);
        ReflectionTestUtils.setField(resourceOwnerAccessGuard, "mappingRepository", mappingRepository);
        OpsTenantConstants opsTenantConstants = new OpsTenantConstants();
        ReflectionTestUtils.setField(opsTenantConstants, "hqTenantId", HQ_TENANT_ID);
        ReflectionTestUtils.setField(controller, "clientPathAccessGuard", clientPathAccessGuard);
        ReflectionTestUtils.setField(controller, "resourceOwnerAccessGuard", resourceOwnerAccessGuard);
        ReflectionTestUtils.setField(controller, "opsAccessGuard", new OpsAccessGuard(opsTenantConstants));

        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(MAPPING_ID);
        when(mappingRepository.findByTenantIdAndId(TENANT_ID, MAPPING_ID)).thenReturn(Optional.of(mapping));
        for (Long userId : List.of(CONSULTANT_ID, NEW_CONSULTANT_ID, CLIENT_ID)) {
            when(userRepository.findByTenantIdAndId(TENANT_ID, userId)).thenReturn(Optional.of(new User()));
        }

        User consultant = new User();
        consultant.setId(CONSULTANT_ID);
        consultant.setRole(UserRole.CONSULTANT);
        when(adminService.getMappingById(anyLong())).thenReturn(mapping);
        when(adminService.getMappingDetail(anyLong())).thenReturn(ConsultantClientMappingResponse.fromEntity(mapping));
        when(adminService.confirmPayment(anyLong(), any(), any(), any())).thenReturn(mapping);
        when(adminService.approveMapping(anyLong(), any())).thenReturn(mapping);
        when(adminService.transferConsultant(any())).thenReturn(mapping);
        when(adminService.getTransferHistory(anyLong())).thenReturn(List.of());
        when(adminService.updateConsultant(anyLong(), any())).thenReturn(consultant);
        when(adminService.updateConsultantGrade(anyLong(), anyString())).thenReturn(consultant);
        when(adminService.checkConsultantDeletionStatus(anyLong())).thenReturn(new HashMap<>());
        when(adminService.checkClientDeletionStatus(anyLong())).thenReturn(new HashMap<>());
        when(adminService.getUserById(anyLong())).thenReturn(consultant);
        when(consultantStatsService.getConsultantWithStats(anyLong())).thenReturn(new HashMap<>());
        when(clientStatsService.getClientWithStats(anyString(), anyLong())).thenReturn(new HashMap<>());
        when(roleCommonCodeAuthorizationService.isAdminOrStaffRoleFromCommonCode(any())).thenReturn(true);
        when(onboardingService.addDefaultTenantCommonCodes(anyString(), anyString())).thenReturn(0);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("미인증 — 모든 쓰기·단건 조회 401, 서비스 호출 없음")
    void anonymous_unauthorized() {
        for (Case c : cases()) {
            assertThatThrownBy(() -> c.invoke(new MockHttpSession()))
                    .as(c.name())
                    .isInstanceOf(UnauthorizedException.class);
        }
        assertNoServiceCalls();
    }

    @Test
    @DisplayName("내담자·상담사 — 모든 쓰기·단건 조회 403(공통 자원 거부 문구), 서비스 호출 없음")
    void clientAndConsultant_forbidden() {
        for (UserRole role : new UserRole[] {UserRole.CLIENT, UserRole.CONSULTANT}) {
            for (Case c : cases()) {
                assertResourceDenied(c.name() + " as " + role, () -> c.invoke(sessionOf(role, TENANT_ID)));
            }
        }
        assertNoServiceCalls();
    }

    @Test
    @DisplayName("사무원 — 화면 호출 근거가 있는 API 만 200, 관리자 전용 쓰기는 403·서비스 호출 없음")
    void staff_allowedOnlyOnStaffScreens() {
        MockHttpSession staff = sessionOf(UserRole.STAFF, TENANT_ID);
        for (Case c : cases()) {
            if (c.access() == Access.MANAGER) {
                assertOk(c.name(), c.invoke(staff));
            } else {
                assertResourceDenied(c.name(), () -> c.invoke(staff));
            }
        }
        verify(adminService, never()).rejectMapping(anyLong(), any());
        verify(adminService, never()).useSession(anyLong());
        verify(adminService, never()).extendSessions(anyLong(), any(), any(), any());
        verify(adminService, never()).updateConsultantGrade(anyLong(), anyString());
        verify(adminService, never()).deleteConsultantWithTransfer(anyLong(), anyLong(), any());
        verify(adminService, times(2)).confirmPayment(anyLong(), any(), any(), any());
        verify(adminService, never()).partialRefundMapping(anyLong(), anyInt(), any());
        verify(adminService, never()).terminateMapping(anyLong(), any());
    }

    @Test
    @DisplayName("같은 기관 관리자 — 모든 쓰기·단건 조회 200")
    void sameTenantAdmin_allowed() {
        MockHttpSession admin = sessionOf(UserRole.ADMIN, TENANT_ID);
        for (Case c : cases()) {
            assertOk(c.name(), c.invoke(admin));
        }
        verify(adminService).rejectMapping(MAPPING_ID, "reason");
        verify(adminService).partialRefundMapping(MAPPING_ID, 1, "reason");
        verify(adminService).terminateMapping(MAPPING_ID, "reason");
        verify(adminService).deleteConsultantWithTransfer(CONSULTANT_ID, NEW_CONSULTANT_ID, "reason");
    }

    @Test
    @DisplayName("다른 기관 관리자(세션 기관 ≠ 요청 기관) — 모든 쓰기·단건 조회 403, 서비스 호출 없음")
    void otherTenantAdmin_forbidden() {
        MockHttpSession otherTenantAdmin = sessionOf(UserRole.ADMIN, OTHER_TENANT_ID);
        for (Case c : cases()) {
            assertThatThrownBy(() -> c.invoke(otherTenantAdmin))
                    .as(c.name())
                    .isInstanceOf(AccessDeniedException.class);
        }
        assertNoServiceCalls();
    }

    @Test
    @DisplayName("같은 기관 관리자라도 다른 기관 매핑·사용자 id — 403(공통 자원 거부 문구), 서비스 호출 없음")
    void sameTenantAdmin_foreignResource_forbidden() {
        MockHttpSession admin = sessionOf(UserRole.ADMIN, TENANT_ID);
        for (Case c : cases()) {
            assertResourceDenied(c.name(), () -> c.invokeOnForeignResource(admin));
        }
        assertNoServiceCalls();
    }

    @Test
    @DisplayName("일괄 결제 확인·취소 — 목록 아님·빈 목록·숫자 아님·다른 기관 id 섞임은 403, 서비스 호출 없음")
    void bulkPayment_rejectsMalformedOrForeignIds() {
        MockHttpSession admin = sessionOf(UserRole.ADMIN, TENANT_ID);
        for (Object ids : new Object[] {null, "1", List.of(), List.of("x"), List.of(MAPPING_ID, FOREIGN_MAPPING_ID)}) {
            Map<String, Object> body = new HashMap<>();
            body.put("mappingIds", ids);
            assertResourceDenied("confirm " + ids, () -> controller.confirmMappingPayment(body, admin));
            assertResourceDenied("cancel " + ids, () -> controller.cancelMappingPayment(body, admin));
        }
        assertNoServiceCalls();
    }

    @Test
    @DisplayName("상담사 휴무 목록 — 내담자·상담사 403, 서비스 호출 없음")
    void consultantsWithVacation_managerOnly() {
        for (UserRole role : new UserRole[] {UserRole.CLIENT, UserRole.CONSULTANT}) {
            assertThatThrownBy(() -> controller.getAllConsultantsWithVacationInfo("2026-10-04",
                    sessionOf(role, TENANT_ID))).isInstanceOf(AccessDeniedException.class);
        }
        assertNoServiceCalls();
    }

    @Test
    @DisplayName("상담사별 내담자 목록 — 다른 상담사 id 를 넣은 상담사·내담자·다른 기관 관리자 403, 서비스 호출 없음")
    void clientsByConsultant_selfOrManagerOnly() {
        assertResourceDenied("consultant other id",
                () -> controller.getClientsByConsultantMapping(CONSULTANT_ID, sessionOf(UserRole.CONSULTANT, TENANT_ID)));
        assertResourceDenied("client",
                () -> controller.getClientsByConsultantMapping(CONSULTANT_ID, sessionOf(UserRole.CLIENT, TENANT_ID)));
        assertResourceDenied("admin foreign consultant",
                () -> controller.getClientsByConsultantMapping(FOREIGN_USER_ID, sessionOf(UserRole.ADMIN, TENANT_ID)));
        assertThatThrownBy(() -> controller.getClientsByConsultantMapping(CONSULTANT_ID,
                sessionOf(UserRole.ADMIN, OTHER_TENANT_ID))).isInstanceOf(AccessDeniedException.class);
        assertNoServiceCalls();

        MockHttpSession self = sessionOf(UserRole.CONSULTANT, TENANT_ID);
        ((User) self.getAttribute(SessionConstants.USER_OBJECT)).setId(CONSULTANT_ID);
        assertThat(resourceOwnerAccessGuard.requireConsultantSelfOrManagerAccess(self, CONSULTANT_ID).getId())
                .isEqualTo(CONSULTANT_ID);
        assertThat(resourceOwnerAccessGuard.requireConsultantSelfOrManagerAccess(
                sessionOf(UserRole.STAFF, TENANT_ID), CONSULTANT_ID)).isNotNull();
    }

    @Test
    @DisplayName("기본 공통코드 초기화 — 미인증 401, 기관 관리자 403, 외부 기관 Ops 403, 본사 Ops 200")
    void initializeDefaultCodes_hqOpsOnly() {
        MockHttpSession hqSession = sessionOf(UserRole.ADMIN, HQ_TENANT_ID);
        assertThatThrownBy(() -> controller.initializeDefaultCodes(hqSession))
                .isInstanceOf(AuthenticationCredentialsNotFoundException.class);

        authenticate(SecurityRoleConstants.ROLE_ADMIN);
        assertThatThrownBy(() -> controller.initializeDefaultCodes(sessionOf(UserRole.ADMIN, TENANT_ID)))
                .isInstanceOf(AccessDeniedException.class);

        authenticate(SecurityRoleConstants.ROLE_OPS);
        assertThatThrownBy(() -> controller.initializeDefaultCodes(sessionOf(UserRole.ADMIN, TENANT_ID)))
                .isInstanceOf(AccessDeniedException.class);
        verifyNoInteractions(onboardingService);

        TenantContextHolder.setTenantId(HQ_TENANT_ID);
        assertOk("initialize-default-codes", controller.initializeDefaultCodes(hqSession));
        verify(onboardingService).addDefaultTenantCommonCodes(anyString(), anyString());
    }

    private List<Case> cases() {
        return List.of(
                new Case("GET mappings/{id}", Access.MANAGER,
                        (s, f) -> controller.getMappingById(mappingId(f), s)),
                new Case("POST mappings/{id}/confirm-payment", Access.MANAGER,
                        (s, f) -> controller.confirmPayment(mappingId(f), Map.of("paymentMethod", "CARD"), s)),
                new Case("POST mappings/{id}/approve", Access.MANAGER,
                        (s, f) -> controller.approveMapping(mappingId(f), Map.of("adminName", "admin"), s)),
                new Case("POST mappings/{id}/terminate", Access.ADMIN,
                        (s, f) -> controller.terminateMapping(mappingId(f), Map.of("reason", "reason"), s)),
                new Case("POST mappings/{id}/cleanup-future-schedules", Access.MANAGER,
                        (s, f) -> controller.cleanupFutureSchedulesForMapping(mappingId(f), s)),
                new Case("POST mappings/{id}/partial-refund", Access.ADMIN,
                        (s, f) -> controller.partialRefundMapping(mappingId(f),
                                Map.of("refundSessions", 1, "reason", "reason"), s)),
                new Case("POST mappings/transfer", Access.MANAGER,
                        (s, f) -> controller.transferConsultant(ConsultantTransferRequest.builder()
                                .currentMappingId(mappingId(f)).newConsultantId(NEW_CONSULTANT_ID).build(), s)),
                new Case("POST mapping/payment/confirm", Access.MANAGER,
                        (s, f) -> controller.confirmMappingPayment(
                                Map.of("mappingIds", List.of(mappingId(f)), "paymentMethod", "CARD"), s)),
                new Case("POST mapping/payment/cancel", Access.ADMIN,
                        (s, f) -> controller.cancelMappingPayment(Map.of("mappingIds", List.of(mappingId(f))), s)),
                new Case("PUT consultants/{id}", Access.MANAGER,
                        (s, f) -> controller.updateConsultant(consultantId(f), new ConsultantRegistrationRequest(), s)),
                new Case("DELETE consultants/{id}", Access.MANAGER,
                        (s, f) -> controller.deleteConsultant(consultantId(f), "reason", s)),
                new Case("GET consultants/{id}/deletion-status", Access.MANAGER,
                        (s, f) -> controller.checkConsultantDeletionStatus(consultantId(f), s)),
                new Case("GET consultants/with-stats/{id}", Access.MANAGER,
                        (s, f) -> controller.getConsultantWithStats(consultantId(f), s)),
                new Case("GET clients/with-stats/{id}", Access.MANAGER,
                        (s, f) -> controller.getClientWithStats(clientId(f), s)),
                new Case("GET clients/{id}/deletion-status", Access.MANAGER,
                        (s, f) -> controller.checkClientDeletionStatus(clientId(f), s)),
                new Case("GET clients/{id}/transfer-history", Access.MANAGER,
                        (s, f) -> controller.getTransferHistory(clientId(f), s)),
                new Case("GET users/{id}", Access.MANAGER,
                        (s, f) -> controller.getUserById(consultantId(f), s)),
                new Case("GET users/{id}/social-accounts", Access.MANAGER,
                        (s, f) -> controller.getUserSocialAccounts(consultantId(f), s)),
                new Case("POST mappings/{id}/reject", Access.ADMIN,
                        (s, f) -> controller.rejectMapping(mappingId(f), Map.of("reason", "reason"), s)),
                new Case("POST mappings/{id}/use-session", Access.ADMIN,
                        (s, f) -> controller.useSession(mappingId(f), s)),
                new Case("POST mappings/{id}/extend-sessions", Access.ADMIN,
                        (s, f) -> controller.extendSessions(mappingId(f),
                                Map.of("additionalSessions", 1, "packageName", "package", "packagePrice", 1), s)),
                new Case("PUT consultants/{id}/grade", Access.ADMIN,
                        (s, f) -> controller.updateConsultantGrade(consultantId(f), Map.of("grade", "JUNIOR"), s)),
                new Case("POST consultants/{id}/delete-with-transfer", Access.ADMIN,
                        (s, f) -> controller.deleteConsultantWithTransfer(consultantId(f),
                                Map.of("transferToConsultantId", NEW_CONSULTANT_ID, "reason", "reason"), s)));
    }

    private static Long mappingId(boolean foreign) {
        return foreign ? FOREIGN_MAPPING_ID : MAPPING_ID;
    }

    private static Long consultantId(boolean foreign) {
        return foreign ? FOREIGN_USER_ID : CONSULTANT_ID;
    }

    private static Long clientId(boolean foreign) {
        return foreign ? FOREIGN_USER_ID : CLIENT_ID;
    }

    private void assertNoServiceCalls() {
        verifyNoInteractions(adminService, realTimeStatisticsService, consultantStatsService, clientStatsService,
                userSocialAccountRepository, onboardingService);
    }

    private static void assertResourceDenied(String name, Runnable call) {
        assertThatThrownBy(call::run)
                .as(name)
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage(ResourceOwnerAccessGuard.DENIAL_RESOURCE_UNAVAILABLE);
    }

    private static void assertOk(String name, ResponseEntity<?> response) {
        assertThat(response.getStatusCode().is2xxSuccessful()).as(name).isTrue();
    }

    private static void authenticate(String authority) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "admin-write-guard-test", null, List.of(new SimpleGrantedAuthority(authority))));
    }

    private static MockHttpSession sessionOf(UserRole role, String tenantId) {
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
