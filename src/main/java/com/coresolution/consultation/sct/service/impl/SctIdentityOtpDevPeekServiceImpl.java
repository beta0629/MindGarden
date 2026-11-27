package com.coresolution.consultation.sct.service.impl;

import java.util.Optional;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.sct.entity.SctInvitation;
import com.coresolution.consultation.sct.repository.SctInvitationRepository;
import com.coresolution.consultation.sct.service.SctFeatureGuard;
import com.coresolution.consultation.sct.service.SctIdentityOtpDevCodeStore;
import com.coresolution.consultation.sct.service.SctIdentityOtpDevPeekService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * .dev 전용 OTP peek — 공개 토큰이 아닌 테넌트+초대 ID.
 *
 * @author MindGarden
 * @since 2026-11-27
 */
@Service
@Profile("dev")
@RequiredArgsConstructor
public class SctIdentityOtpDevPeekServiceImpl implements SctIdentityOtpDevPeekService {

    private final SctInvitationRepository invitationRepository;
    private final SctFeatureGuard sctFeatureGuard;
    private final SctIdentityOtpDevCodeStore devCodeStore;

    @Override
    @Transactional(readOnly = true)
    public Optional<String> peekCode(String tenantId, Long invitationId) {
        SctInvitation invitation = invitationRepository
                .findByTenantIdAndIdAndIsDeletedFalse(tenantId, invitationId)
                .orElseThrow(() -> new EntityNotFoundException("SCT 초대를 찾을 수 없습니다."));
        sctFeatureGuard.requireEnabled(tenantId);
        return devCodeStore.peek(tenantId, invitation.getId());
    }
}
