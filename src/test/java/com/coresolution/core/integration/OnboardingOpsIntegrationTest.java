package com.coresolution.core.integration;

import com.coresolution.core.domain.onboarding.OnboardingRequest;
import com.coresolution.core.domain.onboarding.OnboardingStatus;
import com.coresolution.core.domain.onboarding.RiskLevel;
import com.coresolution.core.service.OnboardingService;
import com.coresolution.core.service.ops.DashboardService;
import com.coresolution.core.service.ops.PricingPlanService;
import com.coresolution.core.service.ops.FeatureFlagService;
import com.coresolution.core.repository.PricingPlanRepository;
import com.coresolution.core.repository.ops.FeatureFlagRepository;
import com.coresolution.core.domain.PricingPlan;
import com.coresolution.core.domain.ops.FeatureFlag;
import com.coresolution.core.domain.ops.FeatureFlagState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 온보딩 및 Ops 포털 통합 테스트
 * 온보딩 프로세스 전체 플로우 및 ops 포털 기능 통합 테스트
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@ActiveProfiles("test")
@Transactional
@DisplayName("온보딩 및 Ops 포털 통합 테스트")
class OnboardingOpsIntegrationTest {
    
    @Autowired
    private OnboardingService onboardingService;
    
    @Autowired
    private DashboardService dashboardService;
    
    @Autowired
    private PricingPlanService pricingPlanService;
    
    @Autowired
    private FeatureFlagService featureFlagService;
    
    @Autowired
    private PricingPlanRepository pricingPlanRepository;
    
    @Autowired
    private FeatureFlagRepository featureFlagRepository;
    
    private String testTenantId;
    private String testTenantName;
    private String testBusinessType;
    
    @BeforeEach
    void setUp() {
        testTenantId = "test-tenant-" + System.currentTimeMillis();
        testTenantName = "테스트 테넌트";
        testBusinessType = "ACADEMY";
    }
    
    @Test
    @DisplayName("온보딩 프로세스 전체 테스트 - 요청 생성 → 승인 → 자동화 프로세스")
    void testOnboardingProcess_FullFlow() {
        // Step 1: 온보딩 요청 생성
        OnboardingRequest request = onboardingService.create(
            testTenantId,
            testTenantName,
            "test-requester",
            RiskLevel.LOW,
            "{\"checklist\": []}",
            testBusinessType
        );
        
        assertThat(request).isNotNull();
        assertThat(request.getId()).isNotNull();
        assertThat(request.getTenantId()).isEqualTo(testTenantId);
        assertThat(request.getStatus()).isEqualTo(OnboardingStatus.PENDING);
        
        // Step 2: 온보딩 요청 조회
        OnboardingRequest found = onboardingService.getById(request.getId());
        assertThat(found).isNotNull();
        assertThat(found.getId()).isEqualTo(request.getId());
        
        // Step 3: 대기 중인 온보딩 요청 목록 조회
        var pendingRequests = onboardingService.findPending();
        assertThat(pendingRequests).isNotEmpty();
        assertThat(pendingRequests.stream()
            .anyMatch(r -> r.getId().equals(request.getId()))).isTrue();
        
        // Step 4: 온보딩 승인 (PL/SQL 프로시저 자동 실행)
        OnboardingRequest approved = onboardingService.decide(
            request.getId(),
            OnboardingStatus.APPROVED,
            "test-admin",
            "테스트 승인"
        );
        
        assertThat(approved).isNotNull();
        assertThat(approved.getStatus()).isEqualTo(OnboardingStatus.APPROVED);
        assertThat(approved.getDecidedBy()).isEqualTo("test-admin");
        assertThat(approved.getDecisionNote()).isEqualTo("테스트 승인");
        
        // Step 5: 승인된 온보딩 요청 상태 확인
        var approvedRequests = onboardingService.findByStatus(OnboardingStatus.APPROVED, null);
        assertThat(approvedRequests.getContent().stream()
            .anyMatch(r -> r.getId().equals(request.getId()))).isTrue();
    }
    
    @Test
    @DisplayName("Ops 포털 기능 테스트 - 대시보드 메트릭 조회")
    void testOpsPortal_DashboardMetrics() {
        // Given: 테스트 데이터 준비
        // 온보딩 요청 생성
        onboardingService.create(
            testTenantId,
            testTenantName,
            "test-requester",
            RiskLevel.LOW,
            "{\"checklist\": []}",
            testBusinessType
        );
        
        // 요금제 생성 (활성화)
        PricingPlan plan = PricingPlan.builder()
            .planId("test-plan-" + System.currentTimeMillis())
            .planCode("TEST_PLAN")
            .name("테스트 요금제")
            .baseFee(new BigDecimal("100000"))
            .currency("KRW")
            .isActive(true)
            .build();
        pricingPlanRepository.save(plan);
        
        // Feature Flag 생성 (활성화)
        FeatureFlag flag = FeatureFlag.builder()
            .flagKey("test-flag-" + System.currentTimeMillis())
            .description("테스트 플래그")
            .state(FeatureFlagState.ENABLED)
            .build();
        featureFlagRepository.save(flag);
        
        // When: 대시보드 메트릭 조회
        Map<String, Object> metrics = dashboardService.getMetrics();
        
        // Then: 메트릭 확인
        assertThat(metrics).isNotNull();
        assertThat(metrics.containsKey("pendingOnboarding")).isTrue();
        assertThat(metrics.containsKey("activePlans")).isTrue();
        assertThat(metrics.containsKey("activeFeatureFlags")).isTrue();
        
        long pendingOnboarding = (Long) metrics.get("pendingOnboarding");
        long activePlans = (Long) metrics.get("activePlans");
        long activeFeatureFlags = (Long) metrics.get("activeFeatureFlags");
        
        assertThat(pendingOnboarding).isGreaterThanOrEqualTo(1);
        assertThat(activePlans).isGreaterThanOrEqualTo(1);
        assertThat(activeFeatureFlags).isGreaterThanOrEqualTo(1);
    }
    
