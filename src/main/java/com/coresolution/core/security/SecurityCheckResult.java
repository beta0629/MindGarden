package com.coresolution.core.security;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 보안 검사 결과 클래스
 * 요청에 대한 보안 검사 결과를 담는 데이터 클래스
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-26
 */
@Data
public class SecurityCheckResult {
    
    private String clientIP;
    private String requestURI;
    private LocalDateTime timestamp;
    private List<SecurityThreatType> threats = new ArrayList<>();
    private boolean blocked = false;
    private String blockReason;
    private SecuritySeverity maxSeverity = SecuritySeverity.INFO;

    /**
     * 위협 추가
     */
    public void addThreat(SecurityThreatType threat) {
        threats.add(threat);
        
        // 최대 심각도 업데이트
        SecuritySeverity threatSeverity = threat.getSeverity();
        if (threatSeverity.isMoreSevereThan(maxSeverity)) {
            maxSeverity = threatSeverity;
        }
        
        // 자동 차단 대상인지 확인
        if (threat.shouldAutoBlock()) {
            blocked = true;
            blockReason = "자동 차단: " + threat.getDisplayName();
        }
    }

    /**
     * 위협 존재 여부
     */
    public boolean hasThreats() {
        return !threats.isEmpty();
    }

    /**
     * 특정 위협 타입 존재 여부
     */
    public boolean hasThreat(SecurityThreatType threatType) {
        return threats.contains(threatType);
    }

    /**
     * 긴급 대응 필요 여부
     */
    public boolean requiresImmediateAction() {
        return maxSeverity.requiresImmediateAction() || 
               threats.stream().anyMatch(SecurityThreatType::requiresImmediateAlert);
    }

    /**
     * 위협 요약 문자열 생성
     */
    public String getThreatSummary() {
        if (threats.isEmpty()) {
            return "위협 없음";
        }
        
        StringBuilder summary = new StringBuilder();
        for (int i = 0; i < threats.size(); i++) {
            if (i > 0) summary.append(", ");
            summary.append(threats.get(i).getDisplayName());
        }
        
        return summary.toString();
    }

    /**
     * 보안 점수 계산 (0-100)
     */
    public int getSecurityScore() {
        if (threats.isEmpty()) {
            return 100;
        }
        
        int score = 100;
        for (SecurityThreatType threat : threats) {
            score -= switch (threat.getSeverity()) {
                case CRITICAL -> 40;
                case HIGH -> 25;
                case WARNING -> 10;
                case INFO -> 5;
            };
        }
        
        return Math.max(score, 0);
    }

    /**
     * 권장 조치사항 생성
     */
    public List<String> getRecommendations() {
        List<String> recommendations = new ArrayList<>();
        
        if (hasThreat(SecurityThreatType.SQL_INJECTION)) {
            recommendations.add("입력 유효성 검사를 강화하고 Prepared Statement를 사용하세요.");
        }
        
        if (hasThreat(SecurityThreatType.XSS)) {
            recommendations.add("출력 데이터를 적절히 인코딩하고 CSP 헤더를 설정하세요.");
        }
        
        if (hasThreat(SecurityThreatType.BRUTE_FORCE)) {
            recommendations.add("계정 잠금 정책을 활성화하고 CAPTCHA를 도입하세요.");
        }
        
        if (hasThreat(SecurityThreatType.SUSPICIOUS_IP)) {
            recommendations.add("해당 IP를 모니터링하고 필요시 차단을 고려하세요.");
        }
        
        if (blocked) {
            recommendations.add("요청이 자동으로 차단되었습니다. 보안팀에 즉시 보고하세요.");
        }
        
        if (recommendations.isEmpty()) {
            recommendations.add("현재 보안 상태가 양호합니다.");
        }
        
        return recommendations;
    }
}
