package com.coresolution.core.service.ops;

import com.coresolution.core.domain.onboarding.OnboardingStatus;
import com.coresolution.core.domain.ops.FeatureFlagState;
import com.coresolution.core.repository.onboarding.OnboardingRequestRepository;
import com.coresolution.core.repository.PricingPlanRepository;
import com.coresolution.core.repository.ops.FeatureFlagRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * DashboardService 단위 테스트
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("DashboardService 단위 테스트")
class DashboardServiceTest {
    
    @Mock
    private OnboardingRequestRepository onboardingRequestRepository;
    
    @Mock
    private PricingPlanRepository pricingPlanRepository;
    
    @Mock
    private FeatureFlagRepository featureFlagRepository;
    
    @InjectMocks
    private DashboardService dashboardService;
    
    @BeforeEach
    void setUp() {
        // 기본 Mock 설정
        when(onboardingRequestRepository.countByStatus(OnboardingStatus.PENDING)).thenReturn(5L);
        when(pricingPlanRepository.countByIsActiveTrue()).thenReturn(3L);
        when(featureFlagRepository.countByState(FeatureFlagState.ENABLED)).thenReturn(10L);
    }
    
    @Test
    @DisplayName("대시보드 메트릭 조회 - 성공")
    void testGetMetrics_Success() {
        // When
        Map<String, Object> metrics = dashboardService.getMetrics();
        
        // Then
        assertThat(metrics).isNotNull();
        assertThat(metrics.containsKey("pendingOnboarding")).isTrue();
        assertThat(metrics.containsKey("activePlans")).isTrue();
        assertThat(metrics.containsKey("activeFeatureFlags")).isTrue();
        assertThat(metrics.containsKey("activeAddons")).isTrue();
        assertThat(metrics.containsKey("totalAuditEvents")).isTrue();
        
        assertThat(metrics.get("pendingOnboarding")).isEqualTo(5L);
        assertThat(metrics.get("activePlans")).isEqualTo(3L);
        assertThat(metrics.get("activeFeatureFlags")).isEqualTo(10L);
        assertThat(metrics.get("activeAddons")).isEqualTo(0L);
        assertThat(metrics.get("totalAuditEvents")).isEqualTo(0L);
    }
    
    @Test
    @DisplayName("대시보드 메트릭 조회 - 빈 데이터")
    void testGetMetrics_EmptyData() {
        // Given
        when(onboardingRequestRepository.countByStatus(OnboardingStatus.PENDING)).thenReturn(0L);
        when(pricingPlanRepository.countByIsActiveTrue()).thenReturn(0L);
        when(featureFlagRepository.countByState(FeatureFlagState.ENABLED)).thenReturn(0L);
        
        // When
        Map<String, Object> metrics = dashboardService.getMetrics();
        
        // Then
        assertThat(metrics).isNotNull();
        assertThat(metrics.get("pendingOnboarding")).isEqualTo(0L);
        assertThat(metrics.get("activePlans")).isEqualTo(0L);
        assertThat(metrics.get("activeFeatureFlags")).isEqualTo(0L);
    }
}

