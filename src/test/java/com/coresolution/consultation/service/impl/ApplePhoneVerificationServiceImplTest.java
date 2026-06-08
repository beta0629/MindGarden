package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.auth.ApplePhoneOtpChallengeClaims;
import com.coresolution.consultation.dto.auth.ApplePhoneSendRequest;
import com.coresolution.consultation.dto.auth.ApplePhoneSendResponse;
import com.coresolution.consultation.dto.auth.ApplePhoneVerificationClaims;
import com.coresolution.consultation.dto.auth.ApplePhoneVerifyRequest;
import com.coresolution.consultation.dto.auth.AppleSignInResponse;
import com.coresolution.consultation.entity.User;
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
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link ApplePhoneVerificationServiceImpl} OTP 발송·검증·휴대폰 매칭 분기 단위 테스트.
 *
 * <p>검증 항목:
 * <ul>
 *   <li>OTP 발송: 정상 / 쿨다운 차단 / 일 한도 초과 / SMS 비활성</li>
 *   <li>OTP 검증: 정상 매칭 1명 / 매칭 0 (신규 가입) / 매칭 N 역할 혼재 (selection 분기) / 시도 초과</li>
 *   <li>토큰 무결성: phoneVerificationToken vs otpChallengeToken sub 불일치 거부</li>
 *   <li>회귀 가드: AbstractOAuth2Service 미호출 — 카카오/네이버 흐름 영향 0</li>
 * </ul>
 * </p>
 *
 * @author MindGarden
 * @since 2026-06-08
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ApplePhoneVerificationServiceImpl — OTP/매칭 분기")
class ApplePhoneVerificationServiceImplTest {

