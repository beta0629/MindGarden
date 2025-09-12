package com.mindgarden.consultation.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 지점별 로그인 요청 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-12
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BranchLoginRequest {
    
    /**
     * 지점 코드 (본사 로그인시에는 "HEADQUARTERS" 또는 빈 값)
     */
    @Pattern(regexp = "^[A-Z0-9]*$", message = "지점 코드는 영대문자와 숫자만 사용 가능합니다")
    @Size(max = 10, message = "지점 코드는 10자 이하여야 합니다")
    private String branchCode;
    
    /**
     * 이메일
     */
    @NotBlank(message = "이메일은 필수입니다")
    @Email(message = "올바른 이메일 형식이 아닙니다")
    @Size(max = 100, message = "이메일은 100자 이하여야 합니다")
    private String email;
    
    /**
     * 비밀번호
     */
    @NotBlank(message = "비밀번호는 필수입니다")
    @Size(min = 8, max = 100, message = "비밀번호는 8자 이상 100자 이하여야 합니다")
    private String password;
    
    /**
     * 로그인 유형 (HEADQUARTERS, BRANCH)
     */
    private LoginType loginType;
    
    /**
     * 로그인 유형 열거형
     */
    public enum LoginType {
        HEADQUARTERS("본사"),
        BRANCH("지점");
        
        private final String description;
        
        LoginType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
}
