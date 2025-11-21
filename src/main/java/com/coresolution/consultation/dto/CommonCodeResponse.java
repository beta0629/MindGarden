package com.coresolution.consultation.dto;

import com.coresolution.consultation.entity.CommonCode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 공통코드 응답 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommonCodeResponse {
    
    private Long id;
    private String tenantId;
    private String codeGroup;
    private String codeValue;
    private String codeLabel;
    private String koreanName; // 필수 - 한국 사용 필수
    private String codeDescription;
    private Integer sortOrder;
    private Boolean isActive;
    private String parentCodeGroup;
    private String parentCodeValue;
    private String extraData;
    private String icon;
    private String colorCode;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    /**
     * CommonCode 엔티티를 Response DTO로 변환
     */
    public static CommonCodeResponse fromEntity(CommonCode code) {
        if (code == null) {
            return null;
        }
        
        return CommonCodeResponse.builder()
                .id(code.getId())
                .tenantId(code.getTenantId())
                .codeGroup(code.getCodeGroup())
                .codeValue(code.getCodeValue())
                .codeLabel(code.getCodeLabel())
                .koreanName(code.getKoreanName())
                .codeDescription(code.getCodeDescription())
                .sortOrder(code.getSortOrder())
                .isActive(code.getIsActive())
                .parentCodeGroup(code.getParentCodeGroup())
                .parentCodeValue(code.getParentCodeValue())
                .extraData(code.getExtraData())
                .icon(code.getIcon())
                .colorCode(code.getColorCode())
                .createdAt(code.getCreatedAt())
                .updatedAt(code.getUpdatedAt())
                .build();
    }
}

