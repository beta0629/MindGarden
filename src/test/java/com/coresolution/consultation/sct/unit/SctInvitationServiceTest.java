package com.coresolution.consultation.sct.unit;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
import com.coresolution.consultation.constant.UserRole;
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
import com.coresolution.consultation.sct.exception.SctFeatureDisabledException;
import com.coresolution.consultation.sct.repository.SctFormItemRepository;
import com.coresolution.consultation.sct.repository.SctFormTemplateRepository;
import com.coresolution.consultation.sct.repository.SctInvitationRepository;
import com.coresolution.consultation.sct.repository.SctResponseAnswerRepository;
import com.coresolution.consultation.sct.service.SctAccessLogService;
import com.coresolution.consultation.sct.service.SctFeatureGuard;
import com.coresolution.consultation.sct.service.SctSettingsService;
import com.coresolution.consultation.sct.service.impl.SctInvitationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

/**
 * SCT 초대 — 테넌트 격리·SMS_TEST_MODE·STAFF 열람 로그·플래그·만료일 스냅샷.
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
    @Mock private ClientRepository clientRepository;
    @Mock private ConsultantClientMappingRepository mappingRepository;
    @Mock private SmsAuthService smsAuthService;
    @Mock private AuditLogService auditLogService;
    @Mock private SctAccessLogService sctAccessLogService;

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
    void createUsesSettingsExpiry_andDoesNotMutateExistingExpiresAt() {
        when(sctSettingsService.resolveLinkExpiryDays("t1")).thenReturn(21);
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
        assertEquals(SctConstants.SMS_RESULT_TEST_MODE_SKIP, created.getSmsDispatchResult());
        verify(smsAuthService, never()).sendNotificationMessage(anyString(), anyString());
    }

    @Test
    void existingInvitationExpiryUnchanged_whenSettingsChange() {
        SctInvitation existing = SctInvitation.builder()
                .formTemplateId(10L)
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
        when(formTemplateRepository.findByIdAndIsDeletedFalse(10L))
                .thenReturn(Optional.of(template));
        when(answerRepository.findByTenantIdAndInvitationId("t1", 77L))
                .thenReturn(Collections.emptyList());
        when(formItemRepository.findByFormTemplateIdOrderBySortOrderAsc(10L))
                .thenReturn(Collections.emptyList());
        when(sctAccessLogService.logViewBody(any(), any(), any(), any(), any()))
                .thenReturn(new SctAccessLog());
        when(auditLogService.record(any())).thenAnswer(i -> i.getArgument(0));

        var view = invitationService.getInvitation("t1", staff, 77L, true, "1.1.1.1", "ua");
        assertEquals(LocalDateTime.of(2026, 12, 1, 0, 0), view.getTokenExpiresAt());
        verify(sctAccessLogService).logViewBody(
                eq(existing), eq(2L), eq("STAFF"), eq("1.1.1.1"), eq("ua"));
    }

    @Test
    void otherTenantId_denied() {
        SctInvitation existing = SctInvitation.builder()
                .formTemplateId(10L)
                .tokenHash("abc")
                .tokenExpiresAt(LocalDateTime.now().plusDays(1))
                .status(SctInviteStatus.SENT.name())
                .sentByUserId(1L)
                .verifyFailCount(0)
                .build();
        existing.setId(77L);
        existing.setTenantId("tenant-a");

        when(invitationRepository.findByTenantIdAndIdAndIsDeletedFalse("tenant-b", 77L))
                .thenReturn(Optional.empty());

        assertThrows(com.coresolution.consultation.exception.EntityNotFoundException.class,
                () -> invitationService.getInvitation("tenant-b", admin, 77L, false, null, null));
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
}
