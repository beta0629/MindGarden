package com.coresolution.core.controller;

import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.dto.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * 표준화된 API Controller 기본 클래스
 * 모든 Controller가 상속받아 일관된 응답 형식 사용
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public abstract class BaseApiController {
    
    /**
     * 성공 응답 (200 OK)
     */
    protected <T> ResponseEntity<ApiResponse<T>> success(T data) {
        return ResponseEntity.ok(ApiResponse.success(data));
    }
    
    /**
     * 성공 응답 (200 OK, 메시지 포함)
     */
    protected <T> ResponseEntity<ApiResponse<T>> success(String message, T data) {
        return ResponseEntity.ok(ApiResponse.success(message, data));
    }
    
    /**
     * 성공 응답 (200 OK, 메시지만)
     */
    protected <T> ResponseEntity<ApiResponse<T>> success(String message) {
        return ResponseEntity.ok(ApiResponse.success(message));
    }
    
    /**
     * 생성 성공 응답 (201 Created)
     */
    protected <T> ResponseEntity<ApiResponse<T>> created(T data) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("생성되었습니다.", data));
    }
    
    /**
     * 생성 성공 응답 (201 Created, 커스텀 메시지)
     */
    protected <T> ResponseEntity<ApiResponse<T>> created(String message, T data) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(message, data));
    }
    
    /**
     * 수정 성공 응답 (200 OK)
     */
    protected <T> ResponseEntity<ApiResponse<T>> updated(T data) {
        return ResponseEntity.ok(ApiResponse.success("수정되었습니다.", data));
    }
    
    /**
     * 수정 성공 응답 (200 OK, 커스텀 메시지)
     */
    protected <T> ResponseEntity<ApiResponse<T>> updated(String message, T data) {
        return ResponseEntity.ok(ApiResponse.success(message, data));
    }
    
    /**
     * 삭제 성공 응답 (200 OK)
     */
    protected <T> ResponseEntity<ApiResponse<T>> deleted() {
        return ResponseEntity.ok(ApiResponse.success("삭제되었습니다."));
    }
    
    /**
     * 삭제 성공 응답 (200 OK, 커스텀 메시지)
     */
    protected <T> ResponseEntity<ApiResponse<T>> deleted(String message) {
        return ResponseEntity.ok(ApiResponse.success(message));
    }
    
    /**
     * 에러 응답 (400 Bad Request)
     */
    protected ResponseEntity<ErrorResponse> badRequest(String message, String errorCode) {
        return ResponseEntity.badRequest()
            .body(ErrorResponse.of(message, errorCode, HttpStatus.BAD_REQUEST.value()));
    }
    
    /**
     * 에러 응답 (401 Unauthorized)
     */
    protected ResponseEntity<ErrorResponse> unauthorized(String message) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(ErrorResponse.of(message, "UNAUTHORIZED", HttpStatus.UNAUTHORIZED.value()));
    }
    
    /**
     * 에러 응답 (403 Forbidden)
     */
    protected ResponseEntity<ErrorResponse> forbidden(String message) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(ErrorResponse.of(message, "FORBIDDEN", HttpStatus.FORBIDDEN.value()));
    }
    
    /**
     * 에러 응답 (404 Not Found)
     */
    protected ResponseEntity<ErrorResponse> notFound(String message) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ErrorResponse.of(message, "NOT_FOUND", HttpStatus.NOT_FOUND.value()));
    }
    
    /**
     * 에러 응답 (500 Internal Server Error)
     */
    protected ResponseEntity<ErrorResponse> internalError(String message) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ErrorResponse.of(message, "INTERNAL_ERROR", HttpStatus.INTERNAL_SERVER_ERROR.value()));
    }
    
    /**
     * 커스텀 에러 응답
     */
    protected ResponseEntity<ErrorResponse> error(String message, String errorCode, HttpStatus status) {
        return ResponseEntity.status(status)
            .body(ErrorResponse.of(message, errorCode, status.value()));
    }
}

