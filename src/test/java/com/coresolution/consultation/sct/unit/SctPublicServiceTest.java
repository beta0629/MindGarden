package com.coresolution.consultation.sct.unit;

import com.coresolution.consultation.security.pii.PiiTestSecrets;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.service.AuditLogService;
import com.coresolution.consultation.sct.constant.SctConsentKeys;
import com.coresolution.consultation.sct.constant.SctConstants;
import com.coresolution.consultation.sct.constant.SctInviteStatus;
import com.coresolution.consultation.sct.dto.SctConsentStatusView;
import com.coresolution.consultation.sct.dto.SctDraftAnswerItem;
import com.coresolution.consultation.sct.dto.SctDraftSaveRequest;
import com.coresolution.consultation.sct.dto.SctPublicFormResponse;
import com.coresolution.consultation.sct.dto.SctPublicMetaResponse;
import com.coresolution.consultation.sct.dto.SctSubmitRequest;
import com.coresolution.consultation.sct.dto.SctVerifyRequest;
import com.coresolution.consultation.sct.dto.SctVerifyResponse;
import com.coresolution.consultation.sct.entity.SctFormItem;
import com.coresolution.consultation.sct.entity.SctFormTemplate;
import com.coresolution.consultation.sct.entity.SctInvitation;
import com.coresolution.consultation.sct.entity.SctResponseAnswer;
import com.coresolution.consultation.sct.dto.SctConsentRequest;
import com.coresolution.consultation.sct.entity.SctConsentTemplate;
import com.coresolution.consultation.sct.entity.SctRotatedTokenHash;
import com.coresolution.consultation.sct.exception.SctConflictException;
import com.coresolution.consultation.sct.exception.SctFeatureDisabledException;
import com.coresolution.consultation.sct.exception.SctGoneException;
import com.coresolution.consultation.sct.exception.SctIdentityContactConsentRequiredException;
import com.coresolution.consultation.sct.exception.SctOtpRequiredException;
import com.coresolution.consultation.sct.exception.SctVerifyLockedException;
import com.coresolution.consultation.sct.exception.SctVerifyRequiredException;
import com.coresolution.consultation.sct.repository.SctFormItemRepository;
import com.coresolution.consultation.sct.repository.SctFormTemplateRepository;
import com.coresolution.consultation.sct.repository.SctInvitationRepository;
import com.coresolution.consultation.sct.repository.SctInviteAccessAttemptRepository;
import com.coresolution.consultation.sct.repository.SctResponseAnswerRepository;
import com.coresolution.consultation.sct.repository.SctRotatedTokenHashRepository;
import com.coresolution.consultation.sct.service.SctConsentService;
import com.coresolution.consultation.sct.service.SctExchangeCodeStore;
import com.coresolution.consultation.sct.service.SctFeatureGuard;
import com.coresolution.consultation.sct.service.SctSettingsService;
import com.coresolution.consultation.sct.service.SctVerifySessionStore;
import com.coresolution.consultation.sct.service.impl.SctPublicServiceImpl;
import com.coresolution.consultation.sct.service.impl.SctPublicTokenResolverImpl;
import com.coresolution.consultation.security.pii.PiiHmacService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * 공개 SCT 흐름 단위 테스트 — 만료/취소 410, 제출 후 409, verify 잠금, 동의 403, 메타 마스킹 제거.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@ExtendWith(MockitoExtension.class)
class SctPublicServiceTest {

    private static final String TENANT_A = "tenant-a";
    private static final String RAW_TOKEN = "test-opaque-token-value-32bytes!!";
    private static final String PHONE = "01012345678";
    private static final String EMAIL = "user@example.com";

    @Mock private SctInvitationRepository invitationRepository;
    @Mock private SctFormTemplateRepository formTemplateRepository;
    @Mock private SctFormItemRepository formItemRepository;
    @Mock private SctResponseAnswerRepository answerRepository;
    @Mock private SctInviteAccessAttemptRepository attemptRepository;
    @Mock private SctRotatedTokenHashRepository rotatedTokenHashRepository;

    private final SctVerifySessionRedisTestSupport.RedisHarness redisHarness =
            SctVerifySessionRedisTestSupport.memoryRedis();

    @Spy
    private SctVerifySessionStore verifySessionStore = new SctVerifySessionStore(
            redisHarness.provider(),
            Clock.systemUTC());

    @Mock private SctExchangeCodeStore exchangeCodeStore;
    @Mock private SctFeatureGuard sctFeatureGuard;
    @Mock private SctConsentService sctConsentService;
    @Mock private SctSettingsService sctSettingsService;
    @Mock private AuditLogService auditLogService;
    @Mock private EntityManager entityManager;

    @Spy
    private PiiHmacService piiHmacService = PiiTestSecrets.hmacService();

    @InjectMocks
    private SctPublicServiceImpl sctPublicService;

    private SctInvitation invitation;
    private SctFormTemplate template;

