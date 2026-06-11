package com.coresolution.consultation.service.sms.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.config.SmsProperties;
import com.coresolution.consultation.dto.TenantSmsEffectiveCredentials;
import com.coresolution.consultation.integration.solapi.SolapiSignatureSigner;
import com.coresolution.consultation.service.TenantSmsSettingsService;
import com.coresolution.consultation.service.sms.SmsProvider;
import com.coresolution.consultation.service.sms.SmsResponseBodyMasker;
import com.coresolution.consultation.util.PhoneLogMasking;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 솔라피(Solapi/CoolSMS) SMS 프로바이더.
 *
 * <p>REST {@code POST /messages/v4/send-many/detail} 단건/멀티 발송을 지원한다.
 * 인증 헤더는 {@link SolapiSignatureSigner} 가 만든 HMAC-SHA256 서명을 사용한다.
 *
 * <p>{@link SmsProperties#isTestMode() testMode=true} 인 경우 외부 호출을 건너뛰고
 * 로그만 남기며 성공으로 처리한다(비용·실발송 방지). 실제 호출은 {@code testMode=false}
 * 이고 자격 증명·발신 번호가 모두 유효할 때만 수행한다.
 *
 * @author CoreSolution
 * @since 2026-05-20
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SolapiSmsProvider implements SmsProvider {

    /** 프로바이더 식별자(SmsProperties.provider, tenant_sms_settings.provider 와 매칭). */
    public static final String PROVIDER_NAME = "solapi";

    private static final String DEFAULT_API_BASE_URL = "https://api.solapi.com";
    private static final String SEND_MANY_DETAIL_PATH = "/messages/v4/send-many/detail";
    private static final String COUNTRY_CODE_KR = "82";

    /** 응답 본문 로깅·전파 시 마스킹 후 절단할 최대 길이(헤더·CR/LF 포함). */
    private static final int RESPONSE_BODY_MASK_LIMIT = SmsResponseBodyMasker.DEFAULT_LIMIT;

    /** 직전 호출 실패 상세(상태코드 + 마스킹 본문). 호출 스레드 단위. */
    private static final ThreadLocal<String> LAST_ERROR_DETAIL = new ThreadLocal<>();

    private final TenantSmsSettingsService tenantSmsSettingsService;
    private final SmsProperties smsProperties;
    private final SolapiSignatureSigner signatureSigner;
    private final RestTemplate restTemplate;

    @Value("${sms.auth.solapi.api-base-url:" + DEFAULT_API_BASE_URL + "}")
    private String apiBaseUrl;

    @Override
    public boolean sendSms(String phoneNumber, String message) {
        return sendMany(List.of(phoneNumber), message);
    }

    /**
     * 멀티 수신자 SMS 발송. 단일 요청({@code POST /messages/v4/send-many/detail})으로 처리한다.
     *
     * @param phoneNumbers 수신자 번호 목록
     * @param message      본문
     * @return 발송 성공 여부(2xx 응답)
     */
    public boolean sendMany(List<String> phoneNumbers, String message) {
        // 호출 진입 시점에 이전 호출의 잔여 detail을 반드시 비운다 (스레드 재사용 대비).
        LAST_ERROR_DETAIL.remove();

        if (phoneNumbers == null || phoneNumbers.isEmpty()) {
            log.warn("⚠️ Solapi SMS 발송 - 수신자 목록이 비어있음");
            LAST_ERROR_DETAIL.set("recipients empty");
            return false;
        }

        TenantSmsEffectiveCredentials creds = tenantSmsSettingsService.getEffectiveCredentials(
            TenantContextHolder.getTenantId());

        if (!isConfigured(creds)) {
            log.error("❌ Solapi SMS 설정이 완료되지 않았습니다. (apiKey/apiSecret/senderNumber)");
            LAST_ERROR_DETAIL.set("solapi credentials missing (apiKey/apiSecret/senderNumber)");
            return false;
        }

        if (smsProperties.isTestMode()) {
            log.info("🧪 Solapi 테스트 모드 - 실제 발송 스킵: count={}, sender={}",
                phoneNumbers.size(), PhoneLogMasking.maskForLog(creds.senderNumber()));
            return true;
        }

        try {
            String url = apiBaseUrl + SEND_MANY_DETAIL_PATH;
            HttpHeaders headers = buildHeaders(creds);
            Map<String, Object> body = buildRequestBody(phoneNumbers, message, creds.senderNumber());

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("✅ Solapi SMS 발송 성공: count={}", phoneNumbers.size());
                return true;
            }

            String maskedBody = maskResponseBody(stringifyBody(response.getBody()));
            String detail = formatErrorDetail(response.getStatusCode(), maskedBody);
            log.error("❌ Solapi SMS 발송 실패: status={} body={}",
                response.getStatusCode(), maskedBody);
            LAST_ERROR_DETAIL.set(detail);
            return false;
        } catch (HttpStatusCodeException e) {
            // 4xx/5xx 응답을 RestTemplate.errorHandler가 예외로 던진 경우(Forbidden, Bad Request 등).
            String maskedBody = maskResponseBody(e.getResponseBodyAsString());
            String detail = formatErrorDetail(e.getStatusCode(), maskedBody);
            log.error("❌ Solapi SMS HTTP 오류: status={}, body={}",
                e.getStatusCode(), maskedBody);
            LAST_ERROR_DETAIL.set(detail);
            return false;
        } catch (RestClientException e) {
            // 네트워크·타임아웃 등 응답 본문이 없는 케이스.
            String detail = "Solapi RestClient error: " + truncate(e.getMessage(),
                RESPONSE_BODY_MASK_LIMIT);
            log.error("❌ Solapi SMS 호출 오류: {}", e.getMessage(), e);
            LAST_ERROR_DETAIL.set(detail);
            return false;
        } catch (Exception e) {
            String detail = e.getClass().getSimpleName() + ": "
                + truncate(e.getMessage(), RESPONSE_BODY_MASK_LIMIT);
            log.error("❌ Solapi SMS 발송 중 예외: {}", e.getMessage(), e);
            LAST_ERROR_DETAIL.set(detail);
            return false;
        }
    }

    @Override
    public String consumeLastErrorDetail() {
        String value = LAST_ERROR_DETAIL.get();
        LAST_ERROR_DETAIL.remove();
        return value;
    }

    @Override
    public String getProviderName() {
        return PROVIDER_NAME;
    }

    @Override
    public boolean isConfigured() {
        TenantSmsEffectiveCredentials creds = tenantSmsSettingsService.getEffectiveCredentials(
            TenantContextHolder.getTenantId());
        return isConfigured(creds);
    }

    private static boolean isConfigured(TenantSmsEffectiveCredentials creds) {
        return creds != null
            && creds.apiKey() != null && !creds.apiKey().isEmpty()
            && creds.apiSecret() != null && !creds.apiSecret().isEmpty()
            && creds.senderNumber() != null && !creds.senderNumber().isEmpty();
    }

    private HttpHeaders buildHeaders(TenantSmsEffectiveCredentials creds) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set(SolapiSignatureSigner.AUTH_HEADER,
            signatureSigner.buildAuthorizationHeader(creds.apiKey(), creds.apiSecret()));
        return headers;
    }

    /**
     * 응답 본문을 로그·감사 컬럼 안전한 형태로 마스킹한다.
     *
     * <p>NHN/Solapi 등 SMS 게이트웨이 공통 마스킹 규칙은 {@link SmsResponseBodyMasker}
     * (B4 hotfix 추출 — 6자리 OTP 패턴 포함) 로 위임한다.
     *
     * @param raw Solapi 응답 본문(JSON 문자열 등)
     * @return 마스킹·절단된 안전 문자열
     */
    public static String maskResponseBody(String raw) {
        return SmsResponseBodyMasker.mask(raw, RESPONSE_BODY_MASK_LIMIT);
    }

    private static String truncate(String value, int max) {
        if (value == null) {
            return "";
        }
        if (value.length() <= max) {
            return value;
        }
        return value.substring(0, max) + "…(truncated)";
    }

    private static String stringifyBody(Object body) {
        return body == null ? "" : body.toString();
    }

    private static String formatErrorDetail(HttpStatusCode status, String maskedBody) {
        String statusText = status == null ? "UNKNOWN" : status.toString();
        return "Solapi " + statusText + ": " + (maskedBody == null ? "" : maskedBody);
    }

    private static Map<String, Object> buildRequestBody(List<String> phoneNumbers, String text, String from) {
        List<Map<String, Object>> messages = phoneNumbers.stream()
            .map(to -> {
                Map<String, Object> m = new HashMap<>();
                m.put("to", to);
                m.put("from", from);
                m.put("text", text);
                m.put("country", COUNTRY_CODE_KR);
                return m;
            })
            .toList();

        Map<String, Object> body = new HashMap<>();
        body.put("messages", messages);
        return body;
    }
}
