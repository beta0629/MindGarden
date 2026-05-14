package com.coresolution.consultation.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.CommunityComment;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * 커뮤니티 댓글 저장소.
 *
 * @author MindGarden
 * @since 2026-05-15
 */
public interface CommunityCommentRepository extends JpaRepository<CommunityComment, Long> {

    List<CommunityComment> findByTenantIdAndPost_IdInAndIsDeletedFalseOrderByCreatedAtAsc(
            String tenantId, Collection<Long> postIds);

    Optional<CommunityComment> findByTenantIdAndIdAndIsDeletedFalse(String tenantId, Long id);
}
