package com.coresolution.core.controller.dto.ops;

import com.coresolution.core.domain.ops.FeatureFlagState;
import jakarta.validation.constraints.NotNull;

/**
 * Feature Flag 상태 변경 요청 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public record FeatureFlagToggleRequest(
    @NotNull(message = "상태는 필수입니다")
    FeatureFlagState state
) {}

