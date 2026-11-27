package com.coresolution.consultation.sct.unit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Optional;
import com.coresolution.consultation.sct.constant.SctConstants;
import com.coresolution.consultation.sct.entity.SctInvitation;
import com.coresolution.consultation.sct.entity.SctShortLink;
import com.coresolution.consultation.sct.repository.SctInvitationRepository;
import com.coresolution.consultation.sct.repository.SctShortLinkRepository;
import com.coresolution.consultation.sct.service.SctExchangeCodeStore;
import com.coresolution.consultation.sct.service.impl.SctShortLinkServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 단축 링크 — 테넌트 격리·리다이렉트·재발급 비활성.
 *
 * @author MindGarden
 * @since 2026-11-27
 */
@ExtendWith(MockitoExtension.class)
class SctShortLinkServiceTest {

    private static final String TENANT = "tenant-a";
    private static final String CODE = "k9P2mX";

    @Mock private SctShortLinkRepository shortLinkRepository;
    @Mock private SctInvitationRepository invitationRepository;
    @Mock private SctExchangeCodeStore exchangeCodeStore;

    @InjectMocks
    private SctShortLinkServiceImpl shortLinkService;

    private SctInvitation invitation;
    private SctShortLink link;

    @BeforeEach
    void setUp() {
        invitation = SctInvitation.builder()
                .formTemplateId(1L)
                .tokenHash("hash")
                .tokenExpiresAt(LocalDateTime.now().plusDays(14))
                .status("SENT")
                .sentByUserId(1L)
                .verifyFailCount(0)
                .requiresGuardian(false)
                .build();
        invitation.setId(10L);
        invitation.setTenantId(TENANT);

        link = SctShortLink.builder()
                .invitationId(10L)
                .shortCode(CODE)
                .expiresAt(invitation.getTokenExpiresAt())
                .isActive(true)
                .build();
        link.setId(1L);
        link.setTenantId(TENANT);
    }

    @Test
    @DisplayName("활성 단축 코드 → 교환 코드 경로(평문 토큰 없음)")
    void resolveRedirect_active_issuesExchangeWithoutRawToken() {
        when(shortLinkRepository.findByShortCodeAndIsDeletedFalse(CODE))
                .thenReturn(Optional.of(link));
        when(invitationRepository.findByTenantIdAndIdAndIsDeletedFalse(TENANT, 10L))
                .thenReturn(Optional.of(invitation));
        when(exchangeCodeStore.issue(eq(10L), eq(TENANT), eq(null)))
                .thenReturn("exchangeOpaqueCodeXYZ");

        String path = shortLinkService.resolveRedirectPath(CODE);

        assertEquals(SctConstants.PUBLIC_SCT_WEB_PREFIX + "exchangeOpaqueCodeXYZ", path);
        assertFalse(path.contains(invitation.getTokenHash()));
        assertFalse(path.contains("/public/sct/hash"));
    }

    @Test
    @DisplayName("미존재·형식 오류 → 동일 invalid 경로")
    void resolveRedirect_missingAndInvalidSamePath() {
        when(shortLinkRepository.findByShortCodeAndIsDeletedFalse(CODE))
                .thenReturn(Optional.empty());

        assertEquals(SctConstants.SHORT_LINK_INVALID_REDIRECT_PATH,
                shortLinkService.resolveRedirectPath(CODE));
        assertEquals(SctConstants.SHORT_LINK_INVALID_REDIRECT_PATH,
                shortLinkService.resolveRedirectPath("bad"));
        verify(exchangeCodeStore, never()).issue(any(), anyString(), any());
    }

    @Test
    @DisplayName("비활성(재발급) 단축 코드 → REISSUED 교환")
    void resolveRedirect_inactive_issuesReissuedExchange() {
        link.setIsActive(false);
        when(shortLinkRepository.findByShortCodeAndIsDeletedFalse(CODE))
                .thenReturn(Optional.of(link));
        when(invitationRepository.findByTenantIdAndIdAndIsDeletedFalse(TENANT, 10L))
                .thenReturn(Optional.of(invitation));
        when(exchangeCodeStore.issue(eq(10L), eq(TENANT), eq(SctConstants.PUBLIC_STATUS_REISSUED)))
                .thenReturn("reissueExchange");

        String path = shortLinkService.resolveRedirectPath(CODE);
        assertEquals(SctConstants.PUBLIC_SCT_WEB_PREFIX + "reissueExchange", path);
    }

    @Test
    @DisplayName("테넌트 불일치 초대 → invalid")
    void resolveRedirect_tenantMismatch_invalid() {
        invitation.setTenantId("other-tenant");
        when(shortLinkRepository.findByShortCodeAndIsDeletedFalse(CODE))
                .thenReturn(Optional.of(link));
        when(invitationRepository.findByTenantIdAndIdAndIsDeletedFalse(TENANT, 10L))
                .thenReturn(Optional.of(invitation));

        assertEquals(SctConstants.SHORT_LINK_INVALID_REDIRECT_PATH,
                shortLinkService.resolveRedirectPath(CODE));
        verify(exchangeCodeStore, never()).issue(any(), anyString(), any());
    }

    @Test
    @DisplayName("createOrRotate — 기존 활성 비활성 후 신규 저장")
    void createOrRotate_deactivatesThenSaves() {
        when(shortLinkRepository.existsByShortCodeAndIsDeletedFalse(anyString())).thenReturn(false);
        when(shortLinkRepository.saveAndFlush(any(SctShortLink.class))).thenAnswer(inv -> {
            SctShortLink saved = inv.getArgument(0);
            saved.setId(99L);
            return saved;
        });

        SctShortLink created = shortLinkService.createOrRotate(invitation);

        verify(shortLinkRepository).deactivateActiveForInvitation(TENANT, 10L);
        ArgumentCaptor<SctShortLink> captor = ArgumentCaptor.forClass(SctShortLink.class);
        verify(shortLinkRepository).saveAndFlush(captor.capture());
        assertEquals(TENANT, captor.getValue().getTenantId());
        assertEquals(6, created.getShortCode().length());
        assertTrue(Boolean.TRUE.equals(created.getIsActive()));
    }
}
