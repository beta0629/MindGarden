package com.coresolution.consultation.service.impl;

import java.util.HashMap;
import java.util.Map;
import com.coresolution.consultation.dto.SocialUserInfo;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.UserSocialAccountRepository;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.security.PasswordService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.startsWith;
import static org.mockito.Mockito.when;

/**
 * {@link GoogleOAuth2ServiceImpl} 단위 테스트 — P0 (2026-06-10) idToken 폴백 경로 검증.
 *
 * <p>TestFlight {@code 1.0.7 (14)} 빌드에서 Google 로그인 시 "Google 로그인 응답에서 accessToken
 * 을 찾을 수 없습니다" 빨간 에러가 노출되어 로그인이 차단된 P0 회귀에 대한 sentinel 테스트.
 * BE 가 idToken-only 흐름을 안전하게 처리하는지 보장한다.</p>
 *
 * <p>검증 시나리오:
 *  <ul>
 *    <li>{@code getUserInfoFromIdToken} 가 Google {@code tokeninfo} 엔드포인트를 호출하여 claims 를 받고
 *        {@link SocialUserInfo} 로 변환한다.</li>
 *    <li>name 누락 시 given_name + family_name 조합으로 폴백한다.</li>
 *    <li>{@code sub} claim 이 없으면 {@link RuntimeException} 으로 차단한다 (검증 실패 케이스).</li>
 *    <li>토큰이 비어 있으면 {@link IllegalArgumentException} 으로 차단한다.</li>
 *  </ul>
 * </p>
 *
 * @author MindGarden
 * @since 2026-06-10
 */
@ExtendWith(MockitoExtension.class)
class GoogleOAuth2ServiceImplTest {

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private UserSocialAccountRepository userSocialAccountRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private DynamicPermissionService dynamicPermissionService;

    @Mock
    private PersonalDataEncryptionUtil encryptionUtil;

    @Mock
    private PasswordService passwordService;

    @Mock
    private UserService userService;

    @InjectMocks
    private GoogleOAuth2ServiceImpl googleOAuth2Service;

    @BeforeEach
    void setUp() {
        // GoogleOAuth2ServiceImpl 내부의 @Value 필드는 단위 테스트에서 사용하지 않으므로 별도 주입 생략.
    }

    @Test
    void getProviderName_returnsGoogle() {
        assertEquals("GOOGLE", googleOAuth2Service.getProviderName());
    }

    @Test
    void getUserInfoFromIdToken_returnsSocialUserInfo_whenTokeninfoReturnsClaims() {
        // Given — Google tokeninfo 응답을 모킹 (name, picture, sub 등 표준 claims)
        String idToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.SamplePayload.SampleSignature";
        Map<String, Object> claims = new HashMap<>();
        claims.put("iss", "https://accounts.google.com");
        claims.put("aud", "sample-google-client-id.apps.googleusercontent.com");
        claims.put("sub", "1234567890");
        claims.put("email", "user@example.com");
        claims.put("email_verified", "true");
        claims.put("name", "홍길동");
        claims.put("given_name", "길동");
        claims.put("family_name", "홍");
        claims.put("picture", "https://lh3.googleusercontent.com/a-/sample");
        claims.put("locale", "ko");

        @SuppressWarnings({"unchecked", "rawtypes"})
        Class<Map<String, Object>> mapClass = (Class<Map<String, Object>>) (Class) Map.class;
        when(restTemplate.exchange(
                startsWith("https://oauth2.googleapis.com/tokeninfo?id_token="),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(mapClass)))
                .thenReturn(ResponseEntity.ok(claims));

        // When
        SocialUserInfo info = googleOAuth2Service.getUserInfoFromIdToken(idToken);

        // Then
        assertNotNull(info);
        assertEquals("1234567890", info.getProviderUserId());
        assertEquals("user@example.com", info.getEmail());
        assertEquals("홍길동", info.getName());
        assertEquals("길동", info.getNickname());
        assertEquals("https://lh3.googleusercontent.com/a-/sample", info.getProfileImageUrl());
    }

