package com.coresolution.consultation.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.CommunityComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * 커뮤니티 댓글 저장소.
 *
 * @author MindGarden
 * @since 2026-05-15
 */
public interface CommunityCommentRepository extends JpaRepository<CommunityComment, Long> {

    List<CommunityComment> findByTenantIdAndPost_IdInAndIsDeletedFalseOrderByCreatedAtAsc(
            String tenantId, Collection<Long> postIds);

    /**
     * Apple T2 (1.2 UGC) — 차단·숨김 필터 적용 댓글 조회.
     *
     * <p>{@code applyBlock=false} 면 차단 우회. 숨김 댓글({@code hiddenAt IS NOT NULL}) 은
     * 사용자 화면에서 비노출.</p>
     *
     * @param tenantId       테넌트 ID
     * @param postIds        대상 게시글 id 목록
     * @param blockedUserIds 차단 사용자 ID 목록(비어 있으면 우회)
     * @param applyBlock     true 면 차단 필터 적용
     * @return 댓글 목록(created_at ASC)
     */
    @Query("""
        SELECT c FROM CommunityComment c
        JOIN FETCH c.author
        WHERE c.tenantId = :tenantId AND c.isDeleted = false
        AND c.post.id IN :postIds
        AND c.hiddenAt IS NULL
        AND (:applyBlock = false OR c.author.id NOT IN :blockedUserIds)
        ORDER BY c.createdAt ASC
        """)
    List<CommunityComment> findVisibleByPostIds(
            @Param("tenantId") String tenantId,
            @Param("postIds") Collection<Long> postIds,
            @Param("blockedUserIds") List<Long> blockedUserIds,
            @Param("applyBlock") boolean applyBlock);

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
