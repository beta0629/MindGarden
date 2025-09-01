package com.mindgarden.consultation.service;

import com.mindgarden.consultation.dto.SocialLoginResponse;
import com.mindgarden.consultation.dto.SocialUserInfo;

/**
 * 통합 OAuth2 서비스 인터페이스
 * 모든 소셜 플랫폼이 공통으로 구현해야 하는 메서드 정의
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public interface OAuth2Service {
    
    /**
     * OAuth2 인증 코드로 로그인/회원가입
     * 
     * @param code OAuth2 인증 코드
     * @return 소셜 로그인 응답
     */
    SocialLoginResponse authenticateWithCode(String code);
    
    /**
     * 액세스 토큰으로 사용자 정보 조회
     * 
     * @param accessToken 액세스 토큰
     * @return 소셜 사용자 정보
     */
    SocialUserInfo getUserInfo(String accessToken);
    
    /**
     * 소셜 사용자 ID로 기존 사용자 확인
     * 
     * @param providerUserId 소셜 제공자 사용자 ID
     * @return 기존 사용자 ID (없으면 null)
     */
    Long findExistingUserByProviderId(String providerUserId);
    
    /**
     * 소셜 계정으로 신규 사용자 생성
     * 
     * @param socialUserInfo 소셜 사용자 정보
     * @return 생성된 사용자 ID
     */
    Long createUserFromSocial(SocialUserInfo socialUserInfo);
    
    /**
     * 소셜 제공자 이름 반환
     * 
     * @return 소셜 제공자 이름 (KAKAO, NAVER, FACEBOOK 등)
     */
    String getProviderName();
    
    /**
     * 인증 코드로 액세스 토큰 획득
     * 
     * @param code 인증 코드
     * @return 액세스 토큰
     */
    String getAccessToken(String code);
    
    /**
     * 기존 사용자에게 소셜 계정 연동
     * 
     * @param userId 기존 사용자 ID
     * @param socialUserInfo 소셜 사용자 정보
     */
    void linkSocialAccountToUser(Long userId, SocialUserInfo socialUserInfo);
}
