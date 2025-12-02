# 배치 작업 및 스케줄러 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-02  
**상태**: 공식 표준

---

## 📋 개요

CoreSolution 플랫폼의 배치 작업 및 스케줄러 표준입니다. 정기적으로 실행되는 모든 배치 작업의 구현 패턴, Cron 표현식, 에러 처리, 로깅, 테넌트 컨텍스트 관리를 정의합니다.

---

## 🎯 핵심 원칙

### ⭐ 테넌트별 독립 실행 원칙

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  모든 배치 작업은 테넌트별로 독립적으로 실행되어야 합니다
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**배치 작업 원칙**:
- ✅ 테넌트별 독립 실행
- ✅ 실행 결과 로깅 필수
- ✅ 에러 발생 시 다른 테넌트 영향 없음
- ✅ 실행 시간 모니터링
- ✅ 재시도 로직 구현
- ✅ 스케줄러 활성화/비활성화 설정
- ❌ 전역 실행 금지
- ❌ 테넌트 컨텍스트 누락 금지

---

## 📅 표준 Cron 표현식

### 1. 시스템 유지보수 시간대

```yaml
# 매일 새벽 2시 (시스템 유지보수 시간)
scheduler.system-maintenance.cron: "0 0 2 * * ?"

# 예시: 급여 배치, 구독 만료 처리
```

**사용 사례**:
- 급여 배치 실행
- 구독 만료 처리
- 데이터 정리 작업
- 시스템 백업

### 2. 통계 집계 시간대

```yaml
# 매일 자정 1분 후 (전날 통계 집계)
scheduler.daily-statistics.cron: "0 1 0 * * *"

# 매주 월요일 오전 1시 (주간 통계)
scheduler.weekly-statistics.cron: "0 0 1 ? * MON"

# 매월 1일 오전 1시 (월간 통계)
scheduler.monthly-statistics.cron: "0 0 1 1 * ?"
```

**사용 사례**:
- 일별 통계 집계
- 주간 리포트 생성
- 월간 정산 처리

### 3. 실시간 처리 시간대

```yaml
# 매 10분마다
scheduler.realtime-process.cron: "0 */10 * * * *"

# 매 30분마다
scheduler.half-hourly-process.cron: "0 */30 * * * *"

# 매 시간마다
scheduler.hourly-process.cron: "0 0 * * * *"
```

**사용 사례**:
- 스케줄 자동 완료
- 알림 발송
- 상태 업데이트

### 4. 업무 시간대

```yaml
# 평일 오전 9시 (업무 시작)
scheduler.business-start.cron: "0 0 9 ? * MON-FRI"

# 평일 오후 6시 (업무 종료)
scheduler.business-end.cron: "0 0 18 ? * MON-FRI"
```

**사용 사례**:
- 일일 리포트 발송
- 업무 알림 발송

---

## 🏗️ 표준 스케줄러 구조

### 1. 기본 스케줄러 템플릿

