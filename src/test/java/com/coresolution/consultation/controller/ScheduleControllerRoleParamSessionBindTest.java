package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.UnauthorizedException;
import com.coresolution.consultation.repository.ClientScheduleNoteRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.RoleCommonCodeAuthorizationService;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.service.support.ClientPathAccessGuard;
import com.coresolution.consultation.service.support.ResourceOwnerAccessGuard;
import com.coresolution.core.context.TenantContextHolder;
import java.time.LocalDate;
import java.util.Collections;
import java.util.HashMap;
import java.util.Optional;
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
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * 일정 조회 API 의 {@code userId}·{@code userRole} 쿼리 파라미터 세션 바인딩 회귀.
 *
 * <p>.dev 에서 내담자 계정이 {@code userRole=ADMIN} 만 바꿔 같은 테넌트 전체 일정(타 내담자 포함)을
 * 목록·단건으로 읽을 수 있었다. 관리자·사무원이 아니면 서비스에 넘기는 역할은 세션 사용자 역할이어야 하고,
 * 상담사 경로({@code /consultant/{consultantId}/...})는 본인 상담사 또는 같은 테넌트 관리자만 허용한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ScheduleController — userRole 파라미터 위장 차단(세션 역할 바인딩)")
class ScheduleControllerRoleParamSessionBindTest {

    private static final String TENANT_ID = "tenant-role-bind-a";
    private static final String OTHER_TENANT_ID = "tenant-role-bind-b";
    private static final String SPOOFED_ADMIN = "ADMIN";
    private static final Long CLIENT_ID = 20L;
    private static final Long OTHER_USER_ID = 21L;
    private static final Long CONSULTANT_ID = 30L;
    private static final Long OTHER_CONSULTANT_ID = 31L;
    private static final Long ADMIN_ID = 1L;
    private static final Long SCHEDULE_ID = 500L;
    private static final LocalDate DAY = LocalDate.of(2026, 10, 4);

    @Mock private ScheduleService scheduleService;
    @Mock private CommonCodeService commonCodeService;
    @Mock private RoleCommonCodeAuthorizationService roleCommonCodeAuthorizationService;
    @Mock private DynamicPermissionService dynamicPermissionService;
    @Mock private ClientScheduleNoteRepository clientScheduleNoteRepository;
    @Mock private ConsultantClientMappingRepository consultantClientMappingRepository;

    private final UserRepository guardUserRepository = mock(UserRepository.class);

    @Spy
    private ClientPathAccessGuard clientPathAccessGuard = new ClientPathAccessGuard(
            mock(ConsultantClientMappingRepository.class), guardUserRepository);

    @Mock(answer = Answers.CALLS_REAL_METHODS)
    private ResourceOwnerAccessGuard resourceOwnerAccessGuard;

    @InjectMocks
    private ScheduleController controller;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        TenantContextHolder.setTenantId(TENANT_ID);
        ReflectionTestUtils.setField(resourceOwnerAccessGuard, "clientPathAccessGuard", clientPathAccessGuard);
        when(roleCommonCodeAuthorizationService.isAdminOrStaffRoleFromCommonCode(any()))
                .thenAnswer(inv -> {
                    UserRole role = inv.getArgument(0);
                    return role != null && (role.isAdmin() || role.isStaff());
                });
        when(guardUserRepository.findByTenantIdAndId(eq(TENANT_ID), anyLong()))
                .thenReturn(java.util.Optional.of(new User()));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("목록 — 내담자가 userRole=ADMIN 으로 위장해도 서비스에는 CLIENT 로 넘어간다")
    void list_clientSpoofingAdmin_usesSessionRole() {
        when(scheduleService.findSchedulesWithNamesByUserRole(CLIENT_ID, UserRole.CLIENT.name()))
                .thenReturn(Collections.emptyList());

        controller.getSchedulesByUserRole(CLIENT_ID, SPOOFED_ADMIN, sessionOf(CLIENT_ID, UserRole.CLIENT));

        verify(scheduleService).findSchedulesWithNamesByUserRole(CLIENT_ID, UserRole.CLIENT.name());
        verify(scheduleService, never()).findSchedulesWithNamesByUserRole(anyLong(), eq(SPOOFED_ADMIN));
    }

