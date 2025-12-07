package com.coresolution.consultation.dto;

import com.coresolution.consultation.constant.UserRole;
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
        /**
         * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨
         */
        @Deprecated        private Long branchId;
        private String branchName;
        /**
         * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨
         */
        @Deprecated        private String branchCode;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    /**
     * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨
     */
    @Deprecated    @AllArgsConstructor
    public static class BranchInfo {
        private Long id;
        /**
         * @Deprecated - 표준화 2025-12-07: 브랜치 개념 제거됨
         * 레거시 데이터 호환을 위해 필드 유지 (NULL 허용)
         */
        @Deprecated        private String branchCode;
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
