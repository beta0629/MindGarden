package com.coresolution.consultation.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 공통코드 수정 요청 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommonCodeUpdateRequest {
    
    @Size(max = 100, message = "코드 라벨은 100자 이하여야 합니다.")
    private String codeLabel;
    
    @Size(max = 100, message = "한글명은 100자 이하여야 합니다.")
    private String koreanName;
    
    @Size(max = 500, message = "코드 설명은 500자 이하여야 합니다.")
    private String codeDescription;
    
    private Integer sortOrder;
    
    private Boolean isActive;
    
    @Size(max = 1000, message = "추가 데이터는 1000자 이하여야 합니다.")
    private String extraData;
    
    @Size(max = 10, message = "아이콘은 10자 이하여야 합니다.")
    private String icon;
    
    @Size(max = 7, message = "색상 코드는 7자 이하여야 합니다.")
    private String colorCode;
}