    @Test
    @DisplayName("목록 — 내담자가 타인 userId 로 호출하면 403, 조회 없음")
    void list_clientOtherUserId_forbidden() {
        assertThatThrownBy(() -> controller.getSchedulesByUserRole(
                OTHER_USER_ID, SPOOFED_ADMIN, sessionOf(CLIENT_ID, UserRole.CLIENT)))
                .isInstanceOf(AccessDeniedException.class);
        verify(scheduleService, never()).findSchedulesWithNamesByUserRole(anyLong(), anyString());
    }

    @Test
    @DisplayName("단건 — 내담자가 userRole=ADMIN 으로 타 내담자 일정을 요청하면 CLIENT 로 판정해 403")
    void detail_clientSpoofingAdmin_forbidden() {
        Schedule otherClientSchedule = new Schedule();
        otherClientSchedule.setId(SCHEDULE_ID);
        otherClientSchedule.setClientId(OTHER_USER_ID);
        when(scheduleService.findInTenant(TENANT_ID, SCHEDULE_ID)).thenReturn(Optional.of(otherClientSchedule));
        when(scheduleService.canAccessScheduleDetail(CLIENT_ID, UserRole.CLIENT.name(), otherClientSchedule))
                .thenReturn(false);

        assertThatThrownBy(() -> controller.getScheduleDetail(
                SCHEDULE_ID, CLIENT_ID, SPOOFED_ADMIN, sessionOf(CLIENT_ID, UserRole.CLIENT)))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage(ResourceOwnerAccessGuard.DENIAL_RESOURCE_UNAVAILABLE);
        verify(scheduleService, never()).canAccessScheduleDetail(anyLong(), eq(SPOOFED_ADMIN), any());
    }

