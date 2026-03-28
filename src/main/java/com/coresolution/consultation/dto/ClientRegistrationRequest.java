package com.coresolution.consultation.dto;

import com.coresolution.consultation.validation.VehiclePlateOptional;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 내담자 등록 요청 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-11-20
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientRegistrationRequest {
    
    // 표준화 2025-12-08: userId는 이메일 기반으로 자동 생성됨 (프론트엔드에서 전송하지 않음)
    private String userId;
    
    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String email;
    
    // 비밀번호: 사용자가 입력하면 사용, 없으면 임시 비밀번호 자동 생성
    private String password;
    
    // 표준화 2025-12-08: name은 이메일 기반으로 자동 생성됨 (프론트엔드에서 전송하지 않음)
    private String name;
    
    // 표준화 2025-12-08: phone은 선택사항 (프론트엔드에서 전송하지 않음)
    private String phone;
    
    private Integer age;

    /** 주민번호 앞 6자리 (YYMMDD) */
    private String rrnFirst6;

    /** 주민번호 뒤 1자리 (성별·세대 구분) */
    private String rrnLast1;

    private String address;

    private String addressDetail;

    private String postalCode;

    /** 차량번호 (선택, 최대 32자 — 저장 시 정규화는 서비스에서 수행) */
    @VehiclePlateOptional
    private String vehiclePlate;
    
    private String consultationPurpose;
    
    private String consultationHistory;
    
    private String emergencyContact;
    
    private String emergencyPhone;
    
    private String notes;

    private String grade;

    /** 상태 (ACTIVE, INACTIVE, PENDING 등). 수정/등록 시 User.isActive 매핑에 사용 */
    private String status;
    
    private String registeredBy;
    
    /** 프로필 사진 (base64 data URL, 최대 2MB, 리사이즈·크롭 적용) */
    private String profileImageUrl;

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    /**
     * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨
     */
    @Deprecated    private String branchCode;
    
    /**
     * ClientRegistrationDto로부터 변환 (하위 호환성)
     * 
     * <p><b>주의:</b> 이 메서드는 deprecated된 ClientRegistrationDto를 사용하므로 
     * 컴파일 경고가 발생할 수 있습니다. 하위 호환성을 위해 제공되며, 
     * 새로운 코드에서는 사용하지 마세요.</p>
     * 
     * @param dto ClientRegistrationDto (deprecated)
     * @return ClientRegistrationRequest
     * @deprecated 하위 호환성을 위해 제공되며, 새로운 코드에서는 사용하지 마세요.
     */
    @Deprecated
    public static ClientRegistrationRequest fromDto(ClientRegistrationDto dto) {
        if (dto == null) {
            return null;
        }
        
        return ClientRegistrationRequest.builder()
            .userId(dto.getUserId())
            .email(dto.getEmail())
            .password(dto.getPassword())
            .name(dto.getName())
            .phone(dto.getPhone())
            .age(dto.getAge())
            .address(dto.getAddress())
            .addressDetail(dto.getAddressDetail())
            .postalCode(dto.getPostalCode())
            .vehiclePlate(null)
            .consultationPurpose(dto.getConsultationPurpose())
            .consultationHistory(dto.getConsultationHistory())
            .emergencyContact(dto.getEmergencyContact())
            .emergencyPhone(dto.getEmergencyPhone())
            .notes(dto.getNotes())
            .registeredBy(dto.getRegisteredBy())
            .branchCode(null) // 표준화 2025-12-07: 브랜치 개념 제거됨
            .build();
    }
}

