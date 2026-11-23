package com.coresolution.consultation.sct.service;

import java.util.List;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.sct.dto.SctDomainMemoResponse;
import com.coresolution.consultation.sct.dto.SctDomainMemoUpsertRequest;

/**
 * SCT 영역 메모 서비스.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
public interface SctDomainMemoService {

    /**
     * 초대별 영역 메모 목록.
     *
     * @param tenantId     테넌트
     * @param actor        행위자
     * @param invitationId 초대
     * @param clientIp     IP
     * @param userAgent    UA
     * @return 메모 목록
     */
    List<SctDomainMemoResponse> list(
            String tenantId,
            User actor,
            Long invitationId,
            String clientIp,
            String userAgent);

    /**
     * 영역 메모 upsert.
     *
     * @param tenantId     테넌트
     * @param actor        행위자
     * @param invitationId 초대
     * @param domainCode   영역
     * @param request      본문
     * @param clientIp     IP
     * @param userAgent    UA
     * @return 저장된 메모
     */
    SctDomainMemoResponse upsert(
            String tenantId,
            User actor,
            Long invitationId,
            String domainCode,
            SctDomainMemoUpsertRequest request,
            String clientIp,
            String userAgent);
}
