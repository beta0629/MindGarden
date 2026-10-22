package com.coresolution.consultation.utils;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.util.AccessTokenRevocationRequestMarker;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * SessionUtils — Access 토큰 폐기 마커 가드 및 세션 User 조회 회귀.
 *
 * @author MindGarden
 * @since 2026-10-22
 */
@DisplayName("SessionUtils")
class SessionUtilsTest {

    private User sessionUser;
    private MockHttpSession httpSession;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        sessionUser = User.builder()
                .userId("user-" + suffix)
                .email("session-" + suffix + "@example.com")
                .role(UserRole.CLIENT)
                .isActive(true)
                .isPasswordChanged(true)
                .lifecycleState(LifecycleState.ACTIVE)
                .build();
        sessionUser.setId(Math.abs(UUID.randomUUID().getMostSignificantBits()));
        sessionUser.setTenantId("tenant-" + suffix);

        httpSession = new MockHttpSession(null, "sess-" + suffix);
        httpSession.setAttribute(SessionConstants.USER_OBJECT, sessionUser);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    @DisplayName("마커 있음 + 세션에 User → getCurrentUser null")
    void getCurrentUser_whenRevocationMarked_returnsNullDespiteSessionUser() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/public/health");
        AccessTokenRevocationRequestMarker.mark(request);
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        assertThat(SessionUtils.getCurrentUser(httpSession)).isNull();
        assertThat(SessionUtils.isLoggedIn(httpSession)).isFalse();
    }

    @Test
    @DisplayName("마커 없음 + 세션에 User → User 반환(회귀)")
    void getCurrentUser_whenUnmarked_returnsSessionUser() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/clients/me");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        User actual = SessionUtils.getCurrentUser(httpSession);

        assertThat(actual).isSameAs(sessionUser);
        assertThat(SessionUtils.isLoggedIn(httpSession)).isTrue();
    }

    @Test
    @DisplayName("RequestAttributes 없음 + 세션에 User → User 반환(회귀)")
    void getCurrentUser_whenNoRequestAttributes_returnsSessionUser() {
        RequestContextHolder.resetRequestAttributes();

        assertThat(SessionUtils.getCurrentUser(httpSession)).isSameAs(sessionUser);
    }

    @Test
    @DisplayName("공개 경로: 폐기 Bearer 마커 + 살아 있는 세션 → 사용자 미노출")
    void getCurrentUser_publicPathRevokedBearerWithLiveSession_hidesUser() {
        MockHttpServletRequest request = new MockHttpServletRequest(
                "GET",
                "/api/v1/public/notice/" + UUID.randomUUID());
        AccessTokenRevocationRequestMarker.mark(request);
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        assertThat(AccessTokenRevocationRequestMarker.isMarked(request)).isTrue();
        assertThat(httpSession.getAttribute(SessionConstants.USER_OBJECT)).isEqualTo(sessionUser);
        assertThat(SessionUtils.getCurrentUser(httpSession)).isNull();
        assertThat(SessionUtils.isLoggedIn(httpSession)).isFalse();
        assertThat(SessionUtils.getRole(httpSession)).isNull();
    }
}
