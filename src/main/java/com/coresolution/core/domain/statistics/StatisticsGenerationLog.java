package com.coresolution.core.domain.statistics;

import com.coresolution.consultation.entity.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 통계 생성 이력 엔티티
 * 통계 계산 이력을 추적하여 디버깅 및 감사 목적으로 사용
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-25
 */
@Entity
@Table(name = "statistics_generation_logs", indexes = {
    @Index(name = "idx_tenant_date", columnList = "tenant_id,generation_date"),
    @Index(name = "idx_statistic", columnList = "statistic_code,generation_date"),
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_tenant_statistic_date", columnList = "tenant_id,statistic_code,generation_date")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class StatisticsGenerationLog extends BaseEntity {
    
    /**
     * 생성 상태
     */
    public enum GenerationStatus {
        SUCCESS("성공"),
        FAILED("실패"),
        PARTIAL("부분 성공");
        
        private final String description;
        
        GenerationStatus(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 테넌트 ID
     */
    @NotBlank(message = "테넌트 ID는 필수입니다")
    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;
    
    /**
     * 통계 코드
     */
    @NotBlank(message = "통계 코드는 필수입니다")
    @Column(name = "statistic_code", nullable = false, length = 100)
    private String statisticCode;
    
    /**
     * 생성 날짜
     */
    @NotNull(message = "생성 날짜는 필수입니다")
    @Column(name = "generation_date", nullable = false)
    private LocalDate generationDate;
    
    /**
     * 기간 시작일
     */
    @Column(name = "period_start")
    private LocalDate periodStart;
    
    /**
     * 기간 종료일
     */
    @Column(name = "period_end")
    private LocalDate periodEnd;
    
    /**
     * 계산된 값
     */
    @Column(name = "calculated_value", precision = 20, scale = 2)
    private BigDecimal calculatedValue;
    
    /**
     * 원본 데이터 (JSON)
     */
    @Column(name = "raw_data", columnDefinition = "JSON")
    private String rawData; // JSON 문자열
    
    /**
     * 계산 소요 시간 (밀리초)
     */
    @Column(name = "calculation_time_ms")
    private Integer calculationTimeMs;
    
    /**
     * 상태
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    @Builder.Default
    private GenerationStatus status = GenerationStatus.SUCCESS;
    
    /**
     * 에러 메시지
     */
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
}


