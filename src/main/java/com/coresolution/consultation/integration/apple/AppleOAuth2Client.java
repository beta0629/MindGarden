package com.coresolution.consultation.integration.apple;

import java.util.Map;
import com.coresolution.consultation.config.AppleOAuth2Properties;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;
import lombok.extern.slf4j.Slf4j;

/**
 * Apple `/auth/token` endpoint 클라이언트.
 *
 * <p>웹 콜백(authorization_code) / 토큰 검증 흐름에서 사용. Native iOS (Expo)
 * 는 identityToken 만으로 검증이 가능하므로 본 클라이언트 호출은 선택 사항이지만,
 * 4.8 가이드라인 응답에서 Apple 이 server-side token validation 을 명시 요구할 때
 * 즉시 활용할 수 있도록 캡슐화한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@Slf4j
@Component
public class AppleOAuth2Client {

    private static final String GRANT_TYPE_AUTHORIZATION_CODE = "authorization_code";
    private static final String GRANT_TYPE_REFRESH_TOKEN = "refresh_token";

    private final RestTemplate restTemplate;
    private final AppleClientSecretGenerator clientSecretGenerator;
    private final AppleOAuth2Properties properties;

    public AppleOAuth2Client(RestTemplate restTemplate,
                             AppleClientSecretGenerator clientSecretGenerator,
                             AppleOAuth2Properties properties) {
        this.restTemplate = restTemplate;
        this.clientSecretGenerator = clientSecretGenerator;
        this.properties = properties;
    }

    /**
     * authorization_code → access_token + refresh_token + id_token 교환.
     *
     * @param authorizationCode Apple 웹 콜백에서 받은 code
     * @return token endpoint 응답 본문 (access_token, refresh_token, id_token, expires_in, token_type 등)
     */
    public Map<String, Object> exchangeAuthorizationCode(String authorizationCode) {
        return exchangeAuthorizationCode(authorizationCode, null);
    }

    /**
     * authorization_code → access_token + refresh_token + id_token 교환 — server-side
     * auth-code 흐름에서 호출자가 동적으로 결정한 {@code redirect_uri} 를 사용한다.
     *
     * <p>멀티테넌트 와일드카드 환경에서 Apple 의 {@code /auth/token} 은 authorize 단계에서
     * 보낸 {@code redirect_uri} 와 정확히 일치해야 하므로(Google PR #204 server-side 패턴
     * 정합), 컨트롤러가 요청의 Host 기반으로 동적으로 생성한 apex 콜백 URL 을 그대로 전달한다.
     * {@code redirectUriOverride} 가 비어 있으면 {@link AppleOAuth2Properties#getRedirectUri()}
     * 설정값으로 폴백한다(기존 호환).</p>
     *
     * @param authorizationCode    Apple 웹 콜백에서 받은 code
     * @param redirectUriOverride  authorize 단계와 동일한 redirect_uri (apex 호스트, 동적 추론).
     *                             {@code null}/blank 시 properties 의 redirect-uri 사용.
     * @return token endpoint 응답 본문 (access_token, refresh_token, id_token, expires_in, token_type 등)
     */
    public Map<String, Object> exchangeAuthorizationCode(String authorizationCode,
            String redirectUriOverride) {
        MultiValueMap<String, String> body = baseBody();
        body.add("grant_type", GRANT_TYPE_AUTHORIZATION_CODE);
        body.add("code", authorizationCode);
        String resolvedRedirectUri = (redirectUriOverride != null && !redirectUriOverride.isBlank())
            ? redirectUriOverride
            : properties.getRedirectUri();
        if (resolvedRedirectUri != null && !resolvedRedirectUri.isBlank()) {
            body.add("redirect_uri", resolvedRedirectUri);
        }
        return post(body);
    }

    /**
     * refresh_token 으로 access_token 갱신.
     */
    public Map<String, Object> refresh(String refreshToken) {
        MultiValueMap<String, String> body = baseBody();
        body.add("grant_type", GRANT_TYPE_REFRESH_TOKEN);
        body.add("refresh_token", refreshToken);
        return post(body);
    }

    private MultiValueMap<String, String> baseBody() {
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("client_id", properties.getClientId());
        body.add("client_secret", clientSecretGenerator.generate());
        return body;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> post(MultiValueMap<String, String> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.setAccept(java.util.Collections.singletonList(MediaType.APPLICATION_JSON));
        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                properties.getTokenUri(),
                HttpMethod.POST,
                request,
                (Class<Map<String, Object>>) (Class<?>) Map.class);
            Map<String, Object> payload = response.getBody();
            if (payload == null) {
                throw new AppleOAuth2ClientException("Apple /auth/token 응답 본문이 비어 있습니다.");
            }
            return payload;
        } catch (RestClientResponseException e) {
            int status = e.getStatusCode().value();
            log.error("Apple /auth/token 응답 실패: status={}, body={}",
                status, e.getResponseBodyAsString());
            throw new AppleOAuth2ClientException(
                "Apple /auth/token HTTP " + status, e);
        } catch (AppleOAuth2ClientException e) {
            throw e;
        } catch (Exception e) {
            throw new AppleOAuth2ClientException("Apple /auth/token 호출 중 오류", e);
        }
    }

    /** Apple `/auth/token` 호출 실패 단일 예외. */
    public static class AppleOAuth2ClientException extends RuntimeException {
        public AppleOAuth2ClientException(String message) {
            super(message);
        }

        public AppleOAuth2ClientException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
