package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.SocialUserInfo;
import com.coresolution.consultation.dto.auth.OAuthPhoneVerificationClaims;
import com.coresolution.consultation.entity.auth.OAuthProvider;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.OAuth2FactoryService;
import com.coresolution.consultation.service.OAuth2Service;
import com.coresolution.consultation.service.UserSessionService;
import com.coresolution.consultation.service.impl.AppleOAuth2ServiceImpl;
import com.coresolution.consultation.service.impl.GoogleOAuth2ServiceImpl;
import com.coresolution.consultation.service.impl.KakaoOAuth2ServiceImpl;
import com.coresolution.consultation.service.impl.NaverOAuth2ServiceImpl;
import com.coresolution.consultation.util.OAuth2DomainUtil;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link OAuth2Controller} 의 provider-agnostic OAuth 휴대폰 OTP 분기 hook 단위 검증.
 *
 * <p>2026-06-09 OAuth 휴대폰 SSOT 정책 (Phase 3A-2 통합): OAuth 콜백 후 provider sub·전화·이메일·user_id
 * 매칭 모두 실패한 신규 가입 분기에서, provider 별 {@code requiresPhoneOtp(...)} 결과에 따라 OTP 단계로
 * 분기하는 hook 의 회귀 방지를 담당한다.</p>
 *
 * <p>Apple 흐름은 본 hook 분기에 진입하지 않음 — Apple 콜백은 {@code AppleSignInController} 가 처리하고
 * {@code ApplePhoneVerificationService} alias 라우팅을 유지하므로 FE PR #161 회귀 zero.</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("OAuth2Controller — OAuth phone OTP hook flow")
class OAuth2ControllerOAuthPhoneOtpFlowTest {

    @Mock
    private OAuth2FactoryService oauth2FactoryService;
    @Mock
    private PersonalDataEncryptionUtil encryptionUtil;
    @Mock
    private OAuth2DomainUtil oauth2DomainUtil;
    @Mock
    private com.coresolution.consultation.repository.UserRepository userRepository;
    @Mock
    private JwtService jwtService;
    @Mock
    private com.coresolution.consultation.service.DynamicPermissionService dynamicPermissionService;
    @Mock
    private UserSessionService userSessionService;
    @Mock
    private com.coresolution.core.repository.TenantRepository tenantRepository;
    @Mock
    private org.springframework.core.env.Environment environment;

    @InjectMocks
    private OAuth2Controller controller;

    private static SocialUserInfo newSocialUserInfo(String providerUpper) {
        SocialUserInfo info = SocialUserInfo.builder()
            .providerUserId("provider-sub-1")
            .provider(providerUpper)
            .email("user@example.com")
            .name("홍길동")
            .nickname("hong")
            .build();
        info.normalizeData();
        return info;
    }

