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

    private SolapiAlimTalkRequest buildRequest() {
        SolapiCredentials credentials = new SolapiCredentials("NCSXXXXKEY", "NCSXXXXSECRET_VALUE_VALUE_VALUE_1234");
        Map<String, String> variables = new LinkedHashMap<>();
        variables.put("#{name}", "홍길동");
        variables.put("#{date}", "2026-05-20 14:00");
        return new SolapiAlimTalkRequest(credentials, PFID, TEMPLATE_ID, FROM_NUMBER, TO_NUMBER, variables);
    }
}
