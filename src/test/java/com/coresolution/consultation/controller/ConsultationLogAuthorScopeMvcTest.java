package com.coresolution.consultation.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;

import java.lang.reflect.Constructor;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import com.coresolution.consultation.config.SecurityHeaderFilter;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.constant.consultation.ConsultationRecordAccessAudit;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.entity.Schedule;
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
import com.coresolution.core.context.TenantContextHolder;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * 상담일지 본문 열람 — 작성자(consultation_records.consultant_id) 기준 판정 (#1408 검증 FAIL 보완).
 *
 * <p>.dev 5474c5f 측정에서 {@code GET /api/v1/schedules/consultation-records?consultationId=502&consultantId=3}
 * 호출이 200 + 본문을 돌려줬다. 작성자는 상담사 22 였고 3 은 재배정된 새 담당자였다. 즉 권한 판정이
 * <b>요청 파라미터 consultantId</b> 를 그대로 믿었다. 이 테스트는 다음을 고정한다.</p>
 *
 * <ul>
 *   <li>요청 {@code consultantId}·현재 담당 상담사는 판정에 쓰지 않는다 — 작성자가 아니면 403.</li>
 *   <li>작성자 상담사는 200 + 본문.</li>
 *   <li>같은 테넌트 관리자는 200 + 본문 (2026-10-05 정책: 관리자 본문 열람 허용).</li>
 *   <li>다른 테넌트 관리자·내담자는 403, 미인증은 401.</li>
 *   <li>허용·거부 모두 열람 감사 로그가 남는다.</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@DisplayName("상담일지 본문 열람 — 작성자 기준 판정 + 감사 로그")
class ConsultationLogAuthorScopeMvcTest {

    private static final String TENANT_A = "tenant-author-a";
    /** .dev 재현 케이스: 일정 502 의 일지 작성자는 22, 재배정된 새 담당 상담사는 3. */
    private static final long SCHEDULE_ID = 502L;
    private static final long AUTHOR_CONSULTANT = 22L;
    private static final long REASSIGNED_CONSULTANT = 3L;
    private static final long CLIENT_ID = 20L;
    private static final long ADMIN_ID = 1L;
    private static final long RECORD_ID = 9001L;
    private static final long OTHER_CONSULTANT = 77L;
    private static final long EMPTY_SCHEDULE_ID = 503L;
    private static final String TENANT_B = "tenant-author-b";

    private static final String LIST_URI = "/api/v1/schedules/consultation-records";
    private static final String BODY_TEXT = "본문 유출 감지 문구 — 주요 이슈";

    private ConsultationRecordService consultationRecordService;
    private ConsultationRecordAccessLogService accessLogService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() throws Exception {
        SecurityContextHolder.clearContext();
        TenantContextHolder.clear();
        consultationRecordService = mock(ConsultationRecordService.class);
        accessLogService = mock(ConsultationRecordAccessLogService.class);
        ConsultationRecordRepository recordRepository = mock(ConsultationRecordRepository.class);
        ScheduleRepository scheduleRepository = mock(ScheduleRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        ConsultantClientMappingRepository mappingRepository = mock(ConsultantClientMappingRepository.class);
        DynamicPermissionService dynamicPermissionService = mock(DynamicPermissionService.class);

        ClientPathAccessGuard clientGuard = new ClientPathAccessGuard(mappingRepository, userRepository);
        ConsultationRecordAccessGuard logGuard = new ConsultationRecordAccessGuard(clientGuard,
            mock(ClinicalReportRepository.class), accessLogService, recordRepository,
            mock(InstitutionLinkConsultationLogRepository.class), scheduleRepository);
        when(dynamicPermissionService.hasPermission(any(User.class), anyString())).thenReturn(true);

        Object[] provided = {clientGuard, logGuard, consultationRecordService, recordRepository,
            scheduleRepository, userRepository, dynamicPermissionService, objectMapper()};
        mockMvc = MockMvcBuilders.standaloneSetup(build(ScheduleController.class, provided))
            .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
            .addFilter(new SecurityHeaderFilter())
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();

        for (long id : new long[] {AUTHOR_CONSULTANT, REASSIGNED_CONSULTANT, CLIENT_ID, ADMIN_ID}) {
            when(userRepository.findByTenantIdAndId(TENANT_A, id)).thenReturn(Optional.of(new User()));
        }
        // 일정은 재배정되어 현재 담당자가 3 이다 — 그래도 일지 작성자는 22 다.
        Schedule schedule = new Schedule();
        schedule.setId(SCHEDULE_ID);
        schedule.setTenantId(TENANT_A);
        schedule.setConsultantId(REASSIGNED_CONSULTANT);
        schedule.setClientId(CLIENT_ID);
        when(scheduleRepository.findByTenantIdAndId(TENANT_A, SCHEDULE_ID)).thenReturn(Optional.of(schedule));

        ConsultationRecord record = record();
        when(recordRepository.findActiveForScheduleSsot(TENANT_A, SCHEDULE_ID)).thenReturn(List.of(record));
        when(recordRepository.findByTenantIdAndConsultationIdAndIsDeletedFalse(TENANT_A, SCHEDULE_ID))
            .thenReturn(List.of(record));
        // 일지가 없는 일정 (작성 화면 진입용 빈 목록 판정)
        Schedule emptySchedule = new Schedule();
        emptySchedule.setId(EMPTY_SCHEDULE_ID);
        emptySchedule.setTenantId(TENANT_A);
        emptySchedule.setConsultantId(REASSIGNED_CONSULTANT);
        emptySchedule.setClientId(CLIENT_ID);
        when(scheduleRepository.findByTenantIdAndId(TENANT_A, EMPTY_SCHEDULE_ID))
            .thenReturn(Optional.of(emptySchedule));
        when(recordRepository.findActiveForScheduleSsot(TENANT_A, EMPTY_SCHEDULE_ID)).thenReturn(List.of());
        when(consultationRecordService.getConsultationRecordsByConsultationId(anyLong()))
            .thenReturn(List.of(record));
        // 감사 로그 서비스는 mock 이므로 buildCommand 가 실제 커맨드를 돌려주도록 위임한다.
        when(accessLogService.buildCommand(any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenAnswer(invocation -> {
                User caller = invocation.getArgument(0);
                return new ConsultationRecordAccessLogService.ConsultationRecordAccessCommand(
                    invocation.getArgument(1), invocation.getArgument(3), invocation.getArgument(2),
                    invocation.getArgument(4), invocation.getArgument(5),
                    caller == null ? null : caller.getId(),
                    caller == null || caller.getRole() == null ? null : caller.getRole().name(),
                    invocation.getArgument(6), invocation.getArgument(7), invocation.getArgument(8),
                    null, null);
            });
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName(".dev 재현 — consultationId=502&consultantId=3 (현재 담당·비작성자) 은 403, 본문 없음")
    void reassignedConsultant_forbidden() throws Exception {
        call(HttpMethod.GET, LIST_URI + "?consultationId=" + SCHEDULE_ID
                + "&consultantId=" + REASSIGNED_CONSULTANT,
            user(REASSIGNED_CONSULTANT, UserRole.CONSULTANT, TENANT_A))
            .andExpect(status().isForbidden())
            .andExpect(content().string(not(containsString(BODY_TEXT))));
    }

    @Test
    @DisplayName("요청 consultantId 는 판정에 쓰이지 않는다 — 작성자 id 를 넣어도 403")
    void requestConsultantIdParam_isIgnored() throws Exception {
        call(HttpMethod.GET, LIST_URI + "?consultationId=" + SCHEDULE_ID
                + "&consultantId=" + AUTHOR_CONSULTANT,
            user(REASSIGNED_CONSULTANT, UserRole.CONSULTANT, TENANT_A))
            .andExpect(status().isForbidden())
            .andExpect(content().string(not(containsString(BODY_TEXT))));
    }

    @Test
    @DisplayName("담당도 작성자도 아닌 다른 상담사는 403")
    void otherConsultant_forbidden() throws Exception {
        call(HttpMethod.GET, LIST_URI + "?consultationId=" + SCHEDULE_ID,
            user(OTHER_CONSULTANT, UserRole.CONSULTANT, TENANT_A))
            .andExpect(status().isForbidden())
            .andExpect(content().string(not(containsString(BODY_TEXT))));
    }

    @Test
    @DisplayName("작성 상담사는 200 + 본문")
    void author_readsBody() throws Exception {
        call(HttpMethod.GET, LIST_URI + "?consultationId=" + SCHEDULE_ID,
            user(AUTHOR_CONSULTANT, UserRole.CONSULTANT, TENANT_A))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.records.length()").value(1))
            .andExpect(jsonPath("$.data.records[0].mainIssues").value(BODY_TEXT));
    }

    @Test
    @DisplayName("같은 테넌트 관리자는 200 + 본문")
    void sameTenantAdmin_readsBody() throws Exception {
        call(HttpMethod.GET, LIST_URI + "?consultationId=" + SCHEDULE_ID,
            user(ADMIN_ID, UserRole.ADMIN, TENANT_A))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.records.length()").value(1))
            .andExpect(jsonPath("$.data.records[0].mainIssues").value(BODY_TEXT));
    }

    @Test
    @DisplayName("다른 테넌트 관리자는 403 이고 본문이 없다")
    void otherTenantAdmin_forbidden() throws Exception {
        call(HttpMethod.GET, LIST_URI + "?consultationId=" + SCHEDULE_ID,
            user(ADMIN_ID, UserRole.ADMIN, TENANT_B))
            .andExpect(status().isForbidden())
            .andExpect(content().string(not(containsString(BODY_TEXT))));
    }

    @Test
    @DisplayName("일지가 없는 일정 — 담당 상담사는 200 빈 목록(작성 진입), 다른 상담사는 403")
    void emptySchedule_assignedConsultantOnly() throws Exception {
        call(HttpMethod.GET, LIST_URI + "?consultationId=" + EMPTY_SCHEDULE_ID,
            user(REASSIGNED_CONSULTANT, UserRole.CONSULTANT, TENANT_A))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.records.length()").value(0));
        call(HttpMethod.GET, LIST_URI + "?consultationId=" + EMPTY_SCHEDULE_ID,
            user(OTHER_CONSULTANT, UserRole.CONSULTANT, TENANT_A))
            .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("내담자는 403 이고 본문이 응답에 없다")
    void client_forbidden() throws Exception {
        call(HttpMethod.GET, LIST_URI + "?consultationId=" + SCHEDULE_ID,
            user(CLIENT_ID, UserRole.CLIENT, TENANT_A))
            .andExpect(status().isForbidden())
            .andExpect(content().string(not(containsString(BODY_TEXT))));
    }

    @Test
    @DisplayName("미인증은 401 이고 서비스가 호출되지 않는다")
    void unauthenticated() throws Exception {
        mockMvc.perform(request(HttpMethod.GET, LIST_URI + "?consultationId=" + SCHEDULE_ID))
            .andExpect(status().isUnauthorized());
    }

    // ---- 감사 로그 ----

    @Test
    @DisplayName("허용 열람에 감사 로그(LIST/ALLOWED)가 남는다")
    void audit_allowed() throws Exception {
        call(HttpMethod.GET, LIST_URI + "?consultationId=" + SCHEDULE_ID,
            user(AUTHOR_CONSULTANT, UserRole.CONSULTANT, TENANT_A))
            .andExpect(status().isOk());
        assertAudited(ConsultationRecordAccessAudit.ACTION_LIST,
            ConsultationRecordAccessAudit.RESULT_ALLOWED, AUTHOR_CONSULTANT);
    }

    @Test
    @DisplayName("거부된 열람에도 감사 로그(LIST/DENIED)가 남는다")
    void audit_denied() throws Exception {
        call(HttpMethod.GET, LIST_URI + "?consultationId=" + SCHEDULE_ID,
            user(CLIENT_ID, UserRole.CLIENT, TENANT_A))
            .andExpect(status().isForbidden());
        assertAudited(ConsultationRecordAccessAudit.ACTION_LIST,
            ConsultationRecordAccessAudit.RESULT_DENIED, CLIENT_ID);
    }

    // ---- helpers ----

    private void assertAudited(String action, String result, long actorId) {
        ArgumentCaptor<ConsultationRecordAccessLogService.ConsultationRecordAccessCommand> captor =
            ArgumentCaptor.forClass(ConsultationRecordAccessLogService.ConsultationRecordAccessCommand.class);
        verify(accessLogService, timeout(2000).atLeastOnce()).record(captor.capture());
        boolean matched = captor.getAllValues().stream()
            .anyMatch(c -> action.equals(c.action()) && result.equals(c.result())
                && c.actorId() != null && c.actorId() == actorId);
        org.junit.jupiter.api.Assertions.assertTrue(matched,
            "기대한 감사 로그가 없습니다: action=" + action + ", result=" + result
                + ", actorId=" + actorId + ", 기록=" + captor.getAllValues());
    }

    private ResultActions call(HttpMethod method, String uri, User caller) throws Exception {
        return mockMvc.perform(request(method, uri).session(session(caller)).with(r -> {
            TenantContextHolder.setTenantId(caller.getTenantId());
            return r;
        }));
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

    private static ConsultationRecord record() {
        ConsultationRecord r = new ConsultationRecord();
        r.setId(RECORD_ID);
        r.setTenantId(TENANT_A);
        r.setConsultantId(AUTHOR_CONSULTANT);
        r.setClientId(CLIENT_ID);
        r.setConsultationId(SCHEDULE_ID);
        r.setSessionDate(LocalDate.of(2026, 10, 1));
        r.setSessionNumber(1);
        r.setIsSessionCompleted(Boolean.TRUE);
        r.setIsDeleted(false);
        r.setMainIssues(BODY_TEXT);
        r.setClientCondition(BODY_TEXT);
        r.setConsultantObservations(BODY_TEXT);
        return r;
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

    private static ObjectMapper objectMapper() {
        return new ObjectMapper().registerModule(new JavaTimeModule());
    }
}
