package com.coresolution.consultation.sct.unit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.SystemConfigRepository;
import com.coresolution.consultation.service.AuditLogService;
import com.coresolution.consultation.sct.constant.SctConsentKeys;
import com.coresolution.consultation.sct.constant.SctConstants;
import com.coresolution.consultation.sct.constant.SctFormType;
import com.coresolution.consultation.sct.dto.SctConsentRequest;
import com.coresolution.consultation.sct.dto.SctConsentStatusView;
import com.coresolution.consultation.sct.entity.SctConsent;
import com.coresolution.consultation.sct.entity.SctConsentTemplate;
import com.coresolution.consultation.sct.entity.SctInvitation;
import com.coresolution.consultation.sct.repository.SctConsentRepository;
import com.coresolution.consultation.sct.repository.SctConsentTemplateRepository;
import com.coresolution.consultation.sct.service.impl.SctConsentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

/**
 * SCT 동의 SSOT — 3구간 서명 주체·재사용·철회·미연동 승계·테넌트 격리.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@ExtendWith(MockitoExtension.class)
class SctConsentServiceTest {

    private static final String TENANT = "tenant-a";

    @Mock private SctConsentRepository consentRepository;
    @Mock private SctConsentTemplateRepository consentTemplateRepository;
    @Mock private AuditLogService auditLogService;
    @Mock private SystemConfigRepository systemConfigRepository;

    @InjectMocks
    private SctConsentServiceImpl consentService;

    private SctInvitation invitation;
    private SctConsentTemplate adultTpl;

    @BeforeEach
    void setUp() {
        invitation = SctInvitation.builder()
                .formTemplateId(1L)
                .clientId(10L)
                .requiresGuardian(false)
                .build();
        invitation.setId(100L);
        invitation.setTenantId(TENANT);

        adultTpl = SctConsentTemplate.builder()
                .id(1L)
                .tenantId("")
                .consentType(SctConstants.CONSENT_SENSITIVE_INFO)
                .formType("ADULT")
                .version(SctConsentKeys.TEMPLATE_VERSION_HANDOFF)
                .title("실시 안내 및 동의(성인)")
                .bodyText("민감정보")
                .isActive(true)
                .build();
    }

    @Test
    void signerBand_threeWay() {
        assertEquals(SctConsentKeys.SIGNER_BAND_ADULT,
                consentService.resolveSignerBand(SctFormType.ADULT.name(), false));
        assertEquals(SctConsentKeys.SIGNER_BAND_TEEN_14_PLUS,
                consentService.resolveSignerBand(SctFormType.ADOLESCENT.name(), false));
        assertEquals(SctConsentKeys.SIGNER_BAND_UNDER_14,
                consentService.resolveSignerBand(SctFormType.ADOLESCENT.name(), true));
        assertEquals(SctConsentKeys.SIGNER_BAND_UNDER_14,
                consentService.resolveSignerBand(SctFormType.CHILD.name(), false));
    }

    @Test
    void under14WithoutGuardianConsent_notSatisfied() {
        invitation.setRequiresGuardian(true);
        stubTemplates();
        when(consentRepository.existsByTenantIdAndClientIdAndConsentTypeAndRevokedTrue(
                TENANT, 10L, SctConstants.CONSENT_SENSITIVE_INFO)).thenReturn(false);
        when(consentRepository.existsByTenantIdAndClientIdAndConsentTypeAndAgreedTrueAndRevokedFalse(
                TENANT, 10L, SctConstants.CONSENT_SENSITIVE_INFO)).thenReturn(true);
        when(consentRepository.existsByTenantIdAndClientIdAndConsentTypeAndAgreedTrueAndRevokedFalse(
                TENANT, 10L, SctConstants.CONSENT_GUARDIAN_UNDER_14)).thenReturn(false);
        when(consentRepository.existsByTenantIdAndInvitationIdAndConsentTypeAndAgreedTrueAndRevokedFalse(
                eq(TENANT), eq(100L), eq(SctConstants.CONSENT_GUARDIAN_UNDER_14))).thenReturn(false);
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue(any(), any()))
                .thenReturn(Optional.empty());

        SctConsentStatusView status = consentService.resolveStatus(
                invitation, SctFormType.ADOLESCENT.name());
        assertTrue(status.isRequiresGuardian());
        assertTrue(status.isGuardianRequired());
        assertFalse(status.isSatisfied());
        assertThrows(AccessDeniedException.class,
                () -> consentService.requireSatisfied(invitation, SctFormType.ADOLESCENT.name()));
    }

    @Test
    void clientLevelReuse_secondInviteSatisfied() {
        stubTemplates();
        when(consentRepository.existsByTenantIdAndClientIdAndConsentTypeAndRevokedTrue(
                TENANT, 10L, SctConstants.CONSENT_SENSITIVE_INFO)).thenReturn(false);
        when(consentRepository.existsByTenantIdAndClientIdAndConsentTypeAndAgreedTrueAndRevokedFalse(
                TENANT, 10L, SctConstants.CONSENT_SENSITIVE_INFO)).thenReturn(true);
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue(any(), any()))
                .thenReturn(Optional.empty());

        SctConsentStatusView status = consentService.resolveStatus(
                invitation, SctFormType.ADULT.name());
        assertTrue(status.isSatisfied());
        assertFalse(status.isSensitiveRequired());
    }

    @Test
    void revoked_blocksDispatchAndRequire() {
        when(consentRepository.existsByTenantIdAndClientIdAndConsentTypeAndRevokedTrue(
                TENANT, 10L, SctConstants.CONSENT_SENSITIVE_INFO)).thenReturn(true);
        assertThrows(AccessDeniedException.class,
                () -> consentService.assertNotRevokedForDispatch(TENANT, 10L));

        stubTemplates();
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue(any(), any()))
                .thenReturn(Optional.empty());
        SctConsentStatusView status = consentService.resolveStatus(
                invitation, SctFormType.ADULT.name());
        assertTrue(status.isRevoked());
        assertFalse(status.isSatisfied());
    }

    @Test
    void otherTenantConsent_notVisible() {
        stubTemplates();
        when(consentRepository.existsByTenantIdAndClientIdAndConsentTypeAndRevokedTrue(
                eq("other"), eq(10L), eq(SctConstants.CONSENT_SENSITIVE_INFO))).thenReturn(false);
        when(consentRepository.existsByTenantIdAndClientIdAndConsentTypeAndAgreedTrueAndRevokedFalse(
                eq("other"), eq(10L), eq(SctConstants.CONSENT_SENSITIVE_INFO))).thenReturn(false);
        when(consentRepository.existsByTenantIdAndInvitationIdAndConsentTypeAndAgreedTrueAndRevokedFalse(
                eq("other"), eq(100L), eq(SctConstants.CONSENT_SENSITIVE_INFO))).thenReturn(false);
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue(any(), any()))
                .thenReturn(Optional.empty());

        invitation.setTenantId("other");
        SctConsentStatusView status = consentService.resolveStatus(
                invitation, SctFormType.ADULT.name());
        assertFalse(status.isSatisfied());
        verify(consentRepository, never())
                .existsByTenantIdAndClientIdAndConsentTypeAndAgreedTrueAndRevokedFalse(
                        eq(TENANT), eq(10L), eq(SctConstants.CONSENT_SENSITIVE_INFO));
    }

    @Test
    void unlinkedConsent_succeedsToClient_withAudit() {
        SctConsent unlinked = SctConsent.builder()
                .id(5L)
                .tenantId(TENANT)
                .invitationId(100L)
                .clientId(null)
                .consentType(SctConstants.CONSENT_SENSITIVE_INFO)
                .agreed(true)
                .revoked(false)
                .build();
        when(consentRepository.findByTenantIdAndInvitationIdAndClientIdIsNullAndRevokedFalse(
                TENANT, 100L)).thenReturn(List.of(unlinked));
        when(consentRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        User admin = new User();
        admin.setId(1L);
        admin.setRole(UserRole.ADMIN);
        consentService.succeedUnlinkedToClient(TENANT, 100L, 99L, admin);

        assertEquals(99L, unlinked.getClientId());
        verify(auditLogService).record(any());
    }

    @Test
    void adultRecordRequiresSignerName() {
        stubTemplates();
        when(consentRepository.existsByTenantIdAndClientIdAndConsentTypeAndRevokedTrue(
                TENANT, 10L, SctConstants.CONSENT_SENSITIVE_INFO)).thenReturn(false);
        when(consentRepository.existsByTenantIdAndClientIdAndConsentTypeAndAgreedTrueAndRevokedFalse(
                TENANT, 10L, SctConstants.CONSENT_SENSITIVE_INFO)).thenReturn(false);
        when(consentRepository.existsByTenantIdAndInvitationIdAndConsentTypeAndAgreedTrueAndRevokedFalse(
                TENANT, 100L, SctConstants.CONSENT_SENSITIVE_INFO)).thenReturn(false);
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue(any(), any()))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> consentService.recordPublicConsent(
                invitation, SctFormType.ADULT.name(),
                SctConsentRequest.builder()
                        .verifySessionId("s")
                        .consentType(SctConstants.CONSENT_SENSITIVE_INFO)
                        .agreed(true)
                        .build(),
                "127.0.0.1", "ua"));
    }

    @Test
    void under14RecordRequiresGuardianNameRelation() {
        invitation.setRequiresGuardian(true);
        stubTemplates();
        when(consentRepository.existsByTenantIdAndClientIdAndConsentTypeAndRevokedTrue(
                TENANT, 10L, SctConstants.CONSENT_SENSITIVE_INFO)).thenReturn(false);
        when(consentRepository.existsByTenantIdAndClientIdAndConsentTypeAndAgreedTrueAndRevokedFalse(
                any(), any(), any())).thenReturn(false);
        when(consentRepository.existsByTenantIdAndInvitationIdAndConsentTypeAndAgreedTrueAndRevokedFalse(
                any(), any(), any())).thenReturn(false);
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue(any(), any()))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> consentService.recordPublicConsent(
                invitation, SctFormType.CHILD.name(),
                SctConsentRequest.builder()
                        .verifySessionId("s")
                        .consentType(SctConstants.CONSENT_SENSITIVE_INFO)
                        .agreed(true)
                        .signerName("아이")
                        .build(),
                "127.0.0.1", "ua"));
    }

    @Test
    void revoke_adminOnly() {
        User staff = new User();
        staff.setId(2L);
        staff.setRole(UserRole.STAFF);
        assertThrows(AccessDeniedException.class,
                () -> consentService.revokeForClient(TENANT, 10L, staff));
    }

    @Test
    void identityContact_recordsWithoutSignerOrVerifySession() {
        SctConsentTemplate identityTpl = SctConsentTemplate.builder()
                .id(9L)
                .tenantId("")
                .consentType(SctConstants.CONSENT_IDENTITY_CONTACT)
                .formType(null)
                .version(SctConsentKeys.TEMPLATE_VERSION_IDENTITY_CONTACT)
                .title("본인확인용 개인정보 수집·이용 동의")
                .bodyText("본문")
                .isActive(true)
                .build();
        when(consentTemplateRepository
                .findFirstByTenantIdAndConsentTypeAndFormTypeIsNullAndIsActiveTrueOrderByCreatedAtDesc(
                        any(), eq(SctConstants.CONSENT_IDENTITY_CONTACT)))
                .thenReturn(Optional.of(identityTpl));
        when(consentRepository.findByTenantIdAndInvitationIdAndConsentTypeAndRevokedFalse(
                TENANT, 100L, SctConstants.CONSENT_IDENTITY_CONTACT))
                .thenReturn(Optional.empty());
        when(consentRepository.save(any(SctConsent.class))).thenAnswer(inv -> {
            SctConsent c = inv.getArgument(0);
            c.setId(77L);
            return c;
        });

        consentService.recordPublicConsent(
                invitation, SctFormType.ADULT.name(),
                SctConsentRequest.builder()
                        .consentType(SctConstants.CONSENT_IDENTITY_CONTACT)
                        .agreed(true)
                        .build(),
                "127.0.0.1", "ua");

        ArgumentCaptor<SctConsent> captor = ArgumentCaptor.forClass(SctConsent.class);
        verify(consentRepository).save(captor.capture());
        SctConsent saved = captor.getValue();
        assertEquals(SctConstants.CONSENT_IDENTITY_CONTACT, saved.getConsentType());
        assertEquals(SctConsentKeys.TEMPLATE_VERSION_IDENTITY_CONTACT, saved.getConsentTemplateVersion());
        assertTrue(Boolean.TRUE.equals(saved.getAgreed()));
        assertEquals(TENANT, saved.getTenantId());
        assertEquals(100L, saved.getInvitationId());
        verify(auditLogService).record(any());
    }

    @Test
    void identityContact_hasConsent_invitationScopedOnly() {
        when(consentRepository.existsByTenantIdAndInvitationIdAndConsentTypeAndAgreedTrueAndRevokedFalse(
                TENANT, 100L, SctConstants.CONSENT_IDENTITY_CONTACT)).thenReturn(true);
        assertTrue(consentService.hasIdentityContactConsent(invitation));

        invitation.setTenantId("other");
        when(consentRepository.existsByTenantIdAndInvitationIdAndConsentTypeAndAgreedTrueAndRevokedFalse(
                "other", 100L, SctConstants.CONSENT_IDENTITY_CONTACT)).thenReturn(false);
        assertFalse(consentService.hasIdentityContactConsent(invitation));
        verify(consentRepository, never())
                .existsByTenantIdAndClientIdAndConsentTypeAndAgreedTrueAndRevokedFalse(
                        any(), any(), eq(SctConstants.CONSENT_IDENTITY_CONTACT));
    }

    @Test
    void sensitiveAndGuardian_stillRequireSignerFields() {
        stubTemplates();
        when(consentRepository.existsByTenantIdAndClientIdAndConsentTypeAndRevokedTrue(
                TENANT, 10L, SctConstants.CONSENT_SENSITIVE_INFO)).thenReturn(false);
        when(consentRepository.existsByTenantIdAndClientIdAndConsentTypeAndAgreedTrueAndRevokedFalse(
                any(), any(), any())).thenReturn(false);
        when(consentRepository.existsByTenantIdAndInvitationIdAndConsentTypeAndAgreedTrueAndRevokedFalse(
                any(), any(), any())).thenReturn(false);
        when(systemConfigRepository.findByTenantIdAndConfigKeyAndIsActiveTrue(any(), any()))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> consentService.recordPublicConsent(
                invitation, SctFormType.ADULT.name(),
                SctConsentRequest.builder()
                        .verifySessionId("s")
                        .consentType(SctConstants.CONSENT_SENSITIVE_INFO)
                        .agreed(true)
                        .build(),
                "127.0.0.1", "ua"));
    }

    private void stubTemplates() {
        when(consentTemplateRepository
                .findFirstByTenantIdAndConsentTypeAndFormTypeAndIsActiveTrueOrderByCreatedAtDesc(
                        any(), eq(SctConstants.CONSENT_SENSITIVE_INFO), any()))
                .thenReturn(Optional.of(adultTpl));
        when(consentTemplateRepository
                .findFirstByTenantIdAndConsentTypeAndFormTypeIsNullAndIsActiveTrueOrderByCreatedAtDesc(
                        any(), eq(SctConstants.CONSENT_GUARDIAN_UNDER_14)))
                .thenReturn(Optional.empty());
        when(consentTemplateRepository
                .findFirstByTenantIdAndConsentTypeAndIsActiveTrueOrderByCreatedAtDesc(
                        any(), eq(SctConstants.CONSENT_GUARDIAN_UNDER_14)))
                .thenReturn(Optional.empty());
    }
}
