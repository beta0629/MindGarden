package com.coresolution.core.service.impl;

import com.coresolution.core.domain.Tenant;
import com.coresolution.core.domain.TenantPgConfiguration;
import com.coresolution.core.domain.TenantPgConfigurationHistory;
import com.coresolution.core.domain.enums.ApprovalStatus;
import com.coresolution.core.domain.enums.PgConfigurationStatus;
import com.coresolution.core.domain.enums.PgProvider;
import com.coresolution.core.dto.*;
import com.coresolution.core.repository.TenantPgConfigurationHistoryRepository;
import com.coresolution.core.repository.TenantPgConfigurationRepository;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.PgConnectionTestService;
import com.coresolution.core.service.TenantPgConfigurationHistoryService;
import com.coresolution.core.service.TenantPgConfigurationService;
import com.mindgarden.consultation.dto.EmailRequest;
import com.mindgarden.consultation.service.EmailService;
import com.mindgarden.consultation.service.PersonalDataEncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 테넌트 PG 설정 서비스 구현체
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class TenantPgConfigurationServiceImpl implements TenantPgConfigurationService {
    
    private final TenantPgConfigurationRepository configurationRepository;
    private final TenantPgConfigurationHistoryRepository historyRepository;
    private final TenantPgConfigurationHistoryService historyService;
    private final TenantRepository tenantRepository;
    private final PersonalDataEncryptionService encryptionService;
    private final List<PgConnectionTestService> connectionTestServices;
    private final EmailService emailService;
    private final TenantAccessControlService accessControlService;
    
    // ==================== 테넌트 PG 설정 관리 ====================
    
    @Override
    @Transactional(readOnly = true)
    public List<TenantPgConfigurationResponse> getConfigurations(
            String tenantId, 
            PgConfigurationStatus status, 
            ApprovalStatus approvalStatus) {
        log.debug("테넌트 PG 설정 목록 조회: tenantId={}, status={}, approvalStatus={}", tenantId, status, approvalStatus);
        
        List<TenantPgConfiguration> configurations;
        
        if (status != null && approvalStatus != null) {
            configurations = configurationRepository.findByTenantIdAndStatusAndIsDeletedFalse(tenantId, status);
            configurations = configurations.stream()
                    .filter(c -> c.getApprovalStatus() == approvalStatus)
                    .collect(Collectors.toList());
        } else if (status != null) {
            configurations = configurationRepository.findByTenantIdAndStatusAndIsDeletedFalse(tenantId, status);
        } else if (approvalStatus != null) {
            configurations = configurationRepository.findByTenantIdAndApprovalStatusAndIsDeletedFalse(tenantId, approvalStatus);
        } else {
            configurations = configurationRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        }
        
        return configurations.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public TenantPgConfigurationDetailResponse getConfigurationDetail(String tenantId, String configId) {
        log.debug("테넌트 PG 설정 상세 조회: tenantId={}, configId={}", tenantId, configId);
        
        TenantPgConfiguration configuration = configurationRepository
                .findByConfigIdAndIsDeletedFalse(configId)
                .orElseThrow(() -> new IllegalArgumentException("PG 설정을 찾을 수 없습니다: " + configId));
        
        // 접근 제어 검증
        accessControlService.validateConfigurationAccess(configuration, tenantId);
        
        // 변경 이력 조회
        List<TenantPgConfigurationHistoryResponse> history = historyRepository
                .findByConfigIdOrderByChangedAtDesc(configId)
                .stream()
                .map(this::toHistoryResponse)
                .collect(Collectors.toList());
        
        TenantPgConfigurationDetailResponse response = TenantPgConfigurationDetailResponse.detailBuilder()
                .configId(configuration.getConfigId())
                .tenantId(configuration.getTenantId())
                .pgProvider(configuration.getPgProvider())
                .pgName(configuration.getPgName())
                .merchantId(configuration.getMerchantId())
                .storeId(configuration.getStoreId())
                .webhookUrl(configuration.getWebhookUrl())
                .returnUrl(configuration.getReturnUrl())
                .cancelUrl(configuration.getCancelUrl())
                .testMode(configuration.getTestMode())
                .status(configuration.getStatus())
                .approvalStatus(configuration.getApprovalStatus())
                .requestedBy(configuration.getRequestedBy())
                .requestedAt(configuration.getRequestedAt())
                .approvedBy(configuration.getApprovedBy())
                .approvedAt(configuration.getApprovedAt())
                .rejectionReason(configuration.getRejectionReason())
                .lastConnectionTestAt(configuration.getLastConnectionTestAt())
                .connectionTestResult(configuration.getConnectionTestResult())
                .connectionTestMessage(configuration.getConnectionTestMessage())
                .connectionTestDetails(configuration.getConnectionTestDetails())
                .settingsJson(configuration.getSettingsJson())
                .notes(configuration.getNotes())
                .createdAt(configuration.getCreatedAt())
                .updatedAt(configuration.getUpdatedAt())
                .history(history)
                .build();
        
        return response;
    }
    
    @Override
    public TenantPgConfigurationResponse createConfiguration(
            String tenantId, 
            TenantPgConfigurationRequest request, 
            String requestedBy) {
        log.info("테넌트 PG 설정 생성: tenantId={}, pgProvider={}, requestedBy={}", 
                tenantId, request.getPgProvider(), requestedBy);
        
        // 입력값 검증
        validateConfigurationRequest(request);
        
        // 중복 확인: 같은 테넌트에 같은 PG Provider의 활성 설정이 있는지 확인
        boolean exists = configurationRepository.existsByTenantIdAndPgProviderAndStatusAndIsDeletedFalse(
                tenantId, request.getPgProvider(), PgConfigurationStatus.ACTIVE);
        
        if (exists) {
            throw new IllegalStateException("이미 활성화된 PG 설정이 존재합니다: " + request.getPgProvider());
        }
        
        // API Key, Secret Key 암호화 (안전한 암호화 사용 - 이미 암호화된 경우 재암호화 방지)
        // PersonalDataEncryptionService.encrypt()는 내부적으로 safeEncrypt()를 사용
        String encryptedApiKey = encryptionService.encrypt(request.getApiKey());
        String encryptedSecretKey = encryptionService.encrypt(request.getSecretKey());
        
        // 암호화 검증 (암호화가 제대로 되었는지 확인)
        if (!encryptionService.isEncrypted(encryptedApiKey)) {
            throw new IllegalStateException("API Key 암호화에 실패했습니다");
        }
        if (!encryptionService.isEncrypted(encryptedSecretKey)) {
            throw new IllegalStateException("Secret Key 암호화에 실패했습니다");
        }
        
        // 활성 키로 암호화되었는지 확인 (키 로테이션 대비)
        encryptedApiKey = encryptionService.ensureActiveKey(encryptedApiKey);
        encryptedSecretKey = encryptionService.ensureActiveKey(encryptedSecretKey);
        
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
                .testMode(request.getTestMode() != null ? request.getTestMode() : false)
                .status(PgConfigurationStatus.PENDING)
                .approvalStatus(ApprovalStatus.PENDING)
                .requestedBy(requestedBy)
                .requestedAt(LocalDateTime.now())
                .settingsJson(request.getSettingsJson())
                .notes(request.getNotes())
                .build();
        
        configuration = configurationRepository.save(configuration);
        
        // 변경 이력 기록
        historyService.saveHistory(configuration.getConfigId(), 
                TenantPgConfigurationHistory.ChangeType.CREATED,
                null, 
                configuration.getStatus().name(),
                requestedBy,
                "PG 설정 생성");
        
        log.info("테넌트 PG 설정 생성 완료: configId={}", configuration.getConfigId());
        return toResponse(configuration);
    }
    
    @Override
    public TenantPgConfigurationResponse updateConfiguration(
            String tenantId, 
            String configId, 
            TenantPgConfigurationRequest request) {
        log.info("테넌트 PG 설정 수정: tenantId={}, configId={}", tenantId, configId);
        
        TenantPgConfiguration configuration = configurationRepository
                .findByConfigIdAndIsDeletedFalse(configId)
                .orElseThrow(() -> new IllegalArgumentException("PG 설정을 찾을 수 없습니다: " + configId));
        
        // 접근 제어 검증
        accessControlService.validateConfigurationAccess(configuration, tenantId);
        
        String oldStatus = configuration.getStatus().name();
        
        // API Key, Secret Key 암호화 (안전한 암호화 사용)
        String newEncryptedApiKey = encryptionService.encrypt(request.getApiKey());
        String newEncryptedSecretKey = encryptionService.encrypt(request.getSecretKey());
        
        // 암호화 검증
        if (!encryptionService.isEncrypted(newEncryptedApiKey)) {
            throw new IllegalStateException("API Key 암호화에 실패했습니다");
        }
        if (!encryptionService.isEncrypted(newEncryptedSecretKey)) {
            throw new IllegalStateException("Secret Key 암호화에 실패했습니다");
        }
        
        // 활성 키로 암호화되었는지 확인 (키 로테이션 대비)
        newEncryptedApiKey = encryptionService.ensureActiveKey(newEncryptedApiKey);
        newEncryptedSecretKey = encryptionService.ensureActiveKey(newEncryptedSecretKey);
        
        // 기존 암호화된 키와 비교하여 변경 여부 확인
        boolean apiKeyChanged = !newEncryptedApiKey.equals(configuration.getApiKeyEncrypted());
        boolean secretKeyChanged = !newEncryptedSecretKey.equals(configuration.getSecretKeyEncrypted());
        
        // 수정 시 재승인 필요
        configuration.setPgProvider(request.getPgProvider());
        configuration.setPgName(request.getPgName());
        configuration.setApiKeyEncrypted(newEncryptedApiKey);
        configuration.setSecretKeyEncrypted(newEncryptedSecretKey);
        configuration.setMerchantId(request.getMerchantId());
        configuration.setStoreId(request.getStoreId());
        configuration.setWebhookUrl(request.getWebhookUrl());
        configuration.setReturnUrl(request.getReturnUrl());
        configuration.setCancelUrl(request.getCancelUrl());
        configuration.setTestMode(request.getTestMode() != null ? request.getTestMode() : false);
        configuration.setStatus(PgConfigurationStatus.PENDING);
        configuration.setApprovalStatus(ApprovalStatus.PENDING);
        configuration.setSettingsJson(request.getSettingsJson());
        configuration.setNotes(request.getNotes());
        
        configuration = configurationRepository.save(configuration);
        
        // 변경 이력 기록 (변경된 필드 정보 포함)
        String changeNotes = String.format("PG 설정 수정 - 재승인 필요%s%s", 
                apiKeyChanged ? " (API Key 변경됨)" : "",
                secretKeyChanged ? " (Secret Key 변경됨)" : "");
        
        // 현재 사용자 정보 가져오기 (세션에서)
        String updatedBy = getCurrentUserId();
        
        historyService.saveHistory(configuration.getConfigId(), 
                TenantPgConfigurationHistory.ChangeType.UPDATED,
                oldStatus, 
                configuration.getStatus().name(),
                updatedBy,
                changeNotes);
        
        log.info("테넌트 PG 설정 수정 완료: configId={}", configuration.getConfigId());
        return toResponse(configuration);
    }
    
    @Override
    public void deleteConfiguration(String tenantId, String configId) {
        log.info("테넌트 PG 설정 삭제: tenantId={}, configId={}", tenantId, configId);
        
        TenantPgConfiguration configuration = configurationRepository
                .findByConfigIdAndIsDeletedFalse(configId)
                .orElseThrow(() -> new IllegalArgumentException("PG 설정을 찾을 수 없습니다: " + configId));
        
        // 접근 제어 검증
        accessControlService.validateConfigurationAccess(configuration, tenantId);
        
        // Soft delete
        configuration.setIsDeleted(true);
        configuration.setDeletedAt(java.time.LocalDateTime.now());
        configurationRepository.save(configuration);
        
        log.info("테넌트 PG 설정 삭제 완료: configId={}", configId);
    }
    
    // ==================== 운영 포털 승인 관리 ====================
    
    @Override
    @Transactional(readOnly = true)
    public List<TenantPgConfigurationResponse> getPendingApprovals(String tenantId, PgProvider pgProvider) {
        log.debug("승인 대기 중인 PG 설정 목록 조회: tenantId={}, pgProvider={}", tenantId, pgProvider);
        
        List<TenantPgConfiguration> configurations;
        
        if (tenantId != null && pgProvider != null) {
            configurations = configurationRepository.findByTenantIdAndApprovalStatusAndIsDeletedFalse(
                    tenantId, ApprovalStatus.PENDING);
            configurations = configurations.stream()
                    .filter(c -> c.getPgProvider() == pgProvider)
                    .collect(Collectors.toList());
        } else if (tenantId != null) {
            configurations = configurationRepository.findPendingApprovalsByTenant(tenantId, ApprovalStatus.PENDING);
        } else if (pgProvider != null) {
            configurations = configurationRepository.findPendingApprovalsByProvider(pgProvider, ApprovalStatus.PENDING);
        } else {
            configurations = configurationRepository.findPendingApprovals(ApprovalStatus.PENDING);
        }
        
        return configurations.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public TenantPgConfigurationResponse approveConfiguration(
            String configId, 
            PgConfigurationApproveRequest request) {
        log.info("PG 설정 승인: configId={}, approvedBy={}", configId, request.getApprovedBy());
        
        TenantPgConfiguration configuration = configurationRepository
                .findByConfigIdAndIsDeletedFalse(configId)
                .orElseThrow(() -> new IllegalArgumentException("PG 설정을 찾을 수 없습니다: " + configId));
        
        // 승인 전 검증
        validateApprovalRequest(configuration, request);
        
        // 연결 테스트 (요청된 경우 또는 기본적으로 실행)
        boolean shouldTestConnection = request.getTestConnection() == null || request.getTestConnection();
        if (shouldTestConnection) {
            ConnectionTestResponse testResult = testConnectionBeforeApproval(configId);
            if (!testResult.getSuccess()) {
                log.warn("PG 연결 테스트 실패: configId={}, message={}", configId, testResult.getMessage());
                // 연결 테스트 실패 시에도 승인 가능하도록 설정 (운영 정책에 따라 변경 가능)
                // throw new IllegalStateException("PG 연결 테스트 실패: " + testResult.getMessage());
            }
        }
        
        String oldStatus = configuration.getStatus().name();
        
        configuration.setApprovalStatus(ApprovalStatus.APPROVED);
        configuration.setStatus(PgConfigurationStatus.APPROVED);
        configuration.setApprovedBy(request.getApprovedBy());
        configuration.setApprovedAt(LocalDateTime.now());
        
        configuration = configurationRepository.save(configuration);
        
        // 변경 이력 기록
        historyService.saveHistory(configuration.getConfigId(), 
                TenantPgConfigurationHistory.ChangeType.APPROVED,
                oldStatus, 
                configuration.getStatus().name(),
                request.getApprovedBy(),
                request.getApprovalNote());
        
        // 승인 알림 발송
        sendApprovalNotification(configuration, request.getApprovalNote());
        
        log.info("PG 설정 승인 완료: configId={}", configId);
        return toResponse(configuration);
    }
    
    @Override
    public TenantPgConfigurationResponse rejectConfiguration(
            String configId, 
            PgConfigurationRejectRequest request) {
        log.info("PG 설정 거부: configId={}, rejectedBy={}", configId, request.getRejectedBy());
        
        TenantPgConfiguration configuration = configurationRepository
                .findByConfigIdAndIsDeletedFalse(configId)
                .orElseThrow(() -> new IllegalArgumentException("PG 설정을 찾을 수 없습니다: " + configId));
        
        // 거부 전 검증
        validateRejectionRequest(configuration, request);
        
        String oldStatus = configuration.getStatus().name();
        
        configuration.setApprovalStatus(ApprovalStatus.REJECTED);
        configuration.setStatus(PgConfigurationStatus.REJECTED);
        configuration.setRejectionReason(request.getRejectionReason());
        
        configuration = configurationRepository.save(configuration);
        
        // 변경 이력 기록
        historyService.saveHistory(configuration.getConfigId(), 
                TenantPgConfigurationHistory.ChangeType.REJECTED,
                oldStatus, 
                configuration.getStatus().name(),
                request.getRejectedBy(),
                request.getRejectionReason());
        
        // 거부 알림 발송
        sendRejectionNotification(configuration, request.getRejectionReason());
        
        log.info("PG 설정 거부 완료: configId={}", configId);
        return toResponse(configuration);
    }
    
    @Override
    public TenantPgConfigurationResponse activateConfiguration(String configId, String activatedBy) {
        log.info("PG 설정 활성화: configId={}, activatedBy={}", configId, activatedBy);
        
        TenantPgConfiguration configuration = configurationRepository
                .findByConfigIdAndIsDeletedFalse(configId)
                .orElseThrow(() -> new IllegalArgumentException("PG 설정을 찾을 수 없습니다: " + configId));
        
        if (configuration.getStatus() != PgConfigurationStatus.APPROVED) {
            throw new IllegalStateException("승인된 PG 설정만 활성화할 수 있습니다");
        }
        
        String oldStatus = configuration.getStatus().name();
        
        configuration.setStatus(PgConfigurationStatus.ACTIVE);
        configuration = configurationRepository.save(configuration);
        
        // 변경 이력 기록
        historyService.saveHistory(configuration.getConfigId(), 
                TenantPgConfigurationHistory.ChangeType.ACTIVATED,
                oldStatus, 
                configuration.getStatus().name(),
                activatedBy,
                "PG 설정 활성화");
        
        log.info("PG 설정 활성화 완료: configId={}", configId);
        return toResponse(configuration);
    }
    
    @Override
    public TenantPgConfigurationResponse deactivateConfiguration(String configId, String deactivatedBy) {
        log.info("PG 설정 비활성화: configId={}, deactivatedBy={}", configId, deactivatedBy);
        
        TenantPgConfiguration configuration = configurationRepository
                .findByConfigIdAndIsDeletedFalse(configId)
                .orElseThrow(() -> new IllegalArgumentException("PG 설정을 찾을 수 없습니다: " + configId));
        
        String oldStatus = configuration.getStatus().name();
        
        configuration.setStatus(PgConfigurationStatus.INACTIVE);
        configuration = configurationRepository.save(configuration);
        
        // 변경 이력 기록
        historyService.saveHistory(configuration.getConfigId(), 
                TenantPgConfigurationHistory.ChangeType.DEACTIVATED,
                oldStatus, 
                configuration.getStatus().name(),
                deactivatedBy,
                "PG 설정 비활성화");
        
        log.info("PG 설정 비활성화 완료: configId={}", configId);
        return toResponse(configuration);
    }
    
    // ==================== PG 연결 테스트 ====================
    
    @Override
    public ConnectionTestResponse testConnection(String tenantId, String configId) {
        log.info("PG 연결 테스트: tenantId={}, configId={}", tenantId, configId);
        
        TenantPgConfiguration configuration = configurationRepository
                .findByConfigIdAndIsDeletedFalse(configId)
                .orElseThrow(() -> new IllegalArgumentException("PG 설정을 찾을 수 없습니다: " + configId));
        
        // 접근 제어 검증
        accessControlService.validateConfigurationAccess(configuration, tenantId);
        
        return performConnectionTest(configuration);
    }
    
    @Override
    public ConnectionTestResponse testConnectionBeforeApproval(String configId) {
        log.info("PG 연결 테스트 (승인 전): configId={}", configId);
        
        TenantPgConfiguration configuration = configurationRepository
                .findByConfigIdAndIsDeletedFalse(configId)
                .orElseThrow(() -> new IllegalArgumentException("PG 설정을 찾을 수 없습니다: " + configId));
        
        return performConnectionTest(configuration);
    }
    
    // ==================== Private Helper Methods ====================
    
    /**
     * PG 설정 요청 검증
     */
    private void validateConfigurationRequest(TenantPgConfigurationRequest request) {
        if (request.getPgProvider() == null) {
            throw new IllegalArgumentException("PG Provider는 필수입니다");
        }
        
        if (request.getApiKey() == null || request.getApiKey().trim().isEmpty()) {
            throw new IllegalArgumentException("API Key는 필수입니다");
        }
        
        if (request.getSecretKey() == null || request.getSecretKey().trim().isEmpty()) {
            throw new IllegalArgumentException("Secret Key는 필수입니다");
        }
        
        // PG Provider별 추가 검증
        switch (request.getPgProvider()) {
            case TOSS:
                // 토스페이먼츠는 Secret Key만 필요
                break;
            case IAMPORT:
                // 아임포트는 API Key와 Secret Key 모두 필요
                break;
            case KAKAO:
            case NAVER:
                // 카카오페이, 네이버페이는 추가 검증 필요
                break;
            case PAYPAL:
            case STRIPE:
                // 해외 PG는 추가 검증 필요
                break;
            default:
                throw new IllegalArgumentException("지원하지 않는 PG Provider: " + request.getPgProvider());
        }
        
        // URL 형식 검증 (있는 경우)
        if (request.getWebhookUrl() != null && !request.getWebhookUrl().trim().isEmpty()) {
            if (!isValidUrl(request.getWebhookUrl())) {
                throw new IllegalArgumentException("Webhook URL 형식이 올바르지 않습니다");
            }
        }
        
        if (request.getReturnUrl() != null && !request.getReturnUrl().trim().isEmpty()) {
            if (!isValidUrl(request.getReturnUrl())) {
                throw new IllegalArgumentException("Return URL 형식이 올바르지 않습니다");
            }
        }
        
        if (request.getCancelUrl() != null && !request.getCancelUrl().trim().isEmpty()) {
            if (!isValidUrl(request.getCancelUrl())) {
                throw new IllegalArgumentException("Cancel URL 형식이 올바르지 않습니다");
            }
        }
    }
    
    /**
     * URL 형식 검증
     */
    private boolean isValidUrl(String url) {
        try {
            new java.net.URL(url);
            return true;
        } catch (java.net.MalformedURLException e) {
            return false;
        }
    }
    
    /**
     * PG 연결 테스트 수행
     */
    private ConnectionTestResponse performConnectionTest(TenantPgConfiguration configuration) {
        String configId = configuration.getConfigId();
        String provider = configuration.getPgProvider().name();
        String tenantId = configuration.getTenantId();
        
        log.info("PG 연결 테스트 수행 시작: configId={}, provider={}, tenantId={}", 
                configId, provider, tenantId);
        
        long startTime = System.currentTimeMillis();
        
        try {
            // 암호화된 키 복호화 검증
            String apiKey;
            String secretKey;
            
            try {
                apiKey = encryptionService.decrypt(configuration.getApiKeyEncrypted());
                secretKey = encryptionService.decrypt(configuration.getSecretKeyEncrypted());
            } catch (Exception e) {
                log.error("PG 키 복호화 중 오류 발생: configId={}, provider={}, tenantId={}, error={}", 
                        configId, provider, tenantId, e.getMessage(), e);
                ConnectionTestResponse response = ConnectionTestResponse.builder()
                        .success(false)
                        .result("FAILED")
                        .message("PG 키 복호화 중 오류 발생: " + e.getMessage())
                        .testedAt(LocalDateTime.now())
                        .build();
                saveConnectionTestResult(configuration, response);
                return response;
            }
            
            if (apiKey == null || apiKey.trim().isEmpty() || 
                secretKey == null || secretKey.trim().isEmpty()) {
                log.error("PG 키 복호화 실패 또는 빈 값: configId={}, provider={}, tenantId={}, " +
                        "apiKeyEmpty={}, secretKeyEmpty={}", 
                        configId, provider, tenantId, 
                        apiKey == null || apiKey.trim().isEmpty(),
                        secretKey == null || secretKey.trim().isEmpty());
                ConnectionTestResponse response = ConnectionTestResponse.builder()
                        .success(false)
                        .result("FAILED")
                        .message("PG 키 복호화 실패 또는 빈 값")
                        .testedAt(LocalDateTime.now())
                        .build();
                saveConnectionTestResult(configuration, response);
                return response;
            }
            
            // 해당 PG Provider를 지원하는 연결 테스트 서비스 찾기
            PgConnectionTestService testService = connectionTestServices.stream()
                    .filter(service -> service.supports(configuration.getPgProvider()))
                    .findFirst()
                    .orElse(null);
            
            if (testService == null) {
                log.warn("지원하지 않는 PG Provider: configId={}, provider={}, tenantId={}", 
                        configId, provider, tenantId);
                ConnectionTestResponse response = ConnectionTestResponse.builder()
                        .success(false)
                        .result("FAILED")
                        .message("지원하지 않는 PG Provider: " + provider)
                        .testedAt(LocalDateTime.now())
                        .build();
                
                saveConnectionTestResult(configuration, response);
                return response;
            }
            
            // 연결 테스트 수행
            log.debug("PG 연결 테스트 서비스 호출: configId={}, provider={}, service={}", 
                    configId, provider, testService.getClass().getSimpleName());
            
            ConnectionTestResponse response = testService.testConnection(configuration);
            
            long duration = System.currentTimeMillis() - startTime;
            
            if (response.getSuccess()) {
                log.info("PG 연결 테스트 성공: configId={}, provider={}, tenantId={}, duration={}ms", 
                        configId, provider, tenantId, duration);
            } else {
                log.warn("PG 연결 테스트 실패: configId={}, provider={}, tenantId={}, " +
                        "result={}, message={}, duration={}ms", 
                        configId, provider, tenantId, response.getResult(), 
                        response.getMessage(), duration);
            }
            
            // 테스트 결과 저장
            saveConnectionTestResult(configuration, response);
            
            return response;
            
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("PG 연결 테스트 중 예상치 못한 오류 발생: configId={}, provider={}, " +
                    "tenantId={}, duration={}ms, error={}", 
                    configId, provider, tenantId, duration, e.getMessage(), e);
            
            ConnectionTestResponse response = ConnectionTestResponse.builder()
                    .success(false)
                    .result("FAILED")
                    .message("연결 테스트 중 예상치 못한 오류 발생: " + e.getMessage())
                    .testedAt(LocalDateTime.now())
                    .build();
            
            saveConnectionTestResult(configuration, response);
            return response;
        }
    }
    
    /**
     * 연결 테스트 결과 저장
     * 
     * <p>연결 테스트 결과를 PG 설정에 저장하고, 변경 이력에도 기록합니다.</p>
     */
    private void saveConnectionTestResult(TenantPgConfiguration configuration, ConnectionTestResponse response) {
        String configId = configuration.getConfigId();
        String result = response.getResult();
        
        log.debug("연결 테스트 결과 저장 시작: configId={}, result={}", configId, result);
        
        try {
            // 연결 테스트 결과 저장
            configuration.setLastConnectionTestAt(response.getTestedAt());
            configuration.setConnectionTestResult(response.getResult());
            configuration.setConnectionTestMessage(response.getMessage());
            configuration.setConnectionTestDetails(response.getDetails());
            
            configurationRepository.save(configuration);
            
            // 연결 테스트 이력 기록 (변경 이력에 기록)
            String changeDetails = String.format(
                    "연결 테스트 수행 - 결과: %s, 메시지: %s", 
                    response.getResult(), 
                    response.getMessage()
            );
            
            historyService.saveHistory(
                    configId,
                    TenantPgConfigurationHistory.ChangeType.UPDATED,
                    null,
                    null,
                    getCurrentUserId(),
                    changeDetails
            );
            
            log.debug("연결 테스트 결과 저장 완료: configId={}, result={}", configId, result);
            
        } catch (Exception e) {
            log.error("연결 테스트 결과 저장 중 오류 발생: configId={}, result={}, error={}", 
                    configId, result, e.getMessage(), e);
            // 저장 실패해도 테스트 결과는 반환 (이미 수행된 테스트이므로)
        }
    }
    
    /**
     * 엔티티를 응답 DTO로 변환
     */
    private TenantPgConfigurationResponse toResponse(TenantPgConfiguration configuration) {
        return TenantPgConfigurationResponse.builder()
                .configId(configuration.getConfigId())
                .tenantId(configuration.getTenantId())
                .pgProvider(configuration.getPgProvider())
                .pgName(configuration.getPgName())
                .merchantId(configuration.getMerchantId())
                .storeId(configuration.getStoreId())
                .webhookUrl(configuration.getWebhookUrl())
                .returnUrl(configuration.getReturnUrl())
                .cancelUrl(configuration.getCancelUrl())
                .testMode(configuration.getTestMode())
                .status(configuration.getStatus())
                .approvalStatus(configuration.getApprovalStatus())
                .requestedBy(configuration.getRequestedBy())
                .requestedAt(configuration.getRequestedAt())
                .approvedBy(configuration.getApprovedBy())
                .approvedAt(configuration.getApprovedAt())
                .rejectionReason(configuration.getRejectionReason())
                .lastConnectionTestAt(configuration.getLastConnectionTestAt())
                .connectionTestResult(configuration.getConnectionTestResult())
                .connectionTestMessage(configuration.getConnectionTestMessage())
                .connectionTestDetails(configuration.getConnectionTestDetails())
                .settingsJson(configuration.getSettingsJson())
                .notes(configuration.getNotes())
                .createdAt(configuration.getCreatedAt())
                .updatedAt(configuration.getUpdatedAt())
                .build();
    }
    
    /**
     * 변경 이력을 응답 DTO로 변환
     */
    private TenantPgConfigurationHistoryResponse toHistoryResponse(TenantPgConfigurationHistory history) {
        return TenantPgConfigurationHistoryResponse.builder()
                .id(history.getId())
                .configId(history.getConfigId())
                .changeType(history.getChangeType())
                .oldStatus(history.getOldStatus())
                .newStatus(history.getNewStatus())
                .changedBy(history.getChangedBy())
                .changedAt(history.getChangedAt())
                .changeDetailsJson(history.getChangeDetailsJson())
                .notes(history.getNotes())
                .build();
    }
    
    /**
     * 현재 사용자 ID 가져오기
     * SecurityContext에서 인증된 사용자 정보를 가져옵니다.
     */
    private String getCurrentUserId() {
        try {
            org.springframework.security.core.context.SecurityContext context = 
                    org.springframework.security.core.context.SecurityContextHolder.getContext();
            if (context != null && context.getAuthentication() != null) {
                String username = context.getAuthentication().getName();
                if (username != null && !username.equals("anonymousUser")) {
                    return username;
                }
            }
        } catch (Exception e) {
            log.warn("현재 사용자 정보를 가져오는 중 오류 발생: {}", e.getMessage());
        }
        // 인증 정보가 없는 경우 기본값 반환
        return "system";
    }
    
    /**
     * 승인 요청 검증
     */
    private void validateApprovalRequest(TenantPgConfiguration configuration, PgConfigurationApproveRequest request) {
        if (configuration.getApprovalStatus() != ApprovalStatus.PENDING) {
            throw new IllegalStateException("승인 대기 중인 PG 설정이 아닙니다. 현재 상태: " + configuration.getApprovalStatus());
        }
        
        if (request.getApprovedBy() == null || request.getApprovedBy().trim().isEmpty()) {
            throw new IllegalArgumentException("승인자는 필수입니다");
        }
        
        // 테넌트 존재 확인
        Tenant tenant = tenantRepository.findByTenantIdAndIsDeletedFalse(configuration.getTenantId())
                .orElse(null);
        if (tenant == null) {
            throw new IllegalStateException("테넌트를 찾을 수 없습니다: " + configuration.getTenantId());
        }
        
        // 이미 활성화된 같은 PG Provider 설정이 있는지 확인
        boolean hasActiveConfig = configurationRepository.existsByTenantIdAndPgProviderAndStatusAndIsDeletedFalse(
                configuration.getTenantId(), 
                configuration.getPgProvider(), 
                PgConfigurationStatus.ACTIVE);
        
        if (hasActiveConfig) {
            log.warn("이미 활성화된 PG 설정이 존재합니다: tenantId={}, provider={}", 
                    configuration.getTenantId(), configuration.getPgProvider());
            // 경고만 하고 계속 진행 (기존 설정을 비활성화하거나 덮어쓸 수 있음)
        }
    }
    
    /**
     * 거부 요청 검증
     */
    private void validateRejectionRequest(TenantPgConfiguration configuration, PgConfigurationRejectRequest request) {
        if (configuration.getApprovalStatus() != ApprovalStatus.PENDING) {
            throw new IllegalStateException("승인 대기 중인 PG 설정이 아닙니다. 현재 상태: " + configuration.getApprovalStatus());
        }
        
        if (request.getRejectedBy() == null || request.getRejectedBy().trim().isEmpty()) {
            throw new IllegalArgumentException("거부자는 필수입니다");
        }
        
        if (request.getRejectionReason() == null || request.getRejectionReason().trim().isEmpty()) {
            throw new IllegalArgumentException("거부 사유는 필수입니다");
        }
        
        // 거부 사유 길이 검증
        if (request.getRejectionReason().length() < 10) {
            throw new IllegalArgumentException("거부 사유는 최소 10자 이상 입력해야 합니다");
        }
    }
    
    /**
     * 승인 알림 발송
     */
    private void sendApprovalNotification(TenantPgConfiguration configuration, String approvalNote) {
        try {
            Tenant tenant = tenantRepository.findByTenantIdAndIsDeletedFalse(configuration.getTenantId())
                    .orElse(null);
            
            if (tenant == null || tenant.getContactEmail() == null) {
                log.warn("테넌트 이메일이 없어 승인 알림을 발송할 수 없습니다: tenantId={}", 
                        configuration.getTenantId());
                return;
            }
            
            String subject = String.format("[CoreSolution] PG 설정 승인 완료 - %s", 
                    configuration.getPgProvider().getNameKo());
            
            String message = String.format(
                    "안녕하세요.\n\n" +
                    "요청하신 PG 설정이 승인되었습니다.\n\n" +
                    "PG 사: %s\n" +
                    "설정 ID: %s\n" +
                    "승인 시각: %s\n" +
                    "%s\n\n" +
                    "이제 PG 설정을 활성화하여 사용하실 수 있습니다.\n\n" +
                    "감사합니다.",
                    configuration.getPgProvider().getNameKo(),
                    configuration.getConfigId(),
                    configuration.getApprovedAt(),
                    approvalNote != null ? "승인 노트: " + approvalNote : ""
            );
            
            EmailRequest emailRequest = EmailRequest.builder()
                    .toEmail(tenant.getContactEmail())
                    .subject(subject)
                    .content(message)
                    .build();
            
            emailService.sendEmail(emailRequest);
            log.info("승인 알림 발송 완료: tenantId={}, email={}", 
                    configuration.getTenantId(), tenant.getContactEmail());
            
        } catch (Exception e) {
            log.error("승인 알림 발송 실패: {}", e.getMessage(), e);
            // 알림 실패해도 승인 프로세스는 계속 진행
        }
    }
    
    /**
     * 거부 알림 발송
     */
    private void sendRejectionNotification(TenantPgConfiguration configuration, String rejectionReason) {
        try {
            Tenant tenant = tenantRepository.findByTenantIdAndIsDeletedFalse(configuration.getTenantId())
                    .orElse(null);
            
            if (tenant == null || tenant.getContactEmail() == null) {
                log.warn("테넌트 이메일이 없어 거부 알림을 발송할 수 없습니다: tenantId={}", 
                        configuration.getTenantId());
                return;
            }
            
            String subject = String.format("[CoreSolution] PG 설정 승인 거부 - %s", 
                    configuration.getPgProvider().getNameKo());
            
            String message = String.format(
                    "안녕하세요.\n\n" +
                    "요청하신 PG 설정 승인이 거부되었습니다.\n\n" +
                    "PG 사: %s\n" +
                    "설정 ID: %s\n" +
                    "거부 사유: %s\n\n" +
                    "거부 사유를 확인하시고 수정 후 다시 요청해 주시기 바랍니다.\n\n" +
                    "감사합니다.",
                    configuration.getPgProvider().getNameKo(),
                    configuration.getConfigId(),
                    rejectionReason
            );
            
            EmailRequest emailRequest = EmailRequest.builder()
                    .toEmail(tenant.getContactEmail())
                    .subject(subject)
                    .content(message)
                    .build();
            
            emailService.sendEmail(emailRequest);
            log.info("거부 알림 발송 완료: tenantId={}, email={}", 
                    configuration.getTenantId(), tenant.getContactEmail());
            
        } catch (Exception e) {
            log.error("거부 알림 발송 실패: {}", e.getMessage(), e);
            // 알림 실패해도 거부 프로세스는 계속 진행
        }
    }
    
    // ==================== 결제 시스템 통합용 ====================
    
    @Override
    @Transactional(readOnly = true)
    public List<TenantPgConfigurationResponse> getActiveConfigurations(String tenantId, PgProvider pgProvider) {
        log.debug("활성화된 PG 설정 목록 조회: tenantId={}, pgProvider={}", tenantId, pgProvider);
        
        List<TenantPgConfiguration> configurations;
        
        if (pgProvider != null) {
            // 특정 PG 제공자의 활성화된 설정 조회
            Optional<TenantPgConfiguration> config = configurationRepository
                    .findByTenantIdAndPgProviderAndStatusAndIsDeletedFalse(
                            tenantId, 
                            pgProvider, 
                            PgConfigurationStatus.ACTIVE);
            
            if (config.isPresent()) {
                // 승인된 설정만 반환
                if (config.get().getApprovalStatus() == ApprovalStatus.APPROVED) {
                    configurations = List.of(config.get());
                } else {
                    configurations = List.of();
                }
            } else {
                configurations = List.of();
            }
        } else {
            // 모든 활성화된 설정 조회
            configurations = configurationRepository.findActiveConfigurations(
                    tenantId, 
                    PgConfigurationStatus.ACTIVE);
            
            // 승인된 설정만 필터링
            configurations = configurations.stream()
                    .filter(c -> c.getApprovalStatus() == ApprovalStatus.APPROVED)
                    .collect(Collectors.toList());
        }
        
        log.debug("활성화된 PG 설정 조회 완료: tenantId={}, count={}", tenantId, configurations.size());
        
        return configurations.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public TenantPgConfigurationDetailResponse getActiveConfigurationByProvider(String tenantId, PgProvider pgProvider) {
        log.debug("활성화된 PG 설정 조회 (특정 제공자): tenantId={}, pgProvider={}", tenantId, pgProvider);
        
        if (pgProvider == null) {
            throw new IllegalArgumentException("PG 제공자는 필수입니다");
        }
        
        // 활성화되고 승인된 설정 조회
        Optional<TenantPgConfiguration> config = configurationRepository
                .findByTenantIdAndPgProviderAndStatusAndIsDeletedFalse(
                        tenantId, 
                        pgProvider, 
                        PgConfigurationStatus.ACTIVE);
        
        if (config.isEmpty()) {
            log.debug("활성화된 PG 설정을 찾을 수 없음: tenantId={}, pgProvider={}", tenantId, pgProvider);
            return null;
        }
        
        TenantPgConfiguration configuration = config.get();
        
        // 승인 상태 확인
        if (configuration.getApprovalStatus() != ApprovalStatus.APPROVED) {
            log.debug("PG 설정이 승인되지 않음: tenantId={}, pgProvider={}, approvalStatus={}", 
                    tenantId, pgProvider, configuration.getApprovalStatus());
            return null;
        }
        
        // 접근 제어 검증
        accessControlService.validateConfigurationAccess(configuration, tenantId);
        
        // 변경 이력 조회
        List<TenantPgConfigurationHistoryResponse> history = historyRepository
                .findByConfigIdOrderByChangedAtDesc(configuration.getConfigId())
                .stream()
                .map(this::toHistoryResponse)
                .collect(Collectors.toList());
        
        // 상세 응답 생성 (기존 toResponse 메서드 사용 후 history 추가)
        TenantPgConfigurationDetailResponse response = new TenantPgConfigurationDetailResponse();
        TenantPgConfigurationResponse baseResponse = toResponse(configuration);
        
        // BaseResponse의 모든 필드를 DetailResponse에 복사
        response.setConfigId(baseResponse.getConfigId());
        response.setTenantId(baseResponse.getTenantId());
        response.setPgProvider(baseResponse.getPgProvider());
        response.setPgName(baseResponse.getPgName());
        response.setMerchantId(baseResponse.getMerchantId());
        response.setStoreId(baseResponse.getStoreId());
        response.setWebhookUrl(baseResponse.getWebhookUrl());
        response.setReturnUrl(baseResponse.getReturnUrl());
        response.setCancelUrl(baseResponse.getCancelUrl());
        response.setTestMode(baseResponse.getTestMode());
        response.setStatus(baseResponse.getStatus());
        response.setApprovalStatus(baseResponse.getApprovalStatus());
        response.setRequestedBy(baseResponse.getRequestedBy());
        response.setRequestedAt(baseResponse.getRequestedAt());
        response.setApprovedBy(baseResponse.getApprovedBy());
        response.setApprovedAt(baseResponse.getApprovedAt());
        response.setRejectionReason(baseResponse.getRejectionReason());
        response.setLastConnectionTestAt(baseResponse.getLastConnectionTestAt());
        response.setConnectionTestResult(baseResponse.getConnectionTestResult());
        response.setConnectionTestMessage(baseResponse.getConnectionTestMessage());
        response.setConnectionTestDetails(baseResponse.getConnectionTestDetails());
        response.setSettingsJson(baseResponse.getSettingsJson());
        response.setNotes(baseResponse.getNotes());
        response.setCreatedAt(baseResponse.getCreatedAt());
        response.setUpdatedAt(baseResponse.getUpdatedAt());
        response.setHistory(history);
        
        return response;
    }
}

