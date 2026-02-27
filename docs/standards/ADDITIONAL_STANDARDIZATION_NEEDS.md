# 추가 표준화 필요 항목 분석 보고서

**작성일**: 2025-12-02  
**버전**: 1.0.0  
**상태**: 분석 완료

---

## 📋 개요

현재 15개의 표준 문서가 완성되었으나, 소스 코드 및 문서 검토 결과 추가로 표준화가 필요한 6개 영역을 발견했습니다.

---

## 🎯 추가 표준화 필요 항목 (6개)

### 1. 배치 작업 및 스케줄러 표준 ⭐⭐⭐⭐⭐

**현재 상태**:
- ✅ 급여 배치 스케줄러 (`SalaryBatchScheduler.java`)
- ✅ 구독 만료 스케줄러 (`SubscriptionSchedulerConfig.java`)
- ✅ 스케줄 자동 완료 스케줄러 (`ScheduleAutoCompleteService.java`)
- ✅ 통계 생성 스케줄러 (`StatisticsSchedulerServiceImpl.java`)
- ✅ 웰니스 알림 스케줄러 (`WellnessNotificationScheduler.java`)
- ✅ 상담일지 알림 스케줄러 (`ConsultationRecordAlertScheduler.java`)
- ⚠️ 표준화 없음 (각자 다른 패턴 사용)

**문제점**:
- ❌ Cron 표현식 일관성 없음
- ❌ 에러 처리 방식 제각각
- ❌ 로깅 패턴 불일치
- ❌ 테넌트 컨텍스트 처리 불일치
- ❌ 배치 실행 결과 저장 방식 불일치
- ❌ 스케줄러 활성화/비활성화 설정 불일치

**표준화 필요 사항**:
```java
// 표준 스케줄러 패턴
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "scheduler.{name}.enabled", havingValue = "true", matchIfMissing = true)
public class {Name}Scheduler {
    
    private final {Name}Service service;
    private final TenantContextHolder tenantContextHolder;
    private final SchedulerExecutionLogRepository logRepository;
    
    /**
     * 스케줄러 실행
     * Cron: {설명}
     */
    @Scheduled(cron = "${scheduler.{name}.cron:0 0 2 * * ?}")
    public void execute() {
        String executionId = UUID.randomUUID().toString();
        LocalDateTime startTime = LocalDateTime.now();
        
        log.info("⏰ [{name}] 스케줄러 시작: executionId={}", executionId);
        
        try {
            // 1. 테넌트별 실행
            List<String> tenantIds = getAllActiveTenantIds();
            
            for (String tenantId : tenantIds) {
                try {
                    tenantContextHolder.setTenantId(tenantId);
                    
                    // 2. 실제 작업 실행
                    {Name}Result result = service.execute();
                    
                    // 3. 결과 로깅
                    saveExecutionLog(executionId, tenantId, "SUCCESS", result);
                    
                } catch (Exception e) {
                    log.error("❌ [{name}] 테넌트 실행 실패: tenantId={}, error={}", 
                        tenantId, e.getMessage(), e);
                    saveExecutionLog(executionId, tenantId, "FAILED", e.getMessage());
                } finally {
                    tenantContextHolder.clear();
                }
            }
            
            log.info("✅ [{name}] 스케줄러 완료: executionId={}, duration={}ms", 
                executionId, Duration.between(startTime, LocalDateTime.now()).toMillis());
                
        } catch (Exception e) {
            log.error("❌ [{name}] 스케줄러 실패: executionId={}, error={}", 
                executionId, e.getMessage(), e);
        }
    }
}
```

