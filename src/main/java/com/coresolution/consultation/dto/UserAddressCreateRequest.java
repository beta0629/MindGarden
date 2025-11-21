package com.coresolution.consultation.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 사용자 주소 생성 요청 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-11-20
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAddressCreateRequest {
    
    @NotBlank(message = "주소 타입은 필수입니다.")
    private String addressType;
    
    private String addressTypeDisplayName;
    
    private Boolean isPrimary;
    
    private String province;
    
    private String city;
    
    private String district;
    
    private String detailAddress;
    
    private String postalCode;
    
    private String reference;
    
    private Double latitude;
    
    private Double longitude;
}

