package com.coresolution.consultation.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import com.coresolution.consultation.service.support.MergedPackageDisplayResolver.MergedPackageDisplay;
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
    /** 추가 패키지 병합 시 원 상품 + 병합 상품을 조합한 UI 표시명 (로직 입력용 packageName은 불변). */
    private String displayPackageName;
    /** 병합된 추가 패키지명 목록 (병합 순, 없으면 빈 리스트). */
    private List<String> mergedPackageNames;
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
     * 옵션 B 결제 방식 의도 (ADVANCE / SAME_DAY_CARD / null).
     * 사이드바 카드의 액션 분기와 드래그 허용 여부를 결정하는 데 사용된다.
     */
    private String paymentTiming;

    /** 단건 상세 전용: 복호화된 상담사 이름 (목록 응답에서는 null). */
    private String consultantName;

    /** 단건 상세 전용: 복호화된 내담자 이름 (목록 응답에서는 null). */
    private String clientName;

    private LocalDateTime assignedAt;
    private LocalDateTime createdAt;
    
    /**
     * ConsultantClientMapping 엔티티로부터 변환
     * 
     * @param mapping ConsultantClientMapping 엔티티
     * @return ConsultantClientMappingResponse
     */

    /**
     * 파생 병합 패키지 표시 정보를 적용한다. ({@code packageName} 은 유지)
     *
     * @param display 파생 표시 정보
     */
    public void applyMergedPackageDisplay(MergedPackageDisplay display) {
        if (display == null) {
            return;
        }
        this.displayPackageName = display.displayPackageName();
        this.mergedPackageNames = display.mergedPackageNames() != null
                ? display.mergedPackageNames()
                : Collections.emptyList();
    }

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
            .displayPackageName(mapping.getPackageName())
            .mergedPackageNames(Collections.emptyList())
            .packagePrice(mapping.getPackagePrice())
            .paymentAmount(mapping.getPaymentAmount())
            .paymentMethod(mapping.getPaymentMethod())
            .paymentReference(mapping.getPaymentReference())
            .paymentDate(mapping.getPaymentDate())
            .adminApprovalDate(mapping.getAdminApprovalDate())
            .approvedBy(mapping.getApprovedBy())
            .paymentTiming(mapping.getPaymentTiming())
            .assignedAt(mapping.getAssignedAt())
            .createdAt(mapping.getCreatedAt())
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
            .displayPackageName(dto.getPackageName())
            .mergedPackageNames(Collections.emptyList())
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

