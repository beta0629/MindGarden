package com.coresolution.consultation.controller;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;

import com.coresolution.consultation.constant.oauth.OAuth2UserFacingMessages;
import com.coresolution.consultation.service.OAuth2FactoryService;
import com.coresolution.consultation.service.UserSessionService;
import com.coresolution.consultation.util.OAuth2DomainUtil;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.dto.ApiResponse;
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
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * P0 핫픽스: Kakao OAuth authorize/callback {@code redirect_uri} 정합 + 빈 code 조기 차단.
 *
 * <p>원인: authorize는 X-Forwarded-Host 우선, callback은 Host 우선이라 Host≠XFH 시
 * 토큰 교환 redirect_uri 불일치 → Kakao 4xx/KOE320.</p>
 *
 * @author MindGarden
 * @since 2026-10-28
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("OAuth2Controller Kakao redirect_uri hotfix")
class OAuth2ControllerKakaoRedirectUriHotfixTest {

    private static final String TENANT_ID = "tenant-kakao-redirect-hotfix";
    private static final String SUBDOMAIN = "mindgarden";
    private static final String APEX_HOST = "core-solution.co.kr";
    private static final String CONFIGURED_REDIRECT =
            "https://core-solution.co.kr/api/auth/kakao/callback";
    private static final String CALLBACK_PATH = "/api/auth/kakao/callback";

    @Mock private OAuth2FactoryService oauth2FactoryService;
    @Mock private PersonalDataEncryptionUtil encryptionUtil;
    @Mock private OAuth2DomainUtil oauth2DomainUtil;
    @Mock private com.coresolution.consultation.repository.UserRepository userRepository;
    @Mock private com.coresolution.consultation.service.JwtService jwtService;
    @Mock private com.coresolution.consultation.service.DynamicPermissionService dynamicPermissionService;
    @Mock private UserSessionService userSessionService;
    @Mock private com.coresolution.consultation.service.SystemConfigService systemConfigService;
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

    private String callResolveKakaoCallbackRedirectUri(MockHttpServletRequest request)
            throws Exception {
        Method method = OAuth2Controller.class.getDeclaredMethod(
                "resolveKakaoCallbackRedirectUri", jakarta.servlet.http.HttpServletRequest.class);
        method.setAccessible(true);
        return (String) method.invoke(controller, request);
    }

    private static String buildCompositeState(String tenantId, String nonce) {
        String encoded = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(tenantId.getBytes(StandardCharsets.UTF_8));
        return encoded + "." + nonce;
    }

