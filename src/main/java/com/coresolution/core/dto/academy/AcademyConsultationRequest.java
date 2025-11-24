package com.coresolution.core.dto.academy;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * 학원 상담 예약 요청 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AcademyConsultationRequest {
    
    /** 내담자(학생/학부모) ID */
    @NotNull(message = "내담자 ID는 필수입니다.")
    private Long clientId;
    
    /** 상담사(강사/직원) ID */
    private Long consultantId;
    
    /** 상담 날짜 */
    @NotNull(message = "상담 날짜는 필수입니다.")
    private LocalDate consultationDate;
    
    /** 상담 시작 시간 */
    @NotNull(message = "상담 시작 시간은 필수입니다.")
    private LocalTime startTime;
    
    /** 상담 종료 시간 */
    @NotNull(message = "상담 종료 시간은 필수입니다.")
    private LocalTime endTime;
    
    /** 상담 방법 (ONLINE, OFFLINE) */
    private String consultationMethod;
    
    /** 우선순위 (HIGH, NORMAL, LOW) */
    private String priority;
    
    /** 위험도 (HIGH, MEDIUM, LOW) */
    private String riskLevel;
    
    /** 긴급 여부 */
    private Boolean isEmergency;
    
    /** 첫 상담 여부 */
    private Boolean isFirstSession;
    
    /** 상담 메모 */
    private String notes;
    
    /** 지점 코드 */
    private String branchCode;
    
    /** 브랜치 ID */
    private Long branchId;
}

