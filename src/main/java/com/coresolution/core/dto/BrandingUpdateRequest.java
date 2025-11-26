package com.coresolution.core.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 브랜딩 정보 업데이트 요청 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-26
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BrandingUpdateRequest {
    
    /**
     * 회사명 (한글)
     */
    @Size(max = 255, message = "회사명은 255자 이하여야 합니다")
    private String companyName;
    
    /**
     * 회사명 (영문)
     */
    @Size(max = 255, message = "영문 회사명은 255자 이하여야 합니다")
    private String companyNameEn;
    
    /**
     * 주 색상 (Primary Color)
     * 예: #007bff
     */
    @Size(max = 7, message = "색상 코드는 7자 이하여야 합니다")
    private String primaryColor;
    
    /**
     * 보조 색상 (Secondary Color)
     * 예: #6c757d
     */
    @Size(max = 7, message = "색상 코드는 7자 이하여야 합니다")
    private String secondaryColor;
    
    /**
     * 파비콘 URL
     */
    @Size(max = 500, message = "파비콘 URL은 500자 이하여야 합니다")
    private String favicon;
}
