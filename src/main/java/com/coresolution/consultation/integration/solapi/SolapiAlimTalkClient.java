package com.coresolution.consultation.integration.solapi;

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
    /** Solapi {@code messageList[].statusCode} 정상 코드(접수 성공). */
    static final String SUCCESS_STATUS_CODE = "2000";
    /** Solapi {@code groupInfo.status} 그룹 전체 실패 마커. */
    static final String GROUP_STATUS_FAILED = "FAILED";
    /** 응답 본문이 비어 있지 않은데 파싱 직전 진단용 에러 메시지에 노출할 최대 길이. */
    static final int FALLBACK_ERROR_BODY_LIMIT = 200;

    /** 메시지 단위 reject 사유(failedMessageList 우선)를 어드민 UI 노출용 한국어로 감싸는 prefix. */
    private static final String ERROR_PREFIX_REJECT = "Solapi 알림톡 거부";
    /** 그룹 summary 단계까지만 노출 가능한 실패의 한국어 prefix. */
    private static final String ERROR_PREFIX_GROUP_FAILED = "Solapi 알림톡 등록 실패";
    /** root/메시지/그룹 어디에서도 사유 추출 불가 — body 일부로 폴백할 때의 한국어 prefix. */
    private static final String ERROR_PREFIX_BODY_FALLBACK = "Solapi 알림톡 응답 해석 실패";
    /** 폴백 errorCode: root/메시지/failedMessage 어디에도 코드가 없을 때. */
    private static final String UNKNOWN_ERROR_CODE = "UNKNOWN";

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

        // 로깅 정합: variables는 wrap된 key(#{변수명}) 기준으로 노출해 운영 디버깅(치환 가시성)을 높인다.
        Map<String, String> wrappedForLog = wrapVariableKeys(request.variables());
        log.info("Solapi ATA 요청: pfId.len={}, templateId={}, to.last4={}, params.keys={}",
            safeLength(request.pfId()),
            request.templateId(),
            lastFour(request.toNumber()),
            wrappedForLog.keySet());

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
        kakaoOptions.put("variables", wrapVariableKeys(request.variables()));

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

    /**
     * Solapi 카카오 알림톡 변수 키를 {@code #{변수명}} 형식으로 wrap한다.
     *
     * <p>Solapi 공식 스펙은 {@code kakaoOptions.variables} 키가 {@code #{변수명}} 형식이어야
     * 템플릿의 {@code #{변수명}} 자리표시자가 정상 치환된다. 호출부가 plain key
     * ({@code paymentAmount}) 또는 이미 wrap된 key({@code #{paymentAmount}})
     * 어느 쪽을 전달해도 idempotent하게 동일 결과를 만든다.
     *
     * <p>운영 호출부({@code NotificationServiceImpl#buildAlimTalkParams},
     * {@code AdminTestNotificationServiceImpl} 등)는 모두 plain key 로 Map을 구성하므로,
     * 단일 SSOT인 본 클라이언트에서 일괄 wrap하여 호출부 변경 0줄로 변수 치환을 정상화한다.
     *
     * @param raw 호출부가 전달한 원시 variables map (null/empty 허용)
     * @return wrap된 variables map. null/blank 키는 skip, null value는 빈 문자열로 치환.
     */
    private static Map<String, String> wrapVariableKeys(Map<String, String> raw) {
        Map<String, String> wrapped = new LinkedHashMap<>();
        if (raw == null || raw.isEmpty()) {
            return wrapped;
        }
        raw.forEach((k, v) -> {
            if (k == null) {
                return;
            }
            String trimmed = k.trim();
            if (trimmed.isEmpty()) {
                return;
            }
            String key = (trimmed.startsWith("#{") && trimmed.endsWith("}"))
                ? trimmed
                : "#{" + trimmed + "}";
            wrapped.put(key, v == null ? "" : v);
        });
        return wrapped;
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

    /**
     * Solapi 응답을 파싱하여 발송 성공 여부와 식별자/오류를 추출한다.
     *
     * <p><b>판정 규칙(전부 만족해야 success=true)</b>:
     * <ol>
     *   <li>HTTP 2xx</li>
     *   <li>root {@code errorCode} 부재</li>
     *   <li>{@code groupInfo.status} 가 존재한다면 {@link #GROUP_STATUS_FAILED} 가 아님</li>
     *   <li>{@code groupInfo.count.registeredFailed} 가 존재한다면 0</li>
     *   <li>{@code failedMessageList[]} 가 비어 있음(Solapi 공식 메시지 단위 reject 컨테이너)</li>
     *   <li>{@code messageList[]} 가 존재한다면 모든 entry의 {@code statusCode}가 {@link #SUCCESS_STATUS_CODE}</li>
     * </ol>
     *
     * <p><b>실패 시 errorCode/errorMessage 폴백 우선순위</b>:
     * <ol>
     *   <li>root {@code errorCode} / {@code errorMessage} (그룹 단위 API 오류)</li>
     *   <li>{@code failedMessageList[0].statusCode} / {@code statusMessage}
     *       (Solapi 공식 메시지 단위 reject — 1순위 승격)</li>
     *   <li>{@code messageList[0].statusCode} / {@code statusMessage}
     *       (요청에 {@code showMessageList:true} 가 있을 때만 채워지는 경우의 폴백)</li>
     *   <li>{@code groupInfo.status} + {@code count.registeredFailed} 의 group summary</li>
     *   <li>응답 본문 일부(마스킹·절단)</li>
     * </ol>
     *
     * <p>errorMessage 는 어드민 UI 친화적으로 한국어 prefix
     * ({@link #ERROR_PREFIX_REJECT} / {@link #ERROR_PREFIX_GROUP_FAILED} /
     * {@link #ERROR_PREFIX_BODY_FALLBACK}) 를 붙여 직접 노출 가능한 형태로 구성한다.
     * 다만 root {@code errorMessage} 가 존재하면 Solapi가 직접 제공한 메시지를 우선하여 보존한다.
     * 사후 추적을 위해 groupId/messageId 는 실패에도 보존한다.
     *
     * @param statusCode HTTP 상태 코드
     * @param body       응답 본문(JSON 또는 null/blank)
     * @return 발송 결과(success, groupId, messageId, errorCode, errorMessage)
     */
    private SolapiAlimTalkResponse parseResponse(int statusCode, String body) {
        boolean is2xx = statusCode >= 200 && statusCode < 300;
        if (body == null || body.isBlank()) {
            if (is2xx) {
                log.info("Solapi ATA 응답 OK(빈 body): status={}", statusCode);
                return SolapiAlimTalkResponse.success(null);
            }
            log.warn("Solapi ATA 응답 실패(빈 body): status={}", statusCode);
            return SolapiAlimTalkResponse.failure(statusCode, "EMPTY_BODY", "empty response");
        }
        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode groupInfo = root.path("groupInfo");
            JsonNode messageList = root.path("messageList");
            JsonNode failedMessageList = root.path("failedMessageList");
            JsonNode countNode = groupInfo.path("count");

            // groupId 우선순위: groupInfo.groupId → root.groupId → root.messageId
            String groupId = textOrNull(groupInfo, "groupId");
            if (groupId == null) {
                groupId = textOrNull(root, "groupId");
            }
            String firstMessageId = firstMessageId(messageList);
            String messageId = firstMessageId != null ? firstMessageId : textOrNull(root, "messageId");
            if (messageId == null) {
                messageId = groupId;
            }

            String rootErrorCode = textOrNull(root, "errorCode");
            String rootErrorMessage = textOrNull(root, "errorMessage");
            String groupStatus = textOrNull(groupInfo, "status");
            Integer registeredFailed = intOrNull(countNode, "registeredFailed");
            Integer totalCount = intOrNull(countNode, "total");
            Integer sentTotalCount = intOrNull(countNode, "sentTotal");
            String firstRejectCode = firstRejectStatusCode(messageList);
            String firstRejectMessage = firstRejectStatusMessage(messageList);
            String firstFailedStatusCode = firstStatusCode(failedMessageList);
            String firstFailedStatusMessage = firstStatusMessage(failedMessageList);
            int failedListSize = sizeOrZero(failedMessageList);

            boolean groupStatusFailed = groupStatus != null
                && GROUP_STATUS_FAILED.equalsIgnoreCase(groupStatus);
            boolean registeredFailedNonZero = registeredFailed != null && registeredFailed > 0;
            boolean messageRejected = firstRejectCode != null;
            boolean failedMessageListPresent = failedListSize > 0;

            boolean success = is2xx
                && rootErrorCode == null
                && !groupStatusFailed
                && !registeredFailedNonZero
                && !messageRejected
                && !failedMessageListPresent;

            if (success) {
                log.info("Solapi ATA 응답 OK: status={}, groupId={}, total={}, sentTotal={}",
                    statusCode, groupId, totalCount, sentTotalCount);
                return SolapiAlimTalkResponse.success(groupId, messageId);
            }

            // failedMessageList[0].statusCode 를 messageList 보다 1순위로 승격.
            String resolvedErrorCode = firstNonBlank(
                rootErrorCode, firstFailedStatusCode, firstRejectCode, UNKNOWN_ERROR_CODE);
            String resolvedErrorMessage = buildErrorMessage(body,
                rootErrorCode, rootErrorMessage,
                firstFailedStatusCode, firstFailedStatusMessage,
                firstRejectCode, firstRejectMessage,
                groupStatus, registeredFailed);

            log.warn("Solapi ATA 응답 실패: status={}, groupId={}, errorCode={}, errorMessage={},"
                + " registeredFailed={}, failedMessageList.size={}, bodyPreview={}",
                statusCode, groupId, resolvedErrorCode, resolvedErrorMessage,
                registeredFailed, failedListSize,
                SolapiSmsProvider.maskResponseBody(truncate(body, FALLBACK_ERROR_BODY_LIMIT)));

            return SolapiAlimTalkResponse.failure(statusCode, groupId, messageId,
                resolvedErrorCode, resolvedErrorMessage);
        } catch (Exception e) {
            log.warn("Solapi 알림톡 응답 파싱 실패: {}", e.getMessage());
            return is2xx
                ? SolapiAlimTalkResponse.success(null)
                : SolapiAlimTalkResponse.failure(statusCode, "PARSE_ERROR", e.getMessage());
        }
    }

    /**
     * 사람이 읽을 errorMessage 구성. 폴백 우선순위에 한국어 prefix 를 붙여 어드민 UI 친화적으로 가공한다.
     *
     * <p>root {@code errorMessage} 가 존재하면 Solapi 가 직접 제공한 표현을 그대로 보존하여
     * 4xx ValidationError 등 기존 호출자(어드민 도구·운영 호출부) 동작과의 회귀 호환을 유지한다.
     *
     * @param body                       응답 본문(마지막 폴백용)
     * @param rootErrorCode              root.errorCode (있으면 root.errorMessage 그대로)
     * @param rootErrorMessage           root.errorMessage
     * @param firstFailedStatusCode      failedMessageList[0].statusCode
     * @param firstFailedStatusMessage   failedMessageList[0].statusMessage
     * @param firstRejectCode            messageList[0].statusCode (2000 이외 첫 번째)
     * @param firstRejectMessage         messageList[0].statusMessage
     * @param groupStatus                groupInfo.status
     * @param registeredFailed           groupInfo.count.registeredFailed
     * @return UI 노출용 한국어 errorMessage
     */
    private static String buildErrorMessage(String body,
            String rootErrorCode, String rootErrorMessage,
            String firstFailedStatusCode, String firstFailedStatusMessage,
            String firstRejectCode, String firstRejectMessage,
            String groupStatus, Integer registeredFailed) {
        if (rootErrorCode != null && rootErrorMessage != null) {
            return rootErrorMessage;
        }
        if (rootErrorMessage != null) {
            return rootErrorMessage;
        }
        if (firstFailedStatusCode != null) {
            return formatRejectMessage(firstFailedStatusCode, firstFailedStatusMessage);
        }
        if (firstRejectCode != null) {
            return formatRejectMessage(firstRejectCode, firstRejectMessage);
        }
        String groupSummary = buildGroupFailureSummary(groupStatus, registeredFailed);
        if (groupSummary != null) {
            return ERROR_PREFIX_GROUP_FAILED + " (" + groupSummary + ")";
        }
        String maskedPreview = SolapiSmsProvider.maskResponseBody(truncate(body, FALLBACK_ERROR_BODY_LIMIT));
        return ERROR_PREFIX_BODY_FALLBACK + ": " + (maskedPreview == null ? "" : maskedPreview);
    }

    private static String formatRejectMessage(String statusCode, String statusMessage) {
        StringBuilder sb = new StringBuilder(ERROR_PREFIX_REJECT)
            .append(" [").append(statusCode).append("]");
        if (statusMessage != null && !statusMessage.isBlank()) {
            sb.append(' ').append(statusMessage);
        }
        return sb.toString();
    }

    private static String firstMessageId(JsonNode messageList) {
        if (messageList == null || !messageList.isArray() || messageList.isEmpty()) {
            return null;
        }
        return textOrNull(messageList.get(0), "messageId");
    }

    private static String firstRejectStatusCode(JsonNode messageList) {
        if (messageList == null || !messageList.isArray()) {
            return null;
        }
        for (JsonNode message : messageList) {
            String code = textOrNull(message, "statusCode");
            if (code != null && !SUCCESS_STATUS_CODE.equals(code)) {
                return code;
            }
        }
        return null;
    }

    private static String firstRejectStatusMessage(JsonNode messageList) {
        if (messageList == null || !messageList.isArray()) {
            return null;
        }
        for (JsonNode message : messageList) {
            String code = textOrNull(message, "statusCode");
            if (code != null && !SUCCESS_STATUS_CODE.equals(code)) {
                return textOrNull(message, "statusMessage");
            }
        }
        return null;
    }

    /**
     * 배열 첫 entry의 {@code statusCode} 텍스트.
     *
     * <p>Solapi 공식 응답에서 reject 사유가 담기는 {@code failedMessageList[]} 의 직접 추출에 사용된다.
     * (messageList[] 에는 {@code showMessageList:true} 옵션이 있을 때만 채워질 수 있어 폴백 가치가 낮다.)
     *
     * @param array JSON 배열 노드
     * @return 첫 entry의 statusCode 또는 {@code null}
     */
    private static String firstStatusCode(JsonNode array) {
        if (array == null || !array.isArray() || array.isEmpty()) {
            return null;
        }
        return textOrNull(array.get(0), "statusCode");
    }

    /**
     * 배열 첫 entry의 {@code statusMessage} 텍스트.
     *
     * @param array JSON 배열 노드
     * @return 첫 entry의 statusMessage 또는 {@code null}
     */
    private static String firstStatusMessage(JsonNode array) {
        if (array == null || !array.isArray() || array.isEmpty()) {
            return null;
        }
        return textOrNull(array.get(0), "statusMessage");
    }

    private static int sizeOrZero(JsonNode array) {
        if (array == null || !array.isArray()) {
            return 0;
        }
        return array.size();
    }

    private static String buildGroupFailureSummary(String groupStatus, Integer registeredFailed) {
        if (groupStatus == null && registeredFailed == null) {
            return null;
        }
        StringBuilder sb = new StringBuilder("group ");
        if (groupStatus != null) {
            sb.append("status=").append(groupStatus);
        }
        if (registeredFailed != null) {
            if (groupStatus != null) {
                sb.append(", ");
            }
            sb.append("registeredFailed=").append(registeredFailed);
        }
        return sb.toString();
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private static String truncate(String value, int max) {
        if (value == null) {
            return null;
        }
        return value.length() <= max ? value : value.substring(0, max);
    }

    private static Integer intOrNull(JsonNode node, String field) {
        if (node == null) {
            return null;
        }
        JsonNode value = node.get(field);
        if (value == null || value.isNull() || !value.canConvertToInt()) {
            return null;
        }
        return value.asInt();
    }

    private static String textOrNull(JsonNode node, String field) {
        if (node == null) {
            return null;
        }
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

    /**
     * 전화번호의 뒤 4자리만 반환(요청 로깅의 PII 보호).
     *
     * @param phone 원본 전화번호 (예: 010-1234-5678 / 01012345678)
     * @return 뒤 4자리. 4자리 미만이면 그대로. 자릿수 추출 실패 시 빈 문자열.
     */
    private static String lastFour(String phone) {
        if (phone == null || phone.isBlank()) {
            return "";
        }
        String digits = phone.replaceAll("\\D", "");
        if (digits.isEmpty()) {
            return "";
        }
        return digits.length() <= 4 ? digits : digits.substring(digits.length() - 4);
    }
}
