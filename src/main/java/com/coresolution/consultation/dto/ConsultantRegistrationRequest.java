package com.coresolution.consultation.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 상담사 등록 요청 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-11-20
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultantRegistrationRequest {
    
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
    
    private String address;
    
    private String addressDetail;
    
    private String postalCode;
    
    private String role;
    
    private String specialization;
    
    private String qualifications;
    
    private String notes;
    
    private String branchCode;
    
    /**
     * ConsultantRegistrationDto로부터 변환 (하위 호환성)
     * 
     * <p><b>주의:</b> 이 메서드는 deprecated된 ConsultantRegistrationDto를 사용하므로 
     * 컴파일 경고가 발생할 수 있습니다. 하위 호환성을 위해 제공되며, 
     * 새로운 코드에서는 사용하지 마세요.</p>
     * 
     * @param dto ConsultantRegistrationDto (deprecated)
     * @return ConsultantRegistrationRequest
     * @deprecated 하위 호환성을 위해 제공되며, 새로운 코드에서는 사용하지 마세요.
     */
    @Deprecated
    public static ConsultantRegistrationRequest fromDto(ConsultantRegistrationDto dto) {
        if (dto == null) {
            return null;
        }
        
        return ConsultantRegistrationRequest.builder()
            .username(dto.getUsername())
            .email(dto.getEmail())
            .password(dto.getPassword())
            .name(dto.getName())
            .phone(dto.getPhone())
            .address(dto.getAddress())
            .addressDetail(dto.getAddressDetail())
            .postalCode(dto.getPostalCode())
            .role(dto.getRole())
            .specialization(dto.getSpecialization())
            .qualifications(dto.getQualifications())
            .notes(dto.getNotes())
            .branchCode(dto.getBranchCode())
            .build();
    }
}

