package com.coresolution.consultation.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 로그인 요청 DTO
 * 
 * <p><b>Phase 2.3 명확성 개선:</b> AuthRequest를 더 명확한 이름인 LoginRequest로 변경</p>
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-20
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    
    /**
     * 사용자 이메일
     */
    @NotBlank(message = "이메일은 필수입니다.")
    @Email(message = "유효한 이메일 형식이 아닙니다.")
    private String email;
    
    /**
     * 사용자 비밀번호
     */
    @NotBlank(message = "비밀번호는 필수입니다.")
    private String password;
    
    /**
     * AuthRequest로 변환 (하위 호환성)
     */
    public AuthRequest toAuthRequest() {
        return AuthRequest.builder()
            .email(this.email)
            .password(this.password)
            .build();
    }
}

