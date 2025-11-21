package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 공통코드 목록 응답 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommonCodeListResponse {
    
    private List<CommonCodeResponse> codes;
    private Long totalCount;
    private Long activeCount;
    private Long inactiveCount;
    
    /**
     * 공통코드 목록과 통계 정보로 생성
     */
    public static CommonCodeListResponse of(List<CommonCodeResponse> codes) {
        long totalCount = codes.size();
        long activeCount = codes.stream()
                .filter(code -> code.getIsActive() != null && code.getIsActive())
                .count();
        long inactiveCount = totalCount - activeCount;
        
        return CommonCodeListResponse.builder()
                .codes(codes)
                .totalCount(totalCount)
                .activeCount(activeCount)
                .inactiveCount(inactiveCount)
                .build();
    }
}

