package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.lang.reflect.Method;
import java.util.Base64;
import java.util.UUID;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.auth.AppleSignInResponse;
import com.coresolution.consultation.dto.auth.OAuthPhoneVerifyResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.UserSocialAccountRepository;
import com.coresolution.consultation.repository.auth.PhoneOtpAttemptRepository;
import com.coresolution.consultation.service.BearerIdleSessionService;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.SmsAuthService;
import com.coresolution.consultation.service.support.TemporaryPasswordGenerator;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.PasswordService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * SNS/phone/Apple issueTokens 경로 — 실 {@link JwtService} 훅으로 ensureActiveSession 호출.
 *
 * @author MindGarden
 * @since 2026-10-31
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("OAuth/SNS/phone — JwtService 훅으로 sid 등록")
class OAuthSnsPhoneJwtBearerIdleBindTest {

    private static final String TENANT_ID = "tenant-oauth-bind-" + UUID.randomUUID();

    @Mock private BearerIdleSessionService bearerIdleSessionService;

    private JwtService realJwt;

    @BeforeEach
    void initJwt() {
        realJwt = new JwtService();
        ReflectionTestUtils.setField(realJwt, "secretKey",
                Base64.getEncoder().encodeToString(new byte[32]));
        ReflectionTestUtils.setField(realJwt, "jwtExpiration", 3_600_000L);
        ReflectionTestUtils.setField(realJwt, "refreshExpiration", 604_800_000L);
        @SuppressWarnings("unchecked")
        ObjectProvider<BearerIdleSessionService> provider = org.mockito.Mockito.mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(bearerIdleSessionService);
        realJwt.setBearerIdleSessionServiceProvider(provider);
    }

    @Nested
    @DisplayName("OAuthPhoneVerificationServiceImpl.issueTokens")
    class OAuthPhoneIssueTokens {

        @Mock private PhoneOtpAttemptRepository phoneOtpAttemptRepository;
        @Mock private SmsAuthService smsAuthService;
        @Mock private UserRepository userRepository;
        @Mock private ClientRepository clientRepository;
        @Mock private UserSocialAccountRepository userSocialAccountRepository;
        @Mock private PersonalDataEncryptionUtil encryptionUtil;
        @Mock private PasswordService passwordService;
        @Mock private TemporaryPasswordGenerator temporaryPasswordGenerator;
        @Mock private PasswordEncoder passwordEncoder;

        @InjectMocks
        private OAuthPhoneVerificationServiceImpl service;

        @BeforeEach
        void setUp() {
            TenantContextHolder.setTenantId(TENANT_ID);
            ReflectionTestUtils.setField(service, "jwtService", realJwt);
            when(userRepository.updateLastLoginAt(any(), any(), any(), any())).thenReturn(1);
            when(encryptionUtil.safeDecrypt(any())).thenAnswer(inv -> inv.getArgument(0));
        }

        @AfterEach
        void tearDown() {
            TenantContextHolder.clear();
        }

        @ParameterizedTest(name = "{0}")
        @EnumSource(value = UserRole.class, names = {"CLIENT", "CONSULTANT", "ADMIN"})
        @DisplayName("issueTokens → Jwt 훅 ensureActiveSession")
        void issueTokens_registersViaJwtHook(UserRole role) throws Exception {
            User user = userWithRole(role);
            Method method = OAuthPhoneVerificationServiceImpl.class.getDeclaredMethod(
                    "issueTokens", User.class, String.class);
            method.setAccessible(true);
            OAuthPhoneVerifyResponse response =
                    (OAuthPhoneVerifyResponse) method.invoke(service, user, "ok");

            assertThat(response.isSuccess()).isTrue();
            assertThat(response.getAccessToken()).isNotBlank();
            String sid = realJwt.extractSessionId(response.getAccessToken());
            verify(bearerIdleSessionService).ensureActiveSession(
                    org.mockito.ArgumentMatchers.eq(user),
                    org.mockito.ArgumentMatchers.eq(sid),
                    any(), any());
        }
    }

    @Nested
    @DisplayName("ApplePhoneVerificationServiceImpl.issueTokens")
    class ApplePhoneIssueTokens {

