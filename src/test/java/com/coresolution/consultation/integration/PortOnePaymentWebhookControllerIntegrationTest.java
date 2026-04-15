package com.coresolution.consultation.integration;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.coresolution.core.constants.TenantPgSettingsJsonKeys;
import com.coresolution.core.domain.TenantPgConfiguration;
import com.coresolution.core.domain.enums.PgConfigurationStatus;
import com.coresolution.core.domain.enums.PgProvider;
import com.coresolution.core.repository.TenantPgConfigurationRepository;

/**
 * 포트원 V2 웹훅 컨트롤러 최소 스모크 (서명 검증 + HTTP 상태).
 *
 * @author CoreSolution
 * @since 2026-04-16
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@DisplayName("PortOnePaymentWebhookController V2 웹훅 통합(스모크)")
class PortOnePaymentWebhookControllerIntegrationTest {

    private static final String STORE_ID = "store-it-portone-v2";
    private static final String WEBHOOK_SECRET = "whsec_integration_test_secret";
    private static final String TIMESTAMP = "1700000000";

    private static final String RAW_BODY = "{\"type\":\"Webhook.Unknown.Type\","
            + "\"data\":{\"storeId\":\"" + STORE_ID + "\"}}";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TenantPgConfigurationRepository tenantPgConfigurationRepository;

    @BeforeEach
    void stubPgConfig() {
        TenantPgConfiguration configuration = new TenantPgConfiguration();
        configuration.setConfigId(UUID.randomUUID().toString());
        configuration.setTenantId("tenant-it-webhook");
        configuration.setPgProvider(PgProvider.IAMPORT);
        configuration.setStoreId(STORE_ID);
        configuration.setStatus(PgConfigurationStatus.ACTIVE);
        configuration.setApiKeyEncrypted("dummy-api");
        configuration.setSecretKeyEncrypted("dummy-secret");
        configuration.setSettingsJson("{\"" + TenantPgSettingsJsonKeys.PORTONE_WEBHOOK_SECRET + "\":\""
                + WEBHOOK_SECRET + "\"}");

        when(tenantPgConfigurationRepository.findAllByStoreIdAndPgProviderAndStatusAndIsDeletedFalse(
                eq(STORE_ID), eq(PgProvider.IAMPORT), eq(PgConfigurationStatus.ACTIVE)))
                .thenReturn(List.of(configuration));
    }

    @Test
    void postPortOneV2Webhook_validSignature_returnsOk() throws Exception {
        String signature = v1Signature(WEBHOOK_SECRET, TIMESTAMP, RAW_BODY);

        mockMvc.perform(post("/api/v1/payments/webhooks/portone/v2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("webhook-timestamp", TIMESTAMP)
                        .header("webhook-signature", signature)
                        .header("webhook-id", "whk-test-1")
                        .content(RAW_BODY.getBytes(StandardCharsets.UTF_8)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ignored"));
    }

    @Test
    void postPortOneV2Webhook_invalidSignature_returnsForbidden() throws Exception {
        mockMvc.perform(post("/api/v1/payments/webhooks/portone/v2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("webhook-timestamp", TIMESTAMP)
                        .header("webhook-signature", "v1,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
                        .header("webhook-id", "whk-test-2")
                        .content(RAW_BODY.getBytes(StandardCharsets.UTF_8)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("서명 검증 실패"));
    }

    private static String v1Signature(String secret, String timestamp, String rawBody) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        String message = timestamp + "." + rawBody;
        byte[] digest = mac.doFinal(message.getBytes(StandardCharsets.UTF_8));
        return "v1," + Base64.getEncoder().encodeToString(digest);
    }
}
