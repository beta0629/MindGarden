package com.coresolution.consultation.controller;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Optional;

import com.coresolution.consultation.constant.oauth.OAuth2UserFacingMessages;
import com.coresolution.consultation.service.OAuth2FactoryService;
import com.coresolution.consultation.service.UserSessionService;
import com.coresolution.consultation.util.OAuth2DomainUtil;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.domain.Tenant;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.coresolution.testsupport.SecurityContextIsolationExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * {@link OAuth2Controller#appleCallbackGet} P0 hotfix 단위 테스트 — Apple SIWA 콜백
 * GET fallback 매핑 회귀 방지 (2026-06-11).
 *
 * <p>배경: Apple 이 재로그인/즉시 통과 케이스에서 {@code response_mode=form_post} 를 무시하고
 * {@code code}+{@code state} 만 query string 에 담아 GET redirect 로 보내는 동작이 알려져 있어
 * BE 에 GET 매핑이 없으면 405 METHOD_NOT_ALLOWED 가 발생한다. 본 테스트는:
 * <ol>
 *   <li>{@code GET /api/v1/auth/apple/callback?error=user_cancelled} → 302 error redirect</li>
 *   <li>{@code GET /api/v1/auth/apple/callback} (code/state 누락) → 302 NO_AUTH_CODE redirect</li>
 *   <li>{@code GET /api/v1/auth/apple/callback?code=...&state=...} (state 검증 실패) → 302
 *       SECURITY_VERIFICATION_FAILED redirect — POST 핸들러 위임이 정상 동작함을 검증</li>
 *   <li>기존 {@code @PostMapping(consumes=form-urlencoded)} 매핑 회귀 0 — 시그니처가 그대로 유지</li>
 * </ol>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@ExtendWith({MockitoExtension.class, SecurityContextIsolationExtension.class})
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("OAuth2Controller#appleCallbackGet — GET fallback 위임 (405 hotfix)")
class OAuth2ControllerAppleCallbackGetTest {

    private static final String TENANT_ID = "tenant-apple-get-fallback";
    private static final String SUBDOMAIN = "mindgarden";
    private static final String SUBDOMAIN_HOST = "mindgarden.core-solution.co.kr";

    @Mock private OAuth2FactoryService oauth2FactoryService;
    @Mock private PersonalDataEncryptionUtil encryptionUtil;
    @Mock private OAuth2DomainUtil oauth2DomainUtil;
    @Mock private com.coresolution.consultation.repository.UserRepository userRepository;
    @Mock private com.coresolution.consultation.service.JwtService jwtService;
    @Mock private com.coresolution.consultation.service.DynamicPermissionService dynamicPermissionService;
    @Mock private UserSessionService userSessionService;
    @Mock private com.coresolution.core.repository.TenantRepository tenantRepository;
    @Mock private org.springframework.core.env.Environment environment;
    @Mock private com.coresolution.consultation.service.AppleSignInService appleSignInService;

    @InjectMocks
    private OAuth2Controller controller;

    private void injectField(String fieldName, Object value) throws Exception {
        Field field = OAuth2Controller.class.getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(controller, value);
    }

    /**
     * state 형식: {@code base64url(tenantId)} + {@code .} + {@code nonce}
     */
    private static String buildCompositeState(String tenantId, String nonce) {
        String encoded = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(tenantId.getBytes(StandardCharsets.UTF_8));
        return encoded + "." + nonce;
    }

    private MockHttpServletRequest tenantSubdomainRequest() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setMethod("GET");
        request.setRequestURI("/api/v1/auth/apple/callback");
        request.addHeader("Host", SUBDOMAIN_HOST);
        request.addHeader("X-Forwarded-Proto", "https");
        request.addHeader("X-Forwarded-Port", "443");
        request.setScheme("https");
        request.setServerName(SUBDOMAIN_HOST);
        request.setServerPort(443);
        return request;
    }

    private void mockTenantLookup(String tenantId) {
        Tenant tenant = new Tenant();
        tenant.setTenantId(tenantId);
        tenant.setSubdomain(SUBDOMAIN);
        when(tenantRepository.findByTenantIdAndIsDeletedFalse(tenantId))
                .thenReturn(Optional.of(tenant));
        when(oauth2DomainUtil.normalizeFrontendParentDomainForRedirect("core-solution.co.kr"))
                .thenReturn("core-solution.co.kr");
    }

    @Test
    @DisplayName("GET ?error=user_cancelled → 302 error redirect (provider=APPLE)")
    void appleCallbackGet_errorParam_redirectsToLoginWithError() throws Exception {
        mockTenantLookup(TENANT_ID);
        String state = buildCompositeState(TENANT_ID, "nonce-1");

        ResponseEntity<?> response = controller.appleCallbackGet(
                /* code */ null,
                /* state */ state,
                /* idToken */ null,
                /* userJson */ null,
                /* error */ "user_cancelled",
                /* errorDescription */ "사용자가 취소함",
                /* mode */ null,
                tenantSubdomainRequest(),
                new MockHttpSession());

        assertThat(response.getStatusCode().value()).isEqualTo(302);
        String location = response.getHeaders().getFirst("Location");
        assertThat(location).isNotNull();
        assertThat(location).contains("/login?error=");
        assertThat(location).contains("provider=APPLE");
        assertThat(location).contains(URLEncoder.encode("user_cancelled", StandardCharsets.UTF_8));
    }

    @Test
    @DisplayName("GET (code/state 누락) → 302 ERR_LOGIN_NO_AUTH_CODE redirect")
    void appleCallbackGet_missingCode_redirectsToLoginWithNoAuthCode() throws Exception {
        mockTenantLookup(TENANT_ID);
        String state = buildCompositeState(TENANT_ID, "nonce-2");

        ResponseEntity<?> response = controller.appleCallbackGet(
                /* code */ null,
                /* state */ state,
                /* idToken */ null,
                /* userJson */ null,
                /* error */ null,
                /* errorDescription */ null,
                /* mode */ null,
                tenantSubdomainRequest(),
                new MockHttpSession());

        assertThat(response.getStatusCode().value()).isEqualTo(302);
        String location = response.getHeaders().getFirst("Location");
        assertThat(location).isNotNull();
        assertThat(location).contains("/login?error=");
        assertThat(location).contains("provider=APPLE");
        assertThat(location).contains(URLEncoder.encode(
                OAuth2UserFacingMessages.ERR_LOGIN_NO_AUTH_CODE, StandardCharsets.UTF_8));
    }

    @Test
    @DisplayName("GET ?code=...&state=... + 세션 state mismatch → 302 SECURITY_VERIFICATION_FAILED (POST 위임 동작)")
    void appleCallbackGet_codeAndStatePresent_delegatesToPostHandler() throws Exception {
        mockTenantLookup(TENANT_ID);
        String callbackState = buildCompositeState(TENANT_ID, "nonce-3-callback");
        String savedStateInSession = buildCompositeState(TENANT_ID, "nonce-3-different");

        // 세션의 savedState 와 callback state 의 nonce 가 다르면 prefixedOAuthSavedStateMatches 가
        // false 를 반환해 SECURITY_VERIFICATION_FAILED 로 redirect 된다 — POST 위임이 정상 동작했음을 의미.
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("oauth2_apple_state", savedStateInSession);

        ResponseEntity<?> response = controller.appleCallbackGet(
                /* code */ "apple-auth-code-xyz",
                /* state */ callbackState,
                /* idToken */ null,
                /* userJson */ null,
                /* error */ null,
                /* errorDescription */ null,
                /* mode */ null,
                tenantSubdomainRequest(),
                session);

        assertThat(response.getStatusCode().value()).isEqualTo(302);
        String location = response.getHeaders().getFirst("Location");
        assertThat(location).isNotNull();
        assertThat(location).contains("/login?error=");
        assertThat(location).contains("provider=APPLE");
        assertThat(location).contains(URLEncoder.encode(
                OAuth2UserFacingMessages.ERR_LOGIN_SECURITY_VERIFICATION_FAILED,
                StandardCharsets.UTF_8));

        // 위임 후 session 에서 oauth2_apple_state 가 정리되어야 한다 (POST 핸들러 동작과 정합).
        assertThat(session.getAttribute("oauth2_apple_state")).isNull();
    }

    @Test
    @DisplayName("매핑 회귀 0: @GetMapping(\"/apple/callback\") + @PostMapping(consumes=form-urlencoded) 공존")
    void appleCallback_routes_coexist_withoutRegression() throws Exception {
        Method getHandler = OAuth2Controller.class.getMethod("appleCallbackGet",
                String.class, String.class, String.class, String.class, String.class,
                String.class, String.class,
                jakarta.servlet.http.HttpServletRequest.class, HttpSession.class);
        GetMapping getMapping = getHandler.getAnnotation(GetMapping.class);
        assertThat(getMapping).as("appleCallbackGet 에 @GetMapping 이 있어야 한다").isNotNull();
        assertThat(getMapping.value()).contains("/apple/callback");

        Method postHandler = OAuth2Controller.class.getMethod("appleCallback",
                String.class, String.class, String.class, String.class, String.class,
                String.class,
                jakarta.servlet.http.HttpServletRequest.class, HttpSession.class);
        PostMapping postMapping = postHandler.getAnnotation(PostMapping.class);
        assertThat(postMapping).as("기존 appleCallback 의 @PostMapping 매핑은 그대로 유지되어야 한다 (회귀 0)")
                .isNotNull();
        assertThat(postMapping.value()).contains("/apple/callback");
        assertThat(postMapping.consumes())
                .as("기존 form-urlencoded consumes 는 그대로 유지되어야 한다")
                .contains(MediaType.APPLICATION_FORM_URLENCODED_VALUE);
    }
}
