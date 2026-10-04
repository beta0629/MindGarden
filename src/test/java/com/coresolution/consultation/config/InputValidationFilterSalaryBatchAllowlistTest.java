package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.config.InputValidationConfig.InputValidationFilter;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

/**
 * 입력 검증 필터 — 급여 배치 can-execute·execute 경로만 정확히 통과 (#1420).
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("InputValidationFilter 급여 배치 경로 허용 목록")
class InputValidationFilterSalaryBatchAllowlistTest {

    private final InputValidationFilter filter = new InputValidationFilter();

    private boolean passes(String method, String uri, String query) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        request.setQueryString(query);
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();
        filter.doFilter(request, response, chain);
        return chain.getRequest() != null && response.getStatus() == 200;
    }

    @Test
    @DisplayName("can-execute(GET, 날짜 쿼리)·execute(POST) 는 필터를 통과")
    void allowlistedPaths_pass() throws Exception {
        assertThat(passes("GET", "/api/v1/admin/salary-batch/can-execute", "targetDate=2026-10-01")).isTrue();
        assertThat(passes("POST", "/api/v1/admin/salary-batch/execute", null)).isTrue();
    }

    @ParameterizedTest(name = "{0} {1}?{2} → 400")
    @CsvSource(value = {
        "GET|/api/v1/admin/other/execute|",
        "POST|/api/v1/admin/erp/procedures/execute|",
        "GET|/api/v1/admin/salary-batch/can-execute/extra|",
        "GET|/api/v1/admin/salary-batch/can-executex|",
        "GET|/api/v1/admin/x/api/v1/admin/salary-batch/can-execute|",
        "GET|/api/v1/admin/salary-batch/can-execute|targetDate=1;exec xp_cmdshell",
        "GET|/api/v1/admin/salary-batch/can-execute|q=1 union select 1",
        "GET|/api/v1/admin/salary-batch/can-execute|q=<script>a</script>",
        "GET|/api/v1/admin/salary-batch/../salary-batch/can-execute|",
        "GET|/api/v1/admin/salary-batch/can-execute|a=1&&b"
    }, delimiter = '|')
    @DisplayName("허용 목록 밖 execute 경로·쿼리 주입·순회는 계속 차단")
    void otherExecutePathsAndQueryInjection_stillBlocked(String method, String uri, String query) throws Exception {
        assertThat(passes(method, uri, query)).isFalse();
    }
}
