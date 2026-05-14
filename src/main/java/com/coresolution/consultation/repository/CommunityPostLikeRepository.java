package com.coresolution.consultation.repository;

import java.util.Optional;
import com.coresolution.consultation.entity.CommunityPostLike;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * 게시글 좋아요 저장소.
 *
 * @author MindGarden
 * @since 2026-05-15
 */
public interface CommunityPostLikeRepository extends JpaRepository<CommunityPostLike, Long> {

    long countByTenantIdAndPost_IdAndIsDeletedFalse(String tenantId, Long postId);

    boolean existsByTenantIdAndPost_IdAndUser_IdAndIsDeletedFalse(String tenantId, Long postId, Long userId);

    Optional<CommunityPostLike> findByTenantIdAndPost_IdAndUser_IdAndIsDeletedFalse(
            String tenantId, Long postId, Long userId);
}
