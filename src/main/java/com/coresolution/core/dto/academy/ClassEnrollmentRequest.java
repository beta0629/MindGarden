package com.coresolution.core.dto.academy;

import com.coresolution.core.domain.academy.ClassEnrollment;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 수강 등록 생성/수정 요청 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-18
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassEnrollmentRequest {
    
    /**
     * 지점 ID
     */
    @NotNull(message = "지점 ID는 필수입니다")
    private Long branchId;
    
    /**
     * 반 ID
     */
    @NotBlank(message = "반 ID는 필수입니다")
    @Size(max = 36, message = "반 ID는 36자 이하여야 합니다")
    private String classId;
    
    /**
     * 수강생 ID
     */
    private Long consumerId;
    
    /**
     * 등록일
     */
    @NotNull(message = "등록일은 필수입니다")
    private LocalDate enrollmentDate;
    
    /**
     * 수강 시작일
     */
    private LocalDate startDate;
    
    /**
     * 수강 종료일
     */
    private LocalDate endDate;
    
    /**
     * 수강료 플랜 ID
     */
    @Size(max = 36, message = "수강료 플랜 ID는 36자 이하여야 합니다")
    private String tuitionPlanId;
    
    /**
     * 수강료 금액
     */
    private BigDecimal tuitionAmount;
    
    /**
     * 결제 상태
     */
    private ClassEnrollment.PaymentStatus paymentStatus;
    
    /**
     * 수강 상태
     */
    private ClassEnrollment.EnrollmentStatus status;
    
    /**
     * 비고
     */
    private String notes;
    
    /**
     * 수강별 설정 (JSON)
     */
    private String settingsJson;
}

