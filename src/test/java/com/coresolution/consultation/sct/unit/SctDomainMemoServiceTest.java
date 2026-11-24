package com.coresolution.consultation.sct.unit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
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
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.service.AuditLogService;
import com.coresolution.consultation.sct.dto.SctDomainMemoUpsertRequest;
import com.coresolution.consultation.sct.entity.SctDomainMemo;
import com.coresolution.consultation.sct.entity.SctInvitation;
import com.coresolution.consultation.sct.exception.SctFeatureDisabledException;
import com.coresolution.consultation.sct.repository.SctDomainMemoRepository;
import com.coresolution.consultation.sct.repository.SctInvitationRepository;
import com.coresolution.consultation.sct.service.SctAccessLogService;
import com.coresolution.consultation.sct.service.SctClinicalAccessDeniedAuditWriter;
import com.coresolution.consultation.sct.service.SctFeatureGuard;
import com.coresolution.consultation.sct.service.impl.SctDomainMemoServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

/**
 * SCT 영역 메모 — 테넌트 격리·비담당 거부·담당/ADMIN/STAFF 허용·암호 필드 저장.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@ExtendWith(MockitoExtension.class)
class SctDomainMemoServiceTest {

    @Mock private SctFeatureGuard sctFeatureGuard;
    @Mock private SctInvitationRepository invitationRepository;
    @Mock private SctDomainMemoRepository domainMemoRepository;
    @Mock private ConsultantClientMappingRepository mappingRepository;
    @Mock private AuditLogService auditLogService;
    @Mock private SctAccessLogService sctAccessLogService;
    @Mock private SctClinicalAccessDeniedAuditWriter clinicalAccessDeniedAuditWriter;

    @InjectMocks
    private SctDomainMemoServiceImpl domainMemoService;

    private User admin;
    private User staff;
    private User consultant;
    private SctInvitation invitation;

    @BeforeEach
    void setUp() {
        admin = new User();
        admin.setId(1L);
        admin.setRole(UserRole.ADMIN);

        staff = new User();
        staff.setId(2L);
        staff.setRole(UserRole.STAFF);

        consultant = new User();
        consultant.setId(9L);
        consultant.setRole(UserRole.CONSULTANT);

        invitation = SctInvitation.builder()
                .formTemplateId(10L)
                .clientId(100L)
                .consultantId(9L)
                .tokenHash("abc")
                .status("SUBMITTED")
                .sentByUserId(1L)
                .verifyFailCount(0)
                .build();
        invitation.setId(55L);
        invitation.setTenantId("t1");
    }

    @Test
    @DisplayName("플래그 OFF면 404 fail-closed")
    void featureOff_throws404() {
        org.mockito.Mockito.doThrow(new SctFeatureDisabledException("off"))
                .when(sctFeatureGuard).requireEnabled("t1");
        assertThrows(SctFeatureDisabledException.class, () ->
                domainMemoService.list("t1", admin, 55L, null, null));
    }

    @Test
    @DisplayName("타 테넌트 초대는 조회 불가")
    void otherTenant_denied() {
        when(invitationRepository.findByTenantIdAndIdAndIsDeletedFalse("t2", 55L))
                .thenReturn(Optional.empty());
        assertThrows(com.coresolution.consultation.exception.EntityNotFoundException.class, () ->
                domainMemoService.list("t2", admin, 55L, null, null));
    }

    @Test
    @DisplayName("비담당 CONSULTANT는 403")
    void unassignedConsultant_denied() {
        when(invitationRepository.findByTenantIdAndIdAndIsDeletedFalse("t1", 55L))
                .thenReturn(Optional.of(invitation));
        invitation.setConsultantId(8L);
        when(mappingRepository.findActiveOrExhaustedListByTenantIdAndConsultantIdAndClientId(
                "t1", 9L, 100L)).thenReturn(List.of());

        assertThrows(AccessDeniedException.class, () ->
                domainMemoService.upsert(
                        "t1", consultant, 55L, "AFFECT",
                        SctDomainMemoUpsertRequest.builder().memoText("메모").build(),
                        "1.1.1.1", "ua"));
        verify(domainMemoRepository, never()).save(any());
    }

    @Test
    @DisplayName("STAFF 영역 메모 저장 403")
    void staffCannotSave() {
        when(invitationRepository.findByTenantIdAndIdAndIsDeletedFalse("t1", 55L))
                .thenReturn(Optional.of(invitation));

        assertThrows(AccessDeniedException.class, () ->
                domainMemoService.upsert(
                        "t1", staff, 55L, "AFFECT",
                        SctDomainMemoUpsertRequest.builder().memoText("메모").build(),
                        "1.1.1.1", "ua"));
        verify(clinicalAccessDeniedAuditWriter).record(eq("t1"), eq(staff), eq(invitation));
        verify(domainMemoRepository, never()).save(any());
    }

    @Test
    @DisplayName("담당 CONSULTANT·ADMIN 저장 허용 + converter 필드 라운드트립")
    void assignedConsultantAndAdmin_canSave() {
        when(invitationRepository.findByTenantIdAndIdAndIsDeletedFalse("t1", 55L))
                .thenReturn(Optional.of(invitation));
        when(domainMemoRepository
                .findByTenantIdAndInvitationIdAndDomainCodeAndIsDeletedFalse("t1", 55L, "AFFECT"))
                .thenReturn(Optional.empty());
        when(domainMemoRepository.save(any())).thenAnswer(inv -> {
            SctDomainMemo m = inv.getArgument(0);
            m.setId(77L);
            return m;
        });
        when(auditLogService.record(any())).thenAnswer(i -> i.getArgument(0));

        var saved = domainMemoService.upsert(
                "t1", consultant, 55L, "AFFECT",
                SctDomainMemoUpsertRequest.builder().memoText("면담 확인").build(),
                "1.1.1.1", "ua");
        assertEquals("면담 확인", saved.getMemoText());
        assertEquals("AFFECT", saved.getDomainCode());

        ArgumentCaptor<SctDomainMemo> captor = ArgumentCaptor.forClass(SctDomainMemo.class);
        verify(domainMemoRepository).save(captor.capture());
        assertEquals("면담 확인", captor.getValue().getMemoText());
        assertEquals("t1", captor.getValue().getTenantId());
        verify(sctAccessLogService).logMemoSave(
                eq(invitation), eq(9L), eq("CONSULTANT"), eq("1.1.1.1"), eq("ua"));

        when(domainMemoRepository.findByTenantIdAndInvitationIdAndIsDeletedFalse("t1", 55L))
                .thenReturn(Collections.singletonList(captor.getValue()));
        var listed = domainMemoService.list("t1", admin, 55L, "1.1.1.1", "ua");
        assertEquals(1, listed.size());
        assertEquals("면담 확인", listed.get(0).getMemoText());
    }
}
