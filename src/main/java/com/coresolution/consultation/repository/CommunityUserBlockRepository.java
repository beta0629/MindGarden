package com.coresolution.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.CommunityUserBlock;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Apple T2 (1.2 UGC) — 커뮤니티 사용자 차단 저장소.
 *
 * <p>차단 조회는 항상 {@code tenantId} 격리되어야 하며 차단/해제는 {@code uk_cub_tenant_blocker_blocked}
 * UNIQUE 제약으로 중복 INSERT 가 방지된다. 단방향 정책이므로 reverse lookup ({@code findBlocker*})은
 * 운영 통계 용도로만 사용한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
public interface CommunityUserBlockRepository extends JpaRepository<CommunityUserBlock, Long> {

    /**
     * 활성 차단 단건 조회 — 이미 차단 중인지 검사.
     *
     * @param tenantId      테넌트 ID
     * @param blockerId     차단자 users.id
     * @param blockedId     차단 대상 users.id
     * @return 활성(soft-delete 미적용) 차단 row
     */
    Optional<CommunityUserBlock> findByTenantIdAndBlocker_IdAndBlocked_IdAndIsDeletedFalse(
        String tenantId, Long blockerId, Long blockedId);

    /**
     * 활성/비활성 모두 조회 — 차단 해제 후 재차단 시 row 재활용을 위한 lookup.
     *
     * @param tenantId  테넌트 ID
     * @param blockerId 차단자 users.id
     * @param blockedId 차단 대상 users.id
     * @return UNIQUE row 가 있으면 반환
     */
    Optional<CommunityUserBlock> findByTenantIdAndBlocker_IdAndBlocked_Id(
        String tenantId, Long blockerId, Long blockedId);

    /**
     * 차단자 → 차단 대상 ID 목록 — 피드/댓글 쿼리에서 제외 필터로 사용.
     *
     * @param tenantId  테넌트 ID
     * @param blockerId 차단자 users.id
     * @return 차단 대상 users.id 리스트(없으면 empty)
     */
    @Query("""
        SELECT b.blocked.id FROM CommunityUserBlock b
        WHERE b.tenantId = :tenantId AND b.blocker.id = :blockerId AND b.isDeleted = false
        """)
    List<Long> findBlockedUserIds(@Param("tenantId") String tenantId, @Param("blockerId") Long blockerId);

    /**
     * 차단 목록 — 사용자 화면(차단 목록 페이지)에서 표시.
     *
     * @param tenantId  테넌트 ID
     * @param blockerId 차단자 users.id
     * @param pageable  페이지
     * @return 차단 목록(차단 시각 내림차순)
     */
    @Query("""
        SELECT b FROM CommunityUserBlock b
        JOIN FETCH b.blocked
        WHERE b.tenantId = :tenantId AND b.blocker.id = :blockerId AND b.isDeleted = false
        ORDER BY b.createdAt DESC
        """)
    List<CommunityUserBlock> findActiveByBlocker(
        @Param("tenantId") String tenantId,
        @Param("blockerId") Long blockerId,
        Pageable pageable);
}
