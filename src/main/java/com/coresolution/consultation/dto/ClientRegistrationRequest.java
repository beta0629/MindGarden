package com.coresolution.consultation.dto;

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
    
    @NotBlank(message = "사용자명은 필수입니다.")
    private String username;
    
    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String email;
    
    @NotBlank(message = "비밀번호는 필수입니다.")
    private String password;
    
    @NotBlank(message = "이름은 필수입니다.")
    private String name;
    
    private String phone;
    
    private Integer age;
    
    private String address;
    
    private String addressDetail;
    
    private String postalCode;
    
    private String consultationPurpose;
    
    private String consultationHistory;
    
    private String emergencyContact;
    
    private String emergencyPhone;
    
    private String notes;
    
    private String registeredBy;
    
    private String branchCode;
    
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
            .username(dto.getUsername())
            .email(dto.getEmail())
            .password(dto.getPassword())
            .name(dto.getName())
            .phone(dto.getPhone())
            .age(dto.getAge())
            .address(dto.getAddress())
            .addressDetail(dto.getAddressDetail())
            .postalCode(dto.getPostalCode())
            .consultationPurpose(dto.getConsultationPurpose())
            .consultationHistory(dto.getConsultationHistory())
            .emergencyContact(dto.getEmergencyContact())
            .emergencyPhone(dto.getEmergencyPhone())
            .notes(dto.getNotes())
            .registeredBy(dto.getRegisteredBy())
            .branchCode(dto.getBranchCode())
            .build();
    }
}

