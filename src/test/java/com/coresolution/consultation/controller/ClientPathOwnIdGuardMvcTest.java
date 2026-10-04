package com.coresolution.consultation.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.lang.reflect.Constructor;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

import com.coresolution.consultation.assessment.controller.PsychAssessmentController;
import com.coresolution.consultation.assessment.repository.PsychAssessmentDocumentRepository;
import com.coresolution.consultation.assessment.service.PsychAssessmentClientSummaryService;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.ConsultantClientDetailResponse;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.DropoutRiskAssessment;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.GlobalExceptionHandler;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.ConsultantRatingService;
import com.coresolution.consultation.service.ConsultantService;
import com.coresolution.consultation.service.ConsultationService;
import com.coresolution.consultation.service.CounselorTrainingService;
import com.coresolution.consultation.service.EmotionAnalysisService;
import com.coresolution.consultation.service.PredictionService;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.service.UserProfileService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.service.support.ClientPathAccessGuard;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.data.domain.Page;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * P0 보안 회귀 — 경로 내담자/상담사 id API 본인·매칭·테넌트 가드 ({@link ClientPathAccessGuard}).
 *
 * <p>2026-10-04 .dev 재현: 내담자(20)가 {@code GET /schedules/client/21?userRole=ADMIN} 로 타 내담자 일정 14건,
 * {@code GET /ratings/client/21/ratable-schedules} 로 13건, {@code GET /consultants/{c}/clients/21} 로
 * 타 내담자 프로필을 200 으로 받음. 실제 가드를 붙인 standalone MockMvc 로 모든 대상 엔드포인트를 검증한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("경로 내담자·상담사 id API 본인 가드 (P0)")
class ClientPathOwnIdGuardMvcTest {

    private static final String TENANT_A = "tenant-path-ownid-a";
    private static final String TENANT_B = "tenant-path-ownid-b";
    private static final long CLIENT_SELF = 20L;
    private static final long CLIENT_OTHER = 21L;
    private static final long CONSULTANT_SELF = 30L;
    private static final long CONSULTANT_OTHER = 31L;
    private static final long ADMIN_ID = 1L;
    private static final long STAFF_ID = 2L;
    private static final long ADMIN_B_ID = 900L;
    private static final String CLIENT = "{client}";
    private static final String CONSULTANT = "{consultant}";
    private static final String TARGET = "{target}";

    private ScheduleService scheduleService;
    private PsychAssessmentDocumentRepository psychDocumentRepository;
    private PsychAssessmentClientSummaryService psychSummaryService;
    private ConsultationService consultationService;
    private EmotionAnalysisService emotionAnalysisService;
    private PredictionService predictionService;
    private ConsultantRatingService ratingService;
    private ConsultantService consultantService;
    private CounselorTrainingService trainingService;
    private UserService userService;
    private UserProfileService userProfileService;
    private ConsultantClientMappingRepository mappingRepository;
    private UserRepository userRepository;
    private Object[] dataServices;
    private MockMvc mockMvc;

    /** 대상 엔드포인트 한 건. {@code template} 의 {client}/{consultant}/{target} 를 치환한다. */
    record Endpoint(String name, HttpMethod method, String template, String body) {
        @Override
        public String toString() {
            return name;
        }
    }

    static Stream<Endpoint> clientPathEndpoints() {
        return Stream.of(
            new Endpoint("GET schedules/client/{id}", HttpMethod.GET,
                "/api/v1/schedules/client/" + CLIENT + "?userRole=CLIENT", null),
            new Endpoint("GET psych documents/by-client/{id}", HttpMethod.GET,
                "/api/v1/assessments/psych/documents/by-client/" + CLIENT, null),
            new Endpoint("GET psych clients/{id}/summary", HttpMethod.GET,
                "/api/v1/assessments/psych/clients/" + CLIENT + "/summary", null),
            new Endpoint("GET consultations/client/{id}/history", HttpMethod.GET,
                "/api/v1/consultations/client/" + CLIENT + "/history", null),
            new Endpoint("GET emotion-analysis/trend/{id}", HttpMethod.GET,
                "/api/v1/emotion-analysis/trend/" + CLIENT + "?emotionType=ANXIETY", null),
            new Endpoint("POST emotion-analysis/track/{id}", HttpMethod.POST,
                "/api/v1/emotion-analysis/track/" + CLIENT + "?consultationRecordId=1&sessionNumber=1", null),
            new Endpoint("POST predictions/treatment-outcome/{id}", HttpMethod.POST,
                "/api/v1/predictions/treatment-outcome/" + CLIENT, null),
            new Endpoint("GET predictions/dropout-risk/{id}", HttpMethod.GET,
                "/api/v1/predictions/dropout-risk/" + CLIENT, null),
            new Endpoint("POST predictions/recommend-sessions/{id}", HttpMethod.POST,
                "/api/v1/predictions/recommend-sessions/" + CLIENT, null),
            new Endpoint("GET predictions/similar-cases/{id}", HttpMethod.GET,
                "/api/v1/predictions/similar-cases/" + CLIENT, null),
            new Endpoint("GET ratings/client/{id}/ratable-schedules", HttpMethod.GET,
                "/api/v1/ratings/client/" + CLIENT + "/ratable-schedules", null));
    }

