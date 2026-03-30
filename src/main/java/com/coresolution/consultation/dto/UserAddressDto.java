package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 사용자 주소 DTO
 * 
 * @deprecated Use UserAddressResponse, UserAddressCreateRequest, UserAddressUpdateRequest instead.
 * This class will be removed in version 2.0.0
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Deprecated
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAddressDto {
    
    private Long id;
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
    private String fullAddress;
    private String fullAddressWithPostalCode;
}
