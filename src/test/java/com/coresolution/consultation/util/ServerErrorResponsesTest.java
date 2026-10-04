package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Map;
import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.coresolution.consultation.constant.ServerErrorMessages;
import com.coresolution.consultation.exception.MappingAlreadyProcessedException;
import com.coresolution.consultation.exception.ValidationException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.dao.InvalidDataAccessResourceUsageException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;

/**
 * {@link ServerErrorResponses} — 컨트롤러 catch 블록 500 응답이 예외 원문을 싣지 않고,
 * 4xx 로 매핑되는 비즈니스 예외는 덮지 않고 다시 던지는지 확인한다.
 *
 * @author MindGarden
 * @since 2026-10-03
 */
@DisplayName("ServerErrorResponses — 컨트롤러 500 응답 정리")
class ServerErrorResponsesTest {

    private static final String SQL_LEAK =
            "PreparedStatementCallback; bad SQL grammar [SELECT * FROM salary_calculations WHERE tenant_id = ?]";

    private Logger helperLogger;
    private ListAppender<ILoggingEvent> appender;

    @BeforeEach
    void attachAppender() {
        helperLogger = (Logger) LoggerFactory.getLogger(ServerErrorResponses.class);
        appender = new ListAppender<>();
        appender.start();
        helperLogger.addAppender(appender);
    }

    @AfterEach
    void detachAppender() {
        helperLogger.detachAppender(appender);
    }

    @Test
    @DisplayName("DB 예외(SQL 원문) → 500 · 공통 문구 · traceId · 원문은 같은 traceId 로 로그")
    void dataAccessFailure_returnsGenericBodyAndLogs() {
        ResponseEntity<Map<String, Object>> response = ServerErrorResponses.internalError(
                "급여 설정 조회 오류", new InvalidDataAccessResourceUsageException(SQL_LEAK));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        Map<String, Object> body = response.getBody();
        assertThat(body).containsEntry("success", false)
                .containsEntry("message", ServerErrorMessages.INTERNAL_SERVER_ERROR)
                .containsEntry("errorCode", ServerErrorMessages.CODE_INTERNAL_SERVER_ERROR)
                .containsKey(ServerErrorResponses.TRACE_ID_KEY);
        assertThat(body.toString()).doesNotContain("SQL").doesNotContain("salary_calculations")
                .doesNotContain("InvalidDataAccess");

        List<ILoggingEvent> errors = appender.list.stream()
                .filter(event -> event.getLevel() == Level.ERROR).toList();
        assertThat(errors).hasSize(1);
        assertThat(errors.get(0).getFormattedMessage())
                .contains((String) body.get(ServerErrorResponses.TRACE_ID_KEY))
                .contains("급여 설정 조회 오류");
        assertThat(errors.get(0).getThrowableProxy().getMessage()).isEqualTo(SQL_LEAK);
    }

    @Test
    @DisplayName("checked Exception 도 500 · 공통 문구")
    void checkedException_returnsGenericBody() {
        ResponseEntity<Map<String, Object>> response = ServerErrorResponses.internalError(
                "지점 목록 조회", new Exception("java.net.SocketTimeoutException: Read timed out"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody().get("message")).isEqualTo(ServerErrorMessages.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody().toString()).doesNotContain("SocketTimeout");
    }

    @Test
    @DisplayName("반례: IllegalArgumentException 은 500 으로 덮지 않고 다시 던진다 (전역 400 문구 유지)")
    void illegalArgument_isRethrown() {
        IllegalArgumentException business = new IllegalArgumentException("기산일은 1~28일 사이여야 합니다.");

        assertThatThrownBy(() -> ServerErrorResponses.internalError("급여 기산일 변경 오류", business))
                .isSameAs(business);
        assertThat(appender.list).isEmpty();
    }

    @Test
    @DisplayName("반례: IllegalStateException 하위(409 매핑) 예외도 다시 던진다")
    void illegalStateSubclass_isRethrown() {
        MappingAlreadyProcessedException business = new MappingAlreadyProcessedException(
                1L, "req-1", MappingAlreadyProcessedException.Reason.STATUS_NOT_PENDING_PAYMENT,
                "이미 처리 중입니다.");

        assertThatThrownBy(() -> ServerErrorResponses.logInternalError("매칭 처리", business))
                .isSameAs(business);
    }

    @Test
    @DisplayName("반례: ValidationException · AccessDeniedException 도 다시 던진다")
    void validationAndAccessDenied_areRethrown() {
        ValidationException validation = new ValidationException("입력값을 확인해 주세요.");
        AccessDeniedException denied = new AccessDeniedException("접근 권한이 없습니다.");

        assertThatThrownBy(() -> ServerErrorResponses.internalError("상담일지 수정", validation)).isSameAs(validation);
        assertThatThrownBy(() -> ServerErrorResponses.internalError("상담일지 수정", denied)).isSameAs(denied);
    }

    @Test
    @DisplayName("traceId 는 호출마다 다르다")
    void traceIdIsUniquePerCall() {
        String first = ServerErrorResponses.logInternalError("a", new RuntimeException("x"));
        String second = ServerErrorResponses.logInternalError("a", new RuntimeException("x"));

        assertThat(first).isNotBlank().isNotEqualTo(second);
    }
}
