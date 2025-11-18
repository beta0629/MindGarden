package com.coresolution.core.service.impl;

import com.coresolution.core.domain.TenantPgConfiguration;
import com.coresolution.core.repository.TenantPgConfigurationRepository;
import com.coresolution.core.service.TenantPgConfigurationKeyRotationService;
import com.mindgarden.consultation.service.PersonalDataEncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 테넌트 PG 설정 키 로테이션 서비스 구현체
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class TenantPgConfigurationKeyRotationServiceImpl implements TenantPgConfigurationKeyRotationService {
    
    private final TenantPgConfigurationRepository configurationRepository;
    private final PersonalDataEncryptionService encryptionService;
    
    @Override
    @Transactional
    public int rotateAllPgConfigurations() {
        log.info("🔄 모든 PG 설정 키 로테이션 시작");
        
        List<TenantPgConfiguration> configurations = configurationRepository.findAll();
        int updatedCount = 0;
        int errorCount = 0;
        
        for (TenantPgConfiguration configuration : configurations) {
            try {
                boolean modified = rotateConfigurationKeys(configuration);
                
                if (modified) {
                    configurationRepository.save(configuration);
                    updatedCount++;
                    log.debug("PG 설정 키 로테이션 완료: configId={}, tenantId={}", 
                            configuration.getConfigId(), configuration.getTenantId());
                }
            } catch (Exception e) {
                errorCount++;
                log.error("PG 설정 키 로테이션 실패: configId={}, tenantId={}, error={}", 
                        configuration.getConfigId(), configuration.getTenantId(), e.getMessage(), e);
                // 개별 실패는 전체 작업을 중단하지 않음
            }
        }
        
        log.info("✅ PG 설정 키 로테이션 완료: 총 {}개 중 {}개 업데이트, {}개 실패", 
                configurations.size(), updatedCount, errorCount);
        return updatedCount;
    }
    
    @Override
    @Transactional
    public int rotateTenantPgConfigurations(String tenantId) {
        log.info("🔄 테넌트 PG 설정 키 로테이션 시작: tenantId={}", tenantId);
        
        List<TenantPgConfiguration> configurations = 
                configurationRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        int updatedCount = 0;
        int errorCount = 0;
        
        for (TenantPgConfiguration configuration : configurations) {
            try {
                boolean modified = rotateConfigurationKeys(configuration);
                
                if (modified) {
                    configurationRepository.save(configuration);
                    updatedCount++;
                    log.debug("PG 설정 키 로테이션 완료: configId={}", configuration.getConfigId());
                }
            } catch (Exception e) {
                errorCount++;
                log.error("PG 설정 키 로테이션 실패: configId={}, tenantId={}, error={}", 
                        configuration.getConfigId(), tenantId, e.getMessage(), e);
                // 개별 실패는 전체 작업을 중단하지 않음
            }
        }
        
        log.info("✅ 테넌트 PG 설정 키 로테이션 완료: tenantId={}, 총 {}개 중 {}개 업데이트, {}개 실패", 
                tenantId, configurations.size(), updatedCount, errorCount);
        return updatedCount;
    }
    
    /**
     * 개별 PG 설정의 키를 로테이션합니다.
     * 
     * @param configuration PG 설정 엔티티
     * @return 수정 여부
     */
    private boolean rotateConfigurationKeys(TenantPgConfiguration configuration) {
        boolean modified = false;
        
        // API Key 재암호화 (활성 키로)
        if (needsRotation(configuration.getApiKeyEncrypted())) {
            try {
                String decrypted = encryptionService.decrypt(configuration.getApiKeyEncrypted());
                String reencrypted = encryptionService.ensureActiveKey(decrypted);
                configuration.setApiKeyEncrypted(reencrypted);
                modified = true;
                log.trace("API Key 로테이션 완료: configId={}", configuration.getConfigId());
            } catch (Exception e) {
                log.warn("API Key 로테이션 실패: configId={}, error={}", 
                        configuration.getConfigId(), e.getMessage());
                throw new RuntimeException("API Key 로테이션 실패", e);
            }
        }
        
        // Secret Key 재암호화 (활성 키로)
        if (needsRotation(configuration.getSecretKeyEncrypted())) {
            try {
                String decrypted = encryptionService.decrypt(configuration.getSecretKeyEncrypted());
                String reencrypted = encryptionService.ensureActiveKey(decrypted);
                configuration.setSecretKeyEncrypted(reencrypted);
                modified = true;
                log.trace("Secret Key 로테이션 완료: configId={}", configuration.getConfigId());
            } catch (Exception e) {
                log.warn("Secret Key 로테이션 실패: configId={}, error={}", 
                        configuration.getConfigId(), e.getMessage());
                throw new RuntimeException("Secret Key 로테이션 실패", e);
            }
        }
        
        return modified;
    }
    
    /**
     * 키 로테이션이 필요한지 확인
     * 
     * <p>암호화된 값이 활성 키로 암호화되지 않은 경우 로테이션이 필요합니다.</p>
     * 
     * @param encryptedValue 암호화된 값
     * @return 로테이션 필요 여부
     */
    private boolean needsRotation(String encryptedValue) {
        if (encryptedValue == null || encryptedValue.trim().isEmpty()) {
            return false;
        }
        
        // 암호화되지 않은 경우 로테이션 불필요
        if (!encryptionService.isEncrypted(encryptedValue)) {
            return false;
        }
        
        // ensureActiveKey를 호출하여 활성 키로 재암호화 필요 여부 확인
        // 이미 활성 키로 암호화된 경우 동일한 값 반환, 그렇지 않은 경우 재암호화
        try {
            String decrypted = encryptionService.decrypt(encryptedValue);
            String reencrypted = encryptionService.ensureActiveKey(decrypted);
            // 값이 변경되었으면 로테이션 필요
            return !reencrypted.equals(encryptedValue);
        } catch (Exception e) {
            log.warn("키 로테이션 필요 여부 확인 중 오류: {}", e.getMessage());
            // 오류 발생 시 안전하게 로테이션 시도
            return true;
        }
    }
}

