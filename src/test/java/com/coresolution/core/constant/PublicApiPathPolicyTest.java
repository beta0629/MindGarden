package com.coresolution.core.constant;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

/**
 * {@link PublicApiPathPolicy} 경로 분류·공통코드 공개 그룹 판정 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-10-12
 */
@DisplayName("PublicApiPathPolicy")
class PublicApiPathPolicyTest {

    private static final String BASE = "/api/v1/common-codes";
    private static final String LEGACY_BASE = "/api/common-codes";

    private static MockHttpServletRequest get(String uri, String... params) {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", uri);
        request.setRequestURI(uri);
        for (int i = 0; i + 1 < params.length; i += 2) {
            request.addParameter(params[i], params[i + 1]);
        }
        return request;
    }

    @Test
    @DisplayName("공개 경로: API 공개 목록과 비-API 경로는 true, 그 외 API 는 false")
    void isPublicApi() {
        assertThat(PublicApiPathPolicy.isPublicApi("/api/v1/auth/login")).isTrue();
        assertThat(PublicApiPathPolicy.isPublicApi("/login")).isTrue();
        assertThat(PublicApiPathPolicy.isPublicApi("/api/v1/admin/users")).isFalse();
    }

    @Test
    @DisplayName("STRICT 호스트 경로: 카탈로그·파일·공통코드·css-themes·업종 카테고리만")
    void isStrictHostPath() {
        assertThat(PublicApiPathPolicy.isStrictHostPath("/api/v1/shop/catalog/SKU1?x=1")).isTrue();
        assertThat(PublicApiPathPolicy.isStrictHostPath("/api/v1/files/shop-catalog-thumbnails/a.png")).isTrue();
        assertThat(PublicApiPathPolicy.isStrictHostPath(BASE)).isTrue();
        assertThat(PublicApiPathPolicy.isStrictHostPath(LEGACY_BASE + "/groups/X")).isTrue();
        assertThat(PublicApiPathPolicy.isStrictHostPath("/api/v1/auth/login")).isFalse();
        assertThat(PublicApiPathPolicy.isStrictHostPath("/api/v1/accounts/integration/status")).isFalse();
    }

    @Test
    @DisplayName("공통코드 공개 조회: 화이트리스트 그룹만 허용")
    void publicCommonCodeRead_whitelistedGroups() {
        assertThat(PublicApiPathPolicy.isPublicCommonCodeRead(get(BASE, "codeGroup", "RISK_LEVEL"))).isTrue();
        assertThat(PublicApiPathPolicy.isPublicCommonCodeRead(get(BASE + "/groups/ONBOARDING_STATUS"))).isTrue();
        assertThat(PublicApiPathPolicy.isPublicCommonCodeRead(get(LEGACY_BASE + "/by-group/RISK_LEVEL"))).isTrue();
        assertThat(PublicApiPathPolicy.isPublicCommonCodeRead(get(BASE + "/group/RISK_LEVEL/active"))).isTrue();
        assertThat(PublicApiPathPolicy.isPublicCommonCodeRead(
                get(BASE + "/groups", "groups", "RISK_LEVEL,ONBOARDING_STATUS"))).isTrue();
    }

    @Test
    @DisplayName("공통코드 공개 조회: 그 외 그룹·그룹 미지정·ID 조회·섞인 목록·우회 문자는 거부")
    void publicCommonCodeRead_rejectsOthers() {
        assertThat(PublicApiPathPolicy.isPublicCommonCodeRead(get(BASE, "codeGroup", "USER_ROLE"))).isFalse();
        assertThat(PublicApiPathPolicy.isPublicCommonCodeRead(get(BASE))).isFalse();
        assertThat(PublicApiPathPolicy.isPublicCommonCodeRead(get(BASE + "/12"))).isFalse();
        assertThat(PublicApiPathPolicy.isPublicCommonCodeRead(get(BASE + "/groups/list"))).isFalse();
        assertThat(PublicApiPathPolicy.isPublicCommonCodeRead(get(BASE + "/tenant"))).isFalse();
        assertThat(PublicApiPathPolicy.isPublicCommonCodeRead(
                get(BASE + "/groups", "groups", "RISK_LEVEL,USER_ROLE"))).isFalse();
        assertThat(PublicApiPathPolicy.isPublicCommonCodeRead(get(BASE + "/groups", "groups", ""))).isFalse();
        assertThat(PublicApiPathPolicy.isPublicCommonCodeRead(get(BASE + "/groups/RISK_LEVEL;x=1"))).isFalse();
        assertThat(PublicApiPathPolicy.isPublicCommonCodeRead(get(BASE + "/groups/%52ISK_LEVEL"))).isFalse();
        assertThat(PublicApiPathPolicy.isPublicCommonCodeRead(get("/api/v1/other", "codeGroup", "RISK_LEVEL")))
                .isFalse();
    }

    @Test
    @DisplayName("공통코드 공개 조회: GET 이 아니면 거부")
    void publicCommonCodeRead_nonGet_rejected() {
        MockHttpServletRequest post = new MockHttpServletRequest("POST", BASE);
        post.setRequestURI(BASE);
        post.addParameter("codeGroup", "RISK_LEVEL");
        assertThat(PublicApiPathPolicy.isPublicCommonCodeRead(post)).isFalse();
    }
}
