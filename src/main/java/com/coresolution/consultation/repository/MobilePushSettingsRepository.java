package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.MobilePushSettings;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 모바일 푸시 설정 저장소.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Repository
public interface MobilePushSettingsRepository extends JpaRepository<MobilePushSettings, Long> {

    /**
     * 테넌트·사용자로 설정 1건 조회.
     *
     * @param tenantId 테넌트 ID
     * @param userId 사용자 PK
     * @return 엔티티
     */
    Optional<MobilePushSettings> findByTenantIdAndUserIdAndIsDeletedFalse(String tenantId, Long userId);
}
