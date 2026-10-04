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
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import com.coresolution.consultation.config.SecurityHeaderFilter;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.constant.consultation.ConsultationRecordAccessAudit;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.entity.ConsultationRecordEditAudit;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.GlobalExceptionHandler;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.ClinicalReportRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultationRecordEditAuditRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.InstitutionLinkConsultationLogRepository;
import com.coresolution.consultation.repository.InstitutionLinkContractRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.ConsultationRecordCreateRequestValidator;
import com.coresolution.consultation.service.ConsultationRecordDraftService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.InstitutionLinkConsultationLogService;
import com.coresolution.consultation.service.InstitutionLinkConsultationLogWriteRouter;
import com.coresolution.consultation.service.PlSqlConsultationRecordAlertService;
import com.coresolution.consultation.service.impl.ConsultationRecordServiceImpl;
import com.coresolution.consultation.service.support.ClientPathAccessGuard;
import com.coresolution.consultation.service.support.ConsultationRecordAccessGuard;
import com.coresolution.consultation.service.support.ConsultationRecordAccessLogService;
import com.coresolution.consultation.service.support.ConsultationRecordEditAuditService;
import com.coresolution.core.context.TenantContextHolder;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * 상담일지 작성·수정 — 공용 쓰기 가드 권한 매트릭스 + 관리자 대리 작성·수정 + 수정 감사 (PR M).
 *
 * <p>컨트롤러 → 실제 공용 가드 → 실제 서비스({@link ConsultationRecordServiceImpl}) → 실제 수정 감사 서비스까지
 * HTTP 로 확인한다. 리포지토리만 목이다.</p>
 * <ul>
 *   <li>작성: 미인증 401, 내담자·담당 아닌 상담사·다른 테넌트 관리자 403, 같은 테넌트 관리자·담당 상담사 201.</li>
 *   <li>관리자 작성 시 {@code consultant_id} = 일정 담당 상담사, {@code created_by_*} = 관리자.</li>
 *   <li>수정: 미인증 401, 내담자·다른 상담사·다른 테넌트 관리자 403, 같은 테넌트 관리자·작성 상담사 200
 *       (일정 API·관리자 API 둘 다).</li>
 *   <li>작성·수정 성공 1건당 감사 1행, 바뀐 필드명만 — 본문 문구가 감사 행 어디에도 없다.</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@DisplayName("상담일지 작성·수정 — 공용 쓰기 가드 + 관리자 대리 작성 + 수정 감사")
class ConsultationLogAdminWriteMvcTest {

    private static final String TENANT_A = "tenant-write-a";
    private static final String TENANT_B = "tenant-write-b";
    private static final long SCHEDULE_ID = 502L;
    private static final long ASSIGNEE = 22L;
    private static final long OTHER_CONSULTANT = 77L;
    private static final long CLIENT_ID = 20L;
    private static final long ADMIN_ID = 1L;
    private static final long STAFF_ID = 2L;
    private static final long ADMIN_B = 5L;
    private static final long RECORD_ID = 9001L;
    private static final int SESSION_NUMBER = 3;

    private static final String CREATE_URI = "/api/v1/schedules/consultation-records";
    private static final String SCHEDULE_EDIT_URI = "/api/v1/schedules/consultation-records/" + RECORD_ID;
    private static final String ADMIN_EDIT_URI = "/api/v1/admin/consultation-records/" + RECORD_ID;

    private static final String BODY_CREATE = "작성 본문 유출 감지 문구";
    private static final String BODY_EDIT = "수정 본문 유출 감지 문구";

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    private MockMvc mockMvc;
    private ConsultationRecordRepository recordRepository;
    private ConsultationRecordDraftService draftService;
    private final Map<Long, ConsultationRecord> store = new HashMap<>();
    private final List<ConsultationRecordEditAudit> audits = new ArrayList<>();