    static Stream<Endpoint> consultantPathEndpoints() {
        return Stream.of(
            new Endpoint("GET consultants/{id}/clients", HttpMethod.GET,
                "/api/v1/consultants/" + CONSULTANT + "/clients", null),
            new Endpoint("GET training/feedback/{id}", HttpMethod.GET,
                "/api/v1/training/feedback/" + CONSULTANT, null),
            new Endpoint("POST training/analyze-session", HttpMethod.POST,
                "/api/v1/training/analyze-session/1?consultantId=" + CONSULTANT, null),
            new Endpoint("POST training/virtual-client/create", HttpMethod.POST,
                "/api/v1/training/virtual-client/create",
                "{\"consultantId\":" + CONSULTANT + ",\"scenarioType\":\"ANXIETY\"}"));
    }

    static Stream<Endpoint> consultantClientEndpoints() {
        return Stream.of(
            new Endpoint("GET consultants/{c}/clients/{id}", HttpMethod.GET,
                "/api/v1/consultants/" + CONSULTANT + "/clients/" + CLIENT, null),
            new Endpoint("PUT consultants/{c}/clients/{id}", HttpMethod.PUT,
                "/api/v1/consultants/" + CONSULTANT + "/clients/" + CLIENT, "{}"));
    }

    static Stream<Endpoint> managerOnlyEndpoints() {
        return Stream.of(
            new Endpoint("PUT users/{id}/profile", HttpMethod.PUT,
                "/api/v1/users/" + TARGET + "/profile", "{\"role\":\"ADMIN\"}"),
            new Endpoint("PUT users/profile/{id}/role", HttpMethod.PUT,
                "/api/v1/users/profile/" + TARGET + "/role?newRole=ADMIN", null));
    }

