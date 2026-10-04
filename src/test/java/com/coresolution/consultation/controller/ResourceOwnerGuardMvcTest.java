package com.coresolution.consultation.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.lang.reflect.Constructor;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;

import com.coresolution.consultation.assessment.controller.PsychAssessmentController;
import com.coresolution.consultation.assessment.entity.PsychAssessmentDocument;
import com.coresolution.consultation.assessment.entity.PsychAssessmentReport;
import com.coresolution.consultation.assessment.repository.PsychAssessmentDocumentRepository;
import com.coresolution.consultation.assessment.repository.PsychAssessmentReportRepository;
import com.coresolution.consultation.assessment.service.PsychAssessmentIngestService;
import com.coresolution.consultation.assessment.service.PsychAssessmentReportService;
import com.coresolution.consultation.assessment.service.PsychAssessmentStatsService;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultantAvailability;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantRating;
import com.coresolution.consultation.entity.ConsultationAudioFile;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.entity.MultimodalEmotionReport;
import com.coresolution.consultation.entity.TextEmotionAnalysis;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.VideoEmotionAnalysis;
import com.coresolution.consultation.entity.VoiceBiomarker;
import com.coresolution.consultation.exception.GlobalExceptionHandler;
import com.coresolution.consultation.repository.ConsultantAvailabilityRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultantRatingRepository;
import com.coresolution.consultation.repository.ConsultationAudioFileRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.MultimodalEmotionReportRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.ConsultantRatingService;
import com.coresolution.consultation.service.EmotionAnalysisService;
import com.coresolution.consultation.service.impl.ConsultantAvailabilityServiceImpl;
import com.coresolution.consultation.service.support.ClientPathAccessGuard;
import com.coresolution.consultation.service.support.ResourceOwnerAccessGuard;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.core.env.Environment;
import org.springframework.dao.InvalidDataAccessResourceUsageException;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * P0 보안 회귀 (3차) — 자원 id API 소유자 가드 ({@link ResourceOwnerAccessGuard}).
 *
 * <p>2026-10-04 .dev 재현: 내담자(20)가 {@code GET /assessments/psych/documents/recent} 로 타 내담자 문서
 * 목록(4건 중 타인 3건)을, {@code GET /assessments/psych/documents/{타인 문서}/report} 로 타인 리포트 본문을
 * 200 으로 받음. 쓰기 API(가용시간·휴무·평가·감정 분석)는 코드상 소유자 검사가 없었다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("자원 id API 소유자 가드 (P0 3차)")
class ResourceOwnerGuardMvcTest {

    private static final String TENANT_A = "tenant-resource-owner-a";
    private static final String TENANT_B = "tenant-resource-owner-b";
    private static final long CLIENT_SELF = 20L;
    private static final long CLIENT_OTHER = 21L;
    private static final long CONSULTANT_SELF = 30L;
    private static final long CONSULTANT_OTHER = 31L;
    private static final long ADMIN_ID = 1L;
    private static final long STAFF_ID = 2L;
    private static final long ADMIN_B_ID = 900L;

    private static final long DOC_SELF = 100L;
    private static final long DOC_OTHER = 101L;
    private static final long DOC_NO_CLIENT = 102L;
    private static final long RATING_SELF = 200L;
    private static final long RATING_OTHER = 201L;
    private static final long RECORD_SELF = 300L;
    private static final long RECORD_OTHER = 301L;
    private static final long AUDIO_SELF = 400L;
    private static final long AUDIO_OTHER = 401L;
    private static final long REPORT_SELF = 500L;
    private static final long REPORT_OTHER = 501L;
    private static final long SLOT_SELF = 600L;
    private static final long SLOT_OTHER = 601L;

    private static final String RES = "{res}";
    private static final String CONSULTANT = "{consultant}";

    private PsychAssessmentIngestService ingestService;
    private PsychAssessmentReportService reportService;
    private PsychAssessmentStatsService statsService;
    private PsychAssessmentReportRepository psychReportRepository;
    private PsychAssessmentDocumentRepository psychDocumentRepository;
    private ConsultantRatingService ratingService;
    private EmotionAnalysisService emotionAnalysisService;
    private ConsultantAvailabilityServiceImpl availabilityService;
    private ConsultantRatingRepository ratingRepository;
    private ConsultationRecordRepository recordRepository;
    private ConsultationAudioFileRepository audioFileRepository;
    private MultimodalEmotionReportRepository multimodalReportRepository;
    private ConsultantAvailabilityRepository availabilityRepository;
    private ConsultantClientMappingRepository mappingRepository;
    private UserRepository userRepository;
    private Environment environment;
    private Object[] dataServices;
    private MockMvc mockMvc;

    /** 대상 엔드포인트. {@code template} 의 {res} 는 자원 id, {consultant} 는 상담사 id 로 치환. */
    record Endpoint(String name, HttpMethod method, String template, String body, long selfRes, long otherRes) {
        @Override
        public String toString() {
            return name;
        }
    }

