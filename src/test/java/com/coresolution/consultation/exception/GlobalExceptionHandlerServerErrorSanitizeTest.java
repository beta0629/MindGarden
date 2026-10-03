package com.coresolution.consultation.exception;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.sql.SQLSyntaxErrorException;
import java.util.List;
import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.coresolution.consultation.constant.ServerErrorMessages;
import com.coresolution.core.dto.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.TransactionSystemException;

/**
 * {@link GlobalExceptionHandler} — 5xx 응답에 예외 원문(SQL·클래스명)이 실리지 않고,
 * 공통 한글 문구 + traceId 로 응답하며 원문은 같은 traceId 로 로그에 남는지 확인한다.
 * 4xx 비즈니스 문구는 그대로 유지된다.
 *
 * @author MindGarden
 * @since 2026-10-03
 */
@DisplayName("GlobalExceptionHandler — 5xx 응답 문구 정리")
class GlobalExceptionHandlerServerErrorSanitizeTest {

    private static final String SQL_LEAK =
            "could not execute statement; SQL [insert into financial_transactions (amount) values (?)]";
    private static final String CLASS_LEAK = "java.sql.SQLSyntaxErrorException";

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();
    private Logger handlerLogger;
    private ListAppender<ILoggingEvent> appender;

    @BeforeEach
    void attachAppender() {
        handlerLogger = (Logger) LoggerFactory.getLogger(GlobalExceptionHandler.class);
        appender = new ListAppender<>();
        appender.start();
        handlerLogger.addAppender(appender);
    }

    @AfterEach
    void detachAppender() {
        handlerLogger.detachAppender(appender);
    }

    @Test
    @DisplayName("RuntimeException(SQL 원문) → 500 · 공통 문구 · traceId · 원문은 로그에만")
    void runtimeWithSql_returnsGenericMessageAndLogsDetail() {
        RuntimeException ex = new RuntimeException(SQL_LEAK, new SQLSyntaxErrorException("Unknown column 'x'"));

        ResponseEntity<ErrorResponse> response = handler.handleRuntime(ex, mockRequest());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        ErrorResponse body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.isSuccess()).isFalse();
        assertThat(body.getMessage()).isEqualTo(ServerErrorMessages.INTERNAL_SERVER_ERROR);
        assertThat(body.getErrorCode()).isEqualTo("RUNTIME_ERROR");
        assertThat(body.getTraceId()).isNotBlank();
        assertNoLeak(body);

