package com.coresolution.consultation.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
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
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.entity.InstitutionLinkConsultationLog;
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
import com.coresolution.consultation.service.InstitutionLinkConsultationLogService;
import com.coresolution.consultation.service.support.ClientPathAccessGuard;
import com.coresolution.consultation.service.support.ConsultationRecordAccessGuard;
import com.coresolution.core.context.TenantContextHolder;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * 상담일지 본문 보호 — 작성자 기준 접근 가드 ({@link ConsultationRecordAccessGuard}).
 *
 * <p>#1397·#1398·#1401 가드보다 엄격하다. 상담일지 본문은 <b>작성 상담사</b> 와 같은 테넌트
 * 관리자·사무원만 읽을 수 있다. 같은 테넌트의 다른 상담사(매칭 보유 여부 무관)·내담자·다른
 * 테넌트 관리자는 모두 403, 미인증은 401 이다.</p>
 *
 * <p>목록 응답에 임상 본문이 섞이지 않는지와 {@code Cache-Control: no-store} 도 함께 고정한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("상담일지 본문 접근 가드 (작성자 + 명시 권한자)")
class ConsultationLogAccessGuardMvcTest {

    private static final String TENANT_A = "tenant-log-a";
    private static final String TENANT_B = "tenant-log-b";
    private static final long AUTHOR_CONSULTANT = 41L;
    private static final long OTHER_CONSULTANT = 42L;
    private static final long CLIENT_ID = 20L;
    private static final long ADMIN_A = 1L;
    private static final long STAFF_A = 2L;
    private static final long ADMIN_B = 900L;

    private static final long RECORD_ID = 300L;
    private static final long SCHEDULE_ID = 777L;
    private static final long IL_LOG_ID = 500L;

    private static final String LIST_URI = "/api/v1/schedules/consultation-records";
    private static final String MEDICAL_BODY = "복용 중인 약물 — 본문 유출 감지 문구";
    private static final String MAIN_ISSUES_BODY = "주요 이슈 본문";