    /** 내담자 소유 자원 (본인·매칭 상담사·같은 테넌트 관리자 허용). */
    static Stream<Endpoint> clientOwnedEndpoints() {
        return Stream.of(
            new Endpoint("GET psych documents/{id}/report", HttpMethod.GET,
                "/api/v1/assessments/psych/documents/" + RES + "/report", null, DOC_SELF, DOC_OTHER),
            new Endpoint("POST psych documents/{id}/report", HttpMethod.POST,
                "/api/v1/assessments/psych/documents/" + RES + "/report", null, DOC_SELF, DOC_OTHER),
            new Endpoint("POST emotion voice/{audioFileId}", HttpMethod.POST,
                "/api/v1/emotion-analysis/voice/" + RES, null, AUDIO_SELF, AUDIO_OTHER),
            new Endpoint("POST emotion text/{recordId}", HttpMethod.POST,
                "/api/v1/emotion-analysis/text/" + RES, "{\"text\":\"t\"}", RECORD_SELF, RECORD_OTHER),
            new Endpoint("POST emotion multimodal/{recordId}", HttpMethod.POST,
                "/api/v1/emotion-analysis/multimodal/" + RES, null, RECORD_SELF, RECORD_OTHER),
            new Endpoint("GET emotion multimodal/{reportId}", HttpMethod.GET,
                "/api/v1/emotion-analysis/multimodal/" + RES, null, REPORT_SELF, REPORT_OTHER));
    }

    /** 상담사 소유 쓰기 (상담사 본인·같은 테넌트 관리자만, 내담자 거부). */
    static Stream<Endpoint> consultantWriteEndpoints() {
        return Stream.of(
            new Endpoint("POST consultants/{id}/availability", HttpMethod.POST,
                "/api/v1/consultants/" + CONSULTANT + "/availability", "{}", 0, 0),
            new Endpoint("PUT consultants/availability/{slotId}", HttpMethod.PUT,
                "/api/v1/consultants/availability/" + RES, "{}", SLOT_SELF, SLOT_OTHER),
            new Endpoint("DELETE consultants/availability/{slotId}", HttpMethod.DELETE,
                "/api/v1/consultants/availability/" + RES, null, SLOT_SELF, SLOT_OTHER),
            new Endpoint("POST consultants/{id}/vacation", HttpMethod.POST,
                "/api/v1/consultants/" + CONSULTANT + "/vacation", "{\"date\":\"2026-10-05\"}", 0, 0),
            new Endpoint("DELETE consultants/{id}/vacation/{date}", HttpMethod.DELETE,
                "/api/v1/consultants/" + CONSULTANT + "/vacation/2026-10-05", null, 0, 0));
    }

