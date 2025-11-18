# 테넌트별 PG사 연계 승인 시스템 Phase 1 구현 가이드

**작성일:** 2025-01-XX  
**목표:** 테넌트 PG 설정 입력 및 승인 기본 기능 구현

## 1. 개요

### 1.1 목표
- 테넌트별 PG 설정 입력 기능 구현
- PG 설정 승인 대기 상태 관리
- 운영 포털 승인 API 구현

### 1.2 작업 범위
- 데이터베이스 테이블 생성
- 엔티티 및 Repository 구현
- PG 설정 입력/조회 API 구현
- 운영 포털 승인 API 구현

## 2. 데이터베이스 마이그레이션

### 2.1 Flyway 마이그레이션 파일

**파일:** `src/main/resources/db/migration/V202501XX__create_tenant_pg_configurations.sql`

```sql
-- 테넌트별 PG 설정 테이블
CREATE TABLE tenant_pg_configurations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    config_id VARCHAR(36) UNIQUE NOT NULL COMMENT 'PG 설정 UUID',
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 UUID',
    
    -- PG사 정보
    pg_provider VARCHAR(50) NOT NULL COMMENT 'PG사: TOSS, IAMPORT, KAKAO, NAVER, PAYPAL, STRIPE',
    pg_name VARCHAR(255) COMMENT 'PG사 명칭 (커스텀)',
    
    -- PG 인증 정보 (암호화 저장)
    api_key_encrypted TEXT NOT NULL COMMENT 'API Key (암호화)',
    secret_key_encrypted TEXT NOT NULL COMMENT 'Secret Key (암호화)',
    merchant_id VARCHAR(255) COMMENT 'Merchant ID',
    store_id VARCHAR(255) COMMENT 'Store ID',
    
    -- PG 설정 정보
    webhook_url VARCHAR(500) COMMENT 'Webhook URL',
    return_url VARCHAR(500) COMMENT 'Return URL',
    cancel_url VARCHAR(500) COMMENT 'Cancel URL',
    test_mode BOOLEAN DEFAULT FALSE COMMENT '테스트 모드 여부',
    
    -- 상태 관리
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT '상태: PENDING, APPROVED, REJECTED, ACTIVE, INACTIVE',
    approval_status VARCHAR(20) DEFAULT 'PENDING' COMMENT '승인 상태: PENDING, APPROVED, REJECTED',
    
    -- 승인 정보
    requested_by VARCHAR(100) COMMENT '요청자',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '요청 시각',
    approved_by VARCHAR(100) COMMENT '승인자',
    approved_at TIMESTAMP NULL COMMENT '승인 시각',
    rejection_reason TEXT COMMENT '거부 사유',
    
    -- 검증 정보
    last_connection_test_at TIMESTAMP NULL COMMENT '마지막 연결 테스트 시각',
    connection_test_result VARCHAR(20) COMMENT '연결 테스트 결과: SUCCESS, FAILED',
    connection_test_message TEXT COMMENT '연결 테스트 메시지',
    
    -- 메타데이터
    settings_json JSON COMMENT 'PG별 추가 설정 (JSON)',
    notes TEXT COMMENT '비고',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    version BIGINT DEFAULT 0,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    -- 인덱스
    INDEX idx_config_id (config_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_pg_provider (pg_provider),
    INDEX idx_status (status),
    INDEX idx_approval_status (approval_status),
    INDEX idx_requested_at (requested_at),
    INDEX idx_is_deleted (is_deleted),
    
    -- 제약조건
    CONSTRAINT chk_tenant_pg_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'INACTIVE')),
    CONSTRAINT chk_tenant_pg_approval_status CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    CONSTRAINT chk_tenant_pg_provider CHECK (pg_provider IN ('TOSS', 'IAMPORT', 'KAKAO', 'NAVER', 'PAYPAL', 'STRIPE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='테넌트별 PG 설정 테이블';

-- 테넌트 PG 설정 변경 이력
CREATE TABLE tenant_pg_configuration_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    config_id VARCHAR(36) NOT NULL COMMENT 'PG 설정 UUID',
    change_type VARCHAR(50) NOT NULL COMMENT '변경 타입: CREATED, UPDATED, APPROVED, REJECTED, ACTIVATED, DEACTIVATED',
    change_description TEXT COMMENT '변경 설명',
    old_status VARCHAR(20) COMMENT '이전 상태',
    new_status VARCHAR(20) COMMENT '새 상태',
    changed_by VARCHAR(100) NOT NULL COMMENT '변경자',
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '변경 시각',
    metadata_json JSON COMMENT '변경 메타데이터',
    
    INDEX idx_config_id (config_id),
    INDEX idx_change_type (change_type),
    INDEX idx_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='테넌트 PG 설정 변경 이력 테이블';
```

