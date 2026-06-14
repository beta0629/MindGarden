package com.coresolution.consultation.integration;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
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
import com.coresolution.consultation.dto.response.ConsultantSessionStatisticsBucketResponse;
import com.coresolution.consultation.dto.response.ConsultantSessionStatisticsResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.ConsultantCompletedSessionStatisticsService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.integrationtest.support.WithMockConsultantSecurityContext;

/**
 * {@link com.coresolution.consultation.controller.ConsultantSessionStatisticsController} 통합 테스트.
 *
 * @author CoreSolution
 * @since 2026-05-16
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@WithMockConsultantSecurityContext
@DisplayName("ConsultantSessionStatisticsController API 통합 테스트")
class ConsultantSessionStatisticsControllerIntegrationTest {

    // tenant_id 컬럼 길이(36) 한도. UUID(no-dash) 32자 + prefix 5자 = 32+5=37 → 31자만 잘라 합계 36자.
    private static final String TENANT = "stat-"
            + java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 31);

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ConsultantCompletedSessionStatisticsService consultantCompletedSessionStatisticsService;

    @AfterEach
    void clearTenantContext() {
        TenantContextHolder.clear();
    }

    private User consultant(long id) {
        User u = new User();
        u.setId(id);
        u.setUserId("c-" + id);
        u.setTenantId(TENANT);
        u.setRole(UserRole.CONSULTANT);
        return u;
    }

    @Test
    @DisplayName("상담사·정상 파라미터 → 200 및 data 필드")
    void consultant_validParams_returns200() throws Exception {
        MockHttpSession httpSession = new MockHttpSession();
        httpSession.setAttribute(SessionConstants.USER_OBJECT, consultant(5L));
        httpSession.setAttribute(SessionConstants.TENANT_ID, TENANT);

        ConsultantSessionStatisticsResponse body = ConsultantSessionStatisticsResponse.builder()
                .totalCompleted(42L)
                .buckets(List.of(
                        ConsultantSessionStatisticsBucketResponse.builder()
                                .label("2026-05-01")
                                .count(3L)
                                .build()))
                .previousPeriodTotal(38L)
                .build();

        when(consultantCompletedSessionStatisticsService.aggregateCompletedSessions(
                TENANT,
                5L,
                LocalDate.of(2026, 5, 1),
                LocalDate.of(2026, 5, 31),
                com.coresolution.consultation.constant.SessionStatisticsGranularity.DAY))
                .thenReturn(body);

        mockMvc.perform(get("/api/v1/consultants/me/session-statistics")
                        .param("startDate", "2026-05-01")
                        .param("endDate", "2026-05-31")
                        .param("granularity", "DAY")
                        .session(httpSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalCompleted").value(42))
                .andExpect(jsonPath("$.data.buckets[0].label").value("2026-05-01"))
                .andExpect(jsonPath("$.data.buckets[0].count").value(3))
                .andExpect(jsonPath("$.data.previousPeriodTotal").value(38));
    }

    @Test
    @DisplayName("세션 없음 → 401")
    void withoutSession_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/consultants/me/session-statistics")
                        .param("startDate", "2026-05-01")
                        .param("endDate", "2026-05-31")
                        .param("granularity", "DAY"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("내담자 → 403")
    void client_returns403() throws Exception {
        User u = new User();
        u.setId(9L);
        u.setTenantId(TENANT);
        u.setRole(UserRole.CLIENT);
        MockHttpSession httpSession = new MockHttpSession();
        httpSession.setAttribute(SessionConstants.USER_OBJECT, u);
        httpSession.setAttribute(SessionConstants.TENANT_ID, TENANT);

        mockMvc.perform(get("/api/v1/consultants/me/session-statistics")
                        .param("startDate", "2026-05-01")
                        .param("endDate", "2026-05-31")
                        .param("granularity", "DAY")
                        .session(httpSession))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("잘못된 granularity → 400")
    void badGranularity_returns400() throws Exception {
        MockHttpSession httpSession = new MockHttpSession();
        httpSession.setAttribute(SessionConstants.USER_OBJECT, consultant(5L));
        httpSession.setAttribute(SessionConstants.TENANT_ID, TENANT);

        mockMvc.perform(get("/api/v1/consultants/me/session-statistics")
                        .param("startDate", "2026-05-01")
                        .param("endDate", "2026-05-31")
                        .param("granularity", "YEAR")
                        .session(httpSession))
                .andExpect(status().isBadRequest());
    }
}
