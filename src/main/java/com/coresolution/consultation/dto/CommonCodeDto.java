package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 공통코드 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommonCodeDto {
    private Long id;
    private String codeGroup;
    private String codeValue;
    private String codeLabel;
    private String codeDescription;
    private Integer sortOrder;
    private Boolean isActive;
    private String parentCodeGroup;
    private String parentCodeValue;
    private String extraData;
    private String icon;
    private String colorCode;
    private String koreanName;
}
