package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 인증 요청 DTO
 * 
 * @deprecated Use {@link LoginRequest} instead. This class is deprecated in favor of a more explicit name.
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Deprecated
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthRequest {
    
    /**
     * 사용자 이메일
     */
    private String email;
    
    /**
     * 사용자 비밀번호
     */
    private String password;
}
