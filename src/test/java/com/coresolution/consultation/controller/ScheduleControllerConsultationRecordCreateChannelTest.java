package com.coresolution.consultation.controller;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.LinkedHashMap;
import java.util.Map;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.exception.GlobalExceptionHandler;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.InstitutionLinkContractRepository;
import com.coresolution.consultation.service.ConsultationRecordCreateRequestValidator;
import com.coresolution.consultation.service.ConsultationRecordService;
import com.coresolution.consultation.service.InstitutionLinkConsultationLogService;
import com.coresolution.consultation.service.InstitutionLinkConsultationLogWriteRouter;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.ClientPlatform;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * POST /api/v1/schedules/consultation-records 필수값 검증의 클라이언트 채널 분기.
 *
 * <p>컨트롤러 → 실제 라우터 → 실제 검증기 → {@link GlobalExceptionHandler} 까지 HTTP 로 확인한다.
 * 저장 서비스만 목이다.</p>
 *
 * @author CoreSolution
 * @since 2026-09-29
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleController 상담일지 작성 — 웹/앱 채널별 필수값 검증")
class ScheduleControllerConsultationRecordCreateChannelTest {

    private static final String TENANT_ID = "tenant-consultation-create-channel-1";
    private static final String CREATE_URL = "/api/v1/schedules/consultation-records";
    private static final String PLATFORM_IOS = "ios";
    private static final String PLATFORM_ANDROID = "android";
    private static final String PLATFORM_WEB = "web";

    @Mock
    private ConsultationRecordService consultationRecordService;

    @Mock
    private InstitutionLinkConsultationLogService institutionLinkConsultationLogService;

    @Mock
    private ConsultantClientMappingRepository consultantClientMappingRepository;

    @Mock
    private InstitutionLinkContractRepository institutionLinkContractRepository;

    @Mock
    private ClientRepository clientRepository;

    @InjectMocks
    private ScheduleController controller;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        InstitutionLinkConsultationLogWriteRouter router = new InstitutionLinkConsultationLogWriteRouter(
                institutionLinkConsultationLogService,
                consultationRecordService,
                consultantClientMappingRepository,
                institutionLinkContractRepository,
                clientRepository,
                new ConsultationRecordCreateRequestValidator());
        ReflectionTestUtils.setField(controller, "institutionLinkConsultationLogWriteRouter", router);
        lenient().when(consultationRecordService.createConsultationRecord(anyMap()))
                .thenReturn(new ConsultationRecord());
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @AfterEach
    void clearTenant() {
        TenantContextHolder.clear();
    }

    /** 웹 ConsultationLogModal 신규 작성 본문 형태 */
    private static Map<String, Object> webPayload() {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("consultationId", 30L);
        payload.put("clientId", 20L);
        payload.put("consultantId", 41L);
        payload.put("sessionDurationMinutes", 60);
        payload.put("clientCondition", "안정적");
        payload.put("mainIssues", "불안");
        payload.put("interventionMethods", "인지행동");
        payload.put("clientResponse", "긍정적");
        payload.put("riskAssessment", "LOW");
        payload.put("progressEvaluation", "호전");
        return payload;
    }

    /** 수정 전 useCreateRecord 본문 — 필수값 키가 하나도 없다 */
    private static Map<String, Object> legacyAppPayload() {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("consultationId", 30L);
        payload.put("sessionNumber", 3);
        payload.put("clientId", 20L);
        payload.put("consultantId", 41L);
        payload.put("consultantObservations", "요약\n\n전문가 메모");
        payload.put("isSessionCompleted", true);
        payload.put("nextSessionPlan", "다음 회기 과제 점검");
        return payload;
    }

