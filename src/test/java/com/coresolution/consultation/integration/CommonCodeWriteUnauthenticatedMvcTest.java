package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * 공통코드 쓰기 API 의 미인증 401 검증 (보안 필터 체인 포함).
 *
 * <p>GET 조회는 온보딩 화면용으로 계속 공개이며 이 테스트 범위가 아니다.
 *
 * @author MindGarden
 * @since 2026-10-12
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("공통코드 쓰기 — 미인증 401")
class CommonCodeWriteUnauthenticatedMvcTest {

    /** TenantContextFilter 통과용 더미 헤더. */
    private static final String DUMMY_TENANT_HEADER = "tenant-codes-anon";

    private static final String[] WRITE_BASES = {"/api/v1/common-codes", "/api/common-codes"};

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("토큰 없이 toggle-status·deactivate·batch 를 호출하면 모두 401")
    void anonymousWrites_return401() throws Exception {
        for (String base : WRITE_BASES) {
            assertUnauthorized(put(base + "/1/toggle-status"));
            assertUnauthorized(put(base + "/deactivate").content("{\"codeValues\":[\"X\"]}"));
            assertUnauthorized(post(base + "/batch").content("[]"));
        }
    }

    private void assertUnauthorized(
            org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder builder)
            throws Exception {
        int status = mockMvc.perform(builder
                        .header("X-Tenant-Id", DUMMY_TENANT_HEADER)
                        .contentType(MediaType.APPLICATION_JSON))
                .andReturn().getResponse().getStatus();
        assertThat(status).isEqualTo(401);
    }
}
