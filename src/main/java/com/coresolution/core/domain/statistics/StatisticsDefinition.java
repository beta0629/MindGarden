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

/**
 * 통계 정의 엔티티
 * 하드코딩 없이 메타데이터 기반으로 통계를 관리
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-25
 */
@Entity
@Table(name = "statistics_definitions", indexes = {
    @Index(name = "idx_tenant_code", columnList = "tenant_id,statistic_code"),
    @Index(name = "idx_category", columnList = "category"),
    @Index(name = "idx_active", columnList = "is_active"),
    @Index(name = "idx_tenant_category", columnList = "tenant_id,category")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_tenant_statistic_code", columnNames = {"tenant_id", "statistic_code"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class StatisticsDefinition extends BaseEntity {
    
    /**
     * 통계 카테고리
     */
    public enum Category {
        SCHEDULE("스케줄"),
        CONSULTANT("상담사"),
        CLIENT("내담자"),
        REVENUE("수익"),
        MAPPING("매칭"),
        ERP("ERP"),
        SYSTEM("시스템");
        
        private final String description;
        
        Category(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 계산 타입
     */
    public enum CalculationType {
        COUNT("개수"),
        SUM("합계"),
        AVG("평균"),
        MIN("최소값"),
        MAX("최대값"),
        CUSTOM("커스텀");
        
        private final String description;
        
        CalculationType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 데이터 소스 타입
     */
    public enum DataSourceType {
        SCHEDULE("스케줄"),
        MAPPING("매칭"),
        CONSULTATION("상담"),
        USER("사용자"),
        ERP("ERP"),
        RATING("평점");
        
        private final String description;
        
        DataSourceType(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 집계 기간
     */
    public enum AggregationPeriod {
        DAILY("일별"),
        WEEKLY("주별"),
        MONTHLY("월별"),
        YEARLY("연별"),
        REALTIME("실시간");
        
        private final String description;
        
        AggregationPeriod(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 테넌트 ID (NULL이면 시스템 기본 통계)
     */
    @Column(name = "tenant_id", length = 36)
    private String tenantId;
    
    /**
     * 통계 코드 (예: TOTAL_CONSULTATIONS_TODAY)
     */
    @NotBlank(message = "통계 코드는 필수입니다")
    @Column(name = "statistic_code", nullable = false, length = 100)
    private String statisticCode;
    
    /**
     * 통계 이름 (한글)
     */
    @NotBlank(message = "통계 이름은 필수입니다")
    @Column(name = "statistic_name_ko", nullable = false, length = 200)
    private String statisticNameKo;
    
    /**
     * 통계 이름 (영문)
     */
    @Column(name = "statistic_name_en", length = 200)
    private String statisticNameEn;
    
    /**
     * 카테고리
     */
    @NotNull(message = "카테고리는 필수입니다")
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    private Category category;
    
    /**
     * 계산 타입
     */
    @NotNull(message = "계산 타입은 필수입니다")
    @Enumerated(EnumType.STRING)
    @Column(name = "calculation_type", nullable = false, length = 50)
    private CalculationType calculationType;
    
    /**
     * 데이터 소스 타입
     */
    @NotNull(message = "데이터 소스 타입은 필수입니다")
    @Enumerated(EnumType.STRING)
    @Column(name = "data_source_type", nullable = false, length = 50)
    private DataSourceType dataSourceType;
    
    /**
     * 계산 규칙 (JSON 메타데이터)
     */
    @NotNull(message = "계산 규칙은 필수입니다")
    @Column(name = "calculation_rule", nullable = false, columnDefinition = "JSON")
    private String calculationRule; // JSON 문자열
    
    /**
     * 집계 기간
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "aggregation_period", length = 20)
    @Builder.Default
    private AggregationPeriod aggregationPeriod = AggregationPeriod.DAILY;
    
    /**
     * 활성화 여부
     */
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
    
    /**
     * 표시 순서
     */
    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;
    
    /**
     * 설명
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    /**
     * 생성자
     */
    @Column(name = "created_by", length = 100)
    private String createdBy;
    
    /**
     * 수정자
     */
    @Column(name = "updated_by", length = 100)
    private String updatedBy;
}