    @BeforeEach
    void setUp() {
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
        invitation.setTenantId(TENANT_A);

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

        SctPublicTokenResolverImpl tokenResolver = new SctPublicTokenResolverImpl(
                invitationRepository,
                rotatedTokenHashRepository,
                exchangeCodeStore,
                piiHmacService);
        ReflectionTestUtils.setField(sctPublicService, "publicTokenResolver", tokenResolver);
        ReflectionTestUtils.setField(sctPublicService, "entityManager", entityManager);
        redisHarness.map().clear();
        org.mockito.Mockito.lenient().when(exchangeCodeStore.resolve(any()))
                .thenReturn(Optional.empty());
        org.mockito.Mockito.lenient().when(sctSettingsService.resolvePublicOfficePhone(any()))
                .thenReturn("02-0000-1111");
        org.mockito.Mockito.lenient().when(sctSettingsService.resolvePublicMobilePhone(any()))
                .thenReturn("010-0000-1111");
    }

    private Instant absoluteExpiry() {
        return invitation.getTokenExpiresAt().atZone(ZoneId.of("Asia/Seoul")).toInstant();
    }

    private String issueSession() {
        return verifySessionStore.issue(100L, TENANT_A, absoluteExpiry());
    }

    /** EMAIL 전용 초대 — verify 해시 세션 경로. */
    private void asEmailOnlyInvite() {
        invitation.setTargetPhone(null);
        invitation.setTargetPhoneHash(null);
        invitation.setTargetEmail(EMAIL);
        invitation.setTargetEmailHash(
                PiiTestSecrets.hmacService().hmacHex(EMAIL.trim().toLowerCase(java.util.Locale.ROOT)));
    }

    @Test
    void featureOff_throws404() {
        when(invitationRepository.findByTokenHashAndIsDeletedFalse(any()))
                .thenReturn(Optional.of(invitation));
        doThrow(new SctFeatureDisabledException("off"))
                .when(sctFeatureGuard).requireEnabled(TENANT_A);

        assertThrows(SctFeatureDisabledException.class, () -> sctPublicService.getMeta(RAW_TOKEN));
    }

    @Test
    void expired_metaReturnsExpiredStatus() {
        invitation.setStatus(SctInviteStatus.EXPIRED.name());
        invitation.setRecipientName("홍길동");
        when(invitationRepository.findByTokenHashAndIsDeletedFalse(any()))
                .thenReturn(Optional.of(invitation));
        when(formTemplateRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(template));
        when(formItemRepository.countByFormTemplateId(1L)).thenReturn(50L);
        when(answerRepository.findByTenantIdAndInvitationId(TENANT_A, 100L))
                .thenReturn(Collections.emptyList());
        when(sctConsentService.resolveSignerBand("ADULT", false))
                .thenReturn(SctConsentKeys.SIGNER_BAND_ADULT);

        SctPublicMetaResponse meta = sctPublicService.getMeta(RAW_TOKEN);
        assertEquals(SctInviteStatus.EXPIRED.name(), meta.getStatus());
        assertEquals("02-0000-1111", meta.getOfficePhone());
        assertNull(meta.getRecipientName());
    }

    @Test
    void cancelled_metaReturnsCancelledStatus() {
        invitation.setStatus(SctInviteStatus.CANCELLED.name());
        invitation.setRecipientName("홍길동");
        when(invitationRepository.findByTokenHashAndIsDeletedFalse(any()))
                .thenReturn(Optional.of(invitation));
        when(formTemplateRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(template));
        when(formItemRepository.countByFormTemplateId(1L)).thenReturn(50L);
        when(answerRepository.findByTenantIdAndInvitationId(TENANT_A, 100L))
                .thenReturn(Collections.emptyList());
        when(sctConsentService.resolveSignerBand("ADULT", false))
                .thenReturn(SctConsentKeys.SIGNER_BAND_ADULT);

        SctPublicMetaResponse meta = sctPublicService.getMeta(RAW_TOKEN);
        assertEquals(SctInviteStatus.CANCELLED.name(), meta.getStatus());
        assertNull(meta.getRecipientName());
    }

    @Test
    void meta_exposesChannelHintOnly_noMaskedContact() {
        when(invitationRepository.findByTokenHashAndIsDeletedFalse(any()))
                .thenReturn(Optional.of(invitation));
        when(formTemplateRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(template));
        when(formItemRepository.countByFormTemplateId(1L)).thenReturn(50L);
        when(answerRepository.findByTenantIdAndInvitationId(TENANT_A, 100L))
                .thenReturn(Collections.emptyList());
        when(sctConsentService.resolveSignerBand("ADULT", false))
                .thenReturn(SctConsentKeys.SIGNER_BAND_ADULT);
        when(sctConsentService.activeIdentityContactTemplate()).thenReturn(
                SctConsentTemplate.builder()
                        .title("본인확인용 개인정보 수집·이용 동의")
                        .bodyText("본문")
                        .version(SctConsentKeys.TEMPLATE_VERSION_IDENTITY_CONTACT)
                        .build());
        when(sctConsentService.hasIdentityContactConsent(invitation)).thenReturn(false);

        SctPublicMetaResponse meta = sctPublicService.getMeta(RAW_TOKEN);
        assertEquals(SctConsentKeys.CHANNEL_PHONE, meta.getVerifyChannelHint());
        assertEquals(SctConsentKeys.SIGNER_BAND_ADULT, meta.getSignerBand());
        assertEquals("본인확인용 개인정보 수집·이용 동의", meta.getIdentityConsentTitle());
        assertEquals(SctConsentKeys.TEMPLATE_VERSION_IDENTITY_CONTACT, meta.getIdentityConsentVersion());
        assertEquals(Boolean.FALSE, meta.getIdentityConsentSatisfied());
    }

