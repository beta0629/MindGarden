# AI 기반 모니터링 및 알림 표준

**버전**: 2.0.0  
**최종 업데이트**: 2025-12-02  
**상태**: 공식 표준

---

## 📋 개요

CoreSolution 플랫폼의 AI 기반 시스템 모니터링 및 알림 표준입니다. 성능 모니터링, 헬스 체크, 메트릭 수집, AI 이상 탐지, 예측 분석, 자동 대응, 알림 채널 관리를 정의합니다.

### 🤖 AI 모니터링 핵심 기능

1. **이상 탐지 (Anomaly Detection)**: 정상 패턴 학습 후 이상 징후 자동 감지
2. **예측 분석 (Predictive Analytics)**: 미래 리소스 사용량 예측 및 사전 알림
3. **근본 원인 분석 (Root Cause Analysis)**: AI 기반 문제 원인 자동 분석
4. **자동 대응 (Auto-Remediation)**: 특정 문제에 대한 자동 복구 조치
5. **지능형 알림 (Intelligent Alerting)**: 알림 우선순위 자동 조정 및 중복 제거
6. **보안 위협 탐지 (Security Threat Detection)**: AI 기반 해킹 시도 및 보안 위협 실시간 감지
7. **행위 분석 (Behavioral Analysis)**: 사용자/시스템 행위 패턴 분석 및 이상 행위 탐지
8. **공격 패턴 인식 (Attack Pattern Recognition)**: 알려진/알려지지 않은 공격 패턴 자동 인식

---

## 🎯 핵심 원칙

### ⭐ 사전 예방적 모니터링 원칙

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  문제가 발생하기 전에 감지하고 알림을 발송해야 합니다
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**모니터링 원칙**:
- ✅ 실시간 메트릭 수집
- ✅ AI 기반 이상 탐지 (정적 임계값 + 동적 패턴 분석)
- ✅ 예측 분석 (미래 리소스 부족 사전 경고)
- ✅ 근본 원인 자동 분석
- ✅ 다중 알림 채널 (이메일, Slack, SMS)
- ✅ 지능형 알림 우선순위 관리
- ✅ 알림 중복 방지 (AI 기반)
- ✅ 알림 이력 저장 및 학습
- ✅ 자동 대응 (Self-Healing)
- ❌ 수동 모니터링 의존 금지
- ❌ 단일 임계값 의존 금지 (동적 임계값 필수)
- ❌ 단일 알림 채널 의존 금지

---

## 🤖 AI 모니터링 아키텍처

### 1. AI 모니터링 파이프라인

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI 모니터링 파이프라인                          │
└─────────────────────────────────────────────────────────────────┘

1. 데이터 수집 (Data Collection)
   ↓
   [메트릭 수집기] → [시계열 DB (InfluxDB/Prometheus)]
   
2. 전처리 (Preprocessing)
   ↓
   [정규화] → [이상치 제거] → [특성 추출]
   
3. AI 분석 (AI Analysis)
   ↓
   ┌─────────────────────────────────────────────┐
   │ • 이상 탐지 (Isolation Forest, LSTM)       │
   │ • 예측 분석 (Prophet, ARIMA)               │
   │ • 근본 원인 분석 (Decision Tree)            │
   │ • 패턴 인식 (Clustering)                   │
   └─────────────────────────────────────────────┘
   
4. 의사결정 (Decision Making)
   ↓
   [알림 필요성 판단] → [우선순위 결정] → [대응 방안 선택]
   
5. 실행 (Execution)
   ↓
   ┌─────────────────────────────────────────────┐
   │ • 알림 발송 (이메일/Slack/SMS)              │
   │ • 자동 대응 (스케일링, 재시작 등)            │
   │ • 대시보드 업데이트                         │
   └─────────────────────────────────────────────┘
   
6. 학습 (Learning)
   ↓
   [피드백 수집] → [모델 재학습] → [성능 개선]
