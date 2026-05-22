package com.coresolution.consultation.integration.solapi;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withBadRequest;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

/**
 * {@link SolapiKakaoTemplateClient} 단위 테스트.
 *
 * <p>Solapi v2 템플릿 메타 API({@code /kakao/v2/templates*})는 v1의 {@code pfId} 쿼리 키가
 * {@code channelId} 로 명칭만 변경되어 동작한다. 본 테스트는 클라이언트가 새 명칭으로 쿼리
 * 문자열을 송신하는지 검증한다(값 {@code KA01PF…} 은 동일).
 *
 * <p>RestTemplate 은 {@link MockRestServiceServer} 로 stub 한다.
 *
 * @author MindGarden
 * @since 2026-05-22
 */
@DisplayName("SolapiKakaoTemplateClient")
class SolapiKakaoTemplateClientTest {

    private static final String API_BASE = "https://api.solapi.com";
    private static final String API_KEY = "NCSAPIKEY00000001";
    private static final String API_SECRET = "NCSAPISECRET0000000000000000000000000001";
    private static final String CHANNEL_ID = "KA01PFENVTEST123";

    private RestTemplate restTemplate;
    private MockRestServiceServer mockServer;
    private SolapiKakaoTemplateClient client;

    @BeforeEach
    void setUp() {
        restTemplate = new RestTemplate();
        mockServer = MockRestServiceServer.createServer(restTemplate);
        client = new SolapiKakaoTemplateClient(
            new SolapiSignatureSigner(), restTemplate, new ObjectMapper(), API_BASE);
    }

    @Test
    @DisplayName("list(): channelId 인자가 전달되면 ?channelId= 쿼리 키로 송신한다 (v2 명칭)")
    void list_sendsChannelIdQueryKey() {
        SolapiCredentials credentials = new SolapiCredentials(API_KEY, API_SECRET);
        String responseBody = "{\"templateList\":[]}";

        mockServer
            .expect(requestTo(API_BASE + SolapiKakaoTemplateClient.LIST_ENDPOINT
                + "?channelId=" + CHANNEL_ID))
            .andExpect(method(HttpMethod.GET))
            .andRespond(withSuccess(responseBody, MediaType.APPLICATION_JSON));

        SolapiKakaoTemplateClient.Response response = client.list(credentials, CHANNEL_ID);

        assertThat(response.success()).isTrue();
        assertThat(response.templates()).isEmpty();
        mockServer.verify();
    }

    @Test
    @DisplayName("list(): channelId 가 null 이면 쿼리 파라미터 없이 송신한다")
    void list_omitsQueryWhenChannelIdIsNull() {
        SolapiCredentials credentials = new SolapiCredentials(API_KEY, API_SECRET);
        String responseBody = "{\"templateList\":["
            + "{\"templateId\":\"KA01TP000000000001\",\"name\":\"결제\",\"status\":\"APPROVED\"}]}";

        mockServer
            .expect(requestTo(API_BASE + SolapiKakaoTemplateClient.LIST_ENDPOINT))
            .andExpect(method(HttpMethod.GET))
            .andRespond(withSuccess(responseBody, MediaType.APPLICATION_JSON));

        SolapiKakaoTemplateClient.Response response = client.list(credentials, null);

        assertThat(response.success()).isTrue();
        assertThat(response.templates()).hasSize(1);
        assertThat(response.templates().get(0).templateId()).isEqualTo("KA01TP000000000001");
        mockServer.verify();
    }

    @Test
    @DisplayName("list(): 4xx 응답이면 success=false 와 errorCode/errorMessage 를 그대로 전달")
    void list_parses4xxErrorPayload() {
        SolapiCredentials credentials = new SolapiCredentials(API_KEY, API_SECRET);
        String responseBody = "{\"errorCode\":\"ValidationError\","
            + "\"errorMessage\":\"channelId is required\"}";

        mockServer
            .expect(requestTo(API_BASE + SolapiKakaoTemplateClient.LIST_ENDPOINT
                + "?channelId=" + CHANNEL_ID))
            .andExpect(method(HttpMethod.GET))
            .andRespond(withBadRequest()
                .contentType(MediaType.APPLICATION_JSON)
                .body(responseBody));

        SolapiKakaoTemplateClient.Response response = client.list(credentials, CHANNEL_ID);

        assertThat(response.success()).isFalse();
        assertThat(response.statusCode()).isEqualTo(400);
        assertThat(response.errorCode()).isEqualTo("ValidationError");
        assertThat(response.errorMessage()).isEqualTo("channelId is required");
        mockServer.verify();
    }

    @Test
    @DisplayName("list(): credentials 미설정이면 외부 호출 없이 MISSING_CREDENTIALS 반환")
    void list_returnsMissingCredentialsWhenIncomplete() {
        SolapiCredentials credentials = new SolapiCredentials(null, null);

        SolapiKakaoTemplateClient.Response response = client.list(credentials, CHANNEL_ID);

        assertThat(response.success()).isFalse();
        assertThat(response.statusCode()).isEqualTo(401);
        assertThat(response.errorCode()).isEqualTo("MISSING_CREDENTIALS");
        mockServer.verify();
    }
}
