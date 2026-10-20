package com.coresolution.consultation.exception;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.util.ScheduleSlotGuard;
import com.coresolution.core.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * {@link GlobalExceptionHandler#handleSchedulePastTime} — 과거 시각 생성·이동 요청 400 매핑.
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@DisplayName("GlobalExceptionHandler — SchedulePastTime 400 매핑")
class GlobalExceptionHandlerSchedulePastTimeTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("HTTP 400 + 사유별 errorCode·안내 문구")
    void mapsToBadRequestWithErrorCode() {
        HttpServletRequest request = Mockito.mock(HttpServletRequest.class);
        Mockito.when(request.getRequestURI()).thenReturn("/api/v1/schedules/1");
        Mockito.when(request.getMethod()).thenReturn("PUT");

        for (ScheduleSlotGuard.Denial denial : ScheduleSlotGuard.Denial.values()) {
            ResponseEntity<ErrorResponse> response =
                    handler.handleSchedulePastTime(new SchedulePastTimeException(1L, denial), request);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getErrorCode()).isEqualTo(denial.getErrorCode());
            assertThat(response.getBody().getMessage()).isEqualTo(denial.getMessage());
            assertThat(response.getBody().getStatus()).isEqualTo(400);
        }
    }
}