## 3. Java 구현

### 3.1 Enum 클래스

```java
package com.mindgarden.consultation.constant;

/**
 * PG 제공자
 */
public enum PgProvider {
    TOSS("토스페이먼츠"),
    IAMPORT("아임포트"),
    KAKAO("카카오페이"),
    NAVER("네이버페이"),
    PAYPAL("페이팔"),
    STRIPE("스트라이프");
    
    private final String displayName;
    
    PgProvider(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}

/**
 * PG 설정 상태
 */
public enum PgConfigurationStatus {
    PENDING("승인 대기"),
    APPROVED("승인 완료"),
    REJECTED("거부"),
    ACTIVE("활성화"),
    INACTIVE("비활성화");
    
    private final String displayName;
    
    PgConfigurationStatus(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}

/**
 * 승인 상태
 */
public enum ApprovalStatus {
    PENDING("승인 대기"),
    APPROVED("승인 완료"),
    REJECTED("거부");
    
    private final String displayName;
    
    ApprovalStatus(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}
```

### 3.2 엔티티 클래스

```java
package com.mindgarden.consultation.entity;

import com.mindgarden.consultation.constant.ApprovalStatus;
import com.mindgarden.consultation.constant.PgConfigurationStatus;
import com.mindgarden.consultation.constant.PgProvider;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "tenant_pg_configurations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TenantPgConfiguration {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "config_id", unique = true, nullable = false, length = 36)
    private String configId;
    
    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "pg_provider", nullable = false, length = 50)
    private PgProvider pgProvider;
    
    @Column(name = "pg_name", length = 255)
    private String pgName;
    
    @Column(name = "api_key_encrypted", nullable = false, columnDefinition = "TEXT")
    private String apiKeyEncrypted;
    
    @Column(name = "secret_key_encrypted", nullable = false, columnDefinition = "TEXT")
    private String secretKeyEncrypted;
    
    @Column(name = "merchant_id", length = 255)
    private String merchantId;
    
    @Column(name = "store_id", length = 255)
    private String storeId;
    
    @Column(name = "webhook_url", length = 500)
    private String webhookUrl;
    
    @Column(name = "return_url", length = 500)
    private String returnUrl;
    
    @Column(name = "cancel_url", length = 500)
    private String cancelUrl;
    
    @Column(name = "test_mode")
    @Builder.Default
    private Boolean testMode = false;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private PgConfigurationStatus status = PgConfigurationStatus.PENDING;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", length = 20)
    @Builder.Default
    private ApprovalStatus approvalStatus = ApprovalStatus.PENDING;
    
    @Column(name = "requested_by", length = 100)
    private String requestedBy;
    
    @Column(name = "requested_at")
    @CreationTimestamp
    private LocalDateTime requestedAt;
    
    @Column(name = "approved_by", length = 100)
    private String approvedBy;
    
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;
    
    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;
    
    @Column(name = "last_connection_test_at")
    private LocalDateTime lastConnectionTestAt;
    
    @Column(name = "connection_test_result", length = 20)
    private String connectionTestResult;
    
    @Column(name = "connection_test_message", columnDefinition = "TEXT")
    private String connectionTestMessage;
    
    @Column(name = "settings_json", columnDefinition = "JSON")
    private String settingsJson;
    
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
    
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
    
    @Column(name = "is_deleted")
    @Builder.Default
    private Boolean isDeleted = false;
    
    @Version
    @Column(name = "version")
    private Long version;
    
    @Column(name = "created_by", length = 100)
    private String createdBy;
    
    @Column(name = "updated_by", length = 100)
    private String updatedBy;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
```

