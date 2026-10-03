package com.coresolution.consultation.exception;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;

import com.coresolution.consultation.constant.ApiRequestErrorMessages;
import com.coresolution.consultation.util.ServerErrorResponses;
import com.coresolution.core.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.core.convert.ConversionFailedException;
import org.springframework.core.convert.TypeDescriptor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.method.annotation.ExceptionHandlerMethodResolver;

/**
 * 잘못된 입력(날짜 형식·타입 변환·바인딩)은 500 이 아니라 400 + 사용자용 한글 문구여야 한다.
 *
 * <p>기존에 의도된 400 문구(파라미터 누락·타입 불일치)는 바뀌지 않는다.</p>
 *
 * @author MindGarden
 * @since 2026-10-04
 */
@DisplayName("GlobalExceptionHandler — 잘못된 입력 400 매핑")
class GlobalExceptionHandlerBadInputTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("DateTimeParseException → 400 · 날짜 안내 문구 · 입력 원문 미노출")
    void dateTimeParse_returns400() {
        DateTimeParseException ex = new DateTimeParseException("Text 'bad' could not be parsed", "bad", 0);

        ResponseEntity<ErrorResponse> response = handler.handleDateTimeParse(ex, mockRequest());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        ErrorResponse body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.getMessage()).isEqualTo(ApiRequestErrorMessages.INVALID_DATE_FORMAT);
        assertThat(body.getErrorCode()).isEqualTo(ApiRequestErrorMessages.CODE_INVALID_DATE_FORMAT);
        assertThat(body.getTraceId()).isNull();
        assertThat(body.getMessage()).doesNotContain("could not be parsed").doesNotContain("Text");
    }

    @Test
    @DisplayName("날짜 파라미터 타입 불일치 → 400 · 날짜 안내 문구")
    void typeMismatchOnDate_returnsDateMessage() {
        MethodArgumentTypeMismatchException ex = new MethodArgumentTypeMismatchException(
                "bad", LocalDate.class, "startDate", null,
                new DateTimeParseException("Text 'bad' could not be parsed", "bad", 0));

        ResponseEntity<ErrorResponse> response = handler.handleMethodArgumentTypeMismatch(ex, mockRequest());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().getMessage()).isEqualTo(ApiRequestErrorMessages.INVALID_DATE_FORMAT);
        assertThat(response.getBody().getErrorCode()).isEqualTo(ApiRequestErrorMessages.CODE_INVALID_DATE_FORMAT);
    }

    @Test
    @DisplayName("회귀: 날짜가 아닌 타입 불일치는 기존 문구 유지")
    void typeMismatchOnNumber_keepsExistingMessage() {
        MethodArgumentTypeMismatchException ex = new MethodArgumentTypeMismatchException(
                "abc", Integer.class, "page", null, new NumberFormatException("abc"));

        ResponseEntity<ErrorResponse> response = handler.handleMethodArgumentTypeMismatch(ex, mockRequest());

        assertThat(response.getBody().getMessage()).isEqualTo(ApiRequestErrorMessages.INVALID_PARAMETER_TYPE);
        assertThat(response.getBody().getErrorCode()).isEqualTo(ApiRequestErrorMessages.CODE_INVALID_PARAMETER_TYPE);
    }

    @Test
    @DisplayName("ConversionFailedException(날짜) → 400 · 날짜 안내 문구 · 변환기 원문 미노출")
    void conversionFailedOnDate_returns400() {
        ConversionFailedException ex = new ConversionFailedException(
                TypeDescriptor.valueOf(String.class), TypeDescriptor.valueOf(LocalDate.class), "bad",
                new DateTimeParseException("Text 'bad' could not be parsed", "bad", 0));

        ResponseEntity<ErrorResponse> response = handler.handleConversionFailed(ex, mockRequest());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().getMessage()).isEqualTo(ApiRequestErrorMessages.INVALID_DATE_FORMAT);
        assertThat(response.getBody().getMessage()).doesNotContain("LocalDate").doesNotContain("Exception");
    }

    @Test
    @DisplayName("ConversionFailedException(숫자) → 400 · 값 형식 안내 문구")
    void conversionFailedOnNumber_returns400() {
        ConversionFailedException ex = new ConversionFailedException(
                TypeDescriptor.valueOf(String.class), TypeDescriptor.valueOf(Integer.class), "abc",
                new NumberFormatException("abc"));

        ResponseEntity<ErrorResponse> response = handler.handleConversionFailed(ex, mockRequest());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().getMessage()).isEqualTo(ApiRequestErrorMessages.INVALID_PARAMETER_VALUE);
        assertThat(response.getBody().getErrorCode()).isEqualTo(ApiRequestErrorMessages.CODE_INVALID_PARAMETER_VALUE);
    }

    @Test
    @DisplayName("BindException → 400 · 공통 문구 + field: message 상세 · 예외 원문 미노출")
    void bindException_returns400() {
        BeanPropertyBindingResult binding = new BeanPropertyBindingResult(new Object(), "query");
        binding.rejectValue(null, "invalid", "조회 기간이 올바르지 않습니다.");
        BindException ex = new BindException(binding);

        ResponseEntity<ErrorResponse> response = handler.handleBind(ex, mockRequest());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().getMessage()).isEqualTo(ApiRequestErrorMessages.INVALID_REQUEST_BINDING);
        assertThat(response.getBody().getErrorCode()).isEqualTo(ApiRequestErrorMessages.CODE_INVALID_REQUEST_BINDING);
        assertThat(response.getBody().getTraceId()).isNull();
    }

    @Test
    @DisplayName("ServerErrorResponses 는 날짜 파싱 오류를 500 으로 덮지 않고 다시 던진다")
    void serverErrorResponses_rethrowsDateTimeParse() {
        DateTimeParseException ex = new DateTimeParseException("Text 'bad' could not be parsed", "bad", 0);

        assertThat(ServerErrorResponses.isMappedBusinessException(ex)).isTrue();
        org.assertj.core.api.Assertions
                .assertThatThrownBy(() -> ServerErrorResponses.internalError("재무 대시보드 조회", ex))
                .isSameAs(ex);
    }

    @Test
    @DisplayName("회귀: BindException 핸들러가 MethodArgumentNotValidException 을 가로채지 않는다")
    void beanValidation_stillResolvesToItsOwnHandler() {
        ExceptionHandlerMethodResolver resolver = new ExceptionHandlerMethodResolver(GlobalExceptionHandler.class);

        assertThat(resolver.resolveMethod(
                new MethodArgumentNotValidException(null, new BeanPropertyBindingResult(new Object(), "req")))
                .getName()).isEqualTo("handleMethodArgumentNotValid");
        assertThat(resolver.resolveMethod(new BindException(new BeanPropertyBindingResult(new Object(), "req")))
                .getName()).isEqualTo("handleBind");
    }

    @Test
    @DisplayName("회귀: 그 외 런타임 예외는 여전히 500")
    void otherRuntime_stillReturns500() {
        ResponseEntity<ErrorResponse> response =
                handler.handleRuntime(new RuntimeException("내부 오류"), mockRequest());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody().getTraceId()).isNotBlank();
    }

    private static HttpServletRequest mockRequest() {
        HttpServletRequest request = Mockito.mock(HttpServletRequest.class);
        Mockito.when(request.getRequestURI()).thenReturn("/api/v1/erp/finance/dashboard");
        Mockito.when(request.getMethod()).thenReturn("GET");
        return request;
    }
}