```

### 2. AI 모델 선택 기준

| 분석 유형 | 추천 모델 | 설명 |
|----------|----------|------|
| **이상 탐지** | Isolation Forest | 비지도 학습, 고차원 데이터 효과적 |
| **이상 탐지** | LSTM AutoEncoder | 시계열 패턴 학습, 정상 패턴 재구성 |
| **예측 분석** | Prophet | 계절성 고려, 트렌드 예측 |
| **예측 분석** | ARIMA | 시계열 예측, 단기 예측 |
| **근본 원인 분석** | Decision Tree | 해석 가능, 원인 추적 용이 |
| **패턴 인식** | K-Means | 클러스터링, 정상/비정상 그룹화 |
| **보안 위협 탐지** | Random Forest | 다차원 보안 이벤트 분류 |
| **행위 분석** | LSTM | 시계열 행위 패턴 학습 |

---

## 🛡️ AI 기반 보안 모니터링

### 1. 보안 위협 탐지 시스템

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class AISecurityMonitoringService {
    
    private final SecurityEventRepository eventRepository;
    private final AIModelService aiModelService;
    private final SecurityAlertService securityAlertService;
    private final SecurityResponseService securityResponseService;
    
    /**
     * AI 기반 보안 위협 탐지
     */
    @Scheduled(fixedRate = 10000) // 10초마다
    public void detectSecurityThreats() {
        try {
            // 1. 최근 보안 이벤트 수집
            List<SecurityEvent> recentEvents = eventRepository
                .findRecentEvents(LocalDateTime.now().minusMinutes(10));
            
            if (recentEvents.isEmpty()) {
                return;
            }
            
            // 2. AI 모델로 위협 분석
            SecurityThreatAnalysis analysis = aiModelService.analyzeSecurityThreats(recentEvents);
            
            // 3. 위협 수준 판단
            if (analysis.getThreatLevel() >= ThreatLevel.HIGH) {
                handleHighThreat(analysis);
            } else if (analysis.getThreatLevel() >= ThreatLevel.MEDIUM) {
                handleMediumThreat(analysis);
            }
            
            // 4. 분석 결과 저장 (학습 데이터)
            saveAnalysisResult(analysis);
            
        } catch (Exception e) {
            log.error("보안 위협 탐지 실패", e);
        }
    }
    
    /**
     * 고위험 위협 처리
     */
    private void handleHighThreat(SecurityThreatAnalysis analysis) {
        log.error("🚨 고위험 보안 위협 감지: {}", analysis.getThreatType());
        
        // 1. 즉시 알림 발송 (모든 채널)
        securityAlertService.sendCriticalAlert(analysis);
        
        // 2. 자동 대응 실행
        securityResponseService.executeAutoResponse(analysis);
        
        // 3. 관리자에게 SMS 발송
        securityAlertService.sendSmsAlert(analysis);
    }
    
    /**
     * 중위험 위협 처리
     */
    private void handleMediumThreat(SecurityThreatAnalysis analysis) {
        log.warn("⚠️ 중위험 보안 위협 감지: {}", analysis.getThreatType());
        
        // 1. 알림 발송 (이메일, Slack)
        securityAlertService.sendWarningAlert(analysis);
        
        // 2. 모니터링 강화
        securityResponseService.enhanceMonitoring(analysis);
    }
}
```

### 2. 보안 위협 유형

```java
public enum SecurityThreatType {
    // 인증 관련
    BRUTE_FORCE_ATTACK("무차별 대입 공격", ThreatLevel.HIGH),
    CREDENTIAL_STUFFING("크리덴셜 스터핑", ThreatLevel.HIGH),
    SESSION_HIJACKING("세션 하이재킹", ThreatLevel.CRITICAL),
    
    // 주입 공격
    SQL_INJECTION("SQL 인젝션", ThreatLevel.CRITICAL),
    XSS_ATTACK("XSS 공격", ThreatLevel.HIGH),
    COMMAND_INJECTION("커맨드 인젝션", ThreatLevel.CRITICAL),
    
    // DDoS 공격
    DDOS_ATTACK("DDoS 공격", ThreatLevel.CRITICAL),
    API_ABUSE("API 남용", ThreatLevel.MEDIUM),
    RATE_LIMIT_EXCEEDED("요청 제한 초과", ThreatLevel.MEDIUM),
    
    // 데이터 유출
    DATA_EXFILTRATION("데이터 유출 시도", ThreatLevel.CRITICAL),
    UNAUTHORIZED_ACCESS("무단 접근", ThreatLevel.HIGH),
    PRIVILEGE_ESCALATION("권한 상승 시도", ThreatLevel.HIGH),
    
    // 악성 행위
    MALWARE_DETECTED("악성코드 탐지", ThreatLevel.CRITICAL),
    SUSPICIOUS_FILE_UPLOAD("의심스러운 파일 업로드", ThreatLevel.HIGH),
    ABNORMAL_BEHAVIOR("비정상 행위", ThreatLevel.MEDIUM),
    
    // 네트워크 공격
    PORT_SCANNING("포트 스캐닝", ThreatLevel.MEDIUM),
    IP_SPOOFING("IP 스푸핑", ThreatLevel.HIGH),
    MAN_IN_THE_MIDDLE("중간자 공격", ThreatLevel.CRITICAL);
    
    private final String description;
    private final ThreatLevel defaultLevel;
    
    SecurityThreatType(String description, ThreatLevel defaultLevel) {
        this.description = description;
        this.defaultLevel = defaultLevel;
    }
}

public enum ThreatLevel {
    LOW(1),
    MEDIUM(2),
    HIGH(3),
    CRITICAL(4);
    
    private final int severity;
    
    ThreatLevel(int severity) {
        this.severity = severity;
    }
}
```

