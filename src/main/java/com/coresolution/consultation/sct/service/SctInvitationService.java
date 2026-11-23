package com.coresolution.consultation.sct.service;

import java.util.List;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.sct.dto.SctFormSummaryResponse;
import com.coresolution.consultation.sct.dto.SctInviteCreateRequest;
import com.coresolution.consultation.sct.dto.SctInvitationResponse;
import com.coresolution.consultation.sct.dto.SctLinkCandidateResponse;
import com.coresolution.consultation.sct.dto.SctLinkRequest;

/**
 * SCT 관리·상담사 초대 API 서비스.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
public interface SctInvitationService {

    List<SctFormSummaryResponse> listForms(String tenantId);

    SctInvitationResponse createInvitation(String tenantId, User actor, SctInviteCreateRequest request);

    List<SctInvitationResponse> listInvitations(String tenantId, User actor, Long clientId, String status);

    SctInvitationResponse getInvitation(
            String tenantId, User actor, Long id, boolean includeAnswers, String clientIp, String userAgent);

    SctInvitationResponse cancel(String tenantId, User actor, Long id);

    SctInvitationResponse resendSms(String tenantId, User actor, Long id);

    /**
     * 공개 링크 재발급 — 토큰 회전, SMS 없음, 응답에 one-shot publicUrl/token.
     *
     * @param tenantId 테넌트
     * @param actor    행위자
     * @param id       초대 ID
     * @return 초대 메타 + one-shot 링크
     */
    SctInvitationResponse reissueLink(String tenantId, User actor, Long id);

    List<SctInvitationResponse> listByClient(String tenantId, User actor, Long clientId);

    SctInvitationResponse latestSubmitted(
            String tenantId, User actor, Long clientId, String clientIp, String userAgent);

    SctInvitationResponse sessionView(
            String tenantId, User actor, Long clientId, Long mappingId, String clientIp, String userAgent);

    List<SctInvitationResponse> listUnlinked(String tenantId);

    List<SctLinkCandidateResponse> linkCandidates(String tenantId, Long invitationId);

    SctInvitationResponse link(String tenantId, User actor, Long invitationId, SctLinkRequest request);

    SctInvitationResponse unlink(String tenantId, User actor, Long invitationId);

    /**
     * ADMIN — 내담자 단위 SCT 동의 철회. 이후 발송·실시 차단.
     *
     * @param tenantId 테넌트
     * @param actor 관리자
     * @param clientId 내담자
     */
    void revokeClientConsent(String tenantId, User actor, Long clientId);

    /**
     * 응답 인쇄 감사(sct_access_logs PRINT + AuditAction.SCT_RESPONSE_PRINTED).
     * 열람과 동일 권한(ADMIN·STAFF·담당 CONSULTANT).
     *
     * @param tenantId  테넌트
     * @param actor     행위자
     * @param id        초대 ID
     * @param clientIp  IP
     * @param userAgent UA
     */
    void recordPrintAudit(String tenantId, User actor, Long id, String clientIp, String userAgent);

    /**
     * ADMIN 수동 파기. 파기 대상(보관일 경과)만 허용, 아니면 409.
     * 응답·영역 메모 삭제, 동의(sct_consents)는 유지. 감사는 managementNo 만.
     *
     * @param tenantId 테넌트
     * @param actor    ADMIN
     * @param id       초대 ID
     */
    void destroyInvitation(String tenantId, User actor, Long id);
}
