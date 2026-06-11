package com.coresolution.consultation.service.impl;

import java.net.SocketTimeoutException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import com.coresolution.consultation.dto.SmsGatewaySendResult;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.http.client.MockClientHttpResponse;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * {@link SmsGatewayServiceImpl} 단위 테스트.
 *
 * <p>2026-06-11 PR #224 후속 — NCP SENS SignatureV2 정식 호출 도입 회귀 가드:
 * <ol>
 *   <li>SignatureV2 — NCP API Gateway 공식 spec 과 동일한 HmacSHA256+Base64 결과를 생성한다.</li>
 *   <li>statusCode 202 = 성공으로 SmsGatewaySendResult.ok=true 로 매핑된다.</li>
 *   <li>4xx 응답은 즉시 실패(retry 불필요), 5xx/0 응답은 1회 재시도(총 2회 시도) 후 실패.</li>
 *   <li>I/O 타임아웃(SocketTimeoutException) 도 1회 재시도 후 실패로 매핑된다.</li>
 *   <li>RestTemplate 의 ClientHttpRequestFactory 는 connect/read timeout 5초로 구성된다.</li>
 *   <li>NCP SENS 4종 env 중 하나라도 비면 isStubMode=true → invokeNaverCloudGateway 진입 차단.</li>
 *   <li>빈 phone/body 는 invalid_input 으로 즉시 실패(NPE 방지).</li>
 * </ol></p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
class SmsGatewayServiceImplTest {

    private static final String ACCESS_KEY = "test-access";
    private static final String SECRET_KEY = "test-secret";
    private static final String SERVICE_ID = "ncp:sms:kr:1234567890:test-service";
    private static final String SENDER_NUMBER = "01000000000";

    private Environment environment;

    @BeforeEach
    void setUp() {
        this.environment = new MockEnvironment();
    }

    @Nested
    @DisplayName("isStubMode (4종 env)")
    class StubModeTests {

        @Test
        @DisplayName("4종 모두 비어 있으면 isStubMode=true 이고 sendDetailed 는 stub 결과를 반환한다")
        void isStubMode_whenAllBlank_true() {
            SmsGatewayServiceImpl sut = newImpl("", "", "", "");

            assertThat(sut.isStubMode()).isTrue();
            SmsGatewaySendResult result = sut.sendDetailed("01012345678", "[MindGarden] 인증번호: 123456");
            assertThat(result.isOk()).isTrue();
            assertThat(result.getGatewayStatusCode()).isEqualTo("stub");
        }

        @Test
        @DisplayName("일부만 비어도 isStubMode=true — 운영 NCP SENS 진입 차단")
        void isStubMode_whenAnyBlank_true() {
            SmsGatewayServiceImpl sut = newImpl(ACCESS_KEY, SECRET_KEY, SERVICE_ID, "");
            assertThat(sut.isStubMode()).isTrue();
        }

        @Test
        @DisplayName("4종 모두 채워지면 isStubMode=false 로 전환 — NCP SENS 정식 호출 경로 진입 가능")
        void isStubMode_whenAllPresent_false() {
            SmsGatewayServiceImpl sut = newImpl(ACCESS_KEY, SECRET_KEY, SERVICE_ID, SENDER_NUMBER);
            assertThat(sut.isStubMode()).isFalse();
        }
    }

    @Nested
    @DisplayName("invokeNaverCloudGateway — HTTP 호출")
    class InvokeNaverCloudGatewayTests {

