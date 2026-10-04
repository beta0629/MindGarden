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
 * {@link GlobalExceptionHandler#handleConsultationRecordDuplicate} — 일정당 일지 1건 409 매핑.
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("GlobalExceptionHandler — ConsultationRecordDuplicate 409 매핑")
class GlobalExceptionHandlerConsultationRecordDuplicateTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("HTTP 409 + code=CONSULTATION_RECORD_DUPLICATE + 기존 일지 ID (본문 필드 없음)")
    void mapsToConflictWithExistingRecordId() {
        ConsultationRecordDuplicateException ex =
                new ConsultationRecordDuplicateException(461L, 9001L, "이미 상담일지가 있습니다.");
        HttpServletRequest request = Mockito.mock(HttpServletRequest.class);
        Mockito.when(request.getRequestURI()).thenReturn("/api/v1/schedules/consultation-records");
        Mockito.when(request.getMethod()).thenReturn("POST");

        ResponseEntity<Map<String, Object>> response = handler.handleConsultationRecordDuplicate(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        Map<String, Object> body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.get("success")).isEqualTo(false);
        assertThat(body.get("errorCode")).isEqualTo("CONSULTATION_RECORD_DUPLICATE");
        assertThat(body.get("status")).isEqualTo(409);
        assertThat(body.get("existingRecordId")).isEqualTo(9001L);
        assertThat(body).doesNotContainKeys("clientCondition", "mainIssues", "record");
    }
}
