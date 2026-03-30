package com.mindgarden.ops.repository.onboarding;

import com.mindgarden.ops.domain.onboarding.OnboardingRequest;
import com.mindgarden.ops.domain.onboarding.OnboardingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OnboardingRequestRepository extends JpaRepository<OnboardingRequest, UUID> {
    List<OnboardingRequest> findByStatusOrderByCreatedAtDesc(OnboardingStatus status);

    List<OnboardingRequest> findAllByOrderByCreatedAtDesc();

    long countByStatus(OnboardingStatus status);

    @Query("SELECT o FROM OnboardingRequest o WHERE o.tenantId = :tenantId AND o.id = :id")
    Optional<OnboardingRequest> findByTenantIdAndId(@Param("tenantId") String tenantId, @Param("id") UUID id);
}
