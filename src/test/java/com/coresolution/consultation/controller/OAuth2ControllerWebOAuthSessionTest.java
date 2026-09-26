package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.lang.reflect.Method;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.coresolution.consultation.config.SessionCookieSupport;
import com.coresolution.consultation.config.SessionTimeoutProperties;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AppleSignInService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.OAuth2FactoryService;
import com.coresolution.consultation.service.UserSessionService;
import com.coresolution.consultation.util.OAuth2DomainUtil;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.repository.TenantRepository;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpSession;

/**
 * 웹 OAuth 성공 경로에서 {@code user_sessions}({@link UserSessionService#createSession}) 생성을 검증한다.
 * <p>SessionBasedAuthenticationFilter 는 DB 활성 세션이 없으면 HttpSession 을 클리어하므로,
 * 카카오/네이버/구글/애플 웹 콜백은 비밀번호·{@code /social-login} 과 동일하게 createSession 이 필요하다.</p>
 *
 * @author MindGarden
 * @since 2026-09-17
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("OAuth2Controller — 웹 OAuth createSession (SNS 로그인 세션 게이트)")
class OAuth2ControllerWebOAuthSessionTest {

    private static final String TENANT_ID = "tenant-oauth-web-session";
    private static final long USER_ID = 77L;
    private static final int TIMEOUT_SECONDS = 3600;

    @Mock
    private OAuth2FactoryService oauth2FactoryService;
    @Mock
    private PersonalDataEncryptionUtil encryptionUtil;
    @Mock
    private OAuth2DomainUtil oauth2DomainUtil;
    @Mock
    private UserRepository userRepository;
    @Mock
    private JwtService jwtService;
    @Mock
    private DynamicPermissionService dynamicPermissionService;
    @Mock
    private UserSessionService userSessionService;
    @Mock
    private com.coresolution.consultation.service.RefreshTokenService refreshTokenService;
    @Mock
    private com.coresolution.consultation.service.SystemConfigService systemConfigService;
    @Mock
    private TenantRepository tenantRepository;
    @Mock
    private Environment environment;
    @Mock
    private AppleSignInService appleSignInService;
    @Mock
    private SessionTimeoutProperties sessionTimeoutProperties;
    @Mock
    private SessionCookieSupport sessionCookieSupport;

    private final MeterRegistry meterRegistry = new SimpleMeterRegistry();

    @InjectMocks
    private OAuth2Controller controller;

    @BeforeEach
    void setUp() {
        when(sessionTimeoutProperties.getTimeoutSeconds()).thenReturn(TIMEOUT_SECONDS);
        when(systemConfigService.isDuplicateLoginAllowedForTenant(any())).thenReturn(true);
    }

    private User sampleUser() {
        User user = new User();
        user.setId(USER_ID);
        user.setEmail("oauth-web-session@example.com");
        user.setName("OAuth세션");
        user.setNickname("oauth");
        user.setRole(UserRole.CLIENT);
        user.setTenantId(TENANT_ID);
        return user;
    }

    @Test
    @DisplayName("persistOAuthDbUserSession: createSession(SOCIAL, provider) 호출")
    void persistOAuthDbUserSession_callsCreateSession() throws Exception {
        User user = sampleUser();
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("203.0.113.10");
        request.addHeader("User-Agent", "Mozilla/5.0 OAuthWebTest");
        MockHttpSession session = new MockHttpSession();

        Method method = OAuth2Controller.class.getDeclaredMethod("persistOAuthDbUserSession",
                HttpServletRequest.class, HttpSession.class, User.class, String.class);
        method.setAccessible(true);
        method.invoke(controller, request, session, user, "KAKAO");

        verify(userSessionService).createSession(eq(user), eq(session.getId()), eq("203.0.113.10"),
                eq("Mozilla/5.0 OAuthWebTest"), eq("SOCIAL"), eq("KAKAO"));
    }

    @Test
    @DisplayName("persistOAuthDbUserSession: null user 이면 createSession 미호출")
    void persistOAuthDbUserSession_skipsWhenUserNull() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpSession session = new MockHttpSession();

        Method method = OAuth2Controller.class.getDeclaredMethod("persistOAuthDbUserSession",
                HttpServletRequest.class, HttpSession.class, User.class, String.class);
        method.setAccessible(true);
        method.invoke(controller, request, session, null, "NAVER");

        verify(userSessionService, never()).createSession(any(), anyString(), anyString(),
                anyString(), anyString(), anyString());
        verify(userSessionService, never()).createSession(any(), anyString(), anyString(),
                anyString(), anyString(), isNull());
    }

    @Test
    @DisplayName("mobileOAuth2Callback: 세션 확립 시 createSession 호출 (필터 게이트 정합)")
    void mobileOAuth2Callback_createsDbUserSession() {
        User user = sampleUser();
        when(userRepository.findByTenantIdAndIdIgnoringDeleted(eq(TENANT_ID), eq(USER_ID)))
                .thenReturn(Optional.of(user));

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("198.51.100.20");
        request.addHeader("User-Agent", "MindGardenMobile/1.0");
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("oauth2_tenant_id", TENANT_ID);
        request.setSession(session);

        Map<String, Object> body = new HashMap<>();
        body.put("provider", "KAKAO");
        body.put("userId", String.valueOf(USER_ID));

        ResponseEntity<?> response = controller.mobileOAuth2Callback(body, request, session);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        verify(userSessionService).createSession(eq(user), eq(session.getId()),
                eq("198.51.100.20"), eq("MindGardenMobile/1.0"), eq("SOCIAL"), eq("KAKAO"));
    }

    @Test
    @DisplayName("소스 회귀: 카카오/네이버/구글/애플 웹 성공 분기에 persistOAuthDbUserSession·issueWebOAuthJwtPair 존재")
    void webOAuthSuccessPaths_containPersistOAuthDbUserSession() throws Exception {
        Path controllerSource = Path.of("src/main/java/com/coresolution/consultation/controller/OAuth2Controller.java");
        String source = Files.readString(controllerSource);

        assertThat(source).contains("persistOAuthDbUserSession(request, session, user, naverProviderForSession)");
        assertThat(source).contains("persistOAuthDbUserSession(request, session, user, \"KAKAO\")");
        assertThat(source).contains("persistOAuthDbUserSession(request, session, user, \"GOOGLE\")");
        assertThat(source).contains("persistOAuthDbUserSession(request, sessionForLogin, appleSessionUser, \"APPLE\")");
        assertThat(source).contains("rotateWebOAuthSession");
        assertThat(source).contains("issueWebOAuthJwtPair");
        assertThat(source).contains("storeWebOAuthJwtPairInSession");
        assertThat(source).contains("claimWebOAuthSessionTokens");
        assertThat(source).contains("/oauth2/web-session-tokens");
        assertThat(source).contains("naverJwtPair");
        assertThat(source).contains("kakaoJwtPair");
        assertThat(source).contains("googleJwtPair");
        assertThat(source).contains("appleJwtPair");
        assertThat(source).doesNotContain("SessionUtils.clearSession");
        assertThat(source).doesNotContain(".header(\"Set-Cookie\", cookieValue)");
        // URL 쿼리에 JWT 금지 — 세션 1회 교환 SSOT
        assertThat(source).doesNotContain("sb.append(\"&accessToken=\")");
        assertThat(source).doesNotContain("sb.append(\"&refreshToken=\")");
    }

    @Test
    @DisplayName("rotateWebOAuthSession: 세션을 무효화하지 않고 ID 만 바꾼다")
    void rotateWebOAuthSession_changesIdWithoutInvalidate() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpSession session = new MockHttpSession();
        request.setSession(session);
        String before = session.getId();

        Method method = OAuth2Controller.class.getDeclaredMethod("rotateWebOAuthSession",
                HttpServletRequest.class, HttpSession.class);
        method.setAccessible(true);
        HttpSession rotated = (HttpSession) method.invoke(controller, request, session);

        assertThat(rotated.getId()).isNotEqualTo(before);
        assertThat(session.isInvalid()).isFalse();
    }

    @Test
    @DisplayName("FE 회귀: OAuth2Callback 는 웹 세션 JWT 교환·서버 검증 후에만 로그인")
    void oauth2Callback_hasNoPlaceholderTokens() throws Exception {
        Path callbackSource = Path.of("frontend/src/components/auth/OAuth2Callback.js");
        String source = Files.readString(callbackSource);

        assertThat(source).doesNotContain("oauth2_token");
        assertThat(source).doesNotContain("oauth2_refresh_token");
        assertThat(source).contains("oauthSessionTokens");
        assertThat(source).contains("OAUTH_ACCESS_TOKEN_REQUIRED_MESSAGE");
        assertThat(source).contains("requireServerVerify: true");
        assertThat(source).contains("OAUTH2_WEB_SESSION_TOKENS");
        assertThat(source).doesNotContain("searchParams.get('accessToken')");
        assertThat(source).doesNotContain("accessToken: oauthAccessToken");
    }

    @Test
    @DisplayName("claimWebOAuthSessionTokens: 세션 JWT 1회 반환 후 속성 제거")
    void claimWebOAuthSessionTokens_returnsAndClears() {
        User user = sampleUser();
        MockHttpSession session = new MockHttpSession();
        SessionUtils.setCurrentUser(session, user);
        session.setAttribute(OAuth2Controller.SESSION_ATTR_WEB_OAUTH_ACCESS_TOKEN, "access-jwt");
        session.setAttribute(OAuth2Controller.SESSION_ATTR_WEB_OAUTH_REFRESH_TOKEN, "refresh-jwt");

        ResponseEntity<?> response = controller.claimWebOAuthSessionTokens(session);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        @SuppressWarnings("unchecked")
        com.coresolution.core.dto.ApiResponse<Map<String, Object>> body =
                (com.coresolution.core.dto.ApiResponse<Map<String, Object>>) response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.isSuccess()).isTrue();
        assertThat(body.getData().get("accessToken")).isEqualTo("access-jwt");
        assertThat(body.getData().get("refreshToken")).isEqualTo("refresh-jwt");
        assertThat(session.getAttribute(OAuth2Controller.SESSION_ATTR_WEB_OAUTH_ACCESS_TOKEN)).isNull();
        assertThat(session.getAttribute(OAuth2Controller.SESSION_ATTR_WEB_OAUTH_REFRESH_TOKEN)).isNull();
    }

    @Test
    @DisplayName("issueWebOAuthJwtPair: generateToken·refreshToken·createRefreshToken 호출")
    void issueWebOAuthJwtPair_issuesAndPersistsTokens() throws Exception {
        User user = sampleUser();
        MockHttpServletRequest request = new MockHttpServletRequest();
        when(dynamicPermissionService.getUserPermissionsAsStringList(any())).thenReturn(List.of());
        when(jwtService.generateToken(eq(user), any())).thenReturn("access-jwt-web-oauth");
        when(jwtService.generateRefreshToken(eq(user))).thenReturn("refresh-jwt-web-oauth");

        Method method = OAuth2Controller.class.getDeclaredMethod("issueWebOAuthJwtPair",
                User.class, HttpServletRequest.class);
        method.setAccessible(true);
        String[] pair = (String[]) method.invoke(controller, user, request);

        assertThat(pair).containsExactly("access-jwt-web-oauth", "refresh-jwt-web-oauth");
        verify(refreshTokenService).createRefreshToken(eq(user), eq("refresh-jwt-web-oauth"), eq(request));
    }
}
