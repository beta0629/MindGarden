package com.coresolution.consultation.sct.unit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.service.AuditLogService;
import com.coresolution.consultation.service.SmsAuthService;
import com.coresolution.consultation.sct.constant.SctConstants;
import com.coresolution.consultation.sct.dto.SctLinkCandidateResponse;
import com.coresolution.consultation.sct.entity.SctInvitation;
import com.coresolution.consultation.sct.repository.SctFormItemRepository;
import com.coresolution.consultation.sct.repository.SctFormTemplateRepository;
import com.coresolution.consultation.sct.repository.SctInvitationRepository;
import com.coresolution.consultation.sct.repository.SctResponseAnswerRepository;
import com.coresolution.consultation.sct.service.SctAccessLogService;
import com.coresolution.consultation.sct.service.SctFeatureGuard;
import com.coresolution.consultation.sct.service.SctSettingsService;
import com.coresolution.consultation.sct.service.impl.SctInvitationServiceImpl;
import com.coresolution.consultation.util.LoginIdentifierUtils;
import com.coresolution.consultation.util.PhoneHashUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * SCT link-candidates — 동일 테넌트 전화 매칭·타 테넌트 배제·자동 link 금지.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@ExtendWith(MockitoExtension.class)
class SctLinkCandidatesServiceTest {

    private static final String PHONE = "01012345678";

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

    private SctInvitation invitation;
    private String phoneHash;

    @BeforeEach
    void setUp() {
        phoneHash = PhoneHashUtils.sha256Hex(
                LoginIdentifierUtils.normalizeKoreanMobileDigits(PHONE));
        invitation = SctInvitation.builder()
                .formTemplateId(10L)
                .targetPhone(PHONE)
                .targetPhoneHash(phoneHash)
                .tokenHash("tok")
                .status("SENT")
                .sentByUserId(1L)
                .verifyFailCount(0)
                .build();
        invitation.setId(88L);
        invitation.setTenantId("tenant-a");
    }

    @Test
    @DisplayName("같은 테넌트 동일 번호 → 후보 1")
    void sameTenantSamePhone_returnsOneCandidate() {
        when(invitationRepository.findByTenantIdAndIdAndIsDeletedFalse("tenant-a", 88L))
                .thenReturn(Optional.of(invitation));

        Client match = new Client();
        match.setId(101L);
        match.setTenantId("tenant-a");
        match.setName("홍길동");
        match.setPhone(PHONE);
        match.setEmail("a@example.com");
        match.setIsDeleted(false);

        when(clientRepository.findByTenantIdAndIsDeletedFalse("tenant-a"))
                .thenReturn(List.of(match));

        List<SctLinkCandidateResponse> result =
                invitationService.linkCandidates("tenant-a", 88L);

        assertEquals(1, result.size());
        assertEquals(101L, result.get(0).getClientId());
        assertEquals(SctConstants.MATCH_CHANNEL_PHONE, result.get(0).getMatchChannel());
        assertEquals("홍*동", result.get(0).getMaskedName());
    }

    @Test
    @DisplayName("타 테넌트 동일 번호 → 후보 0 (테넌트 스캔만)")
    void otherTenantSamePhone_returnsEmpty() {
        when(invitationRepository.findByTenantIdAndIdAndIsDeletedFalse("tenant-a", 88L))
                .thenReturn(Optional.of(invitation));
        // 타 테넌트 클라이언트는 조회 결과에 포함되지 않음
        when(clientRepository.findByTenantIdAndIsDeletedFalse("tenant-a"))
                .thenReturn(List.of());

        List<SctLinkCandidateResponse> result =
                invitationService.linkCandidates("tenant-a", 88L);

        assertEquals(0, result.size());
    }
}