**표준 Cron 표현식**:
```yaml
# 매일 새벽 2시 (시스템 유지보수 시간)
scheduler.system-maintenance.cron: "0 0 2 * * ?"

# 매일 자정 1분 후 (통계 집계)
scheduler.daily-statistics.cron: "0 1 0 * * ?"

# 매 10분마다 (실시간 처리)
scheduler.realtime-process.cron: "0 */10 * * * *"

# 매월 1일 새벽 3시 (월별 정산)
scheduler.monthly-settlement.cron: "0 0 3 1 * ?"

# 매주 월요일 오전 9시 (주간 리포트)
scheduler.weekly-report.cron: "0 0 9 ? * MON"
```

**우선순위**: ⭐⭐⭐⭐⭐ (최우선)

---

### 2. 파일 업로드/다운로드 및 스토리지 표준 ⭐⭐⭐⭐⭐

**현재 상태**:
- ✅ 로컬 파일 업로드 (`FileController.java`)
- ✅ 브랜딩 로고 업로드 (`BrandingService.java`)
- ✅ 프론트엔드 파일 업로드 유틸리티 (`ajax.js`)
- ⚠️ S3 연동 없음
- ⚠️ 파일 크기 제한 불일치
- ⚠️ 파일 타입 검증 불일치

**문제점**:
- ❌ 로컬 스토리지만 사용 (확장성 부족)
- ❌ 파일 크기 제한 (5MB, 10MB 혼재)
- ❌ 파일 타입 검증 로직 분산
- ❌ 파일명 충돌 방지 로직 불일치
- ❌ 테넌트별 파일 격리 미흡
- ❌ 파일 메타데이터 관리 없음

**표준화 필요 사항**:
```java
// 표준 파일 업로드 서비스
@Service
public class FileStorageService {
    
    // 스토리지 전략 (로컬 또는 S3)
    private final StorageStrategy storageStrategy;
    
    /**
     * 파일 업로드
     * 테넌트별 격리 보장
     */
    public FileUploadResponse uploadFile(
        String tenantId,
        MultipartFile file,
        FileUploadRequest request
    ) {
        // 1. 파일 검증
        validateFile(file, request.getAllowedTypes(), request.getMaxSize());
        
        // 2. 파일명 생성 (충돌 방지)
        String fileName = generateUniqueFileName(tenantId, file.getOriginalFilename());
        
        // 3. 파일 저장 (로컬 또는 S3)
        String fileUrl = storageStrategy.store(tenantId, fileName, file.getInputStream());
        
        // 4. 메타데이터 저장
        FileMetadata metadata = saveFileMetadata(tenantId, fileName, file, fileUrl);
        
        return FileUploadResponse.from(metadata);
    }
}

// 스토리지 전략 인터페이스
public interface StorageStrategy {
    String store(String tenantId, String fileName, InputStream inputStream);
    InputStream retrieve(String tenantId, String fileName);
    void delete(String tenantId, String fileName);
}

// 로컬 스토리지 구현
@Component
@ConditionalOnProperty(name = "storage.type", havingValue = "local", matchIfMissing = true)
public class LocalStorageStrategy implements StorageStrategy {
    // 구현
}

// S3 스토리지 구현
@Component
@ConditionalOnProperty(name = "storage.type", havingValue = "s3")
public class S3StorageStrategy implements StorageStrategy {
    // 구현
}
```

**표준 파일 메타데이터**:
```sql
CREATE TABLE IF NOT EXISTS file_metadata (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    file_id VARCHAR(50) UNIQUE NOT NULL COMMENT '파일 ID (UUID)',
    original_name VARCHAR(255) NOT NULL COMMENT '원본 파일명',
    stored_name VARCHAR(255) NOT NULL COMMENT '저장된 파일명',
    file_path VARCHAR(500) NOT NULL COMMENT '파일 경로',
    file_url VARCHAR(500) NOT NULL COMMENT '파일 URL',
    file_size BIGINT NOT NULL COMMENT '파일 크기 (bytes)',
    mime_type VARCHAR(100) NOT NULL COMMENT 'MIME 타입',
    storage_type VARCHAR(20) NOT NULL COMMENT '스토리지 타입: LOCAL, S3',
    uploaded_by BIGINT COMMENT '업로드한 사용자 ID',
    
    -- 감사 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 소프트 삭제
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_file_id (file_id),
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='파일 메타데이터 테이블';
```

