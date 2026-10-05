package com.coresolution.consultation.integration;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.integrationtest.support.WithMockAdminSecurityContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@code GET /api/v1/admin/schedules} clientId 필터 — 실제 H2 저장소로 같은 테넌트 안에서만 좁히는지,
 * 관리자 계열이 아닌 세션은 조회 전에 거부되는지 검증한다.
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@Transactional
@WithMockAdminSecurityContext
@DisplayName("AdminController /api/v1/admin/schedules clientId 필터")
class AdminControllerSchedulesClientIdIntegrationTest {

    private static final String ADMIN_SCHEDULES_PATH = "/api/v1/admin/schedules";

    @Autowired
    private MockMvc mockMvc;

    @SpyBean
    private ScheduleRepository scheduleRepository;

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("clientId 지정 → 해당 내담자 일정만 (같은 테넌트 다른 내담자·다른 테넌트 같은 clientId 제외)")
    void getSchedules_clientIdFilter_appliesWithinTenant() throws Exception {
        String tenantId = UUID.randomUUID().toString();
        String otherTenantId = UUID.randomUUID().toString();
        TenantContextHolder.setTenantId(tenantId);
        User admin = createUser(tenantId, UserRole.ADMIN);

        Long consultantId = randomId();
        Long targetClientId = randomId();
        Long otherClientId = targetClientId + 1;
        LocalDate base = LocalDate.of(2026, 9, 1);
        Schedule mineLater = saveBookedSchedule(tenantId, consultantId, targetClientId, base.plusDays(1));
        Schedule mineEarlier = saveBookedSchedule(tenantId, consultantId, targetClientId, base);
        saveBookedSchedule(tenantId, consultantId, otherClientId, base);
        saveBookedSchedule(otherTenantId, consultantId, targetClientId, base);
        clearInvocations(scheduleRepository);

        mockMvc.perform(get(ADMIN_SCHEDULES_PATH)
                        .param("clientId", targetClientId.toString())
                        .sessionAttr(SessionConstants.USER_OBJECT, admin)
                        .sessionAttr(SessionConstants.TENANT_ID, tenantId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.count").value(2))
                .andExpect(jsonPath("$.data.clientId").value(targetClientId))
                .andExpect(jsonPath("$.data.schedules.length()").value(2))
                .andExpect(jsonPath("$.data.schedules[0].id").value(mineLater.getId()))
                .andExpect(jsonPath("$.data.schedules[1].id").value(mineEarlier.getId()));

        verify(scheduleRepository, times(1)).findFilteredByTenant(
                eq(tenantId), isNull(), eq(targetClientId), isNull(), isNull(), isNull(), any(Pageable.class));
    }

    @Test
    @DisplayName("clientId 미지정 → 기존처럼 테넌트 전체(다른 테넌트 제외)")
    void getSchedules_withoutClientId_keepsTenantWideList() throws Exception {
        String tenantId = UUID.randomUUID().toString();
        TenantContextHolder.setTenantId(tenantId);
        User admin = createUser(tenantId, UserRole.ADMIN);
        Long consultantId = randomId();
        LocalDate base = LocalDate.of(2026, 9, 1);
        saveBookedSchedule(tenantId, consultantId, randomId(), base);
        saveBookedSchedule(tenantId, consultantId, randomId(), base);
        saveBookedSchedule(UUID.randomUUID().toString(), consultantId, randomId(), base);

        mockMvc.perform(get(ADMIN_SCHEDULES_PATH)
                        .sessionAttr(SessionConstants.USER_OBJECT, admin)
                        .sessionAttr(SessionConstants.TENANT_ID, tenantId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.count").value(2));
    }

    @Test
    @DisplayName("내담자 세션이 clientId 로 다른 내담자 일정 조회 시도 → 403, 조회 미실행·타인 데이터 없음")
    void getSchedules_clientRoleWithOtherClientId_isRejected() throws Exception {
        assertRoleRejected(UserRole.CLIENT);
    }

    @Test
    @DisplayName("상담사 세션이 clientId 로 조회 시도 → 403, 조회 미실행")
    void getSchedules_consultantRoleWithClientId_isRejected() throws Exception {
        assertRoleRejected(UserRole.CONSULTANT);
    }

    private void assertRoleRejected(UserRole role) throws Exception {
        String tenantId = UUID.randomUUID().toString();
        TenantContextHolder.setTenantId(tenantId);
        User caller = createUser(tenantId, role);
        Long otherClientId = randomId();
        saveBookedSchedule(tenantId, randomId(), otherClientId, LocalDate.of(2026, 9, 1));
        clearInvocations(scheduleRepository);

        mockMvc.perform(get(ADMIN_SCHEDULES_PATH)
                        .param("clientId", otherClientId.toString())
                        .sessionAttr(SessionConstants.USER_OBJECT, caller)
                        .sessionAttr(SessionConstants.TENANT_ID, tenantId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.data.schedules").doesNotExist());

        verify(scheduleRepository, never()).findFilteredByTenant(
                any(), any(), any(), any(), any(), any(), any(Pageable.class));
    }

    private User createUser(String tenantId, UserRole role) {
        User user = new User();
        user.setId(randomId());
        user.setUserId("admin-schedules-" + UUID.randomUUID());
        user.setEmail("admin-schedules@" + UUID.randomUUID() + ".test");
        user.setName("테스트");
        user.setTenantId(tenantId);
        user.setRole(role);
        return user;
    }

    private Schedule saveBookedSchedule(String tenantId, Long consultantId, Long clientId, LocalDate date) {
        Schedule schedule = new Schedule();
        schedule.setTenantId(tenantId);
        schedule.setConsultantId(consultantId);
        schedule.setClientId(clientId);
        schedule.setDate(date);
        schedule.setStartTime(LocalTime.of(9, 0));
        schedule.setEndTime(LocalTime.of(10, 0));
        schedule.setStatus(ScheduleStatus.BOOKED);
        schedule.setIsDeleted(false);
        return scheduleRepository.saveAndFlush(schedule);
    }

    private static Long randomId() {
        return Math.abs(ThreadLocalRandom.current().nextLong(1L, Long.MAX_VALUE / 2));
    }
}
