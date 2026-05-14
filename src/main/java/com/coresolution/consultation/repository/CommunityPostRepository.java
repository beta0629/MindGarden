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