    @Test
    @DisplayName("Ops 포털 기능 테스트 - 요금제 조회")
    void testOpsPortal_PricingPlanService() {
        // Given: 테스트 요금제 생성
        PricingPlan plan = PricingPlan.builder()
            .planId("test-plan-" + System.currentTimeMillis())
            .planCode("TEST_PLAN")
            .name("테스트 요금제")
            .baseFee(new BigDecimal("100000"))
            .currency("KRW")
            .isActive(true)
            .build();
        PricingPlan saved = pricingPlanRepository.save(plan);
        
        // When: 요금제 조회
        var allPlans = pricingPlanService.findAllPlans();
        var activePlans = pricingPlanService.findAllActivePlans();
        var foundByCode = pricingPlanService.findByPlanCode("TEST_PLAN");
        var foundById = pricingPlanService.findByPlanId(saved.getPlanId());
        long activeCount = pricingPlanService.countActivePlans();
        
        // Then: 조회 결과 확인
        assertThat(allPlans).isNotEmpty();
        assertThat(activePlans).isNotEmpty();
        assertThat(foundByCode).isPresent();
        assertThat(foundByCode.get().getPlanCode()).isEqualTo("TEST_PLAN");
        assertThat(foundById).isPresent();
        assertThat(foundById.get().getPlanId()).isEqualTo(saved.getPlanId());
        assertThat(activeCount).isGreaterThanOrEqualTo(1);
    }
    
    @Test
    @DisplayName("Ops 포털 기능 테스트 - Feature Flag 조회")
    void testOpsPortal_FeatureFlagService() {
        // Given: 테스트 Feature Flag 생성
        FeatureFlag flag = FeatureFlag.builder()
            .flagKey("test-flag-" + System.currentTimeMillis())
            .description("테스트 플래그")
            .state(FeatureFlagState.ENABLED)
            .targetScope("test-scope")
            .build();
        FeatureFlag saved = featureFlagRepository.save(flag);
        
        // When: Feature Flag 조회
        var allFlags = featureFlagService.findAll();
        var enabledFlags = featureFlagService.findAllEnabled();
        var foundByKey = featureFlagService.findByFlagKey(saved.getFlagKey());
        long enabledCount = featureFlagService.countByState(FeatureFlagState.ENABLED);
        
        // Then: 조회 결과 확인
        assertThat(allFlags).isNotEmpty();
        assertThat(enabledFlags).isNotEmpty();
        assertThat(foundByKey).isPresent();
        assertThat(foundByKey.get().getFlagKey()).isEqualTo(saved.getFlagKey());
        assertThat(enabledCount).isGreaterThanOrEqualTo(1);
    }
    
    @Test
    @DisplayName("통합 시나리오 테스트 - 온보딩 → Ops 포털 연동")
    void testIntegrationScenario_OnboardingToOpsPortal() {
        // Step 1: 온보딩 요청 생성
        OnboardingRequest request = onboardingService.create(
            testTenantId,
            testTenantName,
            "test-requester",
            RiskLevel.LOW,
            "{\"checklist\": []}",
            testBusinessType
        );
        
        // Step 2: 대시보드에서 대기 중인 온보딩 확인
        Map<String, Object> metricsBefore = dashboardService.getMetrics();
        long pendingBefore = (Long) metricsBefore.get("pendingOnboarding");
        assertThat(pendingBefore).isGreaterThanOrEqualTo(1);
        
        // Step 3: 온보딩 승인
        onboardingService.decide(
            request.getId(),
            OnboardingStatus.APPROVED,
            "test-admin",
            "통합 테스트 승인"
        );
        
        // Step 4: 승인 후 대시보드 메트릭 확인
        Map<String, Object> metricsAfter = dashboardService.getMetrics();
        long pendingAfter = (Long) metricsAfter.get("pendingOnboarding");
        
        // 승인 후 대기 중인 요청이 감소했는지 확인 (다른 요청이 있을 수 있으므로 >= 비교)
        assertThat(pendingAfter).isLessThanOrEqualTo(pendingBefore);
        
        // Step 5: 승인된 요청 상태 확인
        var approvedRequests = onboardingService.findByStatus(OnboardingStatus.APPROVED, null);
        assertThat(approvedRequests.getContent().stream()
            .anyMatch(r -> r.getId().equals(request.getId()))).isTrue();
    }
}