### 3.3 Repository

```java
package com.mindgarden.consultation.repository;

import com.mindgarden.consultation.constant.ApprovalStatus;
import com.mindgarden.consultation.constant.PgConfigurationStatus;
import com.mindgarden.consultation.entity.TenantPgConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TenantPgConfigurationRepository extends JpaRepository<TenantPgConfiguration, Long> {
    
    Optional<TenantPgConfiguration> findByConfigId(String configId);
    
    List<TenantPgConfiguration> findByTenantIdAndIsDeletedFalse(String tenantId);
    
    List<TenantPgConfiguration> findByTenantIdAndStatusAndIsDeletedFalse(
        String tenantId, PgConfigurationStatus status);
    
    List<TenantPgConfiguration> findByApprovalStatusAndIsDeletedFalse(ApprovalStatus approvalStatus);
    
    @Query("SELECT t FROM TenantPgConfiguration t WHERE t.approvalStatus = :approvalStatus AND t.isDeleted = false ORDER BY t.requestedAt DESC")
    List<TenantPgConfiguration> findPendingApprovals(@Param("approvalStatus") ApprovalStatus approvalStatus);
    
    boolean existsByTenantIdAndPgProviderAndStatusAndIsDeletedFalse(
        String tenantId, com.mindgarden.consultation.constant.PgProvider pgProvider, PgConfigurationStatus status);
}
```

### 3.4 DTO 클래스

```java
package com.mindgarden.consultation.dto;

import com.mindgarden.consultation.constant.PgProvider;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantPgConfigurationRequest {
    
    @NotNull(message = "PG 제공자는 필수입니다")
    private PgProvider pgProvider;
    
    private String pgName;
    
    @NotBlank(message = "API Key는 필수입니다")
    private String apiKey;
    
    @NotBlank(message = "Secret Key는 필수입니다")
    private String secretKey;
    
    private String merchantId;
    
    private String storeId;
    
    private String webhookUrl;
    
    private String returnUrl;
    
    private String cancelUrl;
    
    @Builder.Default
    private Boolean testMode = false;
    
    private String settingsJson;
    
    private String notes;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantPgConfigurationResponse {
    private String configId;
    private String tenantId;
    private String pgProvider;
    private String pgName;
    private String status;
    private String approvalStatus;
    private String requestedBy;
    private String requestedAt;
    private String approvedBy;
    private String approvedAt;
    private String rejectionReason;
    private Boolean testMode;
    private String notes;
}
```

### 3.5 서비스 클래스

