package com.coresolution.consultation.constant;

import java.time.Duration;

/**
 * 상담 유형 enum
 * 각 상담 유형별 기본 시간과 설명을 정의
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public enum ConsultationType {
    
    INDIVIDUAL("INDIVIDUAL", "개별상담", Duration.ofMinutes(50), "일반적인 개별 상담 세션"),
    FAMILY("FAMILY", "가족상담", Duration.ofMinutes(100), "가족 전체가 참여하는 상담 세션"),
    INITIAL("INITIAL", "초기상담", Duration.ofMinutes(60), "첫 번째 상담 세션 (사정 및 목표 설정)"),
    COUPLE("COUPLE", "부부상담", Duration.ofMinutes(80), "부부 간의 관계 상담"),
    GROUP("GROUP", "집단상담", Duration.ofMinutes(90), "여러 명이 참여하는 집단 상담"),
    EMERGENCY("EMERGENCY", "긴급상담", Duration.ofMinutes(30), "긴급한 상황에 대한 단기 상담"),
    FOLLOW_UP("FOLLOW_UP", "사후관리", Duration.ofMinutes(40), "상담 후 사후 관리 및 점검"),
    ASSESSMENT("ASSESSMENT", "심리평가", Duration.ofMinutes(120), "심리 검사 및 평가 세션");

    private final String code;
    private final String displayName;
    private final Duration defaultDuration;
    private final String description;

    ConsultationType(String code, String displayName, Duration defaultDuration, String description) {
        this.code = code;
        this.displayName = displayName;
        this.defaultDuration = defaultDuration;
        this.description = description;
    }

    // ==================== Getter 메서드 ====================
    
    public String getCode() {
        return code;
    }

    public String getDisplayName() {
        return displayName;
    }

    public Duration getDefaultDuration() {
        return defaultDuration;
    }

    public String getDescription() {
        return description;
    }

    // ==================== 유틸리티 메서드 ====================
    
    /**
     * 코드로 ConsultationType 찾기
     */
    public static ConsultationType fromCode(String code) {
        if (code == null || code.trim().isEmpty()) {
            return INDIVIDUAL; // 기본값
        }
        
        for (ConsultationType type : values()) {
            if (type.code.equalsIgnoreCase(code.trim())) {
                return type;
            }
        }
        
        // 코드를 찾을 수 없는 경우 기본값 반환
        return INDIVIDUAL;
    }
    
    /**
     * 표시명으로 ConsultationType 찾기
     */
    public static ConsultationType fromDisplayName(String displayName) {
        if (displayName == null || displayName.trim().isEmpty()) {
            return INDIVIDUAL; // 기본값
        }
        
        for (ConsultationType type : values()) {
            if (type.displayName.equals(displayName.trim())) {
                return type;
            }
        }
        
        // 표시명을 찾을 수 없는 경우 기본값 반환
        return INDIVIDUAL;
    }
    
    /**
     * 기본 시간을 분 단위로 반환
     */
    public int getDefaultDurationMinutes() {
        return (int) defaultDuration.toMinutes();
    }
    
    /**
     * 상담 유형이 긴급 상담인지 확인
     */
    public boolean isEmergency() {
        return this == EMERGENCY;
    }
    
    /**
     * 상담 유형이 초기 상담인지 확인
     */
    public boolean isInitial() {
        return this == INITIAL;
    }
    
    /**
     * 상담 유형이 가족 상담인지 확인
     */
    public boolean isFamily() {
        return this == FAMILY;
    }
    
    /**
     * 상담 유형이 개별 상담인지 확인
     */
    public boolean isIndividual() {
        return this == INDIVIDUAL;
    }
    
    /**
     * 상담 유형이 집단 상담인지 확인
     */
    public boolean isGroup() {
        return this == GROUP;
    }
    
    /**
     * 상담 유형이 부부 상담인지 확인
     */
    public boolean isCouple() {
        return this == COUPLE;
    }
    
    /**
     * 상담 유형이 사후 관리인지 확인
     */
    public boolean isFollowUp() {
        return this == FOLLOW_UP;
    }
    
    /**
     * 상담 유형이 심리 평가인지 확인
     */
    public boolean isAssessment() {
        return this == ASSESSMENT;
    }
    
    /**
     * 상담 유형이 장시간 상담인지 확인 (90분 이상)
     */
    public boolean isLongSession() {
        return defaultDuration.toMinutes() >= 90;
    }
    
    /**
     * 상담 유형이 단시간 상담인지 확인 (30분 이하)
     */
    public boolean isShortSession() {
        return defaultDuration.toMinutes() <= 30;
    }
    
    /**
     * 상담 유형이 중간 시간 상담인지 확인 (31분 ~ 89분)
     */
    public boolean isMediumSession() {
        return !isLongSession() && !isShortSession();
    }
    
    @Override
    public String toString() {
        return String.format("%s (%s) - %d분", displayName, code, getDefaultDurationMinutes());
    }
}
