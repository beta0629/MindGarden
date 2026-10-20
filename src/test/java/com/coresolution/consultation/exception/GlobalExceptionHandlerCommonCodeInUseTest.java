package com.coresolution.consultation.exception;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ConsultationPackageCodeConstants;
import com.coresolution.core.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * 공통코드 삭제 가드 예외가 어느 컨트롤러에서 나오든 409 + 서버 문구로 응답하는지 검증.
 */
class GlobalExceptionHandlerCommonCodeInUseTest {

    @Test
    @DisplayName("CommonCodeInUseException → 409, 서버 문구 그대로")
    void mapsToConflictWithServerMessage() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/v1/common-codes/1");
        when(request.getMethod()).thenReturn("DELETE");
        ResponseEntity<ErrorResponse> response = new GlobalExceptionHandler().handleCommonCodeInUse(
                new CommonCodeInUseException(ConsultationPackageCodeConstants.MSG_DELETE_BLOCKED_BY_ORDERS), request);
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals(ConsultationPackageCodeConstants.MSG_DELETE_BLOCKED_BY_ORDERS, response.getBody().getMessage());
    }
}
