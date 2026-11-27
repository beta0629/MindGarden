package com.coresolution.consultation.sct.integration;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import com.coresolution.consultation.ConsultationManagementApplication;
import com.coresolution.consultation.entity.SystemConfig;
import com.coresolution.consultation.repository.SystemConfigRepository;
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
import com.coresolution.consultation.sct.service.SctIdentityOtpDevCodeStore;
import com.coresolution.consultation.sct.service.SctIdentityOtpService;
import com.coresolution.consultation.security.pii.PiiHmacService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.ActiveProfiles;

/**
 * SCT 본인확인 OTP — 단축 링크 교환 코드 경로 send/confirm 회귀.
 *
 * <p>SMS 실발송 금지({@code sms.auth.test-mode}). Redis 는 Mockito 없는 인메모리
 * {@link StringRedisTemplate}. OTP 평문은 test 전용 {@link SctIdentityOtpDevCodeStore} 로 peek.</p>
 *
 * @author MindGarden
 * @since 2026-11-27
 */
@SpringBootTest(classes = ConsultationManagementApplication.class)
@ActiveProfiles("test")
@Import(SctIdentityOtpExchangeCodeIntegrationTest.ExchangeOtpTestConfig.class)
@Timeout(value = 3, unit = TimeUnit.MINUTES)
@DisplayName("SCT identity OTP exchange code resolve")
class SctIdentityOtpExchangeCodeIntegrationTest {

    private static final String MATCH_PHONE = "01012345678";
    private static final ZoneId TOKEN_EXPIRY_ZONE = ZoneId.of("Asia/Seoul");

    @TestConfiguration
    static class ExchangeOtpTestConfig {

        private static final SctInMemoryStringRedisSupport.Harness REDIS =
                SctInMemoryStringRedisSupport.create();

        private static final TestDevCodeStore DEV_CODES = new TestDevCodeStore();

        @Bean
        @Primary
        StringRedisTemplate stringRedisTemplate() {
            return REDIS.template();
        }

        @Bean
        SctIdentityOtpDevCodeStore sctIdentityOtpDevCodeStore() {
            return DEV_CODES;
        }
    }

    /**
     * {@code @Profile("dev")} Impl 과 동일한 ConcurrentHashMap 기억·조회. test 프로파일 전용.
     */
    static final class TestDevCodeStore implements SctIdentityOtpDevCodeStore {

        private final ConcurrentHashMap<String, String> codes = new ConcurrentHashMap<>();

        @Override
        public void remember(String tenantId, Long invitationId, String code) {
            if (tenantId == null || invitationId == null || code == null) {
                return;
            }
            codes.put(key(tenantId, invitationId), code);
        }

        @Override
        public Optional<String> peek(String tenantId, Long invitationId) {
            if (tenantId == null || invitationId == null) {
                return Optional.empty();
            }
            return Optional.ofNullable(codes.get(key(tenantId, invitationId)));
        }

        void clear() {
            codes.clear();
        }

        private static String key(String tenantId, Long invitationId) {
            return tenantId + ":" + invitationId;
        }
    }

    @Autowired
    private SctIdentityOtpService identityOtpService;

    @Autowired
    private SctExchangeCodeStore exchangeCodeStore;

    @Autowired
    private SctIdentityOtpDevCodeStore devCodeStore;

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
        ExchangeOtpTestConfig.REDIS.clear();
        ExchangeOtpTestConfig.DEV_CODES.clear();

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

        String otpCode = requirePeekedOtp();
        entityManager.clear();
        SctVerifyResponse confirmed = identityOtpService.confirmOtp(
                exchange,
                SctIdentityOtpConfirmRequest.builder()
                        .phone(MATCH_PHONE)
                        .code(otpCode)
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

        String otpCode = requirePeekedOtp();
        entityManager.clear();
        SctVerifyResponse confirmed = identityOtpService.confirmOtp(
                rawToken,
                SctIdentityOtpConfirmRequest.builder()
                        .phone(MATCH_PHONE)
                        .code(otpCode)
                        .build(),
                "127.0.0.1");
        assertThat(confirmed.getVerifySessionId()).isNotBlank();
    }

    private String requirePeekedOtp() {
        Optional<String> code = devCodeStore.peek(tenantId, invitation.getId());
        assertThat(code)
                .as("test DevCodeStore must hold OTP after send (sms.auth.test-mode)")
                .isPresent();
        return code.orElseThrow();
    }
}
