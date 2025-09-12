package com.mindgarden.consultation.dto;

import com.mindgarden.consultation.constant.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 지점별 로그인 응답 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-12
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BranchLoginResponse {
    
    private boolean success;
    private String message;
    private String sessionId;
    private UserInfo user;
    private BranchInfo branch;
    private boolean requiresConfirmation;
    private String responseType;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private Long id;
        private String username;
        private String email;
        private String name;
        private UserRole role;
        private String roleDescription;
        private Long branchId;
        private String branchName;
        private String branchCode;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BranchInfo {
        private Long id;
        private String branchCode;
        private String branchName;
        private String branchType;
        private String branchStatus;
        private String fullAddress;
        private String phoneNumber;
        private String managerName;
        private Integer consultantCount;
        private Integer clientCount;
        private Integer maxConsultants;
        private Integer maxClients;
    }
}