### 3. AI 기반 무차별 대입 공격 탐지

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class BruteForceDetectionService {
    
    private final LoginAttemptRepository loginAttemptRepository;
    private final AIModelService aiModelService;
    private final SecurityResponseService responseService;
    
    /**
     * 무차별 대입 공격 탐지
     */
    public void detectBruteForceAttack(String ipAddress, String username) {
        // 1. 최근 로그인 시도 이력 조회 (10분)
        List<LoginAttempt> recentAttempts = loginAttemptRepository
            .findByIpAddressAndTimestampAfter(
                ipAddress, 
                LocalDateTime.now().minusMinutes(10)
            );
        
        // 2. AI 모델로 패턴 분석
        BruteForceAnalysis analysis = aiModelService.analyzeBruteForce(recentAttempts);
        
        // 3. 공격 판단
        if (analysis.isBruteForceAttack()) {
            log.error("🚨 무차별 대입 공격 감지: ip={}, username={}, confidence={}", 
                ipAddress, username, analysis.getConfidence());
            
            // 4. 자동 대응
            responseService.blockIpAddress(ipAddress, Duration.ofHours(24));
            
            // 5. 알림 발송
            SecurityThreatAnalysis threat = SecurityThreatAnalysis.builder()
                .threatType(SecurityThreatType.BRUTE_FORCE_ATTACK)
                .threatLevel(ThreatLevel.HIGH)
                .ipAddress(ipAddress)
                .username(username)
                .confidence(analysis.getConfidence())
                .details(String.format("10분간 %d회 로그인 실패", recentAttempts.size()))
                .build();
            
            securityAlertService.sendCriticalAlert(threat);
        }
    }
    
    /**
     * 분산 무차별 대입 공격 탐지 (여러 IP에서 동일 계정 공격)
     */
    @Scheduled(fixedRate = 60000) // 1분마다
    public void detectDistributedBruteForce() {
        // 1. 최근 1시간 로그인 실패 이력 조회
        List<LoginAttempt> failedAttempts = loginAttemptRepository
            .findFailedAttemptsAfter(LocalDateTime.now().minusHours(1));
        
        // 2. 계정별 그룹화
        Map<String, List<LoginAttempt>> attemptsByUsername = failedAttempts.stream()
            .collect(Collectors.groupingBy(LoginAttempt::getUsername));
        
        // 3. 각 계정별 분석
        for (Map.Entry<String, List<LoginAttempt>> entry : attemptsByUsername.entrySet()) {
            String username = entry.getKey();
            List<LoginAttempt> attempts = entry.getValue();
            
            // 여러 IP에서 공격 시도
            Set<String> uniqueIps = attempts.stream()
                .map(LoginAttempt::getIpAddress)
                .collect(Collectors.toSet());
            
            if (uniqueIps.size() >= 5 && attempts.size() >= 20) {
                log.error("🚨 분산 무차별 대입 공격 감지: username={}, ipCount={}, attemptCount={}", 
                    username, uniqueIps.size(), attempts.size());
                
                // 계정 임시 잠금
                responseService.lockAccount(username, Duration.ofHours(1));
                
                // 알림 발송
                SecurityThreatAnalysis threat = SecurityThreatAnalysis.builder()
                    .threatType(SecurityThreatType.BRUTE_FORCE_ATTACK)
                    .threatLevel(ThreatLevel.CRITICAL)
                    .username(username)
                    .details(String.format("분산 공격: %d개 IP에서 %d회 시도", 
                        uniqueIps.size(), attempts.size()))
                    .build();
                
                securityAlertService.sendCriticalAlert(threat);
            }
        }
    }
}
```

### 4. AI 기반 SQL 인젝션 탐지

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class SQLInjectionDetectionService {
    
    private final AIModelService aiModelService;
    private final SecurityAlertService securityAlertService;
    
    /**
     * SQL 인젝션 패턴 탐지
     */
    public boolean detectSQLInjection(String input, String paramName, HttpServletRequest request) {
        // 1. 기본 패턴 매칭 (빠른 탐지)
        if (containsSQLInjectionPattern(input)) {
            handleSQLInjectionAttempt(input, paramName, request, "PATTERN_MATCH");
            return true;
        }
        
        // 2. AI 모델 분석 (정교한 탐지)
        SQLInjectionAnalysis analysis = aiModelService.analyzeSQLInjection(input);
        
        if (analysis.isSQLInjection() && analysis.getConfidence() > 0.8) {
            handleSQLInjectionAttempt(input, paramName, request, "AI_DETECTION");
            return true;
        }
        
        return false;
    }
    
    /**
     * SQL 인젝션 패턴 체크
     */
    private boolean containsSQLInjectionPattern(String input) {
        String[] sqlKeywords = {
            "' OR '1'='1",
            "'; DROP TABLE",
            "' UNION SELECT",
            "'; DELETE FROM",
            "' AND 1=1--",
            "admin'--",
            "' OR 'a'='a",
            "1' OR '1' = '1",
            "'; EXEC",
            "'; SHUTDOWN"
        };
        
        String lowerInput = input.toLowerCase();
        for (String keyword : sqlKeywords) {
            if (lowerInput.contains(keyword.toLowerCase())) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * SQL 인젝션 시도 처리
     */
    private void handleSQLInjectionAttempt(
        String input, 
        String paramName, 
        HttpServletRequest request,
        String detectionMethod
    ) {
        String ipAddress = getClientIpAddress(request);
        String userAgent = request.getHeader("User-Agent");
        
        log.error("🚨 SQL 인젝션 시도 감지: ip={}, param={}, input={}, method={}", 
            ipAddress, paramName, input, detectionMethod);
        
        // 1. IP 차단
        responseService.blockIpAddress(ipAddress, Duration.ofHours(24));
        
        // 2. 알림 발송
        SecurityThreatAnalysis threat = SecurityThreatAnalysis.builder()
            .threatType(SecurityThreatType.SQL_INJECTION)
            .threatLevel(ThreatLevel.CRITICAL)
            .ipAddress(ipAddress)
            .userAgent(userAgent)
            .details(String.format("파라미터: %s, 입력값: %s, 탐지방법: %s", 
                paramName, input, detectionMethod))
            .build();
        
        securityAlertService.sendCriticalAlert(threat);
        
        // 3. 보안 이벤트 저장
        saveSecurityEvent(threat);
    }
}
```