```java
package com.coresolution.{module}.scheduler;

import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.service.TenantService;
import com.coresolution.{module}.service.{Name}Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * {설명} 스케줄러
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-02
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(
    name = "scheduler.{name}.enabled", 
    havingValue = "true", 
    matchIfMissing = true
)
public class {Name}Scheduler {
    
    private final {Name}Service service;
    private final TenantService tenantService;
    private final TenantContextHolder tenantContextHolder;
    private final SchedulerExecutionLogService logService;
    
    /**
     * {설명}
     * Cron: {설명}
     */
    @Scheduled(cron = "${scheduler.{name}.cron:0 0 2 * * ?}")
    public void execute() {
        String executionId = UUID.randomUUID().toString();
        LocalDateTime startTime = LocalDateTime.now();
        
        log.info("⏰ [{name}] 스케줄러 시작: executionId={}, startTime={}", 
            executionId, startTime);
        
        int successCount = 0;
        int failureCount = 0;
        
        try {
            // 1. 활성 테넌트 목록 조회
            List<String> activeTenantIds = tenantService.getAllActiveTenantIds();
            log.info("📋 [{name}] 대상 테넌트 수: {}", activeTenantIds.size());
            
            // 2. 테넌트별 실행
            for (String tenantId : activeTenantIds) {
                try {
                    // 테넌트 컨텍스트 설정
                    tenantContextHolder.setTenantId(tenantId);
                    
                    log.debug("🔄 [{name}] 테넌트 실행 시작: tenantId={}", tenantId);
                    
                    // 실제 작업 실행
                    {Name}Result result = service.execute(tenantId);
                    
                    // 성공 로깅
                    log.info("✅ [{name}] 테넌트 실행 성공: tenantId={}, result={}", 
                        tenantId, result);
                    
                    // 실행 로그 저장
                    logService.saveExecutionLog(
                        executionId, 
                        tenantId, 
                        "{name}", 
                        "SUCCESS", 
                        result.toJson()
                    );
                    
                    successCount++;
                    
                } catch (Exception e) {
                    log.error("❌ [{name}] 테넌트 실행 실패: tenantId={}, error={}", 
                        tenantId, e.getMessage(), e);
                    
                    // 실패 로그 저장
                    logService.saveExecutionLog(
                        executionId, 
                        tenantId, 
                        "{name}", 
                        "FAILED", 
                        e.getMessage()
                    );
                    
                    failureCount++;
                    
                } finally {
                    // 테넌트 컨텍스트 정리
                    tenantContextHolder.clear();
                }
            }
            
            // 3. 전체 실행 결과 로깅
            LocalDateTime endTime = LocalDateTime.now();
            long durationMs = Duration.between(startTime, endTime).toMillis();
            
            log.info("✅ [{name}] 스케줄러 완료: executionId={}, duration={}ms, success={}, failure={}", 
                executionId, durationMs, successCount, failureCount);
            
            // 4. 실행 요약 저장
            logService.saveSummaryLog(
                executionId,
                "{name}",
                successCount,
                failureCount,
                durationMs
            );
            
        } catch (Exception e) {
            log.error("❌ [{name}] 스케줄러 실패: executionId={}, error={}", 
                executionId, e.getMessage(), e);
            
            // 시스템 알림 발송
            sendSystemAlert(executionId, e);
        }
    }
    
    /**
     * 시스템 알림 발송
     */
    private void sendSystemAlert(String executionId, Exception e) {
        // 알림 발송 로직
        log.error("🚨 [{name}] 스케줄러 실패 알림: executionId={}", executionId);
    }
}
```

### 2. 재시도 로직 포함 스케줄러

```java
@Slf4j
@Component
@RequiredArgsConstructor
public class RetryableScheduler {
    
    private final RetryTemplate retryTemplate;
    
    @Scheduled(cron = "${scheduler.retryable.cron:0 0 2 * * ?}")
    public void executeWithRetry() {
        String executionId = UUID.randomUUID().toString();
        
        try {
            retryTemplate.execute(context -> {
                log.info("⏰ 재시도 시도: attempt={}", context.getRetryCount() + 1);
                
                // 실제 작업 실행
                service.execute();
                
                return null;
            });
            
        } catch (Exception e) {
            log.error("❌ 최대 재시도 횟수 초과: executionId={}", executionId, e);
        }
    }
    
    @Bean
    public RetryTemplate retryTemplate() {
        RetryTemplate retryTemplate = new RetryTemplate();
        
        // 재시도 정책: 최대 3회, 지수 백오프
        ExponentialBackOffPolicy backOffPolicy = new ExponentialBackOffPolicy();
        backOffPolicy.setInitialInterval(1000L); // 1초
        backOffPolicy.setMultiplier(2.0);
        backOffPolicy.setMaxInterval(10000L); // 최대 10초
        
        SimpleRetryPolicy retryPolicy = new SimpleRetryPolicy();
        retryPolicy.setMaxAttempts(3);
        
        retryTemplate.setBackOffPolicy(backOffPolicy);
        retryTemplate.setRetryPolicy(retryPolicy);
        
        return retryTemplate;
    }
}
```

