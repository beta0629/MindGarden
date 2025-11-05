package com.mindgarden.consultation.exception;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;
import com.mindgarden.consultation.dto.ErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
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
     * RuntimeException 처리
     * HTTP 500 Internal Server Error 응답
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntime(RuntimeException e, HttpServletRequest request) {
        log.error("Runtime error occurred: {}", e.getMessage(), e);
        
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