### 5. AI 기반 DDoS 공격 탐지

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class DDoSDetectionService {
    
    private final RequestLogRepository requestLogRepository;
    private final AIModelService aiModelService;
    private final SecurityResponseService responseService;
    
    /**
     * DDoS 공격 탐지
     */
    @Scheduled(fixedRate = 30000) // 30초마다
    public void detectDDoSAttack() {
        try {
            // 1. 최근 1분간 요청 로그 분석
            List<RequestLog> recentRequests = requestLogRepository
                .findRecentRequests(LocalDateTime.now().minusMinutes(1));
            
            // 2. IP별 요청 수 집계
            Map<String, Long> requestCountByIp = recentRequests.stream()
                .collect(Collectors.groupingBy(
                    RequestLog::getIpAddress, 
                    Collectors.counting()
                ));
            
            // 3. AI 모델로 DDoS 패턴 분석
            DDoSAnalysis analysis = aiModelService.analyzeDDoS(
                recentRequests, 
                requestCountByIp
            );
            
            // 4. DDoS 공격 판단
            if (analysis.isDDoSAttack()) {
                handleDDoSAttack(analysis);
            }
            
        } catch (Exception e) {
            log.error("DDoS 탐지 실패", e);
        }
    }
    
    /**
     * DDoS 공격 처리
     */
    private void handleDDoSAttack(DDoSAnalysis analysis) {
        log.error("🚨 DDoS 공격 감지: type={}, attackerCount={}, requestCount={}", 
            analysis.getAttackType(), 
            analysis.getAttackerIps().size(), 
            analysis.getTotalRequests());
        
        // 1. 공격 IP 차단
        for (String attackerIp : analysis.getAttackerIps()) {
            responseService.blockIpAddress(attackerIp, Duration.ofHours(24));
        }
        
        // 2. Rate Limiting 강화
        responseService.enableStrictRateLimiting();
        
        // 3. CDN/WAF 활성화 (Cloudflare 등)
        responseService.enableDDoSProtection();
        
        // 4. 긴급 알림 발송
        SecurityThreatAnalysis threat = SecurityThreatAnalysis.builder()
            .threatType(SecurityThreatType.DDOS_ATTACK)
            .threatLevel(ThreatLevel.CRITICAL)
            .details(String.format("공격 유형: %s, 공격 IP: %d개, 총 요청: %d회", 
                analysis.getAttackType(), 
                analysis.getAttackerIps().size(), 
                analysis.getTotalRequests()))
            .build();
        
        securityAlertService.sendCriticalAlert(threat);
        
        // 5. SMS 알림 (관리자)
        securityAlertService.sendSmsAlert(threat);
    }
}
```

### 6. AI 기반 이상 행위 탐지

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class AbnormalBehaviorDetectionService {
    
    private final UserActivityRepository activityRepository;
    private final AIModelService aiModelService;
    
    /**
     * 사용자 이상 행위 탐지
     */
    public void detectAbnormalBehavior(Long userId, String action) {
        try {
            // 1. 사용자 최근 30일 행위 패턴 조회
            List<UserActivity> historicalActivities = activityRepository
                .findByUserIdAndTimestampAfter(
                    userId, 
                    LocalDateTime.now().minusDays(30)
                );
            
            // 2. 현재 행위 분석
            UserActivity currentActivity = UserActivity.builder()
                .userId(userId)
                .action(action)
                .timestamp(LocalDateTime.now())
                .build();
            
            // 3. AI 모델로 이상 행위 판단
            AbnormalBehaviorAnalysis analysis = aiModelService.analyzeUserBehavior(
                historicalActivities, 
                currentActivity
            );
            
            // 4. 이상 행위 감지 시 처리
            if (analysis.isAbnormal() && analysis.getConfidence() > 0.85) {
                handleAbnormalBehavior(userId, action, analysis);
            }
            
        } catch (Exception e) {
            log.error("이상 행위 탐지 실패: userId={}", userId, e);
        }
    }
    
    /**
     * 이상 행위 처리
     */
    private void handleAbnormalBehavior(
        Long userId, 
        String action, 
        AbnormalBehaviorAnalysis analysis
    ) {
        log.warn("⚠️ 사용자 이상 행위 감지: userId={}, action={}, reason={}", 
            userId, action, analysis.getReason());
        
        // 1. 이상 행위 유형별 대응
        switch (analysis.getAbnormalityType()) {
            case UNUSUAL_TIME:
                // 비정상적인 시간대 접근 (새벽 3시 등)
                securityAlertService.sendWarning(userId, "비정상적인 시간대 접근 감지");
                break;
                
            case UNUSUAL_LOCATION:
                // 비정상적인 위치 접근 (해외 IP 등)
                responseService.requireAdditionalAuth(userId);
                securityAlertService.sendWarning(userId, "비정상적인 위치에서 접근 감지");
                break;
                
            case RAPID_ACTIONS:
                // 비정상적으로 빠른 연속 작업 (봇 의심)
                responseService.enableCaptcha(userId);
                break;
                
            case DATA_DOWNLOAD_SPIKE:
                // 대량 데이터 다운로드 (데이터 유출 의심)
                responseService.temporarilyBlockDownload(userId);
                securityAlertService.sendCriticalAlert(userId, "대량 데이터 다운로드 감지");
                break;
                
            case PRIVILEGE_ABUSE:
                // 권한 남용 의심
                responseService.auditUserActions(userId);
                securityAlertService.sendCriticalAlert(userId, "권한 남용 의심 행위 감지");
                break;
        }
    }
}
```

