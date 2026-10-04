package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
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
import com.coresolution.consultation.service.AccountIntegrationService;
import com.coresolution.consultation.service.PasskeyService;
import com.coresolution.consultation.service.support.ClientPathAccessGuard;
import com.coresolution.core.context.TenantContextHolder;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * 본인 계정 전용 API(패스키·SNS 연결)의 {@code userId} 파라미터 신뢰 차단.
 *
 * <p>요청 {@code userId} 를 그대로 서비스에 넘기면 비로그인·다른 사용자가 남의 계정에 패스키를 등록하거나
 * SNS 계정을 연결해 계정을 가로챌 수 있었다. 대상은 항상 세션 사용자이고, 다른 id 는 관리자라도 403 이다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("본인 계정 API — userId 파라미터 대신 세션 사용자")
class SelfScopedAccountEndpointsGuardTest {

    private static final String TENANT_ID = "tenant-self-scope-a";
    private static final Long CLIENT_ID = 20L;
    private static final Long OTHER_USER_ID = 21L;
    private static final Long ADMIN_ID = 1L;

    private final ClientPathAccessGuard guard = new ClientPathAccessGuard(
            mock(ConsultantClientMappingRepository.class), mock(UserRepository.class));
    private final PasskeyService passkeyService = mock(PasskeyService.class);
    private final AccountIntegrationService accountIntegrationService = mock(AccountIntegrationService.class);
    private final PasskeyController passkeyController = new PasskeyController(passkeyService, guard);
    private final AccountIntegrationController accountIntegrationController =
            new AccountIntegrationController(accountIntegrationService, guard);

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("requireSelf — 본인 id·생략은 세션 사용자, 다른 id 는 관리자라도 403, 미인증 401")
    void requireSelf_bindsToSessionUser() {
        assertThat(guard.requireSelf(sessionOf(CLIENT_ID, UserRole.CLIENT), CLIENT_ID).getId()).isEqualTo(CLIENT_ID);
        assertThat(guard.requireSelf(sessionOf(CLIENT_ID, UserRole.CLIENT), null).getId()).isEqualTo(CLIENT_ID);
        assertThatThrownBy(() -> guard.requireSelf(sessionOf(CLIENT_ID, UserRole.CLIENT), OTHER_USER_ID))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage(ClientPathAccessGuard.DENIAL_OWN_CLIENT_ONLY);
        assertThatThrownBy(() -> guard.requireSelf(sessionOf(ADMIN_ID, UserRole.ADMIN), OTHER_USER_ID))
                .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> guard.requireSelf(new MockHttpSession(), CLIENT_ID))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    @DisplayName("패스키 목록 — 비로그인 userId=1 은 401, 타인 id 403, 본인은 세션 id 로만 조회")
    void passkeyList_scopedToSession() {
        assertThatThrownBy(() -> passkeyController.listPasskeys(1L, null, new MockHttpSession()))
                .isInstanceOf(UnauthorizedException.class);
        assertThatThrownBy(() -> passkeyController.listPasskeys(
                OTHER_USER_ID, null, sessionOf(CLIENT_ID, UserRole.CLIENT)))
                .isInstanceOf(AccessDeniedException.class);
        verifyNoInteractions(passkeyService);

        when(passkeyService.listPasskeys(CLIENT_ID)).thenReturn(Map.of("success", true));
        passkeyController.listPasskeys(null, null, sessionOf(CLIENT_ID, UserRole.CLIENT));
        verify(passkeyService).listPasskeys(CLIENT_ID);
    }

    @Test
    @DisplayName("패스키 등록 시작·완료·삭제 — 본문/파라미터 타인 id 는 403, 서비스 호출 없음")
    void passkeyWrites_otherUserIdForbidden() {
        Map<String, Object> body = new HashMap<>();
        body.put("userId", OTHER_USER_ID);
        body.put("deviceName", "device");

        assertThatThrownBy(() -> passkeyController.startRegistration(
                body, null, sessionOf(CLIENT_ID, UserRole.CLIENT)))
                .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> passkeyController.finishRegistration(
                body, null, sessionOf(CLIENT_ID, UserRole.CLIENT)))
                .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> passkeyController.startRegistration(body, null, new MockHttpSession()))
                .isInstanceOf(UnauthorizedException.class);
        assertThatThrownBy(() -> passkeyController.deletePasskey(
                5L, OTHER_USER_ID, null, sessionOf(CLIENT_ID, UserRole.CLIENT)))
                .isInstanceOf(AccessDeniedException.class);
        verify(passkeyService, never()).startRegistration(anyLong(), any());
        verify(passkeyService, never()).finishRegistration(anyLong(), any(), any(), any());
        verify(passkeyService, never()).deletePasskey(anyLong(), anyLong());
    }

    @Test
    @DisplayName("패스키 등록 — 숫자가 아닌 userId 는 잘못된 요청, 본인 id 는 세션 id 로 등록")
    void passkeyRegister_selfAllowed_malformedRejected() {
        Map<String, Object> malformed = new HashMap<>();
        malformed.put("userId", "1 OR 1=1");
        assertThatThrownBy(() -> passkeyController.startRegistration(
                malformed, null, sessionOf(CLIENT_ID, UserRole.CLIENT)))
                .isInstanceOf(IllegalArgumentException.class);

        Map<String, Object> own = new HashMap<>();
        own.put("userId", String.valueOf(CLIENT_ID));
        own.put("deviceName", "device");
        when(passkeyService.startRegistration(CLIENT_ID, "device")).thenReturn(Map.of("success", true));
        passkeyController.startRegistration(own, null, sessionOf(CLIENT_ID, UserRole.CLIENT));
        verify(passkeyService).startRegistration(CLIENT_ID, "device");
    }

    @Test
    @DisplayName("SNS 연결 — 비로그인 401, 타인 id 403(서비스 호출 없음), 본인은 세션 id 로 연결")
    void linkSocial_scopedToSession() {
        assertThatThrownBy(() -> accountIntegrationController.linkSocialAccount(
                CLIENT_ID, "KAKAO", "provider-user", new MockHttpSession()))
                .isInstanceOf(UnauthorizedException.class);
        assertThatThrownBy(() -> accountIntegrationController.linkSocialAccount(
                OTHER_USER_ID, "KAKAO", "provider-user", sessionOf(CLIENT_ID, UserRole.CLIENT)))
                .isInstanceOf(AccessDeniedException.class);
        verify(accountIntegrationService, never()).linkSocialAccount(anyLong(), anyString(), anyString());

        when(accountIntegrationService.linkSocialAccount(CLIENT_ID, "KAKAO", "provider-user")).thenReturn(true);
        assertThat(accountIntegrationController.linkSocialAccount(
                null, "KAKAO", "provider-user", sessionOf(CLIENT_ID, UserRole.CLIENT))
                .getStatusCode().is2xxSuccessful()).isTrue();
        verify(accountIntegrationService).linkSocialAccount(eq(CLIENT_ID), eq("KAKAO"), eq("provider-user"));
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
