package com.coresolution.core.controller.dto.ops;

import jakarta.validation.constraints.NotBlank;

/**
 * Feature Flag 생성 요청 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public record FeatureFlagCreateRequest(
    @NotBlank(message = "플래그 키는 필수입니다")
    String flagKey,
    
    String description,
    
    String targetScope,
    
    String expiresAt  // ISO-8601 형식
) {}

