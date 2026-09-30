package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.service.PaymentService;
import com.coresolution.consultation.service.portone.PortOnePaymentWebhookService;

/**
 * 레거시 결제 웹훅 {@code POST /api/v1/payments/webhook} 제거 회귀 가드.
 *
 * <p>과거 이 경로는 인증 없이(permitAll) 공개 저장소에 노출된 고정 키 + {@code String.hashCode} 서명만으로
 * 결제를 승인했다. 제거 후에는 어떤 호출도 결제·주문 상태 변경 경로({@link PaymentService},
 * {@link PaymentRepository})에 도달하지 않아야 하며, 포트원 V2 웹훅({@code /api/v1/payments/webhooks/**})의
 * 공개 정책은 그대로여야 한다.
 *
 * @author MindGarden
 * @since 2026-09-30
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("레거시 결제 웹훅 제거 — 상태 변경 없음 · V2 웹훅 공개 유지")
class LegacyPaymentWebhookRemovedIntegrationTest {

    private static final String LEGACY_WEBHOOK_PATH = "/api/v1/payments/webhook";
    private static final String PORTONE_V2_WEBHOOK_PATH = "/api/v1/payments/webhooks/portone/v2";
    private static final String TENANT_HEADER = "X-Tenant-Id";
    private static final String DUMMY_TENANT = "legacy-webhook-removed-guard";
    private static final String FORGED_APPROVAL_BODY = "{\"paymentId\":\"PAY-FORGED-0001\","
            + "\"orderId\":\"ORD-FORGED-0001\",\"status\":\"APPROVED\",\"amount\":15000,"
            + "\"externalData\":{\"paymentId\":\"PAY-FORGED-0001\"},"
            + "\"timestamp\":1700000000,\"signature\":\"sha256=0\"}";
    private static final String V2_PROBE_KEY = "status";
    private static final String V2_PROBE_VALUE = "v2-reached";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    @Qualifier("requestMappingHandlerMapping")
    private RequestMappingHandlerMapping handlerMapping;

    @MockBean
    private PaymentService paymentService;

    @MockBean
    private PaymentRepository paymentRepository;

    @MockBean
    private PortOnePaymentWebhookService portOnePaymentWebhookService;

    @Test
    @DisplayName("미인증 위조 승인 요청(테넌트 헤더 없음) → 2xx 아님, 결제 서비스·저장소 미호출")
    void legacyWebhook_withoutAuthAndTenant_rejectedWithoutStateChange() throws Exception {
        int status = mockMvc.perform(post(LEGACY_WEBHOOK_PATH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(FORGED_APPROVAL_BODY.getBytes(StandardCharsets.UTF_8)))
                .andReturn().getResponse().getStatus();

        assertThat(HttpStatus.valueOf(status).is4xxClientError()).isTrue();
        verifyNoInteractions(paymentService, paymentRepository);
    }

    @Test
    @DisplayName("미인증 위조 승인 요청(테넌트 헤더 있음) → 401 (permitAll 제거), 상태 변경 없음")
    void legacyWebhook_withoutAuth_returns401WithoutStateChange() throws Exception {
        int status = mockMvc.perform(post(LEGACY_WEBHOOK_PATH)
                        .header(TENANT_HEADER, DUMMY_TENANT)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(FORGED_APPROVAL_BODY.getBytes(StandardCharsets.UTF_8)))
                .andReturn().getResponse().getStatus();

        assertThat(status).isEqualTo(HttpStatus.UNAUTHORIZED.value());
        verifyNoInteractions(paymentService, paymentRepository);
    }

    @Test
    @DisplayName("POST 핸들러 매핑 자체가 없음 (보안 필터를 우회해도 처리 경로 없음)")
    void legacyWebhook_noPostHandlerMapping() {
        boolean legacyPostMapped = handlerMapping.getHandlerMethods().keySet().stream()
                .filter(info -> info.getMethodsCondition().getMethods().contains(RequestMethod.POST))
                .flatMap(info -> info.getPatternValues().stream())
                .anyMatch(LEGACY_WEBHOOK_PATH::equals);

        assertThat(legacyPostMapped).isFalse();
    }

    @Test
    @DisplayName("보안 필터 없이 직접 디스패치해도 POST 는 거부(404/405), 결제 서비스·저장소 미호출")
    void legacyWebhook_dispatchedWithoutSecurity_rejectedWithoutStateChange() throws Exception {
        MockMvc noFilterMockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();

        int status = noFilterMockMvc.perform(post(LEGACY_WEBHOOK_PATH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(FORGED_APPROVAL_BODY.getBytes(StandardCharsets.UTF_8)))
                .andReturn().getResponse().getStatus();

        // GET /api/v1/payments/{paymentId} 가 경로만 일치하므로 Spring MVC 는 404 대신 405 를 돌려줄 수 있다.
        assertThat(status).isIn(HttpStatus.NOT_FOUND.value(), HttpStatus.METHOD_NOT_ALLOWED.value());
        verifyNoInteractions(paymentService, paymentRepository);
    }

    @Test
    @DisplayName("포트원 V2 웹훅은 여전히 인증·테넌트 헤더·CSRF 토큰 없이 컨트롤러(서명 검증 서비스)까지 도달")
    void portOneV2Webhook_stillPublic() throws Exception {
        when(portOnePaymentWebhookService.handleWebhook(any(), any(), any(), any()))
                .thenReturn(ResponseEntity.ok(Map.of(V2_PROBE_KEY, V2_PROBE_VALUE)));

        mockMvc.perform(post(PORTONE_V2_WEBHOOK_PATH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}".getBytes(StandardCharsets.UTF_8)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$." + V2_PROBE_KEY).value(V2_PROBE_VALUE));

        verify(portOnePaymentWebhookService).handleWebhook(any(), any(), any(), any());
    }
}
