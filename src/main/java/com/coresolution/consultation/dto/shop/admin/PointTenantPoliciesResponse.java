package com.coresolution.consultation.dto.shop.admin;

import java.util.Map;

/**
 * 테넌트 포인트 정책 조회 응답(MVP 키 subset).
 *
 * @author MindGarden
 * @since 2026-05-19
 */
public record PointTenantPoliciesResponse(
        String tenantId,
        Map<String, Object> policies
) {
}
