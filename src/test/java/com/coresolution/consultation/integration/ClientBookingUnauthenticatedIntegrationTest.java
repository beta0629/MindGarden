package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.coresolution.consultation.repository.ConsultationRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

/**
 * 보안 필터 체인 포함 — 미인증 예약 신청·상담 요청 생성은 401, 저장 없음.
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("미인증 내담자 예약·상담 요청 생성 거절")
class ClientBookingUnauthenticatedIntegrationTest {

    private static final String TENANT_HEADER = "X-Tenant-Id";
    private static final String PROBE_TENANT = "cbu-probe-tenant";
    private static final String BOOKING_BODY = "{\"consultantId\":1,\"date\":\"2099-01-05\","
            + "\"startTime\":\"10:00\",\"endTime\":\"10:50\",\"consultationType\":\"X\"}";
    private static final String CONSULTATION_BODY = "{\"consultantId\":1,\"clientId\":2,"
            + "\"consultationDate\":\"2099-01-05\",\"startTime\":\"10:00\",\"endTime\":\"10:50\",\"title\":\"t\"}";

    @Autowired private MockMvc mockMvc;
    @Autowired private ScheduleRepository scheduleRepository;
    @Autowired private ConsultationRepository consultationRepository;

    @Test
    @DisplayName("미인증 POST /api/v1/clients/me/bookings (테넌트 헤더 있음) → 401, 일정 수 불변")
    void unauthenticatedBooking_isUnauthorized() throws Exception {
        long before = scheduleRepository.count();

        mockMvc.perform(post("/api/v1/clients/me/bookings")
                        .header(TENANT_HEADER, PROBE_TENANT)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(BOOKING_BODY))
                .andExpect(status().isUnauthorized());

        assertThat(scheduleRepository.count()).isEqualTo(before);
    }

    @Test
    @DisplayName("미인증 POST /api/v1/consultations (테넌트 헤더 있음) → 401, 상담 요청 수 불변")
    void unauthenticatedConsultationCreate_isUnauthorized() throws Exception {
        long before = consultationRepository.count();

        mockMvc.perform(post("/api/v1/consultations")
                        .header(TENANT_HEADER, PROBE_TENANT)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(CONSULTATION_BODY))
                .andExpect(status().isUnauthorized());

        assertThat(consultationRepository.count()).isEqualTo(before);
    }
}
