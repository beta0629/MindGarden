package com.coresolution.consultation.service.impl;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.auth.ApplePhoneVerificationClaims;
import com.coresolution.consultation.dto.auth.AppleSignInRequest;
import com.coresolution.consultation.dto.auth.AppleSignInResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.integration.apple.AppleIdTokenVerifier;
import com.coresolution.consultation.integration.apple.AppleOAuth2Client;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.UserSocialAccountRepository;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link AppleSignInServiceImpl} 분기 테스트 (2026-06-08 P0 hotfix — email fallback 임시 복원 포함).
 *
 * <p>분기 정책:
 * <ol>
 *   <li>apple_sub 매칭 → 즉시 JWT 발급 (기존 동일)</li>
 *   <li><b>(임시 fallback)</b> apple_sub 미매칭 + 동일 테넌트·이메일 매칭 → apple_sub 연결 후 JWT 발급
 *       (Private Relay 이메일 제외). App v1.0.7 운영 반영 완료 후 제거 예정.</li>
 *   <li>apple_sub·email 매칭 실패 + 테넌트 컨텍스트 존재 → {@code requiresPhoneVerification=true}
 *       + {@code phoneVerificationToken}</li>
 *   <li>apple_sub·email 매칭 실패 + 테넌트 컨텍스트 부재 → {@code requiresSignup=true} (deprecated 호환)</li>
 * </ol>
 * </p>
 *
 * <p>휴대폰 매칭 검증은 {@code ApplePhoneVerificationServiceImplTest} 가 담당한다.</p>
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AppleSignInServiceImpl 분기 (2026-06-08 P0 hotfix — email fallback 임시 복원)")
class AppleSignInServiceImplTest {

    private static final String APPLE_SUB = "001234.deadbeefcafebabe.0000";
    private static final String APPLE_EMAIL = "apple-user@example.com";
    private static final String TENANT_ID = "tenant-apple-ut";

    @Mock private AppleIdTokenVerifier idTokenVerifier;
    @Mock private AppleOAuth2Client oauthClient;
    @Mock private UserRepository userRepository;
    @Mock private UserSocialAccountRepository userSocialAccountRepository;
    @Mock private JwtService jwtService;
    @Mock private PersonalDataEncryptionUtil encryptionUtil;

    @InjectMocks
    private AppleSignInServiceImpl service;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        when(jwtService.generateToken(any(User.class))).thenReturn("access-jwt");
        when(jwtService.generateRefreshToken(any(User.class))).thenReturn("refresh-jwt");
        when(jwtService.generateApplePhoneVerificationToken(any(ApplePhoneVerificationClaims.class)))
            .thenReturn("phone-verification-jwt");
        when(encryptionUtil.safeEncrypt(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(encryptionUtil.safeDecrypt(anyString())).thenAnswer(inv -> inv.getArgument(0));
        // Mockito 기본값(Optional → null) 방지 — 멀티테넌트 안전 메서드를 empty 로 시드한다.
        when(userSocialAccountRepository.findByTenantIdAndProviderAndProviderUserIdAndIsDeletedFalse(
            anyString(), anyString(), anyString())).thenReturn(Optional.empty());
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private Map<String, Object> claims(String email) {
        Map<String, Object> c = new HashMap<>();
        c.put("sub", APPLE_SUB);
        if (email != null) {
            c.put("email", email);
        }
        return c;
    }

    private AppleSignInRequest request() {
        return AppleSignInRequest.builder()
            .identityToken("eyJ.fake.token")
            .nonce("nonce-1")
            .givenName("길동")
            .familyName("홍")
            .build();
    }

    @Test
    @DisplayName("1) apple_sub 매칭 사용자가 있으면 즉시 JWT 를 발급한다")
    void signIn_existingByAppleSub_returnsTokens() {
        User existing = User.builder()
            .userId("apple_existing")
            .email("apple-user@example.com")
            .name("홍길동")
            .role(UserRole.CLIENT)
            .build();
        existing.setId(101L);
        existing.setTenantId(TENANT_ID);

        when(idTokenVerifier.verify(anyString(), anyString())).thenReturn(claims(APPLE_EMAIL));
        when(userRepository.findByAppleSub(APPLE_SUB)).thenReturn(Optional.of(existing));
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        AppleSignInResponse response = service.signIn(request());

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.isRequiresPhoneVerification()).isFalse();
        assertThat(response.getAccessToken()).isEqualTo("access-jwt");
        assertThat(response.getRefreshToken()).isEqualTo("refresh-jwt");
        assertThat(response.getUser()).isNotNull();
        assertThat(response.getUser().getId()).isEqualTo(101L);
        // 회귀 가드: 새 분기 정책에서는 email 매칭을 시도하지 않는다.
        verify(userRepository, never()).findByEmailAndTenantId(anyString(), anyString());
    }

    @Test
    @DisplayName("2) apple_sub 미매칭 + email 매칭도 실패 + 테넌트 존재 → requiresPhoneVerification=true 응답")
    void signIn_noAppleSubMatch_noEmailMatch_returnsPhoneVerification() {
        when(idTokenVerifier.verify(anyString(), anyString())).thenReturn(claims(APPLE_EMAIL));
        when(userRepository.findByAppleSub(APPLE_SUB)).thenReturn(Optional.empty());
        // email fallback 도 실패 (해당 테넌트에 같은 이메일 user 없음)
        when(userRepository.findByEmailAndTenantId(APPLE_EMAIL, TENANT_ID)).thenReturn(Optional.empty());

        AppleSignInResponse response = service.signIn(request());

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.isRequiresPhoneVerification()).isTrue();
        assertThat(response.getPhoneVerificationToken()).isEqualTo("phone-verification-jwt");
        assertThat(response.getAccessToken()).isNull();
        assertThat(response.getRefreshToken()).isNull();
        assertThat(response.getSocialUserInfo()).isNotNull();
        assertThat(response.getSocialUserInfo().getProviderUserId()).isEqualTo(APPLE_SUB);
        // 회귀 가드: 임시 fallback 분기에서 email 매칭은 시도하지만 hit 가 없으므로 saveAndFlush 호출 없음.
        verify(userRepository, never()).saveAndFlush(any());
    }

