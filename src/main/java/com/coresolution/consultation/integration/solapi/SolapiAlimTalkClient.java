package com.coresolution.consultation.integration.solapi;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.service.sms.impl.SolapiSmsProvider;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

/**
 * 솔라피(Solapi/CoolSMS) 알림톡 단건 발송 클라이언트.
 *
 * <p>{@code POST /messages/v4/send-many/detail} 엔드포인트에 {@code type=ATA} 메시지로 요청한다.
 * 인증은 {@link SolapiSignatureSigner}의 HMAC-SHA256 헤더를 사용하며, API Key/Secret 본문은
 * {@link SolapiCredentials}로 호출자에서 전달한다(클라이언트는 메모리에만 보유).
 *
 * <p>호출자는 {@link SolapiAlimTalkRequest#isSendable()}로 사전 검증한 뒤 호출한다.
 *
 * @author CoreSolution
 * @since 2026-05-20
 */
@Slf4j
@Component
public class SolapiAlimTalkClient {

    static final String SEND_ENDPOINT = "/messages/v4/send-many/detail";
    static final String MESSAGE_TYPE_ATA = "ATA";

    private final SolapiSignatureSigner signatureSigner;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String apiBaseUrl;

    /**
     * 운영용 생성자(스프링 주입).
     *
     * @param signatureSigner Solapi HMAC 서명 유틸
     * @param apiBaseUrl      Solapi API base URL (기본 {@code https://api.solapi.com})
     */
    @Autowired
    public SolapiAlimTalkClient(
            SolapiSignatureSigner signatureSigner,
            @Value("${kakao.alimtalk.solapi.api-url:https://api.solapi.com}") String apiBaseUrl) {
        this(signatureSigner, new RestTemplate(), new ObjectMapper(), apiBaseUrl);
    }

    /**
     * 테스트용 생성자({@code MockRestServiceServer} 또는 stub 주입).
     *
     * @param signatureSigner Solapi HMAC 서명 유틸
     * @param restTemplate    주입된 RestTemplate
     * @param objectMapper    Jackson ObjectMapper
     * @param apiBaseUrl      Solapi API base URL
     */
    public SolapiAlimTalkClient(
            SolapiSignatureSigner signatureSigner,
            RestTemplate restTemplate,
            ObjectMapper objectMapper,
            String apiBaseUrl) {
        this.signatureSigner = signatureSigner;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.apiBaseUrl = normalize(apiBaseUrl);
    }

    /**
     * 알림톡 단건 발송.
     *
     * @param request 발송 요청
     * @return 응답(성공 여부·messageId·errorCode)
     */
    public SolapiAlimTalkResponse send(SolapiAlimTalkRequest request) {
        if (request == null || !request.isSendable()) {
            log.warn("Solapi 알림톡 요청 누락(자격 증명/pfId/templateId/toNumber). 발송 스킵.");
            return SolapiAlimTalkResponse.failure(400, "INVALID_REQUEST", "missing required fields");
        }

        Map<String, Object> body = buildRequestBody(request);
        HttpHeaders headers = buildHeaders(request.credentials());

        String url = apiBaseUrl + SEND_ENDPOINT;
        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                url, new HttpEntity<>(body, headers), String.class);
            return parseResponse(response.getStatusCode().value(), response.getBody());
        } catch (RestClientResponseException e) {
            String maskedBody = SolapiSmsProvider.maskResponseBody(e.getResponseBodyAsString());
            log.warn("Solapi 알림톡 HTTP 오류: status={}, body length={}, body={}",
                e.getStatusCode(), safeLength(e.getResponseBodyAsString()), maskedBody);
            return parseResponse(e.getStatusCode().value(), e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("Solapi 알림톡 호출 실패: {}", e.getMessage(), e);
            return SolapiAlimTalkResponse.failure(500, "CLIENT_ERROR", e.getClass().getSimpleName());
        }
    }

    private Map<String, Object> buildRequestBody(SolapiAlimTalkRequest request) {
        Map<String, Object> kakaoOptions = new LinkedHashMap<>();
        kakaoOptions.put("pfId", request.pfId());
        kakaoOptions.put("templateId", request.templateId());
        Map<String, String> variables = request.variables() != null
            ? request.variables()
            : new HashMap<>();
        kakaoOptions.put("variables", variables);

        Map<String, Object> message = new LinkedHashMap<>();
        message.put("type", MESSAGE_TYPE_ATA);
        message.put("to", request.toNumber());
        if (request.fromNumber() != null && !request.fromNumber().isBlank()) {
            message.put("from", request.fromNumber());
        }
        message.put("kakaoOptions", kakaoOptions);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("messages", List.of(message));
        return body;
    }

    private HttpHeaders buildHeaders(SolapiCredentials credentials) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.set(
            SolapiSignatureSigner.AUTH_HEADER,
            signatureSigner.buildAuthorizationHeader(credentials.apiKey(), credentials.apiSecret()));
        return headers;
    }

    private SolapiAlimTalkResponse parseResponse(int statusCode, String body) {
        boolean is2xx = statusCode >= 200 && statusCode < 300;
        if (body == null || body.isBlank()) {
            return is2xx
                ? SolapiAlimTalkResponse.success(null)
                : SolapiAlimTalkResponse.failure(statusCode, "EMPTY_BODY", "empty response");
        }
        try {
            JsonNode root = objectMapper.readTree(body);
            String messageId = textOrNull(root, "groupId");
            if (messageId == null) {
                messageId = textOrNull(root, "messageId");
            }
            String errorCode = textOrNull(root, "errorCode");
            String errorMessage = textOrNull(root, "errorMessage");

            if (is2xx && errorCode == null) {
                return SolapiAlimTalkResponse.success(messageId);
            }
            return SolapiAlimTalkResponse.failure(statusCode, errorCode, errorMessage);
        } catch (Exception e) {
            log.warn("Solapi 알림톡 응답 파싱 실패: {}", e.getMessage());
            return is2xx
                ? SolapiAlimTalkResponse.success(null)
                : SolapiAlimTalkResponse.failure(statusCode, "PARSE_ERROR", e.getMessage());
        }
    }

    private static String textOrNull(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return null;
        }
        String text = value.asText();
        return text == null || text.isBlank() ? null : text;
    }

    private static String normalize(String url) {
        if (url == null || url.isBlank()) {
            return "https://api.solapi.com";
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    private static int safeLength(String s) {
        return s == null ? 0 : s.length();
    }
}
