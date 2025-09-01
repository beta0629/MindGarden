package com.mindgarden.consultation.constant;

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
    public static final int WORKDAY_START_HOUR = 9;
    public static final int WORKDAY_END_HOUR = 18;
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
    public static final String ROLE_SUPER_ADMIN = "SUPER_ADMIN";
    public static final String ROLE_CONSULTANT = "CONSULTANT";
    
    private ScheduleConstants() {
        // 유틸리티 클래스이므로 인스턴스화 방지
        throw new UnsupportedOperationException("이 클래스는 인스턴스화할 수 없습니다.");
    }
}
