package com.coresolution.core.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 표준화된 에러 응답 DTO
 * 모든 API 에러 응답을 일관된 형식으로 제공
 * 
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-01-XX
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {
    
    /**
     * 요청 성공 여부 (항상 false)
     */
    @Builder.Default
    private boolean success = false;
    
    /**
     * 에러 메시지
     */
    private String message;
    
    /**
     * 에러 코드
     */
    private String errorCode;
    
    /**
     * 에러 발생 시간
     */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
    
    /**
     * HTTP 상태 코드
     */
    private int status;
    
    /**
     * 에러 상세 정보 (선택적)
     */
    private String details;
    
    /**
     * 에러 발생 경로 (선택적)
     */
    private String path;
    
    /**
     * 에러 발생 메서드 (선택적)
     */
    private String method;
    
    /**
     * 개발용 스택 트레이스 (프로덕션에서는 제외)
     */
    private String stackTrace;
    
    /**
     * 정적 팩토리 메서드 - 기본 에러 응답 생성
     */
    public static ErrorResponse of(String message, String errorCode, int status) {
        return ErrorResponse.builder()
            .success(false)
            .message(message)
            .errorCode(errorCode)
            .timestamp(LocalDateTime.now())
            .status(status)
            .build();
    }
    
    /**
     * 정적 팩토리 메서드 - 상세 에러 응답 생성
     */
    public static ErrorResponse of(String message, String errorCode, int status, String details) {
        return ErrorResponse.builder()
            .success(false)
            .message(message)
            .errorCode(errorCode)
            .timestamp(LocalDateTime.now())
            .status(status)
            .details(details)
            .build();
    }
    
    /**
     * 정적 팩토리 메서드 - 경로 정보 포함 에러 응답 생성
     */
    public static ErrorResponse of(String message, String errorCode, int status, String path, String method) {
        return ErrorResponse.builder()
            .success(false)
            .message(message)
            .errorCode(errorCode)
            .timestamp(LocalDateTime.now())
            .status(status)
            .path(path)
            .method(method)
            .build();
    }
    
    /**
     * 정적 팩토리 메서드 - 개발용 에러 응답 생성 (스택 트레이스 포함)
     */
    public static ErrorResponse ofWithStackTrace(String message, String errorCode, int status, String details, String stackTrace) {
        return ErrorResponse.builder()
            .success(false)
            .message(message)
            .errorCode(errorCode)
            .timestamp(LocalDateTime.now())
            .status(status)
            .details(details)
            .stackTrace(stackTrace)
            .build();
    }
}