    @BeforeEach
    void setUp() throws Exception {
        SecurityContextHolder.clearContext();
        TenantContextHolder.clear();
        store.clear();
        audits.clear();

        recordRepository = mock(ConsultationRecordRepository.class);
        ScheduleRepository scheduleRepository = mock(ScheduleRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        ConsultationRecordEditAuditRepository auditRepository = mock(ConsultationRecordEditAuditRepository.class);
        ConsultationRecordAccessLogService accessLogService = mock(ConsultationRecordAccessLogService.class);
        PlSqlConsultationRecordAlertService alertService = mock(PlSqlConsultationRecordAlertService.class);
        DynamicPermissionService dynamicPermissionService = mock(DynamicPermissionService.class);
        draftService = mock(ConsultationRecordDraftService.class);

        ClientPathAccessGuard clientGuard = new ClientPathAccessGuard(
            mock(ConsultantClientMappingRepository.class), userRepository);
        ConsultationRecordAccessGuard logGuard = new ConsultationRecordAccessGuard(clientGuard,
            mock(ClinicalReportRepository.class), accessLogService, recordRepository,
            mock(InstitutionLinkConsultationLogRepository.class), scheduleRepository);

        ConsultationRecordServiceImpl recordService = new ConsultationRecordServiceImpl();
        ReflectionTestUtils.setField(recordService, "consultationRecordRepository", recordRepository);
        ReflectionTestUtils.setField(recordService, "scheduleRepository", scheduleRepository);
        ReflectionTestUtils.setField(recordService, "consultationRecordAlertService", alertService);
        ReflectionTestUtils.setField(recordService, "consultationRecordDraftService", draftService);
        ReflectionTestUtils.setField(recordService, "consultationRecordEditAuditService",
            new ConsultationRecordEditAuditService(auditRepository));

        InstitutionLinkConsultationLogWriteRouter router = new InstitutionLinkConsultationLogWriteRouter(
            mock(InstitutionLinkConsultationLogService.class), recordService,
            mock(ConsultantClientMappingRepository.class), mock(InstitutionLinkContractRepository.class),
            mock(ClientRepository.class), new ConsultationRecordCreateRequestValidator());
        when(dynamicPermissionService.hasPermission(any(User.class), anyString())).thenReturn(true);

        Object[] provided = {clientGuard, logGuard, recordService, router, recordRepository, scheduleRepository,
            userRepository, dynamicPermissionService, objectMapper};
        mockMvc = MockMvcBuilders.standaloneSetup(
                build(ScheduleController.class, provided), build(AdminController.class, provided))
            .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
            .addFilter(new SecurityHeaderFilter())
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();

        Schedule schedule = new Schedule();
        schedule.setId(SCHEDULE_ID);
        schedule.setTenantId(TENANT_A);
        schedule.setConsultantId(ASSIGNEE);
        schedule.setClientId(CLIENT_ID);
        schedule.setDate(LocalDate.of(2026, 10, 1));
        schedule.setSessionSequence(SESSION_NUMBER);
        schedule.setStatus(ScheduleStatus.CONFIRMED);
        schedule.setIsDeleted(false);
        when(scheduleRepository.findByTenantIdAndId(TENANT_A, SCHEDULE_ID)).thenReturn(Optional.of(schedule));

        AtomicLong ids = new AtomicLong(RECORD_ID);
        when(recordRepository.save(any(ConsultationRecord.class))).thenAnswer(inv -> {
            ConsultationRecord r = inv.getArgument(0);
            if (r.getId() == null) {
                r.setId(ids.getAndIncrement());
            }
            store.put(r.getId(), r);
            return r;
        });
        when(recordRepository.findByTenantIdAndId(eq(TENANT_A), anyLong()))
            .thenAnswer(inv -> Optional.ofNullable(store.get(inv.<Long>getArgument(1))));
        when(auditRepository.save(any(ConsultationRecordEditAudit.class))).thenAnswer(inv -> {
            ConsultationRecordEditAudit a = inv.getArgument(0);
            audits.add(a);
            return a;
        });
        when(alertService.resolveConsultationRecordAlert(anyLong(), any())).thenReturn(Map.of("success", true));
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

    // ---- 작성 ----

    @Test
    @DisplayName("작성 — 미인증 401, 저장 없음")
    void create_anonymous_unauthorized() throws Exception {
        mockMvc.perform(request(HttpMethod.POST, CREATE_URI).contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createPayload(ASSIGNEE))))
            .andExpect(status().isUnauthorized());
        verify(recordRepository, never()).save(any());
    }

