package com.mindgarden.consultation.dto;

import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 표준화된 에러 응답 DTO
 * API 설계 문서에 명시된 공통 에러 응답 형식
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {
    
    /**
     * 요청 성공 여부 (항상 false)
     */
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
    private LocalDateTime timestamp;
    
    /**
     * HTTP 상태 코드
     */
    private int status;
    
    /**
     * 에러 상세 정보 (선택적)
     */
    private String details;
    
    /**
     * 에러 발생 경로
     */
    private String path;
    
    /**
     * 에러 발생 메서드
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
