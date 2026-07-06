package com.coresolution.consultation.exception;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.core.dto.ErrorResponse;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.transaction.TransactionSystemException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import jakarta.servlet.http.HttpServletRequest;

/**
 * 전역 예외 처리기
 * 개발 가이드 문서에 명시된 예외 처리 가이드라인 준수
 */
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    
    /**
     * EntityNotFoundException 처리
     * HTTP 404 Not Found 응답
     */
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleEntityNotFound(EntityNotFoundException e, HttpServletRequest request) {
        log.warn("Entity not found: {}", e.getMessage());
        
        ErrorResponse error = ErrorResponse.of(
            e.getMessage(),
            "ENTITY_NOT_FOUND",
            HttpStatus.NOT_FOUND.value(),
            request.getRequestURI(),
            request.getMethod()
        );
        
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    /**
     * UnauthorizedException 처리 (인증 필요)
     * HTTP 401 Unauthorized
     */
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorized(UnauthorizedException e, HttpServletRequest request) {
        log.warn("Unauthorized: {}", e.getMessage());
        ErrorResponse error = ErrorResponse.of(
            e.getMessage(),
            "UNAUTHORIZED",
            HttpStatus.UNAUTHORIZED.value(),
            request.getRequestURI(),
            request.getMethod()
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    /**
     * ForbiddenException 처리 (권한 없음)
     * HTTP 403 Forbidden
     */
    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ErrorResponse> handleForbidden(ForbiddenException e, HttpServletRequest request) {
        log.warn("Forbidden: {}", e.getMessage());
        ErrorResponse error = ErrorResponse.of(
            e.getMessage(),
            "FORBIDDEN",
            HttpStatus.FORBIDDEN.value(),
            request.getRequestURI(),
            request.getMethod()
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }
    
    /**
     * ValidationException 처리
     * HTTP 400 Bad Request 응답
     */
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidation(ValidationException e, HttpServletRequest request) {
        log.warn("Validation error: {}", e.getMessage());
        
        String details = null;
        if (e.hasFieldErrors()) {
            details = e.getFieldErrors().entrySet().stream()
                .map(entry -> entry.getKey() + ": " + entry.getValue())
                .collect(Collectors.joining(", "));
        } else if (e.hasValidationErrors()) {
            details = String.join(", ", e.getValidationErrors());
        }
        
        ErrorResponse error = ErrorResponse.of(
            e.getMessage(),
            "VALIDATION_ERROR",
            HttpStatus.BAD_REQUEST.value(),
            details
        );
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
    
    /**
     * MethodArgumentNotValidException 처리 (Bean Validation)
     * HTTP 400 Bad Request 응답
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValid(
            MethodArgumentNotValidException e, HttpServletRequest request) {
        
        Map<String, String> fieldErrors = new HashMap<>();
        e.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            fieldErrors.put(fieldName, errorMessage);
        });
        
        String details = fieldErrors.entrySet().stream()
            .map(entry -> entry.getKey() + ": " + entry.getValue())
            .collect(Collectors.joining(", "));
        
        log.warn("Bean validation error: {}", details);
        
        ErrorResponse error = ErrorResponse.of(
            "입력 데이터 검증에 실패했습니다.",
            "BEAN_VALIDATION_ERROR",
            HttpStatus.BAD_REQUEST.value(),
            details
        );
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * Bean Validation 위반 상세 문자열 — MethodArgumentNotValidException과 동일 형식(field: message, 콤마 구분).
     *
     * @param violations 제약 위반 집합
     * @return 상세 문자열
     */
    private static String buildDetailsFromConstraintViolations(Set<ConstraintViolation<?>> violations) {
        return violations.stream()
            .map(v -> {
                String path = v.getPropertyPath() != null ? v.getPropertyPath().toString() : "";
                String field = path;
                int lastDot = path.lastIndexOf('.');
                if (lastDot >= 0 && lastDot < path.length() - 1) {
                    field = path.substring(lastDot + 1);
                }
                String msg = v.getMessage() != null ? v.getMessage() : "";
                return field + ": " + msg;
            })
            .collect(Collectors.joining(", "));
    }

    /**
     * jakarta.validation.ConstraintViolationException (엔티티 검증 등)
     * HTTP 400, {@code CONSTRAINT_VIOLATION}.
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(
            ConstraintViolationException e, HttpServletRequest request) {
        String details = buildDetailsFromConstraintViolations(e.getConstraintViolations());
        log.warn("Constraint violation: {}", details);
        ErrorResponse error = ErrorResponse.of(
            "입력 데이터 검증에 실패했습니다.",
            "CONSTRAINT_VIOLATION",
            HttpStatus.BAD_REQUEST.value(),
            details
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * JPA flush 등으로 {@link ConstraintViolationException}이 트랜잭션 래퍼에 싸여 전달되는 경우.
     * root cause가 {@link ConstraintViolationException}이면 위와 동일하게 HTTP 400 처리.
     */
    @ExceptionHandler(TransactionSystemException.class)
    public ResponseEntity<ErrorResponse> handleTransactionSystemException(
            TransactionSystemException e, HttpServletRequest request) {
        Throwable root = NestedExceptionUtils.getMostSpecificCause(e);
        if (root instanceof ConstraintViolationException cve) {
            return handleConstraintViolation(cve, request);
        }
        log.error("Transaction system error (non-constraint): {}", e.getMessage(), e);
        ErrorResponse error = ErrorResponse.of(
            "트랜잭션 처리 중 오류가 발생했습니다.",
            "TRANSACTION_SYSTEM_ERROR",
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            request.getRequestURI(),
            request.getMethod()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
    
    /**
     * IllegalStateException 처리 (Tenant ID 미설정 등)
     * "Tenant ID is not set"인 경우 HTTP 401로 응답하여 프론트의 로그인 리다이렉트와 일치시킴.
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalState(IllegalStateException e, HttpServletRequest request) {
        String msg = e.getMessage() != null ? e.getMessage() : "";
        if (msg.contains("Tenant ID is not set")) {
            log.warn("Tenant context not set (401): path={}, message={}", request.getRequestURI(), msg);
            ErrorResponse error = ErrorResponse.of(
                "세션 또는 테넌트 정보가 없습니다. 다시 로그인해 주세요.",
                "TENANT_ID_NOT_SET",
                HttpStatus.UNAUTHORIZED.value(),
                request.getRequestURI(),
                request.getMethod()
            );
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
        log.warn("Illegal state: {}", e.getMessage());
        ErrorResponse error = ErrorResponse.of(
            e.getMessage(),
            "ILLEGAL_STATE",
            HttpStatus.BAD_REQUEST.value(),
            request.getRequestURI(),
            request.getMethod()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * IllegalArgumentException 처리
     * HTTP 400 Bad Request 응답
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException e, HttpServletRequest request) {
        log.warn("Illegal argument: {}", e.getMessage());
        
        ErrorResponse error = ErrorResponse.of(
            e.getMessage(),
            "ILLEGAL_ARGUMENT",
            HttpStatus.BAD_REQUEST.value(),
            request.getRequestURI(),
            request.getMethod()
        );
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
    
    /**
     * BadCredentialsException 처리 (인증 실패)
     * HTTP 401 Unauthorized 응답
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException e, HttpServletRequest request) {
        log.warn("Bad credentials: path={}, message={}", request.getRequestURI(), e.getMessage());
        
        ErrorResponse error = ErrorResponse.of(
            e.getMessage() != null ? e.getMessage() : "아이디 또는 비밀번호가 올바르지 않습니다.",
            "BAD_CREDENTIALS",
            HttpStatus.UNAUTHORIZED.value(),
            request.getRequestURI(),
            request.getMethod()
        );
        
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }
    
    /**
     * AuthenticationException 처리 (기타 인증 오류)
     * HTTP 401 Unauthorized 응답
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthentication(AuthenticationException e, HttpServletRequest request) {
        log.warn("Authentication failed: path={}, message={}", request.getRequestURI(), e.getMessage());
        
        ErrorResponse error = ErrorResponse.of(
            e.getMessage() != null ? e.getMessage() : "인증에 실패했습니다.",
            "AUTHENTICATION_FAILED",
            HttpStatus.UNAUTHORIZED.value(),
            request.getRequestURI(),
            request.getMethod()
        );
        
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }
    
    /**
     * AccessDeniedException 처리 (권한 없음)
     * HTTP 403 Forbidden 응답
     * 예외 메시지가 있으면 그대로 전달, 없으면 "접근 권한이 없습니다."
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException e, HttpServletRequest request) {
        log.warn("Access denied: path={}, message={}", request.getRequestURI(), e.getMessage());

        String message = (e.getMessage() != null && !e.getMessage().isBlank())
            ? e.getMessage().trim()
            : "접근 권한이 없습니다.";

        ErrorResponse error = ErrorResponse.of(
            message,
            "ACCESS_DENIED",
            HttpStatus.FORBIDDEN.value(),
            request.getRequestURI(),
            request.getMethod()
        );

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }
    
    /**
     * DataIntegrityViolationException 처리 (DB 제약 위반)
     * unique/duplicate 시 이메일 중복 메시지, 그 외 데이터 제약 위반 → HTTP 400 Bad Request
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(
            DataIntegrityViolationException e, HttpServletRequest request) {
        String message = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
        String clientMessage;
        if (message.contains("uk_users_email_tenant") || (message.contains("unique") && message.contains("email"))) {
            clientMessage = "이미 등록된 이메일입니다.";
        } else if (message.contains("unique") || message.contains("duplicate")) {
            clientMessage = "이메일이 이미 사용 중입니다.";
        } else {
            clientMessage = "데이터 제약 위반입니다.";
        }
        Throwable rootCause = NestedExceptionUtils.getMostSpecificCause(e);
        String rootMessage = rootCause.getMessage() != null ? rootCause.getMessage() : rootCause.toString();
        log.warn("Data integrity violation: path={}, clientMessage={}, rootCause={}",
                request.getRequestURI(), clientMessage, rootMessage);

        ErrorResponse error = ErrorResponse.of(
            clientMessage,
            "DATA_INTEGRITY_VIOLATION",
            HttpStatus.BAD_REQUEST.value(),
            request.getRequestURI(),
            request.getMethod()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * 옵션 B (예약 우선 매칭) 당일 카드 결제 멱등성 가드 예외 처리.
     *
     * <p>합의서: {@code OPTION_B_RESERVATION_FIRST_PLAN_V2.md} §4·§6 Q6/Q11.
     * 매칭 status 가 PENDING_PAYMENT 가 아니거나 X-Request-Id 헤더가 재사용된 경우
     * HTTP 409 Conflict + 정형화된 JSON 본문으로 응답한다.</p>
     *
     * <p>응답 본문 스키마:
     * <pre>{@code
     * {
     *   "success": false,
     *   "code": "MAPPING_ALREADY_PROCESSED",
     *   "reason": "STATUS_NOT_PENDING_PAYMENT" | "DUPLICATE_REQUEST_ID",
     *   "mappingId": 123,
     *   "requestId": "uuid-...",
     *   "message": "이미 처리 중입니다. 새 매칭 카드로 확인하세요.",
     *   "errorCode": "MAPPING_ALREADY_PROCESSED",
     *   "status": 409,
     *   "timestamp": "..."
     * }
     * }</pre></p>
     *
     * @since 2026-05-28
     */
    @ExceptionHandler(MappingAlreadyProcessedException.class)
    public ResponseEntity<Map<String, Object>> handleMappingAlreadyProcessed(
            MappingAlreadyProcessedException e, HttpServletRequest request) {
        log.info("[MAPPING_ALREADY_PROCESSED] mappingId={} requestId={} reason={} message={} path={}",
                e.getMappingId(), e.getRequestId(), e.getReason(), e.getMessage(), request.getRequestURI());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("code", "MAPPING_ALREADY_PROCESSED");
        body.put("reason", e.getReason() != null ? e.getReason().name() : null);
        body.put("mappingId", e.getMappingId());
        body.put("requestId", e.getRequestId());
        body.put("message", e.getMessage());
        body.put("errorCode", "MAPPING_ALREADY_PROCESSED");
        body.put("status", HttpStatus.CONFLICT.value());
        body.put("timestamp", java.time.LocalDateTime.now().toString());
        body.put("path", request.getRequestURI());
        body.put("method", request.getMethod());

        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    /**
     * lifecycle §3.6 전이 그래프 위반 — HTTP 409 (시스템 오류 아님).
     */
    @ExceptionHandler(IllegalStateTransitionException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalStateTransition(
            IllegalStateTransitionException e, HttpServletRequest request) {
        LifecycleState fromState = e.getFromState();
        LifecycleState toState = e.getToState();
        log.info("[ILLEGAL_STATE_TRANSITION] from={} to={} message={} path={}",
                fromState, toState, e.getMessage(), request.getRequestURI());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("code", "ILLEGAL_STATE_TRANSITION");
        body.put("message", e.getMessage());
        body.put("fromState", fromState != null ? fromState.getCode() : null);
        body.put("toState", toState != null ? toState.getCode() : null);
        body.put("errorCode", "ILLEGAL_STATE_TRANSITION");
        body.put("status", HttpStatus.CONFLICT.value());
        body.put("timestamp", java.time.LocalDateTime.now().toString());
        body.put("path", request.getRequestURI());
        body.put("method", request.getMethod());

        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    /**
     * 어드민 강제 종료(삭제) 가드가 발동된 경우 처리.
     *
     * <p>의도된 비즈니스 차단 흐름이므로 HTTP {@code 409 Conflict} + 정형화된 JSON 본문으로
     * 응답하고, 로그 레벨은 {@code INFO} 로 기록한다 (시스템 오류 아님).</p>
     */
    @ExceptionHandler(AdminDeleteBlockedException.class)
    public ResponseEntity<Map<String, Object>> handleAdminDeleteBlocked(
            AdminDeleteBlockedException e, HttpServletRequest request) {
        log.info("[ADMIN_DELETE_BLOCKED] code={} message={} details={} path={}",
                e.getCode(), e.getMessage(), e.getDetails(), request.getRequestURI());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("code", e.getCode());
        body.put("message", e.getMessage());
        body.put("details", e.getDetails());
        body.put("errorCode", "ADMIN_DELETE_BLOCKED");
        body.put("status", HttpStatus.CONFLICT.value());
        body.put("timestamp", java.time.LocalDateTime.now().toString());
        body.put("path", request.getRequestURI());
        body.put("method", request.getMethod());

        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    /**
     * ERP 결산 — 마감된 기간(CLOSED 또는 REOPENED) 의 거래 수정·삭제 시도를 차단한다.
     *
     * <p>합의서 §2 Q3 / §2 Q6: 일반 ADMIN 은 마감 기간 거래 수정 불가, HQ_ADMIN 이 재오픈 후에만 수정 가능.
     * HTTP {@code 409 Conflict} + 재오픈 안내 JSON. 의도된 비즈니스 차단이므로 로그 레벨은 {@code INFO}.</p>
     */
    @ExceptionHandler(PeriodClosedException.class)
    public ResponseEntity<Map<String, Object>> handlePeriodClosed(
            PeriodClosedException e, HttpServletRequest request) {
        log.info("[PERIOD_CLOSED] periodStart={} periodEnd={} message={} path={}",
                e.getPeriodStart(), e.getPeriodEnd(), e.getMessage(), request.getRequestURI());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("code", "PERIOD_CLOSED");
        body.put("message", e.getMessage());
        body.put("periodStart", e.getPeriodStart() != null ? e.getPeriodStart().toString() : null);
        body.put("periodEnd", e.getPeriodEnd() != null ? e.getPeriodEnd().toString() : null);
        body.put("hint", "HQ_ADMIN 에게 재오픈(REOPEN) 을 요청하세요.");
        body.put("errorCode", "PERIOD_CLOSED");
        body.put("status", HttpStatus.CONFLICT.value());
        body.put("timestamp", java.time.LocalDateTime.now().toString());
        body.put("path", request.getRequestURI());
        body.put("method", request.getMethod());

        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    /**
     * ERP 결산 — 부가세 누적 차이 감지 시 마감 차단.
     *
     * <p>합의서 §2 Q8: {@code tax_amount_sum != 10% × (INCOME − REFUND)} 일 때 throw.
     * HTTP {@code 422 Unprocessable Entity} + 알림 발송 트리거(필드 {@code notify=true} 포함).
     * 알림 발송은 본 핸들러가 직접 수행하지 않고, 수신측(어드민 모니터링)이 본 응답을 보고 발송한다.</p>
     */
    @ExceptionHandler(TaxIntegrityException.class)
    public ResponseEntity<Map<String, Object>> handleTaxIntegrity(
            TaxIntegrityException e, HttpServletRequest request) {
        log.warn("[TAX_INTEGRITY_FAIL] tenantId={} expected={} actual={} message={} path={}",
                e.getTenantId(), e.getExpected(), e.getActual(), e.getMessage(), request.getRequestURI());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("code", "TAX_INTEGRITY_FAIL");
        body.put("message", e.getMessage());
        body.put("tenantId", e.getTenantId());
        body.put("expected", e.getExpected());
        body.put("actual", e.getActual());
        body.put("notify", true);
        body.put("errorCode", "TAX_INTEGRITY_FAIL");
        body.put("status", HttpStatus.UNPROCESSABLE_ENTITY.value());
        body.put("timestamp", java.time.LocalDateTime.now().toString());
        body.put("path", request.getRequestURI());
        body.put("method", request.getMethod());

        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(body);
    }

    /**
     * 내담자 본인 콘텐츠를 상담사에게 공유하려 할 때 활성 매핑이 없는 경우.
     *
     * <p>FE 는 사전 조회 (`GET /api/v1/clients/me/consultant-mappings/active`) 로 차단하지만,
     * 매핑이 동시 INACTIVE 로 바뀌는 등 경계 케이스에서 BE 가 본 예외를 던진다.
     * HTTP {@code 400 Bad Request} + JSON 본문 {@code { success, code, message }} 로 응답.</p>
     *
     * @since 2026-06-09
     */
    @ExceptionHandler(NoActiveConsultantMappingException.class)
    public ResponseEntity<Map<String, Object>> handleNoActiveConsultantMapping(
            NoActiveConsultantMappingException e, HttpServletRequest request) {
        log.info("[NO_ACTIVE_CONSULTANT_MAPPING] message={} path={}",
            e.getMessage(), request.getRequestURI());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("code", e.getErrorCode());
        body.put("message", e.getMessage() != null ? e.getMessage()
            : "매칭된 담당 상담사가 없습니다. 먼저 상담을 신청해 주세요.");
        body.put("errorCode", e.getErrorCode());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("timestamp", java.time.LocalDateTime.now().toString());
        body.put("path", request.getRequestURI());
        body.put("method", request.getMethod());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    /**
     * 어드민 테스트 발송 도구의 솔라피 실시간 알림톡 템플릿 조회 실패.
     * HTTP 502 Bad Gateway + {@code ALIMTALK_TEMPLATE_FETCH_FAILED} 코드.
     */
    @ExceptionHandler(AlimtalkTemplateFetchException.class)
    public ResponseEntity<ErrorResponse> handleAlimtalkTemplateFetch(
            AlimtalkTemplateFetchException e, HttpServletRequest request) {
        log.warn("Alimtalk template fetch failed: upstreamStatus={}, upstreamErrorCode={}, message={}",
            e.getUpstreamStatus(), e.getUpstreamErrorCode(), e.getMessage());
        ErrorResponse error = ErrorResponse.of(
            e.getMessage() != null ? e.getMessage() : "알림톡 템플릿 조회에 실패했습니다.",
            "ALIMTALK_TEMPLATE_FETCH_FAILED",
            HttpStatus.BAD_GATEWAY.value(),
            request.getRequestURI(),
            request.getMethod()
        );
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(error);
    }

    /**
     * RuntimeException 처리
     * HTTP 500 Internal Server Error 응답
     * 비즈니스 로직 오류의 경우 실제 메시지를 클라이언트에 전달
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntime(RuntimeException e, HttpServletRequest request) {
        log.error("Runtime error occurred: {}", e.getMessage(), e);
        
        // 비즈니스 로직 오류 메시지가 있으면 전달 (한글 메시지 포함)
        String errorMessage = e.getMessage();
        if (errorMessage != null && !errorMessage.trim().isEmpty()) {
            // 한글 메시지인 경우 그대로 전달
            ErrorResponse error = ErrorResponse.of(
                errorMessage,
                "RUNTIME_ERROR",
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                request.getRequestURI(),
                request.getMethod()
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
        
        // 메시지가 없거나 비어있으면 기본 메시지 사용
        ErrorResponse error = ErrorResponse.of(
            "서버 내부 오류가 발생했습니다.",
            "INTERNAL_SERVER_ERROR",
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            request.getRequestURI(),
            request.getMethod()
        );
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
    
    /**
     * NoResourceFoundException 처리
     * React Native Metro 번들러의 hot-update 파일 등 정적 리소스 요청 무시
     * HTTP 404 Not Found 응답 (조용히 처리)
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResourceFound(NoResourceFoundException e, HttpServletRequest request) {
        String resourcePath = request.getRequestURI();
        
        // React Native Metro 번들러의 hot-update 파일은 조용히 무시
        if (resourcePath != null && (resourcePath.contains("hot-update") || resourcePath.endsWith(".hot-update.json"))) {
            // Metro 번들러 파일은 백엔드에서 처리하지 않음 (조용히 무시)
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        
        // 기타 정적 리소스는 경고 로그만 남기고 조용히 처리
        log.debug("Static resource not found: {}", resourcePath);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }
    
    /**
     * HttpRequestMethodNotSupportedException 처리
     * HTTP 405 Method Not Allowed (잘못된 HTTP 메서드는 500이 아닌 405)
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotSupported(
            HttpRequestMethodNotSupportedException e, HttpServletRequest request) {
        log.warn("HTTP method not supported: path={}, method={}", request.getRequestURI(), request.getMethod());
        
        String message = e.getMessage() != null ? e.getMessage() : "요청 메서드가 지원되지 않습니다.";
        ErrorResponse error = ErrorResponse.of(
            message,
            "METHOD_NOT_ALLOWED",
            HttpStatus.METHOD_NOT_ALLOWED.value(),
            request.getRequestURI(),
            request.getMethod()
        );
        
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(error);
    }
    
    /**
     * Exception 처리 (기타 모든 예외)
     * HTTP 500 Internal Server Error 응답
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception e, HttpServletRequest request) {
        // NoResourceFoundException은 이미 처리되므로 여기서는 제외
        if (e instanceof NoResourceFoundException) {
            return handleNoResourceFound((NoResourceFoundException) e, request);
        }
        
        log.error("Unexpected error occurred: {}", e.getMessage(), e);
        
        ErrorResponse error = ErrorResponse.of(
            "예상치 못한 오류가 발생했습니다.",
            "UNEXPECTED_ERROR",
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            request.getRequestURI(),
            request.getMethod()
        );
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
    
    /**
     * 개발 환경에서만 스택 트레이스 포함
     */
    private ErrorResponse createErrorResponseWithStackTrace(String message, String errorCode, 
                                                         int status, String details, Exception e) {
        return ErrorResponse.builder()
            .success(false)
            .message(message)
            .errorCode(errorCode)
            .timestamp(java.time.LocalDateTime.now())
            .status(status)
            .details(details)
            .stackTrace(getStackTraceAsString(e))
            .build();
    }
    
    /**
     * 스택 트레이스를 문자열로 변환
     */
    private String getStackTraceAsString(Exception e) {
        StringBuilder sb = new StringBuilder();
        sb.append(e.toString()).append("\n");
        
        for (StackTraceElement element : e.getStackTrace()) {
            sb.append("\tat ").append(element.toString()).append("\n");
        }
        
        return sb.toString();
    }
}
