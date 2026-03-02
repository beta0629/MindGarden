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
    
    // 표준화 2025-12-08: userId는 이메일 기반으로 자동 생성됨 (프론트엔드에서 전송하지 않음)
    private String userId;
    
    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String email;
    
    // 표준화 2025-12-08: password는 자동 생성됨 (프론트엔드에서 전송하지 않음)
    private String password;
    
    // 표준화 2025-12-08: name은 이메일 기반으로 자동 생성됨 (프론트엔드에서 전송하지 않음)
    private String name;
    
    private String phone;
    
    private String address;

    private String addressDetail;

    private String postalCode;

    /** 주민번호 앞 6자리 (YYMMDD) */
    private String rrnFirst6;

    /** 주민번호 뒤 1자리 (성별·세대 구분) */
    private String rrnLast1;

    private String role;

    private String specialization;

    /** 자격증 — consultants.certification 매핑 */
    private String qualifications;

    /** 경력사항 — consultants.work_history 매핑 */
    private String workHistory;

    private String notes;

    /** 프로필 사진 (base64 data URL, 최대 2MB, 리사이즈·크롭 적용) */
    private String profileImageUrl;

    /**
     * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨
     */
    @Deprecated    private String branchCode;
    
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
            .userId(dto.getUserId())
            .email(dto.getEmail())
            .password(dto.getPassword())
            .name(dto.getName())
            .phone(dto.getPhone())
            .address(dto.getAddress())
            .addressDetail(dto.getAddressDetail())
            .postalCode(dto.getPostalCode())
            .qualifications(dto.getQualifications())
            .workHistory(null)
            .role(dto.getRole())
            .specialization(dto.getSpecialization())
            .notes(dto.getNotes())
            .branchCode(null) // 표준화 2025-12-07: 브랜치 개념 제거됨
            .build();
    }
}

