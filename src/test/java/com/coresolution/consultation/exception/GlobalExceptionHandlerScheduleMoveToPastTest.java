package com.coresolution.consultation.exception;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.util.ScheduleMoveTargetGate;
import com.coresolution.core.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * {@link GlobalExceptionHandler#handleScheduleMoveToPast} — 과거 시각 이동 요청 400 매핑.
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@DisplayName("GlobalExceptionHandler — ScheduleMoveToPast 400 매핑")
class GlobalExceptionHandlerScheduleMoveToPastTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("HTTP 400 + errorCode=SCHEDULE_MOVE_TO_PAST + 안내 문구")
    void mapsToBadRequestWithErrorCode() {
        HttpServletRequest request = Mockito.mock(HttpServletRequest.class);
        Mockito.when(request.getRequestURI()).thenReturn("/api/v1/schedules/1");
        Mockito.when(request.getMethod()).thenReturn("PUT");

        ResponseEntity<ErrorResponse> response =
                handler.handleScheduleMoveToPast(new ScheduleMoveToPastException(1L), request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getErrorCode()).isEqualTo(ScheduleMoveTargetGate.MOVE_TO_PAST_ERROR_CODE);
        assertThat(response.getBody().getMessage()).isEqualTo(ScheduleMoveTargetGate.MOVE_TO_PAST_MESSAGE);
        assertThat(response.getBody().getStatus()).isEqualTo(400);
    }
}