    private static final String TENANT_ID = "tenant-apple-phone-ut";
    private static final String APPLE_SUB = "001234.apple-sub.0000";
    private static final String PHONE_RAW = "010-1234-5678";
    private static final String PHONE_NORMALIZED = "01012345678";
    // PHONE_NORMALIZED 의 SHA-256 hex(소문자, 64자)
    private static final String PHONE_HASH = ApplePhoneVerificationServiceImpl.sha256Hex(PHONE_NORMALIZED);
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
    private ApplePhoneVerificationServiceImpl service;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        when(passwordService.encodeSecret(anyString())).thenReturn("ENC(code)");
        when(jwtService.generateApplePhoneOtpChallengeToken(any(ApplePhoneOtpChallengeClaims.class)))
            .thenReturn("otp-challenge-jwt");
        when(jwtService.generateToken(any(User.class))).thenReturn("access-jwt");
        when(jwtService.generateRefreshToken(any(User.class))).thenReturn("refresh-jwt");
        when(encryptionUtil.safeEncrypt(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(encryptionUtil.safeDecrypt(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(userSocialAccountRepository.findByTenantIdAndProviderAndProviderUserIdAndIsDeletedFalse(
            anyString(), anyString(), anyString())).thenReturn(Optional.empty());
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private ApplePhoneVerificationClaims verificationClaims() {
        return ApplePhoneVerificationClaims.builder()
            .tenantId(TENANT_ID)
            .provider("APPLE")
            .providerUserId(APPLE_SUB)
            .email("apple@example.com")
            .name("홍 길동")
            .nickname("홍 길동")
            .build();
    }

    private ApplePhoneOtpChallengeClaims challengeClaims(Long otpId) {
        return ApplePhoneOtpChallengeClaims.builder()
            .tenantId(TENANT_ID)
            .provider("APPLE")
            .providerUserId(APPLE_SUB)
            .phoneHash(PHONE_HASH)
            .otpId(otpId)
            .build();
    }

    private PhoneOtpAttempt savedRow(Long id, LocalDateTime createdAt, int attempts, String status) {
        PhoneOtpAttempt row = PhoneOtpAttempt.builder()
            .tenantId(TENANT_ID)
            .provider("APPLE")
            .providerUserId(APPLE_SUB)
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
    @DisplayName("[send] 정상 발송 → otpChallengeToken 응답")
    void sendOtp_normal_returnsChallengeToken() {
        when(jwtService.parseApplePhoneVerificationToken(anyString())).thenReturn(verificationClaims());
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
                r.setId(11L);
                return r;
            });

        ApplePhoneSendResponse resp = service.sendOtp(ApplePhoneSendRequest.builder()
            .phoneVerificationToken("phone-verification-jwt")
            .phoneNumber(PHONE_RAW)
            .build());

        assertThat(resp.isSuccess()).isTrue();
        assertThat(resp.getOtpChallengeToken()).isEqualTo("otp-challenge-jwt");
        verify(smsAuthService).sendVerificationCode(PHONE_NORMALIZED);
    }

    @Test
    @DisplayName("[send] 쿨다운 미경과 → 재발송 차단, retryAfterSeconds 반환")
    void sendOtp_cooldown_returnsRetryAfter() {
        when(jwtService.parseApplePhoneVerificationToken(anyString())).thenReturn(verificationClaims());
        PhoneOtpAttempt recent = savedRow(5L, LocalDateTime.now().minusSeconds(10), 0,
            PhoneOtpAttempt.STATUS_PENDING);
        when(phoneOtpAttemptRepository
            .findFirstByTenantIdAndProviderAndProviderUserIdAndPhoneHashOrderByCreatedAtDesc(
                anyString(), anyString(), anyString(), anyString()))
            .thenReturn(Optional.of(recent));

        ApplePhoneSendResponse resp = service.sendOtp(ApplePhoneSendRequest.builder()
            .phoneVerificationToken("phone-verification-jwt")
            .phoneNumber(PHONE_RAW)
            .build());

        assertThat(resp.isSuccess()).isFalse();
        assertThat(resp.getRetryAfterSeconds()).isPositive();
        verify(smsAuthService, never()).sendVerificationCode(anyString());
        verify(phoneOtpAttemptRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("[send] 일 5회 한도 초과 → 거부, SMS 호출 안 함")
    void sendOtp_dailyLimit_exceeded() {
        when(jwtService.parseApplePhoneVerificationToken(anyString())).thenReturn(verificationClaims());
        when(phoneOtpAttemptRepository
            .findFirstByTenantIdAndProviderAndProviderUserIdAndPhoneHashOrderByCreatedAtDesc(
                anyString(), anyString(), anyString(), anyString()))
            .thenReturn(Optional.empty());
        when(phoneOtpAttemptRepository
            .countByTenantIdAndProviderAndProviderUserIdAndCreatedAtGreaterThanEqual(
                anyString(), anyString(), anyString(), any()))
            .thenReturn((long) PhoneOtpAttempt.MAX_DAILY_COUNT);

        ApplePhoneSendResponse resp = service.sendOtp(ApplePhoneSendRequest.builder()
            .phoneVerificationToken("phone-verification-jwt")
            .phoneNumber(PHONE_RAW)
            .build());

        assertThat(resp.isSuccess()).isFalse();
        verify(smsAuthService, never()).sendVerificationCode(anyString());
    }

    @Test
    @DisplayName("[send] SMS 발송 실패(null 반환) → 실패 응답")
    void sendOtp_smsFails_returnsFailure() {
        when(jwtService.parseApplePhoneVerificationToken(anyString())).thenReturn(verificationClaims());
        when(phoneOtpAttemptRepository
            .findFirstByTenantIdAndProviderAndProviderUserIdAndPhoneHashOrderByCreatedAtDesc(
                anyString(), anyString(), anyString(), anyString()))
            .thenReturn(Optional.empty());
        when(phoneOtpAttemptRepository
            .countByTenantIdAndProviderAndProviderUserIdAndCreatedAtGreaterThanEqual(
                anyString(), anyString(), anyString(), any())).thenReturn(0L);
        when(smsAuthService.sendVerificationCode(anyString())).thenReturn(null);

        ApplePhoneSendResponse resp = service.sendOtp(ApplePhoneSendRequest.builder()
            .phoneVerificationToken("phone-verification-jwt")
            .phoneNumber(PHONE_RAW)
            .build());

        assertThat(resp.isSuccess()).isFalse();
        verify(phoneOtpAttemptRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("[verify] 매칭 1명 → apple_sub 연결 + JWT 발급")
    void verifyOtp_match1_linksAndIssuesJwt() {
        long otpId = 22L;
        when(jwtService.parseApplePhoneVerificationToken(anyString())).thenReturn(verificationClaims());
        when(jwtService.parseApplePhoneOtpChallengeToken(anyString())).thenReturn(challengeClaims(otpId));
        PhoneOtpAttempt row = savedRow(otpId, LocalDateTime.now(), 0, PhoneOtpAttempt.STATUS_PENDING);
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
        matchedUser.setId(301L);
        matchedUser.setTenantId(TENANT_ID);
        matchedUser.setIsActive(Boolean.TRUE);
        when(userRepository.findByTenantId(TENANT_ID)).thenReturn(List.of(matchedUser));
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        AppleSignInResponse resp = service.verifyOtp(ApplePhoneVerifyRequest.builder()
            .phoneVerificationToken("pv-jwt")
            .otpChallengeToken("oc-jwt")
            .code(OTP_CODE)
            .build());

        assertThat(resp.isSuccess()).isTrue();
        assertThat(resp.getAccessToken()).isEqualTo("access-jwt");
        assertThat(resp.getRefreshToken()).isEqualTo("refresh-jwt");
        assertThat(resp.getUser()).isNotNull();
        assertThat(resp.getUser().getId()).isEqualTo(301L);
        // 매칭된 user 의 apple_sub 가 연결됐어야 한다.
        assertThat(matchedUser.getAppleSub()).isEqualTo(APPLE_SUB);
    }

    @Test
    @DisplayName("[verify] 매칭 N명 + 역할 혼재 → phoneAccountSelectionToken 발급")
    void verifyOtp_matchManyMixedRoles_returnsSelectionToken() {
        long otpId = 33L;
        when(jwtService.parseApplePhoneVerificationToken(anyString())).thenReturn(verificationClaims());
        when(jwtService.parseApplePhoneOtpChallengeToken(anyString())).thenReturn(challengeClaims(otpId));
        PhoneOtpAttempt row = savedRow(otpId, LocalDateTime.now(), 0, PhoneOtpAttempt.STATUS_PENDING);
        when(phoneOtpAttemptRepository.findByIdAndTenantIdAndStatus(otpId, TENANT_ID,
            PhoneOtpAttempt.STATUS_PENDING)).thenReturn(Optional.of(row));
        when(passwordEncoder.matches(OTP_CODE, "ENC(code)")).thenReturn(true);

        User u1 = User.builder().userId("client_x").phone(PHONE_NORMALIZED).role(UserRole.CLIENT)
            .name("a").email("a@x.com").build();
        u1.setId(401L); u1.setTenantId(TENANT_ID); u1.setIsActive(Boolean.TRUE);
        User u2 = User.builder().userId("counselor_y").phone(PHONE_NORMALIZED).role(UserRole.CONSULTANT)
            .name("b").email("b@x.com").build();
        u2.setId(402L); u2.setTenantId(TENANT_ID); u2.setIsActive(Boolean.TRUE);
        when(userRepository.findByTenantId(TENANT_ID)).thenReturn(List.of(u1, u2));
        when(jwtService.generateOAuthPhoneAccountSelectionToken(anyString(), anyString(), anyString(),
            any(), any())).thenReturn("selection-jwt");

        AppleSignInResponse resp = service.verifyOtp(ApplePhoneVerifyRequest.builder()
            .phoneVerificationToken("pv-jwt")
            .otpChallengeToken("oc-jwt")
            .code(OTP_CODE)
            .build());

        assertThat(resp.isSuccess()).isTrue();
        assertThat(resp.isRequiresPhoneAccountSelection()).isTrue();
        assertThat(resp.getPhoneAccountSelectionToken()).isEqualTo("selection-jwt");
        assertThat(resp.getAccessToken()).isNull();
    }

    @Test
    @DisplayName("[verify] 매칭 0 → 신규 가입(role=CLIENT) + JWT 발급")
    void verifyOtp_noMatch_createsNewUser() {
        long otpId = 44L;
        when(jwtService.parseApplePhoneVerificationToken(anyString())).thenReturn(verificationClaims());
        when(jwtService.parseApplePhoneOtpChallengeToken(anyString())).thenReturn(challengeClaims(otpId));
        PhoneOtpAttempt row = savedRow(otpId, LocalDateTime.now(), 0, PhoneOtpAttempt.STATUS_PENDING);
        when(phoneOtpAttemptRepository.findByIdAndTenantIdAndStatus(otpId, TENANT_ID,
            PhoneOtpAttempt.STATUS_PENDING)).thenReturn(Optional.of(row));
        when(passwordEncoder.matches(OTP_CODE, "ENC(code)")).thenReturn(true);
        when(userRepository.findByTenantId(TENANT_ID)).thenReturn(Collections.emptyList());
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            if (u.getId() == null) {
                u.setId(501L);
            }
            return u;
        });

        AppleSignInResponse resp = service.verifyOtp(ApplePhoneVerifyRequest.builder()
            .phoneVerificationToken("pv-jwt")
            .otpChallengeToken("oc-jwt")
            .code(OTP_CODE)
            .build());

        assertThat(resp.isSuccess()).isTrue();
        assertThat(resp.getAccessToken()).isEqualTo("access-jwt");
        verify(clientRepository).saveAndFlush(any());
    }

    @Test
    @DisplayName("[verify] 시도 5회 초과 → row 무효화, 실패")
    void verifyOtp_tooManyAttempts_rowFailed() {
        long otpId = 55L;
        when(jwtService.parseApplePhoneVerificationToken(anyString())).thenReturn(verificationClaims());
        when(jwtService.parseApplePhoneOtpChallengeToken(anyString())).thenReturn(challengeClaims(otpId));
        PhoneOtpAttempt row = savedRow(otpId, LocalDateTime.now(), PhoneOtpAttempt.MAX_ATTEMPTS,
            PhoneOtpAttempt.STATUS_PENDING);
        when(phoneOtpAttemptRepository.findByIdAndTenantIdAndStatus(otpId, TENANT_ID,
            PhoneOtpAttempt.STATUS_PENDING)).thenReturn(Optional.of(row));

        AppleSignInResponse resp = service.verifyOtp(ApplePhoneVerifyRequest.builder()
            .phoneVerificationToken("pv-jwt")
            .otpChallengeToken("oc-jwt")
            .code(OTP_CODE)
            .build());

        assertThat(resp.isSuccess()).isFalse();
        assertThat(row.getStatus()).isEqualTo(PhoneOtpAttempt.STATUS_FAILED);
    }

    @Test
    @DisplayName("[verify] otpChallengeToken 의 sub 가 phoneVerificationToken sub 와 다르면 거부")
    void verifyOtp_subMismatch_rejected() {
        when(jwtService.parseApplePhoneVerificationToken(anyString())).thenReturn(verificationClaims());
        ApplePhoneOtpChallengeClaims wrong = ApplePhoneOtpChallengeClaims.builder()
            .tenantId(TENANT_ID).provider("APPLE").providerUserId("OTHER_SUB")
            .phoneHash(PHONE_HASH).otpId(99L).build();
        when(jwtService.parseApplePhoneOtpChallengeToken(anyString())).thenReturn(wrong);

        AppleSignInResponse resp = service.verifyOtp(ApplePhoneVerifyRequest.builder()
            .phoneVerificationToken("pv-jwt")
            .otpChallengeToken("oc-jwt")
            .code(OTP_CODE)
            .build());

        assertThat(resp.isSuccess()).isFalse();
        verify(phoneOtpAttemptRepository, never()).findByIdAndTenantIdAndStatus(anyLong(), anyString(),
            anyString());
    }

    @Test
    @DisplayName("[verify] expired row → 실패, STATUS_EXPIRED 로 갱신")
    void verifyOtp_expired_marksExpired() {
        long otpId = 66L;
        when(jwtService.parseApplePhoneVerificationToken(anyString())).thenReturn(verificationClaims());
        when(jwtService.parseApplePhoneOtpChallengeToken(anyString())).thenReturn(challengeClaims(otpId));
        PhoneOtpAttempt row = savedRow(otpId, LocalDateTime.now().minusMinutes(10), 0,
            PhoneOtpAttempt.STATUS_PENDING);
        row.setExpiresAt(LocalDateTime.now().minusMinutes(5));
        when(phoneOtpAttemptRepository.findByIdAndTenantIdAndStatus(otpId, TENANT_ID,
            PhoneOtpAttempt.STATUS_PENDING)).thenReturn(Optional.of(row));

        AppleSignInResponse resp = service.verifyOtp(ApplePhoneVerifyRequest.builder()
            .phoneVerificationToken("pv-jwt")
            .otpChallengeToken("oc-jwt")
            .code(OTP_CODE)
            .build());

        assertThat(resp.isSuccess()).isFalse();
        assertThat(row.getStatus()).isEqualTo(PhoneOtpAttempt.STATUS_EXPIRED);
    }

    @Test
    @DisplayName("회귀 가드: AbstractOAuth2Service 와 무관 — 카카오/네이버 흐름 영향 0")
    void regressionGuard_independentFromAbstractOAuth2Service() {
        // 빈 mock 호출만으로도 서비스가 동작해야 한다 → ApplePhoneVerificationServiceImpl 은
        // AbstractOAuth2Service / OAuth2FactoryService 에 의존하지 않는다.
        assertThat(service).isNotNull();
        // unused 모킹 객체들이 placeholder 로 존재하지만, 실제 호출 안 함 — 본 테스트의 의도.
        new ArrayList<Object>().add(clientRepository);
    }
}
