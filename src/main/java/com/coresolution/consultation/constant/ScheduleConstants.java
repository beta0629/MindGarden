package com.coresolution.consultation.constant;

// 표준화 2025-12-05: 브랜치/HQ 개념 제거, 역할 체크를 공통코드 기반 동적 조회로 통합 (TENANT_ROLE_SYSTEM_STANDARD.md 준수)

/**
 * 스케줄 관련 상수 정의
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public final class ScheduleConstants {
    
    // 기본 상담 시간 관련 상수
    public static final int BREAK_TIME_MINUTES = 10;
    public static final int WORKDAY_START_HOUR = 10;
    public static final int WORKDAY_END_HOUR = 20;
    public static final int WORKDAY_TOTAL_HOURS = WORKDAY_END_HOUR - WORKDAY_START_HOUR;
    
    // 스케줄 상태 관련 상수
    public static final int MAX_SCHEDULES_PER_DAY = 8; // 하루 최대 스케줄 수
    public static final int MIN_SCHEDULE_INTERVAL_MINUTES = 15; // 최소 스케줄 간격
    
    // 시간 계산 관련 상수
    public static final int MINUTES_PER_HOUR = 60;
    public static final int SECONDS_PER_MINUTE = 60;
    
    // 스케줄 검증 관련 상수
    public static final int MAX_ADVANCE_BOOKING_DAYS = 30; // 최대 사전 예약 가능 일수
    public static final int MIN_NOTICE_HOURS = 24; // 최소 예약 통지 시간
    
    // 스케줄 상태 문자열 상수
    public static final String STATUS_BOOKED = "BOOKED";
    public static final String STATUS_CONFIRMED = "CONFIRMED";
    public static final String STATUS_IN_PROGRESS = "IN_PROGRESS";
    public static final String STATUS_COMPLETED = "COMPLETED";
    public static final String STATUS_CANCELLED = "CANCELLED";
    public static final String STATUS_BLOCKED = "BLOCKED";
    
    // 스케줄 타입 문자열 상수
    public static final String TYPE_CONSULTATION = "CONSULTATION";
    public static final String TYPE_BREAK = "BREAK";
    public static final String TYPE_MEETING = "MEETING";
    public static final String TYPE_TRAINING = "TRAINING";
    
    // 사용자 역할 문자열 상수
    public static final String ROLE_ADMIN = "ADMIN";
    public static final String ROLE_HQ_MASTER = "ADMIN" // 표준화 2025-12-05: 브랜치/HQ 개념 제거;
    public static final String ROLE_CONSULTANT = "CONSULTANT";
    public static final String ROLE_BRANCH_MANAGER = "STAFF" // 표준화 2025-12-05: 브랜치/HQ 개념 제거;
    public static final String ROLE_BRANCH_HQ_MASTER = "BRANCH_HQ_MASTER";
    public static final String ROLE_BRANCH_SUPER_ADMIN = "ADMIN" // 표준화 2025-12-05: 브랜치/HQ 개념 제거;
    public static final String ROLE_HQ_ADMIN = "ADMIN" // 표준화 2025-12-05: 브랜치/HQ 개념 제거;
    public static final String ROLE_SUPER_HQ_ADMIN = "ADMIN" // 표준화 2025-12-05: 브랜치/HQ 개념 제거;
    
    private ScheduleConstants() {
        // 유틸리티 클래스이므로 인스턴스화 방지
        throw new UnsupportedOperationException("이 클래스는 인스턴스화할 수 없습니다.");
    }

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