        @Mock private PhoneOtpAttemptRepository phoneOtpAttemptRepository;
        @Mock private SmsAuthService smsAuthService;
        @Mock private UserRepository userRepository;
        @Mock private ClientRepository clientRepository;
        @Mock private UserSocialAccountRepository userSocialAccountRepository;
        @Mock private PersonalDataEncryptionUtil encryptionUtil;
        @Mock private PasswordService passwordService;
        @Mock private PasswordEncoder passwordEncoder;
        @Mock private TemporaryPasswordGenerator temporaryPasswordGenerator;

        @InjectMocks
        private ApplePhoneVerificationServiceImpl service;

        @BeforeEach
        void setUp() {
            TenantContextHolder.setTenantId(TENANT_ID);
            ReflectionTestUtils.setField(service, "jwtService", realJwt);
            when(userRepository.updateLastLoginAt(any(), any(), any(), any())).thenReturn(1);
            when(encryptionUtil.safeDecrypt(any())).thenAnswer(inv -> inv.getArgument(0));
        }

        @AfterEach
        void tearDown() {
            TenantContextHolder.clear();
        }

        @ParameterizedTest(name = "{0}")
        @EnumSource(value = UserRole.class, names = {"CLIENT", "CONSULTANT", "ADMIN"})
        @DisplayName("issueTokens → Jwt 훅 ensureActiveSession")
        void issueTokens_registersViaJwtHook(UserRole role) throws Exception {
            User user = userWithRole(role);
            Method method = ApplePhoneVerificationServiceImpl.class.getDeclaredMethod(
                    "issueTokens", User.class, String.class);
            method.setAccessible(true);
            AppleSignInResponse response =
                    (AppleSignInResponse) method.invoke(service, user, "ok");

            assertThat(response.isSuccess()).isTrue();
            String sid = realJwt.extractSessionId(response.getAccessToken());
            verify(bearerIdleSessionService).ensureActiveSession(
                    org.mockito.ArgumentMatchers.eq(user),
                    org.mockito.ArgumentMatchers.eq(sid),
                    any(), any());
        }
    }

    @Nested
    @DisplayName("AppleSignInServiceImpl.issueTokens")
    class AppleSignInIssueTokens {

        @Mock private com.coresolution.consultation.integration.apple.AppleIdTokenVerifier idTokenVerifier;
        @Mock private com.coresolution.consultation.integration.apple.AppleOAuth2Client oauthClient;
        @Mock private UserRepository userRepository;
        @Mock private UserSocialAccountRepository userSocialAccountRepository;
        @Mock private PersonalDataEncryptionUtil encryptionUtil;

        @InjectMocks
        private AppleSignInServiceImpl service;

        @BeforeEach
        void setUp() {
            TenantContextHolder.setTenantId(TENANT_ID);
            ReflectionTestUtils.setField(service, "jwtService", realJwt);
            when(userRepository.updateLastLoginAt(any(), any(), any(), any())).thenReturn(1);
            when(encryptionUtil.safeDecrypt(any())).thenAnswer(inv -> inv.getArgument(0));
        }

        @AfterEach
        void tearDown() {
            TenantContextHolder.clear();
        }

        @ParameterizedTest(name = "{0}")
        @EnumSource(value = UserRole.class, names = {"CLIENT", "CONSULTANT", "ADMIN"})
        @DisplayName("issueTokens → Jwt 훅 ensureActiveSession")
        void issueTokens_registersViaJwtHook(UserRole role) throws Exception {
            User user = userWithRole(role);
            Method method = AppleSignInServiceImpl.class.getDeclaredMethod(
                    "issueTokens", User.class, String.class);
            method.setAccessible(true);
            AppleSignInResponse response =
                    (AppleSignInResponse) method.invoke(service, user, "ok");

            assertThat(response.isSuccess()).isTrue();
            String sid = realJwt.extractSessionId(response.getAccessToken());
            verify(bearerIdleSessionService).ensureActiveSession(
                    org.mockito.ArgumentMatchers.eq(user),
                    org.mockito.ArgumentMatchers.eq(sid),
                    any(), any());
        }
    }

    private static User userWithRole(UserRole role) {
        User user = User.builder()
                .userId("uid-" + UUID.randomUUID())
                .email(role.name().toLowerCase() + "-" + UUID.randomUUID() + "@example.com")
                .name("바인드테스터")
                .nickname("nick")
                .role(role)
                .isActive(true)
                .build();
        user.setId(Math.abs(UUID.randomUUID().getMostSignificantBits()));
        user.setTenantId(TENANT_ID);
        return user;
    }
}
