package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.constant.NotificationType;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.lifecycle.Actor;
import com.coresolution.consultation.dto.lifecycle.AdminUserRestoreRequest;
import com.coresolution.consultation.dto.lifecycle.TransitionResult;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.NotificationLifecycleService;
import com.coresolution.consultation.service.UserLifecycleService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.dto.ApiResponse;

import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import com.coresolution.testsupport.SecurityContextIsolationExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * {@link AdminUserLifecycleController} 단위 테스트 — Q5 되돌리기/pending-deletion 검증.
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@ExtendWith({MockitoExtension.class, SecurityContextIsolationExtension.class})
@DisplayName("AdminUserLifecycleController — Q5 되돌리기 / pending-deletion 검증")
class AdminUserLifecycleControllerTest {

    private static final String TENANT_ID = "tenant-restore-test";
    private static final Long ADMIN_ID = 999L;
    private static final Long TARGET_ID = 5001L;

    @Mock private UserRepository userRepository;
    @Mock private UserLifecycleService userLifecycleService;
    @Mock private NotificationLifecycleService notificationLifecycleService;
    @Mock private HttpSession session;

    @InjectMocks
    private AdminUserLifecycleController controller;

    private User adminUser;
    private User target;
    private MockedStatic<com.coresolution.consultation.utils.SessionUtils> sessionUtilsStatic;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);

        adminUser = new User();
        adminUser.setId(ADMIN_ID);
        adminUser.setTenantId(TENANT_ID);
        adminUser.setName("관리자K");
        adminUser.setRole(UserRole.ADMIN);

        target = new User();
        target.setId(TARGET_ID);
        target.setTenantId(TENANT_ID);
        target.setName("타깃");
        target.setEmail("target@example.com");
        target.setRole(UserRole.CLIENT);
        target.setLifecycleState(LifecycleState.DELETED_BY_ADMIN);
        target.setDeletedAt(LocalDateTime.now().minusDays(2));
        target.setDeletedByAdminId(ADMIN_ID);

        sessionUtilsStatic = Mockito.mockStatic(
                com.coresolution.consultation.utils.SessionUtils.class);
        sessionUtilsStatic.when(() ->
                com.coresolution.consultation.utils.SessionUtils.getCurrentUser(any()))
                .thenReturn(adminUser);
        sessionUtilsStatic.when(
                com.coresolution.consultation.utils.SessionUtils::getCurrentUserId)
                .thenReturn(ADMIN_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        sessionUtilsStatic.close();
    }

    @Test
    @DisplayName("restoreUser: 7일 윈도우 내 + 사유 정상 → transitionTo(ACTIVE) 호출 + 알림 발송 + 200")
    void restoreUser_within7Days_success() {
        when(userRepository.findByTenantIdAndId(TENANT_ID, TARGET_ID))
                .thenReturn(Optional.of(target));
        when(userLifecycleService.transitionTo(eq(TARGET_ID), eq(LifecycleState.ACTIVE),
                any(Actor.class), anyString()))
                .thenAnswer(inv -> TransitionResult.builder()
                        .userId(TARGET_ID)
                        .fromState(LifecycleState.DELETED_BY_ADMIN)
                        .toState(LifecycleState.ACTIVE)
                        .auditLogId(9001L)
                        .transitionedAt(LocalDateTime.now())
                        .build());

        AdminUserRestoreRequest request = AdminUserRestoreRequest.builder()
                .reason("운영 오인 해제")
                .build();

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                controller.restoreUser(TARGET_ID, request, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

        ArgumentCaptor<String> reasonCaptor = ArgumentCaptor.forClass(String.class);
        verify(userLifecycleService, times(1)).transitionTo(
                eq(TARGET_ID), eq(LifecycleState.ACTIVE),
                any(Actor.class), reasonCaptor.capture());
        assertThat(reasonCaptor.getValue()).startsWith("ADMIN_RESTORE: ");
        assertThat(reasonCaptor.getValue()).contains("운영 오인 해제");

        // 알림 발송 호출 확인 (EMAIL 폴백)
        verify(notificationLifecycleService, times(1)).send(
                eq(TENANT_ID), eq(TARGET_ID), eq(ADMIN_ID),
                eq(NotificationType.WITHDRAWAL), anyString(), anyString());
    }

    @Test
    @DisplayName("restoreUser: 7일 윈도우 만료 → 409 + lifecycle 호출 없음")
    void restoreUser_after7Days_returns409() {
        target.setDeletedAt(LocalDateTime.now().minusDays(8));
        when(userRepository.findByTenantIdAndId(TENANT_ID, TARGET_ID))
                .thenReturn(Optional.of(target));

        AdminUserRestoreRequest request = AdminUserRestoreRequest.builder()
                .reason("뒤늦은 되돌리기 시도")
                .build();

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                controller.restoreUser(TARGET_ID, request, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        verify(userLifecycleService, never()).transitionTo(
                anyLong(), any(LifecycleState.class), any(Actor.class), anyString());
        verify(notificationLifecycleService, never()).send(
                anyString(), anyLong(), any(), any(NotificationType.class), anyString(), anyString());
    }

    @Test
    @DisplayName("restoreUser: lifecycle_state 이 DELETED_BY_ADMIN 이 아니면 409")
    void restoreUser_notDeletedByAdmin_returns409() {
        target.setLifecycleState(LifecycleState.ACTIVE);
        target.setDeletedAt(null);
        when(userRepository.findByTenantIdAndId(TENANT_ID, TARGET_ID))
                .thenReturn(Optional.of(target));

        AdminUserRestoreRequest request = AdminUserRestoreRequest.builder()
                .reason("잘못된 호출")
                .build();

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                controller.restoreUser(TARGET_ID, request, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        verify(userLifecycleService, never()).transitionTo(
                anyLong(), any(LifecycleState.class), any(Actor.class), anyString());
    }

    @Test
    @DisplayName("restoreUser: 대상 사용자 없으면 404")
    void restoreUser_targetNotFound_returns404() {
        when(userRepository.findByTenantIdAndId(TENANT_ID, TARGET_ID))
                .thenReturn(Optional.empty());

        AdminUserRestoreRequest request = AdminUserRestoreRequest.builder()
                .reason("없는 대상")
                .build();

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                controller.restoreUser(TARGET_ID, request, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("listPendingDeletion: 7일 내 사용자 목록 페이지 + 어드민 이름 join")
    void listPendingDeletion_returnsPagedDto() {
        target.setDeletedAt(LocalDateTime.now().minusDays(1));
        Page<User> page = new PageImpl<>(List.of(target), PageRequest.of(0, 20), 1L);
        when(userRepository.findPendingDeletionByTenantId(
                eq(TENANT_ID), any(LocalDateTime.class), any(Pageable.class)))
                .thenReturn(page);
        when(userRepository.findAllById(any())).thenReturn(List.of(adminUser));

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                controller.listPendingDeletion(0, 20, "ALL");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> body = response.getBody().getData();
        assertThat(body.get("totalElements")).isEqualTo(1L);
        assertThat(body.get("retentionWindowDays")).isEqualTo(
                AdminUserLifecycleController.RETENTION_WINDOW_DAYS);
    }

    @Test
    @DisplayName("maskEmail: 일반 이메일 → 첫 글자 + * + @domain")
    void maskEmail_normal() {
        assertThat(AdminUserLifecycleController.maskEmail("abc@example.com"))
                .isEqualTo("a**@example.com");
    }

    @Test
    @DisplayName("maskEmail: null/blank → 빈 문자열")
    void maskEmail_blank() {
        assertThat(AdminUserLifecycleController.maskEmail(null)).isEqualTo("");
        assertThat(AdminUserLifecycleController.maskEmail("")).isEqualTo("");
    }

    @Test
    @DisplayName("calculateDaysRemaining: 7일 보존 윈도우 내 남은 일수")
    void calculateDaysRemaining_basic() {
        int r = AdminUserLifecycleController.calculateDaysRemaining(
                LocalDateTime.now().minusDays(3));
        assertThat(r).isBetween(3, 4);
    }

    @Test
    @DisplayName("calculateDaysRemaining: 7일 만료 후 0 반환")
    void calculateDaysRemaining_expired() {
        int r = AdminUserLifecycleController.calculateDaysRemaining(
                LocalDateTime.now().minusDays(10));
        assertThat(r).isEqualTo(0);
    }
}