### 7. 보안 이벤트 테이블

```sql
CREATE TABLE IF NOT EXISTS security_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(50) UNIQUE NOT NULL COMMENT '이벤트 ID (UUID)',
    tenant_id VARCHAR(36) COMMENT '테넌트 ID',
    threat_type VARCHAR(50) NOT NULL COMMENT '위협 유형',
    threat_level VARCHAR(20) NOT NULL COMMENT '위협 수준: LOW, MEDIUM, HIGH, CRITICAL',
    
    -- 공격자 정보
    ip_address VARCHAR(45) COMMENT '공격자 IP',
    user_agent TEXT COMMENT 'User Agent',
    username VARCHAR(100) COMMENT '대상 사용자명',
    user_id BIGINT COMMENT '대상 사용자 ID',
    
    -- 상세 정보
    details TEXT COMMENT '상세 내용',
    attack_payload TEXT COMMENT '공격 페이로드',
    detection_method VARCHAR(50) COMMENT '탐지 방법: PATTERN_MATCH, AI_DETECTION',
    confidence DECIMAL(5, 4) COMMENT 'AI 신뢰도 (0.0000 ~ 1.0000)',
    
    -- 대응 정보
    response_action VARCHAR(100) COMMENT '대응 조치',
    is_blocked BOOLEAN DEFAULT FALSE COMMENT '차단 여부',
    block_duration INT COMMENT '차단 시간 (분)',
    
    -- 알림 정보
    alert_sent BOOLEAN DEFAULT FALSE COMMENT '알림 발송 여부',
    alert_channels JSON COMMENT '알림 채널 목록',
    
    -- 감사 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP COMMENT '해결 시간',
    resolved_by BIGINT COMMENT '해결자 ID',
    
    INDEX idx_threat_type (threat_type),
    INDEX idx_threat_level (threat_level),
    INDEX idx_ip_address (ip_address),
    INDEX idx_username (username),
    INDEX idx_created_at (created_at),
    INDEX idx_tenant_threat_date (tenant_id, threat_type, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='보안 이벤트 테이블';

-- IP 차단 목록
CREATE TABLE IF NOT EXISTS blocked_ips (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45) UNIQUE NOT NULL COMMENT '차단된 IP',
    reason VARCHAR(200) NOT NULL COMMENT '차단 사유',
    threat_type VARCHAR(50) COMMENT '위협 유형',
    block_type VARCHAR(20) DEFAULT 'TEMPORARY' COMMENT '차단 유형: TEMPORARY, PERMANENT',
    blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP COMMENT '차단 만료 시간',
    blocked_by VARCHAR(50) DEFAULT 'SYSTEM' COMMENT '차단 주체: SYSTEM, ADMIN',
    is_active BOOLEAN DEFAULT TRUE,
    
    INDEX idx_ip_address (ip_address),
    INDEX idx_expires_at (expires_at),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='IP 차단 목록 테이블';
```

---

## 📊 시스템 메트릭

### 1. 표준 메트릭 항목

```yaml
# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: when-authorized
  metrics:
    export:
      prometheus:
        enabled: true
    tags:
      application: ${spring.application.name}
      environment: ${spring.profiles.active}

# 모니터링 설정
monitoring:
  enabled: true
  interval: 60  # 초
  
  # 메트릭 수집 항목
  metrics:
    # 시스템 메트릭
    system:
      cpu-usage: true
      memory-usage: true
      disk-usage: true
      network-io: true
    
    # 애플리케이션 메트릭
    application:
      request-count: true
      response-time: true
      error-rate: true
      active-sessions: true
    
    # 데이터베이스 메트릭
    database:
      connection-pool: true
      query-time: true
      slow-query: true
    
    # 비즈니스 메트릭
    business:
      user-count: true
      tenant-count: true
      daily-active-users: true
```

