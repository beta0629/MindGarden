package com.mindgarden.ops.repository.onboarding;

import com.mindgarden.ops.domain.onboarding.OnboardingRequest;
import com.mindgarden.ops.domain.onboarding.OnboardingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OnboardingRequestRepository extends JpaRepository<OnboardingRequest, UUID> {
    List<OnboardingRequest> findByStatusOrderByCreatedAtDesc(OnboardingStatus status);

    long countByStatus(OnboardingStatus status);
}
