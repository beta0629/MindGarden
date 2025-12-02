# 이메일 발송 시스템 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-02  
**상태**: 공식 표준

---

## 📋 개요

CoreSolution 플랫폼의 이메일 발송 시스템 표준입니다. 이메일 템플릿 관리, 발송 로직, 재시도 전략, 발송 이력 관리, 테넌트별 커스터마이징을 정의합니다.

---

## 🎯 핵심 원칙

### ⭐ 테넌트별 이메일 커스터마이징 원칙

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  모든 이메일은 테넌트별로 커스터마이징 가능해야 합니다
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**이메일 발송 원칙**:
- ✅ 테넌트별 발신자 정보 설정
- ✅ 테넌트별 템플릿 커스터마이징
- ✅ 발송 실패 시 자동 재시도
- ✅ 발송 이력 저장
- ✅ 비동기 발송 (대량 발송)
- ✅ 이메일 큐 관리
- ❌ 하드코딩된 발신자 정보 금지
- ❌ 템플릿 경로 하드코딩 금지

---

## 📧 이메일 서비스 아키텍처

### 1. 표준 이메일 서비스

```java
package com.coresolution.core.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * 표준 이메일 서비스
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-02
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StandardEmailService {
    
    private final JavaMailSender mailSender;
    private final EmailTemplateService templateService;
    private final EmailHistoryService historyService;
    private final TenantEmailConfigService tenantConfigService;
    private final TenantContextHolder tenantContextHolder;
    
    /**
     * 템플릿 이메일 발송
     */
    @Async("emailTaskExecutor")
    @Transactional
    public EmailResponse sendTemplateEmail(EmailRequest request) {
        String emailId = UUID.randomUUID().toString();
        String tenantId = tenantContextHolder.getCurrentTenantId();
        
        log.info("📧 이메일 발송 시작: emailId={}, tenantId={}, to={}, templateType={}", 
            emailId, tenantId, request.getToEmail(), request.getTemplateType());
        
        try {
            // 1. 테넌트별 이메일 설정 조회
            TenantEmailConfig config = tenantConfigService.getConfig(tenantId);
            
            // 2. 템플릿 조회 (테넌트 커스텀 우선, 없으면 기본 템플릿)
            EmailTemplate template = templateService.getTemplate(
                tenantId, 
                request.getTemplateType()
            );
            
            // 3. 템플릿 렌더링
            String subject = renderTemplate(template.getSubject(), request.getVariables());
            String content = renderTemplate(template.getContent(), request.getVariables());
            
            // 4. 발신자 정보 설정 (테넌트별)
            String fromEmail = config.getFromEmail();
            String fromName = config.getFromName();
            String replyTo = config.getReplyToEmail();
            
            // 5. 이메일 발송
            sendEmail(emailId, fromEmail, fromName, replyTo, 
                request.getToEmail(), request.getToName(), subject, content);
            
            // 6. 발송 이력 저장
            historyService.saveHistory(
                emailId, 
                tenantId, 
                request, 
                "SENT", 
                null
            );
            
            log.info("✅ 이메일 발송 성공: emailId={}, to={}", emailId, request.getToEmail());
            
            return EmailResponse.success(emailId);
            
        } catch (Exception e) {
            log.error("❌ 이메일 발송 실패: emailId={}, to={}, error={}", 
                emailId, request.getToEmail(), e.getMessage(), e);
            
            // 발송 실패 이력 저장
            historyService.saveHistory(
                emailId, 
                tenantId, 
                request, 
                "FAILED", 
                e.getMessage()
            );
            
            // 재시도 큐에 추가
            addToRetryQueue(emailId, request);
            
            return EmailResponse.failure(emailId, e.getMessage());
        }
    }
    
    /**
     * 이메일 발송 (실제 SMTP)
     */
    private void sendEmail(
        String emailId,
        String fromEmail,
        String fromName,
        String replyTo,
        String toEmail,
        String toName,
        String subject,
        String content
    ) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        
        // 발신자
        helper.setFrom(fromEmail, fromName);
        
        // 수신자
        helper.setTo(toEmail);
        
        // 제목
        helper.setSubject(subject);
        
        // 내용 (HTML)
        helper.setText(content, true);
        
        // 회신 주소
        helper.setReplyTo(replyTo);
        
        // 발송
        mailSender.send(message);
    }
    
    /**
     * 템플릿 렌더링
     */
    private String renderTemplate(String template, Map<String, Object> variables) {
        String result = template;
        
        for (Map.Entry<String, Object> entry : variables.entrySet()) {
            String placeholder = "{{" + entry.getKey() + "}}";
            String value = String.valueOf(entry.getValue());
            result = result.replace(placeholder, value);
        }
        
        return result;
    }
    
    /**
     * 재시도 큐에 추가
     */
    private void addToRetryQueue(String emailId, EmailRequest request) {
        // Redis Queue 또는 DB Queue에 추가
        log.info("📬 이메일 재시도 큐 추가: emailId={}", emailId);
    }
}
```

