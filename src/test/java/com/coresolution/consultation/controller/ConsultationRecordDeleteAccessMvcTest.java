package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.lang.reflect.Constructor;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.constant.consultation.ConsultationRecordAccessAudit;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.GlobalExceptionHandler;
import com.coresolution.consultation.repository.ClinicalReportRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.InstitutionLinkConsultationLogRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.ConsultationRecordService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.support.ClientPathAccessGuard;
import com.coresolution.consultation.service.support.ConsultationRecordAccessGuard;
import com.coresolution.consultation.service.support.ConsultationRecordAccessLogService;
import com.coresolution.consultation.service.support.ConsultationRecordAccessLogService.ConsultationRecordAccessCommand;
import com.coresolution.core.context.TenantContextHolder;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * 상담일지 삭제 — 관리자 쪽 경로·상담사 경로 모두 공용 가드 {@link ConsultationRecordAccessGuard#requireDeleteAccess}
 * 하나로 판정하는지 HTTP 로 확인한다.
 *
 * <ul>
 *   <li>사무원(STAFF)·다른 상담사·내담자·다른 테넌트 관리자 403, 미인증 401 — 두 경로 모두, 서비스 미호출.</li>
 *   <li>없는 id 와 남의 id 는 같은 403 문구(존재 비노출).</li>
 *   <li>같은 테넌트 관리자(ADMIN)·작성 상담사 200 (서비스 호출).</li>
 *   <li>사무원 거부는 DENIED 감사 행으로 남는다.</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("상담일지 삭제 — 두 경로 공용 가드, 사무원 제외")
class ConsultationRecordDeleteAccessMvcTest {

    private static final String TENANT_A = "tenant-delete-a";
    private static final String TENANT_B = "tenant-delete-b";
    private static final long SCHEDULE_ID = 610L;
    private static final long AUTHOR = 22L;
    private static final long OTHER_CONSULTANT = 77L;
    private static final long CLIENT_ID = 20L;
    private static final long ADMIN_ID = 1L;
    private static final long STAFF_ID = 2L;
    private static final long ADMIN_B = 5L;
    private static final long RECORD_ID = 9100L;
    private static final long MISSING_RECORD_ID = 9199L;
    private static final int SESSION_NUMBER = 3;
    private static final String BODY_TEXT = "삭제 본문 유출 감지 문구";

    private final ObjectMapper objectMapper = new ObjectMapper();

    private MockMvc mockMvc;
    private ConsultationRecordService consultationRecordService;
    private ConsultationRecordAccessLogService accessLogService;

    @BeforeEach
    void setUp() throws Exception {
        SecurityContextHolder.clearContext();
        TenantContextHolder.clear();

        ConsultationRecordRepository recordRepository = mock(ConsultationRecordRepository.class);
        consultationRecordService = mock(ConsultationRecordService.class);
        accessLogService = mock(ConsultationRecordAccessLogService.class);
        UserRepository userRepository = mock(UserRepository.class);
        DynamicPermissionService dynamicPermissionService = mock(DynamicPermissionService.class);
        when(dynamicPermissionService.hasPermission(any(User.class), anyString())).thenReturn(true);

        ClientPathAccessGuard clientGuard = new ClientPathAccessGuard(
            mock(ConsultantClientMappingRepository.class), userRepository);
        ConsultationRecordAccessGuard logGuard = new ConsultationRecordAccessGuard(clientGuard,
            mock(ClinicalReportRepository.class), accessLogService, recordRepository,
            mock(InstitutionLinkConsultationLogRepository.class), mock(ScheduleRepository.class));

        Object[] provided = {clientGuard, logGuard, consultationRecordService, recordRepository, userRepository,
            dynamicPermissionService, objectMapper};
        mockMvc = MockMvcBuilders.standaloneSetup(
                build(AdminController.class, provided), build(ConsultantRecordsController.class, provided))
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();

        when(recordRepository.findByTenantIdAndId(TENANT_A, RECORD_ID)).thenReturn(Optional.of(record()));
        when(recordRepository.findByTenantIdAndId(TENANT_A, MISSING_RECORD_ID)).thenReturn(Optional.empty());
        when(accessLogService.buildCommand(any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenAnswer(invocation -> new ConsultationRecordAccessCommand(
                invocation.getArgument(1), invocation.getArgument(3), invocation.getArgument(2),
                invocation.getArgument(4), invocation.getArgument(5),
                ((User) invocation.getArgument(0)).getId(),
                ((User) invocation.getArgument(0)).getRole().name(),
                invocation.getArgument(6), invocation.getArgument(7), invocation.getArgument(8), null, null));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("STAFF — 관리자 경로·상담사 경로 모두 403, 없는 id 도 같은 문구, 서비스 미호출")
    void staff_forbiddenOnBothPaths() throws Exception {
        User staff = user(STAFF_ID, UserRole.STAFF, TENANT_A);
        for (String uri : List.of(adminUri(RECORD_ID), consultantUri(RECORD_ID))) {
            String existing = assertDenied(call(uri, staff));
            String missing = assertDenied(call(uri.replace(String.valueOf(RECORD_ID),
                String.valueOf(MISSING_RECORD_ID)), staff));
            assertThat(messageOf(existing)).isEqualTo(messageOf(missing))
                .isEqualTo(ConsultationRecordAccessGuard.DENIAL_RECORD_UNAVAILABLE);
        }
        verify(consultationRecordService, never()).deleteConsultationRecord(anyLong(), anyLong(), any());
    }

    @Test
    @DisplayName("STAFF 거부는 DENIED 감사 행으로 남는다 (actorRole STAFF, ALLOWED 없음)")
    void staff_denialAudited() throws Exception {
        User staff = user(STAFF_ID, UserRole.STAFF, TENANT_A);
        assertDenied(call(adminUri(RECORD_ID), staff));
        assertDenied(call(consultantUri(RECORD_ID), staff));

        ArgumentCaptor<ConsultationRecordAccessCommand> captor =
            ArgumentCaptor.forClass(ConsultationRecordAccessCommand.class);
        verify(accessLogService, atLeastOnce()).record(captor.capture());
        List<ConsultationRecordAccessCommand> rows = captor.getAllValues();
        assertThat(rows).hasSize(2).allMatch(c -> ConsultationRecordAccessAudit.RESULT_DENIED.equals(c.result())
            && UserRole.STAFF.name().equals(c.actorRole())
            && Long.valueOf(RECORD_ID).equals(c.recordId())
            && c.denialReason() != null
            && !c.denialReason().contains(BODY_TEXT));
    }

    @Test
    @DisplayName("다른 상담사·내담자·다른 테넌트 관리자 403 (두 경로), 미인증 401, 서비스 미호출")
    void othersDenied_onBothPaths() throws Exception {
        List<User> denied = List.of(user(OTHER_CONSULTANT, UserRole.CONSULTANT, TENANT_A),
            user(CLIENT_ID, UserRole.CLIENT, TENANT_A), user(ADMIN_B, UserRole.ADMIN, TENANT_B));
        for (String uri : List.of(adminUri(RECORD_ID), consultantUri(RECORD_ID))) {
            for (User caller : denied) {
                assertDenied(call(uri, caller));
            }
            mockMvc.perform(delete(uri)).andExpect(status().isUnauthorized());
        }
        verify(consultationRecordService, never()).deleteConsultationRecord(anyLong(), anyLong(), any());
    }

    @Test
    @DisplayName("같은 테넌트 ADMIN — 두 경로 모두 200, 서비스 호출")
    void admin_okOnBothPaths() throws Exception {
        User admin = user(ADMIN_ID, UserRole.ADMIN, TENANT_A);
        call(adminUri(RECORD_ID), admin).andExpect(status().isOk());
        call(consultantUri(RECORD_ID), admin).andExpect(status().isOk());
        verify(consultationRecordService, times(2))
            .deleteConsultationRecord(eq(RECORD_ID), eq(SCHEDULE_ID), eq(SESSION_NUMBER));
    }

    @Test
    @DisplayName("작성 상담사 — 두 경로 모두 200 (기존 작성자 삭제 규칙 유지)")
    void author_okOnBothPaths() throws Exception {
        User author = user(AUTHOR, UserRole.CONSULTANT, TENANT_A);
        call(adminUri(RECORD_ID), author).andExpect(status().isOk());
        call(consultantUri(RECORD_ID), author).andExpect(status().isOk());
        verify(consultationRecordService, times(2))
            .deleteConsultationRecord(eq(RECORD_ID), eq(SCHEDULE_ID), eq(SESSION_NUMBER));
    }

    private static String adminUri(long recordId) {
        return "/api/v1/admin/consultation-records/" + recordId
            + "?consultationId=" + SCHEDULE_ID + "&sessionNumber=" + SESSION_NUMBER;
    }

    private static String consultantUri(long recordId) {
        return "/api/v1/admin/consultant-records/" + AUTHOR + "/consultation-records/" + recordId
            + "?consultationId=" + SCHEDULE_ID + "&sessionNumber=" + SESSION_NUMBER;
    }

    private ResultActions call(String uri, User caller) throws Exception {
        return mockMvc.perform(delete(uri).session(session(caller)).with(r -> {
            TenantContextHolder.setTenantId(caller.getTenantId());
            return r;
        }));
    }

    private static String assertDenied(ResultActions result) throws Exception {
        String body = result.andExpect(status().isForbidden())
            .andExpect(jsonPath("$.data").doesNotExist())
            .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertThat(body).doesNotContain(BODY_TEXT);
        return body;
    }

    private String messageOf(String json) throws Exception {
        return objectMapper.readTree(json).path("message").asText();
    }

    private static ConsultationRecord record() {
        ConsultationRecord r = new ConsultationRecord();
        r.setId(RECORD_ID);
        r.setTenantId(TENANT_A);
        r.setConsultationId(SCHEDULE_ID);
        r.setConsultantId(AUTHOR);
        r.setClientId(CLIENT_ID);
        r.setSessionNumber(SESSION_NUMBER);
        r.setIsDeleted(false);
        r.setMainIssues(BODY_TEXT);
        return r;
    }

    private static User user(long id, UserRole role, String tenantId) {
        User u = new User();
        u.setId(id);
        u.setUserId("u-" + id);
        u.setRole(role);
        u.setTenantId(tenantId);
        return u;
    }

    private static MockHttpSession session(User u) {
        MockHttpSession s = new MockHttpSession();
        s.setAttribute(SessionConstants.USER_OBJECT, u);
        s.setAttribute(SessionConstants.TENANT_ID, u.getTenantId());
        return s;
    }

    private static <T> T build(Class<T> type, Object... provided) throws Exception {
        Constructor<?> ctor = Arrays.stream(type.getDeclaredConstructors())
            .max(Comparator.comparingInt(Constructor::getParameterCount))
            .orElseThrow();
        Object[] args = Arrays.stream(ctor.getParameterTypes())
            .map(p -> Arrays.stream(provided).filter(p::isInstance).findFirst().orElseGet(() -> mock(p)))
            .toArray();
        ctor.setAccessible(true);
        return type.cast(ctor.newInstance(args));
    }
}
