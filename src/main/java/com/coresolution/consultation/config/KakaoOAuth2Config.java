package com.coresolution.consultation.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;

/**
 * 카카오 OAuth2 설정 클래스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Configuration
@ConditionalOnProperty(name = "development.security.oauth2.enabled", havingValue = "false")
public class KakaoOAuth2Config {

    @Value("${spring.security.oauth2.client.registration.kakao.client-id:dummy}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.kakao.client-secret:dummy}")
    private String clientSecret;

    @Value("${spring.security.oauth2.client.registration.kakao.redirect-uri:${OAUTH2_BASE_URL:https://m-garden.co.kr}/login/oauth2/code/kakao}")
    private String redirectUri;

    @Value("${spring.security.oauth2.client.registration.kakao.scope:profile_nickname,profile_image,account_email}")
    private String scope;

    @Bean
    public ClientRegistrationRepository clientRegistrationRepository() {
        return new InMemoryClientRegistrationRepository(kakaoClientRegistration());
    }

    private ClientRegistration kakaoClientRegistration() {
        return ClientRegistration.withRegistrationId("kakao")
                .clientId(clientId)
                .clientSecret(clientSecret)
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri(redirectUri)
                .scope(scope.split(","))
                .authorizationUri("https://kauth.kakao.com/oauth/authorize")
                .tokenUri("https://kauth.kakao.com/oauth/token")
                .userInfoUri("https://kapi.kakao.com/v2/user/me")
                .userNameAttributeName("id")
                .clientName("Kakao")
                .build();
    }
}