    @Test
    @SuppressWarnings("deprecation")
    @DisplayName("3) apple_sub 미매칭 + 테넌트 부재 → requiresSignup=true (deprecated 호환, email fallback 스킵)")
    void signIn_noAppleSubMatch_noTenant_returnsRequiresSignup() {
        TenantContextHolder.clear();
        when(idTokenVerifier.verify(anyString(), anyString())).thenReturn(claims(APPLE_EMAIL));
        when(userRepository.findByAppleSub(APPLE_SUB)).thenReturn(Optional.empty());

        AppleSignInResponse response = service.signIn(request());

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.isRequiresSignup()).isTrue();
        assertThat(response.isRequiresPhoneVerification()).isFalse();
        assertThat(response.getSocialUserInfo()).isNotNull();
        assertThat(response.getSocialUserInfo().getProviderUserId()).isEqualTo(APPLE_SUB);
        // 회귀 가드: 테넌트 부재 시 email fallback 은 스킵되어 findByEmailAndTenantId 호출 없음.
        verify(userRepository, never()).findByEmailAndTenantId(anyString(), anyString());
        verify(userRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("7) [P0 hotfix fallback] apple_sub 미매칭 + email 매칭 → 임시 fallback 으로 자동 로그인 + apple_sub 연결")
    void signIn_appleSubMiss_emailHit_returnsTokensViaFallback() {
        User existingByEmail = User.builder()
            .userId("existing_kakao_user")
            .email(APPLE_EMAIL)
            .name("홍길동")
            .role(UserRole.CLIENT)
            .build();
        existingByEmail.setId(202L);
        existingByEmail.setTenantId(TENANT_ID);

        when(idTokenVerifier.verify(anyString(), anyString())).thenReturn(claims(APPLE_EMAIL));
        when(userRepository.findByAppleSub(APPLE_SUB)).thenReturn(Optional.empty());
        when(userRepository.findByEmailAndTenantId(APPLE_EMAIL, TENANT_ID))
            .thenReturn(Optional.of(existingByEmail));
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        AppleSignInResponse response = service.signIn(request());

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.isRequiresPhoneVerification()).isFalse();
        assertThat(response.getAccessToken()).isEqualTo("access-jwt");
        assertThat(response.getRefreshToken()).isEqualTo("refresh-jwt");
        assertThat(response.getUser()).isNotNull();
        assertThat(response.getUser().getId()).isEqualTo(202L);
        // apple_sub 연결 확인
        assertThat(existingByEmail.getAppleSub()).isEqualTo(APPLE_SUB);
        assertThat(existingByEmail.getIsSocialAccount()).isTrue();
    }