---

## 📊 스케줄러 실행 로그

### 1. 실행 로그 테이블

```sql
CREATE TABLE IF NOT EXISTS scheduler_execution_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    execution_id VARCHAR(50) NOT NULL COMMENT '실행 ID (UUID)',
    tenant_id VARCHAR(36) COMMENT '테넌트 ID',
    scheduler_name VARCHAR(100) NOT NULL COMMENT '스케줄러명',
    status VARCHAR(20) NOT NULL COMMENT '상태: SUCCESS, FAILED, RUNNING',
    result_data JSON COMMENT '실행 결과 데이터',
    error_message TEXT COMMENT '오류 메시지',
    execution_time BIGINT COMMENT '실행 시간 (ms)',
    started_at TIMESTAMP NOT NULL COMMENT '시작 시간',
    completed_at TIMESTAMP COMMENT '완료 시간',
    
    INDEX idx_execution_id (execution_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_scheduler_name (scheduler_name),
    INDEX idx_status (status),
    INDEX idx_started_at (started_at),
    INDEX idx_tenant_scheduler_date (tenant_id, scheduler_name, started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='스케줄러 실행 로그 테이블';
```

### 2. 실행 요약 로그 테이블

```sql
CREATE TABLE IF NOT EXISTS scheduler_execution_summary (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    execution_id VARCHAR(50) UNIQUE NOT NULL COMMENT '실행 ID (UUID)',
    scheduler_name VARCHAR(100) NOT NULL COMMENT '스케줄러명',
    total_tenants INT NOT NULL COMMENT '전체 테넌트 수',
    success_count INT NOT NULL COMMENT '성공 수',
    failure_count INT NOT NULL COMMENT '실패 수',
    total_duration BIGINT NOT NULL COMMENT '총 실행 시간 (ms)',
    started_at TIMESTAMP NOT NULL COMMENT '시작 시간',
    completed_at TIMESTAMP NOT NULL COMMENT '완료 시간',
    
    INDEX idx_execution_id (execution_id),
    INDEX idx_scheduler_name (scheduler_name),
    INDEX idx_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='스케줄러 실행 요약 로그 테이블';
```

### 3. 실행 로그 서비스

```java
@Service
@RequiredArgsConstructor
public class SchedulerExecutionLogService {
    
    private final SchedulerExecutionLogRepository logRepository;
    private final SchedulerExecutionSummaryRepository summaryRepository;
    
    /**
     * 실행 로그 저장
     */
    @Transactional
    public void saveExecutionLog(
        String executionId,
        String tenantId,
        String schedulerName,
        String status,
        String resultData
    ) {
        SchedulerExecutionLog log = SchedulerExecutionLog.builder()
            .executionId(executionId)
            .tenantId(tenantId)
            .schedulerName(schedulerName)
            .status(status)
            .resultData(resultData)
            .startedAt(LocalDateTime.now())
            .build();
        
        logRepository.save(log);
    }
    
    /**
     * 실행 요약 저장
     */
    @Transactional
    public void saveSummaryLog(
        String executionId,
        String schedulerName,
        int successCount,
        int failureCount,
        long durationMs
    ) {
        SchedulerExecutionSummary summary = SchedulerExecutionSummary.builder()
            .executionId(executionId)
            .schedulerName(schedulerName)
            .totalTenants(successCount + failureCount)
            .successCount(successCount)
            .failureCount(failureCount)
            .totalDuration(durationMs)
            .startedAt(LocalDateTime.now().minusSeconds(durationMs / 1000))
            .completedAt(LocalDateTime.now())
            .build();
        
        summaryRepository.save(summary);
    }
    
    /**
     * 스케줄러 실행 이력 조회
     */
    public List<SchedulerExecutionSummary> getExecutionHistory(
        String schedulerName,
        LocalDateTime startDate,
        LocalDateTime endDate
    ) {
        return summaryRepository.findBySchedulerNameAndStartedAtBetween(
            schedulerName, startDate, endDate
        );
    }
}
```

