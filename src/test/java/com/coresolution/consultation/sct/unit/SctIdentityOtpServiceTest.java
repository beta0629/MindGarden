package com.coresolution.consultation.sct.unit;

import com.coresolution.consultation.security.pii.PiiTestSecrets;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import com.coresolution.consultation.entity.auth.PhoneOtpAttempt;
import com.coresolution.consultation.repository.auth.PhoneOtpAttemptRepository;
import com.coresolution.consultation.service.SmsAuthService;
import com.coresolution.consultation.sct.constant.SctConstants;
import com.coresolution.consultation.sct.constant.SctFeatureFlagKeys;
import com.coresolution.consultation.sct.constant.SctInviteStatus;
import com.coresolution.consultation.sct.dto.SctConsentStatusView;
import com.coresolution.consultation.sct.dto.SctIdentityOtpConfirmRequest;
import com.coresolution.consultation.sct.dto.SctIdentityOtpSendRequest;
import com.coresolution.consultation.sct.dto.SctIdentityOtpSendResponse;
import com.coresolution.consultation.sct.dto.SctVerifyResponse;
import com.coresolution.consultation.sct.entity.SctFormTemplate;
import com.coresolution.consultation.sct.entity.SctInvitation;
import com.coresolution.consultation.sct.exception.SctIdentityContactConsentRequiredException;
import com.coresolution.consultation.sct.exception.SctOtpExpiredException;
import com.coresolution.consultation.sct.exception.SctOtpInvalidException;
import com.coresolution.consultation.sct.exception.SctOtpLockedException;
import com.coresolution.consultation.sct.exception.SctOtpRateLimitedException;
import com.coresolution.consultation.sct.repository.SctFormTemplateRepository;
import com.coresolution.consultation.sct.repository.SctInvitationRepository;
import com.coresolution.consultation.sct.repository.SctInviteAccessAttemptRepository;
import com.coresolution.consultation.sct.repository.SctRotatedTokenHashRepository;
import com.coresolution.consultation.sct.service.SctConsentService;
import com.coresolution.consultation.sct.service.SctExchangeCodeStore;
import com.coresolution.consultation.sct.service.SctFeatureGuard;
import com.coresolution.consultation.sct.service.SctIdentityOtpAttemptRecorder;
import com.coresolution.consultation.sct.service.SctIdentityOtpDevCodeStore;
import com.coresolution.consultation.sct.service.SctIdentityOtpRateLimiter;
import com.coresolution.consultation.sct.service.SctIdentityOtpSettings;
import com.coresolution.consultation.sct.service.SctVerifySessionStore;
import com.coresolution.consultation.sct.service.impl.SctIdentityOtpServiceImpl;
import com.coresolution.consultation.sct.service.impl.SctPublicTokenResolverImpl;
import com.coresolution.core.security.PasswordService;
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
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * SCT 본인확인 SMS OTP 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-11-27
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SctIdentityOtpServiceTest {

    private static final String TENANT = "tenant-a";
    private static final String RAW_TOKEN = "sct-otp-token-value-32bytes!!!!!!";
    private static final String PHONE = "01012345678";
    private static final String WRONG_PHONE = "01099999999";
    private static final String CODE = "123456";

    @Mock private SctInvitationRepository invitationRepository;
    @Mock private SctFormTemplateRepository formTemplateRepository;
    @Mock private SctInviteAccessAttemptRepository attemptRepository;
    @Mock private SctRotatedTokenHashRepository rotatedTokenHashRepository;
    @Mock private PhoneOtpAttemptRepository phoneOtpAttemptRepository;
    @Mock private SctFeatureGuard sctFeatureGuard;
    @Mock private SctConsentService sctConsentService;
    @Mock private SmsAuthService smsAuthService;
    @Mock private SctIdentityOtpSettings otpSettings;
    @Mock private ObjectProvider<SctIdentityOtpDevCodeStore> devCodeStore;
    @Mock private SctIdentityOtpDevCodeStore devStore;

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private PasswordService passwordService;
    private SctVerifySessionStore verifySessionStore;
    private SctIdentityOtpRateLimiter rateLimiter;
    private SctIdentityOtpServiceImpl service;
    private SctInvitation invitation;
    private SctFormTemplate template;
    private final AtomicReference<PhoneOtpAttempt> savedRow = new AtomicReference<>();

    @BeforeEach
    void setUp() {
        passwordService = new PasswordService(passwordEncoder);
        SctVerifySessionRedisTestSupport.RedisHarness harness =
                SctVerifySessionRedisTestSupport.memoryRedis();
        harness.map().clear();
        verifySessionStore = new SctVerifySessionStore(
                harness.provider(),
                Clock.systemUTC(),
                SctConstants.VERIFY_SESSION_IDLE_MINUTES * 60L);
        rateLimiter = new SctIdentityOtpRateLimiter();

        invitation = SctInvitation.builder()
                .formTemplateId(1L)
                .targetPhone(PHONE)
                .targetPhoneHash(PiiTestSecrets.hmacService().hmacHex(PHONE))
                .tokenHash(PiiTestSecrets.hmacService().hmacHex(RAW_TOKEN))
                .tokenExpiresAt(LocalDateTime.now().plusDays(7))
                .status(SctInviteStatus.SENT.name())
                .sentByUserId(1L)
                .verifyFailCount(0)
                .requiresGuardian(false)
                .build();
        invitation.setId(100L);
        invitation.setTenantId(TENANT);

        template = SctFormTemplate.builder()
                .id(1L)
                .formType("ADULT")
                .title("t")
                .instructionText("i")
                .formVersion("v3")
                .tenantId("")
                .isActive(true)
                .isDeleted(false)
                .build();

        when(otpSettings.codeLength(anyString()))
                .thenReturn(SctFeatureFlagKeys.DEFAULT_IDENTITY_OTP_CODE_LENGTH);
        when(otpSettings.ttlSeconds(anyString()))
                .thenReturn(SctFeatureFlagKeys.DEFAULT_IDENTITY_OTP_TTL_SECONDS);
        when(otpSettings.maxAttempts(anyString()))
                .thenReturn(SctFeatureFlagKeys.DEFAULT_IDENTITY_OTP_MAX_ATTEMPTS);
        when(otpSettings.resendCooldownSeconds(anyString()))
                .thenReturn(SctFeatureFlagKeys.DEFAULT_IDENTITY_OTP_RESEND_COOLDOWN_SECONDS);
        when(otpSettings.sendLimitPerHourInvite(anyString()))
                .thenReturn(SctFeatureFlagKeys.DEFAULT_IDENTITY_OTP_SEND_LIMIT_PER_HOUR_INVITE);
        when(otpSettings.sendLimitPerHourPhone(anyString()))
                .thenReturn(SctFeatureFlagKeys.DEFAULT_IDENTITY_OTP_SEND_LIMIT_PER_HOUR_PHONE);
        when(otpSettings.sendLimitPerHourIp(anyString()))
                .thenReturn(SctFeatureFlagKeys.DEFAULT_IDENTITY_OTP_SEND_LIMIT_PER_HOUR_IP);
        when(otpSettings.lockMinutes(anyString()))
                .thenReturn(SctFeatureFlagKeys.DEFAULT_IDENTITY_OTP_LOCK_MINUTES);
        when(otpSettings.timingPadMs(anyString())).thenReturn(0);

        when(invitationRepository.findByTokenHashAndIsDeletedFalseForUpdate(any()))
                .thenReturn(Optional.of(invitation));
        when(invitationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(attemptRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(formTemplateRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(template));
        when(sctConsentService.hasIdentityContactConsent(invitation)).thenReturn(true);
        when(sctConsentService.resolveStatus(eq(invitation), eq("ADULT")))
                .thenReturn(SctConsentStatusView.builder().satisfied(true).build());
        when(phoneOtpAttemptRepository
                .countByTenantIdAndProviderAndProviderUserIdAndCreatedAtGreaterThanEqual(
                        anyString(), anyString(), anyString(), any()))
                .thenReturn(0L);
        when(phoneOtpAttemptRepository
                .countByTenantIdAndProviderAndPhoneHashAndCreatedAtGreaterThanEqual(
                        anyString(), anyString(), anyString(), any()))
                .thenReturn(0L);
        when(phoneOtpAttemptRepository
                .findFirstByTenantIdAndProviderAndProviderUserIdAndPhoneHashOrderByCreatedAtDesc(
                        anyString(), anyString(), anyString(), anyString()))
                .thenAnswer(inv -> Optional.ofNullable(savedRow.get()));
        when(phoneOtpAttemptRepository.findByIdAndTenantIdForUpdate(any(), anyString()))
                .thenAnswer(inv -> Optional.ofNullable(savedRow.get()));
        when(phoneOtpAttemptRepository.saveAndFlush(any(PhoneOtpAttempt.class)))
                .thenAnswer(inv -> {
                    PhoneOtpAttempt row = inv.getArgument(0);
                    if (row.getId() == null) {
                        row.setId(1L);
                    }
                    savedRow.set(row);
                    return row;
                });
        when(phoneOtpAttemptRepository.save(any(PhoneOtpAttempt.class)))
                .thenAnswer(inv -> {
                    PhoneOtpAttempt row = inv.getArgument(0);
                    savedRow.set(row);
                    return row;
                });
        when(smsAuthService.isTestMode()).thenReturn(true);
        when(smsAuthService.sendConfidentialNotificationMessage(anyString(), anyString()))
                .thenReturn(true);
        when(devCodeStore.getIfAvailable()).thenReturn(null);

        SctIdentityOtpAttemptRecorder attemptRecorder =
                new SctIdentityOtpAttemptRecorder(phoneOtpAttemptRepository);
        SctExchangeCodeStore exchangeCodeStore = mock(SctExchangeCodeStore.class);
        lenient().when(exchangeCodeStore.resolve(any())).thenReturn(Optional.empty());
        SctPublicTokenResolverImpl tokenResolver = new SctPublicTokenResolverImpl(
                invitationRepository,
                rotatedTokenHashRepository,
                exchangeCodeStore,
                PiiTestSecrets.hmacService());
        service = new SctIdentityOtpServiceImpl(
                invitationRepository,
                formTemplateRepository,
                attemptRepository,
                phoneOtpAttemptRepository,
                verifySessionStore,
                tokenResolver,
                sctFeatureGuard,
                sctConsentService,
                smsAuthService,
                passwordService,
                otpSettings,
                rateLimiter,
                attemptRecorder,
                devCodeStore,
                PiiTestSecrets.hmacService());
    }

    @Test
    @DisplayName("send — 동의 없으면 403")
    void sendWithoutConsent_throws() {
        when(sctConsentService.hasIdentityContactConsent(invitation)).thenReturn(false);
        assertThrows(SctIdentityContactConsentRequiredException.class,
                () -> service.sendOtp(RAW_TOKEN,
                        SctIdentityOtpSendRequest.builder().phone(PHONE).build(), "127.0.0.1"));
        verify(smsAuthService, never()).sendVerificationCode(anyString());
        verify(smsAuthService, never()).sendConfidentialNotificationMessage(anyString(), anyString());
    }

    @Test
    @DisplayName("send — 일치 시 발송·해시 저장, 평문 미저장")
    void sendMatch_storesCodeHashOnly() {
        when(devCodeStore.getIfAvailable()).thenReturn(devStore);

        SctIdentityOtpSendResponse res = service.sendOtp(RAW_TOKEN,
                SctIdentityOtpSendRequest.builder().phone(PHONE).build(), "127.0.0.1");
        assertTrue(res.isAccepted());
        assertNotNull(res.getMaskedPhone());
        assertEquals(180, res.getExpiresInSeconds());
        assertEquals(60, res.getResendCooldownSeconds());

        ArgumentCaptor<PhoneOtpAttempt> rowCaptor = ArgumentCaptor.forClass(PhoneOtpAttempt.class);
        verify(phoneOtpAttemptRepository).saveAndFlush(rowCaptor.capture());
        PhoneOtpAttempt row = rowCaptor.getValue();
        assertEquals(PhoneOtpAttempt.PROVIDER_SCT_IDENTITY, row.getProvider());
        assertEquals("100", row.getProviderUserId());
        assertEquals(PiiTestSecrets.hmacService().hmacHex(PHONE), row.getPhoneHash());
        assertTrue(row.getCodeHash().startsWith("$2"));
        assertFalse(row.getCodeHash().matches("\\d{6}"));

        ArgumentCaptor<String> codeCaptor = ArgumentCaptor.forClass(String.class);
        verify(devStore).remember(eq(TENANT), eq(100L), codeCaptor.capture());
        assertTrue(passwordEncoder.matches(codeCaptor.getValue(), row.getCodeHash()));
        verify(smsAuthService, never()).sendVerificationCode(anyString());
    }

    @Test
    @DisplayName("send — 불일치 시 미발송·동일 응답")
    void sendMismatch_noSendSameSchema() {
        SctIdentityOtpSendResponse res = service.sendOtp(RAW_TOKEN,
                SctIdentityOtpSendRequest.builder().phone(WRONG_PHONE).build(), "127.0.0.1");
        assertTrue(res.isAccepted());
        assertEquals(180, res.getExpiresInSeconds());
        verify(phoneOtpAttemptRepository, never()).saveAndFlush(any());
        verify(smsAuthService, never()).sendConfidentialNotificationMessage(anyString(), anyString());
        verify(smsAuthService, never()).sendVerificationCode(anyString());
    }

    @Test
    @DisplayName("confirm — 성공 시 세션 발급")
    void confirmSuccess_issuesSession() {
        seedPending(CODE, LocalDateTime.now().plusMinutes(3), 0);

        SctVerifyResponse verified = service.confirmOtp(RAW_TOKEN,
                SctIdentityOtpConfirmRequest.builder().phone(PHONE).code(CODE).build(),
                "127.0.0.1");
        assertNotNull(verified.getVerifySessionId());
        assertEquals(PhoneOtpAttempt.STATUS_VERIFIED, savedRow.get().getStatus());
    }

    @Test
    @DisplayName("confirm — guardianRequired=true 여도 세션 발급(보호자 후속 흐름)")
    void confirmSuccess_guardianRequired_stillIssuesSession() {
        when(sctConsentService.resolveStatus(eq(invitation), eq("ADULT")))
                .thenReturn(SctConsentStatusView.builder()
                        .satisfied(false)
                        .guardianRequired(true)
                        .build());
        seedPending(CODE, LocalDateTime.now().plusMinutes(3), 0);

        SctVerifyResponse verified = service.confirmOtp(RAW_TOKEN,
                SctIdentityOtpConfirmRequest.builder().phone(PHONE).code(CODE).build(),
                "127.0.0.1");
        assertNotNull(verified.getVerifySessionId());
        assertFalse(verified.getVerifySessionId().isBlank());
        assertNotNull(verified.getConsent());
        assertTrue(verified.getConsent().isGuardianRequired());
        assertFalse(verified.getConsent().isSatisfied());
        assertEquals(PhoneOtpAttempt.STATUS_VERIFIED, savedRow.get().getStatus());
    }

    @Test
    @DisplayName("confirm — 오답 maxAttempts회 잠금(기본 5) 후 정답도 거부")
    void confirmFiveFailures_locksAndRejectsCorrectCode() {
        int maxAttempts = SctFeatureFlagKeys.DEFAULT_IDENTITY_OTP_MAX_ATTEMPTS;
        assertEquals(5, maxAttempts);
        seedPending(CODE, LocalDateTime.now().plusMinutes(3), 0);
        for (int i = 0; i < maxAttempts - 1; i++) {
            assertThrows(SctOtpInvalidException.class, () -> service.confirmOtp(RAW_TOKEN,
                    SctIdentityOtpConfirmRequest.builder().phone(PHONE).code("000000").build(),
                    "127.0.0.1"));
        }
        assertThrows(SctOtpLockedException.class, () -> service.confirmOtp(RAW_TOKEN,
                SctIdentityOtpConfirmRequest.builder().phone(PHONE).code("000000").build(),
                "127.0.0.1"));
        assertEquals(PhoneOtpAttempt.STATUS_FAILED, savedRow.get().getStatus());
        assertEquals(maxAttempts, savedRow.get().getAttempts());
        assertThrows(SctOtpLockedException.class, () -> service.confirmOtp(RAW_TOKEN,
                SctIdentityOtpConfirmRequest.builder().phone(PHONE).code(CODE).build(),
                "127.0.0.1"));
    }

    @Test
    @DisplayName("confirm — 만료")
    void confirmExpired() {
        seedPending(CODE, LocalDateTime.now().minusSeconds(1), 0);
        assertThrows(SctOtpExpiredException.class, () -> service.confirmOtp(RAW_TOKEN,
                SctIdentityOtpConfirmRequest.builder().phone(PHONE).code(CODE).build(),
                "127.0.0.1"));
        assertEquals(PhoneOtpAttempt.STATUS_EXPIRED, savedRow.get().getStatus());
    }

    @Test
    @DisplayName("send — 쿨다운")
    void sendCooldown() {
        PhoneOtpAttempt recent = PhoneOtpAttempt.builder()
                .tenantId(TENANT)
                .provider(PhoneOtpAttempt.PROVIDER_SCT_IDENTITY)
                .providerUserId("100")
                .phoneHash(PiiTestSecrets.hmacService().hmacHex(PHONE))
                .codeHash(passwordService.encodeSecret(CODE))
                .attempts(0)
                .dailyCount(1)
                .status(PhoneOtpAttempt.STATUS_PENDING)
                .createdAt(LocalDateTime.now().minusSeconds(10))
                .expiresAt(LocalDateTime.now().plusMinutes(2))
                .build();
        recent.setId(9L);
        savedRow.set(recent);

        assertThrows(SctOtpRateLimitedException.class, () -> service.sendOtp(RAW_TOKEN,
                SctIdentityOtpSendRequest.builder().phone(PHONE).build(), "127.0.0.1"));
    }

    @Test
    @DisplayName("send — 시간당 상한")
    void sendHourlyLimit() {
        when(phoneOtpAttemptRepository
                .countByTenantIdAndProviderAndProviderUserIdAndCreatedAtGreaterThanEqual(
                        anyString(), anyString(), anyString(), any()))
                .thenReturn(10L);
        assertThrows(SctOtpRateLimitedException.class, () -> service.sendOtp(RAW_TOKEN,
                SctIdentityOtpSendRequest.builder().phone(PHONE).build(), "127.0.0.1"));
        verify(smsAuthService, never()).sendConfidentialNotificationMessage(anyString(), anyString());
    }

    @Test
    @DisplayName("confirm — 테넌트 격리(다른 초대 OTP 미사용)")
    void confirmTenantIsolation_wrongInviteRowIgnored() {
        PhoneOtpAttempt other = PhoneOtpAttempt.builder()
                .tenantId("other-tenant")
                .provider(PhoneOtpAttempt.PROVIDER_SCT_IDENTITY)
                .providerUserId("999")
                .phoneHash(PiiTestSecrets.hmacService().hmacHex(PHONE))
                .codeHash(passwordService.encodeSecret(CODE))
                .attempts(0)
                .dailyCount(1)
                .status(PhoneOtpAttempt.STATUS_PENDING)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(3))
                .build();
        // repository는 tenant+invite 스코프로 empty → 무효
        when(phoneOtpAttemptRepository
                .findFirstByTenantIdAndProviderAndProviderUserIdAndPhoneHashOrderByCreatedAtDesc(
                        eq(TENANT),
                        eq(PhoneOtpAttempt.PROVIDER_SCT_IDENTITY),
                        eq("100"),
                        eq(PiiTestSecrets.hmacService().hmacHex(PHONE))))
                .thenReturn(Optional.empty());
        assertThrows(SctOtpInvalidException.class, () -> service.confirmOtp(RAW_TOKEN,
                SctIdentityOtpConfirmRequest.builder().phone(PHONE).code(CODE).build(),
                "127.0.0.1"));
        assertEquals(PhoneOtpAttempt.STATUS_PENDING, other.getStatus());
    }

    private void seedPending(String code, LocalDateTime expiresAt, int attempts) {
        PhoneOtpAttempt row = PhoneOtpAttempt.builder()
                .tenantId(TENANT)
                .provider(PhoneOtpAttempt.PROVIDER_SCT_IDENTITY)
                .providerUserId("100")
                .phoneHash(PiiTestSecrets.hmacService().hmacHex(PHONE))
                .codeHash(passwordService.encodeSecret(code))
                .attempts(attempts)
                .dailyCount(1)
                .status(PhoneOtpAttempt.STATUS_PENDING)
                .createdAt(LocalDateTime.now().minusSeconds(5))
                .expiresAt(expiresAt)
                .build();
        row.setId(1L);
        savedRow.set(row);
    }
}
