package com.coresolution.consultation.exception;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.constant.ApiRequestErrorMessages;
import com.coresolution.core.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.mock.http.MockHttpInputMessage;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/**
 * {@link GlobalExceptionHandler} — 요청 파싱·파라미터 오류 → 400 고정 문구.
 *
 * @author MindGarden
 * @since 2026-09-25
 */
@DisplayName("GlobalExceptionHandler — request parse 400")
class GlobalExceptionHandlerRequestParseTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("HttpMessageNotReadableException — 400 · 고정 문구 · 파서 상세 미노출")
    void httpMessageNotReadable_returnsFixedMessage() {
        String jacksonLeak = "JSON parse error: Unexpected character ('x')";
        HttpMessageNotReadableException ex = new HttpMessageNotReadableException(
                jacksonLeak,
                new MockHttpInputMessage(new byte[0]));
        HttpServletRequest request = mockRequest("POST", "/api/v1/tenants/t1/pg-configurations");

        ResponseEntity<ErrorResponse> response = handler.handleHttpMessageNotReadable(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        ErrorResponse body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.getMessage()).isEqualTo(ApiRequestErrorMessages.INVALID_REQUEST_BODY);
        assertThat(body.getMessage()).doesNotContain("Unexpected");
        assertThat(body.getMessage()).doesNotContain("JSON parse");
        assertThat(body.getErrorCode()).isEqualTo(ApiRequestErrorMessages.CODE_INVALID_REQUEST_BODY);
    }

    @Test
    @DisplayName("HttpMediaTypeNotSupportedException — 400 · 고정 문구")
    void httpMediaTypeNotSupported_returnsFixedMessage() {
        HttpMediaTypeNotSupportedException ex =
                new HttpMediaTypeNotSupportedException(MediaType.TEXT_PLAIN, java.util.List.of(MediaType.APPLICATION_JSON));
        HttpServletRequest request = mockRequest("POST", "/api/v1/tenants/t1/pg-configurations");

        ResponseEntity<ErrorResponse> response = handler.handleHttpMediaTypeNotSupported(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo(ApiRequestErrorMessages.UNSUPPORTED_MEDIA_TYPE);
        assertThat(response.getBody().getErrorCode())
                .isEqualTo(ApiRequestErrorMessages.CODE_UNSUPPORTED_MEDIA_TYPE);
    }

    @Test
    @DisplayName("MissingServletRequestParameterException — 400 · 고정 문구")
    void missingServletRequestParameter_returnsFixedMessage() {
        MissingServletRequestParameterException ex =
                new MissingServletRequestParameterException("tenantId", "String");
        HttpServletRequest request = mockRequest("GET", "/api/v1/admin/shop/orders");

        ResponseEntity<ErrorResponse> response = handler.handleMissingServletRequestParameter(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo(ApiRequestErrorMessages.MISSING_REQUEST_PARAMETER);
        assertThat(response.getBody().getMessage()).doesNotContain("tenantId");
    }

    @Test
    @DisplayName("MethodArgumentTypeMismatchException — 400 · 고정 문구")
    void methodArgumentTypeMismatch_returnsFixedMessage() {
        MethodArgumentTypeMismatchException ex = new MethodArgumentTypeMismatchException(
                "abc", Integer.class, "page", null, new NumberFormatException("abc"));
        HttpServletRequest request = mockRequest("GET", "/api/v1/admin/shop/orders");

        ResponseEntity<ErrorResponse> response = handler.handleMethodArgumentTypeMismatch(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo(ApiRequestErrorMessages.INVALID_PARAMETER_TYPE);
        assertThat(response.getBody().getMessage()).doesNotContain("NumberFormat");
    }

    @Test
    @DisplayName("RuntimeException — 500 유지 (회귀)")
    void runtimeException_stillReturns500() {
        RuntimeException ex = new RuntimeException("내부 처리 오류");
        HttpServletRequest request = mockRequest("GET", "/api/v1/admin/shop/orders");

        ResponseEntity<ErrorResponse> response = handler.handleRuntime(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getErrorCode()).isEqualTo("RUNTIME_ERROR");
    }

    private static HttpServletRequest mockRequest(String method, String uri) {
        HttpServletRequest request = Mockito.mock(HttpServletRequest.class);
        Mockito.when(request.getRequestURI()).thenReturn(uri);
        Mockito.when(request.getMethod()).thenReturn(method);
        return request;
    }
}