        @Test
        @DisplayName("statusCode 202 → 성공 (gatewayStatusCode=\"202\")")
        void invoke_whenStatus202_returnsSuccess() throws Exception {
            RecordingRestTemplate rt = new RecordingRestTemplate(new MockClientHttpResponse(
                    "{\"requestId\":\"abc\",\"statusCode\":\"202\",\"statusName\":\"success\"}"
                            .getBytes(StandardCharsets.UTF_8),
                    org.springframework.http.HttpStatus.ACCEPTED));
            SmsGatewayServiceImpl sut = newImpl(ACCESS_KEY, SECRET_KEY, SERVICE_ID, SENDER_NUMBER, rt);

            SmsGatewaySendResult result = sut.sendDetailed("01012345678", "[MindGarden] 인증번호: 999111");

            assertThat(result.isOk()).isTrue();
            assertThat(result.getGatewayStatusCode()).isEqualTo("202");
            assertThat(rt.getCallCount()).isEqualTo(1);
            assertSignatureHeadersPresent(rt.getLastHeaders());
            assertThat(rt.getLastMethod()).isEqualTo(HttpMethod.POST);
            assertThat(rt.getLastUri().toString())
                    .isEqualTo("https://sens.apigw.ntruss.com/sms/v2/services/" + SERVICE_ID + "/messages");
        }

        @Test
        @DisplayName("statusCode 401 (4xx) → 즉시 실패(retry 1회는 SignatureV2 인증오류엔 무의미)")
        void invoke_whenStatus401_noRetry_failure() {
            RecordingRestTemplate rt = new RecordingRestTemplate(new MockClientHttpResponse(
                    "{\"error\":\"Unauthorized\"}".getBytes(StandardCharsets.UTF_8),
                    org.springframework.http.HttpStatus.UNAUTHORIZED));
            SmsGatewayServiceImpl sut = newImpl(ACCESS_KEY, SECRET_KEY, SERVICE_ID, SENDER_NUMBER, rt);

            SmsGatewaySendResult result = sut.sendDetailed("01012345678", "body");

            assertThat(result.isOk()).isFalse();
            assertThat(result.getGatewayStatusCode()).isEqualTo("401");
            assertThat(rt.getCallCount()).isEqualTo(1);
        }

        @Test
        @DisplayName("statusCode 500 (5xx) → retry 1회 후 실패 (총 2회 호출)")
        void invoke_whenStatus500_retriesOnce_failure() {
            RecordingRestTemplate rt = new RecordingRestTemplate(new MockClientHttpResponse(
                    "{\"error\":\"server\"}".getBytes(StandardCharsets.UTF_8),
                    org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR));
            SmsGatewayServiceImpl sut = newImpl(ACCESS_KEY, SECRET_KEY, SERVICE_ID, SENDER_NUMBER, rt);

            SmsGatewaySendResult result = sut.sendDetailed("01012345678", "body");

            assertThat(result.isOk()).isFalse();
            assertThat(result.getGatewayStatusCode()).isEqualTo("500");
            assertThat(rt.getCallCount()).isEqualTo(2);
        }

        @Test
        @DisplayName("SocketTimeoutException → retry 1회 후 통신 오류로 실패 (총 2회 호출)")
        void invoke_whenTimeout_retriesOnce_failure() {
            RestTemplate rt = new RestTemplate();
            CountingTimeoutInterceptor interceptor = new CountingTimeoutInterceptor();
            rt.getInterceptors().add(interceptor);
            SmsGatewayServiceImpl sut = newImpl(ACCESS_KEY, SECRET_KEY, SERVICE_ID, SENDER_NUMBER, rt);

            SmsGatewaySendResult result = sut.sendDetailed("01012345678", "body");

            assertThat(result.isOk()).isFalse();
            assertThat(result.getGatewayStatusCode()).isEqualTo("exception");
            assertThat(interceptor.callCount).isEqualTo(2);
        }

        @Test
        @DisplayName("빈 phone/body → invalid_input 즉시 실패 (HTTP 호출 없음)")
        void invoke_whenBlankInputs_invalidInput() {
            RecordingRestTemplate rt = new RecordingRestTemplate(new MockClientHttpResponse(
                    new byte[0], org.springframework.http.HttpStatus.ACCEPTED));
            SmsGatewayServiceImpl sut = newImpl(ACCESS_KEY, SECRET_KEY, SERVICE_ID, SENDER_NUMBER, rt);

            assertThat(sut.sendDetailed("", "body").isOk()).isFalse();
            assertThat(sut.sendDetailed("01012345678", "").isOk()).isFalse();
            assertThat(sut.sendDetailed(null, null).isOk()).isFalse();
            assertThat(rt.getCallCount()).isEqualTo(0);
        }

