package com.mindgarden.ops.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * 전역 예외 처리 핸들러
 * 모든 예외를 중앙 집중식으로 처리하여 일관된 에러 응답 형식 제공
 * 
 * @author CoreSolution
 * @version 1.0.0
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * IllegalArgumentException 처리
     * HTTP 400 Bad Request
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(IllegalArgumentException ex) {
        log.warn("잘못된 요청: {}", ex.getMessage());
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "BAD_REQUEST", ex.getMessage());
    }

    /**
     * MethodArgumentNotValidException 처리 (Validation 실패)
     * HTTP 400 Bad Request
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, Object> fieldErrors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            fieldErrors.put(fieldName, errorMessage);
        });
        
        log.warn("검증 실패: {}", fieldErrors);
        ErrorResponse errorResponse = ErrorResponse.builder()
            .success(false)
            .message("입력값 검증에 실패했습니다.")
            .errorCode("VALIDATION_ERROR")
            .status(HttpStatus.BAD_REQUEST.value())
            .timestamp(Instant.now().toString())
            .details(fieldErrors)
            .build();
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    /**
     * ResponseStatusException 처리
     * HTTP 상태 코드는 예외에서 지정된 값 사용
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleResponseStatusException(ResponseStatusException ex) {
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        if (status == null) {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        }
        
        log.warn("응답 상태 예외: {} - {}", status, ex.getReason());
        return buildErrorResponse(status, "RESPONSE_STATUS_ERROR", ex.getReason());
    }

    /**
     * EntityNotFoundException 처리
     * HTTP 404 Not Found
     */
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleEntityNotFoundException(EntityNotFoundException ex) {
        log.warn("엔티티를 찾을 수 없음: {}", ex.getMessage());
        return buildErrorResponse(HttpStatus.NOT_FOUND, "ENTITY_NOT_FOUND", ex.getMessage());
    }

    /**
     * 모든 예외 처리 (기본 핸들러)
     * HTTP 500 Internal Server Error
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception ex) {
        log.error("예상치 못한 오류 발생", ex);
        return buildErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "INTERNAL_SERVER_ERROR",
            "서버 내부 오류가 발생했습니다."
        );
    }

    /**
     * 표준 에러 응답 생성
     */
    private ResponseEntity<ErrorResponse> buildErrorResponse(
        HttpStatus status,
        String errorCode,
        String message
    ) {
        ErrorResponse errorResponse = ErrorResponse.builder()
            .success(false)
            .message(message)
            .errorCode(errorCode)
            .status(status.value())
            .timestamp(Instant.now().toString())
            .build();
        
        return ResponseEntity.status(status).body(errorResponse);
    }
}

