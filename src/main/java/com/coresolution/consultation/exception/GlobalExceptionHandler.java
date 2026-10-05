package com.coresolution.consultation.exception;

import java.time.format.DateTimeParseException;
import java.time.temporal.TemporalAccessor;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.ApiRequestErrorMessages;
import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.constant.ServerErrorMessages;
import com.coresolution.consultation.constant.ShopRefundConstants;
import com.coresolution.consultation.util.ClientMessageSanitizer;
import com.coresolution.consultation.util.ScheduleSessionStartGate;
import com.coresolution.consultation.util.ServerErrorResponses;
import com.coresolution.core.dto.ErrorResponse;
import com.coresolution.core.service.impl.OnboardingApprovalBlockedException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.core.convert.ConversionFailedException;
import org.springframework.validation.BindException;
import org.springframework.transaction.TransactionSystemException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
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
            clientSafeMessage(e.getMessage(), "요청한 정보를 찾을 수 없습니다."),
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
            clientSafeMessage(e.getMessage(), "로그인이 필요합니다."),
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
            clientSafeMessage(e.getMessage(), "접근 권한이 없습니다."),
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
            clientSafeMessage(e.getMessage(), "입력 데이터 검증에 실패했습니다."),
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
        return sanitizedServerError("TRANSACTION_SYSTEM_ERROR", e, request);
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
            clientSafeMessage(e.getMessage(), ApiRequestErrorMessages.INVALID_PARAMETER_VALUE),
            "ILLEGAL_STATE",
            HttpStatus.BAD_REQUEST.value(),
            request.getRequestURI(),
            request.getMethod()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * NumberFormatException 처리 — 숫자 파라미터(연도·월 등)를 직접 파싱하다 실패한 경우.
     *
     * <p>{@link IllegalArgumentException} 하위 타입이지만 예외 메시지가
     * {@code For input string: "abc"} 처럼 입력 원문을 담고 있어 응답에 쓸 수 없다.
     * 공통 타입 오류 문구만 내보내고 원문은 로그에만 남긴다.</p>
     */
    @ExceptionHandler(NumberFormatException.class)
    public ResponseEntity<ErrorResponse> handleNumberFormat(NumberFormatException e, HttpServletRequest request) {
        log.warn("NumberFormat 실패: path={}, message={}", request.getRequestURI(), e.getMessage());
        ErrorResponse error = ErrorResponse.of(
            ApiRequestErrorMessages.INVALID_PARAMETER_TYPE,
            ApiRequestErrorMessages.CODE_INVALID_PARAMETER_TYPE,
            HttpStatus.BAD_REQUEST.value(),
            request.getRequestURI(),
            request.getMethod()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * IllegalArgumentException 처리
     * HTTP 400 Bad Request 응답
     *
     * <p>사용자에게 보여줄 한글 비즈니스 문구는 그대로 두고, 예외 원문(클래스명·입력 원문·SQL 등)이
     * 섞인 기술 메시지는 공통 문구로 바꾼다.</p>
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException e, HttpServletRequest request) {
        log.warn("Illegal argument: {}", e.getMessage());
        
        ErrorResponse error = ErrorResponse.of(
            clientSafeMessage(e.getMessage(), ApiRequestErrorMessages.INVALID_PARAMETER_VALUE),
            "ILLEGAL_ARGUMENT",
            HttpStatus.BAD_REQUEST.value(),
            request.getRequestURI(),
            request.getMethod()
        );
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * 예외 메시지를 응답에 실어도 되는 형태로 바꾼다 (기술 원문 차단 · 내부 식별자 제거).
     *
     * @param message  예외 메시지
     * @param fallback 쓸 수 없을 때의 사용자 문구
     * @return 사용자에게 보여줄 문구
     */
    private static String clientSafeMessage(String message, String fallback) {
        return ClientMessageSanitizer.toClientMessage(message, fallback);
    }
    
    /**
     * BadCredentialsException 처리 (인증 실패)
     * HTTP 401 Unauthorized 응답
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException e, HttpServletRequest request) {
        log.warn("Bad credentials: path={}, message={}", request.getRequestURI(), e.getMessage());
        
        ErrorResponse error = ErrorResponse.of(
            clientSafeMessage(e.getMessage(), "아이디 또는 비밀번호가 올바르지 않습니다."),
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
            clientSafeMessage(e.getMessage(), "인증에 실패했습니다."),
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

        String message = clientSafeMessage(e.getMessage(), "접근 권한이 없습니다.");

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
     * DataIntegrityViolationException 처리 (DB 제약 위반).
     *
     * <p>이메일 unique({@code uk_users_email_tenant} 또는 unique+email 사용자 제약)만
     * 이메일 중복 문구로 매핑한다. 그 외 unique/duplicate(예: financial_transactions /
     * point ledger)를 「이메일이 이미 사용 중입니다」로 오매핑하지 않는다.
     * 쇼핑 환불 API 경로는 환불 전용 메시지·코드로 표면화한다.</p>
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(
            DataIntegrityViolationException e, HttpServletRequest request) {
        String message = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
        Throwable rootCause = NestedExceptionUtils.getMostSpecificCause(e);
        String rootMessage = rootCause.getMessage() != null ? rootCause.getMessage() : rootCause.toString();
        String rootLower = rootMessage.toLowerCase();

        boolean refundPath = isAdminShopRefundPath(request.getRequestURI());
        String clientMessage;
        String errorCode;
        if (isEmailUniqueConstraint(message) || isEmailUniqueConstraint(rootLower)) {
            clientMessage = ShopRefundConstants.MSG_EMAIL_ALREADY_REGISTERED;
            errorCode = "DATA_INTEGRITY_VIOLATION";
        } else if (refundPath) {
            clientMessage = ShopRefundConstants.MSG_REFUND_DATA_INTEGRITY;
            errorCode = ShopRefundConstants.ERROR_CODE_DATA_INTEGRITY;
        } else if (message.contains("unique") || message.contains("duplicate")
                || rootLower.contains("unique") || rootLower.contains("duplicate")) {
            clientMessage = ShopRefundConstants.MSG_DATA_DUPLICATE_CONSTRAINT;
            errorCode = "DATA_INTEGRITY_VIOLATION";
        } else {
            clientMessage = "데이터 제약 위반입니다.";
            errorCode = "DATA_INTEGRITY_VIOLATION";
        }
        log.warn("Data integrity violation: path={}, clientMessage={}, errorCode={}, rootCause={}",
                request.getRequestURI(), clientMessage, errorCode, rootMessage);

        ErrorResponse error = ErrorResponse.of(
            clientMessage,
            errorCode,
            HttpStatus.BAD_REQUEST.value(),
            request.getRequestURI(),
            request.getMethod()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * 쇼핑 전액 환불 — PG 취소 후 Clinic 체인 미완료 (부분 성공 금지·재시도 가능).
     */
    @ExceptionHandler(ShopRefundClinicChainException.class)
    public ResponseEntity<ErrorResponse> handleShopRefundClinicChain(
            ShopRefundClinicChainException e, HttpServletRequest request) {
        log.warn(
                "Shop refund clinic chain incomplete: path={}, orderPublicId={}, pgCancelCompleted={}, message={}",
                request.getRequestURI(),
                e.getOrderPublicId(),
                e.isPgCancelCompleted(),
                e.getMessage());
        ErrorResponse error = ErrorResponse.of(
                e.getMessage(),
                e.getErrorCode(),
                HttpStatus.CONFLICT.value(),
                request.getRequestURI(),
                request.getMethod());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    /**
     * 쇼핑 전액 환불 — 같은 주문 환불 진행 중 / 자동 재시도 불가 (PG 미호출).
     */
    @ExceptionHandler(ShopRefundInProgressException.class)
    public ResponseEntity<ErrorResponse> handleShopRefundInProgress(
            ShopRefundInProgressException e, HttpServletRequest request) {
        log.warn("Shop refund in progress: path={}, orderPublicId={}",
                request.getRequestURI(), e.getOrderPublicId());
        ErrorResponse error = ErrorResponse.of(
                e.getMessage(),
                e.getErrorCode(),
                HttpStatus.CONFLICT.value(),
                request.getRequestURI(),
                request.getMethod());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    private static boolean isEmailUniqueConstraint(String lowerMessage) {
        if (lowerMessage == null || lowerMessage.isBlank()) {
            return false;
        }
        if (lowerMessage.contains("uk_users_email_tenant")) {
            return true;
        }
        // unique + email — users 테이블/이메일 컬럼 휴리스틱 (비이메일 unique 제외)
        return (lowerMessage.contains("unique") || lowerMessage.contains("duplicate"))
                && lowerMessage.contains("email")
                && (lowerMessage.contains("users")
                        || lowerMessage.contains("uk_users")
                        || lowerMessage.contains("user_email"));
    }

    private static boolean isAdminShopRefundPath(String requestUri) {
        if (requestUri == null || requestUri.isBlank()) {
            return false;
        }
        String path = requestUri.toLowerCase();
        return path.contains("/admin/shop/orders/")
                && (path.endsWith("/refund")
                        || path.contains("/refund?")
                        || path.endsWith("/reconcile-refund")
                        || path.contains("/reconcile-refund?"));
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
     * 환불 전표 미기록 — 매칭 변경은 롤백됐다. 관리자 문구(세율 설정 안내 등)만 내보낸다.
     *
     * @since 2026-10-04
     */
    @ExceptionHandler(RefundLedgerNotRecordedException.class)
    public ResponseEntity<Map<String, Object>> handleRefundLedgerNotRecorded(
            RefundLedgerNotRecordedException e, HttpServletRequest request) {
        log.warn("[REFUND_LEDGER_NOT_RECORDED] mappingId={} cause={} path={}",
                e.getMappingId(), e.getCause() != null ? e.getCause().getClass().getSimpleName() : null,
                request.getRequestURI());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("code", RefundLedgerNotRecordedException.ERROR_CODE);
        body.put("errorCode", RefundLedgerNotRecordedException.ERROR_CODE);
        body.put("mappingId", e.getMappingId());
        body.put("message", e.getMessage());
        body.put("status", HttpStatus.UNPROCESSABLE_ENTITY.value());
        body.put("timestamp", java.time.LocalDateTime.now().toString());
        body.put("path", request.getRequestURI());
        body.put("method", request.getMethod());
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(body);
    }

    /**
     * 매칭 입금 확인·패키지 수정의 재무(ERP) 동기화 실패 — 매칭 변경 없이 422.
     *
     * @since 2026-10-05
     */
    @ExceptionHandler(MappingErpSyncFailedException.class)
    public ResponseEntity<Map<String, Object>> handleMappingErpSyncFailed(
            MappingErpSyncFailedException e, HttpServletRequest request) {
        log.warn("[MAPPING_ERP_SYNC_FAILED] mappingId={} cause={} path={}",
                e.getMappingId(), e.getCause() != null ? e.getCause().getClass().getSimpleName() : null,
                request.getRequestURI(), e.getCause());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("code", MappingErpSyncFailedException.ERROR_CODE);
        body.put("errorCode", MappingErpSyncFailedException.ERROR_CODE);
        body.put("mappingId", e.getMappingId());
        body.put("message", e.getMessage());
        body.put("status", HttpStatus.UNPROCESSABLE_ENTITY.value());
        body.put("timestamp", java.time.LocalDateTime.now().toString());
        body.put("path", request.getRequestURI());
        body.put("method", request.getMethod());
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(body);
    }

    /**
     * 입금 확인된 매칭 감액이 (결제액 − 누적 환불액) 미만 — 매칭·전표 변경 없이 422.
     *
     * @since 2026-10-05
     */
    @ExceptionHandler(MappingAmountBelowRefundFloorException.class)
    public ResponseEntity<Map<String, Object>> handleMappingAmountBelowRefundFloor(
            MappingAmountBelowRefundFloorException e, HttpServletRequest request) {
        log.warn("[MAPPING_AMOUNT_BELOW_REFUND_FLOOR] mappingId={} path={}", e.getMappingId(),
                request.getRequestURI());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("code", MappingAmountBelowRefundFloorException.ERROR_CODE);
        body.put("errorCode", MappingAmountBelowRefundFloorException.ERROR_CODE);
        body.put("mappingId", e.getMappingId());
        body.put("message", e.getMessage());
        body.put("status", HttpStatus.UNPROCESSABLE_ENTITY.value());
        body.put("timestamp", java.time.LocalDateTime.now().toString());
        body.put("path", request.getRequestURI());
        body.put("method", request.getMethod());
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(body);
    }

    /**
     * 일정당 상담일지 1건 — 중복 생성 HTTP 409 (기존 일지 ID 포함, 본문 미포함).
     */
    @ExceptionHandler(ConsultationRecordDuplicateException.class)
    public ResponseEntity<Map<String, Object>> handleConsultationRecordDuplicate(
            ConsultationRecordDuplicateException e, HttpServletRequest request) {
        log.info("[CONSULTATION_RECORD_DUPLICATE] scheduleId={} existingRecordId={} path={}",
                e.getScheduleId(), e.getExistingRecordId(), request.getRequestURI());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("code", "CONSULTATION_RECORD_DUPLICATE");
        body.put("message", e.getMessage());
        body.put("existingRecordId", e.getExistingRecordId());
        body.put("errorCode", "CONSULTATION_RECORD_DUPLICATE");
        body.put("status", HttpStatus.CONFLICT.value());
        body.put("timestamp", java.time.LocalDateTime.now().toString());
        body.put("path", request.getRequestURI());
        body.put("method", request.getMethod());

        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    /**
     * 일정 시작 전 완료 요청 — HTTP 400 (상태·회기·급여 변경 없음).
     */
    @ExceptionHandler(ScheduleSessionNotStartedException.class)
    public ResponseEntity<ErrorResponse> handleScheduleSessionNotStarted(
            ScheduleSessionNotStartedException e, HttpServletRequest request) {
        log.info("[SCHEDULE_SESSION_NOT_STARTED] scheduleId={} path={}", e.getScheduleId(), request.getRequestURI());
        ErrorResponse error = ErrorResponse.of(
            e.getMessage(),
            ScheduleSessionStartGate.COMPLETION_BEFORE_START_ERROR_CODE,
            HttpStatus.BAD_REQUEST.value(),
            request.getRequestURI(),
            request.getMethod()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
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
     * SMS OTP 확인 실패 — 틀림·만료는 400 + {@code data.remainingAttempts},
     * 실패 누적 잠김은 429 + {@code data.locked} · {@code data.retryAfterSeconds} (+ Retry-After 헤더).
     *
     * @since 2026-09-29
     */
    @ExceptionHandler(SmsOtpVerificationFailedException.class)
    public ResponseEntity<Map<String, Object>> handleSmsOtpVerificationFailed(
            SmsOtpVerificationFailedException e, HttpServletRequest request) {
        HttpStatus status = e.isLocked() ? HttpStatus.TOO_MANY_REQUESTS : HttpStatus.BAD_REQUEST;
        log.info("[{}] path={} remainingAttempts={} retryAfterSeconds={}",
            e.getErrorCode(), request.getRequestURI(), e.getRemainingAttempts(), e.getRetryAfterSeconds());

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("locked", e.isLocked());
        if (e.getRemainingAttempts() >= 0) {
            data.put("remainingAttempts", e.getRemainingAttempts());
        }
        if (e.getRetryAfterSeconds() != null) {
            data.put("retryAfterSeconds", e.getRetryAfterSeconds());
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("message", e.getMessage());
        body.put("errorCode", e.getErrorCode());
        body.put("status", status.value());
        body.put("data", data);
        body.put("timestamp", java.time.LocalDateTime.now().toString());
        body.put("path", request.getRequestURI());
        body.put("method", request.getMethod());

        ResponseEntity.BodyBuilder builder = ResponseEntity.status(status);
        if (e.getRetryAfterSeconds() != null) {
            builder.header(HttpHeaders.RETRY_AFTER, String.valueOf(e.getRetryAfterSeconds()));
        }
        return builder.body(body);
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
     * 온보딩 승인이 테넌트·관리자를 커밋하지 못한 경우.
     * HTTP 409 와 차단 사유를 반환하고, 요청은 승인으로 두지 않는다.
     */
    @ExceptionHandler(OnboardingApprovalBlockedException.class)
    public ResponseEntity<ErrorResponse> handleOnboardingApprovalBlocked(
            OnboardingApprovalBlockedException e, HttpServletRequest request) {
        log.warn("[{}] path={} reason={}", OnboardingApprovalBlockedException.ERROR_CODE,
                request.getRequestURI(), e.getMessage());
        ErrorResponse error = ErrorResponse.of(
                e.getMessage(),
                OnboardingApprovalBlockedException.ERROR_CODE,
                HttpStatus.CONFLICT.value(),
                request.getRequestURI(),
                request.getMethod()
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    /**
     * 저장 프로시저 실패({@code p_success=false} 또는 호출 예외).
     * HTTP 500 + {@code success:false} + 사용자용 한글 문구. 프로시저 메시지·SQL 원문은 로그에만 남긴다.
     */
    @ExceptionHandler(ProcedureExecutionException.class)
    public ResponseEntity<ErrorResponse> handleProcedureExecution(
            ProcedureExecutionException e, HttpServletRequest request) {
        String traceId = ServerErrorResponses.newTraceId();
        log.error("[{}] traceId={} procedure={} path={} detail={}", ProcedureExecutionException.ERROR_CODE,
                traceId, e.getProcedureName(), request.getRequestURI(), e.getDetail(), e.getCause());
        ErrorResponse error = ErrorResponse.of(
                e.getMessage(),
                ProcedureExecutionException.ERROR_CODE,
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                request.getRequestURI(),
                request.getMethod()
        );
        error.setTraceId(traceId);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    /**
     * HttpMessageNotReadableException — malformed JSON 등 요청 본문 파싱 실패.
     * 파서/Jackson 상세는 로그에만 남기고 고정 문구만 응답.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadable(
            HttpMessageNotReadableException e, HttpServletRequest request) {
        log.warn("HttpMessageNotReadable: path={}, message={}", request.getRequestURI(), e.getMessage());
        ErrorResponse error = ErrorResponse.of(
                ApiRequestErrorMessages.INVALID_REQUEST_BODY,
                ApiRequestErrorMessages.CODE_INVALID_REQUEST_BODY,
                HttpStatus.BAD_REQUEST.value(),
                request.getRequestURI(),
                request.getMethod()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * HttpMediaTypeNotSupportedException — 지원하지 않는 Content-Type.
     */
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleHttpMediaTypeNotSupported(
            HttpMediaTypeNotSupportedException e, HttpServletRequest request) {
        log.warn("HttpMediaTypeNotSupported: path={}, message={}", request.getRequestURI(), e.getMessage());
        ErrorResponse error = ErrorResponse.of(
                ApiRequestErrorMessages.UNSUPPORTED_MEDIA_TYPE,
                ApiRequestErrorMessages.CODE_UNSUPPORTED_MEDIA_TYPE,
                HttpStatus.BAD_REQUEST.value(),
                request.getRequestURI(),
                request.getMethod()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * MissingServletRequestParameterException — 필수 요청 파라미터 누락.
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingServletRequestParameter(
            MissingServletRequestParameterException e, HttpServletRequest request) {
        log.warn("MissingServletRequestParameter: path={}, message={}", request.getRequestURI(), e.getMessage());
        ErrorResponse error = ErrorResponse.of(
                ApiRequestErrorMessages.MISSING_REQUEST_PARAMETER,
                ApiRequestErrorMessages.CODE_MISSING_REQUEST_PARAMETER,
                HttpStatus.BAD_REQUEST.value(),
                request.getRequestURI(),
                request.getMethod()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * MethodArgumentTypeMismatchException — 파라미터 타입 불일치.
     *
     * <p>대상 타입이 날짜·시간이면 날짜 전용 문구로 안내한다. 변환기 내부 메시지는 로그에만 남긴다.</p>
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentTypeMismatch(
            MethodArgumentTypeMismatchException e, HttpServletRequest request) {
        log.warn("MethodArgumentTypeMismatch: path={}, parameter={}, message={}",
                request.getRequestURI(), e.getName(), e.getMessage());
        boolean temporal = isTemporalType(e.getRequiredType());
        ErrorResponse error = ErrorResponse.of(
                temporal ? ApiRequestErrorMessages.INVALID_DATE_FORMAT
                        : ApiRequestErrorMessages.INVALID_PARAMETER_TYPE,
                temporal ? ApiRequestErrorMessages.CODE_INVALID_DATE_FORMAT
                        : ApiRequestErrorMessages.CODE_INVALID_PARAMETER_TYPE,
                HttpStatus.BAD_REQUEST.value(),
                request.getRequestURI(),
                request.getMethod()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * DateTimeParseException — 컨트롤러·서비스에서 직접 파싱한 날짜 문자열이 잘못된 경우.
     *
     * <p>잘못된 입력이므로 500 이 아니라 400 이다. 파싱 대상 원문은 응답에 넣지 않는다.</p>
     */
    @ExceptionHandler(DateTimeParseException.class)
    public ResponseEntity<ErrorResponse> handleDateTimeParse(
            DateTimeParseException e, HttpServletRequest request) {
        log.warn("DateTimeParse 실패: path={}, errorIndex={}", request.getRequestURI(), e.getErrorIndex());
        ErrorResponse error = ErrorResponse.of(
                ApiRequestErrorMessages.INVALID_DATE_FORMAT,
                ApiRequestErrorMessages.CODE_INVALID_DATE_FORMAT,
                HttpStatus.BAD_REQUEST.value(),
                request.getRequestURI(),
                request.getMethod()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * ConversionFailedException — 바인딩 외 경로의 타입 변환 실패.
     *
     * <p>{@link MethodArgumentTypeMismatchException} 으로 감싸이지 않고 올라오는 경우를 받는다.</p>
     */
    @ExceptionHandler(ConversionFailedException.class)
    public ResponseEntity<ErrorResponse> handleConversionFailed(
            ConversionFailedException e, HttpServletRequest request) {
        log.warn("ConversionFailed: path={}, targetType={}", request.getRequestURI(),
                e.getTargetType() != null ? e.getTargetType().getName() : null);
        boolean temporal = e.getTargetType() != null && isTemporalType(e.getTargetType().getType());
        ErrorResponse error = ErrorResponse.of(
                temporal ? ApiRequestErrorMessages.INVALID_DATE_FORMAT
                        : ApiRequestErrorMessages.INVALID_PARAMETER_VALUE,
                temporal ? ApiRequestErrorMessages.CODE_INVALID_DATE_FORMAT
                        : ApiRequestErrorMessages.CODE_INVALID_PARAMETER_VALUE,
                HttpStatus.BAD_REQUEST.value(),
                request.getRequestURI(),
                request.getMethod()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * BindException — 폼·쿼리 객체 바인딩 실패.
     *
     * <p>{@link MethodArgumentNotValidException} 은 하위 타입이지만 전용 핸들러가 우선한다.
     * 상세는 {@code field: message} 형식으로만 내보내고 예외 원문은 넣지 않는다.</p>
     */
    @ExceptionHandler(BindException.class)
    public ResponseEntity<ErrorResponse> handleBind(BindException e, HttpServletRequest request) {
        String details = e.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining(", "));
        log.warn("BindException: path={}, details={}", request.getRequestURI(), details);
        ErrorResponse error = ErrorResponse.of(
                ApiRequestErrorMessages.INVALID_REQUEST_BINDING,
                ApiRequestErrorMessages.CODE_INVALID_REQUEST_BINDING,
                HttpStatus.BAD_REQUEST.value(),
                details.isBlank() ? null : details
        );
        error.setPath(request.getRequestURI());
        error.setMethod(request.getMethod());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * 날짜·시간 타입 여부.
     *
     * @param type 대상 타입
     * @return {@code java.time} 날짜·시간 타입이면 {@code true}
     */
    private static boolean isTemporalType(Class<?> type) {
        return type != null && (TemporalAccessor.class.isAssignableFrom(type)
                || java.util.Date.class.isAssignableFrom(type));
    }

    /**
     * RuntimeException 처리 (별도 핸들러가 없는 런타임 예외)
     * HTTP 500 + 공통 한글 문구. 예외 메시지는 SQL·클래스명 등 기술 문구일 수 있어 로그에만 남긴다.
     * 화면에 문구를 보여야 하는 비즈니스 오류는 4xx 로 매핑되는 예외(IllegalArgument/IllegalState/전용 예외)를 던진다.
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntime(RuntimeException e, HttpServletRequest request) {
        String errorMessage = e.getMessage();
        boolean hasMessage = errorMessage != null && !errorMessage.trim().isEmpty();
        return sanitizedServerError(hasMessage ? "RUNTIME_ERROR" : "INTERNAL_SERVER_ERROR", e, request);
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
        
        // Spring 기본 문구는 영문·기술 문구라 응답에 쓰지 않는다 (위 로그에만 남긴다).
        ErrorResponse error = ErrorResponse.of(
            "요청 메서드가 지원되지 않습니다.",
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
        return sanitizedServerError("UNEXPECTED_ERROR", e, request);
    }

    /**
     * 5xx 공통 응답 — 예외 전체는 추적 id 와 함께 로그에만, 응답에는 공통 한글 문구와 추적 id 만 싣는다.
     *
     * @param errorCode 응답 오류 코드
     * @param e         원인 예외
     * @param request   요청
     * @return HTTP 500 응답
     */
    private ResponseEntity<ErrorResponse> sanitizedServerError(
            String errorCode, Throwable e, HttpServletRequest request) {
        String traceId = ServerErrorResponses.newTraceId();
        log.error("[{}] traceId={} path={} method={} exception={} message={}", errorCode, traceId,
                request.getRequestURI(), request.getMethod(), e.getClass().getName(), e.getMessage(), e);
        ErrorResponse error = ErrorResponse.of(
            ServerErrorMessages.INTERNAL_SERVER_ERROR,
            errorCode,
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            request.getRequestURI(),
            request.getMethod()
        );
        error.setTraceId(traceId);
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
