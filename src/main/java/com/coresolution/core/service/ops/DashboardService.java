package com.coresolution.core.service.ops;

import com.coresolution.core.domain.onboarding.OnboardingStatus;
import com.coresolution.core.domain.ops.FeatureFlagState;
import com.coresolution.core.repository.onboarding.OnboardingRequestRepository;
import com.coresolution.core.repository.PricingPlanRepository;
import com.coresolution.core.repository.ops.FeatureFlagRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

 /**
 * Ops 포털 대시보드 서비스
 /**
 * 운영 포털 대시보드 메트릭 조회
 /**
 * 
 /**
 * @author CoreSolution
 /**
 * @version 1.0.0
 /**
 * @since 2025-01-XX
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {
    
    private final OnboardingRequestRepository onboardingRequestRepository;
    private final PricingPlanRepository pricingPlanRepository;
    private final FeatureFlagRepository featureFlagRepository;
    
     /**
     * 대시보드 메트릭 조회
     /**
     * 
     /**
     * @return 대시보드 메트릭 (대기 중인 온보딩, 활성 요금제, 활성 애드온, 활성 Feature Flag, 감사 이벤트)
     */
    public Map<String, Object> getMetrics() {
        log.debug("대시보드 메트릭 조회");
        
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        long pendingOnboarding = onboardingRequestRepository.countByStatus(OnboardingStatus.PENDING);
        
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        long activeOnboarding = onboardingRequestRepository.countByStatus(OnboardingStatus.APPROVED);
        
        long onHoldOnboarding = onboardingRequestRepository.countByStatus(OnboardingStatus.ON_HOLD);
        
        long activePlans = pricingPlanRepository.countByIsActiveTrue();
        
        long activeAddons = 0; // pricingAddonRepository.countByIsActive(true);
        
        long activeFeatureFlags = featureFlagRepository.countByState(FeatureFlagState.ENABLED);
        
        long totalAuditEvents = 0;
        
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("pendingOnboarding", pendingOnboarding);
        metrics.put("activeOnboarding", activeOnboarding);
        metrics.put("onHoldOnboarding", onHoldOnboarding);
        metrics.put("activePlans", activePlans);
        metrics.put("activeAddons", activeAddons);
        metrics.put("activeFeatureFlags", activeFeatureFlags);
        metrics.put("totalAuditEvents", totalAuditEvents);
        
        log.debug("대시보드 메트릭 조회 완료: pendingOnboarding={}, activeOnboarding={}, onHoldOnboarding={}, activePlans={}, activeAddons={}, activeFeatureFlags={}, totalAuditEvents={}",
            pendingOnboarding, activeOnboarding, onHoldOnboarding, activePlans, activeAddons, activeFeatureFlags, totalAuditEvents);
        
        return metrics;
    }
}

