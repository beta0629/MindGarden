package com.coresolution.consultation.sct.unit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.service.AuditLogService;
import com.coresolution.consultation.service.SmsAuthService;
import com.coresolution.consultation.sct.constant.SctConstants;
import com.coresolution.consultation.sct.constant.SctInviteStatus;
import com.coresolution.consultation.sct.dto.SctInviteCreateRequest;
import com.coresolution.consultation.sct.entity.SctAccessLog;
import com.coresolution.consultation.sct.entity.SctFormTemplate;
import com.coresolution.consultation.sct.entity.SctInvitation;
import com.coresolution.consultation.sct.entity.SctManagementNoSeq;
import com.coresolution.consultation.sct.exception.SctConflictException;
import com.coresolution.consultation.sct.exception.SctFeatureDisabledException;
import com.coresolution.consultation.sct.entity.SctRotatedTokenHash;
import com.coresolution.consultation.sct.repository.SctDomainMemoRepository;
import com.coresolution.consultation.sct.repository.SctFormItemRepository;
import com.coresolution.consultation.sct.repository.SctFormTemplateRepository;
import com.coresolution.consultation.sct.repository.SctInvitationRepository;
import com.coresolution.consultation.sct.repository.SctManagementNoSeqRepository;
import com.coresolution.consultation.sct.repository.SctResponseAnswerRepository;
import com.coresolution.consultation.sct.repository.SctRotatedTokenHashRepository;
import com.coresolution.consultation.sct.service.SctAccessLogService;
import com.coresolution.consultation.sct.service.SctClinicalAccessDeniedAuditWriter;
import com.coresolution.consultation.sct.service.SctConsentService;
import com.coresolution.consultation.sct.service.SctFeatureGuard;
import com.coresolution.consultation.sct.service.SctSettingsService;
import com.coresolution.consultation.sct.service.impl.SctInvitationServiceImpl;
import com.coresolution.consultation.sct.util.SctTokenHasher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