### 2. 메트릭 수집 서비스

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class MetricsCollectionService {
    
    private final MeterRegistry meterRegistry;
    private final SystemMetricsCollector systemCollector;
    private final ApplicationMetricsCollector appCollector;
    private final DatabaseMetricsCollector dbCollector;
    
    /**
     * 시스템 메트릭 수집
     */
    @Scheduled(fixedRate = 60000) // 1분마다
    public void collectSystemMetrics() {
        try {
            // CPU 사용률
            double cpuUsage = systemCollector.getCpuUsage();
            meterRegistry.gauge("system.cpu.usage", cpuUsage);
            
            // 메모리 사용률
            double memoryUsage = systemCollector.getMemoryUsage();
            meterRegistry.gauge("system.memory.usage", memoryUsage);
            
            // 디스크 사용률
            double diskUsage = systemCollector.getDiskUsage();
            meterRegistry.gauge("system.disk.usage", diskUsage);
            
            log.debug("시스템 메트릭 수집: CPU={}%, Memory={}%, Disk={}%", 
                cpuUsage, memoryUsage, diskUsage);
                
        } catch (Exception e) {
            log.error("시스템 메트릭 수집 실패", e);
        }
    }
    
    /**
     * 애플리케이션 메트릭 수집
     */
    @Scheduled(fixedRate = 60000) // 1분마다
    public void collectApplicationMetrics() {
        try {
            // 활성 세션 수
            int activeSessions = appCollector.getActiveSessions();
            meterRegistry.gauge("application.sessions.active", activeSessions);
            
            // 에러율
            double errorRate = appCollector.getErrorRate();
            meterRegistry.gauge("application.error.rate", errorRate);
            
            // 평균 응답 시간
            double avgResponseTime = appCollector.getAverageResponseTime();
            meterRegistry.gauge("application.response.time.avg", avgResponseTime);
            
            log.debug("애플리케이션 메트릭 수집: Sessions={}, ErrorRate={}%, ResponseTime={}ms", 
                activeSessions, errorRate, avgResponseTime);
                
        } catch (Exception e) {
            log.error("애플리케이션 메트릭 수집 실패", e);
        }
    }
    
    /**
     * 커스텀 메트릭 기록
     */
    public void recordCustomMetric(String metricName, double value, String... tags) {
        Counter counter = Counter.builder(metricName)
            .tags(tags)
            .register(meterRegistry);
        counter.increment(value);
    }
}
```

---

## 🚨 알림 임계값

### 1. 표준 임계값 설정

```yaml
# application.yml
monitoring:
  alerts:
    # CPU 사용률 임계값
    cpu-threshold:
      warning: 70   # 70% 이상 경고
      critical: 85  # 85% 이상 위험
    
    # 메모리 사용률 임계값
    memory-threshold:
      warning: 75
      critical: 90
    
    # 디스크 사용률 임계값
    disk-threshold:
      warning: 80
      critical: 95
    
    # API 응답 시간 임계값 (ms)
    response-time-threshold:
      warning: 2000
      critical: 5000
    
    # 에러율 임계값 (%)
    error-rate-threshold:
      warning: 3
      critical: 10
    
    # 데이터베이스 커넥션 풀 임계값
    db-connection-threshold:
      warning: 70
      critical: 90
```

### 2. 알림 체크 서비스

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class AlertCheckService {
    
    private final MetricsCollectionService metricsService;
    private final AlertNotificationService notificationService;
    private final AlertHistoryService historyService;
    
    @Value("${monitoring.alerts.cpu-threshold.warning}")
    private double cpuWarningThreshold;
    
    @Value("${monitoring.alerts.cpu-threshold.critical}")
    private double cpuCriticalThreshold;
    
    @Value("${monitoring.alerts.memory-threshold.warning}")
    private double memoryWarningThreshold;
    
    @Value("${monitoring.alerts.memory-threshold.critical}")
    private double memoryCriticalThreshold;
    
    /**
     * 알림 체크 (매분 실행)
     */
    @Scheduled(fixedRate = 60000)
    public void checkAlerts() {
        try {
            // 1. CPU 사용률 체크
            checkCpuUsage();
            
            // 2. 메모리 사용률 체크
            checkMemoryUsage();
            
            // 3. 디스크 사용률 체크
            checkDiskUsage();
            
            // 4. API 응답 시간 체크
            checkResponseTime();
            
            // 5. 에러율 체크
            checkErrorRate();
            
        } catch (Exception e) {
            log.error("알림 체크 실패", e);
        }
    }
    
    /**
     * CPU 사용률 체크
     */
    private void checkCpuUsage() {
        double cpuUsage = metricsService.getCpuUsage();
        
        if (cpuUsage >= cpuCriticalThreshold) {
            sendAlert(
                AlertLevel.CRITICAL,
                "CPU 사용률 위험",
                String.format("CPU 사용률이 %.2f%%입니다. (임계값: %.0f%%)", 
                    cpuUsage, cpuCriticalThreshold)
            );
        } else if (cpuUsage >= cpuWarningThreshold) {
            sendAlert(
                AlertLevel.WARNING,
                "CPU 사용률 경고",
                String.format("CPU 사용률이 %.2f%%입니다. (임계값: %.0f%%)", 
                    cpuUsage, cpuWarningThreshold)
            );
        }
    }
    
    /**
     * 메모리 사용률 체크
     */
    private void checkMemoryUsage() {
        double memoryUsage = metricsService.getMemoryUsage();
        
        if (memoryUsage >= memoryCriticalThreshold) {
            sendAlert(
                AlertLevel.CRITICAL,
                "메모리 사용률 위험",
                String.format("메모리 사용률이 %.2f%%입니다. (임계값: %.0f%%)", 
                    memoryUsage, memoryCriticalThreshold)
            );
        } else if (memoryUsage >= memoryWarningThreshold) {
            sendAlert(
                AlertLevel.WARNING,
                "메모리 사용률 경고",
                String.format("메모리 사용률이 %.2f%%입니다. (임계값: %.0f%%)", 
                    memoryUsage, memoryWarningThreshold)
            );
        }
    }
    
    /**
     * 알림 발송 (중복 방지)
     */
    private void sendAlert(AlertLevel level, String title, String message) {
        // 중복 알림 방지 (최근 10분 이내 동일 알림 체크)
        if (historyService.isDuplicateAlert(title, 10)) {
            log.debug("중복 알림 방지: {}", title);
            return;
        }
        
        // 알림 발송
        notificationService.sendAlert(level, title, message);
        
        // 알림 이력 저장
        historyService.saveAlert(level, title, message);
    }
}
```

---

## 📢 알림 채널

