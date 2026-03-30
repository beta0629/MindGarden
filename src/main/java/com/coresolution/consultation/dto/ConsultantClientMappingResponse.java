package com.coresolution.consultation.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 상담사-내담자 매핑 응답 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-11-20
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultantClientMappingResponse {
    
    private Long id;
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
    
    // 매핑 타입
    private String mappingType; // "NEW", "EXTENSION", "TRANSFER"
    private String paymentConfirmationNote;
    
    /**
     * ConsultantClientMapping 엔티티로부터 변환
     * 
     * @param mapping ConsultantClientMapping 엔티티
     * @return ConsultantClientMappingResponse
     */
    public static ConsultantClientMappingResponse fromEntity(ConsultantClientMapping mapping) {
        if (mapping == null) {
            return null;
        }
        
        return ConsultantClientMappingResponse.builder()
            .id(mapping.getId())
            .consultantId(mapping.getConsultant() != null ? mapping.getConsultant().getId() : null)
            .clientId(mapping.getClient() != null ? mapping.getClient().getId() : null)
            .startDate(mapping.getStartDate() != null ? mapping.getStartDate().toLocalDate() : null)
            .endDate(mapping.getEndDate() != null ? mapping.getEndDate().toLocalDate() : null)
            .status(mapping.getStatus() != null ? mapping.getStatus().toString() : null)
            .notes(mapping.getNotes())
            .responsibility(mapping.getResponsibility())
            .specialConsiderations(mapping.getSpecialConsiderations())
            .assignedBy(mapping.getAssignedBy())
            .paymentStatus(mapping.getPaymentStatus() != null ? mapping.getPaymentStatus().toString() : null)
            .totalSessions(mapping.getTotalSessions())
            .remainingSessions(mapping.getRemainingSessions())
            .packageName(mapping.getPackageName())
            .packagePrice(mapping.getPackagePrice())
            .paymentAmount(mapping.getPaymentAmount())
            .paymentMethod(mapping.getPaymentMethod())
            .paymentReference(mapping.getPaymentReference())
            .paymentDate(mapping.getPaymentDate())
            .adminApprovalDate(mapping.getAdminApprovalDate())
            .approvedBy(mapping.getApprovedBy())
            .build();
    }
    
    /**
     * ConsultantClientMappingDto로부터 변환 (하위 호환성)
     * 
     * <p><b>주의:</b> 이 메서드는 deprecated된 ConsultantClientMappingDto를 사용하므로 
     * 컴파일 경고가 발생할 수 있습니다. 하위 호환성을 위해 제공되며, 
     * 새로운 코드에서는 사용하지 마세요.</p>
     * 
     * @param dto ConsultantClientMappingDto (deprecated)
     * @return ConsultantClientMappingResponse
     * @deprecated 하위 호환성을 위해 제공되며, 새로운 코드에서는 사용하지 마세요.
     */
    @Deprecated
    public static ConsultantClientMappingResponse fromDto(ConsultantClientMappingDto dto) {
        if (dto == null) {
            return null;
        }
        
        return ConsultantClientMappingResponse.builder()
            .consultantId(dto.getConsultantId())
            .clientId(dto.getClientId())
            .startDate(dto.getStartDate())
            .endDate(dto.getEndDate())
            .status(dto.getStatus())
            .notes(dto.getNotes())
            .responsibility(dto.getResponsibility())
            .specialConsiderations(dto.getSpecialConsiderations())
            .assignedBy(dto.getAssignedBy())
            .paymentStatus(dto.getPaymentStatus())
            .totalSessions(dto.getTotalSessions())
            .remainingSessions(dto.getRemainingSessions())
            .packageName(dto.getPackageName())
            .packagePrice(dto.getPackagePrice())
            .paymentAmount(dto.getPaymentAmount())
            .paymentMethod(dto.getPaymentMethod())
            .paymentReference(dto.getPaymentReference())
            .paymentDate(dto.getPaymentDate())
            .adminApprovalDate(dto.getAdminApprovalDate())
            .approvedBy(dto.getApprovedBy())
            .mappingType(dto.getMappingType())
            .paymentConfirmationNote(dto.getPaymentConfirmationNote())
            .build();
    }
}