    @Test
    @DisplayName("단건 — 없는 일정 id 는 500 이 아니라 공통 403 문구, 예외 원문 노출 없음")
    void detail_missingSchedule_forbiddenWithCommonMessage() {
        when(scheduleService.findInTenant(TENANT_ID, SCHEDULE_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> controller.getScheduleDetail(
                SCHEDULE_ID, CLIENT_ID, UserRole.CLIENT.name(), sessionOf(CLIENT_ID, UserRole.CLIENT)))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage(ResourceOwnerAccessGuard.DENIAL_RESOURCE_UNAVAILABLE);
        verify(scheduleService, never()).canAccessScheduleDetail(anyLong(), anyString(), any());
    }

    @Test
    @DisplayName("단건 — 조회 실패(DB 예외)도 같은 403 문구로 수렴해 존재 여부·예외 원문을 숨긴다")
    void detail_lookupFailure_forbiddenWithoutExceptionText() {
        when(scheduleService.findInTenant(TENANT_ID, SCHEDULE_ID))
                .thenThrow(new DataAccessResourceFailureException("schedules table detail"));

        assertThatThrownBy(() -> controller.getScheduleDetail(
                SCHEDULE_ID, CLIENT_ID, UserRole.CLIENT.name(), sessionOf(CLIENT_ID, UserRole.CLIENT)))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage(ResourceOwnerAccessGuard.DENIAL_RESOURCE_UNAVAILABLE);
    }

    @Test
    @DisplayName("단건 — 다른 기관 일정 id 는 세션 기관으로만 조회해 403")
    void detail_otherTenantSchedule_lookedUpInCallerTenantOnly() {
        when(scheduleService.findInTenant(TENANT_ID, SCHEDULE_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> controller.getScheduleDetail(
                SCHEDULE_ID, ADMIN_ID, UserRole.ADMIN.name(), sessionOf(ADMIN_ID, UserRole.ADMIN)))
                .isInstanceOf(AccessDeniedException.class);
        verify(scheduleService, never()).findInTenant(eq(OTHER_TENANT_ID), anyLong());
    }

    @Test
    @DisplayName("단건 — 타인 userId 는 일정 조회 전에 403")
    void detail_otherUserId_forbiddenBeforeLookup() {
        assertThatThrownBy(() -> controller.getScheduleDetail(
                SCHEDULE_ID, OTHER_USER_ID, SPOOFED_ADMIN, sessionOf(CLIENT_ID, UserRole.CLIENT)))
                .isInstanceOf(AccessDeniedException.class);
        verify(scheduleService, never()).findInTenant(anyString(), anyLong());
    }

    @Test
    @DisplayName("페이지 — 내담자 위장 역할은 CLIENT 로 바뀌고, 미인증은 401")
    void paged_clientSpoofingAdmin_usesSessionRole_andUnauthenticatedRejected() {
        Pageable pageable = PageRequest.of(0, 10);
        when(scheduleService.findSchedulesWithNamesByUserRolePaged(CLIENT_ID, UserRole.CLIENT.name(), pageable))
                .thenReturn(Page.empty());

        controller.getSchedulesByUserRolePaged(
                CLIENT_ID, SPOOFED_ADMIN, null, null, pageable, sessionOf(CLIENT_ID, UserRole.CLIENT));

        verify(scheduleService).findSchedulesWithNamesByUserRolePaged(CLIENT_ID, UserRole.CLIENT.name(), pageable);
        assertThatThrownBy(() -> controller.getSchedulesByUserRolePaged(
                CLIENT_ID, SPOOFED_ADMIN, null, null, pageable, new MockHttpSession()))
                .isInstanceOf(AccessDeniedException.class);
        verify(scheduleService, never()).findSchedulesWithNamesByUserRolePaged(anyLong(), eq(SPOOFED_ADMIN), any());
    }

    @Test
    @DisplayName("날짜 — 상담사 위장 역할은 CONSULTANT, 관리자는 요청 역할(STAFF) 유지")
    void date_consultantSpoofing_usesSessionRole_adminKeepsParam() {
        when(scheduleService.findScheduleResponsesByUserRoleAndDate(anyLong(), anyString(), eq(DAY)))
                .thenReturn(Collections.emptyList());

        controller.getSchedulesByUserRoleAndDate(
                CONSULTANT_ID, SPOOFED_ADMIN, DAY, sessionOf(CONSULTANT_ID, UserRole.CONSULTANT));
        controller.getSchedulesByUserRoleAndDate(
                ADMIN_ID, UserRole.STAFF.name(), DAY, sessionOf(ADMIN_ID, UserRole.ADMIN));

        verify(scheduleService).findScheduleResponsesByUserRoleAndDate(
                CONSULTANT_ID, UserRole.CONSULTANT.name(), DAY);
        verify(scheduleService).findScheduleResponsesByUserRoleAndDate(ADMIN_ID, UserRole.STAFF.name(), DAY);
        verify(scheduleService, never()).findScheduleResponsesByUserRoleAndDate(
                eq(CONSULTANT_ID), eq(SPOOFED_ADMIN), any());
    }

    @Test
    @DisplayName("날짜 범위 — 내담자 위장 역할은 CLIENT 로 바뀐다")
    void dateRange_clientSpoofingAdmin_usesSessionRole() {
        when(scheduleService.findScheduleResponsesByUserRoleAndDateBetween(
                CLIENT_ID, UserRole.CLIENT.name(), DAY, DAY)).thenReturn(Collections.emptyList());

        controller.getSchedulesByUserRoleAndDateRange(
                CLIENT_ID, SPOOFED_ADMIN, DAY, DAY, sessionOf(CLIENT_ID, UserRole.CLIENT));

        verify(scheduleService).findScheduleResponsesByUserRoleAndDateBetween(
                CLIENT_ID, UserRole.CLIENT.name(), DAY, DAY);
    }

    @Test
    @DisplayName("반례(테넌트) — 다른 기관 관리자는 목록 403")
    void list_adminOfOtherTenant_forbidden() {
        MockHttpSession session = sessionOf(ADMIN_ID, UserRole.ADMIN);
        ((User) session.getAttribute(SessionConstants.USER_OBJECT)).setTenantId(OTHER_TENANT_ID);

        assertThatThrownBy(() -> controller.getSchedulesByUserRole(ADMIN_ID, SPOOFED_ADMIN, session))
                .isInstanceOf(AccessDeniedException.class);
        verify(scheduleService, never()).findSchedulesWithNamesByUserRole(anyLong(), anyString());
    }

    @Test
    @DisplayName("상담사 날짜 — 본인 200 / 타 상담사·내담자 403(userRole 생략 포함) / 미인증 401")
    void consultantDate_scopedToSelfOrManager() {
        when(scheduleService.findByConsultantIdAndDate(CONSULTANT_ID, DAY)).thenReturn(Collections.emptyList());

        controller.getConsultantSchedulesByDate(CONSULTANT_ID, DAY, null, sessionOf(CONSULTANT_ID, UserRole.CONSULTANT));
        verify(scheduleService).findByConsultantIdAndDate(CONSULTANT_ID, DAY);

        assertThatThrownBy(() -> controller.getConsultantSchedulesByDate(
                OTHER_CONSULTANT_ID, DAY, null, sessionOf(CONSULTANT_ID, UserRole.CONSULTANT)))
                .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> controller.getConsultantSchedulesByDate(
                CONSULTANT_ID, DAY, SPOOFED_ADMIN, sessionOf(CLIENT_ID, UserRole.CLIENT)))
                .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> controller.getConsultantSchedulesByDate(
                CONSULTANT_ID, DAY, null, new MockHttpSession()))
                .isInstanceOf(UnauthorizedException.class);
        verify(scheduleService, never()).findByConsultantIdAndDate(eq(OTHER_CONSULTANT_ID), any());
    }

