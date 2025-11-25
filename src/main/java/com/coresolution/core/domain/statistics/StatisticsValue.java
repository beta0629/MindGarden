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
import java.time.LocalDateTime;

/**
 * 통계 값 캐시 엔티티
 * 성능 최적화를 위한 통계 값 캐시
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-25
 */
@Entity
@Table(name = "statistics_values", indexes = {
    @Index(name = "idx_tenant_code_date", columnList = "tenant_id,statistic_code,calculation_date"),
    @Index(name = "idx_expires", columnList = "expires_at")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_tenant_code_date", columnNames = {"tenant_id", "statistic_code", "calculation_date"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class StatisticsValue extends BaseEntity {
    
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
     * 계산 날짜
     */
    @NotNull(message = "계산 날짜는 필수입니다")
    @Column(name = "calculation_date", nullable = false)
    private LocalDate calculationDate;
    
    /**
     * 계산된 값
     */
    @NotNull(message = "계산된 값은 필수입니다")
    @Column(name = "calculated_value", nullable = false, precision = 20, scale = 2)
    private BigDecimal calculatedValue;
    
    /**
     * 추가 메타데이터 (JSON)
     */
    @Column(name = "metadata", columnDefinition = "JSON")
    private String metadata; // JSON 문자열
    
    /**
     * 캐시 만료 시간
     */
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
    
    /**
     * 캐시가 만료되었는지 확인
     */
    public boolean isExpired() {
        if (expiresAt == null) {
            return false; // 만료 시간이 없으면 영구 캐시
        }
        return LocalDateTime.now().isAfter(expiresAt);
    }
}