### 1. 다중 알림 채널 설정

```yaml
# application.yml
monitoring:
  notification:
    channels:
      # 이메일 알림
      email:
        enabled: true
        recipients:
          - admin@coresolution.com
          - devops@coresolution.com
      
      # Slack 알림
      slack:
        enabled: true
        webhook-url: ${SLACK_WEBHOOK_URL}
        channel: "#alerts"
      
      # SMS 알림 (위험 등급만)
      sms:
        enabled: true
        recipients:
          - ${ADMIN_PHONE_1}
          - ${ADMIN_PHONE_2}
        critical-only: true
```

### 2. 알림 발송 서비스

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class AlertNotificationService {
    
    private final EmailService emailService;
    private final SlackService slackService;
    private final SmsService smsService;
    
    @Value("${monitoring.notification.channels.email.enabled}")
    private boolean emailEnabled;
    
    @Value("${monitoring.notification.channels.slack.enabled}")
    private boolean slackEnabled;
    
    @Value("${monitoring.notification.channels.sms.enabled}")
    private boolean smsEnabled;
    
    @Value("${monitoring.notification.channels.sms.critical-only}")
    private boolean smsCriticalOnly;
    
    /**
     * 알림 발송 (다중 채널)
     */
    public void sendAlert(AlertLevel level, String title, String message) {
        log.warn("🚨 알림 발송: level={}, title={}", level, title);
        
        // 1. 이메일 알림
        if (emailEnabled) {
            sendEmailAlert(level, title, message);
        }
        
        // 2. Slack 알림
        if (slackEnabled) {
            sendSlackAlert(level, title, message);
        }
        
        // 3. SMS 알림 (위험 등급만)
        if (smsEnabled && (!smsCriticalOnly || level == AlertLevel.CRITICAL)) {
            sendSmsAlert(level, title, message);
        }
    }
    
    /**
     * 이메일 알림 발송
     */
    private void sendEmailAlert(AlertLevel level, String title, String message) {
        try {
            EmailRequest request = EmailRequest.builder()
                .templateType("SYSTEM_ALERT")
                .subject("[" + level + "] " + title)
                .variables(Map.of(
                    "level", level.name(),
                    "title", title,
                    "message", message,
                    "timestamp", LocalDateTime.now().toString()
                ))
                .build();
            
            emailService.sendTemplateEmail(request);
            
        } catch (Exception e) {
            log.error("이메일 알림 발송 실패", e);
        }
    }
    
    /**
     * Slack 알림 발송
     */
    private void sendSlackAlert(AlertLevel level, String title, String message) {
        try {
            String color = level == AlertLevel.CRITICAL ? "danger" : "warning";
            String emoji = level == AlertLevel.CRITICAL ? "🔴" : "⚠️";
            
            SlackMessage slackMessage = SlackMessage.builder()
                .text(emoji + " " + title)
                .attachments(List.of(
                    SlackAttachment.builder()
                        .color(color)
                        .text(message)
                        .footer("CoreSolution Monitoring")
                        .timestamp(System.currentTimeMillis() / 1000)
                        .build()
                ))
                .build();
            
            slackService.sendMessage(slackMessage);
            
        } catch (Exception e) {
            log.error("Slack 알림 발송 실패", e);
        }
    }
    
    /**
     * SMS 알림 발송
     */
    private void sendSmsAlert(AlertLevel level, String title, String message) {
        try {
            String smsText = String.format("[%s] %s: %s", level, title, message);
            smsService.sendSms(smsText);
            
        } catch (Exception e) {
            log.error("SMS 알림 발송 실패", e);
        }
    }
}
```

---

## 🏥 헬스 체크

### 1. 표준 헬스 체크

```java
@Component
public class CustomHealthIndicator implements HealthIndicator {
    
    @Autowired
    private DataSource dataSource;
    
    @Autowired
    private RedisTemplate<String, String> redisTemplate;
    
    @Override
    public Health health() {
        try {
            // 1. 데이터베이스 체크
            checkDatabase();
            
            // 2. Redis 체크
            checkRedis();
            
            // 3. 외부 API 체크 (선택)
            checkExternalApis();
            
            return Health.up()
                .withDetail("database", "UP")
                .withDetail("redis", "UP")
                .withDetail("timestamp", LocalDateTime.now())
                .build();
                
        } catch (Exception e) {
            return Health.down()
                .withDetail("error", e.getMessage())
                .withDetail("timestamp", LocalDateTime.now())
                .build();
        }
    }
    
    private void checkDatabase() throws Exception {
        try (Connection connection = dataSource.getConnection()) {
            if (!connection.isValid(5)) {
                throw new Exception("데이터베이스 연결 실패");
            }
        }
    }
    
    private void checkRedis() throws Exception {
        String pong = redisTemplate.getConnectionFactory()
            .getConnection()
            .ping();
        
        if (!"PONG".equals(pong)) {
            throw new Exception("Redis 연결 실패");
        }
    }
    
    private void checkExternalApis() {
        // 외부 API 체크 로직
    }
}
```

### 2. 헬스 체크 엔드포인트

```
GET /actuator/health
GET /actuator/health/liveness
GET /actuator/health/readiness
```

---

## 📈 모니터링 대시보드

### 1. 메트릭 조회 API

```java
@RestController
@RequestMapping("/api/v1/admin/monitoring")
@RequiredArgsConstructor
public class MonitoringController {
    
