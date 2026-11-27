package com.coresolution.consultation.sct.unit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.service.AuditLogService;
import com.coresolution.consultation.sct.constant.SctConsentKeys;
import com.coresolution.consultation.sct.constant.SctConstants;
import com.coresolution.consultation.sct.constant.SctInviteStatus;
import com.coresolution.consultation.sct.dto.SctConsentStatusView;
import com.coresolution.consultation.sct.dto.SctDraftAnswerItem;
import com.coresolution.consultation.sct.dto.SctDraftSaveRequest;
import com.coresolution.consultation.sct.dto.SctPublicMetaResponse;
import com.coresolution.consultation.sct.dto.SctSubmitRequest;
import com.coresolution.consultation.sct.dto.SctVerifyRequest;
import com.coresolution.consultation.sct.dto.SctVerifyResponse;
import com.coresolution.consultation.sct.entity.SctFormItem;
import com.coresolution.consultation.sct.entity.SctFormTemplate;
import com.coresolution.consultation.sct.entity.SctInvitation;
import com.coresolution.consultation.sct.entity.SctResponseAnswer;
import com.coresolution.consultation.sct.exception.SctConflictException;
import com.coresolution.consultation.sct.exception.SctFeatureDisabledException;
import com.coresolution.consultation.sct.exception.SctGoneException;
import com.coresolution.consultation.sct.exception.SctVerifyLockedException;
import com.coresolution.consultation.sct.exception.SctVerifyRequiredException;
import com.coresolution.consultation.sct.repository.SctFormItemRepository;
import com.coresolution.consultation.sct.repository.SctFormTemplateRepository;
import com.coresolution.consultation.sct.repository.SctInvitationRepository;
import com.coresolution.consultation.sct.repository.SctInviteAccessAttemptRepository;
import com.coresolution.consultation.sct.repository.SctResponseAnswerRepository;
import com.coresolution.consultation.sct.repository.SctRotatedTokenHashRepository;
import com.coresolution.consultation.sct.service.SctConsentService;
import com.coresolution.consultation.sct.service.SctFeatureGuard;
import com.coresolution.consultation.sct.service.SctVerifySessionStore;
import com.coresolution.consultation.sct.service.impl.SctPublicServiceImpl;
import com.coresolution.consultation.sct.util.SctTokenHasher;
import com.coresolution.consultation.util.PhoneHashUtils;
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

    @Mock private SctInvitationRepository invitationRepository;
    @Mock private SctFormTemplateRepository formTemplateRepository;
    @Mock private SctFormItemRepository formItemRepository;
    @Mock private SctResponseAnswerRepository answerRepository;
    @Mock private SctInviteAccessAttemptRepository attemptRepository;
    @Mock private SctRotatedTokenHashRepository rotatedTokenHashRepository;
    @Spy private SctVerifySessionStore verifySessionStore = new SctVerifySessionStore();
    @Mock private SctFeatureGuard sctFeatureGuard;
    @Mock private SctConsentService sctConsentService;
    @Mock private AuditLogService auditLogService;
    @Mock private EntityManager entityManager;

    @InjectMocks
    private SctPublicServiceImpl sctPublicService;

    private SctInvitation invitation;
    private SctFormTemplate template;

    @BeforeEach
    void setUp() {
        invitation = SctInvitation.builder()
                .formTemplateId(1L)
                .targetPhone(PHONE)
                .targetPhoneHash(PhoneHashUtils.sha256Hex(PHONE))
                .tokenHash(SctTokenHasher.sha256Hex(RAW_TOKEN))
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

        ReflectionTestUtils.setField(sctPublicService, "entityManager", entityManager);
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
    void expired_throws410() {
        invitation.setStatus(SctInviteStatus.EXPIRED.name());
        when(invitationRepository.findByTokenHashAndIsDeletedFalse(any()))
                .thenReturn(Optional.of(invitation));

        assertThrows(SctGoneException.class, () -> sctPublicService.getMeta(RAW_TOKEN));
    }

    @Test
    void cancelled_throws410() {
        invitation.setStatus(SctInviteStatus.CANCELLED.name());
        when(invitationRepository.findByTokenHashAndIsDeletedFalse(any()))
                .thenReturn(Optional.of(invitation));

        assertThrows(SctGoneException.class, () -> sctPublicService.getMeta(RAW_TOKEN));
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

        SctPublicMetaResponse meta = sctPublicService.getMeta(RAW_TOKEN);
        assertEquals(SctConsentKeys.CHANNEL_PHONE, meta.getVerifyChannelHint());
        assertEquals(SctConsentKeys.SIGNER_BAND_ADULT, meta.getSignerBand());
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
        when(invitationRepository.findByTokenHashAndIsDeletedFalseForUpdate(any()))
                .thenReturn(Optional.of(invitation));
        when(invitationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(attemptRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SctVerifyRequest bad = SctVerifyRequest.builder().phone("01099999999").build();
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
        String otherInviteSid = verifySessionStore.issue(999L, TENANT_A);

        assertThrows(SctVerifyRequiredException.class,
                () -> sctPublicService.getForm(RAW_TOKEN, otherInviteSid));
    }

    @Test
    void formWithoutConsent_throws403() {
        when(invitationRepository.findByTokenHashAndIsDeletedFalse(any()))
                .thenReturn(Optional.of(invitation));
        when(formTemplateRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(template));
        String sid = verifySessionStore.issue(100L, TENANT_A);
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
        String sid = verifySessionStore.issue(100L, TENANT_A);
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
        String sid = verifySessionStore.issue(100L, TENANT_A);
        doThrow(new AccessDeniedException("필수 동의가 없습니다."))
                .when(sctConsentService).requireSatisfied(invitation, "ADULT");

        assertThrows(AccessDeniedException.class, () -> sctPublicService.submit(
                RAW_TOKEN, SctSubmitRequest.builder().verifySessionId(sid).build()));
    }

    @Test
    void submitThenDraft_throws409() {
        when(invitationRepository.findByTokenHashAndIsDeletedFalseForUpdate(any()))
                .thenReturn(Optional.of(invitation));
        when(invitationRepository.findByTokenHashAndIsDeletedFalse(any()))
                .thenReturn(Optional.of(invitation));
        when(invitationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(attemptRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(formTemplateRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(template));
        when(sctConsentService.resolveStatus(eq(invitation), eq("ADULT")))
                .thenReturn(SctConsentStatusView.builder().satisfied(true).build());

        SctVerifyResponse verified = sctPublicService.verify(
                RAW_TOKEN, SctVerifyRequest.builder().phone(PHONE).build(), "127.0.0.1");
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

        sctPublicService.getMeta(RAW_TOKEN);
        verify(sctFeatureGuard).requireEnabled("tenant-b");
        verify(sctFeatureGuard, never()).requireEnabled(TENANT_A);
    }

    @Test
    void rotatedTokenHash_throws410Gone() {
        when(invitationRepository.findByTokenHashAndIsDeletedFalse(any()))
                .thenReturn(Optional.empty());
        when(rotatedTokenHashRepository.existsByTokenHash(any())).thenReturn(true);

        assertThrows(SctGoneException.class, () -> sctPublicService.getMeta(RAW_TOKEN));
    }

    @Test
    void unknownTokenHash_throws404NotFound() {
        when(invitationRepository.findByTokenHashAndIsDeletedFalse(any()))
                .thenReturn(Optional.empty());
        when(rotatedTokenHashRepository.existsByTokenHash(any())).thenReturn(false);

        EntityNotFoundException ex = assertThrows(EntityNotFoundException.class,
                () -> sctPublicService.getMeta(RAW_TOKEN));
        assertEquals("SCT 링크를 찾을 수 없습니다.", ex.getMessage());
    }

    @Test
    void rotatedTokenHash_verify_throws410Gone() {
        when(invitationRepository.findByTokenHashAndIsDeletedFalseForUpdate(any()))
                .thenReturn(Optional.empty());
        when(rotatedTokenHashRepository.existsByTokenHash(any())).thenReturn(true);

        assertThrows(SctGoneException.class, () -> sctPublicService.verify(
                RAW_TOKEN, SctVerifyRequest.builder().phone(PHONE).build(), "127.0.0.1"));
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

        String sid = verifySessionStore.issue(100L, TENANT_A);
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

        String sid = verifySessionStore.issue(100L, TENANT_A);
        assertThrows(ObjectOptimisticLockingFailureException.class, () ->
                sctPublicService.saveDraft(RAW_TOKEN, SctDraftSaveRequest.builder()
                        .verifySessionId(sid)
                        .answers(Collections.singletonList(SctDraftAnswerItem.builder()
                                .formItemId(1L).answerText("답").build()))
                        .build()));
        verify(invitationRepository, times(3)).saveAndFlush(any());
        verify(entityManager, times(2)).clear();
    }
}