---

## 🔧 스케줄러 설정

### 1. application.yml 설정

```yaml
# 스케줄러 전역 설정
spring:
  task:
    scheduling:
      pool:
        size: 10  # 스케줄러 스레드 풀 크기
      thread-name-prefix: scheduler-

# 개별 스케줄러 설정
scheduler:
  # 급여 배치
  salary-batch:
    enabled: ${SCHEDULER_SALARY_BATCH_ENABLED:true}
    cron: ${SCHEDULER_SALARY_BATCH_CRON:0 0 2 * * ?}
  
  # 구독 만료 처리
  subscription-expiration:
    enabled: ${SCHEDULER_SUBSCRIPTION_EXPIRATION_ENABLED:true}
    cron: ${SCHEDULER_SUBSCRIPTION_EXPIRATION_CRON:0 0 2 * * ?}
  
  # 스케줄 자동 완료
  schedule-auto-complete:
    enabled: ${SCHEDULER_SCHEDULE_AUTO_COMPLETE_ENABLED:true}
    cron: ${SCHEDULER_SCHEDULE_AUTO_COMPLETE_CRON:0 */10 * * * *}
  
  # 통계 생성
  statistics-generation:
    enabled: ${SCHEDULER_STATISTICS_GENERATION_ENABLED:true}
    cron: ${SCHEDULER_STATISTICS_GENERATION_CRON:0 1 0 * * *}
  
  # 웰니스 알림
  wellness-notification:
    enabled: ${SCHEDULER_WELLNESS_NOTIFICATION_ENABLED:true}
    cron: ${SCHEDULER_WELLNESS_NOTIFICATION_CRON:0 0 9 * * ?}
  
  # 상담일지 알림
  consultation-record-alert:
    enabled: ${SCHEDULER_CONSULTATION_RECORD_ALERT_ENABLED:true}
    cron: ${SCHEDULER_CONSULTATION_RECORD_ALERT_CRON:0 0 18 * * ?}
```

### 2. 스케줄러 활성화 설정

```java
@Configuration
@EnableScheduling
public class SchedulerConfig {
    
    @Bean
    public TaskScheduler taskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(10);
        scheduler.setThreadNamePrefix("scheduler-");
        scheduler.setWaitForTasksToCompleteOnShutdown(true);
        scheduler.setAwaitTerminationSeconds(60);
        return scheduler;
    }
}
```

---

## 📈 스케줄러 모니터링

### 1. 스케줄러 상태 조회 API

```java
@RestController
@RequestMapping("/api/v1/admin/schedulers")
@RequiredArgsConstructor
public class SchedulerMonitoringController {
    
    private final SchedulerExecutionLogService logService;
    
    /**
     * 스케줄러 실행 이력 조회
     */
    @GetMapping("/{schedulerName}/history")
    public ResponseEntity<List<SchedulerExecutionSummary>> getExecutionHistory(
        @PathVariable String schedulerName,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate
    ) {
        List<SchedulerExecutionSummary> history = logService.getExecutionHistory(
            schedulerName, startDate, endDate
        );
        return ResponseEntity.ok(history);
    }
    
    /**
     * 스케줄러 실행 통계
     */
    @GetMapping("/{schedulerName}/statistics")
    public ResponseEntity<SchedulerStatistics> getStatistics(
        @PathVariable String schedulerName,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        SchedulerStatistics statistics = logService.getStatistics(
            schedulerName, startDate, endDate
        );
        return ResponseEntity.ok(statistics);
    }
    
    /**
     * 최근 실패한 스케줄러 조회
     */
    @GetMapping("/failures")
    public ResponseEntity<List<SchedulerExecutionLog>> getRecentFailures(
        @RequestParam(defaultValue = "24") int hours
    ) {
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        List<SchedulerExecutionLog> failures = logService.getFailuresSince(since);
        return ResponseEntity.ok(failures);
    }
}
```