---

## 📝 이메일 템플릿 관리

### 1. 이메일 템플릿 엔티티

```java
@Entity
@Table(name = "email_templates",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_tenant_template_type", 
            columnNames = {"tenant_id", "template_type"})
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailTemplate {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "tenant_id", length = 36)
    private String tenantId; // NULL이면 시스템 기본 템플릿
    
    @Column(name = "template_type", nullable = false, length = 50)
    private String templateType;
    
    @Column(name = "template_name", nullable = false, length = 100)
    private String templateName;
    
    @Column(name = "subject", nullable = false, length = 200)
    private String subject;
    
    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content; // HTML
    
    @Column(name = "variables", columnDefinition = "JSON")
    private String variables; // 템플릿 변수 목록
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    // 감사 필드
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "created_by")
    private Long createdBy;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "updated_by")
    private Long updatedBy;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

### 2. 이메일 템플릿 테이블

```sql
CREATE TABLE IF NOT EXISTS email_templates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) COMMENT '테넌트 ID (NULL이면 시스템 기본 템플릿)',
    template_type VARCHAR(50) NOT NULL COMMENT '템플릿 타입',
    template_name VARCHAR(100) NOT NULL COMMENT '템플릿명',
    subject VARCHAR(200) NOT NULL COMMENT '이메일 제목',
    content TEXT NOT NULL COMMENT '이메일 내용 (HTML)',
    variables JSON COMMENT '템플릿 변수 목록',
    is_active BOOLEAN DEFAULT TRUE,
    
    -- 감사 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by BIGINT,
    
    UNIQUE KEY uk_tenant_template_type (tenant_id, template_type),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_template_type (template_type),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='이메일 템플릿 테이블';
```

### 3. 템플릿 타입

```java
public enum EmailTemplateType {
    // 인증 관련
    EMAIL_VERIFICATION("이메일 인증"),
    PASSWORD_RESET("비밀번호 재설정"),
    ACCOUNT_ACTIVATION("계정 활성화"),
    
    // 사용자 관련
    WELCOME("환영 이메일"),
    USER_REGISTRATION("사용자 등록 완료"),
    
    // 상담 관련
    APPOINTMENT_CONFIRMATION("상담 예약 확인"),
    APPOINTMENT_REMINDER("상담 예약 알림"),
    APPOINTMENT_CANCELLED("상담 예약 취소"),
    
    // 결제 관련
    PAYMENT_CONFIRMATION("결제 완료"),
    PAYMENT_FAILED("결제 실패"),
    REFUND_COMPLETED("환불 완료"),
    
    // 급여 관련
    SALARY_CALCULATION("급여 계산 완료"),
    SALARY_APPROVAL("급여 승인"),
    SALARY_PAYMENT("급여 지급"),
    TAX_REPORT("세금 내역서"),
    
