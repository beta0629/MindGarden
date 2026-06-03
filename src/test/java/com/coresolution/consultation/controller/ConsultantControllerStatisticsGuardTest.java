package com.coresolution.consultation.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.coresolution.consultation.exception.GlobalExceptionHandler;
import com.coresolution.consultation.service.ConsultantService;
import java.time.LocalDate;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration;
import org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration;
import org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * {@link ConsultantController} 통계 엔드포인트 가드 회귀 검증.
 *
 * <p>P1 보안 라운드 3(2026-06-03, 마인드가든 1.0 출시 전): 매출·상담 통계 응답이 매출 키를
 * 포함하므로 {@code @PreAuthorize("hasAnyRole('ADMIN','STAFF')")} 가드가 메서드 호출 전에
 * 발화하여 CONSULTANT 토큰은 {@link AccessDeniedException} 으로 차단되고 서비스가 호출되지
 * 않는지 검증한다. SecurityConfig 매트릭스(`/api/v1/consultants/**`)와 컨트롤러 클래스 레벨
 * {@code @PreAuthorize("isAuthenticated()")} 와 합쳐 2중 방어선이다.
 *
 * @author MindGarden
 * @since 2026-06-03
 */
@SpringBootTest(classes = ConsultantControllerStatisticsGuardTest.TestApp.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@DisplayName("ConsultantController — 통계 엔드포인트 역할 가드")
class ConsultantControllerStatisticsGuardTest {

    private static final Long CONSULTANT_ID = 9001L;
    private static final String STATISTICS_BASE_PATH = "/api/v1/consultants/" + CONSULTANT_ID + "/statistics";
    private static final String CONSULTATION_STATISTICS_PATH = STATISTICS_BASE_PATH + "/consultations";
    private static final String REVENUE_STATISTICS_PATH = STATISTICS_BASE_PATH + "/revenue";
    private static final String START_DATE = "2026-05-01";
    private static final String END_DATE = "2026-05-31";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ConsultantService consultantService;

    @Nested
    @DisplayName("getRevenueStatistics 매출 통계 가드")
    class GetRevenueStatistics {

        @Test
        @DisplayName("CONSULTANT 토큰 호출은 403 + 서비스 미호출")
        @WithMockUser(roles = {"CONSULTANT"})
        void revenueStatistics_consultantCaller_returnsForbidden() throws Exception {
            mockMvc.perform(get(REVENUE_STATISTICS_PATH)
                    .param("startDate", START_DATE)
                    .param("endDate", END_DATE))
                    .andExpect(status().isForbidden());

            verify(consultantService, never()).getRevenueStatistics(any(), any(), any());
        }

        @Test
        @DisplayName("ADMIN 토큰 호출은 200 + 서비스 위임")
        @WithMockUser(roles = {"ADMIN"})
        void revenueStatistics_adminCaller_returns200() throws Exception {
            LocalDate start = LocalDate.parse(START_DATE);
            LocalDate end = LocalDate.parse(END_DATE);
            Map<String, Object> statistics = Map.of(
                    "totalRevenue", 0L,
                    "consultantId", CONSULTANT_ID);
            when(consultantService.getRevenueStatistics(CONSULTANT_ID, start, end))
                    .thenReturn(statistics);

            mockMvc.perform(get(REVENUE_STATISTICS_PATH)
                    .param("startDate", START_DATE)
                    .param("endDate", END_DATE))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.consultantId").value(CONSULTANT_ID));

            verify(consultantService).getRevenueStatistics(CONSULTANT_ID, start, end);
        }
    }

    @Nested
    @DisplayName("getConsultationStatistics 상담 통계 가드")
    class GetConsultationStatistics {

        @Test
        @DisplayName("CONSULTANT 토큰 호출은 403 + 서비스 미호출")
        @WithMockUser(roles = {"CONSULTANT"})
        void consultationStatistics_consultantCaller_returnsForbidden() throws Exception {
            mockMvc.perform(get(CONSULTATION_STATISTICS_PATH)
                    .param("startDate", START_DATE)
                    .param("endDate", END_DATE))
                    .andExpect(status().isForbidden());

            verify(consultantService, never()).getConsultationStatistics(any(), any(), any());
        }

        @Test
        @DisplayName("STAFF 토큰 호출은 200 + 서비스 위임")
        @WithMockUser(roles = {"STAFF"})
        void consultationStatistics_staffCaller_returns200() throws Exception {
            LocalDate start = LocalDate.parse(START_DATE);
            LocalDate end = LocalDate.parse(END_DATE);
            Map<String, Object> statistics = Map.of(
                    "totalSessions", 0L,
                    "consultantId", CONSULTANT_ID);
            when(consultantService.getConsultationStatistics(CONSULTANT_ID, start, end))
                    .thenReturn(statistics);

            mockMvc.perform(get(CONSULTATION_STATISTICS_PATH)
                    .param("startDate", START_DATE)
                    .param("endDate", END_DATE))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.consultantId").value(CONSULTANT_ID));

            verify(consultantService).getConsultationStatistics(CONSULTANT_ID, start, end);
        }
    }

    /**
     * ConsultantController slice 부트스트랩 — DB/Flyway/Redis 자동 설정을 제외하고 메서드 보안만 활성화한다.
     */
    @Configuration
    @EnableAutoConfiguration(exclude = {
            DataSourceAutoConfiguration.class,
            HibernateJpaAutoConfiguration.class,
            FlywayAutoConfiguration.class,
            RedisAutoConfiguration.class,
            RedisRepositoriesAutoConfiguration.class
    })
    @EnableMethodSecurity(prePostEnabled = true)
    @Import({ConsultantController.class, GlobalExceptionHandler.class})
    static class TestApp {
    }
}
