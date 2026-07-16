package com.coresolution.consultation.controller;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.SessionExtensionRequestResponse;
import com.coresolution.consultation.entity.SessionExtensionRequest;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.service.SessionExtensionService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.core.dto.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.access.AccessDeniedException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link SessionExtensionController#createRequest} 세션 기반 요청자 확정·DTO 응답 검증.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SessionExtensionController.createRequest — 세션 요청자 확정")
class SessionExtensionControllerCreateRequestTest {

    private static final Long SESSION_USER_ID = 3L;
    private static final Long TENANT_USER_ID = 33L;
    private static final String USER_EMAIL = "admin@tenant-b.example.com";

    @Mock
    private SessionExtensionService sessionExtensionService;

    @Mock
    private UserService userService;

    @InjectMocks
    private SessionExtensionController controller;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    private MockHttpSession sessionWithUser(User user) {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionConstants.USER_OBJECT, user);
        return session;
    }

    private User buildSessionUser() {
        User user = User.builder()
                .userId("uid-session")
                .email(USER_EMAIL)
                .role(UserRole.ADMIN)
                .build();
        user.setId(SESSION_USER_ID);
        user.setTenantId("tenant-a");
        return user;
    }

    private User buildTenantUser() {
        User user = User.builder()
                .userId("uid-tenant-b")
                .email(USER_EMAIL)
                .role(UserRole.ADMIN)
                .build();
        user.setId(TENANT_USER_ID);
        user.setTenantId("tenant-b");
        return user;
    }

    private Map<String, Object> buildRequestBody(Long bodyRequesterId) {
        Map<String, Object> body = new HashMap<>();
        body.put("mappingId", 10L);
        body.put("requesterId", bodyRequesterId);
        body.put("additionalSessions", 5);
        body.put("packageName", "10회기");
        body.put("packagePrice", "500000");
        body.put("reason", "추가");
        return body;
    }

    private SessionExtensionRequest buildSavedRequest(User requester) {
        return SessionExtensionRequest.builder()
                .id(99L)
                .tenantId("tenant-b")
                .requester(requester)
                .additionalSessions(5)
                .packageName("10회기")
                .packagePrice(new BigDecimal("500000"))
                .status(SessionExtensionRequest.ExtensionStatus.PENDING)
                .reason("추가")
                .build();
    }

    @Nested
    @DisplayName("세션 userId가 현재 테넌트와 일치")
    class SessionUserIdMatchesTenant {

        @Test
        @DisplayName("createRequest: 세션 userId로 서비스 호출·DTO 반환")
        void createRequest_usesSessionUserId() throws Exception {
            User sessionUser = buildSessionUser();
            SessionExtensionRequest saved = buildSavedRequest(sessionUser);

            when(userService.findActiveById(SESSION_USER_ID)).thenReturn(Optional.of(sessionUser));
            when(sessionExtensionService.createRequest(
                    eq(10L), eq(SESSION_USER_ID), eq(5), eq("10회기"), any(BigDecimal.class), eq("추가")))
                    .thenReturn(saved);

            ResponseEntity<ApiResponse<SessionExtensionRequestResponse>> response =
                    controller.createRequest(buildRequestBody(SESSION_USER_ID), sessionWithUser(sessionUser));

            assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getData()).isInstanceOf(SessionExtensionRequestResponse.class);
            assertThat(response.getBody().getData().getId()).isEqualTo(99L);
            assertThat(response.getBody().getData().getRequesterId()).isEqualTo(SESSION_USER_ID);

            String json = objectMapper.writeValueAsString(response.getBody().getData());
            assertThat(json).doesNotContain("\"requester\":{");

            verify(sessionExtensionService).createRequest(
                    eq(10L), eq(SESSION_USER_ID), eq(5), eq("10회기"), any(BigDecimal.class), eq("추가"));
        }
    }

    @Nested
    @DisplayName("멀티테넌트 — 세션 userId 불일치·이메일 폴백")
    class MultiTenantEmailFallback {

        @Test
        @DisplayName("createRequest: body requesterId 무시하고 이메일 폴백 userId 사용")
        void createRequest_ignoresBodyRequesterId_usesEmailFallback() {
            User sessionUser = buildSessionUser();
            User tenantUser = buildTenantUser();
            SessionExtensionRequest saved = buildSavedRequest(tenantUser);

            when(userService.findActiveById(SESSION_USER_ID)).thenReturn(Optional.empty());
            when(userService.findAllUsersMatchingEmailInCurrentTenant(USER_EMAIL))
                    .thenReturn(List.of(tenantUser));
            when(sessionExtensionService.createRequest(
                    eq(10L), eq(TENANT_USER_ID), eq(5), eq("10회기"), any(BigDecimal.class), eq("추가")))
                    .thenReturn(saved);

            ResponseEntity<ApiResponse<SessionExtensionRequestResponse>> response =
                    controller.createRequest(buildRequestBody(SESSION_USER_ID), sessionWithUser(sessionUser));

            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getData().getRequesterId()).isEqualTo(TENANT_USER_ID);

            verify(sessionExtensionService).createRequest(
                    eq(10L), eq(TENANT_USER_ID), eq(5), eq("10회기"), any(BigDecimal.class), eq("추가"));
        }

        @Test
        @DisplayName("createRequest: 이메일 폴백 실패 시 EntityNotFoundException")
        void createRequest_emailFallbackNotFound_throwsEntityNotFound() {
            User sessionUser = buildSessionUser();

            when(userService.findActiveById(SESSION_USER_ID)).thenReturn(Optional.empty());
            when(userService.findAllUsersMatchingEmailInCurrentTenant(USER_EMAIL))
                    .thenReturn(Collections.emptyList());

            assertThatThrownBy(() -> controller.createRequest(
                    buildRequestBody(SESSION_USER_ID), sessionWithUser(sessionUser)))
                    .isInstanceOf(EntityNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("인증 가드")
    class AuthGuard {

        @Test
        @DisplayName("createRequest: 세션 없으면 AccessDeniedException")
        void createRequest_noSession_throwsAccessDenied() {
            assertThatThrownBy(() -> controller.createRequest(buildRequestBody(3L), new MockHttpSession()))
                    .isInstanceOf(AccessDeniedException.class);
        }
    }
}