        ILoggingEvent event = singleErrorEvent();
        assertThat(event.getFormattedMessage()).contains(body.getTraceId()).contains(SQL_LEAK);
        assertThat(event.getThrowableProxy()).isNotNull();
        assertThat(event.getThrowableProxy().getMessage()).isEqualTo(SQL_LEAK);
    }

    @Test
    @DisplayName("반례: 한글 접두사 + 기술 원문을 이어 붙인 RuntimeException 도 공통 문구")
    void runtimeWithKoreanPrefixAndSql_returnsGenericMessage() {
        RuntimeException ex = new RuntimeException("급여 계산 실패: " + SQL_LEAK + " " + CLASS_LEAK);

        ResponseEntity<ErrorResponse> response = handler.handleRuntime(ex, mockRequest());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody().getMessage()).isEqualTo(ServerErrorMessages.INTERNAL_SERVER_ERROR);
        assertNoLeak(response.getBody());
    }

    @Test
    @DisplayName("반례: 메시지 없는 RuntimeException(NPE) → 500 · INTERNAL_SERVER_ERROR 코드 · 공통 문구")
    void runtimeWithoutMessage_returnsGenericMessage() {
        ResponseEntity<ErrorResponse> response = handler.handleRuntime(new NullPointerException(), mockRequest());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody().getErrorCode()).isEqualTo("INTERNAL_SERVER_ERROR");
        assertThat(response.getBody().getMessage()).isEqualTo(ServerErrorMessages.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody().getMessage()).doesNotContain("NullPointerException");
        assertThat(response.getBody().getTraceId()).isNotBlank();
    }

    @Test
    @DisplayName("checked Exception(클래스명 원문) → 500 · UNEXPECTED_ERROR · 공통 문구 · 로그 기록")
    void genericException_returnsGenericMessage() {
        Exception ex = new IOException("com.coresolution.consultation.service.impl.FooServiceImpl failed: " + SQL_LEAK);

        ResponseEntity<ErrorResponse> response = handler.handleGeneric(ex, mockRequest());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody().getErrorCode()).isEqualTo("UNEXPECTED_ERROR");
        assertThat(response.getBody().getMessage()).isEqualTo(ServerErrorMessages.INTERNAL_SERVER_ERROR);
        assertNoLeak(response.getBody());
        assertThat(response.getBody().getMessage()).doesNotContain("FooServiceImpl");
        assertThat(singleErrorEvent().getFormattedMessage()).contains(response.getBody().getTraceId());
    }

    @Test
    @DisplayName("TransactionSystemException(제약 위반 아님) → 500 · 공통 문구")
    void transactionSystemNonConstraint_returnsGenericMessage() {
        TransactionSystemException ex = new TransactionSystemException(SQL_LEAK);

        ResponseEntity<ErrorResponse> response = handler.handleTransactionSystemException(ex, mockRequest());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody().getErrorCode()).isEqualTo("TRANSACTION_SYSTEM_ERROR");
        assertThat(response.getBody().getMessage()).isEqualTo(ServerErrorMessages.INTERNAL_SERVER_ERROR);
        assertNoLeak(response.getBody());
    }

    @Test
    @DisplayName("ProcedureExecutionException → 500 · 정해진 한글 문구 유지 · traceId 추가")
    void procedureExecution_keepsCuratedMessage() {
        ProcedureExecutionException ex = new ProcedureExecutionException(
                "GetConsolidatedFinancialData", "재무 현황을 불러오지 못했습니다.", SQL_LEAK, null);

        ResponseEntity<ErrorResponse> response = handler.handleProcedureExecution(ex, mockRequest());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody().getMessage()).isEqualTo("재무 현황을 불러오지 못했습니다.");
        assertThat(response.getBody().getTraceId()).isNotBlank();
        assertNoLeak(response.getBody());
    }

    @Test
    @DisplayName("IllegalArgumentException → 400 · 비즈니스 문구 그대로 · traceId 없음")
    void illegalArgument_keepsBusinessMessage() {
        String businessMessage = "상담 시작 시간이 종료 시간보다 늦습니다.";

        ResponseEntity<ErrorResponse> response =
                handler.handleIllegalArgument(new IllegalArgumentException(businessMessage), mockRequest());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().getMessage()).isEqualTo(businessMessage);
        assertThat(response.getBody().getTraceId()).isNull();
    }

    @Test
    @DisplayName("IllegalStateException → 400 · 비즈니스 문구 그대로")
    void illegalState_keepsBusinessMessage() {
        String businessMessage = "이미 확정된 급여는 다시 계산할 수 없습니다.";

        ResponseEntity<ErrorResponse> response =
                handler.handleIllegalState(new IllegalStateException(businessMessage), mockRequest());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().getMessage()).isEqualTo(businessMessage);
    }

    @Test
    @DisplayName("AdminDeleteBlockedException → 409 · 비즈니스 문구 그대로")
    void adminDeleteBlocked_keeps409Message() {
        String businessMessage = "진행 중인 회기가 있어 삭제할 수 없습니다.";
        AdminDeleteBlockedException ex = new AdminDeleteBlockedException("ACTIVE_SESSIONS", businessMessage);

        ResponseEntity<java.util.Map<String, Object>> response = handler.handleAdminDeleteBlocked(ex, mockRequest());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).containsEntry("message", businessMessage);
    }

    @Test
    @DisplayName("직렬화: 4xx 응답 JSON 에는 traceId 키가 없고, 5xx 에는 있다 (기존 응답 형태 유지)")
    void traceIdSerializedOnlyFor5xx() throws Exception {
        ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());

        String badRequestJson = mapper.writeValueAsString(
                handler.handleIllegalArgument(new IllegalArgumentException("잘못된 요청"), mockRequest()).getBody());
        String serverErrorJson = mapper.writeValueAsString(
                handler.handleRuntime(new RuntimeException(SQL_LEAK), mockRequest()).getBody());

        assertThat(badRequestJson).doesNotContain("traceId");
        assertThat(serverErrorJson).contains("\"traceId\"").contains("\"success\":false")
                .contains("\"message\"").contains("\"errorCode\"").doesNotContain("insert into");
    }

    private void assertNoLeak(ErrorResponse body) {
        assertThat(body.getMessage()).doesNotContain("SQL").doesNotContain("insert into")
                .doesNotContain("java.").doesNotContain("Exception");
        assertThat(body.getDetails()).isNull();
        assertThat(body.getStackTrace()).isNull();
    }

    private ILoggingEvent singleErrorEvent() {
        List<ILoggingEvent> errors = appender.list.stream()
                .filter(event -> event.getLevel() == Level.ERROR)
                .toList();
        assertThat(errors).hasSize(1);
        return errors.get(0);
    }

    private static HttpServletRequest mockRequest() {
        HttpServletRequest request = Mockito.mock(HttpServletRequest.class);
        Mockito.when(request.getRequestURI()).thenReturn("/api/v1/admin/salary/config");
        Mockito.when(request.getMethod()).thenReturn("GET");
        return request;
    }
}