    @Test
    @DisplayName("작성 — 내담자·담당 아닌 상담사·다른 테넌트 관리자 403, 저장 없음")
    void create_forbiddenCallers() throws Exception {
        callJson(HttpMethod.POST, CREATE_URI, createPayload(ASSIGNEE), user(CLIENT_ID, UserRole.CLIENT, TENANT_A))
            .andExpect(status().isForbidden());
        callJson(HttpMethod.POST, CREATE_URI, createPayload(OTHER_CONSULTANT),
            user(OTHER_CONSULTANT, UserRole.CONSULTANT, TENANT_A))
            .andExpect(status().isForbidden());
        callJson(HttpMethod.POST, CREATE_URI, createPayload(ASSIGNEE), user(ADMIN_B, UserRole.ADMIN, TENANT_B))
            .andExpect(status().isForbidden());
        verify(recordRepository, never()).save(any());
        assertThat(audits).isEmpty();
    }

    @Test
    @DisplayName("작성 — 같은 테넌트 관리자 201: consultant_id = 일정 담당 상담사, created_by = 관리자, 감사 1행")
    void create_sameTenantAdmin_attributesToScheduleConsultant() throws Exception {
        // 요청 본문의 consultantId 를 관리자 id 로 넣어도 일지는 일정 담당 상담사 귀속이다.
        callJson(HttpMethod.POST, CREATE_URI, createPayload(ADMIN_ID), user(ADMIN_ID, UserRole.ADMIN, TENANT_A))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.consultantId").value(ASSIGNEE))
            .andExpect(jsonPath("$.data.writtenByAdmin").value(true))
            .andExpect(jsonPath("$.data.lastEditedById").value(ADMIN_ID))
            .andExpect(jsonPath("$.data.lastEditedByRole").value(UserRole.ADMIN.name()));

        ConsultationRecord saved = store.get(RECORD_ID);
        assertThat(saved.getConsultantId()).isEqualTo(ASSIGNEE);
        assertThat(saved.getClientId()).isEqualTo(CLIENT_ID);
        assertThat(saved.getCreatedByUserId()).isEqualTo(ADMIN_ID);
        assertThat(saved.getCreatedByRole()).isEqualTo(UserRole.ADMIN.name());
        assertThat(saved.getMainIssues()).isEqualTo(BODY_CREATE);

        assertThat(audits).hasSize(1);
        ConsultationRecordEditAudit audit = audits.get(0);
        assertThat(audit.getAction()).isEqualTo(ConsultationRecordAccessAudit.ACTION_CREATE);
        assertThat(audit.getTenantId()).isEqualTo(TENANT_A);
        assertThat(audit.getRecordId()).isEqualTo(RECORD_ID);
        assertThat(audit.getEditorId()).isEqualTo(ADMIN_ID);
        assertThat(audit.getEditorRole()).isEqualTo(UserRole.ADMIN.name());
        assertThat(audit.getChangedFields()).contains("mainIssues");
        assertNoBody(audit);

        // 초안은 작성자 본인 키 — 관리자 초안만 정리하고 담당 상담사 초안은 건드리지 않는다.
        verify(draftService).deleteDraft(TENANT_A, SCHEDULE_ID, ADMIN_ID);
        verify(draftService, never()).deleteDraft(TENANT_A, SCHEDULE_ID, ASSIGNEE);
    }

    @Test
    @DisplayName("작성 — 같은 테넌트 STAFF 도 관리자 계열로 201")
    void create_sameTenantStaff_created() throws Exception {
        callJson(HttpMethod.POST, CREATE_URI, createPayload(ASSIGNEE), user(STAFF_ID, UserRole.STAFF, TENANT_A))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.consultantId").value(ASSIGNEE));
        assertThat(store.get(RECORD_ID).getCreatedByUserId()).isEqualTo(STAFF_ID);
    }

    @Test
    @DisplayName("작성 회귀 — 담당 상담사 본인 201, created_by = 본인, 관리자 배지 없음, 본인 초안 정리")
    void create_assigneeConsultant_regression() throws Exception {
        callJson(HttpMethod.POST, CREATE_URI, createPayload(ASSIGNEE),
            user(ASSIGNEE, UserRole.CONSULTANT, TENANT_A))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.data.consultantId").value(ASSIGNEE))
            .andExpect(jsonPath("$.data.writtenByAdmin").value(false))
            .andExpect(jsonPath("$.data.editedByAdmin").value(false));
        ConsultationRecord saved = store.get(RECORD_ID);
        assertThat(saved.getCreatedByUserId()).isEqualTo(ASSIGNEE);
        assertThat(audits).hasSize(1);
        assertNoBody(audits.get(0));
        verify(draftService).deleteDraft(TENANT_A, SCHEDULE_ID, ASSIGNEE);
    }

