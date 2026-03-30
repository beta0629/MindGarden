package com.coresolution.consultation.dto;

import java.util.List;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 지점 정보 DTO
 * 
 * @deprecated Use BranchResponse, BranchCreateRequest, BranchUpdateRequest instead. 
 * This class will be removed in version 2.0.0
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
@Deprecated
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BranchDto {
    
    private Long id;
    
    @NotBlank(message = "지점명은 필수입니다")
    private String name;
    
    @NotBlank(message = "지점 코드는 필수입니다")
    @Pattern(regexp = "^[A-Z0-9_]{2,20}$", message = "지점 코드는 대문자, 숫자, 언더스코어만 사용 가능하며 2-20자여야 합니다")
    private String code;
    
    private String address;
    
    @Pattern(regexp = "^\\d{2,3}-\\d{3,4}-\\d{4}$", message = "전화번호 형식이 올바르지 않습니다")
    private String phone;
    
    @Email(message = "이메일 형식이 올바르지 않습니다")
    private String email;
    
    private String description;
    
    @NotNull(message = "활성 상태는 필수입니다")
    private Boolean isActive;
    
    private String managerId;
    
    private String managerName;
    
    // 운영 시간 정보
    private OperatingHoursDto operatingHours;
    
    private String timezone;
    
    // 통계 정보 (조회 시에만 사용)
    private Integer userCount;
    private Integer consultantCount;
    private Integer clientCount;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OperatingHoursDto {
        private String startTime;
        private String endTime;
        private List<String> workingDays;
    }
}
