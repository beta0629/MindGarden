package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.service.support.ResourceOwnerAccessGuard;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.util.StatusCodeHelper;
import jakarta.servlet.http.HttpSession;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * GET /api/v1/admin/mappings/consultant/{id}/clients — statusCounts + status 필터 페이징.
 *
 * @author CoreSolution
 * @since 2026-10-08
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminController — mappings/.../clients statusCounts·status filter")
class AdminControllerClientsByConsultantStatusCountsTest {

    private static final String TENANT_ID = "tenant-status-counts-a";
    private static final Long CONSULTANT_ID = 77L;

    @Mock private AdminService adminService;
    @Mock private DynamicPermissionService dynamicPermissionService;
    @Mock private UserService userService;
    @Mock private UserRepository userRepository;
    @Mock private UserPersonalDataCacheService userPersonalDataCacheService;
    @Mock private StatusCodeHelper statusCodeHelper;
    @Mock private ScheduleRepository scheduleRepository;
    @Mock private ResourceOwnerAccessGuard resourceOwnerAccessGuard;
    @Mock private HttpSession session;

    @InjectMocks
    private AdminController controller;

    private MockedStatic<SessionUtils> sessionUtilsMock;
    private MockedStatic<com.coresolution.consultation.util.PermissionCheckUtils> permissionMock;

    @BeforeEach
    void setUp() {
        sessionUtilsMock = Mockito.mockStatic(SessionUtils.class);
        permissionMock = Mockito.mockStatic(com.coresolution.consultation.util.PermissionCheckUtils.class);
        ReflectionTestUtils.setField(controller, "resourceOwnerAccessGuard", resourceOwnerAccessGuard);
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        sessionUtilsMock.close();
        permissionMock.close();
        TenantContextHolder.clear();
    }

    private User sessionUser(Long id, UserRole role) {
        User user = new User();
        user.setId(id);
        user.setEmail("consultant@example.test");
        user.setRole(role);
        user.setTenantId(TENANT_ID);
        return user;
    }

    private ConsultantClientMapping mapping(
            Long id,
            Long clientId,
            ConsultantClientMapping.MappingStatus status,
            ConsultantClientMapping.PaymentStatus paymentStatus) {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(id);
        mapping.setStatus(status);
        mapping.setPaymentStatus(paymentStatus);
        mapping.setTotalSessions(10);
        mapping.setUsedSessions(1);
        mapping.setRemainingSessions(9);
        mapping.setPackageName("pkg");
        User client = new User();
        client.setId(clientId);
        client.setName("내담자" + clientId);
        client.setEmail("c" + clientId + "@example.test");
        mapping.setClient(client);
        return mapping;
    }

    private void stubHappyPath() {
        User current = sessionUser(CONSULTANT_ID, UserRole.CONSULTANT);
        sessionUtilsMock.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(current);
        sessionUtilsMock.when(() -> SessionUtils.getTenantId(session)).thenReturn(TENANT_ID);
        permissionMock.when(() -> com.coresolution.consultation.util.PermissionCheckUtils
                        .checkPermission(eq(session), eq("MAPPING_VIEW"), eq(dynamicPermissionService)))
                .thenReturn(null);
        when(resourceOwnerAccessGuard.requireConsultantSelfOrManagerAccess(session, CONSULTANT_ID))
                .thenReturn(current);
        when(userService.findByEmail(anyString())).thenReturn(Optional.of(current));
        when(userRepository.findByTenantIdAndId(TENANT_ID, CONSULTANT_ID))
                .thenReturn(Optional.of(current));
        lenient().when(statusCodeHelper.isStatus(eq("PAYMENT_STATUS"), anyString(), eq("APPROVED")))
                .thenAnswer(inv -> "APPROVED".equals(inv.getArgument(1)));
        lenient().when(statusCodeHelper.isStatus(eq("PAYMENT_STATUS"), anyString(), eq("PENDING")))
                .thenAnswer(inv -> "PENDING".equals(inv.getArgument(1)));
        lenient().when(statusCodeHelper.getStatusCode(anyString(), anyString())).thenReturn(null);
        lenient().when(userPersonalDataCacheService.getDecryptedUserData(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            Map<String, String> map = new HashMap<>();
            map.put("name", u.getName());
            map.put("email", u.getEmail());
            map.put("phone", "");
            return map;
        });
        lenient().when(scheduleRepository.findMaxCompletedSessionDateByConsultantAndClientIds(
                anyString(), any(), any(), any()))
                .thenReturn(List.of());
    }

