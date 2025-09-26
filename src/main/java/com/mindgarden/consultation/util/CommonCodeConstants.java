package com.mindgarden.consultation.util;

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
    public static final String ROLE_BRANCH_SUPER_ADMIN = "BRANCH_SUPER_ADMIN";
    
    /** 본사 마스터 역할 */
    public static final String ROLE_HQ_MASTER = "HQ_MASTER";
    
    /** 지점 관리자 역할 */
    public static final String ROLE_BRANCH_MANAGER = "BRANCH_MANAGER";
    
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
}
