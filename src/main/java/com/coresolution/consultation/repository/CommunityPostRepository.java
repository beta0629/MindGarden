package com.coresolution.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.constant.CommunityModerationStatus;
import com.coresolution.consultation.constant.CommunityPostKind;
import com.coresolution.consultation.entity.CommunityPost;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * 커뮤니티 게시글 저장소.
 *
 * @author MindGarden
 * @since 2026-05-15
 */
public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {

    Optional<CommunityPost> findByTenantIdAndIdAndIsDeletedFalse(String tenantId, Long id);

    /**
     * 특정 사용자가 작성한 모든 게시글 조회 (soft-deleted 포함, 익명화/sweep 용도).
     *
     * <p>USER_LIFECYCLE_TERMINATION_POLICY v1.1 §0.1 Q12-b — 자발 탈퇴 시 본인 옵션
     * "본문도 삭제" 가 선택된 경우 {@code UserAnonymizationService} 가 본 메서드로
     * 사용자의 모든 게시글을 수집하여 본문 익명화 + soft delete 한다.</p>
     *
     * @param authorUserId 작성자 users.id
     * @return 본인 작성 게시글 목록 (이미 isDeleted=true 인 행도 포함)
     */
    List<CommunityPost> findByAuthor_Id(Long authorUserId);

    @Query("""
        SELECT DISTINCT p FROM CommunityPost p
        JOIN FETCH p.author
        WHERE p.tenantId = :tenantId AND p.isDeleted = false
        AND p.moderationStatus = :status
        ORDER BY p.createdAt DESC
        """)
    List<CommunityPost> findFeedApprovedAll(
            @Param("tenantId") String tenantId,
            @Param("status") CommunityModerationStatus status,
            Pageable pageable);

    @Query("""
        SELECT DISTINCT p FROM CommunityPost p
        JOIN FETCH p.author
        WHERE p.tenantId = :tenantId AND p.isDeleted = false
        AND p.moderationStatus = :status AND p.postKind = :kind
        ORDER BY p.createdAt DESC
        """)
    List<CommunityPost> findFeedApprovedByKind(
            @Param("tenantId") String tenantId,
            @Param("status") CommunityModerationStatus status,
            @Param("kind") CommunityPostKind kind,
            Pageable pageable);

    @Query("""
        SELECT DISTINCT p FROM CommunityPost p
        JOIN FETCH p.author
        WHERE p.tenantId = :tenantId AND p.isDeleted = false
        AND p.moderationStatus = :status
        ORDER BY p.createdAt ASC
        """)
    List<CommunityPost> findModerationQueue(
            @Param("tenantId") String tenantId,
            @Param("status") CommunityModerationStatus status,
            Pageable pageable);
}
