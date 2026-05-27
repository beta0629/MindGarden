package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Collections;

import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.lifecycle.Actor;
import com.coresolution.consultation.dto.lifecycle.DormantUserDetailResponse;
import com.coresolution.consultation.dto.lifecycle.DormantUserSummaryResponse;
import com.coresolution.consultation.dto.lifecycle.TransitionResult;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.AdminLifecycleService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.dto.ApiResponse;

import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;

/**
 * {@link AdminLifecycleDormantUsersController} 단위 테스트 — Phase 4 어드민 휴면 사용자 4 API.
 *
 * <p>6 시나리오: 목록 / 상세 / reactivate / forceAnonymize / 비로그인 거부 / 비 ADMIN 거부.</p>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminLifecycleDormantUsersController — 어드민 휴면 사용자 모니터링 4 API")
class AdminLifecycleDormantUsersControllerTest {

    private static final Long ADMIN_ID = 99L;
    private static final Long TARGET_USER_ID = 4242L;
    private static final String TENANT_ID = "tenant-admin-dormant-test";

    @Mock private AdminLifecycleService adminLifecycleService;
    @Mock private HttpSession session;

    @InjectMocks
    private AdminLifecycleDormantUsersController controller;

    private User admin;

    @BeforeEach
    void setUp() {
        admin = new User();
        admin.setId(ADMIN_ID);
        admin.setTenantId(TENANT_ID);
        admin.setEmail("admin@example.com");
        admin.setRole(UserRole.ADMIN);
        admin.setLifecycleState(LifecycleState.ACTIVE);
    }

    @Test
    @DisplayName("list: ADMIN 세션 + tenantId 격리 → AdminLifecycleService.listDormantUsers 위임")
    void list_success() {
        DormantUserSummaryResponse summary = DormantUserSummaryResponse.builder()
                .userId(TARGET_USER_ID)
                .maskedUserId("42**42")
                .role("CLIENT")
                .dormantEnteredAt(LocalDateTime.now().minusYears(1))
                .vaultPresent(true)
                .build();
        Pageable pageable = PageRequest.of(0, 20);
        when(adminLifecycleService.listDormantUsers(eq(TENANT_ID), eq(pageable)))
                .thenReturn(new PageImpl<>(Collections.singletonList(summary), pageable, 1));

        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(admin);

            ResponseEntity<ApiResponse<org.springframework.data.domain.Page<DormantUserSummaryResponse>>>
                    response = controller.list(session, pageable);

            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getData().getContent())
                    .singleElement()
                    .satisfies(item -> {
                        assertThat(item.getUserId()).isEqualTo(TARGET_USER_ID);
                        assertThat(item.getMaskedUserId()).isEqualTo("42**42");
                        assertThat(item.isVaultPresent()).isTrue();
                    });
            verify(adminLifecycleService).listDormantUsers(eq(TENANT_ID), eq(pageable));
        }
    }

    @Test
    @DisplayName("detail: ADMIN 세션 + tenantId 격리 → detail 위임")
    void detail_success() {
        DormantUserDetailResponse detail = DormantUserDetailResponse.builder()
                .userId(TARGET_USER_ID)
                .maskedUserId("42**42")
                .role("CLIENT")
                .lifecycleState(LifecycleState.DORMANT.name())
                .communityAnonymizationAuditCount(0L)
                .vaultPresent(true)
                .build();
        when(adminLifecycleService.getDormantUserDetail(eq(TENANT_ID), eq(TARGET_USER_ID)))
                .thenReturn(detail);

        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(admin);

            ResponseEntity<ApiResponse<DormantUserDetailResponse>> response =
                    controller.detail(session, TARGET_USER_ID);

            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getData().getUserId()).isEqualTo(TARGET_USER_ID);
            assertThat(response.getBody().getData().getLifecycleState())
                    .isEqualTo(LifecycleState.DORMANT.name());
            verify(adminLifecycleService).getDormantUserDetail(TENANT_ID, TARGET_USER_ID);
        }
    }

    @Test
    @DisplayName("reactivate: ADMIN actor + tenantId → AdminLifecycleService.reactivateDormantUser 위임")
    void reactivate_success() {
        TransitionResult result = TransitionResult.builder()
                .userId(TARGET_USER_ID)
                .fromState(LifecycleState.DORMANT)
                .toState(LifecycleState.ACTIVE)
                .transitionedAt(LocalDateTime.now())
                .auditLogId(501L)
                .build();
        when(adminLifecycleService.reactivateDormantUser(
                eq(TENANT_ID), eq(TARGET_USER_ID), any(Actor.class)))
                .thenReturn(result);

        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(admin);

            ResponseEntity<ApiResponse<TransitionResult>> response =
                    controller.reactivate(session, TARGET_USER_ID);

            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getData().getToState()).isEqualTo(LifecycleState.ACTIVE);
            verify(adminLifecycleService).reactivateDormantUser(
                    eq(TENANT_ID), eq(TARGET_USER_ID), any(Actor.class));
        }
    }

    @Test
    @DisplayName("forceAnonymize (DELETE): ADMIN actor → AdminLifecycleService.forceAnonymizeDormantUser 위임")
    void forceAnonymize_success() {
        TransitionResult result = TransitionResult.builder()
                .userId(TARGET_USER_ID)
                .fromState(LifecycleState.DORMANT)
                .toState(LifecycleState.ANONYMIZED)
                .transitionedAt(LocalDateTime.now())
                .auditLogId(601L)
                .build();
        when(adminLifecycleService.forceAnonymizeDormantUser(
                eq(TENANT_ID), eq(TARGET_USER_ID), any(Actor.class)))
                .thenReturn(result);

        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(admin);

            ResponseEntity<ApiResponse<TransitionResult>> response =
                    controller.forceAnonymize(session, TARGET_USER_ID);

            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getData().getToState()).isEqualTo(LifecycleState.ANONYMIZED);
            verify(adminLifecycleService).forceAnonymizeDormantUser(
                    eq(TENANT_ID), eq(TARGET_USER_ID), any(Actor.class));
        }
    }

    @Test
    @DisplayName("권한 거부: 비 ADMIN 사용자 → AccessDeniedException + service 미호출")
    void permission_denied_nonAdmin() {
        User client = new User();
        client.setId(7L);
        client.setTenantId(TENANT_ID);
        client.setRole(UserRole.CLIENT);
        client.setLifecycleState(LifecycleState.ACTIVE);

        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(client);

            assertThatThrownBy(() -> controller.list(session, PageRequest.of(0, 20)))
                    .isInstanceOf(AccessDeniedException.class);

            verify(adminLifecycleService, never())
                    .listDormantUsers(anyString(), any(Pageable.class));
        }
    }

    @Test
    @DisplayName("비로그인 거부: 세션 사용자 없음 → AccessDeniedException + service 미호출")
    void permission_denied_unauthenticated() {
        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(null);

            assertThatThrownBy(() -> controller.detail(session, TARGET_USER_ID))
                    .isInstanceOf(AccessDeniedException.class);
            assertThatThrownBy(() -> controller.reactivate(session, TARGET_USER_ID))
                    .isInstanceOf(AccessDeniedException.class);
            assertThatThrownBy(() -> controller.forceAnonymize(session, TARGET_USER_ID))
                    .isInstanceOf(AccessDeniedException.class);

            verify(adminLifecycleService, never())
                    .getDormantUserDetail(anyString(), anyLong());
            verify(adminLifecycleService, never())
                    .reactivateDormantUser(anyString(), anyLong(), any(Actor.class));
            verify(adminLifecycleService, never())
                    .forceAnonymizeDormantUser(anyString(), anyLong(), any(Actor.class));
        }
    }

    @Test
    @DisplayName("tenantId 격리: 모든 호출에 admin.tenantId 가 그대로 전달")
    void tenantId_isolation() {
        Pageable pageable = PageRequest.of(0, 5);
        when(adminLifecycleService.listDormantUsers(eq(TENANT_ID), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList(), pageable, 0));
        when(adminLifecycleService.getDormantUserDetail(eq(TENANT_ID), eq(TARGET_USER_ID)))
                .thenReturn(DormantUserDetailResponse.builder()
                        .userId(TARGET_USER_ID).maskedUserId("**").role("CLIENT")
                        .lifecycleState(LifecycleState.DORMANT.name())
                        .communityAnonymizationAuditCount(0L).vaultPresent(false).build());

        try (MockedStatic<SessionUtils> mocked = mockStatic(SessionUtils.class)) {
            mocked.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(admin);
            controller.list(session, pageable);
            controller.detail(session, TARGET_USER_ID);

            verify(adminLifecycleService).listDormantUsers(eq(TENANT_ID), eq(pageable));
            verify(adminLifecycleService).getDormantUserDetail(eq(TENANT_ID), eq(TARGET_USER_ID));
        }
    }
}
