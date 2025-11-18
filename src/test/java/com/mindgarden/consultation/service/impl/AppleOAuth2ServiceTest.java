package com.mindgarden.consultation.service.impl;

import com.mindgarden.consultation.dto.SocialUserInfo;
import com.mindgarden.consultation.repository.ClientRepository;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.repository.UserSocialAccountRepository;
import com.mindgarden.consultation.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Apple OAuth2 서비스 테스트
 * Week 14: Google/Apple OAuth2 추가
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@ExtendWith(MockitoExtension.class)
class AppleOAuth2ServiceTest {

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

    @InjectMocks
    private AppleOAuth2ServiceImpl appleOAuth2Service;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(appleOAuth2Service, "clientId", "test-apple-client-id");
        ReflectionTestUtils.setField(appleOAuth2Service, "clientSecret", "test-apple-client-secret");
        ReflectionTestUtils.setField(appleOAuth2Service, "redirectUri", "http://localhost:8080/api/auth/apple/callback");
    }

    @Test
    void testGetProviderName() {
        assertEquals("APPLE", appleOAuth2Service.getProviderName());
    }

    @Test
    void testGetAccessToken() {
        // Given
        String code = "test-code";
        Map<String, Object> tokenResponse = new HashMap<>();
        tokenResponse.put("access_token", "test-access-token");
        tokenResponse.put("token_type", "Bearer");
        tokenResponse.put("expires_in", 3600);

        when(restTemplate.exchange(anyString(), any(), any(), any(Class.class)))
                .thenReturn(org.springframework.http.ResponseEntity.ok(tokenResponse));

        // When
        String accessToken = appleOAuth2Service.getAccessToken(code);

        // Then
        assertNotNull(accessToken);
        assertEquals("test-access-token", accessToken);
    }

    @Test
    void testGetUserInfo() {
        // Given
        String accessToken = "test-access-token";

        // When
        SocialUserInfo socialUserInfo = appleOAuth2Service.getUserInfo(accessToken);

        // Then
        // Apple은 첫 로그인 시에만 사용자 정보를 제공하므로, 
        // 실제 구현에서는 ID 토큰 파싱이 필요합니다.
        assertNotNull(socialUserInfo);
    }
}

