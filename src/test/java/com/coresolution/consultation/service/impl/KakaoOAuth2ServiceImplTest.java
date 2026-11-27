package com.coresolution.consultation.service.impl;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.UserSocialAccountRepository;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.security.PasswordService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link KakaoOAuth2ServiceImpl#getAccessToken} P0 핫픽스 — 4xx/KOE320 재시도 금지·raw body 비노출.
 *
 * @author MindGarden
 * @since 2026-10-28
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("KakaoOAuth2ServiceImpl#getAccessToken — 4xx no-retry")
class KakaoOAuth2ServiceImplTest {

    private static final String TOKEN_URL = "https://kauth.kakao.com/oauth/token";
    private static final String REDIRECT =
            "https://core-solution.co.kr/api/auth/kakao/callback";

    @Mock private RestTemplate restTemplate;
    @Mock private UserRepository userRepository;
    @Mock private ClientRepository clientRepository;
    @Mock private UserSocialAccountRepository userSocialAccountRepository;
    @Mock private JwtService jwtService;
    @Mock private DynamicPermissionService dynamicPermissionService;
    @Mock private PersonalDataEncryptionUtil encryptionUtil;
    @Mock private PasswordService passwordService;
    @Mock private UserService userService;

    @InjectMocks
    private KakaoOAuth2ServiceImpl kakaoOAuth2Service;

    private void seedClientConfig() {
        ReflectionTestUtils.setField(kakaoOAuth2Service, "clientId", "test-kakao-client");
        ReflectionTestUtils.setField(kakaoOAuth2Service, "clientSecret", "test-kakao-secret");
        ReflectionTestUtils.setField(kakaoOAuth2Service, "redirectUri", REDIRECT);
    }

    @Test
    @DisplayName("HTTP 400 invalid_grant/KOE320 → restTemplate 1회만 호출, 메시지에 raw JSON 없음")
    void getAccessToken_http400_doesNotRetry_andOmitsRawBodyFromMessage() {
        seedClientConfig();

        String rawJson = "{\"error\":\"invalid_grant\",\"error_description\":"
                + "\"authorization code not found for code=SECRET_CODE_VALUE\","
                + "\"error_code\":\"KOE320\"}";
        HttpClientErrorException ex = HttpClientErrorException.create(
                HttpStatus.BAD_REQUEST,
                "Bad Request",
                null,
                rawJson.getBytes(StandardCharsets.UTF_8),
                StandardCharsets.UTF_8);

        @SuppressWarnings({"unchecked", "rawtypes"})
        Class<Map<String, Object>> mapClass = (Class<Map<String, Object>>) (Class) Map.class;
        when(restTemplate.exchange(
                eq(TOKEN_URL),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(mapClass)))
                .thenThrow(ex);

        assertThatThrownBy(() -> kakaoOAuth2Service.getAccessToken("auth-code-xyz", REDIRECT))
                .isInstanceOf(RuntimeException.class)
                .satisfies(thrown -> {
                    String message = thrown.getMessage();
                    assertThat(message).isNotBlank();
                    assertThat(message).doesNotContain(rawJson);
                    assertThat(message).doesNotContain("SECRET_CODE_VALUE");
                    assertThat(message).doesNotContain("\"error\"");
                    assertThat(message).contains("인증 코드");
                });

        verify(restTemplate, times(1)).exchange(
                eq(TOKEN_URL),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(mapClass));
    }

    @Test
    @DisplayName("HTTP 200 본문 invalid_request → 재시도 없이 짧은 사용자 메시지")
    void getAccessToken_http200BodyInvalidRequest_noRetry() {
        seedClientConfig();

        Map<String, Object> errorBody = new HashMap<>();
        errorBody.put("error", "invalid_request");
        errorBody.put("error_code", "KOE320");
        errorBody.put("error_description", "raw detailed json should not leak");

        @SuppressWarnings({"unchecked", "rawtypes"})
        Class<Map<String, Object>> mapClass = (Class<Map<String, Object>>) (Class) Map.class;
        when(restTemplate.exchange(
                eq(TOKEN_URL),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(mapClass)))
                .thenReturn(org.springframework.http.ResponseEntity.ok(errorBody));

        assertThatThrownBy(() -> kakaoOAuth2Service.getAccessToken("empty-ish", REDIRECT))
                .isInstanceOf(RuntimeException.class)
                .satisfies(thrown -> {
                    assertThat(thrown.getMessage()).doesNotContain("raw detailed json");
                    assertThat(thrown.getMessage()).contains("인증 코드");
                });

        verify(restTemplate, times(1)).exchange(
                eq(TOKEN_URL),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(mapClass));
    }
}
