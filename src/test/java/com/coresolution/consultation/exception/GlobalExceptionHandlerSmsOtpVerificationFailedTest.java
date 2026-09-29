package com.coresolution.consultation.exception;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import com.coresolution.consultation.dto.auth.SmsOtpSendStatus;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * {@link GlobalExceptionHandler#handleSmsOtpVerificationFailed} 단위 테스트.
 *
 * <p>틀림 = 400 + {@code data.remainingAttempts} · 잠김 = 429 + {@code data.locked} ·
 * {@code data.retryAfterSeconds} · Retry-After 헤더.</p>
 *
 * @author MindGarden
 * @since 2026-09-29
 */
@DisplayName("GlobalExceptionHandler — SMS OTP 확인 실패 매핑")
class GlobalExceptionHandlerSmsOtpVerificationFailedTest {

    private static final String PATH = "/api/v1/clients/profile/phone/change";

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();
    private HttpServletRequest request;

    @BeforeEach
    void setUp() {
        request = Mockito.mock(HttpServletRequest.class);
        Mockito.when(request.getRequestURI()).thenReturn(PATH);
        Mockito.when(request.getMethod()).thenReturn("POST");
    }

    @Test
    @DisplayName("오답: 400 + remainingAttempts, retryAfterSeconds 없음")
    void wrongCodeMapsToBadRequestWithRemainingAttempts() {
        SmsOtpVerificationFailedException ex = SmsOtpVerificationFailedException.fromStatus(
                SmsOtpSendStatus.available(300L, 30L, 3));

        ResponseEntity<Map<String, Object>> response = handler.handleSmsOtpVerificationFailed(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getHeaders().getFirst(HttpHeaders.RETRY_AFTER)).isNull();
        Map<String, Object> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.get("success")).isEqualTo(false);
        assertThat(body.get("errorCode")).isEqualTo(SmsOtpVerificationFailedException.ERROR_CODE_INVALID);
        assertThat(body.get("message")).asString().contains("인증 코드");
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) body.get("data");
        assertThat(data).containsEntry("locked", false).containsEntry("remainingAttempts", 3);
        assertThat(data).doesNotContainKey("retryAfterSeconds");
    }

    @Test
    @DisplayName("잠김: 429 + locked · retryAfterSeconds · Retry-After 헤더")
    void lockedMapsToTooManyRequestsWithRetryAfter() {
        SmsOtpVerificationFailedException ex = SmsOtpVerificationFailedException.fromStatus(
                SmsOtpSendStatus.locked(600L, 300L, 30L));

        ResponseEntity<Map<String, Object>> response = handler.handleSmsOtpVerificationFailed(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(response.getHeaders().getFirst(HttpHeaders.RETRY_AFTER)).isEqualTo("600");
        Map<String, Object> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.get("errorCode")).isEqualTo(SmsOtpVerificationFailedException.ERROR_CODE_LOCKED);
        assertThat(body.get("status")).isEqualTo(429);
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) body.get("data");
        assertThat(data)
                .containsEntry("locked", true)
                .containsEntry("remainingAttempts", 0)
                .containsEntry("retryAfterSeconds", 600L);
    }
}