        @Test
        @DisplayName("성공 요청 본문은 NCP SENS SMS v2 스펙(type/from/content/messages[].to)을 포함한다")
        void invoke_whenSuccess_requestBodyMatchesNcpSpec() throws Exception {
            RecordingRestTemplate rt = new RecordingRestTemplate(new MockClientHttpResponse(
                    new byte[0], org.springframework.http.HttpStatus.ACCEPTED));
            SmsGatewayServiceImpl sut = newImpl(ACCESS_KEY, SECRET_KEY, SERVICE_ID, SENDER_NUMBER, rt);

            sut.sendDetailed("01012345678", "[MindGarden] 인증번호: 555111");

            assertThat(rt.getLastBody()).isInstanceOf(Map.class);
            Map<?, ?> body = (Map<?, ?>) rt.getLastBody();
            assertThat(body.get("type")).isEqualTo("SMS");
            assertThat(body.get("from")).isEqualTo(SENDER_NUMBER);
            assertThat(body.get("content")).isEqualTo("[MindGarden] 인증번호: 555111");
            assertThat(body.get("messages")).isInstanceOf(List.class);
            List<?> messages = (List<?>) body.get("messages");
            assertThat(messages).hasSize(1);
            assertThat(((Map<?, ?>) messages.get(0)).get("to")).isEqualTo("01012345678");
        }
    }

    @Nested
    @DisplayName("SignatureV2 (HmacSHA256 + Base64)")
    class SignatureV2Tests {

        @Test
        @DisplayName("generateSignatureV2 는 NCP 공식 spec(METHOD + URI + \\n + timestamp + \\n + accessKey) 과 동일한 결과를 만든다")
        void generateSignatureV2_matchesNcpSpec() throws Exception {
            long timestamp = 1718000000000L;
            String method = "POST";
            String uri = "/sms/v2/services/" + SERVICE_ID + "/messages";

            String actual = SmsGatewayServiceImpl
                    .generateSignatureV2(method, uri, timestamp, ACCESS_KEY, SECRET_KEY);

            String expected = computeExpectedSignature(method, uri, timestamp, ACCESS_KEY, SECRET_KEY);
            assertThat(actual).isEqualTo(expected);
            assertThat(Base64.getDecoder().decode(actual)).hasSize(32);
        }
    }

    @Nested
    @DisplayName("RestTemplate timeout 구성")
    class TimeoutConfigTests {

        @Test
        @DisplayName("기본 RestTemplate 는 connect/read timeout 5초로 구성된다 (HTTP_TIMEOUT_MS 상수와 일치)")
        void defaultRestTemplate_hasFiveSecondTimeout() {
            SmsGatewayServiceImpl sut = new SmsGatewayServiceImpl(new MockEnvironment());

            RestTemplate rt = (RestTemplate) ReflectionTestUtils.getField(sut, "restTemplate");
            Object factory = ReflectionTestUtils.getField(rt, "requestFactory");
            Integer connect = (Integer) ReflectionTestUtils.getField(factory, "connectTimeout");
            Integer read = (Integer) ReflectionTestUtils.getField(factory, "readTimeout");

            assertThat(SmsGatewayServiceImpl.HTTP_TIMEOUT_MS).isEqualTo(5_000);
            assertThat(connect).isEqualTo(5_000);
            assertThat(read).isEqualTo(5_000);
        }
    }

    // ---------- helpers ----------

    private SmsGatewayServiceImpl newImpl(String access, String secret, String serviceId, String sender) {
        return newImpl(access, secret, serviceId, sender, new RestTemplate());
    }

