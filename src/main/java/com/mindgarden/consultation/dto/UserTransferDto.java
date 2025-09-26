package com.mindgarden.consultation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 사용자 지점 이동 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserTransferDto {
    
    @NotEmpty(message = "이동할 사용자 ID 목록은 필수입니다")
    private List<Long> userIds;
    
    @NotBlank(message = "대상 지점 코드는 필수입니다")
    private String targetBranchCode;
    
    private String reason;
    
    // 추가 정보 (선택적)
    private String transferType; // BULK, INDIVIDUAL
    private String requestedBy; // 요청자 ID
    private String notes; // 추가 메모
}