    @Test
    @DisplayName("verify — IDENTITY_CONTACT 동의 없으면 403 전용 예외")
    void verifyWithoutIdentityContactConsent_throws() {
        when(invitationRepository.findByTokenHashAndIsDeletedFalseForUpdate(any()))
                .thenReturn(Optional.of(invitation));
        when(sctConsentService.hasIdentityContactConsent(invitation)).thenReturn(false);

        SctIdentityContactConsentRequiredException ex = assertThrows(
                SctIdentityContactConsentRequiredException.class,
                () -> sctPublicService.verify(
                        RAW_TOKEN, SctVerifyRequest.builder().phone(PHONE).build(), "127.0.0.1"));
        assertEquals(SctConstants.MSG_IDENTITY_CONTACT_CONSENT_REQUIRED, ex.getMessage());
        verify(attemptRepository, never()).save(any());
        verify(verifySessionStore, never()).issue(any(), any(), any());
    }

    @Test
    @DisplayName("verify — PHONE 채널은 OTP 없이 세션 발급 불가")
    void verifyPhoneChannel_requiresOtp() {
        when(invitationRepository.findByTokenHashAndIsDeletedFalseForUpdate(any()))
                .thenReturn(Optional.of(invitation));
        when(sctConsentService.hasIdentityContactConsent(invitation)).thenReturn(true);

        SctOtpRequiredException ex = assertThrows(
                SctOtpRequiredException.class,
                () -> sctPublicService.verify(
                        RAW_TOKEN, SctVerifyRequest.builder().phone(PHONE).build(), "127.0.0.1"));
        assertEquals(SctConstants.MSG_OTP_REQUIRED, ex.getMessage());
        verify(verifySessionStore, never()).issue(any(), any(), any());
    }

