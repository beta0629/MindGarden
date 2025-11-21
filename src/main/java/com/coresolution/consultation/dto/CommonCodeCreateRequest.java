package com.coresolution.consultation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 공통코드 생성 요청 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommonCodeCreateRequest {
    
    @NotBlank(message = "코드 그룹은 필수입니다.")
    @Size(max = 50, message = "코드 그룹은 50자 이하여야 합니다.")
    private String codeGroup;
    
    @NotBlank(message = "코드 값은 필수입니다.")
    @Size(max = 50, message = "코드 값은 50자 이하여야 합니다.")
    private String codeValue;
    
    @NotBlank(message = "코드 라벨은 필수입니다.")
    @Size(max = 100, message = "코드 라벨은 100자 이하여야 합니다.")
    private String codeLabel;
    
    @NotBlank(message = "한글명은 필수입니다. (한국 사용 필수)")
    @Size(max = 100, message = "한글명은 100자 이하여야 합니다.")
    private String koreanName;
    
    @Size(max = 500, message = "코드 설명은 500자 이하여야 합니다.")
    private String codeDescription;
    
    private Integer sortOrder;
    
    private Boolean isActive;
    
    @Size(max = 50, message = "상위 코드 그룹은 50자 이하여야 합니다.")
    private String parentCodeGroup;
    
    @Size(max = 50, message = "상위 코드 값은 50자 이하여야 합니다.")
    private String parentCodeValue;
    
    @Size(max = 1000, message = "추가 데이터는 1000자 이하여야 합니다.")
    private String extraData;
    
    @Size(max = 10, message = "아이콘은 10자 이하여야 합니다.")
    private String icon;
    
    @Size(max = 7, message = "색상 코드는 7자 이하여야 합니다.")
    private String colorCode;
    
    /**
     * 테넌트 ID (테넌트별 코드인 경우)
     * null이면 코어솔루션 코드
     */
    @Size(max = 36, message = "테넌트 ID는 36자 이하여야 합니다.")
    private String tenantId;
}

