package com.coresolution.core.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 에러 응답 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {
    
    /**
     * 에러 발생 시각
     */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;
    
    /**
     * HTTP 상태 코드
     */
    private int status;
    
    /**
     * 에러 타입
     */
    private String error;
    
    /**
     * 에러 메시지
     */
    private String message;
    
    /**
     * 요청 경로
     */
    private String path;
    
    /**
     * 상세 정보 (선택적)
     */
    private Map<String, Object> details;
}

