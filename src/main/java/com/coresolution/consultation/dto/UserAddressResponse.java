package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 사용자 주소 응답 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-11-20
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAddressResponse {
    
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
    
    /**
     * UserAddressDto로부터 변환 (하위 호환성)
     * 
     * <p><b>주의:</b> 이 메서드는 deprecated된 UserAddressDto를 사용하므로 
     * 컴파일 경고가 발생할 수 있습니다. 하위 호환성을 위해 제공되며, 
     * 새로운 코드에서는 사용하지 마세요.</p>
     * 
     * @param dto UserAddressDto (deprecated)
     * @return UserAddressResponse
     * @deprecated 하위 호환성을 위해 제공되며, 새로운 코드에서는 사용하지 마세요.
     */
    @Deprecated
    public static UserAddressResponse fromDto(UserAddressDto dto) {
        if (dto == null) {
            return null;
        }
        
        return UserAddressResponse.builder()
            .id(dto.getId())
            .addressType(dto.getAddressType())
            .addressTypeDisplayName(dto.getAddressTypeDisplayName())
            .isPrimary(dto.getIsPrimary())
            .province(dto.getProvince())
            .city(dto.getCity())
            .district(dto.getDistrict())
            .detailAddress(dto.getDetailAddress())
            .postalCode(dto.getPostalCode())
            .reference(dto.getReference())
            .latitude(dto.getLatitude())
            .longitude(dto.getLongitude())
            .fullAddress(dto.getFullAddress())
            .fullAddressWithPostalCode(dto.getFullAddressWithPostalCode())
            .build();
    }
}

