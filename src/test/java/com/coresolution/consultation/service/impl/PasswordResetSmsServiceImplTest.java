package com.coresolution.consultation.service.impl;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Consumer;
import com.coresolution.consultation.dto.CredentialSmsResult;
import com.coresolution.consultation.dto.auth.PasswordResetSmsResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.auth.PhoneOtpAttempt;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.auth.PhoneOtpAttemptRepository;
import com.coresolution.consultation.service.ClientCredentialNotificationService;
import com.coresolution.consultation.service.PasswordResetOpaqueTokenStore;
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
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link PasswordResetSmsServiceImpl} — OTP·임시비번 SMS 비밀번호 찾기 단위 테스트.
 *
 * <p>opaque 토큰 실발급(로컬 스토어)으로 PII 미포함·위변조·만료·재사용을 검증한다.</p>
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
    @Mock private UserRepository userRepository;
    @Mock private PersonalDataEncryptionUtil encryptionUtil;
    @Mock private PasswordService passwordService;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private TemporaryPasswordGenerator temporaryPasswordGenerator;
    @Mock private ClientCredentialNotificationService clientCredentialNotificationService;

    private PasswordResetOpaqueTokenStore opaqueTokenStore;
    private PasswordResetSmsServiceImpl service;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_A);
        opaqueTokenStore = new PasswordResetOpaqueTokenStore(noRedis(), 180L, 300L);
        service = new PasswordResetSmsServiceImpl(
            phoneOtpAttemptRepository,
            smsAuthService,
            opaqueTokenStore,
            userRepository,
            encryptionUtil,
            passwordService,
            passwordEncoder,
            temporaryPasswordGenerator,
            clientCredentialNotificationService);

        when(passwordService.encodeSecret(anyString())).thenReturn("ENC(code)");
        when(encryptionUtil.safeDecrypt(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(temporaryPasswordGenerator.generate()).thenReturn("Kp9@mxzw");
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
        assertThat(send.getChallengeToken()).isNotBlank();
        assertThat(send.getChallengeToken()).doesNotContain(".");
        assertThat(send.getMaskedPhone()).isEqualTo("010-****-5678");
        assertThat(send.getExpiresInSeconds()).isEqualTo(180L);
        verify(smsAuthService).sendVerificationCode(PHONE_NORMALIZED);

        PhoneOtpAttempt pending = pendingRow(101L, LocalDateTime.now(), 0);
        when(phoneOtpAttemptRepository.findByIdAndTenantIdAndStatus(101L, TENANT_A, PhoneOtpAttempt.STATUS_PENDING))
            .thenReturn(Optional.of(pending));
        when(passwordEncoder.matches(OTP_CODE, "ENC(code)")).thenReturn(true);

        PasswordResetSmsResponse verify = service.verifyOtp(
            PHONE_RAW, OTP_CODE, send.getChallengeToken(), CLIENT_IP);
        assertThat(verify.isSuccess()).isTrue();
        assertThat(verify.getResetProofToken()).isNotBlank();
        assertThat(verify.getResetProofToken()).doesNotContain(".");
        assertThat(pending.getStatus()).isEqualTo(PhoneOtpAttempt.STATUS_VERIFIED);

        PhoneOtpAttempt verified = pendingRow(101L, LocalDateTime.now(), 1);
        verified.setStatus(PhoneOtpAttempt.STATUS_VERIFIED);
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

        PasswordResetSmsResponse temp = service.sendTempPassword(verify.getResetProofToken(), CLIENT_IP);
        assertThat(temp.isSuccess()).isTrue();
        assertThat(temp.getMessage()).contains("임시 비밀번호");
        assertThat(deliveredTemp.get()).isEqualTo("Kp9@mxzw");
        assertThat(verified.getStatus()).isEqualTo(PhoneOtpAttempt.STATUS_CONSUMED);
        verify(clientCredentialNotificationService).deliverAfterCommit(
            any(), eq(PHONE_NORMALIZED), anyString(), eq("Kp9@mxzw"), eq(TENANT_A), eq(11L));
    }

    @Test
    @DisplayName("opaque 토큰 Base64 디코드해도 정규화·원번호 문자열 미포함")
    void opaqueTokens_doNotEmbedPhoneInDecodablePayload() {
        User local = localUser(11L, TENANT_A, PHONE_NORMALIZED);
        when(userRepository.findByTenantId(TENANT_A)).thenReturn(List.of(local));
        when(smsAuthService.sendVerificationCode(PHONE_NORMALIZED)).thenReturn(OTP_CODE);

        PasswordResetSmsResponse send = service.sendOtp(PHONE_RAW, CLIENT_IP);
        assertOpaqueHasNoPhoneLeak(send.getChallengeToken());

        PhoneOtpAttempt pending = pendingRow(101L, LocalDateTime.now(), 0);
        when(phoneOtpAttemptRepository.findByIdAndTenantIdAndStatus(101L, TENANT_A, PhoneOtpAttempt.STATUS_PENDING))
            .thenReturn(Optional.of(pending));
        when(passwordEncoder.matches(OTP_CODE, "ENC(code)")).thenReturn(true);

        PasswordResetSmsResponse verify = service.verifyOtp(
            PHONE_RAW, OTP_CODE, send.getChallengeToken(), CLIENT_IP);
        assertThat(verify.isSuccess()).isTrue();
        assertOpaqueHasNoPhoneLeak(verify.getResetProofToken());
    }

    @Test
    @DisplayName("위변조 opaque challenge → TOKEN_EXPIRED 거부")
    void verify_tamperedOpaqueChallenge_rejected() {
        PasswordResetSmsResponse res = service.verifyOtp(
            PHONE_RAW, OTP_CODE, "not-a-real-opaque-token-xxxxxx", CLIENT_IP);
        assertThat(res.isSuccess()).isFalse();
        assertThat(res.getCode()).isEqualTo("TOKEN_EXPIRED");
    }

    @Test
    @DisplayName("만료 opaque challenge → TOKEN_EXPIRED 거부")
    void verify_expiredOpaqueChallenge_rejected() throws Exception {
        PasswordResetOpaqueTokenStore shortLived =
            new PasswordResetOpaqueTokenStore(noRedis(), 1L, 300L);
        PasswordResetSmsServiceImpl shortLivedService = new PasswordResetSmsServiceImpl(
            phoneOtpAttemptRepository,
            smsAuthService,
            shortLived,
            userRepository,
            encryptionUtil,
            passwordService,
            passwordEncoder,
            temporaryPasswordGenerator,
            clientCredentialNotificationService);

        when(userRepository.findByTenantId(TENANT_A)).thenReturn(Collections.emptyList());
        PasswordResetSmsResponse send = shortLivedService.sendOtp(PHONE_RAW, CLIENT_IP);
        assertThat(send.isSuccess()).isTrue();
        Thread.sleep(1100L);

        PasswordResetSmsResponse res = shortLivedService.verifyOtp(
            PHONE_RAW, OTP_CODE, send.getChallengeToken(), CLIENT_IP);
        assertThat(res.isSuccess()).isFalse();
        assertThat(res.getCode()).isEqualTo("TOKEN_EXPIRED");
    }

    @Test
    @DisplayName("proof 재사용 → 성공 위장·임시비번 SMS 재발송 0")
    void sendTempPassword_proofReuse_disguiseNoSecondSms() {
        User local = localUser(11L, TENANT_A, PHONE_NORMALIZED);
        when(userRepository.findByTenantId(TENANT_A)).thenReturn(List.of(local));
        when(smsAuthService.sendVerificationCode(PHONE_NORMALIZED)).thenReturn(OTP_CODE);

        PasswordResetSmsResponse send = service.sendOtp(PHONE_RAW, CLIENT_IP);
        PhoneOtpAttempt pending = pendingRow(101L, LocalDateTime.now(), 0);
        when(phoneOtpAttemptRepository.findByIdAndTenantIdAndStatus(101L, TENANT_A, PhoneOtpAttempt.STATUS_PENDING))
            .thenReturn(Optional.of(pending));
        when(passwordEncoder.matches(OTP_CODE, "ENC(code)")).thenReturn(true);

        PasswordResetSmsResponse verify = service.verifyOtp(
            PHONE_RAW, OTP_CODE, send.getChallengeToken(), CLIENT_IP);
        String proof = verify.getResetProofToken();

        PhoneOtpAttempt verified = pendingRow(101L, LocalDateTime.now(), 1);
        verified.setStatus(PhoneOtpAttempt.STATUS_VERIFIED);
        when(phoneOtpAttemptRepository.findByIdAndTenantIdAndStatus(101L, TENANT_A, PhoneOtpAttempt.STATUS_VERIFIED))
            .thenReturn(Optional.of(verified));
        when(userRepository.updatePasswordRequiringCredentialChange(
            eq(11L), eq(TENANT_A), anyString(), any(LocalDateTime.class))).thenReturn(1);
        org.mockito.Mockito.doAnswer(inv -> {
            @SuppressWarnings("unchecked")
            Consumer<CredentialSmsResult> sink = inv.getArgument(0);
            CredentialSmsResult r = new CredentialSmsResult();
            r.setSmsSent(true);
            sink.accept(r);
            return null;
        }).when(clientCredentialNotificationService).deliverAfterCommit(
            any(), anyString(), anyString(), anyString(), anyString(), anyLong());

        PasswordResetSmsResponse first = service.sendTempPassword(proof, CLIENT_IP);
        assertThat(first.isSuccess()).isTrue();
        verify(clientCredentialNotificationService, times(1)).deliverAfterCommit(
            any(), anyString(), anyString(), anyString(), anyString(), anyLong());

        // 재사용: 성공 위장, SMS 추가 호출 없음
        when(phoneOtpAttemptRepository.findByIdAndTenantIdAndStatus(101L, TENANT_A, PhoneOtpAttempt.STATUS_VERIFIED))
            .thenReturn(Optional.empty());
        PasswordResetSmsResponse reuse = service.sendTempPassword(proof, CLIENT_IP);
        assertThat(reuse.isSuccess()).isTrue();
        assertThat(reuse.getMessage()).contains("임시 비밀번호");
        verify(clientCredentialNotificationService, times(1)).deliverAfterCommit(
            any(), anyString(), anyString(), anyString(), anyString(), anyLong());
    }

    @Test
    @DisplayName("타 테넌트 opaque proof → 성공 위장·SMS 0")
    void sendTempPassword_crossTenantProof_disguiseNoSms() {
        String proofForB = opaqueTokenStore.issueProof(TENANT_B, 501L);
        PhoneOtpAttempt verified = pendingRow(501L, LocalDateTime.now(), 1);
        verified.setTenantId(TENANT_B);
        verified.setStatus(PhoneOtpAttempt.STATUS_VERIFIED);
        when(phoneOtpAttemptRepository.findByIdAndTenantIdAndStatus(501L, TENANT_A, PhoneOtpAttempt.STATUS_VERIFIED))
            .thenReturn(Optional.empty());
        when(userRepository.findByTenantId(TENANT_A)).thenReturn(
            List.of(localUser(11L, TENANT_A, PHONE_NORMALIZED)));

        // TENANT_A 컨텍스트에서 TENANT_B proof 사용
        PasswordResetSmsResponse res = service.sendTempPassword(proofForB, CLIENT_IP);
        assertThat(res.isSuccess()).isTrue();
        assertThat(res.getMessage()).contains("임시 비밀번호");
        verify(clientCredentialNotificationService, never()).deliverAfterCommit(
            any(), anyString(), anyString(), anyString(), anyString(), anyLong());
        verify(userRepository, never()).updatePasswordRequiringCredentialChange(
            anyLong(), anyString(), anyString(), any(LocalDateTime.class));
    }

    @Test
    @DisplayName("타 테넌트 opaque challenge → TOKEN_EXPIRED")
    void verify_crossTenantChallenge_rejected() {
        String challengeForB = opaqueTokenStore.issueChallenge(TENANT_B, 601L);
        PasswordResetSmsResponse res = service.verifyOtp(
            PHONE_RAW, OTP_CODE, challengeForB, CLIENT_IP);
        assertThat(res.isSuccess()).isFalse();
        assertThat(res.getCode()).isEqualTo("TOKEN_EXPIRED");
    }

    @Test
    @DisplayName("OTP 만료 시 명시 실패")
    void verify_expiredOtp_fails() {
        String challenge = opaqueTokenStore.issueChallenge(TENANT_A, 201L);
        PhoneOtpAttempt expired = pendingRow(201L, LocalDateTime.now().minusMinutes(10), 0);
        expired.setExpiresAt(LocalDateTime.now().minusMinutes(1));
        when(phoneOtpAttemptRepository.findByIdAndTenantIdAndStatus(201L, TENANT_A, PhoneOtpAttempt.STATUS_PENDING))
            .thenReturn(Optional.of(expired));

        PasswordResetSmsResponse res = service.verifyOtp(PHONE_RAW, OTP_CODE, challenge, CLIENT_IP);
        assertThat(res.isSuccess()).isFalse();
        assertThat(res.getCode()).isEqualTo("OTP_EXPIRED");
        assertThat(expired.getStatus()).isEqualTo(PhoneOtpAttempt.STATUS_EXPIRED);
    }

    @Test
    @DisplayName("시도 횟수 초과 시 명시 실패")
    void verify_maxAttempts_fails() {
        String challenge = opaqueTokenStore.issueChallenge(TENANT_A, 301L);
        PhoneOtpAttempt row = pendingRow(301L, LocalDateTime.now(), PhoneOtpAttempt.MAX_ATTEMPTS);
        when(phoneOtpAttemptRepository.findByIdAndTenantIdAndStatus(301L, TENANT_A, PhoneOtpAttempt.STATUS_PENDING))
            .thenReturn(Optional.of(row));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        PasswordResetSmsResponse res = service.verifyOtp(PHONE_RAW, "000000", challenge, CLIENT_IP);
        assertThat(res.isSuccess()).isFalse();
        assertThat(res.getCode()).isEqualTo("OTP_INVALID");
        assertThat(res.getMessage()).contains("시도 횟수");
        assertThat(row.getStatus()).isEqualTo(PhoneOtpAttempt.STATUS_FAILED);
    }

    @Test
    @DisplayName("미존재 번호: 실 SMS 미발송·성공 응답 스키마 동일·opaque challenge")
    void sendOtp_unknownPhone_sameSuccessSchema_noRealSms() {
        when(userRepository.findByTenantId(TENANT_A)).thenReturn(Collections.emptyList());

        PasswordResetSmsResponse res = service.sendOtp(PHONE_RAW, CLIENT_IP);

        assertThat(res.isSuccess()).isTrue();
        assertThat(res.getChallengeToken()).isNotBlank();
        assertThat(res.getChallengeToken()).doesNotContain(".");
        assertOpaqueHasNoPhoneLeak(res.getChallengeToken());
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

        String proof = opaqueTokenStore.issueProof(TENANT_A, 401L);
        PhoneOtpAttempt verified = pendingRow(401L, LocalDateTime.now(), 1);
        verified.setStatus(PhoneOtpAttempt.STATUS_VERIFIED);
        when(phoneOtpAttemptRepository.findByIdAndTenantIdAndStatus(401L, TENANT_A, PhoneOtpAttempt.STATUS_VERIFIED))
            .thenReturn(Optional.of(verified));

        PasswordResetSmsResponse temp = service.sendTempPassword(proof, CLIENT_IP);
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
        when(userRepository.findByTenantId(TENANT_B)).thenReturn(List.of(otherTenant));

        PasswordResetSmsResponse res = service.sendOtp(PHONE_RAW, CLIENT_IP);
        assertThat(res.isSuccess()).isTrue();
        verify(smsAuthService, never()).sendVerificationCode(anyString());
        verify(userRepository).findByTenantId(TENANT_A);
        verify(userRepository, never()).findByTenantId(TENANT_B);
    }

    private static void assertOpaqueHasNoPhoneLeak(String token) {
        assertThat(token).isNotBlank();
        assertThat(token).doesNotContain(".");
        assertThat(token).doesNotContain(PHONE_NORMALIZED);
        assertThat(token).doesNotContain(PHONE_RAW);
        // '.' split / 세그먼트 Base64 디코드해도 번호 미포함
        for (String part : token.split("\\.", -1)) {
            assertThat(part).doesNotContain(PHONE_NORMALIZED);
            assertThat(part).doesNotContain(PHONE_RAW);
            tryDecodeAndAssertNoPhone(part);
        }
        tryDecodeAndAssertNoPhone(token);
    }

    private static void tryDecodeAndAssertNoPhone(String segment) {
        if (segment == null || segment.isBlank()) {
            return;
        }
        try {
            byte[] decoded = Base64.getUrlDecoder().decode(segment);
            String asText = new String(decoded, StandardCharsets.UTF_8);
            assertThat(asText).doesNotContain(PHONE_NORMALIZED);
            assertThat(asText).doesNotContain(PHONE_RAW);
            assertThat(asText).doesNotContain("010-1234-5678");
        } catch (IllegalArgumentException ignored) {
            try {
                byte[] decoded = Base64.getDecoder().decode(segment);
                String asText = new String(decoded, StandardCharsets.UTF_8);
                assertThat(asText).doesNotContain(PHONE_NORMALIZED);
                assertThat(asText).doesNotContain(PHONE_RAW);
            } catch (IllegalArgumentException ignored2) {
                // 디코드 불가면 opaque 난수 — 통과
            }
        }
    }

    @SuppressWarnings("unchecked")
    private static ObjectProvider<RedisTemplate<String, Object>> noRedis() {
        ObjectProvider<RedisTemplate<String, Object>> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(null);
        return provider;
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
