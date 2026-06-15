package com.coresolution.core.security;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * {@link SecurityAuditService#checkSQLInjection(Map, String)} 회귀 테스트.
 *
 * <p>P0 핫픽스 (2026-06-15): URI path 의 RESTful 액션 토큰
 * (create/update/delete/insert/select 등)이 SQL 키워드와 겹쳐
 * 합법 엔드포인트가 모두 차단되던 회귀를 방지한다.</p>
 *
 * <p>핵심 원칙:</p>
 * <ul>
 *     <li>URI path 는 SQL 메타 문자(', --, ;, |, /*, *&#47;)만 검사</li>
 *     <li>SQL 키워드 단어 매칭은 query/body 값에만 적용</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-06-15
 */
@DisplayName("SecurityAuditService SQL 인젝션 검사 회귀 (P0 핫픽스)")
class SecurityAuditServiceTest {

    private SecurityAuditService service;

    @BeforeEach
    void setUp() {
        service = new SecurityAuditService();
    }

    @Test
    @DisplayName("URI 의 'create' 액션 토큰은 SQL injection 으로 오탐되지 않아야 한다 (P0 회귀)")
    void uri_path_with_create_keyword_should_not_be_blocked() {
        boolean result = service.checkSQLInjection(Collections.emptyMap(), "/api/v1/ratings/create");

        assertThat(result)
            .as("RESTful 액션 'create' URI 는 차단되면 안 됨 (운영 BE 평가 제출 100%% 차단 회귀)")
            .isFalse();
    }

    @Test
    @DisplayName("URI 의 update/delete/insert/select 등 RESTful 액션 토큰은 모두 통과해야 한다")
    void uri_path_with_restful_action_keywords_should_not_be_blocked() {
        List<String> safeUris = List.of(
            "/api/v1/users/update",
            "/api/v1/posts/delete",
            "/api/v1/items/insert",
            "/api/v1/data/select",
            "/api/v1/orders/create",
            "/api/v1/sessions/exec",
            "/api/v1/audit/alter",
            "/api/v1/jobs/drop",
            "/api/v1/sync/union"
        );

        for (String uri : safeUris) {
            assertThat(service.checkSQLInjection(Collections.emptyMap(), uri))
                .as("RESTful 액션 URI 는 차단되면 안 됨: %s", uri)
                .isFalse();
        }
    }

    @Test
    @DisplayName("URI 에 실제 SQL 메타 문자(' / -- / ; / | / /* / */)가 포함되면 여전히 차단되어야 한다")
    void uri_with_actual_sql_meta_chars_should_still_be_blocked() {
        // 작은따옴표
        assertThat(service.checkSQLInjection(Collections.emptyMap(), "/api/v1/users/'; DROP TABLE users--"))
            .as("작은따옴표 + 라인 주석 포함 URI 는 차단")
            .isTrue();

        // 라인 주석
        assertThat(service.checkSQLInjection(Collections.emptyMap(), "/api/v1/users/--comment"))
            .as("라인 주석(--) 포함 URI 는 차단")
            .isTrue();

        // 구문 종료
        assertThat(service.checkSQLInjection(Collections.emptyMap(), "/api/v1/users/admin;"))
            .as("구문 종료(;) 포함 URI 는 차단")
            .isTrue();

        // 블록 주석
        assertThat(service.checkSQLInjection(Collections.emptyMap(), "/api/v1/users/x/*injected*/"))
            .as("블록 주석(/*, */) 포함 URI 는 차단")
            .isTrue();
    }

    @Test
    @DisplayName("query 파라미터 값에 SQL 키워드가 포함되면 여전히 차단되어야 한다 (기존 동작 유지)")
    void query_param_with_sql_keyword_should_still_be_blocked() {
        Map<String, String[]> params = Map.of(
            "q", new String[] { "' UNION SELECT * FROM users--" }
        );

        assertThat(service.checkSQLInjection(params, "/api/v1/search"))
            .as("query 파라미터의 UNION SELECT 페이로드는 여전히 차단")
            .isTrue();
    }

    @Test
    @DisplayName("body 파라미터 값에 SQL 메타 문자/키워드가 포함되면 차단되어야 한다 (기존 동작 유지)")
    void post_body_with_sql_keyword_should_be_blocked() {
        Map<String, String[]> params = Map.of(
            "comment", new String[] { "normal text" },
            "name", new String[] { "' OR 1=1--" }
        );

        // URI 자체는 정상이지만 body 의 SQL injection 페이로드로 차단되어야 함
        assertThat(service.checkSQLInjection(params, "/api/v1/users/create"))
            .as("body 의 OR 1=1-- 페이로드는 여전히 차단")
            .isTrue();
    }

    @Test
    @DisplayName("정상 query 파라미터 값과 정상 URI 조합은 통과해야 한다")
    void normal_request_should_pass() {
        Map<String, String[]> params = Map.of(
            "rating", new String[] { "5" },
            "comment", new String[] { "상담사가 친절했어요" }
        );

        assertThat(service.checkSQLInjection(params, "/api/v1/ratings/create"))
            .as("정상 평가 제출 페이로드는 통과")
            .isFalse();
    }

    @Test
    @DisplayName("숫자만 있는 경로 변수(/123)는 기존대로 검사 스킵되어야 한다")
    void numeric_path_variable_should_be_skipped() {
        assertThat(service.checkSQLInjection(Collections.emptyMap(), "/api/v1/consultation-messages/client/555"))
            .as("숫자 경로 변수는 검사 제외")
            .isFalse();
    }

    @Test
    @DisplayName("null/빈 파라미터 맵에 대한 NPE 회귀 방어")
    void null_safe_inputs() {
        assertThat(service.checkSQLInjection(null, "/api/v1/ratings/create")).isFalse();
        assertThat(service.checkSQLInjection(Collections.emptyMap(), null)).isFalse();
    }
}
