package com.coresolution.core.controller;

import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.statistics.StatisticsDefinition;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.service.statistics.StatisticsMetadataService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 통계 API 컨트롤러
 * 메타데이터 기반 통계 조회 및 계산
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-25
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/statistics/metadata")
@RequiredArgsConstructor
public class StatisticsMetadataController extends BaseApiController {
    
    private final StatisticsMetadataService statisticsMetadataService;
    
    /**
     * 통계 값 계산 (메타데이터 기반)
     * POST /api/v1/statistics/calculate
     */
    @PostMapping("/calculate")
    public ResponseEntity<ApiResponse<Map<String, BigDecimal>>> calculateStatistics(
            @RequestBody StatisticsCalculationRequest request) {
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.<Map<String, BigDecimal>>builder()
                    .success(false)
                    .message("테넌트 정보가 없습니다.")
                    .data(null)
                    .build());
        }
        
        LocalDate date = request.getDate() != null ? request.getDate() : LocalDate.now();
        
        Map<String, BigDecimal> results = new HashMap<>();
        
        for (String statisticCode : request.getStatisticCodes()) {
            try {
                BigDecimal value = statisticsMetadataService.calculateStatistic(
                    tenantId, 
                    statisticCode, 
                    date, 
                    request.getParams() != null ? request.getParams() : Map.of()
                );
                
                results.put(statisticCode, value);
            } catch (Exception e) {
                log.error("통계 계산 실패: code={}", statisticCode, e);
                results.put(statisticCode, BigDecimal.ZERO);
            }
        }
        
        return success(results);
    }
    
    /**
     * 통계 정의 목록 조회
     * GET /api/v1/statistics/definitions
     */
    @GetMapping("/definitions")
    public ResponseEntity<ApiResponse<List<StatisticsDefinitionResponse>>> getStatisticsDefinitions(
            @RequestParam(required = false) String category) {
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.<List<StatisticsDefinitionResponse>>builder()
                    .success(false)
                    .message("테넌트 정보가 없습니다.")
                    .data(null)
                    .build());
        }
        
        List<StatisticsDefinition> definitions = 
            statisticsMetadataService.getStatisticsDefinitions(tenantId, category);
        
        List<StatisticsDefinitionResponse> responses = definitions.stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
        
        return success(responses);
    }
    
    /**
     * 단일 통계 값 조회
     * GET /api/v1/statistics/{statisticCode}
     */
    @GetMapping("/{statisticCode}")
    public ResponseEntity<ApiResponse<BigDecimal>> getStatisticValue(
            @PathVariable String statisticCode,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.<BigDecimal>builder()
                    .success(false)
                    .message("테넌트 정보가 없습니다.")
                    .data(null)
                    .build());
        }
        
        LocalDate calculationDate = date != null ? date : LocalDate.now();
        
        try {
            BigDecimal value = statisticsMetadataService.calculateStatistic(
                tenantId, 
                statisticCode, 
                calculationDate, 
                Map.of()
            );
            
            return success(value);
        } catch (Exception e) {
            log.error("통계 조회 실패: code={}", statisticCode, e);
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.<BigDecimal>builder()
                    .success(false)
                    .message("통계 조회 실패: " + e.getMessage())
                    .data(null)
                    .build());
        }
    }
    
    /**
     * 통계 생성 이력 조회
     * GET /api/v1/statistics/{statisticCode}/logs
     */
    @GetMapping("/{statisticCode}/logs")
    public ResponseEntity<ApiResponse<List<StatisticsGenerationLogResponse>>> getGenerationLogs(
            @PathVariable String statisticCode,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.<List<StatisticsGenerationLogResponse>>builder()
                    .success(false)
                    .message("테넌트 정보가 없습니다.")
                    .data(null)
                    .build());
        }
        
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(7);
        LocalDate end = endDate != null ? endDate : LocalDate.now();
        
        List<com.coresolution.core.domain.statistics.StatisticsGenerationLog> logs = 
            statisticsMetadataService.getGenerationLogs(tenantId, statisticCode, start, end);
        
        List<StatisticsGenerationLogResponse> responses = logs.stream()
            .map(this::toLogResponse)
            .collect(Collectors.toList());
        
        return success(responses);
    }
    
    // DTO 변환 메서드
    private StatisticsDefinitionResponse toResponse(StatisticsDefinition definition) {
        return StatisticsDefinitionResponse.builder()
            .id(definition.getId())
            .statisticCode(definition.getStatisticCode())
            .statisticNameKo(definition.getStatisticNameKo())
            .statisticNameEn(definition.getStatisticNameEn())
            .category(definition.getCategory() != null ? definition.getCategory().name() : null)
            .calculationType(definition.getCalculationType() != null ? definition.getCalculationType().name() : null)
            .dataSourceType(definition.getDataSourceType() != null ? definition.getDataSourceType().name() : null)
            .aggregationPeriod(definition.getAggregationPeriod() != null ? definition.getAggregationPeriod().name() : null)
            .isActive(definition.getIsActive())
            .displayOrder(definition.getDisplayOrder())
            .description(definition.getDescription())
            .build();
    }
    
    private StatisticsGenerationLogResponse toLogResponse(com.coresolution.core.domain.statistics.StatisticsGenerationLog log) {
        return StatisticsGenerationLogResponse.builder()
            .id(log.getId())
            .statisticCode(log.getStatisticCode())
            .generationDate(log.getGenerationDate())
            .calculatedValue(log.getCalculatedValue())
            .calculationTimeMs(log.getCalculationTimeMs())
            .status(log.getStatus() != null ? log.getStatus().name() : null)
            .errorMessage(log.getErrorMessage())
            .createdAt(log.getCreatedAt())
            .build();
    }
    
    // DTO 클래스들
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class StatisticsCalculationRequest {
        private List<String> statisticCodes;
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        private LocalDate date;
        private Map<String, Object> params;
    }
    
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class StatisticsDefinitionResponse {
        private Long id;
        private String statisticCode;
        private String statisticNameKo;
        private String statisticNameEn;
        private String category;
        private String calculationType;
        private String dataSourceType;
        private String aggregationPeriod;
        private Boolean isActive;
        private Integer displayOrder;
        private String description;
    }
    
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class StatisticsGenerationLogResponse {
        private Long id;
        private String statisticCode;
        private LocalDate generationDate;
        private BigDecimal calculatedValue;
        private Integer calculationTimeMs;
        private String status;
        private String errorMessage;
        private java.time.LocalDateTime createdAt;
    }
}

