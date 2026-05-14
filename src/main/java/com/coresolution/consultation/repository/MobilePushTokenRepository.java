package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.MobilePushToken;
import java.util.Collection;
import java.util.List;
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

    /**
     * 테넌트·사용자 목록에 대한 활성 토큰 목록.
     *
     * @param tenantId 테넌트 ID
     * @param userIds 사용자 PK 목록
     * @return 토큰 행
     */
    List<MobilePushToken> findByTenantIdAndUserIdInAndActiveTrueAndIsDeletedFalse(String tenantId,
            Collection<Long> userIds);

    /**
     * 원문 푸시 토큰으로 활성 행 조회(Expo 오류 응답 처리용).
     *
     * @param tenantId 테넌트 ID
     * @param pushToken 원문 토큰
     * @return 엔티티
     */
    Optional<MobilePushToken> findByTenantIdAndPushTokenAndIsDeletedFalse(String tenantId, String pushToken);
}
