package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.OAuthExistingUserResolution;
import com.coresolution.consultation.dto.SocialLoginResponse;
import com.coresolution.consultation.dto.SocialUserInfo;
import com.coresolution.consultation.entity.auth.OAuthProvider;

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
     * 카카오·네이버 등 공통: 테넌트 내 기존 사용자 매칭(연동/콜백/SDK 경로 동일 분기).
     * 매칭 순서: (1) tenantId+provider+providerUserId (2) SNS 전화(한국 패턴) (3) tenantId+정규화 이메일.
     * (2)에서 동일 전화에 서로 다른 역할(관리자·상담사·스태프·내담자)이 2종 이상이면
     * {@link OAuthExistingUserResolution#isRequiresPhoneAccountSelection()} 이 true이며 (3)으로 폴백하지 않는다.
     * (3)에서 동일 정규화 이메일에 동일 기준으로 역할이 2종 이상이면 동일 플래그·후보 목록으로 계정 선택이 필요하다.
     * 소셜 계정 행을 생성하지 않는다 — 매칭 후 {@link #linkSocialAccountToUser} 등에서 연동한다.
     *
     * @param socialUserInfo 정규화된 {@link SocialUserInfo}
     * @param oauthAccountLinkMode true면 마이페이지 연동 전용: (1)만 수행하고 전화·이메일 프로필 매칭은 하지 않는다.
     * @return 매칭 결과
     */
    OAuthExistingUserResolution resolveExistingUserForSocialLinkOrLogin(SocialUserInfo socialUserInfo,
            boolean oauthAccountLinkMode);

    /**
     * 로그인·일반 콜백용: {@link #resolveExistingUserForSocialLinkOrLogin(SocialUserInfo, boolean)} 의
     * {@code oauthAccountLinkMode=false} 호출.
     *
     * @param socialUserInfo 정규화된 {@link SocialUserInfo}
     * @return 매칭 결과
     */
    default OAuthExistingUserResolution resolveExistingUserForSocialLinkOrLogin(SocialUserInfo socialUserInfo) {
        return resolveExistingUserForSocialLinkOrLogin(socialUserInfo, false);
    }
    
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

    /**
     * OAuth 콜백 후 휴대폰 OTP 매칭을 강제할지 여부.
     *
     * <p>provider-agnostic 휴대폰 매칭 SSOT 정책 (2026-06-09):
     * <ul>
     *   <li>{@code true} → OAuth 콜백 후 클라이언트가
     *       {@code /api/v1/auth/oauth/phone/{send,verify}} 흐름으로 진입해야 한다 (신규 가입자 + 휴대폰 변경 시).</li>
     *   <li>{@code false} → 기존 흐름(이메일/sub 매칭) 유지.</li>
     * </ul>
     * 본 hook 의 호출 측 통합(콜백 분기 삽입) 은 후속 Phase 3C 에서 수행한다.
     * 본 PR (Phase 3A) 는 인터페이스 노출만 담당한다.</p>
     *
     * @param oauthProvider 현재 처리 중인 provider
     * @param socialUserInfo 콜백 결과 사용자 정보
     * @return OTP 강제 여부
     */
    default boolean requiresPhoneOtp(OAuthProvider oauthProvider, SocialUserInfo socialUserInfo) {
        return false;
    }
}