    @BeforeEach
    void setUp() throws Exception {
        SecurityContextHolder.clearContext();
        TenantContextHolder.clear();
        ingestService = mock(PsychAssessmentIngestService.class);
        reportService = mock(PsychAssessmentReportService.class);
        statsService = mock(PsychAssessmentStatsService.class);
        psychReportRepository = mock(PsychAssessmentReportRepository.class);
        psychDocumentRepository = mock(PsychAssessmentDocumentRepository.class);
        ratingService = mock(ConsultantRatingService.class);
        emotionAnalysisService = mock(EmotionAnalysisService.class);
        availabilityService = mock(ConsultantAvailabilityServiceImpl.class);
        ratingRepository = mock(ConsultantRatingRepository.class);
        recordRepository = mock(ConsultationRecordRepository.class);
        audioFileRepository = mock(ConsultationAudioFileRepository.class);
        multimodalReportRepository = mock(MultimodalEmotionReportRepository.class);
        availabilityRepository = mock(ConsultantAvailabilityRepository.class);
        mappingRepository = mock(ConsultantClientMappingRepository.class);
        userRepository = mock(UserRepository.class);
        environment = mock(Environment.class);
        dataServices = new Object[] {ingestService, reportService, statsService, psychReportRepository,
            ratingService, emotionAnalysisService, availabilityService};

        ClientPathAccessGuard clientGuard = new ClientPathAccessGuard(mappingRepository, userRepository);
        ResourceOwnerAccessGuard ownerGuard = new ResourceOwnerAccessGuard(clientGuard, psychDocumentRepository,
            ratingRepository, recordRepository, audioFileRepository, multimodalReportRepository,
            availabilityRepository, mock(FinancialTransactionRepository.class),
            mock(com.coresolution.consultation.repository.ItemRepository.class),
            mock(com.coresolution.consultation.repository.PurchaseRequestRepository.class),
            mock(com.coresolution.consultation.repository.PurchaseOrderRepository.class),
            mock(com.coresolution.consultation.repository.BudgetRepository.class),
            mock(com.coresolution.consultation.repository.RecurringExpenseRepository.class),
            mock(com.coresolution.consultation.repository.ConsultantSalaryProfileRepository.class),
            mock(com.coresolution.consultation.repository.SalaryCalculationRepository.class),
            mock(com.coresolution.core.repository.ErdDiagramRepository.class));
        Object[] provided = {clientGuard, ownerGuard, ingestService, reportService, statsService,
            psychReportRepository, psychDocumentRepository, ratingService, emotionAnalysisService,
            availabilityService, environment};

        mockMvc = MockMvcBuilders.standaloneSetup(
                build(PsychAssessmentController.class, provided),
                build(ConsultantRatingController.class, provided),
                build(EmotionAnalysisController.class, provided),
                build(ConsultantAvailabilityController.class, provided))
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();

        for (long id : new long[] {CLIENT_SELF, CLIENT_OTHER, CONSULTANT_SELF, CONSULTANT_OTHER, ADMIN_ID, STAFF_ID}) {
            when(userRepository.findByTenantIdAndId(TENANT_A, id)).thenReturn(Optional.of(new User()));
        }
        when(mappingRepository.findAllByTenantIdAndConsultantIdAndClientIdOrderByCreatedAtDesc(
            TENANT_A, CONSULTANT_SELF, CLIENT_SELF)).thenReturn(List.of(new ConsultantClientMapping()));

        when(psychDocumentRepository.findByTenantIdAndId(TENANT_A, DOC_SELF)).thenReturn(Optional.of(doc(CLIENT_SELF)));
        when(psychDocumentRepository.findByTenantIdAndId(TENANT_A, DOC_OTHER))
            .thenReturn(Optional.of(doc(CLIENT_OTHER)));
        when(psychDocumentRepository.findByTenantIdAndId(TENANT_A, DOC_NO_CLIENT)).thenReturn(Optional.of(doc(null)));
        PsychAssessmentReport report = new PsychAssessmentReport();
        report.setReportMarkdown("## 요약");
        when(psychReportRepository.findTopByTenantIdAndDocumentIdOrderByCreatedAtDesc(eq(TENANT_A), anyLong()))
            .thenReturn(Optional.of(report));
        when(reportService.generateLatestReport(anyLong())).thenReturn(1L);

        ConsultantRating ratingSelf = rating(CLIENT_SELF);
        ConsultantRating ratingOther = rating(CLIENT_OTHER);
        when(ratingRepository.findByTenantIdAndId(TENANT_A, RATING_SELF)).thenReturn(Optional.of(ratingSelf));
        when(ratingRepository.findByTenantIdAndId(TENANT_A, RATING_OTHER)).thenReturn(Optional.of(ratingOther));
        ConsultantRating created = mock(ConsultantRating.class);
        when(created.getConsultant()).thenReturn(new User());
        when(ratingService.createRating(anyLong(), anyLong(), any(), any(), any(), any())).thenReturn(created);
        when(ratingService.updateRating(anyLong(), any(), any(), any())).thenReturn(created);

        when(recordRepository.findByTenantIdAndId(TENANT_A, RECORD_SELF)).thenReturn(Optional.of(record(CLIENT_SELF)));
        when(recordRepository.findByTenantIdAndId(TENANT_A, RECORD_OTHER))
            .thenReturn(Optional.of(record(CLIENT_OTHER)));
        when(audioFileRepository.findByTenantIdAndId(TENANT_A, AUDIO_SELF)).thenReturn(Optional.of(audio(RECORD_SELF)));
        when(audioFileRepository.findByTenantIdAndId(TENANT_A, AUDIO_OTHER))
            .thenReturn(Optional.of(audio(RECORD_OTHER)));
        when(multimodalReportRepository.findByTenantIdAndIdAndIsDeletedFalse(TENANT_A, REPORT_SELF))
            .thenReturn(Optional.of(multimodal(RECORD_SELF)));
        when(multimodalReportRepository.findByTenantIdAndIdAndIsDeletedFalse(TENANT_A, REPORT_OTHER))
            .thenReturn(Optional.of(multimodal(RECORD_OTHER)));
        when(emotionAnalysisService.analyzeVoiceBiomarkers(anyLong())).thenReturn(new VoiceBiomarker());
        when(emotionAnalysisService.analyzeVideoEmotion(anyLong(), anyString())).thenReturn(new VideoEmotionAnalysis());
        when(emotionAnalysisService.analyzeTextEmotion(anyLong(), anyString(), anyString()))
            .thenReturn(new TextEmotionAnalysis());
        when(emotionAnalysisService.generateMultimodalReport(anyLong())).thenReturn(new MultimodalEmotionReport());
        when(emotionAnalysisService.getMultimodalReport(anyLong())).thenReturn(new MultimodalEmotionReport());

        when(availabilityRepository.findByTenantIdAndId(TENANT_A, SLOT_SELF)).thenReturn(Optional.of(slot(CONSULTANT_SELF)));
        when(availabilityRepository.findByTenantIdAndId(TENANT_A, SLOT_OTHER))
            .thenReturn(Optional.of(slot(CONSULTANT_OTHER)));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    // ---- 내담자 소유 자원 (심리검사 리포트 · 감정 분석) ----

    @ParameterizedTest(name = "{0}")
    @MethodSource("clientOwnedEndpoints")
    @DisplayName("내담자 본인 자원 → 2xx")
    void clientOwned_self_ok(Endpoint e) throws Exception {
        perform(e, user(CLIENT_SELF, UserRole.CLIENT, TENANT_A), e.selfRes()).andExpect(status().is2xxSuccessful());
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("clientOwnedEndpoints")
    @DisplayName("내담자가 타 내담자 자원 → 403, 데이터 없음, 서비스 미호출")
    void clientOwned_otherClient_forbidden(Endpoint e) throws Exception {
        assertForbidden(perform(e, user(CLIENT_SELF, UserRole.CLIENT, TENANT_A), e.otherRes()),
            ResourceOwnerAccessGuard.DENIAL_RESOURCE_UNAVAILABLE);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("clientOwnedEndpoints")
    @DisplayName("상담사 — 매칭 내담자 자원 2xx / 미매칭 내담자 자원 403")
    void clientOwned_consultantMappedOnly(Endpoint e) throws Exception {
        User consultant = user(CONSULTANT_SELF, UserRole.CONSULTANT, TENANT_A);
        perform(e, consultant, e.selfRes()).andExpect(status().is2xxSuccessful());
        setUp();
        assertForbidden(perform(e, consultant, e.otherRes()),
            ResourceOwnerAccessGuard.DENIAL_RESOURCE_UNAVAILABLE);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("clientOwnedEndpoints")
    @DisplayName("같은 테넌트 관리자·사무원 2xx / 다른 테넌트 관리자 403 / 미인증 401")
    void clientOwned_managerTenantAndUnauthenticated(Endpoint e) throws Exception {
        perform(e, user(ADMIN_ID, UserRole.ADMIN, TENANT_A), e.otherRes()).andExpect(status().is2xxSuccessful());
        perform(e, user(STAFF_ID, UserRole.STAFF, TENANT_A), e.otherRes()).andExpect(status().is2xxSuccessful());
        setUp();
        assertForbidden(perform(e, user(ADMIN_B_ID, UserRole.ADMIN, TENANT_B), e.otherRes()),
            ResourceOwnerAccessGuard.DENIAL_RESOURCE_UNAVAILABLE);
        setUp();
        mockMvc.perform(requestFor(e, e.selfRes(), CONSULTANT_SELF))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.data").doesNotExist());
        verifyNoInteractions(dataServices);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("clientOwnedEndpoints")
    @DisplayName("테넌트 안에 없는 자원 id → 403 (존재 여부 비노출)")
    void clientOwned_unknownId_forbidden(Endpoint e) throws Exception {
        assertForbidden(perform(e, user(ADMIN_ID, UserRole.ADMIN, TENANT_A), 999_999L),
            ResourceOwnerAccessGuard.DENIAL_RESOURCE_UNAVAILABLE);
    }

    @Test
    @DisplayName("내담자 미지정 심리검사 문서 리포트 — 관리자 200 / 상담사·내담자 403")
    void psychDocumentWithoutClient_managerOnly() throws Exception {
        String uri = "/api/v1/assessments/psych/documents/" + DOC_NO_CLIENT + "/report";
        call(HttpMethod.GET, uri, null, user(ADMIN_ID, UserRole.ADMIN, TENANT_A))
            .andExpect(status().isOk());
        setUp();
        assertForbidden(call(HttpMethod.GET, uri, null, user(CONSULTANT_SELF, UserRole.CONSULTANT, TENANT_A)),
            ResourceOwnerAccessGuard.DENIAL_RESOURCE_UNAVAILABLE);
        setUp();
        assertForbidden(call(HttpMethod.GET, uri, null, user(CLIENT_SELF, UserRole.CLIENT, TENANT_A)),
            ResourceOwnerAccessGuard.DENIAL_RESOURCE_UNAVAILABLE);
    }

    @Test
    @DisplayName("자원 조회가 DB 오류로 실패해도 403 — 내담자·상담사 모두 500 아님, 기술 문구 없음")
    void resourceLookupFailure_forbiddenNotServerError() throws Exception {
        String uri = "/api/v1/emotion-analysis/multimodal/" + REPORT_SELF;
        for (User caller : List.of(user(CLIENT_SELF, UserRole.CLIENT, TENANT_A),
                user(CONSULTANT_SELF, UserRole.CONSULTANT, TENANT_A))) {
            setUp();
            when(multimodalReportRepository.findByTenantIdAndIdAndIsDeletedFalse(eq(TENANT_A), anyLong()))
                .thenThrow(new InvalidDataAccessResourceUsageException(
                    "could not execute query [Unknown column 'm1_0.deleted_at' in 'field list']"));
            assertForbidden(call(HttpMethod.GET, uri, null, caller),
                ResourceOwnerAccessGuard.DENIAL_RESOURCE_UNAVAILABLE)
                .andExpect(content().string(not(containsString("deleted_at"))))
                .andExpect(content().string(not(containsString("Unknown column"))));
        }
    }

    @Test
    @DisplayName("POST emotion video/{recordId} — 본인 200 / 타 내담자 403 / 미인증 401")
    void emotionVideo_matrix() throws Exception {
        performVideo(RECORD_SELF, user(CLIENT_SELF, UserRole.CLIENT, TENANT_A)).andExpect(status().isOk());
        setUp();
        assertForbidden(performVideo(RECORD_OTHER, user(CLIENT_SELF, UserRole.CLIENT, TENANT_A)),
            ResourceOwnerAccessGuard.DENIAL_RESOURCE_UNAVAILABLE);
        setUp();
        assertForbidden(performVideo(RECORD_OTHER, user(CONSULTANT_SELF, UserRole.CONSULTANT, TENANT_A)),
            ResourceOwnerAccessGuard.DENIAL_RESOURCE_UNAVAILABLE);
        setUp();
        mockMvc.perform(multipart("/api/v1/emotion-analysis/video/" + RECORD_SELF).file(videoFile()))
            .andExpect(status().isUnauthorized());
        verifyNoInteractions(dataServices);
    }

    @Test
    @DisplayName("POST emotion track/{본인 id} 에 타 내담자 상담기록 id → 403 (타인 감정 점수 복사 차단)")
    void emotionTrack_otherClientsRecord_forbidden() throws Exception {
        String uri = "/api/v1/emotion-analysis/track/" + CLIENT_SELF + "?consultationRecordId=%d&sessionNumber=1";
        call(HttpMethod.POST, String.format(uri, RECORD_SELF), null, user(CLIENT_SELF, UserRole.CLIENT, TENANT_A))
            .andExpect(status().isOk());
        setUp();
        assertForbidden(call(HttpMethod.POST, String.format(uri, RECORD_OTHER), null,
            user(CLIENT_SELF, UserRole.CLIENT, TENANT_A)), ResourceOwnerAccessGuard.DENIAL_RESOURCE_UNAVAILABLE);
        setUp();
        assertForbidden(call(HttpMethod.POST, String.format(uri, RECORD_OTHER), null,
            user(ADMIN_ID, UserRole.ADMIN, TENANT_A)), ResourceOwnerAccessGuard.DENIAL_RESOURCE_UNAVAILABLE);
    }

    // ---- 심리검사 목록·통계 ----

    @Nested
    @DisplayName("심리검사 recent · stats · 업로드")
    class PsychListing {

        private static final String RECENT = "/api/v1/assessments/psych/documents/recent";
        private static final String STATS = "/api/v1/assessments/psych/stats";

        @BeforeEach
        void docs() {
            when(psychDocumentRepository.findTop20ByTenantIdOrderByCreatedAtDesc(TENANT_A))
                .thenReturn(List.of(doc(CLIENT_SELF), doc(CLIENT_OTHER), doc(null)));
            when(statsService.getTenantStats()).thenReturn(Map.of("total", 3));
        }

        @Test
        @DisplayName("내담자 → recent·stats 403, 목록 미노출")
        void client_forbidden() throws Exception {
            assertForbidden(call(HttpMethod.GET, RECENT, null, user(CLIENT_SELF, UserRole.CLIENT, TENANT_A)),
                ClientPathAccessGuard.DENIAL_STAFF_OR_CONSULTANT_ONLY);
            assertForbidden(call(HttpMethod.GET, STATS, null, user(CLIENT_SELF, UserRole.CLIENT, TENANT_A)),
                ClientPathAccessGuard.DENIAL_STAFF_OR_CONSULTANT_ONLY);
        }

        @Test
        @DisplayName("상담사 → recent 는 매칭 내담자 문서만 (3건 중 1건)")
        void consultant_filteredToMapped() throws Exception {
            call(HttpMethod.GET, RECENT, null, user(CONSULTANT_SELF, UserRole.CONSULTANT, TENANT_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].clientId").value((int) CLIENT_SELF));
        }

        @Test
        @DisplayName("관리자 → recent 전체 3건, stats 200 / 다른 테넌트 컨텍스트 403 / 미인증 401")
        void admin_all() throws Exception {
            call(HttpMethod.GET, RECENT, null, user(ADMIN_ID, UserRole.ADMIN, TENANT_A))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(3));
            call(HttpMethod.GET, STATS, null, user(ADMIN_ID, UserRole.ADMIN, TENANT_A))
                .andExpect(status().isOk());
            mockMvc.perform(request(HttpMethod.GET, RECENT))
                .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("업로드 — 내담자 403 / 상담사 미매칭 clientId 403 (서비스 미호출)")
        void upload_guarded() throws Exception {
            MockMultipartFile pdf = new MockMultipartFile("file", "a.pdf", "application/pdf", new byte[] {1});
            assertForbidden(mockMvc.perform(multipart("/api/v1/assessments/psych/documents").file(pdf)
                    .param("type", "TCI").param("clientId", String.valueOf(CLIENT_SELF))
                    .session(session(user(CLIENT_SELF, UserRole.CLIENT, TENANT_A)))
                    .with(tenant(TENANT_A))),
                ClientPathAccessGuard.DENIAL_STAFF_OR_CONSULTANT_ONLY);
            assertForbidden(mockMvc.perform(multipart("/api/v1/assessments/psych/documents").file(pdf)
                    .param("type", "TCI").param("clientId", String.valueOf(CLIENT_OTHER))
                    .session(session(user(CONSULTANT_SELF, UserRole.CONSULTANT, TENANT_A)))
                    .with(tenant(TENANT_A))),
                ClientPathAccessGuard.DENIAL_UNMAPPED_CLIENT);
        }
    }

    // ---- 평가 ----

    @Nested
    @DisplayName("평가 create · update · delete")
    class Ratings {

        private static final String CREATE = "/api/v1/ratings/create";

        private String body(Long clientId) {
            return "{\"scheduleId\":7," + (clientId == null ? "" : "\"clientId\":" + clientId + ",")
                + "\"heartScore\":5}";
        }

        @Test
        @DisplayName("create — 본인 clientId 201·세션 id 로 저장 / clientId 누락 시 세션 id 강제")
        void create_self() throws Exception {
            call(HttpMethod.POST, CREATE, body(CLIENT_SELF), user(CLIENT_SELF, UserRole.CLIENT, TENANT_A))
                .andExpect(status().is2xxSuccessful());
            verify(ratingService).createRating(eq(7L), eq(CLIENT_SELF), eq(5), isNull(), isNull(), isNull());
            setUp();
            call(HttpMethod.POST, CREATE, body(null), user(CLIENT_SELF, UserRole.CLIENT, TENANT_A))
                .andExpect(status().is2xxSuccessful());
            verify(ratingService).createRating(eq(7L), eq(CLIENT_SELF), eq(5), isNull(), isNull(), isNull());
        }

        @Test
        @DisplayName("create — 타 내담자 clientId 403 / 상담사·관리자 403 / 미인증 401 (서비스 미호출)")
        void create_forbidden() throws Exception {
            assertForbidden(call(HttpMethod.POST, CREATE, body(CLIENT_OTHER),
                user(CLIENT_SELF, UserRole.CLIENT, TENANT_A)), ResourceOwnerAccessGuard.DENIAL_CLIENT_RATING_ONLY);
            assertForbidden(call(HttpMethod.POST, CREATE, body(CLIENT_SELF),
                user(CONSULTANT_SELF, UserRole.CONSULTANT, TENANT_A)),
                ResourceOwnerAccessGuard.DENIAL_CLIENT_RATING_ONLY);
            assertForbidden(call(HttpMethod.POST, CREATE, body(CLIENT_SELF),
                user(ADMIN_ID, UserRole.ADMIN, TENANT_A)), ResourceOwnerAccessGuard.DENIAL_CLIENT_RATING_ONLY);
            mockMvc.perform(request(HttpMethod.POST, CREATE).contentType(MediaType.APPLICATION_JSON)
                    .content(body(CLIENT_SELF)))
                .andExpect(status().isUnauthorized());
            verifyNoInteractions(dataServices);
        }

        @Test
        @DisplayName("update — 작성자 200 / 타 내담자·관리자 403 / 미인증 401")
        void update_ownerOnly() throws Exception {
            String json = "{\"heartScore\":4}";
            call(HttpMethod.PUT, "/api/v1/ratings/" + RATING_SELF, json, user(CLIENT_SELF, UserRole.CLIENT, TENANT_A))
                .andExpect(status().isOk());
            setUp();
            assertForbidden(call(HttpMethod.PUT, "/api/v1/ratings/" + RATING_OTHER, json,
                user(CLIENT_SELF, UserRole.CLIENT, TENANT_A)), ResourceOwnerAccessGuard.DENIAL_RESOURCE_UNAVAILABLE);
            assertForbidden(call(HttpMethod.PUT, "/api/v1/ratings/" + RATING_OTHER, json,
                user(ADMIN_ID, UserRole.ADMIN, TENANT_A)), ResourceOwnerAccessGuard.DENIAL_RESOURCE_UNAVAILABLE);
            mockMvc.perform(request(HttpMethod.PUT, "/api/v1/ratings/" + RATING_SELF)
                    .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isUnauthorized());
            verifyNoInteractions(dataServices);
        }

        @Test
        @DisplayName("delete — 작성자 200 / 관리자 200(작성자 id 로 삭제) / 타 내담자·상담사·타 테넌트 403")
        void delete_ownerOrManager() throws Exception {
            call(HttpMethod.DELETE, "/api/v1/ratings/" + RATING_SELF + "?clientId=" + CLIENT_SELF, null,
                user(CLIENT_SELF, UserRole.CLIENT, TENANT_A)).andExpect(status().is2xxSuccessful());
            verify(ratingService).deleteRating(RATING_SELF, CLIENT_SELF);
            setUp();
            call(HttpMethod.DELETE, "/api/v1/ratings/" + RATING_OTHER, null, user(ADMIN_ID, UserRole.ADMIN, TENANT_A))
                .andExpect(status().is2xxSuccessful());
            verify(ratingService).deleteRating(RATING_OTHER, CLIENT_OTHER);
            setUp();
            assertForbidden(call(HttpMethod.DELETE, "/api/v1/ratings/" + RATING_OTHER + "?clientId=" + CLIENT_OTHER,
                null, user(CLIENT_SELF, UserRole.CLIENT, TENANT_A)), ResourceOwnerAccessGuard.DENIAL_RESOURCE_UNAVAILABLE);
            assertForbidden(call(HttpMethod.DELETE, "/api/v1/ratings/" + RATING_SELF + "?clientId=" + CLIENT_OTHER,
                null, user(CLIENT_SELF, UserRole.CLIENT, TENANT_A)), ResourceOwnerAccessGuard.DENIAL_RESOURCE_UNAVAILABLE);
            assertForbidden(call(HttpMethod.DELETE, "/api/v1/ratings/" + RATING_SELF, null,
                user(CONSULTANT_SELF, UserRole.CONSULTANT, TENANT_A)), ResourceOwnerAccessGuard.DENIAL_RESOURCE_UNAVAILABLE);
            assertForbidden(call(HttpMethod.DELETE, "/api/v1/ratings/" + RATING_SELF, null,
                user(ADMIN_B_ID, UserRole.ADMIN, TENANT_B)), ResourceOwnerAccessGuard.DENIAL_RESOURCE_UNAVAILABLE);
            mockMvc.perform(request(HttpMethod.DELETE, "/api/v1/ratings/" + RATING_SELF))
                .andExpect(status().isUnauthorized());
            verifyNoInteractions(dataServices);
        }
    }

    // ---- 상담사 가용시간·휴무 쓰기 ----

    @ParameterizedTest(name = "{0}")
    @MethodSource("consultantWriteEndpoints")
    @DisplayName("상담사 본인 2xx / 다른 상담사 403 / 내담자 403")
    void consultantWrite_selfOnly(Endpoint e) throws Exception {
        performConsultant(e, user(CONSULTANT_SELF, UserRole.CONSULTANT, TENANT_A), e.selfRes(), CONSULTANT_SELF)
            .andExpect(status().is2xxSuccessful());
        setUp();
        String denial = denialFor(e);
        assertForbidden(performConsultant(e, user(CONSULTANT_SELF, UserRole.CONSULTANT, TENANT_A), e.otherRes(),
            CONSULTANT_OTHER), denial);
        setUp();
        assertForbidden(performConsultant(e, user(CLIENT_SELF, UserRole.CLIENT, TENANT_A), e.selfRes(),
            CONSULTANT_SELF), denial);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("consultantWriteEndpoints")
    @DisplayName("같은 테넌트 관리자·사무원 2xx / 다른 테넌트 관리자 403 / 미인증 401")
    void consultantWrite_managerTenantAndUnauthenticated(Endpoint e) throws Exception {
        performConsultant(e, user(ADMIN_ID, UserRole.ADMIN, TENANT_A), e.otherRes(), CONSULTANT_OTHER)
            .andExpect(status().is2xxSuccessful());
        performConsultant(e, user(STAFF_ID, UserRole.STAFF, TENANT_A), e.otherRes(), CONSULTANT_OTHER)
            .andExpect(status().is2xxSuccessful());
        setUp();
        String expected = e.template().contains(CONSULTANT)
            ? ClientPathAccessGuard.DENIAL_OTHER_TENANT : ResourceOwnerAccessGuard.DENIAL_RESOURCE_UNAVAILABLE;
        assertForbidden(performConsultant(e, user(ADMIN_B_ID, UserRole.ADMIN, TENANT_B), e.otherRes(),
            CONSULTANT_OTHER), expected);
        setUp();
        mockMvc.perform(requestFor(e, e.selfRes(), CONSULTANT_SELF))
            .andExpect(status().isUnauthorized());
        verifyNoInteractions(dataServices);
    }

    @Test
    @DisplayName("테스트용 휴무 API — local 아니면 관리자도 403 / local 에서 내담자 403·관리자 200")
    void vacationTestData_localManagerOnly() throws Exception {
        for (String uri : new String[] {"/api/v1/consultants/init-test-data", "/api/v1/consultants/set-vacation-data"}) {
            String json = uri.endsWith("set-vacation-data")
                ? "{\"consultantId\":" + CONSULTANT_SELF + ",\"date\":\"2026-10-05\",\"vacationData\":{}}" : null;
            call(HttpMethod.POST, uri, json, user(ADMIN_ID, UserRole.ADMIN, TENANT_A))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.data").doesNotExist());
            verifyNoInteractions(dataServices);
            setUp();
            when(environment.acceptsProfiles("local")).thenReturn(true);
            assertForbidden(call(HttpMethod.POST, uri, json, user(CLIENT_SELF, UserRole.CLIENT, TENANT_A)),
                ClientPathAccessGuard.DENIAL_MANAGER_ONLY);
            call(HttpMethod.POST, uri, json, user(ADMIN_ID, UserRole.ADMIN, TENANT_A))
                .andExpect(status().isOk());
            setUp();
        }
    }

    // ---- helpers ----

    /** 자원 id(slot) 로 거부되면 공통 문구, 경로 상담사 id 로 거부되면 경로 가드 문구. */
    private static String denialFor(Endpoint e) {
        return e.template().contains(CONSULTANT)
            ? ClientPathAccessGuard.DENIAL_OWN_CONSULTANT_ONLY
            : ResourceOwnerAccessGuard.DENIAL_RESOURCE_UNAVAILABLE;
    }

    private ResultActions assertForbidden(ResultActions result, String expectedMessage) throws Exception {
        result.andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message").value(expectedMessage))
            .andExpect(jsonPath("$.data").doesNotExist());
        verifyNoInteractions(dataServices);
        return result;
    }

    private ResultActions perform(Endpoint e, User caller, long resId) throws Exception {
        return performConsultant(e, caller, resId, CONSULTANT_SELF);
    }

    private ResultActions performConsultant(Endpoint e, User caller, long resId, long consultantId)
            throws Exception {
        return mockMvc.perform(requestFor(e, resId, consultantId).session(session(caller))
            .with(tenant(caller.getTenantId())));
    }

    private ResultActions call(HttpMethod method, String uri, String body, User caller) throws Exception {
        MockHttpServletRequestBuilder builder = request(method, uri).session(session(caller))
            .with(tenant(caller.getTenantId()));
        if (body != null) {
            builder.contentType(MediaType.APPLICATION_JSON).content(body);
        }
        return mockMvc.perform(builder);
    }

    private ResultActions performVideo(long recordId, User caller) throws Exception {
        return mockMvc.perform(multipart("/api/v1/emotion-analysis/video/" + recordId).file(videoFile())
            .session(session(caller)).with(tenant(caller.getTenantId())));
    }

    private static MockMultipartFile videoFile() {
        return new MockMultipartFile("file", "v.mp4", "video/mp4", new byte[] {1});
    }

    private static org.springframework.test.web.servlet.request.RequestPostProcessor tenant(String tenantId) {
        return r -> {
            TenantContextHolder.setTenantId(tenantId);
            return r;
        };
    }

    private static MockHttpServletRequestBuilder requestFor(Endpoint e, long resId, long consultantId) {
        String uri = e.template()
            .replace(RES, String.valueOf(resId))
            .replace(CONSULTANT, String.valueOf(consultantId));
        MockHttpServletRequestBuilder builder = request(e.method(), uri);
        if (e.body() != null) {
            builder.contentType(MediaType.APPLICATION_JSON).content(e.body());
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

    private static PsychAssessmentDocument doc(Long clientId) {
        PsychAssessmentDocument d = new PsychAssessmentDocument();
        d.setClientId(clientId);
        return d;
    }

    private static ConsultantRating rating(long clientId) {
        ConsultantRating r = mock(ConsultantRating.class);
        User client = new User();
        client.setId(clientId);
        when(r.getClient()).thenReturn(client);
        return r;
    }

    private static ConsultationRecord record(long clientId) {
        ConsultationRecord r = new ConsultationRecord();
        r.setClientId(clientId);
        return r;
    }

    private static ConsultationAudioFile audio(long recordId) {
        ConsultationAudioFile a = new ConsultationAudioFile();
        a.setConsultationRecordId(recordId);
        return a;
    }

    private static MultimodalEmotionReport multimodal(long recordId) {
        MultimodalEmotionReport m = new MultimodalEmotionReport();
        m.setConsultationRecordId(recordId);
        return m;
    }

    private static ConsultantAvailability slot(long consultantId) {
        ConsultantAvailability a = new ConsultantAvailability();
        a.setConsultantId(consultantId);
        return a;
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
