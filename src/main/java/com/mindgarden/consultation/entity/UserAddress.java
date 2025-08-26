package com.mindgarden.consultation.entity;

import com.mindgarden.consultation.constant.AddressType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 사용자 주소 통합 엔티티
 * 내담자, 상담사, 관리자 모든 사용자의 주소를 통합 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Entity
@Table(name = "user_addresses", indexes = {
    @Index(name = "idx_user_addresses_user_id", columnList = "user_id"),
    @Index(name = "idx_user_addresses_address_type", columnList = "address_type"),
    @Index(name = "idx_user_addresses_is_primary", columnList = "is_primary"),
    @Index(name = "idx_user_addresses_is_deleted", columnList = "is_deleted")
})
public class UserAddress extends BaseEntity {
    
    @NotNull(message = "사용자 ID는 필수입니다.")
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @NotNull(message = "주소 타입은 필수입니다.")
    @Column(name = "address_type", nullable = false, length = 20)
    private String addressType;
    
    @Column(name = "is_primary", nullable = false)
    private Boolean isPrimary = false;
    
    @NotBlank(message = "시/도는 필수입니다.")
    @Size(max = 50, message = "시/도는 50자 이하여야 합니다.")
    @Column(name = "province", nullable = false, length = 50)
    private String province;
    
    @NotBlank(message = "구/군은 필수입니다.")
    @Size(max = 50, message = "구/군은 50자 이하여야 합니다.")
    @Column(name = "city", nullable = false, length = 50)
    private String city;
    
    @NotBlank(message = "동/읍/면은 필수입니다.")
    @Size(max = 50, message = "동/읍/면은 50자 이하여야 합니다.")
    @Column(name = "district", nullable = false, length = 50)
    private String district;
    
    @Size(max = 200, message = "상세주소는 200자 이하여야 합니다.")
    @Column(name = "detail_address", length = 200)
    private String detailAddress;
    
    @Size(max = 10, message = "우편번호는 10자 이하여야 합니다.")
    @Column(name = "postal_code", length = 10)
    private String postalCode;
    
    @Size(max = 100, message = "참고사항은 100자 이하여야 합니다.")
    @Column(name = "reference", length = 100)
    private String reference;
    
    @Column(name = "latitude")
    private Double latitude;
    
    @Column(name = "longitude")
    private Double longitude;
    
    // 생성자
    public UserAddress() {
        super();
        this.isPrimary = false;
    }
    
    // 비즈니스 메서드
    /**
     * 전체 주소 문자열 생성
     */
    public String getFullAddress() {
        StringBuilder fullAddress = new StringBuilder();
        fullAddress.append(province).append(" ");
        fullAddress.append(city).append(" ");
        fullAddress.append(district);
        
        if (detailAddress != null && !detailAddress.trim().isEmpty()) {
            fullAddress.append(" ").append(detailAddress);
        }
        
        return fullAddress.toString();
    }
    
    /**
     * 우편번호 포함 전체 주소
     */
    public String getFullAddressWithPostalCode() {
        StringBuilder fullAddress = new StringBuilder();
        
        if (postalCode != null && !postalCode.trim().isEmpty()) {
            fullAddress.append("[").append(postalCode).append("] ");
        }
        
        fullAddress.append(getFullAddress());
        return fullAddress.toString();
    }
    
    /**
     * 주소를 기본 주소로 설정
     */
    public void setAsPrimary() {
        this.isPrimary = true;
    }
    
    /**
     * 주소를 기본 주소에서 해제
     */
    public void unsetAsPrimary() {
        this.isPrimary = false;
    }
    
    /**
     * 주소 타입 표시명 반환
     */
    public String getAddressTypeDisplayName() {
        return addressType != null ? AddressType.getDisplayName(addressType) : "알 수 없음";
    }
    
    // Getter & Setter
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public String getAddressType() {
        return addressType;
    }
    
    public void setAddressType(String addressType) {
        this.addressType = addressType;
    }
    
    public Boolean getIsPrimary() {
        return isPrimary;
    }
    
    public void setIsPrimary(Boolean isPrimary) {
        this.isPrimary = isPrimary;
    }
    
    public String getProvince() {
        return province;
    }
    
    public void setProvince(String province) {
        this.province = province;
    }
    
    public String getCity() {
        return city;
    }
    
    public void setCity(String city) {
        this.city = city;
    }
    
    public String getDistrict() {
        return district;
    }
    
    public void setDistrict(String district) {
        this.district = district;
    }
    
    public String getDetailAddress() {
        return detailAddress;
    }
    
    public void setDetailAddress(String detailAddress) {
        this.detailAddress = detailAddress;
    }
    
    public String getPostalCode() {
        return postalCode;
    }
    
    public void setPostalCode(String postalCode) {
        this.postalCode = postalCode;
    }
    
    public String getReference() {
        return reference;
    }
    
    public void setReference(String reference) {
        this.reference = reference;
    }
    
    public Double getLatitude() {
        return latitude;
    }
    
    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }
    
    public Double getLongitude() {
        return longitude;
    }
    
    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }
    
    // toString
    @Override
    public String toString() {
        return "UserAddress{" +
                "id=" + getId() +
                ", userId=" + userId +
                ", addressType=" + addressType +
                ", isPrimary=" + isPrimary +
                ", province='" + province + '\'' +
                ", city='" + city + '\'' +
                ", district='" + district + '\'' +
                ", detailAddress='" + detailAddress + '\'' +
                ", postalCode='" + postalCode + '\'' +
                '}';
    }
}
