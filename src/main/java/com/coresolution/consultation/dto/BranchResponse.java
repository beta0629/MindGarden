package com.coresolution.consultation.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import com.coresolution.consultation.entity.Branch;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 지점 응답 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-12
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BranchResponse {
    
    private Long id;
    
    private String branchCode;
    
    private String branchName;
    
    private Branch.BranchType branchType;
    
    private String branchTypeDescription;
    
    private Branch.BranchStatus branchStatus;
    
    private String branchStatusDescription;
    
    private String postalCode;
    
    private String address;
    
    private String addressDetail;
    
    private String fullAddress;
    
    private String phoneNumber;
    
    private String faxNumber;
    
    private String email;
    
    private LocalDate openingDate;
    
    private LocalDate closingDate;
    
    private LocalTime operatingStartTime;
    
    private LocalTime operatingEndTime;
    
    private String operatingHours;
    
    private String closedDays;
    
    private Long managerId;
    
    private String managerName;
    
    private Long parentBranchId;
    
    private String parentBranchName;
    
    private List<BranchResponse> subBranches;
    
    private Integer maxConsultants;
    
    private Integer maxClients;
    
    private Integer currentConsultants;
    
    private Integer currentClients;
    
    private Double consultantUtilization;
    
    private Double clientUtilization;
    
    private String description;
    
    private String logoUrl;
    
    private String websiteUrl;
    
    private Boolean isActive;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    // === 편의 메서드 ===
    
    public String getBranchTypeDescription() {
        return branchType != null ? branchType.getDescription() : null;
    }
    
    public String getBranchStatusDescription() {
        return branchStatus != null ? branchStatus.getDescription() : null;
    }
}
