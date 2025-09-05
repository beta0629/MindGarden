package com.mindgarden.consultation.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 수퍼어드민 계정 생성 요청 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-05
 */
@Data
public class SuperAdminCreateRequest {
    
    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String email;
    
    @NotBlank(message = "사용자명은 필수입니다.")
    @Size(min = 3, max = 50, message = "사용자명은 3-50자 사이여야 합니다.")
    private String username;
    
    @NotBlank(message = "비밀번호는 필수입니다.")
    @Size(min = 8, max = 100, message = "비밀번호는 8-100자 사이여야 합니다.")
    private String password;
    
    @NotBlank(message = "이름은 필수입니다.")
    @Size(max = 100, message = "이름은 100자 이하여야 합니다.")
    private String name;
    
    @Size(max = 100, message = "닉네임은 100자 이하여야 합니다.")
    private String nickname;
    
    @Size(max = 20, message = "전화번호는 20자 이하여야 합니다.")
    private String phone;
    
    @Size(max = 500, message = "메모는 500자 이하여야 합니다.")
    private String memo;
}
