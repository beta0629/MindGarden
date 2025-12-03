package com.coresolution.core.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.regex.Pattern;

/**
 * 보안 감사 서비스
 * 보안 이벤트 모니터링, 위협 탐지, 보안 로그 관리
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-26
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SecurityAuditService {

    // 보안 이벤트 통계
    private final ConcurrentHashMap<String, AtomicLong> securityEventCounts = new ConcurrentHashMap<>();
    
    // 의심스러운 IP 추적
    private final ConcurrentHashMap<String, SuspiciousActivity> suspiciousIPs = new ConcurrentHashMap<>();
    
    // SQL 인젝션 패턴
    private static final List<Pattern> SQL_INJECTION_PATTERNS = List.of(
        Pattern.compile("(?i).*('|(\\-\\-)|(;)|(\\|)|(\\*)|(%)|(union)|(select)|(insert)|(delete)|(update)|(drop)|(create)|(alter)|(exec)|(execute)|(script)|(javascript)|(vbscript)).*"),
        Pattern.compile("(?i).*(or\\s+1=1|and\\s+1=1|'\\s*or\\s*'1'='1|'\\s*or\\s*1=1).*"),
        Pattern.compile("(?i).*(union\\s+select|union\\s+all\\s+select).*")
    );
    
    // XSS 패턴
    private static final List<Pattern> XSS_PATTERNS = List.of(
        Pattern.compile("(?i).*(<script|</script|javascript:|vbscript:|onload=|onerror=|onclick=|onmouseover=).*"),
        Pattern.compile("(?i).*(alert\\(|confirm\\(|prompt\\(|document\\.|window\\.|eval\\().*"),
        Pattern.compile("(?i).*(<iframe|<object|<embed|<link|<meta).*")
    );
    
    // 경로 순회 공격 패턴
    private static final List<Pattern> PATH_TRAVERSAL_PATTERNS = List.of(
        Pattern.compile(".*(\\.\\./|\\.\\\\|%2e%2e%2f|%2e%2e%5c).*"),
        Pattern.compile(".*(etc/passwd|boot\\.ini|win\\.ini).*")
    );

    /**
     * 보안 이벤트 기록
     */
    public void recordSecurityEvent(SecurityEventType eventType, String clientIP, 
                                  String userAgent, String details) {
        
        String eventKey = eventType.name();
        securityEventCounts.computeIfAbsent(eventKey, k -> new AtomicLong(0)).incrementAndGet();
        
        // 의심스러운 활동 추적
        trackSuspiciousActivity(clientIP, eventType);
        
        // 로그 기록
        log.warn("🚨 보안 이벤트 감지: {} | IP: {} | UserAgent: {} | Details: {}", 
            eventType, clientIP, userAgent, details);
        
        // 심각한 보안 이벤트의 경우 즉시 알림
        if (eventType.getSeverity() == SecuritySeverity.CRITICAL) {
            handleCriticalSecurityEvent(eventType, clientIP, details);
        }
    }

    /**
     * 요청 보안 검사
     */
    public SecurityCheckResult performSecurityCheck(HttpServletRequest request) {
        String clientIP = getClientIP(request);
        String userAgent = request.getHeader("User-Agent");
        String requestURI = request.getRequestURI();
        Map<String, String[]> parameters = request.getParameterMap();
        
        SecurityCheckResult result = new SecurityCheckResult();
        result.setClientIP(clientIP);
        result.setRequestURI(requestURI);
        result.setTimestamp(LocalDateTime.now());
        
        // 1. SQL 인젝션 검사
        if (checkSQLInjection(parameters, requestURI)) {
            result.addThreat(SecurityThreatType.SQL_INJECTION);
            recordSecurityEvent(SecurityEventType.SQL_INJECTION_ATTEMPT, clientIP, userAgent, 
                "SQL Injection detected in: " + requestURI);
        }
        
        // 2. XSS 검사
        if (checkXSS(parameters, requestURI)) {
            result.addThreat(SecurityThreatType.XSS);
            recordSecurityEvent(SecurityEventType.XSS_ATTEMPT, clientIP, userAgent, 
                "XSS attempt detected in: " + requestURI);
        }
        
        // 3. 경로 순회 공격 검사
        if (checkPathTraversal(requestURI, parameters)) {
            result.addThreat(SecurityThreatType.PATH_TRAVERSAL);
            recordSecurityEvent(SecurityEventType.PATH_TRAVERSAL_ATTEMPT, clientIP, userAgent, 
                "Path traversal detected in: " + requestURI);
        }
        
        // 4. 의심스러운 IP 검사
        if (isSuspiciousIP(clientIP)) {
            result.addThreat(SecurityThreatType.SUSPICIOUS_IP);
            recordSecurityEvent(SecurityEventType.SUSPICIOUS_ACTIVITY, clientIP, userAgent, 
                "Request from suspicious IP");
        }
        
        // 5. 비정상적인 요청 패턴 검사
        if (checkAbnormalRequestPattern(request)) {
            result.addThreat(SecurityThreatType.ABNORMAL_PATTERN);
            recordSecurityEvent(SecurityEventType.ABNORMAL_REQUEST_PATTERN, clientIP, userAgent, 
                "Abnormal request pattern detected");
        }
        
        return result;
    }

    /**
     * 보안 통계 조회
     */
    public Map<String, Object> getSecurityStatistics() {
        Map<String, Object> stats = new HashMap<>();
        
        // 보안 이벤트 통계
        Map<String, Long> eventStats = new HashMap<>();
        securityEventCounts.forEach((event, count) -> 
            eventStats.put(event, count.get()));
        stats.put("securityEvents", eventStats);
        
        // 의심스러운 IP 통계
        stats.put("suspiciousIPCount", suspiciousIPs.size());
        stats.put("topSuspiciousIPs", getTopSuspiciousIPs(10));
        
        // 전체 보안 점수 계산
        stats.put("securityScore", calculateSecurityScore());
        
        return stats;
    }

    /**
     * 의심스러운 IP 차단 목록 조회
     */
    public List<String> getBlockedIPs() {
        return suspiciousIPs.entrySet().stream()
            .filter(entry -> entry.getValue().shouldBlock())
            .map(Map.Entry::getKey)
            .toList();
    }

    /**
     * 보안 감사 보고서 생성
     */
    public SecurityAuditReport generateAuditReport() {
        SecurityAuditReport report = new SecurityAuditReport();
        report.setGeneratedAt(LocalDateTime.now());
        report.setSecurityStatistics(getSecurityStatistics());
        report.setBlockedIPs(getBlockedIPs());
        report.setRecommendations(generateSecurityRecommendations());
        
        return report;
    }

    // === Private Helper Methods ===

    private void trackSuspiciousActivity(String clientIP, SecurityEventType eventType) {
        suspiciousIPs.compute(clientIP, (ip, activity) -> {
            if (activity == null) {
                activity = new SuspiciousActivity(ip);
            }
            activity.recordEvent(eventType);
            return activity;
        });
    }

    private void handleCriticalSecurityEvent(SecurityEventType eventType, String clientIP, String details) {
        // 즉시 IP 차단 고려
        SuspiciousActivity activity = suspiciousIPs.get(clientIP);
        if (activity != null && activity.getEventCount() > 5) {
            log.error("🚫 IP 차단 권장: {} (사유: {})", clientIP, eventType);
            // 실제 환경에서는 방화벽 API 호출 또는 보안팀 알림
        }
        
        // 보안팀 알림 (실제 환경에서는 이메일, Slack 등)
        log.error("🚨 긴급 보안 알림: {} | IP: {} | Details: {}", eventType, clientIP, details);
    }

    private boolean checkSQLInjection(Map<String, String[]> parameters, String requestURI) {
        // URI 검사 (숫자만 있는 경로 변수는 제외)
        // 예: /api/consultation-messages/client/555 -> /api/consultation-messages/client/{id}로 변환하여 검사
        String sanitizedURI = requestURI.replaceAll("/\\d+", "/{id}");
        
        // 숫자만 있는 경로 변수가 있는 경우 SQL 인젝션 검사에서 제외
        // 예: /api/consultation-messages/client/555 -> 검사 제외
        if (requestURI.matches(".*/\\d+$") || requestURI.matches(".*/\\d+\\?.*")) {
            log.debug("🔍 SQL 인젝션 검사 스킵 - 숫자만 있는 경로 변수: {}", requestURI);
            return false;
        }
        
        log.debug("🔍 SQL 인젝션 검사 - 원본 URI: {}, 정제된 URI: {}", requestURI, sanitizedURI);
        
        for (Pattern pattern : SQL_INJECTION_PATTERNS) {
            if (pattern.matcher(sanitizedURI).matches()) {
                log.warn("⚠️ SQL 인젝션 패턴 매칭 - 정제된 URI: {}, 패턴: {}", sanitizedURI, pattern.pattern());
                return true;
            }
        }
        
        log.debug("✅ SQL 인젝션 검사 통과 - 정제된 URI: {}", sanitizedURI);
        
        // 파라미터 검사
        for (String[] values : parameters.values()) {
            for (String value : values) {
                if (value != null) {
                    for (Pattern pattern : SQL_INJECTION_PATTERNS) {
                        if (pattern.matcher(value).matches()) {
                            return true;
                        }
                    }
                }
            }
        }
        
        return false;
    }

    private boolean checkXSS(Map<String, String[]> parameters, String requestURI) {
        // URI 검사
        for (Pattern pattern : XSS_PATTERNS) {
            if (pattern.matcher(requestURI).matches()) {
                return true;
            }
        }
        
        // 파라미터 검사
        for (String[] values : parameters.values()) {
            for (String value : values) {
                if (value != null) {
                    for (Pattern pattern : XSS_PATTERNS) {
                        if (pattern.matcher(value).matches()) {
                            return true;
                        }
                    }
                }
            }
        }
        
        return false;
    }

    private boolean checkPathTraversal(String requestURI, Map<String, String[]> parameters) {
        // URI 검사
        for (Pattern pattern : PATH_TRAVERSAL_PATTERNS) {
            if (pattern.matcher(requestURI).matches()) {
                return true;
            }
        }
        
        // 파라미터 검사
        for (String[] values : parameters.values()) {
            for (String value : values) {
                if (value != null) {
                    for (Pattern pattern : PATH_TRAVERSAL_PATTERNS) {
                        if (pattern.matcher(value).matches()) {
                            return true;
                        }
                    }
                }
            }
        }
        
        return false;
    }

    private boolean isSuspiciousIP(String clientIP) {
        SuspiciousActivity activity = suspiciousIPs.get(clientIP);
        return activity != null && activity.isSuspicious();
    }

    private boolean checkAbnormalRequestPattern(HttpServletRequest request) {
        String userAgent = request.getHeader("User-Agent");
        
        // User-Agent가 없거나 의심스러운 경우
        if (userAgent == null || userAgent.trim().isEmpty()) {
            return true;
        }
        
        // 알려진 악성 User-Agent 패턴
        String[] maliciousPatterns = {
            "sqlmap", "nikto", "nmap", "masscan", "zap", "burp",
            "python-requests", "curl", "wget"
        };
        
        String lowerUserAgent = userAgent.toLowerCase();
        for (String pattern : maliciousPatterns) {
            if (lowerUserAgent.contains(pattern)) {
                return true;
            }
        }
        
        return false;
    }

    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIP = request.getHeader("X-Real-IP");
        if (xRealIP != null && !xRealIP.isEmpty()) {
            return xRealIP;
        }
        
        return request.getRemoteAddr();
    }

    private List<Map<String, Object>> getTopSuspiciousIPs(int limit) {
        return suspiciousIPs.entrySet().stream()
            .sorted((e1, e2) -> Long.compare(e2.getValue().getEventCount(), e1.getValue().getEventCount()))
            .limit(limit)
            .map(entry -> {
                Map<String, Object> ipInfo = new HashMap<>();
                ipInfo.put("ip", entry.getKey());
                ipInfo.put("eventCount", entry.getValue().getEventCount());
                ipInfo.put("lastActivity", entry.getValue().getLastActivity());
                ipInfo.put("shouldBlock", entry.getValue().shouldBlock());
                return ipInfo;
            })
            .toList();
    }

    private double calculateSecurityScore() {
        long totalEvents = securityEventCounts.values().stream()
            .mapToLong(AtomicLong::get)
            .sum();
        
        // 기본 점수 100에서 보안 이벤트에 따라 차감
        double score = 100.0;
        score -= Math.min(totalEvents * 0.5, 50); // 최대 50점 차감
        score -= Math.min(suspiciousIPs.size() * 2, 30); // 최대 30점 차감
        
        return Math.max(score, 0);
    }

    private List<String> generateSecurityRecommendations() {
        List<String> recommendations = new java.util.ArrayList<>();
        
        long totalEvents = securityEventCounts.values().stream()
            .mapToLong(AtomicLong::get)
            .sum();
        
        if (totalEvents > 100) {
            recommendations.add("보안 이벤트가 많이 발생하고 있습니다. WAF(Web Application Firewall) 도입을 검토하세요.");
        }
        
        if (suspiciousIPs.size() > 50) {
            recommendations.add("의심스러운 IP가 많습니다. IP 차단 정책을 강화하세요.");
        }
        
        if (securityEventCounts.getOrDefault("SQL_INJECTION_ATTEMPT", new AtomicLong(0)).get() > 10) {
            recommendations.add("SQL 인젝션 시도가 빈번합니다. 입력 유효성 검사를 강화하세요.");
        }
        
        if (securityEventCounts.getOrDefault("XSS_ATTEMPT", new AtomicLong(0)).get() > 10) {
            recommendations.add("XSS 공격 시도가 감지되었습니다. 출력 인코딩을 강화하세요.");
        }
        
        if (recommendations.isEmpty()) {
            recommendations.add("현재 보안 상태가 양호합니다. 지속적인 모니터링을 유지하세요.");
        }
        
        return recommendations;
    }

    // === Inner Classes ===

    public static class SuspiciousActivity {
        private final String ip;
        private long eventCount = 0;
        private LocalDateTime firstSeen;
        private LocalDateTime lastActivity;
        private final Map<SecurityEventType, Long> eventTypes = new HashMap<>();

        public SuspiciousActivity(String ip) {
            this.ip = ip;
            this.firstSeen = LocalDateTime.now();
            this.lastActivity = LocalDateTime.now();
        }

        public void recordEvent(SecurityEventType eventType) {
            eventCount++;
            lastActivity = LocalDateTime.now();
            eventTypes.merge(eventType, 1L, Long::sum);
        }

        public boolean isSuspicious() {
            return eventCount >= 5 || 
                   eventTypes.containsKey(SecurityEventType.SQL_INJECTION_ATTEMPT) ||
                   eventTypes.containsKey(SecurityEventType.XSS_ATTEMPT);
        }

        public boolean shouldBlock() {
            return eventCount >= 10 || 
                   (eventTypes.containsKey(SecurityEventType.SQL_INJECTION_ATTEMPT) && 
                    eventTypes.get(SecurityEventType.SQL_INJECTION_ATTEMPT) >= 3);
        }

        // Getters
        public String getIp() { return ip; }
        public long getEventCount() { return eventCount; }
        public LocalDateTime getFirstSeen() { return firstSeen; }
        public LocalDateTime getLastActivity() { return lastActivity; }
        public Map<SecurityEventType, Long> getEventTypes() { return new HashMap<>(eventTypes); }
    }
}