### 2. 스케줄러 통계 DTO

```java
@Data
@Builder
public class SchedulerStatistics {
    private String schedulerName;
    private LocalDate startDate;
    private LocalDate endDate;
    
    private int totalExecutions;
    private int successfulExecutions;
    private int failedExecutions;
    
    private double successRate;
    private long averageDuration;
    private long minDuration;
    private long maxDuration;
    
    private int totalTenantsProcessed;
    private int averageTenantsPerExecution;
}
```

---

## 🚨 알림 및 에러 처리

### 1. 스케줄러 실패 알림

```java
@Service
@RequiredArgsConstructor
public class SchedulerAlertService {
    
    private final NotificationService notificationService;
    private final EmailService emailService;
    
    /**
     * 스케줄러 실패 알림 발송
     */
    public void sendFailureAlert(
        String schedulerName,
        String executionId,
        int failureCount,
        String errorMessage
    ) {
        // 1. 시스템 알림
        notificationService.sendSystemAlert(
            "스케줄러 실패",
            String.format("[%s] 스케줄러 실행 실패: 실패 수=%d", schedulerName, failureCount)
        );
        
        // 2. 이메일 알림 (관리자)
        emailService.sendAdminAlert(
            "스케줄러 실패 알림",
            buildFailureEmailContent(schedulerName, executionId, failureCount, errorMessage)
        );
        
        // 3. Slack 알림 (선택)
        if (failureCount > 10) {
            sendSlackAlert(schedulerName, executionId, failureCount);
        }
    }
    
    /**
     * 스케줄러 성공률 저하 알림
     */
    public void sendSuccessRateAlert(String schedulerName, double successRate) {
        if (successRate < 0.95) { // 95% 미만
            notificationService.sendSystemAlert(
                "스케줄러 성공률 저하",
                String.format("[%s] 스케줄러 성공률: %.2f%%", schedulerName, successRate * 100)
            );
        }
    }
}
```

### 2. 에러 처리 전략

```java
@Aspect
@Component
@RequiredArgsConstructor
public class SchedulerErrorHandlingAspect {
    
    private final SchedulerAlertService alertService;
    
    @Around("@annotation(org.springframework.scheduling.annotation.Scheduled)")
    public Object handleSchedulerErrors(ProceedingJoinPoint joinPoint) throws Throwable {
        String schedulerName = joinPoint.getSignature().getName();
        
        try {
            return joinPoint.proceed();
            
        } catch (Exception e) {
            log.error("스케줄러 실행 중 예외 발생: scheduler={}", schedulerName, e);
            
            // 알림 발송
            alertService.sendFailureAlert(
                schedulerName,
                UUID.randomUUID().toString(),
                1,
                e.getMessage()
            );
            
            // 예외 재발생 방지 (다음 스케줄 실행을 위해)
            return null;
        }
    }
}
```

---

## 🔍 현재 운영 중인 스케줄러

### 1. 급여 배치 스케줄러
```java
// 파일: SalaryBatchScheduler.java
// Cron: 0 0 2 * * ? (매일 새벽 2시)
// 설명: 월별 급여 자동 계산 및 처리
```

### 2. 구독 만료 스케줄러
```java
// 파일: SubscriptionSchedulerConfig.java
// Cron: 0 0 2 * * ? (매일 새벽 2시)
// 설명: 만료된 구독 자동 처리
```

### 3. 스케줄 자동 완료 스케줄러
```java
// 파일: ScheduleAutoCompleteService.java
// Cron: 0 */10 * * * * (매 10분마다)
// 설명: 시간이 지난 스케줄 자동 완료 처리
```

