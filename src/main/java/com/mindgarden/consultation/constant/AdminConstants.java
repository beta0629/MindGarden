package com.mindgarden.consultation.constant;

/**
 * 관리자 관련 상수 클래스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */
public final class AdminConstants {
    
    // === 사용자 관리 관련 ===
    public static final String SUCCESS_USERS_RETRIEVED = "사용자 목록을 성공적으로 조회했습니다.";
    public static final String SUCCESS_CONSULTANT_APPLICANTS_RETRIEVED = "상담사 신청자 목록을 성공적으로 조회했습니다.";
    public static final String SUCCESS_CONSULTANT_APPROVED = "상담사가 성공적으로 승인되었습니다.";
    public static final String SUCCESS_ADMIN_APPROVED = "관리자가 성공적으로 승인되었습니다.";
    public static final String SUCCESS_ROLE_CHANGED = "사용자 역할이 성공적으로 변경되었습니다.";
    public static final String SUCCESS_ROLES_RETRIEVED = "사용 가능한 역할 목록을 성공적으로 조회했습니다.";
    
    // === 에러 메시지 ===
    public static final String ERROR_USERS_RETRIEVAL_FAILED = "사용자 목록 조회에 실패했습니다.";
    public static final String ERROR_CONSULTANT_APPLICANTS_RETRIEVAL_FAILED = "상담사 신청자 목록 조회에 실패했습니다.";
    public static final String ERROR_CONSULTANT_APPROVAL_FAILED = "상담사 승인에 실패했습니다.";
    public static final String ERROR_ADMIN_APPROVAL_FAILED = "관리자 승인에 실패했습니다.";
    public static final String ERROR_ROLE_CHANGE_FAILED = "사용자 역할 변경에 실패했습니다.";
    public static final String ERROR_ROLES_RETRIEVAL_FAILED = "역할 목록 조회에 실패했습니다.";
    public static final String ERROR_INVALID_ROLE = "유효하지 않은 역할입니다.";
    public static final String ERROR_USER_NOT_FOUND = "사용자를 찾을 수 없습니다.";
    public static final String ERROR_INSUFFICIENT_ELIGIBILITY = "자격 요건을 충족하지 않습니다.";
    
    // === 상담사 자격 요건 ===
    public static final int MIN_CONSULTANT_EXPERIENCE = 3; // 최소 경력 (년)
    public static final double MIN_CONSULTANT_RATING = 4.0; // 최소 평점
    public static final int MIN_CONSULTANT_SESSIONS = 50; // 최소 상담 세션 수
    public static final String REQUIRED_CERTIFICATION = "상담사 자격증"; // 필수 자격증
    
    // === 관리자 자격 요건 ===
    public static final int MIN_ADMIN_EXPERIENCE = 5; // 최소 경력 (년)
    public static final double MIN_ADMIN_RATING = 4.5; // 최소 평점
    public static final int MIN_ADMIN_SESSIONS = 100; // 최소 상담 세션 수
    public static final String REQUIRED_ADMIN_CERTIFICATION = "관리자 자격증"; // 필수 자격증
    
    // === 응답 키 ===
    public static final String RESPONSE_KEY_COUNT = "count";
    public static final String RESPONSE_KEY_DATA = "data";
    public static final String RESPONSE_KEY_MESSAGE = "message";
    public static final String RESPONSE_KEY_SUCCESS = "success";
    
    // === 사용자 상태 ===
    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_INACTIVE = "INACTIVE";
    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_SUSPENDED = "SUSPENDED";
    
    // === 페이지네이션 ===
    public static final int DEFAULT_PAGE_SIZE = 20;
    public static final int MAX_PAGE_SIZE = 100;
    
    private AdminConstants() {
        // 유틸리티 클래스이므로 인스턴스 생성 방지
        throw new UnsupportedOperationException("유틸리티 클래스입니다.");
    }
}
