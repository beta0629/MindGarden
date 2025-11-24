package com.coresolution.core.dto.academy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * 학원 상담 예약 응답 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AcademyConsultationResponse {
    
    /** 상담 ID */
    private Long consultationId;
    
    /** 내담자(학생/학부모) ID */
    private Long clientId;
    
    /** 상담사(강사/직원) ID */
    private Long consultantId;
    
    /** 상담 날짜 */
    private LocalDate consultationDate;
    
    /** 상담 시작 시간 */
    private LocalTime startTime;
    
    /** 상담 종료 시간 */
    private LocalTime endTime;
    
    /** 상담 상태 */
    private String status;
    
    /** 상담 방법 */
    private String consultationMethod;
    
    /** 우선순위 */
    private String priority;
    
    /** 위험도 */
    private String riskLevel;
    
    /** 긴급 여부 */
    private Boolean isEmergency;
    
    /** 첫 상담 여부 */
    private Boolean isFirstSession;
    
    /** 상담 메모 */
    private String notes;
    
    /** 생성 일시 */
    private LocalDateTime createdAt;
    
    /** 수정 일시 */
    private LocalDateTime updatedAt;
}

