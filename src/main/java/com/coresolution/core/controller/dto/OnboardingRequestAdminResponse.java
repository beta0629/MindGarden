package com.coresolution.core.controller.dto;

import java.time.LocalDateTime;
import com.coresolution.core.domain.onboarding.OnboardingRequest;
import com.coresolution.core.domain.onboarding.OnboardingStatus;
import com.coresolution.core.domain.onboarding.RiskLevel;
import com.coresolution.core.security.OnboardingAdminPasswordSupport;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * OPS 전용 온보딩 요청 응답 (목록·상세·결정·재시도).
 * 엔티티와 같은 필드명을 유지하되 checklistJson 에서 adminPassword 키를 제거한다.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */
public record OnboardingRequestAdminResponse(
        Long id,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        Boolean isDeleted,
        Long version,
        String tenantId,
        String subdomain,
        String tenantName,
        String brandName,
        String region,
        String requestedBy,
        OnboardingStatus status,
        RiskLevel riskLevel,
        String checklistJson,
        String decidedBy,
        String decisionAt,
        String decisionNote,
        String businessType,
        String businessRegistrationNumber,
        String representativeName,
        String businessLandline,
        String businessAddress,
        String mailOrderReportNumber,
        String refundPolicyText,
        String productPriceGuideText,
        String initializationStatusJson) {

    /**
     * 엔티티에서 OPS 응답을 만든다.
     *
     * @param request      온보딩 요청 엔티티
     * @param objectMapper checklist_json 정제용
     * @return OPS 응답 (입력이 null 이면 null)
     */
    public static OnboardingRequestAdminResponse from(OnboardingRequest request,
            ObjectMapper objectMapper) {
        if (request == null) {
            return null;
        }
        return new OnboardingRequestAdminResponse(request.getId(), request.getCreatedAt(),
                request.getUpdatedAt(), request.getIsDeleted(), request.getVersion(),
                request.getTenantId(), request.getSubdomain(), request.getTenantName(),
                request.getBrandName(), request.getRegion(), request.getRequestedBy(),
                request.getStatus(), request.getRiskLevel(),
                OnboardingAdminPasswordSupport.stripFromChecklistJson(request.getChecklistJson(),
                        objectMapper),
                request.getDecidedBy(), request.getDecisionAt(), request.getDecisionNote(),
                request.getBusinessType(), request.getBusinessRegistrationNumber(),
                request.getRepresentativeName(), request.getBusinessLandline(),
                request.getBusinessAddress(), request.getMailOrderReportNumber(),
                request.getRefundPolicyText(), request.getProductPriceGuideText(),
                request.getInitializationStatusJson());
    }
}
