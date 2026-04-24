package com.coresolution.consultation.repository;

import java.util.Optional;
import com.coresolution.consultation.entity.TenantSmsSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 테넌트 SMS 비시크릿 설정 저장소.
 *
 * @author CoreSolution
 * @since 2026-04-25
 */
@Repository
public interface TenantSmsSettingsRepository extends JpaRepository<TenantSmsSettings, Long> {

    /**
     * 테넌트 ID로 활성 행 조회.
     *
     * @param tenantId 테넌트 ID
     * @return 설정 행
     */
    Optional<TenantSmsSettings> findByTenantIdAndIsDeletedFalse(String tenantId);
}
