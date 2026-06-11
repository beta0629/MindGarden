package com.coresolution.consultation.service.impl;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import com.coresolution.consultation.dto.SmsGatewaySendResult;
import com.coresolution.consultation.service.SmsGatewayService;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import lombok.extern.slf4j.Slf4j;

/**
 * SMS 게이트웨이 발송 NCP SENS 정식 구현체.
 *
 * <p>2026-06-11 PR #224 후속 (정식 호출):
 * <ol>
 *   <li>NCP SENS 4종 env({@code NCP_ACCESS_KEY}/{@code NCP_SECRET_KEY}/{@code NCP_SMS_SERVICE_ID}/
 *       {@code NCP_SMS_SENDER_NUMBER}) 모두 설정 시 SignatureV2 서명 + HTTP POST 호출.</li>
 *   <li>일부 누락 시 {@link #isStubMode()} = true 로 표기하고 stub 응답 반환 — 운영 profile 에서는
 *       명시적 ERROR 로그.</li>
 *   <li>HTTP timeout 5초, 실패 시 1회 재시도(총 2회 시도). 모두 실패 시 ok=false.</li>
 *   <li>statusCode 202 = 성공(NCP SENS 비동기 발송 큐 등록 완료).</li>
 * </ol></p>
 *
 * <p>SignatureV2 spec (NCP API Gateway):
 * <pre>
 *   signMessage = METHOD + " " + URI_PATH + "\n" + TIMESTAMP_MS + "\n" + ACCESS_KEY
 *   signature   = Base64(HmacSHA256(secretKey, signMessage))
 * </pre>
 * 참고: <a href="https://api.ncloud-docs.com/docs/ai-application-service-sens-smsv2">NCP SENS SMSV2</a></p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@Slf4j
@Service
public class SmsGatewayServiceImpl implements SmsGatewayService {

    static final String NCP_SENS_BASE_URL = "https://sens.apigw.ntruss.com";
    static final String NCP_SENS_URI_FMT = "/sms/v2/services/%s/messages";
    static final String HMAC_ALGORITHM = "HmacSHA256";
    static final int HTTP_TIMEOUT_MS = 5_000;
    static final int RETRY_COUNT = 1;
    static final int NCP_SUCCESS_STATUS = 202;

    private final Environment environment;
    private final RestTemplate restTemplate;

    @Value("${sms.gateway.ncp.access-key:${NCP_ACCESS_KEY:${mindgarden.sms.naver-cloud.access-key:${NAVER_CLOUD_ACCESS_KEY:}}}}")
    private String ncpAccessKey;

    @Value("${sms.gateway.ncp.secret-key:${NCP_SECRET_KEY:${mindgarden.sms.naver-cloud.secret-key:${NAVER_CLOUD_SECRET_KEY:}}}}")
    private String ncpSecretKey;

    @Value("${sms.gateway.ncp.service-id:${NCP_SMS_SERVICE_ID:${mindgarden.sms.naver-cloud.service-id:${NAVER_CLOUD_SMS_SERVICE_ID:}}}}")
    private String ncpServiceId;

    @Value("${sms.gateway.ncp.sender-number:${NCP_SMS_SENDER_NUMBER:}}")
    private String ncpSenderNumber;

    public SmsGatewayServiceImpl(Environment environment) {
        this(environment, buildDefaultRestTemplate());
    }

    /**
     * 테스트 전용 — RestTemplate 주입 생성자.
     *
     * @param environment Spring Environment
     * @param restTemplate 테스트용 RestTemplate (timeout/retry 검증용)
     */
    SmsGatewayServiceImpl(Environment environment, RestTemplate restTemplate) {
        this.environment = environment;
        this.restTemplate = restTemplate;
    }

    private static RestTemplate buildDefaultRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(HTTP_TIMEOUT_MS);
        factory.setReadTimeout(HTTP_TIMEOUT_MS);
        return new RestTemplate(factory);
    }

    @Override
    public SmsGatewaySendResult sendDetailed(String normalizedPhone, String messageBody) {
        if (normalizedPhone == null || normalizedPhone.isBlank()) {
            log.warn("SMS 발송 skip: phone 비어 있음");
            return SmsGatewaySendResult.failure("invalid_input", "phone is blank");
        }
        if (messageBody == null || messageBody.isBlank()) {
            log.warn("SMS 발송 skip: body 비어 있음 phone={}", normalizedPhone);
            return SmsGatewaySendResult.failure("invalid_input", "body is blank");
        }
        if (isStubMode()) {
            warnStubInProd(normalizedPhone);
            log.info("SMS 발송(stub): phone={} bodyLength={}", normalizedPhone, messageBody.length());
            return SmsGatewaySendResult.stub();
        }
        return invokeNaverCloudGateway(normalizedPhone, messageBody);
    }

    @Override
    public boolean isStubMode() {
        return blank(ncpAccessKey) || blank(ncpSecretKey) || blank(ncpServiceId) || blank(ncpSenderNumber);
    }

    /**
     * NCP SENS 정식 호출 — SignatureV2 서명 + HTTP POST + retry 1회.
     *
     * @param normalizedPhone 정규화된 휴대전화 번호
     * @param messageBody     발송할 본문
     * @return 호출 결과 (statusCode 202 = 성공)
     */
    private SmsGatewaySendResult invokeNaverCloudGateway(String normalizedPhone, String messageBody) {
        String uriPath = String.format(NCP_SENS_URI_FMT, ncpServiceId);
        URI fullUri = URI.create(NCP_SENS_BASE_URL + uriPath);

        Map<String, Object> body = buildRequestBody(normalizedPhone, messageBody);

        SmsGatewaySendResult lastResult = null;
        for (int attempt = 0; attempt <= RETRY_COUNT; attempt++) {
            try {
                HttpHeaders headers = buildSignedHeaders(uriPath);
                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
                ResponseEntity<String> response = restTemplate.exchange(
                        fullUri, HttpMethod.POST, entity, String.class);
                int status = response.getStatusCode().value();
                if (status == NCP_SUCCESS_STATUS) {
                    log.info("NCP SENS 발송 성공: phone={} statusCode={} attempt={}",
                            normalizedPhone, status, attempt + 1);
                    return SmsGatewaySendResult.success(String.valueOf(status), "accepted");
                }
                log.warn("NCP SENS 발송 비정상 응답: phone={} statusCode={} attempt={}",
                        normalizedPhone, status, attempt + 1);
                lastResult = SmsGatewaySendResult.failure(
                        String.valueOf(status),
                        "Unexpected status: " + status);
            } catch (HttpStatusCodeException ex) {
                int status = ex.getStatusCode().value();
                String responseBody = safeTruncate(ex.getResponseBodyAsString(), 200);
                log.warn("NCP SENS 발송 HTTP 오류: phone={} statusCode={} attempt={} body={}",
                        normalizedPhone, status, attempt + 1, responseBody);
                lastResult = SmsGatewaySendResult.failure(
                        String.valueOf(status),
                        responseBody != null && !responseBody.isBlank() ? responseBody : ex.getMessage());
                if (!isRetryableStatus(status)) {
                    break;
                }
            } catch (RestClientException ex) {
                log.warn("NCP SENS 발송 통신 오류: phone={} attempt={} message={}",
                        normalizedPhone, attempt + 1, ex.getMessage());
                lastResult = SmsGatewaySendResult.failure("exception", ex.getMessage());
            } catch (Exception ex) {
                log.error("NCP SENS 발송 예외: phone={} attempt={}", normalizedPhone, attempt + 1, ex);
                lastResult = SmsGatewaySendResult.failure("exception", ex.getMessage());
            }
        }
        if (lastResult == null) {
            lastResult = SmsGatewaySendResult.failure("unknown", "no response");
        }
        log.error("[OPS-ALERT] NCP SENS 발송 최종 실패: phone={} statusCode={} message={}",
                normalizedPhone, lastResult.getGatewayStatusCode(), lastResult.getGatewayMessage());
        return lastResult;
    }

    private Map<String, Object> buildRequestBody(String normalizedPhone, String messageBody) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("type", "SMS");
        body.put("contentType", "COMM");
        body.put("countryCode", "82");
        body.put("from", ncpSenderNumber.trim());
        body.put("content", messageBody);
        body.put("messages", List.of(Map.of("to", normalizedPhone)));
        return body;
    }

    private HttpHeaders buildSignedHeaders(String uriPath) {
        long timestamp = System.currentTimeMillis();
        String accessKey = ncpAccessKey.trim();
        String signature = generateSignatureV2("POST", uriPath, timestamp, accessKey, ncpSecretKey.trim());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/json; charset=utf-8"));
        headers.set("x-ncp-apigw-timestamp", String.valueOf(timestamp));
        headers.set("x-ncp-iam-access-key", accessKey);
        headers.set("x-ncp-apigw-signature-v2", signature);
        return headers;
    }

    /**
     * NCP API Gateway SignatureV2 생성.
     *
     * <p>spec: {@code method + " " + uriPath + "\n" + timestamp + "\n" + accessKey} 를
     * HmacSHA256 (secretKey) 으로 서명 후 Base64 인코딩.</p>
     *
     * <p>URI 는 query string 까지 포함된 path 만 사용한다(scheme/host 미포함).</p>
     *
     * @param method     HTTP method (POST 등)
     * @param uriPath    request URI path
     * @param timestamp  발송 timestamp (ms)
     * @param accessKey  NCP IAM access key
     * @param secretKey  NCP IAM secret key
     * @return Base64 서명 문자열
     */
    static String generateSignatureV2(
            String method, String uriPath, long timestamp, String accessKey, String secretKey) {
        try {
            String signMessage = method + " " + uriPath + "\n" + timestamp + "\n" + accessKey;
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
            byte[] hash = mac.doFinal(signMessage.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to generate NCP SENS SignatureV2", ex);
        }
    }

    /**
     * 5xx / 408 / 429 / 0(timeout-like) 는 retry 대상. 4xx 인증·요청 오류는 retry 무의미.
     */
    private static boolean isRetryableStatus(int status) {
        return status == 0 || status == 408 || status == 429 || (status >= 500 && status < 600);
    }

    private void warnStubInProd(String phone) {
        for (String profile : environment.getActiveProfiles()) {
            if ("prod".equalsIgnoreCase(profile)) {
                log.error("[OPS-ALERT] SMS stub mode in production — NCP SENS 환경변수 미설정. "
                        + "phone={} actualSendSkipped=true", phone);
                return;
            }
        }
    }

    private static String safeTruncate(String s, int max) {
        if (s == null) {
            return null;
        }
        return s.length() <= max ? s : s.substring(0, max);
    }

    private static boolean blank(String s) {
        return s == null || s.isBlank();
    }
}
