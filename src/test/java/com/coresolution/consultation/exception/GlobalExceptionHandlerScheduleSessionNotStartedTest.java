package com.coresolution.consultation.exception;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.util.ScheduleSessionStartGate;
import com.coresolution.core.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * {@link GlobalExceptionHandler#handleScheduleSessionNotStarted} — 시작 전 완료 요청 400 매핑.
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("GlobalExceptionHandler — ScheduleSessionNotStarted 400 매핑")
class GlobalExceptionHandlerScheduleSessionNotStartedTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("HTTP 400 + errorCode=SCHEDULE_SESSION_NOT_STARTED + 안내 문구")
    void mapsToBadRequestWithErrorCode() {
        HttpServletRequest request = Mockito.mock(HttpServletRequest.class);
        Mockito.when(request.getRequestURI()).thenReturn("/api/v1/schedules/1");
        Mockito.when(request.getMethod()).thenReturn("PUT");

        ResponseEntity<ErrorResponse> response =
                handler.handleScheduleSessionNotStarted(new ScheduleSessionNotStartedException(1L), request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getErrorCode())
                .isEqualTo(ScheduleSessionStartGate.COMPLETION_BEFORE_START_ERROR_CODE);
        assertThat(response.getBody().getMessage())
                .isEqualTo(ScheduleSessionStartGate.COMPLETION_BEFORE_START_MESSAGE);
        assertThat(response.getBody().getStatus()).isEqualTo(400);
    }
}