    private final MetricsCollectionService metricsService;
    private final AlertHistoryService alertHistoryService;
    
    /**
     * 시스템 메트릭 조회
     */
    @GetMapping("/metrics/system")
    public ResponseEntity<SystemMetrics> getSystemMetrics() {
        SystemMetrics metrics = SystemMetrics.builder()
            .cpuUsage(metricsService.getCpuUsage())
            .memoryUsage(metricsService.getMemoryUsage())
            .diskUsage(metricsService.getDiskUsage())
            .timestamp(LocalDateTime.now())
            .build();
        
        return ResponseEntity.ok(metrics);
    }
    
    /**
     * 애플리케이션 메트릭 조회
     */
    @GetMapping("/metrics/application")
    public ResponseEntity<ApplicationMetrics> getApplicationMetrics() {
        ApplicationMetrics metrics = ApplicationMetrics.builder()
            .activeSessions(metricsService.getActiveSessions())
            .errorRate(metricsService.getErrorRate())
            .avgResponseTime(metricsService.getAverageResponseTime())
            .requestCount(metricsService.getRequestCount())
            .timestamp(LocalDateTime.now())
            .build();
        
        return ResponseEntity.ok(metrics);
    }
    
    /**
     * 알림 이력 조회
     */
    @GetMapping("/alerts/history")
    public ResponseEntity<List<AlertHistory>> getAlertHistory(
        @RequestParam(required = false) AlertLevel level,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        List<AlertHistory> history = alertHistoryService.getHistory(level, startDate, endDate);
        return ResponseEntity.ok(history);
    }
}
```

---

## 📊 알림 이력 관리

### 1. 알림 이력 테이블

```sql
CREATE TABLE IF NOT EXISTS alert_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    alert_level VARCHAR(20) NOT NULL COMMENT '알림 등급: INFO, WARNING, CRITICAL',
    alert_type VARCHAR(50) NOT NULL COMMENT '알림 타입: CPU, MEMORY, DISK, API, ERROR',
    title VARCHAR(200) NOT NULL COMMENT '알림 제목',
    message TEXT NOT NULL COMMENT '알림 메시지',
    metric_value DECIMAL(10, 2) COMMENT '메트릭 값',
    threshold_value DECIMAL(10, 2) COMMENT '임계값',
    notification_sent BOOLEAN DEFAULT FALSE COMMENT '알림 발송 여부',
    notification_channels JSON COMMENT '발송된 채널 목록',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_alert_level (alert_level),
    INDEX idx_alert_type (alert_type),
    INDEX idx_created_at (created_at),
    INDEX idx_level_date (alert_level, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='알림 이력 테이블';
```

---

## 🚫 금지 사항

### 1. 단일 알림 채널 의존 금지
```yaml
# ❌ 금지 - 이메일만 사용
monitoring:
  notification:
    channels:
      email:
        enabled: true

# ✅ 필수 - 다중 채널 사용
monitoring:
  notification:
    channels:
      email:
        enabled: true
      slack:
        enabled: true
      sms:
        enabled: true
        critical-only: true
```

### 2. 하드코딩된 임계값 금지
```java
// ❌ 금지
if (cpuUsage > 80) {
    sendAlert("CPU 사용률 높음");
}

// ✅ 필수 - 설정 파일에서 조회
@Value("${monitoring.alerts.cpu-threshold.warning}")
private double cpuWarningThreshold;

if (cpuUsage > cpuWarningThreshold) {
    sendAlert("CPU 사용률 높음");
}
```

### 3. 알림 중복 방지 로직 누락 금지
```java
// ❌ 금지 - 중복 알림 발송
sendAlert(level, title, message);

// ✅ 필수 - 중복 체크
if (!isDuplicateAlert(title, 10)) {
    sendAlert(level, title, message);
}
```

---

## ✅ 개발 체크리스트

### 메트릭 수집
- [ ] 시스템 메트릭 수집 (CPU, 메모리, 디스크)
- [ ] 애플리케이션 메트릭 수집 (응답시간, 에러율)
- [ ] 데이터베이스 메트릭 수집
- [ ] Prometheus 연동

### 알림 설정
- [ ] 임계값 설정 (application.yml)
- [ ] 알림 체크 스케줄러 구현
- [ ] 알림 중복 방지 로직
- [ ] 알림 이력 저장

### 알림 채널
- [ ] 이메일 알림 구현
- [ ] Slack 알림 구현
- [ ] SMS 알림 구현 (선택)
- [ ] 다중 채널 발송

### 헬스 체크
- [ ] 데이터베이스 헬스 체크
- [ ] Redis 헬스 체크
- [ ] 외부 API 헬스 체크
- [ ] Actuator 엔드포인트 활성화

### 대시보드
- [ ] 메트릭 조회 API
- [ ] 알림 이력 조회 API
- [ ] 실시간 모니터링 화면

---

## 📖 참조 문서

- [배치 작업 및 스케줄러 표준](./BATCH_SCHEDULER_STANDARD.md)
- [이메일 발송 시스템 표준](./EMAIL_SYSTEM_STANDARD.md)
- [공통 알림 시스템 표준](./NOTIFICATION_SYSTEM_STANDARD.md)
- [로깅 표준](./LOGGING_STANDARD.md)

---

**최종 업데이트**: 2025-12-02

