package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Consumer;
import com.coresolution.consultation.dto.CredentialSmsResult;
import com.coresolution.consultation.dto.auth.PasswordResetOtpChallengeClaims;
import com.coresolution.consultation.dto.auth.PasswordResetProofClaims;
import com.coresolution.consultation.dto.auth.PasswordResetSmsResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.auth.PhoneOtpAttempt;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.auth.PhoneOtpAttemptRepository;
import com.coresolution.consultation.service.ClientCredentialNotificationService;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.SmsAuthService;
import com.coresolution.consultation.service.support.TemporaryPasswordGenerator;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.consultation.util.PhoneHashUtils;
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
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link PasswordResetSmsServiceImpl} — OTP·임시비번 SMS 비밀번호 찾기 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-11-01
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("PasswordResetSmsServiceImpl — 휴대폰 비밀번호 찾기")
class PasswordResetSmsServiceImplTest {

    private static final String TENANT_A = "tpr-a-" + UUID.randomUUID().toString().replace("-", "").substring(0, 28);
    private static final String TENANT_B = "tpr-b-" + UUID.randomUUID().toString().replace("-", "").substring(0, 28);
    private static final String PHONE_RAW = "010-1234-5678";
    private static final String PHONE_NORMALIZED = "01012345678";
    private static final String PHONE_HASH = PhoneHashUtils.sha256Hex(PHONE_NORMALIZED);
    private static final String OTP_CODE = "123456";
    private static final String CLIENT_IP = "203.0.113.10";

    @Mock private PhoneOtpAttemptRepository phoneOtpAttemptRepository;
    @Mock private SmsAuthService smsAuthService;
    @Mock private JwtService jwtService;
    @Mock private UserRepository userRepository;
    @Mock private PersonalDataEncryptionUtil encryptionUtil;
    @Mock private PasswordService passwordService;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private TemporaryPasswordGenerator temporaryPasswordGenerator;
    @Mock private ClientCredentialNotificationService clientCredentialNotificationService;

