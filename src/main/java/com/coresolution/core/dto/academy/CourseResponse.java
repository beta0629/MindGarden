package com.coresolution.core.dto.academy;

import com.coresolution.core.domain.academy.Course;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 강좌 응답 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-18
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseResponse {
    
    private String courseId;
    private String tenantId;
    private Long branchId;
    private String name;
    private String nameKo;
    private String nameEn;
    private String description;
    private String descriptionKo;
    private String descriptionEn;
    private String category;
    private String level;
    private String subject;
    private Course.PricingPolicy pricingPolicy;
    private BigDecimal basePrice;
    private String currency;
    private String pricingDetailsJson;
    private Integer durationMonths;
    private Integer totalSessions;
    private Integer sessionDurationMinutes;
    private Boolean isActive;
    private Integer displayOrder;
    private String metadataJson;
    private String settingsJson;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