    @Test
    @DisplayName("8) [P0 hotfix fallback] apple_sub 미매칭 + Private Relay 이메일 → fallback 스킵 + requiresPhoneVerification")
    void signIn_appleSubMiss_privateRelayEmail_skipsFallback() {
        when(idTokenVerifier.verify(anyString(), anyString()))
            .thenReturn(claims("anonymous-xyz@privaterelay.appleid.com"));
        when(userRepository.findByAppleSub(APPLE_SUB)).thenReturn(Optional.empty());

        AppleSignInResponse response = service.signIn(request());

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.isRequiresPhoneVerification()).isTrue();
        assertThat(response.getPhoneVerificationToken()).isEqualTo("phone-verification-jwt");
        assertThat(response.getAccessToken()).isNull();
        // 회귀 가드: Private Relay 이메일은 fallback 매칭 자체를 시도하지 않아야 한다.
        verify(userRepository, never()).findByEmailAndTenantId(anyString(), anyString());
        verify(userRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("4) verifier 예외 → 실패 응답, 사용자 조회 없음")
    void signIn_verifierThrows_returnsFailure() {
        when(idTokenVerifier.verify(anyString(), anyString()))
            .thenThrow(new AppleIdTokenVerifier.AppleIdTokenVerificationException("bad"));

        AppleSignInResponse response = service.signIn(request());

        assertThat(response.isSuccess()).isFalse();
        verify(userRepository, never()).findByAppleSub(anyString());
    }

    @Test
    @DisplayName("5) identityToken 빈 값 → 즉시 실패")
    void signIn_blankIdentityToken_failsFast() {
        AppleSignInRequest blank = AppleSignInRequest.builder()
            .identityToken("")
            .build();

        AppleSignInResponse response = service.signIn(blank);

        assertThat(response.isSuccess()).isFalse();
        verify(idTokenVerifier, never()).verify(anyString(), anyString());
    }

    @Test
    @DisplayName("6) Private Relay 이메일은 socialUserInfo.privateRelayEmail=true 로 표기")
    void signIn_privateRelay_flagged() {
        when(idTokenVerifier.verify(anyString(), anyString()))
            .thenReturn(claims("anonymous-xyz@privaterelay.appleid.com"));
        when(userRepository.findByAppleSub(APPLE_SUB)).thenReturn(Optional.empty());

        AppleSignInResponse response = service.signIn(request());

        assertThat(response.getSocialUserInfo()).isNotNull();
        assertThat(response.getSocialUserInfo().isPrivateRelayEmail()).isTrue();
    }

    @Test
    @DisplayName("9) [server-side auth-code] callback(request, redirectUriOverride) 가 동적 redirect_uri 를 AppleOAuth2Client 에 전달")
    void callback_withRedirectUriOverride_propagatesToOAuthClient() {
        String dynamicRedirectUri = "https://core-solution.co.kr/api/v1/auth/apple/callback";
        Map<String, Object> tokenResponse = new HashMap<>();
        tokenResponse.put("id_token", "eyJ.fake.token");
        when(oauthClient.exchangeAuthorizationCode(eq("apple-auth-code"), eq(dynamicRedirectUri)))
            .thenReturn(tokenResponse);
        when(idTokenVerifier.verify(anyString(), anyString())).thenReturn(claims(APPLE_EMAIL));
        when(userRepository.findByAppleSub(APPLE_SUB)).thenReturn(Optional.empty());
        when(userRepository.findByEmailAndTenantId(APPLE_EMAIL, TENANT_ID)).thenReturn(Optional.empty());

        AppleSignInRequest callbackRequest = AppleSignInRequest.builder()
            .authorizationCode("apple-auth-code")
            .nonce("nonce-server-side")
            .build();

        AppleSignInResponse response = service.callback(callbackRequest, dynamicRedirectUri);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.isRequiresPhoneVerification()).isTrue();
        verify(oauthClient).exchangeAuthorizationCode("apple-auth-code", dynamicRedirectUri);
    }

    @Test
    @DisplayName("10) [회귀 0] 기존 callback(request) 는 redirectUriOverride=null 로 위임")
    void callback_legacy_passesNullOverrideToClient() {
        Map<String, Object> tokenResponse = new HashMap<>();
        tokenResponse.put("id_token", "eyJ.fake.token");
        when(oauthClient.exchangeAuthorizationCode(eq("apple-auth-code"), eq(null)))
            .thenReturn(tokenResponse);
        when(idTokenVerifier.verify(anyString(), anyString())).thenReturn(claims(APPLE_EMAIL));
        when(userRepository.findByAppleSub(APPLE_SUB)).thenReturn(Optional.empty());
        when(userRepository.findByEmailAndTenantId(APPLE_EMAIL, TENANT_ID)).thenReturn(Optional.empty());

        AppleSignInRequest callbackRequest = AppleSignInRequest.builder()
            .authorizationCode("apple-auth-code")
            .nonce("nonce-legacy")
            .build();

        AppleSignInResponse response = service.callback(callbackRequest);

        assertThat(response.isSuccess()).isTrue();
        verify(oauthClient).exchangeAuthorizationCode("apple-auth-code", null);
    }
}
