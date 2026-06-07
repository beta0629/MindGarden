package com.coresolution.consultation.service.impl;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.auth.AppleSignInRequest;
import com.coresolution.consultation.dto.auth.AppleSignInResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.integration.apple.AppleIdTokenVerifier;
import com.coresolution.consultation.integration.apple.AppleOAuth2Client;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.UserSocialAccountRepository;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.PasswordService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
 * {@link AppleSignInServiceImpl} 신규/기존/email 매칭 분기 테스트.
 *
 * <p>Apple App Store 4.8 (T1) — `apple_sub` 일치 → email 매칭 → 신규 가입 3-tier 분기를 검증.</p>
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AppleSignInServiceImpl 신규/기존/email 분기")
class AppleSignInServiceImplTest {

    private static final String APPLE_SUB = "001234.deadbeefcafebabe.0000";
    private static final String APPLE_EMAIL = "apple-user@example.com";
    private static final String TENANT_ID = "tenant-apple-ut";

    @Mock private AppleIdTokenVerifier idTokenVerifier;
    @Mock private AppleOAuth2Client oauthClient;
    @Mock private UserRepository userRepository;
    @Mock private ClientRepository clientRepository;
    @Mock private UserSocialAccountRepository userSocialAccountRepository;
    @Mock private JwtService jwtService;
    @Mock private PersonalDataEncryptionUtil encryptionUtil;
    @Mock private PasswordService passwordService;

    @InjectMocks
    private AppleSignInServiceImpl service;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        when(jwtService.generateToken(any(User.class))).thenReturn("access-jwt");
        when(jwtService.generateRefreshToken(any(User.class))).thenReturn("refresh-jwt");
        when(encryptionUtil.safeEncrypt(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(encryptionUtil.safeDecrypt(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(passwordService.encodeSecret(anyString())).thenReturn("ENC(password)");
        // Mockito 기본값(Optional → null) 방지 — 멀티테넌트 안전 메서드를 empty 로 시드한다.
        when(userSocialAccountRepository.findByTenantIdAndProviderAndProviderUserIdAndIsDeletedFalse(
            anyString(), anyString(), anyString())).thenReturn(Optional.empty());
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private Map<String, Object> claims(String email) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("sub", APPLE_SUB);
        if (email != null) {
            claims.put("email", email);
        }
        return claims;
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
        assertThat(response.isRequiresSignup()).isFalse();
        assertThat(response.getAccessToken()).isEqualTo("access-jwt");
        assertThat(response.getRefreshToken()).isEqualTo("refresh-jwt");
        assertThat(response.getUser()).isNotNull();
        assertThat(response.getUser().getId()).isEqualTo(101L);
        verify(userRepository, never()).findByEmailAndTenantId(anyString(), anyString());
    }

    @Test
    @DisplayName("2) apple_sub 없음 + 동일 테넌트 이메일 매칭이면 기존 사용자에 apple_sub 를 연결한다")
    void signIn_existingByEmail_linksAppleSub() {
        User existingByEmail = User.builder()
            .userId("client_existing")
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

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, org.mockito.Mockito.atLeastOnce()).saveAndFlush(userCaptor.capture());
        User saved = userCaptor.getValue();
        assertThat(saved.getAppleSub()).isEqualTo(APPLE_SUB);
        assertThat(saved.getSocialProvider()).isEqualTo("APPLE");
        assertThat(response.isSuccess()).isTrue();
        assertThat(response.isRequiresSignup()).isFalse();
        assertThat(response.getAccessToken()).isEqualTo("access-jwt");
    }

    @Test
    @DisplayName("3) 매칭 없음 + 테넌트 컨텍스트 존재면 신규 사용자(role=CLIENT)를 생성한다")
    void signIn_newUser_createdWithTenantAndRoleClient() {
        when(idTokenVerifier.verify(anyString(), anyString())).thenReturn(claims(APPLE_EMAIL));
        when(userRepository.findByAppleSub(APPLE_SUB)).thenReturn(Optional.empty());
        when(userRepository.findByEmailAndTenantId(APPLE_EMAIL, TENANT_ID))
            .thenReturn(Optional.empty());
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        AppleSignInResponse response = service.signIn(request());

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, org.mockito.Mockito.atLeastOnce()).saveAndFlush(userCaptor.capture());
        User created = userCaptor.getValue();
        assertThat(created.getAppleSub()).isEqualTo(APPLE_SUB);
        assertThat(created.getSocialProvider()).isEqualTo("APPLE");
        assertThat(created.getSocialProviderUserId()).isEqualTo(APPLE_SUB);
        assertThat(created.getRole()).isEqualTo(UserRole.CLIENT);
        assertThat(created.getTenantId()).isEqualTo(TENANT_ID);
        assertThat(response.isSuccess()).isTrue();
        assertThat(response.isRequiresSignup()).isFalse();
        verify(clientRepository).saveAndFlush(any());
    }

    @Test
    @DisplayName("3.1) 테넌트 컨텍스트 부재면 requiresSignup=true 를 반환한다")
    void signIn_withoutTenant_returnsRequiresSignup() {
        TenantContextHolder.clear();

        when(idTokenVerifier.verify(anyString(), anyString())).thenReturn(claims(APPLE_EMAIL));
        when(userRepository.findByAppleSub(APPLE_SUB)).thenReturn(Optional.empty());

        AppleSignInResponse response = service.signIn(request());

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.isRequiresSignup()).isTrue();
        assertThat(response.getSocialUserInfo()).isNotNull();
        assertThat(response.getSocialUserInfo().getProviderUserId()).isEqualTo(APPLE_SUB);
        assertThat(response.getAccessToken()).isNull();
        verify(userRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("verifier 가 예외를 던지면 실패 응답을 반환하고 사용자 조회를 하지 않는다")
    void signIn_verifierThrows_returnsFailure() {
        when(idTokenVerifier.verify(anyString(), anyString()))
            .thenThrow(new AppleIdTokenVerifier.AppleIdTokenVerificationException("bad"));

        AppleSignInResponse response = service.signIn(request());

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.isRequiresSignup()).isFalse();
        verify(userRepository, never()).findByAppleSub(anyString());
    }

    @Test
    @DisplayName("identityToken 이 비어 있으면 검증 호출 없이 즉시 실패한다")
    void signIn_blankIdentityToken_failsFast() {
        AppleSignInRequest blank = AppleSignInRequest.builder()
            .identityToken("")
            .build();

        AppleSignInResponse response = service.signIn(blank);

        assertThat(response.isSuccess()).isFalse();
        verify(idTokenVerifier, never()).verify(anyString(), anyString());
    }

    @Test
    @DisplayName("Apple Private Relay 이메일은 socialUserInfo.privateRelayEmail=true 로 표기된다")
    void signIn_withoutTenant_signalsPrivateRelay() {
        TenantContextHolder.clear();
        when(idTokenVerifier.verify(anyString(), anyString()))
            .thenReturn(claims("anonymous-xyz@privaterelay.appleid.com"));
        when(userRepository.findByAppleSub(APPLE_SUB)).thenReturn(Optional.empty());

        AppleSignInResponse response = service.signIn(request());

        assertThat(response.getSocialUserInfo()).isNotNull();
        assertThat(response.getSocialUserInfo().isPrivateRelayEmail()).isTrue();
    }
}
