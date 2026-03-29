package com.coresolution.core.service;

import com.coresolution.core.config.AIMonitoringConfig;
import com.coresolution.core.domain.SecurityThreatDetection;
import com.coresolution.core.repository.SecurityThreatDetectionRepository;
import com.coresolution.core.service.OpenAIMonitoringService.SecurityThreatAnalysisResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * 보안 위협 탐지 서비스 (AI 기반)
 * 민감정보 마스킹 적용
 * 
 * @author CoreSolution
 * @version 2.0.0 (AI Enhanced)
 * @since 2025-12-02
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnBean(RedisTemplate.class)
public class SecurityThreatDetectionService {
    
    private final SecurityThreatDetectionRepository threatDetectionRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final AIMonitoringConfig aiConfig;
    
    @Autowired(required = false)
    private OpenAIMonitoringService openAIMonitoringService;
    
    @Autowired(required = false)
    private SensitiveDataMaskingService maskingService;
    
    private static final int BRUTE_FORCE_THRESHOLD = 5; // 5회
    private static final int DDOS_THRESHOLD = 100; // 100회/분
    
    /**
     * Brute Force 공격 탐지 (하이브리드)
     */
    public void detectBruteForce(String sourceIp, String userEmail, String targetUrl) {
        try {
            LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
            long attemptCount = threatDetectionRepository.countBySourceIpAndDetectedAtAfter(sourceIp, oneHourAgo);
            
            // 1단계: 규칙 기반 필터링
            if (attemptCount < BRUTE_FORCE_THRESHOLD) {
                return; // 정상 범위
            }
            
            double confidenceScore = Math.min((double) attemptCount / (BRUTE_FORCE_THRESHOLD * 2), 1.0);
            String severity = getSeverity(confidenceScore);
            
            // 2단계: AI 분석 (심각한 경우에만)
            String aiAnalysis = null;
            String aiRecommendation = null;
            String modelUsed = "RULE_BASED";
            
            if (shouldUseAI() && attemptCount >= BRUTE_FORCE_THRESHOLD * 1.5) {
                try {
                    Map<String, Object> eventDetails = new HashMap<>();
                    eventDetails.put("sourceIp", sourceIp);
                    eventDetails.put("userEmail", userEmail);
                    eventDetails.put("attemptCount", attemptCount);
                    eventDetails.put("timeWindow", "1 hour");
                    eventDetails.put("targetUrl", targetUrl);
                    
                    SecurityThreatAnalysisResult aiResult = 
                        openAIMonitoringService.analyzeSecurityThreat("BRUTE_FORCE", eventDetails);
                    
                    if (aiResult != null && aiResult.isThreat()) {
                        severity = aiResult.getSeverity();
                        confidenceScore = aiResult.getThreatScore();
                        aiAnalysis = aiResult.getAnalysis();
                        aiRecommendation = aiResult.getRecommendation();
                        modelUsed = "OPENAI_GPT";
                        
                        log.info("🤖 AI Brute Force 분석: ip={}, severity={}, score={}", 
                            sourceIp, severity, confidenceScore);
                    }
                } catch (Exception e) {
                    log.warn("AI 분석 실패, 규칙 기반으로 대체: {}", e.getMessage());
                }
            }
            
            // 3단계: 위협 저장
            SecurityThreatDetection threat = SecurityThreatDetection.builder()
                .tenantId(null)
                .threatType("BRUTE_FORCE")
                .severity(severity)
                .sourceIp(sourceIp)
                .targetUrl(targetUrl)
                .userEmail(userEmail)
                .attackPattern(String.format("로그인 실패 %d회", attemptCount))
                .confidenceScore(confidenceScore)
                .modelUsed(modelUsed)
                .aiAnalysis(aiAnalysis)
                .aiRecommendation(aiRecommendation)
                .blocked(false)
                .autoBlocked(false)
                .detectedAt(LocalDateTime.now())
                .build();
            
            threatDetectionRepository.save(threat);
            
            // 로그 출력 시 마스킹 (운영 환경)
            String maskedIp = maskingService != null ? maskingService.maskIpAddress(sourceIp) : sourceIp;
            String maskedEmail = maskingService != null ? maskingService.maskEmail(userEmail) : userEmail;
            
            log.warn("🚨 Brute Force 공격 탐지: ip={}, email={}, attempts={}, severity={}, model={}", 
                maskedIp, maskedEmail, attemptCount, severity, modelUsed);
            
            // 자동 차단
            if (attemptCount >= BRUTE_FORCE_THRESHOLD * 2) {
                autoBlockIp(sourceIp, "BRUTE_FORCE", threat.getId(), threat.getTenantId());
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
                autoBlockIp(sourceIp, "DDOS", threat.getId(), threat.getTenantId());
            }
        } catch (Exception e) {
            log.error("DDoS 탐지 실패", e);
        }
    }
    