```java
package com.mindgarden.consultation.service;

import com.mindgarden.consultation.constant.ApprovalStatus;
import com.mindgarden.consultation.constant.PgConfigurationStatus;
import com.mindgarden.consultation.dto.TenantPgConfigurationRequest;
import com.mindgarden.consultation.dto.TenantPgConfigurationResponse;
import com.mindgarden.consultation.entity.TenantPgConfiguration;
import com.mindgarden.consultation.repository.TenantPgConfigurationRepository;
import com.mindgarden.consultation.util.PersonalDataEncryptionUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TenantPgConfigurationService {
    
    private final TenantPgConfigurationRepository repository;
    private final PersonalDataEncryptionUtil encryptionUtil;
    
    /**
     * PG 설정 생성
     */
    @Transactional
    public TenantPgConfigurationResponse createConfiguration(
            String tenantId, TenantPgConfigurationRequest request, String requestedBy) {
        
        log.info("PG 설정 생성 요청: tenantId={}, pgProvider={}", tenantId, request.getPgProvider());
        
        // 중복 체크
        boolean exists = repository.existsByTenantIdAndPgProviderAndStatusAndIsDeletedFalse(
            tenantId, request.getPgProvider(), PgConfigurationStatus.ACTIVE);
        
        if (exists) {
            throw new IllegalArgumentException("이미 활성화된 PG 설정이 존재합니다: " + request.getPgProvider());
        }
        
        // 암호화
        String encryptedApiKey = encryptionUtil.encrypt(request.getApiKey());
        String encryptedSecretKey = encryptionUtil.encrypt(request.getSecretKey());
        
        // 엔티티 생성
        TenantPgConfiguration configuration = TenantPgConfiguration.builder()
            .configId(UUID.randomUUID().toString())
            .tenantId(tenantId)
            .pgProvider(request.getPgProvider())
            .pgName(request.getPgName())
            .apiKeyEncrypted(encryptedApiKey)
            .secretKeyEncrypted(encryptedSecretKey)
            .merchantId(request.getMerchantId())
            .storeId(request.getStoreId())
            .webhookUrl(request.getWebhookUrl())
            .returnUrl(request.getReturnUrl())
            .cancelUrl(request.getCancelUrl())
            .testMode(request.getTestMode())
            .status(PgConfigurationStatus.PENDING)
            .approvalStatus(ApprovalStatus.PENDING)
            .requestedBy(requestedBy)
            .requestedAt(LocalDateTime.now())
            .settingsJson(request.getSettingsJson())
            .notes(request.getNotes())
            .createdBy(requestedBy)
            .build();
        
        TenantPgConfiguration saved = repository.save(configuration);
        
        log.info("PG 설정 생성 완료: configId={}", saved.getConfigId());
        
        return toResponse(saved);
    }
    
    /**
     * PG 설정 목록 조회
     */
    public List<TenantPgConfigurationResponse> getConfigurations(String tenantId) {
        List<TenantPgConfiguration> configurations = 
            repository.findByTenantIdAndIsDeletedFalse(tenantId);
        
        return configurations.stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * PG 설정 상세 조회
     */
    public TenantPgConfigurationResponse getConfiguration(String configId) {
        TenantPgConfiguration configuration = repository.findByConfigId(configId)
            .orElseThrow(() -> new IllegalArgumentException("PG 설정을 찾을 수 없습니다: " + configId));
        
        return toResponse(configuration);
    }
    
    /**
     * 승인 대기 목록 조회 (운영 포털용)
     */
    public List<TenantPgConfigurationResponse> getPendingApprovals() {
        List<TenantPgConfiguration> configurations = 
            repository.findPendingApprovals(ApprovalStatus.PENDING);
        
        return configurations.stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * PG 설정 승인
     */
    @Transactional
    public TenantPgConfigurationResponse approveConfiguration(
            String configId, String approvedBy, String approvalNote) {
        
        log.info("PG 설정 승인 요청: configId={}, approvedBy={}", configId, approvedBy);
        
        TenantPgConfiguration configuration = repository.findByConfigId(configId)
            .orElseThrow(() -> new IllegalArgumentException("PG 설정을 찾을 수 없습니다: " + configId));
        
        if (configuration.getApprovalStatus() != ApprovalStatus.PENDING) {
            throw new IllegalStateException("승인 대기 상태가 아닙니다: " + configuration.getApprovalStatus());
        }
        
        configuration.setApprovalStatus(ApprovalStatus.APPROVED);
        configuration.setStatus(PgConfigurationStatus.APPROVED);
        configuration.setApprovedBy(approvedBy);
        configuration.setApprovedAt(LocalDateTime.now());
        configuration.setUpdatedBy(approvedBy);
        
        if (approvalNote != null && !approvalNote.isBlank()) {
            configuration.setNotes(approvalNote);
        }
        
        TenantPgConfiguration saved = repository.save(configuration);
        
        log.info("PG 설정 승인 완료: configId={}", saved.getConfigId());
        
        return toResponse(saved);
    }
    
    /**
     * PG 설정 거부
     */
    @Transactional
    public TenantPgConfigurationResponse rejectConfiguration(
            String configId, String rejectedBy, String rejectionReason) {
        
        log.info("PG 설정 거부 요청: configId={}, rejectedBy={}", configId, rejectedBy);
        
        if (rejectionReason == null || rejectionReason.isBlank()) {
            throw new IllegalArgumentException("거부 사유는 필수입니다");
        }
        
        TenantPgConfiguration configuration = repository.findByConfigId(configId)
            .orElseThrow(() -> new IllegalArgumentException("PG 설정을 찾을 수 없습니다: " + configId));
        
        if (configuration.getApprovalStatus() != ApprovalStatus.PENDING) {
            throw new IllegalStateException("승인 대기 상태가 아닙니다: " + configuration.getApprovalStatus());
        }
        
        configuration.setApprovalStatus(ApprovalStatus.REJECTED);
        configuration.setStatus(PgConfigurationStatus.REJECTED);
        configuration.setApprovedBy(rejectedBy);
        configuration.setApprovedAt(LocalDateTime.now());
        configuration.setRejectionReason(rejectionReason);
        configuration.setUpdatedBy(rejectedBy);
        
        TenantPgConfiguration saved = repository.save(configuration);
        
        log.info("PG 설정 거부 완료: configId={}", saved.getConfigId());
        
        return toResponse(saved);
    }
    
    /**
     * Response 변환
     */
    private TenantPgConfigurationResponse toResponse(TenantPgConfiguration configuration) {
        return TenantPgConfigurationResponse.builder()
            .configId(configuration.getConfigId())
            .tenantId(configuration.getTenantId())
            .pgProvider(configuration.getPgProvider().name())
            .pgName(configuration.getPgName())
            .status(configuration.getStatus().name())
            .approvalStatus(configuration.getApprovalStatus().name())
            .requestedBy(configuration.getRequestedBy())
            .requestedAt(configuration.getRequestedAt() != null ? 
                configuration.getRequestedAt().toString() : null)
            .approvedBy(configuration.getApprovedBy())
            .approvedAt(configuration.getApprovedAt() != null ? 
                configuration.getApprovedAt().toString() : null)
            .rejectionReason(configuration.getRejectionReason())
            .testMode(configuration.getTestMode())
            .notes(configuration.getNotes())
            .build();
    }
}
```

