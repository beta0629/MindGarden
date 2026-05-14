package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.MobilePushToken;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 모바일 푸시 토큰 저장소.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Repository
public interface MobilePushTokenRepository extends JpaRepository<MobilePushToken, Long> {

    /**
     * 테넌트·사용자·토큰 해시로 조회 (소프트 삭제 제외).
     *
     * @param tenantId 테넌트 ID
     * @param userId 사용자 PK
     * @param tokenSha256 SHA-256 hex
     * @return 엔티티
     */
    Optional<MobilePushToken> findByTenantIdAndUserIdAndTokenSha256AndIsDeletedFalse(
            String tenantId, Long userId, String tokenSha256);
}
