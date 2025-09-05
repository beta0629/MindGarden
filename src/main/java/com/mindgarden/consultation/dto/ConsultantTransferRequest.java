package com.mindgarden.consultation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 상담사 변경 요청 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-04
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultantTransferRequest {
    
    @NotNull(message = "기존 매핑 ID는 필수입니다.")
    private Long currentMappingId;
    
    @NotNull(message = "새 상담사 ID는 필수입니다.")
    private Long newConsultantId;
    
    @NotBlank(message = "변경 사유는 필수입니다.")
    @Size(max = 500, message = "변경 사유는 500자 이하여야 합니다.")
    private String transferReason;
    
    @Size(max = 1000, message = "특별 고려사항은 1000자 이하여야 합니다.")
    private String specialConsiderations;
    
    private String transferredBy; // 변경 처리자 (관리자)
    
    // 회기수 관련 설정 (기본값: 기존 매핑의 남은 회기수 유지)
    private Integer totalSessions;
    private Integer remainingSessions;
    private String packageName;
    private Long packagePrice;
}
