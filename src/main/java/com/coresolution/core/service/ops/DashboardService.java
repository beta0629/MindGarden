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
 * 운영 포털 대시보드 메트릭 조회
 * 
 * @author CoreSolution
 * @version 1.0.0
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
    // Note: 감사 로그는 backend-ops 모듈에 별도로 관리되므로, 
    // 현재는 대시보드 메트릭에서 제외 (추후 모듈 통합 시 추가 예정)
    
    /**
     * 대시보드 메트릭 조회
     * 
     * @return 대시보드 메트릭 (대기 중인 온보딩, 활성 요금제, 활성 애드온, 활성 Feature Flag, 감사 이벤트)
     */
    public Map<String, Object> getMetrics() {
        log.debug("대시보드 메트릭 조회");
        
        // 대기 중인 온보딩 요청 개수
        long pendingOnboarding = onboardingRequestRepository.countByStatus(OnboardingStatus.PENDING);
        
        // 활성 온보딩 요청 개수 (승인된 온보딩)
        // 주의: PL/SQL 프로시저 실패로 ON_HOLD가 된 경우도 포함 (자동 승인 시도했지만 프로시저 실패)
        long activeOnboarding = onboardingRequestRepository.countByStatus(OnboardingStatus.APPROVED);
        
        // ON_HOLD 상태도 확인 (자동 승인 시도했지만 프로시저 실패한 경우)
        long onHoldOnboarding = onboardingRequestRepository.countByStatus(OnboardingStatus.ON_HOLD);
        
        // 활성 요금제 개수
        long activePlans = pricingPlanRepository.countByIsActiveTrue();
        
        // TODO: 활성 애드온 개수 (PricingAddonRepository 필요)
        long activeAddons = 0; // pricingAddonRepository.countByIsActive(true);
        
        // 활성 Feature Flag 개수
        long activeFeatureFlags = featureFlagRepository.countByState(FeatureFlagState.ENABLED);
        
        // Note: 감사 로그는 backend-ops 모듈에 별도로 관리되므로, 
        // 현재는 대시보드 메트릭에서 제외 (추후 모듈 통합 시 추가 예정)
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

