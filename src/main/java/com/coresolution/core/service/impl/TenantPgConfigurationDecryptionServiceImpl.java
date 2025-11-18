package com.coresolution.core.service.impl;

import com.coresolution.core.domain.TenantPgConfiguration;
import com.coresolution.core.dto.PgConfigurationKeysResponse;
import com.coresolution.core.repository.TenantPgConfigurationRepository;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.TenantPgConfigurationDecryptionService;
import com.mindgarden.consultation.service.PersonalDataEncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 테넌트 PG 설정 복호화 서비스 구현체
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TenantPgConfigurationDecryptionServiceImpl implements TenantPgConfigurationDecryptionService {
    
    private final TenantPgConfigurationRepository configurationRepository;
    private final PersonalDataEncryptionService encryptionService;
    private final TenantAccessControlService accessControlService;
    
    @Override
    public PgConfigurationKeysResponse decryptKeys(String tenantId, String configId, String requestedBy) {
        log.info("PG 설정 키 복호화 요청: tenantId={}, configId={}, requestedBy={}", tenantId, configId, requestedBy);
        
        // PG 설정 조회
        TenantPgConfiguration configuration = configurationRepository
                .findByConfigIdAndIsDeletedFalse(configId)
                .orElseThrow(() -> new IllegalArgumentException("PG 설정을 찾을 수 없습니다: " + configId));
        
        // 접근 제어 검증
        accessControlService.validateConfigurationAccess(configuration, tenantId);
        
        // 키 복호화
        return decryptKeysInternal(configuration, requestedBy);
    }
    
    @Override
    public PgConfigurationKeysResponse decryptKeysForOps(String configId, String requestedBy) {
        log.info("운영 포털 PG 설정 키 복호화 요청: configId={}, requestedBy={}", configId, requestedBy);
        
        // 운영 포털 권한 확인
        accessControlService.validateOpsAccess();
        
        // PG 설정 조회
        TenantPgConfiguration configuration = configurationRepository
                .findByConfigIdAndIsDeletedFalse(configId)
                .orElseThrow(() -> new IllegalArgumentException("PG 설정을 찾을 수 없습니다: " + configId));
        
        // 키 복호화
        return decryptKeysInternal(configuration, requestedBy);
    }
    
    /**
     * 키 복호화 내부 로직
     * 
     * <p>보안 주의: 복호화된 키는 로그에 출력하지 않습니다.</p>
     */
    private PgConfigurationKeysResponse decryptKeysInternal(
            TenantPgConfiguration configuration, 
            String requestedBy) {
        
        try {
            // API Key 복호화
            String apiKey = encryptionService.decrypt(configuration.getApiKeyEncrypted());
            if (apiKey == null || apiKey.trim().isEmpty()) {
                throw new IllegalStateException("API Key 복호화 실패 또는 빈 값");
            }
            
            // Secret Key 복호화
            String secretKey = encryptionService.decrypt(configuration.getSecretKeyEncrypted());
            if (secretKey == null || secretKey.trim().isEmpty()) {
                throw new IllegalStateException("Secret Key 복호화 실패 또는 빈 값");
            }
            
            log.info("PG 설정 키 복호화 완료: configId={}, requestedBy={} (키 값은 로그에 출력하지 않음)", 
                    configuration.getConfigId(), requestedBy);
            
            return PgConfigurationKeysResponse.builder()
                    .configId(configuration.getConfigId())
                    .tenantId(configuration.getTenantId())
                    .pgProvider(configuration.getPgProvider().name())
                    .apiKey(apiKey)
                    .secretKey(secretKey)
                    .decryptedAt(LocalDateTime.now())
                    .requestedBy(requestedBy)
                    .build();
                    
        } catch (Exception e) {
            log.error("PG 설정 키 복호화 중 오류 발생: configId={}, error={}", 
                    configuration.getConfigId(), e.getMessage(), e);
            throw new IllegalStateException("키 복호화에 실패했습니다: " + e.getMessage(), e);
        }
    }
    
}

