package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.entity.RefreshToken;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.RefreshTokenRepository;
import com.coresolution.core.constant.TestDocumentationIps;
import com.coresolution.core.security.PasswordService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/**
 * {@link RefreshTokenServiceImpl#createRefreshToken(User, String, HttpServletRequest)} 메타데이터 기록 검증.
 *
 * <p>P0-3 hotfix — 4곳의 호출자가 {@code null} 대신 {@code HttpServletRequest} 를 전달하면
 * {@code device_id} / {@code ip_address} / {@code user_agent} 가 NOT NULL 로 저장되어야 한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-13
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("RefreshTokenServiceImpl — device/ip/user-agent 메타데이터 기록")
class RefreshTokenServiceImplMetadataTest {

    private static final Long USER_ID = 99L;
    private static final String TENANT_ID = "tenant-meta";
    private static final String REFRESH_TOKEN = "refresh.jwt.token";
    private static final String FORWARDED_IP = TestDocumentationIps.DOC_NET_3_DEVICE_SECONDARY;
    private static final String DEVICE_ID = "expo-device-abc-123";
    private static final String USER_AGENT_MOBILE = "MindGardenMobile/1.2.3 (Pixel 7; Android 14)";

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordService passwordService;

    @Mock
    private HttpServletRequest httpRequest;

    @InjectMocks
    private RefreshTokenServiceImpl refreshTokenService;

    @Test
    @DisplayName("U4 — 모바일 User-Agent + X-Forwarded-For + X-Device-Id 헤더가 모두 기록되어야 함")
    void recordsMobileMetadataFromRequest() {
        when(passwordService.encodeSecret(REFRESH_TOKEN)).thenReturn("hash-value");
        when(httpRequest.getHeader("X-Forwarded-For")).thenReturn(FORWARDED_IP);
        when(httpRequest.getHeader("User-Agent")).thenReturn(USER_AGENT_MOBILE);
        when(httpRequest.getHeader("X-Device-Id")).thenReturn(DEVICE_ID);
        when(refreshTokenRepository.save(any(RefreshToken.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        User user = userWithTenant(TENANT_ID);
        refreshTokenService.createRefreshToken(user, REFRESH_TOKEN, httpRequest);

        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        org.mockito.Mockito.verify(refreshTokenRepository).save(captor.capture());

        RefreshToken saved = captor.getValue();
        assertThat(saved.getIpAddress())
            .as("X-Forwarded-For 헤더가 우선 적용되어야 함")
            .isEqualTo(FORWARDED_IP);
        assertThat(saved.getUserAgent())
            .as("User-Agent 헤더가 기록되어야 함")
            .isEqualTo(USER_AGENT_MOBILE);
        assertThat(saved.getDeviceId())
            .as("모바일 앱(User-Agent에 MindGardenMobile 포함) 인 경우 X-Device-Id 가 기록되어야 함")
            .isEqualTo(DEVICE_ID);
        assertThat(saved.getUserId()).isEqualTo(USER_ID);
        assertThat(saved.getTenantId()).isEqualTo(TENANT_ID);
    }

    @Test
    @DisplayName("U5 — request==null 이면 메타데이터는 NULL (회귀 차단: 기존 호출자 동작 보존)")
    void allowsNullRequestForBackwardCompatibility() {
        when(passwordService.encodeSecret(REFRESH_TOKEN)).thenReturn("hash-value");
        when(refreshTokenRepository.save(any(RefreshToken.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        User user = userWithTenant(TENANT_ID);
        refreshTokenService.createRefreshToken(user, REFRESH_TOKEN, null);

        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        org.mockito.Mockito.verify(refreshTokenRepository).save(captor.capture());

        RefreshToken saved = captor.getValue();
        assertThat(saved.getIpAddress()).isNull();
        assertThat(saved.getUserAgent()).isNull();
        assertThat(saved.getDeviceId()).isNull();
        // tenantId/userId 등 기본 필드는 정상 기록되어야 함
        assertThat(saved.getUserId()).isEqualTo(USER_ID);
        assertThat(saved.getTenantId()).isEqualTo(TENANT_ID);
    }

    @Test
    @DisplayName("웹 User-Agent (Mozilla 등) 는 device_id NULL 유지 (모바일 식별자가 아님)")
    void webUserAgentDoesNotPopulateDeviceId() {
        when(passwordService.encodeSecret(REFRESH_TOKEN)).thenReturn("hash-value");
        when(httpRequest.getHeader("X-Forwarded-For")).thenReturn(null);
        when(httpRequest.getHeader("X-Real-IP")).thenReturn(TestDocumentationIps.DOC_NET_2_PROXY_HOP);
        when(httpRequest.getHeader("User-Agent"))
            .thenReturn("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120");
        when(refreshTokenRepository.save(any(RefreshToken.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        User user = userWithTenant(TENANT_ID);
        refreshTokenService.createRefreshToken(user, REFRESH_TOKEN, httpRequest);

        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        org.mockito.Mockito.verify(refreshTokenRepository).save(captor.capture());

        RefreshToken saved = captor.getValue();
        assertThat(saved.getIpAddress())
            .as("X-Forwarded-For 부재 시 X-Real-IP 가 사용되어야 함")
            .isEqualTo(TestDocumentationIps.DOC_NET_2_PROXY_HOP);
        assertThat(saved.getUserAgent()).startsWith("Mozilla/5.0");
        assertThat(saved.getDeviceId())
            .as("웹 User-Agent 는 device_id 가 NULL — 모바일 흐름에만 채워짐")
            .isNull();
    }

    private static User userWithTenant(String tenantId) {
        User user = new User();
        user.setId(USER_ID);
        user.setTenantId(tenantId);
        return user;
    }
}
