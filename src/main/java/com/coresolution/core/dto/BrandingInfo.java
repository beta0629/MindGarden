package com.coresolution.core.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 브랜딩 정보 DTO
 * 테넌트별 로고, 상호명, 색상 등 브랜딩 정보를 담는 클래스
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-26
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BrandingInfo {
    
    /**
     * 로고 정보
     */
    private LogoInfo logo;
    
    /**
     * 회사명 (한글)
     */
    private String companyName;
    
    /**
     * 회사명 (영문)
     */
    private String companyNameEn;
    
    /**
     * 주 색상 (Primary Color)
     */
    private String primaryColor;
    
    /**
     * 보조 색상 (Secondary Color)
     */
    private String secondaryColor;
    
    /**
     * 파비콘 URL
     */
    private String favicon;
    
    /**
     * 로고 정보 내부 클래스
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class LogoInfo {
        
        /**
         * 로고 이미지 URL
         */
        private String url;
        
        /**
         * 로고 너비 (픽셀)
         */
        private Integer width;
        
        /**
         * 로고 높이 (픽셀)
         */
        private Integer height;
        
        /**
         * 이미지 형식 (png, jpg, svg 등)
         */
        private String format;
        
        /**
         * 대체 텍스트 (alt)
         */
        private String alt;
    }
    
    /**
     * 기본 브랜딩 정보 생성 (Fallback용)
     */
    public static BrandingInfo createDefault(String tenantName) {
        return BrandingInfo.builder()
            .logo(LogoInfo.builder()
                .url("/images/core-solution-logo.png")
                .width(200)
                .height(60)
                .format("png")
                .alt("CoreSolution")
                .build())
            .companyName(tenantName != null ? tenantName : "CoreSolution")
            .companyNameEn("CoreSolution")
            .primaryColor("#007bff")
            .secondaryColor("#6c757d")
            .favicon("/favicon.ico")
            .build();
    }
    
    /**
     * 로고가 설정되어 있는지 확인
     */
    public boolean hasLogo() {
        return logo != null && logo.getUrl() != null && !logo.getUrl().trim().isEmpty();
    }
    
    /**
     * 회사명이 설정되어 있는지 확인
     */
    public boolean hasCompanyName() {
        return companyName != null && !companyName.trim().isEmpty();
    }
    
    /**
     * 표시할 회사명 반환 (한글 우선, 없으면 영문)
     */
    public String getDisplayName() {
        if (hasCompanyName()) {
            return companyName;
        }
        if (companyNameEn != null && !companyNameEn.trim().isEmpty()) {
            return companyNameEn;
        }
        return "CoreSolution";
    }
}
