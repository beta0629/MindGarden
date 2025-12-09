package com.mindgarden.ops.exception;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

/**
 * 표준 에러 응답 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 */
@Data
@Builder
public class ErrorResponse {
    private boolean success;
    private String message;
    private String errorCode;
    private Integer status;
    private String timestamp;
    private Map<String, Object> details;
}

