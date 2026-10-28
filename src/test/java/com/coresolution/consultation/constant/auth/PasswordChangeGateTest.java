package com.coresolution.consultation.constant.auth;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.constant.SessionConstants;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockHttpSession;

/**
 * 비밀번호 변경 전 허용 경로.
 *
 * @author MindGarden
 * @since 2026-10-14
 */
@DisplayName("PasswordChangeGate")
class PasswordChangeGateTest {

    @Test
    @DisplayName("OAuth 세션 속성이 있으면 비밀번호 변경 게이트 면제")
    void oauthSessionIsExempt() {
        MockHttpSession oauthSession = new MockHttpSession();
        oauthSession.setAttribute(SessionConstants.OAUTH_LOGIN, Boolean.TRUE);
        assertThat(PasswordChangeGate.isExemptFromPasswordChange(oauthSession)).isTrue();

        MockHttpSession emailSession = new MockHttpSession();
        assertThat(PasswordChangeGate.isExemptFromPasswordChange(emailSession)).isFalse();
        assertThat(PasswordChangeGate.isExemptFromPasswordChange(null)).isFalse();
    }

    @Test
    @DisplayName("변경·로그아웃·현재 사용자·리프레시만 허용하고 그 외는 거부")
    void allowlistIsExact() throws Exception {
        assertThat(PasswordChangeGate.isAllowed(request("POST", "/api/v1/auth/password/change"))).isTrue();
        assertThat(PasswordChangeGate.isAllowed(request("GET", "/api/v1/auth/password/requirements"))).isTrue();
        assertThat(PasswordChangeGate.isAllowed(request("POST", "/api/v1/auth/password/validate"))).isTrue();
        assertThat(PasswordChangeGate.isAllowed(request("POST", "/api/v1/auth/logout"))).isTrue();
        assertThat(PasswordChangeGate.isAllowed(request("GET", "/api/v1/auth/current-user"))).isTrue();
        assertThat(PasswordChangeGate.isAllowed(request("POST", "/api/v1/auth/refresh-token"))).isTrue();
        assertThat(PasswordChangeGate.isAllowed(request("OPTIONS", "/api/v1/schedules"))).isTrue();

        assertThat(PasswordChangeGate.isAllowed(request("GET", "/api/v1/auth/password/change"))).isFalse();
        assertThat(PasswordChangeGate.isAllowed(request("GET", "/api/v1/schedules"))).isFalse();
        assertThat(PasswordChangeGate.isAllowed(request("POST", "/api/v1/auth/logout/extra"))).isFalse();
        assertThat(PasswordChangeGate.isAllowed(request("GET", "/api/v1/auth/session-info"))).isFalse();
        assertThat(PasswordChangeGate.isAllowed(null)).isFalse();
    }

    @Test
    @DisplayName("컨텍스트 경로와 끝 슬래시는 같은 경로로 본다")
    void normalizesContextAndTrailingSlash() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/app/api/v1/auth/current-user/");
        request.setContextPath("/app");
        assertThat(PasswordChangeGate.isAllowed(request)).isTrue();
    }

    @Test
    @DisplayName("403 본문은 코드만 담고 성공이 아니다")
    void forbiddenBodyUsesErrorCode() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        PasswordChangeGate.writeForbidden(response);
        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentAsString())
                .contains("\"success\":false")
                .contains(PasswordChangeGate.ERROR_CODE);
    }

    private static MockHttpServletRequest request(String method, String path) {
        return new MockHttpServletRequest(method, path);
    }
}
