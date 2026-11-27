package com.coresolution.consultation.sct.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import com.coresolution.consultation.ConsultationManagementApplication;
import com.coresolution.consultation.entity.SystemConfig;
import com.coresolution.consultation.entity.auth.PhoneOtpAttempt;
import com.coresolution.consultation.repository.SystemConfigRepository;
import com.coresolution.consultation.repository.auth.PhoneOtpAttemptRepository;
import com.coresolution.consultation.sct.constant.SctConstants;
import com.coresolution.consultation.sct.constant.SctFeatureFlagKeys;
import com.coresolution.consultation.sct.constant.SctInviteStatus;
import com.coresolution.consultation.sct.dto.SctIdentityOtpConfirmRequest;
import com.coresolution.consultation.sct.entity.SctConsent;
import com.coresolution.consultation.sct.entity.SctFormTemplate;
import com.coresolution.consultation.sct.entity.SctInvitation;
import com.coresolution.consultation.sct.exception.SctOtpInvalidException;
import com.coresolution.consultation.sct.exception.SctOtpLockedException;
import com.coresolution.consultation.sct.repository.SctConsentRepository;
import com.coresolution.consultation.sct.repository.SctFormTemplateRepository;
import com.coresolution.consultation.sct.repository.SctInvitationRepository;
import com.coresolution.consultation.sct.service.SctIdentityOtpAttemptRecorder;
import com.coresolution.consultation.sct.service.SctIdentityOtpService;
import com.coresolution.consultation.sct.service.SctIdentityOtpSettings;
import com.coresolution.consultation.security.pii.PiiHmacService;
import com.coresolution.core.security.PasswordService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * SCT 본인확인 OTP 오답 잠금 — REQUIRES_NEW 커밋·maxAttempts LOCKED 회귀.
 *
 * @author MindGarden
 * @since 2026-11-27
 */
@SpringBootTest(classes = ConsultationManagementApplication.class)
@ActiveProfiles("test")
@Timeout(value = 3, unit = TimeUnit.MINUTES)
@DisplayName("SCT identity OTP lock REQUIRES_NEW")
class SctIdentityOtpLockRequiresNewIntegrationTest {

    private static final String MATCH_PHONE = "01012345678";
    private static final String CORRECT_CODE = "123456";
    private static final String WRONG_CODE = "000000";

    @Autowired
    private SctIdentityOtpService identityOtpService;

    @Autowired
    private SctIdentityOtpAttemptRecorder attemptRecorder;

    @Autowired
    private SctIdentityOtpSettings otpSettings;

    @Autowired
    private PhoneOtpAttemptRepository phoneOtpAttemptRepository;

    @Autowired
    private SctInvitationRepository invitationRepository;

    @Autowired
    private SctFormTemplateRepository formTemplateRepository;

    @Autowired
    private SctConsentRepository consentRepository;

    @Autowired
    private SystemConfigRepository systemConfigRepository;

    @Autowired
    private PasswordService passwordService;

    @Autowired
    private PiiHmacService piiHmacService;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Autowired
    private EntityManager entityManager;

    private String tenantId;
    private String rawToken;
    private Long otpRowId;

    @BeforeEach
    void seedFixture() {
        tenantId = UUID.randomUUID().toString();
        rawToken = "sct-otp-" + UUID.randomUUID();
        systemConfigRepository.saveAndFlush(SystemConfig.builder()
                .tenantId(tenantId)
                .configKey(SctFeatureFlagKeys.FEATURE_SCT_ENABLED)
                .configValue("true")
                .category(SctFeatureFlagKeys.FEATURE_CATEGORY)
                .isActive(true)
                .build());

        SctFormTemplate template = formTemplateRepository.saveAndFlush(SctFormTemplate.builder()
                .tenantId("")
                .formType("ADULT")
                .formVersion("v3-otp-" + UUID.randomUUID().toString().substring(0, 8))
                .title("otp-lock")
                .instructionText("i")
                .isActive(true)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());

        String phoneHash = piiHmacService.hmacHex(MATCH_PHONE);
        SctInvitation invitation = SctInvitation.builder()
                .formTemplateId(template.getId())
                .managementNo("MG-" + UUID.randomUUID().toString().substring(0, 8))
                .targetPhoneHash(phoneHash)
                .tokenHash(piiHmacService.hmacHex(rawToken))
                .tokenExpiresAt(LocalDateTime.now().plusDays(7))
                .status(SctInviteStatus.SENT.name())
                .sentByUserId(1L)
                .verifyFailCount(0)
                .requiresGuardian(false)
                .build();
        invitation.setTenantId(tenantId);
        invitation = invitationRepository.saveAndFlush(invitation);

        consentRepository.saveAndFlush(SctConsent.builder()
                .tenantId(tenantId)
                .invitationId(invitation.getId())
                .consentType(SctConstants.CONSENT_IDENTITY_CONTACT)
                .consentTemplateVersion("identity-contact-test")
                .agreed(true)
                .revoked(false)
                .agreedAt(LocalDateTime.now())
                .ipHash("a".repeat(64))
                .build());

        PhoneOtpAttempt otp = phoneOtpAttemptRepository.saveAndFlush(PhoneOtpAttempt.builder()
                .tenantId(tenantId)
                .provider(PhoneOtpAttempt.PROVIDER_SCT_IDENTITY)
                .providerUserId(String.valueOf(invitation.getId()))
                .phoneHash(phoneHash)
                .codeHash(passwordService.encodeSecret(CORRECT_CODE))
                .attempts(0)
                .dailyCount(1)
                .status(PhoneOtpAttempt.STATUS_PENDING)
                .createdAt(LocalDateTime.now().minusSeconds(5))
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .build());
        otpRowId = otp.getId();
        entityManager.clear();
    }

