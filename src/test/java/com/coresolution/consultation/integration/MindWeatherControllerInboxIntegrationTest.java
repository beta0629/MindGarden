package com.coresolution.consultation.integration;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.mindweather.MindWeatherCardResponse;
import com.coresolution.consultation.dto.mindweather.MindWeatherShareConsentResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.MindWeatherService;
import com.coresolution.core.context.TenantContextHolder;

/**
 * {@link com.coresolution.consultation.controller.MindWeatherController} 상담사 수신함 JSON 계약 검증.
 *
 * @author MindGarden
 * @since 2026-05-16
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@DisplayName("MindWeatherController inbox API 통합 테스트")
class MindWeatherControllerInboxIntegrationTest {

    // tenant_id 컬럼 길이(36) 한도. UUID(no-dash) 32자 + prefix 4자 = 36자.
    private static final String TENANT = "mwi-"
            + java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 32);

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MindWeatherService mindWeatherService;

    @AfterEach
    void clearTenantContext() {
        TenantContextHolder.clear();
    }

    private User consultant(long id) {
        User u = new User();
        u.setId(id);
        u.setUserId("c-mw-" + id);
        u.setTenantId(TENANT);
        u.setRole(UserRole.CONSULTANT);
        return u;
    }

    @Test
    @DisplayName("수신함 응답 data[]에 clientId·clientName이 직렬화된다")
    void inbox_serializesClientIdentityFields() throws Exception {
        MindWeatherShareConsentResponse share = MindWeatherShareConsentResponse.builder()
            .summary(true)
            .original(false)
            .consultantId(5L)
            .updatedAt("2026-05-16T12:00:00+09:00")
            .build();
        MindWeatherCardResponse row = MindWeatherCardResponse.builder()
            .id("1001")
            .clientId(42L)
            .clientName("테스트내담자")
            .source("memo")
            .text("")
            .summary("요약")
            .tone("positive")
            .keywords(List.of())
            .share(share)
            .createdAt("2026-05-15T10:00:00+09:00")
            .build();
        when(mindWeatherService.listInboxForConsultant(any())).thenReturn(List.of(row));

        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionConstants.USER_OBJECT, consultant(5L));
        session.setAttribute(SessionConstants.TENANT_ID, TENANT);

        mockMvc.perform(get("/api/v1/mind-weather/inbox").session(session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data[0].id").value("1001"))
            .andExpect(jsonPath("$.data[0].clientId").value(42))
            .andExpect(jsonPath("$.data[0].clientName").value("테스트내담자"));
    }

    @Test
    @DisplayName("수신함 응답 data[]에 clientId·clientName JSON 키가 항상 포함된다")
    void inbox_alwaysIncludesClientIdentityJsonKeys() throws Exception {
        MindWeatherCardResponse row = MindWeatherCardResponse.builder()
            .id("1003")
            .clientId(7L)
            .clientName(null)
            .source("memo")
            .text("")
            .summary("요약")
            .tone("positive")
            .keywords(List.of())
            .share(null)
            .createdAt("2026-05-15T10:00:00+09:00")
            .build();
        when(mindWeatherService.listInboxForConsultant(any())).thenReturn(List.of(row));

        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionConstants.USER_OBJECT, consultant(2L));
        session.setAttribute(SessionConstants.TENANT_ID, TENANT);

        mockMvc.perform(get("/api/v1/mind-weather/inbox").session(session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data[0].clientId").value(7))
            .andExpect(jsonPath("$.data[0].clientName").value(nullValue()));
    }

    @Test
    @DisplayName("세션 없음 → 403 (AccessDeniedException)")
    void inbox_withoutSession_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/mind-weather/inbox"))
            .andExpect(status().isForbidden());
    }
}
