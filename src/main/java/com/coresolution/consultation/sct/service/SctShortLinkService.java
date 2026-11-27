package com.coresolution.consultation.sct.service;

import java.time.LocalDateTime;
import java.util.Optional;
import com.coresolution.consultation.sct.entity.SctInvitation;
import com.coresolution.consultation.sct.entity.SctShortLink;

/**
 * SCT 단축 링크 발급·해석.
 *
 * @author MindGarden
 * @since 2026-11-27
 */
public interface SctShortLinkService {

    /**
     * 초대용 단축 링크 신규 발급(기존 활성 코드 비활성화).
     *
     * @param invitation 초대
     * @return 신규 단축 링크
     */
    SctShortLink createOrRotate(SctInvitation invitation);

    /**
     * 초대에 활성 단축 코드가 있으면 반환.
     *
     * @param tenantId     테넌트
     * @param invitationId 초대
     * @return 활성 단축 링크
     */
    Optional<SctShortLink> findActive(String tenantId, Long invitationId);

    /**
     * GET /s/{code} → SPA 경로(상대). 평문 초대 토큰 미포함.
     * 미존재·형식 오류는 동일 invalid 경로(존재 여부 누출 방지).
     *
     * @param shortCode 단축 코드
     * @return {@code /public/sct/{exchange}} 또는 invalid
     */
    String resolveRedirectPath(String shortCode);

    /**
     * 만료 시각 갱신(재발송 시 초대 expires 미러).
     *
     * @param tenantId     테넌트
     * @param invitationId 초대
     * @param expiresAt    새 만료
     */
    void refreshExpiry(String tenantId, Long invitationId, LocalDateTime expiresAt);

    /**
     * 초대에 연결된 활성 단축 링크 전부 비활성화(취소 등).
     *
     * @param tenantId     테넌트
     * @param invitationId 초대
     */
    void deactivateForInvitation(String tenantId, Long invitationId);
}