    @Test
    @DisplayName("오답 7회 이내 maxAttempts에서 SCT_OTP_LOCKED, 잠금 후 정답 거부, DB 커밋 유지")
    void wrongAttemptsWithinSevenReachLockedAndRejectCorrectCode() {
        int maxAttempts = otpSettings.maxAttempts(tenantId);
        assertThat(maxAttempts)
                .as("설정 키 %s / 기본상수 %s",
                        SctFeatureFlagKeys.IDENTITY_OTP_MAX_ATTEMPTS,
                        "DEFAULT_IDENTITY_OTP_MAX_ATTEMPTS")
                .isEqualTo(SctFeatureFlagKeys.DEFAULT_IDENTITY_OTP_MAX_ATTEMPTS);
        assertTrue(maxAttempts <= 7, "maxAttempts must be <= 7 for within-seven proof");
        assertTrue(maxAttempts > 0);

        SctIdentityOtpConfirmRequest wrong = SctIdentityOtpConfirmRequest.builder()
                .phone(MATCH_PHONE)
                .code(WRONG_CODE)
                .build();
        for (int i = 1; i < maxAttempts; i++) {
            assertThrows(SctOtpInvalidException.class,
                    () -> identityOtpService.confirmOtp(rawToken, wrong, "127.0.0.1"),
                    "attempt " + i + " should be INVALID before lock");
            entityManager.clear();
            PhoneOtpAttempt mid = phoneOtpAttemptRepository.findById(otpRowId).orElseThrow();
            assertThat(mid.getAttempts()).isEqualTo(i);
            assertThat(mid.getStatus()).isEqualTo(PhoneOtpAttempt.STATUS_PENDING);
        }

        assertThrows(SctOtpLockedException.class,
                () -> identityOtpService.confirmOtp(rawToken, wrong, "127.0.0.1"));
        entityManager.clear();
        PhoneOtpAttempt locked = phoneOtpAttemptRepository.findById(otpRowId).orElseThrow();
        assertThat(locked.getAttempts()).isEqualTo(maxAttempts);
        assertThat(locked.getStatus()).isEqualTo(PhoneOtpAttempt.STATUS_FAILED);

        SctIdentityOtpConfirmRequest correct = SctIdentityOtpConfirmRequest.builder()
                .phone(MATCH_PHONE)
                .code(CORRECT_CODE)
                .build();
        assertThrows(SctOtpLockedException.class,
                () -> identityOtpService.confirmOtp(rawToken, correct, "127.0.0.1"));
    }

    @Test
    @DisplayName("외부 TX rollbackOnly 후에도 오답 attempts 가 커밋되어 남는다")
    void wrongAttemptSurvivesOuterTransactionRollback() {
        int maxAttempts = otpSettings.maxAttempts(tenantId);
        assertTrue(maxAttempts <= 7);

        TransactionTemplate outer = new TransactionTemplate(transactionManager);
        outer.executeWithoutResult(status -> {
            SctIdentityOtpAttemptRecorder.WrongAttemptResult result =
                    attemptRecorder.recordWrongAttempt(otpRowId, tenantId, maxAttempts);
            assertThat(result.attempts()).isEqualTo(1);
            assertThat(result.locked()).isFalse();
            status.setRollbackOnly();
        });

        entityManager.clear();
        PhoneOtpAttempt persisted = phoneOtpAttemptRepository.findById(otpRowId).orElseThrow();
        assertThat(persisted.getAttempts()).isEqualTo(1);
        assertThat(persisted.getStatus()).isEqualTo(PhoneOtpAttempt.STATUS_PENDING);
    }
}
