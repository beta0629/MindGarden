package com.mindgarden.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 코드 그룹 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeGroupDto {
    
    private Long id;
    private String code;
    private String name;
    private String description;
    private Integer sortOrder;
    private Boolean isActive;
    private Long codeValueCount;
}
