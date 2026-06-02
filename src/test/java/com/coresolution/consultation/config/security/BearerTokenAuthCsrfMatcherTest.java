package com.coresolution.consultation.config.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockHttpServletRequest;

/**
 * {@link BearerTokenAuthCsrfMatcher} 단위 테스트.
 *
 * <p>운영 CSRF 회귀 fix 회귀 방지를 위한 매칭 조건 검증.
 * Bearer 헤더가 있는 stateless 인증 요청만 CSRF 면제로 분류한다.
 *
 * @author MindGarden
 * @since 2026-06-02
 */
@DisplayName("BearerTokenAuthCsrfMatcher — Bearer 인증 요청 CSRF 면제 판단")
class BearerTokenAuthCsrfMatcherTest {

    private final BearerTokenAuthCsrfMatcher matcher = new BearerTokenAuthCsrfMatcher();

    @Test
    @DisplayName("표준 Bearer 헤더 → matches(true)")
    void matchesStandardBearer() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer eyJhbGciOiJIUzI1NiJ9.payload.sig");

        assertThat(matcher.matches(request)).isTrue();
    }

    @Test
    @DisplayName("소문자 bearer 도 RFC 6750 §2.1 에 따라 matches(true)")
    void matchesLowercaseBearer() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(HttpHeaders.AUTHORIZATION, "bearer mobile-token");

        assertThat(matcher.matches(request)).isTrue();
    }

    @Test
    @DisplayName("대문자 BEARER 도 matches(true)")
    void matchesUppercaseBearer() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(HttpHeaders.AUTHORIZATION, "BEARER abc.def.ghi");

        assertThat(matcher.matches(request)).isTrue();
    }

    @Test
    @DisplayName("선행 공백이 있는 Bearer 헤더도 matches(true)")
    void matchesBearerWithLeadingWhitespace() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(HttpHeaders.AUTHORIZATION, "  Bearer expo-mobile-jwt");

        assertThat(matcher.matches(request)).isTrue();
    }

    @Test
    @DisplayName("Authorization 헤더 없음 → matches(false)")
    void doesNotMatchWhenHeaderMissing() {
        MockHttpServletRequest request = new MockHttpServletRequest();

        assertThat(matcher.matches(request)).isFalse();
    }

    @Test
    @DisplayName("빈 Authorization 헤더 → matches(false)")
    void doesNotMatchWhenHeaderEmpty() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(HttpHeaders.AUTHORIZATION, "");

        assertThat(matcher.matches(request)).isFalse();
    }

    @Test
    @DisplayName("Basic 인증 스킴 → matches(false) (세션 흐름 보호 유지)")
    void doesNotMatchBasicScheme() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(HttpHeaders.AUTHORIZATION, "Basic dXNlcjpwYXNz");

        assertThat(matcher.matches(request)).isFalse();
    }

    @Test
    @DisplayName("scheme 만 있고 토큰 누락 → matches(false)")
    void doesNotMatchWhenTokenMissing() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer ");

        assertThat(matcher.matches(request)).isFalse();
    }

    @Test
    @DisplayName("Bearer 뒤에 공백 없이 토큰 결합 → matches(false)")
    void doesNotMatchWhenSchemeAndTokenJoined() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(HttpHeaders.AUTHORIZATION, "BearerXYZ");

        assertThat(matcher.matches(request)).isFalse();
    }

    @Test
    @DisplayName("BearerToken 처럼 scheme 가 다른 단어 → matches(false)")
    void doesNotMatchSchemeLookalike() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(HttpHeaders.AUTHORIZATION, "BearerTokenXYZ abcd");

        assertThat(matcher.matches(request)).isFalse();
    }

    @Test
    @DisplayName("Bearer 와 토큰 사이가 탭 문자 → matches(true) (RFC 7235 LWS 허용)")
    void matchesBearerWithTabSeparator() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer\teyJ");

        assertThat(matcher.matches(request)).isTrue();
    }

    @Test
    @DisplayName("null 요청 방어 → matches(false)")
    void doesNotMatchNullRequest() {
        assertThat(matcher.matches(null)).isFalse();
    }
}
