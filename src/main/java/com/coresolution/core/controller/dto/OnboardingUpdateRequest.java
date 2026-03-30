package com.coresolution.core.controller.dto;

import jakarta.validation.constraints.Size;

/**
 * 온보딩 요청 수정 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-12
 */
public record OnboardingUpdateRequest(
    @Size(max = 120, message = "테넌트 이름은 최대 120자까지 입력 가능합니다")
    String tenantName,
    
    @Size(max = 100, message = "서브도메인은 최대 100자까지 입력 가능합니다")
    String subdomain,
    
    @Size(max = 255, message = "브랜드명은 최대 255자까지 입력 가능합니다")
    String brandName,
    
    String regionCode,
    
    String businessType
) {}

