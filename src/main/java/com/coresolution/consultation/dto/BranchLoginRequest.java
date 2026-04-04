package com.coresolution.consultation.dto;

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
    /**
     * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨
     */
    @Deprecated    private String branchCode;
    
    /**
     * 로그인 식별자(이메일 또는 휴대폰 번호, 필드명은 하위 호환)
     */
    @NotBlank(message = "이메일 또는 휴대폰 번호는 필수입니다")
    @Size(max = 100, message = "식별자는 100자 이하여야 합니다")
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
