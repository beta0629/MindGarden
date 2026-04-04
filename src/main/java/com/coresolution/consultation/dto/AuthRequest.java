package com.coresolution.consultation.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
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
     * 로그인 식별자: 이메일(소문자 정규화) 또는 휴대폰 번호(서버에서 숫자 정규화).
     * JSON 필드명은 하위 호환을 위해 {@code email}을 유지하며, {@code identifier} 별칭을 허용한다.
     */
    @JsonProperty("email")
    @JsonAlias({"identifier"})
    private String email;
    
    /**
     * 사용자 비밀번호
     */
    private String password;
}