    // 시스템 알림
    SYSTEM_NOTIFICATION("시스템 알림"),
    SECURITY_ALERT("보안 알림"),
    
    // 구독 관련
    SUBSCRIPTION_EXPIRING("구독 만료 예정"),
    SUBSCRIPTION_EXPIRED("구독 만료"),
    SUBSCRIPTION_RENEWED("구독 갱신");
    
    private final String description;
    
    EmailTemplateType(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
}
```

---

## 📊 이메일 발송 이력

### 1. 이메일 발송 이력 엔티티

```java
@Entity
@Table(name = "email_history",
    indexes = {
        @Index(name = "idx_tenant_id", columnList = "tenant_id"),
        @Index(name = "idx_email_id", columnList = "email_id"),
        @Index(name = "idx_status", columnList = "status"),
        @Index(name = "idx_sent_at", columnList = "sent_at")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;
    
    @Column(name = "email_id", unique = true, nullable = false, length = 50)
    private String emailId; // UUID
    
    @Column(name = "template_type", length = 50)
    private String templateType;
    
    @Column(name = "to_email", nullable = false)
    private String toEmail;
    
    @Column(name = "to_name", length = 100)
    private String toName;
    
    @Column(name = "subject", nullable = false, length = 200)
    private String subject;
    
    @Column(name = "status", nullable = false, length = 20)
    private String status; // PENDING, SENT, FAILED
    
    @Column(name = "retry_count")
    private Integer retryCount = 0;
    
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
    
    @Column(name = "sent_at")
    private LocalDateTime sentAt;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
```

### 2. 이메일 발송 이력 테이블

```sql
CREATE TABLE IF NOT EXISTS email_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    email_id VARCHAR(50) UNIQUE NOT NULL COMMENT '이메일 ID (UUID)',
    template_type VARCHAR(50) COMMENT '템플릿 타입',
    to_email VARCHAR(255) NOT NULL COMMENT '수신자 이메일',
    to_name VARCHAR(100) COMMENT '수신자 이름',
    subject VARCHAR(200) NOT NULL COMMENT '제목',
    status VARCHAR(20) NOT NULL COMMENT '상태: PENDING, SENT, FAILED',
    retry_count INT DEFAULT 0 COMMENT '재시도 횟수',
    error_message TEXT COMMENT '오류 메시지',
    sent_at TIMESTAMP COMMENT '발송 시간',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_email_id (email_id),
    INDEX idx_status (status),
    INDEX idx_sent_at (sent_at),
    INDEX idx_tenant_status_date (tenant_id, status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='이메일 발송 이력 테이블';
```

---

## 🔄 이메일 재시도 전략

### 1. 재시도 스케줄러

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class EmailRetryScheduler {
    
    private final EmailHistoryRepository historyRepository;
    private final StandardEmailService emailService;
    
    private static final int MAX_RETRY_COUNT = 3;
    private static final int RETRY_DELAY_MINUTES = 10;
    
    /**
     * 매 10분마다 실패한 이메일 재시도
     */
    @Scheduled(cron = "0 */10 * * * *")
    public void retryFailedEmails() {
        log.info("📬 이메일 재시도 시작");
        
        // 1. 재시도 대상 조회 (실패 + 재시도 횟수 < 3)
        LocalDateTime cutoffTime = LocalDateTime.now().minusMinutes(RETRY_DELAY_MINUTES);
        
        List<EmailHistory> failedEmails = historyRepository
            .findByStatusAndRetryCountLessThanAndCreatedAtBefore(
                "FAILED", 
                MAX_RETRY_COUNT, 
                cutoffTime
            );
        
        log.info("📋 재시도 대상: {}개", failedEmails.size());
        
        int successCount = 0;
        int failureCount = 0;
        
        // 2. 재시도 실행
        for (EmailHistory history : failedEmails) {
            try {
                // 이메일 재발송
                EmailRequest request = EmailRequest.builder()
                    .templateType(history.getTemplateType())
                    .toEmail(history.getToEmail())
                    .toName(history.getToName())
                    .build();
                
                EmailResponse response = emailService.sendTemplateEmail(request);
                
                if (response.isSuccess()) {
                    // 성공 시 상태 업데이트
                    history.setStatus("SENT");
                    history.setSentAt(LocalDateTime.now());
                    successCount++;
                } else {
                    // 실패 시 재시도 횟수 증가
                    history.setRetryCount(history.getRetryCount() + 1);
                    history.setErrorMessage(response.getErrorMessage());
                    failureCount++;
                }
                
                historyRepository.save(history);
                
            } catch (Exception e) {
                log.error("이메일 재시도 실패: emailId={}", history.getEmailId(), e);
                
                history.setRetryCount(history.getRetryCount() + 1);
                history.setErrorMessage(e.getMessage());
                historyRepository.save(history);
                
                failureCount++;
            }
        }
        
        log.info("✅ 이메일 재시도 완료: 성공={}, 실패={}", successCount, failureCount);
    }
}
```

### 2. 재시도 정책

```yaml
# application.yml
email:
  retry:
    enabled: true
    max-attempts: 3
    delay-minutes: 10
    backoff-multiplier: 2.0
```

---

## ⚙️ 테넌트별 이메일 설정

### 1. 테넌트 이메일 설정 엔티티

```java
@Entity
@Table(name = "tenant_email_config")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantEmailConfig {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "tenant_id", unique = true, nullable = false, length = 36)
    private String tenantId;
    
    @Column(name = "from_email", nullable = false)
    private String fromEmail;
    
    @Column(name = "from_name", nullable = false, length = 100)
    private String fromName;
    
    @Column(name = "reply_to_email", nullable = false)
    private String replyToEmail;
    
    @Column(name = "smtp_host")
    private String smtpHost;
    
    @Column(name = "smtp_port")
    private Integer smtpPort;
    
    @Column(name = "smtp_username")
    private String smtpUsername;
    
    @Column(name = "smtp_password")
    private String smtpPassword;
    
    @Column(name = "use_custom_smtp", nullable = false)
    private Boolean useCustomSmtp = false;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    // 감사 필드
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

### 2. 테넌트 이메일 설정 테이블

```sql
CREATE TABLE IF NOT EXISTS tenant_email_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) UNIQUE NOT NULL COMMENT '테넌트 ID',
    from_email VARCHAR(255) NOT NULL COMMENT '발신자 이메일',
    from_name VARCHAR(100) NOT NULL COMMENT '발신자 이름',
    reply_to_email VARCHAR(255) NOT NULL COMMENT '회신 이메일',
    smtp_host VARCHAR(255) COMMENT 'SMTP 호스트',
    smtp_port INT COMMENT 'SMTP 포트',
    smtp_username VARCHAR(255) COMMENT 'SMTP 사용자명',
    smtp_password VARCHAR(255) COMMENT 'SMTP 비밀번호',
    use_custom_smtp BOOLEAN DEFAULT FALSE COMMENT '커스텀 SMTP 사용 여부',
    is_active BOOLEAN DEFAULT TRUE,
    
    -- 감사 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='테넌트 이메일 설정 테이블';
```

---

## 📮 대량 이메일 발송

### 1. 대량 발송 서비스

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class BulkEmailService {
    
    private final StandardEmailService emailService;
    private final EmailQueueService queueService;
    
    /**
     * 대량 이메일 발송 (비동기)
     */
    @Async("emailTaskExecutor")
    public void sendBulkEmails(List<EmailRequest> requests) {
        String batchId = UUID.randomUUID().toString();
        
        log.info("📬 대량 이메일 발송 시작: batchId={}, count={}", 
            batchId, requests.size());
        
        int successCount = 0;
        int failureCount = 0;
        
        for (EmailRequest request : requests) {
            try {
                EmailResponse response = emailService.sendTemplateEmail(request);
                
                if (response.isSuccess()) {
                    successCount++;
                } else {
                    failureCount++;
                }
                
                // 발송 간격 (Rate Limiting)
                Thread.sleep(100); // 100ms
                
            } catch (Exception e) {
                log.error("대량 이메일 발송 실패: to={}", request.getToEmail(), e);
                failureCount++;
            }
        }
        
        log.info("✅ 대량 이메일 발송 완료: batchId={}, success={}, failure={}", 
            batchId, successCount, failureCount);
    }
}
```

### 2. 이메일 큐 관리

```java
@Service
@RequiredArgsConstructor
public class EmailQueueService {
    
    private final RedisTemplate<String, EmailRequest> redisTemplate;
    
    private static final String QUEUE_KEY = "email:queue";
    
    /**
     * 큐에 이메일 추가
     */
    public void enqueue(EmailRequest request) {
        redisTemplate.opsForList().rightPush(QUEUE_KEY, request);
        log.debug("이메일 큐 추가: to={}", request.getToEmail());
    }
    
    /**
     * 큐에서 이메일 조회
     */
    public EmailRequest dequeue() {
        return redisTemplate.opsForList().leftPop(QUEUE_KEY);
    }
    
    /**
     * 큐 크기 조회
     */
    public Long getQueueSize() {
        return redisTemplate.opsForList().size(QUEUE_KEY);
    }
}
```

---

## 🚫 금지 사항

### 1. 하드코딩된 발신자 정보 금지
```java
// ❌ 절대 금지
String fromEmail = "noreply@mindgarden.com";
String fromName = "mindgarden";

// ✅ 필수 - 테넌트별 설정 조회
TenantEmailConfig config = tenantConfigService.getConfig(tenantId);
String fromEmail = config.getFromEmail();
String fromName = config.getFromName();
```

### 2. 템플릿 경로 하드코딩 금지
```java
// ❌ 금지
String template = loadTemplate("email/welcome.html");

// ✅ 필수 - DB에서 조회
EmailTemplate template = templateService.getTemplate(tenantId, "WELCOME");
```

### 3. 동기 대량 발송 금지
```java
// ❌ 금지 - 동기 발송 (서버 블로킹)
for (EmailRequest request : requests) {
    emailService.sendEmail(request);
}

// ✅ 필수 - 비동기 발송
bulkEmailService.sendBulkEmails(requests);
```

---

## ✅ 개발 체크리스트

### 이메일 서비스
- [ ] StandardEmailService 구현
- [ ] 템플릿 렌더링 로직
- [ ] 발송 이력 저장
- [ ] 재시도 로직 구현
- [ ] 비동기 발송 설정

### 템플릿 관리
- [ ] 이메일 템플릿 테이블 생성
- [ ] 템플릿 CRUD API
- [ ] 테넌트별 템플릿 커스터마이징
- [ ] 템플릿 변수 관리

### 발송 이력
- [ ] 이메일 발송 이력 테이블 생성
- [ ] 발송 상태 추적
- [ ] 재시도 횟수 관리
- [ ] 발송 통계 API

### 테넌트 설정
- [ ] 테넌트 이메일 설정 테이블 생성
- [ ] 발신자 정보 관리
- [ ] 커스텀 SMTP 지원 (선택)

### 대량 발송
- [ ] 대량 발송 서비스 구현
- [ ] 이메일 큐 관리
- [ ] Rate Limiting 적용

---

## 📖 참조 문서

- [테넌트 역할 시스템 표준](./TENANT_ROLE_SYSTEM_STANDARD.md)
- [데이터베이스 스키마 표준](./DATABASE_SCHEMA_STANDARD.md)
- [배치 작업 및 스케줄러 표준](./BATCH_SCHEDULER_STANDARD.md)
- [공통 알림 시스템 표준](./NOTIFICATION_SYSTEM_STANDARD.md)

---

**최종 업데이트**: 2025-12-02