    /**
     * SQL Injection 탐지 (하이브리드)
     */
    public void detectSqlInjection(String sourceIp, String targetUrl, String payload) {
        try {
            // 1단계: 규칙 기반 패턴 검사
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
            String matchedPattern = null;
            for (String pattern : sqlPatterns) {
                if (payload != null && payload.toUpperCase().contains(pattern.toUpperCase())) {
                    isSqlInjection = true;
                    matchedPattern = pattern;
                    break;
                }
            }
            
            if (!isSqlInjection) {
                return; // 정상
            }
            
            // 2단계: AI 분석 (의심스러운 패턴)
            String severity = "HIGH";
            double confidenceScore = 0.95;
            String aiAnalysis = null;
            String aiRecommendation = null;
            String modelUsed = "RULE_BASED";
            
            if (shouldUseAI()) {
                try {
                    Map<String, Object> eventDetails = new HashMap<>();
                    eventDetails.put("sourceIp", sourceIp);
                    eventDetails.put("targetUrl", targetUrl);
                    eventDetails.put("payload", payload);
                    eventDetails.put("matchedPattern", matchedPattern);
                    eventDetails.put("payloadLength", payload.length());
                    
                    SecurityThreatAnalysisResult aiResult = 
                        openAIMonitoringService.analyzeSecurityThreat("SQL_INJECTION", eventDetails);
                    
                    if (aiResult != null && aiResult.isThreat()) {
                        severity = aiResult.getSeverity();
                        confidenceScore = aiResult.getThreatScore();
                        aiAnalysis = aiResult.getAnalysis();
                        aiRecommendation = aiResult.getRecommendation();
                        modelUsed = "OPENAI_GPT";
                        
                        log.info("🤖 AI SQL Injection 분석: ip={}, severity={}, score={}", 
                            sourceIp, severity, confidenceScore);
                    }
                } catch (Exception e) {
                    log.warn("AI 분석 실패, 규칙 기반으로 대체: {}", e.getMessage());
                }
            }
            
            // 3단계: 위협 저장
            SecurityThreatDetection threat = SecurityThreatDetection.builder()
                .tenantId(null)
                .threatType("SQL_INJECTION")
                .severity(severity)
                .sourceIp(sourceIp)
                .targetUrl(targetUrl)
                .attackPattern(payload)
                .confidenceScore(confidenceScore)
                .modelUsed(modelUsed)
                .aiAnalysis(aiAnalysis)
                .aiRecommendation(aiRecommendation)
                .blocked(false)
                .autoBlocked(false)
                .detectedAt(LocalDateTime.now())
                .build();
            
            threatDetectionRepository.save(threat);
            
            log.warn("🚨 SQL Injection 탐지: ip={}, url={}, model={}", sourceIp, targetUrl, modelUsed);
            
            // 자동 차단
            autoBlockIp(sourceIp, "SQL_INJECTION", threat.getId(), threat.getTenantId());
        } catch (Exception e) {
            log.error("SQL Injection 탐지 실패", e);
        }
    }
    
    /**
     * IP 자동 차단
     */
    private void autoBlockIp(String sourceIp, String threatType, Long threatId, String tenantId) {
        try {
            String key = "blocked:ip:" + sourceIp;
            redisTemplate.opsForValue().set(key, true, 30, TimeUnit.MINUTES);
            
            // 위협 탐지 레코드 업데이트
            SecurityThreatDetection threat = threatDetectionRepository.findByIdAndTenantId(threatId, tenantId).orElse(null);
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
     * AI 사용 여부 판단
     */
    private boolean shouldUseAI() {
        return openAIMonitoringService != null && 
               aiConfig != null && 
               aiConfig.isEnabled();
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