### 3.6 컨트롤러

```java
package com.mindgarden.consultation.controller;

import com.mindgarden.consultation.dto.TenantPgConfigurationRequest;
import com.mindgarden.consultation.dto.TenantPgConfigurationResponse;
import com.mindgarden.consultation.service.TenantPgConfigurationService;
import com.mindgarden.consultation.util.SessionUtils;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/tenants")
@RequiredArgsConstructor
public class TenantPgConfigurationController {
    
    private final TenantPgConfigurationService pgConfigurationService;
    
    /**
     * PG 설정 생성
     */
    @PostMapping("/{tenantId}/pg-configurations")
    public ResponseEntity<?> createConfiguration(
            @PathVariable String tenantId,
            @RequestBody @Valid TenantPgConfigurationRequest request,
            HttpSession session) {
        
        try {
            String requestedBy = SessionUtils.getCurrentUser(session).getEmail();
            TenantPgConfigurationResponse response = 
                pgConfigurationService.createConfiguration(tenantId, request, requestedBy);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("PG 설정 생성 실패", e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * PG 설정 목록 조회
     */
    @GetMapping("/{tenantId}/pg-configurations")
    public ResponseEntity<List<TenantPgConfigurationResponse>> getConfigurations(
            @PathVariable String tenantId) {
        
        List<TenantPgConfigurationResponse> configurations = 
            pgConfigurationService.getConfigurations(tenantId);
        
        return ResponseEntity.ok(configurations);
    }
    
    /**
     * PG 설정 상세 조회
     */
    @GetMapping("/{tenantId}/pg-configurations/{configId}")
    public ResponseEntity<TenantPgConfigurationResponse> getConfiguration(
            @PathVariable String tenantId,
            @PathVariable String configId) {
        
        TenantPgConfigurationResponse configuration = 
            pgConfigurationService.getConfiguration(configId);
        
        return ResponseEntity.ok(configuration);
    }
}
```

