package com.coresolution.consultation.sct.unit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;
import com.coresolution.consultation.service.AuditLogService;
import com.coresolution.consultation.sct.constant.SctConstants;
import com.coresolution.consultation.sct.constant.SctInviteStatus;
import com.coresolution.consultation.sct.dto.SctDraftAnswerItem;
import com.coresolution.consultation.sct.dto.SctDraftSaveRequest;
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
import com.coresolution.consultation.sct.repository.SctConsentRepository;
import com.coresolution.consultation.sct.repository.SctConsentTemplateRepository;
import com.coresolution.consultation.sct.repository.SctFormItemRepository;
import com.coresolution.consultation.sct.repository.SctFormTemplateRepository;
import com.coresolution.consultation.sct.repository.SctInvitationRepository;
import com.coresolution.consultation.sct.repository.SctInviteAccessAttemptRepository;
import com.coresolution.consultation.sct.repository.SctResponseAnswerRepository;
import com.coresolution.consultation.sct.service.SctFeatureGuard;
import com.coresolution.consultation.sct.service.SctVerifySessionStore;
import com.coresolution.consultation.sct.service.impl.SctPublicServiceImpl;
import com.coresolution.consultation.sct.util.SctTokenHasher;
import com.coresolution.consultation.util.PhoneHashUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 공개 SCT 흐름 단위 테스트 — 만료/취소 410, 제출 후 409, verify 잠금, 플래그 OFF 404.
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
    @Mock private SctConsentRepository consentRepository;
    @Mock private SctConsentTemplateRepository consentTemplateRepository;
    @Mock private SctInviteAccessAttemptRepository attemptRepository;
    @Spy private SctVerifySessionStore verifySessionStore = new SctVerifySessionStore();
    @Mock private SctFeatureGuard sctFeatureGuard;
    @Mock private AuditLogService auditLogService;

    @InjectMocks
    private SctPublicServiceImpl sctPublicService;

    private SctInvitation invitation;

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
    }

    @Test
    void featureOff_throws404() {
        when(invitationRepository.findByTokenHashAndIsDeletedFalse(any()))
                .thenReturn(Optional.of(invitation));
        org.mockito.Mockito.doThrow(new SctFeatureDisabledException("off"))
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
    void verifyLocksAfterFiveFailures() {
        when(invitationRepository.findByTokenHashAndIsDeletedFalse(any()))
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
    }

    @Test
    void submitThenDraft_throws409() {
        invitation.setStatus(SctInviteStatus.SENT.name());
        when(invitationRepository.findByTokenHashAndIsDeletedFalse(any()))
                .thenReturn(Optional.of(invitation));
        when(invitationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(attemptRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(consentRepository.existsByTenantIdAndInvitationIdAndConsentTypeAndAgreedTrue(
                eq(TENANT_A), eq(100L), eq(SctConstants.CONSENT_SENSITIVE_INFO)))
                .thenReturn(true);

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
                .thenReturn(Optional.of(SctFormTemplate.builder()
                        .id(1L).formType("ADULT").title("t").instructionText("i")
                        .formVersion("v3").tenantId("").isActive(true).isDeleted(false).build()));
        when(formItemRepository.countByFormTemplateId(1L)).thenReturn(50L);
        when(answerRepository.findByTenantIdAndInvitationId("tenant-b", 100L))
                .thenReturn(Collections.emptyList());

        sctPublicService.getMeta(RAW_TOKEN);
        verify(sctFeatureGuard).requireEnabled("tenant-b");
        verify(sctFeatureGuard, never()).requireEnabled(TENANT_A);
    }
}
