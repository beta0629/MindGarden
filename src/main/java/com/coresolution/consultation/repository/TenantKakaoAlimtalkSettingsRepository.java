package com.coresolution.consultation.repository;

import java.util.Optional;
import com.coresolution.consultation.entity.TenantKakaoAlimtalkSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 테넌트 카카오 알림톡 비시크릿 설정 저장소.
 *
 * @author CoreSolution
 * @since 2026-04-24
 */
@Repository
public interface TenantKakaoAlimtalkSettingsRepository extends JpaRepository<TenantKakaoAlimtalkSettings, Long> {

    /**
     * 테넌트 ID로 활성 행 조회.
     *
     * @param tenantId 테넌트 ID
     * @return 설정 행
     */
    Optional<TenantKakaoAlimtalkSettings> findByTenantIdAndIsDeletedFalse(String tenantId);
}
