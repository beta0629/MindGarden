package com.coresolution.core.security;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 보안 감사 보고서 클래스
 * 시스템의 전반적인 보안 상태를 담는 보고서
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-26
 */
@Data
public class SecurityAuditReport {
    
    private LocalDateTime generatedAt;
    private String reportVersion = "1.0.0";
    private Map<String, Object> securityStatistics;
    private List<String> blockedIPs;
    private List<String> recommendations;
    private SecurityHealthStatus healthStatus;
    private List<SecurityIncident> recentIncidents;
    private ComplianceStatus complianceStatus;

    /**
     * 보안 건강 상태 계산
     */
    public SecurityHealthStatus calculateHealthStatus() {
        if (securityStatistics == null) {
            return SecurityHealthStatus.UNKNOWN;
        }
        
        Double securityScore = (Double) securityStatistics.get("securityScore");
        if (securityScore == null) {
            return SecurityHealthStatus.UNKNOWN;
        }
        
        if (securityScore >= 90) return SecurityHealthStatus.EXCELLENT;
        if (securityScore >= 75) return SecurityHealthStatus.GOOD;
        if (securityScore >= 50) return SecurityHealthStatus.FAIR;
        if (securityScore >= 25) return SecurityHealthStatus.POOR;
        return SecurityHealthStatus.CRITICAL;
    }

    /**
     * 보고서 요약 생성
     */
    public String generateSummary() {
        StringBuilder summary = new StringBuilder();
        summary.append("보안 감사 보고서 요약\n");
        summary.append("생성일시: ").append(generatedAt).append("\n");
        summary.append("보안 상태: ").append(calculateHealthStatus().getDisplayName()).append("\n");
        
        if (securityStatistics != null) {
            Double securityScore = (Double) securityStatistics.get("securityScore");
            if (securityScore != null) {
                summary.append("보안 점수: ").append(String.format("%.1f", securityScore)).append("/100\n");
            }
        }
        
        if (blockedIPs != null) {
            summary.append("차단된 IP 수: ").append(blockedIPs.size()).append("\n");
        }
        
        if (recommendations != null && !recommendations.isEmpty()) {
            summary.append("주요 권장사항: ").append(recommendations.get(0)).append("\n");
        }
        
        return summary.toString();
    }

    /**
     * 보안 건강 상태 열거형
     */
    public enum SecurityHealthStatus {
        EXCELLENT("우수", "#4CAF50"),
        GOOD("양호", "#8BC34A"),
        FAIR("보통", "#FF9800"),
        POOR("취약", "#FF5722"),
        CRITICAL("위험", "#F44336"),
        UNKNOWN("알 수 없음", "#9E9E9E");

        private final String displayName;
        private final String color;

        SecurityHealthStatus(String displayName, String color) {
            this.displayName = displayName;
            this.color = color;
        }

        public String getDisplayName() {
            return displayName;
        }

        public String getColor() {
            return color;
        }
    }

    /**
     * 보안 사건 클래스
     */
    @Data
    public static class SecurityIncident {
        private LocalDateTime timestamp;
        private SecurityEventType eventType;
        private String clientIP;
        private String description;
        private SecuritySeverity severity;
        private boolean resolved;
        private String resolution;
    }

    /**
     * 컴플라이언스 상태 클래스
     */
    @Data
    public static class ComplianceStatus {
        private boolean gdprCompliant;
        private boolean hipaaCompliant;
        private boolean iso27001Compliant;
        private LocalDateTime lastAuditDate;
        private List<String> violations;
        private double complianceScore;
    }
}
