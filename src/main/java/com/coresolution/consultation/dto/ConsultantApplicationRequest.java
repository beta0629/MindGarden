package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 상담사 신청 요청 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsultantApplicationRequest {
    
    /**
     * 상담사 신청 사유
     */
    private String applicationReason;
    
    /**
     * 관련 경험 또는 자격
     */
    private String experience;
    
    /**
     * 보유 자격증
     */
    private String certifications;
    
    /**
     * 전문 분야
     */
    private String specialty;
    
    /**
     * 자기소개
     */
    private String introduction;
    
    /**
     * 연락처 (추가)
     */
    private String contactInfo;
    
    /**
     * 희망 상담 시간
     */
    private String preferredHours;
    
    /**
     * 추가 메모
     */
    private String additionalNotes;
}
