package com.coresolution.consultation.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * {@link ProfileImageUrlGuard} 단위 테스트.
 *
 * <p>회귀 가드 (P0 2026-06-08): {@code users.profile_image_url} 컬럼에 base64 dataURI 가 저장돼 응답 폭증되는
 * 케이스 방지. 입력 가드(거부)와 출력 가드(방어선) 양쪽을 검증한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-08
 */
@DisplayName("ProfileImageUrlGuard — base64 dataURI 차단 가드")
class ProfileImageUrlGuardTest {

    @Test
    @DisplayName("[입력] null/빈 문자열은 통과 (no-op)")
    void validateInbound_null_pass() {
        ProfileImageUrlGuard.validateInbound(null);
        ProfileImageUrlGuard.validateInbound("");
        ProfileImageUrlGuard.validateInbound("   ");
    }

    @Test
    @DisplayName("[입력] 정상 URL 은 통과")
    void validateInbound_normalUrl_pass() {
        ProfileImageUrlGuard.validateInbound("https://cdn.example.com/u/123.png");
    }

    @Test
    @DisplayName("[입력] base64 dataURI 는 거부 — 회귀 차단")
    void validateInbound_base64DataUri_rejected() {
        String dataUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAA...";
        assertThatThrownBy(() -> ProfileImageUrlGuard.validateInbound(dataUri))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("파일 업로드 API");
    }

    @Test
    @DisplayName("[입력] 대소문자 혼합 'Data:' 도 거부 (case-insensitive)")
    void validateInbound_caseInsensitive_rejected() {
        assertThatThrownBy(() -> ProfileImageUrlGuard.validateInbound("Data:image/jpeg;base64,xyz"))
            .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("[입력] MAX_URL_LENGTH 초과는 거부")
    void validateInbound_tooLong_rejected() {
        StringBuilder sb = new StringBuilder("https://example.com/");
        while (sb.length() <= ProfileImageUrlGuard.MAX_URL_LENGTH) {
            sb.append('a');
        }
        assertThatThrownBy(() -> ProfileImageUrlGuard.validateInbound(sb.toString()))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("너무 깁니다");
    }

    @Test
    @DisplayName("[출력] null 은 그대로 null")
    void sanitizeOutbound_null_pass() {
        assertThat(ProfileImageUrlGuard.sanitizeOutbound(null)).isNull();
    }

    @Test
    @DisplayName("[출력] 정상 URL 은 그대로 반환")
    void sanitizeOutbound_normalUrl_passThrough() {
        String url = "https://cdn.example.com/u/123.png";
        assertThat(ProfileImageUrlGuard.sanitizeOutbound(url)).isEqualTo(url);
    }

    @Test
    @DisplayName("[출력] base64 dataURI 가 DB 에 저장돼 있으면 응답에서 null 로 치환")
    void sanitizeOutbound_base64InDb_replacedWithNull() {
        StringBuilder sb = new StringBuilder("data:image/png;base64,");
        for (int i = 0; i < ProfileImageUrlGuard.OUTBOUND_WARN_THRESHOLD; i++) {
            sb.append('A');
        }
        assertThat(ProfileImageUrlGuard.sanitizeOutbound(sb.toString())).isNull();
    }

    @Test
    @DisplayName("[출력] OUTBOUND_WARN_THRESHOLD 초과 일반 문자열도 null 치환")
    void sanitizeOutbound_oversize_replacedWithNull() {
        StringBuilder sb = new StringBuilder("https://example.com/");
        while (sb.length() <= ProfileImageUrlGuard.OUTBOUND_WARN_THRESHOLD) {
            sb.append('x');
        }
        assertThat(ProfileImageUrlGuard.sanitizeOutbound(sb.toString())).isNull();
    }
}