    @Test
    void getUserInfoFromIdToken_fallsBackToGivenFamilyName_whenNameMissing() {
        // Given — name claim 없이 given_name + family_name 만 있는 케이스 (P0 회귀 차단)
        String idToken = "any-id-token";
        Map<String, Object> claims = new HashMap<>();
        claims.put("sub", "9876543210");
        claims.put("email", "no-name@example.com");
        claims.put("given_name", "Jane");
        claims.put("family_name", "Doe");

        @SuppressWarnings({"unchecked", "rawtypes"})
        Class<Map<String, Object>> mapClass = (Class<Map<String, Object>>) (Class) Map.class;
        when(restTemplate.exchange(
                startsWith("https://oauth2.googleapis.com/tokeninfo?id_token="),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(mapClass)))
                .thenReturn(ResponseEntity.ok(claims));

        // When
        SocialUserInfo info = googleOAuth2Service.getUserInfoFromIdToken(idToken);

        // Then
        assertEquals("Jane Doe", info.getName());
        assertEquals("Jane", info.getNickname());
    }

    @Test
    void getUserInfoFromIdToken_throws_whenSubClaimMissing() {
        // Given — sub 가 없는 응답은 토큰 검증 실패로 본다 (Google tokeninfo 는 검증 실패 시 sub 미포함)
        String idToken = "invalid-id-token";
        Map<String, Object> claims = new HashMap<>();
        claims.put("error", "invalid_token");

        @SuppressWarnings({"unchecked", "rawtypes"})
        Class<Map<String, Object>> mapClass = (Class<Map<String, Object>>) (Class) Map.class;
        when(restTemplate.exchange(
                startsWith("https://oauth2.googleapis.com/tokeninfo?id_token="),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(mapClass)))
                .thenReturn(ResponseEntity.ok(claims));

        // When / Then
        assertThrows(RuntimeException.class,
                () -> googleOAuth2Service.getUserInfoFromIdToken(idToken));
    }

    @Test
    void getUserInfoFromIdToken_throws_whenIdTokenBlank() {
        assertThrows(IllegalArgumentException.class,
                () -> googleOAuth2Service.getUserInfoFromIdToken(""));
        assertThrows(IllegalArgumentException.class,
                () -> googleOAuth2Service.getUserInfoFromIdToken("   "));
        assertThrows(IllegalArgumentException.class,
                () -> googleOAuth2Service.getUserInfoFromIdToken(null));
    }