    /**
     * 운영/프록시 재현: 브라우저 Host 는 내부 주소, X-Forwarded-Host 는 apex.
     */
    private MockHttpServletRequest mismatchedProxyRequest() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setMethod("GET");
        request.setRequestURI(CALLBACK_PATH);
        request.addHeader("Host", "127.0.0.1:8080");
        request.addHeader("X-Forwarded-Host", APEX_HOST);
        request.addHeader("X-Forwarded-Proto", "https");
        request.addHeader("X-Forwarded-Port", "443");
        request.setScheme("http");
        request.setServerName("127.0.0.1");
        request.setServerPort(8080);
        return request;
    }

    private void mockTenantLookup() {
        Tenant tenant = new Tenant();
        tenant.setTenantId(TENANT_ID);
        tenant.setSubdomain(SUBDOMAIN);
        when(tenantRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID))
                .thenReturn(Optional.of(tenant));
        when(tenantRepository.findBySubdomainIgnoreCase(SUBDOMAIN))
                .thenReturn(Optional.of(tenant));
        when(oauth2DomainUtil.convertToMainDomain(anyString())).thenReturn(APEX_HOST);
        when(oauth2DomainUtil.convertToMainDomain(APEX_HOST)).thenReturn(APEX_HOST);
        when(oauth2DomainUtil.convertToMainDomain("127.0.0.1")).thenReturn("127.0.0.1");
        when(oauth2DomainUtil.normalizeFrontendParentDomainForRedirect(anyString()))
                .thenReturn(APEX_HOST);
    }

    @Test
    @DisplayName("설정 kakaoRedirectUri 주입 시 Host≠XFH 여도 authorize·callback 동일 redirect_uri")
    void configuredRedirectUri_winsOverMismatchedHostHeaders() throws Exception {
        injectField("kakaoRedirectUri", CONFIGURED_REDIRECT);
        injectField("kakaoCallbackPath", CALLBACK_PATH);
        injectField("kakaoClientId", "test-kakao-client-id");
        injectField("kakaoScope", "profile_nickname,account_email");
        mockTenantLookup();
        when(environment.getActiveProfiles()).thenReturn(new String[] {"prod"});

        MockHttpServletRequest request = mismatchedProxyRequest();
        String fromHelper = callResolveKakaoCallbackRedirectUri(request);
        assertThat(fromHelper).isEqualTo(CONFIGURED_REDIRECT);

        // authorize: 세션 tenantId (Host 가 127.0.0.1 이라 서브도메인 추출 불가)
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("tenantId", TENANT_ID);
        ResponseEntity<?> authorizeResponse =
                controller.kakaoAuthorize(null, null, request, session);
        assertThat(authorizeResponse.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(authorizeResponse.getBody()).isInstanceOf(ApiResponse.class);
        @SuppressWarnings("unchecked")
        ApiResponse<Map<String, Object>> body =
                (ApiResponse<Map<String, Object>>) authorizeResponse.getBody();
        assertThat(body).isNotNull();
        assertThat(body.isSuccess()).isTrue();
        String authUrl = (String) body.getData().get("authUrl");
        assertThat(authUrl).contains("redirect_uri=");
        String encoded = authUrl.replaceAll(".*redirect_uri=([^&]+).*", "$1");
        String decoded = URLDecoder.decode(encoded, StandardCharsets.UTF_8);
        assertThat(decoded).isEqualTo(CONFIGURED_REDIRECT);

        // callback 헬퍼도 동일 (Host=127.0.0.1:8080, XFH=apex)
        MockHttpServletRequest callbackRequest = mismatchedProxyRequest();
        assertThat(callResolveKakaoCallbackRedirectUri(callbackRequest))
                .isEqualTo(CONFIGURED_REDIRECT)
                .isEqualTo(fromHelper);
    }

    @Test
    @DisplayName("kakaoRedirectUri 비어 있으면 X-Forwarded-Host 우선으로 authorize·callback 동일 URI")
    void emptyConfiguredUri_usesXForwardedHostForBothAuthorizeAndCallback() throws Exception {
        injectField("kakaoRedirectUri", "");
        injectField("kakaoCallbackPath", CALLBACK_PATH);
        mockTenantLookup();

        MockHttpServletRequest request = mismatchedProxyRequest();
        String redirectUri = callResolveKakaoCallbackRedirectUri(request);

        assertThat(redirectUri).isEqualTo("https://" + APEX_HOST + CALLBACK_PATH);
        // Host-only 였다면 127.0.0.1:8080 이 되었을 것 — XFH 우선 확인
        assertThat(redirectUri).doesNotContain("127.0.0.1");
        assertThat(redirectUri).doesNotContain(":8080");
    }

    @Test
    @DisplayName("kakaoCallback code=blank → Location에 인증코드없음, 토큰 서비스 미호출")
    void kakaoCallback_blankCode_redirectsWithoutCallingTokenService() throws Exception {
        mockTenantLookup();
        String state = buildCompositeState(TENANT_ID, "nonce-blank-code");

        MockHttpServletRequest request = mismatchedProxyRequest();
        request.addHeader("X-Forwarded-Host", APEX_HOST);

        ResponseEntity<?> response = controller.kakaoCallback(
                "   ",
                state,
                null,
                null,
                request,
                new MockHttpSession());

        assertThat(response.getStatusCode().value()).isEqualTo(302);
        String location = response.getHeaders().getFirst("Location");
        assertThat(location).isNotNull();
        assertThat(location).contains("/login?error=");
        assertThat(location).contains("provider=KAKAO");
        assertThat(location).contains(URLEncoder.encode(
                OAuth2UserFacingMessages.ERR_LOGIN_NO_AUTH_CODE, StandardCharsets.UTF_8));

        verify(oauth2FactoryService, never()).getOAuth2Service(anyString());
    }
}