/**
 * SCT 초대 — 테넌트 격리·SMS_TEST_MODE·CHILD 거부·관리번호·파기.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@ExtendWith(MockitoExtension.class)
class SctInvitationServiceTest {

    @Mock private SctFeatureGuard sctFeatureGuard;
    @Mock private SctSettingsService sctSettingsService;
    @Mock private SctFormTemplateRepository formTemplateRepository;
    @Mock private SctFormItemRepository formItemRepository;
    @Mock private SctInvitationRepository invitationRepository;
    @Mock private SctResponseAnswerRepository answerRepository;
    @Mock private SctDomainMemoRepository domainMemoRepository;
    @Mock private SctManagementNoSeqRepository managementNoSeqRepository;
    @Mock private ClientRepository clientRepository;
    @Mock private ConsultantClientMappingRepository mappingRepository;
    @Mock private SmsAuthService smsAuthService;
    @Mock private AuditLogService auditLogService;
    @Mock private SctAccessLogService sctAccessLogService;
    @Mock private SctConsentService sctConsentService;
    @Mock private SctRotatedTokenHashRepository rotatedTokenHashRepository;
    @Mock private SctClinicalAccessDeniedAuditWriter clinicalAccessDeniedAuditWriter;

    @InjectMocks
    private SctInvitationServiceImpl invitationService;

    private User admin;
    private User staff;
    private SctFormTemplate template;

    @BeforeEach
    void setUp() {
        admin = new User();
        admin.setId(1L);
        admin.setRole(UserRole.ADMIN);
        staff = new User();
        staff.setId(2L);
        staff.setRole(UserRole.STAFF);
        template = SctFormTemplate.builder()
                .id(10L)
                .tenantId("")
                .formType("ADULT")
                .formVersion("v3")
                .title("성인용")
                .instructionText("안내")
                .isActive(true)
                .isDeleted(false)
                .build();
    }

    private void stubManagementNo(String tenantId) {
        when(managementNoSeqRepository.findByTenantIdForUpdate(tenantId))
                .thenReturn(Optional.of(SctManagementNoSeq.builder()
                        .tenantId(tenantId)
                        .nextVal(1L)
                        .build()));
        when(managementNoSeqRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(sctSettingsService.resolveRetentionDays(tenantId)).thenReturn(365);
    }

    @Test
    void featureOff_createThrows404() {
        org.mockito.Mockito.doThrow(new SctFeatureDisabledException("off"))
                .when(sctFeatureGuard).requireEnabled("t1");
        assertThrows(SctFeatureDisabledException.class, () ->
                invitationService.createInvitation("t1", admin,
                        SctInviteCreateRequest.builder()
                                .formType("ADULT").phone("01012345678").build()));
    }

    @Test
    void createChildForm_rejectedWith400() {
        assertThrows(IllegalArgumentException.class, () ->
                invitationService.createInvitation("t1", admin,
                        SctInviteCreateRequest.builder()
                                .formType("CHILD").phone("01012345678").build()));
        verify(invitationRepository, never()).save(any());
    }

    @Test
    void createUsesSettingsExpiry_andDoesNotMutateExistingExpiresAt() {
        when(sctSettingsService.resolveLinkExpiryDays("t1")).thenReturn(21);
        stubManagementNo("t1");
        when(formTemplateRepository
                .findByTenantIdAndFormTypeAndFormVersionAndIsActiveTrueAndIsDeletedFalse(
                        "", "ADULT", "v3")).thenReturn(Optional.of(template));
        when(smsAuthService.isTestMode()).thenReturn(true);
        when(invitationRepository.save(any())).thenAnswer(inv -> {
            SctInvitation i = inv.getArgument(0);
            if (i.getId() == null) {
                i.setId(55L);
            }
            return i;
        });
        when(auditLogService.record(any())).thenAnswer(i -> i.getArgument(0));

        LocalDateTime before = LocalDateTime.now();
        var created = invitationService.createInvitation("t1", admin,
                SctInviteCreateRequest.builder()
                        .formType("ADULT").phone("01012345678").build());

        ArgumentCaptor<SctInvitation> captor = ArgumentCaptor.forClass(SctInvitation.class);
        verify(invitationRepository, org.mockito.Mockito.atLeastOnce()).save(captor.capture());
        SctInvitation saved = captor.getAllValues().get(0);
        assertTrue(saved.getTokenExpiresAt().isAfter(before.plusDays(20)));
        assertTrue(saved.getTokenExpiresAt().isBefore(before.plusDays(22).plusMinutes(1)));
        assertEquals("SCT-000001", saved.getManagementNo());
        assertEquals("SCT-000001", created.getManagementNo());
        assertFalse(saved.getManagementNo().contains("010"));
        assertFalse(saved.getManagementNo().toLowerCase().contains("name"));
        assertEquals(SctConstants.SMS_RESULT_TEST_MODE_SKIP, created.getSmsDispatchResult());
        verify(smsAuthService, never()).sendNotificationMessage(anyString(), anyString());
        assertTrue(org.springframework.util.StringUtils.hasText(created.getPublicUrl()));
        assertTrue(created.getPublicUrl().startsWith("/public/sct/"));
        assertTrue(org.springframework.util.StringUtils.hasText(created.getToken()));
    }

    @Test
    void staffCreate_omitsPublicUrlAndToken() {
        when(sctSettingsService.resolveLinkExpiryDays("t1")).thenReturn(14);
        stubManagementNo("t1");
        when(formTemplateRepository
                .findByTenantIdAndFormTypeAndFormVersionAndIsActiveTrueAndIsDeletedFalse(
                        "", "ADULT", "v3")).thenReturn(Optional.of(template));
        when(smsAuthService.isTestMode()).thenReturn(true);
        when(invitationRepository.save(any())).thenAnswer(inv -> {
            SctInvitation i = inv.getArgument(0);
            if (i.getId() == null) {
                i.setId(56L);
            }
            return i;
        });
        when(auditLogService.record(any())).thenAnswer(i -> i.getArgument(0));

        var created = invitationService.createInvitation("t1", staff,
                SctInviteCreateRequest.builder()
                        .formType("ADULT").phone("01012345678").build());

        assertNull(created.getPublicUrl());
        assertNull(created.getToken());
        assertEquals(SctConstants.SMS_RESULT_TEST_MODE_SKIP, created.getSmsDispatchResult());
        assertEquals("SCT-000001", created.getManagementNo());
    }

    @Test
    void staffReissueLink_denied() {
        SctInvitation existing = SctInvitation.builder()
                .formTemplateId(10L)
                .managementNo("SCT-000008")
                .tokenHash("abc")
                .tokenExpiresAt(LocalDateTime.now().plusDays(3))
                .status(SctInviteStatus.SENT.name())
                .sentByUserId(1L)
                .verifyFailCount(0)
                .build();
        existing.setId(88L);
        existing.setTenantId("t1");

        assertThrows(AccessDeniedException.class,
                () -> invitationService.reissueLink("t1", staff, 88L));
        verify(invitationRepository, never()).save(any());
    }

    @Test
    void staffCannotViewAnswers_withIncludeAnswers() {
        SctInvitation existing = SctInvitation.builder()
                .formTemplateId(10L)
                .managementNo("SCT-000007")
                .tokenHash("abc")
                .tokenExpiresAt(LocalDateTime.of(2026, 12, 1, 0, 0))
                .status(SctInviteStatus.SUBMITTED.name())
                .sentByUserId(1L)
                .verifyFailCount(0)
                .build();
        existing.setId(77L);
        existing.setTenantId("t1");

        when(invitationRepository.findByTenantIdAndIdAndIsDeletedFalse("t1", 77L))
                .thenReturn(Optional.of(existing));

        assertThrows(AccessDeniedException.class,
                () -> invitationService.getInvitation("t1", staff, 77L, true, "1.1.1.1", "ua"));
        verify(clinicalAccessDeniedAuditWriter).record(eq("t1"), eq(staff), eq(existing));
        verify(auditLogService, never()).record(org.mockito.ArgumentMatchers.argThat(log ->
                log != null && AuditAction.SCT_CLINICAL_ACCESS_DENIED.equals(log.getAction())));
        verify(sctAccessLogService, never()).logViewBody(any(), any(), any(), any(), any());
    }

    @Test
    void reissueLink_persistsOldTokenHashBeforeOverwrite() {
        String oldHash = SctTokenHasher.sha256Hex("old-opaque-token-value-32bytes!!");
        SctInvitation existing = SctInvitation.builder()
                .formTemplateId(10L)
                .managementNo("SCT-000009")
                .tokenHash(oldHash)
                .tokenExpiresAt(LocalDateTime.now().plusDays(3))
                .status(SctInviteStatus.SENT.name())
                .sentByUserId(1L)
                .verifyFailCount(0)
                .build();
        existing.setId(99L);
        existing.setTenantId("t1");

        when(invitationRepository.findByTenantIdAndIdAndIsDeletedFalse("t1", 99L))
                .thenReturn(Optional.of(existing));
        when(formTemplateRepository.findByIdAndIsDeletedFalse(10L)).thenReturn(Optional.of(template));
        when(rotatedTokenHashRepository.existsByTokenHash(oldHash)).thenReturn(false);
        when(rotatedTokenHashRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(invitationRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(auditLogService.record(any())).thenAnswer(i -> i.getArgument(0));

        var response = invitationService.reissueLink("t1", admin, 99L);

        ArgumentCaptor<SctRotatedTokenHash> rotatedCaptor =
                ArgumentCaptor.forClass(SctRotatedTokenHash.class);
        verify(rotatedTokenHashRepository).save(rotatedCaptor.capture());
        assertEquals(oldHash, rotatedCaptor.getValue().getTokenHash());
        assertEquals(99L, rotatedCaptor.getValue().getInvitationId());
        assertEquals("t1", rotatedCaptor.getValue().getTenantId());
        assertTrue(response.getPublicUrl() != null && response.getPublicUrl().contains("/public/sct/"));
        assertFalse(oldHash.equals(existing.getTokenHash()));
    }

    @Test
    void existingInvitationExpiryUnchanged_whenSettingsChange() {
        SctInvitation existing = SctInvitation.builder()
                .formTemplateId(10L)
                .managementNo("SCT-000007")
                .tokenHash("abc")
                .tokenExpiresAt(LocalDateTime.of(2026, 12, 1, 0, 0))
                .status(SctInviteStatus.SUBMITTED.name())
                .sentByUserId(1L)
                .verifyFailCount(0)
                .build();
        existing.setId(77L);
        existing.setTenantId("t1");

        when(sctSettingsService.resolveRetentionDays("t1")).thenReturn(365);
        when(invitationRepository.findByTenantIdAndIdAndIsDeletedFalse("t1", 77L))
                .thenReturn(Optional.of(existing));
        when(formTemplateRepository.findByIdAndIsDeletedFalse(10L))
                .thenReturn(Optional.of(template));
        when(answerRepository.findByTenantIdAndInvitationId("t1", 77L))
                .thenReturn(Collections.emptyList());
        when(formItemRepository.findByFormTemplateIdOrderBySortOrderAsc(10L))
                .thenReturn(Collections.emptyList());
        when(sctAccessLogService.logViewBody(any(), any(), any(), any(), any()))
                .thenReturn(new SctAccessLog());
        when(auditLogService.record(any())).thenAnswer(i -> i.getArgument(0));

        var view = invitationService.getInvitation("t1", admin, 77L, true, "1.1.1.1", "ua");
        assertEquals(LocalDateTime.of(2026, 12, 1, 0, 0), view.getTokenExpiresAt());
        assertEquals("SCT-000007", view.getManagementNo());
        verify(sctAccessLogService).logViewBody(
                eq(existing), eq(1L), eq("ADMIN"), eq("1.1.1.1"), eq("ua"));
    }

    @Test
    void otherTenantId_denied() {
        when(invitationRepository.findByTenantIdAndIdAndIsDeletedFalse("tenant-b", 77L))
                .thenReturn(Optional.empty());

        assertThrows(com.coresolution.consultation.exception.EntityNotFoundException.class,
                () -> invitationService.getInvitation("tenant-b", admin, 77L, false, null, null));
    }

    @Test
    void recordPrintAudit_staffForbidden() {
        SctInvitation existing = SctInvitation.builder()
                .formTemplateId(10L)
                .managementNo("SCT-000010")
                .tokenHash("abc")
                .tokenExpiresAt(LocalDateTime.of(2026, 12, 1, 0, 0))
                .status(SctInviteStatus.SUBMITTED.name())
                .sentByUserId(1L)
                .clientId(100L)
                .verifyFailCount(0)
                .build();
        existing.setId(77L);
        existing.setTenantId("t1");

        when(invitationRepository.findByTenantIdAndIdAndIsDeletedFalse("t1", 77L))
                .thenReturn(Optional.of(existing));

        assertThrows(AccessDeniedException.class,
                () -> invitationService.recordPrintAudit("t1", staff, 77L, "1.2.3.4", "ua"));
        verify(sctAccessLogService, never()).logPrint(any(), any(), any(), any(), any());
    }

    @Test
    void recordPrintAudit_writesPrintAccessAndAuditAction() {
        SctInvitation existing = SctInvitation.builder()
                .formTemplateId(10L)
                .managementNo("SCT-000010")
                .tokenHash("abc")
                .tokenExpiresAt(LocalDateTime.of(2026, 12, 1, 0, 0))
                .status(SctInviteStatus.SUBMITTED.name())
                .sentByUserId(1L)
                .clientId(100L)
                .verifyFailCount(0)
                .build();
        existing.setId(77L);
        existing.setTenantId("t1");

        when(invitationRepository.findByTenantIdAndIdAndIsDeletedFalse("t1", 77L))
                .thenReturn(Optional.of(existing));
        when(sctAccessLogService.logPrint(any(), any(), any(), any(), any()))
                .thenReturn(new SctAccessLog());
        when(auditLogService.record(any())).thenAnswer(i -> i.getArgument(0));

        invitationService.recordPrintAudit("t1", admin, 77L, "1.2.3.4", "ua");

        verify(sctAccessLogService).logPrint(
                eq(existing), eq(1L), eq("ADMIN"), eq("1.2.3.4"), eq("ua"));
        ArgumentCaptor<AuditLog> auditCaptor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogService).record(auditCaptor.capture());
        assertEquals(AuditAction.SCT_RESPONSE_PRINTED, auditCaptor.getValue().getAction());
    }

    @Test
    void unlink_clearsConsultantId_consultantDeniedClinicalAccess() {
        User consultant = new User();
        consultant.setId(8L);
        consultant.setRole(UserRole.CONSULTANT);

        SctInvitation existing = SctInvitation.builder()
                .formTemplateId(10L)
                .clientId(100L)
                .consultantId(8L)
                .mappingId(50L)
                .managementNo("SCT-000020")
                .tokenHash("abc")
                .tokenExpiresAt(LocalDateTime.now().plusDays(1))
                .status(SctInviteStatus.SENT.name())
                .sentByUserId(1L)
                .verifyFailCount(0)
                .build();
        existing.setId(77L);
        existing.setTenantId("t1");

        when(invitationRepository.findByTenantIdAndIdAndIsDeletedFalse("t1", 77L))
                .thenReturn(Optional.of(existing));
        when(invitationRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(auditLogService.record(any())).thenAnswer(i -> i.getArgument(0));
        when(formTemplateRepository.findByIdAndIsDeletedFalse(10L))
                .thenReturn(Optional.of(template));

        invitationService.unlink("t1", admin, 77L);

        ArgumentCaptor<SctInvitation> savedCaptor = ArgumentCaptor.forClass(SctInvitation.class);
        verify(invitationRepository).save(savedCaptor.capture());
        SctInvitation saved = savedCaptor.getValue();
        assertNull(saved.getClientId());
        assertNull(saved.getMappingId());
        assertNull(saved.getConsultantId());

        when(invitationRepository.findByTenantIdAndIdAndIsDeletedFalse("t1", 77L))
                .thenReturn(Optional.of(saved));
        assertThrows(AccessDeniedException.class,
                () -> invitationService.getInvitation("t1", consultant, 77L, false, null, null));
    }

    @Test
    void consultantCannotAccessUnassigned() {
        User consultant = new User();
        consultant.setId(9L);
        consultant.setRole(UserRole.CONSULTANT);

        SctInvitation existing = SctInvitation.builder()
                .formTemplateId(10L)
                .clientId(100L)
                .consultantId(8L)
                .managementNo("SCT-000011")
                .tokenHash("abc")
                .tokenExpiresAt(LocalDateTime.now().plusDays(1))
                .status(SctInviteStatus.SENT.name())
                .sentByUserId(1L)
                .verifyFailCount(0)
                .build();
        existing.setId(77L);
        existing.setTenantId("t1");

        when(invitationRepository.findByTenantIdAndIdAndIsDeletedFalse("t1", 77L))
                .thenReturn(Optional.of(existing));
        when(mappingRepository.findActiveOrExhaustedListByTenantIdAndConsultantIdAndClientId(
                "t1", 9L, 100L)).thenReturn(List.of());

        assertThrows(AccessDeniedException.class,
                () -> invitationService.getInvitation("t1", consultant, 77L, false, null, null));
    }

    @Test
    void destroy_staffForbidden() {
        assertThrows(AccessDeniedException.class,
                () -> invitationService.destroyInvitation("t1", staff, 77L));
    }

    @Test
    void destroy_notEligible_conflict409() {
        SctInvitation existing = SctInvitation.builder()
                .formTemplateId(10L)
                .managementNo("SCT-000012")
                .tokenHash("abc")
                .tokenExpiresAt(LocalDateTime.now().plusDays(1))
                .status(SctInviteStatus.SUBMITTED.name())
                .submittedAt(LocalDateTime.now().minusDays(10))
                .sentByUserId(1L)
                .verifyFailCount(0)
                .build();
        existing.setId(77L);
        existing.setTenantId("t1");

        when(invitationRepository.findByTenantIdAndIdAndIsDeletedFalse("t1", 77L))
                .thenReturn(Optional.of(existing));
        when(sctSettingsService.resolveRetentionDays("t1")).thenReturn(365);

        assertThrows(SctConflictException.class,
                () -> invitationService.destroyInvitation("t1", admin, 77L));
        verify(answerRepository, never()).deleteByTenantIdAndInvitationId(anyString(), any());
    }

    @Test
    void destroy_eligible_deletesAnswersAndKeepsConsentAuditWithoutBody() {
        SctInvitation existing = SctInvitation.builder()
                .formTemplateId(10L)
                .managementNo("SCT-000013")
                .tokenHash("abc")
                .tokenExpiresAt(LocalDateTime.now().minusDays(1))
                .status(SctInviteStatus.SUBMITTED.name())
                .submittedAt(LocalDateTime.now().minusDays(400))
                .sentByUserId(1L)
                .verifyFailCount(0)
                .build();
        existing.setId(77L);
        existing.setTenantId("t1");

        when(invitationRepository.findByTenantIdAndIdAndIsDeletedFalse("t1", 77L))
                .thenReturn(Optional.of(existing));
        when(sctSettingsService.resolveRetentionDays("t1")).thenReturn(365);
        when(domainMemoRepository.findByTenantIdAndInvitationIdAndIsDeletedFalse("t1", 77L))
                .thenReturn(List.of());
        when(invitationRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(auditLogService.record(any())).thenAnswer(i -> i.getArgument(0));

        invitationService.destroyInvitation("t1", admin, 77L);

        verify(answerRepository).deleteByTenantIdAndInvitationId("t1", 77L);
        assertTrue(Boolean.TRUE.equals(existing.getIsDeleted()));
        ArgumentCaptor<AuditLog> auditCaptor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogService).record(auditCaptor.capture());
        AuditLog audit = auditCaptor.getValue();
        assertEquals(AuditAction.SCT_RESPONSE_DESTROYED, audit.getAction());
        assertEquals(1L, audit.getActorUserId());
        assertTrue(audit.getMetadataJson().contains("SCT-000013"));
        assertFalse(audit.getMetadataJson().contains("answer"));
        assertFalse(audit.getMetadataJson().contains("010"));
    }

    @Test
    void isDestroyEligible_requiresSubmittedAndRetentionElapsed() {
        SctInvitation inv = SctInvitation.builder()
                .status(SctInviteStatus.SUBMITTED.name())
                .submittedAt(LocalDateTime.now().minusDays(365))
                .build();
        assertTrue(SctInvitationServiceImpl.isDestroyEligible(inv, 365));
        inv.setSubmittedAt(LocalDateTime.now().minusDays(10));
        assertFalse(SctInvitationServiceImpl.isDestroyEligible(inv, 365));
        inv.setStatus(SctInviteStatus.DRAFT.name());
        inv.setSubmittedAt(LocalDateTime.now().minusDays(400));
        assertFalse(SctInvitationServiceImpl.isDestroyEligible(inv, 365));
    }
}
