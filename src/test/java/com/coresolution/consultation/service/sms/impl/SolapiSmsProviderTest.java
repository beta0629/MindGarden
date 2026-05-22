package com.coresolution.consultation.service.sms.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.config.SmsProperties;
import com.coresolution.consultation.dto.TenantSmsEffectiveCredentials;
import com.coresolution.consultation.integration.solapi.SolapiSignatureSigner;
import com.coresolution.consultation.service.TenantSmsSettingsService;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

/**
 * 솔라피 SMS 프로바이더 — 테스트모드/요청 페이로드/실패 처리 검증.
 *
 * @author CoreSolution
 * @since 2026-05-20
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SolapiSmsProvider")
class SolapiSmsProviderTest {

    private static final String TENANT_ID = "tenant-a";

    @Mock
    private TenantSmsSettingsService tenantSmsSettingsService;

    @Mock
    private RestTemplate restTemplate;

    private SmsProperties smsProperties;
    private SolapiSignatureSigner signatureSigner;
    private SolapiSmsProvider provider;

    @BeforeEach
    void setUp() throws Exception {
        smsProperties = new SmsProperties();
        smsProperties.setEnabled(true);
        smsProperties.setProvider("solapi");
        smsProperties.setTestMode(false);

        signatureSigner = new SolapiSignatureSigner();

        provider = new SolapiSmsProvider(tenantSmsSettingsService, smsProperties, signatureSigner, restTemplate);
        // @Value 주입을 우회하기 위해 리플렉션으로 기본 base URL 설정
        Field f = SolapiSmsProvider.class.getDeclaredField("apiBaseUrl");
        f.setAccessible(true);
        f.set(provider, "https://api.solapi.com");

        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("getProviderName() == 'solapi'")
    void providerNameIsSolapi() {
        assertThat(provider.getProviderName()).isEqualTo("solapi");
    }

    @Test
    @DisplayName("testMode=true 면 외부 호출 없이 true 반환")
    void testModeSkipsExternalCall() {
        smsProperties.setTestMode(true);
        when(tenantSmsSettingsService.getEffectiveCredentials(TENANT_ID))
            .thenReturn(creds("APIKEY", "APISECRET", "0212345678"));

        boolean ok = provider.sendSms("01012345678", "안녕하세요");

        assertThat(ok).isTrue();
        verify(restTemplate, never()).postForEntity(any(String.class), any(), any());
    }

    @Test
    @DisplayName("자격 증명 누락 시 false, 외부 호출 없음")
    void missingCredentialsReturnsFalse() {
        when(tenantSmsSettingsService.getEffectiveCredentials(TENANT_ID))
            .thenReturn(creds("", "", null));

        boolean ok = provider.sendSms("01012345678", "안녕하세요");

        assertThat(ok).isFalse();
        verify(restTemplate, never()).postForEntity(any(String.class), any(), any());
    }

    @Test
    @DisplayName("정상 발송: send-many/detail 호출 + Authorization 헤더 + 페이로드 검증")
    @SuppressWarnings({"rawtypes", "unchecked"})
    void sendsToCorrectEndpointWithSignedHeader() {
        when(tenantSmsSettingsService.getEffectiveCredentials(TENANT_ID))
            .thenReturn(creds("NCSAPIKEY", "NCSAPISECRET_LONG_VALUE", "0212345678"));

        Map<String, Object> okBody = new HashMap<>();
        okBody.put("groupId", "G1");
        when(restTemplate.postForEntity(any(String.class), any(HttpEntity.class), eq(Map.class)))
            .thenReturn(new ResponseEntity<>(okBody, HttpStatus.OK));

        boolean ok = provider.sendSms("01012345678", "본문");

        assertThat(ok).isTrue();

        ArgumentCaptor<String> urlCap = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<HttpEntity> entityCap = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate, times(1)).postForEntity(urlCap.capture(), entityCap.capture(), eq(Map.class));

        assertThat(urlCap.getValue()).isEqualTo("https://api.solapi.com/messages/v4/send-many/detail");

        HttpEntity<?> entity = entityCap.getValue();
        HttpHeaders headers = entity.getHeaders();
        String auth = headers.getFirst("Authorization");
        assertThat(auth).isNotNull();
        assertThat(auth).startsWith("HMAC-SHA256 apiKey=NCSAPIKEY, date=");
        assertThat(auth).contains("salt=");
        assertThat(auth).contains("signature=");

        Object body = entity.getBody();
        assertThat(body).isInstanceOf(Map.class);
        Map<?, ?> bodyMap = (Map<?, ?>) body;
        Object messages = bodyMap.get("messages");
        assertThat(messages).isInstanceOf(List.class);
        List<?> msgList = (List<?>) messages;
        assertThat(msgList).hasSize(1);
        Map<?, ?> msg = (Map<?, ?>) msgList.get(0);
        assertThat(msg.get("to")).isEqualTo("01012345678");
        assertThat(msg.get("from")).isEqualTo("0212345678");
        assertThat(msg.get("text")).isEqualTo("본문");
        assertThat(msg.get("country")).isEqualTo("82");
    }

    @Test
    @DisplayName("멀티 발송: 여러 수신자가 messages 배열에 포함")
    @SuppressWarnings({"rawtypes", "unchecked"})
    void sendManyIncludesAllRecipients() {
        when(tenantSmsSettingsService.getEffectiveCredentials(TENANT_ID))
            .thenReturn(creds("K", "S_LONG_SECRET_VALUE", "0212345678"));
        when(restTemplate.postForEntity(any(String.class), any(HttpEntity.class), eq(Map.class)))
            .thenReturn(new ResponseEntity<>(new HashMap<>(), HttpStatus.OK));

        boolean ok = provider.sendMany(List.of("01011112222", "01033334444"), "msg");

        assertThat(ok).isTrue();
        ArgumentCaptor<HttpEntity> entityCap = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForEntity(any(String.class), entityCap.capture(), eq(Map.class));
        Map<?, ?> bodyMap = (Map<?, ?>) entityCap.getValue().getBody();
        List<?> msgList = (List<?>) bodyMap.get("messages");
        assertThat(msgList).hasSize(2);
    }

    @Test
    @DisplayName("HTTP 5xx 응답 시 false 반환")
    @SuppressWarnings({"rawtypes", "unchecked"})
    void httpErrorReturnsFalse() {
        when(tenantSmsSettingsService.getEffectiveCredentials(TENANT_ID))
            .thenReturn(creds("K", "S_LONG_SECRET_VALUE", "0212345678"));
        when(restTemplate.postForEntity(any(String.class), any(HttpEntity.class), eq(Map.class)))
            .thenReturn(new ResponseEntity<>(new HashMap<>(), HttpStatus.INTERNAL_SERVER_ERROR));

        boolean ok = provider.sendSms("01012345678", "본문");
        assertThat(ok).isFalse();
    }

    @Test
    @DisplayName("RestClientException 발생 시 false 반환 (예외 전파 안 함)")
    @SuppressWarnings({"rawtypes", "unchecked"})
    void restClientExceptionReturnsFalse() {
        when(tenantSmsSettingsService.getEffectiveCredentials(TENANT_ID))
            .thenReturn(creds("K", "S_LONG_SECRET_VALUE", "0212345678"));
        when(restTemplate.postForEntity(any(String.class), any(HttpEntity.class), eq(Map.class)))
            .thenThrow(new RestClientException("network down"));

        boolean ok = provider.sendSms("01012345678", "본문");
        assertThat(ok).isFalse();
    }

    @Test
    @DisplayName("빈 수신자 목록은 false 반환, 외부 호출 없음")
    void emptyRecipientsReturnsFalse() {
        boolean ok = provider.sendMany(List.of(), "msg");
        assertThat(ok).isFalse();
        verify(restTemplate, never()).postForEntity(any(String.class), any(), any());
    }

    @Test
    @DisplayName("HttpStatusCodeException(403) 발생 시 consumeLastErrorDetail에 상태·마스킹 본문 전파")
    @SuppressWarnings({"rawtypes", "unchecked"})
    void httpStatusCodeExceptionExposesMaskedDetail() {
        when(tenantSmsSettingsService.getEffectiveCredentials(TENANT_ID))
            .thenReturn(creds("K", "S_LONG_SECRET_VALUE_FOR_TEST", "0212345678"));
        String responseBody = "{\"errorCode\":\"Forbidden\","
            + "\"errorMessage\":\"허용되지 않은 IP(114.202.247.246)로 접근하고 있습니다.\"}";
        when(restTemplate.postForEntity(any(String.class), any(HttpEntity.class), eq(Map.class)))
            .thenThrow(HttpClientErrorException.create(HttpStatus.FORBIDDEN,
                "Forbidden", new HttpHeaders(),
                responseBody.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                java.nio.charset.StandardCharsets.UTF_8));

        boolean ok = provider.sendSms("01012345678", "본문");
        assertThat(ok).isFalse();

        String detail = provider.consumeLastErrorDetail();
        assertThat(detail).isNotNull();
        assertThat(detail).startsWith("Solapi 403 FORBIDDEN: ");
        assertThat(detail).contains("Forbidden");
        assertThat(detail).contains("허용되지 않은 IP");
        // IP 자체는 마스킹 대상이 아니지만, 시크릿 후보(20자+ 영숫자)는 마스킹된다는 회귀 보호용.
        assertThat(provider.consumeLastErrorDetail()).isNull();
    }

    @Test
    @DisplayName("응답 본문 마스킹: 휴대전화·이메일·시크릿 후보가 마스킹된다")
    void maskResponseBodyAppliesAllRules() {
        String raw = "{\"to\":\"01012345678\",\"email\":\"test@example.com\","
            + "\"apiKey\":\"NCSAAAABBBBCCCCDDDDEEEE\"}";
        String masked = SolapiSmsProvider.maskResponseBody(raw);
        assertThat(masked).doesNotContain("01012345678");
        assertThat(masked).contains("010****5678");
        assertThat(masked).doesNotContain("test@example.com");
        assertThat(masked).contains("t***@example.com");
        assertThat(masked).doesNotContain("NCSAAAABBBBCCCCDDDDEEEE");
        assertThat(masked).contains("NCSA****");
    }

    @Test
    @DisplayName("자격 증명 누락 시에도 consumeLastErrorDetail이 사유를 노출")
    void missingCredentialsExposesDetail() {
        when(tenantSmsSettingsService.getEffectiveCredentials(TENANT_ID))
            .thenReturn(creds("", "", null));

        boolean ok = provider.sendSms("01012345678", "본문");
        assertThat(ok).isFalse();
        assertThat(provider.consumeLastErrorDetail())
            .contains("credentials missing");
    }

    private static TenantSmsEffectiveCredentials creds(String apiKey, String apiSecret, String sender) {
        return new TenantSmsEffectiveCredentials("solapi", apiKey, apiSecret, sender);
    }
}
