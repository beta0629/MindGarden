package com.mindgarden.consultation.service;

import com.mindgarden.consultation.dto.KakaoUserInfo;
import com.mindgarden.consultation.dto.SocialLoginResponse;

/**
 * 카카오 OAuth2 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public interface KakaoOAuth2Service {
    
    /**
     * 카카오 인증 코드로 사용자 정보 조회
     * 
     * @param code 카카오 인증 코드
     * @return 소셜 로그인 응답
     */
    SocialLoginResponse authenticateWithCode(String code);
    
    /**
     * 카카오 액세스 토큰으로 사용자 정보 조회
     * 
     * @param accessToken 카카오 액세스 토큰
     * @return 카카오 사용자 정보
     */
    KakaoUserInfo getUserInfo(String accessToken);
    
    /**
     * 카카오 사용자 ID로 기존 사용자 확인
     * 
     * @param kakaoUserId 카카오 사용자 ID
     * @return 기존 사용자 ID (없으면 null)
     */
    Long findExistingUserByKakaoId(String kakaoUserId);
    
    /**
     * 카카오 계정으로 신규 사용자 생성
     * 
     * @param kakaoUserInfo 카카오 사용자 정보
     * @return 생성된 사용자 ID
     */
    Long createUserFromKakao(KakaoUserInfo kakaoUserInfo);
}