    @InjectMocks
    private PasswordResetSmsServiceImpl service;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_A);
        when(passwordService.encodeSecret(anyString())).thenReturn("ENC(code)");
        when(encryptionUtil.safeDecrypt(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(temporaryPasswordGenerator.generate()).thenReturn("Kp9@mxzw");
        when(jwtService.generatePasswordResetOtpChallengeToken(any(PasswordResetOtpChallengeClaims.class)))
            .thenReturn("challenge-jwt");
        when(jwtService.generatePasswordResetProofToken(any(PasswordResetProofClaims.class)))
            .thenReturn("proof-jwt");
        when(phoneOtpAttemptRepository
            .findFirstByTenantIdAndProviderAndProviderUserIdAndPhoneHashOrderByCreatedAtDesc(
                anyString(), anyString(), anyString(), anyString()))
            .thenReturn(Optional.empty());
        when(phoneOtpAttemptRepository
            .countByTenantIdAndProviderAndProviderUserIdAndCreatedAtGreaterThanEqual(
                anyString(), anyString(), anyString(), any(LocalDateTime.class)))
            .thenReturn(0L);
        when(phoneOtpAttemptRepository.saveAndFlush(any(PhoneOtpAttempt.class))).thenAnswer(inv -> {
            PhoneOtpAttempt row = inv.getArgument(0);
            row.setId(101L);
            return row;
        });
        when(phoneOtpAttemptRepository.save(any(PhoneOtpAttempt.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("성공: OTP 검증 후 임시 비밀번호 SMS deliverAfterCommit 호출")
    void success_verifyThenSendTempPassword() {
        User local = localUser(11L, TENANT_A, PHONE_NORMALIZED);
        when(userRepository.findByTenantId(TENANT_A)).thenReturn(List.of(local));
        when(smsAuthService.sendVerificationCode(PHONE_NORMALIZED)).thenReturn(OTP_CODE);

        PasswordResetSmsResponse send = service.sendOtp(PHONE_RAW, CLIENT_IP);
        assertThat(send.isSuccess()).isTrue();
        assertThat(send.getChallengeToken()).isEqualTo("challenge-jwt");
        assertThat(send.getMaskedPhone()).isEqualTo("010-****-5678");
        assertThat(send.getExpiresInSeconds()).isEqualTo(180L);
        verify(smsAuthService).sendVerificationCode(PHONE_NORMALIZED);

        PhoneOtpAttempt pending = pendingRow(101L, LocalDateTime.now(), 0);
        when(jwtService.parsePasswordResetOtpChallengeToken("challenge-jwt"))
            .thenReturn(PasswordResetOtpChallengeClaims.builder()
                .tenantId(TENANT_A)
                .phoneHash(PHONE_HASH)
                .normalizedPhone(PHONE_NORMALIZED)
                .otpId(101L)
                .build());
        when(phoneOtpAttemptRepository.findByIdAndTenantIdAndStatus(101L, TENANT_A, PhoneOtpAttempt.STATUS_PENDING))
            .thenReturn(Optional.of(pending));
        when(passwordEncoder.matches(OTP_CODE, "ENC(code)")).thenReturn(true);

        PasswordResetSmsResponse verify = service.verifyOtp(PHONE_RAW, OTP_CODE, "challenge-jwt", CLIENT_IP);
        assertThat(verify.isSuccess()).isTrue();
        assertThat(verify.getResetProofToken()).isEqualTo("proof-jwt");
        assertThat(pending.getStatus()).isEqualTo(PhoneOtpAttempt.STATUS_VERIFIED);

        PhoneOtpAttempt verified = pendingRow(101L, LocalDateTime.now(), 1);
        verified.setStatus(PhoneOtpAttempt.STATUS_VERIFIED);
        when(jwtService.parsePasswordResetProofToken("proof-jwt"))
            .thenReturn(PasswordResetProofClaims.builder()
                .tenantId(TENANT_A)
                .phoneHash(PHONE_HASH)
                .normalizedPhone(PHONE_NORMALIZED)
                .otpId(101L)
                .build());
        when(phoneOtpAttemptRepository.findByIdAndTenantIdAndStatus(101L, TENANT_A, PhoneOtpAttempt.STATUS_VERIFIED))
            .thenReturn(Optional.of(verified));
        when(userRepository.updatePasswordRequiringCredentialChange(
            eq(11L), eq(TENANT_A), anyString(), any(LocalDateTime.class))).thenReturn(1);

        AtomicReference<String> deliveredTemp = new AtomicReference<>();
        org.mockito.Mockito.doAnswer(inv -> {
            @SuppressWarnings("unchecked")
            Consumer<CredentialSmsResult> sink = inv.getArgument(0);
            deliveredTemp.set(inv.getArgument(3));
            CredentialSmsResult r = new CredentialSmsResult();
            r.setSmsSent(true);
            sink.accept(r);
            return null;
        }).when(clientCredentialNotificationService).deliverAfterCommit(
            any(), anyString(), anyString(), anyString(), anyString(), anyLong());

        PasswordResetSmsResponse temp = service.sendTempPassword("proof-jwt", CLIENT_IP);
        assertThat(temp.isSuccess()).isTrue();
        assertThat(temp.getMessage()).contains("임시 비밀번호");
        assertThat(deliveredTemp.get()).isEqualTo("Kp9@mxzw");
        assertThat(verified.getStatus()).isEqualTo(PhoneOtpAttempt.STATUS_CONSUMED);
        verify(clientCredentialNotificationService).deliverAfterCommit(
            any(), eq(PHONE_NORMALIZED), anyString(), eq("Kp9@mxzw"), eq(TENANT_A), eq(11L));
    }

    @Test
    @DisplayName("OTP 만료 시 명시 실패")
    void verify_expiredOtp_fails() {
        when(jwtService.parsePasswordResetOtpChallengeToken("challenge-jwt"))
            .thenReturn(PasswordResetOtpChallengeClaims.builder()
                .tenantId(TENANT_A)
                .phoneHash(PHONE_HASH)
                .normalizedPhone(PHONE_NORMALIZED)
                .otpId(201L)
                .build());
        PhoneOtpAttempt expired = pendingRow(201L, LocalDateTime.now().minusMinutes(10), 0);
        expired.setExpiresAt(LocalDateTime.now().minusMinutes(1));
        when(phoneOtpAttemptRepository.findByIdAndTenantIdAndStatus(201L, TENANT_A, PhoneOtpAttempt.STATUS_PENDING))
            .thenReturn(Optional.of(expired));

        PasswordResetSmsResponse res = service.verifyOtp(PHONE_RAW, OTP_CODE, "challenge-jwt", CLIENT_IP);
        assertThat(res.isSuccess()).isFalse();
        assertThat(res.getCode()).isEqualTo("OTP_EXPIRED");
        assertThat(expired.getStatus()).isEqualTo(PhoneOtpAttempt.STATUS_EXPIRED);
    }

    @Test
    @DisplayName("시도 횟수 초과 시 명시 실패")
    void verify_maxAttempts_fails() {
        when(jwtService.parsePasswordResetOtpChallengeToken("challenge-jwt"))
            .thenReturn(PasswordResetOtpChallengeClaims.builder()
                .tenantId(TENANT_A)
                .phoneHash(PHONE_HASH)
                .normalizedPhone(PHONE_NORMALIZED)
                .otpId(301L)
                .build());
        PhoneOtpAttempt row = pendingRow(301L, LocalDateTime.now(), PhoneOtpAttempt.MAX_ATTEMPTS);
        when(phoneOtpAttemptRepository.findByIdAndTenantIdAndStatus(301L, TENANT_A, PhoneOtpAttempt.STATUS_PENDING))
            .thenReturn(Optional.of(row));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        PasswordResetSmsResponse res = service.verifyOtp(PHONE_RAW, "000000", "challenge-jwt", CLIENT_IP);
        assertThat(res.isSuccess()).isFalse();
        assertThat(res.getCode()).isEqualTo("OTP_INVALID");
        assertThat(res.getMessage()).contains("시도 횟수");
        assertThat(row.getStatus()).isEqualTo(PhoneOtpAttempt.STATUS_FAILED);
    }

    @Test
    @DisplayName("미존재 번호: 실 SMS 미발송·성공 응답 스키마 동일")
    void sendOtp_unknownPhone_sameSuccessSchema_noRealSms() {
        when(userRepository.findByTenantId(TENANT_A)).thenReturn(Collections.emptyList());

        PasswordResetSmsResponse res = service.sendOtp(PHONE_RAW, CLIENT_IP);

        assertThat(res.isSuccess()).isTrue();
        assertThat(res.getChallengeToken()).isEqualTo("challenge-jwt");
        assertThat(res.getMaskedPhone()).isEqualTo("010-****-5678");
        assertThat(res.getExpiresInSeconds()).isEqualTo(180L);
        assertThat(res.getResendCooldownSeconds()).isEqualTo(60L);
        verify(smsAuthService, never()).sendVerificationCode(anyString());
        ArgumentCaptor<PhoneOtpAttempt> captor = ArgumentCaptor.forClass(PhoneOtpAttempt.class);
        verify(phoneOtpAttemptRepository).saveAndFlush(captor.capture());
        assertThat(captor.getValue().getProvider()).isEqualTo(PhoneOtpAttempt.PROVIDER_PASSWORD_RESET);
    }

    @Test
    @DisplayName("SNS 계정: OTP 실발송 없고 임시비번도 미발급·성공 응답")
    void socialAccount_noRealOtp_noTempPassword() {
        User social = localUser(22L, TENANT_A, PHONE_NORMALIZED);
        social.setIsSocialAccount(true);
        social.setSocialProvider("KAKAO");
        when(userRepository.findByTenantId(TENANT_A)).thenReturn(List.of(social));

        PasswordResetSmsResponse send = service.sendOtp(PHONE_RAW, CLIENT_IP);
        assertThat(send.isSuccess()).isTrue();
        verify(smsAuthService, never()).sendVerificationCode(anyString());

        PhoneOtpAttempt verified = pendingRow(401L, LocalDateTime.now(), 1);
        verified.setStatus(PhoneOtpAttempt.STATUS_VERIFIED);
        when(jwtService.parsePasswordResetProofToken("proof-jwt"))
            .thenReturn(PasswordResetProofClaims.builder()
                .tenantId(TENANT_A)
                .phoneHash(PHONE_HASH)
                .normalizedPhone(PHONE_NORMALIZED)
                .otpId(401L)
                .build());
        when(phoneOtpAttemptRepository.findByIdAndTenantIdAndStatus(401L, TENANT_A, PhoneOtpAttempt.STATUS_VERIFIED))
            .thenReturn(Optional.of(verified));

        PasswordResetSmsResponse temp = service.sendTempPassword("proof-jwt", CLIENT_IP);
        assertThat(temp.isSuccess()).isTrue();
        assertThat(temp.getMessage()).contains("임시 비밀번호");
        verify(userRepository, never()).updatePasswordRequiringCredentialChange(
            anyLong(), anyString(), anyString(), any(LocalDateTime.class));
        verify(clientCredentialNotificationService, never()).deliverAfterCommit(
            any(), anyString(), anyString(), anyString(), anyString(), anyLong());
    }

    @Test
    @DisplayName("테넌트 격리: 다른 tenant 사용자는 OTP 실발송 대상 아님")
    void tenantIsolation_otherTenantUserNotTarget() {
        User otherTenant = localUser(33L, TENANT_B, PHONE_NORMALIZED);
        when(userRepository.findByTenantId(TENANT_A)).thenReturn(Collections.emptyList());
        // TENANT_B 사용자만 존재 — A 컨텍스트에서는 조회되지 않음
        when(userRepository.findByTenantId(TENANT_B)).thenReturn(List.of(otherTenant));

        PasswordResetSmsResponse res = service.sendOtp(PHONE_RAW, CLIENT_IP);
        assertThat(res.isSuccess()).isTrue();
        verify(smsAuthService, never()).sendVerificationCode(anyString());
        verify(userRepository).findByTenantId(TENANT_A);
        verify(userRepository, never()).findByTenantId(TENANT_B);
    }

    private static User localUser(Long id, String tenantId, String phone) {
        User user = new User();
        user.setId(id);
        user.setTenantId(tenantId);
        user.setPhone(phone);
        user.setEmail("user" + id + "@example.com");
        user.setUserId("user" + id);
        user.setIsActive(true);
        user.setIsDeleted(false);
        user.setIsSocialAccount(false);
        return user;
    }

    private static PhoneOtpAttempt pendingRow(Long id, LocalDateTime createdAt, int attempts) {
        PhoneOtpAttempt row = PhoneOtpAttempt.builder()
            .tenantId(TENANT_A)
            .provider(PhoneOtpAttempt.PROVIDER_PASSWORD_RESET)
            .providerUserId(PHONE_HASH)
            .phoneHash(PHONE_HASH)
            .codeHash("ENC(code)")
            .attempts(attempts)
            .dailyCount(1)
            .status(PhoneOtpAttempt.STATUS_PENDING)
            .createdAt(createdAt)
            .expiresAt(createdAt.plusMinutes(PhoneOtpAttempt.EXPIRY_MINUTES))
            .build();
        row.setId(id);
        return row;
    }
}
