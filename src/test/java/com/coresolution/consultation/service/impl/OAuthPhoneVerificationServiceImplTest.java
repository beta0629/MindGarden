package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.auth.OAuthPhoneOtpChallengeClaims;
import com.coresolution.consultation.dto.auth.OAuthPhoneSendRequest;
import com.coresolution.consultation.dto.auth.OAuthPhoneSendResponse;
import com.coresolution.consultation.dto.auth.OAuthPhoneVerificationClaims;
import com.coresolution.consultation.dto.auth.OAuthPhoneVerifyRequest;
import com.coresolution.consultation.dto.auth.OAuthPhoneVerifyResponse;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.auth.OAuthProvider;
import com.coresolution.consultation.entity.auth.PhoneOtpAttempt;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.UserSocialAccountRepository;
import com.coresolution.consultation.repository.auth.PhoneOtpAttemptRepository;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.SmsAuthService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.PasswordService;
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
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link OAuthPhoneVerificationServiceImpl} provider-agnostic OTP 발송·검증 분기 단위 테스트.
 *
 * <p>4 종 provider (Apple/Google/Kakao/Naver) 가 동일 로직으로 처리됨을 검증한다.
 * Apple SIWA P1 {@code ApplePhoneVerificationServiceImplTest} 는 그대로 유지되며,
 * 본 테스트는 provider-agnostic 인프라(send 정상/쿨다운/한도, verify 매칭1/매칭N) 와
 * provider 미스매치 거부 등 신규 분기를 검증한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("OAuthPhoneVerificationServiceImpl — provider-agnostic OTP/매칭 분기")
class OAuthPhoneVerificationServiceImplTest {

    private static final String TENANT_ID = "tenant-oauth-phone-ut";
    private static final String PROVIDER_USER_ID = "kakao-id-1234567890";
    private static final String PHONE_RAW = "010-1234-5678";
    private static final String PHONE_NORMALIZED = "01012345678";
    private static final String PHONE_HASH = OAuthPhoneVerificationServiceImpl.sha256Hex(PHONE_NORMALIZED);
    private static final String OTP_CODE = "123456";

