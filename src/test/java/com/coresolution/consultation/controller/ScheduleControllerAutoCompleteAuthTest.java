package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.UnauthorizedException;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.ScheduleAutoCompleteService;
import com.coresolution.consultation.service.ScheduleAutoCompleteService.TenantAutoCompleteResult;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.service.support.ClientPathAccessGuard;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.dto.ApiResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * {@code POST /api/v1/schedules/auto-complete} 권한·테넌트 회귀 테스트.
 *
 * <p>역할은 세션 사용자에서만 읽는다. 요청 파라미터 {@code userRole} 을 보내도 판정이 바뀌지 않는다.
 * 처리 범위는 호출자 테넌트 1건이어야 하며, 전 테넌트 경로
 * ({@link ScheduleService#autoCompleteExpiredSchedules()})를 타면 안 된다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ScheduleController 자동 완료 — 세션 역할·테넌트 가드")
class ScheduleControllerAutoCompleteAuthTest {

    private static final String TENANT_A = "tenant-auto-complete-a";
    private static final String TENANT_B = "tenant-auto-complete-b";
    private static final String SPOOFED_ADMIN_PARAM = "ADMIN";

    @Mock private ScheduleService scheduleService;
    @Mock private ScheduleAutoCompleteService scheduleAutoCompleteService;

    @Spy
    private ClientPathAccessGuard clientPathAccessGuard = new ClientPathAccessGuard(
        mock(ConsultantClientMappingRepository.class), mock(UserRepository.class));

    @InjectMocks private ScheduleController controller;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        TenantContextHolder.setTenantId(TENANT_A);
        when(scheduleAutoCompleteService.autoCompleteExpiredSchedulesForTenant(TENANT_A))
            .thenReturn(new TenantAutoCompleteResult(TENANT_A, 2, 1));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("같은 기관 관리자 — 200, 자기 테넌트만 처리")
    void admin_ok_scopedToOwnTenant() {
        MockHttpSession session = sessionOf(1L, UserRole.ADMIN, TENANT_A);

        ResponseEntity<ApiResponse<Void>> response =
            controller.autoCompleteExpiredSchedules(null, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(scheduleAutoCompleteService).autoCompleteExpiredSchedulesForTenant(TENANT_A);
        verify(scheduleAutoCompleteService, never()).autoCompleteExpiredSchedulesForTenant(TENANT_B);
        verify(scheduleService, never()).autoCompleteExpiredSchedules();
    }

    @Test
    @DisplayName("사무원(STAFF) — 200 (기존 동작 회귀)")
    void staff_ok() {
        MockHttpSession session = sessionOf(2L, UserRole.STAFF, TENANT_A);

        ResponseEntity<ApiResponse<Void>> response =
            controller.autoCompleteExpiredSchedules(null, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(scheduleAutoCompleteService).autoCompleteExpiredSchedulesForTenant(TENANT_A);
    }

    @Test
    @DisplayName("상담사 — 403, 완료 처리 없음")
    void consultant_forbidden() {
        MockHttpSession session = sessionOf(3L, UserRole.CONSULTANT, TENANT_A);

        assertThatThrownBy(() -> controller.autoCompleteExpiredSchedules(null, session))
            .isInstanceOf(AccessDeniedException.class);
        verifyNoCompletion();
    }

    @Test
    @DisplayName("내담자 — 403, 완료 처리 없음")
    void client_forbidden() {
        MockHttpSession session = sessionOf(4L, UserRole.CLIENT, TENANT_A);

        assertThatThrownBy(() -> controller.autoCompleteExpiredSchedules(null, session))
            .isInstanceOf(AccessDeniedException.class);
        verifyNoCompletion();
    }

    @Test
    @DisplayName("반례(권한) — 상담사가 userRole=ADMIN 으로 위장해도 403")
    void consultantSpoofingAdminParam_forbidden() {
        MockHttpSession session = sessionOf(5L, UserRole.CONSULTANT, TENANT_A);

        assertThatThrownBy(() -> controller.autoCompleteExpiredSchedules(SPOOFED_ADMIN_PARAM, session))
            .isInstanceOf(AccessDeniedException.class);
        verifyNoCompletion();
    }

    @Test
    @DisplayName("반례(권한) — 내담자가 userRole=ADMIN 으로 위장해도 403")
    void clientSpoofingAdminParam_forbidden() {
        MockHttpSession session = sessionOf(6L, UserRole.CLIENT, TENANT_A);

        assertThatThrownBy(() -> controller.autoCompleteExpiredSchedules(SPOOFED_ADMIN_PARAM, session))
            .isInstanceOf(AccessDeniedException.class);
        verifyNoCompletion();
    }

    @Test
    @DisplayName("반례(권한) — 미인증 호출은 401")
    void unauthenticated_unauthorized() {
        assertThatThrownBy(() ->
            controller.autoCompleteExpiredSchedules(SPOOFED_ADMIN_PARAM, new MockHttpSession()))
            .isInstanceOf(UnauthorizedException.class);
        verifyNoCompletion();
    }

    @Test
    @DisplayName("반례(테넌트) — 다른 기관 컨텍스트로 들어온 관리자는 403, 그 기관 일정도 건드리지 않는다")
    void adminOfOtherTenant_forbidden() {
        MockHttpSession session = sessionOf(7L, UserRole.ADMIN, TENANT_B);

        assertThatThrownBy(() -> controller.autoCompleteExpiredSchedules(null, session))
            .isInstanceOf(AccessDeniedException.class);
        verifyNoCompletion();
    }

    private void verifyNoCompletion() {
        verify(scheduleAutoCompleteService, never()).autoCompleteExpiredSchedulesForTenant(TENANT_A);
        verify(scheduleAutoCompleteService, never()).autoCompleteExpiredSchedulesForTenant(TENANT_B);
        verify(scheduleService, never()).autoCompleteExpiredSchedules();
    }

    private MockHttpSession sessionOf(Long userId, UserRole role, String tenantId) {
        User user = new User();
        user.setId(userId);
        user.setRole(role);
        user.setTenantId(tenantId);
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionConstants.USER_OBJECT, user);
        return session;
    }
}
