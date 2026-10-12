package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.AccountIntegrationResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.UnauthorizedException;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AccountIntegrationService;
import com.coresolution.consultation.service.support.ClientPathAccessGuard;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.access.AccessDeniedException;

@DisplayName("계정 연동 status — 로그인·본인 이메일·최소 응답")
class AccountIntegrationControllerStatusGuardTest {

    private static final String OWN_EMAIL = "own@example.com";

    private final AccountIntegrationService service = mock(AccountIntegrationService.class);
    private final ClientPathAccessGuard guard = new ClientPathAccessGuard(
        mock(ConsultantClientMappingRepository.class), mock(UserRepository.class));
    private final AccountIntegrationController controller = new AccountIntegrationController(service, guard);

    @Test
    @DisplayName("비로그인은 401(UnauthorizedException), 서비스 미호출")
    void status_anonymous_unauthorized() {
        assertThatThrownBy(() -> controller.checkIntegrationStatus(OWN_EMAIL, new MockHttpSession()))
            .isInstanceOf(UnauthorizedException.class);
        verifyNoInteractions(service);
    }

    @Test
    @DisplayName("타인 이메일은 403")
    void status_otherEmail_forbidden() {
        assertThatThrownBy(() -> controller.checkIntegrationStatus("victim@example.com", session()))
            .isInstanceOf(AccessDeniedException.class);
        verifyNoInteractions(service);
    }

    @Test
    @DisplayName("본인 이메일은 연동 여부만 응답")
    void status_ownEmail_minimalResponse() {
        when(service.checkIntegrationStatus(OWN_EMAIL)).thenReturn(AccountIntegrationResponse.builder()
            .success(true).status(AccountIntegrationResponse.IntegrationStatus.SUCCESS).build());

        AccountIntegrationResponse body = controller.checkIntegrationStatus(OWN_EMAIL.toUpperCase(), session()).getBody();

        assertThat(body).isNotNull();
        assertThat(body.isSuccess()).isTrue();
        assertThat(body.getEmail()).isNull();
        assertThat(body.getName()).isNull();
        assertThat(body.getRole()).isNull();
        assertThat(body.getSocialAccountInfo()).isNull();
    }

    private MockHttpSession session() {
        User user = new User();
        user.setId(5L);
        user.setEmail(OWN_EMAIL);
        user.setRole(UserRole.CLIENT);
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionConstants.USER_OBJECT, user);
        return session;
    }
}
