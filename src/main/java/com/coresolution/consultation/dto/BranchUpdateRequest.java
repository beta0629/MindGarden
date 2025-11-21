package com.coresolution.consultation.dto;

import java.time.LocalTime;
import com.coresolution.consultation.entity.Branch;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 지점 수정 요청 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-12
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BranchUpdateRequest {
    
    @Size(max = 100, message = "지점명은 100자 이하여야 합니다")
    private String branchName;
    
    private Branch.BranchType branchType;
    
    @Pattern(regexp = "^\\d{5}$", message = "우편번호는 5자리 숫자여야 합니다")
    private String postalCode;
    
    @Size(max = 200, message = "주소는 200자 이하여야 합니다")
    private String address;
    
    @Size(max = 100, message = "상세 주소는 100자 이하여야 합니다")
    private String addressDetail;
    
    @Pattern(regexp = "^\\d{2,3}-\\d{3,4}-\\d{4}$", message = "올바른 전화번호 형식이 아닙니다")
    private String phoneNumber;
    
    @Pattern(regexp = "^\\d{2,3}-\\d{3,4}-\\d{4}$", message = "올바른 팩스번호 형식이 아닙니다")
    private String faxNumber;
    
    @Email(message = "올바른 이메일 형식이 아닙니다")
    @Size(max = 100, message = "이메일은 100자 이하여야 합니다")
    private String email;
    
    private LocalTime operatingStartTime;
    
    private LocalTime operatingEndTime;
    
    private String closedDays;
    
    private Long managerId;
    
    private Integer maxConsultants;
    
    private Integer maxClients;
    
    @Size(max = 1000, message = "지점 설명은 1000자 이하여야 합니다")
    private String description;
    
    @Size(max = 500, message = "로고 URL은 500자 이하여야 합니다")
    private String logoUrl;
    
    @Size(max = 200, message = "웹사이트 URL은 200자 이하여야 합니다")
    private String websiteUrl;
}