    @Test
    @DisplayName("verify — EMAIL 전용 + IDENTITY_CONTACT 동의 후 해시 일치 시 세션 발급")
    void verifyAfterIdentityContactConsent_emailSucceeds() {
        asEmailOnlyInvite();
        when(invitationRepository.findByTokenHashAndIsDeletedFalseForUpdate(any()))
                .thenReturn(Optional.of(invitation));
        when(invitationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(attemptRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(formTemplateRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(template));
        when(sctConsentService.hasIdentityContactConsent(invitation)).thenReturn(true);
        when(sctConsentService.resolveStatus(eq(invitation), eq("ADULT")))
                .thenReturn(SctConsentStatusView.builder().satisfied(true).build());

        SctVerifyResponse verified = sctPublicService.verify(
                RAW_TOKEN, SctVerifyRequest.builder().email(EMAIL).build(), "127.0.0.1");
        assertTrue(verified.getVerifySessionId() != null && !verified.getVerifySessionId().isBlank());
    }

    @Test
    @DisplayName("saveConsent IDENTITY_CONTACT — verifySession 없이 기록")
    void saveConsent_identityContact_withoutVerifySession() {
        when(invitationRepository.findByTokenHashAndIsDeletedFalse(any()))
                .thenReturn(Optional.of(invitation));
        when(formTemplateRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(template));

        sctPublicService.saveConsent(
                RAW_TOKEN,
                SctConsentRequest.builder()
                        .consentType(SctConstants.CONSENT_IDENTITY_CONTACT)
                        .agreed(true)
                        .build(),
                "127.0.0.1",
                "ua");

        verify(sctConsentService).recordPublicConsent(
                eq(invitation), eq("ADULT"), any(SctConsentRequest.class), eq("127.0.0.1"), eq("ua"));
        verify(verifySessionStore, never()).validate(any(), any(), any());
    }

    @Test
    @DisplayName("saveConsent SENSITIVE_INFO — verifySession 없으면 SCT_VERIFY_REQUIRED")
    void saveConsent_sensitiveWithoutSession_throwsVerifyRequired() {
        when(invitationRepository.findByTokenHashAndIsDeletedFalse(any()))
                .thenReturn(Optional.of(invitation));

        assertThrows(SctVerifyRequiredException.class, () -> sctPublicService.saveConsent(
                RAW_TOKEN,
                SctConsentRequest.builder()
                        .consentType(SctConstants.CONSENT_SENSITIVE_INFO)
                        .agreed(true)
                        .signerName("홍길동")
                        .build(),
                "127.0.0.1",
                "ua"));
    }

    @Test
    void childFormToken_rejected() {
        template.setFormType("CHILD");
        when(invitationRepository.findByTokenHashAndIsDeletedFalse(any()))
                .thenReturn(Optional.of(invitation));
        when(formTemplateRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(template));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> sctPublicService.getMeta(RAW_TOKEN));
        assertEquals(SctConstants.MSG_CHILD_ONLINE_UNSUPPORTED, ex.getMessage());
    }

    @Test
    void verifyLocksAfterFiveFailures_usesPessimisticLoad() {
        asEmailOnlyInvite();
        when(invitationRepository.findByTokenHashAndIsDeletedFalseForUpdate(any()))
                .thenReturn(Optional.of(invitation));
        when(invitationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(attemptRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(sctConsentService.hasIdentityContactConsent(invitation)).thenReturn(true);

        SctVerifyRequest bad = SctVerifyRequest.builder().email("other@example.com").build();
        for (int i = 0; i < SctConstants.VERIFY_MAX_FAILURES - 1; i++) {
            assertThrows(IllegalArgumentException.class,
                    () -> sctPublicService.verify(RAW_TOKEN, bad, "127.0.0.1"));
        }
        assertThrows(SctVerifyLockedException.class,
                () -> sctPublicService.verify(RAW_TOKEN, bad, "127.0.0.1"));
        assertEquals(SctConstants.VERIFY_MAX_FAILURES, invitation.getVerifyFailCount());
        assertTrue(invitation.getVerifyLockedUntil().isAfter(LocalDateTime.now()));
        verify(invitationRepository, never()).findByTokenHashAndIsDeletedFalse(any());
    }

    @Test
    @DisplayName("form/draft/submit — verify 세션 없음·무효 → SctVerifyRequiredException")
    void missingOrInvalidVerifySession_throwsVerifyRequired() {
        when(invitationRepository.findByTokenHashAndIsDeletedFalse(any()))
                .thenReturn(Optional.of(invitation));

        SctVerifyRequiredException missingForm = assertThrows(
                SctVerifyRequiredException.class,
                () -> sctPublicService.getForm(RAW_TOKEN, null));
        assertEquals(SctConstants.MSG_VERIFY_REQUIRED, missingForm.getMessage());

        SctVerifyRequiredException invalidForm = assertThrows(
                SctVerifyRequiredException.class,
                () -> sctPublicService.getForm(RAW_TOKEN, "not-a-real-session"));
        assertEquals(SctConstants.MSG_VERIFY_REQUIRED, invalidForm.getMessage());

        assertThrows(SctVerifyRequiredException.class, () -> sctPublicService.saveDraft(
                RAW_TOKEN, SctDraftSaveRequest.builder()
                        .verifySessionId("expired-or-unknown")
                        .answers(Collections.singletonList(SctDraftAnswerItem.builder()
                                .formItemId(1L).answerText("x").build()))
                        .build()));

        assertThrows(SctVerifyRequiredException.class, () -> sctPublicService.submit(
                RAW_TOKEN, SctSubmitRequest.builder().verifySessionId("").build()));
    }

    @Test
    @DisplayName("verify 세션이 다른 초대용이면 SctVerifyRequiredException")
    void verifySessionForOtherInvitation_throwsVerifyRequired() {
        when(invitationRepository.findByTokenHashAndIsDeletedFalse(any()))
                .thenReturn(Optional.of(invitation));
        String otherInviteSid = verifySessionStore.issue(999L, TENANT_A, absoluteExpiry());

        assertThrows(SctVerifyRequiredException.class,
                () -> sctPublicService.getForm(RAW_TOKEN, otherInviteSid));
    }

    @Test
    void formWithoutConsent_throws403() {
        when(invitationRepository.findByTokenHashAndIsDeletedFalse(any()))
                .thenReturn(Optional.of(invitation));
        when(formTemplateRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(template));
        String sid = issueSession();
        doThrow(new AccessDeniedException("필수 동의가 없습니다."))
                .when(sctConsentService).requireSatisfied(invitation, "ADULT");

        assertThrows(AccessDeniedException.class,
                () -> sctPublicService.getForm(RAW_TOKEN, sid));
    }

    @Test
    void draftWithoutConsent_throws403() {
        when(invitationRepository.findByTokenHashAndIsDeletedFalse(any()))
                .thenReturn(Optional.of(invitation));
        when(formTemplateRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(template));
        String sid = issueSession();
        doThrow(new AccessDeniedException("필수 동의가 없습니다."))
                .when(sctConsentService).requireSatisfied(invitation, "ADULT");

        assertThrows(AccessDeniedException.class, () -> sctPublicService.saveDraft(
                RAW_TOKEN, SctDraftSaveRequest.builder()
                        .verifySessionId(sid)
                        .answers(Collections.singletonList(SctDraftAnswerItem.builder()
                                .formItemId(1L).answerText("x").build()))
                        .build()));
    }

    @Test
    void submitWithoutConsent_throws403() {
        when(invitationRepository.findByTokenHashAndIsDeletedFalse(any()))
                .thenReturn(Optional.of(invitation));
        when(formTemplateRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(template));
        String sid = issueSession();
        doThrow(new AccessDeniedException("필수 동의가 없습니다."))
                .when(sctConsentService).requireSatisfied(invitation, "ADULT");

        assertThrows(AccessDeniedException.class, () -> sctPublicService.submit(
                RAW_TOKEN, SctSubmitRequest.builder().verifySessionId(sid).build()));
    }

    @Test
    void submitThenDraft_throws409() {
        asEmailOnlyInvite();
        when(invitationRepository.findByTokenHashAndIsDeletedFalseForUpdate(any()))
                .thenReturn(Optional.of(invitation));
        when(invitationRepository.findByTokenHashAndIsDeletedFalse(any()))
                .thenReturn(Optional.of(invitation));
        when(invitationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(attemptRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(formTemplateRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(template));
        when(sctConsentService.hasIdentityContactConsent(invitation)).thenReturn(true);
        when(sctConsentService.resolveStatus(eq(invitation), eq("ADULT")))
                .thenReturn(SctConsentStatusView.builder().satisfied(true).build());

        SctVerifyResponse verified = sctPublicService.verify(
                RAW_TOKEN, SctVerifyRequest.builder().email(EMAIL).build(), "127.0.0.1");
        sctPublicService.submit(RAW_TOKEN, SctSubmitRequest.builder()
                .verifySessionId(verified.getVerifySessionId()).build());
        assertEquals(SctInviteStatus.SUBMITTED.name(), invitation.getStatus());

        assertThrows(SctConflictException.class, () -> sctPublicService.saveDraft(
                RAW_TOKEN, SctDraftSaveRequest.builder()
                        .verifySessionId(verified.getVerifySessionId())
                        .answers(Collections.singletonList(SctDraftAnswerItem.builder()
                                .formItemId(1L).answerText("x").build()))
                        .build()));
    }

    @Test
    void otherTenantToken_cannotBeUsedWithWrongContext_bindForcesRowTenant() {
        invitation.setTenantId("tenant-b");
        when(invitationRepository.findByTokenHashAndIsDeletedFalse(any()))
                .thenReturn(Optional.of(invitation));
        when(formTemplateRepository.findByIdAndIsDeletedFalse(1L))
                .thenReturn(Optional.of(template));
        when(formItemRepository.countByFormTemplateId(1L)).thenReturn(50L);
        when(answerRepository.findByTenantIdAndInvitationId("tenant-b", 100L))
                .thenReturn(Collections.emptyList());
        when(sctConsentService.resolveSignerBand("ADULT", false))
                .thenReturn(SctConsentKeys.SIGNER_BAND_ADULT);
        when(sctConsentService.activeIdentityContactTemplate()).thenReturn(null);
        when(sctConsentService.hasIdentityContactConsent(invitation)).thenReturn(false);

        sctPublicService.getMeta(RAW_TOKEN);
        verify(sctFeatureGuard).requireEnabled("tenant-b");
        verify(sctFeatureGuard, never()).requireEnabled(TENANT_A);
        // 동의 조회도 토큰→초대 행 tenant 만 사용(타 테넌트 동의로 충족 불가)
        verify(sctConsentService).hasIdentityContactConsent(invitation);
    }

    @Test
    void rotatedTokenHash_metaReturnsReissued() {
        invitation.setRecipientName("홍길동");
        when(invitationRepository.findByTokenHashAndIsDeletedFalse(any()))
                .thenReturn(Optional.empty());
        when(rotatedTokenHashRepository.findByTokenHash(any()))
                .thenReturn(Optional.of(SctRotatedTokenHash.builder()
                        .tenantId(TENANT_A)
                        .invitationId(100L)
                        .tokenHash(PiiTestSecrets.hmacService().hmacHex(RAW_TOKEN))
                        .rotatedAt(LocalDateTime.now())
                        .build()));
        when(invitationRepository.findByTenantIdAndIdAndIsDeletedFalse(TENANT_A, 100L))
                .thenReturn(Optional.of(invitation));
        when(formTemplateRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(template));
        when(formItemRepository.countByFormTemplateId(1L)).thenReturn(50L);
        when(answerRepository.findByTenantIdAndInvitationId(TENANT_A, 100L))
                .thenReturn(Collections.emptyList());
        when(sctConsentService.resolveSignerBand("ADULT", false))
                .thenReturn(SctConsentKeys.SIGNER_BAND_ADULT);

        SctPublicMetaResponse meta = sctPublicService.getMeta(RAW_TOKEN);
        assertEquals(SctConstants.PUBLIC_STATUS_REISSUED, meta.getStatus());
        assertEquals("010-0000-1111", meta.getMobilePhone());
        assertNull(meta.getRecipientName());
    }

    @Test
    @DisplayName("getMeta — SENT/SUBMITTED 는 recipientName 유지")
    void meta_activeStatuses_keepRecipientName() {
        invitation.setRecipientName("홍길동");
        invitation.setStatus(SctInviteStatus.SENT.name());
        when(invitationRepository.findByTokenHashAndIsDeletedFalse(any()))
                .thenReturn(Optional.of(invitation));
        when(formTemplateRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(template));
        when(formItemRepository.countByFormTemplateId(1L)).thenReturn(50L);
        when(answerRepository.findByTenantIdAndInvitationId(TENANT_A, 100L))
                .thenReturn(Collections.emptyList());
        when(sctConsentService.resolveSignerBand("ADULT", false))
                .thenReturn(SctConsentKeys.SIGNER_BAND_ADULT);

        SctPublicMetaResponse sentMeta = sctPublicService.getMeta(RAW_TOKEN);
        assertEquals("홍길동", sentMeta.getRecipientName());

        invitation.setStatus(SctInviteStatus.SUBMITTED.name());
        SctPublicMetaResponse submittedMeta = sctPublicService.getMeta(RAW_TOKEN);
        assertEquals("홍길동", submittedMeta.getRecipientName());
    }

    @Test
    void unknownTokenHash_throws404NotFound() {
        when(invitationRepository.findByTokenHashAndIsDeletedFalse(any()))
                .thenReturn(Optional.empty());
        when(rotatedTokenHashRepository.findByTokenHash(any())).thenReturn(Optional.empty());

        EntityNotFoundException ex = assertThrows(EntityNotFoundException.class,
                () -> sctPublicService.getMeta(RAW_TOKEN));
        assertEquals("SCT 링크를 찾을 수 없습니다.", ex.getMessage());
    }

    @Test
    void rotatedTokenHash_verify_throws410Gone() {
        when(invitationRepository.findByTokenHashAndIsDeletedFalseForUpdate(any()))
                .thenReturn(Optional.empty());
        when(invitationRepository.findByTokenHashAndIsDeletedFalse(any()))
                .thenReturn(Optional.empty());
        when(rotatedTokenHashRepository.findByTokenHash(any()))
                .thenReturn(Optional.of(SctRotatedTokenHash.builder()
                        .tenantId(TENANT_A)
                        .invitationId(100L)
                        .tokenHash(PiiTestSecrets.hmacService().hmacHex(RAW_TOKEN))
                        .rotatedAt(LocalDateTime.now())
                        .build()));

        assertThrows(SctGoneException.class, () -> sctPublicService.verify(
                RAW_TOKEN, SctVerifyRequest.builder().phone(PHONE).build(), "127.0.0.1"));
    }

    @Test
    @DisplayName("verify — 교환 코드 경로는 tenantId+id ForUpdate 잠금(EMAIL)")
    void verify_exchangePath_usesForUpdateById() {
        asEmailOnlyInvite();
        String exchange = "exchange-opaque-code-for-verify!!";
        when(invitationRepository.findByTokenHashAndIsDeletedFalseForUpdate(any()))
                .thenReturn(Optional.empty());
        when(exchangeCodeStore.resolve(exchange)).thenReturn(Optional.of(
                new SctExchangeCodeStore.ExchangeEntry(
                        100L, TENANT_A, null, false, invitation.getTokenHash())));
        when(invitationRepository.findByTenantIdAndIdAndIsDeletedFalseForUpdate(TENANT_A, 100L))
                .thenReturn(Optional.of(invitation));
        when(invitationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(attemptRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(formTemplateRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(template));
        when(sctConsentService.hasIdentityContactConsent(invitation)).thenReturn(true);
        when(sctConsentService.resolveStatus(eq(invitation), eq("ADULT")))
                .thenReturn(SctConsentStatusView.builder().satisfied(true).build());

        SctVerifyResponse verified = sctPublicService.verify(
                exchange, SctVerifyRequest.builder().email(EMAIL).build(), "127.0.0.1");

        assertTrue(verified.getVerifySessionId() != null && !verified.getVerifySessionId().isBlank());
        verify(invitationRepository).findByTenantIdAndIdAndIsDeletedFalseForUpdate(TENANT_A, 100L);
        verify(invitationRepository, never()).findByTenantIdAndIdAndIsDeletedFalse(any(), any());
    }

    @Test
    @DisplayName("verify — 교환 코드+PHONE 은 ForUpdate 후 OTP 필수")
    void verify_exchangePath_phoneRequiresOtp() {
        String exchange = "exchange-opaque-phone-otp-path!!";
        when(invitationRepository.findByTokenHashAndIsDeletedFalseForUpdate(any()))
                .thenReturn(Optional.empty());
        when(exchangeCodeStore.resolve(exchange)).thenReturn(Optional.of(
                new SctExchangeCodeStore.ExchangeEntry(
                        100L, TENANT_A, null, false, invitation.getTokenHash())));
        when(invitationRepository.findByTenantIdAndIdAndIsDeletedFalseForUpdate(TENANT_A, 100L))
                .thenReturn(Optional.of(invitation));
        when(sctConsentService.hasIdentityContactConsent(invitation)).thenReturn(true);

        SctOtpRequiredException ex = assertThrows(
                SctOtpRequiredException.class,
                () -> sctPublicService.verify(
                        exchange, SctVerifyRequest.builder().phone(PHONE).build(), "127.0.0.1"));
        assertEquals(SctConstants.MSG_OTP_REQUIRED, ex.getMessage());
        verify(invitationRepository).findByTenantIdAndIdAndIsDeletedFalseForUpdate(TENANT_A, 100L);
        verify(verifySessionStore, never()).issue(any(), any(), any());
    }

    @Test
    @DisplayName("verify — 교환 코드 REISSUED landing → 410")
    void verify_exchangeReissuedLanding_throws410() {
        String exchange = "exchange-reissued-landing!!!!!!";
        when(invitationRepository.findByTokenHashAndIsDeletedFalseForUpdate(any()))
                .thenReturn(Optional.empty());
        when(exchangeCodeStore.resolve(exchange)).thenReturn(Optional.of(
                new SctExchangeCodeStore.ExchangeEntry(
                        100L,
                        TENANT_A,
                        SctConstants.PUBLIC_STATUS_REISSUED,
                        false,
                        invitation.getTokenHash())));

        assertThrows(SctGoneException.class, () -> sctPublicService.verify(
                exchange, SctVerifyRequest.builder().phone(PHONE).build(), "127.0.0.1"));
        verify(invitationRepository, never())
                .findByTenantIdAndIdAndIsDeletedFalseForUpdate(any(), any());
    }

    @Test
    @DisplayName("verify — tokenHash 회전 후 구 교환 코드 거부")
    void verify_exchangeTokenHashMismatch_throws404() {
        String exchange = "exchange-stale-after-reissue!!!!!";
        String oldHash = PiiTestSecrets.hmacService().hmacHex("old-token-before-reissue-rotate!");
        when(invitationRepository.findByTokenHashAndIsDeletedFalseForUpdate(any()))
                .thenReturn(Optional.empty());
        when(exchangeCodeStore.resolve(exchange)).thenReturn(Optional.of(
                new SctExchangeCodeStore.ExchangeEntry(100L, TENANT_A, null, false, oldHash)));
        when(invitationRepository.findByTenantIdAndIdAndIsDeletedFalseForUpdate(TENANT_A, 100L))
                .thenReturn(Optional.of(invitation));

        EntityNotFoundException ex = assertThrows(EntityNotFoundException.class,
                () -> sctPublicService.verify(
                        exchange, SctVerifyRequest.builder().phone(PHONE).build(), "127.0.0.1"));
        assertEquals("SCT 링크를 찾을 수 없습니다.", ex.getMessage());
        verify(attemptRepository, never()).save(any());
    }

    @Test
    @DisplayName("getMeta — 교환 코드 CANCELLED 초대 → 410")
    void meta_exchangeCancelledInvitation_throws410() {
        String exchange = "exchange-cancelled-invite!!!!!!!!";
        invitation.setStatus(SctInviteStatus.CANCELLED.name());
        when(invitationRepository.findByTokenHashAndIsDeletedFalse(any()))
                .thenReturn(Optional.empty());
        when(exchangeCodeStore.resolve(exchange)).thenReturn(Optional.of(
                new SctExchangeCodeStore.ExchangeEntry(
                        100L, TENANT_A, null, false, invitation.getTokenHash())));
        when(invitationRepository.findByTenantIdAndIdAndIsDeletedFalse(TENANT_A, 100L))
                .thenReturn(Optional.of(invitation));

        assertThrows(SctGoneException.class, () -> sctPublicService.getMeta(exchange));
    }

    @Test
    @DisplayName("draft save @Version 충돌 1회 후 재시도 성공")
    void saveDraft_retriesOnceOnOptimisticLock_thenSucceeds() {
        when(invitationRepository.findByTokenHashAndIsDeletedFalse(any()))
                .thenReturn(Optional.of(invitation));
        when(formTemplateRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(template));
        SctFormItem formItem = SctFormItem.builder()
                .id(1L)
                .formTemplateId(1L)
                .itemNo(1)
                .promptText("p")
                .allowsNotApplicable(false)
                .build();
        when(formItemRepository.findByIdAndFormTemplateId(1L, 1L)).thenReturn(Optional.of(formItem));
        when(answerRepository.findByTenantIdAndInvitationIdAndFormItemId(TENANT_A, 100L, 1L))
                .thenReturn(Optional.empty());
        when(answerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(invitationRepository.saveAndFlush(any()))
                .thenThrow(new ObjectOptimisticLockingFailureException(SctInvitation.class, 100L))
                .thenAnswer(inv -> inv.getArgument(0));

        String sid = issueSession();
        sctPublicService.saveDraft(RAW_TOKEN, SctDraftSaveRequest.builder()
                .verifySessionId(sid)
                .answers(Collections.singletonList(SctDraftAnswerItem.builder()
                        .formItemId(1L).answerText("답").build()))
                .build());

        verify(invitationRepository, times(2)).saveAndFlush(any());
        verify(entityManager).clear();
        assertEquals(SctInviteStatus.DRAFT.name(), invitation.getStatus());
        assertTrue(invitation.getDraftSavedAt() != null);
        verify(answerRepository, times(2)).save(any(SctResponseAnswer.class));
    }

    @Test
    @DisplayName("draft save @Version 충돌이 상한 초과면 예외 전파")
    void saveDraft_optimisticLockExhausted_propagates() {
        when(invitationRepository.findByTokenHashAndIsDeletedFalse(any()))
                .thenReturn(Optional.of(invitation));
        when(formTemplateRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(template));
        SctFormItem formItem = SctFormItem.builder()
                .id(1L)
                .formTemplateId(1L)
                .itemNo(1)
                .promptText("p")
                .allowsNotApplicable(false)
                .build();
        when(formItemRepository.findByIdAndFormTemplateId(1L, 1L)).thenReturn(Optional.of(formItem));
        when(answerRepository.findByTenantIdAndInvitationIdAndFormItemId(TENANT_A, 100L, 1L))
                .thenReturn(Optional.empty());
        when(answerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(invitationRepository.saveAndFlush(any()))
                .thenThrow(new ObjectOptimisticLockingFailureException(SctInvitation.class, 100L));

        String sid = issueSession();
        assertThrows(ObjectOptimisticLockingFailureException.class, () ->
                sctPublicService.saveDraft(RAW_TOKEN, SctDraftSaveRequest.builder()
                        .verifySessionId(sid)
                        .answers(Collections.singletonList(SctDraftAnswerItem.builder()
                                .formItemId(1L).answerText("답").build()))
                        .build()));
        verify(invitationRepository, times(3)).saveAndFlush(any());
        verify(entityManager, times(2)).clear();
    }

    @Test
    @DisplayName("draft=DB 수명 — 세션 만료 후 재확인해도 getForm 에 답 유지·제출 가능")
    void draftSurvivesVerifySessionExpiry_thenReVerifyFormAndSubmit() {
        asEmailOnlyInvite();
        when(invitationRepository.findByTokenHashAndIsDeletedFalse(any()))
                .thenReturn(Optional.of(invitation));
        when(invitationRepository.findByTokenHashAndIsDeletedFalseForUpdate(any()))
                .thenReturn(Optional.of(invitation));
        when(invitationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(invitationRepository.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));
        when(attemptRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(formTemplateRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(template));
        when(sctConsentService.hasIdentityContactConsent(invitation)).thenReturn(true);
        when(sctConsentService.resolveStatus(eq(invitation), eq("ADULT")))
                .thenReturn(SctConsentStatusView.builder().satisfied(true).build());

        SctFormItem formItem = SctFormItem.builder()
                .id(1L)
                .formTemplateId(1L)
                .itemNo(1)
                .promptText("나는")
                .allowsNotApplicable(false)
                .build();
        when(formItemRepository.findByIdAndFormTemplateId(1L, 1L)).thenReturn(Optional.of(formItem));
        when(formItemRepository.findByFormTemplateIdOrderBySortOrderAsc(1L))
                .thenReturn(List.of(formItem));

        SctResponseAnswer saved = SctResponseAnswer.builder()
                .formItemId(1L)
                .answerText("테스트 답")
                .notApplicable(false)
                .isBlank(false)
                .build();
        saved.setTenantId(TENANT_A);
        saved.setInvitationId(100L);
        when(answerRepository.findByTenantIdAndInvitationIdAndFormItemId(TENANT_A, 100L, 1L))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(saved));
        when(answerRepository.save(any())).thenAnswer(inv -> {
            SctResponseAnswer a = inv.getArgument(0);
            saved.setAnswerText(a.getAnswerText());
            saved.setNotApplicable(a.getNotApplicable());
            saved.setIsBlank(a.getIsBlank());
            return a;
        });
        when(answerRepository.findByTenantIdAndInvitationId(TENANT_A, 100L))
                .thenReturn(List.of(saved));

        String sid1 = issueSession();
        sctPublicService.saveDraft(RAW_TOKEN, SctDraftSaveRequest.builder()
                .verifySessionId(sid1)
                .answers(Collections.singletonList(SctDraftAnswerItem.builder()
                        .formItemId(1L).answerText("테스트 답").build()))
                .build());
        // verify 세션만 제거 — sct_response_answers 는 초대 수명 동안 유지
        redisHarness.map().clear();
        assertThrows(SctVerifyRequiredException.class,
                () -> sctPublicService.getForm(RAW_TOKEN, sid1));

        SctVerifyResponse reVerified = sctPublicService.verify(
                RAW_TOKEN, SctVerifyRequest.builder().email(EMAIL).build(), "127.0.0.1");
        String sid2 = reVerified.getVerifySessionId();
        SctPublicFormResponse form = sctPublicService.getForm(RAW_TOKEN, sid2);
        assertEquals("테스트 답", form.getItems().get(0).getAnswerText());

        sctPublicService.submit(RAW_TOKEN, SctSubmitRequest.builder().verifySessionId(sid2).build());
        assertEquals(SctInviteStatus.SUBMITTED.name(), invitation.getStatus());
        // 세션만 지웠고 답행은 DB에 남아 getForm 에 복원됨(초안=초대 수명)
        verify(answerRepository, never()).deleteAll(any());
    }
}
