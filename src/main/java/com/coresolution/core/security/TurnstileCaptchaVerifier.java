package com.coresolution.core.security;

import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

/**
 * Cloudflare Turnstile siteverify 호출 스켈레톤.
 * <p>
 * 공식 siteverify 엔드포인트는 Cloudflare 고정 URL이며, 테스트에서는 생성자로 URI를 바꿀 수 있다.
 * </p>
 *
 * @author CoreSolution
 * @since 2026-04-11
 */
@Slf4j
public final class TurnstileCaptchaVerifier implements CaptchaVerifier {

    /**
     * Cloudflare Turnstile 공식 검증 URL (서비스 제공자 고정 엔드포인트).
     */
    public static final String DEFAULT_TURNSTILE_SITE_VERIFY_URI =
        "https://challenges.cloudflare.com/turnstile/v0/siteverify";

    private final RestTemplate restTemplate;
    private final String secretKey;
    private final String siteVerifyUri;

    /**
     * 운영 기본 siteverify URI를 사용한다.
     *
     * @param restTemplate HTTP 클라이언트
     * @param secretKey Turnstile 시크릿 키
     */
    public TurnstileCaptchaVerifier(RestTemplate restTemplate, String secretKey) {
        this(restTemplate, secretKey, DEFAULT_TURNSTILE_SITE_VERIFY_URI);
    }

    /**
     * 테스트 또는 커스텀 엔드포인트용.
     *
     * @param restTemplate HTTP 클라이언트
     * @param secretKey Turnstile 시크릿 키
     * @param siteVerifyUri siteverify 전체 URL
     */
    public TurnstileCaptchaVerifier(RestTemplate restTemplate, String secretKey, String siteVerifyUri) {
        this.restTemplate = restTemplate;
        this.secretKey = secretKey;
        this.siteVerifyUri = siteVerifyUri;
    }

    @Override
    public boolean requiresCaptchaToken() {
        return true;
    }

    @Override
    public boolean verify(String token, String remoteIp) {
        if (!StringUtils.hasText(token)) {
            return false;
        }
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("secret", secretKey);
        form.add("response", token.trim());
        if (StringUtils.hasText(remoteIp)) {
            form.add("remoteip", remoteIp.trim());
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(form, headers);
        try {
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(siteVerifyUri, entity, Map.class);
            return isSuccessBody(response.getBody());
        } catch (RestClientException ex) {
            log.warn("Turnstile siteverify request failed: {}", ex.getMessage());
            return false;
        }
    }

    private static boolean isSuccessBody(Map<?, ?> body) {
        if (body == null || body.isEmpty()) {
            return false;
        }
        Object success = body.get("success");
        return Boolean.TRUE.equals(success);
    }
}
