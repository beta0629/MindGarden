package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.lang.reflect.Constructor;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.coresolution.consultation.constant.PaymentTimingConstants;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.entity.InstitutionLinkConsultationLog;
import com.coresolution.consultation.entity.InstitutionLinkContract;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.GlobalExceptionHandler;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.ClinicalReportRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.InstitutionLinkConsultationLogRepository;
import com.coresolution.consultation.repository.InstitutionLinkContractRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.ConsultationRecordCreateRequestValidator;
import com.coresolution.consultation.service.ConsultationRecordService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.InstitutionLinkConsultationLogWriteRouter;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.service.impl.InstitutionLinkConsultationLogServiceImpl;
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
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * 상담일지 작성 권한 우회 차단 (PR R · A).
 *
 * <p>컨트롤러 → 실제 공용 가드 → 실제 라우터·타기관 서비스까지 HTTP 로 확인한다. 리포지토리만 목이다.</p>
 * <ul>
 *   <li>본문에 {@code contractId}·{@code mappingId} 등 타기관 표시가 있어도 컨트롤러 가드를 건너뛰지 않는다.</li>
 *   <li>일정이 없는 타기관 본문은 서비스가 매핑·계약 담당자로 다시 판정한다(이중 방어).</li>
 *   <li>타기관 일지 직접 작성·수정·완료 API 도 같은 가드.</li>
 *   <li>상담일지 삭제는 존재 확인보다 권한이 먼저 — 없는 id·남의 id 모두 같은 403.</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("상담일지 작성 권한 우회 차단 — 타기관 표시·서비스 이중 방어·삭제 선검사")
class InstitutionLinkConsultationLogCreateGuardMvcTest {

    private static final String TENANT_A = "tenant-il-guard-a";
    private static final String TENANT_B = "tenant-il-guard-b";
    private static final long SCHEDULE_ID = 610L;
    private static final long OTHER_SCHEDULE_ID = 611L;
    private static final long ASSIGNEE = 22L;
    private static final long OTHER_CONSULTANT = 77L;
    private static final long CLIENT_ID = 20L;
    private static final long OTHER_CLIENT_ID = 21L;
    private static final long ADMIN_ID = 1L;
    private static final long ADMIN_B = 5L;
    private static final long CONTRACT_ID = 700L;
    private static final long OTHER_CLIENT_CONTRACT_ID = 701L;
    private static final long MAPPING_ID = 800L;
    private static final long IL_LOG_ID = 900L;
    private static final long RECORD_ID = 9100L;
    private static final long MISSING_RECORD_ID = 9199L;

    private static final String SCHEDULE_CREATE_URI = "/api/v1/schedules/consultation-records";
    private static final String IL_URI = "/api/v1/institution-link/consultation-records";
    private static final String BODY_TEXT = "본문 유출 감지 문구";

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    private MockMvc mockMvc;
    private InstitutionLinkConsultationLogRepository logRepository;
    private InstitutionLinkContractRepository contractRepository;
    private ConsultationRecordService consultationRecordService;
    private ConsultationRecordRepository recordRepository;

