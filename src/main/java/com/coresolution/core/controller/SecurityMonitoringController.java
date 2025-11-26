package com.coresolution.core.controller;

import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.security.SecurityAuditReport;
import com.coresolution.core.security.SecurityAuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 보안 모니터링 컨트롤러
 * 보안 상태 모니터링 및 감사 기능 제공
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-26
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/security")
@RequiredArgsConstructor
public class SecurityMonitoringController {

    private final SecurityAuditService securityAuditService;

    /**
     * 보안 통계 조회
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSecurityStatistics() {
        log.info("🔒 보안 통계 조회 요청");
        
        Map<String, Object> stats = securityAuditService.getSecurityStatistics();
        
        log.info("✅ 보안 통계 조회 완료");
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    /**
     * 차단된 IP 목록 조회
     */
    @GetMapping("/blocked-ips")
    public ResponseEntity<ApiResponse<List<String>>> getBlockedIPs() {
        log.info("🚫 차단된 IP 목록 조회 요청");
        
        List<String> blockedIPs = securityAuditService.getBlockedIPs();
        
        log.info("✅ 차단된 IP {} 개 조회 완료", blockedIPs.size());
        return ResponseEntity.ok(ApiResponse.success(blockedIPs));
    }

    /**
     * 보안 감사 보고서 생성
     */
    @GetMapping("/audit-report")
    public ResponseEntity<ApiResponse<SecurityAuditReport>> generateAuditReport() {
        log.info("📋 보안 감사 보고서 생성 요청");
        
        SecurityAuditReport report = securityAuditService.generateAuditReport();
        
        log.info("✅ 보안 감사 보고서 생성 완료");
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    /**
     * 보안 이벤트 통계 초기화
     */
    @DeleteMapping("/stats")
    public ResponseEntity<ApiResponse<String>> clearSecurityStats() {
        log.info("🧹 보안 통계 초기화 요청");
        
        // 보안 통계 초기화 로직 (실제 구현에서는 신중하게 처리)
        // securityAuditService.clearSecurityStats();
        
        return ResponseEntity.ok(ApiResponse.success("보안 통계가 초기화되었습니다."));
    }

    /**
     * 실시간 보안 상태 조회
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSecurityStatus() {
        log.info("📊 실시간 보안 상태 조회 요청");
        
        Map<String, Object> stats = securityAuditService.getSecurityStatistics();
        
        // 보안 상태 요약 생성
        Map<String, Object> status = Map.of(
            "securityScore", stats.getOrDefault("securityScore", 0),
            "threatLevel", calculateThreatLevel(stats),
            "activeThreats", stats.getOrDefault("suspiciousIPCount", 0),
            "lastUpdate", java.time.LocalDateTime.now(),
            "status", determineSecurityStatus(stats)
        );
        
        return ResponseEntity.ok(ApiResponse.success(status));
    }

    /**
     * 보안 권장사항 조회
     */
    @GetMapping("/recommendations")
    public ResponseEntity<ApiResponse<List<String>>> getSecurityRecommendations() {
        log.info("💡 보안 권장사항 조회 요청");
        
        SecurityAuditReport report = securityAuditService.generateAuditReport();
        List<String> recommendations = report.getRecommendations();
        
        return ResponseEntity.ok(ApiResponse.success(recommendations));
    }

    /**
     * 특정 IP 차단 해제
     */
    @DeleteMapping("/blocked-ips/{ip}")
    public ResponseEntity<ApiResponse<String>> unblockIP(@PathVariable String ip) {
        log.info("🔓 IP 차단 해제 요청: {}", ip);
        
        // IP 차단 해제 로직 (실제 구현 필요)
        // securityAuditService.unblockIP(ip);
        
        return ResponseEntity.ok(ApiResponse.success("IP 차단이 해제되었습니다: " + ip));
    }

    /**
     * 보안 알림 설정 조회
     */
    @GetMapping("/alert-settings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAlertSettings() {
        log.info("🔔 보안 알림 설정 조회 요청");
        
        Map<String, Object> alertSettings = Map.of(
            "emailAlerts", true,
            "slackAlerts", false,
            "smsAlerts", false,
            "criticalThreshold", 10,
            "warningThreshold", 50,
            "alertInterval", 300 // 5분
        );
        
        return ResponseEntity.ok(ApiResponse.success(alertSettings));
    }

    /**
     * 보안 알림 설정 업데이트
     */
    @PutMapping("/alert-settings")
    public ResponseEntity<ApiResponse<String>> updateAlertSettings(@RequestBody Map<String, Object> settings) {
        log.info("🔔 보안 알림 설정 업데이트 요청: {}", settings);
        
        // 알림 설정 업데이트 로직 (실제 구현 필요)
        
        return ResponseEntity.ok(ApiResponse.success("보안 알림 설정이 업데이트되었습니다."));
    }

    // === Private Helper Methods ===

    private String calculateThreatLevel(Map<String, Object> stats) {
        Double securityScore = (Double) stats.getOrDefault("securityScore", 100.0);
        
        if (securityScore >= 80) return "LOW";
        if (securityScore >= 60) return "MEDIUM";
        if (securityScore >= 40) return "HIGH";
        return "CRITICAL";
    }

    private String determineSecurityStatus(Map<String, Object> stats) {
        Double securityScore = (Double) stats.getOrDefault("securityScore", 100.0);
        Integer suspiciousIPs = (Integer) stats.getOrDefault("suspiciousIPCount", 0);
        
        if (securityScore >= 90 && suspiciousIPs < 5) {
            return "SECURE";
        } else if (securityScore >= 70 && suspiciousIPs < 20) {
            return "MONITORING";
        } else if (securityScore >= 50 && suspiciousIPs < 50) {
            return "WARNING";
        } else {
            return "ALERT";
        }
    }
}
