package com.coresolution.core.service.ops;

import com.coresolution.core.domain.PricingPlan;
import com.coresolution.core.repository.PricingPlanRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * PricingPlanService 단위 테스트
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PricingPlanService 단위 테스트")
class PricingPlanServiceTest {
    
    @Mock
    private PricingPlanRepository pricingPlanRepository;
    
    @InjectMocks
    private PricingPlanService pricingPlanService;
    
    private PricingPlan testPlan;
    
    @BeforeEach
    void setUp() {
        testPlan = PricingPlan.builder()
            .planId("test-plan-123")
            .planCode("TEST_PLAN")
            .name("테스트 요금제")
            .baseFee(new BigDecimal("100000"))
            .currency("KRW")
            .isActive(true)
            .build();
    }
    
    @Test
    @DisplayName("모든 요금제 목록 조회 - 성공")
    void testFindAllPlans_Success() {
        // Given
        List<PricingPlan> plans = Arrays.asList(testPlan);
        when(pricingPlanRepository.findAll()).thenReturn(plans);
        
        // When
        List<PricingPlan> result = pricingPlanService.findAllPlans();
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getPlanCode()).isEqualTo("TEST_PLAN");
    }
    
    @Test
    @DisplayName("활성화된 요금제 목록 조회 - 성공")
    void testFindAllActivePlans_Success() {
        // Given
        List<PricingPlan> activePlans = Arrays.asList(testPlan);
        when(pricingPlanRepository.findAllActive()).thenReturn(activePlans);
        
        // When
        List<PricingPlan> result = pricingPlanService.findAllActivePlans();
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).isActive()).isTrue();
    }
    
    @Test
    @DisplayName("plan_code로 요금제 조회 - 성공")
    void testFindByPlanCode_Success() {
        // Given
        when(pricingPlanRepository.findByPlanCode("TEST_PLAN")).thenReturn(Optional.of(testPlan));
        
        // When
        Optional<PricingPlan> result = pricingPlanService.findByPlanCode("TEST_PLAN");
        
        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getPlanCode()).isEqualTo("TEST_PLAN");
    }
    
    @Test
    @DisplayName("plan_code로 요금제 조회 - 없음")
    void testFindByPlanCode_NotFound() {
        // Given
        when(pricingPlanRepository.findByPlanCode("NOT_EXIST")).thenReturn(Optional.empty());
        
        // When
        Optional<PricingPlan> result = pricingPlanService.findByPlanCode("NOT_EXIST");
        
        // Then
        assertThat(result).isEmpty();
    }
    
    @Test
    @DisplayName("plan_id로 요금제 조회 - 성공")
    void testFindByPlanId_Success() {
        // Given
        when(pricingPlanRepository.findByPlanId("test-plan-123")).thenReturn(Optional.of(testPlan));
        
        // When
        Optional<PricingPlan> result = pricingPlanService.findByPlanId("test-plan-123");
        
        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getPlanId()).isEqualTo("test-plan-123");
    }
    
    @Test
    @DisplayName("활성화된 요금제 개수 조회 - 성공")
    void testCountActivePlans_Success() {
        // Given
        when(pricingPlanRepository.countByIsActiveTrue()).thenReturn(5L);
        
        // When
        long count = pricingPlanService.countActivePlans();
        
        // Then
        assertThat(count).isEqualTo(5L);
    }
}