    @Test
    @DisplayName("hook: KAKAO requiresPhoneOtp=true → OTP 분기 진입")
    void shouldEnterOAuthPhoneOtpFlow_kakao_true_entersOtp() {
        KakaoOAuth2ServiceImpl kakaoService = org.mockito.Mockito.mock(KakaoOAuth2ServiceImpl.class);
        when(kakaoService.getProviderName()).thenReturn("KAKAO");
        when(kakaoService.requiresPhoneOtp(eq(OAuthProvider.KAKAO),
            any(SocialUserInfo.class))).thenReturn(true);

        boolean result = controller.shouldEnterOAuthPhoneOtpFlow(kakaoService,
            newSocialUserInfo("KAKAO"));

        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("hook: NAVER requiresPhoneOtp=true → OTP 분기 진입")
    void shouldEnterOAuthPhoneOtpFlow_naver_true_entersOtp() {
        NaverOAuth2ServiceImpl naverService = org.mockito.Mockito.mock(NaverOAuth2ServiceImpl.class);
        when(naverService.getProviderName()).thenReturn("NAVER");
        when(naverService.requiresPhoneOtp(eq(OAuthProvider.NAVER),
            any(SocialUserInfo.class))).thenReturn(true);

        boolean result = controller.shouldEnterOAuthPhoneOtpFlow(naverService,
            newSocialUserInfo("NAVER"));

        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("hook: GOOGLE requiresPhoneOtp=true → OTP 분기 진입")
    void shouldEnterOAuthPhoneOtpFlow_google_true_entersOtp() {
        GoogleOAuth2ServiceImpl googleService = org.mockito.Mockito.mock(GoogleOAuth2ServiceImpl.class);
        when(googleService.getProviderName()).thenReturn("GOOGLE");
        when(googleService.requiresPhoneOtp(eq(OAuthProvider.GOOGLE),
            any(SocialUserInfo.class))).thenReturn(true);

        boolean result = controller.shouldEnterOAuthPhoneOtpFlow(googleService,
            newSocialUserInfo("GOOGLE"));

        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("hook: APPLE 은 requiresPhoneOtp=true 여도 OAuth2Controller 분기에 진입하지 않는다 (회귀 zero)")
    void shouldEnterOAuthPhoneOtpFlow_apple_alwaysFalse_inOAuth2Controller() {
        AppleOAuth2ServiceImpl appleService = org.mockito.Mockito.mock(AppleOAuth2ServiceImpl.class);
        when(appleService.getProviderName()).thenReturn("APPLE");
        // Apple impl 이 true 를 반환해도 hook 은 false 로 차단해야 한다.
        lenient().when(appleService.requiresPhoneOtp(eq(OAuthProvider.APPLE),
            any(SocialUserInfo.class))).thenReturn(true);

        boolean result = controller.shouldEnterOAuthPhoneOtpFlow(appleService,
            newSocialUserInfo("APPLE"));

        assertThat(result).isFalse();
        verify(appleService, never()).requiresPhoneOtp(any(OAuthProvider.class),
            any(SocialUserInfo.class));
    }

    @Test
    @DisplayName("hook: null OAuth2Service → false (NPE 방지)")
    void shouldEnterOAuthPhoneOtpFlow_nullService_false() {
        boolean result = controller.shouldEnterOAuthPhoneOtpFlow(null, newSocialUserInfo("KAKAO"));
        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("hook: 알 수 없는 provider 이름 → false (fail-safe)")
    void shouldEnterOAuthPhoneOtpFlow_unknownProvider_false() {
        OAuth2Service unknown = org.mockito.Mockito.mock(OAuth2Service.class);
        when(unknown.getProviderName()).thenReturn("UNKNOWN_PROVIDER_X");

        boolean result = controller.shouldEnterOAuthPhoneOtpFlow(unknown, newSocialUserInfo("X"));

        assertThat(result).isFalse();
        verify(unknown, never()).requiresPhoneOtp(any(OAuthProvider.class), any(SocialUserInfo.class));
    }

    @Test
    @DisplayName("hook: requiresPhoneOtp 가 예외를 던지면 false 로 안전 처리")
    void shouldEnterOAuthPhoneOtpFlow_serviceThrows_false() {
        OAuth2Service kakaoService = org.mockito.Mockito.mock(KakaoOAuth2ServiceImpl.class);
        when(kakaoService.getProviderName()).thenReturn("KAKAO");
        when(kakaoService.requiresPhoneOtp(eq(OAuthProvider.KAKAO),
            any(SocialUserInfo.class)))
            .thenThrow(new RuntimeException("boom"));

        boolean result = controller.shouldEnterOAuthPhoneOtpFlow(kakaoService,
            newSocialUserInfo("KAKAO"));

        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("token: KAKAO/NAVER/GOOGLE 모두 phoneVerificationToken 발급 + tenantId claim 일관 적용")
    void issueOAuthPhoneVerificationToken_setsTenantIdAndProviderClaims() {
        when(jwtService.generateOAuthPhoneVerificationToken(any(OAuthPhoneVerificationClaims.class)))
            .thenReturn("pv-jwt-xyz");

        String token = controller.issueOAuthPhoneVerificationToken(OAuthProvider.NAVER,
            newSocialUserInfo("NAVER"), "tenant-naver-1");

        assertThat(token).isEqualTo("pv-jwt-xyz");
        ArgumentCaptor<OAuthPhoneVerificationClaims> captor =
            ArgumentCaptor.forClass(OAuthPhoneVerificationClaims.class);
        verify(jwtService).generateOAuthPhoneVerificationToken(captor.capture());
        OAuthPhoneVerificationClaims claims = captor.getValue();
        assertThat(claims.getTenantId()).isEqualTo("tenant-naver-1");
        assertThat(claims.getOauthProvider()).isEqualTo(OAuthProvider.NAVER);
        assertThat(claims.getProviderUserId()).isEqualTo("provider-sub-1");
        assertThat(claims.getEmail()).isEqualTo("user@example.com");
        assertThat(claims.getName()).isEqualTo("홍길동");
    }

    @Test
    @DisplayName("token: tenantId 비어있으면 발급 시도하지 않고 null 반환")
    void issueOAuthPhoneVerificationToken_blankTenantId_null() {
        String token = controller.issueOAuthPhoneVerificationToken(OAuthProvider.KAKAO,
            newSocialUserInfo("KAKAO"), "");

        assertThat(token).isNull();
        verify(jwtService, never())
            .generateOAuthPhoneVerificationToken(any(OAuthPhoneVerificationClaims.class));
    }

    @Test
    @DisplayName("token: JwtService 가 IllegalArgumentException 던지면 null 로 graceful 처리")
    void issueOAuthPhoneVerificationToken_jwtThrows_null() {
        when(jwtService.generateOAuthPhoneVerificationToken(any(OAuthPhoneVerificationClaims.class)))
            .thenThrow(new IllegalArgumentException("claims required"));

        String token = controller.issueOAuthPhoneVerificationToken(OAuthProvider.GOOGLE,
            newSocialUserInfo("GOOGLE"), "tenant-google-1");

        assertThat(token).isNull();
    }
}
