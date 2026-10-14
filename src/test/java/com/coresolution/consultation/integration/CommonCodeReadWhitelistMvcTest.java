package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * 공통코드 비로그인 GET 화이트리스트(필터 체인 포함) 검증.
 *
 * @author MindGarden
 * @since 2026-10-12
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("공통코드 GET — 비로그인 화이트리스트")
class CommonCodeReadWhitelistMvcTest {

    private static final String BASE = "/api/v1/common-codes";

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("화이트리스트 밖 그룹·그룹 미지정·그룹 목록 조회는 401")
    void anonymousNonWhitelistedReads_return401() throws Exception {
        assertThat(status(BASE + "?codeGroup=USER_ROLE")).isEqualTo(401);
        assertThat(status(BASE)).isEqualTo(401);
        assertThat(status(BASE + "/groups/list")).isEqualTo(401);
        assertThat(status(BASE + "/groups/USER_ROLE")).isEqualTo(401);
    }

    @Test
    @DisplayName("화이트리스트 그룹(RISK_LEVEL·ONBOARDING_STATUS) 조회는 401 이 아니다")
    void anonymousWhitelistedReads_notUnauthorized() throws Exception {
        assertThat(status(BASE + "?codeGroup=RISK_LEVEL")).isNotEqualTo(401);
        assertThat(status(BASE + "/groups/ONBOARDING_STATUS")).isNotEqualTo(401);
    }

    private int status(String uri) throws Exception {
        return mockMvc.perform(get(uri)).andReturn().getResponse().getStatus();
    }
}