    /** 수정 후 useCreateRecord 본문 — 웹과 같은 필수값 키를 항상 보낸다 */
    private static Map<String, Object> fixedAppPayload() {
        Map<String, Object> payload = legacyAppPayload();
        payload.put("sessionDurationMinutes", 50);
        payload.put("clientCondition", "요약");
        payload.put("mainIssues", "불안");
        payload.put("interventionMethods", "인지행동");
        payload.put("clientResponse", "긍정적");
        payload.put("riskAssessment", "MEDIUM");
        payload.put("progressEvaluation", "호전");
        return payload;
    }

    private MockHttpServletRequestBuilder postJson(Map<String, Object> payload, String platform)
            throws Exception {
        MockHttpServletRequestBuilder builder = post(CREATE_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload));
        if (platform != null) {
            builder.header(ClientPlatform.HEADER_NAME, platform);
        }
        return builder;
    }

    @Test
    @DisplayName("웹: 필수값이 모두 있으면 201 로 작성된다")
    void web_validPayload_created() throws Exception {
        mockMvc.perform(postJson(webPayload(), null))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));

        verify(consultationRecordService).createConsultationRecord(anyMap());
    }

    @Test
    @DisplayName("웹: 필수값이 빠지면 400 VALIDATION_ERROR 이고 저장하지 않는다")
    void web_missingRequired_badRequest() throws Exception {
        Map<String, Object> payload = webPayload();
        payload.remove("mainIssues");
        payload.put("progressEvaluation", "  ");

        mockMvc.perform(postJson(payload, PLATFORM_WEB))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.details").value(containsString("mainIssues")))
                .andExpect(jsonPath("$.details").value(containsString("progressEvaluation")))
                .andExpect(jsonPath("$.details").value(not(containsString("clientCondition"))));

        verify(consultationRecordService, never()).createConsultationRecord(anyMap());
    }

    @Test
    @DisplayName("웹: 헤더 없이 기존 앱 형태 본문을 보내면 웹으로 보고 400")
    void noHeader_legacyShape_treatedAsWeb() throws Exception {
        mockMvc.perform(postJson(legacyAppPayload(), null))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));

        verify(consultationRecordService, never()).createConsultationRecord(anyMap());
    }

    @Test
    @DisplayName("앱: 수정 전 useCreateRecord 본문(ios·android)은 기존처럼 201")
    void app_legacyPayload_passesAsBefore() throws Exception {
        mockMvc.perform(postJson(legacyAppPayload(), PLATFORM_IOS))
                .andExpect(status().isCreated());
        mockMvc.perform(postJson(legacyAppPayload(), PLATFORM_ANDROID))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("앱: 수정된 useCreateRecord 본문은 201 로 작성된다")
    void app_fixedPayload_created() throws Exception {
        mockMvc.perform(postJson(fixedAppPayload(), PLATFORM_IOS))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));

        verify(consultationRecordService).createConsultationRecord(anyMap());
    }

    @Test
    @DisplayName("앱: 수정된 본문에서 필수값이 비면 웹과 같은 400")
    void app_fixedPayload_missingRequired_badRequest() throws Exception {
        Map<String, Object> payload = fixedAppPayload();
        payload.put("interventionMethods", "");
        payload.put("sessionDurationMinutes", 0);

        mockMvc.perform(postJson(payload, PLATFORM_ANDROID))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.details").value(containsString("interventionMethods")))
                .andExpect(jsonPath("$.details").value(containsString("sessionDurationMinutes")));

        verify(consultationRecordService, never()).createConsultationRecord(anyMap());
    }

    @Test
    @DisplayName("앱: 필수값 키를 하나만 보내도 기존 앱으로 보지 않고 전체 검증한다")
    void app_partialRequiredKeys_fullyValidated() throws Exception {
        Map<String, Object> payload = legacyAppPayload();
        payload.put("clientCondition", "요약");

        mockMvc.perform(postJson(payload, PLATFORM_IOS))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details").value(containsString("mainIssues")))
                .andExpect(jsonPath("$.details").value(not(containsString("clientCondition"))));

        verify(consultationRecordService, never()).createConsultationRecord(anyMap());
    }
}