    // ---- 수정 ----

    @Test
    @DisplayName("수정 — 미인증 401 (일정 API·관리자 API), 감사 없음")
    void edit_anonymous_unauthorized() throws Exception {
        seedRecord();
        for (String uri : List.of(SCHEDULE_EDIT_URI, ADMIN_EDIT_URI)) {
            mockMvc.perform(request(HttpMethod.PUT, uri).contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(editPayload())))
                .andExpect(status().isUnauthorized());
        }
        assertThat(audits).isEmpty();
        assertThat(store.get(RECORD_ID).getMainIssues()).isEqualTo(BODY_CREATE);
    }

    @Test
    @DisplayName("수정 — 내담자·다른 상담사(현재 담당 아님)·다른 테넌트 관리자 403 (두 API 모두), 본문 불변")
    void edit_forbiddenCallers() throws Exception {
        seedRecord();
        List<User> denied = List.of(user(CLIENT_ID, UserRole.CLIENT, TENANT_A),
            user(OTHER_CONSULTANT, UserRole.CONSULTANT, TENANT_A), user(ADMIN_B, UserRole.ADMIN, TENANT_B));
        for (String uri : List.of(SCHEDULE_EDIT_URI, ADMIN_EDIT_URI)) {
            for (User caller : denied) {
                callJson(HttpMethod.PUT, uri, editPayload(), caller).andExpect(status().isForbidden());
            }
        }
        assertThat(audits).isEmpty();
        assertThat(store.get(RECORD_ID).getMainIssues()).isEqualTo(BODY_CREATE);
    }

    @Test
    @DisplayName("수정 — 같은 테넌트 관리자 200 (일정 API): updated_by = 관리자, 감사 1행·필드명만")
    void edit_sameTenantAdmin_viaScheduleApi() throws Exception {
        seedRecord();
        callJson(HttpMethod.PUT, SCHEDULE_EDIT_URI, editPayload(), user(ADMIN_ID, UserRole.ADMIN, TENANT_A))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.editedByAdmin").value(true))
            .andExpect(jsonPath("$.data.writtenByAdmin").value(false))
            .andExpect(jsonPath("$.data.lastEditedById").value(ADMIN_ID));

        ConsultationRecord saved = store.get(RECORD_ID);
        assertThat(saved.getConsultantId()).isEqualTo(ASSIGNEE);
        assertThat(saved.getMainIssues()).isEqualTo(BODY_EDIT);
        assertThat(saved.getUpdatedByUserId()).isEqualTo(ADMIN_ID);
        assertThat(saved.getUpdatedByRole()).isEqualTo(UserRole.ADMIN.name());
        assertThat(saved.getCreatedByUserId()).isEqualTo(ASSIGNEE);

        assertThat(audits).hasSize(1);
        ConsultationRecordEditAudit audit = audits.get(0);
        assertThat(audit.getAction()).isEqualTo(ConsultationRecordAccessAudit.ACTION_EDIT);
        assertThat(audit.getEditorId()).isEqualTo(ADMIN_ID);
        assertThat(audit.getChangedFields()).isEqualTo("mainIssues");
        assertNoBody(audit);
    }

    @Test
    @DisplayName("수정 — 같은 테넌트 관리자 200 (관리자 API), 수정 2회 = 감사 2행")
    void edit_sameTenantAdmin_viaAdminApi_oneAuditPerEdit() throws Exception {
        seedRecord();
        callJson(HttpMethod.PUT, ADMIN_EDIT_URI, editPayload(), user(ADMIN_ID, UserRole.ADMIN, TENANT_A))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.editedByAdmin").value(true));
        assertThat(audits).hasSize(1);

        Map<String, Object> second = editPayload();
        second.put("clientResponse", BODY_EDIT + " 2");
        callJson(HttpMethod.PUT, ADMIN_EDIT_URI, second, user(STAFF_ID, UserRole.STAFF, TENANT_A))
            .andExpect(status().isOk());
        assertThat(audits).hasSize(2);
        assertThat(audits.get(1).getEditorId()).isEqualTo(STAFF_ID);
        assertThat(audits.get(1).getChangedFields()).isEqualTo("clientResponse");
        audits.forEach(ConsultationLogAdminWriteMvcTest::assertNoBody);
    }

    @Test
    @DisplayName("수정 회귀 — 작성 상담사 본인 200 (일정 API), 관리자 배지 없음, 감사 1행")
    void edit_authorConsultant_regression() throws Exception {
        seedRecord();
        callJson(HttpMethod.PUT, SCHEDULE_EDIT_URI, editPayload(), user(ASSIGNEE, UserRole.CONSULTANT, TENANT_A))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.editedByAdmin").value(false));
        assertThat(store.get(RECORD_ID).getUpdatedByUserId()).isEqualTo(ASSIGNEE);
        assertThat(audits).hasSize(1);
        assertNoBody(audits.get(0));
        verify(draftService).deleteDraft(TENANT_A, SCHEDULE_ID, ASSIGNEE);
    }

    @Test
    @DisplayName("수정 — 바뀐 필드가 없어도 성공 수정 1건 = 감사 1행 (필드 목록 비움)")
    void edit_noChange_stillOneAudit() throws Exception {
        seedRecord();
        Map<String, Object> same = editPayload();
        same.put("mainIssues", BODY_CREATE);
        callJson(HttpMethod.PUT, SCHEDULE_EDIT_URI, same, user(ADMIN_ID, UserRole.ADMIN, TENANT_A))
            .andExpect(status().isOk());
        assertThat(audits).hasSize(1);
        assertThat(audits.get(0).getChangedFields()).isNull();
    }

    // ---- helpers ----

    private void seedRecord() {
        ConsultationRecord r = new ConsultationRecord();
        r.setId(RECORD_ID);
        r.setTenantId(TENANT_A);
        r.setConsultationId(SCHEDULE_ID);
        r.setConsultantId(ASSIGNEE);
        r.setClientId(CLIENT_ID);
        r.setSessionDate(LocalDate.of(2026, 10, 1));
        r.setSessionNumber(SESSION_NUMBER);
        r.setIsSessionCompleted(false);
        r.setIsDeleted(false);
        r.setClientCondition("안정");
        r.setMainIssues(BODY_CREATE);
        r.setInterventionMethods("인지행동");
        r.setClientResponse("긍정");
        r.setRiskAssessment("LOW");
        r.setProgressEvaluation("호전");
        r.setSessionDurationMinutes(60);
        r.setCreatedByUserId(ASSIGNEE);
        r.setCreatedByRole(UserRole.CONSULTANT.name());
        store.put(RECORD_ID, r);
    }

    private static Map<String, Object> createPayload(long consultantIdInBody) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("consultationId", SCHEDULE_ID);
        payload.put("clientId", CLIENT_ID);
        payload.put("consultantId", consultantIdInBody);
        payload.put("sessionNumber", SESSION_NUMBER);
        payload.put("sessionDurationMinutes", 60);
        payload.put("clientCondition", "안정");
        payload.put("mainIssues", BODY_CREATE);
        payload.put("interventionMethods", "인지행동");
        payload.put("clientResponse", "긍정");
        payload.put("riskAssessment", "LOW");
        payload.put("progressEvaluation", "호전");
        payload.put("isSessionCompleted", false);
        return payload;
    }

    private static Map<String, Object> editPayload() {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("consultationId", SCHEDULE_ID);
        payload.put("sessionNumber", SESSION_NUMBER);
        payload.put("sessionDurationMinutes", 60);
        payload.put("clientCondition", "안정");
        payload.put("mainIssues", BODY_EDIT);
        payload.put("interventionMethods", "인지행동");
        payload.put("clientResponse", "긍정");
        payload.put("riskAssessment", "LOW");
        payload.put("progressEvaluation", "호전");
        payload.put("isSessionCompleted", false);
        return payload;
    }

    private static void assertNoBody(ConsultationRecordEditAudit audit) {
        String joined = String.join("|", String.valueOf(audit.getChangedFields()), String.valueOf(audit.getAction()),
            String.valueOf(audit.getEditorRole()), String.valueOf(audit.getTenantId()));
        assertThat(joined).doesNotContain(BODY_CREATE).doesNotContain(BODY_EDIT).doesNotContain("인지행동");
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
