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

    /**
     * 특정 사용자가 작성한 모든 댓글 조회 (soft-deleted 포함, 익명화/sweep 용도).
     *
     * <p>USER_LIFECYCLE_TERMINATION_POLICY v1.1 §0.1 Q12-b — 자발 탈퇴 시 본인 옵션
     * "본문도 삭제" 가 선택된 경우 {@code UserAnonymizationService} 가 본 메서드로
     * 사용자의 모든 댓글을 수집하여 본문 익명화 + soft delete 한다.</p>
     *
     * @param authorUserId 작성자 users.id
     * @return 본인 작성 댓글 목록 (이미 isDeleted=true 인 행도 포함)
     */
    List<CommunityComment> findByAuthor_Id(Long authorUserId);
}
