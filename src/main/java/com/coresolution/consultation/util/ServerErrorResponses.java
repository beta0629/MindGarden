package com.coresolution.consultation.util;

import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.coresolution.consultation.constant.ServerErrorMessages;
import com.coresolution.consultation.exception.AdminDeleteBlockedException;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.exception.ForbiddenException;
import com.coresolution.consultation.exception.IllegalStateTransitionException;
import com.coresolution.consultation.exception.NoActiveConsultantMappingException;
import com.coresolution.consultation.exception.PeriodClosedException;
import com.coresolution.consultation.exception.ProcedureExecutionException;
import com.coresolution.consultation.exception.TaxIntegrityException;
import com.coresolution.consultation.exception.UnauthorizedException;
import com.coresolution.consultation.exception.ValidationException;
import com.coresolution.core.security.PasswordService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.convert.ConversionFailedException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;

/**
 * 컨트롤러 catch 블록의 HTTP 500 응답을 만드는 공통 진입점.
 *
 * <p>예외 메시지(SQL·클래스명·스택 등)는 응답에 넣지 않는다. 응답에는
 * {@link ServerErrorMessages#INTERNAL_SERVER_ERROR} 와 {@code traceId} 만 싣고,
 * 예외 전체는 같은 {@code traceId} 로 서버 로그에 남긴다.</p>
 *
 * <p>{@code GlobalExceptionHandler} 가 4xx(또는 정해진 문구의 5xx)로 매핑하는 비즈니스 예외는
 * 여기서 500 으로 덮지 않고 다시 던진다. 그래야 화면이 의존하는 한글 문구와 상태 코드가 유지된다.</p>
 *
 * @author MindGarden
 * @since 2026-10-03
 */
@Slf4j
public final class ServerErrorResponses {

    /** 응답·로그 상관관계 키 */
    public static final String TRACE_ID_KEY = "traceId";

    private static final List<Class<? extends Throwable>> MAPPED_BUSINESS_EXCEPTIONS = List.of(
            IllegalArgumentException.class,
            IllegalStateException.class,
            PasswordService.InvalidPasswordException.class,
            ValidationException.class,
            EntityNotFoundException.class,
            UnauthorizedException.class,
            ForbiddenException.class,
            AccessDeniedException.class,
            AuthenticationException.class,
            IllegalStateTransitionException.class,
            AdminDeleteBlockedException.class,
            PeriodClosedException.class,
            TaxIntegrityException.class,
            NoActiveConsultantMappingException.class,
            ProcedureExecutionException.class,
            // 잘못된 입력 — 전역 처리기가 400 으로 매핑한다 (500 으로 덮지 않는다).
            // BindException 은 검사 예외라 컨트롤러 catch 를 거치지 않고 전역 처리기로 직접 간다.
            DateTimeParseException.class,
            ConversionFailedException.class);

    private ServerErrorResponses() {
    }

    /**
     * 로그·응답 대조용 추적 id 를 만든다.
     *
     * @return 새 추적 id
     */
    public static String newTraceId() {
        return UUID.randomUUID().toString();
    }

    /**
     * 전역 예외 처리기가 별도로 매핑하는 비즈니스 예외인지 확인한다.
     *
     * @param e 예외
     * @return 매핑된 비즈니스 예외면 {@code true}
     */
    public static boolean isMappedBusinessException(Throwable e) {
        if (e == null) {
            return false;
        }
        for (Class<? extends Throwable> type : MAPPED_BUSINESS_EXCEPTIONS) {
            if (type.isInstance(e)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 예외를 추적 id 와 함께 기록하고 그 id 를 돌려준다. 매핑된 비즈니스 예외는 다시 던진다.
     *
     * @param operation 로그용 작업 이름
     * @param e         원인 예외
     * @return 추적 id
     * @throws RuntimeException 매핑된 비즈니스 예외일 때 그대로 다시 던짐
     */
    public static String logInternalError(String operation, Throwable e) {
        if (isMappedBusinessException(e)) {
            throw propagate(e);
        }
        String traceId = newTraceId();
        log.error("[{}] traceId={} operation={}", ServerErrorMessages.CODE_INTERNAL_SERVER_ERROR,
                traceId, operation, e);
        return traceId;
    }

    /**
     * 컨트롤러 catch 블록을 전역 예외 처리기로 위임한다.
     *
     * <p>다른 catch 절(4xx 비즈니스 매핑)이 남아 있어 try/catch 를 지울 수 없는 자리에서 쓴다.
     * 반환값을 {@code throw} 해야 컴파일러가 이후 코드를 도달 불가로 인식한다.</p>
     *
     * <pre>{@code
     * } catch (Exception e) {
     *     throw ServerErrorResponses.propagate(e);
     * }
     * }</pre>
     *
     * @param e 원인 예외
     * @return 다시 던질 비검사 예외
     */
    public static RuntimeException propagate(Throwable e) {
        if (e instanceof Error error) {
            throw error;
        }
        if (e instanceof RuntimeException runtime) {
            return runtime;
        }
        // 검사 예외는 전역 처리기의 5xx 경로(RuntimeException)로 올린다. 메시지는 응답에 쓰이지 않는다.
        return new RuntimeException(e);
    }

    /**
     * 500 응답 본문({@code success:false}, 공통 문구, 오류 코드, 추적 id).
     *
     * @param traceId 추적 id
     * @return 응답 본문
     */
    public static Map<String, Object> body(String traceId) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("message", ServerErrorMessages.INTERNAL_SERVER_ERROR);
        body.put("errorCode", ServerErrorMessages.CODE_INTERNAL_SERVER_ERROR);
        body.put(TRACE_ID_KEY, traceId);
        return body;
    }

    /**
     * 예외를 기록하고 HTTP 500 + 공통 문구 응답을 만든다. 매핑된 비즈니스 예외는 다시 던진다.
     *
     * @param operation 로그용 작업 이름
     * @param e         원인 예외
     * @return HTTP 500 응답
     */
    public static ResponseEntity<Map<String, Object>> internalError(String operation, Throwable e) {
        String traceId = logInternalError(operation, e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body(traceId));
    }
}
