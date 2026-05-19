package com.coresolution.consultation.dto.shop.admin;

import jakarta.validation.constraints.NotEmpty;
import java.util.Map;

/**
 * 테넌트 포인트 정책 부분 수정(MVP 키만 허용).
 *
 * @author MindGarden
 * @since 2026-05-19
 */
public record PointTenantPoliciesPatchRequest(
        @NotEmpty Map<String, Object> policies
) {
}
