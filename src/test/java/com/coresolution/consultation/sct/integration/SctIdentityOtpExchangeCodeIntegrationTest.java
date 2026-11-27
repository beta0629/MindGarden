package com.coresolution.consultation.sct.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;
import com.coresolution.consultation.ConsultationManagementApplication;
import com.coresolution.consultation.entity.SystemConfig;
import com.coresolution.consultation.repository.SystemConfigRepository;
import com.coresolution.consultation.service.SmsAuthService;
import com.coresolution.consultation.sct.constant.SctConstants;
import com.coresolution.consultation.sct.constant.SctFeatureFlagKeys;
import com.coresolution.consultation.sct.constant.SctInviteStatus;
import com.coresolution.consultation.sct.dto.SctIdentityOtpConfirmRequest;
import com.coresolution.consultation.sct.dto.SctIdentityOtpSendRequest;
import com.coresolution.consultation.sct.dto.SctIdentityOtpSendResponse;
import com.coresolution.consultation.sct.dto.SctVerifyResponse;
import com.coresolution.consultation.sct.entity.SctConsent;
import com.coresolution.consultation.sct.entity.SctFormTemplate;
import com.coresolution.consultation.sct.entity.SctInvitation;
import com.coresolution.consultation.sct.repository.SctConsentRepository;
import com.coresolution.consultation.sct.repository.SctFormTemplateRepository;
import com.coresolution.consultation.sct.repository.SctInvitationRepository;
import com.coresolution.consultation.sct.service.SctExchangeCodeStore;
import com.coresolution.consultation.sct.service.SctIdentityOtpService;
import com.coresolution.consultation.sct.unit.SctVerifySessionRedisTestSupport;
import com.coresolution.consultation.security.pii.PiiHmacService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.ActiveProfiles;

/**
 * SCT 본인확인 OTP — 단축 링크 교환 코드 경로 send/confirm 회귀.
 *
 * <p>SMS 실발송 금지({@link MockBean} SmsAuthService). Redis 는 인메모리 mock.</p>
 *
 * @author MindGarden
 * @since 2026-11-27
 */
@SpringBootTest(classes = ConsultationManagementApplication.class)
@ActiveProfiles("test")
@Import(SctIdentityOtpExchangeCodeIntegrationTest.InMemoryRedisConfig.class)
@DisplayName("SCT identity OTP exchange code resolve")
class SctIdentityOtpExchangeCodeIntegrationTest {

    private static final String MATCH_PHONE = "01012345678";
    private static final String FIXED_OTP_CODE = "123456";
    private static final ZoneId TOKEN_EXPIRY_ZONE = ZoneId.of("Asia/Seoul");

    @TestConfiguration
    static class InMemoryRedisConfig {

        private static final SctVerifySessionRedisTestSupport.RedisHarness HARNESS =
                SctVerifySessionRedisTestSupport.memoryRedis();

        @Bean
        @Primary
        StringRedisTemplate stringRedisTemplate() {
            return HARNESS.template();
        }
    }

    @MockBean
    private SmsAuthService smsAuthService;

    @Autowired
    private SctIdentityOtpService identityOtpService;

    @Autowired
    private SctExchangeCodeStore exchangeCodeStore;

    @Autowired
    private SctInvitationRepository invitationRepository;

    @Autowired
    private SctFormTemplateRepository formTemplateRepository;

    @Autowired
    private SctConsentRepository consentRepository;

    @Autowired
    private SystemConfigRepository systemConfigRepository;

    @Autowired
    private PiiHmacService piiHmacService;

    @Autowired
    private EntityManager entityManager;

    private String tenantId;
    private String rawToken;
    private SctInvitation invitation;

    @BeforeEach
    void seedFixture() {
        InMemoryRedisConfig.HARNESS.map().clear();
        InMemoryRedisConfig.HARNESS.ttlSeconds().clear();

        when(smsAuthService.isTestMode()).thenReturn(false);
        when(smsAuthService.sendVerificationCode(anyString())).thenReturn(FIXED_OTP_CODE);
        when(smsAuthService.sendConfidentialNotificationMessage(anyString(), anyString()))
                .thenReturn(true);

        tenantId = UUID.randomUUID().toString();
        rawToken = "sct-ex-" + UUID.randomUUID();
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
                .formVersion("v3-ex-" + UUID.randomUUID().toString().substring(0, 8))
                .title("otp-exchange")
                .instructionText("i")
                .isActive(true)
                .isDeleted(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());

        String phoneHash = piiHmacService.hmacHex(MATCH_PHONE);
        invitation = SctInvitation.builder()
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
        entityManager.clear();
    }

    @Test
    @DisplayName("교환 코드로 sendOtp → confirmOtp 성공")
    void exchangeCode_sendThenConfirm_succeeds() {
        Instant absoluteExpiry = invitation.getTokenExpiresAt()
                .atZone(TOKEN_EXPIRY_ZONE)
                .toInstant();
        String exchange = exchangeCodeStore.issue(
                invitation.getId(),
                invitation.getTenantId(),
                null,
                invitation.getTokenHash(),
                absoluteExpiry);

        SctIdentityOtpSendResponse send = identityOtpService.sendOtp(
                exchange,
                SctIdentityOtpSendRequest.builder().phone(MATCH_PHONE).build(),
                "127.0.0.1");
        assertThat(send.isAccepted()).isTrue();
        assertThat(send.getMaskedPhone()).isNotBlank();

        entityManager.clear();
        SctVerifyResponse confirmed = identityOtpService.confirmOtp(
                exchange,
                SctIdentityOtpConfirmRequest.builder()
                        .phone(MATCH_PHONE)
                        .code(FIXED_OTP_CODE)
                        .build(),
                "127.0.0.1");
        assertThat(confirmed.getVerifySessionId()).isNotBlank();
    }

    @Test
    @DisplayName("원 토큰(rawToken)으로 sendOtp → confirmOtp 계속 성공")
    void rawToken_sendThenConfirm_succeeds() {
        SctIdentityOtpSendResponse send = identityOtpService.sendOtp(
                rawToken,
                SctIdentityOtpSendRequest.builder().phone(MATCH_PHONE).build(),
                "127.0.0.1");
        assertThat(send.isAccepted()).isTrue();

        entityManager.clear();
        SctVerifyResponse confirmed = identityOtpService.confirmOtp(
                rawToken,
                SctIdentityOtpConfirmRequest.builder()
                        .phone(MATCH_PHONE)
                        .code(FIXED_OTP_CODE)
                        .build(),
                "127.0.0.1");
        assertThat(confirmed.getVerifySessionId()).isNotBlank();
    }
}
