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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link AppleSignInServiceImpl} 신규 분기(2026-06-08 재정렬) 테스트.
 *
 * <p>분기 정책:
 * <ol>
 *   <li>apple_sub 매칭 → 즉시 JWT 발급 (기존 동일)</li>
 *   <li>apple_sub 없음 + 테넌트 컨텍스트 존재 → {@code requiresPhoneVerification=true} + {@code phoneVerificationToken}</li>
 *   <li>apple_sub 없음 + 테넌트 컨텍스트 부재 → {@code requiresSignup=true} (deprecated 호환)</li>
 * </ol>
 * </p>
 *
 * <p>이전 (b) email 매칭 분기는 제거됐다 — 사용자 결정 2026-06-08. 휴대폰 매칭 검증은
 * {@link ApplePhoneVerificationServiceImplTest} 가 담당한다.</p>
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AppleSignInServiceImpl 신규 분기 (2026-06-08 재정렬)")
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
    @DisplayName("2) apple_sub 매칭 실패 + 테넌트 존재 → requiresPhoneVerification=true 응답")
    void signIn_noAppleSubMatch_returnsPhoneVerification() {
        when(idTokenVerifier.verify(anyString(), anyString())).thenReturn(claims(APPLE_EMAIL));
        when(userRepository.findByAppleSub(APPLE_SUB)).thenReturn(Optional.empty());

        AppleSignInResponse response = service.signIn(request());

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.isRequiresPhoneVerification()).isTrue();
        assertThat(response.getPhoneVerificationToken()).isEqualTo("phone-verification-jwt");
        assertThat(response.getAccessToken()).isNull();
        assertThat(response.getRefreshToken()).isNull();
        assertThat(response.getSocialUserInfo()).isNotNull();
        assertThat(response.getSocialUserInfo().getProviderUserId()).isEqualTo(APPLE_SUB);
        // 회귀 가드: email 매칭 시도가 없어야 한다.
        verify(userRepository, never()).findByEmailAndTenantId(anyString(), anyString());
        // 회귀 가드: 신규 사용자 자동 생성이 없어야 한다.
        verify(userRepository, never()).saveAndFlush(any());
    }

    @Test
    @SuppressWarnings("deprecation")
    @DisplayName("3) apple_sub 매칭 실패 + 테넌트 부재 → requiresSignup=true (deprecated 호환)")
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
}
