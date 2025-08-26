package com.mindgarden.consultation.constant;

/**
 * 상담 상태 상수 클래스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public final class ConsultationStatus {
    
    // 상담 상태
    public static final String REQUESTED = "REQUESTED";           // 상담 요청됨
    public static final String CONFIRMED = "CONFIRMED";           // 상담 확정됨
    public static final String IN_PROGRESS = "IN_PROGRESS";       // 상담 진행 중
    public static final String COMPLETED = "COMPLETED";           // 상담 완료
    public static final String CANCELLED = "CANCELLED";           // 상담 취소됨
    public static final String NO_SHOW = "NO_SHOW";              // 상담 미참석
    public static final String RESCHEDULED = "RESCHEDULED";       // 상담 재일정
    
    // 상태 그룹
    public static final String[] ACTIVE_STATUSES = {REQUESTED, CONFIRMED, IN_PROGRESS};
    public static final String[] COMPLETED_STATUSES = {COMPLETED, CANCELLED, NO_SHOW};
    public static final String[] ALL_STATUSES = {REQUESTED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW, RESCHEDULED};
    
    // 상태별 설명
    public static final String REQUESTED_DESCRIPTION = "상담 요청됨";
    public static final String CONFIRMED_DESCRIPTION = "상담 확정됨";
    public static final String IN_PROGRESS_DESCRIPTION = "상담 진행 중";
    public static final String COMPLETED_DESCRIPTION = "상담 완료";
    public static final String CANCELLED_DESCRIPTION = "상담 취소됨";
    public static final String NO_SHOW_DESCRIPTION = "상담 미참석";
    public static final String RESCHEDULED_DESCRIPTION = "상담 재일정";
    
    // 상태별 색상 (UI용)
    public static final String REQUESTED_COLOR = "#FFA500";       // 주황색
    public static final String CONFIRMED_COLOR = "#0000FF";       // 파란색
    public static final String IN_PROGRESS_COLOR = "#00FF00";     // 초록색
    public static final String COMPLETED_COLOR = "#008000";       // 진한 초록색
    public static final String CANCELLED_COLOR = "#FF0000";       // 빨간색
    public static final String NO_SHOW_COLOR = "#800000";         // 진한 빨간색
    public static final String RESCHEDULED_COLOR = "#800080";     // 보라색
    
    private ConsultationStatus() {
        // 유틸리티 클래스이므로 인스턴스 생성 방지
        throw new UnsupportedOperationException("유틸리티 클래스입니다.");
    }
    
    /**
     * 상태가 유효한지 확인
     */
    public static boolean isValidStatus(String status) {
        if (status == null) return false;
        for (String validStatus : ALL_STATUSES) {
            if (validStatus.equals(status)) return true;
        }
        return false;
    }
    
    /**
     * 상태가 활성 상태인지 확인
     */
    public static boolean isActiveStatus(String status) {
        if (status == null) return false;
        for (String activeStatus : ACTIVE_STATUSES) {
            if (activeStatus.equals(status)) return true;
        }
        return false;
    }
    
    /**
     * 상태가 완료 상태인지 확인
     */
    public static boolean isCompletedStatus(String status) {
        if (status == null) return false;
        for (String completedStatus : COMPLETED_STATUSES) {
            if (completedStatus.equals(status)) return true;
        }
        return false;
    }
    
    /**
     * 상태 설명 반환
     */
    public static String getStatusDescription(String status) {
        switch (status) {
            case REQUESTED: return REQUESTED_DESCRIPTION;
            case CONFIRMED: return CONFIRMED_DESCRIPTION;
            case IN_PROGRESS: return IN_PROGRESS_DESCRIPTION;
            case COMPLETED: return COMPLETED_DESCRIPTION;
            case CANCELLED: return CANCELLED_DESCRIPTION;
            case NO_SHOW: return NO_SHOW_DESCRIPTION;
            case RESCHEDULED: return RESCHEDULED_DESCRIPTION;
            default: return "알 수 없음";
        }
    }
    
    /**
     * 상태 색상 반환
     */
    public static String getStatusColor(String status) {
        switch (status) {
            case REQUESTED: return REQUESTED_COLOR;
            case CONFIRMED: return CONFIRMED_COLOR;
            case IN_PROGRESS: return IN_PROGRESS_COLOR;
            case COMPLETED: return COMPLETED_COLOR;
            case CANCELLED: return CANCELLED_COLOR;
            case NO_SHOW: return NO_SHOW_COLOR;
            case RESCHEDULED: return RESCHEDULED_COLOR;
            default: return "#000000"; // 검은색
        }
    }
    
    /**
     * 다음 가능한 상태들 반환
     */
    public static String[] getNextPossibleStatuses(String currentStatus) {
        switch (currentStatus) {
            case REQUESTED:
                return new String[]{CONFIRMED, CANCELLED, RESCHEDULED};
            case CONFIRMED:
                return new String[]{IN_PROGRESS, CANCELLED, RESCHEDULED};
            case IN_PROGRESS:
                return new String[]{COMPLETED, CANCELLED, RESCHEDULED};
            case COMPLETED:
            case CANCELLED:
            case NO_SHOW:
            case RESCHEDULED:
                return new String[]{REQUESTED}; // 재상담 요청
            default:
                return new String[]{};
        }
    }
}
