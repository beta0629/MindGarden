package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.PointTenantPolicy;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;

/**
 * 테넌트 포인트 정책 저장소.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@Repository
public interface PointTenantPolicyRepository extends BaseRepository<PointTenantPolicy, Long> {

    List<PointTenantPolicy> findByTenantIdAndIsDeletedFalse(String tenantId);

    Optional<PointTenantPolicy> findByTenantIdAndPolicyKeyAndIsDeletedFalse(String tenantId, String policyKey);
}
