package com.coresolution.consultation.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ClientScheduleNote;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ClientScheduleNoteRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.integrationtest.support.WithMockAdminSecurityContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@Transactional
@WithMockAdminSecurityContext
@DisplayName("ScheduleController 관리자 스케줄 조회 API")
class ScheduleControllerAdminIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @SpyBean
    private ScheduleRepository scheduleRepository;

    @Autowired
    private ClientScheduleNoteRepository clientScheduleNoteRepository;

    @SpyBean
    private UserRepository userRepository;

    @Autowired
    private ConsultantClientMappingRepository consultantClientMappingRepository;

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

    @Test
    @DisplayName("getSchedulesForAdmin - range 조건은 repository로 내려가고 N+1(행별 user/count) 없이 동작한다")
    void getSchedulesForAdmin_rangeQueryAndNPlusOneOptimized() throws Exception {
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

        LocalDate startDate = LocalDate.of(2026, 4, 1);
        LocalDate endDate = LocalDate.of(2026, 4, 30);

        // 상담사/내담자 사용자 생성
        User consultant = new User();
        consultant.setId(Math.abs(java.util.concurrent.ThreadLocalRandom.current().nextLong()));
        consultant.setUserId("consultant-test");
        consultant.setTenantId(tenantId);
        consultant.setEmail("consultant@test.com");
        consultant.setName("상담사 A");
        consultant.setPhone("01042850000");
        consultant.setRole(UserRole.CONSULTANT);
        consultant.setIsDeleted(false);
        consultant.setPassword("$2a$10$testHashedPasswordForConsultant");

        User client = new User();
        client.setId(Math.abs(java.util.concurrent.ThreadLocalRandom.current().nextLong()));
        client.setUserId("client-test");
        client.setTenantId(tenantId);
        client.setEmail("client@test.com");
        client.setName("내담자 B");
        client.setPhone("01086320000");
        client.setRole(UserRole.CLIENT);
        client.setIsDeleted(false);
        client.setPassword("$2a$10$testHashedPasswordForClient");
        client.setPastSessionCount(3L);

        userRepository.saveAndFlush(consultant);
        userRepository.saveAndFlush(client);

        // bookingAt(스케줄 createdAt) 기준 totalSessions 역산을 위해 매핑 2건 생성
        // - mapping1: 종료되어 bookingAt에서는 비활성
        // - mapping2: bookingAt에서 유효하며 ACTIVE로 current remainingSessions 제공
        ConsultantClientMapping mapping1 = new ConsultantClientMapping();
        mapping1.setTenantId(tenantId);
        mapping1.setConsultant(consultant);
        mapping1.setClient(client);
        mapping1.setStatus(ConsultantClientMapping.MappingStatus.TERMINATED);
        mapping1.setTotalSessions(5);
        mapping1.setRemainingSessions(0);
        mapping1.setStartDate(LocalDateTime.of(2026, 2, 1, 0, 0));
        mapping1.setCreatedAt(LocalDateTime.of(2026, 2, 1, 10, 0));
        mapping1.setTerminatedAt(LocalDateTime.of(2026, 2, 15, 10, 0));
        mapping1.setIsDeleted(false);

        ConsultantClientMapping mapping2 = new ConsultantClientMapping();
        mapping2.setTenantId(tenantId);
        mapping2.setConsultant(consultant);
        mapping2.setClient(client);
        mapping2.setStatus(ConsultantClientMapping.MappingStatus.ACTIVE);
        mapping2.setTotalSessions(10);
        mapping2.setRemainingSessions(7);
        mapping2.setStartDate(LocalDateTime.of(2026, 2, 10, 0, 0));
        mapping2.setCreatedAt(LocalDateTime.of(2026, 2, 10, 10, 0));
        mapping2.setTerminatedAt(null);
        mapping2.setIsDeleted(false);

        consultantClientMappingRepository.saveAndFlush(mapping1);
        consultantClientMappingRepository.saveAndFlush(mapping2);

        // schedules 생성
        LocalDateTime bookingAt = LocalDateTime.of(2026, 2, 20, 10, 30);

        Schedule schedule1 = new Schedule();
        schedule1.setTenantId(tenantId);
        schedule1.setConsultantId(consultant.getId());
        schedule1.setClientId(client.getId());
        schedule1.setDate(startDate);
        schedule1.setStartTime(LocalTime.of(10, 0));
        schedule1.setEndTime(LocalTime.of(11, 0));
        schedule1.setStatus(ScheduleStatus.BOOKED);
        schedule1.setIsDeleted(false);
        schedule1.setSessionSequence(1);
        schedule1.setCreatedAt(bookingAt);

        Schedule schedule2 = new Schedule();
        schedule2.setTenantId(tenantId);
        schedule2.setConsultantId(consultant.getId());
        schedule2.setClientId(client.getId());
        schedule2.setDate(LocalDate.of(2026, 4, 10));
        schedule2.setStartTime(LocalTime.of(10, 0));
        schedule2.setEndTime(LocalTime.of(11, 0));
        schedule2.setStatus(ScheduleStatus.BOOKED);
        schedule2.setIsDeleted(false);
        schedule2.setSessionSequence(2);
        schedule2.setCreatedAt(bookingAt);

        Schedule schedule3 = new Schedule();
        schedule3.setTenantId(tenantId);
        schedule3.setConsultantId(consultant.getId());
        schedule3.setClientId(client.getId());
        schedule3.setDate(LocalDate.of(2026, 4, 10));
        schedule3.setStartTime(LocalTime.of(11, 0));
        schedule3.setEndTime(LocalTime.of(12, 0));
        schedule3.setStatus(ScheduleStatus.BOOKED);
        schedule3.setIsDeleted(false);
        // sessionSequence == null: lifetime count 후보는 sessionSequence IS NOT NULL 인 것만 포함
        schedule3.setSessionSequence(null);
        schedule3.setCreatedAt(bookingAt);

        // range 밖 일정 (exclusion 검증)
        Schedule scheduleOutOfRange = new Schedule();
        scheduleOutOfRange.setTenantId(tenantId);
        scheduleOutOfRange.setConsultantId(consultant.getId());
        scheduleOutOfRange.setClientId(client.getId());
        scheduleOutOfRange.setDate(LocalDate.of(2026, 5, 1));
        scheduleOutOfRange.setStartTime(LocalTime.of(10, 0));
        scheduleOutOfRange.setEndTime(LocalTime.of(11, 0));
        scheduleOutOfRange.setStatus(ScheduleStatus.BOOKED);
        scheduleOutOfRange.setIsDeleted(false);
        scheduleOutOfRange.setSessionSequence(999);
        scheduleOutOfRange.setCreatedAt(bookingAt);

        schedule1 = scheduleRepository.saveAndFlush(schedule1);
        schedule2 = scheduleRepository.saveAndFlush(schedule2);
        schedule3 = scheduleRepository.saveAndFlush(schedule3);
        scheduleOutOfRange = scheduleRepository.saveAndFlush(scheduleOutOfRange);

        // controller 호출 전 invocations history 정리 (setup에서 호출된 repository/mapper 메서드 제거)
        clearInvocations(scheduleRepository, userRepository);

        // API 호출
        mockMvc.perform(get("/api/v1/schedules/admin")
                        .param("startDate", startDate.toString())
                        .param("endDate", endDate.toString())
                        .sessionAttr(SessionConstants.USER_OBJECT, admin)
                        .sessionAttr(SessionConstants.TENANT_ID, tenantId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.count").value(3))
                .andExpect(jsonPath("$.data.schedules[0].id").value(schedule1.getId()))
                .andExpect(jsonPath("$.data.schedules[0].consultantName").value(consultant.getName()))
                .andExpect(jsonPath("$.data.schedules[0].clientName").value(client.getName()))
                .andExpect(jsonPath("$.data.schedules[0].sessionSequence").value(schedule1.getSessionSequence()))
                .andExpect(jsonPath("$.data.schedules[0].mappingId").value(mapping2.getId()))
                .andExpect(jsonPath("$.data.schedules[0].totalSessions").value(mapping2.getTotalSessions()))
                .andExpect(jsonPath("$.data.schedules[0].remainingSessions").value(mapping2.getRemainingSessions()))
                .andExpect(jsonPath("$.data.schedules[1].id").value(schedule2.getId()))
                .andExpect(jsonPath("$.data.schedules[1].sessionSequence").value(schedule2.getSessionSequence()))
                .andExpect(jsonPath("$.data.schedules[1].mappingId").value(mapping2.getId()))
                .andExpect(jsonPath("$.data.schedules[1].totalSessions").value(mapping2.getTotalSessions()))
                .andExpect(jsonPath("$.data.schedules[1].remainingSessions").value(mapping2.getRemainingSessions()))
                .andExpect(jsonPath("$.data.schedules[2].id").value(schedule3.getId()))
                .andExpect(jsonPath("$.data.schedules[2].sessionSequence").value((Integer) null))
                .andExpect(jsonPath("$.data.schedules[2].mappingId").value(mapping2.getId()))
                .andExpect(jsonPath("$.data.schedules[2].totalSessions").value(mapping2.getTotalSessions()))
                .andExpect(jsonPath("$.data.schedules[2].remainingSessions").value(mapping2.getRemainingSessions()));

        // N+1 제거: 행마다 userRepository.findByTenantIdAndId 및 scheduleRepository.countSequenceUpToSchedule 호출이 없어야 한다.
        verify(userRepository, never()).findByTenantIdAndId(anyString(), anyLong());
        verify(scheduleRepository, never()).countSequenceUpToSchedule(
                anyString(),
                anyLong(),
                any(LocalDate.class),
                anyLong());

        // range 조건은 repository 메서드로 내려가야 한다.
        verify(scheduleRepository, times(1)).findAdminSchedulesWithFilters(
                eq(tenantId),
                isNull(),
                isNull(),
                eq(startDate),
                eq(endDate));

        // response의 clientLifetimeSessionCount가 이전 per-row countSequenceUpToSchedule 결과와 동일한지 검증
        clearInvocations(scheduleRepository);

        long lifetime1 = scheduleRepository.countSequenceUpToSchedule(
                tenantId,
                client.getId(),
                schedule1.getDate(),
                schedule1.getId());
        long lifetime2 = scheduleRepository.countSequenceUpToSchedule(
                tenantId,
                client.getId(),
                schedule2.getDate(),
                schedule2.getId());
        long lifetime3 = scheduleRepository.countSequenceUpToSchedule(
                tenantId,
                client.getId(),
                schedule3.getDate(),
                schedule3.getId());

        long expectedClientLifetime1 = client.getPastSessionCount() + lifetime1;
        long expectedClientLifetime2 = client.getPastSessionCount() + lifetime2;
        long expectedClientLifetime3 = client.getPastSessionCount() + lifetime3;

        mockMvc.perform(get("/api/v1/schedules/admin")
                        .param("startDate", startDate.toString())
                        .param("endDate", endDate.toString())
                        .sessionAttr(SessionConstants.USER_OBJECT, admin)
                        .sessionAttr(SessionConstants.TENANT_ID, tenantId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.schedules[0].clientLifetimeSessionCount").value(expectedClientLifetime1))
                .andExpect(jsonPath("$.data.schedules[1].clientLifetimeSessionCount").value(expectedClientLifetime2))
                .andExpect(jsonPath("$.data.schedules[2].clientLifetimeSessionCount").value(expectedClientLifetime3));
    }
}
