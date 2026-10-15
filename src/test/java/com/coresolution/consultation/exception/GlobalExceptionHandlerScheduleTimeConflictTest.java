package com.coresolution.consultation.exception;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.constant.ScheduleServiceUserFacingMessages;
import com.coresolution.core.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.method.annotation.ExceptionHandlerMethodResolver;

/**
 * {@link GlobalExceptionHandler#handleScheduleTimeConflict} — 시간 겹침 409 매핑.
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@DisplayName("GlobalExceptionHandler — ScheduleTimeConflict 409 매핑")
class GlobalExceptionHandlerScheduleTimeConflictTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("HTTP 409 + errorCode=SCHEDULE_TIME_CONFLICT + 겹침 사유")
    void mapsToConflictWithReason() {
        HttpServletRequest request = Mockito.mock(HttpServletRequest.class);
        Mockito.when(request.getRequestURI()).thenReturn("/api/v1/schedules/consultant");
        Mockito.when(request.getMethod()).thenReturn("POST");

        ScheduleTimeConflictException ex = new ScheduleTimeConflictException(
                ScheduleServiceUserFacingMessages.MSG_TIME_SLOT_ALREADY_OCCUPIED);

        ResponseEntity<ErrorResponse> response = handler.handleScheduleTimeConflict(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo(409);
        assertThat(response.getBody().getErrorCode()).isEqualTo(ScheduleTimeConflictException.ERROR_CODE);
        assertThat(response.getBody().getMessage())
                .isEqualTo(ScheduleServiceUserFacingMessages.MSG_TIME_SLOT_ALREADY_OCCUPIED);
        assertThat(response.getBody().isSuccess()).isFalse();
    }

    @Test
    @DisplayName("IllegalStateException 400 핸들러가 시간 겹침 409 를 가로채지 않는다")
    void resolverPrefersConflictHandlerOverIllegalState() {
        ExceptionHandlerMethodResolver resolver = new ExceptionHandlerMethodResolver(GlobalExceptionHandler.class);

        assertThat(resolver.resolveMethod(new ScheduleTimeConflictException(
                ScheduleServiceUserFacingMessages.MSG_TIME_SLOT_ALREADY_OCCUPIED)).getName())
                .isEqualTo("handleScheduleTimeConflict");
    }
}
