package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 사용자 정보 DTO
 * 
 * @deprecated Use UserResponse instead. This class will be removed in version 2.0.0
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Deprecated
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    
    /**
     * 사용자 ID
     */
    private Long id;
    
    /**
     * 사용자 이메일
     */
    private String email;
    
    /**
     * 사용자 이름
     */
    private String name;
    
    /**
     * 사용자 역할
     */
    private String role;
    
    /**
     * 사용자 등급
     */
    private String grade;
    
    /**
     * 테넌트 ID (필수 - 보안상 중요)
     * 
     * SECURITY_STANDARD.md, SESSION_STANDARD.md 참조
     * tenantId는 모든 사용자(내담자, 상담사, 관리자)에게 필수 값입니다.
     */
    private String tenantId;
    
    /**
     * 활성 상태
     */
    private Boolean isActive;
    
    /**
     * 이메일 인증 여부
     */
    private Boolean isEmailVerified;

    /**
     * ADMIN 계정 상담 겸직 여부 (users.counseling_enabled)
     */
    private Boolean counselingEnabled;

    /**
     * 가용 역할 목록 (예: ["ADMIN","CONSULTANT"])
     */
    private java.util.List<String> availableRoles;

    /**
     * 센터 운영(ADMIN/STAFF) 역할 보유 여부
     */
    private Boolean hasOperatorRole;

    /**
     * 상담사 역량 보유 여부
     */
    private Boolean hasCounselorRole;
}