**우선순위**: ⭐⭐⭐⭐⭐ (최우선)

---

### 3. 이메일 발송 시스템 표준 ⭐⭐⭐⭐

**현재 상태**:
- ✅ 이메일 서비스 (`EmailServiceImpl.java`, `MockEmailServiceImpl.java`)
- ✅ 이메일 템플릿 (HTML)
- ✅ 이메일 상수 (`EmailConstants.java`)
- ⚠️ 템플릿 관리 분산
- ⚠️ 발신자 정보 하드코딩

**문제점**:
- ❌ 템플릿 경로 하드코딩
- ❌ 발신자 정보 하드코딩 (`noreply@mindgarden.com` → CoreSolution으로 변경 필요)
- ❌ 이메일 발송 실패 재시도 로직 없음
- ❌ 이메일 발송 이력 관리 미흡
- ❌ 테넌트별 이메일 템플릿 커스터마이징 없음

**표준화 필요 사항**:
```java
// 표준 이메일 서비스
@Service
public class StandardEmailService {
    
    /**
     * 템플릿 이메일 발송
     * 테넌트별 커스터마이징 지원
     */
    public EmailResponse sendTemplateEmail(
        String tenantId,
        String templateType,
        String toEmail,
        Map<String, Object> variables
    ) {
        // 1. 테넌트별 템플릿 조회 (없으면 기본 템플릿)
        EmailTemplate template = getEmailTemplate(tenantId, templateType);
        
        // 2. 테넌트별 발신자 정보 조회
        EmailSenderInfo senderInfo = getSenderInfo(tenantId);
        
        // 3. 템플릿 렌더링
        String content = renderTemplate(template, variables);
        
        // 4. 이메일 발송 (재시도 로직 포함)
        EmailResponse response = sendWithRetry(senderInfo, toEmail, content);
        
        // 5. 발송 이력 저장
        saveEmailHistory(tenantId, templateType, toEmail, response);
        
        return response;
    }
}
```

