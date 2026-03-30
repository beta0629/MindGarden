package com.coresolution.consultation.dto;

import java.util.List;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 사용자 지점 이동 요청 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-11-20
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserTransferRequest {
    
    @NotEmpty(message = "이동할 사용자 ID 목록은 필수입니다.")
    private List<Long> userIds;
    
    @NotBlank(message = "대상 지점 코드는 필수입니다.")
    private String targetBranchCode;
    
    private String reason;
    
    // 추가 정보 (선택적)
    private String transferType; // BULK, INDIVIDUAL
    
    private String requestedBy; // 요청자 ID
    
    private String notes; // 추가 메모
    
    /**
     * UserTransferDto로부터 변환 (하위 호환성)
     * 
     * <p><b>주의:</b> 이 메서드는 deprecated된 UserTransferDto를 사용하므로 
     * 컴파일 경고가 발생할 수 있습니다. 하위 호환성을 위해 제공되며, 
     * 새로운 코드에서는 사용하지 마세요.</p>
     * 
     * @param dto UserTransferDto (deprecated)
     * @return UserTransferRequest
     * @deprecated 하위 호환성을 위해 제공되며, 새로운 코드에서는 사용하지 마세요.
     */
    @Deprecated
    public static UserTransferRequest fromDto(UserTransferDto dto) {
        if (dto == null) {
            return null;
        }
        
        return UserTransferRequest.builder()
            .userIds(dto.getUserIds())
            .targetBranchCode(dto.getTargetBranchCode())
            .reason(dto.getReason())
            .transferType(dto.getTransferType())
            .requestedBy(dto.getRequestedBy())
            .notes(dto.getNotes())
            .build();
    }
}

