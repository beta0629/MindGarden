package com.coresolution.consultation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 비밀번호 변경 요청 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PasswordChangeRequest {
    
    @NotBlank(message = "현재 비밀번호는 필수입니다.")
    private String currentPassword;
    
    @NotBlank(message = "새 비밀번호는 필수입니다.")
    @Size(min = 8, max = 100, message = "비밀번호는 8자 이상 100자 이하여야 합니다.")
    private String newPassword;
    
    @NotBlank(message = "비밀번호 확인은 필수입니다.")
    private String confirmPassword;

    /**
     * 첫 로그인({@code isPasswordChanged=false}) 비밀번호 변경 시 필수인 휴대폰 OTP.
     * 일반(자발적) 비밀번호 변경에서는 무시한다.
     */
    private String verificationCode;
}