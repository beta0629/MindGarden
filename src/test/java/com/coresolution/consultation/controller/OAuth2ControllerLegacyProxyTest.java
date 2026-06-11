package com.coresolution.consultation.controller;

import java.lang.reflect.Method;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * {@link OAuth2Controller} 의 OAuth 4종 콜백 dual-mount 매핑 회귀 방어 단위 테스트 — 옵션 B′
 * (2026-06-11, nginx apex {@code /api/auth/} legacy proxy 보완 정합).
 *
 * <p>OAuth2Controller 는 클래스 레벨에서 {@code @RequestMapping({"/api/v1/auth", "/api/auth"})}
 * 로 두 base path 를 동시 노출한다. 콜백 핸들러는 path 안에서 {@code /{provider}/callback} 로
 * 정의되므로 결과적으로 4종 콜백 모두 두 base path 양쪽에서 받을 수 있어야 한다:</p>
 * <ul>
 *   <li>{@code POST/GET /api/auth/kakao/callback} (legacy) + {@code /api/v1/auth/kakao/callback}</li>
 *   <li>{@code GET /api/auth/naver/callback} (legacy) + {@code /api/v1/auth/naver/callback}</li>
 *   <li>{@code GET /api/v1/auth/google/callback} + {@code /api/auth/google/callback}</li>
 *   <li>{@code GET/POST /api/v1/auth/apple/callback} + {@code /api/auth/apple/callback}</li>
 * </ul>
 *
 * <p>본 테스트는 클래스/메서드 매핑 메타데이터를 reflection 으로 검증해 dual-mount 가 깨지지 않음을
 * 단위 수준에서 보장한다. nginx apex {@code location ^~ /api/auth/} proxy 와 정합되어
 * Kakao/Naver legacy 콜백이 컨트롤러까지 도달 가능함을 보장하는 회귀 방어 게이트다.</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@DisplayName("OAuth2Controller — dual-mount /api/auth + /api/v1/auth (nginx legacy proxy 정합 회귀 방어)")
class OAuth2ControllerLegacyProxyTest {

    @Test
    @DisplayName("클래스 레벨 @RequestMapping 이 /api/v1/auth 와 /api/auth 양쪽을 노출 (dual-mount 유지)")
    void classLevelRequestMappingExposesBothBasePaths() {
        RequestMapping mapping = OAuth2Controller.class.getAnnotation(RequestMapping.class);
        assertThat(mapping)
                .as("OAuth2Controller 에 @RequestMapping 이 있어야 한다")
                .isNotNull();
        assertThat(mapping.value())
                .as("dual-mount: /api/v1/auth + /api/auth 양쪽 노출 (옵션 B′ — legacy path 단일화 금지)")
                .containsExactlyInAnyOrder("/api/v1/auth", "/api/auth");
    }

    @Test
    @DisplayName("Kakao 콜백: @GetMapping(\"/kakao/callback\") → dual-mount 시 /api/auth/kakao/callback 도 매칭")
    void kakaoCallbackMappedToBothBasePaths() throws Exception {
        Method kakaoCallback = OAuth2Controller.class.getMethod("kakaoCallback",
                String.class, String.class, String.class, String.class,
                jakarta.servlet.http.HttpServletRequest.class,
                jakarta.servlet.http.HttpSession.class);
        GetMapping getMapping = kakaoCallback.getAnnotation(GetMapping.class);
        assertThat(getMapping).as("kakaoCallback 에 @GetMapping 이 있어야 한다").isNotNull();
        assertThat(getMapping.value()).contains("/kakao/callback");
    }

    @Test
    @DisplayName("Naver 콜백: @GetMapping(\"/naver/callback\") → dual-mount 시 /api/auth/naver/callback 도 매칭")
    void naverCallbackMappedToBothBasePaths() throws Exception {
        Method naverCallback = OAuth2Controller.class.getMethod("naverCallback",
                String.class, String.class, String.class, String.class,
                jakarta.servlet.http.HttpServletRequest.class,
                jakarta.servlet.http.HttpSession.class);
        GetMapping getMapping = naverCallback.getAnnotation(GetMapping.class);
        assertThat(getMapping).as("naverCallback 에 @GetMapping 이 있어야 한다").isNotNull();
        assertThat(getMapping.value()).contains("/naver/callback");
    }

    @Test
    @DisplayName("Google 콜백: @GetMapping(\"/google/callback\") → dual-mount 양쪽에서 호출 가능")
    void googleCallbackMappedToBothBasePaths() throws Exception {
        Method googleCallback = OAuth2Controller.class.getMethod("googleCallback",
                String.class, String.class, String.class, String.class,
                jakarta.servlet.http.HttpServletRequest.class,
                jakarta.servlet.http.HttpSession.class);
        GetMapping getMapping = googleCallback.getAnnotation(GetMapping.class);
        assertThat(getMapping).as("googleCallback 에 @GetMapping 이 있어야 한다").isNotNull();
        assertThat(getMapping.value()).contains("/google/callback");
    }

    @Test
    @DisplayName("Apple 콜백: GET + POST(form-urlencoded) 모두 dual-mount 양쪽에서 매칭 가능")
    void appleCallbackGetAndPostBothMappedToBothBasePaths() throws Exception {
        Method appleCallbackGet = OAuth2Controller.class.getMethod("appleCallbackGet",
                String.class, String.class, String.class, String.class, String.class,
                String.class, String.class,
                jakarta.servlet.http.HttpServletRequest.class,
                jakarta.servlet.http.HttpSession.class);
        GetMapping getMapping = appleCallbackGet.getAnnotation(GetMapping.class);
        assertThat(getMapping).as("appleCallbackGet 에 @GetMapping 이 있어야 한다").isNotNull();
        assertThat(getMapping.value()).contains("/apple/callback");

        Method appleCallback = OAuth2Controller.class.getMethod("appleCallback",
                String.class, String.class, String.class, String.class, String.class,
                String.class,
                jakarta.servlet.http.HttpServletRequest.class,
                jakarta.servlet.http.HttpSession.class);
        PostMapping postMapping = appleCallback.getAnnotation(PostMapping.class);
        assertThat(postMapping).as("appleCallback 에 @PostMapping 이 있어야 한다").isNotNull();
        assertThat(postMapping.value()).contains("/apple/callback");
        assertThat(postMapping.consumes())
                .as("form-urlencoded consumes 유지 (Apple SIWA form_post 흐름 정합)")
                .contains(MediaType.APPLICATION_FORM_URLENCODED_VALUE);
    }
}
