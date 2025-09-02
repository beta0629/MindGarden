package com.mindgarden.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 코드 값 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeValueDto {
    
    private Long id;
    private Long codeGroupId;
    private String codeGroupCode;
    private String codeGroupName;
    private String code;
    private String name;
    private String description;
    private Integer sortOrder;
    private Boolean isActive;
    private String colorCode;
    private String icon;
    private Integer durationMinutes;
}
