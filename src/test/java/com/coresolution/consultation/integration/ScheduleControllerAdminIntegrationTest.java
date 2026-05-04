package com.coresolution.consultation.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ClientScheduleNote;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ClientScheduleNoteRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@Transactional
@DisplayName("ScheduleController 관리자 스케줄 조회 API")
class ScheduleControllerAdminIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ScheduleRepository scheduleRepository;

    @Autowired
    private ClientScheduleNoteRepository clientScheduleNoteRepository;

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("getSchedulesForAdmin - 미해소 특이사항 건수(scheduleWide, clientWide)가 올바르게 반환된다")
    void getSchedulesForAdmin_returnsUnresolvedNoteCounts() throws Exception {
        String tenantId = UUID.randomUUID().toString();
        TenantContextHolder.setTenantId(tenantId);

        // 관리자 세션 설정
        User admin = new User();
        admin.setId(Math.abs(java.util.concurrent.ThreadLocalRandom.current().nextLong()));
        admin.setUserId("admin-test");
        admin.setEmail("admin@test.com");
        admin.setName("관리자");
        admin.setTenantId(tenantId);
        admin.setRole(UserRole.ADMIN);

        Long clientId = Math.abs(java.util.concurrent.ThreadLocalRandom.current().nextLong());

        // 스케줄 생성
        Schedule schedule = new Schedule();
        schedule.setTenantId(tenantId);
        schedule.setClientId(clientId);
        schedule.setConsultantId(Math.abs(java.util.concurrent.ThreadLocalRandom.current().nextLong()));
        schedule.setDate(LocalDate.now());
        schedule.setStartTime(LocalTime.of(10, 0));
        schedule.setEndTime(LocalTime.of(11, 0));
        schedule.setStatus(ScheduleStatus.BOOKED);
        schedule.setIsDeleted(false);
        schedule = scheduleRepository.saveAndFlush(schedule);

        // 특이사항 생성 (해당 스케줄에 속함, 미해소)
        ClientScheduleNote note1 = new ClientScheduleNote();
        note1.setTenantId(tenantId);
        note1.setClientId(clientId);
        note1.setScheduleId(schedule.getId());
        note1.setNoteType("GENERAL");
        note1.setTitle("Note 1");
        note1.setBody("Note 1 Body");
        note1.setIsDeleted(false);
        clientScheduleNoteRepository.save(note1);

        // 특이사항 생성 (다른 스케줄에 속하지만 동일 내담자, 미해소)
        ClientScheduleNote note2 = new ClientScheduleNote();
        note2.setTenantId(tenantId);
        note2.setClientId(clientId);
        note2.setScheduleId(9999L);
        note2.setNoteType("GENERAL");
        note2.setTitle("Note 2");
        note2.setBody("Note 2 Body");
        note2.setIsDeleted(false);
        clientScheduleNoteRepository.save(note2);

        clientScheduleNoteRepository.flush();

        // API 호출 및 검증
        // 해당 스케줄 기준 미해소 건수: 1 (note1)
        // 내담자 기준 전체 미해소 건수: 2 (note1, note2)
        mockMvc.perform(get("/api/v1/schedules/admin")
                        .sessionAttr(SessionConstants.USER_OBJECT, admin)
                        .sessionAttr(SessionConstants.TENANT_ID, tenantId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.schedules[0].id").value(schedule.getId()))
                .andExpect(jsonPath("$.data.schedules[0].clientScheduleNotesUnresolvedCount").value(1))
                .andExpect(jsonPath("$.data.schedules[0].clientScheduleNotesClientWideUnresolvedCount").value(2));
    }
}
