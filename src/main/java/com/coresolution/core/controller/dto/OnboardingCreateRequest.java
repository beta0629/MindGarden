package com.coresolution.core.controller.dto;

import com.coresolution.core.domain.onboarding.RiskLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * 온보딩 요청 생성 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public record OnboardingCreateRequest(
    String tenantId,  // 온보딩 중이면 null (신규 생성 시)
    
    @NotBlank(message = "테넌트 이름은 필수입니다")
    String tenantName,
    
    @NotBlank(message = "요청자 ID는 필수입니다")
    String requestedBy,
    
    @NotNull(message = "위험도는 필수입니다")
    RiskLevel riskLevel,
    
    String checklistJson,
    
    String businessType,  // 업종 타입 (동적 카테고리 시스템)
    
    String adminPassword  // 관리자 계정 비밀번호 (승인 시 계정 생성에 사용, 암호화 저장)
) {}

