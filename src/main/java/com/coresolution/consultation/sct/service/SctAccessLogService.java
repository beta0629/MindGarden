package com.coresolution.consultation.sct.service;

import java.time.LocalDateTime;
import com.coresolution.consultation.sct.constant.SctConstants;
import com.coresolution.consultation.sct.entity.SctAccessLog;
import com.coresolution.consultation.sct.entity.SctInvitation;
import com.coresolution.consultation.sct.repository.SctAccessLogRepository;
import com.coresolution.consultation.sct.util.SctTokenHasher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * SCT 열람 감사 로그 기록.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
@Service
@RequiredArgsConstructor
public class SctAccessLogService {

    private final SctAccessLogRepository sctAccessLogRepository;

    /**
     * 본문 열람 로그.
     *
     * @param invitation 초대
     * @param actorId    행위자
     * @param actorRole  역할
     * @param clientIp   IP 평문(해시만 저장)
     * @param userAgent  UA 평문(해시만 저장)
     * @return 저장된 로그
     */
    @Transactional
    public SctAccessLog logViewBody(
            SctInvitation invitation,
            Long actorId,
            String actorRole,
            String clientIp,
            String userAgent) {
        return save(invitation, actorId, actorRole, SctConstants.ACCESS_VIEW_BODY, clientIp, userAgent);
    }

    /**
     * 상담 중 보기 로그.
     *
     * @param invitation 초대
     * @param actorId    행위자
     * @param actorRole  역할
     * @param clientIp   IP
     * @param userAgent  UA
     * @return 로그
     */
    @Transactional
    public SctAccessLog logSessionView(
            SctInvitation invitation,
            Long actorId,
            String actorRole,
            String clientIp,
            String userAgent) {
        return save(invitation, actorId, actorRole, SctConstants.ACCESS_SESSION_VIEW, clientIp, userAgent);
    }

    private SctAccessLog save(
            SctInvitation invitation,
            Long actorId,
            String actorRole,
            String action,
            String clientIp,
            String userAgent) {
        SctAccessLog logEntry = SctAccessLog.builder()
                .invitationId(invitation.getId())
                .clientId(invitation.getClientId())
                .actorId(actorId)
                .actorRole(actorRole)
                .action(action)
                .accessedAt(LocalDateTime.now())
                .ipHash(clientIp == null ? null : SctTokenHasher.sha256Hex(clientIp))
                .userAgentHash(userAgent == null ? null : SctTokenHasher.sha256Hex(userAgent))
                .build();
        logEntry.setTenantId(invitation.getTenantId());
        return sctAccessLogRepository.save(logEntry);
    }
}
