package com.coresolution.consultation.integration.solapi;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withBadRequest;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.util.LinkedHashMap;
import java.util.Map;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.client.match.MockRestRequestMatchers;
import org.springframework.web.client.RestTemplate;

/**
 * {@link SolapiAlimTalkClient} 단건 발송 본문/헤더 검증.
 * RestTemplate은 {@link MockRestServiceServer}로 stub.
 *
 * @author CoreSolution
 * @since 2026-05-20
 */
@DisplayName("SolapiAlimTalkClient")
class SolapiAlimTalkClientTest {

    private static final String API_BASE = "https://api.solapi.com";
    private static final String PFID = "PF01234567890ABCDE";
    private static final String TEMPLATE_ID = "TPL_RESERVATION_CONFIRMED_V1";
    private static final String TO_NUMBER = "01012345678";
    private static final String FROM_NUMBER = "0212345678";

    private RestTemplate restTemplate;
    private MockRestServiceServer mockServer;
    private SolapiAlimTalkClient client;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        restTemplate = new RestTemplate();
        mockServer = MockRestServiceServer.createServer(restTemplate);
        objectMapper = new ObjectMapper();
        client = new SolapiAlimTalkClient(new SolapiSignatureSigner(), restTemplate, objectMapper, API_BASE);
    }

    @Test
    @DisplayName("send(): 정상 응답이면 success=true, messageId 반영")
    void sendReturnsSuccessOn2xx() throws Exception {
        SolapiAlimTalkRequest request = buildRequest();
        String responseBody = "{\"groupId\":\"G123\",\"count\":{\"total\":1}}";

        mockServer
            .expect(requestTo(API_BASE + SolapiAlimTalkClient.SEND_ENDPOINT))
            .andExpect(method(HttpMethod.POST))
            .andExpect(header("Content-Type", MediaType.APPLICATION_JSON_VALUE))
            .andExpect(MockRestRequestMatchers.header(
                SolapiSignatureSigner.AUTH_HEADER,
                org.hamcrest.Matchers.startsWith(SolapiSignatureSigner.AUTH_SCHEME + " apiKey=NCSXXXX")))
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andExpect(req -> {
                org.springframework.mock.http.client.MockClientHttpRequest mockReq =
                    (org.springframework.mock.http.client.MockClientHttpRequest) req;
                JsonNode root = objectMapper.readTree(mockReq.getBodyAsString());
                JsonNode messages = root.get("messages");
                assertThat(messages.isArray()).isTrue();
                JsonNode message = messages.get(0);
                assertThat(message.get("type").asText()).isEqualTo(SolapiAlimTalkClient.MESSAGE_TYPE_ATA);
                assertThat(message.get("to").asText()).isEqualTo(TO_NUMBER);
                assertThat(message.get("from").asText()).isEqualTo(FROM_NUMBER);
                JsonNode kakaoOptions = message.get("kakaoOptions");
                assertThat(kakaoOptions.get("pfId").asText()).isEqualTo(PFID);
                assertThat(kakaoOptions.get("templateId").asText()).isEqualTo(TEMPLATE_ID);
                JsonNode variables = kakaoOptions.get("variables");
                assertThat(variables.get("#{name}").asText()).isEqualTo("홍길동");
                assertThat(variables.get("#{date}").asText()).isEqualTo("2026-05-20 14:00");
            })
            .andRespond(withSuccess(responseBody, MediaType.APPLICATION_JSON));

        SolapiAlimTalkResponse response = client.send(request);

        assertThat(response.success()).isTrue();
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.messageId()).isEqualTo("G123");
        mockServer.verify();
    }

    @Test
    @DisplayName("send(): 4xx 응답이면 success=false, errorCode/errorMessage 반영")
    void sendReturnsFailureOn4xx() {
        SolapiAlimTalkRequest request = buildRequest();
        String responseBody = "{\"errorCode\":\"ValidationError\",\"errorMessage\":\"pfId invalid\"}";

        mockServer
            .expect(requestTo(API_BASE + SolapiAlimTalkClient.SEND_ENDPOINT))
            .andExpect(method(HttpMethod.POST))
            .andRespond(withBadRequest().body(responseBody).contentType(MediaType.APPLICATION_JSON));

        SolapiAlimTalkResponse response = client.send(request);

        assertThat(response.success()).isFalse();
        assertThat(response.statusCode()).isEqualTo(400);
        assertThat(response.errorCode()).isEqualTo("ValidationError");
        assertThat(response.errorMessage()).isEqualTo("pfId invalid");
        mockServer.verify();
    }

    @Test
    @DisplayName("send(): 자격 증명 누락이면 호출 없이 INVALID_REQUEST 반환")
    void sendShortCircuitsWithoutCredentials() {
        SolapiAlimTalkRequest request = new SolapiAlimTalkRequest(
            new SolapiCredentials("", ""),
            PFID,
            TEMPLATE_ID,
            FROM_NUMBER,
            TO_NUMBER,
            Map.of());

        SolapiAlimTalkResponse response = client.send(request);

        assertThat(response.success()).isFalse();
        assertThat(response.statusCode()).isEqualTo(400);
        assertThat(response.errorCode()).isEqualTo("INVALID_REQUEST");
        mockServer.verify();
    }

    @Test
    @DisplayName("parseResponse: messageList statusCode=2000 + groupInfo.status=SENDING 이면 success, groupId 추출")
    void sendReturnsSuccessWhenMessageStatusIs2000() {
        SolapiAlimTalkRequest request = buildRequest();
        String responseBody = "{"
            + "\"groupInfo\":{\"_id\":\"G_OK\",\"groupId\":\"G_OK\",\"status\":\"SENDING\","
            + "\"count\":{\"total\":1,\"registeredFailed\":0}},"
            + "\"messageList\":[{\"messageId\":\"M_OK\",\"statusCode\":\"2000\","
            + "\"statusMessage\":\"정상 접수\",\"status\":\"PENDING\"}]}";

        mockServer
            .expect(requestTo(API_BASE + SolapiAlimTalkClient.SEND_ENDPOINT))
            .andExpect(method(HttpMethod.POST))
            .andRespond(withSuccess(responseBody, MediaType.APPLICATION_JSON));

        SolapiAlimTalkResponse response = client.send(request);

        assertThat(response.success()).isTrue();
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.groupId()).isEqualTo("G_OK");
        assertThat(response.messageId()).isEqualTo("M_OK");
        assertThat(response.errorCode()).isNull();
        mockServer.verify();
    }

    @Test
    @DisplayName("parseResponse: messageList statusCode=3013 reject 이면 success=false + errorCode/Message 폴백")
    void sendReturnsFailureWhenMessageRejected() {
        SolapiAlimTalkRequest request = buildRequest();
        String responseBody = "{"
            + "\"groupInfo\":{\"groupId\":\"G_REJ\",\"status\":\"SENDING\","
            + "\"count\":{\"total\":1,\"registeredFailed\":1}},"
            + "\"messageList\":[{\"messageId\":\"M_REJ\",\"statusCode\":\"3013\","
            + "\"statusMessage\":\"등록되지 않은 template 입니다\",\"status\":\"FAIL\"}]}";

        mockServer
            .expect(requestTo(API_BASE + SolapiAlimTalkClient.SEND_ENDPOINT))
            .andExpect(method(HttpMethod.POST))
            .andRespond(withSuccess(responseBody, MediaType.APPLICATION_JSON));

        SolapiAlimTalkResponse response = client.send(request);

        assertThat(response.success()).isFalse();
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.groupId()).isEqualTo("G_REJ");
        assertThat(response.messageId()).isEqualTo("M_REJ");
        assertThat(response.errorCode()).isEqualTo("3013");
        assertThat(response.errorMessage()).contains("등록되지 않은");
        mockServer.verify();
    }

    @Test
    @DisplayName("parseResponse: registeredFailed>0 + messageList 비어 있어도 success=false")
    void sendReturnsFailureWhenRegisteredFailedOnly() {
        SolapiAlimTalkRequest request = buildRequest();
        String responseBody = "{"
            + "\"groupInfo\":{\"groupId\":\"G_RF\",\"status\":\"SENDING\","
            + "\"count\":{\"total\":1,\"registeredFailed\":1}},"
            + "\"messageList\":[]}";

        mockServer
            .expect(requestTo(API_BASE + SolapiAlimTalkClient.SEND_ENDPOINT))
            .andExpect(method(HttpMethod.POST))
            .andRespond(withSuccess(responseBody, MediaType.APPLICATION_JSON));

        SolapiAlimTalkResponse response = client.send(request);

        assertThat(response.success()).isFalse();
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.groupId()).isEqualTo("G_RF");
        assertThat(response.errorCode()).isEqualTo("UNKNOWN");
        assertThat(response.errorMessage()).contains("registeredFailed=1");
        mockServer.verify();
    }

    @Test
    @DisplayName("parseResponse: groupInfo.status=FAILED 이면 success=false")
    void sendReturnsFailureWhenGroupStatusFailed() {
        SolapiAlimTalkRequest request = buildRequest();
        String responseBody = "{"
            + "\"groupInfo\":{\"groupId\":\"G_FAIL\",\"status\":\"FAILED\","
            + "\"count\":{\"total\":1,\"registeredFailed\":0}},"
            + "\"messageList\":[{\"messageId\":\"M_FAIL\",\"statusCode\":\"2000\","
            + "\"statusMessage\":\"정상 접수\"}]}";

        mockServer
            .expect(requestTo(API_BASE + SolapiAlimTalkClient.SEND_ENDPOINT))
            .andExpect(method(HttpMethod.POST))
            .andRespond(withSuccess(responseBody, MediaType.APPLICATION_JSON));

        SolapiAlimTalkResponse response = client.send(request);

        assertThat(response.success()).isFalse();
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.groupId()).isEqualTo("G_FAIL");
        assertThat(response.errorCode()).isEqualTo("UNKNOWN");
        assertThat(response.errorMessage()).contains("status=FAILED");
        mockServer.verify();
    }

    @Test
    @DisplayName("parseResponse: HTTP 400 + errorCode=PfNotAccepted 회귀 유지(success=false, errorCode 보존)")
    void sendKeepsLegacyFailureBehaviorOn4xxWithErrorCode() {
        SolapiAlimTalkRequest request = buildRequest();
        String responseBody = "{\"errorCode\":\"PfNotAccepted\",\"errorMessage\":\"발신프로필 비활성\"}";

        mockServer
            .expect(requestTo(API_BASE + SolapiAlimTalkClient.SEND_ENDPOINT))
            .andExpect(method(HttpMethod.POST))
            .andRespond(withBadRequest().body(responseBody).contentType(MediaType.APPLICATION_JSON));

        SolapiAlimTalkResponse response = client.send(request);

        assertThat(response.success()).isFalse();
        assertThat(response.statusCode()).isEqualTo(400);
        assertThat(response.errorCode()).isEqualTo("PfNotAccepted");
        assertThat(response.errorMessage()).isEqualTo("발신프로필 비활성");
        mockServer.verify();
    }

    @Test
    @DisplayName("parseResponse: HTTP 200 + 빈 body 면 success=true, messageId=null (회귀 유지)")
    void sendKeepsLegacyBehaviorOnEmptyBody() {
        SolapiAlimTalkRequest request = buildRequest();

        mockServer
            .expect(requestTo(API_BASE + SolapiAlimTalkClient.SEND_ENDPOINT))
            .andExpect(method(HttpMethod.POST))
            .andRespond(withSuccess("", MediaType.APPLICATION_JSON));

        SolapiAlimTalkResponse response = client.send(request);

        assertThat(response.success()).isTrue();
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.messageId()).isNull();
        assertThat(response.groupId()).isNull();
        mockServer.verify();
    }

    @Test
    @DisplayName("parseResponse: failedMessageList[0].statusCode 가 reject 사유로 추출되어 errorCode/errorMessage 노출")
    void sendReturnsFailureWithFailedMessageListReject() {
        SolapiAlimTalkRequest request = buildRequest();
        String responseBody = "{"
            + "\"groupInfo\":{\"groupId\":\"G_FML_REJ\",\"status\":\"COMPLETE\","
            + "\"count\":{\"total\":1,\"registeredFailed\":1}},"
            + "\"failedMessageList\":[{\"statusCode\":\"3013\","
            + "\"statusMessage\":\"등록되지 않은 템플릿입니다\",\"type\":\"ATA\"}]}";

        mockServer
            .expect(requestTo(API_BASE + SolapiAlimTalkClient.SEND_ENDPOINT))
            .andExpect(method(HttpMethod.POST))
            .andRespond(withSuccess(responseBody, MediaType.APPLICATION_JSON));

        SolapiAlimTalkResponse response = client.send(request);

        assertThat(response.success()).isFalse();
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.groupId()).isEqualTo("G_FML_REJ");
        assertThat(response.errorCode()).isEqualTo("3013");
        assertThat(response.errorMessage())
            .contains("등록되지 않은 템플릿입니다")
            .contains("[3013]");
        mockServer.verify();
    }

    @Test
    @DisplayName("parseResponse: failedMessageList=[] + groupInfo.status=COMPLETE + registeredFailed=1 이면 group summary 폴백")
    void sendReturnsFailureWithGroupSummaryFallback() {
        SolapiAlimTalkRequest request = buildRequest();
        String responseBody = "{"
            + "\"groupInfo\":{\"groupId\":\"G_SUMMARY\",\"status\":\"COMPLETE\","
            + "\"count\":{\"total\":1,\"registeredFailed\":1}},"
            + "\"failedMessageList\":[]}";

        mockServer
            .expect(requestTo(API_BASE + SolapiAlimTalkClient.SEND_ENDPOINT))
            .andExpect(method(HttpMethod.POST))
            .andRespond(withSuccess(responseBody, MediaType.APPLICATION_JSON));

        SolapiAlimTalkResponse response = client.send(request);

        assertThat(response.success()).isFalse();
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.groupId()).isEqualTo("G_SUMMARY");
        assertThat(response.errorCode()).isEqualTo("UNKNOWN");
        assertThat(response.errorMessage())
            .contains("Solapi 알림톡 등록 실패")
            .contains("registeredFailed=1");
        mockServer.verify();
    }

    @Test
    @DisplayName("parseResponse: failedMessageList 와 messageList 가 모두 있어도 failedMessageList 가 우선")
    void sendPrefersFailedMessageListOverMessageList() {
        SolapiAlimTalkRequest request = buildRequest();
        String responseBody = "{"
            + "\"groupInfo\":{\"groupId\":\"G_BOTH\",\"status\":\"COMPLETE\","
            + "\"count\":{\"total\":1,\"registeredFailed\":1}},"
            + "\"failedMessageList\":[{\"statusCode\":\"3013\","
            + "\"statusMessage\":\"등록되지 않은 템플릿입니다\",\"type\":\"ATA\"}],"
            + "\"messageList\":[{\"messageId\":\"M_FAIL\",\"statusCode\":\"2000\","
            + "\"statusMessage\":\"정상 접수\"}]}";

        mockServer
            .expect(requestTo(API_BASE + SolapiAlimTalkClient.SEND_ENDPOINT))
            .andExpect(method(HttpMethod.POST))
            .andRespond(withSuccess(responseBody, MediaType.APPLICATION_JSON));

        SolapiAlimTalkResponse response = client.send(request);

        assertThat(response.success()).isFalse();
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.groupId()).isEqualTo("G_BOTH");
        assertThat(response.errorCode()).isEqualTo("3013");
        assertThat(response.errorMessage()).contains("등록되지 않은 템플릿입니다");
        mockServer.verify();
    }

    @Test
    @DisplayName("send(): plain key 변수는 #{변수명} 형식으로 wrap 되어 송신")
    void sendWrapsPlainVariableKeysToHashBraceFormat() {
        SolapiCredentials credentials = new SolapiCredentials("NCSXXXXKEY", "NCSXXXXSECRET_VALUE_VALUE_VALUE_1234");
        Map<String, String> plainVariables = new LinkedHashMap<>();
        plainVariables.put("paymentAmount", "100000");
        plainVariables.put("packageName", "오픈패키지");
        plainVariables.put("consultantName", "김선희");
        SolapiAlimTalkRequest request = new SolapiAlimTalkRequest(
            credentials, PFID, TEMPLATE_ID, FROM_NUMBER, TO_NUMBER, plainVariables);

        mockServer
            .expect(requestTo(API_BASE + SolapiAlimTalkClient.SEND_ENDPOINT))
            .andExpect(method(HttpMethod.POST))
            .andExpect(req -> {
                org.springframework.mock.http.client.MockClientHttpRequest mockReq =
                    (org.springframework.mock.http.client.MockClientHttpRequest) req;
                JsonNode root = objectMapper.readTree(mockReq.getBodyAsString());
                JsonNode variables = root.get("messages").get(0).get("kakaoOptions").get("variables");
                assertThat(variables.has("paymentAmount"))
                    .as("plain key 는 직접 송신되지 않아야 함")
                    .isFalse();
                assertThat(variables.get("#{paymentAmount}").asText()).isEqualTo("100000");
                assertThat(variables.get("#{packageName}").asText()).isEqualTo("오픈패키지");
                assertThat(variables.get("#{consultantName}").asText()).isEqualTo("김선희");
            })
            .andRespond(withSuccess("{\"groupId\":\"G_WRAP\"}", MediaType.APPLICATION_JSON));

        SolapiAlimTalkResponse response = client.send(request);

        assertThat(response.success()).isTrue();
        mockServer.verify();
    }

    @Test
    @DisplayName("send(): 이미 #{} wrap 된 key 는 idempotent 처리(이중 wrap 금지)")
    void sendKeepsAlreadyWrappedVariableKeys() {
        SolapiCredentials credentials = new SolapiCredentials("NCSXXXXKEY", "NCSXXXXSECRET_VALUE_VALUE_VALUE_1234");
        Map<String, String> wrappedVariables = new LinkedHashMap<>();
        wrappedVariables.put("#{고객명}", "홍길동");
        wrappedVariables.put("#{주문번호}", "ORD-12345");
        SolapiAlimTalkRequest request = new SolapiAlimTalkRequest(
            credentials, PFID, TEMPLATE_ID, FROM_NUMBER, TO_NUMBER, wrappedVariables);

        mockServer
            .expect(requestTo(API_BASE + SolapiAlimTalkClient.SEND_ENDPOINT))
            .andExpect(method(HttpMethod.POST))
            .andExpect(req -> {
                org.springframework.mock.http.client.MockClientHttpRequest mockReq =
                    (org.springframework.mock.http.client.MockClientHttpRequest) req;
                JsonNode root = objectMapper.readTree(mockReq.getBodyAsString());
                JsonNode variables = root.get("messages").get(0).get("kakaoOptions").get("variables");
                assertThat(variables.get("#{고객명}").asText()).isEqualTo("홍길동");
                assertThat(variables.get("#{주문번호}").asText()).isEqualTo("ORD-12345");
                assertThat(variables.has("#{#{고객명}}"))
                    .as("이중 wrap 금지")
                    .isFalse();
                assertThat(variables.has("#{#{주문번호}}"))
                    .as("이중 wrap 금지")
                    .isFalse();
            })
            .andRespond(withSuccess("{\"groupId\":\"G_IDEM\"}", MediaType.APPLICATION_JSON));

        SolapiAlimTalkResponse response = client.send(request);

        assertThat(response.success()).isTrue();
        mockServer.verify();
    }

    @Test
    @DisplayName("send(): null/blank key 는 skip, null value 는 빈 문자열로 안전 처리")
    void sendHandlesNullAndBlankKeysSafely() {
        SolapiCredentials credentials = new SolapiCredentials("NCSXXXXKEY", "NCSXXXXSECRET_VALUE_VALUE_VALUE_1234");
        Map<String, String> messyVariables = new LinkedHashMap<>();
        messyVariables.put(null, "skip-me");
        messyVariables.put("   ", "blank-key-skip");
        messyVariables.put("clientName", null);
        messyVariables.put("packageName", "베이직");
        SolapiAlimTalkRequest request = new SolapiAlimTalkRequest(
            credentials, PFID, TEMPLATE_ID, FROM_NUMBER, TO_NUMBER, messyVariables);

        mockServer
            .expect(requestTo(API_BASE + SolapiAlimTalkClient.SEND_ENDPOINT))
            .andExpect(method(HttpMethod.POST))
            .andExpect(req -> {
                org.springframework.mock.http.client.MockClientHttpRequest mockReq =
                    (org.springframework.mock.http.client.MockClientHttpRequest) req;
                JsonNode root = objectMapper.readTree(mockReq.getBodyAsString());
                JsonNode variables = root.get("messages").get(0).get("kakaoOptions").get("variables");
                assertThat(variables.size()).isEqualTo(2);
                assertThat(variables.get("#{clientName}").asText())
                    .as("null value 는 빈 문자열로 치환")
                    .isEqualTo("");
                assertThat(variables.get("#{packageName}").asText()).isEqualTo("베이직");
            })
            .andRespond(withSuccess("{\"groupId\":\"G_SAFE\"}", MediaType.APPLICATION_JSON));

        SolapiAlimTalkResponse response = client.send(request);

        assertThat(response.success()).isTrue();
        mockServer.verify();
    }

    private SolapiAlimTalkRequest buildRequest() {
        SolapiCredentials credentials = new SolapiCredentials("NCSXXXXKEY", "NCSXXXXSECRET_VALUE_VALUE_VALUE_1234");
        Map<String, String> variables = new LinkedHashMap<>();
        variables.put("#{name}", "홍길동");
        variables.put("#{date}", "2026-05-20 14:00");
        return new SolapiAlimTalkRequest(credentials, PFID, TEMPLATE_ID, FROM_NUMBER, TO_NUMBER, variables);
    }
}