    @Test
    @DisplayName("상담사 날짜 — 같은 기관 관리자는 타 상담사 조회 허용(관리자 일정 등록 화면 회귀)")
    void consultantDate_adminAllowed() {
        when(scheduleService.findByConsultantIdAndDate(OTHER_CONSULTANT_ID, DAY)).thenReturn(Collections.emptyList());

        controller.getConsultantSchedulesByDate(OTHER_CONSULTANT_ID, DAY, null, sessionOf(ADMIN_ID, UserRole.ADMIN));

        verify(scheduleService).findByConsultantIdAndDate(OTHER_CONSULTANT_ID, DAY);
    }

    @Test
    @DisplayName("상담사 전체 일정 — 내담자가 userRole 을 생략해도 403, 조회 없음")
    void mySchedules_clientWithoutRoleParam_forbidden() {
        assertThatThrownBy(() -> controller.getMySchedules(
                CONSULTANT_ID, null, sessionOf(CLIENT_ID, UserRole.CLIENT)))
                .isInstanceOf(AccessDeniedException.class);
        verify(scheduleService, never()).findByConsultantId(anyLong());
    }

    @Test
    @DisplayName("오늘 통계 — 관리자가 다른 기관 tenantId 파라미터를 보내면 403, 같은 기관이면 자기 기관만")
    void todayStatistics_tenantParamBoundToCaller() {
        lenient().when(scheduleService.getTodayScheduleStatisticsByTenant(TENANT_ID)).thenReturn(new HashMap<>());

        assertThatThrownBy(() -> controller.getTodayScheduleStatistics(
                SPOOFED_ADMIN, OTHER_TENANT_ID, sessionOf(ADMIN_ID, UserRole.ADMIN)))
                .isInstanceOf(AccessDeniedException.class);
        verify(scheduleService, never()).getTodayScheduleStatisticsByTenant(OTHER_TENANT_ID);

        controller.getTodayScheduleStatistics(SPOOFED_ADMIN, TENANT_ID, sessionOf(ADMIN_ID, UserRole.ADMIN));
        verify(scheduleService).getTodayScheduleStatisticsByTenant(TENANT_ID);
    }

    private MockHttpSession sessionOf(Long userId, UserRole role) {
        User user = new User();
        user.setId(userId);
        user.setRole(role);
        user.setTenantId(TENANT_ID);
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionConstants.USER_OBJECT, user);
        return session;
    }
}
