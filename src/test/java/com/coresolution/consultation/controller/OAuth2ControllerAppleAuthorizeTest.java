package com.coresolution.consultation.controller;

import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Optional;
import com.coresolution.consultation.service.OAuth2FactoryService;
import com.coresolution.consultation.service.UserSessionService;
import com.coresolution.consultation.util.OAuth2DomainUtil;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.domain.Tenant;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpSession;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * {@link OAuth2Controller#appleAuthorize} 단위 테스트 — Apple SIWA server-side auth-code
 * 흐름의 authorize URL 생성 회귀 방지 (Google PR #204 패턴 정합, 2026-06-11).
 *
 * <p>검증 포인트:
 * <ol>
 *   <li>state 가 {@code base64url(tenantId)+nonce} 복합 형식으로 인코딩된다.</li>
 *   <li>redirect_uri 가 apex 메인 도메인으로 변환된다 (테넌트 서브도메인 → apex).</li>
 *   <li>authorize URL 에 {@code response_mode=form_post}, {@code scope=name email},
 *       {@code nonce}, state 가 모두 포함된다.</li>
 *   <li>session 에 {@code oauth2_apple_state}, {@code oauth2_apple_nonce},
 *       {@code oauth2_tenant_id} 가 저장된다.</li>
 * </ol>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("OAuth2Controller#appleAuthorize — server-side auth-code (Google PR #204 패턴)")
class OAuth2ControllerAppleAuthorizeTest {

    private static final String TENANT_ID = "tenant-apple-server-side";
    private static final String SUBDOMAIN = "mindgarden";
    private static final String APPLE_CLIENT_ID = "co.kr.coresolution.app.signin";
    private static final String SUBDOMAIN_HOST = "mindgarden.core-solution.co.kr";
    private static final String APEX_HOST = "core-solution.co.kr";

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

    private void seedAppleConfigs() throws Exception {
        injectField("appleClientId", APPLE_CLIENT_ID);
        injectField("appleRedirectUri", "https://core-solution.co.kr/api/v1/auth/apple/callback");
        injectField("appleScope", "name email");
        injectField("appleCallbackPath", "/api/v1/auth/apple/callback");
    }

    @Test
    @DisplayName("apex authorize URL 생성: response_mode=form_post + state(base64+nonce) + scope=name email")
    void appleAuthorize_buildsApexAuthorizeUrlWithFormPostAndState() throws Exception {
        seedAppleConfigs();
        Tenant tenant = new Tenant();
        tenant.setTenantId(TENANT_ID);
        when(tenantRepository.findBySubdomainIgnoreCase(SUBDOMAIN)).thenReturn(Optional.of(tenant));
        when(oauth2DomainUtil.convertToMainDomain(SUBDOMAIN_HOST)).thenReturn(APEX_HOST);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Host", SUBDOMAIN_HOST);
        request.addHeader("X-Forwarded-Proto", "https");
        request.addHeader("X-Forwarded-Port", "443");
        request.setScheme("https");
        request.setServerName(SUBDOMAIN_HOST);
        request.setServerPort(443);
        MockHttpSession session = new MockHttpSession();

        ResponseEntity<?> response = controller.appleAuthorize(null, null, request, session);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isInstanceOf(ApiResponse.class);
        @SuppressWarnings("unchecked")
        ApiResponse<java.util.Map<String, Object>> envelope =
                (ApiResponse<java.util.Map<String, Object>>) response.getBody();
        assertThat(envelope.isSuccess()).isTrue();
        java.util.Map<String, Object> data = envelope.getData();
        assertThat(data).containsKey("authUrl").containsKey("state").containsKey("nonce");
        assertThat(data.get("provider")).isEqualTo("APPLE");

        String authUrl = (String) data.get("authUrl");
        String state = (String) data.get("state");
        String nonce = (String) data.get("nonce");

        assertThat(authUrl).startsWith("https://appleid.apple.com/auth/authorize?");
        assertThat(authUrl).contains("client_id=" + APPLE_CLIENT_ID);
        assertThat(authUrl).contains("response_type=code");
        assertThat(authUrl).contains("response_mode=form_post");
        assertThat(authUrl).contains("scope=name%20email");
        assertThat(authUrl).contains("redirect_uri=https%3A%2F%2Fcore-solution.co.kr"
                + "%2Fapi%2Fv1%2Fauth%2Fapple%2Fcallback");
        // state · nonce 가 URL 에 포함된다.
        assertThat(authUrl).contains("state=");
        assertThat(authUrl).contains("nonce=");

        // state 형식: base64url(tenantId) + "." + uuid
        assertThat(state).contains(".");
        String encodedTenantId = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(TENANT_ID.getBytes(StandardCharsets.UTF_8));
        assertThat(state).startsWith(encodedTenantId + ".");
        assertThat(nonce).isNotBlank();

        // session 에 state·nonce·tenantId 가 저장된다.
        assertThat(session.getAttribute("oauth2_apple_state")).isEqualTo(state);
        assertThat(session.getAttribute("oauth2_apple_nonce")).isEqualTo(nonce);
        assertThat(session.getAttribute("oauth2_tenant_id")).isEqualTo(TENANT_ID);
    }

    @Test
    @DisplayName("APPLE_CLIENT_ID 미주입 → 400 + APPLE_CLIENT_ID_MISSING")
    void appleAuthorize_missingClientId_returnsBadRequest() throws Exception {
        injectField("appleClientId", "");
        injectField("appleRedirectUri", "");
        injectField("appleScope", "name email");
        injectField("appleCallbackPath", "/api/v1/auth/apple/callback");
        Tenant tenant = new Tenant();
        tenant.setTenantId(TENANT_ID);
        when(tenantRepository.findBySubdomainIgnoreCase(SUBDOMAIN)).thenReturn(Optional.of(tenant));
        when(oauth2DomainUtil.convertToMainDomain(SUBDOMAIN_HOST)).thenReturn(APEX_HOST);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Host", SUBDOMAIN_HOST);
        MockHttpSession session = new MockHttpSession();

        ResponseEntity<?> response = controller.appleAuthorize(null, null, request, session);

        assertThat(response.getStatusCode().value()).isEqualTo(400);
    }

    @Test
    @DisplayName("서브도메인 없음 (apex 직접 접근) → TENANT_REQUIRED 400")
    void appleAuthorize_noSubdomain_returnsTenantRequired() throws Exception {
        seedAppleConfigs();
        when(environment.getActiveProfiles()).thenReturn(new String[]{"prod"});

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Host", APEX_HOST);
        MockHttpSession session = new MockHttpSession();

        ResponseEntity<?> response = controller.appleAuthorize(null, null, request, session);

        assertThat(response.getStatusCode().value()).isEqualTo(400);
    }
}
