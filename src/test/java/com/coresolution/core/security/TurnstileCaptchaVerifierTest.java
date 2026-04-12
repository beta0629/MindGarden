package com.coresolution.core.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.core.constant.TestDocumentationIps;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

/**
 * {@link TurnstileCaptchaVerifier} HTTP 호출·응답 파싱 검증 (RestTemplate 목).
 *
 * @author CoreSolution
 * @since 2026-04-11
 */
@ExtendWith(MockitoExtension.class)
class TurnstileCaptchaVerifierTest {

    private static final String CUSTOM_VERIFY = "http://127.0.0.1:9/turnstile/v0/siteverify";

    @Mock
    private RestTemplate restTemplate;

    private TurnstileCaptchaVerifier verifier;

    @BeforeEach
    void setUp() {
        verifier = new TurnstileCaptchaVerifier(restTemplate, "test-secret", CUSTOM_VERIFY);
    }

    @Test
    void requiresCaptchaTokenIsTrue() {
        assertThat(verifier.requiresCaptchaToken()).isTrue();
    }

    @Test
    void verifyReturnsTrueWhenSiteverifySuccess() {
        when(restTemplate.postForEntity(eq(CUSTOM_VERIFY), any(HttpEntity.class), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("success", true)));

        assertThat(verifier.verify("token-from-client", TestDocumentationIps.DOC_NET_3_EXAMPLE)).isTrue();

        verify(restTemplate).postForEntity(eq(CUSTOM_VERIFY), any(HttpEntity.class), eq(Map.class));
    }

    @Test
    void verifyReturnsFalseWhenTokenBlank() {
        assertThat(verifier.verify("", null)).isFalse();
        assertThat(verifier.verify("  ", null)).isFalse();
    }

    @Test
    void verifyReturnsFalseWhenSuccessFalse() {
        when(restTemplate.postForEntity(eq(CUSTOM_VERIFY), any(HttpEntity.class), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(Map.of("success", false)));

        assertThat(verifier.verify("bad-token", null)).isFalse();
    }
}
