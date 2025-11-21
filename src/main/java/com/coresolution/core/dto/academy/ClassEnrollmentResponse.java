package com.coresolution.core.dto.academy;

import com.coresolution.core.domain.academy.ClassEnrollment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 수강 등록 응답 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-18
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassEnrollmentResponse {
    
    private String enrollmentId;
    private String tenantId;
    private Long branchId;
    private String classId;
    private Long consumerId;
    private LocalDate enrollmentDate;
    private LocalDate startDate;
    private LocalDate endDate;
    private String tuitionPlanId;
    private BigDecimal tuitionAmount;
    private ClassEnrollment.PaymentStatus paymentStatus;
    private ClassEnrollment.EnrollmentStatus status;
    private Boolean isActive;
    private String notes;
    private String settingsJson;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

