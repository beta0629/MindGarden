package com.mindgarden.ops.service.dashboard;

import com.mindgarden.ops.controller.dto.DashboardMetricsResponse;
import com.mindgarden.ops.domain.config.FeatureFlagState;
import com.mindgarden.ops.domain.onboarding.OnboardingStatus;
import com.mindgarden.ops.repository.audit.OpsAuditLogRepository;
import com.mindgarden.ops.repository.config.FeatureFlagRepository;
import com.mindgarden.ops.repository.onboarding.OnboardingRequestRepository;
import com.mindgarden.ops.repository.pricing.PricingAddonRepository;
import com.mindgarden.ops.repository.pricing.PricingPlanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardService {

    private final OnboardingRequestRepository onboardingRequestRepository;
    private final PricingPlanRepository pricingPlanRepository;
    private final PricingAddonRepository pricingAddonRepository;
    private final FeatureFlagRepository featureFlagRepository;
    private final OpsAuditLogRepository opsAuditLogRepository;

    public DashboardService(
        OnboardingRequestRepository onboardingRequestRepository,
        PricingPlanRepository pricingPlanRepository,
        PricingAddonRepository pricingAddonRepository,
        FeatureFlagRepository featureFlagRepository,
        OpsAuditLogRepository opsAuditLogRepository
    ) {
        this.onboardingRequestRepository = onboardingRequestRepository;
        this.pricingPlanRepository = pricingPlanRepository;
        this.pricingAddonRepository = pricingAddonRepository;
        this.featureFlagRepository = featureFlagRepository;
        this.opsAuditLogRepository = opsAuditLogRepository;
    }

    @Transactional(readOnly = true)
    public DashboardMetricsResponse getMetrics() {
        long pendingOnboarding = onboardingRequestRepository.countByStatus(OnboardingStatus.PENDING);
        long activePlans = pricingPlanRepository.countByActive(true);
        long activeAddons = pricingAddonRepository.countByActive(true);
        long activeFlags = featureFlagRepository.countByState(FeatureFlagState.ENABLED);
        long auditEvents = opsAuditLogRepository.count();

        return new DashboardMetricsResponse(
            pendingOnboarding,
            activePlans,
            activeAddons,
            activeFlags,
            auditEvents
        );
    }
}