    @BeforeEach
    void setUp() throws Exception {
        SecurityContextHolder.clearContext();
        TenantContextHolder.clear();
        scheduleService = mock(ScheduleService.class);
        psychDocumentRepository = mock(PsychAssessmentDocumentRepository.class);
        psychSummaryService = mock(PsychAssessmentClientSummaryService.class);
        consultationService = mock(ConsultationService.class);
        emotionAnalysisService = mock(EmotionAnalysisService.class);
        predictionService = mock(PredictionService.class);
        ratingService = mock(ConsultantRatingService.class);
        consultantService = mock(ConsultantService.class);
        trainingService = mock(CounselorTrainingService.class);
        userService = mock(UserService.class);
        userProfileService = mock(UserProfileService.class);
        mappingRepository = mock(ConsultantClientMappingRepository.class);
        userRepository = mock(UserRepository.class);
        dataServices = new Object[] {scheduleService, psychDocumentRepository, psychSummaryService,
            consultationService, emotionAnalysisService, predictionService, ratingService, consultantService,
            trainingService, userService, userProfileService};

        ClientPathAccessGuard guard = new ClientPathAccessGuard(mappingRepository, userRepository);
        Object[] provided = {guard, scheduleService, psychDocumentRepository, psychSummaryService,
            consultationService, emotionAnalysisService, predictionService, ratingService, consultantService,
            trainingService, userService, userProfileService, userRepository, mappingRepository};

        mockMvc = MockMvcBuilders.standaloneSetup(
                build(ScheduleController.class, provided),
                build(PsychAssessmentController.class, provided),
                build(ConsultationController.class, provided),
                build(EmotionAnalysisController.class, provided),
                build(PredictionController.class, provided),
                build(ConsultantRatingController.class, provided),
                build(ConsultantController.class, provided),
                build(CounselorTrainingController.class, provided),
                build(UserController.class, provided),
                build(UserProfileController.class, provided))
            .setControllerAdvice(new GlobalExceptionHandler())
            .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
            .build();

        for (long id : new long[] {CLIENT_SELF, CLIENT_OTHER, CONSULTANT_SELF, CONSULTANT_OTHER, ADMIN_ID, STAFF_ID}) {
            when(userRepository.findByTenantIdAndId(TENANT_A, id)).thenReturn(Optional.of(new User()));
        }
        when(mappingRepository.findAllByTenantIdAndConsultantIdAndClientIdOrderByCreatedAtDesc(
            TENANT_A, CONSULTANT_SELF, CLIENT_SELF)).thenReturn(List.of(new ConsultantClientMapping()));

        when(predictionService.assessDropoutRisk(anyLong())).thenReturn(new DropoutRiskAssessment());
        when(consultantService.findClientsByConsultantId(anyLong(), any(), any(), any())).thenReturn(Page.empty());
        when(consultantService.findClientByConsultantId(anyLong(), anyLong()))
            .thenReturn(Optional.of(new ConsultantClientDetailResponse()));
        when(userProfileService.changeUserRole(anyLong(), any())).thenReturn(true);
        when(emotionAnalysisService.getEmotionTrend(anyLong(), anyString())).thenReturn(List.of());
        when(psychDocumentRepository.findByTenantIdAndClientIdOrderByCreatedAtDesc(eq(TENANT_A), anyLong()))
            .thenReturn(List.of());
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    // ---- 경로 내담자 id ----

    @ParameterizedTest(name = "{0}")
    @MethodSource("clientPathEndpoints")
    @DisplayName("내담자 본인 id → 200")
    void clientSelf_ok(Endpoint e) throws Exception {
        perform(e, user(CLIENT_SELF, UserRole.CLIENT, TENANT_A), CLIENT_SELF, CONSULTANT_SELF)
            .andExpect(status().is2xxSuccessful());
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("clientPathEndpoints")
    @DisplayName("내담자가 다른 내담자 id → 403, 데이터 없음, 서비스 미호출")
    void clientOther_forbidden(Endpoint e) throws Exception {
        assertForbiddenWithoutData(
            perform(e, user(CLIENT_SELF, UserRole.CLIENT, TENANT_A), CLIENT_OTHER, CONSULTANT_SELF),
            ClientPathAccessGuard.DENIAL_OWN_CLIENT_ONLY);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("clientPathEndpoints")
    @DisplayName("내담자가 userRole=ADMIN 파라미터로 위장 → 403")
    void clientSpoofUserRoleAdmin_forbidden(Endpoint e) throws Exception {
        Endpoint spoofed = new Endpoint(e.name(), e.method(),
            e.template().replace("userRole=CLIENT", "userRole=ADMIN")
                + (e.template().contains("?") ? "&" : "?") + "userRole=ADMIN", e.body());
        assertForbiddenWithoutData(
            perform(spoofed, user(CLIENT_SELF, UserRole.CLIENT, TENANT_A), CLIENT_OTHER, CONSULTANT_SELF),
            ClientPathAccessGuard.DENIAL_OWN_CLIENT_ONLY);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("clientPathEndpoints")
    @DisplayName("상담사 — 매칭 내담자 200 / 미매칭 내담자 403")
    void consultantMappedOkUnmappedForbidden(Endpoint e) throws Exception {
        User consultant = user(CONSULTANT_SELF, UserRole.CONSULTANT, TENANT_A);
        perform(e, consultant, CLIENT_SELF, CONSULTANT_SELF).andExpect(status().is2xxSuccessful());
        setUp();
        assertForbiddenWithoutData(perform(e, consultant, CLIENT_OTHER, CONSULTANT_SELF),
            ClientPathAccessGuard.DENIAL_UNMAPPED_CLIENT);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("clientPathEndpoints")
    @DisplayName("관리자·사무원 같은 테넌트 → 200")
    void adminAndStaffSameTenant_ok(Endpoint e) throws Exception {
        perform(e, user(ADMIN_ID, UserRole.ADMIN, TENANT_A), CLIENT_OTHER, CONSULTANT_SELF)
            .andExpect(status().is2xxSuccessful());
        perform(e, user(STAFF_ID, UserRole.STAFF, TENANT_A), CLIENT_OTHER, CONSULTANT_SELF)
            .andExpect(status().is2xxSuccessful());
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("clientPathEndpoints")
    @DisplayName("다른 테넌트 관리자가 A 테넌트 내담자 id → 403")
    void adminOtherTenant_forbidden(Endpoint e) throws Exception {
        assertForbiddenWithoutData(
            perform(e, user(ADMIN_B_ID, UserRole.ADMIN, TENANT_B), CLIENT_OTHER, CONSULTANT_SELF),
            ClientPathAccessGuard.DENIAL_OTHER_TENANT);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("clientPathEndpoints")
    @DisplayName("세션 사용자 테넌트와 TenantContext 불일치 → 403")
    void tenantContextMismatch_forbidden(Endpoint e) throws Exception {
        User admin = user(ADMIN_ID, UserRole.ADMIN, TENANT_A);
        ResultActions result = mockMvc.perform(requestFor(e, CLIENT_OTHER, CONSULTANT_SELF, CLIENT_OTHER)
            .session(session(admin))
            .with(r -> {
                TenantContextHolder.setTenantId(TENANT_B);
                return r;
            }));
        assertForbiddenWithoutData(result, ClientPathAccessGuard.DENIAL_OTHER_TENANT);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("clientPathEndpoints")
    @DisplayName("미인증 → 401")
    void unauthenticated_401(Endpoint e) throws Exception {
        mockMvc.perform(requestFor(e, CLIENT_SELF, CONSULTANT_SELF, CLIENT_SELF))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.data").doesNotExist());
        verifyNoInteractions(dataServices);
    }

    // ---- 경로 상담사 id ----

    @ParameterizedTest(name = "{0}")
    @MethodSource("consultantPathEndpoints")
    @DisplayName("상담사 본인 200 / 다른 상담사 403 / 내담자 403")
    void consultantPath_selfOnly(Endpoint e) throws Exception {
        perform(e, user(CONSULTANT_SELF, UserRole.CONSULTANT, TENANT_A), CLIENT_SELF, CONSULTANT_SELF)
            .andExpect(status().is2xxSuccessful());
        setUp();
        assertForbiddenWithoutData(
            perform(e, user(CONSULTANT_SELF, UserRole.CONSULTANT, TENANT_A), CLIENT_SELF, CONSULTANT_OTHER),
            ClientPathAccessGuard.DENIAL_OWN_CONSULTANT_ONLY);
        setUp();
        assertForbiddenWithoutData(
            perform(e, user(CLIENT_SELF, UserRole.CLIENT, TENANT_A), CLIENT_SELF, CONSULTANT_SELF),
            ClientPathAccessGuard.DENIAL_OWN_CONSULTANT_ONLY);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("consultantPathEndpoints")
    @DisplayName("관리자 같은 테넌트 200 / 다른 테넌트 403 / 미인증 401")
    void consultantPath_adminTenantAndUnauthenticated(Endpoint e) throws Exception {
        perform(e, user(ADMIN_ID, UserRole.ADMIN, TENANT_A), CLIENT_SELF, CONSULTANT_OTHER)
            .andExpect(status().is2xxSuccessful());
        setUp();
        assertForbiddenWithoutData(
            perform(e, user(ADMIN_B_ID, UserRole.ADMIN, TENANT_B), CLIENT_SELF, CONSULTANT_OTHER),
            ClientPathAccessGuard.DENIAL_OTHER_TENANT);
        setUp();
        mockMvc.perform(requestFor(e, CLIENT_SELF, CONSULTANT_SELF, CLIENT_SELF))
            .andExpect(status().isUnauthorized());
        verifyNoInteractions(dataServices);
    }

    // ---- /consultants/{c}/clients/{id} ----

    @ParameterizedTest(name = "{0}")
    @MethodSource("consultantClientEndpoints")
    @DisplayName("상담사 본인+매칭 200 / 미매칭 403 / 타 상담사 id 403 / 내담자 본인도 403 / 관리자 200 / 미인증 401")
    void consultantClient_matrix(Endpoint e) throws Exception {
        User consultant = user(CONSULTANT_SELF, UserRole.CONSULTANT, TENANT_A);
        perform(e, consultant, CLIENT_SELF, CONSULTANT_SELF).andExpect(status().is2xxSuccessful());
        setUp();
        assertForbiddenWithoutData(perform(e, consultant, CLIENT_OTHER, CONSULTANT_SELF),
            ClientPathAccessGuard.DENIAL_UNMAPPED_CLIENT);
        setUp();
        assertForbiddenWithoutData(perform(e, consultant, CLIENT_SELF, CONSULTANT_OTHER),
            ClientPathAccessGuard.DENIAL_OWN_CONSULTANT_ONLY);
        setUp();
        assertForbiddenWithoutData(
            perform(e, user(CLIENT_SELF, UserRole.CLIENT, TENANT_A), CLIENT_SELF, CONSULTANT_SELF),
            ClientPathAccessGuard.DENIAL_OWN_CONSULTANT_ONLY);
        setUp();
        perform(e, user(ADMIN_ID, UserRole.ADMIN, TENANT_A), CLIENT_OTHER, CONSULTANT_OTHER)
            .andExpect(status().is2xxSuccessful());
        setUp();
        mockMvc.perform(requestFor(e, CLIENT_SELF, CONSULTANT_SELF, CLIENT_SELF))
            .andExpect(status().isUnauthorized());
        verifyNoInteractions(dataServices);
    }

    // ---- 계정 속성 변경 (관리자 전용) ----

    @ParameterizedTest(name = "{0}")
    @MethodSource("managerOnlyEndpoints")
    @DisplayName("내담자(본인 포함)·상담사 403 / 관리자·사무원 200 / 미인증 401")
    void managerOnly_matrix(Endpoint e) throws Exception {
        assertForbiddenWithoutData(
            performTarget(e, user(CLIENT_SELF, UserRole.CLIENT, TENANT_A), CLIENT_SELF),
            ClientPathAccessGuard.DENIAL_MANAGER_ONLY);
        setUp();
        assertForbiddenWithoutData(
            performTarget(e, user(CLIENT_SELF, UserRole.CLIENT, TENANT_A), CLIENT_OTHER),
            ClientPathAccessGuard.DENIAL_MANAGER_ONLY);
        setUp();
        assertForbiddenWithoutData(
            performTarget(e, user(CONSULTANT_SELF, UserRole.CONSULTANT, TENANT_A), CLIENT_SELF),
            ClientPathAccessGuard.DENIAL_MANAGER_ONLY);
        setUp();
        performTarget(e, user(ADMIN_ID, UserRole.ADMIN, TENANT_A), CLIENT_OTHER)
            .andExpect(status().is2xxSuccessful());
        performTarget(e, user(STAFF_ID, UserRole.STAFF, TENANT_A), CLIENT_OTHER)
            .andExpect(status().is2xxSuccessful());
        setUp();
        mockMvc.perform(requestFor(e, CLIENT_SELF, CONSULTANT_SELF, CLIENT_SELF))
            .andExpect(status().isUnauthorized());
        verifyNoInteractions(dataServices);
    }

    // ---- helpers ----

    private void assertForbiddenWithoutData(ResultActions result, String expectedMessage) throws Exception {
        result.andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message").value(expectedMessage))
            .andExpect(jsonPath("$.data").doesNotExist());
        verifyNoInteractions(dataServices);
    }

    private ResultActions perform(Endpoint e, User caller, long clientId, long consultantId) throws Exception {
        return performWith(e, caller, clientId, consultantId, clientId);
    }

    private ResultActions performTarget(Endpoint e, User caller, long targetId) throws Exception {
        return performWith(e, caller, CLIENT_SELF, CONSULTANT_SELF, targetId);
    }

    private ResultActions performWith(Endpoint e, User caller, long clientId, long consultantId, long targetId)
            throws Exception {
        return mockMvc.perform(requestFor(e, clientId, consultantId, targetId)
            .session(session(caller))
            .with(r -> {
                TenantContextHolder.setTenantId(caller.getTenantId());
                return r;
            }));
    }

    private static MockHttpServletRequestBuilder requestFor(Endpoint e, long clientId, long consultantId,
            long targetId) {
        String uri = e.template()
            .replace(CLIENT, String.valueOf(clientId))
            .replace(CONSULTANT, String.valueOf(consultantId))
            .replace(TARGET, String.valueOf(targetId));
        String body = e.body() == null ? null : e.body()
            .replace(CONSULTANT, String.valueOf(consultantId));
        MockHttpServletRequestBuilder builder = request(e.method(), uri);
        if (body != null) {
            builder.contentType(MediaType.APPLICATION_JSON).content(body);
        }
        return builder;
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
}
