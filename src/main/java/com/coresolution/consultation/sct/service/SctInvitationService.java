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

    List<SctInvitationResponse> listByClient(String tenantId, User actor, Long clientId);

    SctInvitationResponse latestSubmitted(
            String tenantId, User actor, Long clientId, String clientIp, String userAgent);

    SctInvitationResponse sessionView(
            String tenantId, User actor, Long clientId, Long mappingId, String clientIp, String userAgent);

    List<SctInvitationResponse> listUnlinked(String tenantId);

    List<SctLinkCandidateResponse> linkCandidates(String tenantId, Long invitationId);

    SctInvitationResponse link(String tenantId, User actor, Long invitationId, SctLinkRequest request);

    SctInvitationResponse unlink(String tenantId, User actor, Long invitationId);
}
