package com.coresolution.consultation.exception;

import com.coresolution.consultation.constant.ScheduleServiceUserFacingMessages;
import com.coresolution.core.dto.ErrorResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 없는 일정 id 확정이 {@link EntityNotFoundException} 으로 404 ErrorResponse 가 되는지 확인한다.
 */
class GlobalExceptionHandlerScheduleNotFoundTest {

    @Test
    @DisplayName("일정 없음 EntityNotFoundException 은 404와 공통 문구")
    void missingSchedule_isNotFound() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/admin/mappings/1/checkout-same-day");

        ResponseEntity<ErrorResponse> response = handler.handleEntityNotFound(
                new EntityNotFoundException(ScheduleServiceUserFacingMessages.MSG_SCHEDULE_NOT_FOUND),
                request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage())
                .isEqualTo(ScheduleServiceUserFacingMessages.MSG_SCHEDULE_NOT_FOUND);
        assertThat(response.getBody().getErrorCode()).isEqualTo("ENTITY_NOT_FOUND");
        assertThat(response.getBody().getStatus()).isEqualTo(HttpStatus.NOT_FOUND.value());
    }
}