    @BeforeEach
    void setUp() throws Exception {
        SecurityContextHolder.clearContext();
        TenantContextHolder.clear();

        logRepository = mock(InstitutionLinkConsultationLogRepository.class);
        contractRepository = mock(InstitutionLinkContractRepository.class);
        recordRepository = mock(ConsultationRecordRepository.class);
        consultationRecordService = mock(ConsultationRecordService.class);
        ConsultantClientMappingRepository mappingRepository = mock(ConsultantClientMappingRepository.class);
        ScheduleRepository scheduleRepository = mock(ScheduleRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        ClientRepository clientRepository = mock(ClientRepository.class);
        ConsultationRecordAccessLogService accessLogService = mock(ConsultationRecordAccessLogService.class);
        DynamicPermissionService dynamicPermissionService = mock(DynamicPermissionService.class);
        when(dynamicPermissionService.hasPermission(any(User.class), anyString())).thenReturn(true);

        ClientPathAccessGuard clientGuard = new ClientPathAccessGuard(mappingRepository, userRepository);
        ConsultationRecordAccessGuard logGuard = new ConsultationRecordAccessGuard(clientGuard,
            mock(ClinicalReportRepository.class), accessLogService, recordRepository, logRepository,
            scheduleRepository);
        InstitutionLinkConsultationLogServiceImpl ilService = build(InstitutionLinkConsultationLogServiceImpl.class,
            logRepository, contractRepository, mappingRepository, clientRepository, mock(ScheduleService.class),
            logGuard);
        InstitutionLinkConsultationLogWriteRouter router = new InstitutionLinkConsultationLogWriteRouter(
            ilService, consultationRecordService, mappingRepository, contractRepository, clientRepository,
            new ConsultationRecordCreateRequestValidator());

        Object[] provided = {clientGuard, logGuard, ilService, router, consultationRecordService, recordRepository,
            scheduleRepository, userRepository, dynamicPermissionService, objectMapper};
        mockMvc = MockMvcBuilders.standaloneSetup(
                build(ScheduleController.class, provided),
                build(InstitutionLinkConsultationLogController.class, provided),
                build(ConsultantRecordsController.class, provided))
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();

        when(scheduleRepository.findByTenantIdAndId(TENANT_A, SCHEDULE_ID))
            .thenReturn(Optional.of(schedule(SCHEDULE_ID, ASSIGNEE, CLIENT_ID)));
        when(scheduleRepository.findByTenantIdAndId(TENANT_A, OTHER_SCHEDULE_ID))
            .thenReturn(Optional.of(schedule(OTHER_SCHEDULE_ID, OTHER_CONSULTANT, OTHER_CLIENT_ID)));
        when(contractRepository.findByTenantIdAndIdAndIsDeletedFalse(TENANT_A, CONTRACT_ID))
            .thenReturn(Optional.of(contract(CONTRACT_ID, ASSIGNEE, CLIENT_ID)));
        when(contractRepository.findByTenantIdAndIdAndIsDeletedFalse(TENANT_A, OTHER_CLIENT_CONTRACT_ID))
            .thenReturn(Optional.of(contract(OTHER_CLIENT_CONTRACT_ID, OTHER_CONSULTANT, OTHER_CLIENT_ID)));
        when(mappingRepository.findByTenantIdAndId(TENANT_A, MAPPING_ID)).thenReturn(Optional.of(mapping()));
        when(logRepository.save(any(InstitutionLinkConsultationLog.class))).thenAnswer(inv -> {
            InstitutionLinkConsultationLog saved = inv.getArgument(0);
            if (saved.getId() == null) {
                saved.setId(IL_LOG_ID);
            }
            return saved;
        });
        when(logRepository.findByTenantIdAndIdAndIsDeletedFalse(TENANT_A, IL_LOG_ID))
            .thenReturn(Optional.of(existingLog()));
        when(recordRepository.findByTenantIdAndId(TENANT_A, RECORD_ID)).thenReturn(Optional.of(record()));
        when(recordRepository.findByTenantIdAndId(TENANT_A, MISSING_RECORD_ID)).thenReturn(Optional.empty());
        when(accessLogService.buildCommand(any(), any(), any(), any(), any(), any(), any(), any(), any()))
            .thenAnswer(invocation -> new ConsultationRecordAccessLogService.ConsultationRecordAccessCommand(
                invocation.getArgument(1), invocation.getArgument(3), invocation.getArgument(2),
                invocation.getArgument(4), invocation.getArgument(5), null, null,
                invocation.getArgument(6), invocation.getArgument(7), invocation.getArgument(8), null, null));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    // ---- A1: 일정 API 에 타기관 표시를 넣어 가드를 건너뛰려는 시도 ----

    @Test
    @DisplayName("contractId + 남의 일정 — 다른 상담사 403, 계약 조회·저장 없음(서비스 미호출)")
    void contractMarker_otherConsultantOnAssigneeSchedule_forbidden() throws Exception {
        Map<String, Object> body = ilPayload(CONTRACT_ID, null, ASSIGNEE);
        body.put("consultationId", SCHEDULE_ID);
        assertDenied(callJson(HttpMethod.POST, SCHEDULE_CREATE_URI, body,
            user(OTHER_CONSULTANT, UserRole.CONSULTANT, TENANT_A)));
        verify(contractRepository, never()).findByTenantIdAndIdAndIsDeletedFalse(anyString(), anyLong());
        verify(logRepository, never()).save(any());
        verify(consultationRecordService, never()).createConsultationRecord(any(), any());
    }

    @Test
    @DisplayName("contractId·일정 없음 — 다른 상담사가 본문 상담사를 본인/담당자로 넣어도 서비스 계층 403, 저장 없음")
    void contractMarker_noSchedule_otherConsultant_serviceDenies() throws Exception {
        User other = user(OTHER_CONSULTANT, UserRole.CONSULTANT, TENANT_A);
        for (long consultantInBody : List.of(OTHER_CONSULTANT, ASSIGNEE)) {
            assertDenied(callJson(HttpMethod.POST, SCHEDULE_CREATE_URI,
                ilPayload(CONTRACT_ID, null, consultantInBody), other));
        }
        verify(logRepository, never()).save(any());
    }

    @Test
    @DisplayName("contractId + 본인 일정 — 다른 내담자의 계약을 붙이면 403 (본인 일정이어도 계약 담당 아님)")
    void contractMarker_ownSchedule_otherClientsContract_forbidden() throws Exception {
        Map<String, Object> body = ilPayload(OTHER_CLIENT_CONTRACT_ID, null, ASSIGNEE);
        body.put("consultationId", SCHEDULE_ID);
        assertDenied(callJson(HttpMethod.POST, SCHEDULE_CREATE_URI, body,
            user(ASSIGNEE, UserRole.CONSULTANT, TENANT_A)));
        verify(logRepository, never()).save(any());
    }

    @Test
    @DisplayName("mappingId(타기관 매핑) 표시 — 다른 상담사 403, 저장 없음")
    void mappingMarker_otherConsultant_forbidden() throws Exception {
        assertDenied(callJson(HttpMethod.POST, SCHEDULE_CREATE_URI, ilPayload(null, MAPPING_ID, OTHER_CONSULTANT),
            user(OTHER_CONSULTANT, UserRole.CONSULTANT, TENANT_A)));
        verify(logRepository, never()).save(any());
    }

    @Test
    @DisplayName("contractId 표시 — 내담자 403, 매핑·계약 조회 전 거부")
    void contractMarker_client_forbiddenBeforeLookup() throws Exception {
        assertDenied(callJson(HttpMethod.POST, SCHEDULE_CREATE_URI, ilPayload(CONTRACT_ID, null, ASSIGNEE),
            user(CLIENT_ID, UserRole.CLIENT, TENANT_A)));
        verify(contractRepository, never()).findByTenantIdAndIdAndIsDeletedFalse(anyString(), anyLong());
        verify(logRepository, never()).save(any());
    }

    @Test
    @DisplayName("contractId 표시 — 다른 테넌트 관리자 403 (일정 있음·없음 모두), id 존재 비노출")
    void contractMarker_otherTenantAdmin_forbidden() throws Exception {
        User adminB = user(ADMIN_B, UserRole.ADMIN, TENANT_B);
        Map<String, Object> withSchedule = ilPayload(CONTRACT_ID, null, ASSIGNEE);
        withSchedule.put("consultationId", SCHEDULE_ID);
        assertDenied(callJson(HttpMethod.POST, SCHEDULE_CREATE_URI, withSchedule, adminB));
        assertDenied(callJson(HttpMethod.POST, SCHEDULE_CREATE_URI, ilPayload(CONTRACT_ID, null, ASSIGNEE), adminB));
        verify(logRepository, never()).save(any());
    }

    @Test
    @DisplayName("회귀 — 담당 상담사(일정 포함)·같은 테넌트 관리자(일정 없음) 201, 일지는 담당 상담사 귀속")
    void contractMarker_assigneeAndAdmin_created() throws Exception {
        Map<String, Object> body = ilPayload(CONTRACT_ID, null, ASSIGNEE);
        body.put("consultationId", SCHEDULE_ID);
        callJson(HttpMethod.POST, SCHEDULE_CREATE_URI, body, user(ASSIGNEE, UserRole.CONSULTANT, TENANT_A))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.consultantId").value(ASSIGNEE));
        callJson(HttpMethod.POST, SCHEDULE_CREATE_URI, ilPayload(CONTRACT_ID, null, ASSIGNEE),
            user(ADMIN_ID, UserRole.ADMIN, TENANT_A))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.consultantId").value(ASSIGNEE));
    }

    @Test
    @DisplayName("회귀 — 담당 상담사가 매핑으로 작성 201 (계약 상담사가 바뀌기 전 값이어도 매핑 담당으로 판정)")
    void mappingMarker_assignee_created() throws Exception {
        callJson(HttpMethod.POST, SCHEDULE_CREATE_URI, ilPayload(null, MAPPING_ID, ASSIGNEE),
            user(ASSIGNEE, UserRole.CONSULTANT, TENANT_A))
            .andExpect(status().isCreated());
    }

    // ---- A2: 타기관 직접 API ----

    @Test
    @DisplayName("타기관 직접 작성 — 다른 상담사·내담자·다른 테넌트 관리자 403, 담당 상담사 201")
    void institutionLinkDirectCreate_matrix() throws Exception {
        Map<String, Object> body = ilPayload(CONTRACT_ID, null, ASSIGNEE);
        for (User denied : List.of(user(OTHER_CONSULTANT, UserRole.CONSULTANT, TENANT_A),
                user(CLIENT_ID, UserRole.CLIENT, TENANT_A), user(ADMIN_B, UserRole.ADMIN, TENANT_B))) {
            assertDenied(callJson(HttpMethod.POST, IL_URI, body, denied));
        }
        verify(logRepository, never()).save(any());
        callJson(HttpMethod.POST, IL_URI, body, user(ASSIGNEE, UserRole.CONSULTANT, TENANT_A))
            .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("타기관 수정·완료 — 다른 상담사·내담자 403(본문 불변), 작성 상담사 200")
    void institutionLinkEditAndComplete_matrix() throws Exception {
        Map<String, Object> edit = ilPayload(CONTRACT_ID, null, ASSIGNEE);
        for (User denied : List.of(user(OTHER_CONSULTANT, UserRole.CONSULTANT, TENANT_A),
                user(CLIENT_ID, UserRole.CLIENT, TENANT_A))) {
            assertDenied(callJson(HttpMethod.PUT, IL_URI + "/" + IL_LOG_ID, edit, denied));
            assertDenied(callJson(HttpMethod.POST, IL_URI + "/" + IL_LOG_ID + "/complete", Map.of(), denied));
        }
        verify(logRepository, never()).save(any());
        callJson(HttpMethod.PUT, IL_URI + "/" + IL_LOG_ID, edit, user(ASSIGNEE, UserRole.CONSULTANT, TENANT_A))
            .andExpect(status().isOk());
    }

    // ---- A3: 삭제는 권한 먼저 ----

    @Test
    @DisplayName("삭제 — 없는 id·남의 id 모두 같은 403 문구(존재 비노출), 내담자는 조회 전 403, 서비스 미호출")
    void delete_permissionBeforeExistence() throws Exception {
        callJson(HttpMethod.DELETE, deleteUri(MISSING_RECORD_ID), Map.of(), user(CLIENT_ID, UserRole.CLIENT, TENANT_A))
            .andExpect(status().isForbidden());
        verify(recordRepository, never()).findByTenantIdAndId(anyString(), anyLong());

        User other = user(OTHER_CONSULTANT, UserRole.CONSULTANT, TENANT_A);
        String missing = callJson(HttpMethod.DELETE, deleteUri(MISSING_RECORD_ID), Map.of(), other)
            .andExpect(status().isForbidden())
            .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        String othersRecord = callJson(HttpMethod.DELETE, deleteUri(RECORD_ID), Map.of(), other)
            .andExpect(status().isForbidden())
            .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertThat(messageOf(missing)).isEqualTo(messageOf(othersRecord))
            .isEqualTo(ConsultationRecordAccessGuard.DENIAL_RECORD_UNAVAILABLE);
        assertThat(objectMapper.readTree(missing).path("errorCode"))
            .isEqualTo(objectMapper.readTree(othersRecord).path("errorCode"));
        assertThat(missing + othersRecord).doesNotContain(BODY_TEXT);

        verify(consultationRecordService, never()).deleteConsultationRecord(anyLong(), anyLong(), any());
    }

    @Test
    @DisplayName("삭제 회귀 — 작성 상담사 200 (서비스 호출)")
    void delete_author_ok() throws Exception {
        callJson(HttpMethod.DELETE, deleteUri(RECORD_ID), Map.of(), user(ASSIGNEE, UserRole.CONSULTANT, TENANT_A))
            .andExpect(status().isOk());
        verify(consultationRecordService).deleteConsultationRecord(eq(RECORD_ID), eq(SCHEDULE_ID), eq(3));
    }

    // ---- helpers ----

    private static String deleteUri(long recordId) {
        return "/api/v1/admin/consultant-records/" + ASSIGNEE + "/consultation-records/" + recordId
            + "?consultationId=" + SCHEDULE_ID + "&sessionNumber=3";
    }

    private String messageOf(String json) throws Exception {
        return objectMapper.readTree(json).path("message").asText();
    }

    private static void assertDenied(ResultActions result) throws Exception {
        String body = result.andExpect(status().isForbidden())
            .andExpect(jsonPath("$.data").doesNotExist())
            .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertThat(body).doesNotContain(BODY_TEXT);
    }

    private static Map<String, Object> ilPayload(Long contractId, Long mappingId, long consultantIdInBody) {
        Map<String, Object> payload = new LinkedHashMap<>();
        if (contractId != null) {
            payload.put("contractId", contractId);
        }
        if (mappingId != null) {
            payload.put("mappingId", mappingId);
        }
        payload.put("clientId", CLIENT_ID);
        payload.put("consultantId", consultantIdInBody);
        payload.put("sessionDate", "2026-10-01");
        payload.put("sessionDurationMinutes", 60);
        payload.put("clientCondition", "안정");
        payload.put("mainIssues", BODY_TEXT);
        payload.put("interventionMethods", "인지행동");
        payload.put("clientResponse", "긍정");
        payload.put("riskAssessment", "LOW");
        payload.put("progressEvaluation", "호전");
        payload.put("isSessionCompleted", false);
        return payload;
    }

    private static Schedule schedule(long id, long consultantId, long clientId) {
        Schedule s = new Schedule();
        s.setId(id);
        s.setTenantId(TENANT_A);
        s.setConsultantId(consultantId);
        s.setClientId(clientId);
        s.setDate(LocalDate.of(2026, 10, 1));
        s.setStatus(ScheduleStatus.CONFIRMED);
        s.setIsDeleted(false);
        return s;
    }

    private static InstitutionLinkContract contract(long id, long consultantId, long clientId) {
        InstitutionLinkContract c = InstitutionLinkContract.builder()
            .consultantId(consultantId)
            .clientId(clientId)
            .periodStart(LocalDate.of(2026, 9, 1))
            .status("ACTIVE")
            .build();
        c.setId(id);
        c.setTenantId(TENANT_A);
        return c;
    }

    private static ConsultantClientMapping mapping() {
        ConsultantClientMapping m = new ConsultantClientMapping();
        m.setId(MAPPING_ID);
        m.setTenantId(TENANT_A);
        m.setPaymentTiming(PaymentTimingConstants.INSTITUTION_LINK);
        m.setConsultant(user(ASSIGNEE, UserRole.CONSULTANT, TENANT_A));
        m.setClient(user(CLIENT_ID, UserRole.CLIENT, TENANT_A));
        return m;
    }

    private static InstitutionLinkConsultationLog existingLog() {
        InstitutionLinkConsultationLog log = InstitutionLinkConsultationLog.builder()
            .contractId(CONTRACT_ID)
            .clientId(CLIENT_ID)
            .consultantId(ASSIGNEE)
            .sessionDate(LocalDate.of(2026, 10, 1))
            .billingYearMonth("2026-10")
            .monthlyOccurrence(1)
            .mainIssues(BODY_TEXT)
            .isSessionCompleted(false)
            .build();
        log.setId(IL_LOG_ID);
        log.setTenantId(TENANT_A);
        log.setIsDeleted(false);
        return log;
    }

    private static ConsultationRecord record() {
        ConsultationRecord r = new ConsultationRecord();
        r.setId(RECORD_ID);
        r.setTenantId(TENANT_A);
        r.setConsultationId(SCHEDULE_ID);
        r.setConsultantId(ASSIGNEE);
        r.setClientId(CLIENT_ID);
        r.setSessionNumber(3);
        r.setIsDeleted(false);
        r.setMainIssues(BODY_TEXT);
        return r;
    }

    private ResultActions callJson(HttpMethod method, String uri, Map<String, Object> body, User caller)
            throws Exception {
        return mockMvc.perform(request(method, uri).session(session(caller))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(body))
            .with(r -> {
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
