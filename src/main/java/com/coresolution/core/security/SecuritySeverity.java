package com.coresolution.core.security;

/**
 * 보안 심각도 열거형
 * 보안 이벤트의 심각도 수준 정의
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-26
 */
public enum SecuritySeverity {
    
    INFO("정보", 1, "#2196F3"),
    WARNING("경고", 2, "#FF9800"), 
    HIGH("높음", 3, "#FF5722"),
    CRITICAL("긴급", 4, "#F44336");

    private final String displayName;
    private final int level;
    private final String color;

    SecuritySeverity(String displayName, int level, String color) {
        this.displayName = displayName;
        this.level = level;
        this.color = color;
    }

    public String getDisplayName() {
        return displayName;
    }

    public int getLevel() {
        return level;
    }

    public String getColor() {
        return color;
    }

    /**
     * 심각도 비교
     */
    public boolean isMoreSevereThan(SecuritySeverity other) {
        return this.level > other.level;
    }

    /**
     * 심각도 수준에 따른 대응 시간 (분)
     */
    public int getResponseTimeMinutes() {
        return switch (this) {
            case INFO -> 1440;      // 24시간
            case WARNING -> 240;    // 4시간
            case HIGH -> 60;        // 1시간
            case CRITICAL -> 15;    // 15분
        };
    }

    /**
     * 알림 필요 여부
     */
    public boolean requiresNotification() {
        return this.level >= WARNING.level;
    }

    /**
     * 즉시 대응 필요 여부
     */
    public boolean requiresImmediateAction() {
        return this == CRITICAL;
    }
}
