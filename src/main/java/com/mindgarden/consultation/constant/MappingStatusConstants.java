package com.mindgarden.consultation.constant;

/**
 * 매핑 상태 상수 (공통코드 기반)
 */
public class MappingStatusConstants {
    
    // 매핑 상태 공통코드 그룹
    public static final String MAPPING_STATUS_GROUP = "MAPPING_STATUS";
    
    // 매핑 상태 코드값들
    public static final String PENDING_PAYMENT = "PENDING_PAYMENT";
    public static final String PAYMENT_CONFIRMED = "PAYMENT_CONFIRMED";
    public static final String ACTIVE = "ACTIVE";
    public static final String INACTIVE = "INACTIVE";
    public static final String SUSPENDED = "SUSPENDED";
    public static final String TERMINATED = "TERMINATED";
    public static final String SESSIONS_EXHAUSTED = "SESSIONS_EXHAUSTED";
    
    // 결제 상태 공통코드 그룹
    public static final String PAYMENT_STATUS_GROUP = "PAYMENT_STATUS";
    
    // 결제 상태 코드값들
    public static final String PENDING = "PENDING";
    public static final String CONFIRMED = "CONFIRMED";
    public static final String APPROVED = "APPROVED";
    public static final String REJECTED = "REJECTED";
    public static final String REFUNDED = "REFUNDED";
    public static final String PARTIAL_REFUND = "PARTIAL_REFUND";
    
    // 스케줄 상태 공통코드 그룹
    public static final String SCHEDULE_STATUS_GROUP = "SCHEDULE_STATUS";
    
    // 스케줄 상태 코드값들
    public static final String BOOKED = "BOOKED";
    public static final String CONFIRMED_SCHEDULE = "CONFIRMED";
    public static final String CANCELLED = "CANCELLED";
    public static final String COMPLETED = "COMPLETED";
    
    // 환불 사유 공통코드 그룹
    public static final String REFUND_REASON_GROUP = "REFUND_REASON";
    
    // 환불 사유 코드값들
    public static final String CUSTOMER_REQUEST = "CUSTOMER_REQUEST";
    public static final String SERVICE_UNSATISFIED = "SERVICE_UNSATISFIED";
    public static final String CONSULTANT_CHANGE = "CONSULTANT_CHANGE";
    public static final String SCHEDULE_CONFLICT = "SCHEDULE_CONFLICT";
    public static final String HEALTH_ISSUE = "HEALTH_ISSUE";
    public static final String RELOCATION = "RELOCATION";
    public static final String FINANCIAL_DIFFICULTY = "FINANCIAL_DIFFICULTY";
    public static final String ADMIN_DECISION = "ADMIN_DECISION";
    public static final String OTHER = "OTHER";
}
