package com.coresolution.consultation.integration.solapi;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;

/**
 * 솔라피(Solapi/CoolSMS) 카카오 알림톡 템플릿 메타 조회 클라이언트(read-only).
 *
 * <p>{@code GET /kakao/v2/templates} 엔드포인트를 호출하여 검수 승인된 템플릿 목록을 가져온다.
 * 발송 클라이언트({@link SolapiAlimTalkClient})와 분리하여 어드민 도구의 메타 조회만 담당한다.
 *
 * <p>인증은 {@link SolapiSignatureSigner}의 HMAC-SHA256 헤더를 그대로 사용한다.
 *
 * @author MindGarden
 * @since 2026-05-22
 */
@Slf4j
@Component
public class SolapiKakaoTemplateClient {

    static final String LIST_ENDPOINT = "/kakao/v2/templates";

    private final SolapiSignatureSigner signatureSigner;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final String apiBaseUrl;

    /**
     * 운영용 생성자.
     *
     * @param signatureSigner 솔라피 HMAC 서명 유틸
     * @param apiBaseUrl      솔라피 API base URL
     */
    @Autowired
    public SolapiKakaoTemplateClient(SolapiSignatureSigner signatureSigner,
            @Value("${kakao.alimtalk.solapi.api-url:https://api.solapi.com}") String apiBaseUrl) {
        this(signatureSigner, new RestTemplate(), new ObjectMapper(), apiBaseUrl);
    }

    /**
     * 테스트용 생성자.
     *
     * @param signatureSigner 솔라피 HMAC 서명 유틸
     * @param restTemplate    주입된 RestTemplate
     * @param objectMapper    Jackson ObjectMapper
     * @param apiBaseUrl      솔라피 API base URL
     */
    public SolapiKakaoTemplateClient(SolapiSignatureSigner signatureSigner,
            RestTemplate restTemplate, ObjectMapper objectMapper, String apiBaseUrl) {
        this.signatureSigner = signatureSigner;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.apiBaseUrl = normalize(apiBaseUrl);
    }

    /**
     * 알림톡 템플릿 목록 조회(검수 승인 한정 권장).
     *
     * @param credentials 솔라피 자격 증명
     * @param pfId        솔라피 발신 프로필 ID(필터, null이면 계정 전체)
     * @return 응답(성공 여부 + 템플릿 리스트)
     */
    public Response list(SolapiCredentials credentials, String pfId) {
        if (credentials == null || !credentials.isComplete()) {
            return Response.failure(401, "MISSING_CREDENTIALS", "solapi credentials missing");
        }

        StringBuilder url = new StringBuilder(apiBaseUrl).append(LIST_ENDPOINT);
        if (pfId != null && !pfId.isBlank()) {
            url.append("?pfId=").append(URLEncoder.encode(pfId, StandardCharsets.UTF_8));
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.set(SolapiSignatureSigner.AUTH_HEADER,
            signatureSigner.buildAuthorizationHeader(credentials.apiKey(), credentials.apiSecret()));

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                URI.create(url.toString()),
                HttpMethod.GET,
                new HttpEntity<>(headers),
                String.class);
            return parse(response.getStatusCode().value(), response.getBody());
        } catch (RestClientResponseException e) {
            log.warn("Solapi 알림톡 템플릿 조회 HTTP 오류: status={}, length={}",
                e.getStatusCode(), e.getResponseBodyAsString() == null ? 0
                    : e.getResponseBodyAsString().length());
            return parse(e.getStatusCode().value(), e.getResponseBodyAsString());
        } catch (Exception e) {
            log.warn("Solapi 알림톡 템플릿 조회 실패: {}", e.getMessage());
            return Response.failure(500, "CLIENT_ERROR", e.getClass().getSimpleName());
        }
    }

    private Response parse(int statusCode, String body) {
        boolean is2xx = statusCode >= 200 && statusCode < 300;
        if (body == null || body.isBlank()) {
            return is2xx ? Response.success(Collections.emptyList())
                : Response.failure(statusCode, "EMPTY_BODY", "empty response");
        }
        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode listNode = root.has("templateList") ? root.get("templateList")
                : root.has("templates") ? root.get("templates")
                : root.isArray() ? root : null;
            if (listNode == null || !listNode.isArray()) {
                return is2xx ? Response.success(Collections.emptyList())
                    : Response.failure(statusCode, textOrNull(root, "errorCode"),
                        textOrNull(root, "errorMessage"));
            }
            List<TemplateMeta> templates = new ArrayList<>();
            for (JsonNode item : listNode) {
                templates.add(new TemplateMeta(
                    textOrNull(item, "templateId"),
                    textOrNull(item, "name"),
                    textOrNull(item, "status"),
                    textOrNull(item, "content")));
            }
            return Response.success(templates);
        } catch (Exception e) {
            log.warn("Solapi 알림톡 템플릿 응답 파싱 실패: {}", e.getMessage());
            return is2xx ? Response.success(Collections.emptyList())
                : Response.failure(statusCode, "PARSE_ERROR", e.getMessage());
        }
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

    /**
     * 솔라피 템플릿 메타.
     *
     * @param templateId 솔라피 templateId
     * @param name       템플릿 이름
     * @param status     검수 상태(APPROVED 등)
     * @param content    템플릿 본문(미리보기)
     */
    public record TemplateMeta(String templateId, String name, String status, String content) {
    }

    /**
     * 응답 래퍼.
     *
     * @param success      성공 여부
     * @param statusCode   HTTP 상태 코드
     * @param templates    템플릿 목록(실패 시 빈 리스트)
     * @param errorCode    에러 코드(성공 시 null)
     * @param errorMessage 에러 메시지(성공 시 null)
     */
    public record Response(boolean success, int statusCode, List<TemplateMeta> templates,
            String errorCode, String errorMessage) {

        /**
         * @param templates 템플릿 목록
         * @return 성공 응답
         */
        public static Response success(List<TemplateMeta> templates) {
            return new Response(true, 200, templates, null, null);
        }

        /**
         * @param statusCode HTTP 상태 코드
         * @param errorCode 에러 코드
         * @param errorMessage 에러 메시지
         * @return 실패 응답
         */
        public static Response failure(int statusCode, String errorCode, String errorMessage) {
            return new Response(false, statusCode, Collections.emptyList(),
                errorCode, errorMessage);
        }
    }
}
