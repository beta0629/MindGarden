package com.coresolution.core.service.impl;

import com.coresolution.core.domain.TenantPgConfiguration;
import com.coresolution.core.domain.enums.ApprovalStatus;
import com.coresolution.core.domain.enums.PgConfigurationStatus;
import com.coresolution.core.domain.enums.PgProvider;
import com.coresolution.core.repository.TenantPgConfigurationRepository;
import com.coresolution.consultation.service.PersonalDataEncryptionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * PG 설정 키 로테이션 서비스 테스트
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@ExtendWith(MockitoExtension.class)
class TenantPgConfigurationKeyRotationServiceTest {
    
    @Mock
    private TenantPgConfigurationRepository configurationRepository;
    
    @Mock
    private PersonalDataEncryptionService encryptionService;
    
    @InjectMocks
    private TenantPgConfigurationKeyRotationServiceImpl keyRotationService;
    
    private TenantPgConfiguration testConfiguration;
    
    @BeforeEach
    void setUp() {
        testConfiguration = TenantPgConfiguration.builder()
                .configId("test-config-1")
                .tenantId("test-tenant-1")
                .pgProvider(PgProvider.TOSS)
                .pgName("테스트 PG")
                .apiKeyEncrypted("v1::old-encrypted-api-key")
                .secretKeyEncrypted("v1::old-encrypted-secret-key")
                .status(PgConfigurationStatus.ACTIVE)
                .approvalStatus(ApprovalStatus.APPROVED)
                .build();
    }
    
    @Test
    void testRotateAllPgConfigurations_Success() {
        // Given
        List<TenantPgConfiguration> configurations = Arrays.asList(testConfiguration);
        when(configurationRepository.findAll()).thenReturn(configurations);
        when(encryptionService.isEncrypted(anyString())).thenReturn(true);
        when(encryptionService.decrypt("v1::old-encrypted-api-key")).thenReturn("decrypted-api-key");
        when(encryptionService.decrypt("v1::old-encrypted-secret-key")).thenReturn("decrypted-secret-key");
        when(encryptionService.ensureActiveKey("decrypted-api-key")).thenReturn("v2::new-encrypted-api-key");
        when(encryptionService.ensureActiveKey("decrypted-secret-key")).thenReturn("v2::new-encrypted-secret-key");
        when(configurationRepository.save(any(TenantPgConfiguration.class))).thenReturn(testConfiguration);
        
        // When
        int result = keyRotationService.rotateAllPgConfigurations();
        
        // Then
        assertEquals(1, result);
        verify(configurationRepository, times(1)).save(testConfiguration);
        verify(encryptionService, times(1)).decrypt("v1::old-encrypted-api-key");
        verify(encryptionService, times(1)).decrypt("v1::old-encrypted-secret-key");
        verify(encryptionService, times(1)).ensureActiveKey("decrypted-api-key");
        verify(encryptionService, times(1)).ensureActiveKey("decrypted-secret-key");
    }
    
    @Test
    void testRotateAllPgConfigurations_NoRotationNeeded() {
        // Given
        testConfiguration.setApiKeyEncrypted("v2::already-active-key");
        testConfiguration.setSecretKeyEncrypted("v2::already-active-key");
        List<TenantPgConfiguration> configurations = Arrays.asList(testConfiguration);
        when(configurationRepository.findAll()).thenReturn(configurations);
        when(encryptionService.isEncrypted(anyString())).thenReturn(true);
        when(encryptionService.decrypt("v2::already-active-key")).thenReturn("decrypted-key");
        when(encryptionService.ensureActiveKey("decrypted-key")).thenReturn("v2::already-active-key");
        
        // When
        int result = keyRotationService.rotateAllPgConfigurations();
        
        // Then
        assertEquals(0, result);
        verify(configurationRepository, never()).save(any());
    }
    
    @Test
    void testRotateAllPgConfigurations_PartialFailure() {
        // Given
        TenantPgConfiguration config1 = createTestConfiguration("config-1", "v1::old-key");
        TenantPgConfiguration config2 = createTestConfiguration("config-2", "v1::old-key");
        List<TenantPgConfiguration> configurations = Arrays.asList(config1, config2);
        when(configurationRepository.findAll()).thenReturn(configurations);
        when(encryptionService.isEncrypted(anyString())).thenReturn(true);
        
        // config1 성공
        when(encryptionService.decrypt("v1::old-key")).thenReturn("decrypted-key");
        when(encryptionService.ensureActiveKey("decrypted-key")).thenReturn("v2::new-key");
        when(configurationRepository.save(config1)).thenReturn(config1);
        
        // config2 실패
        when(encryptionService.decrypt("v1::old-key")).thenThrow(new RuntimeException("Decryption failed"));
        
        // When
        int result = keyRotationService.rotateAllPgConfigurations();
        
        // Then
        assertEquals(1, result); // config1만 성공
        verify(configurationRepository, times(1)).save(config1);
    }
    
    @Test
    void testRotateTenantPgConfigurations_Success() {
        // Given
        String tenantId = "test-tenant-1";
        List<TenantPgConfiguration> configurations = Arrays.asList(testConfiguration);
        when(configurationRepository.findByTenantIdAndIsDeletedFalse(tenantId)).thenReturn(configurations);
        when(encryptionService.isEncrypted(anyString())).thenReturn(true);
        when(encryptionService.decrypt(anyString())).thenReturn("decrypted-key");
        when(encryptionService.ensureActiveKey("decrypted-key")).thenReturn("v2::new-encrypted-key");
        when(configurationRepository.save(any(TenantPgConfiguration.class))).thenReturn(testConfiguration);
        
        // When
        int result = keyRotationService.rotateTenantPgConfigurations(tenantId);
        
        // Then
        assertEquals(1, result);
        verify(configurationRepository, times(1)).save(testConfiguration);
    }
    
    // ==================== Helper Methods ====================
    
    private TenantPgConfiguration createTestConfiguration(String configId, String encryptedKey) {
        return TenantPgConfiguration.builder()
                .configId(configId)
                .tenantId("test-tenant-1")
                .pgProvider(PgProvider.TOSS)
                .pgName("테스트 PG")
                .apiKeyEncrypted(encryptedKey)
                .secretKeyEncrypted(encryptedKey)
                .status(PgConfigurationStatus.ACTIVE)
                .approvalStatus(ApprovalStatus.APPROVED)
                .build();
    }
}

