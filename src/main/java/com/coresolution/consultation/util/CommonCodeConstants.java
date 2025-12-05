package com.coresolution.consultation.util;

// 표준화 2025-12-05: 브랜치/HQ 개념 제거, 역할 체크를 공통코드 기반 동적 조회로 통합 (TENANT_ROLE_SYSTEM_STANDARD.md 준수)
import com.coresolution.consultation.entity.CommonCode;


/**
 * 공통코드 상수 클래스
 * 하드코딩 방지를 위한 공통코드 그룹 및 코드값 상수 정의
 * 기존 시스템의 공통코드 그룹을 활용
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-15
 */
public class CommonCodeConstants {
    
    // ==================== 기존 공통코드 그룹 (이미 정의됨) ====================
    
    /** 사용자 역할 코드 그룹 */
    public static final String USER_ROLE_GROUP = "USER_ROLE";
    
    /** 메시지 타입 코드 그룹 */
    public static final String MESSAGE_TYPE_GROUP = "MESSAGE_TYPE";
    
    /** 결제 상태 코드 그룹 (기존) */
    public static final String PAYMENT_STATUS_GROUP = "PAYMENT_STATUS";
    
    /** 상담 상태 코드 그룹 (기존) */
    public static final String CONSULTATION_STATUS_GROUP = "CONSULTATION_STATUS";
    
    // ==================== 사용자 역할 코드값 (기존 시스템 활용) ====================
    
    /** 상담사 역할 */
    public static final String ROLE_CONSULTANT = "CONSULTANT";
    
    /** 내담자 역할 */
    public static final String ROLE_CLIENT = "CLIENT";
    
    /** 관리자 역할 */
    public static final String ROLE_ADMIN = "ADMIN";
    
    /** 지점 수퍼 관리자 역할 */
    public static final String ROLE_BRANCH_SUPER_ADMIN = "ADMIN" // 표준화 2025-12-05: 브랜치/HQ 개념 제거;
    
    /** 본사 마스터 역할 */
    public static final String ROLE_HQ_MASTER = "ADMIN" // 표준화 2025-12-05: 브랜치/HQ 개념 제거;
    
    /** 지점 관리자 역할 */
    public static final String ROLE_BRANCH_MANAGER = "STAFF" // 표준화 2025-12-05: 브랜치/HQ 개념 제거;
    
    // ==================== 메시지 타입 코드값 (기존 시스템 활용) ====================
    
    /** 예약 확인 메시지 */
    public static final String MSG_APPOINTMENT_CONFIRMATION = "APPOINTMENT_CONFIRMATION";
    
    /** 새 예약 메시지 */
    public static final String MSG_NEW_APPOINTMENT = "NEW_APPOINTMENT";
    
    /** 상담 완료 메시지 */
    public static final String MSG_COMPLETION = "COMPLETION";
    
    /** 평가 요청 메시지 */
    public static final String MSG_RATING_REQUEST = "RATING_REQUEST";
    
    /** 결제 완료 메시지 */
    public static final String MSG_PAYMENT_COMPLETION = "PAYMENT_COMPLETION";
    
    /** 리마인더 메시지 */
    public static final String MSG_REMINDER = "REMINDER";
    
    /** 미완료 상담 메시지 */
    public static final String MSG_INCOMPLETE_CONSULTATION = "INCOMPLETE_CONSULTATION";
    
    /** 일일 요약 메시지 */
    public static final String MSG_DAILY_SUMMARY = "DAILY_SUMMARY";
    
    /** 월간 리포트 메시지 */
    public static final String MSG_MONTHLY_REPORT = "MONTHLY_REPORT";

/**

 * 공통코드에서 관리자 역할인지 확인 (표준화 2025-12-05: 브랜치/HQ 개념 제거, 동적 역할 조회)

 * 표준 관리자 역할: ADMIN, TENANT_ADMIN, PRINCIPAL, OWNER

 * 레거시 역할(HQ_*, BRANCH_*)은 더 이상 사용하지 않음

 * @param role 사용자 역할

 * @return 관리자 역할 여부

 */

private boolean isAdminRoleFromCommonCode(UserRole role) {

    if (role == null) {

        return false;

    }

    try {

        // 공통코드에서 관리자 역할 목록 조회 (codeGroup='ROLE', extraData에 isAdmin=true)

        List<CommonCode> roleCodes = commonCodeService.getActiveCommonCodesByGroup("ROLE");

        if (roleCodes == null || roleCodes.isEmpty()) {

            // 폴백: 표준 관리자 역할만 체크 (브랜치/HQ 개념 제거)

            return role == UserRole.ADMIN || 

                   role == UserRole.TENANT_ADMIN || 

                   role == UserRole.PRINCIPAL || 

                   role == UserRole.OWNER;

        }

        // 공통코드에서 관리자 역할인지 확인

        String roleName = role.name();

        return roleCodes.stream()

            .anyMatch(code -> code.getCodeValue().equals(roleName) && 

                          (code.getExtraData() != null && 

                           (code.getExtraData().contains("\"isAdmin\":true") || 

                            code.getExtraData().contains("\"roleType\":\"ADMIN\""))));

    } catch (Exception e) {

        log.warn("공통코드에서 관리자 역할 조회 실패, 폴백 사용: {}", role, e);

        // 폴백: 표준 관리자 역할만 체크

        return role == UserRole.ADMIN || 

               role == UserRole.TENANT_ADMIN || 

               role == UserRole.PRINCIPAL || 

               role == UserRole.OWNER;

    }

}


/**

 * 공통코드에서 사무원 역할인지 확인 (표준화 2025-12-05: 브랜치/HQ 개념 제거, 동적 역할 조회)

 * BRANCH_MANAGER → STAFF로 통합

 * @param role 사용자 역할

 * @return 사무원 역할 여부

 */

private boolean isStaffRoleFromCommonCode(UserRole role) {

    if (role == null) {

        return false;

    }

    try {

        // 공통코드에서 사무원 역할 목록 조회

        List<CommonCode> roleCodes = commonCodeService.getActiveCommonCodesByGroup("ROLE");

        if (roleCodes == null || roleCodes.isEmpty()) {

            return role == UserRole.STAFF;

        }

        // 공통코드에서 사무원 역할인지 확인

        String roleName = role.name();

        return roleCodes.stream()

            .anyMatch(code -> code.getCodeValue().equals(roleName) && 

                          (code.getExtraData() != null && 

                           (code.getExtraData().contains("\"isStaff\":true") || 

                            code.getExtraData().contains("\"roleType\":\"STAFF\""))));

    } catch (Exception e) {

        log.warn("공통코드에서 사무원 역할 조회 실패, 폴백 사용: {}", role, e);

        return role == UserRole.STAFF;

    }

}

}
