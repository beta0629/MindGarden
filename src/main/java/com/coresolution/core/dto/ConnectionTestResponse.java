package com.coresolution.core.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * PG 연결 테스트 응답 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConnectionTestResponse {
    
    /**
     * 연결 테스트 성공 여부
     */
    private Boolean success;
    
    /**
     * 연결 테스트 결과 (SUCCESS, FAILED)
     */
    private String result;
    
    /**
     * 연결 테스트 메시지
     */
    private String message;
    
    /**
     * 테스트 시각
     */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime testedAt;
    
    /**
     * 상세 정보 (JSON)
     */
    private String details;
}