    private ConsultationRecordService consultationRecordService;
    private ConsultationRecordRepository recordRepository;
    private InstitutionLinkConsultationLogRepository institutionLinkRepository;
    private InstitutionLinkConsultationLogService institutionLinkService;
    private ClinicalReportRepository clinicalReportRepository;
    private ScheduleRepository scheduleRepository;
    private ConsultantClientMappingRepository mappingRepository;
    private DynamicPermissionService dynamicPermissionService;
    private UserRepository userRepository;
    private Object[] dataServices;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() throws Exception {
        SecurityContextHolder.clearContext();
        TenantContextHolder.clear();
        consultationRecordService = mock(ConsultationRecordService.class);
        recordRepository = mock(ConsultationRecordRepository.class);
        institutionLinkRepository = mock(InstitutionLinkConsultationLogRepository.class);
        institutionLinkService = mock(InstitutionLinkConsultationLogService.class);
        clinicalReportRepository = mock(ClinicalReportRepository.class);
        scheduleRepository = mock(ScheduleRepository.class);
        mappingRepository = mock(ConsultantClientMappingRepository.class);
        dynamicPermissionService = mock(DynamicPermissionService.class);
        userRepository = mock(UserRepository.class);
        dataServices = new Object[] {consultationRecordService, institutionLinkService};

        ClientPathAccessGuard clientGuard = new ClientPathAccessGuard(mappingRepository, userRepository);
        ConsultationRecordAccessGuard logGuard = new ConsultationRecordAccessGuard(clientGuard,
            clinicalReportRepository, recordRepository, institutionLinkRepository, scheduleRepository);
        // 동적 권한은 통과시켜, 거부 판정이 오직 상담일지 소유자 가드에서 나오는지 확인한다.
        when(dynamicPermissionService.hasPermission(any(User.class), anyString())).thenReturn(true);
        Object[] provided = {clientGuard, logGuard, consultationRecordService, institutionLinkService,
            recordRepository, scheduleRepository, userRepository, dynamicPermissionService,
            objectMapper()};

        mockMvc = MockMvcBuilders.standaloneSetup(
                build(ScheduleController.class, provided),
                build(ConsultantRecordsController.class, provided),
                build(InstitutionLinkConsultationLogController.class, provided))
            .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
            .addFilter(new SecurityHeaderFilter())
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();

        for (long id : new long[] {AUTHOR_CONSULTANT, OTHER_CONSULTANT, CLIENT_ID, ADMIN_A, STAFF_A}) {
            when(userRepository.findByTenantIdAndId(TENANT_A, id)).thenReturn(Optional.of(new User()));
        }
        // 다른 상담사도 내담자와 매칭이 있는 상황 — #1401 규칙이면 통과하지만 상담일지는 작성자만.
        when(mappingRepository.findAllByTenantIdAndConsultantIdAndClientIdOrderByCreatedAtDesc(
            TENANT_A, OTHER_CONSULTANT, CLIENT_ID)).thenReturn(List.of());

        ConsultationRecord record = record(AUTHOR_CONSULTANT);
        when(recordRepository.findByTenantIdAndId(TENANT_A, RECORD_ID)).thenReturn(Optional.of(record));
        when(recordRepository.findByTenantIdAndConsultationIdAndIsDeletedFalse(TENANT_A, SCHEDULE_ID))
            .thenReturn(List.of(record));
        when(scheduleRepository.findByTenantIdAndId(TENANT_A, SCHEDULE_ID)).thenReturn(Optional.of(schedule()));

        Page<ConsultationRecord> page = new PageImpl<>(List.of(record));
        when(consultationRecordService.getConsultationRecordsByConsultantId(anyLong(), any())).thenReturn(page);
        when(consultationRecordService.getConsultationRecordsByConsultationId(anyLong()))
            .thenReturn(List.of(record));
        when(consultationRecordService.getConsultationRecordById(RECORD_ID)).thenReturn(record);

        InstitutionLinkConsultationLog ilLog = institutionLinkLog();
        when(institutionLinkRepository.findByTenantIdAndIdAndIsDeletedFalse(TENANT_A, IL_LOG_ID))
            .thenReturn(Optional.of(ilLog));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    // ---- 1. 상담사별 목록 (?consultantId=) ----

    @Test
    @DisplayName("목록(?consultantId=) — 작성 상담사 본인 200")
    void list_byConsultant_author_ok() throws Exception {
        call(HttpMethod.GET, listByConsultant(AUTHOR_CONSULTANT), author())
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.records.length()").value(1));
    }

    @Test
    @DisplayName("목록(?consultantId=) — 같은 테넌트 다른 상담사 403, 본문 없음, 서비스 미호출")
    void list_byConsultant_otherConsultant_forbidden() throws Exception {
        assertForbidden(call(HttpMethod.GET, listByConsultant(AUTHOR_CONSULTANT), otherConsultant()));
    }

    @Test
    @DisplayName("목록(?consultantId=) — 내담자 403, 본문 없음, 서비스 미호출")
    void list_byConsultant_client_forbidden() throws Exception {
        assertForbidden(call(HttpMethod.GET, listByConsultant(AUTHOR_CONSULTANT), client()));
    }

    @Test
    @DisplayName("목록(?consultantId=) — 다른 테넌트 관리자 403 / 미인증 401")
    void list_byConsultant_otherTenantAndUnauthenticated() throws Exception {
        assertForbidden(call(HttpMethod.GET, listByConsultant(AUTHOR_CONSULTANT),
            user(ADMIN_B, UserRole.ADMIN, TENANT_B)));
        setUp();
        mockMvc.perform(request(HttpMethod.GET, listByConsultant(AUTHOR_CONSULTANT)))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.data").doesNotExist());
        verifyNoInteractions(dataServices);
    }

    @Test
    @DisplayName("목록(?consultantId=) — 같은 테넌트 관리자·사무원 200 (현행 관리자 열람 유지)")
    void list_byConsultant_manager_ok() throws Exception {
        call(HttpMethod.GET, listByConsultant(AUTHOR_CONSULTANT), user(ADMIN_A, UserRole.ADMIN, TENANT_A))
            .andExpect(status().isOk());
        setUp();
        call(HttpMethod.GET, listByConsultant(AUTHOR_CONSULTANT), user(STAFF_A, UserRole.STAFF, TENANT_A))
            .andExpect(status().isOk());
    }

    @Test
    @DisplayName("목록(범위 파라미터 없음) — 테넌트 전체 dump 없이 빈 목록")
    void list_withoutScope_empty() throws Exception {
        call(HttpMethod.GET, LIST_URI, author())
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.records.length()").value(0));
        verifyNoInteractions(dataServices);
    }

    // ---- 2. 응답 최소화 ----

    @Test
    @DisplayName("목록(?consultantId=) 응답에 임상 본문 필드가 없다 (요약·메타만)")
    void list_byConsultant_hasNoClinicalBody() throws Exception {
        call(HttpMethod.GET, listByConsultant(AUTHOR_CONSULTANT), author())
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.records[0].id").value((int) RECORD_ID))
            .andExpect(jsonPath("$.data.records[0].medicalInformation").doesNotExist())
            .andExpect(jsonPath("$.data.records[0].medicationInfo").doesNotExist())
            .andExpect(jsonPath("$.data.records[0].familyRelationships").doesNotExist())
            .andExpect(jsonPath("$.data.records[0].riskFactors").doesNotExist())
            .andExpect(jsonPath("$.data.records[0].emergencyResponsePlan").doesNotExist())
            .andExpect(jsonPath("$.data.records[0].consultantAssessment").doesNotExist())
            .andExpect(jsonPath("$.data.records[0].interventionMethods").doesNotExist())
            .andExpect(jsonPath("$.data.records[0].clientResponse").doesNotExist())
            .andExpect(content().string(not(containsString(MEDICAL_BODY))));
    }

    @Test
    @DisplayName("단건 편집 로드(?consultationId=) 는 본문을 그대로 돌려준다 (편집 화면 회귀 방지)")
    void list_byConsultation_keepsBodyForEditor() throws Exception {
        call(HttpMethod.GET, LIST_URI + "?consultationId=" + SCHEDULE_ID, author())
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.records[0].mainIssues").value(MAIN_ISSUES_BODY));
    }

    // ---- 3. 일정 범위 목록 (?consultationId=) ----

    @Test
    @DisplayName("목록(?consultationId=) — 담당 상담사 200 / 다른 상담사 403 / 내담자 403 / 다른 테넌트 관리자 403")
    void list_byConsultation_matrix() throws Exception {
        call(HttpMethod.GET, LIST_URI + "?consultationId=" + SCHEDULE_ID, author())
            .andExpect(status().isOk());
        setUp();
        assertForbidden(call(HttpMethod.GET, LIST_URI + "?consultationId=" + SCHEDULE_ID, otherConsultant()));
        setUp();
        assertForbidden(call(HttpMethod.GET, LIST_URI + "?consultationId=" + SCHEDULE_ID, client()));
        setUp();
        assertForbidden(call(HttpMethod.GET, LIST_URI + "?consultationId=" + SCHEDULE_ID,
            user(ADMIN_B, UserRole.ADMIN, TENANT_B)));
    }

    @Test
    @DisplayName("목록(?consultationId=schedule-) 접두 형식도 같은 가드 적용")
    void list_byConsultation_schedulePrefix() throws Exception {
        call(HttpMethod.GET, LIST_URI + "?consultationId=schedule-" + SCHEDULE_ID, author())
            .andExpect(status().isOk());
        setUp();
        assertForbidden(call(HttpMethod.GET, LIST_URI + "?consultationId=schedule-" + SCHEDULE_ID,
            otherConsultant()));
    }

    // ---- 4. 단건 상세 (상담사 기록 컨트롤러) ----

    @Test
    @DisplayName("단건 상세 — 작성 상담사 200 / 다른 상담사 403 / 내담자 403 / 다른 테넌트 관리자 403 / 미인증 401")
    void detail_matrix() throws Exception {
        String uri = detailUri(AUTHOR_CONSULTANT, RECORD_ID);
        call(HttpMethod.GET, uri, author()).andExpect(status().isOk());
        setUp();
        assertForbidden(call(HttpMethod.GET, uri, otherConsultant()));
        setUp();
        assertForbidden(call(HttpMethod.GET, uri, client()));
        setUp();
        assertForbidden(call(HttpMethod.GET, uri, user(ADMIN_B, UserRole.ADMIN, TENANT_B)));
        setUp();
        mockMvc.perform(request(HttpMethod.GET, uri))
            .andExpect(status().isUnauthorized())
            .andExpect(content().string(not(containsString(MEDICAL_BODY))));
    }

    @Test
    @DisplayName("단건 상세 — 테넌트 안에 없는 기록 id 는 403 (존재 여부 비노출)")
    void detail_unknownId_forbidden() throws Exception {
        assertForbidden(call(HttpMethod.GET, detailUri(AUTHOR_CONSULTANT, 999_999L),
            user(ADMIN_A, UserRole.ADMIN, TENANT_A)));
    }

    // ---- 5. 타기관 연계 일지 ----

    @Test
    @DisplayName("타기관 연계 단건 — 작성 상담사 200 / 다른 상담사 403 / 내담자 403")
    void institutionLinkDetail_matrix() throws Exception {
        String uri = "/api/v1/institution-link/consultation-records/" + IL_LOG_ID;
        call(HttpMethod.GET, uri, author()).andExpect(status().isOk());
        setUp();
        assertForbidden(call(HttpMethod.GET, uri, otherConsultant()));
        setUp();
        assertForbidden(call(HttpMethod.GET, uri, client()));
    }

    @Test
    @DisplayName("타기관 연계 월말 목록 — 관리자 200 / 상담사 403 / 내담자 403")
    void institutionLinkList_managerOnly() throws Exception {
        String uri = "/api/v1/institution-link/consultation-records?mappingId=1&billingYearMonth=2026-10";
        call(HttpMethod.GET, uri, user(ADMIN_A, UserRole.ADMIN, TENANT_A)).andExpect(status().isOk());
        setUp();
        assertForbidden(call(HttpMethod.GET, uri, author()));
        setUp();
        assertForbidden(call(HttpMethod.GET, uri, client()));
    }

    // ---- 6. 캐시 금지 헤더 ----

    @Test
    @DisplayName("상담일지 응답은 Cache-Control: no-store (403 응답에도 적용)")
    void noStoreHeaderPresent() throws Exception {
        call(HttpMethod.GET, listByConsultant(AUTHOR_CONSULTANT), author())
            .andExpect(status().isOk())
            .andExpect(header().string("Cache-Control", containsString("no-store")))
            .andExpect(header().string("Pragma", "no-cache"))
            .andExpect(header().string("Expires", "0"));
        setUp();
        call(HttpMethod.GET, listByConsultant(AUTHOR_CONSULTANT), client())
            .andExpect(status().isForbidden())
            .andExpect(header().string("Cache-Control", containsString("no-store")));
    }

    // ---- helpers ----

    private static String listByConsultant(long consultantId) {
        return LIST_URI + "?consultantId=" + consultantId;
    }

    private static String detailUri(long consultantId, long recordId) {
        return "/api/v1/admin/consultant-records/" + consultantId + "/consultation-records/" + recordId;
    }

    /** 403 + 본문 미노출 + 데이터 서비스 미호출을 함께 단언한다. */
    private ResultActions assertForbidden(ResultActions actions) throws Exception {
        ResultActions result = actions
            .andExpect(status().isForbidden())
            .andExpect(content().string(not(containsString(MEDICAL_BODY))))
            .andExpect(content().string(not(containsString(MAIN_ISSUES_BODY))));
        verifyNoInteractions(dataServices);
        return result;
    }

    private ResultActions call(HttpMethod method, String uri, User caller) throws Exception {
        MockHttpServletRequestBuilder builder = request(method, uri).session(session(caller))
            .with(tenant(caller.getTenantId()));
        return mockMvc.perform(builder);
    }

    private static org.springframework.test.web.servlet.request.RequestPostProcessor tenant(String tenantId) {
        return r -> {
            TenantContextHolder.setTenantId(tenantId);
            return r;
        };
    }

    private static User author() {
        return user(AUTHOR_CONSULTANT, UserRole.CONSULTANT, TENANT_A);
    }

    private static User otherConsultant() {
        return user(OTHER_CONSULTANT, UserRole.CONSULTANT, TENANT_A);
    }

    private static User client() {
        return user(CLIENT_ID, UserRole.CLIENT, TENANT_A);
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

    private static ConsultationRecord record(long consultantId) {
        ConsultationRecord r = new ConsultationRecord();
        r.setId(RECORD_ID);
        r.setTenantId(TENANT_A);
        r.setConsultantId(consultantId);
        r.setClientId(CLIENT_ID);
        r.setConsultationId(SCHEDULE_ID);
        r.setSessionDate(LocalDate.of(2026, 10, 1));
        r.setSessionNumber(1);
        r.setIsSessionCompleted(Boolean.TRUE);
        r.setIsDeleted(false);
        r.setMainIssues(MAIN_ISSUES_BODY);
        r.setMedicalInformation(MEDICAL_BODY);
        r.setMedicationInfo(MEDICAL_BODY);
        r.setFamilyRelationships(MEDICAL_BODY);
        r.setRiskFactors(MEDICAL_BODY);
        r.setEmergencyResponsePlan(MEDICAL_BODY);
        r.setConsultantAssessment(MEDICAL_BODY);
        r.setInterventionMethods(MEDICAL_BODY);
        r.setClientResponse(MEDICAL_BODY);
        return r;
    }

    private static Schedule schedule() {
        Schedule s = new Schedule();
        s.setId(SCHEDULE_ID);
        s.setTenantId(TENANT_A);
        s.setConsultantId(AUTHOR_CONSULTANT);
        s.setClientId(CLIENT_ID);
        return s;
    }

    private static InstitutionLinkConsultationLog institutionLinkLog() {
        InstitutionLinkConsultationLog l = new InstitutionLinkConsultationLog();
        l.setId(IL_LOG_ID);
        l.setTenantId(TENANT_A);
        l.setConsultantId(AUTHOR_CONSULTANT);
        l.setClientId(CLIENT_ID);
        l.setMainIssues(MAIN_ISSUES_BODY);
        return l;
    }

    /** 가장 긴 생성자로 컨트롤러를 만든다. 제공 객체가 없으면 해당 타입 mock 을 넣는다. */
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

    /** 운영 ObjectMapper 와 동일하게 Java8 날짜 모듈을 등록한다. */
    private static ObjectMapper objectMapper() {
        return new ObjectMapper().registerModule(new JavaTimeModule());
    }
}
