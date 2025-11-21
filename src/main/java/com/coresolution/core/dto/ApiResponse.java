package com.coresolution.core.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 표준화된 API 응답 래퍼
 * 모든 API 응답을 일관된 형식으로 래핑
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    
    /**
     * 요청 성공 여부
     */
    @Builder.Default
    private boolean success = true;
    
    /**
     * 응답 메시지 (선택적)
     */
    private String message;
    
    /**
     * 응답 데이터
     */
    private T data;
    
    /**
     * 응답 시간
     */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
    
    /**
     * 성공 응답 생성 (데이터만)
     */
    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
            .success(true)
            .data(data)
            .timestamp(LocalDateTime.now())
            .build();
    }
    
    /**
     * 성공 응답 생성 (메시지 + 데이터)
     */
    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
            .success(true)
            .message(message)
            .data(data)
            .timestamp(LocalDateTime.now())
            .build();
    }
    
    /**
     * 성공 응답 생성 (메시지만)
     */
    public static <T> ApiResponse<T> success(String message) {
        return ApiResponse.<T>builder()
            .success(true)
            .message(message)
            .timestamp(LocalDateTime.now())
            .build();
    }
    
    /**
     * 빈 성공 응답 생성
     */
    public static <T> ApiResponse<T> success() {
        return ApiResponse.<T>builder()
            .success(true)
            .timestamp(LocalDateTime.now())
            .build();
    }
}

