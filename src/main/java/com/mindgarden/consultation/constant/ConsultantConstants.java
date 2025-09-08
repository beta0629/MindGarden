package com.mindgarden.consultation.constant;

/**
 * 상담사 관련 상수 정의
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public class ConsultantConstants {
    
    // === 상담사 상태 ===
    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_INACTIVE = "INACTIVE";
    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_SUSPENDED = "SUSPENDED";
    
    // === 전문 분야 ===
    public static final String SPECIALTY_ANXIETY = "ANXIETY";
    public static final String SPECIALTY_DEPRESSION = "DEPRESSION";
    public static final String SPECIALTY_STRESS = "STRESS";
    public static final String SPECIALTY_RELATIONSHIP = "RELATIONSHIP";
    public static final String SPECIALTY_CAREER = "CAREER";
    public static final String SPECIALTY_FAMILY = "FAMILY";
    public static final String SPECIALTY_TRAUMA = "TRAUMA";
    public static final String SPECIALTY_ADDICTION = "ADDICTION";
    
    // === 평점 관련 ===
    public static final double MIN_RATING = 0.0;
    public static final double MAX_RATING = 5.0;
    public static final double DEFAULT_RATING = 0.0;
    
    // === 경력 관련 ===
    public static final int MIN_EXPERIENCE = 0;
    public static final int MAX_EXPERIENCE = 50;
    
    // === 스케줄 관련 ===
    public static final int WORK_START_HOUR = 9;
    public static final int WORK_END_HOUR = 18;
    public static final int SLOT_DURATION_MINUTES = 60;
    
    // === 통계 관련 ===
    public static final String STATS_TOTAL_CLIENTS = "totalClients";
    public static final String STATS_ACTIVE_CLIENTS = "activeClients";
    public static final String STATS_PENDING_CLIENTS = "pendingClients";
    public static final String STATS_COMPLETED_SESSIONS = "completedSessions";
    public static final String STATS_AVERAGE_RATING = "averageRating";
    public static final String STATS_TOTAL_EARNINGS = "totalEarnings";
    
    // === 검색 관련 ===
    public static final String SEARCH_BY_SPECIALTY = "specialty";
    public static final String SEARCH_BY_EXPERIENCE = "experience";
    public static final String SEARCH_BY_RATING = "rating";
    public static final String SEARCH_BY_AVAILABILITY = "availability";
    
    // === 에러 메시지 ===
    public static final String ERROR_CONSULTANT_NOT_FOUND = "상담사를 찾을 수 없습니다.";
    public static final String ERROR_CLIENT_NOT_FOUND = "내담자를 찾을 수 없습니다.";
    public static final String ERROR_INVALID_RATING = "평점은 0.0에서 5.0 사이여야 합니다.";
    public static final String ERROR_INVALID_EXPERIENCE = "경력은 0년 이상 50년 이하여야 합니다.";
    public static final String ERROR_SCHEDULE_CONFLICT = "스케줄 시간이 겹칩니다.";
    
    // === 성공 메시지 ===
    public static final String SUCCESS_CONSULTANT_UPDATED = "상담사 정보가 업데이트되었습니다.";
    public static final String SUCCESS_CLIENT_UPDATED = "내담자 정보가 업데이트되었습니다.";
    public static final String SUCCESS_SCHEDULE_REGISTERED = "스케줄이 등록되었습니다.";
    public static final String SUCCESS_SCHEDULE_UPDATED = "스케줄이 업데이트되었습니다.";
    public static final String SUCCESS_SCHEDULE_DELETED = "스케줄이 삭제되었습니다.";
    
    // === 기본값 ===
    public static final String DEFAULT_SPECIALTY = "GENERAL";
    public static final boolean DEFAULT_AVAILABILITY = true;
    public static final int DEFAULT_SLOT_COUNT = 9; // 9시부터 18시까지 1시간 단위
    
    // === 페이지네이션 ===
    public static final int DEFAULT_PAGE_SIZE = 10;
    public static final int MAX_PAGE_SIZE = 100;
    
    // === 정렬 ===
    public static final String SORT_BY_RATING = "rating";
    public static final String SORT_BY_EXPERIENCE = "experience";
    public static final String SORT_BY_NAME = "name";
    public static final String SORT_BY_CREATED_AT = "createdAt";
    
    // === 시간 관련 ===
    public static final String TIME_FORMAT = "HH:mm";
    public static final String DATE_FORMAT = "yyyy-MM-dd";
    public static final String DATETIME_FORMAT = "yyyy-MM-dd HH:mm:ss";
}
