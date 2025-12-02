package com.coresolution.core.service;

import com.coresolution.core.domain.SecurityThreatDetection;
import com.coresolution.core.repository.SecurityThreatDetectionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

/**
 * 보안 위협 탐지 서비스
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-02
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SecurityThreatDetectionService {
    
    private final SecurityThreatDetectionRepository threatDetectionRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    
    private static final int BRUTE_FORCE_THRESHOLD = 5; // 5회
    private static final int DDOS_THRESHOLD = 100; // 100회/분
    
    /**
     * Brute Force 공격 탐지
     */
    public void detectBruteForce(String sourceIp, String userEmail, String targetUrl) {
        try {
            LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
            long attemptCount = threatDetectionRepository.countBySourceIpAndDetectedAtAfter(sourceIp, oneHourAgo);
            
            if (attemptCount >= BRUTE_FORCE_THRESHOLD) {
                double confidenceScore = Math.min((double) attemptCount / (BRUTE_FORCE_THRESHOLD * 2), 1.0);
                String severity = getSeverity(confidenceScore);
                
                SecurityThreatDetection threat = SecurityThreatDetection.builder()
                    .tenantId(null) // 시스템 레벨
                    .threatType("BRUTE_FORCE")
                    .severity(severity)
                    .sourceIp(sourceIp)
                    .targetUrl(targetUrl)
                    .userEmail(userEmail)
                    .attackPattern(String.format("로그인 실패 %d회", attemptCount))
                    .confidenceScore(confidenceScore)
                    .blocked(false)
                    .autoBlocked(false)
                    .detectedAt(LocalDateTime.now())
                    .build();
                
                threatDetectionRepository.save(threat);
                
                log.warn("🚨 Brute Force 공격 탐지: ip={}, email={}, attempts={}, severity={}", 
                    sourceIp, userEmail, attemptCount, severity);
                
                // 임계값 초과 시 자동 차단
                if (attemptCount >= BRUTE_FORCE_THRESHOLD * 2) {
                    autoBlockIp(sourceIp, "BRUTE_FORCE", threat.getId());
                }
            }
        } catch (Exception e) {
            log.error("Brute Force 탐지 실패", e);
        }
    }
    
    /**
     * DDoS 공격 탐지
     */
    public void detectDDoS(String sourceIp, String targetUrl) {
        try {
            String key = "ddos:count:" + sourceIp;
            Long count = redisTemplate.opsForValue().increment(key);
            
            if (count != null && count == 1) {
                redisTemplate.expire(key, 1, TimeUnit.MINUTES);
            }
            
            if (count != null && count > DDOS_THRESHOLD) {
                long countValue = count; // null 체크 후 언박싱
                double confidenceScore = Math.min((double) countValue / (DDOS_THRESHOLD * 2), 1.0);
                String severity = getSeverity(confidenceScore);
                
                SecurityThreatDetection threat = SecurityThreatDetection.builder()
                    .tenantId(null)
                    .threatType("DDOS")
                    .severity(severity)
                    .sourceIp(sourceIp)
                    .targetUrl(targetUrl)
                    .attackPattern(String.format("1분간 %d회 요청", countValue))
                    .confidenceScore(confidenceScore)
                    .blocked(false)
                    .autoBlocked(false)
                    .detectedAt(LocalDateTime.now())
                    .build();
                
                threatDetectionRepository.save(threat);
                
                log.warn("🚨 DDoS 공격 탐지: ip={}, requests={}/min, severity={}", 
                    sourceIp, count, severity);
                
                // 자동 차단
                autoBlockIp(sourceIp, "DDOS", threat.getId());
            }
        } catch (Exception e) {
            log.error("DDoS 탐지 실패", e);
        }
    }
    
    /**
     * SQL Injection 탐지
     */
    public void detectSqlInjection(String sourceIp, String targetUrl, String payload) {
        try {
            // SQL Injection 패턴 검사
            String[] sqlPatterns = {
                "' OR '1'='1",
                "' OR 1=1--",
                "'; DROP TABLE",
                "UNION SELECT",
                "' AND '1'='1",
                "<script>",
                "javascript:",
                "onerror="
            };
            
            boolean isSqlInjection = false;
            for (String pattern : sqlPatterns) {
                if (payload != null && payload.toUpperCase().contains(pattern.toUpperCase())) {
                    isSqlInjection = true;
                    break;
                }
            }
            
            if (isSqlInjection) {
                SecurityThreatDetection threat = SecurityThreatDetection.builder()
                    .tenantId(null)
                    .threatType("SQL_INJECTION")
                    .severity("HIGH")
                    .sourceIp(sourceIp)
                    .targetUrl(targetUrl)
                    .attackPattern(payload)
                    .confidenceScore(0.95)
                    .blocked(false)
                    .autoBlocked(false)
                    .detectedAt(LocalDateTime.now())
                    .build();
                
                threatDetectionRepository.save(threat);
                
                log.warn("🚨 SQL Injection 탐지: ip={}, url={}", sourceIp, targetUrl);
                
                // 자동 차단
                autoBlockIp(sourceIp, "SQL_INJECTION", threat.getId());
            }
        } catch (Exception e) {
            log.error("SQL Injection 탐지 실패", e);
        }
    }
    
    /**
     * IP 자동 차단
     */
    private void autoBlockIp(String sourceIp, String threatType, Long threatId) {
        try {
            String key = "blocked:ip:" + sourceIp;
            redisTemplate.opsForValue().set(key, true, 30, TimeUnit.MINUTES);
            
            // 위협 탐지 레코드 업데이트
            SecurityThreatDetection threat = threatDetectionRepository.findById(threatId).orElse(null);
            if (threat != null) {
                threat.setBlocked(true);
                threat.setAutoBlocked(true);
                threatDetectionRepository.save(threat);
            }
            
            log.warn("🔒 IP 자동 차단: ip={}, threatType={}, duration=30분", sourceIp, threatType);
        } catch (Exception e) {
            log.error("IP 자동 차단 실패: ip={}", sourceIp, e);
        }
    }
    
    /**
     * IP 차단 여부 확인
     */
    public boolean isIpBlocked(String sourceIp) {
        try {
            String key = "blocked:ip:" + sourceIp;
            Boolean blocked = (Boolean) redisTemplate.opsForValue().get(key);
            return blocked != null && blocked;
        } catch (Exception e) {
            log.error("IP 차단 확인 실패: ip={}", sourceIp, e);
            return false;
        }
    }
    
    /**
     * 심각도 계산
     */
    private String getSeverity(double confidenceScore) {
        if (confidenceScore >= 0.95) return "CRITICAL";
        if (confidenceScore >= 0.85) return "HIGH";
        if (confidenceScore >= 0.70) return "MEDIUM";
        return "LOW";
    }
}