    @Mock private PhoneOtpAttemptRepository phoneOtpAttemptRepository;
    @Mock private SmsAuthService smsAuthService;
    @Mock private JwtService jwtService;
    @Mock private UserRepository userRepository;
    @Mock private ClientRepository clientRepository;
    @Mock private UserSocialAccountRepository userSocialAccountRepository;
    @Mock private PersonalDataEncryptionUtil encryptionUtil;
    @Mock private PasswordService passwordService;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks
    private OAuthPhoneVerificationServiceImpl service;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        when(passwordService.encodeSecret(anyString())).thenReturn("ENC(code)");
        when(jwtService.generateOAuthPhoneOtpChallengeToken(any(OAuthPhoneOtpChallengeClaims.class)))
            .thenReturn("oauth-otp-challenge-jwt");
        when(jwtService.generateToken(any(User.class))).thenReturn("oauth-access-jwt");
        when(jwtService.generateRefreshToken(any(User.class))).thenReturn("oauth-refresh-jwt");
        when(encryptionUtil.safeEncrypt(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(encryptionUtil.safeDecrypt(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(userSocialAccountRepository.findByTenantIdAndProviderAndProviderUserIdAndIsDeletedFalse(
            anyString(), anyString(), anyString())).thenReturn(Optional.empty());
        when(clientRepository.saveAndFlush(any(Client.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private OAuthPhoneVerificationClaims verificationClaims(OAuthProvider provider) {
        return verificationClaims(provider, "홍 길동", "https://lh3.googleusercontent.com/a-/AOh14sample");
    }

    private OAuthPhoneVerificationClaims verificationClaims(OAuthProvider provider, String name,
            String profileImageUrl) {
        return OAuthPhoneVerificationClaims.builder()
            .tenantId(TENANT_ID)
            .oauthProvider(provider)
            .providerUserId(PROVIDER_USER_ID)
            .email("user@example.com")
            .name(name)
            .nickname(name)
            .profileImageUrl(profileImageUrl)
            .build();
    }

    private OAuthPhoneOtpChallengeClaims challengeClaims(OAuthProvider provider, Long otpId) {
        return OAuthPhoneOtpChallengeClaims.builder()
            .tenantId(TENANT_ID)
            .oauthProvider(provider)
            .providerUserId(PROVIDER_USER_ID)
            .phoneHash(PHONE_HASH)
            .normalizedPhone(PHONE_NORMALIZED)
            .otpId(otpId)
            .build();
    }

    private PhoneOtpAttempt savedRow(OAuthProvider provider, Long id, LocalDateTime createdAt,
                                     int attempts, String status) {
        PhoneOtpAttempt row = PhoneOtpAttempt.builder()
            .tenantId(TENANT_ID)
            .provider(provider.name())
            .providerUserId(PROVIDER_USER_ID)
            .phoneHash(PHONE_HASH)
            .codeHash("ENC(code)")
            .attempts(attempts)
            .dailyCount(1)
            .status(status)
            .createdAt(createdAt)
            .expiresAt(createdAt.plusMinutes(PhoneOtpAttempt.EXPIRY_MINUTES))
            .build();
        row.setId(id);
        return row;
    }

    @Test
    @DisplayName("[send] KAKAO 정상 발송 → challengeToken + maskedPhone 응답")
    void sendOtp_kakao_normal_returnsChallengeToken() {
        when(jwtService.parseOAuthPhoneVerificationToken(anyString()))
            .thenReturn(verificationClaims(OAuthProvider.KAKAO));
        when(phoneOtpAttemptRepository
            .findFirstByTenantIdAndProviderAndProviderUserIdAndPhoneHashOrderByCreatedAtDesc(
                anyString(), anyString(), anyString(), anyString()))
            .thenReturn(Optional.empty());
        when(phoneOtpAttemptRepository
            .countByTenantIdAndProviderAndProviderUserIdAndCreatedAtGreaterThanEqual(
                anyString(), anyString(), anyString(), any())).thenReturn(0L);
        when(smsAuthService.sendVerificationCode(PHONE_NORMALIZED)).thenReturn(OTP_CODE);
        when(phoneOtpAttemptRepository.saveAndFlush(any(PhoneOtpAttempt.class)))
            .thenAnswer(inv -> {
                PhoneOtpAttempt r = inv.getArgument(0);
                r.setId(101L);
                return r;
            });

        OAuthPhoneSendResponse resp = service.sendOtp(OAuthPhoneSendRequest.builder()
            .oauthProvider(OAuthProvider.KAKAO)
            .phoneVerificationToken("phone-verification-jwt")
            .phone(PHONE_RAW)
            .build());

        assertThat(resp.isSuccess()).isTrue();
        assertThat(resp.getChallengeToken()).isEqualTo("oauth-otp-challenge-jwt");
        assertThat(resp.getMaskedPhone()).isEqualTo("010-****-5678");
        assertThat(resp.getResendCooldownSeconds()).isEqualTo(PhoneOtpAttempt.RESEND_COOLDOWN_SECONDS);
        verify(smsAuthService).sendVerificationCode(PHONE_NORMALIZED);
    }

    @Test
    @DisplayName("[send] NAVER 쿨다운 미경과 → 재발송 차단, retryAfter 반환")
    void sendOtp_naver_cooldown_returnsRetryAfter() {
        when(jwtService.parseOAuthPhoneVerificationToken(anyString()))
            .thenReturn(verificationClaims(OAuthProvider.NAVER));
        PhoneOtpAttempt recent = savedRow(OAuthProvider.NAVER, 5L,
            LocalDateTime.now().minusSeconds(10), 0, PhoneOtpAttempt.STATUS_PENDING);
        when(phoneOtpAttemptRepository
            .findFirstByTenantIdAndProviderAndProviderUserIdAndPhoneHashOrderByCreatedAtDesc(
                anyString(), anyString(), anyString(), anyString()))
            .thenReturn(Optional.of(recent));

        OAuthPhoneSendResponse resp = service.sendOtp(OAuthPhoneSendRequest.builder()
            .oauthProvider(OAuthProvider.NAVER)
            .phoneVerificationToken("phone-verification-jwt")
            .phone(PHONE_RAW)
            .build());

        assertThat(resp.isSuccess()).isFalse();
        assertThat(resp.getCode()).isEqualTo("RESEND_COOLDOWN");
        assertThat(resp.getRetryAfterSeconds()).isPositive();
        verify(smsAuthService, never()).sendVerificationCode(anyString());
    }

    @Test
    @DisplayName("[send] GOOGLE 일 5회 한도 초과 → DAILY_LIMIT_EXCEEDED, SMS 호출 안 함")
    void sendOtp_google_dailyLimit() {
        when(jwtService.parseOAuthPhoneVerificationToken(anyString()))
            .thenReturn(verificationClaims(OAuthProvider.GOOGLE));
        when(phoneOtpAttemptRepository
            .findFirstByTenantIdAndProviderAndProviderUserIdAndPhoneHashOrderByCreatedAtDesc(
                anyString(), anyString(), anyString(), anyString()))
            .thenReturn(Optional.empty());
        when(phoneOtpAttemptRepository
            .countByTenantIdAndProviderAndProviderUserIdAndCreatedAtGreaterThanEqual(
                anyString(), anyString(), anyString(), any()))
            .thenReturn((long) PhoneOtpAttempt.MAX_DAILY_COUNT);

        OAuthPhoneSendResponse resp = service.sendOtp(OAuthPhoneSendRequest.builder()
            .oauthProvider(OAuthProvider.GOOGLE)
            .phoneVerificationToken("phone-verification-jwt")
            .phone(PHONE_RAW)
            .build());

        assertThat(resp.isSuccess()).isFalse();
        assertThat(resp.getCode()).isEqualTo("DAILY_LIMIT_EXCEEDED");
        verify(smsAuthService, never()).sendVerificationCode(anyString());
    }

    @Test
    @DisplayName("[send] provider 미스매치 (token=KAKAO, request=NAVER) → PROVIDER_MISMATCH")
    void sendOtp_providerMismatch_rejected() {
        when(jwtService.parseOAuthPhoneVerificationToken(anyString()))
            .thenReturn(verificationClaims(OAuthProvider.KAKAO));

        OAuthPhoneSendResponse resp = service.sendOtp(OAuthPhoneSendRequest.builder()
            .oauthProvider(OAuthProvider.NAVER)
            .phoneVerificationToken("kakao-pv-jwt")
            .phone(PHONE_RAW)
            .build());

        assertThat(resp.isSuccess()).isFalse();
        assertThat(resp.getCode()).isEqualTo("PROVIDER_MISMATCH");
        verify(smsAuthService, never()).sendVerificationCode(anyString());
    }

    @Test
    @DisplayName("[verify] APPLE 매칭 1명 → apple_sub 연결 + JWT 발급")
    void verifyOtp_apple_match1_linksAndIssuesJwt() {
        long otpId = 201L;
        when(jwtService.parseOAuthPhoneVerificationToken(anyString()))
            .thenReturn(verificationClaims(OAuthProvider.APPLE));
        when(jwtService.parseOAuthPhoneOtpChallengeToken(anyString()))
            .thenReturn(challengeClaims(OAuthProvider.APPLE, otpId));
        PhoneOtpAttempt row = savedRow(OAuthProvider.APPLE, otpId, LocalDateTime.now(), 0,
            PhoneOtpAttempt.STATUS_PENDING);
        when(phoneOtpAttemptRepository.findByIdAndTenantIdAndStatus(otpId, TENANT_ID,
            PhoneOtpAttempt.STATUS_PENDING)).thenReturn(Optional.of(row));
        when(passwordEncoder.matches(OTP_CODE, "ENC(code)")).thenReturn(true);

        User matchedUser = User.builder()
            .userId("client_match")
            .email("a@x.com")
            .name("홍길동")
            .phone(PHONE_NORMALIZED)
            .role(UserRole.CLIENT)
            .build();
        matchedUser.setId(501L);
        matchedUser.setTenantId(TENANT_ID);
        matchedUser.setIsActive(Boolean.TRUE);
        when(userRepository.findByTenantId(TENANT_ID)).thenReturn(List.of(matchedUser));
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        OAuthPhoneVerifyResponse resp = service.verifyOtp(OAuthPhoneVerifyRequest.builder()
            .oauthProvider(OAuthProvider.APPLE)
            .phoneVerificationToken("pv-jwt")
            .challengeToken("oc-jwt")
            .otpCode(OTP_CODE)
            .build());

        assertThat(resp.isSuccess()).isTrue();
        assertThat(resp.getAccessToken()).isEqualTo("oauth-access-jwt");
        assertThat(resp.getRefreshToken()).isEqualTo("oauth-refresh-jwt");
        assertThat(resp.getMatchedAccount()).isNotNull();
        assertThat(resp.getMatchedAccount().getUserId()).isEqualTo(501L);
        // 2026-06-10 P1: 응답 user 표시 필드(name/email/phone) 보강 — FE 빈값 표시 차단.
        assertThat(resp.getMatchedAccount().getName()).isEqualTo("홍길동");
        assertThat(resp.getMatchedAccount().getEmail()).isEqualTo("a@x.com");
        assertThat(resp.getMatchedAccount().getPhone()).isEqualTo(PHONE_NORMALIZED);
        assertThat(matchedUser.getAppleSub()).isEqualTo(PROVIDER_USER_ID);
    }

    @Test
    @DisplayName("[verify][P1] GOOGLE 매칭 1명·name·profileImage 비어 있음 → claims 값으로 백필 (어드민 사전 등록 사용자)")
    void verifyOtp_google_match1_backfillsNameAndProfileImage() {
        long otpId = 261L;
        when(jwtService.parseOAuthPhoneVerificationToken(anyString()))
            .thenReturn(verificationClaims(OAuthProvider.GOOGLE, "구글 홍길동",
                "https://lh3.googleusercontent.com/a-/picture"));
        when(jwtService.parseOAuthPhoneOtpChallengeToken(anyString()))
            .thenReturn(challengeClaims(OAuthProvider.GOOGLE, otpId));
        PhoneOtpAttempt row = savedRow(OAuthProvider.GOOGLE, otpId, LocalDateTime.now(), 0,
            PhoneOtpAttempt.STATUS_PENDING);
        when(phoneOtpAttemptRepository.findByIdAndTenantIdAndStatus(otpId, TENANT_ID,
            PhoneOtpAttempt.STATUS_PENDING)).thenReturn(Optional.of(row));
        when(passwordEncoder.matches(OTP_CODE, "ENC(code)")).thenReturn(true);

        User matchedUser = User.builder()
            .userId("client_admin_registered")
            .email("a@x.com")
            .phone(PHONE_NORMALIZED)
            .role(UserRole.CLIENT)
            .build();
        matchedUser.setId(551L);
        matchedUser.setTenantId(TENANT_ID);
        matchedUser.setIsActive(Boolean.TRUE);
        when(userRepository.findByTenantId(TENANT_ID)).thenReturn(List.of(matchedUser));
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        OAuthPhoneVerifyResponse resp = service.verifyOtp(OAuthPhoneVerifyRequest.builder()
            .oauthProvider(OAuthProvider.GOOGLE)
            .phoneVerificationToken("pv-jwt")
            .challengeToken("oc-jwt")
            .otpCode(OTP_CODE)
            .build());

        assertThat(resp.isSuccess()).isTrue();
        assertThat(matchedUser.getName()).isEqualTo("구글 홍길동");
        assertThat(matchedUser.getProfileImageUrl()).isEqualTo("https://lh3.googleusercontent.com/a-/picture");
        assertThat(matchedUser.getSocialProvider()).isEqualTo("GOOGLE");
        assertThat(matchedUser.getSocialProviderUserId()).isEqualTo(PROVIDER_USER_ID);
        // 2026-06-10 P1: 응답 user 표시 필드 — 백필된 name/profileImageUrl 이 응답에도 반영.
        assertThat(resp.getMatchedAccount().getName()).isEqualTo("구글 홍길동");
        assertThat(resp.getMatchedAccount().getProfileImageUrl())
            .isEqualTo("https://lh3.googleusercontent.com/a-/picture");
        assertThat(resp.getMatchedAccount().getPhone()).isEqualTo(PHONE_NORMALIZED);
        assertThat(resp.getMatchedAccount().getEmail()).isEqualTo("a@x.com");
    }

    @Test
    @DisplayName("[verify][P1] GOOGLE 매칭 1명·user.name 이 이미 있음 → 백필 안 함 (사용자 수정값 보존)")
    void verifyOtp_google_match1_preservesExistingName() {
        long otpId = 262L;
        when(jwtService.parseOAuthPhoneVerificationToken(anyString()))
            .thenReturn(verificationClaims(OAuthProvider.GOOGLE, "구글 새이름",
                "https://lh3.googleusercontent.com/a-/new"));
        when(jwtService.parseOAuthPhoneOtpChallengeToken(anyString()))
            .thenReturn(challengeClaims(OAuthProvider.GOOGLE, otpId));
        PhoneOtpAttempt row = savedRow(OAuthProvider.GOOGLE, otpId, LocalDateTime.now(), 0,
            PhoneOtpAttempt.STATUS_PENDING);
        when(phoneOtpAttemptRepository.findByIdAndTenantIdAndStatus(otpId, TENANT_ID,
            PhoneOtpAttempt.STATUS_PENDING)).thenReturn(Optional.of(row));
        when(passwordEncoder.matches(OTP_CODE, "ENC(code)")).thenReturn(true);

        User matchedUser = User.builder()
            .userId("client_with_name")
            .email("a@x.com")
            .name("기존이름")
            .phone(PHONE_NORMALIZED)
            .profileImageUrl("/uploads/custom-avatar.png")
            .role(UserRole.CLIENT)
            .build();
        matchedUser.setId(552L);
        matchedUser.setTenantId(TENANT_ID);
        matchedUser.setIsActive(Boolean.TRUE);
        when(userRepository.findByTenantId(TENANT_ID)).thenReturn(List.of(matchedUser));
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        OAuthPhoneVerifyResponse resp = service.verifyOtp(OAuthPhoneVerifyRequest.builder()
            .oauthProvider(OAuthProvider.GOOGLE)
            .phoneVerificationToken("pv-jwt")
            .challengeToken("oc-jwt")
            .otpCode(OTP_CODE)
            .build());

        assertThat(resp.isSuccess()).isTrue();
        assertThat(matchedUser.getName()).isEqualTo("기존이름");
        assertThat(matchedUser.getProfileImageUrl()).isEqualTo("/uploads/custom-avatar.png");
    }

    @Test
    @DisplayName("[verify] KAKAO 매칭 0 → 신규 가입 + JWT 발급")
    void verifyOtp_kakao_match0_createsNewUser() {
        long otpId = 211L;
        when(jwtService.parseOAuthPhoneVerificationToken(anyString()))
            .thenReturn(verificationClaims(OAuthProvider.KAKAO));
        when(jwtService.parseOAuthPhoneOtpChallengeToken(anyString()))
            .thenReturn(challengeClaims(OAuthProvider.KAKAO, otpId));
        PhoneOtpAttempt row = savedRow(OAuthProvider.KAKAO, otpId, LocalDateTime.now(), 0,
            PhoneOtpAttempt.STATUS_PENDING);
        when(phoneOtpAttemptRepository.findByIdAndTenantIdAndStatus(otpId, TENANT_ID,
            PhoneOtpAttempt.STATUS_PENDING)).thenReturn(Optional.of(row));
        when(passwordEncoder.matches(OTP_CODE, "ENC(code)")).thenReturn(true);
        when(userRepository.findByTenantId(TENANT_ID)).thenReturn(List.of());
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(601L);
            return u;
        });

        OAuthPhoneVerifyResponse resp = service.verifyOtp(OAuthPhoneVerifyRequest.builder()
            .oauthProvider(OAuthProvider.KAKAO)
            .phoneVerificationToken("pv-jwt")
            .challengeToken("oc-jwt")
            .otpCode(OTP_CODE)
            .build());

        assertThat(resp.isSuccess()).isTrue();
        assertThat(resp.getAccessToken()).isEqualTo("oauth-access-jwt");
        assertThat(resp.getMatchedAccount()).isNotNull();
        assertThat(resp.getMatchedAccount().getRole()).isEqualTo("CLIENT");
    }

    @Test
    @DisplayName("[verify][P1] GOOGLE 매칭 0 → 신규 가입 시 name·profileImage·phone(암호화) 저장 + Client phone 동기화")
    void verifyOtp_google_match0_createsNewUserWithFullProfile() {
        long otpId = 271L;
        when(jwtService.parseOAuthPhoneVerificationToken(anyString()))
            .thenReturn(verificationClaims(OAuthProvider.GOOGLE, "구글 홍길동",
                "https://lh3.googleusercontent.com/a-/signup"));
        when(jwtService.parseOAuthPhoneOtpChallengeToken(anyString()))
            .thenReturn(challengeClaims(OAuthProvider.GOOGLE, otpId));
        PhoneOtpAttempt row = savedRow(OAuthProvider.GOOGLE, otpId, LocalDateTime.now(), 0,
            PhoneOtpAttempt.STATUS_PENDING);
        when(phoneOtpAttemptRepository.findByIdAndTenantIdAndStatus(otpId, TENANT_ID,
            PhoneOtpAttempt.STATUS_PENDING)).thenReturn(Optional.of(row));
        when(passwordEncoder.matches(OTP_CODE, "ENC(code)")).thenReturn(true);
        when(userRepository.findByTenantId(TENANT_ID)).thenReturn(List.of());

        java.util.concurrent.atomic.AtomicReference<User> savedUserRef = new java.util.concurrent.atomic.AtomicReference<>();
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(611L);
            savedUserRef.set(u);
            return u;
        });
        java.util.concurrent.atomic.AtomicReference<Client> savedClientRef = new java.util.concurrent.atomic.AtomicReference<>();
        when(clientRepository.saveAndFlush(any(Client.class))).thenAnswer(inv -> {
            Client c = inv.getArgument(0);
            savedClientRef.set(c);
            return c;
        });

        OAuthPhoneVerifyResponse resp = service.verifyOtp(OAuthPhoneVerifyRequest.builder()
            .oauthProvider(OAuthProvider.GOOGLE)
            .phoneVerificationToken("pv-jwt")
            .challengeToken("oc-jwt")
            .otpCode(OTP_CODE)
            .build());

        assertThat(resp.isSuccess()).isTrue();
        User savedUser = savedUserRef.get();
        assertThat(savedUser).isNotNull();
        assertThat(savedUser.getName()).isEqualTo("구글 홍길동");
        assertThat(savedUser.getProfileImageUrl()).isEqualTo("https://lh3.googleusercontent.com/a-/signup");
        assertThat(savedUser.getPhone()).isEqualTo(PHONE_NORMALIZED);
        assertThat(savedUser.getSocialProvider()).isEqualTo("GOOGLE");
        assertThat(savedUser.getSocialProviderUserId()).isEqualTo(PROVIDER_USER_ID);

        Client savedClient = savedClientRef.get();
        assertThat(savedClient).isNotNull();
        assertThat(savedClient.getPhone()).isEqualTo(PHONE_NORMALIZED);
        // 2026-06-10 P1: 응답 DTO 도 신규 가입 user 표시 필드를 모두 동봉.
        assertThat(resp.getMatchedAccount()).isNotNull();
        assertThat(resp.getMatchedAccount().getName()).isEqualTo("구글 홍길동");
        assertThat(resp.getMatchedAccount().getProfileImageUrl())
            .isEqualTo("https://lh3.googleusercontent.com/a-/signup");
        assertThat(resp.getMatchedAccount().getPhone()).isEqualTo(PHONE_NORMALIZED);
        assertThat(resp.getMatchedAccount().getEmail()).isEqualTo("user@example.com");
    }

    @Test
    @DisplayName("[verify] NAVER 매칭 N + 역할 혼재 → phoneAccountSelectionToken 발급")
    void verifyOtp_naver_matchManyMixedRoles_returnsSelectionToken() {
        long otpId = 222L;
        when(jwtService.parseOAuthPhoneVerificationToken(anyString()))
            .thenReturn(verificationClaims(OAuthProvider.NAVER));
        when(jwtService.parseOAuthPhoneOtpChallengeToken(anyString()))
            .thenReturn(challengeClaims(OAuthProvider.NAVER, otpId));
        PhoneOtpAttempt row = savedRow(OAuthProvider.NAVER, otpId, LocalDateTime.now(), 0,
            PhoneOtpAttempt.STATUS_PENDING);
        when(phoneOtpAttemptRepository.findByIdAndTenantIdAndStatus(otpId, TENANT_ID,
            PhoneOtpAttempt.STATUS_PENDING)).thenReturn(Optional.of(row));
        when(passwordEncoder.matches(OTP_CODE, "ENC(code)")).thenReturn(true);

        User client = User.builder().userId("c").phone(PHONE_NORMALIZED).role(UserRole.CLIENT)
            .name("a").email("a@x.com").build();
        client.setId(701L); client.setTenantId(TENANT_ID); client.setIsActive(Boolean.TRUE);
        User consultant = User.builder().userId("k").phone(PHONE_NORMALIZED).role(UserRole.CONSULTANT)
            .name("b").email("b@x.com").build();
        consultant.setId(702L); consultant.setTenantId(TENANT_ID); consultant.setIsActive(Boolean.TRUE);
        when(userRepository.findByTenantId(TENANT_ID)).thenReturn(List.of(client, consultant));
        when(jwtService.generateOAuthPhoneAccountSelectionToken(anyString(), anyString(), anyString(),
            any(), any())).thenReturn("oauth-selection-jwt");

        OAuthPhoneVerifyResponse resp = service.verifyOtp(OAuthPhoneVerifyRequest.builder()
            .oauthProvider(OAuthProvider.NAVER)
            .phoneVerificationToken("pv-jwt")
            .challengeToken("oc-jwt")
            .otpCode(OTP_CODE)
            .build());

        assertThat(resp.isSuccess()).isTrue();
        assertThat(resp.isRequiresPhoneAccountSelection()).isTrue();
        assertThat(resp.getPhoneAccountSelectionToken()).isEqualTo("oauth-selection-jwt");
        assertThat(resp.getAccessToken()).isNull();
    }

    @Test
    @DisplayName("[verify] OTP 불일치 → OTP_INVALID, status 미변경(PENDING)")
    void verifyOtp_codeMismatch_returnsOtpInvalid() {
        long otpId = 233L;
        when(jwtService.parseOAuthPhoneVerificationToken(anyString()))
            .thenReturn(verificationClaims(OAuthProvider.GOOGLE));
        when(jwtService.parseOAuthPhoneOtpChallengeToken(anyString()))
            .thenReturn(challengeClaims(OAuthProvider.GOOGLE, otpId));
        PhoneOtpAttempt row = savedRow(OAuthProvider.GOOGLE, otpId, LocalDateTime.now(), 0,
            PhoneOtpAttempt.STATUS_PENDING);
        when(phoneOtpAttemptRepository.findByIdAndTenantIdAndStatus(otpId, TENANT_ID,
            PhoneOtpAttempt.STATUS_PENDING)).thenReturn(Optional.of(row));
        when(passwordEncoder.matches(OTP_CODE, "ENC(code)")).thenReturn(false);

        OAuthPhoneVerifyResponse resp = service.verifyOtp(OAuthPhoneVerifyRequest.builder()
            .oauthProvider(OAuthProvider.GOOGLE)
            .phoneVerificationToken("pv-jwt")
            .challengeToken("oc-jwt")
            .otpCode(OTP_CODE)
            .build());

        assertThat(resp.isSuccess()).isFalse();
        assertThat(resp.getCode()).isEqualTo("OTP_INVALID");
        assertThat(row.getAttempts()).isEqualTo(1);
        assertThat(row.getStatus()).isEqualTo(PhoneOtpAttempt.STATUS_PENDING);
    }

    @Test
    @DisplayName("[verify] OTP 만료 (expiresAt 경과) → OTP_EXPIRED, status=EXPIRED")
    void verifyOtp_expired_returnsExpired() {
        long otpId = 244L;
        when(jwtService.parseOAuthPhoneVerificationToken(anyString()))
            .thenReturn(verificationClaims(OAuthProvider.APPLE));
        when(jwtService.parseOAuthPhoneOtpChallengeToken(anyString()))
            .thenReturn(challengeClaims(OAuthProvider.APPLE, otpId));
        PhoneOtpAttempt row = savedRow(OAuthProvider.APPLE, otpId,
            LocalDateTime.now().minusMinutes(PhoneOtpAttempt.EXPIRY_MINUTES + 1), 0,
            PhoneOtpAttempt.STATUS_PENDING);
        when(phoneOtpAttemptRepository.findByIdAndTenantIdAndStatus(otpId, TENANT_ID,
            PhoneOtpAttempt.STATUS_PENDING)).thenReturn(Optional.of(row));

        OAuthPhoneVerifyResponse resp = service.verifyOtp(OAuthPhoneVerifyRequest.builder()
            .oauthProvider(OAuthProvider.APPLE)
            .phoneVerificationToken("pv-jwt")
            .challengeToken("oc-jwt")
            .otpCode(OTP_CODE)
            .build());

        assertThat(resp.isSuccess()).isFalse();
        assertThat(resp.getCode()).isEqualTo("OTP_EXPIRED");
        assertThat(row.getStatus()).isEqualTo(PhoneOtpAttempt.STATUS_EXPIRED);
    }
}
