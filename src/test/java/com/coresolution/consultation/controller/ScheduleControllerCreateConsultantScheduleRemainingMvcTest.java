package com.coresolution.consultation.controller;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.coresolution.consultation.constant.PaymentTimingConstants;
import com.coresolution.consultation.constant.ScheduleServiceUserFacingMessages;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.GlobalExceptionHandler;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.ConsultantAvailabilityService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.RoleCommonCodeAuthorizationService;
import com.coresolution.consultation.service.impl.ScheduleServiceImpl;
import com.coresolution.core.context.TenantContextHolder;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * POST /api/v1/schedules/consultant — 잔여 0·SESSIONS_EXHAUSTED 가 HTTP 500 이 아니라
 * 공통 {@link GlobalExceptionHandler} 4xx 로 응답하는지.
 *
 * <p>컨트롤러와 실제 {@link ScheduleServiceImpl}(저장소만 목)을 연결해,
 * #1870 이후 소진 매핑이 "매핑 없음" RuntimeException(500 RUNTIME_ERROR)으로 새던 경로를 재현한다.</p>
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ScheduleController 상담사 일정 생성 — 잔여 0 MockMvc")
class ScheduleControllerCreateConsultantScheduleRemainingMvcTest {

    private static final String TENANT_ID = "tenant-schedule-remaining-mvc-1";
    private static final String CREATE_URL = "/api/v1/schedules/consultant";
    private static final Long CONSULTANT_ID = 101L;
    private static final Long CLIENT_ID = 202L;
    private static final Long EXHAUSTED_MAPPING_ID = 393L;
    private static final String FUTURE_DATE = "2027-03-15";
    private static final String START_TIME = "14:00";
    private static final String END_TIME = "15:00";

    @Mock
    private ConsultantClientMappingRepository mappingRepository;
    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private ConsultantAvailabilityService consultantAvailabilityService;
    @Mock
    private DynamicPermissionService dynamicPermissionService;
    @Mock
    private RoleCommonCodeAuthorizationService roleCommonCodeAuthorizationService;

    @InjectMocks
    private ScheduleServiceImpl scheduleService;

    @InjectMocks
    private ScheduleController controller;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        ReflectionTestUtils.setField(controller, "scheduleService", scheduleService);
        ReflectionTestUtils.setField(controller, "dynamicPermissionService", dynamicPermissionService);
        ReflectionTestUtils.setField(controller, "consultantAvailabilityService", consultantAvailabilityService);
        ReflectionTestUtils.setField(controller, "roleCommonCodeAuthorizationService", roleCommonCodeAuthorizationService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        when(dynamicPermissionService.canRegisterScheduler(UserRole.ADMIN)).thenReturn(true);
        when(roleCommonCodeAuthorizationService.isAdminOrStaffRoleFromCommonCode(UserRole.ADMIN))
                .thenReturn(true);
        when(consultantAvailabilityService.isConsultantOnVacation(
                eq(CONSULTANT_ID), any(LocalDate.class), any(LocalTime.class), any(LocalTime.class)))
                .thenReturn(false);
        when(scheduleRepository.findByTenantIdAndConsultantIdAndDate(
                eq(TENANT_ID), eq(CONSULTANT_ID), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.PENDING_PAYMENT))
                .thenReturn(Collections.emptyList());
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.CANCELLED))
                .thenReturn(Collections.emptyList());
        lenient().when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.ACTIVE))
                .thenReturn(Collections.emptyList());
        lenient().when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.SESSIONS_EXHAUSTED))
                .thenReturn(Collections.emptyList());
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("SESSIONS_EXHAUSTED 쌍 POST → 400 ILLEGAL_STATE, 사용 가능한 회기가 없습니다")
    void postConsultantSchedule_sessionsExhausted_returns400NoRemainingSessions() throws Exception {
        ConsultantClientMapping exhausted = exhaustedMapping();
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.ACTIVE))
                .thenReturn(Collections.emptyList());
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.SESSIONS_EXHAUSTED))
                .thenReturn(List.of(exhausted));

        mockMvc.perform(post(CREATE_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createBody()))
                        .sessionAttr(SessionConstants.USER_OBJECT, adminUser())
                        .sessionAttr(SessionConstants.TENANT_ID, TENANT_ID))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("ILLEGAL_STATE"))
                .andExpect(jsonPath("$.message")
                        .value(ScheduleServiceUserFacingMessages.MSG_NO_REMAINING_SESSIONS))
                .andExpect(jsonPath("$.message", containsString("사용 가능한 회기가 없습니다")));

        verify(scheduleRepository, never()).save(any(Schedule.class));
    }

    @Test
    @DisplayName("ACTIVE 잔여 0 쌍 POST → 400 ILLEGAL_STATE, 사용 가능한 회기가 없습니다")
    void postConsultantSchedule_activeRemainingZero_returns400NoRemainingSessions() throws Exception {
        ConsultantClientMapping mapping = exhaustedMapping();
        mapping.setStatus(MappingStatus.ACTIVE);
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.ACTIVE))
                .thenReturn(List.of(mapping));

        mockMvc.perform(post(CREATE_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createBody()))
                        .sessionAttr(SessionConstants.USER_OBJECT, adminUser())
                        .sessionAttr(SessionConstants.TENANT_ID, TENANT_ID))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("ILLEGAL_STATE"))
                .andExpect(jsonPath("$.message")
                        .value(ScheduleServiceUserFacingMessages.MSG_NO_REMAINING_SESSIONS));

        verify(scheduleRepository, never()).save(any(Schedule.class));
    }

    private User adminUser() {
        User user = new User();
        user.setId(1L);
        user.setUserId("admin-remaining-mvc");
        user.setRole(UserRole.ADMIN);
        user.setTenantId(TENANT_ID);
        return user;
    }

    private Map<String, Object> createBody() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("consultantId", CONSULTANT_ID);
        body.put("clientId", CLIENT_ID);
        body.put("date", FUTURE_DATE);
        body.put("startTime", START_TIME);
        body.put("endTime", END_TIME);
        body.put("title", "잔여 검증");
        body.put("description", "MockMvc");
        body.put("consultationType", "INDIVIDUAL");
        body.put("tentativeBeforeDeposit", false);
        return body;
    }

    private ConsultantClientMapping exhaustedMapping() {
        User consultant = new User();
        consultant.setId(CONSULTANT_ID);
        User client = new User();
        client.setId(CLIENT_ID);
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(EXHAUSTED_MAPPING_ID);
        mapping.setTenantId(TENANT_ID);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setStatus(MappingStatus.SESSIONS_EXHAUSTED);
        mapping.setPaymentTiming(PaymentTimingConstants.SAME_DAY_CARD);
        mapping.setRemainingSessions(0);
        mapping.setTotalSessions(1);
        mapping.setUsedSessions(1);
        mapping.setUpdatedAt(LocalDateTime.of(2026, 11, 11, 18, 0));
        mapping.setCreatedAt(LocalDateTime.of(2026, 11, 11, 10, 0));
        return mapping;
    }
}
