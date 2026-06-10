package com.coresolution.consultation.service;

import com.coresolution.consultation.service.impl.AppleOAuth2ServiceImpl;
import com.coresolution.consultation.service.impl.GoogleOAuth2ServiceImpl;
import com.coresolution.consultation.service.impl.KakaoOAuth2ServiceImpl;
import com.coresolution.consultation.service.impl.NaverOAuth2ServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * {@link OAuth2FactoryService} 자동 등록 회귀 방지.
 *
 * <p>**P0 2026-06-10**: iPhone TestFlight `1.0.7 (16)` 에서 Google OAuth flow + PKCE
 * 교환 + BE `/api/v1/auth/social-login` 호출까지 성공해도 dispatch 단계에서
 * "지원하지 않는 OAuth2 제공자입니다: GOOGLE" 가 반환되던 회귀(Google/Apple 구현체 누락)를
 * 차단한다. 본 테스트는 {@code initializeOAuth2Services()} 가 KAKAO/NAVER/GOOGLE/APPLE
 * 4종을 모두 자동 등록하고, 미지원 provider 는 여전히 거부됨을 검증한다.</p>
 *
 * @author CoreSolution
 * @since 2026-06-10
 */
@DisplayName("OAuth2FactoryService provider 자동 등록 회귀 방지")
class OAuth2FactoryServiceProviderRegistrationTest {

    private OAuth2FactoryService factory;
    private KakaoOAuth2ServiceImpl kakaoStub;
    private NaverOAuth2ServiceImpl naverStub;
    private GoogleOAuth2ServiceImpl googleStub;
    private AppleOAuth2ServiceImpl appleStub;

    @BeforeEach
    void setUp() {
        factory = new OAuth2FactoryService();

        kakaoStub = mock(KakaoOAuth2ServiceImpl.class);
        naverStub = mock(NaverOAuth2ServiceImpl.class);
        googleStub = mock(GoogleOAuth2ServiceImpl.class);
        appleStub = mock(AppleOAuth2ServiceImpl.class);

        lenient().when(kakaoStub.getProviderName()).thenReturn("KAKAO");
        lenient().when(naverStub.getProviderName()).thenReturn("NAVER");
        lenient().when(googleStub.getProviderName()).thenReturn("GOOGLE");
        lenient().when(appleStub.getProviderName()).thenReturn("APPLE");

        ReflectionTestUtils.setField(factory, "kakaoOAuth2Service", kakaoStub);
        ReflectionTestUtils.setField(factory, "naverOAuth2Service", naverStub);
        ReflectionTestUtils.setField(factory, "googleOAuth2Service", googleStub);
        ReflectionTestUtils.setField(factory, "appleOAuth2Service", appleStub);
    }

    @Test
    @DisplayName("initializeOAuth2Services 호출 시 KAKAO/NAVER/GOOGLE/APPLE 4종이 모두 등록된다")
    void initializeOAuth2Services_registersAllSupportedProviders() {
        factory.initializeOAuth2Services();

        assertThat(factory.isProviderSupported("KAKAO")).isTrue();
        assertThat(factory.isProviderSupported("NAVER")).isTrue();
        assertThat(factory.isProviderSupported("GOOGLE")).isTrue();
        assertThat(factory.isProviderSupported("APPLE")).isTrue();
        assertThat(factory.getSupportedProviders())
            .containsExactlyInAnyOrder("KAKAO", "NAVER", "GOOGLE", "APPLE");
    }

    @Test
    @DisplayName("getOAuth2Service(\"GOOGLE\") 는 등록된 Google 구현체를 반환한다 (P0 회귀)")
    void getOAuth2Service_returnsGoogleService_afterInitialize() {
        factory.initializeOAuth2Services();

        OAuth2Service resolved = factory.getOAuth2Service("GOOGLE");

        assertThat(resolved).isSameAs(googleStub);
    }

    @Test
    @DisplayName("getOAuth2Service 는 provider 이름 대소문자를 무시하고 매칭한다")
    void getOAuth2Service_isCaseInsensitive() {
        factory.initializeOAuth2Services();

        assertThat(factory.getOAuth2Service("google")).isSameAs(googleStub);
        assertThat(factory.getOAuth2Service("Apple")).isSameAs(appleStub);
    }

    @Test
    @DisplayName("미지원 provider 는 IllegalArgumentException 으로 거부된다")
    void getOAuth2Service_rejectsUnsupportedProvider() {
        factory.initializeOAuth2Services();

        assertThatThrownBy(() -> factory.getOAuth2Service("FACEBOOK"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("지원하지 않는 OAuth2 제공자")
            .hasMessageContaining("FACEBOOK");
    }

    @Test
    @DisplayName("getServicesStatus 는 GOOGLE/APPLE 지원 여부 플래그를 노출한다")
    void getServicesStatus_exposesGoogleAndAppleFlags() {
        factory.initializeOAuth2Services();

        var status = factory.getServicesStatus();

        assertThat(status.get("totalServices")).isEqualTo(4);
        assertThat(status.get("isKakaoSupported")).isEqualTo(true);
        assertThat(status.get("isNaverSupported")).isEqualTo(true);
        assertThat(status.get("isGoogleSupported")).isEqualTo(true);
        assertThat(status.get("isAppleSupported")).isEqualTo(true);
    }
}
