package com.coresolution.consultation.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 상담사-내담자 매핑 DTO
 * 
 * @deprecated Use ConsultantClientMappingResponse, ConsultantClientMappingCreateRequest instead.
 * This class will be removed in version 2.0.0
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Deprecated
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultantClientMappingDto {
    private Long consultantId;
    private Long clientId;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private String notes;
    private String responsibility;
    private String specialConsiderations;
    private String assignedBy;
    
    // 입금 승인 시스템 관련 필드
    private String paymentStatus;
    private Integer totalSessions;
    private Integer remainingSessions;
    private String packageName;
    private Long packagePrice;
    private Long paymentAmount;
    private String paymentMethod;
    private String paymentReference;
    private LocalDateTime paymentDate;
    private LocalDateTime adminApprovalDate;
    private String approvedBy;
    
    // 매핑 생성 시 필요한 정보
    private String mappingType; // "NEW", "EXTENSION", "TRANSFER"
    private String paymentConfirmationNote; // 입금 확인 메모
}
