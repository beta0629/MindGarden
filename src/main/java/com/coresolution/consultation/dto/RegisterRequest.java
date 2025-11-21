package com.coresolution.consultation.dto;

import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 회원가입 요청 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    
    /**
     * 사용자 이메일
     */
    private String email;
    
    /**
     * 사용자 비밀번호
     */
    private String password;

    /**
     * 비밀번호 확인
     */
    private String confirmPassword;
    
    /**
     * 사용자 이름
     */
    private String name;

    /**
     * 사용자 닉네임
     */
    private String nickname;
    
    /**
     * 사용자 전화번호
     */
    private String phone;

    /**
     * 사용자 성별
     */
    private String gender;

    /**
     * 사용자 생년월일
     */
    private LocalDate birthDate;
    
    /**
     * 사용자 역할 (CLIENT, CONSULTANT, ADMIN)
     */
    private String role;
    
    /**
     * 지점 코드 (지점별 사용자 등록 시)
     */
    private String branchCode;

    /**
     * 이용 약관 동의 여부
     */
    private Boolean agreeTerms;

    /**
     * 개인정보 처리방침 동의 여부
     */
    private Boolean agreePrivacy;
}
