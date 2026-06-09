package com.coresolution.consultation.exception;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * {@link GlobalExceptionHandler#handleNoActiveConsultantMapping} 단위 테스트.
 *
 * <p>HTTP 400 + JSON 본문 {@code { success:false, code, message, errorCode, status }} 매핑 검증.</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
@DisplayName("GlobalExceptionHandler — NoActiveConsultantMapping 매핑")
class GlobalExceptionHandlerNoActiveConsultantMappingTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("HTTP 400 + code=NO_ACTIVE_CONSULTANT_MAPPING + 사용자 메시지")
    void mapsToBadRequestWithBusinessCode() {
        NoActiveConsultantMappingException ex = new NoActiveConsultantMappingException(
            "매칭된 담당 상담사가 없습니다. 먼저 상담을 신청해 주세요.");
        HttpServletRequest request = Mockito.mock(HttpServletRequest.class);
        Mockito.when(request.getRequestURI()).thenReturn("/api/v1/mind-weather/123/share");
        Mockito.when(request.getMethod()).thenReturn("POST");

        ResponseEntity<Map<String, Object>> response = handler.handleNoActiveConsultantMapping(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        Map<String, Object> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.get("success")).isEqualTo(false);
        assertThat(body.get("code")).isEqualTo("NO_ACTIVE_CONSULTANT_MAPPING");
        assertThat(body.get("errorCode")).isEqualTo("NO_ACTIVE_CONSULTANT_MAPPING");
        assertThat(body.get("status")).isEqualTo(400);
        assertThat(body.get("message")).asString().contains("매칭된 담당 상담사가 없습니다");
        assertThat(body.get("path")).isEqualTo("/api/v1/mind-weather/123/share");
        assertThat(body.get("method")).isEqualTo("POST");
    }

    @Test
    @DisplayName("메시지 누락 시 폴백 메시지 사용")
    void fallbackMessageWhenNullMessage() {
        NoActiveConsultantMappingException ex = new NoActiveConsultantMappingException(null);
        HttpServletRequest request = Mockito.mock(HttpServletRequest.class);
        Mockito.when(request.getRequestURI()).thenReturn("/api/v1/mood-journal/2026-06-09");
        Mockito.when(request.getMethod()).thenReturn("PUT");

        ResponseEntity<Map<String, Object>> response = handler.handleNoActiveConsultantMapping(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("message"))
            .asString()
            .contains("매칭된 담당 상담사가 없습니다");
    }
}