    private SmsGatewayServiceImpl newImpl(
            String access, String secret, String serviceId, String sender, RestTemplate restTemplate) {
        SmsGatewayServiceImpl sut = new SmsGatewayServiceImpl(environment, restTemplate);
        ReflectionTestUtils.setField(sut, "ncpAccessKey", access);
        ReflectionTestUtils.setField(sut, "ncpSecretKey", secret);
        ReflectionTestUtils.setField(sut, "ncpServiceId", serviceId);
        ReflectionTestUtils.setField(sut, "ncpSenderNumber", sender);
        return sut;
    }

    private static String computeExpectedSignature(
            String method, String uri, long timestamp, String accessKey, String secretKey) throws Exception {
        String signMessage = method + " " + uri + "\n" + timestamp + "\n" + accessKey;
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return Base64.getEncoder().encodeToString(mac.doFinal(signMessage.getBytes(StandardCharsets.UTF_8)));
    }

    private static void assertSignatureHeadersPresent(HttpHeaders headers) {
        assertThat(headers.getFirst("x-ncp-apigw-timestamp")).isNotBlank();
        assertThat(headers.getFirst("x-ncp-iam-access-key")).isEqualTo(ACCESS_KEY);
        String signature = headers.getFirst("x-ncp-apigw-signature-v2");
        assertThat(signature).isNotBlank();
        assertThat(Base64.getDecoder().decode(signature)).hasSize(32);
        assertThat(headers.getContentType()).isEqualTo(MediaType.parseMediaType("application/json; charset=utf-8"));
    }

    /**
     * RestTemplate 호출을 인-메모리로 캡쳐하는 테스트용 stub.
     * <p>외부 네트워크 없이 SignatureV2 헤더·요청 본문·재시도 회수만 검증한다.</p>
     */
    private static final class RecordingRestTemplate extends RestTemplate {

        private final ClientHttpResponse mockResponse;
        private int callCount;
        private HttpHeaders lastHeaders;
        private HttpMethod lastMethod;
        private java.net.URI lastUri;
        private Object lastBody;

        RecordingRestTemplate(ClientHttpResponse mockResponse) {
            this.mockResponse = mockResponse;
        }

        @Override
        public <T> org.springframework.http.ResponseEntity<T> exchange(
                java.net.URI url,
                HttpMethod method,
                org.springframework.http.HttpEntity<?> requestEntity,
                Class<T> responseType) {
            callCount++;
            lastUri = url;
            lastMethod = method;
            lastHeaders = requestEntity.getHeaders();
            lastBody = requestEntity.getBody();
            try {
                String responseBody = new String(mockResponse.getBody().readAllBytes(), StandardCharsets.UTF_8);
                org.springframework.http.HttpStatus status =
                        org.springframework.http.HttpStatus.valueOf(mockResponse.getStatusCode().value());
                if (status.isError()) {
                    throw org.springframework.web.client.HttpClientErrorException.create(
                            status, status.getReasonPhrase(), mockResponse.getHeaders(),
                            responseBody.getBytes(StandardCharsets.UTF_8), StandardCharsets.UTF_8);
                }
                @SuppressWarnings("unchecked")
                T body = (T) responseBody;
                return new org.springframework.http.ResponseEntity<>(body, mockResponse.getHeaders(), status);
            } catch (java.io.IOException ex) {
                throw new IllegalStateException(ex);
            }
        }

        int getCallCount() { return callCount; }
        HttpHeaders getLastHeaders() { return lastHeaders; }
        HttpMethod getLastMethod() { return lastMethod; }
        java.net.URI getLastUri() { return lastUri; }
        Object getLastBody() { return lastBody; }
    }

    /**
     * SocketTimeoutException 을 던지는 인터셉터 — read timeout 시 RestTemplate 가 던지는 예외와 동일 타입.
     */
    private static final class CountingTimeoutInterceptor implements ClientHttpRequestInterceptor {
        private int callCount;

        @Override
        public ClientHttpResponse intercept(
                org.springframework.http.HttpRequest request, byte[] body, ClientHttpRequestExecution execution) {
            callCount++;
            throw new ResourceAccessException("read timed out", new SocketTimeoutException("read timed out"));
        }
    }
}
