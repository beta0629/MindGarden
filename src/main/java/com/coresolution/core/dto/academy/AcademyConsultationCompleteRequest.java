package com.coresolution.core.dto.academy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 학원 상담 완료 요청 DTO
 * 상담 완료 시 상담 기록 및 수강 등록 연계 정보 포함
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AcademyConsultationCompleteRequest {
    
    /** 상담 메모 */
    private String notes;
    
    /** 평가 점수 (1-5) */
    private Integer rating;
    
    /** 상담 기록 생성 여부 */
    private Boolean createRecord;
    
    /** 수강 등록 생성 여부 */
    private Boolean createEnrollment;
    
    /** 수강 등록 정보 (createEnrollment이 true인 경우 필수) */
    private EnrollmentFromConsultationRequest enrollmentInfo;
    
    /**
     * 수강 등록 정보 (상담 완료 후 수강 등록 생성용)
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EnrollmentFromConsultationRequest {
        /** 반 ID */
        private String classId;
        
        /** 브랜치 ID */
        private Long branchId;
        
        /** 수강 시작일 */
        private java.time.LocalDate startDate;
        
        /** 수강 종료일 */
        private java.time.LocalDate endDate;
        
        /** 수강료 계획 ID */
        private String tuitionPlanId;
        
        /** 수강료 금액 */
        private java.math.BigDecimal tuitionAmount;
        
        /** 메모 */
        private String notes;
    }
}

