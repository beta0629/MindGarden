package com.coresolution.core.constant;

/**
 * 학원 시스템 권한 코드 상수
 * 동적 권한 시스템에서 사용하는 권한 코드 정의
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-19
 */
public class AcademyPermissionConstants {
    
    // ==================== 강좌(Course) 권한 ====================
    
    /** 강좌 목록 조회 */
    public static final String COURSE_VIEW_LIST = "ACADEMY_COURSE_VIEW_LIST";
    
    /** 강좌 상세 조회 */
    public static final String COURSE_VIEW_DETAIL = "ACADEMY_COURSE_VIEW_DETAIL";
    
    /** 강좌 생성 */
    public static final String COURSE_CREATE = "ACADEMY_COURSE_CREATE";
    
    /** 강좌 수정 */
    public static final String COURSE_UPDATE = "ACADEMY_COURSE_UPDATE";
    
    /** 강좌 삭제 */
    public static final String COURSE_DELETE = "ACADEMY_COURSE_DELETE";
    
    /** 강좌 상태 변경 */
    public static final String COURSE_TOGGLE_STATUS = "ACADEMY_COURSE_TOGGLE_STATUS";
    
    // ==================== 반(Class) 권한 ====================
    
    /** 반 목록 조회 */
    public static final String CLASS_VIEW_LIST = "ACADEMY_CLASS_VIEW_LIST";
    
    /** 반 상세 조회 */
    public static final String CLASS_VIEW_DETAIL = "ACADEMY_CLASS_VIEW_DETAIL";
    
    /** 반 생성 */
    public static final String CLASS_CREATE = "ACADEMY_CLASS_CREATE";
    
    /** 반 수정 */
    public static final String CLASS_UPDATE = "ACADEMY_CLASS_UPDATE";
    
    /** 반 삭제 */
    public static final String CLASS_DELETE = "ACADEMY_CLASS_DELETE";
    
    /** 반 상태 변경 */
    public static final String CLASS_UPDATE_STATUS = "ACADEMY_CLASS_UPDATE_STATUS";
    
    /** 모집 중인 반 조회 */
    public static final String CLASS_VIEW_RECRUITING = "ACADEMY_CLASS_VIEW_RECRUITING";
    
    // ==================== 수강 등록(ClassEnrollment) 권한 ====================
    
    /** 수강 등록 목록 조회 */
    public static final String ENROLLMENT_VIEW_LIST = "ACADEMY_ENROLLMENT_VIEW_LIST";
    
    /** 수강 등록 상세 조회 */
    public static final String ENROLLMENT_VIEW_DETAIL = "ACADEMY_ENROLLMENT_VIEW_DETAIL";
    
    /** 수강 등록 */
    public static final String ENROLLMENT_CREATE = "ACADEMY_ENROLLMENT_CREATE";
    
    /** 수강 취소 */
    public static final String ENROLLMENT_CANCEL = "ACADEMY_ENROLLMENT_CANCEL";
    
    /** 수강 정보 수정 */
    public static final String ENROLLMENT_UPDATE = "ACADEMY_ENROLLMENT_UPDATE";
    
    // ==================== 출석(Attendance) 권한 ====================
    
    /** 출석 목록 조회 */
    public static final String ATTENDANCE_VIEW_LIST = "ACADEMY_ATTENDANCE_VIEW_LIST";
    
    /** 출석 체크 */
    public static final String ATTENDANCE_CHECK = "ACADEMY_ATTENDANCE_CHECK";
    
    /** 출석 수정 */
    public static final String ATTENDANCE_UPDATE = "ACADEMY_ATTENDANCE_UPDATE";
    
    /** 출석 통계 조회 */
    public static final String ATTENDANCE_VIEW_STATISTICS = "ACADEMY_ATTENDANCE_VIEW_STATISTICS";
    
    // ==================== 브랜치(지점) 권한 ====================
    
    /** 브랜치 목록 조회 */
    public static final String BRANCH_VIEW_LIST = "ACADEMY_BRANCH_VIEW_LIST";
    
    /** 브랜치 상세 조회 */
    public static final String BRANCH_VIEW_DETAIL = "ACADEMY_BRANCH_VIEW_DETAIL";
    
    /** 브랜치 생성 */
    public static final String BRANCH_CREATE = "ACADEMY_BRANCH_CREATE";
    
    /** 브랜치 수정 */
    public static final String BRANCH_UPDATE = "ACADEMY_BRANCH_UPDATE";
    
    /** 브랜치 삭제 */
    public static final String BRANCH_DELETE = "ACADEMY_BRANCH_DELETE";
    
    // ==================== 통계 및 리포트 권한 ====================
    
    /** 학원 통계 조회 */
    public static final String STATISTICS_VIEW = "ACADEMY_STATISTICS_VIEW";
    
    /** 학원 리포트 생성 */
    public static final String REPORT_GENERATE = "ACADEMY_REPORT_GENERATE";
    
    // ==================== 생성자 ====================
    
    private AcademyPermissionConstants() {
        // 상수 클래스는 인스턴스화 불가
    }
}