    @Test
    @DisplayName("statusCounts 는 필터 전 총계(ALL+상태별), status=ACTIVE 시 페이징은 필터 후")
    void statusCounts_beforeFilter_andStatusPaging() {
        stubHappyPath();
        List<ConsultantClientMapping> mappings = new ArrayList<>();
        mappings.add(mapping(1L, 501L, ConsultantClientMapping.MappingStatus.ACTIVE,
                ConsultantClientMapping.PaymentStatus.APPROVED));
        mappings.add(mapping(2L, 502L, ConsultantClientMapping.MappingStatus.ACTIVE,
                ConsultantClientMapping.PaymentStatus.APPROVED));
        mappings.add(mapping(3L, 503L, ConsultantClientMapping.MappingStatus.SESSIONS_EXHAUSTED,
                ConsultantClientMapping.PaymentStatus.APPROVED));
        mappings.add(mapping(4L, 504L, ConsultantClientMapping.MappingStatus.PENDING_PAYMENT,
                ConsultantClientMapping.PaymentStatus.PENDING));
        mappings.add(mapping(5L, 505L, ConsultantClientMapping.MappingStatus.TERMINATED,
                ConsultantClientMapping.PaymentStatus.APPROVED));
        when(adminService.getMappingsByConsultantEmail(anyString())).thenReturn(mappings);

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                controller.getClientsByConsultantMapping(CONSULTANT_ID, 0, 1, "ACTIVE", session);

        assertThat(response.getBody()).isNotNull();
        Map<String, Object> data = response.getBody().getData();
        @SuppressWarnings("unchecked")
        Map<String, Long> statusCounts = (Map<String, Long>) data.get("statusCounts");
        assertThat(statusCounts.get("ALL")).isEqualTo(4L);
        assertThat(statusCounts.get("ACTIVE")).isEqualTo(2L);
        assertThat(statusCounts.get("SESSIONS_EXHAUSTED")).isEqualTo(1L);
        assertThat(statusCounts.get("PENDING_PAYMENT")).isEqualTo(1L);
        assertThat(data.get("totalElements")).isEqualTo(2);
        assertThat(data.get("totalPages")).isEqualTo(2);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> page = (List<Map<String, Object>>) data.get("mappings");
        assertThat(page).hasSize(1);
        assertThat(page.get(0).get("status").toString()).isEqualTo("ACTIVE");
    }

    @Test
    @DisplayName("다른 상담사 id — 가드 거부, 서비스 미호출")
    void otherConsultant_denied() {
        when(resourceOwnerAccessGuard.requireConsultantSelfOrManagerAccess(session, CONSULTANT_ID))
                .thenThrow(new AccessDeniedException("denied"));
        assertThatThrownBy(() -> controller.getClientsByConsultantMapping(
                CONSULTANT_ID, 0, 20, null, session))
                .isInstanceOf(AccessDeniedException.class);
        verify(adminService, never()).getMappingsByConsultantEmail(anyString());
    }

    @Test
    @DisplayName("status 생략 시 전체 활성 매핑 + statusCounts (하위 호환)")
    void noStatus_returnsAllActiveWithCounts() {
        stubHappyPath();
        List<ConsultantClientMapping> mappings = List.of(
                mapping(1L, 501L, ConsultantClientMapping.MappingStatus.ACTIVE,
                        ConsultantClientMapping.PaymentStatus.APPROVED),
                mapping(2L, 502L, ConsultantClientMapping.MappingStatus.SESSIONS_EXHAUSTED,
                        ConsultantClientMapping.PaymentStatus.APPROVED));
        when(adminService.getMappingsByConsultantEmail(anyString())).thenReturn(mappings);

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                controller.getClientsByConsultantMapping(CONSULTANT_ID, 0, 20, null, session);

        Map<String, Object> data = response.getBody().getData();
        assertThat(data.get("totalElements")).isEqualTo(2);
        @SuppressWarnings("unchecked")
        Map<String, Long> statusCounts = (Map<String, Long>) data.get("statusCounts");
        assertThat(statusCounts.get("ALL")).isEqualTo(2L);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> page = (List<Map<String, Object>>) data.get("mappings");
        assertThat(page).hasSize(2);
    }
}