**표준 이메일 템플릿 테이블**:
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
    INDEX idx_template_type (template_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='이메일 템플릿 테이블';

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
    
    -- 감사 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_email_id (email_id),
    INDEX idx_status (status),
    INDEX idx_sent_at (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='이메일 발송 이력 테이블';
```

**우선순위**: ⭐⭐⭐⭐ (높음)

---

### 4. 보안 및 인증 표준 ⭐⭐⭐⭐⭐

**현재 상태**:
- ✅ JWT 토큰 유틸리티 (`JwtTokenUtil.java`, `JwtService.java`)
- ✅ 개인정보 암호화 설정 (`application.yml`)
- ✅ 보안 설정 (`SecurityConfig.java`)
- ⚠️ JWT 비밀키 관리 불일치
- ⚠️ 암호화 키 관리 불일치

**문제점**:
- ❌ JWT 비밀키 하드코딩 (`MindGardenJWTSecretKey2025!@#$%^&*()_+`)
- ❌ 암호화 키 하드코딩
- ❌ 키 로테이션 전략 없음
- ❌ 비밀키 길이 검증 없음
- ❌ 토큰 블랙리스트 관리 없음
- ❌ 보안 감사 로그 없음

**표준화 필요 사항**:
```java
// 표준 보안 설정
@Configuration
public class SecurityStandard {
    
    // JWT 비밀키 최소 길이 (256비트)
    public static final int JWT_SECRET_MIN_LENGTH = 32;
    
    // 암호화 키 최소 길이 (256비트)
    public static final int ENCRYPTION_KEY_MIN_LENGTH = 32;
    
    // 토큰 만료 시간
    public static final long ACCESS_TOKEN_EXPIRATION = 3600000L; // 1시간
    public static final long REFRESH_TOKEN_EXPIRATION = 604800000L; // 7일
    
    // 비밀번호 정책
    public static final int PASSWORD_MIN_LENGTH = 8;
    public static final String PASSWORD_PATTERN = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$";
    
    // 로그인 실패 정책
    public static final int MAX_LOGIN_ATTEMPTS = 5;
    public static final long ACCOUNT_LOCK_DURATION = 1800000L; // 30분
}

// 표준 키 관리 서비스
@Service
public class KeyManagementService {
    
    /**
     * JWT 비밀키 검증
     */
    public void validateJwtSecret(String secret) {
        if (secret == null || secret.length() < SecurityStandard.JWT_SECRET_MIN_LENGTH) {
            throw new SecurityException("JWT 비밀키는 최소 32자 이상이어야 합니다.");
        }
    }
    
    /**
     * 키 로테이션
     */
    @Scheduled(cron = "0 0 0 1 * ?") // 매월 1일 자정
    public void rotateKeys() {
        log.info("🔐 보안 키 로테이션 시작");
        // 키 로테이션 로직
    }
}

// 표준 보안 감사 로그
@Aspect
@Component
public class SecurityAuditAspect {
    
    @Around("@annotation(com.coresolution.core.annotation.SecurityAudit)")
    public Object auditSecurityEvent(ProceedingJoinPoint joinPoint) throws Throwable {
        // 보안 감사 로그 기록
    }
}
```

**표준 보안 감사 로그 테이블**:
```sql
CREATE TABLE IF NOT EXISTS security_audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) COMMENT '테넌트 ID',
    event_type VARCHAR(50) NOT NULL COMMENT '이벤트 타입: LOGIN, LOGOUT, PASSWORD_CHANGE, PERMISSION_CHANGE',
    user_id BIGINT COMMENT '사용자 ID',
    ip_address VARCHAR(50) COMMENT 'IP 주소',
    user_agent TEXT COMMENT 'User Agent',
    event_details JSON COMMENT '이벤트 상세 정보',
    result VARCHAR(20) NOT NULL COMMENT '결과: SUCCESS, FAILED',
    error_message TEXT COMMENT '오류 메시지',
    
    -- 감사 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_event_type (event_type),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='보안 감사 로그 테이블';
```

**우선순위**: ⭐⭐⭐⭐⭐ (최우선)

---

### 5. 모니터링 및 알림 표준 ⭐⭐⭐⭐

**현재 상태**:
- ✅ Actuator 설정 (`application.yml`)
- ✅ 로깅 설정 (`logback-spring.xml`)
- ⚠️ 시스템 모니터링 대시보드 없음
- ⚠️ 알림 임계값 설정 없음

**문제점**:
- ❌ 시스템 메트릭 수집 불일치
- ❌ 알림 임계값 하드코딩
- ❌ 장애 알림 채널 미정의
- ❌ 성능 모니터링 기준 없음

**표준화 필요 사항**:
```yaml
# 표준 모니터링 설정
monitoring:
  metrics:
    enabled: true
    export:
      prometheus:
        enabled: true
  alerts:
    # CPU 사용률 임계값
    cpu-threshold: 80
    # 메모리 사용률 임계값
    memory-threshold: 85
    # 디스크 사용률 임계값
    disk-threshold: 90
    # API 응답 시간 임계값 (ms)
    response-time-threshold: 3000
    # 에러율 임계값 (%)
    error-rate-threshold: 5
  notification:
    channels:
      - type: EMAIL
        recipients:
          - admin@coresolution.com
      - type: SLACK
        webhook-url: ${SLACK_WEBHOOK_URL}
      - type: SMS
        recipients:
          - ${ADMIN_PHONE}
```

**우선순위**: ⭐⭐⭐⭐ (높음)

---

### 6. 테스트 표준 ⭐⭐⭐⭐

**현재 상태**:
- ✅ 일부 단위 테스트 존재
- ⚠️ 테스트 커버리지 낮음
- ⚠️ 통합 테스트 부족

**문제점**:
- ❌ 테스트 네이밍 규칙 불일치
- ❌ 테스트 데이터 관리 불일치
- ❌ Mock 사용 패턴 불일치
- ❌ 테스트 커버리지 목표 없음

**표준화 필요 사항**:
```java
// 표준 테스트 네이밍
public class {ClassName}Test {
    
    // Given-When-Then 패턴
    @Test
    @DisplayName("사용자 생성 시 이메일 중복이면 예외 발생")
    void givenDuplicateEmail_whenCreateUser_thenThrowException() {
        // Given
        String email = "test@example.com";
        when(userRepository.existsByEmail(email)).thenReturn(true);
        
        // When & Then
        assertThrows(DuplicateEmailException.class, () -> {
            userService.createUser(email);
        });
    }
}

// 표준 테스트 데이터 빌더
public class TestDataBuilder {
    
    public static User.UserBuilder defaultUser() {
        return User.builder()
            .email("test@example.com")
            .name("테스트 사용자")
            .role(UserRole.USER)
            .isActive(true);
    }
    
    public static Tenant.TenantBuilder defaultTenant() {
        return Tenant.builder()
            .tenantId("tenant-test-001")
            .tenantName("테스트 테넌트")
            .businessType("CONSULTATION")
            .status(TenantStatus.ACTIVE);
    }
}
```

**표준 테스트 커버리지 목표**:
```
- 단위 테스트: 80% 이상
- 통합 테스트: 60% 이상
- E2E 테스트: 핵심 시나리오 100%
```

**우선순위**: ⭐⭐⭐⭐ (높음)

---

## 📊 우선순위 요약

| 순위 | 항목 | 우선순위 | 이유 |
|-----|------|---------|------|
| 1 | 배치 작업 및 스케줄러 표준 | ⭐⭐⭐⭐⭐ | 현재 6개 스케줄러 운영 중, 표준 없음 |
| 2 | 파일 업로드/다운로드 표준 | ⭐⭐⭐⭐⭐ | 테넌트별 격리 미흡, S3 연동 필요 |
| 3 | 보안 및 인증 표준 | ⭐⭐⭐⭐⭐ | 비밀키 하드코딩, 키 로테이션 없음 |
| 4 | 이메일 발송 시스템 표준 | ⭐⭐⭐⭐ | 템플릿 관리 분산, 재시도 로직 없음 |
| 5 | 모니터링 및 알림 표준 | ⭐⭐⭐⭐ | 시스템 모니터링 대시보드 없음 |
| 6 | 테스트 표준 | ⭐⭐⭐⭐ | 테스트 커버리지 낮음 |

---

## 🎯 권장 작업 순서

### Phase 1: 보안 및 핵심 인프라 (1주)
1. 보안 및 인증 표준 (2일)
2. 배치 작업 및 스케줄러 표준 (3일)
3. 파일 업로드/다운로드 표준 (2일)

### Phase 2: 운영 효율화 (1주)
4. 이메일 발송 시스템 표준 (2일)
5. 모니터링 및 알림 표준 (3일)
6. 테스트 표준 (2일)

---

## ✅ 다음 단계

1. **사용자 승인 대기**
   - 위 6개 항목 중 우선순위 확정
   - 작업 일정 조율

2. **표준 문서 작성**
   - 각 항목별 상세 표준 문서 작성
   - 코드 샘플 및 마이그레이션 가이드 포함

3. **기존 코드 마이그레이션**
   - 표준 준수하도록 기존 코드 수정
   - 테스트 및 검증

4. **표준 문서 인덱스 업데이트**
   - `docs/standards/README.md` 업데이트
   - `docs/standards/STANDARDS_SUMMARY.md` 업데이트

---

**최종 업데이트**: 2025-12-02