### 4. 통계 생성 스케줄러
```java
// 파일: StatisticsSchedulerServiceImpl.java
// Cron: 0 1 0 * * * (매일 자정 1분 후)
// 설명: 일별 통계 자동 업데이트
```

### 5. 웰니스 알림 스케줄러
```java
// 파일: WellnessNotificationScheduler.java
// Cron: 0 0 9 * * ? (매일 오전 9시)
// 설명: 웰니스 컨텐츠 알림 발송
```

### 6. 상담일지 알림 스케줄러
```java
// 파일: ConsultationRecordAlertScheduler.java
// Cron: 0 0 18 * * ? (매일 오후 6시)
// 설명: 상담일지 미작성 알림 발송
```

---

## 🚫 금지 사항

### 1. 테넌트 컨텍스트 누락 금지
```java
// ❌ 절대 금지 - 테넌트 컨텍스트 없이 실행
@Scheduled(cron = "0 0 2 * * ?")
public void execute() {
    service.processAll(); // 모든 테넌트 데이터 혼재
}

// ✅ 필수 - 테넌트별 독립 실행
@Scheduled(cron = "0 0 2 * * ?")
public void execute() {
    List<String> tenantIds = tenantService.getAllActiveTenantIds();
    for (String tenantId : tenantIds) {
        try {
            tenantContextHolder.setTenantId(tenantId);
            service.process(tenantId);
        } finally {
            tenantContextHolder.clear();
        }
    }
}
```

### 2. 하드코딩된 Cron 표현식 금지
```java
// ❌ 금지 - 하드코딩
@Scheduled(cron = "0 0 2 * * ?")

// ✅ 필수 - 환경 변수 사용
@Scheduled(cron = "${scheduler.salary-batch.cron:0 0 2 * * ?}")
```

### 3. 실행 로그 누락 금지
```java
// ❌ 금지 - 로그 없음
@Scheduled(cron = "0 0 2 * * ?")
public void execute() {
    service.process();
}

// ✅ 필수 - 실행 로그 저장
@Scheduled(cron = "0 0 2 * * ?")
public void execute() {
    String executionId = UUID.randomUUID().toString();
    log.info("⏰ 스케줄러 시작: executionId={}", executionId);
    
    try {
        service.process();
        logService.saveExecutionLog(executionId, "SUCCESS", null);
    } catch (Exception e) {
        logService.saveExecutionLog(executionId, "FAILED", e.getMessage());
    }
}
```

---

## ✅ 개발 체크리스트

### 스케줄러 구현
- [ ] @ConditionalOnProperty 어노테이션 추가
- [ ] 테넌트별 독립 실행 로직 구현
- [ ] 실행 ID (UUID) 생성
- [ ] 시작/종료 시간 로깅
- [ ] 성공/실패 카운트 집계
- [ ] 테넌트 컨텍스트 정리 (finally)

### 설정
- [ ] application.yml에 스케줄러 설정 추가
- [ ] Cron 표현식 환경 변수화
- [ ] 활성화/비활성화 설정 추가
- [ ] 스레드 풀 크기 설정

### 로깅
- [ ] 실행 로그 테이블 생성
- [ ] 실행 요약 테이블 생성
- [ ] 실행 로그 서비스 구현
- [ ] 실패 알림 로직 구현

### 모니터링
- [ ] 실행 이력 조회 API 구현
- [ ] 실행 통계 API 구현
- [ ] 실패 알림 설정

---

## 📖 참조 문서

- [테넌트 역할 시스템 표준](./TENANT_ROLE_SYSTEM_STANDARD.md)
- [로깅 표준](./LOGGING_STANDARD.md)
- [에러 처리 표준](./ERROR_HANDLING_STANDARD.md)
- [모니터링 및 알림 표준](./MONITORING_ALERTING_STANDARD.md)

---

**최종 업데이트**: 2025-12-02

