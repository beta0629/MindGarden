package com.coresolution.consultation.service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import com.coresolution.consultation.dto.SocialLoginResponse;
import com.coresolution.consultation.service.impl.KakaoOAuth2ServiceImpl;
import com.coresolution.consultation.service.impl.NaverOAuth2ServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * OAuth2 팩토리 서비스
 * 여러 소셜 플랫폼을 통합 관리하고 적절한 서비스를 선택하여 처리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OAuth2FactoryService {

    private final Map<String, OAuth2Service> oauth2Services = new ConcurrentHashMap<>();
    
    @Autowired
    private KakaoOAuth2ServiceImpl kakaoOAuth2Service;
    
    @Autowired
    private NaverOAuth2ServiceImpl naverOAuth2Service;

    /**
     * 애플리케이션 시작 시 OAuth2 서비스 자동 등록
     */
    @PostConstruct
    public void initializeOAuth2Services() {
        // 카카오 OAuth2 서비스 등록
        if (kakaoOAuth2Service != null) {
            registerOAuth2Service(kakaoOAuth2Service);
            log.info("카카오 OAuth2 서비스 자동 등록 완료");
        }
        
        // 네이버 OAuth2 서비스 등록
        if (naverOAuth2Service != null) {
            registerOAuth2Service(naverOAuth2Service);
            log.info("네이버 OAuth2 서비스 자동 등록 완료");
        }
        
        log.info("등록된 OAuth2 서비스: {}", getSupportedProviders());
    }

    /**
     * OAuth2 서비스 등록
     * 
     * @param oauth2Service OAuth2 서비스 인스턴스
     */
    public void registerOAuth2Service(OAuth2Service oauth2Service) {
        String providerName = oauth2Service.getProviderName();
        oauth2Services.put(providerName.toUpperCase(), oauth2Service);
        log.info("OAuth2 서비스 등록: {}", providerName);
    }

    /**
     * 특정 제공자의 OAuth2 서비스 조회
     * 
     * @param provider 제공자 이름 (KAKAO, NAVER, FACEBOOK 등)
     * @return OAuth2 서비스 인스턴스
     */
    public OAuth2Service getOAuth2Service(String provider) {
        OAuth2Service service = oauth2Services.get(provider.toUpperCase());
        if (service == null) {
            throw new IllegalArgumentException("지원하지 않는 OAuth2 제공자입니다: " + provider);
        }
        return service;
    }

    /**
     * 지원하는 OAuth2 제공자 목록 조회
     * 
     * @return 지원하는 제공자 목록
     */
    public String[] getSupportedProviders() {
        return oauth2Services.keySet().toArray(new String[0]);
    }

    /**
     * 특정 제공자 지원 여부 확인
     * 
     * @param provider 제공자 이름
     * @return 지원 여부
     */
    public boolean isProviderSupported(String provider) {
        return oauth2Services.containsKey(provider.toUpperCase());
    }

    /**
     * 통합 OAuth2 인증 처리
     * 
     * @param provider 제공자 이름
     * @param code 인증 코드
     * @return 소셜 로그인 응답
     */
    public SocialLoginResponse authenticateWithProvider(String provider, String code) {
        try {
            OAuth2Service service = getOAuth2Service(provider);
            log.info("{} OAuth2 인증 시작", provider);
            
            SocialLoginResponse response = service.authenticateWithCode(code);
            
            if (response.isSuccess()) {
                log.info("{} OAuth2 인증 성공", provider);
            } else {
                log.error("{} OAuth2 인증 실패: {}", provider, response.getMessage());
            }
            
            return response;
            
        } catch (Exception e) {
            log.error("{} OAuth2 인증 처리 중 오류 발생", provider, e);
            return SocialLoginResponse.builder()
                .success(false)
                .message(provider + " 로그인 처리 중 오류가 발생했습니다: " + e.getMessage())
                .build();
        }
    }

    /**
     * 등록된 OAuth2 서비스들의 상태 정보 조회
     * 
     * @return 서비스 상태 정보
     */
    public Map<String, Object> getServicesStatus() {
        Map<String, Object> status = new ConcurrentHashMap<>();
        status.put("registeredServices", getSupportedProviders());
        status.put("totalServices", oauth2Services.size());
        status.put("isKakaoSupported", isProviderSupported("KAKAO"));
        status.put("isNaverSupported", isProviderSupported("NAVER"));
        return status;
    }
}
