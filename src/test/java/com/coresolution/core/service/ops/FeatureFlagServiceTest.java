package com.coresolution.core.service.ops;

import com.coresolution.core.domain.ops.FeatureFlag;
import com.coresolution.core.domain.ops.FeatureFlagState;
import com.coresolution.core.repository.ops.FeatureFlagRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * FeatureFlagService 단위 테스트
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FeatureFlagService 단위 테스트")
class FeatureFlagServiceTest {
    
    @Mock
    private FeatureFlagRepository featureFlagRepository;
    
    @InjectMocks
    private FeatureFlagService featureFlagService;
    
    private FeatureFlag testFlag;
    
    @BeforeEach
    void setUp() {
        testFlag = FeatureFlag.builder()
            .flagKey("test-flag-123")
            .description("테스트 플래그")
            .state(FeatureFlagState.ENABLED)
            .targetScope("test-scope")
            .build();
    }
    
    @Test
    @DisplayName("모든 Feature Flag 목록 조회 - 성공")
    void testFindAll_Success() {
        // Given
        List<FeatureFlag> flags = Arrays.asList(testFlag);
        when(featureFlagRepository.findAll()).thenReturn(flags);
        
        // When
        List<FeatureFlag> result = featureFlagService.findAll();
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getFlagKey()).isEqualTo("test-flag-123");
    }
    
    @Test
    @DisplayName("활성화된 Feature Flag 목록 조회 - 성공")
    void testFindAllEnabled_Success() {
        // Given
        List<FeatureFlag> enabledFlags = Arrays.asList(testFlag);
        when(featureFlagRepository.findAllEnabled()).thenReturn(enabledFlags);
        
        // When
        List<FeatureFlag> result = featureFlagService.findAllEnabled();
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).isEnabled()).isTrue();
    }
    
    @Test
    @DisplayName("flag_key로 Feature Flag 조회 - 성공")
    void testFindByFlagKey_Success() {
        // Given
        when(featureFlagRepository.findByFlagKey("test-flag-123")).thenReturn(Optional.of(testFlag));
        
        // When
        Optional<FeatureFlag> result = featureFlagService.findByFlagKey("test-flag-123");
        
        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getFlagKey()).isEqualTo("test-flag-123");
    }
    
    @Test
    @DisplayName("flag_key로 Feature Flag 조회 - 없음")
    void testFindByFlagKey_NotFound() {
        // Given
        when(featureFlagRepository.findByFlagKey("NOT_EXIST")).thenReturn(Optional.empty());
        
        // When
        Optional<FeatureFlag> result = featureFlagService.findByFlagKey("NOT_EXIST");
        
        // Then
        assertThat(result).isEmpty();
    }
    
    @Test
    @DisplayName("상태별 Feature Flag 개수 조회 - 성공")
    void testCountByState_Success() {
        // Given
        when(featureFlagRepository.countByState(FeatureFlagState.ENABLED)).thenReturn(10L);
        
        // When
        long count = featureFlagService.countByState(FeatureFlagState.ENABLED);
        
        // Then
        assertThat(count).isEqualTo(10L);
    }
    
    @Test
    @DisplayName("상태별 Feature Flag 개수 조회 - DISABLED")
    void testCountByState_Disabled() {
        // Given
        when(featureFlagRepository.countByState(FeatureFlagState.DISABLED)).thenReturn(5L);
        
        // When
        long count = featureFlagService.countByState(FeatureFlagState.DISABLED);
        
        // Then
        assertThat(count).isEqualTo(5L);
    }
}

