package com.coresolution.consultation.sct.service;

import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.sct.dto.SctConsentRequest;
import com.coresolution.consultation.sct.dto.SctConsentStatusView;
import com.coresolution.consultation.sct.entity.SctConsentTemplate;
import com.coresolution.consultation.sct.entity.SctInvitation;

/**
 * SCT 내담자 단위 동의 SSOT.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
public interface SctConsentService {

    /**
     * 서명 주체 밴드(성인 / 14+ 청소년 / 14세 미만).
     *
     * @param formType         양식
     * @param requiresGuardian 만 14세 미만 여부
     * @return 밴드 코드
     */
    String resolveSignerBand(String formType, boolean requiresGuardian);

    /**
     * 동의 상태·문구 조회(공개 화면용).
     *
     * @param invitation 초대
     * @param formType   양식
     * @return 상태
     */
    SctConsentStatusView resolveStatus(SctInvitation invitation, String formType);

    /**
     * 필수 동의 충족 여부. 미충족 시 AccessDeniedException(403).
     *
     * @param invitation 초대
     * @param formType   양식
     */
    void requireSatisfied(SctInvitation invitation, String formType);

    /**
     * 발송 전: 철회된 동의가 있으면 차단.
     *
     * @param tenantId 테넌트
     * @param clientId 내담자(null 허용)
     */
    void assertNotRevokedForDispatch(String tenantId, Long clientId);

    /**
     * 공개 동의 저장.
     *
     * @param invitation 초대
     * @param formType   양식
     * @param request    요청
     * @param clientIp   IP
     * @param userAgent  UA
     */
    void recordPublicConsent(
            SctInvitation invitation,
            String formType,
            SctConsentRequest request,
            String clientIp,
            String userAgent);

    /**
     * 초대·테넌트 기준 활성 IDENTITY_CONTACT 동의 여부.
     *
     * @param invitation 초대
     * @return 활성 동의 있으면 true
     */
    boolean hasIdentityContactConsent(SctInvitation invitation);

    /**
     * 코어 테넌트 활성 IDENTITY_CONTACT 동의 템플릿.
     *
     * @return 템플릿(없으면 null)
     */
    SctConsentTemplate activeIdentityContactTemplate();

    /**
     * 미연동 초대 동의를 내담자로 승계.
     *
     * @param tenantId     테넌트
     * @param invitationId 초대
     * @param clientId     내담자
     * @param actor        행위자
     */
    void succeedUnlinkedToClient(String tenantId, Long invitationId, Long clientId, User actor);

    /**
     * ADMIN 철회.
     *
     * @param tenantId 테넌트
     * @param clientId 내담자
     * @param actor    ADMIN
     */
    void revokeForClient(String tenantId, Long clientId, User actor);
}