### 3.7 운영 포털 컨트롤러

```java
package com.mindgarden.consultation.controller;

import com.mindgarden.consultation.dto.TenantPgConfigurationResponse;
import com.mindgarden.consultation.service.TenantPgConfigurationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/ops/pg-configurations")
@RequiredArgsConstructor
public class OpsPgConfigurationController {
    
    private final TenantPgConfigurationService pgConfigurationService;
    
    /**
     * 승인 대기 목록 조회
     */
    @GetMapping("/pending")
    public ResponseEntity<List<TenantPgConfigurationResponse>> getPendingApprovals() {
        List<TenantPgConfigurationResponse> configurations = 
            pgConfigurationService.getPendingApprovals();
        
        return ResponseEntity.ok(configurations);
    }
    
    /**
     * PG 설정 승인
     */
    @PostMapping("/{configId}/approve")
    public ResponseEntity<?> approveConfiguration(
            @PathVariable String configId,
            @RequestBody Map<String, String> request) {
        
        try {
            String approvedBy = request.get("approved_by");
            String approvalNote = request.get("approval_note");
            
            TenantPgConfigurationResponse response = 
                pgConfigurationService.approveConfiguration(configId, approvedBy, approvalNote);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("PG 설정 승인 실패", e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    /**
     * PG 설정 거부
     */
    @PostMapping("/{configId}/reject")
    public ResponseEntity<?> rejectConfiguration(
            @PathVariable String configId,
            @RequestBody Map<String, String> request) {
        
        try {
            String rejectedBy = request.get("rejected_by");
            String rejectionReason = request.get("rejection_reason");
            
            TenantPgConfigurationResponse response = 
                pgConfigurationService.rejectConfiguration(configId, rejectedBy, rejectionReason);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("PG 설정 거부 실패", e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}
```

## 4. 테스트 계획

### 4.1 단위 테스트

```java
@SpringBootTest
class TenantPgConfigurationServiceTest {
    
    @Autowired
    private TenantPgConfigurationService service;
    
    @Test
    void testCreateConfiguration() {
        // 테스트 코드
    }
    
    @Test
    void testApproveConfiguration() {
        // 테스트 코드
    }
}
```

### 4.2 통합 테스트

- PG 설정 생성 API 테스트
- PG 설정 조회 API 테스트
- 승인 API 테스트
- 거부 API 테스트

## 5. 체크리스트

- [ ] Flyway 마이그레이션 파일 생성
- [ ] Enum 클래스 생성 (PgProvider, PgConfigurationStatus, ApprovalStatus)
- [ ] 엔티티 클래스 생성
- [ ] Repository 생성
- [ ] DTO 클래스 생성
- [ ] 서비스 클래스 생성
- [ ] 컨트롤러 생성
- [ ] 운영 포털 컨트롤러 생성
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 작성
- [ ] API 테스트
- [ ] 문서화

## 6. 다음 단계

Phase 1 완료 후:
- Phase 2: PG 정보 암호화 및 연결 테스트 기능 구현
- Phase 3: 테넌트 포털 및 운영 포털 UI 구현
- Phase 4: 결제 시스템과 통합 및 테스트

