package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.SocialSignupRequest;
import com.coresolution.consultation.dto.SocialSignupResponse;

/**
 * 소셜 인증 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public interface SocialAuthService {
    
    /**
     * 소셜 회원가입
     * 
     * @param request 소셜 회원가입 요청
     * @return 회원가입 결과
     */
    SocialSignupResponse createUserFromSocial(SocialSignupRequest request);
}
