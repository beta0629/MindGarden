package com.coresolution.core.dto;

import lombok.*;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * 위젯 추가 요청 DTO
 * 
 * 표준: DTO_NAMING_STANDARD.md 준수
 * 
 * @author CoreSolution Team
 * @since 2025-12-02
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddWidgetRequest {
    
    @NotBlank(message = "위젯 타입은 필수입니다")
    private String widgetType;
    
    @NotBlank(message = "업종은 필수입니다")
    private String businessType;
    
    private String roleCode;
    
    private String customConfig;
    
    @NotNull(message = "표시 순서는 필수입니다")
    private Integer displayOrder;
}

