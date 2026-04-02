package com.coresolution.consultation.constant;

/**
 * 간소화된 스케줄 상태 enum
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-16
 */
public enum ScheduleStatus {
    
    AVAILABLE("가능", "#28a745", "✅"),           // 예약 가능한 시간대
    BOOKED("예약됨", "#007bff", "📅"),           // 상담 예약됨
    CONFIRMED("확정됨", "#17a2b8", "✅"),         // 상담 확정됨
    VACATION("휴가", "#ffc107", "🏖️"),           // 휴가로 인한 비활성
    COMPLETED("완료", "#b8b8b8", "✅"),          // 상담 완료 (연한 회색)
    CANCELLED("취소됨", "#dc3545", "❌");         // 예약 취소됨
    
    private final String displayName;
    private final String color;
    private final String icon;
    
    ScheduleStatus(String displayName, String color, String icon) {
        this.displayName = displayName;
        this.color = color;
        this.icon = icon;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public String getColor() {
        return color;
    }
    
    public String getIcon() {
        return icon;
    }
    
    public String getValue() {
        return this.name();
    }
    
    // 활성 상태인지 확인 (예약 가능하거나 예약된 상태)
    public boolean isActive() {
        return this == AVAILABLE || this == BOOKED || this == CONFIRMED;
    }
    
    // 완료된 상태인지 확인
    public boolean isCompleted() {
        return this == COMPLETED || this == CANCELLED;
    }
    
    // 예약 가능한 상태인지 확인
    public boolean isBookable() {
        return this == AVAILABLE;
    }
    
    // 휴가 상태인지 확인
    public boolean isVacation() {
        return this == VACATION;
    }

    /**
     * 신규 예약 시 동일 상담사·날짜·시간대 충돌 검사에 포함할 상태인지 여부.
     * 취소·가용·완료·휴가 등은 제외한다.
     * ScheduleRepository findOverlappingSchedules 계열 JPQL의 status 조건과 맞출 것.
     *
     * @return 예약 점유로 간주하면 true
     */
    public boolean occupiesTimeForConflictCheck() {
        return this == BOOKED || this == CONFIRMED;
    }
}
