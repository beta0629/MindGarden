package com.mindgarden.consultation.service;

import com.mindgarden.consultation.dto.NaverUserInfo;
import com.mindgarden.consultation.dto.SocialLoginResponse;

/**
 * 네이버 OAuth2 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public interface NaverOAuth2Service {
    
    /**
     * 네이버 인증 코드로 로그인/회원가입
     * 
     * @param code 네이버 인증 코드
     * @return 소셜 로그인 응답
     */
    SocialLoginResponse authenticateWithCode(String code);
    
    /**
     * 네이버 액세스 토큰으로 사용자 정보 조회
     * 
     * @param accessToken 네이버 액세스 토큰
     * @return 네이버 사용자 정보
     */
    NaverUserInfo getUserInfo(String accessToken);
    
    /**
     * 네이버 사용자 ID로 기존 사용자 확인
     * 
     * @param naverUserId 네이버 사용자 ID
     * @return 기존 사용자 ID (없으면 null)
     */
    Long findExistingUserByNaverId(String naverUserId);
    
    /**
     * 네이버 계정으로 신규 사용자 생성
     * 
     * @param naverUserInfo 네이버 사용자 정보
     * @return 생성된 사용자 ID
     */
    Long createUserFromNaver(NaverUserInfo naverUserInfo);
}
