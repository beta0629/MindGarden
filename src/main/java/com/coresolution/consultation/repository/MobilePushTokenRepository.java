package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.MobilePushToken;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    /**
     * 동일 디바이스(token_sha256 동일) 이전 사용자 행을 비활성화한다.
     * 디바이스 1대당 마지막 로그인 사용자에게만 푸시가 가도록 격리하기 위함이며, 현재 사용자 행은 보존한다.
     *
     * <p>{@code mobile_push_tokens} UNIQUE 키는 {@code (tenant_id, user_id, token_sha256)} 이므로
     * 동일 토큰 해시가 사용자별로 별도 행(active=true)으로 존재할 수 있다. 본 메서드는 현재 사용자({@code currentUserId})
     * 를 제외한 동일 해시 행을 active=false 로 일괄 갱신한다.</p>
     *
     * <p>P0 (2026-06-10): 소프트 삭제(is_deleted=true) 행은 이미 비활성 상태이므로 격리 대상에서 제외하여
     * 불필요한 UPDATE·updatedAt 갱신을 막는다(다른 워커가 추적하는 soft-delete 시각 보존).</p>
     *
     * @param tenantId 테넌트 ID
     * @param tokenSha256 토큰 SHA-256 hex
     * @param currentUserId 보존할 현재 사용자 PK
     * @param now updatedAt 적용 시각
     * @return 비활성화 처리된 행 수
     */
    @Modifying
    @Query("UPDATE MobilePushToken t SET t.active = false, t.updatedAt = :now "
            + "WHERE t.tenantId = :tenantId AND t.tokenSha256 = :tokenSha256 "
            + "AND t.userId <> :currentUserId AND t.active = true "
            + "AND t.isDeleted = false")
    int deactivateOtherUsersWithSameTokenHash(
            @Param("tenantId") String tenantId,
            @Param("tokenSha256") String tokenSha256,
            @Param("currentUserId") Long currentUserId,
            @Param("now") LocalDateTime now);
}