    /**
     * server-side auth-code (A-2, 2026-06-10) 마이그 sentinel — apex 콜백 redirect_uri override 가
     * Google token endpoint 요청 본문에 그대로 전송되는지 검증한다. authorize 단계에서 동적으로
     * 결정한 apex URL 과 토큰 교환 단계 URL 이 달라지면 Google 이 `redirect_uri_mismatch` 로
     * 차단하므로, 본 회귀가 발생하지 않도록 가드한다.
     */
    @Test
    void getAccessToken_passesRedirectUriOverride_toGoogleTokenEndpoint() {
        // Given — @Value 미주입 환경이므로 ReflectionTestUtils 로 dummy 값을 주입한다.
        ReflectionTestUtils.setField(googleOAuth2Service, "clientId", "test-client-id");
        ReflectionTestUtils.setField(googleOAuth2Service, "clientSecret", "test-client-secret");
        ReflectionTestUtils.setField(googleOAuth2Service, "redirectUri",
                "https://core-solution.co.kr/api/v1/auth/google/callback");

        Map<String, Object> tokenResponse = new HashMap<>();
        tokenResponse.put("access_token", "ya29.a0AfH6SMC.sample-access");
        tokenResponse.put("token_type", "Bearer");

        @SuppressWarnings({"unchecked", "rawtypes"})
        Class<Map<String, Object>> mapClass = (Class<Map<String, Object>>) (Class) Map.class;
        when(restTemplate.exchange(
                eq("https://oauth2.googleapis.com/token"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(mapClass)))
                .thenReturn(ResponseEntity.ok(tokenResponse));

        // When — authorize 단계에서 사용한 apex 콜백을 override 로 전달.
        String dynamicRedirect =
                "https://core-solution.co.kr/api/v1/auth/google/callback";
        String accessToken = googleOAuth2Service.getAccessToken("code-123", dynamicRedirect);

        // Then — access_token 추출 + 요청 본문의 redirect_uri 가 override 값으로 직렬화됐는지 검증.
        assertEquals("ya29.a0AfH6SMC.sample-access", accessToken);

        @SuppressWarnings("rawtypes")
        ArgumentCaptor<HttpEntity> entityCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        org.mockito.Mockito.verify(restTemplate).exchange(
                eq("https://oauth2.googleapis.com/token"),
                eq(HttpMethod.POST),
                entityCaptor.capture(),
                eq(mapClass));

        Object body = entityCaptor.getValue().getBody();
        assertNotNull(body);
        @SuppressWarnings("unchecked")
        MultiValueMap<String, String> form = (MultiValueMap<String, String>) body;
        assertEquals(dynamicRedirect, form.getFirst("redirect_uri"));
        assertEquals("code-123", form.getFirst("code"));
        assertEquals("authorization_code", form.getFirst("grant_type"));
        assertEquals("test-client-id", form.getFirst("client_id"));
        assertEquals("test-client-secret", form.getFirst("client_secret"));
    }

    /**
     * exchangeCodeForTokens — id_token 미포함 응답에서도 access_token 만 안전하게 추출하고
     * id_token 필드는 null 로 전달하는지 검증한다 (scope 에 openid 가 없는 경우).
     */
    @Test
    void exchangeCodeForTokens_returnsPair_withNullIdToken_whenAbsent() {
        ReflectionTestUtils.setField(googleOAuth2Service, "clientId", "ci");
        ReflectionTestUtils.setField(googleOAuth2Service, "clientSecret", "cs");
        ReflectionTestUtils.setField(googleOAuth2Service, "redirectUri", "");

        Map<String, Object> tokenResponse = new HashMap<>();
        tokenResponse.put("access_token", "access-only");
        tokenResponse.put("token_type", "Bearer");

        @SuppressWarnings({"unchecked", "rawtypes"})
        Class<Map<String, Object>> mapClass = (Class<Map<String, Object>>) (Class) Map.class;
        when(restTemplate.exchange(
                eq("https://oauth2.googleapis.com/token"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(mapClass)))
                .thenReturn(ResponseEntity.ok(tokenResponse));

        GoogleOAuth2ServiceImpl.GoogleTokenPair pair =
                googleOAuth2Service.exchangeCodeForTokens("code-xyz",
                        "https://core-solution.co.kr/api/v1/auth/google/callback");

        assertNotNull(pair);
        assertEquals("access-only", pair.getAccessToken());
        assertNull(pair.getIdToken());
    }

    /**
     * exchangeCodeForTokens — scope 에 openid 가 포함된 응답에서 id_token 도 함께 추출하는지 검증한다.
     */
    @Test
    void exchangeCodeForTokens_extractsBothTokens_whenIdTokenPresent() {
        ReflectionTestUtils.setField(googleOAuth2Service, "clientId", "ci");
        ReflectionTestUtils.setField(googleOAuth2Service, "clientSecret", "cs");
        ReflectionTestUtils.setField(googleOAuth2Service, "redirectUri", "");

        Map<String, Object> tokenResponse = new HashMap<>();
        tokenResponse.put("access_token", "ya29.access");
        tokenResponse.put("id_token", "eyJ.id-token.sample");
        tokenResponse.put("token_type", "Bearer");

        @SuppressWarnings({"unchecked", "rawtypes"})
        Class<Map<String, Object>> mapClass = (Class<Map<String, Object>>) (Class) Map.class;
        when(restTemplate.exchange(
                eq("https://oauth2.googleapis.com/token"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(mapClass)))
                .thenReturn(ResponseEntity.ok(tokenResponse));

        GoogleOAuth2ServiceImpl.GoogleTokenPair pair =
                googleOAuth2Service.exchangeCodeForTokens("code-openid",
                        "https://core-solution.co.kr/api/v1/auth/google/callback");

        assertEquals("ya29.access", pair.getAccessToken());
        assertEquals("eyJ.id-token.sample", pair.getIdToken());
    }

    /**
     * server-side auth-code (A-2) 회귀 sentinel — Google token endpoint 응답에 access_token 이
     * 누락되면 RuntimeException 으로 명확히 차단하는지 검증한다 (실패 시 silent null 반환 금지).
     */
    @Test
    void getAccessToken_throws_whenAccessTokenMissingFromResponse() {
        ReflectionTestUtils.setField(googleOAuth2Service, "clientId", "ci");
        ReflectionTestUtils.setField(googleOAuth2Service, "clientSecret", "cs");
        ReflectionTestUtils.setField(googleOAuth2Service, "redirectUri", "");

        Map<String, Object> brokenResponse = new HashMap<>();
        brokenResponse.put("error", "invalid_grant");
        brokenResponse.put("error_description", "Bad Request");

        @SuppressWarnings({"unchecked", "rawtypes"})
        Class<Map<String, Object>> mapClass = (Class<Map<String, Object>>) (Class) Map.class;
        when(restTemplate.exchange(
                eq("https://oauth2.googleapis.com/token"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(mapClass)))
                .thenReturn(ResponseEntity.ok(brokenResponse));

        assertThrows(RuntimeException.class,
                () -> googleOAuth2Service.getAccessToken("bad-code",
                        "https://core-solution.co.kr/api/v1/auth/google/callback"));
    }
}
